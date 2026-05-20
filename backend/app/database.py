"""
MongoDB connection management using Motor (async driver).
Provides connect/close lifecycle functions and a get_db() accessor.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db():
    """Initialize MongoDB connection."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        # Verify connection with a timeout
        try:
            await asyncio.wait_for(client.admin.command("ping"), timeout=5.0)
            print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
        except asyncio.TimeoutError:
            print(f"⚠️  MongoDB ping timeout, but continuing...")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("   The app will continue but database operations will fail.")
        client = None
        db = None


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Get the database instance. Raises if not connected."""
    if db is None:
        raise RuntimeError("Database not connected. Check MongoDB connection.")
    return db
