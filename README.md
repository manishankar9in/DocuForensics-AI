# DocuForensics AI
> **AI-Powered Document Forensics and Contextual Intelligence System**  
> *A professional investigation workspace for human document forensic examiners.*

---

## 1. Project Overview & Objective

**DocuForensics AI** investigates digital and scanned business documents, extracts normalized financial/administrative fields, identifies visual anomalies and structural tampering indicators, compares related document sets (e.g. invoices vs. payment slips vs. contracts), maps findings directly to visual bounding-box coordinates on the original page, and compiles a comprehensive, immutable PDF investigation dossier.

### Key Forensic Principles
1. **Human-in-the-Loop Attestation**: The system surfaces *observed anomalies* and *contextual inconsistencies*; it **never** automatically declares a document "fraudulent". Human investigators review, confirm, or dismiss findings.
2. **Deterministic & Explainable**: Core normalization, math verification, date validation, and cross-document comparisons are backed by deterministic Python algorithms with zero hallucination risk.
3. **Evidence-Grounded**: Every detected discrepancy links to exact bounding box coordinates `[x0, y0, x1, y1]` on the source document page with side-by-side visual inspection.
4. **Resilient Architecture**: Automatic fallback between MongoDB Atlas and local offline JSON persistence, allowing the system to run in air-gapped environments without external paid APIs.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **State & Data**: TanStack Query (React Query) & Axios
- **Routing**: React Router v6
- **Canvas / PDF Viewing**: Interactive canvas overlay rendering bounding-box evidence highlights

### Backend
- **Framework**: Python 3.10+ with FastAPI & Uvicorn
- **PDF & Vector Processing**: PyMuPDF (`fitz`) for PDF page rasterization, text bounding-box extraction, and metadata inspection
- **Computer Vision & Image**: OpenCV (`opencv-python-headless`) and Pillow (`PIL`)
- **OCR Engine**: Tesseract OCR via `pytesseract` (graceful fallback to PyMuPDF vector text if binary is not installed)
- **Database**: Motor (Async MongoDB) with automatic fallback to persistent local JSON document store
- **Reporting**: ReportLab for generating official PDF investigation dossiers

---

## 3. System Architecture & Page Map

The application includes a public home page and secure account access, alongside a 9-screen investigative workflow:

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Product overview and entry point for account access. |
| `/login` | **Sign In** | Starts a secure investigator session. |
| `/signup` | **Create Account** | Creates an account and private case workspace. |
| `/dashboard` | **Dashboard** | Real-time aggregate statistics: total cases, processed documents, pending reviews, and recent investigations. |
| `/investigations/new` | **New Investigation** | Drag-and-drop batch upload supporting multiple related PDFs, PNGs, and JPEGs. |
| `/investigations/:id` | **Investigation Workspace** | Central command hub showing processing progress, document list, findings breakdown, and quick actions. |
| `/investigations/:id/documents/:docId` | **Document Viewer** | Two-panel inspector: high-resolution rendered original with bounding-box overlays alongside extracted fields & OCR blocks. |
| `/investigations/:id/compare` | **Cross-Document Comparison** | Multi-document matrix aligning normalized fields (totals, dates, vendor names) with mismatch indicators. |
| `/investigations/:id/findings` | **Findings & Evidence** | Filterable finding repository categorized by severity (Critical, Warning, Info) and review status (Unreviewed, Confirmed, Dismissed). |
| `/investigations/:id/report` | **Investigation Dossier** | Live report preview and one-click PDF dossier generator with embedded forensic evidence. |
| `/investigations` | **Investigation History** | Searchable archive of all historical investigations and audit logs. |
| `/settings` | **Settings & System Status** | System health, engine availability (OCR, storage mode, database mode), and configuration parameters. |

---

## 4. Quick Start Guide (Windows 11 / PowerShell)

### Prerequisites
- **Python 3.10+**: [python.org](https://www.python.org/) (ensure "Add Python to PATH" is checked)
- **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)
- *(Optional)* **Tesseract OCR**: For scanned paper OCR. Install from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) to `C:\Program Files\Tesseract-OCR\`.

---

### Step 1: Backend Setup & Launch

Open a PowerShell terminal:

```powershell
# Navigate to the backend directory
cd "d:\YELLUMGUDLA MANI SHANKAR\UNSTOP\backend"

# Create a Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### Account security

- Create an account at `/signup` with a valid email address and a password of at least 12 characters.
- Sessions use an HTTP-only cookie; passwords are stored as salted PBKDF2-SHA256 hashes. The API validates browser request origins for state-changing requests.
- Investigations and their documents, findings, and reports are private to the account that created them.
- Set `APP_ENV=production` when deploying over HTTPS so session cookies are marked `Secure` and can be used with a separately hosted frontend.
- Existing investigations without an account owner are not exposed to newly registered accounts.

---

### Step 2: Frontend Setup & Launch

Open a second PowerShell terminal:

```powershell
# Navigate to the frontend directory
cd "d:\YELLUMGUDLA MANI SHANKAR\UNSTOP\frontend"

# Install npm dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```

- Application UI: **`http://localhost:5173`**

---

## 5. Sample Investigation Walkthrough

DocuForensics AI includes synthetic multi-document test cases in `backend/sample_data/`:
1. `invoice_vendor_a.pdf`: Legitimate billing invoice ($14,500.00, Date: 2026-11-02, QuickBooks producer)
2. `invoice_modified_canva.pdf`: Altered invoice ($18,900.00, Future Date: 2027-01-15, Canva Online Editor producer)
3. `bank_deposit_slip.png`: Scanned commercial bank voucher ($11,500.00)

### To run the automated end-to-end verification script:

```powershell
cd "d:\YELLUMGUDLA MANI SHANKAR\UNSTOP\backend"
powershell -NoProfile -ExecutionPolicy Bypass -File .\run_e2e.ps1
```

The script executes the full forensic cycle:
1. Verifies API and local document store health.
2. Creates an investigation case.
3. Uploads multi-document bundles.
4. Extracts metadata, line items, and bounding box coordinates.
5. Runs cross-document discrepancy correlation (flags date anomalies, editor artifacts, and financial variances).
6. Simulates human examiner review and finding attestation.
7. Generates an official PDF investigation dossier at `backend/test_output_dossier.pdf`.

---

## 6. Deterministic Forensic Capabilities

| Category | Forensic Rule / Check | Output & Evidence |
|---|---|---|
| **Visual Forensics** | PDF Producer / Creator inspection | Flags consumer editors (Canva, Photoshop, Sejda, iLovePDF) often used for unauthorized alterations. |
| **Visual Forensics** | Timestamp Differential | Flags documents where `modDate` significantly postdates `creationDate`. |
| **Contextual** | Future-dated Document Check | Compares document date against system inspection date. |
| **Contextual** | Missing Mandatory Fields | Identifies missing vendor names, invoice numbers, or payment terms. |
| **Cross-Document** | Amount Variance Detection | Normalizes currencies and flags arithmetic discrepancies across invoices and receipts. |
| **Cross-Document** | Entity Matching | Token-sort fuzzy matching to catch payor/payee naming variations. |
| **Cross-Document** | Date Inconsistency | Flags conflicting issue/transaction dates across related documents. |

---

## 7. Cloud Deployment (Production Ready)

### Frontend (Vercel)
1. Push project to GitHub.
2. Import root `frontend/` into Vercel.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

### Backend (Render)
1. Create a Web Service pointing to `backend/`.
2. Environment: `Python 3`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - `MONGODB_DATABASE`: `docuforensics`
   - `STORAGE_MODE`: `local` (or configure S3/Cloud Storage)
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app`

---

## 8. License

Developed for the Unstop Document Forensics Hackathon. Built with strict ethical AI principles and human oversight standards.
