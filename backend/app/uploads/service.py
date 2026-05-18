"""
Upload service: handles file storage and retrieval from MongoDB.
"""

from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.uploads.processor import parse_file, process_dataframe


async def create_upload(user_id: str, filename: str, content: bytes) -> dict:
    """Parse a file, process it, and store everything in MongoDB."""
    db = get_db()
    file_type = filename.rsplit(".", 1)[-1].lower()

    # Parse and process
    df = parse_file(content, filename)
    processed = process_dataframe(df)

    # Build document
    doc = {
        "user_id": user_id,
        "filename": filename,
        "file_type": file_type,
        "row_count": len(df),
        "column_names": list(df.columns),
        "raw_data": df.fillna("").to_dict(orient="records"),
        "processed_data": processed,
        "created_at": datetime.utcnow(),
    }

    result = await db.uploads.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_uploads_for_user(user_id: str) -> list[dict]:
    """List all uploads for a user, newest first."""
    db = get_db()
    cursor = db.uploads.find(
        {"user_id": user_id},
        {"raw_data": 0},  # Exclude large field from listing
    ).sort("created_at", -1)
    return await cursor.to_list(length=100)


async def get_upload_by_id(upload_id: str, user_id: str) -> dict | None:
    """Get a single upload by ID, scoped to the user."""
    db = get_db()
    return await db.uploads.find_one({
        "_id": ObjectId(upload_id),
        "user_id": user_id,
    })
