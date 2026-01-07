import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path('/app/backend/.env'))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def complete_profile():
    try:
        # Update the test user profile
        result = await db.users.update_one(
            {'email': 'testauth@ember.test'},
            {'$set': {
                'age': 28,
                'gender': 'man',
                'interested_in': 'women',
                'location': 'New York, NY',
                'bio': 'Test user for Ember Dating App | Tech enthusiast | Love exploring new places',
                'photos': [
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'
                ],
                'interests': ['Technology', 'Travel', 'Music', 'Food', 'Hiking'],
                'height': 178,
                'education': 'Masters',
                'dating_purpose': 'Long-term Relationship',
                'is_profile_complete': True,
                'verification_status': 'verified',
                'prompts': [
                    {'question': 'My ideal weekend', 'answer': 'Testing new features and apps!'},
                    {'question': 'Looking for', 'answer': 'Someone to test features with'}
                ]
            }}
        )
        
        if result.modified_count > 0:
            print("✅ Test user profile completed!")
            user = await db.users.find_one({'email': 'testauth@ember.test'}, {'_id': 0})
            print(f"   Name: {user['name']}")
            print(f"   Age: {user['age']}")
            print(f"   Location: {user['location']}")
            print(f"   Profile Complete: {user['is_profile_complete']}")
            print(f"   Verification: {user['verification_status']}")
            print("\n🎯 You can now access all features including Messages and Discover!")
        else:
            print("ℹ️ Profile was already complete or user not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

asyncio.run(complete_profile())
