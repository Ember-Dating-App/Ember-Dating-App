from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect, UploadFile, File, Header
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
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
# import stripe  # REMOVED - No longer using Stripe
import cloudinary
import cloudinary.uploader
import cloudinary.api
import firebase_admin
from firebase_admin import credentials, messaging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Firebase Admin SDK initialization
try:
    cred = credentials.Certificate(str(ROOT_DIR / 'firebase-credentials.json'))
    firebase_admin.initialize_app(cred)
    logger = logging.getLogger(__name__)
    logger.info("Firebase Admin SDK initialized successfully")
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to initialize Firebase: {e}")

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
fs = AsyncIOMotorGridFSBucket(db)

# OpenAI client for AI features
openai_client = OpenAI(api_key=os.environ.get('EMERGENT_LLM_KEY', ''))

# Stripe configuration - REMOVED (no longer using Stripe)
# stripe.api_key = os.environ.get('STRIPE_API_KEY', '')

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
    'weekly': {'price': 4.99, 'days': 7, 'name': 'Weekly Premium'},
    'monthly': {'price': 19.99, 'days': 30, 'name': 'Monthly Premium'},
    'yearly': {'price': 149.99, 'days': 365, 'name': 'Yearly Premium'}
}

ADDON_PACKAGES = {
    'roses_3': {'price': 2.99, 'quantity': 3, 'type': 'roses'},
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
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    interested_in: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photos: Optional[List[str]] = None
    video_url: Optional[str] = None
    prompts: Optional[List[Dict[str, str]]] = None
    interests: Optional[List[str]] = None
    height: Optional[int] = None
    education: Optional[str] = None
    dating_purpose: Optional[str] = None
    religion: Optional[str] = None
    languages: Optional[List[str]] = None
    children: Optional[str] = None
    political_view: Optional[str] = None
    has_pets: Optional[str] = None
    ethnicity: Optional[str] = None
    sub_ethnicity: Optional[str] = None

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
    gif_url: Optional[str] = None
    message_type: str = 'text'  # 'text', 'gif', 'voice'
    original_language: Optional[str] = None  # Language of the original message

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
        'preferred_language': 'en',  # NEW: User's preferred language for translations
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
            'specific_interests': [],
            'genders': [],
            'dating_purposes': [],
            'religions': [],
            'languages': [],
            'children_preference': [],
            'political_views': [],
            'pets': [],
            'ethnicities': [],
            'sub_ethnicities': []
        },
        'dating_purpose': None,
        'religion': None,
        'languages': [],
        'children': None,
        'political_view': None,
        'has_pets': None,
        'ethnicity': None,
        'sub_ethnicity': None,
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
                'specific_interests': [],
                'genders': [],
                'dating_purposes': [],
                'religions': [],
                'languages': [],
                'children_preference': [],
                'political_views': [],
                'pets': [],
                'ethnicities': [],
                'sub_ethnicities': []
            },
            'dating_purpose': None,
            'religion': None,
            'languages': [],
            'children': None,
            'political_view': None,
            'has_pets': None,
            'ethnicity': None,
            'sub_ethnicity': None,
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

@api_router.post("/auth/apple/session")
async def apple_session(request: Request, response: Response):
    """Handle Apple Sign-In session creation"""
    body = await request.json()
    apple_data = body.get('apple_data')
    
    if not apple_data or not apple_data.get('email'):
        raise HTTPException(status_code=400, detail='Invalid Apple data')
    
    now = datetime.now(timezone.utc)
    user = await db.users.find_one({'email': apple_data['email']}, {'_id': 0})
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            'user_id': user_id,
            'email': apple_data['email'],
            'name': apple_data.get('name', 'Apple User'),
            'picture': None,
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
                'specific_interests': [],
                'genders': [],
                'dating_purposes': [],
                'religions': [],
                'languages': [],
                'children_preference': [],
                'political_views': [],
                'pets': [],
                'ethnicities': [],
                'sub_ethnicities': []
            },
            'dating_purpose': None,
            'religion': None,
            'languages': [],
            'children': None,
            'political_view': None,
            'has_pets': None,
            'ethnicity': None,
            'sub_ethnicity': None,
            'created_at': now.isoformat(),
            'last_active': now.isoformat()
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({'email': apple_data['email']}, {'$set': {'last_active': now.isoformat()}})
        user = await db.users.find_one({'email': apple_data['email']}, {'_id': 0})
    
    session_token = apple_data['session_token']
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


@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload video to Cloudinary cloud storage (max 30 seconds, 50MB)"""
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail='File must be a video')
    
    # Read file content
    content = await file.read()
    
    # Check file size (max 50MB)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail='Video size must be less than 50MB')
    
    try:
        # Upload to Cloudinary with video transformations
        result = cloudinary.uploader.upload(
            content,
            resource_type='video',
            folder=f"ember/users/{current_user['user_id']}/videos",
            public_id=f"video_{uuid.uuid4().hex[:8]}",
            overwrite=True,
            transformation=[
                {'width': 1080, 'height': 1920, 'crop': 'limit'},  # Max size for mobile
                {'quality': 'auto:good'},  # Auto quality optimization
                {'duration': '30'},  # Max 30 seconds
                {'fetch_format': 'auto'}  # Auto format
            ],
            eager=[
                {'format': 'jpg', 'transformation': [{'width': 300, 'crop': 'fill'}]}  # Generate thumbnail
            ]
        )
        
        # Get thumbnail URL
        thumbnail_url = result.get('eager', [{}])[0].get('secure_url') if result.get('eager') else None
        
        # Return the secure URL and metadata
        return {
            'url': result['secure_url'],
            'thumbnail_url': thumbnail_url,
            'public_id': result['public_id'],
            'duration': result.get('duration'),
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format')
        }
    except Exception as e:
        logger.error(f"Cloudinary video upload error: {e}")
        raise HTTPException(status_code=500, detail=f'Video upload failed: {str(e)}')

@api_router.post("/upload/video/base64")
async def upload_video_base64(request: Request, current_user: dict = Depends(get_current_user)):
    """Upload base64 encoded video to Cloudinary"""
    body = await request.json()
    data = body.get('data')
    
    if not data:
        raise HTTPException(status_code=400, detail='No video data provided')
    
    try:
        # Upload base64 video to Cloudinary
        result = cloudinary.uploader.upload(
            data,
            resource_type='video',
            folder=f"ember/users/{current_user['user_id']}/videos",
            public_id=f"video_{uuid.uuid4().hex[:8]}",
            overwrite=True,
            transformation=[
                {'width': 1080, 'height': 1920, 'crop': 'limit'},
                {'quality': 'auto:good'},
                {'duration': '30'},
                {'fetch_format': 'auto'}
            ],
            eager=[
                {'format': 'jpg', 'transformation': [{'width': 300, 'crop': 'fill'}]}
            ]
        )
        
        thumbnail_url = result.get('eager', [{}])[0].get('secure_url') if result.get('eager') else None
        
        return {
            'url': result['secure_url'],
            'thumbnail_url': thumbnail_url,
            'public_id': result['public_id'],
            'duration': result.get('duration'),
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format')
        }
    except Exception as e:
        logger.error(f"Cloudinary video base64 upload error: {e}")
        raise HTTPException(status_code=500, detail=f'Video upload failed: {str(e)}')


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

@api_router.delete("/account")
async def delete_account(request: Request, current_user: dict = Depends(get_current_user)):
    """Permanently delete user account and all associated data"""
    body = await request.json()
    password = body.get('password')
    
    if not password:
        raise HTTPException(status_code=400, detail='Password required to delete account')
    
    # Verify password
    user = await db.users.find_one({'user_id': current_user['user_id']})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail='Incorrect password')
    
    user_id = current_user['user_id']
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # Mark account as deleted (soft delete)
        await db.users.update_one(
            {'user_id': user_id},
            {'$set': {
                'deleted_at': now,
                'email': f'deleted_{user_id}@ember.deleted',  # Anonymize email
                'is_active': False
            }}
        )
        
        # Remove from all matches
        await db.matches.delete_many({
            '$or': [
                {'user1_id': user_id},
                {'user2_id': user_id}
            ]
        })
        
        # Remove all likes sent and received
        await db.likes.delete_many({
            '$or': [
                {'from_user_id': user_id},
                {'to_user_id': user_id}
            ]
        })
        
        # Anonymize messages (keep for other user but mark as deleted)
        await db.messages.update_many(
            {'sender_id': user_id},
            {'$set': {
                'sender_id': 'deleted_user',
                'is_deleted': True
            }}
        )
        
        # Remove from blocked users
        await db.blocks.delete_many({
            '$or': [
                {'blocker_id': user_id},
                {'blocked_id': user_id}
            ]
        })
        
        # Delete notifications
        await db.notifications.delete_many({'user_id': user_id})
        
        # Remove from disconnected matches
        await db.disconnected_matches.delete_many({
            '$or': [
                {'user1_id': user_id},
                {'user2_id': user_id}
            ]
        })
        
        logger.info(f"Account deleted for user {user_id}")
        
        return {
            'message': 'Account successfully deleted',
            'deleted_at': now
        }
        
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        raise HTTPException(status_code=500, detail='Failed to delete account')

@api_router.put("/profile/photos/reorder")
async def reorder_photos(request: Request, current_user: dict = Depends(get_current_user)):
    """Reorder user's photos"""
    body = await request.json()
    photos = body.get('photos', [])
    
    if not isinstance(photos, list):
        raise HTTPException(status_code=400, detail='Photos must be an array')
    
    if len(photos) > 6:
        raise HTTPException(status_code=400, detail='Maximum 6 photos allowed')
    
    # Get current user photos
    user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    current_photos = user.get('photos', [])
    
    # Verify all photos in the new order belong to the user
    if set(photos) != set(current_photos):
        raise HTTPException(status_code=400, detail='Invalid photos - all photos must belong to you')
    
    # Update photo order
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {
            'photos': photos,
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
    
    # Gender filter
    if filters.get('genders') and len(filters['genders']) > 0:
        query['gender'] = {'$in': filters['genders']}
    
    # Dating purpose filter
    if filters.get('dating_purposes') and len(filters['dating_purposes']) > 0:
        query['dating_purpose'] = {'$in': filters['dating_purposes']}
    
    # Religion filter
    if filters.get('religions') and len(filters['religions']) > 0:
        query['religion'] = {'$in': filters['religions']}
    
    # Language filter
    if filters.get('languages') and len(filters['languages']) > 0:
        query['languages'] = {'$in': filters['languages']}
    
    # Children preference filter
    if filters.get('children_preference') and len(filters['children_preference']) > 0:
        query['children'] = {'$in': filters['children_preference']}
    
    # Political view filter
    if filters.get('political_views') and len(filters['political_views']) > 0:
        query['political_view'] = {'$in': filters['political_views']}
    
    # Pets filter
    if filters.get('pets') and len(filters['pets']) > 0:
        query['has_pets'] = {'$in': filters['pets']}
    
    # Ethnicity filter (main categories)
    if filters.get('ethnicities') and len(filters['ethnicities']) > 0:
        query['ethnicity'] = {'$in': filters['ethnicities']}
    
    # Sub-ethnicity filter (more specific)
    if filters.get('sub_ethnicities') and len(filters['sub_ethnicities']) > 0:
        query['sub_ethnicity'] = {'$in': filters['sub_ethnicities']}
    
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
    
    # Prioritize ambassadors and new users - show them first
    # New users = created within last 48 hours
    now = datetime.now(timezone.utc)
    two_days_ago = now - timedelta(hours=48)
    
    new_ambassador_profiles = []
    new_user_profiles = []
    ambassador_profiles = []
    non_ambassador_profiles = []
    
    for p in profiles:
        created_at = p.get('created_at')
        is_ambassador = p.get('is_ambassador', False)
        
        # Parse created_at if it's a string
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except:
                created_at = now  # Default to now if parsing fails
        
        # Determine if user is new (< 48 hours old)
        is_new_user = created_at > two_days_ago if created_at else False
        
        # Categorize profiles by priority
        if is_new_user and is_ambassador:
            new_ambassador_profiles.append(p)
        elif is_new_user:
            new_user_profiles.append(p)
        elif is_ambassador:
            ambassador_profiles.append(p)
        else:
            non_ambassador_profiles.append(p)
    
    # Combine in priority order: New Ambassadors → New Users → Ambassadors → Regular
    profiles = new_ambassador_profiles + new_user_profiles + ambassador_profiles + non_ambassador_profiles
    
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
    
    # Send push notification based on like type
    if like.like_type == 'super_like':
        asyncio.create_task(send_push_notification(
            like.liked_user_id,
            "Someone Super Liked You! ⭐",
            f"{current_user['name']} sent you a Super Like!",
            {'type': 'super_likes', 'from_user_id': current_user['user_id']}
        ))
    elif like.like_type == 'rose':
        asyncio.create_task(send_push_notification(
            like.liked_user_id,
            "You Received a Rose! 🌹",
            f"{current_user['name']} sent you a rose!",
            {'type': 'roses', 'from_user_id': current_user['user_id']}
        ))
    else:
        # Regular like
        asyncio.create_task(send_push_notification(
            like.liked_user_id,
            "Someone Likes You! ❤️",
            f"{current_user['name']} liked your profile!",
            {'type': 'likes', 'from_user_id': current_user['user_id']}
        ))
    
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
        
        # Send push notifications
        asyncio.create_task(send_push_notification(
            current_user['user_id'],
            "It's a Match! 💕",
            f"You and {other_user['name']} liked each other!",
            {'type': 'new_matches', 'match_id': match_doc['match_id']}
        ))
        asyncio.create_task(send_push_notification(
            like.liked_user_id,
            "It's a Match! 💕",
            f"You and {current_user['name']} liked each other!",
            {'type': 'new_matches', 'match_id': match_doc['match_id']}
        ))
        
        return {'like': {k: v for k, v in like_doc.items() if k != '_id'}, 'match': {k: v for k, v in match_doc.items() if k != '_id'}}
    
    return {'like': {k: v for k, v in like_doc.items() if k != '_id'}, 'match': None}

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
    
    # Send premium push notification with message preview
    other_user = await db.users.find_one({'user_id': other_id}, {'_id': 0})
    if other_user:
        # Prepare notification content
        notification_title = f"💬 {current_user['name']}"
        
        # Show actual message content (truncate if too long)
        if msg.message_type == 'voice':
            notification_body = "🎤 Sent a voice message"
        elif msg.gif_url:
            notification_body = "📷 Sent a GIF"
        else:
            notification_body = msg.content[:150] + ('...' if len(msg.content) > 150 else '')
        
        asyncio.create_task(send_push_notification(
            other_id,
            notification_title,
            notification_body,
            {
                'type': 'new_message',
                'match_id': msg.match_id,
                'message_id': message_doc['message_id'],
                'sender_id': current_user['user_id'],
                'sender_name': current_user['name'],
                'sender_photo': current_user.get('photos', [None])[0],
                'tag': f"message_{msg.match_id}"  # Group notifications by conversation
            }
        ))
    
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


@api_router.put("/messages/{message_id}")
async def edit_message(message_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Edit a message (within 15 minutes of sending)"""
    body = await request.json()
    new_content = body.get('content', '').strip()
    
    if not new_content:
        raise HTTPException(status_code=400, detail='Message content cannot be empty')
    
    if len(new_content) > 1000:
        raise HTTPException(status_code=400, detail='Message too long (max 1000 characters)')
    
    # Get the message
    message = await db.messages.find_one({'message_id': message_id}, {'_id': 0})
    
    if not message:
        raise HTTPException(status_code=404, detail='Message not found')
    
    # Verify ownership
    if message['sender_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail='You can only edit your own messages')
    
    # Check if message was sent within last 15 minutes
    sent_at = datetime.fromisoformat(message['sent_at'])
    now = datetime.now(timezone.utc)
    time_diff = (now - sent_at).total_seconds() / 60  # minutes
    
    if time_diff > 15:
        raise HTTPException(status_code=400, detail='Can only edit messages within 15 minutes of sending')
    
    # Update message
    edited_at = now.isoformat()
    await db.messages.update_one(
        {'message_id': message_id},
        {'$set': {
            'content': new_content,
            'edited': True,
            'edited_at': edited_at
        }}
    )
    
    # Get updated message
    updated_message = await db.messages.find_one({'message_id': message_id}, {'_id': 0})
    
    # Send update via WebSocket to other user
    match = await db.matches.find_one({'match_id': message['match_id']}, {'_id': 0})
    if match:
        other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
        ws_message = {
            'type': 'message_edited',
            'message': updated_message
        }
        await manager.send_personal_message(ws_message, other_id)
    
    return updated_message

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a message (soft delete - marks as deleted)"""
    # Get the message
    message = await db.messages.find_one({'message_id': message_id}, {'_id': 0})
    
    if not message:
        raise HTTPException(status_code=404, detail='Message not found')
    
    # Verify ownership
    if message['sender_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail='You can only delete your own messages')
    
    # Soft delete - mark as deleted
    deleted_at = datetime.now(timezone.utc).isoformat()
    await db.messages.update_one(
        {'message_id': message_id},
        {'$set': {
            'is_deleted': True,
            'deleted_at': deleted_at,
            'content': 'Message deleted'
        }}
    )
    
    # Send update via WebSocket to other user
    match = await db.matches.find_one({'match_id': message['match_id']}, {'_id': 0})
    if match:
        other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
        ws_message = {
            'type': 'message_deleted',
            'message_id': message_id
        }
        await manager.send_personal_message(ws_message, other_id)
    
    return {'message': 'Message deleted successfully'}

# ==================== VOICE MESSAGE ROUTES ====================

@api_router.post("/messages/voice/upload")
async def upload_voice_message(
    match_id: str,
    duration: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a voice message to GridFS"""
    match = await db.matches.find_one({
        'match_id': match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to GridFS
        file_id = await fs.upload_from_stream(
            filename=f"voice_{uuid.uuid4().hex[:12]}.webm",
            source=content,
            metadata={
                'content_type': 'audio/webm',
                'user_id': current_user['user_id'],
                'match_id': match_id,
                'duration': duration,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
            }
        )
        
        # Create message document
        now = datetime.now(timezone.utc).isoformat()
        message_doc = {
            'message_id': f"msg_{uuid.uuid4().hex[:12]}",
            'match_id': match_id,
            'sender_id': current_user['user_id'],
            'content': f'🎤 Voice message ({duration}s)',
            'message_type': 'voice',
            'voice_file_id': str(file_id),
            'voice_duration': duration,
            'created_at': now,
            'delivered_at': now,
            'read_at': None,
            'read': False
        }
        await db.messages.insert_one(message_doc)
        
        # Update match
        await db.matches.update_one(
            {'match_id': match_id},
            {'$set': {'last_message': '🎤 Voice message', 'last_message_at': now}}
        )
        
        # Send WebSocket notification
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
        
        # Send premium push notification
        other_user = await db.users.find_one({'user_id': other_id}, {'_id': 0})
        if other_user:
            asyncio.create_task(send_push_notification(
                other_id,
                f"💬 {current_user['name']}",
                f"🎤 Sent a voice message ({duration}s)",
                {
                    'type': 'new_message',
                    'match_id': match_id,
                    'message_id': message_doc['message_id'],
                    'sender_id': current_user['user_id'],
                    'sender_name': current_user['name'],
                    'sender_photo': current_user.get('photos', [None])[0],
                    'tag': f"message_{match_id}"
                }
            ))
        
        return message_doc
        
    except Exception as e:
        logger.error(f"Voice upload error: {e}")
        raise HTTPException(status_code=500, detail='Failed to upload voice message')

@api_router.get("/messages/voice/{file_id}")
async def get_voice_message(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Stream voice message from GridFS"""
    try:
        from bson import ObjectId
        
        # Verify user has access to this voice message
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        metadata = grid_out.metadata
        
        # Check if user is part of the match
        match = await db.matches.find_one({
            'match_id': metadata['match_id'],
            '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
        })
        if not match:
            raise HTTPException(status_code=403, detail='Access denied')
        
        # Stream the audio file
        content = await grid_out.read()
        
        return Response(
            content=content,
            media_type='audio/webm',
            headers={
                'Content-Disposition': f'inline; filename="{grid_out.filename}"',
                'Accept-Ranges': 'bytes'
            }
        )
        
    except Exception as e:
        logger.error(f"Voice download error: {e}")
        raise HTTPException(status_code=404, detail='Voice message not found')

# Background task to clean up expired voice messages
async def cleanup_expired_voice_messages():
    """Delete voice messages older than 24 hours"""
    while True:
        try:
            # Sleep for 1 hour between cleanups
            await asyncio.sleep(3600)
            
            now = datetime.now(timezone.utc)
            
            # Find expired voice files in GridFS
            async for grid_file in fs.find({'metadata.expires_at': {'$exists': True}}):
                try:
                    expires_at = datetime.fromisoformat(grid_file.metadata['expires_at'])
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    
                    if expires_at < now:
                        # Delete from GridFS
                        await fs.delete(grid_file._id)
                        
                        # Mark message as expired
                        await db.messages.update_one(
                            {'voice_file_id': str(grid_file._id)},
                            {'$set': {'content': '🎤 Voice message (expired)', 'is_expired': True}}
                        )
                        
                        logger.info(f"Deleted expired voice message: {grid_file._id}")
                        
                except Exception as e:
                    logger.error(f"Error cleaning up voice file {grid_file._id}: {e}")
                    
        except Exception as e:
            logger.error(f"Voice cleanup task error: {e}")


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



# ==================== ICEBREAKER GAMES ROUTES ====================

# Game questions database
ICEBREAKER_GAMES = {
    'two_truths_lie': {
        'name': 'Two Truths and a Lie',
        'description': 'Share two truths and one lie - can your match guess the lie?',
        'icon': '🎭'
    },
    'would_you_rather': {
        'name': 'Would You Rather',
        'description': 'Choose between two options and see if you agree!',
        'icon': '🤔',
        'questions': [
            {'q': 'Would you rather travel to the past or the future?', 'a': 'Past', 'b': 'Future'},
            {'q': 'Would you rather have unlimited money or unlimited time?', 'a': 'Money', 'b': 'Time'},
            {'q': 'Would you rather be able to fly or be invisible?', 'a': 'Fly', 'b': 'Invisible'},
            {'q': 'Would you rather live in the city or countryside?', 'a': 'City', 'b': 'Countryside'},
            {'q': 'Would you rather be a famous actor or a famous musician?', 'a': 'Actor', 'b': 'Musician'},
            {'q': 'Would you rather always be 10 minutes late or 20 minutes early?', 'a': 'Late', 'b': 'Early'},
            {'q': 'Would you rather give up social media or coffee?', 'a': 'Social media', 'b': 'Coffee'},
            {'q': 'Would you rather explore space or the deep ocean?', 'a': 'Space', 'b': 'Ocean'}
        ]
    },
    'quick_questions': {
        'name': 'Quick Questions',
        'description': 'Rapid-fire questions to get to know each other fast!',
        'icon': '⚡',
        'questions': [
            'What\'s your go-to karaoke song?',
            'If you could have dinner with anyone, who would it be?',
            'What\'s the best advice you\'ve ever received?',
            'What\'s your hidden talent?',
            'What\'s on your bucket list?',
            'What\'s your favorite way to spend a Sunday?',
            'What\'s something you\'re really passionate about?',
            'What\'s the most spontaneous thing you\'ve ever done?'
        ]
    },
    'emoji_story': {
        'name': 'Emoji Story',
        'description': 'Tell a story using only emojis - can your match guess it?',
        'icon': '😄'
    },
    'never_have_i_ever': {
        'name': 'Never Have I Ever',
        'description': 'Take turns revealing things you\'ve never done!',
        'icon': '🙈',
        'questions': [
            'Never have I ever gone skydiving',
            'Never have I ever sung karaoke in public',
            'Never have I ever traveled to another continent',
            'Never have I ever cooked a five-course meal',
            'Never have I ever met a celebrity',
            'Never have I ever been on TV',
            'Never have I ever gone camping',
            'Never have I ever broken a bone'
        ]
    },
    'trivia_challenge': {
        'name': 'Trivia Challenge',
        'description': 'Test your knowledge with fun trivia questions!',
        'icon': '🧠',
        'questions': [
            {'q': 'What is the largest planet in our solar system?', 'a': 'Jupiter', 'b': 'Saturn', 'c': 'Neptune', 'd': 'Mars', 'correct': 'a'},
            {'q': 'Who painted the Mona Lisa?', 'a': 'Van Gogh', 'b': 'Da Vinci', 'c': 'Picasso', 'd': 'Monet', 'correct': 'b'},
            {'q': 'What is the capital of Australia?', 'a': 'Sydney', 'b': 'Melbourne', 'c': 'Canberra', 'd': 'Perth', 'correct': 'c'},
            {'q': 'How many strings does a standard guitar have?', 'a': '4', 'b': '5', 'c': '6', 'd': '7', 'correct': 'c'},
            {'q': 'What year did World War II end?', 'a': '1943', 'b': '1944', 'c': '1945', 'd': '1946', 'correct': 'c'}
        ]
    },
    'this_or_that': {
        'name': 'This or That',
        'description': 'Quick choices to discover your match\'s preferences!',
        'icon': '⚖️',
        'questions': [
            {'q': 'Morning person or Night owl?', 'a': 'Morning', 'b': 'Night'},
            {'q': 'Beach or Mountains?', 'a': 'Beach', 'b': 'Mountains'},
            {'q': 'Coffee or Tea?', 'a': 'Coffee', 'b': 'Tea'},
            {'q': 'Cats or Dogs?', 'a': 'Cats', 'b': 'Dogs'},
            {'q': 'Sweet or Savory?', 'a': 'Sweet', 'b': 'Savory'},
            {'q': 'Books or Movies?', 'a': 'Books', 'b': 'Movies'},
            {'q': 'Summer or Winter?', 'a': 'Summer', 'b': 'Winter'},
            {'q': 'Texting or Calling?', 'a': 'Texting', 'b': 'Calling'}
        ]
    }
}

@api_router.get("/icebreakers/games")
async def get_available_games():
    """Get list of available icebreaker games"""
    return {
        'games': [
            {
                'id': game_id,
                'name': game_data['name'],
                'description': game_data['description'],
                'icon': game_data['icon']
            }
            for game_id, game_data in ICEBREAKER_GAMES.items()
        ]
    }

@api_router.post("/icebreakers/start")
async def start_icebreaker(request: Request, current_user: dict = Depends(get_current_user)):
    """Start an icebreaker game with a match"""
    body = await request.json()
    match_id = body.get('match_id')
    game_type = body.get('game_type')
    
    if not match_id or not game_type:
        raise HTTPException(status_code=400, detail='match_id and game_type required')
    
    if game_type not in ICEBREAKER_GAMES:
        raise HTTPException(status_code=400, detail='Invalid game type')
    
    # Verify match exists
    match = await db.matches.find_one({'match_id': match_id}, {'_id': 0})
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    # Verify user is part of the match
    if current_user['user_id'] not in [match['user1_id'], match['user2_id']]:
        raise HTTPException(status_code=403, detail='You are not part of this match')
    
    # Create game session
    session_id = str(uuid.uuid4())
    game_data = ICEBREAKER_GAMES[game_type]
    
    # Prepare questions based on game type
    questions = []
    if game_type == 'would_you_rather':
        # Select random questions
        import random
        questions = random.sample(game_data['questions'], min(5, len(game_data['questions'])))
    elif game_type == 'quick_questions':
        import random
        questions = random.sample(game_data['questions'], min(5, len(game_data['questions'])))
    
    session_doc = {
        'session_id': session_id,
        'match_id': match_id,
        'game_type': game_type,
        'started_by': current_user['user_id'],
        'status': 'active',
        'questions': questions,
        'answers': {},
        'score': {match['user1_id']: 0, match['user2_id']: 0},
        'current_question': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.icebreaker_sessions.insert_one(session_doc)
    
    # Notify other user via WebSocket
    other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
    ws_message = {
        'type': 'icebreaker_started',
        'session_id': session_id,
        'game_type': game_type,
        'game_name': game_data['name'],
        'started_by': current_user['name']
    }
    await manager.send_personal_message(ws_message, other_id)
    
    return {k: v for k, v in session_doc.items() if k != '_id'}

@api_router.get("/icebreakers/{session_id}")
async def get_icebreaker_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get icebreaker game session details"""
    session = await db.icebreaker_sessions.find_one({'session_id': session_id}, {'_id': 0})
    
    if not session:
        raise HTTPException(status_code=404, detail='Game session not found')
    
    # Verify user is part of the match
    match = await db.matches.find_one({'match_id': session['match_id']}, {'_id': 0})
    if current_user['user_id'] not in [match['user1_id'], match['user2_id']]:
        raise HTTPException(status_code=403, detail='You are not part of this game')
    
    return session

@api_router.post("/icebreakers/{session_id}/answer")
async def submit_icebreaker_answer(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Submit an answer to an icebreaker question"""
    body = await request.json()
    answer = body.get('answer')
    
    if not answer:
        raise HTTPException(status_code=400, detail='Answer required')
    
    session = await db.icebreaker_sessions.find_one({'session_id': session_id}, {'_id': 0})
    
    if not session:
        raise HTTPException(status_code=404, detail='Game session not found')
    
    if session['status'] != 'active':
        raise HTTPException(status_code=400, detail='Game is not active')
    
    # Update answers
    user_id = current_user['user_id']
    question_index = session.get('current_question', 0)
    
    if 'answers' not in session:
        session['answers'] = {}
    
    if str(question_index) not in session['answers']:
        session['answers'][str(question_index)] = {}
    
    session['answers'][str(question_index)][user_id] = answer
    
    # Check if both users have answered
    match = await db.matches.find_one({'match_id': session['match_id']}, {'_id': 0})
    both_answered = all(
        uid in session['answers'][str(question_index)]
        for uid in [match['user1_id'], match['user2_id']]
    )
    
    # Move to next question if both answered
    if both_answered and question_index < len(session.get('questions', [])) - 1:
        session['current_question'] = question_index + 1
    elif both_answered:
        session['status'] = 'completed'
        session['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    # Update session
    await db.icebreaker_sessions.update_one(
        {'session_id': session_id},
        {'$set': {
            'answers': session['answers'],
            'current_question': session.get('current_question', 0),
            'status': session['status']
        }}
    )
    
    # Notify other user via WebSocket
    other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
    ws_message = {
        'type': 'icebreaker_answer',
        'session_id': session_id,
        'user_id': user_id,
        'answer': answer,
        'both_answered': both_answered
    }
    await manager.send_personal_message(ws_message, other_id)
    
    return {'message': 'Answer submitted', 'both_answered': both_answered, 'status': session['status']}



# ==================== VIRTUAL GIFTS ROUTES ====================

# Available virtual gifts
VIRTUAL_GIFTS = {
    'heart': {'name': 'Heart', 'emoji': '❤️', 'description': 'Show some love', 'points': 10},
    'rose': {'name': 'Rose', 'emoji': '🌹', 'description': 'Classic romance', 'points': 20},
    'kiss': {'name': 'Kiss', 'emoji': '💋', 'description': 'Virtual kiss', 'points': 15},
    'hug': {'name': 'Hug', 'emoji': '🤗', 'description': 'Warm hug', 'points': 10},
    'fire': {'name': 'Fire', 'emoji': '🔥', 'description': 'You\'re hot!', 'points': 15},
    'sparkle': {'name': 'Sparkle', 'emoji': '✨', 'description': 'You shine!', 'points': 10},
    'crown': {'name': 'Crown', 'emoji': '👑', 'description': 'You\'re royalty', 'points': 25},
    'trophy': {'name': 'Trophy', 'emoji': '🏆', 'description': 'You\'re a winner', 'points': 20},
    'star': {'name': 'Star', 'emoji': '⭐', 'description': 'You\'re a star', 'points': 15},
    'diamond': {'name': 'Diamond', 'emoji': '💎', 'description': 'You\'re precious', 'points': 30},
    'cake': {'name': 'Cake', 'emoji': '🎂', 'description': 'Sweet treat', 'points': 15},
    'coffee': {'name': 'Coffee', 'emoji': '☕', 'description': 'Coffee date?', 'points': 10},
    'champagne': {'name': 'Champagne', 'emoji': '🍾', 'description': 'Celebrate!', 'points': 25},
    'gift': {'name': 'Gift Box', 'emoji': '🎁', 'description': 'Special surprise', 'points': 20},
    'balloon': {'name': 'Balloon', 'emoji': '🎈', 'description': 'Party time', 'points': 10}
}

@api_router.get("/virtual-gifts")
async def get_virtual_gifts():
    """Get list of available virtual gifts"""
    return {
        'gifts': [
            {
                'id': gift_id,
                'name': gift_data['name'],
                'emoji': gift_data['emoji'],
                'description': gift_data['description'],
                'points': gift_data['points']
            }
            for gift_id, gift_data in VIRTUAL_GIFTS.items()
        ]
    }

@api_router.post("/virtual-gifts/send")
async def send_virtual_gift(request: Request, current_user: dict = Depends(get_current_user)):
    """Send a virtual gift to a match"""
    body = await request.json()
    match_id = body.get('match_id')
    gift_id = body.get('gift_id')
    message = body.get('message', '')
    
    if not match_id or not gift_id:
        raise HTTPException(status_code=400, detail='match_id and gift_id required')
    
    if gift_id not in VIRTUAL_GIFTS:
        raise HTTPException(status_code=400, detail='Invalid gift_id')
    
    # Verify match exists
    match = await db.matches.find_one({'match_id': match_id}, {'_id': 0})
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    # Verify user is part of the match
    if current_user['user_id'] not in [match['user1_id'], match['user2_id']]:
        raise HTTPException(status_code=403, detail='Not part of this match')
    
    # Get gift data
    gift_data = VIRTUAL_GIFTS[gift_id]
    
    # Create gift record
    gift_record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    gift_record = {
        'gift_id': gift_record_id,
        'match_id': match_id,
        'sender_id': current_user['user_id'],
        'receiver_id': match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id'],
        'gift_type': gift_id,
        'gift_name': gift_data['name'],
        'gift_emoji': gift_data['emoji'],
        'message': message,
        'points': gift_data['points'],
        'sent_at': now,
        'created_at': now
    }
    
    await db.virtual_gifts.insert_one(gift_record)
    
    # Create message with gift
    message_id = str(uuid.uuid4())
    message_doc = {
        'message_id': message_id,
        'match_id': match_id,
        'sender_id': current_user['user_id'],
        'content': message or f"Sent you a {gift_data['name']} {gift_data['emoji']}",
        'type': 'virtual_gift',
        'gift_data': {
            'gift_id': gift_id,
            'name': gift_data['name'],
            'emoji': gift_data['emoji'],
            'description': gift_data['description'],
            'points': gift_data['points']
        },
        'sent_at': now,
        'created_at': now,
        'read': False,
        'is_deleted': False
    }
    
    await db.messages.insert_one(message_doc)
    
    # Update match last message time
    await db.matches.update_one(
        {'match_id': match_id},
        {'$set': {'last_message_at': now}}
    )
    
    # Send via WebSocket to other user
    other_id = gift_record['receiver_id']
    ws_message = {
        'type': 'virtual_gift',
        'gift': {k: v for k, v in gift_record.items() if k != '_id'},
        'message': {k: v for k, v in message_doc.items() if k != '_id'}
    }
    await manager.send_personal_message(ws_message, other_id)
    
    # Send push notification
    asyncio.create_task(send_push_notification(
        other_id,
        f"Gift from {current_user['name']} 🎁",
        f"{current_user['name']} sent you a {gift_data['name']} {gift_data['emoji']}",
        {'type': 'virtual_gifts', 'match_id': match_id, 'gift_id': gift_id}
    ))
    
    return {
        'gift': {k: v for k, v in gift_record.items() if k != '_id'},
        'message': {k: v for k, v in message_doc.items() if k != '_id'}
    }

@api_router.get("/virtual-gifts/received")
async def get_received_gifts(current_user: dict = Depends(get_current_user)):
    """Get virtual gifts received by the user"""
    gifts = await db.virtual_gifts.find(
        {'receiver_id': current_user['user_id']},
        {'_id': 0}
    ).sort('sent_at', -1).limit(50).to_list(50)
    
    return {'gifts': gifts, 'total': len(gifts)}



# ==================== PUSH NOTIFICATIONS (FIREBASE) ====================

@api_router.post("/notifications/register-token")
async def register_fcm_token(request: Request, current_user: dict = Depends(get_current_user)):
    """Register user's FCM token for push notifications"""
    body = await request.json()
    fcm_token = body.get('token')
    
    if not fcm_token:
        raise HTTPException(status_code=400, detail='FCM token required')
    
    # Save token to user's record
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'fcm_token': fcm_token, 'last_token_update': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {'message': 'Token registered successfully'}

@api_router.post("/notifications/preferences")
async def update_notification_preferences(request: Request, current_user: dict = Depends(get_current_user)):
    """Update user's notification preferences"""
    body = await request.json()
    
    preferences = {
        'new_matches': body.get('new_matches', True),
        'new_messages': body.get('new_messages', True),
        'new_likes': body.get('new_likes', True),
        'super_likes': body.get('super_likes', True),
        'roses': body.get('roses', True),
        'date_suggestions': body.get('date_suggestions', True),
        'virtual_gifts': body.get('virtual_gifts', True)
    }
    
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'notification_preferences': preferences}}
    )
    
    return {'message': 'Preferences updated', 'preferences': preferences}

@api_router.get("/notifications/preferences")
async def get_notification_preferences(current_user: dict = Depends(get_current_user)):
    """Get user's notification preferences"""
    user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    preferences = user.get('notification_preferences', {
        'new_matches': True,
        'new_messages': True,
        'new_likes': True,
        'super_likes': True,
        'roses': True,
        'date_suggestions': True,
        'virtual_gifts': True
    })
    
    return {'preferences': preferences}

async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Helper function to send push notification via Firebase"""
    try:
        # Get user's FCM token
        user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
        
        if not user or not user.get('fcm_token'):
            logger.info(f"No FCM token for user {user_id}")
            return False
        
        # Check notification preferences
        preferences = user.get('notification_preferences', {})
        notification_type = data.get('type') if data else 'general'
        
        # Check if user has this notification type enabled
        if notification_type in preferences and not preferences.get(notification_type):
            logger.info(f"Notification type {notification_type} disabled for user {user_id}")
            return False
        
        # Prepare message
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=user['fcm_token']
        )
        
        # Send message
        response = messaging.send(message)
        logger.info(f"Push notification sent to {user_id}: {response}")
        
        # Store notification in database
        notification_doc = {
            'notification_id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': title,
            'body': body,
            'data': data or {},
            'sent_at': datetime.now(timezone.utc).isoformat(),
            'read': False
        }
        await db.notifications.insert_one(notification_doc)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return False

@api_router.get("/notifications/history")
async def get_notification_history(current_user: dict = Depends(get_current_user)):
    """Get user's notification history"""
    notifications = await db.notifications.find(
        {'user_id': current_user['user_id']},
        {'_id': 0}
    ).sort('sent_at', -1).limit(50).to_list(50)
    
    return {'notifications': notifications, 'total': len(notifications)}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {'notification_id': notification_id, 'user_id': current_user['user_id']},
        {'$set': {'read': True, 'read_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail='Notification not found')
    
    return {'message': 'Notification marked as read'}

# ==================== PREMIUM PLANS (NO PAYMENT PROCESSING) ====================

@api_router.get("/premium/plans")
async def get_premium_plans():
    """Get premium plans and pricing (payment processing to be implemented via Apple/Google IAP)"""
    return {
        'plans': [
            {
                'id': 'weekly',
                'name': 'Weekly',
                'price': 4.99,
                'duration': '1 week',
                'features': ['Unlimited likes', '5 Super Likes/day', '3 Roses/week', 'See who likes you', 'Standouts access']
            },
            {
                'id': 'monthly',
                'name': 'Monthly',
                'price': 19.99,
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
            {'id': 'roses_3', 'name': '3 Roses', 'price': 2.99, 'quantity': 3},
            {'id': 'roses_12', 'name': '12 Roses', 'price': 9.99, 'quantity': 12},
            {'id': 'super_likes_5', 'name': '5 Super Likes', 'price': 4.99, 'quantity': 5},
            {'id': 'super_likes_15', 'name': '15 Super Likes', 'price': 12.99, 'quantity': 15}
        ],
        'message': 'Payment processing will be handled via Apple In-App Purchase and Google Play Billing'
    }

# ==================== STRIPE PAYMENT ROUTES - REMOVED ====================
# These endpoints have been removed as Stripe is no longer being used
# Payment processing will be handled via:
# - Apple In-App Purchase (for iOS)
# - Google Play Billing (for Android)
# - Alternative payment processor for web (TBD)

# @api_router.post("/payments/checkout")
# async def create_checkout_session(checkout: CheckoutRequest, current_user: dict = Depends(get_current_user)):
#     """REMOVED - Stripe checkout no longer used"""
#     raise HTTPException(status_code=501, detail='Stripe payment removed. Use Apple IAP or Google Play Billing')

# @api_router.get("/payments/status/{session_id}")
# async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
#     """REMOVED - Stripe payment status check no longer used"""
#     raise HTTPException(status_code=501, detail='Stripe payment removed. Use Apple IAP or Google Play Billing')

# @api_router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     """REMOVED - Stripe webhook no longer used"""
#     raise HTTPException(status_code=501, detail='Stripe webhook removed')


# ==================== VIDEO CALL ENHANCEMENTS ====================

@api_router.post("/calls/{call_id}/reaction")
async def send_call_reaction(call_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Send a reaction during a video call (emoji, hearts, etc.)"""
    body = await request.json()
    reaction = body.get('reaction')
    
    if not reaction:
        raise HTTPException(status_code=400, detail='Reaction required')
    
    # Get call details
    call = await db.calls.find_one({'call_id': call_id}, {'_id': 0})
    if not call:
        raise HTTPException(status_code=404, detail='Call not found')
    
    # Verify user is part of the call
    if current_user['user_id'] not in [call['caller_id'], call['callee_id']]:
        raise HTTPException(status_code=403, detail='Not part of this call')
    
    # Send reaction to other user via WebSocket
    other_id = call['callee_id'] if call['caller_id'] == current_user['user_id'] else call['caller_id']
    ws_message = {
        'type': 'call_reaction',
        'call_id': call_id,
        'reaction': reaction,
        'from_user_id': current_user['user_id']
    }
    await manager.send_personal_message(ws_message, other_id)
    
    return {'message': 'Reaction sent', 'reaction': reaction}

@api_router.get("/calls/reactions")
async def get_available_reactions():
    """Get available reactions for video calls"""
    return {
        'reactions': [
            {'id': 'heart', 'emoji': '❤️', 'name': 'Love'},
            {'id': 'laugh', 'emoji': '😂', 'name': 'Laugh'},
            {'id': 'fire', 'emoji': '🔥', 'name': 'Fire'},
            {'id': 'star', 'emoji': '⭐', 'name': 'Star'},
            {'id': 'clap', 'emoji': '👏', 'name': 'Applause'},
            {'id': 'wave', 'emoji': '👋', 'name': 'Wave'},
            {'id': 'thumbs_up', 'emoji': '👍', 'name': 'Thumbs Up'},
            {'id': 'kiss', 'emoji': '😘', 'name': 'Kiss'},
            {'id': 'sparkle', 'emoji': '✨', 'name': 'Sparkle'},
            {'id': 'celebrate', 'emoji': '🎉', 'name': 'Celebrate'}
        ]
    }

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
        'specific_interests': [],
        'genders': [],
        'dating_purposes': [],
        'religions': [],
        'languages': [],
        'children_preference': [],
        'political_views': [],
        'pets': [],
        'ethnicities': [],
        'sub_ethnicities': []
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


# ==================== DATE SUGGESTIONS (GOOGLE PLACES) ====================

GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY', '')
GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1/places"

@api_router.get("/places/search")
async def search_places(
    query: str,
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: int = 5000,  # 5km radius
    place_type: str = "restaurant",  # restaurant, cafe, bar, museum, park, etc.
    min_rating: Optional[float] = None,
    price_level: Optional[str] = None,  # PRICE_LEVEL_FREE, INEXPENSIVE, MODERATE, EXPENSIVE, VERY_EXPENSIVE
    current_user: dict = Depends(get_current_user)
):
    """
    Search for places using Google Places API (New)
    """
    try:
        # Build the request to Google Places API
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.websiteUri,places.googleMapsUri,places.location,places.userRatingCount,places.businessStatus"
        }
        
        # Build search request
        search_data = {
            "textQuery": query,
            "maxResultCount": 20
        }
        
        # Add location bias if provided
        if latitude and longitude:
            search_data["locationBias"] = {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": radius
                }
            }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_PLACES_BASE_URL}:searchText",
                headers=headers,
                json=search_data,
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google Places API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail="Failed to search places")
            
            data = response.json()
            places = data.get('places', [])
            
            # Filter by rating if specified
            if min_rating:
                places = [p for p in places if p.get('rating', 0) >= min_rating]
            
            # Filter by price level if specified
            if price_level:
                places = [p for p in places if p.get('priceLevel') == price_level]
            
            # Filter by type
            if place_type != "all":
                places = [p for p in places if place_type in p.get('types', [])]
            
            return {
                'places': places,
                'total': len(places)
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout")
    except Exception as e:
        logger.error(f"Error searching places: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/places/{place_id}")
async def get_place_details(
    place_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific place
    """
    try:
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,priceLevel,photos,types,websiteUri,googleMapsUri,location,userRatingCount,businessStatus,currentOpeningHours,internationalPhoneNumber,reviews"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_PLACES_BASE_URL}/{place_id}",
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Place not found")
            
            return response.json()
            
    except Exception as e:
        logger.error(f"Error fetching place details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/date-suggestion")
async def send_date_suggestion(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a date suggestion in a match conversation
    """
    body = await request.json()
    match_id = body.get('match_id')
    place_data = body.get('place_data')
    message = body.get('message', '')
    
    if not match_id or not place_data:
        raise HTTPException(status_code=400, detail='match_id and place_data required')
    
    # Verify match exists
    match = await db.matches.find_one({'match_id': match_id}, {'_id': 0})
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    # Verify user is part of the match
    if current_user['user_id'] not in [match['user1_id'], match['user2_id']]:
        raise HTTPException(status_code=403, detail='Not part of this match')
    
    # Create message with date suggestion
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        'message_id': message_id,
        'match_id': match_id,
        'sender_id': current_user['user_id'],
        'content': message or f"How about we check out {place_data.get('name', 'this place')}?",
        'type': 'date_suggestion',
        'date_suggestion': {
            'place_id': place_data.get('id'),
            'name': place_data.get('name'),
            'address': place_data.get('address'),
            'rating': place_data.get('rating'),
            'price_level': place_data.get('priceLevel'),
            'photo_url': place_data.get('photo_url'),
            'maps_url': place_data.get('maps_url'),
            'website_url': place_data.get('website_url'),
            'types': place_data.get('types', [])
        },
        'sent_at': now,
        'created_at': now,
        'read': False,
        'is_deleted': False
    }
    
    await db.messages.insert_one(message_doc)
    
    # Update match last message time
    await db.matches.update_one(
        {'match_id': match_id},
        {'$set': {'last_message_at': now}}
    )
    
    # Send via WebSocket to other user
    other_id = match['user2_id'] if match['user1_id'] == current_user['user_id'] else match['user1_id']
    ws_message = {
        'type': 'new_message',
        'message': {k: v for k, v in message_doc.items() if k != '_id'}
    }
    await manager.send_personal_message(ws_message, other_id)
    
    # Send push notification for date suggestion
    asyncio.create_task(send_push_notification(
        other_id,
        f"Date Idea from {current_user['name']} 📍",
        f"{current_user['name']} suggested: {place_data.get('name', 'a place')}",
        {'type': 'date_suggestions', 'match_id': match_id, 'message_id': message_id}
    ))
    
    return {k: v for k, v in message_doc.items() if k != '_id'}

@api_router.get("/places/categories")
async def get_place_categories():
    """
    Get available place categories for filtering
    """
    return {
        'categories': [
            {'value': 'restaurant', 'label': 'Restaurants', 'icon': '🍽️'},
            {'value': 'cafe', 'label': 'Cafes', 'icon': '☕'},
            {'value': 'bar', 'label': 'Bars', 'icon': '🍺'},
            {'value': 'museum', 'label': 'Museums', 'icon': '🏛️'},
            {'value': 'park', 'label': 'Parks', 'icon': '🌳'},
            {'value': 'movie_theater', 'label': 'Movie Theaters', 'icon': '🎬'},
            {'value': 'bowling_alley', 'label': 'Bowling', 'icon': '🎳'},
            {'value': 'art_gallery', 'label': 'Art Galleries', 'icon': '🎨'},
            {'value': 'amusement_park', 'label': 'Amusement Parks', 'icon': '🎢'},
            {'value': 'zoo', 'label': 'Zoos', 'icon': '🦁'},
            {'value': 'aquarium', 'label': 'Aquariums', 'icon': '🐠'},
            {'value': 'night_club', 'label': 'Night Clubs', 'icon': '💃'},
            {'value': 'shopping_mall', 'label': 'Shopping', 'icon': '🛍️'},
            {'value': 'spa', 'label': 'Spas', 'icon': '💆'},
            {'value': 'all', 'label': 'All Places', 'icon': '📍'}
        ]
    }


# ==================== AMBASSADOR ROLE PROGRAM ====================

AMBASSADOR_LIMIT = 200  # Maximum number of ambassadors

@api_router.get("/ambassador/info")
async def get_ambassador_info():
    """Get information about the Ambassador program - spot count hidden"""
    # Get current count of ambassadors
    ambassador_count = await db.users.count_documents({'is_ambassador': True})
    
    # Hide spot count to avoid pressure - only show if program is full
    return {
        'is_full': ambassador_count >= AMBASSADOR_LIMIT,
        'benefits': [
            '2 months of Premium membership for free',
            'Ambassador badge on your profile',
            'Highlighted in Discover (shown first)',
            'Chance to be featured on our social media',
            'Represent Ember in the dating community'
        ]
    }

@api_router.post("/ambassador/apply")
async def apply_for_ambassador(current_user: dict = Depends(get_current_user)):
    """Apply for the Ambassador role"""
    
    # CHECK #1: User must be female (silent check - no explicit messaging)
    user_gender = current_user.get('gender', '').lower()
    if user_gender not in ['female', 'woman']:
        raise HTTPException(
            status_code=403, 
            detail='The Ambassador program is currently at capacity for your profile type'
        )
    
    # CHECK #2: User must be verified
    if current_user.get('verification_status') != 'verified':
        raise HTTPException(status_code=403, detail='Profile verification required to apply for Ambassador role')
    
    # CHECK #3: User already has ambassador status
    if current_user.get('is_ambassador'):
        return {
            'success': False,
            'message': 'You are already an Ambassador!',
            'is_ambassador': True
        }
    
    # CHECK #4: User has already applied (pending)
    if current_user.get('ambassador_status') == 'pending':
        return {
            'success': False,
            'message': 'Your application is pending review',
            'status': 'pending'
        }
    
    # CHECK #5: Program is full
    ambassador_count = await db.users.count_documents({'is_ambassador': True})
    if ambassador_count >= AMBASSADOR_LIMIT:
        return {
            'success': False,
            'message': 'Sorry, the Ambassador program is currently full. We have reached our limit of 200 ambassadors.',
            'is_full': True
        }
    
    # Auto-approve since there's space available and all checks passed
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate 2 months premium (60 days)
    premium_end_date = datetime.now(timezone.utc) + timedelta(days=60)
    
    # Update user to ambassador status
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {
            '$set': {
                'is_ambassador': True,
                'ambassador_since': datetime.now(timezone.utc),
                'is_premium': True,
                'premium_end_date': premium_end_date
            }
        }
    )
    
    return {
        'success': True,
        'message': 'Congratulations! You are now an Ember Ambassador with 2 months of premium access!'
    }

# ==================== SUPPORT ROUTES ====================

# Helper function to get current user optionally (for both logged in and anonymous)
async def get_current_user_optional(authorization: str = Header(None)):
    """Get current user if token provided, otherwise return None"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            return None
        
        user = await db.users.find_one({'user_id': user_id}, {'_id': 0, 'hashed_password': 0})
        return user
    except:
        return None

@api_router.post("/support/contact")
async def contact_support(
    type: str,
    subject: str,
    message: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Contact support - stores message in database and can send email"""
    # Create support message record
    support_message = {
        'message_id': f"support_{uuid.uuid4().hex[:12]}",
        'user_id': current_user['user_id'] if current_user else None,
        'user_email': current_user.get('email') if current_user else 'anonymous',
        'user_name': current_user.get('name') if current_user else 'Anonymous User',
        'type': type,
        'subject': subject,
        'message': message,
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'resolved_at': None
    }
    
    # Store in database
    await db.support_messages.insert_one(support_message)
    
    # Log to console (email integration can be added later)
    logger.info(f"Support message received: {type} - {subject} from {support_message['user_email']}")
    logger.info(f"Message: {message}")
    logger.info(f"Send notification to: ember.dating.app25@gmail.com")
    
    return {
        'success': True,
        'message': 'Your message has been sent to our support team. We will respond within 24-48 hours.',
        'message_id': support_message['message_id']
    }

@api_router.get("/ambassador/status")
async def get_ambassador_status(current_user: dict = Depends(get_current_user)):
    """Get current user's ambassador status"""
    return {
        'is_ambassador': current_user.get('is_ambassador', False),
        'status': current_user.get('ambassador_status', 'none'),
        'applied_at': current_user.get('ambassador_applied_at'),
        'approved_at': current_user.get('ambassador_approved_at')
    }


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

@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    asyncio.create_task(cleanup_expired_voice_messages())
    logger.info("Voice message cleanup task started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
