"""
Database Index Creation Script
Creates all necessary indexes for optimal query performance
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'ember_dating'

async def create_indexes():
    """Create all database indexes"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Creating indexes for Ember Dating App...")
    
    # Users collection indexes
    print("Creating users indexes...")
    await db.users.create_index('user_id', unique=True)
    await db.users.create_index('email', unique=True)
    await db.users.create_index('verification_status')
    await db.users.create_index('is_premium')
    await db.users.create_index('is_ambassador')
    await db.users.create_index([('location_details.coordinates', '2dsphere')])  # Geospatial
    await db.users.create_index('created_at')
    
    # Likes collection indexes
    print("Creating likes indexes...")
    await db.likes.create_index([('liker_id', 1), ('liked_user_id', 1)], unique=True)
    await db.likes.create_index('liked_user_id')
    await db.likes.create_index('like_type')
    await db.likes.create_index('created_at')
    
    # Matches collection indexes
    print("Creating matches indexes...")
    await db.matches.create_index([('user1_id', 1), ('user2_id', 1)], unique=True)
    await db.matches.create_index('user1_id')
    await db.matches.create_index('user2_id')
    await db.matches.create_index('expires_at')
    await db.matches.create_index('created_at')
    
    # Messages collection indexes
    print("Creating messages indexes...")
    await db.messages.create_index('match_id')
    await db.messages.create_index([('match_id', 1), ('created_at', -1)])  # Compound for sorting
    await db.messages.create_index('sender_id')
    await db.messages.create_index('created_at')
    
    # Blocks collection indexes
    print("Creating blocks indexes...")
    await db.blocks.create_index([('blocker_id', 1), ('blocked_id', 1)], unique=True)
    await db.blocks.create_index('blocker_id')
    await db.blocks.create_index('blocked_id')
    
    # Reports collection indexes
    print("Creating reports indexes...")
    await db.reports.create_index('reporter_id')
    await db.reports.create_index('reported_user_id')
    await db.reports.create_index('created_at')
    
    # Notifications collection indexes
    print("Creating notifications indexes...")
    await db.notifications.create_index('user_id')
    await db.notifications.create_index([('user_id', 1), ('created_at', -1)])
    await db.notifications.create_index('read')
    
    # Payment transactions indexes
    print("Creating payment_transactions indexes...")
    await db.payment_transactions.create_index('user_id')
    await db.payment_transactions.create_index('session_id', unique=True)
    await db.payment_transactions.create_index('payment_status')
    await db.payment_transactions.create_index('created_at')
    
    # Icebreaker sessions indexes
    print("Creating icebreaker_sessions indexes...")
    await db.icebreaker_sessions.create_index('session_id', unique=True)
    await db.icebreaker_sessions.create_index('match_id')
    await db.icebreaker_sessions.create_index('created_at')
    
    # Virtual gifts indexes
    print("Creating virtual_gifts indexes...")
    await db.virtual_gifts.create_index('sender_id')
    await db.virtual_gifts.create_index('receiver_id')
    await db.virtual_gifts.create_index('match_id')
    await db.virtual_gifts.create_index('created_at')
    
    # Daily picks indexes
    print("Creating daily_picks indexes...")
    await db.daily_picks.create_index([('user_id', 1), ('date', 1)], unique=True)
    await db.daily_picks.create_index('user_id')
    await db.daily_picks.create_index('date')
    
    print("\n✅ All indexes created successfully!")
    
    # List all indexes
    print("\n📊 Index Summary:")
    collections = await db.list_collection_names()
    for collection_name in sorted(collections):
        collection = db[collection_name]
        indexes = await collection.index_information()
        print(f"\n{collection_name}: {len(indexes)} indexes")
        for idx_name, idx_info in indexes.items():
            print(f"  - {idx_name}: {idx_info.get('key', [])}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())
