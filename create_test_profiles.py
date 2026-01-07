import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid
import bcrypt
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path('/app/backend/.env'))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_test_profiles():
    """Create 5 female test profiles for matching and messaging"""
    
    profiles = [
        {
            "name": "Emma Wilson",
            "email": "emma.test@ember.app",
            "age": 26,
            "gender": "woman",
            "interested_in": "men",
            "location": "New York, NY",
            "bio": "Adventure seeker 🌍 | Coffee addict ☕ | Dog mom 🐕 | Love hiking and trying new restaurants!",
            "interests": ["Travel", "Hiking", "Coffee", "Dogs", "Food"],
            "height": 165,
            "education": "Bachelors",
            "dating_purpose": "Long-term Relationship",
            "photos": [
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop"
            ]
        },
        {
            "name": "Sophie Chen",
            "email": "sophie.test@ember.app",
            "age": 24,
            "gender": "woman",
            "interested_in": "men",
            "location": "San Francisco, CA",
            "bio": "Tech enthusiast 💻 | Yoga lover 🧘‍♀️ | Foodie | Always down for a spontaneous road trip!",
            "interests": ["Technology", "Yoga", "Food", "Travel", "Photography"],
            "height": 160,
            "education": "Masters",
            "dating_purpose": "Long-term Relationship",
            "photos": [
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop"
            ]
        },
        {
            "name": "Maya Rodriguez",
            "email": "maya.test@ember.app",
            "age": 28,
            "gender": "woman",
            "interested_in": "men",
            "location": "Los Angeles, CA",
            "bio": "Artist by day 🎨 | Dancer by night 💃 | Beach lover 🌊 | Looking for someone to share sunsets with!",
            "interests": ["Art", "Dancing", "Beach", "Music", "Movies"],
            "height": 170,
            "education": "Bachelors",
            "dating_purpose": "Casual Dating",
            "photos": [
                "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
                "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop"
            ]
        },
        {
            "name": "Isabella Martinez",
            "email": "isabella.test@ember.app",
            "age": 27,
            "gender": "woman",
            "interested_in": "men",
            "location": "Miami, FL",
            "bio": "Fitness coach 💪 | Marathon runner 🏃‍♀️ | Plant mom 🌱 | Let's grab açai bowls and talk about life goals!",
            "interests": ["Fitness", "Running", "Cooking", "Reading", "Wine"],
            "height": 168,
            "education": "Bachelors",
            "dating_purpose": "Long-term Relationship",
            "photos": [
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop",
                "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=500&fit=crop"
            ]
        },
        {
            "name": "Olivia Taylor",
            "email": "olivia.test@ember.app",
            "age": 25,
            "gender": "woman",
            "interested_in": "men",
            "location": "Austin, TX",
            "bio": "Music lover 🎵 | Bookworm 📚 | Cat person 🐱 | Looking for my concert buddy and Netflix partner!",
            "interests": ["Music", "Reading", "Movies", "Gaming", "Travel"],
            "height": 163,
            "education": "Bachelors",
            "dating_purpose": "Not Sure Yet",
            "photos": [
                "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400&h=500&fit=crop",
                "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=500&fit=crop"
            ]
        }
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    password = "TestPass123"  # Same password for all test accounts
    
    created_users = []
    
    for profile in profiles:
        # Check if user already exists
        existing = await db.users.find_one({'email': profile['email']})
        if existing:
            print(f"✓ User {profile['name']} already exists (user_id: {existing['user_id']})")
            created_users.append(existing['user_id'])
            continue
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        user_doc = {
            'user_id': user_id,
            'email': profile['email'],
            'password': hash_password(password),
            'name': profile['name'],
            'age': profile['age'],
            'gender': profile['gender'],
            'interested_in': profile['interested_in'],
            'location': profile['location'],
            'location_details': {
                'city': profile['location'].split(',')[0].strip(),
                'state': None,
                'country': 'United States',
                'latitude': None,
                'longitude': None
            },
            'bio': profile['bio'],
            'height': profile['height'],
            'education': profile['education'],
            'photos': profile['photos'],
            'video_url': None,
            'prompts': [
                {
                    'question': 'My ideal Sunday',
                    'answer': 'Brunch, a long walk, and good conversation!'
                },
                {
                    'question': 'I\'m looking for',
                    'answer': 'Someone genuine, kind, and adventurous'
                }
            ],
            'interests': profile['interests'],
            'is_profile_complete': True,
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
            'verification_status': 'verified',  # Pre-verify for testing
            'verification_methods': ['photo'],
            'photo_verification': {'status': 'verified', 'selfie_url': None, 'verified_at': now},
            'phone_verification': {'status': 'pending', 'phone': None, 'verified_at': None, 'code': None, 'expires_at': None},
            'id_verification': {'status': 'pending', 'id_photo_url': None, 'verified_at': None},
            'swipe_limit': {'count': 0, 'last_reset': now, 'daily_max': 10},
            'super_like_limit': {'count': 0, 'last_reset': now, 'daily_max': 3},
            'rose_limit': {'count': 0, 'last_reset': now, 'daily_max': 1},
            'last_passed_user_id': None,
            'last_passed_at': None,
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
            'dating_purpose': profile['dating_purpose'],
            'religion': None,
            'languages': ['English'],
            'children': None,
            'political_view': None,
            'has_pets': None,
            'ethnicity': None,
            'sub_ethnicity': None,
            'created_at': now,
            'last_active': now
        }
        
        await db.users.insert_one(user_doc)
        created_users.append(user_id)
        print(f"✓ Created profile for {profile['name']} (user_id: {user_id})")
    
    return created_users

async def create_matches_with_test_user(test_user_id, female_user_ids):
    """Create matches between test user and all female profiles"""
    
    matches_created = 0
    
    for female_id in female_user_ids:
        # Check if match already exists
        existing_match = await db.matches.find_one({
            '$or': [
                {'user1_id': test_user_id, 'user2_id': female_id},
                {'user1_id': female_id, 'user2_id': test_user_id}
            ]
        })
        
        if existing_match:
            print(f"✓ Match already exists between {test_user_id} and {female_id}")
            continue
        
        # Create match
        match_id = f"match_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        match_doc = {
            'match_id': match_id,
            'user1_id': test_user_id,
            'user2_id': female_id,
            'created_at': now,
            'last_message': None,
            'last_message_at': None,
            'first_message_sent': False
        }
        
        await db.matches.insert_one(match_doc)
        matches_created += 1
        
        # Get female user details
        female_user = await db.users.find_one({'user_id': female_id}, {'_id': 0})
        print(f"✓ Created match with {female_user['name']} (match_id: {match_id})")
    
    return matches_created

async def main():
    try:
        # Get the test user
        test_user = await db.users.find_one({'email': 'testauth@ember.test'}, {'_id': 0})
        if not test_user:
            print("❌ Test user (testauth@ember.test) not found. Please create it first.")
            return
        
        test_user_id = test_user['user_id']
        print(f"✓ Found test user: {test_user.get('name', 'Test User')} (user_id: {test_user_id})")
        print()
        
        # Create female profiles
        print("Creating female test profiles...")
        print("-" * 60)
        female_user_ids = await create_test_profiles()
        print()
        
        # Create matches
        print("Creating matches...")
        print("-" * 60)
        matches_created = await create_matches_with_test_user(test_user_id, female_user_ids)
        print()
        
        # Summary
        print("=" * 60)
        print("✅ TEST PROFILES SETUP COMPLETE")
        print("=" * 60)
        print(f"Female profiles created/verified: {len(female_user_ids)}")
        print(f"Matches created: {matches_created}")
        print()
        print("📝 Login credentials for all test profiles:")
        print("   Password: TestPass123")
        print()
        print("🎯 You can now:")
        print("   1. Login as testauth@ember.test")
        print("   2. Navigate to Matches page")
        print("   3. Start conversations to test voice messages")
        print()
        
        # List all profiles
        print("👥 Created profiles:")
        for user_id in female_user_ids:
            user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
            print(f"   • {user['name']} ({user['email']}) - {user['location']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
