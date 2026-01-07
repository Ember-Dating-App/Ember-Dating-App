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

async def delete_test_profiles():
    """Delete all test profiles and associated data"""
    
    test_emails = [
        'emma.test@ember.app',
        'sophie.test@ember.app',
        'maya.test@ember.app',
        'isabella.test@ember.app',
        'olivia.test@ember.app'
    ]
    
    print("=" * 60)
    print("DELETING TEST PROFILES")
    print("=" * 60)
    
    deleted_users = []
    
    for email in test_emails:
        # Find user
        user = await db.users.find_one({'email': email}, {'_id': 0})
        if user:
            user_id = user['user_id']
            deleted_users.append(user_id)
            
            # Delete user
            await db.users.delete_one({'user_id': user_id})
            print(f"✓ Deleted user: {user['name']} ({email})")
        else:
            print(f"✗ User not found: {email}")
    
    print()
    print("Deleting associated data...")
    print("-" * 60)
    
    # Delete matches
    match_result = await db.matches.delete_many({
        '$or': [
            {'user1_id': {'$in': deleted_users}},
            {'user2_id': {'$in': deleted_users}}
        ]
    })
    print(f"✓ Deleted {match_result.deleted_count} matches")
    
    # Delete messages
    message_result = await db.messages.delete_many({
        '$or': [
            {'sender_id': {'$in': deleted_users}},
            {'receiver_id': {'$in': deleted_users}}
        ]
    })
    print(f"✓ Deleted {message_result.deleted_count} messages")
    
    # Delete likes/swipes
    swipe_result = await db.swipes.delete_many({
        '$or': [
            {'user_id': {'$in': deleted_users}},
            {'target_user_id': {'$in': deleted_users}}
        ]
    })
    print(f"✓ Deleted {swipe_result.deleted_count} swipes/likes")
    
    print()
    print("=" * 60)
    print("✅ CLEANUP COMPLETE")
    print("=" * 60)
    print(f"Total users deleted: {len(deleted_users)}")
    print(f"Total matches deleted: {match_result.deleted_count}")
    print(f"Total messages deleted: {message_result.deleted_count}")
    print(f"Total swipes deleted: {swipe_result.deleted_count}")
    print()
    print("All test profiles have been removed from the database.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_test_profiles())
