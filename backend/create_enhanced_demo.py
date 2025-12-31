"""
Create Enhanced Demo Profile for Discover Feed
Complete, realistic profile that serves as perfect example
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import bcrypt

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'ember_dating'

async def create_enhanced_demo_profile():
    """Create a complete, realistic demo profile"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Delete existing demo profile
    await db.users.delete_many({'is_demo': True})
    
    now = datetime.now(timezone.utc).isoformat()
    password = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt())
    
    # Create comprehensive demo profile
    demo_profile = {
        'user_id': 'user_demo_ember_2024',
        'email': 'demo@ember.app',
        'password': password.decode('utf-8'),
        'name': 'Alex Rivers',
        'age': 27,
        'gender': 'non-binary',
        'interested_in': 'everyone',
        
        # Comprehensive bio
        'bio': """🎨 Digital artist by day, stargazer by night | 🌍 Just back from backpacking Southeast Asia | 📚 Currently reading sci-fi and philosophy | 🎵 Indie folk enthusiast

Life's too short for small talk and bad coffee. I believe in meaningful connections, spontaneous road trips, and the magic of golden hour. 

You'll find me at local art galleries, farmers markets, or planning my next adventure. I make a mean homemade pasta and can teach you three chords on the guitar. 

Looking for someone who can appreciate both museum dates and hiking trails, who laughs at my terrible puns, and isn't afraid to be authentically themselves. Bonus points if you can recommend a good book or show me your favorite hidden spot in the city! ✨""",
        
        # High-quality photos (using diverse, professional portraits)
        'photos': [
            {
                'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1600&fit=crop',
                'public_id': 'demo_main_photo',
                'order': 0
            },
            {
                'url': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&h=1600&fit=crop',
                'public_id': 'demo_photo_2',
                'order': 1
            },
            {
                'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=1600&fit=crop',
                'public_id': 'demo_photo_3',
                'order': 2
            },
            {
                'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=1600&fit=crop',
                'public_id': 'demo_photo_4',
                'order': 3
            },
            {
                'url': 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=1200&h=1600&fit=crop',
                'public_id': 'demo_photo_5',
                'order': 4
            },
            {
                'url': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&h=1600&fit=crop',
                'public_id': 'demo_photo_6',
                'order': 5
            }
        ],
        
        # Video profile (optional)
        'video_url': None,
        'video_thumbnail': None,
        
        # Engaging prompts with personality
        'prompts': [
            {
                'question': 'My ideal Sunday morning...',
                'answer': 'Sleeping in until 9 (that\'s late for me!), making pour-over coffee while jazz plays softly, then heading to the farmers market for fresh flowers and overpriced pastries. Bonus: spontaneous brunch with friends or a long walk in the park with no destination in mind. Perfect if it ends with discovering a new bookshop or cafe I\'ve never been to!'
            },
            {
                'question': 'I\'m looking for...',
                'answer': 'Someone who can make me laugh until my face hurts, isn\'t afraid to be vulnerable, and is genuinely curious about the world. You should be comfortable with both deep 2am conversations and comfortable silence. I want a best friend who also makes my heart race - someone who\'ll join me on adventures but also loves cozy nights in. Authenticity over perfection, always.'
            },
            {
                'question': 'The way to win me over is...',
                'answer': 'Show me your favorite place in the city and tell me why it matters to you. Share your weirdest passion or hobby without apologizing for it. Cook me your signature dish (even if it\'s just really good toast). Make me a playlist. Ask me about my art. Be kind to servers and animals. Remember small things I mention. Just... be genuinely yourself. That\'s it.'
            }
        ],
        
        # Diverse, relatable interests
        'interests': [
            'Art & Museums',
            'Travel',
            'Coffee',
            'Reading',
            'Live Music',
            'Photography',
            'Hiking',
            'Cooking',
            'Yoga',
            'Stargazing'
        ],
        
        # Location (San Francisco - tech hub, diverse city)
        'location': 'San Francisco, CA',
        'location_details': {
            'city': 'San Francisco',
            'state': 'California',
            'country': 'United States',
            'latitude': 37.7749,
            'longitude': -122.4194,
            'coordinates': [-122.4194, 37.7749]
        },
        
        # Complete profile details
        'height': 175,  # 5'9" - average height
        'education': "Bachelor's Degree",
        'job_title': 'Digital Artist & UX Designer',
        'company': 'Freelance',
        'school': 'UC Berkeley',
        'religion': 'Spiritual but not religious',
        'politics': 'Liberal',
        'drinking': 'Socially',
        'smoking': 'Never',
        'drugs': 'Never',
        'has_children': 'No',
        'wants_children': 'Open to it',
        'languages': ['English', 'Spanish', 'Learning French'],
        'ethnicity': 'Mixed',
        'zodiac': 'Gemini',
        
        # Dating preferences
        'dating_purpose': 'Long-term relationship',
        'looking_for_gender': 'everyone',
        'age_preference_min': 24,
        'age_preference_max': 35,
        'distance_preference': 50,
        
        # Verification status
        'verification_status': 'verified',
        'verified_at': now,
        'verification_method': 'photo',
        
        # Profile completion
        'is_profile_complete': True,
        'profile_completion_percentage': 100,
        
        # Status flags
        'is_premium': False,
        'is_ambassador': False,
        'is_demo': True,  # Special demo flag
        'is_active': True,
        'is_online': True,
        
        # Swipe limits (full limits for demo)
        'daily_swipes': 10,
        'daily_super_likes': 3,
        'daily_roses': 1,
        'swipes_reset_at': now,
        'super_likes_reset_at': now,
        'roses_reset_at': now,
        
        # Notification settings (all enabled for demo)
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
        
        # FCM token (optional)
        'fcm_token': None,
        
        # Premium details
        'premium_until': None,
        'subscription_type': None,
        
        # Ambassador status
        'ambassador_status': 'none',
        'ambassador_applied_at': None,
        
        # Timestamps
        'created_at': (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),  # Account 30 days old
        'updated_at': now,
        'last_active': now,
        
        # Additional metadata
        'app_version': '1.0.0',
        'device_type': 'web',
        'login_count': 42,
        'profile_views': 0,
        'likes_sent': 0,
        'likes_received': 0,
        'matches_count': 0
    }
    
    # Insert demo profile
    result = await db.users.insert_one(demo_profile)
    
    print("=" * 60)
    print("✅ ENHANCED DEMO PROFILE CREATED")
    print("=" * 60)
    print(f"Name: {demo_profile['name']}")
    print(f"Age: {demo_profile['age']}")
    print(f"User ID: {demo_profile['user_id']}")
    print(f"Email: {demo_profile['email']}")
    print(f"Password: demo123")
    print(f"Location: {demo_profile['location']}")
    print(f"Verified: {demo_profile['verification_status']}")
    print(f"Profile Complete: {demo_profile['is_profile_complete']}")
    print("-" * 60)
    print(f"Photos: {len(demo_profile['photos'])} high-quality images")
    print(f"Prompts: {len(demo_profile['prompts'])} thoughtful answers")
    print(f"Interests: {len(demo_profile['interests'])} selected")
    print(f"Bio Length: {len(demo_profile['bio'])} characters")
    print("-" * 60)
    print("\n📊 Profile Stats:")
    print(f"  - Complete Bio: ✅")
    print(f"  - 6 Photos: ✅")
    print(f"  - 3 Prompts: ✅")
    print(f"  - 10 Interests: ✅")
    print(f"  - All Fields Filled: ✅")
    print(f"  - Verified Badge: ✅")
    print(f"  - Height: {demo_profile['height']} cm (5'9\")")
    print(f"  - Education: {demo_profile['education']}")
    print(f"  - Job: {demo_profile['job_title']}")
    print(f"  - Languages: {', '.join(demo_profile['languages'])}")
    print("\n🎯 How to Use:")
    print("  1. Demo profile will appear in Discover feed")
    print("  2. Users can swipe/like this profile")
    print("  3. Perfect example of complete profile")
    print("  4. Used in onboarding tour")
    print("\n🔑 Login Credentials:")
    print("  Email: demo@ember.app")
    print("  Password: demo123")
    print("\n🔍 Database Query:")
    print("  db.users.findOne({ is_demo: true })")
    print("  db.users.findOne({ email: 'demo@ember.app' })")
    print("=" * 60)
    
    client.close()
    return demo_profile

if __name__ == "__main__":
    profile = asyncio.run(create_enhanced_demo_profile())
    print("\n🎉 Enhanced demo profile is ready!")
    print("🔥 This profile will appear in everyone's Discover feed!")
