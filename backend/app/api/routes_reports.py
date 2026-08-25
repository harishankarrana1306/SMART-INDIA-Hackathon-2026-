from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.report_service import ReportService
from app.schemas.report import (
    ExecutiveCaseBriefSchema,
    GenerateBriefRequest,
)

router = APIRouter(prefix="/reports", tags=["Executive Reports & Briefs"])


@router.get("/brief/{case_id}", response_model=ExecutiveCaseBriefSchema)
async def get_case_brief(
    case_id: str,
    notes: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates and retrieves structured JSON case intelligence brief."""
    try:
        brief_dict, _ = await ReportService.build_case_brief(
            db=db,
            case_id=case_id,
            user=current_user,
            custom_notes=notes,
        )
        return ExecutiveCaseBriefSchema(**brief_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/brief/{case_id}/pdf")
async def export_case_brief_pdf(
    case_id: str,
    notes: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Exports standardized, court-admissible decision-support PDF brief."""
    try:
        brief_dict, pdf_bytes = await ReportService.build_case_brief(
            db=db,
            case_id=case_id,
            user=current_user,
            custom_notes=notes,
        )
        filename = f"Executive_Brief_{brief_dict['case_code']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/generate", response_model=ExecutiveCaseBriefSchema)
async def generate_brief(
    payload: GenerateBriefRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates and stores executive case brief with SHA-256 custody seal."""
    try:
        brief_dict, _ = await ReportService.build_case_brief(
            db=db,
            case_id=payload.case_id,
            user=current_user,
            custom_notes=payload.custom_notes,
        )
        return ExecutiveCaseBriefSchema(**brief_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
