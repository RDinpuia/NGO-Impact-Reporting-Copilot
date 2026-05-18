"""
Pydantic models for report generation and responses.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Literal


class GenerateReportRequest(BaseModel):
    """Request to generate an AI impact report."""
    upload_id: str
    tone: Literal["formal", "storytelling", "concise"] = "formal"
    title: str = ""


class ReportContent(BaseModel):
    """Structured content of a generated report."""
    executive_summary: str = ""
    key_metrics: str = ""
    impact_narrative: str = ""
    challenges_recommendations: str = ""


class ReportResponse(BaseModel):
    """Full report details."""
    id: str
    user_id: str
    upload_id: str
    title: str
    tone: str
    content: ReportContent
    kpis: dict[str, Any]
    sentiment: dict[str, Any]
    status: str
    created_at: datetime


class ReportListItem(BaseModel):
    """Compact report item for list views."""
    id: str
    title: str
    tone: str
    status: str
    upload_id: str
    created_at: datetime
