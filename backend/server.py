from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt
import jwt
from openai import OpenAI
import json
import asyncio
import aiofiles
import base64
import stripe
import cloudinary
import cloudinary.uploader
import cloudinary.api

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client for AI features
openai_client = OpenAI(api_key=os.environ.get('EMERGENT_LLM_KEY', ''))

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_API_KEY', '')

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'ember-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PREMIUM PACKAGES (Server-side defined) ====================

PREMIUM_PACKAGES = {
    'weekly': {'price': 9.99, 'days': 7, 'name': 'Weekly Premium'},
    'monthly': {'price': 29.99, 'days': 30, 'name': 'Monthly Premium'},
    'yearly': {'price': 149.99, 'days': 365, 'name': 'Yearly Premium'}
}

ADDON_PACKAGES = {
    'roses_3': {'price': 3.99, 'quantity': 3, 'type': 'roses'},
    'roses_12': {'price': 9.99, 'quantity': 12, 'type': 'roses'},
    'super_likes_5': {'price': 4.99, 'quantity': 5, 'type': 'super_likes'},
    'super_likes_15': {'price': 12.99, 'quantity': 15, 'type': 'super_likes'}
}

# ==================== TURN SERVER CONFIG ====================

TURN_SERVERS = [
    {'urls': 'stun:stun.l.google.com:19302'},
    {'urls': 'stun:stun1.l.google.com:19302'},
    {'urls': 'stun:stun2.l.google.com:19302'},
    # Free TURN servers (for demo - in production use paid TURN service)
    {
        'urls': 'turn:openrelay.metered.ca:80',
        'username': 'openrelayproject',
        'credential': 'openrelayproject'
    },
    {
        'urls': 'turn:openrelay.metered.ca:443',
        'username': 'openrelayproject',
        'credential': 'openrelayproject'
    },
    {
        'urls': 'turn:openrelay.metered.ca:443?transport=tcp',
        'username': 'openrelayproject',
        'credential': 'openrelayproject'
    }
]

# ==================== WEBSOCKET CONNECTION MANAGER ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.call_sessions: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")

    async def broadcast_to_match(self, message: dict, user_ids: List[str]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    interested_in: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photos: Optional[List[str]] = None
    video_url: Optional[str] = None
    prompts: Optional[List[Dict[str, str]]] = None
    interests: Optional[List[str]] = None

class LocationUpdate(BaseModel):
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LikeCreate(BaseModel):
    liked_user_id: str
    liked_section: Optional[str] = None
    comment: Optional[str] = None
    like_type: str = "regular"

class MessageCreate(BaseModel):
    match_id: str
    content: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

class NotificationSettings(BaseModel):
    new_matches: bool = True
    new_messages: bool = True
    new_likes: bool = True
    standouts: bool = True

# ==================== PHASE 1 MODELS ====================

class PhotoVerification(BaseModel):
    selfie_data: str  # base64 image

class PhoneSendCode(BaseModel):
    phone: str

class PhoneVerifyCode(BaseModel):
    phone: str
    code: str

class IDVerification(BaseModel):
    id_photo_data: str  # base64 image

class BlockUser(BaseModel):
    blocked_user_id: str

class ReportUser(BaseModel):
    reported_user_id: str
    reason: str
    details: Optional[str] = None

class MarkMessageRead(BaseModel):
    message_id: str

# ==================== PHASE 2 MODELS ====================

class FilterPreferences(BaseModel):
    age_min: Optional[int] = 18
    age_max: Optional[int] = 100
    max_distance: Optional[int] = 50
    height_min: Optional[int] = None
    height_max: Optional[int] = None
    education_levels: Optional[List[str]] = None
    specific_interests: Optional[List[str]] = None
    genders: Optional[List[str]] = None
    dating_purposes: Optional[List[str]] = None
    religions: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    children_preference: Optional[List[str]] = None
    political_views: Optional[List[str]] = None
    pets: Optional[List[str]] = None
    ethnicities: Optional[List[str]] = None
    sub_ethnicities: Optional[List[str]] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ==================== PHASE 1 HELPER FUNCTIONS ====================

async def reset_daily_limits_if_needed(user: dict) -> dict:
    """Reset swipe/super like/rose limits if 24 hours have passed"""
    now = datetime.now(timezone.utc)
    updated = False
    updates = {}
    
    # Reset swipe limit
    if 'swipe_limit' in user:
        last_reset = user['swipe_limit'].get('last_reset')
        if isinstance(last_reset, str):
            last_reset = datetime.fromisoformat(last_reset)
        if last_reset.tzinfo is None:
            last_reset = last_reset.replace(tzinfo=timezone.utc)
        
        if (now - last_reset).total_seconds() >= 86400:  # 24 hours
            updates['swipe_limit.count'] = 0
            updates['swipe_limit.last_reset'] = now.isoformat()
            updated = True
    
    # Reset super like limit
    if 'super_like_limit' in user:
        last_reset = user['super_like_limit'].get('last_reset')
        if isinstance(last_reset, str):
            last_reset = datetime.fromisoformat(last_reset)
        if last_reset.tzinfo is None:
            last_reset = last_reset.replace(tzinfo=timezone.utc)
        
        if (now - last_reset).total_seconds() >= 86400:
            updates['super_like_limit.count'] = 0
            updates['super_like_limit.last_reset'] = now.isoformat()
            updated = True
    
    # Reset rose limit
    if 'rose_limit' in user:
        last_reset = user['rose_limit'].get('last_reset')
        if isinstance(last_reset, str):
            last_reset = datetime.fromisoformat(last_reset)
        if last_reset.tzinfo is None:
            last_reset = last_reset.replace(tzinfo=timezone.utc)
        
        if (now - last_reset).total_seconds() >= 86400:
            updates['rose_limit.count'] = 0
            updates['rose_limit.last_reset'] = now.isoformat()
            updated = True
    
    if updated:
        await db.users.update_one({'user_id': user['user_id']}, {'$set': updates})
        user = await db.users.find_one({'user_id': user['user_id']}, {'_id': 0})
    
    return user

async def check_swipe_limit(user: dict) -> bool:
    """Check if user has swipes remaining (returns True if can swipe)"""
    # Premium users have unlimited swipes
    if user.get('is_premium'):
        return True
    
    # Reset limits if needed
    user = await reset_daily_limits_if_needed(user)
    
    swipe_limit = user.get('swipe_limit', {})
    count = swipe_limit.get('count', 0)
    daily_max = swipe_limit.get('daily_max', 10)
    
    return count < daily_max

async def increment_swipe_count(user_id: str):
    """Increment the swipe counter"""
    await db.users.update_one(
        {'user_id': user_id},
        {'$inc': {'swipe_limit.count': 1}}
    )

async def check_super_like_limit(user: dict) -> bool:
    """Check if user has super likes remaining"""
    user = await reset_daily_limits_if_needed(user)
    
    limit = user.get('super_like_limit', {})
    count = limit.get('count', 0)
    daily_max = limit.get('daily_max', 3)
    
    return count < daily_max

async def check_rose_limit(user: dict) -> bool:
    """Check if user has roses remaining"""
    user = await reset_daily_limits_if_needed(user)
    
    limit = user.get('rose_limit', {})
    count = limit.get('count', 0)
    daily_max = limit.get('daily_max', 1)
    
    return count < daily_max

def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

async def get_current_user(request: Request, credentials = Depends(security)) -> dict:
    session_token = request.cookies.get('session_token')
    if session_token:
        session = await db.user_sessions.find_one({'session_token': session_token}, {'_id': 0})
        if session:
            expires_at = session.get('expires_at')
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({'user_id': session['user_id']}, {'_id': 0})
                if user:
                    return user
    
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = await db.users.find_one({'user_id': payload['user_id']}, {'_id': 0})
            if user:
                return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail='Token expired')
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail='Invalid token')
    
    raise HTTPException(status_code=401, detail='Not authenticated')

async def get_user_from_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'user_id': payload['user_id']}, {'_id': 0})
        return user
    except:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        'user_id': user_id,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'name': user_data.name,
        'picture': None,
        'age': None,
        'gender': None,
        'interested_in': None,
        'location': None,
        'location_details': None,
        'bio': None,
        'height': None,
        'education': None,
        'photos': [],
        'video_url': None,
        'prompts': [],
        'interests': [],
        'is_profile_complete': False,
        'is_premium': False,
        'premium_expires': None,
        'roses': 1,
        'super_likes': 1,
        'notification_settings': {
            'new_matches': True,
            'new_messages': True,
            'new_likes': True,
            'standouts': True
        },
        # Verification fields
        'verification_status': 'unverified',
        'verification_methods': [],
        'photo_verification': {'status': 'pending', 'selfie_url': None, 'verified_at': None},
        'phone_verification': {'status': 'pending', 'phone': None, 'verified_at': None, 'code': None, 'expires_at': None},
        'id_verification': {'status': 'pending', 'id_photo_url': None, 'verified_at': None},
        # Swipe limits
        'swipe_limit': {'count': 0, 'last_reset': now, 'daily_max': 10},
        'super_like_limit': {'count': 0, 'last_reset': now, 'daily_max': 3},
        'rose_limit': {'count': 0, 'last_reset': now, 'daily_max': 1},
        'last_passed_user_id': None,
        'last_passed_at': None,
        # Phase 2: Filter preferences
        'filter_preferences': {
            'age_min': 18,
            'age_max': 100,
            'max_distance': 50,
            'height_min': None,
            'height_max': None,
            'education_levels': [],
            'specific_interests': []
        },
        'created_at': now,
        'last_active': now
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    return {'token': token, 'user': {k: v for k, v in user_doc.items() if k not in ['password', '_id']}}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if not user or not verify_password(user_data.password, user.get('password')):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['user_id'])
    await db.users.update_one({'user_id': user['user_id']}, {'$set': {'last_active': datetime.now(timezone.utc).isoformat()}})
    
    return {'token': token, 'user': {k: v for k, v in user.items() if k != 'password'}}

@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail='Session ID required')
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail='Invalid session')
        google_data = resp.json()
    
    user = await db.users.find_one({'email': google_data['email']}, {'_id': 0})
    now = datetime.now(timezone.utc)
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            'user_id': user_id,
            'email': google_data['email'],
            'name': google_data['name'],
            'picture': google_data.get('picture'),
            'password': None,
            'age': None,
            'gender': None,
            'interested_in': None,
            'location': None,
            'location_details': None,
            'bio': None,
            'height': None,
            'education': None,
            'photos': [],
            'video_url': None,
            'prompts': [],
            'interests': [],
            'is_profile_complete': False,
            'is_premium': False,
            'premium_expires': None,
            'roses': 1,
            'super_likes': 1,
            'notification_settings': {
                'new_matches': True,
                'new_messages': True,
                'new_likes': True,
                'standouts': True
            },
            # Verification fields
            'verification_status': 'unverified',
            'verification_methods': [],
            'photo_verification': {'status': 'pending', 'selfie_url': None, 'verified_at': None},
            'phone_verification': {'status': 'pending', 'phone': None, 'verified_at': None, 'code': None, 'expires_at': None},
            'id_verification': {'status': 'pending', 'id_photo_url': None, 'verified_at': None},
            # Swipe limits
            'swipe_limit': {'count': 0, 'last_reset': now.isoformat(), 'daily_max': 10},
            'super_like_limit': {'count': 0, 'last_reset': now.isoformat(), 'daily_max': 3},
            'rose_limit': {'count': 0, 'last_reset': now.isoformat(), 'daily_max': 1},
            'last_passed_user_id': None,
            'last_passed_at': None,
            # Phase 2: Filter preferences
            'filter_preferences': {
                'age_min': 18,
                'age_max': 100,
                'max_distance': 50,
                'height_min': None,
                'height_max': None,
                'education_levels': [],
                'specific_interests': []
            },
            'created_at': now.isoformat(),
            'last_active': now.isoformat()
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({'email': google_data['email']}, {'$set': {'last_active': now.isoformat()}})
        user = await db.users.find_one({'email': google_data['email']}, {'_id': 0})
    
    session_token = google_data['session_token']
    await db.user_sessions.insert_one({
        'user_id': user['user_id'],
        'session_token': session_token,
        'expires_at': (now + timedelta(days=7)).isoformat(),
        'created_at': now.isoformat()
    })
    
    response.set_cookie(
        key='session_token',
        value=session_token,
        httponly=True,
        secure=True,
        samesite='none',
        path='/',
        max_age=7*24*60*60
    )
    
    return {'user': {k: v for k, v in user.items() if k != 'password'}}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password'}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.user_sessions.delete_one({'session_token': session_token})
    response.delete_cookie('session_token', path='/')
    return {'message': 'Logged out'}

# ==================== VERIFICATION ROUTES ====================

@api_router.get("/verification/status")
async def get_verification_status(current_user: dict = Depends(get_current_user)):
    """Get current verification status"""
    return {
        'verification_status': current_user.get('verification_status', 'unverified'),
        'verification_methods': current_user.get('verification_methods', []),
        'photo_verification': current_user.get('photo_verification', {}),
        'phone_verification': {
            'status': current_user.get('phone_verification', {}).get('status', 'pending'),
            'phone': current_user.get('phone_verification', {}).get('phone'),
            'verified_at': current_user.get('phone_verification', {}).get('verified_at')
        },
        'id_verification': current_user.get('id_verification', {})
    }

@api_router.post("/verification/photo")
async def verify_photo(data: PhotoVerification, current_user: dict = Depends(get_current_user)):
    """Upload selfie for photo verification"""
    try:
        # Upload selfie to Cloudinary
        result = cloudinary.uploader.upload(
            data.selfie_data,
            folder=f"ember/verification/{current_user['user_id']}",
            public_id=f"selfie_{uuid.uuid4().hex[:8]}",
            transformation=[
                {'width': 500, 'height': 500, 'crop': 'fill'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'}
            ]
        )
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update user verification
        updates = {
            'photo_verification.status': 'verified',
            'photo_verification.selfie_url': result['secure_url'],
            'photo_verification.verified_at': now
        }
        
        # Add to verification methods if not already there
        user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
        methods = user.get('verification_methods', [])
        if 'photo' not in methods:
            methods.append('photo')
            updates['verification_methods'] = methods
        
        # Mark as verified if at least one method is complete
        if len(methods) >= 1:
            updates['verification_status'] = 'verified'
        
        await db.users.update_one({'user_id': current_user['user_id']}, {'$set': updates})
        
        return {'message': 'Photo verification successful', 'status': 'verified'}
    
    except Exception as e:
        logger.error(f"Photo verification error: {e}")
        raise HTTPException(status_code=500, detail='Photo upload failed')

@api_router.post("/verification/phone/send")
async def send_phone_code(data: PhoneSendCode, current_user: dict = Depends(get_current_user)):
    """Send SMS verification code"""
    # Generate 6-digit code
    code = generate_verification_code()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    
    # Store code in user document
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {
            'phone_verification.phone': data.phone,
            'phone_verification.code': code,
            'phone_verification.expires_at': expires_at
        }}
    )
    
    # TODO: In production, integrate Twilio to send actual SMS
    # For now, return the code for testing purposes
    logger.info(f"Verification code for {data.phone}: {code}")
    
    return {
        'message': 'Verification code sent',
        'phone': data.phone,
        # Remove this in production
        'debug_code': code if os.environ.get('ENV') != 'production' else None
    }

@api_router.post("/verification/phone/verify")
async def verify_phone_code(data: PhoneVerifyCode, current_user: dict = Depends(get_current_user)):
    """Verify SMS code"""
    user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    phone_data = user.get('phone_verification', {})
    
    stored_code = phone_data.get('code')
    stored_phone = phone_data.get('phone')
    expires_at = phone_data.get('expires_at')
    
    if not stored_code or not stored_phone:
        raise HTTPException(status_code=400, detail='No verification code sent')
    
    if stored_phone != data.phone:
        raise HTTPException(status_code=400, detail='Phone number mismatch')
    
    # Check expiration
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail='Verification code expired')
    
    if stored_code != data.code:
        raise HTTPException(status_code=400, detail='Invalid verification code')
    
    # Mark as verified
    now = datetime.now(timezone.utc).isoformat()
    updates = {
        'phone_verification.status': 'verified',
        'phone_verification.verified_at': now
    }
    
    # Add to verification methods
    methods = user.get('verification_methods', [])
    if 'phone' not in methods:
        methods.append('phone')
        updates['verification_methods'] = methods
    
    # Mark as verified if at least one method is complete
    if len(methods) >= 1:
        updates['verification_status'] = 'verified'
    
    await db.users.update_one({'user_id': current_user['user_id']}, {'$set': updates})
    
    return {'message': 'Phone verification successful', 'status': 'verified'}

@api_router.post("/verification/id")
async def verify_id(data: IDVerification, current_user: dict = Depends(get_current_user)):
    """Upload ID document for verification"""
    try:
        # Upload ID to Cloudinary
        result = cloudinary.uploader.upload(
            data.id_photo_data,
            folder=f"ember/verification/{current_user['user_id']}",
            public_id=f"id_{uuid.uuid4().hex[:8]}",
            transformation=[
                {'quality': 'auto'},
                {'fetch_format': 'auto'}
            ]
        )
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update user verification
        updates = {
            'id_verification.status': 'verified',
            'id_verification.id_photo_url': result['secure_url'],
            'id_verification.verified_at': now
        }
        
        # Add to verification methods
        user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
        methods = user.get('verification_methods', [])
        if 'id' not in methods:
            methods.append('id')
            updates['verification_methods'] = methods
        
        # Mark as verified if at least one method is complete
        if len(methods) >= 1:
            updates['verification_status'] = 'verified'
        
        await db.users.update_one({'user_id': current_user['user_id']}, {'$set': updates})
        
        return {'message': 'ID verification successful', 'status': 'verified'}
    
    except Exception as e:
        logger.error(f"ID verification error: {e}")
        raise HTTPException(status_code=500, detail='ID upload failed')

# ==================== SWIPE LIMITS ROUTES ====================

@api_router.get("/limits/swipes")
async def get_swipe_limits(current_user: dict = Depends(get_current_user)):
    """Get remaining swipes, super likes, and roses"""
    # Reset limits if needed
    user = await reset_daily_limits_if_needed(current_user)
    
    swipe_limit = user.get('swipe_limit', {})
    super_like_limit = user.get('super_like_limit', {})
    rose_limit = user.get('rose_limit', {})
    
    is_premium = user.get('is_premium', False)
    
    return {
        'swipes': {
            'used': swipe_limit.get('count', 0),
            'max': swipe_limit.get('daily_max', 10),
            'remaining': 'unlimited' if is_premium else max(0, swipe_limit.get('daily_max', 10) - swipe_limit.get('count', 0)),
            'unlimited': is_premium
        },
        'super_likes': {
            'used': super_like_limit.get('count', 0),
            'max': super_like_limit.get('daily_max', 3),
            'remaining': max(0, super_like_limit.get('daily_max', 3) - super_like_limit.get('count', 0))
        },
        'roses': {
            'used': rose_limit.get('count', 0),
            'max': rose_limit.get('daily_max', 1),
            'remaining': max(0, rose_limit.get('daily_max', 1) - rose_limit.get('count', 0))
        }
    }

@api_router.post("/discover/pass")
async def pass_profile(liked_user_id: str, current_user: dict = Depends(get_current_user)):
    """Pass on a profile (counts toward daily swipe limit)"""
    # Check verification
    if current_user.get('verification_status') != 'verified':
        raise HTTPException(status_code=403, detail='Profile verification required')
    
    # Check swipe limit
    if not await check_swipe_limit(current_user):
        raise HTTPException(status_code=429, detail='Daily swipe limit reached. Upgrade to premium for unlimited swipes!')
    
    # Increment swipe count
    await increment_swipe_count(current_user['user_id'])
    
    # Store last passed user for undo feature
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {
            'last_passed_user_id': liked_user_id,
            'last_passed_at': now
        }}
    )
    
    return {'message': 'Profile passed', 'swipes_remaining': await get_swipe_limits(current_user)}

# ==================== BLOCK/REPORT ROUTES ====================

@api_router.post("/users/block")
async def block_user(data: BlockUser, current_user: dict = Depends(get_current_user)):
    """Block a user"""
    # Check if already blocked
    existing = await db.blocks.find_one({
        'blocker_id': current_user['user_id'],
        'blocked_id': data.blocked_user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail='User already blocked')
    
    now = datetime.now(timezone.utc).isoformat()
    
    block_doc = {
        'block_id': f"block_{uuid.uuid4().hex[:12]}",
        'blocker_id': current_user['user_id'],
        'blocked_id': data.blocked_user_id,
        'created_at': now
    }
    
    await db.blocks.insert_one(block_doc)
    
    # Remove any existing matches
    await db.matches.delete_many({
        '$or': [
            {'user1_id': current_user['user_id'], 'user2_id': data.blocked_user_id},
            {'user1_id': data.blocked_user_id, 'user2_id': current_user['user_id']}
        ]
    })
    
    return {'message': 'User blocked successfully'}

@api_router.get("/users/blocked")
async def get_blocked_users(current_user: dict = Depends(get_current_user)):
    """Get list of blocked users"""
    blocks = await db.blocks.find({'blocker_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    
    # Fetch user details
    for block in blocks:
        user = await db.users.find_one({'user_id': block['blocked_id']}, {'_id': 0, 'password': 0})
        block['user'] = user
    
    return blocks

@api_router.post("/users/unblock")
async def unblock_user(data: BlockUser, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    result = await db.blocks.delete_one({
        'blocker_id': current_user['user_id'],
        'blocked_id': data.blocked_user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Block not found')
    
    return {'message': 'User unblocked successfully'}

@api_router.post("/users/report")
async def report_user(data: ReportUser, current_user: dict = Depends(get_current_user)):
    """Report a user for violations"""
    now = datetime.now(timezone.utc).isoformat()
    
    report_doc = {
        'report_id': f"report_{uuid.uuid4().hex[:12]}",
        'reporter_id': current_user['user_id'],
        'reported_id': data.reported_user_id,
        'reason': data.reason,
        'details': data.details,
        'status': 'pending',
        'created_at': now
    }
    
    await db.reports.insert_one(report_doc)
    
    return {'message': 'Report submitted successfully'}

# ==================== FILE UPLOAD ROUTES (CLOUDINARY) ====================

@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload photo to Cloudinary cloud storage"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='File must be an image')
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary with transformations
        result = cloudinary.uploader.upload(
            content,
            folder=f"ember/users/{current_user['user_id']}",
            public_id=f"photo_{uuid.uuid4().hex[:8]}",
            overwrite=True,
            transformation=[
                {'width': 1080, 'height': 1350, 'crop': 'limit'},  # Max size
                {'quality': 'auto:good'},  # Auto quality optimization
                {'fetch_format': 'auto'}  # Auto format (webp when supported)
            ]
        )
        
        # Return the secure URL
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result.get('width'),
            'height': result.get('height')
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail=f'Upload failed: {str(e)}')

@api_router.post("/upload/photo/base64")
async def upload_photo_base64(request: Request, current_user: dict = Depends(get_current_user)):
    """Upload base64 encoded photo to Cloudinary"""
    body = await request.json()
    data = body.get('data')
    
    if not data:
        raise HTTPException(status_code=400, detail='No image data provided')
    
    try:
        # Upload base64 directly to Cloudinary
        result = cloudinary.uploader.upload(
            data,  # Cloudinary accepts base64 with data URI prefix
            folder=f"ember/users/{current_user['user_id']}",
            public_id=f"photo_{uuid.uuid4().hex[:8]}",
            overwrite=True,
            transformation=[
                {'width': 1080, 'height': 1350, 'crop': 'limit'},
                {'quality': 'auto:good'},
                {'fetch_format': 'auto'}
            ]
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result.get('width'),
            'height': result.get('height')
        }
    except Exception as e:
        logger.error(f"Cloudinary base64 upload error: {e}")
        raise HTTPException(status_code=500, detail=f'Upload failed: {str(e)}')

@api_router.delete("/upload/photo/{public_id:path}")
async def delete_photo(public_id: str, current_user: dict = Depends(get_current_user)):
    """Delete photo from Cloudinary"""
    # Verify the photo belongs to the user
    if not public_id.startswith(f"ember/users/{current_user['user_id']}"):
        raise HTTPException(status_code=403, detail='Not authorized to delete this photo')
    
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {'result': result.get('result', 'ok')}
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        raise HTTPException(status_code=500, detail=f'Delete failed: {str(e)}')

@api_router.get("/cloudinary/config")
async def get_cloudinary_config():
    """Get Cloudinary config for frontend unsigned uploads"""
    return {
        'cloud_name': os.environ.get('CLOUDINARY_CLOUD_NAME'),
        'upload_preset': 'ember_unsigned'  # Create this preset in Cloudinary dashboard
    }

# ==================== PROFILE ROUTES ====================

@api_router.put("/profile")
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    merged = {**user, **update_data}
    is_complete = all([
        merged.get('age'),
        merged.get('gender'),
        merged.get('interested_in'),
        merged.get('photos') and len(merged['photos']) > 0,
        merged.get('prompts') and len(merged['prompts']) > 0
    ])
    update_data['is_profile_complete'] = is_complete
    update_data['last_active'] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({'user_id': current_user['user_id']}, {'$set': update_data})
    updated = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    return {k: v for k, v in updated.items() if k != 'password'}

@api_router.get("/profile/{user_id}")
async def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user

@api_router.put("/profile/notifications")
async def update_notifications(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'notification_settings': settings.model_dump()}}
    )
    return {'message': 'Notification settings updated'}

# ==================== LOCATION ROUTES ====================

@api_router.put("/profile/location")
async def update_location(location: LocationUpdate, current_user: dict = Depends(get_current_user)):
    """Update user's location - can change city, state, country anytime"""
    location_string = f"{location.city}"
    if location.state:
        location_string += f", {location.state}"
    location_string += f", {location.country}"
    
    location_details = {
        'city': location.city,
        'state': location.state,
        'country': location.country,
        'latitude': location.latitude,
        'longitude': location.longitude,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {
            'location': location_string,
            'location_details': location_details,
            'last_active': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    return {k: v for k, v in updated.items() if k != 'password'}

@api_router.get("/locations/popular")
async def get_popular_locations():
    """Get list of popular cities for quick selection"""
    return {
        'locations': [
            {'city': 'New York', 'state': 'NY', 'country': 'United States'},
            {'city': 'Los Angeles', 'state': 'CA', 'country': 'United States'},
            {'city': 'Chicago', 'state': 'IL', 'country': 'United States'},
            {'city': 'Miami', 'state': 'FL', 'country': 'United States'},
            {'city': 'San Francisco', 'state': 'CA', 'country': 'United States'},
            {'city': 'Austin', 'state': 'TX', 'country': 'United States'},
            {'city': 'Seattle', 'state': 'WA', 'country': 'United States'},
            {'city': 'Boston', 'state': 'MA', 'country': 'United States'},
            {'city': 'London', 'state': None, 'country': 'United Kingdom'},
            {'city': 'Paris', 'state': None, 'country': 'France'},
            {'city': 'Toronto', 'state': 'ON', 'country': 'Canada'},
            {'city': 'Sydney', 'state': 'NSW', 'country': 'Australia'},
            {'city': 'Tokyo', 'state': None, 'country': 'Japan'},
            {'city': 'Berlin', 'state': None, 'country': 'Germany'},
            {'city': 'Amsterdam', 'state': None, 'country': 'Netherlands'},
            {'city': 'Barcelona', 'state': None, 'country': 'Spain'},
            {'city': 'Dubai', 'state': None, 'country': 'UAE'},
            {'city': 'Singapore', 'state': None, 'country': 'Singapore'},
            {'city': 'Mumbai', 'state': 'MH', 'country': 'India'},
            {'city': 'São Paulo', 'state': 'SP', 'country': 'Brazil'}
        ]
    }

# ==================== DISCOVER ROUTES ====================

@api_router.get("/discover")
async def discover_profiles(current_user: dict = Depends(get_current_user)):
    # Check verification status
    if current_user.get('verification_status') != 'verified':
        raise HTTPException(status_code=403, detail='Profile verification required to use Ember')
    
    # Get blocked users
    blocks = await db.blocks.find({'blocker_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    blocked_ids = [b['blocked_id'] for b in blocks]
    
    # Get users who blocked me
    blocked_by = await db.blocks.find({'blocked_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    blocked_by_ids = [b['blocker_id'] for b in blocked_by]
    
    liked_ids = await db.likes.find({'liker_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    liked_user_ids = [l['liked_user_id'] for l in liked_ids]
    
    matches = await db.matches.find(
        {'$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]},
        {'_id': 0}
    ).to_list(1000)
    matched_ids = [m['user1_id'] if m['user2_id'] == current_user['user_id'] else m['user2_id'] for m in matches]
    
    # Combine all IDs to skip
    skip_ids = list(set(liked_user_ids + matched_ids + blocked_ids + blocked_by_ids + [current_user['user_id']]))
    
    query = {
        'user_id': {'$nin': skip_ids},
        'is_profile_complete': True,
        'verification_status': 'verified'  # Only show verified users
    }
    
    # Apply basic gender filter
    if current_user.get('interested_in') and current_user['interested_in'] != 'everyone':
        query['gender'] = current_user['interested_in']
    
    # Apply advanced filters
    filters = current_user.get('filter_preferences', {})
    
    # Age filter
    if filters.get('age_min') or filters.get('age_max'):
        age_query = {}
        if filters.get('age_min'):
            age_query['$gte'] = filters['age_min']
        if filters.get('age_max'):
            age_query['$lte'] = filters['age_max']
        if age_query:
            query['age'] = age_query
    
    # Height filter
    if filters.get('height_min') or filters.get('height_max'):
        height_query = {}
        if filters.get('height_min'):
            height_query['$gte'] = filters['height_min']
        if filters.get('height_max'):
            height_query['$lte'] = filters['height_max']
        if height_query:
            query['height'] = height_query
    
    # Education filter
    if filters.get('education_levels') and len(filters['education_levels']) > 0:
        query['education'] = {'$in': filters['education_levels']}
    
    # Interest filter
    if filters.get('specific_interests') and len(filters['specific_interests']) > 0:
        query['interests'] = {'$in': filters['specific_interests']}
    
    profiles = await db.users.find(query, {'_id': 0, 'password': 0}).to_list(100)
    
    # Distance filter (if location details available)
    if filters.get('max_distance') and current_user.get('location_details'):
        user_coords = current_user['location_details']
        if user_coords.get('latitude') and user_coords.get('longitude'):
            filtered_profiles = []
            for profile in profiles:
                if profile.get('location_details'):
                    profile_coords = profile['location_details']
                    if profile_coords.get('latitude') and profile_coords.get('longitude'):
                        # Calculate distance using Haversine formula
                        from math import radians, sin, cos, sqrt, atan2
                        
                        lat1 = radians(user_coords['latitude'])
                        lon1 = radians(user_coords['longitude'])
                        lat2 = radians(profile_coords['latitude'])
                        lon2 = radians(profile_coords['longitude'])
                        
                        dlon = lon2 - lon1
                        dlat = lat2 - lat1
                        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                        c = 2 * atan2(sqrt(a), sqrt(1-a))
                        distance = 3959 * c  # Earth radius in miles
                        
                        if distance <= filters['max_distance']:
                            profile['distance'] = round(distance, 1)
                            filtered_profiles.append(profile)
            profiles = filtered_profiles
    
    return profiles

@api_router.get("/discover/most-compatible")
async def most_compatible(current_user: dict = Depends(get_current_user)):
    profiles = await discover_profiles(current_user)
    
    if not profiles or not current_user.get('interests'):
        return profiles[:10]
    
    try:
        user_interests = ', '.join(current_user.get('interests', []))
        profiles_summary = [{'name': p.get('name'), 'interests': p.get('interests', []), 'bio': p.get('bio', '')} for p in profiles[:20]]
        
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a dating app matchmaker. Return a JSON array of indices (0-based) of the 5 most compatible profiles, ordered by compatibility. Only return the array, nothing else.'},
                {'role': 'user', 'content': f"User interests: {user_interests}\n\nProfiles:\n{profiles_summary}"}
            ],
            max_tokens=100
        )
        
        indices = json.loads(completion.choices[0].message.content)
        compatible = [profiles[i] for i in indices if i < len(profiles)]
        return compatible if compatible else profiles[:5]
    except Exception as e:
        logger.error(f"AI compatibility error: {e}")
        return profiles[:5]

@api_router.get("/discover/standouts")
async def get_standouts(current_user: dict = Depends(get_current_user)):
    profiles = await discover_profiles(current_user)
    
    if not profiles:
        return []
    
    try:
        user_data = {
            'interests': current_user.get('interests', []),
            'bio': current_user.get('bio', ''),
            'prompts': current_user.get('prompts', [])
        }
        profiles_summary = [
            {
                'index': i,
                'name': p.get('name'),
                'interests': p.get('interests', []),
                'bio': p.get('bio', ''),
                'prompts': p.get('prompts', []),
                'photo_count': len(p.get('photos', []))
            }
            for i, p in enumerate(profiles[:30])
        ]
        
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a dating app matchmaker. Select the 5 best standout profiles based on profile completeness, interesting prompts, and compatibility. Return ONLY a JSON array of indices.'},
                {'role': 'user', 'content': f"User: {user_data}\n\nProfiles:\n{profiles_summary}"}
            ],
            max_tokens=100
        )
        
        indices = json.loads(completion.choices[0].message.content)
        standouts = [profiles[i] for i in indices if i < len(profiles)]
        
        for s in standouts:
            s['is_standout'] = True
        
        return standouts if standouts else profiles[:5]
    except Exception as e:
        logger.error(f"AI standouts error: {e}")
        sorted_profiles = sorted(profiles, key=lambda p: (len(p.get('photos', [])), len(p.get('prompts', []))), reverse=True)
        return sorted_profiles[:5]

# ==================== LIKES ROUTES ====================

@api_router.post("/likes")
async def create_like(like: LikeCreate, current_user: dict = Depends(get_current_user)):
    # Check verification
    if current_user.get('verification_status') != 'verified':
        raise HTTPException(status_code=403, detail='Profile verification required to use this feature')
    
    now = datetime.now(timezone.utc).isoformat()
    
    existing = await db.likes.find_one({
        'liker_id': current_user['user_id'],
        'liked_user_id': like.liked_user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail='Already liked this user')
    
    # Check swipe limit for regular likes
    if like.like_type == 'regular':
        if not await check_swipe_limit(current_user):
            raise HTTPException(status_code=429, detail='Daily swipe limit reached. Upgrade to premium for unlimited swipes!')
        # Increment swipe count
        await increment_swipe_count(current_user['user_id'])
    
    # Check super like limit
    elif like.like_type == 'super_like':
        if not await check_super_like_limit(current_user):
            raise HTTPException(status_code=429, detail='Daily super like limit reached')
        # Increment super like count
        await db.users.update_one(
            {'user_id': current_user['user_id']},
            {'$inc': {'super_like_limit.count': 1}}
        )
    
    # Check rose limit
    elif like.like_type == 'rose':
        if not await check_rose_limit(current_user):
            raise HTTPException(status_code=429, detail='Daily rose limit reached')
        # Increment rose count
        await db.users.update_one(
            {'user_id': current_user['user_id']},
            {'$inc': {'rose_limit.count': 1}}
        )
    
    like_doc = {
        'like_id': f"like_{uuid.uuid4().hex[:12]}",
        'liker_id': current_user['user_id'],
        'liked_user_id': like.liked_user_id,
        'liked_section': like.liked_section,
        'comment': like.comment,
        'like_type': like.like_type,
        'created_at': now
    }
    await db.likes.insert_one(like_doc)
    
    notification = {
        'type': 'new_like',
        'like_type': like.like_type,
        'from_user': {
            'user_id': current_user['user_id'],
            'name': current_user['name'],
            'photo': current_user.get('photos', [None])[0]
        },
        'comment': like.comment,
        'timestamp': now
    }
    await manager.send_personal_message(notification, like.liked_user_id)
    
    await db.notifications.insert_one({
        'notification_id': f"notif_{uuid.uuid4().hex[:12]}",
        'user_id': like.liked_user_id,
        'type': 'new_like',
        'data': notification,
        'read': False,
        'created_at': now
    })
    
    mutual = await db.likes.find_one({
        'liker_id': like.liked_user_id,
        'liked_user_id': current_user['user_id']
    })
    
    if mutual:
        match_doc = {
            'match_id': f"match_{uuid.uuid4().hex[:12]}",
            'user1_id': current_user['user_id'],
            'user2_id': like.liked_user_id,
            'created_at': now,
            'matched_at': now,
            'first_message_sent': False,
            'disconnect_warnings_sent': [],
            'last_message': None,
            'last_message_at': None
        }
        await db.matches.insert_one(match_doc)
        
        other_user = await db.users.find_one({'user_id': like.liked_user_id}, {'_id': 0, 'password': 0})
        
        match_notification_1 = {
            'type': 'new_match',
            'match_id': match_doc['match_id'],
            'matched_user': {
                'user_id': other_user['user_id'],
                'name': other_user['name'],
                'photo': other_user.get('photos', [None])[0]
            },
            'timestamp': now
        }
        match_notification_2 = {
            'type': 'new_match',
            'match_id': match_doc['match_id'],
            'matched_user': {
                'user_id': current_user['user_id'],
                'name': current_user['name'],
                'photo': current_user.get('photos', [None])[0]
            },
            'timestamp': now
        }
        
        await manager.send_personal_message(match_notification_1, current_user['user_id'])
        await manager.send_personal_message(match_notification_2, like.liked_user_id)
        
        return {'like': like_doc, 'match': match_doc}
    
    return {'like': like_doc, 'match': None}

@api_router.get("/likes/received")
async def get_received_likes(current_user: dict = Depends(get_current_user)):
    """Get received likes - full details for premium users only"""
    likes = await db.likes.find({'liked_user_id': current_user['user_id']}, {'_id': 0}).to_list(100)
    
    # Premium users can see who liked them
    if current_user.get('is_premium'):
        for like in likes:
            liker = await db.users.find_one({'user_id': like['liker_id']}, {'_id': 0, 'password': 0})
            like['liker'] = liker
        return {'likes': likes, 'premium': True, 'count': len(likes)}
    else:
        # Free users only see count and blurred info
        return {
            'likes': [],
            'premium': False,
            'count': len(likes),
            'message': 'Upgrade to premium to see who liked you'
        }

@api_router.get("/likes/roses-received")
async def get_roses_received(current_user: dict = Depends(get_current_user)):
    """Get roses sent to you - premium only"""
    if not current_user.get('is_premium'):
        roses = await db.likes.find({
            'liked_user_id': current_user['user_id'],
            'like_type': 'rose'
        }, {'_id': 0}).to_list(100)
        
        return {
            'roses': [],
            'premium': False,
            'count': len(roses),
            'message': 'Upgrade to premium to see who sent you roses'
        }
    
    roses = await db.likes.find({
        'liked_user_id': current_user['user_id'],
        'like_type': 'rose'
    }, {'_id': 0}).to_list(100)
    
    for rose in roses:
        sender = await db.users.find_one({'user_id': rose['liker_id']}, {'_id': 0, 'password': 0})
        rose['sender'] = sender
    
    return {'roses': roses, 'premium': True, 'count': len(roses)}

@api_router.delete("/likes/{like_id}")
async def reject_like(like_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.likes.delete_one({'like_id': like_id, 'liked_user_id': current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Like not found')
    return {'message': 'Like rejected'}

# ==================== MATCHES ROUTES ====================

@api_router.get("/matches")
async def get_matches(current_user: dict = Depends(get_current_user)):
    matches = await db.matches.find(
        {'$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]},
        {'_id': 0}
    ).sort('last_message_at', -1).to_list(100)
    
    for match in matches:
        other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
        other = await db.users.find_one({'user_id': other_id}, {'_id': 0, 'password': 0})
        match['other_user'] = other
    
    return matches

@api_router.delete("/matches/{match_id}")
async def unmatch(match_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.matches.delete_one({
        'match_id': match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Match not found')
    
    await db.messages.delete_many({'match_id': match_id})
    return {'message': 'Unmatched'}

# ==================== MESSAGES ROUTES ====================

@api_router.get("/messages/{match_id}")
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    match = await db.matches.find_one({
        'match_id': match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    messages = await db.messages.find({'match_id': match_id}, {'_id': 0}).sort('created_at', 1).to_list(500)
    
    await db.messages.update_many(
        {'match_id': match_id, 'sender_id': {'$ne': current_user['user_id']}, 'read': False},
        {'$set': {'read': True}}
    )
    
    return messages

@api_router.post("/messages")
async def send_message(msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    match = await db.matches.find_one({
        'match_id': msg.match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    now = datetime.now(timezone.utc).isoformat()
    message_doc = {
        'message_id': f"msg_{uuid.uuid4().hex[:12]}",
        'match_id': msg.match_id,
        'sender_id': current_user['user_id'],
        'content': msg.content,
        'created_at': now,
        'delivered_at': now,
        'read_at': None,
        'read': False
    }
    await db.messages.insert_one(message_doc)
    
    # Mark that first message was sent (for auto-disconnect feature)
    if not match.get('first_message_sent'):
        await db.matches.update_one(
            {'match_id': msg.match_id},
            {'$set': {'first_message_sent': True}}
        )
    
    await db.matches.update_one(
        {'match_id': msg.match_id},
        {'$set': {'last_message': msg.content, 'last_message_at': now}}
    )
    
    other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
    ws_message = {
        'type': 'new_message',
        'message': message_doc,
        'sender': {
            'user_id': current_user['user_id'],
            'name': current_user['name'],
            'photo': current_user.get('photos', [None])[0]
        }
    }
    await manager.send_personal_message(ws_message, other_id)
    
    return message_doc

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a message as read"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.messages.update_one(
        {'message_id': message_id, 'sender_id': {'$ne': current_user['user_id']}},
        {'$set': {'read': True, 'read_at': now}}
    )
    
    if result.modified_count == 0:
        return {'message': 'Message already read or not found'}
    
    # Send read receipt via WebSocket
    message = await db.messages.find_one({'message_id': message_id}, {'_id': 0})
    if message:
        ws_message = {
            'type': 'message_read',
            'message_id': message_id,
            'read_at': now
        }
        await manager.send_personal_message(ws_message, message['sender_id'])
    
    return {'message': 'Message marked as read', 'read_at': now}

# ==================== AI ROUTES ====================

@api_router.post("/ai/conversation-starters")
async def get_conversation_starters(current_user: dict = Depends(get_current_user)):
    try:
        prompt = "Generate 3 creative, fun, and engaging conversation starters for a dating app."
        
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a helpful dating coach. Generate conversation starters that are fun, respectful, and likely to get a response. Return only a JSON array of 3 strings.'},
                {'role': 'user', 'content': prompt}
            ],
            max_tokens=200
        )
        
        starters = json.loads(completion.choices[0].message.content)
        return {'starters': starters}
    except Exception as e:
        logger.error(f"AI conversation starter error: {e}")
        return {'starters': [
            "If you could travel anywhere tomorrow, where would you go?",
            "What's something you're really passionate about that most people don't know?",
            "What's the best meal you've ever had?"
        ]}

@api_router.post("/ai/conversation-starters/{other_user_id}")
async def get_personalized_starters(other_user_id: str, current_user: dict = Depends(get_current_user)):
    other_profile = await db.users.find_one({'user_id': other_user_id}, {'_id': 0, 'password': 0})
    if not other_profile:
        raise HTTPException(status_code=404, detail='User not found')
    
    try:
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a helpful dating coach. Generate personalized conversation starters based on the profile. Return only a JSON array of 3 strings.'},
                {'role': 'user', 'content': f"Profile: Name: {other_profile.get('name')}, Interests: {other_profile.get('interests', [])}, Bio: {other_profile.get('bio', '')}, Prompts: {other_profile.get('prompts', [])}"}
            ],
            max_tokens=200
        )
        
        starters = json.loads(completion.choices[0].message.content)
        return {'starters': starters}
    except Exception as e:
        logger.error(f"AI personalized starter error: {e}")
        return {'starters': [
            f"Hey {other_profile.get('name', 'there')}! What made you smile today?",
            "I noticed we have some things in common! What do you enjoy most about your interests?",
            "What's the story behind your profile? I'd love to know more!"
        ]}

# ==================== STRIPE PAYMENT ROUTES ====================

@api_router.get("/premium/plans")
async def get_premium_plans():
    return {
        'plans': [
            {
                'id': 'weekly',
                'name': 'Weekly',
                'price': 9.99,
                'duration': '1 week',
                'features': ['Unlimited likes', '5 Super Likes/day', '3 Roses/week', 'See who likes you', 'Standouts access']
            },
            {
                'id': 'monthly',
                'name': 'Monthly',
                'price': 29.99,
                'duration': '1 month',
                'features': ['Unlimited likes', '5 Super Likes/day', '5 Roses/week', 'See who likes you', 'Standouts access', 'Priority likes']
            },
            {
                'id': 'yearly',
                'name': 'Yearly',
                'price': 149.99,
                'duration': '1 year',
                'features': ['Unlimited likes', 'Unlimited Super Likes', '10 Roses/week', 'See who likes you', 'Standouts access', 'Priority likes', 'Profile boost']
            }
        ],
        'addons': [
            {'id': 'roses_3', 'name': '3 Roses', 'price': 3.99, 'quantity': 3},
            {'id': 'roses_12', 'name': '12 Roses', 'price': 9.99, 'quantity': 12},
            {'id': 'super_likes_5', 'name': '5 Super Likes', 'price': 4.99, 'quantity': 5},
            {'id': 'super_likes_15', 'name': '15 Super Likes', 'price': 12.99, 'quantity': 15}
        ]
    }

@api_router.post("/payments/checkout")
async def create_checkout_session(checkout: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout session - amount defined server-side only"""
    package_id = checkout.package_id
    origin_url = checkout.origin_url
    
    # Get package from server-defined packages
    package = PREMIUM_PACKAGES.get(package_id) or ADDON_PACKAGES.get(package_id)
    if not package:
        raise HTTPException(status_code=400, detail='Invalid package')
    
    price = package['price']
    now = datetime.now(timezone.utc).isoformat()
    
    # Build URLs dynamically from frontend origin
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/premium"
    
    try:
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': package.get('name', package_id),
                    },
                    'unit_amount': int(price * 100),  # Stripe uses cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'user_id': current_user['user_id'],
                'package_id': package_id,
                'package_type': 'premium' if package_id in PREMIUM_PACKAGES else 'addon'
            }
        )
        
        # Create pending transaction record
        await db.payment_transactions.insert_one({
            'transaction_id': f"txn_{uuid.uuid4().hex[:12]}",
            'session_id': session.id,
            'user_id': current_user['user_id'],
            'package_id': package_id,
            'amount': price,
            'currency': 'usd',
            'status': 'pending',
            'payment_status': 'initiated',
            'created_at': now
        })
        
        return {'url': session.url, 'session_id': session.id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    """Check payment status and update user if paid"""
    # Find transaction
    transaction = await db.payment_transactions.find_one({
        'session_id': session_id,
        'user_id': current_user['user_id']
    }, {'_id': 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail='Transaction not found')
    
    # If already processed, return current status
    if transaction.get('payment_status') == 'paid':
        return {'status': 'complete', 'payment_status': 'paid'}
    
    try:
        # Get status from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        payment_status = session.payment_status
        status = session.status
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': {
                'status': status,
                'payment_status': payment_status,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If paid, apply benefits (only once)
        if payment_status == 'paid' and transaction.get('payment_status') != 'paid':
            package_id = transaction.get('package_id')
            
            if package_id in PREMIUM_PACKAGES:
                # Premium subscription
                package = PREMIUM_PACKAGES[package_id]
                expires = datetime.now(timezone.utc) + timedelta(days=package['days'])
                await db.users.update_one(
                    {'user_id': current_user['user_id']},
                    {'$set': {
                        'is_premium': True,
                        'premium_expires': expires.isoformat(),
                        'premium_plan': package_id
                    }}
                )
            elif package_id in ADDON_PACKAGES:
                # Addon purchase
                package = ADDON_PACKAGES[package_id]
                field = package['type']  # 'roses' or 'super_likes'
                await db.users.update_one(
                    {'user_id': current_user['user_id']},
                    {'$inc': {field: package['quantity']}}
                )
        
        return {
            'status': status,
            'payment_status': payment_status,
            'amount_total': session.amount_total,
            'currency': session.currency
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error checking status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.environ.get('STRIPE_WEBHOOK_SECRET', '')
        )
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError:
        # For testing without webhook secret, just parse the event
        event = json.loads(payload)
    
    # Handle the event
    if event.get('type') == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session['id']
        
        # Update transaction
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': {
                'status': 'complete',
                'payment_status': 'paid',
                'updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get transaction to apply benefits
        transaction = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
        if transaction:
            user_id = transaction.get('user_id')
            package_id = transaction.get('package_id')
            
            if package_id in PREMIUM_PACKAGES:
                package = PREMIUM_PACKAGES[package_id]
                expires = datetime.now(timezone.utc) + timedelta(days=package['days'])
                await db.users.update_one(
                    {'user_id': user_id},
                    {'$set': {
                        'is_premium': True,
                        'premium_expires': expires.isoformat(),
                        'premium_plan': package_id
                    }}
                )
            elif package_id in ADDON_PACKAGES:
                package = ADDON_PACKAGES[package_id]
                field = package['type']
                await db.users.update_one(
                    {'user_id': user_id},
                    {'$inc': {field: package['quantity']}}
                )
    
    return {'received': True}

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {'user_id': current_user['user_id']},
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    return notifications

@api_router.put("/notifications/read")
async def mark_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {'user_id': current_user['user_id'], 'read': False},
        {'$set': {'read': True}}
    )
    return {'message': 'Notifications marked as read'}

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({
        'user_id': current_user['user_id'],
        'read': False
    })
    return {'count': count}

# ==================== PROMPTS LIBRARY ====================

@api_router.get("/prompts/library")
async def get_prompts_library():
    return {
        'prompts': [
            "A perfect Sunday looks like...",
            "I'm looking for someone who...",
            "The way to win me over is...",
            "My most irrational fear is...",
            "I geek out on...",
            "Two truths and a lie...",
            "Unusual skills I have...",
            "My simple pleasures are...",
            "I'll pick the restaurant if you...",
            "Together we could...",
            "I'm convinced that...",
            "Dating me is like...",
            "My love language is...",
            "I want someone who...",
            "The one thing I'd love to know about you is..."
        ]
    }

# ==================== WEBRTC CALLING WITH TURN SERVERS ====================

@api_router.get("/calls/ice-servers")
async def get_ice_servers(current_user: dict = Depends(get_current_user)):
    """Get ICE servers including TURN for reliable connections"""
    return {'iceServers': TURN_SERVERS}

@api_router.post("/calls/initiate")
async def initiate_call(request: Request, current_user: dict = Depends(get_current_user)):
    body = await request.json()
    match_id = body.get('match_id')
    call_type = body.get('type', 'video')
    
    match = await db.matches.find_one({
        'match_id': match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
    
    call_id = f"call_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    call_doc = {
        'call_id': call_id,
        'match_id': match_id,
        'caller_id': current_user['user_id'],
        'callee_id': other_id,
        'type': call_type,
        'status': 'ringing',
        'created_at': now
    }
    await db.calls.insert_one(call_doc)
    
    call_notification = {
        'type': 'incoming_call',
        'call_id': call_id,
        'call_type': call_type,
        'caller': {
            'user_id': current_user['user_id'],
            'name': current_user['name'],
            'photo': current_user.get('photos', [None])[0]
        },
        'match_id': match_id,
        'ice_servers': TURN_SERVERS  # Include TURN servers in notification
    }
    await manager.send_personal_message(call_notification, other_id)
    
    return {'call_id': call_id, 'status': 'ringing', 'ice_servers': TURN_SERVERS}

@api_router.post("/calls/{call_id}/answer")
async def answer_call(call_id: str, current_user: dict = Depends(get_current_user)):
    call = await db.calls.find_one({'call_id': call_id, 'callee_id': current_user['user_id']})
    if not call:
        raise HTTPException(status_code=404, detail='Call not found')
    
    await db.calls.update_one({'call_id': call_id}, {'$set': {'status': 'connected'}})
    
    await manager.send_personal_message({
        'type': 'call_answered',
        'call_id': call_id,
        'ice_servers': TURN_SERVERS
    }, call['caller_id'])
    
    return {'status': 'connected', 'ice_servers': TURN_SERVERS}

@api_router.post("/calls/{call_id}/reject")
async def reject_call(call_id: str, current_user: dict = Depends(get_current_user)):
    call = await db.calls.find_one({'call_id': call_id, 'callee_id': current_user['user_id']})
    if not call:
        raise HTTPException(status_code=404, detail='Call not found')
    
    await db.calls.update_one({'call_id': call_id}, {'$set': {'status': 'rejected'}})
    
    await manager.send_personal_message({
        'type': 'call_rejected',
        'call_id': call_id
    }, call['caller_id'])
    
    return {'status': 'rejected'}

@api_router.post("/calls/{call_id}/end")
async def end_call(call_id: str, current_user: dict = Depends(get_current_user)):
    call = await db.calls.find_one({
        'call_id': call_id,
        '$or': [{'caller_id': current_user['user_id']}, {'callee_id': current_user['user_id']}]
    })
    if not call:
        raise HTTPException(status_code=404, detail='Call not found')
    
    await db.calls.update_one({'call_id': call_id}, {'$set': {'status': 'ended', 'ended_at': datetime.now(timezone.utc).isoformat()}})
    
    other_id = call['callee_id'] if call['caller_id'] == current_user['user_id'] else call['caller_id']
    await manager.send_personal_message({
        'type': 'call_ended',
        'call_id': call_id
    }, other_id)
    
    return {'status': 'ended'}

@api_router.post("/calls/{call_id}/signal")
async def send_signal(call_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    body = await request.json()
    signal_type = body.get('signal_type')
    signal_data = body.get('data')
    
    call = await db.calls.find_one({
        'call_id': call_id,
        '$or': [{'caller_id': current_user['user_id']}, {'callee_id': current_user['user_id']}]
    })
    if not call:
        raise HTTPException(status_code=404, detail='Call not found')
    
    other_id = call['callee_id'] if call['caller_id'] == current_user['user_id'] else call['caller_id']
    
    await manager.send_personal_message({
        'type': 'webrtc_signal',
        'call_id': call_id,
        'signal_type': signal_type,
        'data': signal_data
    }, other_id)
    
    return {'status': 'signal_sent'}

# ==================== AUTO-DISCONNECT MATCHES ====================

@api_router.post("/matches/check-expired")
async def check_expired_matches():
    """Background job to check and disconnect expired matches (no messages after 12h)"""
    now = datetime.now(timezone.utc)
    results = {
        'warnings_3h': 0,
        'warnings_6h': 0,
        'disconnected': 0
    }
    
    # Find all matches without first message
    matches = await db.matches.find({'first_message_sent': False}, {'_id': 0}).to_list(10000)
    
    for match in matches:
        matched_at = match.get('matched_at')
        if not matched_at:
            continue
        
        if isinstance(matched_at, str):
            matched_at = datetime.fromisoformat(matched_at)
        if matched_at.tzinfo is None:
            matched_at = matched_at.replace(tzinfo=timezone.utc)
        
        hours_since_match = (now - matched_at).total_seconds() / 3600
        warnings_sent = match.get('disconnect_warnings_sent', [])
        
        # 12 hours: Auto-disconnect
        if hours_since_match >= 12:
            # Move to disconnected collection
            await db.disconnected_matches.insert_one({
                'match_id': match['match_id'],
                'user1_id': match['user1_id'],
                'user2_id': match['user2_id'],
                'matched_at': match.get('matched_at'),
                'disconnected_at': now.isoformat(),
                'reason': 'no_message_12h'
            })
            
            # Delete the match
            await db.matches.delete_one({'match_id': match['match_id']})
            
            # Send disconnect notifications
            disconnect_message = {
                'type': 'match_expired',
                'match_id': match['match_id'],
                'message': 'This match has expired due to inactivity. You can find them again in Discover!'
            }
            
            await manager.send_personal_message(disconnect_message, match['user1_id'])
            await manager.send_personal_message(disconnect_message, match['user2_id'])
            
            results['disconnected'] += 1
        
        # 6 hour warning
        elif hours_since_match >= 6 and '6h' not in warnings_sent:
            user1 = await db.users.find_one({'user_id': match['user1_id']}, {'_id': 0, 'password': 0})
            user2 = await db.users.find_one({'user_id': match['user2_id']}, {'_id': 0, 'password': 0})
            
            warning_message_1 = {
                'type': 'match_expiring_soon',
                'match_id': match['match_id'],
                'hours_remaining': 6,
                'matched_user': {
                    'user_id': user2['user_id'],
                    'name': user2['name'],
                    'photo': user2.get('photos', [None])[0]
                },
                'message': f"Your match with {user2['name']} will expire in 6 hours if no one sends a message!"
            }
            
            warning_message_2 = {
                'type': 'match_expiring_soon',
                'match_id': match['match_id'],
                'hours_remaining': 6,
                'matched_user': {
                    'user_id': user1['user_id'],
                    'name': user1['name'],
                    'photo': user1.get('photos', [None])[0]
                },
                'message': f"Your match with {user1['name']} will expire in 6 hours if no one sends a message!"
            }
            
            await manager.send_personal_message(warning_message_1, match['user1_id'])
            await manager.send_personal_message(warning_message_2, match['user2_id'])
            
            # Update warnings sent
            warnings_sent.append('6h')
            await db.matches.update_one(
                {'match_id': match['match_id']},
                {'$set': {'disconnect_warnings_sent': warnings_sent}}
            )
            
            results['warnings_6h'] += 1
        
        # 3 hour warning
        elif hours_since_match >= 3 and '3h' not in warnings_sent:
            user1 = await db.users.find_one({'user_id': match['user1_id']}, {'_id': 0, 'password': 0})
            user2 = await db.users.find_one({'user_id': match['user2_id']}, {'_id': 0, 'password': 0})
            
            warning_message_1 = {
                'type': 'match_expiring_soon',
                'match_id': match['match_id'],
                'hours_remaining': 9,
                'matched_user': {
                    'user_id': user2['user_id'],
                    'name': user2['name'],
                    'photo': user2.get('photos', [None])[0]
                },
                'message': f"Your match with {user2['name']} will expire in 9 hours if no one sends a message!"
            }
            
            warning_message_2 = {
                'type': 'match_expiring_soon',
                'match_id': match['match_id'],
                'hours_remaining': 9,
                'matched_user': {
                    'user_id': user1['user_id'],
                    'name': user1['name'],
                    'photo': user1.get('photos', [None])[0]
                },
                'message': f"Your match with {user1['name']} will expire in 9 hours if no one sends a message!"
            }
            
            await manager.send_personal_message(warning_message_1, match['user1_id'])
            await manager.send_personal_message(warning_message_2, match['user2_id'])
            
            # Update warnings sent
            warnings_sent.append('3h')
            await db.matches.update_one(
                {'match_id': match['match_id']},
                {'$set': {'disconnect_warnings_sent': warnings_sent}}
            )
            
            results['warnings_3h'] += 1
    
    return results

# ==================== PHASE 2: ADVANCED FEATURES ====================

@api_router.put("/preferences/filters")
async def update_filter_preferences(filters: FilterPreferences, current_user: dict = Depends(get_current_user)):
    """Update user's filter preferences"""
    filter_dict = filters.dict(exclude_none=True)
    
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'filter_preferences': filter_dict}}
    )
    
    return {'message': 'Filter preferences updated', 'filters': filter_dict}

@api_router.get("/preferences/filters")
async def get_filter_preferences(current_user: dict = Depends(get_current_user)):
    """Get user's current filter preferences"""
    return current_user.get('filter_preferences', {
        'age_min': 18,
        'age_max': 100,
        'max_distance': 50,
        'height_min': None,
        'height_max': None,
        'education_levels': [],
        'specific_interests': []
    })

@api_router.post("/discover/undo")
async def undo_last_pass(current_user: dict = Depends(get_current_user)):
    """Undo the last passed profile"""
    last_passed_id = current_user.get('last_passed_user_id')
    last_passed_at = current_user.get('last_passed_at')
    
    if not last_passed_id or not last_passed_at:
        raise HTTPException(status_code=400, detail='No recent pass to undo')
    
    # Check if it was within the last hour
    if isinstance(last_passed_at, str):
        last_passed_at = datetime.fromisoformat(last_passed_at)
    if last_passed_at.tzinfo is None:
        last_passed_at = last_passed_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if (now - last_passed_at).total_seconds() > 3600:  # 1 hour
        raise HTTPException(status_code=400, detail='Can only undo passes from the last hour')
    
    # Get the profile
    profile = await db.users.find_one({'user_id': last_passed_id}, {'_id': 0, 'password': 0})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    
    # Clear the last passed
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'last_passed_user_id': None, 'last_passed_at': None}}
    )
    
    return {'message': 'Pass undone', 'profile': profile}

@api_router.get("/discover/daily-picks")
async def get_daily_picks(current_user: dict = Depends(get_current_user)):
    """Get 10 AI-curated daily picks"""
    # Check verification
    if current_user.get('verification_status') != 'verified':
        raise HTTPException(status_code=403, detail='Profile verification required')
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if we have picks for today
    existing_picks = await db.daily_picks.find_one({
        'user_id': current_user['user_id'],
        'date': today
    }, {'_id': 0})
    
    if existing_picks:
        # Return existing picks
        profiles = []
        for user_id in existing_picks['picked_user_ids']:
            profile = await db.users.find_one({'user_id': user_id}, {'_id': 0, 'password': 0})
            if profile:
                profiles.append(profile)
        return profiles
    
    # Generate new picks
    # Get all eligible profiles
    profiles = await discover_profiles(current_user)
    
    if len(profiles) <= 10:
        picked_profiles = profiles
    else:
        # Use AI to select best 10
        try:
            user_data = {
                'interests': current_user.get('interests', []),
                'bio': current_user.get('bio', ''),
                'age': current_user.get('age'),
                'location': current_user.get('location', '')
            }
            
            profiles_summary = [
                {
                    'index': i,
                    'name': p.get('name'),
                    'age': p.get('age'),
                    'interests': p.get('interests', []),
                    'bio': p.get('bio', ''),
                    'prompts': p.get('prompts', []),
                    'photo_count': len(p.get('photos', [])),
                    'location': p.get('location', '')
                }
                for i, p in enumerate(profiles[:50])
            ]
            
            completion = openai_client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': 'You are a dating app matchmaker. Select the 10 best daily picks based on compatibility, profile quality, and interesting bios. Return ONLY a JSON array of 10 indices (0-based).'},
                    {'role': 'user', 'content': f"User profile: {user_data}\n\nAvailable profiles:\n{profiles_summary}"}
                ],
                max_tokens=100
            )
            
            indices = json.loads(completion.choices[0].message.content)
            picked_profiles = [profiles[i] for i in indices if i < len(profiles)]
            
            if len(picked_profiles) < 10:
                # Fill with remaining profiles
                remaining = [p for p in profiles if p not in picked_profiles]
                picked_profiles.extend(remaining[:10 - len(picked_profiles)])
        
        except Exception as e:
            logger.error(f"AI daily picks error: {e}")
            # Fallback to random selection
            import random
            picked_profiles = random.sample(profiles, min(10, len(profiles)))
    
    # Store picks
    picked_user_ids = [p['user_id'] for p in picked_profiles]
    await db.daily_picks.insert_one({
        'user_id': current_user['user_id'],
        'date': today,
        'picked_user_ids': picked_user_ids,
        'generated_at': datetime.now(timezone.utc).isoformat()
    })
    
    return picked_profiles

# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001)
        return
    
    await manager.connect(websocket, user['user_id'])
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get('type') == 'ping':
                await websocket.send_json({'type': 'pong'})
            elif data.get('type') == 'typing':
                match_id = data.get('match_id')
                match = await db.matches.find_one({'match_id': match_id})
                if match:
                    other_id = match['user2_id'] if match['user1_id'] == user['user_id'] else match['user1_id']
                    await manager.send_personal_message({
                        'type': 'typing',
                        'match_id': match_id,
                        'user_id': user['user_id']
                    }, other_id)
    except WebSocketDisconnect:
        manager.disconnect(user['user_id'])
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(user['user_id'])

# ==================== STATIC FILES ====================

app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
