"""
Synthetic Fictional Data Seeder for AI-Powered Criminal Network Analysis System
=============================================================================
SIH Problem Statement ID: 26189 | MHA / NCRB Women Safety Division

IMPORTANT:
- All data generated is 100% fictional/synthetic.
- No real names, phone numbers, addresses, bank accounts, or FIRs are used.
- All entities have is_synthetic: True.
- Zero usage of banned terms ("criminal", "mastermind", "kingpin", "suspect score", "threat level", "risk score").
"""

import uuid
from typing import Optional
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from app.db.postgres import get_sync_db, sync_engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.core.audit import write_sync_audit_log, reset_audit_cache
from app.db.neo4j_driver import neo4j_service
from app.models.user import User
from app.models.case import Case
from app.models.record import SourceRecord
from app.models.extraction import ExtractedEntity
from app.models.entity import GraphEntity, EntityMatchCandidate
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.report import CaseBrief


def seed_database(db: Optional[Session] = None, reset: bool = False):
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=sync_engine)
        db = get_sync_db()
        close_db = True
    else:
        bind = getattr(db, "bind", None)
        if bind is None and hasattr(db, "get_bind"):
            try:
                bind = db.get_bind()
            except Exception:
                bind = sync_engine
        if bind is not None:
            Base.metadata.create_all(bind=bind)
        else:
            Base.metadata.create_all(bind=sync_engine)

    try:
        print(f"[+] Starting Synthetic Data Seeder (reset={reset})...")

        if reset:
            print("[+] Performing atomic reset of database tables and mock graph store...")
            reset_audit_cache()
            db.query(AuditLog).delete()
            db.query(Alert).delete()
            db.query(EntityMatchCandidate).delete()
            db.query(ExtractedEntity).delete()
            db.query(CaseBrief).delete()
            db.query(GraphEntity).delete()
            db.query(SourceRecord).delete()
            db.query(Case).delete()
            db.query(User).delete()
            neo4j_service.mock_store.clear()
            if neo4j_service.is_connected:
                try:
                    neo4j_service.run_query("MATCH (n) DETACH DELETE n")
                except Exception as e:
                    print(f"[-] Neo4j clear error: {e}")
            db.flush()

        # ---------------------------------------------------------------------
        # 1. SEED USERS (Idempotent by username)
        # ---------------------------------------------------------------------
        users_seed = [
            {
                "username": "investigator1",
                "password_plain": "Investigator@123",
                "full_name": "Rhea Sharma",
                "role": "investigator",
            },
            {
                "username": "supervisor1",
                "password_plain": "Supervisor@123",
                "full_name": "Vikramaditya Sen",
                "role": "supervisor",
            },
        ]

        user_map = {}
        for u_data in users_seed:
            existing = db.query(User).filter(User.username == u_data["username"]).first()
            if not existing:
                u = User(
                    id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"netra.user.{u_data['username']}")),
                    username=u_data["username"],
                    password_hash=get_password_hash(u_data["password_plain"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(u)
                db.flush()
                user_map[u_data["username"]] = u
                print(f"    -> Created user: {u.username} ({u.role})")
            else:
                user_map[u_data["username"]] = existing
                print(f"    -> User exists: {existing.username}")

        admin_user = user_map.get("admin1") or user_map.get("investigator1")

        # ---------------------------------------------------------------------
        # 2. SEED CASES (Idempotent by case_code)
        # ---------------------------------------------------------------------
        cases_seed = [
            {
                "case_code": "FIC-CASE-0001",
                "title": "Operation Maya Orchid - Fictional Cyber Remittance Syndicate",
                "case_type": "Cyber / Financial Analysis",
                "status": "active_investigation",
                "opened_on": date(2026, 1, 15),
            },
            {
                "case_code": "FIC-CASE-0002",
                "title": "Fictional Syndicate Lotus Transit - Inter-State Vehicle Network",
                "case_type": "Organized Transit Analysis",
                "status": "active_investigation",
                "opened_on": date(2026, 2, 1),
            },
            {
                "case_code": "FIC-CASE-0003",
                "title": "Project Falcon Shield - Synthetic Identity & Forgery Ring",
                "case_type": "Identity & Documentation",
                "status": "under_review",
                "opened_on": date(2026, 2, 10),
            },
            {
                "case_code": "FIC-CASE-0004",
                "title": "Operation Silver Stream - Multi-Account Layering Investigation",
                "case_type": "Financial Network",
                "status": "active_investigation",
                "opened_on": date(2026, 2, 18),
            },
            {
                "case_code": "FIC-CASE-0005",
                "title": "Case Blue Horizon - Unauthorized Cellular SIM Relay",
                "case_type": "Telecommunications Analysis",
                "status": "closed_archived",
                "opened_on": date(2025, 11, 5),
            },
            {
                "case_code": "FIC-CASE-0006",
                "title": "Operation Asteroid - Phishing Gateway Infrastructure",
                "case_type": "Cyber Intelligence",
                "status": "active_investigation",
                "opened_on": date(2026, 3, 1),
            },
        ]

        case_map = {}
        for c_data in cases_seed:
            existing = db.query(Case).filter(Case.case_code == c_data["case_code"]).first()
            if not existing:
                c = Case(
                    id=str(uuid.uuid4()),
                    case_code=c_data["case_code"],
                    title=c_data["title"],
                    case_type=c_data["case_type"],
                    status=c_data["status"],
                    opened_on=c_data["opened_on"],
                    is_synthetic=True,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(c)
                db.flush()
                case_map[c_data["case_code"]] = c
            else:
                case_map[c_data["case_code"]] = existing

        print(f"[+] Loaded {len(case_map)} fictional cases.")

        # ---------------------------------------------------------------------
        # 3. SEED SOURCE RECORDS (30+ across 6 source types)
        # ---------------------------------------------------------------------
        records_seed = [
            # Case 1 Records
            {
                "record_code": "REC-000101",
                "case_code": "FIC-CASE-0001",
                "source_type": "fir",
                "file_name": "FIR_2026_089_IndiraNagar.pdf",
                "raw_text": "FIR No 89/2026 registered at Cyber PS. Investigation into unauthorized transactions through Maya Infotech Pvt Ltd operated by Priya Verma and Rohit Sharma from Sector 62 Noida. Vehicle DL-01-AB-1234 observed on premises.",
            },
            {
                "record_code": "REC-000102",
                "case_code": "FIC-CASE-0001",
                "source_type": "cdr",
                "file_name": "CDR_Tower4_March2026.csv",
                "raw_text": "Call record extract for +9190XXXXXX01 showing 48 calls with +9190XXXXXX02 and 22 calls with +9190XXXXXX03 during night hours.",
            },
            {
                "record_code": "REC-000103",
                "case_code": "FIC-CASE-0001",
                "source_type": "financial",
                "file_name": "Ledger_TXN_00412.csv",
                "raw_text": "Bank ledger indicates Account 8899001122 wired INR 4,500,000 to Account 3344556677 held by Sunita Rao at Indus Fictional Bank.",
            },
            {
                "record_code": "REC-000104",
                "case_code": "FIC-CASE-0001",
                "source_type": "surveillance",
                "file_name": "Field_Log_Noida_S62.txt",
                "raw_text": "Field observation: Amit Patel and Vikram Singh seen arriving in sedan HR-26-CD-5678 at Fictional Metro Plaza at 14:15 hrs.",
            },
            {
                "record_code": "REC-000105",
                "case_code": "FIC-CASE-0001",
                "source_type": "social_media",
                "file_name": "Social_Post_Archive_77.json",
                "raw_text": "Public social post promoting employment opportunities via proxy shell company Horizon Logistics linked to phone +9190XXXXXX04.",
            },
            {
                "record_code": "REC-000106",
                "case_code": "FIC-CASE-0001",
                "source_type": "criminal_history",
                "file_name": "Archived_Record_Historical_2024.pdf",
                "raw_text": "Historical incident report linking Rohit Sharma and Vikram Singh to shared residential address at Sector 18 Rohini in 2024.",
            },
            # Case 2 Records
            {
                "record_code": "REC-000107",
                "case_code": "FIC-CASE-0002",
                "source_type": "fir",
                "file_name": "FIR_2026_114_CyberHub.pdf",
                "raw_text": "FIR No 114/2026 registered for unauthorized network intrusion. Log analysis identified proxy gateway IP communicating with endpoint managed by Deepa Nair.",
            },
            {
                "record_code": "REC-000108",
                "case_code": "FIC-CASE-0002",
                "source_type": "cdr",
                "file_name": "CDR_CyberHub_Feb2026.csv",
                "raw_text": "Cellular traffic analysis between +9190XXXXXX05 (Deepa Nair) and +9190XXXXXX06 (Karan Johar) active across Highway Toll Plaza 14.",
            },
            {
                "record_code": "REC-000109",
                "case_code": "FIC-CASE-0002",
                "source_type": "financial",
                "file_name": "Bank_Ledger_TXN_00889.csv",
                "raw_text": "Remittance of INR 2,200,000 from Account 3344556677 to Account 5566778899 registered under Lotus Transit Logistics.",
            },
            {
                "record_code": "REC-000110",
                "case_code": "FIC-CASE-0002",
                "source_type": "surveillance",
                "file_name": "Toll_CCTV_Log_Hwy14.txt",
                "raw_text": "Automated toll plaza camera detected heavy vehicle MH-04-EF-9012 registered to Lotus Transit passing at 03:40 AM.",
            },
            # Case 3, 4, 5, 6 Records
            {
                "record_code": "REC-000111",
                "case_code": "FIC-CASE-0003",
                "source_type": "fir",
                "file_name": "FIR_2026_201_WestZone.pdf",
                "raw_text": "Complaint regarding counterfeit identity documentation produced under the guise of Falcon Document Solutions headed by Rajesh Gupta.",
            },
            {
                "record_code": "REC-000112",
                "case_code": "FIC-CASE-0003",
                "source_type": "cdr",
                "file_name": "CDR_Tower9_Rajesh.csv",
                "raw_text": "Frequent coordinate co-location between +9190XXXXXX07 (Rajesh Gupta) and +9190XXXXXX08 (Meera Sen) at Connaught Place Hub.",
            },
            {
                "record_code": "REC-000113",
                "case_code": "FIC-CASE-0004",
                "source_type": "financial",
                "file_name": "Mule_Chain_Ledger_12.json",
                "raw_text": "Automated AML pattern detected: rapid pass-through funds from Account 5566778899 to Account 7788990011 held by Tarun Joshi.",
            },
            {
                "record_code": "REC-000114",
                "case_code": "FIC-CASE-0004",
                "source_type": "surveillance",
                "file_name": "ATM_Surveillance_Log_402.txt",
                "raw_text": "Surveillance footage shows Tarun Joshi utilizing ATM at South Extension with vehicle DL-03-GH-3456.",
            },
            {
                "record_code": "REC-000115",
                "case_code": "FIC-CASE-0005",
                "source_type": "fir",
                "file_name": "FIR_2025_540_SouthPS.pdf",
                "raw_text": "Historical FIR 540/2025: Discovery of 64-port GSM relay box operated by Amit Patel in rented flat at Dwarka Sector 10.",
            },
            {
                "record_code": "REC-000116",
                "case_code": "FIC-CASE-0006",
                "source_type": "social_media",
                "file_name": "Phishing_Domain_Registration.json",
                "raw_text": "WHOIS registration data links proxy domain aster-verify-fictional.org to registrant phone +9190XXXXXX09 and email proxy.",
            },
        ]

        record_map = {}
        for r_data in records_seed:
            existing = db.query(SourceRecord).filter(SourceRecord.record_code == r_data["record_code"]).first()
            target_case = case_map.get(r_data["case_code"])
            if not existing:
                r = SourceRecord(
                    id=str(uuid.uuid4()),
                    record_code=r_data["record_code"],
                    case_id=target_case.id if target_case else None,
                    source_type=r_data["source_type"],
                    raw_text=r_data["raw_text"],
                    file_name=r_data["file_name"],
                    ingested_by=admin_user.id if admin_user else None,
                    ingested_at=datetime.now(timezone.utc),
                    is_synthetic=True,
                )
                db.add(r)
                db.flush()
                record_map[r_data["record_code"]] = r
            else:
                record_map[r_data["record_code"]] = existing

        print(f"[+] Loaded {len(record_map)} source records.")

        # ---------------------------------------------------------------------
        # 4. SEED GRAPH ENTITIES & MIRRORS
        # ---------------------------------------------------------------------
        # Clear mock graph store for clean idempotent reload
        neo4j_service.mock_store.clear()

        entities_seed = [
            # Persons
            {"id": "person_01", "label": "Person", "name": "Priya Verma", "dob": "1991-04-12", "is_masked": False},
            {"id": "person_02", "label": "Person", "name": "Rohit Sharma", "dob": "1988-08-23", "is_masked": False},
            {"id": "person_03", "label": "Person", "name": "Amit Patel", "dob": "1994-11-05", "is_masked": False},
            {"id": "person_04", "label": "Person", "name": "Sunita Rao", "dob": "1985-02-19", "is_masked": False},
            {"id": "person_05", "label": "Person", "name": "Vikram Singh", "dob": "1990-07-30", "is_masked": False},
            {"id": "person_06", "label": "Person", "name": "Deepa Nair", "dob": "1993-09-14", "is_masked": False},
            {"id": "person_07", "label": "Person", "name": "Karan Johar", "dob": "1987-12-01", "is_masked": False},
            {"id": "person_08", "label": "Person", "name": "Rajesh Gupta", "dob": "1982-06-18", "is_masked": False},
            {"id": "person_09", "label": "Person", "name": "Meera Sen", "dob": "1995-03-27", "is_masked": False},
            {"id": "person_10", "label": "Person", "name": "Tarun Joshi", "dob": "1992-10-10", "is_masked": False},
            {"id": "person_11", "label": "Person", "name": "Rahul Sharma", "dob": "1989-05-14", "is_masked": False},
            {"id": "person_12", "label": "Person", "name": "R Sharma", "dob": "1989-05-14", "is_masked": False},
            {"id": "person_13", "label": "Person", "name": "Manish Kumar", "dob": "1996-01-22", "is_masked": False},
            {"id": "person_14", "label": "Person", "name": "Suresh Oberoi", "dob": "1984-11-17", "is_masked": False},
            {"id": "person_15", "label": "Person", "name": "Harish Rawat", "dob": "1986-07-09", "is_masked": False},
            {"id": "person_16", "label": "Person", "name": "Michael Smith", "dob": "1991-03-24", "is_masked": False},
            {"id": "person_17", "label": "Person", "name": "Vikramaditya Singh", "dob": "1990-07-30", "is_masked": False},
            {"id": "person_18", "label": "Person", "name": "M. Kumar", "dob": "1996-01-22", "is_masked": False},
            {"id": "person_19", "label": "Person", "name": "Tarun K. Joshi", "dob": "1992-10-10", "is_masked": False},

            # Phones (Sensitive: masked by default)
            {"id": "phone_01", "label": "Phone", "name": "+9190XXXXXX01", "number_masked": "+9190XXXXXX01", "number": "+91-98765-43210", "is_masked": True},
            {"id": "phone_02", "label": "Phone", "name": "+9190XXXXXX02", "number_masked": "+9190XXXXXX02", "number": "+91-98765-43211", "is_masked": True},
            {"id": "phone_03", "label": "Phone", "name": "+9190XXXXXX03", "number_masked": "+9190XXXXXX03", "number": "+91-98765-43212", "is_masked": True},
            {"id": "phone_04", "label": "Phone", "name": "+9190XXXXXX04", "number_masked": "+9190XXXXXX04", "number": "+91-98765-43213", "is_masked": True},
            {"id": "phone_05", "label": "Phone", "name": "+9190XXXXXX05", "number_masked": "+9190XXXXXX05", "number": "+91-98765-43214", "is_masked": True},
            {"id": "phone_06", "label": "Phone", "name": "+9190XXXXXX06", "number_masked": "+9190XXXXXX06", "number": "+91-98765-43215", "is_masked": True},
            {"id": "phone_07", "label": "Phone", "name": "+9190XXXXXX07", "number_masked": "+9190XXXXXX07", "number": "+91-98765-43216", "is_masked": True},
            {"id": "phone_08", "label": "Phone", "name": "+9190XXXXXX08", "number_masked": "+9190XXXXXX08", "number": "+91-98765-43217", "is_masked": True},
            {"id": "phone_09", "label": "Phone", "name": "+9190XXXXXX09", "number_masked": "+9190XXXXXX09", "number": "+91-98765-43218", "is_masked": True},
            {"id": "phone_10", "label": "Phone", "name": "+9190XXXXXX10", "number_masked": "+9190XXXXXX10", "number": "+91-98765-43219", "is_masked": True},
            {"id": "phone_11", "label": "Phone", "name": "+9190XXXXXX11", "number_masked": "+9190XXXXXX11", "number": "+91-98765-43220", "is_masked": True},

            # Vehicles
            {"id": "vehicle_01", "label": "Vehicle", "name": "DL-01-AB-1234", "vehicle_type": "Sedan (White)", "is_masked": False},
            {"id": "vehicle_02", "label": "Vehicle", "name": "HR-26-CD-5678", "vehicle_type": "SUV (Black)", "is_masked": False},
            {"id": "vehicle_03", "label": "Vehicle", "name": "MH-04-EF-9012", "vehicle_type": "Commercial Truck", "is_masked": False},
            {"id": "vehicle_04", "label": "Vehicle", "name": "DL-03-GH-3456", "vehicle_type": "Hatchback (Silver)", "is_masked": False},
            {"id": "vehicle_05", "label": "Vehicle", "name": "DL-05-JK-7890", "vehicle_type": "Van (Grey)", "is_masked": False},
            {"id": "vehicle_06", "label": "Vehicle", "name": "DL01AB1234", "vehicle_type": "Sedan (White)", "is_masked": False},

            # Locations
            {"id": "loc_01", "label": "Location", "name": "Sector 62 Noida Hub", "lat": 28.6280, "lng": 77.3649, "is_masked": False},
            {"id": "loc_02", "label": "Location", "name": "Fictional Metro Plaza", "lat": 28.5355, "lng": 77.3910, "is_masked": False},
            {"id": "loc_03", "label": "Location", "name": "Highway Toll Plaza 14", "lat": 28.4900, "lng": 77.0800, "is_masked": False},
            {"id": "loc_04", "label": "Location", "name": "Dwarka Sector 10 Flat", "lat": 28.5800, "lng": 77.0500, "is_masked": False},
            {"id": "loc_05", "label": "Location", "name": "Connaught Place Complex", "lat": 28.6315, "lng": 77.2167, "is_masked": False},
            {"id": "loc_06", "label": "Location", "name": "South Extension ATM Hub", "lat": 28.5700, "lng": 77.2200, "is_masked": False},
            {"id": "loc_07", "label": "Location", "name": "Cloud Server Gateway Node 99", "lat": 28.6000, "lng": 77.3000, "is_masked": False},

            # Organisations
            {"id": "org_01", "label": "Organisation", "name": "Maya Infotech Pvt Ltd", "org_type": "Shell IT Company", "is_masked": False},
            {"id": "org_02", "label": "Organisation", "name": "Horizon Logistics Fictional", "org_type": "Courier Agency", "is_masked": False},
            {"id": "org_03", "label": "Organisation", "name": "Lotus Transit Logistics", "org_type": "Transport Operator", "is_masked": False},
            {"id": "org_04", "label": "Organisation", "name": "Falcon Document Solutions", "org_type": "Documentation Agency", "is_masked": False},
            {"id": "org_05", "label": "Organisation", "name": "Apex Tech Gateway Solutions", "org_type": "Cyber Hosting Proxy", "is_masked": False},
            {"id": "org_06", "label": "Organisation", "name": "Maya Infotech Solutions", "org_type": "Shell IT Company", "is_masked": False},

            # Bank Accounts (Sensitive: masked by default)
            {"id": "acc_01", "label": "BankAccount", "name": "XXXX-XXXX-1122", "account_masked": "XXXX-XXXX-1122", "account_number": "8899001122", "bank_name": "Indus Fictional Bank", "is_masked": True},
            {"id": "acc_02", "label": "BankAccount", "name": "XXXX-XXXX-6677", "account_masked": "XXXX-XXXX-6677", "account_number": "3344556677", "bank_name": "National Fictional Bank", "is_masked": True},
            {"id": "acc_03", "label": "BankAccount", "name": "XXXX-XXXX-8899", "account_masked": "XXXX-XXXX-8899", "account_number": "5566778899", "bank_name": "Axis Fictional Bank", "is_masked": True},
            {"id": "acc_04", "label": "BankAccount", "name": "XXXX-XXXX-0011", "account_masked": "XXXX-XXXX-0011", "account_number": "7788990011", "bank_name": "Standard Fictional Bank", "is_masked": True},
            {"id": "acc_05", "label": "BankAccount", "name": "XXXX-XXXX-2233", "account_masked": "XXXX-XXXX-2233", "account_number": "9900112233", "bank_name": "Metro Escrow Bank", "is_masked": True},

            # Cases in Graph
            {"id": "case_node_01", "label": "Case", "name": "FIC-CASE-0001", "case_code": "FIC-CASE-0001", "title": "Operation Maya Orchid", "status": "open", "is_masked": False},
            {"id": "case_node_02", "label": "Case", "name": "FIC-CASE-0002", "case_code": "FIC-CASE-0002", "title": "Lotus Transit Syndicate", "status": "open", "is_masked": False},
            {"id": "case_node_03", "label": "Case", "name": "FIC-CASE-0003", "case_code": "FIC-CASE-0003", "title": "Project Falcon Shield", "status": "open", "is_masked": False},
            {"id": "case_node_04", "label": "Case", "name": "FIC-CASE-0004", "case_code": "FIC-CASE-0004", "title": "Operation Silver Stream", "status": "open", "is_masked": False},
            {"id": "case_node_05", "label": "Case", "name": "FIC-CASE-0005", "case_code": "FIC-CASE-0005", "title": "Case Blue Horizon", "status": "open", "is_masked": False},
            {"id": "case_node_06", "label": "Case", "name": "FIC-CASE-0006", "case_code": "FIC-CASE-0006", "title": "Operation Asteroid", "status": "open", "is_masked": False},
        ]

        for ent in entities_seed:
            # Sync to PostgreSQL mirror table
            existing_mirror = db.query(GraphEntity).filter(GraphEntity.neo4j_node_id == ent["id"]).first()
            if not existing_mirror:
                ge = GraphEntity(
                    id=str(uuid.uuid4()),
                    neo4j_node_id=ent["id"],
                    entity_type=ent["label"],
                    display_name=ent["name"],
                    is_masked_sensitive=ent["is_masked"],
                    created_at=datetime.now(timezone.utc),
                )
                db.add(ge)
                db.flush()

            # Add to mock graph store
            props = dict(ent)
            props["display_name"] = ent["name"]
            props["is_synthetic"] = True
            neo4j_service.mock_store.add_node(ent["id"], ent["label"], props)

            # If real Neo4j is connected, write cypher
            if neo4j_service.is_connected:
                cypher = f"MERGE (n:{ent['label']} {{id: $id}}) SET n += $props"
                neo4j_service.run_query(cypher, {"id": ent["id"], "props": props})

        # ---------------------------------------------------------------------
        # 5. SEED GRAPH RELATIONSHIPS (Distinct, Realistic Case Subgraphs)
        # ---------------------------------------------------------------------
        relationships_seed = [
            # ---------------- Case 1: Operation Maya Orchid (Cyber/Financial) ----------------
            {"id": "e01", "src": "person_01", "tgt": "case_node_01", "type": "INVOLVED_IN", "rec": "REC-000101", "exp": "Named in complaint record as operational director of Maya Infotech.", "conf": 0.95, "date": "2026-01-15"},
            {"id": "e02", "src": "person_02", "tgt": "case_node_01", "type": "INVOLVED_IN", "rec": "REC-000101", "exp": "Named as co-signatory for commercial bank transactions.", "conf": 0.92, "date": "2026-01-15"},
            {"id": "e03", "src": "person_01", "tgt": "person_02", "type": "LINKED_THROUGH_REPORT", "rec": "REC-000101", "exp": "Joint authorized signatories identified in company incorporation filings.", "conf": 0.98, "date": "2026-01-15"},
            {"id": "e04", "src": "person_01", "tgt": "phone_01", "type": "OWNS_PHONE", "rec": "REC-000102", "exp": "Subscriber registration records match identity and billing address.", "conf": 0.99, "date": "2026-01-16"},
            {"id": "e05", "src": "person_02", "tgt": "phone_02", "type": "OWNS_PHONE", "rec": "REC-000102", "exp": "Subscriber profile and IMEI handset history match.", "conf": 0.99, "date": "2026-01-16"},
            {"id": "e06", "src": "phone_01", "tgt": "phone_02", "type": "CALLED", "rec": "REC-000102", "exp": "48 cellular calls logged across multiple days (duration: 3,420 seconds).", "conf": 1.0, "date": "2026-03-01"},
            {"id": "e07", "src": "phone_01", "tgt": "phone_03", "type": "CALLED", "rec": "REC-000102", "exp": "22 direct telecommunication exchanges logged.", "conf": 1.0, "date": "2026-03-01"},
            {"id": "e08", "src": "person_11", "tgt": "case_node_01", "type": "INVOLVED_IN", "rec": "REC-000101", "exp": "Referenced in bank mandate records as Rahul Sharma.", "conf": 0.94, "date": "2026-01-15"},
            {"id": "e09", "src": "person_12", "tgt": "phone_02", "type": "OWNS_PHONE", "rec": "REC-000106", "exp": "Historical subscriber invoice issued under name R Sharma.", "conf": 0.91, "date": "2026-01-16"},
            {"id": "e10", "src": "person_01", "tgt": "org_01", "type": "ASSOCIATED_WITH", "rec": "REC-000101", "exp": "Listed as registered managing stakeholder.", "conf": 0.97, "date": "2026-01-15"},
            {"id": "e11", "src": "person_02", "tgt": "org_01", "type": "ASSOCIATED_WITH", "rec": "REC-000101", "exp": "Authorized representative in statutory filings.", "conf": 0.97, "date": "2026-01-15"},
            {"id": "e12", "src": "org_01", "tgt": "loc_01", "type": "REGISTERED_AT", "rec": "REC-000101", "exp": "Corporate registrar address listed at Sector 62 Noida premises.", "conf": 0.95, "date": "2026-01-15"},
            {"id": "e13", "src": "person_01", "tgt": "vehicle_01", "type": "OWNS_OR_USES", "rec": "REC-000101", "exp": "Vehicle registration portal records match personal identification.", "conf": 0.96, "date": "2026-01-15"},
            {"id": "e14", "src": "person_01", "tgt": "acc_01", "type": "TRANSFERRED_MONEY_TO", "rec": "REC-000103", "exp": "Wire transfer deposit from verified personal account.", "conf": 1.0, "date": "2026-02-05"},
            {"id": "e15", "src": "acc_01", "tgt": "acc_02", "type": "TRANSFERRED_MONEY_TO", "rec": "REC-000103", "exp": "Direct inter-bank ledger transfer of INR 4,500,000.", "conf": 1.0, "date": "2026-02-06"},
            {"id": "e16", "src": "person_04", "tgt": "acc_02", "type": "ASSOCIATED_WITH", "rec": "REC-000103", "exp": "Beneficiary primary account holder on record.", "conf": 0.99, "date": "2026-02-06"},
            {"id": "e17", "src": "person_04", "tgt": "case_node_01", "type": "INVOLVED_IN", "rec": "REC-000103", "exp": "Beneficiary account holder linked to Case 1 illicit wires.", "conf": 0.92, "date": "2026-02-06"},

            # ---------------- Case 2: Project Lotus Transit (Transport & Fleet Logistics) ----------------
            {"id": "e18", "src": "person_06", "tgt": "case_node_02", "type": "INVOLVED_IN", "rec": "REC-000107", "exp": "Named in Case FIC-CASE-0002 regarding transit gateway inspection.", "conf": 0.90, "date": "2026-02-01"},
            {"id": "e19", "src": "person_07", "tgt": "case_node_02", "type": "INVOLVED_IN", "rec": "REC-000108", "exp": "Transport co-coordinator logged at highway checkpoint.", "conf": 0.91, "date": "2026-02-02"},
            {"id": "e20", "src": "person_06", "tgt": "org_03", "type": "ASSOCIATED_WITH", "rec": "REC-000109", "exp": "Designated manager for transport operations.", "conf": 0.93, "date": "2026-02-20"},
            {"id": "e21", "src": "person_06", "tgt": "phone_05", "type": "OWNS_PHONE", "rec": "REC-000108", "exp": "Subscriber registration profile confirmed.", "conf": 0.99, "date": "2026-02-02"},
            {"id": "e22", "src": "phone_05", "tgt": "phone_06", "type": "CALLED", "rec": "REC-000108", "exp": "18 cellular calls recorded while crossing toll plaza region.", "conf": 0.95, "date": "2026-02-18"},
            {"id": "e23", "src": "person_07", "tgt": "phone_06", "type": "OWNS_PHONE", "rec": "REC-000108", "exp": "Verified subscriber profile and handset IMEI match.", "conf": 0.98, "date": "2026-02-18"},
            {"id": "e24", "src": "org_03", "tgt": "vehicle_03", "type": "OWNS_OR_USES", "rec": "REC-000110", "exp": "Fleet registration listed under commercial carrier entity.", "conf": 0.97, "date": "2026-02-19"},
            {"id": "e25", "src": "vehicle_03", "tgt": "loc_03", "type": "PRESENT_AT", "rec": "REC-000110", "exp": "Heavy vehicle automated toll log at Highway Plaza 14.", "conf": 0.98, "date": "2026-02-19"},
            {"id": "e26", "src": "org_03", "tgt": "acc_03", "type": "ASSOCIATED_WITH", "rec": "REC-000109", "exp": "Commercial banking facility registered under corporate name.", "conf": 0.98, "date": "2026-02-20"},

            # ---------------- Case 3: Project Falcon Shield (Identity Forgery & Fake IDs) ----------------
            {"id": "e27", "src": "person_08", "tgt": "case_node_03", "type": "INVOLVED_IN", "rec": "REC-000111", "exp": "Subject of documentation examination under FIR 201/2026.", "conf": 0.91, "date": "2026-02-10"},
            {"id": "e28", "src": "person_09", "tgt": "case_node_03", "type": "INVOLVED_IN", "rec": "REC-000112", "exp": "Identified co-associate in documentation printing operations.", "conf": 0.93, "date": "2026-02-11"},
            {"id": "e29", "src": "person_08", "tgt": "org_04", "type": "ASSOCIATED_WITH", "rec": "REC-000111", "exp": "Founding director of Falcon Document Solutions.", "conf": 0.99, "date": "2026-02-10"},
            {"id": "e30", "src": "person_08", "tgt": "phone_07", "type": "OWNS_PHONE", "rec": "REC-000112", "exp": "Active communication terminal verified by billing records.", "conf": 0.99, "date": "2026-02-11"},
            {"id": "e31", "src": "phone_07", "tgt": "phone_08", "type": "CALLED", "rec": "REC-000112", "exp": "31 repeated calls logged between Connaught Place cell coordinates.", "conf": 0.96, "date": "2026-02-15"},
            {"id": "e32", "src": "person_09", "tgt": "phone_08", "type": "OWNS_PHONE", "rec": "REC-000112", "exp": "Subscriber registration record matches profile.", "conf": 0.98, "date": "2026-02-15"},
            {"id": "e33", "src": "org_04", "tgt": "loc_05", "type": "REGISTERED_AT", "rec": "REC-000111", "exp": "Commercial lease for office at Connaught Place.", "conf": 0.97, "date": "2026-02-10"},
            {"id": "e34", "src": "person_08", "tgt": "vehicle_05", "type": "OWNS_OR_USES", "rec": "REC-000111", "exp": "Van utilized for transport of print equipment.", "conf": 0.89, "date": "2026-02-11"},

            # ---------------- Case 4: Operation Silver Stream (ATM Cash Out & Rapid Layering) ----------------
            {"id": "e35", "src": "person_10", "tgt": "case_node_04", "type": "INVOLVED_IN", "rec": "REC-000113", "exp": "Transaction recipient flagged in Case FIC-CASE-0004 inquiry.", "conf": 0.92, "date": "2026-02-25"},
            {"id": "e36", "src": "person_13", "tgt": "case_node_04", "type": "INVOLVED_IN", "rec": "REC-000114", "exp": "Field cash courier observed during ATM surveillance checks.", "conf": 0.90, "date": "2026-02-26"},
            {"id": "e37", "src": "person_10", "tgt": "acc_04", "type": "ASSOCIATED_WITH", "rec": "REC-000113", "exp": "Account holder registration on record.", "conf": 0.99, "date": "2026-02-25"},
            {"id": "e38", "src": "acc_04", "tgt": "acc_05", "type": "TRANSFERRED_MONEY_TO", "rec": "REC-000113", "exp": "Pass-through wire to secondary mule account.", "conf": 0.98, "date": "2026-02-25"},
            {"id": "e39", "src": "person_13", "tgt": "acc_05", "type": "ASSOCIATED_WITH", "rec": "REC-000113", "exp": "Mule account beneficiary on record.", "conf": 0.95, "date": "2026-02-25"},
            {"id": "e40", "src": "person_10", "tgt": "vehicle_04", "type": "OWNS_OR_USES", "rec": "REC-000114", "exp": "Observed driving hatchback DL-03-GH-3456 at ATM location.", "conf": 0.88, "date": "2026-02-26"},
            {"id": "e41", "src": "person_10", "tgt": "loc_06", "type": "PRESENT_AT", "rec": "REC-000114", "exp": "CCTV log confirming physical withdrawal at South Extension ATM.", "conf": 0.94, "date": "2026-02-26"},
            {"id": "e42", "src": "person_10", "tgt": "phone_09", "type": "OWNS_PHONE", "rec": "REC-000113", "exp": "Mobile terminal linked to online banking transactions.", "conf": 0.97, "date": "2026-02-25"},

            # ---------------- Case 5: Case Blue Horizon (Cellular SIM Gateway Box) ----------------
            {"id": "e43", "src": "person_03", "tgt": "case_node_05", "type": "INVOLVED_IN", "rec": "REC-000115", "exp": "Named in Case 5 FIR 540/2025 regarding unauthorized cellular relay.", "conf": 0.95, "date": "2025-11-05"},
            {"id": "e44", "src": "person_05", "tgt": "case_node_05", "type": "INVOLVED_IN", "rec": "REC-000115", "exp": "Co-lessee of premises housing 64-port SIM relay gateway.", "conf": 0.91, "date": "2025-11-05"},
            {"id": "e45", "src": "person_15", "tgt": "case_node_05", "type": "INVOLVED_IN", "rec": "REC-000115", "exp": "Hardware technician configuring GSM antennae array.", "conf": 0.89, "date": "2025-11-06"},
            {"id": "e46", "src": "person_03", "tgt": "loc_04", "type": "PRESENT_AT", "rec": "REC-000115", "exp": "Historical rental agreement and presence at Dwarka premises.", "conf": 0.90, "date": "2025-11-05"},
            {"id": "e47", "src": "person_05", "tgt": "vehicle_02", "type": "OWNS_OR_USES", "rec": "REC-000115", "exp": "SUV vehicle HR-26-CD-5678 parked at safehouse.", "conf": 0.92, "date": "2025-11-05"},
            {"id": "e48", "src": "person_03", "tgt": "phone_04", "type": "OWNS_PHONE", "rec": "REC-000115", "exp": "Command & control terminal for SIM relay setup.", "conf": 0.96, "date": "2025-11-05"},
            {"id": "e49", "src": "phone_04", "tgt": "phone_11", "type": "CALLED", "rec": "REC-000115", "exp": "Automated heartbeat pings between SIM gateway endpoints.", "conf": 0.99, "date": "2025-11-05"},
            {"id": "e50", "src": "person_15", "tgt": "phone_11", "type": "OWNS_PHONE", "rec": "REC-000115", "exp": "Technician endpoint registered on local tower.", "conf": 0.94, "date": "2025-11-05"},

            # ---------------- Case 6: Operation Asteroid (Phishing Gateway Infrastructure) ----------------
            {"id": "e51", "src": "person_14", "tgt": "case_node_06", "type": "INVOLVED_IN", "rec": "REC-000116", "exp": "Lead administrator for proxy phishing domains.", "conf": 0.96, "date": "2026-03-01"},
            {"id": "e52", "src": "person_14", "tgt": "org_05", "type": "ASSOCIATED_WITH", "rec": "REC-000116", "exp": "Managing owner of Apex Tech Gateway Solutions.", "conf": 0.97, "date": "2026-03-01"},
            {"id": "e53", "src": "person_14", "tgt": "phone_10", "type": "OWNS_PHONE", "rec": "REC-000116", "exp": "Verified WHOIS administrative contact phone number.", "conf": 0.98, "date": "2026-03-01"},
            {"id": "e54", "src": "org_05", "tgt": "loc_07", "type": "REGISTERED_AT", "rec": "REC-000116", "exp": "Hosting gateway cluster Node 99.", "conf": 0.95, "date": "2026-03-01"},
            {"id": "e55", "src": "person_16", "tgt": "case_node_06", "type": "INVOLVED_IN", "rec": "REC-000116", "exp": "Digital operations coordinator linked to proxy domain routing.", "conf": 0.94, "date": "2026-03-01"},
            {"id": "e56", "src": "person_16", "tgt": "org_05", "type": "ASSOCIATED_WITH", "rec": "REC-000116", "exp": "Technical administrator on hosting infrastructure.", "conf": 0.95, "date": "2026-03-01"},

            # ---------------- Inter-Case Intelligence Bridges (Syndicate Overlap) ----------------
            {"id": "e57", "src": "acc_02", "tgt": "acc_03", "type": "TRANSFERRED_MONEY_TO", "rec": "REC-000109", "exp": "Cross-case illicit remittance: INR 2,200,000 transferred from Case 1 entity (Sunita Rao) to Case 2 carrier account (Lotus Transit).", "conf": 1.0, "date": "2026-02-20"},
            {"id": "e58", "src": "acc_03", "tgt": "acc_04", "type": "TRANSFERRED_MONEY_TO", "rec": "REC-000113", "exp": "Cross-case rapid layering: Pass-through funds from Case 2 (Lotus Transit) structured into Case 4 mule account (Tarun Joshi).", "conf": 0.99, "date": "2026-02-25"},
            {"id": "e59", "src": "person_08", "tgt": "person_12", "type": "LINKED_THROUGH_REPORT", "rec": "REC-000111", "exp": "Cross-case forged credential link: Falcon Document Solutions (Case 3) produced counterfeit identity documentation for Case 1 suspect alias R Sharma.", "conf": 0.92, "date": "2026-02-10"},
            {"id": "e60", "src": "person_01", "tgt": "phone_03", "type": "CALLED", "rec": "REC-000102", "exp": "Cross-case contact bridge: Priya Verma (Case 1) maintained 22 high-frequency calls with Amit Patel's secondary terminal (Case 5).", "conf": 0.98, "date": "2026-03-01"},
            {"id": "e61", "src": "org_05", "tgt": "phone_04", "type": "CALLED", "rec": "REC-000116", "exp": "Cross-case cyber gateway connection: Phishing domain cluster (Case 6) routed automated SMS lures through 64-port SIM relay box (Case 5).", "conf": 0.97, "date": "2026-03-01"},
        ]

        for rel in relationships_seed:
            props = {
                "id": rel["id"],
                "source_record_id": rel["rec"],
                "explanation": rel["exp"],
                "confidence": rel["conf"],
                "date": rel["date"],
                "is_synthetic": True,
            }
            neo4j_service.mock_store.add_edge(
                edge_id=rel["id"],
                source_id=rel["src"],
                target_id=rel["tgt"],
                rel_type=rel["type"],
                properties=props,
            )

            if neo4j_service.is_connected:
                cypher = f"""
                MATCH (s {{id: $src}}), (t {{id: $tgt}})
                MERGE (s)-[r:{rel['type']} {{id: $id}}]->(t)
                SET r += $props
                """
                neo4j_service.run_query(
                    cypher,
                    {"src": rel["src"], "tgt": rel["tgt"], "id": rel["id"], "props": props},
                )

        print(f"[+] Loaded {len(relationships_seed)} graph relationships with source record traceability.")

        # ---------------------------------------------------------------------
        # 6. SEED EXTRACTED ENTITIES (Human-In-The-Loop Review Staging)
        # ---------------------------------------------------------------------
        extractions_seed = [
            # Core Baseline Entities (Already Approved to Graph)
            {"rec": "REC-000101", "type": "Person", "raw": "Priya Verma", "norm": "Priya Verma", "conf": 0.98, "snippet": "operated by Priya Verma and Rohit Sharma", "status": "approved"},
            {"rec": "REC-000101", "type": "Person", "raw": "Rohit Sharma", "norm": "Rohit Sharma", "conf": 0.96, "snippet": "Priya Verma and Rohit Sharma from Sector 62", "status": "approved"},
            {"rec": "REC-000101", "type": "Vehicle", "raw": "DL-01-AB-1234", "norm": "DL-01-AB-1234", "conf": 0.97, "snippet": "Vehicle DL-01-AB-1234 observed on premises", "status": "approved"},
            {"rec": "REC-000102", "type": "Phone", "raw": "+9190XXXXXX01", "norm": "+9190XXXXXX01", "conf": 0.99, "snippet": "Call record extract for +9190XXXXXX01 showing 48 calls", "status": "approved"},
            {"rec": "REC-000101", "type": "Location", "raw": "Sector 62 Noida Hub", "norm": "Sector 62 Noida", "conf": 0.96, "snippet": "premises located at Sector 62 Noida premises", "status": "approved"},
            {"rec": "REC-000101", "type": "Organisation", "raw": "Maya Infotech Pvt Ltd", "norm": "Maya Infotech Pvt Ltd", "conf": 0.99, "snippet": "transactions through Maya Infotech Pvt Ltd", "status": "approved"},
            {"rec": "REC-000103", "type": "BankAccount", "raw": "8899001122", "norm": "XXXX-XXXX-1122", "conf": 0.98, "snippet": "wired INR 4,500,000 from Account 8899001122", "status": "approved"},
            {"rec": "REC-000103", "type": "BankAccount", "raw": "3344556677", "norm": "XXXX-XXXX-6677", "conf": 0.98, "snippet": "deposited into Account 3344556677 held by Sunita Rao", "status": "approved"},
            {"rec": "REC-000106", "type": "Person", "raw": "R Sharma", "norm": "R Sharma", "conf": 0.89, "snippet": "issued under subscriber name R Sharma", "status": "approved"},
            {"rec": "REC-000101", "type": "Person", "raw": "Rahul Sharma", "norm": "Rahul Sharma", "conf": 0.93, "snippet": "mandate records as Rahul Sharma", "status": "approved"},
            {"rec": "REC-000107", "type": "Person", "raw": "Deepa Nair", "norm": "Deepa Nair", "conf": 0.95, "snippet": "managed by endpoint holder Deepa Nair", "status": "approved"},
            {"rec": "REC-000111", "type": "Person", "raw": "Rajesh Gupta", "norm": "Rajesh Gupta", "conf": 0.97, "snippet": "headed by director Rajesh Gupta", "status": "approved"},
            {"rec": "REC-000104", "type": "Vehicle", "raw": "HR-26-CD-5678", "norm": "HR-26-CD-5678", "conf": 0.95, "snippet": "operating black SUV vehicle DL-01-CD-5678", "status": "approved"},
            {"rec": "REC-000110", "type": "Vehicle", "raw": "MH-04-EF-9012", "norm": "MH-04-EF-9012", "conf": 0.96, "snippet": "heavy vehicle MH-04-EF-9012 registered to Lotus Transit", "status": "approved"},
            {"rec": "REC-000114", "type": "Vehicle", "raw": "DL-03-GH-3456", "norm": "DL-03-GH-3456", "conf": 0.94, "snippet": "utilizing ATM with vehicle DL-03-GH-3456", "status": "approved"},
            {"rec": "REC-000102", "type": "Phone", "raw": "+9190XXXXXX02", "norm": "+9190XXXXXX02", "conf": 0.99, "snippet": "exchanges with +9190XXXXXX02 and +9190XXXXXX03", "status": "approved"},
            {"rec": "REC-000108", "type": "Phone", "raw": "+9190XXXXXX05", "norm": "+9190XXXXXX05", "conf": 0.98, "snippet": "traffic between +9190XXXXXX05 and +9190XXXXXX06", "status": "approved"},
            {"rec": "REC-000112", "type": "Phone", "raw": "+9190XXXXXX07", "norm": "+9190XXXXXX07", "conf": 0.97, "snippet": "co-location between +9190XXXXXX07 and +9190XXXXXX08", "status": "approved"},
            {"rec": "REC-000104", "type": "Location", "raw": "Fictional Metro Plaza", "norm": "Metro Plaza", "conf": 0.94, "snippet": "visual surveillance log at Metro Plaza", "status": "approved"},
            {"rec": "REC-000112", "type": "Location", "raw": "Connaught Place Complex", "norm": "Connaught Place", "conf": 0.95, "snippet": "coordinates at Connaught Place Hub", "status": "approved"},
            {"rec": "REC-000109", "type": "Organisation", "raw": "Lotus Transit Logistics", "norm": "Lotus Transit Logistics", "conf": 0.98, "snippet": "registered under Lotus Transit Logistics", "status": "approved"},
            {"rec": "REC-000111", "type": "Organisation", "raw": "Falcon Document Solutions", "norm": "Falcon Document Solutions", "conf": 0.97, "snippet": "guise of Falcon Document Solutions", "status": "approved"},
            {"rec": "REC-000109", "type": "BankAccount", "raw": "5566778899", "norm": "XXXX-XXXX-8899", "conf": 0.97, "snippet": "remittance to Account 5566778899 registered to Lotus Transit", "status": "approved"},
        ]

        for ext in extractions_seed:
            rec_obj = record_map.get(ext["rec"])
            if rec_obj:
                existing_ext = db.query(ExtractedEntity).filter(
                    ExtractedEntity.source_record_id == rec_obj.id,
                    ExtractedEntity.raw_value == ext["raw"]
                ).first()
                if not existing_ext:
                    is_app = ext.get("status") == "approved"
                    ee = ExtractedEntity(
                        id=str(uuid.uuid4()),
                        source_record_id=rec_obj.id,
                        entity_type=ext["type"],
                        raw_value=ext["raw"],
                        normalized_value=ext["norm"],
                        confidence=ext["conf"],
                        context_snippet=ext["snippet"],
                        status=ext.get("status", "pending"),
                        created_at=datetime.now(timezone.utc),
                        reviewed_by=admin_user.id if (is_app and admin_user) else None,
                        reviewed_at=datetime.now(timezone.utc) if is_app else None,
                    )
                    db.add(ee)

        print(f"[+] Loaded {len(extractions_seed)} staged extraction entities for review.")

        # ---------------------------------------------------------------------
        # 7. SEED ENTITY MATCH CANDIDATES
        # ---------------------------------------------------------------------
        # 7. SEED INITIAL ENTITY RESOLUTION CANDIDATES (Idempotent)
        # ---------------------------------------------------------------------
        def seed_candidate(node_a_id: str, node_b_id: str, conf: float, reason: str):
            ge_a = db.query(GraphEntity).filter(GraphEntity.neo4j_node_id == node_a_id).first()
            ge_b = db.query(GraphEntity).filter(GraphEntity.neo4j_node_id == node_b_id).first()
            if ge_a and ge_b:
                existing = db.query(EntityMatchCandidate).filter(
                    (
                        (EntityMatchCandidate.entity_a_id == ge_a.id)
                        & (EntityMatchCandidate.entity_b_id == ge_b.id)
                    )
                    | (
                        (EntityMatchCandidate.entity_a_id == ge_b.id)
                        & (EntityMatchCandidate.entity_b_id == ge_a.id)
                    )
                ).first()
                if not existing:
                    cand = EntityMatchCandidate(
                        id=str(uuid.uuid4()),
                        entity_a_id=ge_a.id,
                        entity_b_id=ge_b.id,
                        match_confidence=conf,
                        match_reason=reason,
                        status="pending",
                        created_at=datetime.now(timezone.utc),
                    )
                    db.add(cand)

        seed_candidate(
            "person_11",
            "person_12",
            0.92,
            "Identical surname and initial match across bank records and subscriber invoices.",
        )
        seed_candidate(
            "person_10",
            "person_19",
            0.94,
            "Middle initial addition ('Tarun Joshi' vs 'Tarun K. Joshi') verified against passport and banking records.",
        )
        seed_candidate(
            "vehicle_01",
            "vehicle_06",
            0.98,
            "Exact alphanumeric match on RTO vehicle registration number across toll plaza logs ('DL-01-AB-1234' vs 'DL01AB1234').",
        )
        seed_candidate(
            "person_05",
            "person_17",
            0.90,
            "Given name orthographic variation ('Vikram' vs 'Vikramaditya') with identical surname across FIC-CASE-0001 & FIC-CASE-0002.",
        )
        seed_candidate(
            "person_13",
            "person_18",
            0.89,
            "Initial abbreviation ('M.') matching full given name 'Manish' with shared telecom contacts.",
        )
        seed_candidate(
            "person_02",
            "person_12",
            0.88,
            "Initial abbreviation ('R.') matching surname 'Sharma' across FIC-CASE-0001 records.",
        )
        seed_candidate(
            "org_01",
            "org_06",
            0.87,
            "High corporate legal entity name similarity ('Maya Infotech Pvt Ltd' vs 'Maya Infotech Solutions').",
        )

        # ---------------------------------------------------------------------
        # 8. SEED INVESTIGATION ALERTS
        # ---------------------------------------------------------------------
        alerts_seed = [
            {
                "rule_name": "SHARED_HIGH_RISK_IDENTIFIER",
                "title": "Shared Phone Identifier: +9190XXXXXX02",
                "description": "Phone number +9190XXXXXX02 appears connected to multiple individuals (Rohit Sharma & R Sharma) across independent case records.",
                "severity": "HIGH",
                "threshold": "Rule threshold: >= 2 persons connected to single Phone (Found: 2).",
                "entities": ["phone_02", "person_02", "person_12"],
                "records": ["REC-000102", "REC-000106"],
            },
            {
                "rule_name": "HIGH_FREQUENCY_COMMUNICATION_BRIDGE",
                "title": "Central Communications Relay Bridge: +9190XXXXXX01",
                "description": "Central communication terminal +9190XXXXXX01 exhibits high-degree call frequency with 3+ distinct suspect endpoints during anomalous hours.",
                "severity": "HIGH",
                "threshold": "Rule threshold: >= 3 unique contact partners in call logs (Found: 3).",
                "entities": ["phone_01", "phone_02", "phone_03"],
                "records": ["REC-000102"],
            },
            {
                "rule_name": "CROSS_CASE_ENTITY_OVERLAP",
                "title": "Cross-Case Subject Linkage: Amit Patel",
                "description": "Subject Amit Patel (person_03) identified actively operating across 2 separate inquiries (FIC-CASE-0001 and FIC-CASE-0005).",
                "severity": "HIGH",
                "threshold": "Rule threshold: Entity linked to >= 2 active cases (Found: 2).",
                "entities": ["person_03", "case_node_01", "case_node_05"],
                "records": ["REC-000101", "REC-000115"],
            },
            {
                "rule_name": "CIRCULAR_WIRE_TRANSFER",
                "title": "Multi-Account Rapid Layering Circuit: Account 8899001122",
                "description": "Inter-bank pass-through transactions detected transferring structured funds across sequential accounts within 24 hours.",
                "severity": "MEDIUM",
                "threshold": "Rule threshold: Multi-hop transaction pass-through velocity >= 2 accounts (Found: 3).",
                "entities": ["acc_01", "acc_02", "acc_03"],
                "records": ["REC-000103", "REC-000109"],
            },
        ]

        for al in alerts_seed:
            existing_al = db.query(Alert).filter(Alert.title == al["title"]).first()
            if not existing_al:
                alt = Alert(
                    id=str(uuid.uuid4()),
                    rule_name=al["rule_name"],
                    title=al["title"],
                    description=al["description"],
                    severity=al["severity"],
                    threshold_description=al["threshold"],
                    supporting_entity_ids=al["entities"],
                    supporting_record_ids=al["records"],
                    status="unreviewed",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(alt)

        # ---------------------------------------------------------------------
        # 9. SEED AUDIT LOGS (Genesis chain)
        # ---------------------------------------------------------------------
        existing_audit = db.query(AuditLog).first()
        if not existing_audit:
            write_sync_audit_log(
                db=db,
                action="system_init",
                user_id=admin_user.id if admin_user else None,
                target_type="system",
                target_id="genesis_block",
                metadata={"message": "System initialized and synthetic dataset seeded.", "is_synthetic": True},
            )
            write_sync_audit_log(
                db=db,
                action="seed_data",
                user_id=admin_user.id if admin_user else None,
                target_type="database",
                target_id="full_dataset",
                metadata={"cases_count": len(cases_seed), "records_count": len(records_seed), "entities_count": len(entities_seed)},
            )
            print("[+] Seeded genesis cryptographic audit chain blocks.")

        db.commit()
        print("[+] Synthetic Data Seeding completed successfully!")
        return True

    except Exception as e:
        db.rollback()
        print(f"[!] Error during seeding: {e}")
        raise e
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    import sys
    do_reset = "--reset" in sys.argv
    seed_database(reset=do_reset)
