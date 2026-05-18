"""
MongoDB connection management using Motor (async driver).
Provides connect/close lifecycle functions and a get_db() accessor.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db():
    """Initialize MongoDB connection."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        # Verify connection
        await client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("   The app will continue but database operations will fail.")


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
