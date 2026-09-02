from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.ingestion_service import IngestionService
from app.schemas.ingestion import IngestionUploadResponse, IngestionStatusResponse

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post("/upload", response_model=IngestionUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    source_type: str = Form("fir"),
    case_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ingests a document file, extracts entities, and stages them for human review."""
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    record, count, job_id = await IngestionService.process_document_upload(
        db=db,
        user_id=current_user.id,
        filename=file.filename or "uploaded_doc.txt",
        content=content,
        source_type=source_type,
        case_id=case_id,
        title=title or file.filename,
    )

    return IngestionUploadResponse(
        job_id=job_id,
        record_id=record.id,
        record_code=record.record_code,
        source_type=record.source_type,
        title=record.title,
        filename=file.filename or "uploaded_doc.txt",
        entities_extracted_count=count,
        status="completed",
        message=f"Document ingested successfully. {count} entities staged for human review.",
    )
