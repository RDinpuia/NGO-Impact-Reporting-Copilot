"""
Upload API routes: file upload, list, and detail.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.auth.dependencies import get_current_user
from app.uploads.models import UploadResponse, UploadListItem
from app.uploads import service

router = APIRouter()

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls", "txt"}


@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload and process a data file (CSV, Excel, or TXT)."""
    # Validate file extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")

    # Read file content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    try:
        doc = await service.create_upload(current_user["id"], file.filename, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    return UploadResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        row_count=doc["row_count"],
        column_names=doc["column_names"],
        processed_data=doc["processed_data"],
        created_at=doc["created_at"],
    )


@router.get("/", response_model=list[UploadListItem])
async def list_uploads(current_user: dict = Depends(get_current_user)):
    """List all uploads for the current user."""
    docs = await service.get_uploads_for_user(current_user["id"])
    return [
        UploadListItem(
            id=str(d["_id"]),
            filename=d["filename"],
            file_type=d["file_type"],
            row_count=d["row_count"],
            created_at=d["created_at"],
        )
        for d in docs
    ]


@router.get("/{upload_id}", response_model=UploadResponse)
async def get_upload(upload_id: str, current_user: dict = Depends(get_current_user)):
    """Get full details of a specific upload."""
    doc = await service.get_upload_by_id(upload_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Upload not found")
    return UploadResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        row_count=doc["row_count"],
        column_names=doc["column_names"],
        processed_data=doc["processed_data"],
        created_at=doc["created_at"],
    )
