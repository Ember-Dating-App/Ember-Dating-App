from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client for AI features
openai_client = OpenAI(api_key=os.environ.get('EMERGENT_LLM_KEY', ''))

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'ember-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    interested_in: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photos: List[str] = []
    video_url: Optional[str] = None
    prompts: List[Dict[str, str]] = []
    interests: List[str] = []
    is_profile_complete: bool = False
    created_at: str = ""
    last_active: str = ""

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

class LikeCreate(BaseModel):
    liked_user_id: str
    liked_section: Optional[str] = None
    comment: Optional[str] = None

class MessageCreate(BaseModel):
    match_id: str
    content: str

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str
    user1_id: str
    user2_id: str
    created_at: str
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    match_id: str
    sender_id: str
    content: str
    created_at: str
    read: bool = False

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials = Depends(security)) -> dict:
    # Check cookie first
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
    
    # Check Authorization header
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
        'bio': None,
        'photos': [],
        'video_url': None,
        'prompts': [],
        'interests': [],
        'is_profile_complete': False,
        'created_at': now,
        'last_active': now
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    return {'token': token, 'user': {k: v for k, v in user_doc.items() if k not in ['password', '_id']}}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if not user or not verify_password(user_data.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['user_id'])
    await db.users.update_one({'user_id': user['user_id']}, {'$set': {'last_active': datetime.now(timezone.utc).isoformat()}})
    
    return {'token': token, 'user': {k: v for k, v in user.items() if k != 'password'}}

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
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
            'bio': None,
            'photos': [],
            'video_url': None,
            'prompts': [],
            'interests': [],
            'is_profile_complete': False,
            'created_at': now.isoformat(),
            'last_active': now.isoformat()
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({'email': google_data['email']}, {'$set': {'last_active': now.isoformat()}})
        user = await db.users.find_one({'email': google_data['email']}, {'_id': 0})
    
    # Store session
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

# ==================== PROFILE ROUTES ====================

@api_router.put("/profile")
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    # Check if profile is complete
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

# ==================== DISCOVER ROUTES ====================

@api_router.get("/discover")
async def discover_profiles(current_user: dict = Depends(get_current_user)):
    # Get users to skip (already liked or matched)
    liked_ids = await db.likes.find({'liker_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    liked_user_ids = [l['liked_user_id'] for l in liked_ids]
    
    matches = await db.matches.find(
        {'$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]},
        {'_id': 0}
    ).to_list(1000)
    matched_ids = [m['user1_id'] if m['user2_id'] == current_user['user_id'] else m['user2_id'] for m in matches]
    
    skip_ids = list(set(liked_user_ids + matched_ids + [current_user['user_id']]))
    
    # Filter based on preferences
    query = {
        'user_id': {'$nin': skip_ids},
        'is_profile_complete': True
    }
    
    if current_user.get('interested_in') and current_user['interested_in'] != 'everyone':
        query['gender'] = current_user['interested_in']
    
    profiles = await db.users.find(query, {'_id': 0, 'password': 0}).to_list(50)
    return profiles

@api_router.get("/discover/most-compatible")
async def most_compatible(current_user: dict = Depends(get_current_user)):
    # Get regular discover profiles
    profiles = await discover_profiles(current_user)
    
    if not profiles or not current_user.get('interests'):
        return profiles[:10]
    
    # Use AI to find most compatible
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
        
        import json
        indices = json.loads(completion.choices[0].message.content)
        compatible = [profiles[i] for i in indices if i < len(profiles)]
        return compatible if compatible else profiles[:5]
    except Exception as e:
        logger.error(f"AI compatibility error: {e}")
        return profiles[:5]

# ==================== LIKES ROUTES ====================

@api_router.post("/likes")
async def create_like(like: LikeCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if already liked
    existing = await db.likes.find_one({
        'liker_id': current_user['user_id'],
        'liked_user_id': like.liked_user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail='Already liked this user')
    
    like_doc = {
        'like_id': f"like_{uuid.uuid4().hex[:12]}",
        'liker_id': current_user['user_id'],
        'liked_user_id': like.liked_user_id,
        'liked_section': like.liked_section,
        'comment': like.comment,
        'created_at': now
    }
    await db.likes.insert_one(like_doc)
    
    # Check for mutual like (match)
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
            'last_message': None,
            'last_message_at': None
        }
        await db.matches.insert_one(match_doc)
        return {'like': like_doc, 'match': match_doc}
    
    return {'like': like_doc, 'match': None}

@api_router.get("/likes/received")
async def get_received_likes(current_user: dict = Depends(get_current_user)):
    likes = await db.likes.find({'liked_user_id': current_user['user_id']}, {'_id': 0}).to_list(100)
    
    # Get liker profiles
    for like in likes:
        liker = await db.users.find_one({'user_id': like['liker_id']}, {'_id': 0, 'password': 0})
        like['liker'] = liker
    
    return likes

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
    
    # Get other user profile for each match
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
    
    # Delete messages
    await db.messages.delete_many({'match_id': match_id})
    return {'message': 'Unmatched'}

# ==================== MESSAGES ROUTES ====================

@api_router.get("/messages/{match_id}")
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    # Verify user is part of match
    match = await db.matches.find_one({
        'match_id': match_id,
        '$or': [{'user1_id': current_user['user_id']}, {'user2_id': current_user['user_id']}]
    })
    if not match:
        raise HTTPException(status_code=404, detail='Match not found')
    
    messages = await db.messages.find({'match_id': match_id}, {'_id': 0}).sort('created_at', 1).to_list(500)
    
    # Mark messages as read
    await db.messages.update_many(
        {'match_id': match_id, 'sender_id': {'$ne': current_user['user_id']}, 'read': False},
        {'$set': {'read': True}}
    )
    
    return messages

@api_router.post("/messages")
async def send_message(msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    # Verify user is part of match
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
        'read': False
    }
    await db.messages.insert_one(message_doc)
    
    # Update match with last message
    await db.matches.update_one(
        {'match_id': msg.match_id},
        {'$set': {'last_message': msg.content, 'last_message_at': now}}
    )
    
    return message_doc

# ==================== AI ROUTES ====================

@api_router.post("/ai/conversation-starters")
async def get_conversation_starters(current_user: dict = Depends(get_current_user)):
    body_data = {}
    try:
        from fastapi import Body
    except:
        pass
    
    # Get other user's profile from request
    other_user_id = body_data.get('other_user_id') if body_data else None
    other_profile = None
    
    if other_user_id:
        other_profile = await db.users.find_one({'user_id': other_user_id}, {'_id': 0, 'password': 0})
    
    try:
        prompt = "Generate 3 creative, fun, and engaging conversation starters for a dating app."
        if other_profile:
            prompt += f" The person's interests are: {other_profile.get('interests', [])}. Their bio: {other_profile.get('bio', 'Not provided')}"
        
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a helpful dating coach. Generate conversation starters that are fun, respectful, and likely to get a response. Return only a JSON array of 3 strings.'},
                {'role': 'user', 'content': prompt}
            ],
            max_tokens=200
        )
        
        import json
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
        
        import json
        starters = json.loads(completion.choices[0].message.content)
        return {'starters': starters}
    except Exception as e:
        logger.error(f"AI personalized starter error: {e}")
        return {'starters': [
            f"Hey {other_profile.get('name', 'there')}! What made you smile today?",
            "I noticed we have some things in common! What do you enjoy most about your interests?",
            "What's the story behind your profile? I'd love to know more!"
        ]}

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

# ==================== VIDEO CALL SIGNALING ====================

@api_router.post("/calls/initiate")
async def initiate_call(current_user: dict = Depends(get_current_user)):
    from fastapi import Body
    return {'message': 'Call signaling would be handled via WebSocket in production'}

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
