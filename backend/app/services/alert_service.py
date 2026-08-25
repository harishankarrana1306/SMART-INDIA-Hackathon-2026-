"""
Alert Management Service
========================
Handles rule scanning, listing, acknowledging, and dismissing investigative alerts.
"""

from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.alert import Alert
from app.models.user import User
from app.analytics.alerts_engine import alerts_engine
from app.core.audit import record_audit_log


class AlertService:

    @staticmethod
    async def scan_and_stage_alerts(db: AsyncSession, user_id: Optional[str] = None) -> Tuple[int, int]:
        """Runs the rule scanner and stages new alerts into the relational database."""
        detected = alerts_engine.scan_all_patterns()
        new_count = 0

        for pat in detected:
            # Check if alert with same title already exists
            existing_res = await db.execute(select(Alert).where(Alert.title == pat.title))
            if existing_res.scalar_one_or_none():
                continue

            alert_row = Alert(
                rule_name=pat.rule_name,
                title=pat.title,
                description=pat.description,
                severity=pat.severity,
                threshold_description=pat.threshold_description,
                supporting_entity_ids=pat.supporting_entity_ids,
                supporting_record_ids=pat.supporting_record_ids,
                status="unreviewed",
                created_at=datetime.now(timezone.utc),
            )
            db.add(alert_row)
            new_count += 1

        if new_count > 0:
            await db.commit()

        # Count total active
        total_res = await db.execute(select(Alert).where(Alert.status.in_(["unreviewed", "acknowledged", "investigating"])))
        total_active = len(total_res.scalars().all())

        if user_id:
            await record_audit_log(
                db=db,
                user_id=user_id,
                action="alert_scan",
                target_type="alert_engine",
                metadata={"new_alerts_detected": new_count, "total_active": total_active},
            )
            await db.commit()

        return new_count, total_active

    @staticmethod
    async def list_alerts(
        db: AsyncSession,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Alert]:
        """Queries stored pattern alerts with filtering."""
        query = select(Alert).order_by(desc(Alert.created_at))

        if severity and severity != "ALL":
            query = query.where(Alert.severity == severity.upper())
        if status and status != "ALL":
            query = query.where(Alert.status == status.lower())

        query = query.limit(limit).offset(offset)
        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    async def acknowledge_alert(
        db: AsyncSession,
        alert_id: str,
        user: User,
        notes: Optional[str] = None,
    ) -> Alert:
        """Marks alert as acknowledged/under active investigation."""
        query = select(Alert).where(Alert.id == str(alert_id))
        res = await db.execute(query)
        alert = res.scalar_one_or_none()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.status = "acknowledged"
        alert.reviewed_by = user.id
        alert.reviewed_at = datetime.now(timezone.utc)
        alert.review_notes = notes or "Investigator acknowledged pattern alert"

        await record_audit_log(
            db=db,
            user_id=user.id,
            action="alert_acknowledge",
            target_type="alert",
            target_id=str(alert_id),
            metadata={"rule_name": alert.rule_name, "notes": alert.review_notes},
        )

        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def dismiss_alert(
        db: AsyncSession,
        alert_id: str,
        user: User,
        reason: str,
    ) -> Alert:
        """Dismisses alert with audited rationale."""
        query = select(Alert).where(Alert.id == str(alert_id))
        res = await db.execute(query)
        alert = res.scalar_one_or_none()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.status = "dismissed"
        alert.reviewed_by = user.id
        alert.reviewed_at = datetime.now(timezone.utc)
        alert.review_notes = reason

        await record_audit_log(
            db=db,
            user_id=user.id,
            action="alert_dismiss",
            target_type="alert",
            target_id=str(alert_id),
            metadata={"rule_name": alert.rule_name, "reason": reason},
        )

        await db.commit()
        await db.refresh(alert)
        return alert
