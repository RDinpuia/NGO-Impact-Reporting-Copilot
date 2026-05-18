"""
Report service: handles report generation, storage, and retrieval.
"""

from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.reports.ai_client import generate_report_content


async def create_report(user_id: str, upload_id: str, tone: str, title: str) -> dict:
    """Generate an AI report from an upload's processed data."""
    db = get_db()

    # Fetch the upload
    upload = await db.uploads.find_one({
        "_id": ObjectId(upload_id),
        "user_id": user_id,
    })
    if not upload:
        raise ValueError("Upload not found")

    processed = upload.get("processed_data", {})
    kpis = processed.get("kpis", {})
    sentiment = processed.get("sentiment", {})

    # Auto-generate title if not provided
    if not title:
        title = f"Impact Report — {upload['filename']}"

    # Create initial report document with 'generating' status
    doc = {
        "user_id": user_id,
        "upload_id": upload_id,
        "title": title,
        "tone": tone,
        "content": {},
        "kpis": kpis,
        "sentiment": sentiment,
        "status": "generating",
        "created_at": datetime.utcnow(),
    }
    result = await db.reports.insert_one(doc)
    report_id = result.inserted_id

    try:
        # Generate content via AI (or mock)
        content = await generate_report_content(kpis, sentiment, tone)
        await db.reports.update_one(
            {"_id": report_id},
            {"$set": {"content": content, "status": "completed"}},
        )
        doc["content"] = content
        doc["status"] = "completed"
    except Exception as e:
        await db.reports.update_one(
            {"_id": report_id},
            {"$set": {"status": "failed", "error": str(e)}},
        )
        doc["status"] = "failed"

    doc["_id"] = report_id
    return doc


async def get_reports_for_user(user_id: str) -> list[dict]:
    """List all reports for a user, newest first."""
    db = get_db()
    cursor = db.reports.find(
        {"user_id": user_id},
        {"content": 0},  # Exclude large content from listing
    ).sort("created_at", -1)
    return await cursor.to_list(length=100)


async def get_report_by_id(report_id: str, user_id: str) -> dict | None:
    """Get a single report by ID, scoped to the user."""
    db = get_db()
    return await db.reports.find_one({
        "_id": ObjectId(report_id),
        "user_id": user_id,
    })
