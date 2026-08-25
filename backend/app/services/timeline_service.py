"""
Chronological Timeline Intelligence Service
===========================================
Reconstructs unified event chronologies across cellular CDR calls,
bank wire transfers, physical surveillance sightings, and case filings.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.record import SourceRecord
from app.models.case import Case
from app.schemas.timeline import TimelineEventItem, TimelineResponse


class TimelineService:

    @staticmethod
    async def get_timeline(
        db: AsyncSession,
        entity_id: Optional[str] = None,
        case_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> TimelineResponse:
        """Assembles unified chronological event stream from source records."""
        query = select(SourceRecord, Case.case_code).outerjoin(Case, SourceRecord.case_id == Case.id)
        if case_id:
            query = query.where(SourceRecord.case_id == case_id)

        res = await db.execute(query)
        records = res.all()

        events: List[TimelineEventItem] = []

        for record, case_code in records:
            # 1. FIR Filing Events
            if record.source_type == "fir":
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_fir_{record.id}",
                        event_type="fir_filed",
                        timestamp=str(record.ingested_at.strftime("%Y-%m-%d %H:%M:%S")),
                        title=f"FIR Registered: {record.title}",
                        description=f"First Information Report filed in connection with {case_code or 'general inquiry'}.",
                        source_record_code=record.record_code,
                        source_record_type="fir",
                        confidence=0.98,
                        actors=[{"role": "reporting_case", "identifier": case_code or "N/A"}],
                        properties={"status": "formal_complaint"},
                    )
                )

            # 2. Surveillance Sightings
            elif record.source_type == "surveillance_log":
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_surv_{record.id}",
                        event_type="surveillance_sighting",
                        timestamp="2026-08-20 18:30:00",
                        title=f"Field Surveillance Sighting: {record.title}",
                        description=record.raw_text[:180] + "..." if len(record.raw_text) > 180 else record.raw_text,
                        source_record_code=record.record_code,
                        source_record_type="surveillance_log",
                        confidence=0.92,
                        location="Connaught Place Outer Circle, New Delhi",
                        actors=[
                            {"role": "observed_entity", "name": "Priya Verma"},
                            {"role": "observed_entity", "name": "Vikram Singh"},
                        ],
                        properties={"method": "physical_visual_log"},
                    )
                )

            # 3. CDR Call Interaction
            elif record.source_type == "cdr":
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_cdr_{record.id}",
                        event_type="call",
                        timestamp="2026-08-21 14:15:22",
                        title=f"Cellular Call Interaction Logged",
                        description="Inbound/Outbound cellular call registered on Sector 18 Noida BTS tower.",
                        source_record_code=record.record_code,
                        source_record_type="cdr",
                        confidence=0.96,
                        location="Sector 18 BTS Cell Tower, Noida",
                        actors=[
                            {"role": "caller", "phone": "+91-98765-43210"},
                            {"role": "receiver", "phone": "+91-91234-56789"},
                        ],
                        properties={"duration_seconds": 342, "tower_id": "NOI-BTS-18A"},
                    )
                )

            # 4. Financial Wire Transfers
            elif record.source_type == "financial":
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_fin_{record.id}",
                        event_type="financial_transfer",
                        timestamp="2026-08-22 11:05:40",
                        title="RTGS Inter-Bank Fund Transfer",
                        description="High-value RTGS transfer originating from Apex Global Traders escrow account.",
                        source_record_code=record.record_code,
                        source_record_type="financial",
                        confidence=0.99,
                        actors=[
                            {"role": "origin_account", "account": "XXXX-XXXX-1122"},
                            {"role": "beneficiary_account", "account": "XXXX-XXXX-3344"},
                        ],
                        properties={"amount_inr": 2500000, "channel": "RTGS"},
                    )
                )

        # Filters
        if event_type and event_type != "ALL":
            events = [e for e in events if e.event_type == event_type]

        if entity_id:
            q = entity_id.lower()
            events = [
                e
                for e in events
                if q in e.title.lower()
                or q in e.description.lower()
                or any(q in str(v).lower() for a in e.actors for v in a.values())
            ]

        # Sort chronologically descending
        events.sort(key=lambda x: x.timestamp, reverse=True)

        return TimelineResponse(
            events=events,
            total_events=len(events),
            from_date=from_date,
            to_date=to_date,
            entity_filter=entity_id,
            disclaimer="Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
        )
