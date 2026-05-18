"""
Pydantic models for file uploads and processed data responses.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Any


class UploadResponse(BaseModel):
    """Full upload details including processed data."""
    id: str
    user_id: str
    filename: str
    file_type: str
    row_count: int
    column_names: list[str]
    processed_data: dict[str, Any]
    created_at: datetime


class UploadListItem(BaseModel):
    """Compact upload item for list views."""
    id: str
    filename: str
    file_type: str
    row_count: int
    created_at: datetime
