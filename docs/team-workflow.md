# Team Workflow & Collaboration Guidelines (6 Members)
## AI-Powered Criminal Network Analysis System (Decision-Support Tool)
**Smart India Hackathon — Problem Statement ID: 26189**

---

## 1. Team Roles & Responsibilities

| Role | Member Focus | Primary Areas |
|---|---|---|
| **Member A** | Backend: Auth, Security & RBAC | JWT auth, role decorators, user seeding, security headers |
| **Member B** | Backend: Graph & PostgreSQL Schema | Postgres models, Alembic migrations, Neo4j driver, graph API |
| **Member C** | Backend: Audit & Cryptography | SHA-256 hash-chain engine, unmasking audit, Phase 2 NLP |
| **Member D** | Frontend: Shell & Dashboard | AppShell, Sidebar, Topbar, AuthContext, Dashboard views |
| **Member E** | Frontend: Graph Visualization | Cytoscape.js canvas, filters, profile drawer, evidence panel |
| **Member F** | DevOps, Testing, QA & Compliance | Docker Compose, README, test suites, ethical rules auditing |

---

## 2. Git Branching Strategy

- **Protected Main Branch:** `main` (requires code review & passing automated tests).
- **Feature Branches:**
  - `feature/auth-rbac`
  - `feature/postgres-neo4j-schema`
  - `feature/audit-hash-chain`
  - `feature/cytoscape-graph-ui`
  - `feature/dashboard-stat-cards`
- **Fix Branches:**
  - `fix/graph-expand-dedup`
  - `fix/audit-verify-corner-case`

---

## 3. Pull Request Checklist

Before submitting any Pull Request, ensure:
- [ ] No prohibited terms present in code, comments, or copy (`criminal`, `mastermind`, `kingpin`, `suspect score`, `threat level`, `risk score`).
- [ ] All new data entities have `is_synthetic: true`.
- [ ] All new graph edges include `source_record_id`, `explanation`, and `confidence`.
- [ ] Sensitive fields (phone, bank account) are masked by default.
- [ ] Unit tests pass via `pytest backend/tests`.
- [ ] Disclaimer banner appears on all investigative views.
