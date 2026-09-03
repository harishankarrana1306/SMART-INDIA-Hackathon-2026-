from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.postgres import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.audit import write_audit_log, verify_audit_chain
from app.schemas.audit import AuditLogResponse, AuditChainVerifyResponse, AuditRecordRequest

router = APIRouter(prefix="/audit", tags=["Audit & Cryptographic Chain"])


@router.post("/record", response_model=AuditLogResponse)
async def record_user_audit_action(
    payload: AuditRecordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Appends a real-time investigator or supervisor interaction/click event
    into the tamper-evident SHA-256 hash chain with real-time timestamp.
    """
    ts = datetime.now(timezone.utc)
    log_entry = await write_audit_log(
        db=db,
        action=payload.action,
        user_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        metadata=payload.metadata,
        custom_timestamp=ts,
    )
    await db.commit()
    await db.refresh(log_entry)
    ts_entry = log_entry.timestamp
    if ts_entry.tzinfo is None:
        ts_entry = ts_entry.replace(tzinfo=timezone.utc)
    return AuditLogResponse(
        id=log_entry.id,
        seq_no=log_entry.seq_no,
        user_id=log_entry.user_id,
        username=current_user.username,
        action=log_entry.action,
        target_type=log_entry.target_type,
        target_id=log_entry.target_id,
        metadata_json=log_entry.metadata_json,
        timestamp=ts_entry,
        prev_hash=log_entry.prev_hash,
        record_hash=log_entry.record_hash,
    )


@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = Query(None, description="Filter by action type"),
    current_user: User = Depends(require_role(["supervisor"])),
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
        ts_log = log.timestamp
        if ts_log.tzinfo is None:
            ts_log = ts_log.replace(tzinfo=timezone.utc)
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
                timestamp=ts_log,
                prev_hash=log.prev_hash,
                record_hash=log.record_hash,
            )
        )
    return logs_res


@router.get("/verify-chain", response_model=AuditChainVerifyResponse)
async def verify_chain_integrity(
    current_user: User = Depends(require_role(["supervisor"])),
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
        verified_at=datetime.now(timezone.utc),
    )
