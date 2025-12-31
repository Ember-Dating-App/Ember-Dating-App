"""
Create Demo Profile for App Tour
This script creates a complete demo profile that new users can interact with
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import bcrypt

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'ember_dating'

async def create_demo_profile():
    """Create a comprehensive demo profile"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if demo profile already exists
    existing = await db.users.find_one({'email': 'demo@ember.app'})
    if existing:
        print("Demo profile already exists. Updating...")
        await db.users.delete_one({'email': 'demo@ember.app'})
    
    # Create demo profile
    now = datetime.now(timezone.utc).isoformat()
    
    # Hash password
    password = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt())
    
    demo_profile = {
        'user_id': 'user_demo_ember_2024',
        'email': 'demo@ember.app',
        'password': password.decode('utf-8'),
        'name': 'Alex Demo',
        'age': 28,
        'gender': 'non-binary',
        'interested_in': 'everyone',
        'bio': "🎨 Artist & Adventure Seeker | 🌍 World Traveler | 📚 Bookworm | 🎵 Music Lover\n\nHey there! I'm Alex, and I believe life is too short for boring conversations. I spend my days creating art, exploring new coffee shops, and planning my next adventure. Looking for someone who can appreciate a good sunset, deep conversations, and spontaneous road trips. Let's make some memories together! ✨",
        
        # Photos (using placeholder images)
        'photos': [
            {
                'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
                'public_id': 'demo_photo_1',
                'order': 0
            },
            {
                'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
                'public_id': 'demo_photo_2',
                'order': 1
            },
            {
                'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
                'public_id': 'demo_photo_3',
                'order': 2
            },
            {
                'url': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
                'public_id': 'demo_photo_4',
                'order': 3
            },
            {
                'url': 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800',
                'public_id': 'demo_photo_5',
                'order': 4
            },
            {
                'url': 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800',
                'public_id': 'demo_photo_6',
                'order': 5
            }
        ],
        
        # Video profile
        'video_url': None,  # Optional
        
        # Prompts
        'prompts': [
            {
                'question': 'My ideal Sunday morning...',
                'answer': 'Coffee in bed, followed by a long walk in the park, then brunch with friends. Bonus points if there\'s a farmers market involved!'
            },
            {
                'question': 'I\'m looking for...',
                'answer': 'Someone who can make me laugh, isn\'t afraid to be themselves, and is up for both Netflix nights and spontaneous adventures.'
            },
            {
                'question': 'The way to win me over is...',
                'answer': 'Show me your favorite hidden spot in the city, cook me your signature dish, or just be genuinely curious about the world. Authenticity is everything!'
            }
        ],
        
        # Interests (10 selected)
        'interests': [
            'Art & Museums',
            'Travel',
            'Coffee',
            'Reading',
            'Music',
            'Photography',
            'Hiking',
            'Cooking',
            'Yoga',
            'Movies'
        ],
        
        # Location (San Francisco area)
        'location': 'San Francisco, CA',
        'location_details': {
            'city': 'San Francisco',
            'state': 'CA',
            'country': 'USA',
            'latitude': 37.7749,
            'longitude': -122.4194,
            'coordinates': [-122.4194, 37.7749]
        },
        
        # Additional profile fields
        'height': 175,  # cm
        'education': "Bachelor's Degree",
        'job_title': 'Digital Artist',
        'company': 'Freelance',
        'school': 'UC Berkeley',
        'religion': 'Spiritual',
        'politics': 'Liberal',
        'drinking': 'Socially',
        'smoking': 'Never',
        'drugs': 'Never',
        'has_children': 'No',
        'wants_children': 'Maybe someday',
        'languages': ['English', 'Spanish'],
        'ethnicity': 'Mixed',
        'zodiac': 'Gemini',
        
        # Dating preferences
        'dating_purpose': 'Long-term relationship',
        'looking_for_gender': 'everyone',
        'age_preference_min': 25,
        'age_preference_max': 35,
        'distance_preference': 50,  # miles
        
        # Verification
        'verification_status': 'verified',
        'verified_at': now,
        
        # Status flags
        'is_profile_complete': True,
        'is_premium': False,
        'is_ambassador': False,
        'is_demo': True,  # Special flag
        
        # Limits
        'daily_swipes': 0,
        'daily_super_likes': 3,
        'daily_roses': 1,
        'swipes_reset_at': now,
        'super_likes_reset_at': now,
        'roses_reset_at': now,
        
        # Notification settings
        'notification_settings': {
            'new_matches': True,
            'new_messages': True,
            'new_likes': True,
            'super_likes': True,
            'roses': True,
            'standouts': True,
            'date_suggestions': True,
            'virtual_gifts': True
        },
        
        # Timestamps
        'created_at': now,
        'updated_at': now,
        'last_active': now
    }
    
    # Insert demo profile
    await db.users.insert_one(demo_profile)
    print(f"✅ Demo profile created: {demo_profile['name']} ({demo_profile['user_id']})")
    print(f"   Email: {demo_profile['email']}")
    print(f"   Password: demo123")
    print(f"   Location: {demo_profile['location']}")
    print(f"   Photos: {len(demo_profile['photos'])} photos")
    print(f"   Interests: {len(demo_profile['interests'])} interests")
    print(f"   Verified: {demo_profile['verification_status']}")
    
    client.close()
    return demo_profile

if __name__ == "__main__":
    profile = asyncio.run(create_demo_profile())
    print("\n🎉 Demo profile ready for app tour!")
