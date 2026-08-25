# Five-Minute Evaluation & Hackathon Demo Script
## AI-Powered Criminal Network Analysis System (Decision-Support Tool)
**Smart India Hackathon — Problem Statement ID: 26189**  
**Organisation:** Ministry of Home Affairs | **Department:** NCRB, Women Safety Division

---

## Demo Timing Breakdown

### 1. (0:00 – 0:30) Introduction & Role-Based Authentication
- **Action:** Open application at `http://localhost:5173`.
- **Narration:**
  > "Welcome. Today we present our AI-Powered Network Analysis System for the Ministry of Home Affairs, NCRB Women Safety Division. This is strictly a decision-support tool to assist human investigators in uncovering hidden links across fragmented records. We log in as `investigator1`."
- **Visuals:** Click demo login button `investigator1 / Investigator@123`. Lands on the Dashboard with metric cards and recent case activities.

---

### 2. (0:30 – 1:30) Case Overview & Graph Exploration
- **Action:** Click "Network Graph" in the left sidebar or select `FIC-CASE-0001: Operation Maya Orchid`.
- **Narration:**
  > "Notice the disclaimer banner permanently rendered at the bottom: 'Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.' Our dark Cytoscape canvas renders entities like individuals, phones, vehicles, and bank accounts in distinct, accessible colors."
- **Visuals:** Pan and zoom around the graph. Search for "Priya Verma" or "+91-9XXXX-XX001" in the search box; the graph smoothly centers on the node.

---

### 3. (1:30 – 2:30) Explainability & Evidence Traceability
- **Action:** Click on a Node, then click on an Edge between two entities.
- **Narration:**
  > "Every connection must be explainable. When we select a Person node, the Node Profile Drawer opens showing linked cases and associated entities. Note that sensitive phone numbers and accounts are masked by default. Clicking 'Reveal' logs an audit event."
  > "When we click a relationship edge, the Edge Evidence Panel appears, revealing the originating source record code (e.g. REC-000101), the relationship explanation, confidence rating, and timestamp. If evidence is lacking, it explicitly states 'Insufficient evidence.' No unexplained links exist."

---

### 4. (2:30 – 3:15) Multi-Degree Expansion & Subgraph Filtering
- **Action:** Click the "Expand (Depth 2)" button on a selected node. Use the filter panel on the left to filter by relationship type (e.g., `CALLED` or `TRANSFERRED_MONEY_TO`).
- **Narration:**
  > "Investigators can explore multi-hop connections dynamically. Clicking 'Expand' queries 2nd-degree neighbors and merges them onto the canvas with physics layout. Investigators can filter by relationship types or entity categories without page reload."

---

### 5. (3:15 – 4:00) Tamper-Evident SHA-256 Audit Chain
- **Action:** Switch user to `supervisor1` or `admin1`. Navigate to the "Audit Log" page. Click "Verify Chain".
- **Narration:**
  > "Security and chain-of-custody are critical for law enforcement. Every user action—login, record lookup, unmasking, search—is cryptographically hashed into an append-only SHA-256 hash chain in PostgreSQL. Clicking 'Verify Chain' validates every sequential hash. If any record is maliciously modified or dropped, the system detects the exact broken sequence number."

---

### 6. (4:00 – 4:40) Safety, Ethics & Non-Negotiable Rules
- **Narration:**
  > "We have strictly adhered to SIH and NCRB ethical requirements:
  > 1. No banned labels: zero occurrence of 'criminal', 'mastermind', 'kingpin', 'risk score', or 'threat level'.
  > 2. No automated arrest decisions, predictive policing, or facial recognition.
  > 3. 100% synthetic, fictional test datasets with `is_synthetic: true`.
  > 4. Audited data masking for privacy."

---

### 7. (4:40 – 5:00) Roadmap & Closing
- **Narration:**
  > "In Phase 2, we bring automated NLP entity extraction from raw FIRs/CDRs and entity resolution. In Phase 3, we introduce graph centrality metrics, rule-based alerts, and automated investigative briefs with PDF export. Thank you."
