"""
Report API routes: generate, list, detail, and PDF export.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from io import BytesIO
from app.auth.dependencies import get_current_user
from app.reports.models import (
    GenerateReportRequest, ReportResponse, ReportListItem, ReportContent,
)
from app.reports import service
from app.reports.pdf_generator import generate_pdf

router = APIRouter()


@router.post("/generate", response_model=ReportResponse, status_code=201)
async def generate_report(
    data: GenerateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate an AI-powered impact report from an upload."""
    try:
        doc = await service.create_report(
            user_id=current_user["id"],
            upload_id=data.upload_id,
            tone=data.tone,
            title=data.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    return _doc_to_response(doc)


@router.get("/", response_model=list[ReportListItem])
async def list_reports(current_user: dict = Depends(get_current_user)):
    """List all reports for the current user."""
    docs = await service.get_reports_for_user(current_user["id"])
    return [
        ReportListItem(
            id=str(d["_id"]),
            title=d["title"],
            tone=d["tone"],
            status=d["status"],
            upload_id=d["upload_id"],
            created_at=d["created_at"],
        )
        for d in docs
    ]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Get full details of a specific report."""
    doc = await service.get_report_by_id(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return _doc_to_response(doc)


@router.get("/{report_id}/pdf")
async def download_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    """Generate and download a PDF version of the report."""
    doc = await service.get_report_by_id(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    # Build data dict for PDF generator
    pdf_data = {
        "title": doc["title"],
        "tone": doc["tone"],
        "content": doc.get("content", {}),
        "kpis": doc.get("kpis", {}),
        "sentiment": doc.get("sentiment", {}),
        "created_at": doc["created_at"].strftime("%B %d, %Y"),
    }

    pdf_bytes = generate_pdf(pdf_data)
    filename = f"{doc['title'].replace(' ', '_')}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _doc_to_response(doc: dict) -> ReportResponse:
    """Convert a MongoDB document to a ReportResponse."""
    content = doc.get("content", {})
    return ReportResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        upload_id=doc["upload_id"],
        title=doc["title"],
        tone=doc["tone"],
        content=ReportContent(**content) if isinstance(content, dict) else ReportContent(),
        kpis=doc.get("kpis", {}),
        sentiment=doc.get("sentiment", {}),
        status=doc["status"],
        created_at=doc["created_at"],
    )
