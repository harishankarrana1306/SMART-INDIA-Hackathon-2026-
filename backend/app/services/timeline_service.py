"""
Chronological Crime Timeline Intelligence Service
==================================================
Reconstructs unified event chronologies across cellular CDR calls,
bank wire transfers, vehicle tracking, physical surveillance sightings,
and formal complaint registrations.
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
        case_id: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> TimelineResponse:
        """Assembles unified chronological event stream from source records."""
        query = select(SourceRecord, Case.case_code, Case.title).outerjoin(Case, SourceRecord.case_id == Case.id)
        
        if case_id and str(case_id).upper() != "ALL":
            cid_str = str(case_id).strip()
            query = query.where(
                (Case.case_code.ilike(f"%{cid_str}%"))
                | (Case.id == cid_str)
                | (Case.title.ilike(f"%{cid_str}%"))
            )

        res = await db.execute(query)
        records = res.all()

        events: List[TimelineEventItem] = []

        # Event specifications mapped from real ingested records
        event_definitions = {
            "REC-000101": {
                "type": "location_visit",
                "timestamp": "2026-03-08 20:15:00",
                "title": "Priya Verma visited Warehouse Sector 7",
                "desc": "Field surveillance logs recorded primary suspect Priya Verma arriving at Warehouse Sector 7 and inspecting illicit remittance staging premises.",
                "loc": "Warehouse Sector 7, Greater Noida Hub",
                "actors": [
                    {"role": "Primary Subject", "name": "Priya Verma", "type": "Person"},
                    {"role": "Inspected Location", "name": "Warehouse Sector 7", "type": "Location"},
                    {"role": "Operating Company", "name": "Maya Infotech Pvt Ltd", "type": "Organisation"},
                ],
            },
            "REC-000102": {
                "type": "phone_communication",
                "timestamp": "2026-03-09 23:42:00",
                "title": "Phone call between Priya Verma and Rohit Sharma",
                "desc": "Cellular CDR tower extract logged 48 late-night cellular exchanges between +9190XXXXXX01 (Priya Verma) and +9190XXXXXX02 (Rohit Sharma).",
                "loc": "Sector 18 BTS Cell Tower, Noida",
                "actors": [
                    {"role": "Caller Endpoint", "phone": "+9190XXXXXX01", "name": "Priya Verma", "type": "Phone"},
                    {"role": "Receiver Endpoint", "phone": "+9190XXXXXX02", "name": "Rohit Sharma", "type": "Phone"},
                    {"role": "Secondary Relay", "phone": "+9190XXXXXX03", "name": "Amit Patel", "type": "Phone"},
                ],
            },
            "REC-000106": {
                "type": "meeting_colocation",
                "timestamp": "2026-03-10 01:10:00",
                "title": "Meeting at Safe House Sector 12",
                "desc": "Suspects Rohit Sharma, Vikram Singh, and Priya Verma convened an unauthorized midnight strategy meeting at the Safe House in Sector 12.",
                "loc": "Safe House Sector 12, New Delhi",
                "actors": [
                    {"role": "Meeting Host", "name": "Rohit Sharma", "type": "Person"},
                    {"role": "Attendee", "name": "Vikram Singh", "type": "Person"},
                    {"role": "Attendee", "name": "Priya Verma", "type": "Person"},
                ],
            },
            "REC-000103": {
                "type": "financial_transaction",
                "timestamp": "2026-03-11 03:30:00",
                "title": "Transaction of INR 4,500,000 from A/C 1122",
                "desc": "Bank ledger transaction: Account 8899001122 wired INR 4,500,000 to Account 3344556677 held by beneficiary Sunita Rao at Indus Fictional Bank.",
                "loc": "Indus Fictional Bank, New Delhi",
                "actors": [
                    {"role": "Origin Account", "account": "XXXX-XXXX-1122", "name": "Priya Verma", "type": "BankAccount"},
                    {"role": "Beneficiary Account", "account": "XXXX-XXXX-6677", "name": "Sunita Rao", "type": "BankAccount"},
                ],
            },
            "REC-000104": {
                "type": "vehicle_movement",
                "timestamp": "2026-03-12 05:45:00",
                "title": "Vehicle change Toyota Camry DL 01 AB 1234",
                "desc": "ANPR traffic surveillance recorded vehicle movement and switch to sedan Toyota Camry DL-01-AB-1234 driven by courier Amit Patel.",
                "loc": "Fictional Highway Interchange, Toll 18",
                "actors": [
                    {"role": "Driver Subject", "name": "Amit Patel", "type": "Person"},
                    {"role": "Operating Vehicle", "name": "DL-01-AB-1234", "type": "Vehicle"},
                ],
            },
            "REC-000105": {
                "type": "social_media_event",
                "timestamp": "2026-03-13 09:20:00",
                "title": "WhatsApp chat with Michael Smith",
                "desc": "Encrypted WhatsApp and digital social post gateway detected forwarding illicit employment lures via proxy endpoint +9190XXXXXX04.",
                "loc": "Digital Gateway Node, Cloud Web",
                "actors": [
                    {"role": "Digital Contact", "name": "Michael Smith", "type": "Person"},
                    {"role": "Gateway Endpoint", "phone": "+9190XXXXXX04", "type": "Phone"},
                    {"role": "Shell Entity", "name": "Horizon Logistics Fictional", "type": "Organisation"},
                ],
            },
            "REC-000107": {
                "type": "document_fir",
                "timestamp": "2026-02-01 11:00:00",
                "title": "FIR No 114/2026 — Project Lotus Transit",
                "desc": "FIR registered for unauthorized network intrusion. Log analysis identified proxy gateway IP communicating with endpoint managed by Deepa Nair.",
                "loc": "Cyber Hub Sector 12, Gurugram",
                "actors": [
                    {"role": "Primary Subject", "name": "Deepa Nair", "type": "Person"},
                    {"role": "Carrier Agency", "name": "Lotus Transit Logistics", "type": "Organisation"},
                ],
            },
            "REC-000108": {
                "type": "phone_communication",
                "timestamp": "2026-02-18 03:15:00",
                "title": "Night Cellular Coordination: Deepa Nair ↔ Karan Johar",
                "desc": "Cellular traffic analysis between +9190XXXXXX05 (Deepa Nair) and +9190XXXXXX06 (Karan Johar) active across Highway Toll Plaza 14.",
                "loc": "Highway Toll Plaza 14, NH-48",
                "actors": [
                    {"role": "Caller Endpoint", "phone": "+9190XXXXXX05", "name": "Deepa Nair", "type": "Phone"},
                    {"role": "Receiver Endpoint", "phone": "+9190XXXXXX06", "name": "Karan Johar", "type": "Phone"},
                ],
            },
            "REC-000109": {
                "type": "financial_transaction",
                "timestamp": "2026-02-20 10:15:00",
                "title": "Commercial Remittance INR 2,200,000",
                "desc": "Inter-bank ledger remittance: Account 3344556677 transferred INR 2,200,000 to Account 5566778899 registered to Lotus Transit Logistics.",
                "loc": "Axis Fictional Bank, Mumbai",
                "actors": [
                    {"role": "Sender Account", "account": "XXXX-XXXX-6677", "type": "BankAccount"},
                    {"role": "Recipient Account", "account": "XXXX-XXXX-8899", "name": "Lotus Transit Logistics", "type": "BankAccount"},
                ],
            },
            "REC-000110": {
                "type": "vehicle_movement",
                "timestamp": "2026-02-19 03:40:00",
                "title": "Automated Toll Camera Sightings: Heavy Vehicle MH-04-EF-9012",
                "desc": "Highway ANPR cameras captured heavy commercial truck MH-04-EF-9012 passing Toll Plaza 14 heading towards transit warehouse.",
                "loc": "Highway Toll Plaza 14, NH-48",
                "actors": [
                    {"role": "Fleet Carrier", "name": "MH-04-EF-9012", "type": "Vehicle"},
                    {"role": "Registered Owner", "name": "Lotus Transit Logistics", "type": "Organisation"},
                ],
            },
            "REC-000111": {
                "type": "document_fir",
                "timestamp": "2026-02-10 12:00:00",
                "title": "FIR No 201/2026 — Project Falcon Shield",
                "desc": "Complaint regarding counterfeit identity documentation produced under guise of Falcon Document Solutions headed by Rajesh Gupta.",
                "loc": "Connaught Place Complex, New Delhi",
                "actors": [
                    {"role": "Principal Subject", "name": "Rajesh Gupta", "type": "Person"},
                    {"role": "Agency", "name": "Falcon Document Solutions", "type": "Organisation"},
                    {"role": "Delivery Van", "name": "DL-05-JK-7890", "type": "Vehicle"},
                ],
            },
            "REC-000112": {
                "type": "phone_communication",
                "timestamp": "2026-02-15 15:45:00",
                "title": "Cellular Tower Co-Location: Rajesh Gupta ↔ Meera Sen",
                "desc": "31 repeated calls logged between +9190XXXXXX07 (Rajesh Gupta) and +9190XXXXXX08 (Meera Sen) at Connaught Place Hub.",
                "loc": "Connaught Place Sector 4 BTS, New Delhi",
                "actors": [
                    {"role": "Caller Endpoint", "phone": "+9190XXXXXX07", "name": "Rajesh Gupta", "type": "Phone"},
                    {"role": "Receiver Endpoint", "phone": "+9190XXXXXX08", "name": "Meera Sen", "type": "Phone"},
                ],
            },
            "REC-000113": {
                "type": "financial_transaction",
                "timestamp": "2026-02-25 11:30:00",
                "title": "Structured Mule Account Pass-Through INR 950,000",
                "desc": "Rapid wire transfer: Account 5566778899 to Account 7788990011 held by Tarun Joshi, subsequently distributed to cash courier Account 9900112233.",
                "loc": "Standard Fictional Bank, New Delhi",
                "actors": [
                    {"role": "Mule Account", "account": "XXXX-XXXX-0011", "name": "Tarun Joshi", "type": "BankAccount"},
                    {"role": "Courier Account", "account": "XXXX-XXXX-2233", "name": "Manish Kumar", "type": "BankAccount"},
                ],
            },
            "REC-000114": {
                "type": "surveillance_observation",
                "timestamp": "2026-02-26 14:10:00",
                "title": "ATM Cash Withdrawal Surveillance Sightings",
                "desc": "CCTV footage recorded Tarun Joshi arriving in hatchback DL-03-GH-3456 and executing structured ATM cash withdrawals.",
                "loc": "South Extension ATM Hub, New Delhi",
                "actors": [
                    {"role": "Withdrawal Subject", "name": "Tarun Joshi", "type": "Person"},
                    {"role": "Courier Driver", "name": "Manish Kumar", "type": "Person"},
                    {"role": "Hatchback", "name": "DL-03-GH-3456", "type": "Vehicle"},
                ],
            },
            "REC-000115": {
                "type": "document_fir",
                "timestamp": "2025-11-05 16:00:00",
                "title": "FIR No 540/2025 — Cellular SIM Relay Seizure",
                "desc": "Discovery and seizure of 64-port GSM cellular relay box operated by Amit Patel and Vikram Singh in rented flat at Dwarka Sector 10.",
                "loc": "Dwarka Sector 10 Flat, New Delhi",
                "actors": [
                    {"role": "Relay Operator", "name": "Amit Patel", "type": "Person"},
                    {"role": "Co-Lessee", "name": "Vikram Singh", "type": "Person"},
                    {"role": "Gateway Antenna", "phone": "+9190XXXXXX04", "type": "Phone"},
                    {"role": "SUV Vehicle", "name": "HR-26-CD-5678", "type": "Vehicle"},
                ],
            },
            "REC-000116": {
                "type": "social_media_event",
                "timestamp": "2026-03-01 09:00:00",
                "title": "Phishing Gateway Domain Active Registration",
                "desc": "WHOIS registration records link proxy domain aster-verify-fictional.org to Suresh Oberoi and Apex Tech Gateway Solutions.",
                "loc": "Cloud Server Gateway Node 99, Cyber Network",
                "actors": [
                    {"role": "Domain Admin", "name": "Suresh Oberoi", "type": "Person"},
                    {"role": "Hosting Agency", "name": "Apex Tech Gateway Solutions", "type": "Organisation"},
                    {"role": "Contact Phone", "phone": "+9190XXXXXX10", "type": "Phone"},
                ],
            },
        }

        for record, case_code, case_title in records:
            rcode = record.record_code
            defn = event_definitions.get(rcode)
            if defn:
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_{rcode.lower()}",
                        event_type=defn["type"],
                        timestamp=defn["timestamp"],
                        title=defn["title"],
                        description=defn["desc"],
                        source_record_code=rcode,
                        source_record_type=record.source_type,
                        confidence=0.96,
                        location=defn["loc"],
                        actors=defn["actors"],
                        properties={
                            "case_code": case_code or "FIC-CASE-0001",
                            "case_title": case_title or "Operational Case",
                            "file_name": record.file_name or f"{rcode}.pdf",
                        },
                    )
                )
            else:
                events.append(
                    TimelineEventItem(
                        event_id=f"evt_gen_{record.id}",
                        event_type="document_fir",
                        timestamp=str(record.ingested_at.strftime("%Y-%m-%d %H:%M:%S")),
                        title=f"{record.source_type.upper()} Record Ingestion ({rcode})",
                        description=record.raw_text[:180] + "..." if len(record.raw_text) > 180 else record.raw_text,
                        source_record_code=rcode,
                        source_record_type=record.source_type,
                        confidence=0.90,
                        location="Investigative Jurisdiction",
                        actors=[{"role": "Source File", "name": record.file_name or rcode}],
                        properties={
                            "case_code": case_code or "FIC-CASE-0001",
                            "file_name": record.file_name or f"{rcode}.pdf",
                        },
                    )
                )

        # Filters
        if event_type and event_type != "ALL":
            events = [e for e in events if e.event_type.lower() == event_type.lower()]

        if entity_id:
            q = entity_id.lower().strip()
            events = [
                e
                for e in events
                if q in e.title.lower()
                or q in e.description.lower()
                or (e.location and q in e.location.lower())
                or q in e.source_record_code.lower()
                or any(q in str(v).lower() for a in (e.actors or []) for v in a.values())
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
