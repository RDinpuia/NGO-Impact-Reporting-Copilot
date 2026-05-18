"""
Dashboard service: aggregates KPIs and chart data across all user uploads.
"""

from app.database import get_db


async def get_dashboard_stats(user_id: str) -> dict:
    """Aggregate statistics from all uploads belonging to this user."""
    db = get_db()
    uploads = await db.uploads.find(
        {"user_id": user_id},
        {"processed_data": 1, "filename": 1, "created_at": 1, "row_count": 1},
    ).sort("created_at", -1).to_list(length=100)

    if not uploads:
        return _empty_stats()

    # Aggregate KPIs across all uploads
    total_beneficiaries = 0
    total_activities = 0
    attendance_values = []
    sentiment_totals = {"positive": 0, "negative": 0, "neutral": 0}
    region_counts: dict[str, int] = {}
    monthly_data: dict[str, dict] = {}
    distribution_counts: dict[str, int] = {}

    for upload in uploads:
        pd_data = upload.get("processed_data", {})
        kpis = pd_data.get("kpis", {})

        total_beneficiaries += kpis.get("total_beneficiaries", 0)
        total_activities += kpis.get("total_activities", 0)
        if "avg_attendance" in kpis:
            attendance_values.append(kpis["avg_attendance"])

        # Sentiment
        sentiment = pd_data.get("sentiment", {})
        for key in ("positive", "negative", "neutral"):
            sentiment_totals[key] += sentiment.get(key, 0)

        # Region breakdown
        for item in pd_data.get("region_breakdown", []):
            name = item["name"]
            region_counts[name] = region_counts.get(name, 0) + item["count"]

        # Monthly trends
        for item in pd_data.get("monthly_trends", []):
            month = item["month"]
            if month not in monthly_data:
                monthly_data[month] = {"month": month, "value": 0, "count": 0}
            monthly_data[month]["value"] += item.get("value", 0)
            monthly_data[month]["count"] += item.get("count", 0)

        # Beneficiary distribution
        for item in pd_data.get("beneficiary_distribution", []):
            name = item["name"]
            distribution_counts[name] = distribution_counts.get(name, 0) + item["count"]

    sentiment_total = sum(sentiment_totals.values())
    avg_attendance = round(sum(attendance_values) / len(attendance_values), 1) if attendance_values else 0

    return {
        "kpis": {
            "total_beneficiaries": total_beneficiaries,
            "total_activities": total_activities,
            "avg_attendance": avg_attendance,
            "sentiment_score": round(sentiment_totals["positive"] / max(sentiment_total, 1) * 100, 1),
            "total_uploads": len(uploads),
        },
        "sentiment": {
            **sentiment_totals,
            "total": sentiment_total,
        },
        "region_breakdown": sorted(
            [{"name": k, "count": v} for k, v in region_counts.items()],
            key=lambda x: x["count"], reverse=True,
        )[:10],
        "monthly_trends": sorted(monthly_data.values(), key=lambda x: x["month"]),
        "beneficiary_distribution": [{"name": k, "count": v} for k, v in distribution_counts.items()],
        "recent_uploads": [
            {"id": str(u["_id"]), "filename": u["filename"], "row_count": u["row_count"], "created_at": u["created_at"].isoformat()}
            for u in uploads[:5]
        ],
    }


def _empty_stats() -> dict:
    return {
        "kpis": {
            "total_beneficiaries": 0,
            "total_activities": 0,
            "avg_attendance": 0,
            "sentiment_score": 0,
            "total_uploads": 0,
        },
        "sentiment": {"positive": 0, "negative": 0, "neutral": 0, "total": 0},
        "region_breakdown": [],
        "monthly_trends": [],
        "beneficiary_distribution": [],
        "recent_uploads": [],
    }
