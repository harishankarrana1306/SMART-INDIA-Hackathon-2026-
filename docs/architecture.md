# System Architecture & Technical Design
## AI-Powered Criminal Network Analysis System (Decision-Support Tool)
**Smart India Hackathon — Problem Statement ID: 26189**  
**Organisation:** Ministry of Home Affairs | **Department:** NCRB, Women Safety Division

---

## 1. System Overview & Ethics Guardrails

The **AI-Powered Criminal Network Analysis System** is an advanced investigation decision-support platform designed for law enforcement analysts and investigating officers. It enables discovery and visualization of hidden relationships across fragmented datasets (FIRs, CDRs, financial records, surveillance logs).

### Ethical Guardrails & Compliance
1. **Decision-Support Only:** The system does not make determinations of guilt or innocence, automated arrest recommendations, or automated threat scores.
2. **Explainable Graph Links:** Every node link is backed by explicit source record evidence (`source_record_id`, date, confidence, explanation text).
3. **Data Masking:** Sensitive identifiers (phone numbers, bank accounts) are masked by default with audited unmasking.
4. **Tamper-Evident Hash Chain:** All user actions (logins, searches, unmasking, record accesses) are recorded in an append-only cryptographic hash chain (`SHA-256`).
5. **Strict Synthetic Data Sandbox:** All development, testing, and demonstration data is 100% fictional and marked with `is_synthetic: true`.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                         React 18 + Vite Frontend                        |
|  - Cytoscape.js Network Graph (Cola / CoSE physics layout)              |
|  - Node Profile Drawer & Edge Evidence Viewer                           |
|  - Cryptographic Hash Chain Audit Explorer                              |
|  - Role-Based AppShell (Investigator, Supervisor, Administrator)       |
+------------------------------------+------------------------------------+
                                     | REST (JSON / JWT)
                                     v
+-------------------------------------------------------------------------+
|                         FastAPI Backend Service                         |
|  - RBAC & JWT Security Layer                                            |
|  - Tamper-Evident SHA-256 Audit Log Engine                             |
|  - Graph API (Subgraphs, Expansions, Entity Profiles, Edge Evidence)    |
|  - Synthetic Idempotent Seeder Engine                                   |
+-------------------+--------------------------------+--------------------+
                    |                                |
                    v                                v
+-----------------------------------+  +----------------------------------+
|      PostgreSQL 16 Database       |  |      Neo4j 5.x Graph Engine      |
|  - Users & Roles (RBAC)           |  |  - Entities (Person, Phone,      |
|  - Cases & Synthetic Records      |  |    Vehicle, Location, Bank, Org) |
|  - Extracted Entity Staging       |  |  - Relationships (INVOLVED_IN,   |
|  - Entity Match Candidates        |  |    CALLED, PRESENT_AT,           |
|  - SHA-256 Audit Hash Chain Logs  |  |    TRANSFERRED_MONEY_TO, etc.)   |
+-----------------------------------+  +----------------------------------+
```

---

## 3. Database Schema

### 3.1 PostgreSQL (Relational & Audit Store)
- **`users`**: RBAC credentials (bcrypt hashed), roles (`investigator`, `supervisor`, `administrator`).
- **`cases`**: Synthetic case metadata (`case_code`, `title`, `case_type`, `status`).
- **`source_records`**: Raw multi-source intelligence records (FIR, CDR, financial, surveillance, social media, history).
- **`extracted_entities`**: Entities extracted from source records awaiting review.
- **`graph_entities`**: Synchronization mirror between relational records and Neo4j node IDs.
- **`entity_match_candidates`**: Entity resolution staging candidates for merge review.
- **`alerts`**: Rule-based notification items requiring human investigator verification.
- **`audit_logs`**: Tamper-evident ledger linking sequential actions with SHA-256 hash chains.

### 3.2 Neo4j (Graph Engine)
- **Labels:** `:Person`, `:Phone`, `:Vehicle`, `:Location`, `:Organisation`, `:BankAccount`, `:Case`, `:Incident`.
- **Relationships:** `INVOLVED_IN`, `LINKED_THROUGH_REPORT`, `CALLED`, `TRANSFERRED_MONEY_TO`, `OWNS_OR_USES`, `REGISTERED_AT`, `PRESENT_AT`, `ASSOCIATED_WITH`, `OWNS_PHONE`.
- **Evidence Linking:** Every relationship edge retains `source_record_id`, `explanation`, `confidence`, and `date`.

---

## 4. Cryptographic Hash Chain Audit Engine

Each audit log entry computes a cryptographic block hash:
$$\text{record\_hash} = \text{SHA256}(\text{seq\_no} \parallel \text{user\_id} \parallel \text{action} \parallel \text{target\_type} \parallel \text{target\_id} \parallel \text{metadata\_json} \parallel \text{timestamp} \parallel \text{prev\_hash})$$

- **Genesis Block:** `0000000000000000000000000000000000000000000000000000000000000000`
- **Verification:** An on-demand verification endpoint walks the entire chain from `seq_no = 1` to `N` and recalculates hashes. Any modification or deletion is immediately detected and pinpoints `first_broken_seq`.

---

## 5. UI/UX Design System

- **Color Tokens:**
  - Canvas / Background: `#0B0D1B` (Graph Canvas), `#F7F7FC` (App Shell)
  - Primary Purple: `#5F01FB`
  - Secondary Indigo: `#514A85`
  - Border: `#E8E6F1`
  - Text: `#1F2937` (Primary), `#6B6980` (Muted)
- **Node Colors:**
  - Person: `#5F01FB`
  - Phone: `#8B5CF6`
  - Vehicle: `#514A85`
  - Location: `#38BDF8`
  - Organisation: `#A78BFA`
  - Bank Account: `#14B8A6`
  - Case / Incident: `#F59E0B`
