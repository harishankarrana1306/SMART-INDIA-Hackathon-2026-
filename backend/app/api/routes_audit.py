from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.postgres import get_db
from app.deps import require_role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.audit import verify_audit_chain
from app.schemas.audit import AuditLogResponse, AuditChainVerifyResponse

router = APIRouter(prefix="/audit", tags=["Audit & Cryptographic Chain"])


@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = Query(None, description="Filter by action type"),
    current_user: User = Depends(require_role(["supervisor", "administrator"])),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.seq_no))
    )
    if action:
        query = query.where(AuditLog.action == action)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    logs_res = []
    for log, uname in result.all():
        logs_res.append(
            AuditLogResponse(
                id=log.id,
                seq_no=log.seq_no,
                user_id=log.user_id,
                username=uname or "System",
                action=log.action,
                target_type=log.target_type,
                target_id=log.target_id,
                metadata_json=log.metadata_json,
                timestamp=log.timestamp,
                prev_hash=log.prev_hash,
                record_hash=log.record_hash,
            )
        )
    return logs_res


@router.get("/verify-chain", response_model=AuditChainVerifyResponse)
async def verify_chain_integrity(
    current_user: User = Depends(require_role(["supervisor", "administrator"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Cryptographically verifies the append-only SHA-256 hash chain from genesis to head.
    Detects any record alteration, deletion, or sequence gap.
    """
    is_valid, total_records, first_broken_seq = await verify_audit_chain(db)
    
    if is_valid:
        msg = f"Cryptographic integrity verified. All {total_records} sequence blocks are valid."
    else:
        msg = f"TAMPER ALERT: Cryptographic chain verification failed at sequence #{first_broken_seq}."

    return AuditChainVerifyResponse(
        valid=is_valid,
        total_records=total_records,
        first_broken_seq=first_broken_seq,
        message=msg,
        verified_at=datetime.utcnow(),
    )
