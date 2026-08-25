from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.case import Case
from app.models.record import SourceRecord
from app.models.entity import GraphEntity
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    DashboardTotals,
    CaseSummary,
    ActivityItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total counts
    cases_count = (await db.execute(select(func.count(Case.id)))).scalar() or 0
    entities_count = (await db.execute(select(func.count(GraphEntity.id)))).scalar() or 0
    records_count = (await db.execute(select(func.count(SourceRecord.id)))).scalar() or 0
    alerts_count = (await db.execute(select(func.count(Alert.id)))).scalar() or 0
    audit_count = (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0

    # Recent cases
    cases_query = select(Case).order_by(desc(Case.created_at)).limit(6)
    cases_res = await db.execute(cases_query)
    cases_list = cases_res.scalars().all()

    # Query source record counts per case in a single group_by
    rec_counts_res = await db.execute(
        select(SourceRecord.case_id, func.count(SourceRecord.id)).group_by(SourceRecord.case_id)
    )
    rec_counts_map = dict(rec_counts_res.all())

    recent_cases = [
        CaseSummary(
            id=c.id,
            case_code=c.case_code,
            title=c.title,
            case_type=c.case_type,
            status=c.status,
            opened_on=str(c.opened_on) if c.opened_on else None,
            records_count=rec_counts_map.get(c.id, 0),
            entities_count=0,
        )
        for c in cases_list
    ]

    # Recent activity from audit logs
    audit_query = (
        select(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
    )
    audit_res = await db.execute(audit_query)
    recent_activity = []
    for log, uname in audit_res.all():
        recent_activity.append(
            ActivityItem(
                id=log.id,
                action=log.action,
                user=uname or "System",
                target_type=log.target_type,
                target_id=log.target_id,
                timestamp=log.timestamp,
                metadata=log.metadata_json,
            )
        )

    return DashboardSummaryResponse(
        totals=DashboardTotals(
            total_cases=cases_count,
            total_entities=entities_count,
            total_records=records_count,
            total_alerts=alerts_count,
            total_audit_events=audit_count,
        ),
        recent_cases=recent_cases,
        recent_activity=recent_activity,
        disclaimer="Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
    )
