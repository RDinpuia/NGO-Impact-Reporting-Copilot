"""
Dashboard API route: aggregated statistics endpoint.
"""

from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.dashboard.service import get_dashboard_stats

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get aggregated dashboard statistics for the current user."""
    return await get_dashboard_stats(current_user["id"])
