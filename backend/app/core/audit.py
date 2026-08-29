"""
Tamper-Evident SHA-256 Audit Log Hash Chain Engine
=================================================
Note: This is an append-only, tamper-evident cryptographic log chain within PostgreSQL/SQLite.
It is explicitly NOT a cryptocurrency, token, or distributed blockchain. It provides cryptographic
verification and chain-of-custody for law enforcement compliance and investigation integrity.
"""

import asyncio
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

GENESIS_PREV_HASH = "0" * 64
_audit_lock = asyncio.Lock()
_cached_seq_no: Optional[int] = None
_cached_prev_hash: Optional[str] = None


def reset_audit_cache():
    """Resets in-memory audit cache when database is reseeded."""
    global _cached_seq_no, _cached_prev_hash
    _cached_seq_no = None
    _cached_prev_hash = None


def canonical_metadata_string(metadata: Optional[Dict[str, Any]]) -> str:
    """Returns deterministic sorted JSON representation of metadata dict."""
    if not metadata:
        return "{}"
    return json.dumps(metadata, sort_keys=True, separators=(",", ":"))


def compute_audit_hash(
    seq_no: int,
    user_id: Optional[str],
    action: str,
    target_type: Optional[str],
    target_id: Optional[str],
    metadata_json_str: str,
    iso_timestamp: str,
    prev_hash: str,
) -> str:
    """Computes SHA-256 cryptographic digest of a log entry block."""
    raw_payload = (
        f"{seq_no}||"
        f"{user_id or ''}||"
        f"{action}||"
        f"{target_type or ''}||"
        f"{target_id or ''}||"
        f"{metadata_json_str}||"
        f"{iso_timestamp}||"
        f"{prev_hash}"
    )
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()


async def write_audit_log(
    db: AsyncSession,
    action: str,
    user_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    custom_timestamp: Optional[datetime] = None,
) -> AuditLog:
    """
    Appends a new audit record to the tamper-evident hash chain within the current database transaction.
    Guarantees strict monotonicity and uniqueness across high-concurrency requests.
    """
    global _cached_seq_no, _cached_prev_hash

    async with _audit_lock:
        if _cached_seq_no is None:
            # Query last persistent entry in database
            query = select(AuditLog).order_by(desc(AuditLog.seq_no)).limit(1)
            result = await db.execute(query)
            last_log = result.scalar_one_or_none()
            if last_log:
                _cached_seq_no = last_log.seq_no
                _cached_prev_hash = last_log.record_hash
            else:
                _cached_seq_no = 0
                _cached_prev_hash = GENESIS_PREV_HASH

        seq_no = _cached_seq_no + 1
        prev_hash = _cached_prev_hash or GENESIS_PREV_HASH

        ts = custom_timestamp or datetime.now(timezone.utc)
        iso_ts = ts.strftime("%Y-%m-%dT%H:%M:%S")
        meta_str = canonical_metadata_string(metadata)
        uid_str = str(user_id) if user_id is not None else None

        record_hash = compute_audit_hash(
            seq_no=seq_no,
            user_id=uid_str,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json_str=meta_str,
            iso_timestamp=iso_ts,
            prev_hash=prev_hash,
        )

        log_entry = AuditLog(
            seq_no=seq_no,
            user_id=uid_str,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata,
            timestamp=ts,
            prev_hash=prev_hash,
            record_hash=record_hash,
        )

        db.add(log_entry)
        try:
            await db.flush()
            _cached_seq_no = seq_no
            _cached_prev_hash = record_hash
        except Exception:
            # If a collision happens from an uncommitted external transaction, reload cache
            _cached_seq_no = None
            _cached_prev_hash = None
            raise

        return log_entry


def write_sync_audit_log(
    db: Session,
    action: str,
    user_id: Optional[Any] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    custom_timestamp: Optional[datetime] = None,
) -> AuditLog:
    """Synchronous version for seeding script and migration hooks."""
    last_log = db.query(AuditLog).order_by(desc(AuditLog.seq_no)).first()

    if last_log:
        seq_no = last_log.seq_no + 1
        prev_hash = last_log.record_hash
    else:
        seq_no = 1
        prev_hash = GENESIS_PREV_HASH

    ts = custom_timestamp or datetime.now(timezone.utc)
    iso_ts = ts.strftime("%Y-%m-%dT%H:%M:%S")
    meta_str = canonical_metadata_string(metadata)
    uid_str = str(user_id) if user_id is not None else None

    record_hash = compute_audit_hash(
        seq_no=seq_no,
        user_id=uid_str,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json_str=meta_str,
        iso_timestamp=iso_ts,
        prev_hash=prev_hash,
    )

    log_entry = AuditLog(
        seq_no=seq_no,
        user_id=uid_str,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=metadata,
        timestamp=ts,
        prev_hash=prev_hash,
        record_hash=record_hash,
    )

    db.add(log_entry)
    db.flush()
    return log_entry


async def verify_audit_chain(db: AsyncSession) -> Tuple[bool, int, Optional[int]]:
    """
    Cryptographically verifies the append-only SHA-256 hash chain from seq #1 to N.
    Pinpoints the exact sequence number where tampering or chain break occurred.

    Returns:
        (is_valid: bool, total_records: int, first_broken_seq: Optional[int])
    """
    query = select(AuditLog).order_by(AuditLog.seq_no.asc())
    result = await db.execute(query)
    logs = list(result.scalars().all())

    total_records = len(logs)
    if total_records == 0:
        return True, 0, None

    expected_prev_hash = GENESIS_PREV_HASH
    expected_seq = 1

    for log in logs:
        # Check sequence continuity
        if log.seq_no != expected_seq:
            return False, total_records, log.seq_no

        # Check prev_hash pointer
        if log.prev_hash != expected_prev_hash:
            return False, total_records, log.seq_no

        # Recompute hash
        iso_ts = log.timestamp.strftime("%Y-%m-%dT%H:%M:%S")
        meta_str = canonical_metadata_string(log.metadata_json)
        recalculated_hash = compute_audit_hash(
            seq_no=log.seq_no,
            user_id=log.user_id,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            metadata_json_str=meta_str,
            iso_timestamp=iso_ts,
            prev_hash=log.prev_hash,
        )

        if log.record_hash != recalculated_hash:
            return False, total_records, log.seq_no

        expected_prev_hash = log.record_hash
        expected_seq += 1

    return True, total_records, None


record_audit_log = write_audit_log
