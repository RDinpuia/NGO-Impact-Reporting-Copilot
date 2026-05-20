"""
Auto-seeder: creates a demo user and uploads sample data on first startup.
Runs once — skips if the demo user already exists.
"""

import os
import asyncio
from datetime import datetime
from app.database import get_db
from app.auth.service import hash_password
from app.uploads.processor import parse_file, process_dataframe


DEMO_EMAIL = "demo@impactlens.org"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo User"


async def seed_sample_data():
    """Seed the database with a demo user and sample dataset if empty."""
    try:
        await asyncio.wait_for(_do_seed(), timeout=30.0)
    except asyncio.TimeoutError:
        print("⚠️  Seeding timed out after 30 seconds, skipping.")
    except Exception as e:
        print(f"⚠️  Seeding failed (non-fatal): {e}")


async def _do_seed():
    """Internal seeding logic with error handling."""
    try:
        db = get_db()
    except RuntimeError as e:
        print(f"⚠️  Skipping seeding: {e}")
        return

    # Check if demo user already exists
    try:
        existing = await db.users.find_one({"email": DEMO_EMAIL})
    except Exception as e:
        print(f"⚠️  Skipping seeding: Database error: {e}")
        return
    if existing:
        print("ℹ️  Demo data already seeded, skipping.")
        return

    print("🌱 Seeding demo data...")

    try:
        # 1. Create demo user
        user_doc = {
            "name": DEMO_NAME,
            "email": DEMO_EMAIL,
            "password_hash": hash_password(DEMO_PASSWORD),
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        print(f"   ✅ Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

        # 2. Load and process sample CSV
        csv_path = os.path.join(os.path.dirname(__file__), "sample_data.csv")
        print(f"   📂 Reading CSV from: {csv_path}")
        with open(csv_path, "rb") as f:
            content = f.read()

        df = parse_file(content, "sample_data.csv")
        processed = process_dataframe(df)

        upload_doc = {
            "user_id": user_id,
            "filename": "sample_ngo_field_data.csv",
            "file_type": "csv",
            "row_count": len(df),
            "column_names": list(df.columns),
            "raw_data": df.fillna("").to_dict(orient="records"),
            "processed_data": processed,
            "created_at": datetime.utcnow(),
        }
        upload_result = await db.uploads.insert_one(upload_doc)
        print(f"   ✅ Uploaded sample dataset ({len(df)} rows)")

        # 3. Generate a sample report using mock AI
        from app.reports.ai_client import generate_report_content

        kpis = processed.get("kpis", {})
        sentiment = processed.get("sentiment", {})
        content = await generate_report_content(kpis, sentiment, "formal")

        report_doc = {
            "user_id": user_id,
            "upload_id": str(upload_result.inserted_id),
            "title": "Impact Report — Sample NGO Field Data",
            "tone": "formal",
            "content": content,
            "kpis": kpis,
            "sentiment": sentiment,
            "status": "completed",
            "created_at": datetime.utcnow(),
        }
        await db.reports.insert_one(report_doc)
        print("   ✅ Generated sample impact report")
        print(f"🎉 Seeding complete! Login with: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    except Exception as e:
        print(f"⚠️  Seeding step failed (non-fatal): {e}")
        import traceback
        traceback.print_exc()
