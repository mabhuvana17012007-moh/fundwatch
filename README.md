# FUNDWATCH — Explainable Public Spending Anomaly Detection & Monitoring Dashboard

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **IMPORTANT DISCLAIMER — DEMO / DERIVED DATA:**  
> Sample data included in this repository is used strictly for technical demonstration and system evaluation. It is **not** presented as official live MPLADS data. FundWatch is built with ready-to-connect gateway architecture to interface with authorized official state data feeds.

---

## 1. Project Overview & Problem Statement

**FundWatch** is an explainable public-spending anomaly detection and monitoring dashboard designed for Members of Parliament Local Area Development Scheme (**MPLADS**) projects.

### The Core Challenge
Public spending dashboards typically operate either as basic ledger viewers (failing to detect anomalies) or opaque "black-box" machine learning algorithms that output arbitrary risk percentages without explaining *why*. When public funds are scrutinized, accountability bodies and citizens need **transparent, defensible, explainable metrics**, not opaque scores.

### The FundWatch Philosophy
- **Explainable Statistics Over Black-Box AI:** FundWatch uses rigorous, explainable statistical methods: Z-score, Tukey's Interquartile Range (IQR), spending velocity acceleration, and historical baseline deviation.
- **Non-Accusatory Classification:** FundWatch **never** makes legal conclusions or automatically calls any project "corruption" or "fraud". Instead, it flags mathematical irregularities using disciplined terminology:
  - *Anomaly Detected*
  - *Requires Verification*
  - *Unusual Spending Pattern*
  - *Baseline Violated*
  - *Verification Required*
- **Human-in-the-Loop & Cryptographic Integrity:** Flags trigger a human verification workflow supported by SHA-256 evidence hashing to guarantee that site photos and invoices cannot be secretly altered or replaced after ingestion.

---

## 2. Technical Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM, Recharts, Lucide React, Leaflet, OpenStreetMap |
| **Backend** | Python 3.14, FastAPI, SQLAlchemy ORM, Pandas, NumPy, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL (Production) / SQLite (Zero-Config Development Fallback) |
| **Integrity** | SHA-256 Cryptographic Evidence Hashing, Dynamic Input Validation |
| **Forbidden Tech** | *SciPy, TensorFlow, PyTorch, YOLO, Blockchain, and LLM-based anomaly detection are strictly omitted in favor of lightweight, explainable statistics.* |

---

## 3. System Architecture

```
                                  FUNDWATCH SYSTEM PIPELINE
                                  
   +-----------------------------------------------------------------------------------+
   |                                 REACT FRONTEND                                    |
   |  * Dark Charcoal/Black Glassmorphism UI with Deep Crimson Glow                    |
   |  * 3D Mathematical Dispersion Radar (Canvas 60fps)                                |
   |  * Interactive Leaflet Map with Risk-Coded Geo Markers                            |
   |  * Recharts Monthly Trends, Component Attribution, and Peer Benchmarking          |
   |  * 9 Primary Routes: Dashboard, Projects, Agencies, Anomalies, Verification, etc.  |
   +------------------------------------------+----------------------------------------+
                                              | REST APIs (JSON)
                                              v
   +-----------------------------------------------------------------------------------+
   |                                FASTAPI BACKEND                                    |
   |  * Ingestion Pipeline: Column Normalization, Fuzzy Agency Canonicalization,        |
   |    Currency/Date Parsing, Deduplication & Quality Metric Auditing                 |
   |  * Statistical Anomaly Engine (Z-Score, IQR, Spending Velocity, Baseline Dev)     |
   |  * Transparent Scoring (0–100 Weighted Composite Scale)                           |
   |  * Rule-Based Natural Language Explainability Module                              |
   |  * SHA-256 Tamper-Detection Service                                               |
   +------------------------------------------+----------------------------------------+
                                              | SQLAlchemy ORM
                                              v
   +-----------------------------------------------------------------------------------+
   |                           DATABASE & PERSISTENCE                                  |
   |  PostgreSQL / SQLite Database:                                                    |
   |  projects, agencies, spending_records, anomalies, verification_cases, evidence    |
   +-----------------------------------------------------------------------------------+
```

---

## 4. Core Statistical Anomaly Methodology

FundWatch evaluates public expenditures across four orthogonal, explainable statistical dimensions:

### A. Z-Score (Standardized Variance from Mean)
$$Z = \frac{x - \mu}{\sigma}$$
- **Formula:** Evaluates how many standard deviations ($Z$) the current expenditure ($x$) deviates from the agency's historical mean ($\mu$).
- **Zero-Standard-Deviation Safeguard:** If variance $\sigma = 0$, the engine avoids division by zero and falls back to absolute difference tolerance.
- **Configurable Cutoff:** Default $Z \ge 3.0\sigma$.

### B. Interquartile Range (IQR Outlier Bounds)
- Computes the 25th percentile ($Q_1$) and 75th percentile ($Q_3$).
- $\text{IQR} = Q_3 - Q_1$
- $\text{Lower Bound} = Q_1 - 1.5 \times \text{IQR}$
- $\text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$
- Flags values falling outside these non-parametric dispersion fences.

### C. Spending Velocity Multiplier
$$\text{Velocity} = \frac{\text{Current Period Spending Rate}}{\text{Historical Average Spending Rate}}$$
- Compares recent 60-day disbursement velocity against the agency's historic average rate.
- Identifies unusual surges (e.g. $4.2\times$ acceleration).

### D. Historical Baseline Deviation
$$\text{Deviation (\%)} = \frac{x - \text{Baseline}}{\text{Baseline}} \times 100$$
- Quantifies the raw percentage divergence from the established historical benchmark.

### E. Transparent Composite Anomaly Score (0–100)
A weighted composite score is computed using configurable weights (adjustable in `/settings`):
- **Z-Score Contribution:** $30\%$
- **Spending Velocity Contribution:** $30\%$
- **IQR Dispersion Contribution:** $20\%$
- **Historical Deviation Contribution:** $20\%$

**Risk Tiers:**
- `0 – 30`: Low Risk (Normal monitoring)
- `31 – 60`: Medium Risk (Baseline Violated — Review Recommended)
- `61 – 80`: High Risk (Unusual Spending Pattern — Verification Required)
- `81 – 100`: Critical Risk (Multiple Indicators Flagged — Priority Audit)

---

## 5. First-Run Quickstart

The application works immediately out-of-the-box with pre-seeded, realistic MPLADS demo data.

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (Runs on port 8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

> **Database Behavior:**  
> The backend connects to PostgreSQL if `DATABASE_URL` is set in the environment. If PostgreSQL is not configured, it automatically falls back to an embedded SQLite database (`fundwatch.db`) and seeds it on startup.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (Runs on port 5173)
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 6. PostgreSQL Production Configuration

To connect FundWatch to a production PostgreSQL database:

1. Create a database in PostgreSQL:
   ```sql
   CREATE DATABASE fundwatch;
   ```
2. Set the environment variable in `backend/.env`:
   ```ini
   DATABASE_URL=postgresql://username:password@localhost:5432/fundwatch
   ```
3. Restart the backend. SQLAlchemy will automatically create all tables and populate the centralized dataset.

---

## 7. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check & service status |
| `GET` | `/api/summary` | Dynamic dashboard KPI metrics, spending trend, and risk distributions |
| `GET` | `/api/projects` | Filterable projects list (by State, Category, Agency, Risk, Search) |
| `GET` | `/api/projects/{id}` | Project dossier with historical stats, explanation, and monthly ledger |
| `GET` | `/api/agencies` | Implementing agencies scorecard and velocity rankings |
| `GET` | `/api/agencies/{id}` | Agency deep dive with spending trajectory and peer comparison |
| `GET` | `/api/anomalies` | Ranked anomalies list sorted by anomaly score desc |
| `GET` | `/api/anomalies/{id}` | Full anomaly diagnostics, component breakdown, and explanation |
| `GET` | `/api/anomalies/{id}/explanation` | Dedicated explainability module response |
| `GET` | `/api/verification` | Verification cases queue across all inspection stages |
| `GET` | `/api/verification/{id}` | Case review interface with SHA-256 evidence inspection |
| `PATCH`| `/api/verification/{id}` | Update case status (`Under Review`, `Verified`, `Rejected`, `Resolved`) |
| `POST` | `/api/evidence/upload` | Upload field photos with SHA-256 hash calculation |
| `GET` | `/api/map` | Geocoded project markers with coordinates and risk indicators |
| `GET` | `/api/data-quality` | Data quality scorecard, cleaning rules, and import audit logs |
| `GET` | `/api/settings` | Retrieve active statistical thresholds and scoring weights |
| `POST`| `/api/settings` | Dynamically update thresholds (Z-score cutoff, IQR multiplier, weights) |
| `POST`| `/api/data/upload` | Ingest and validate external CSV dataset |
| `POST`| `/api/mplads/update` | Authorized external API ingestion gateway |

---

## 8. Hackathon Demonstration Flow (Step-by-Step)

During a jury presentation, follow this 9-step demonstration story:

1. **Step 1: Open Dashboard (`/dashboard`)**
   - Present the 5 top-level KPI cards (18 Projects, ₹1063.5L Disbursed, 7 Agencies, 3 High/Critical, 2 Cases Under Verification).
   - Point out the **3D Mathematical Dispersion Radar** demonstrating how normal projects cluster along historical baselines while outliers drift outside.
2. **Step 2: Inspect Priority Anomalies Table**
   - Locate Rank #1 Critical Anomaly: **Work ID `MPLADS-2024-MH-4011`** (Community Health Center Modernization, Pune).
3. **Step 3: Open Anomaly Details (`/anomalies/1`)**
   - Point out the **Diagnostic Explainability Banner**:
     > *"Anomaly detected because current expenditure (₹79.0L) is 79.5% above the historical agency baseline (₹44.0L), the Z-score (3.70) exceeds the configured statistical threshold of 3.0, the value falls outside the IQR expected dispersion boundaries, and spending velocity is accelerating rapidly at 4.2× the historical average. Verification Required."*
   - Highlight the **Score Component Attribution Bar** showing how the 92/100 score is broken down transparently.
4. **Step 4: Drill into Project Details (`/projects/1`)**
   - Examine the **Historical Spending Trajectory Chart** showing steady spending (Jan ₹35L, Feb ₹38L, Mar ₹41L, Apr ₹44L) followed by a sharp divergence to ₹79L in August.
   - Contrast the 83% financial disbursement against the **lagging 48% physical progress**.
5. **Step 5: View Geographic Context (`/map`)**
   - Navigate to the Leaflet Map. Click the glowing red marker in Pune (`18.5204, 73.8567`) to view project popup metadata.
6. **Step 6: Open Human Verification Case (`/verification/1`)**
   - Open case `VER-2024-MH-001`.
   - Inspect the **Verification Governance Workflow** tracking the case from *Anomaly Flagged* through *Evidence Submitted*.
7. **Step 7: Inspect Evidence & SHA-256 Integrity**
   - Click the site photo (`pune_trauma_icu_wing_foundation_audit.jpg`).
   - Open the Cryptographic Evidence Modal and click **"Verify Bit Integrity"** to demonstrate how the SHA-256 hash (`8f4e2b...`) prevents post-hoc tampering.
8. **Step 8: Complete Human Review Decision**
   - Update the status from `Under Review` to `Verified` (or `Rejected`), enter auditor remarks, and click **Submit Verification Decision**.
   - Note the celebration animation and immediate update to the verification ledger.
9. **Step 9: Demonstrate Settings Tuning (`/settings`)**
   - Adjust the Z-Score threshold slider or component weights to show how the system is fully configurable by state finance auditors.

---

## 9. Non-Accusatory Classification Standard

FundWatch adheres strictly to legal and ethical standards for public analytics:
- Statistical algorithms detect **numerical variance**, not human intent.
- Terms like "fraud", "corruption", or "scam" are strictly barred in the code and user interface.
- All classifications prompt human auditor review through the formal **Verification Required** status.

---

## 10. Authors & Acknowledgments
Built for the National GovTech / Public Finance Hackathon. Developed with a dedication to open government transparency, explainable statistical modeling, and data integrity.
