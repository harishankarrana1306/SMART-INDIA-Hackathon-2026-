from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.alert_service import AlertService
from app.schemas.alert import (
    AlertSchema,
    AlertReviewRequest,
    AlertDismissRequest,
    AlertScanResponse,
)

router = APIRouter(prefix="/alerts", tags=["Investigative Alerts"])


@router.get("", response_model=List[AlertSchema])
async def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists advisory pattern alerts with optional severity and review status filters."""
    alerts = await AlertService.list_alerts(
        db=db,
        severity=severity,
        status=status,
        limit=limit,
        offset=offset,
    )
    return [
        AlertSchema(
            id=a.id,
            rule_name=a.rule_name,
            title=a.title,
            description=a.description,
            severity=a.severity,
            threshold_description=a.threshold_description,
            supporting_entity_ids=a.supporting_entity_ids or [],
            supporting_record_ids=a.supporting_record_ids or [],
            status=a.status,
            reviewed_by=a.reviewed_by,
            reviewed_at=a.reviewed_at,
            review_notes=a.review_notes,
            created_at=a.created_at,
        )
        for a in alerts
    ]


@router.post("/scan", response_model=AlertScanResponse)
async def scan_pattern_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Executes rule-based graph pattern detectors and stages new advisory alerts."""
    new_count, total_active = await AlertService.scan_and_stage_alerts(db, current_user.id)
    return AlertScanResponse(
        new_alerts_count=new_count,
        total_active_alerts=total_active,
        message=f"Scan complete. {new_count} new advisory pattern alerts detected.",
    )


@router.post("/{id}/acknowledge", response_model=AlertSchema)
async def acknowledge_alert(
    id: str,
    payload: AlertReviewRequest = AlertReviewRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledges an advisory alert as actively evaluated by an investigator."""
    try:
        a = await AlertService.acknowledge_alert(db, id, current_user, payload.notes)
        return AlertSchema(
            id=a.id,
            rule_name=a.rule_name,
            title=a.title,
            description=a.description,
            severity=a.severity,
            threshold_description=a.threshold_description,
            supporting_entity_ids=a.supporting_entity_ids or [],
            supporting_record_ids=a.supporting_record_ids or [],
            status=a.status,
            reviewed_by=a.reviewed_by,
            reviewed_at=a.reviewed_at,
            review_notes=a.review_notes,
            created_at=a.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/dismiss", response_model=AlertSchema)
async def dismiss_alert(
    id: str,
    payload: AlertDismissRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismisses an advisory alert with audited justification."""
    try:
        a = await AlertService.dismiss_alert(db, id, current_user, payload.reason)
        return AlertSchema(
            id=a.id,
            rule_name=a.rule_name,
            title=a.title,
            description=a.description,
            severity=a.severity,
            threshold_description=a.threshold_description,
            supporting_entity_ids=a.supporting_entity_ids or [],
            supporting_record_ids=a.supporting_record_ids or [],
            status=a.status,
            reviewed_by=a.reviewed_by,
            reviewed_at=a.reviewed_at,
            review_notes=a.review_notes,
            created_at=a.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
