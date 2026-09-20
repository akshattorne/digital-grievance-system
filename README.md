# Digital Grievance Redressal System (Madhya Pradesh Civic Portal)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2FSupabase-4169E1.svg)](https://supabase.com/)

A complete, production-style civic grievance redressal portal built for the **Government of Madhya Pradesh** and integrated with **MPOnline** governance workflows.

The application provides transparent, time-bound, SLA-monitored grievance redressal for citizens across all 55 districts of Madhya Pradesh, with strict district data isolation, dynamic category-to-department routing, structured citizen-officer communication, administrative review mechanisms, optional Gemini AI recommendation & executive insight layer, and bilingual support (English + Hindi).

---

## 🏛️ System Features & Key Highlights

- **Registered Citizen Portal**: Registration, Login with JWT access/refresh token rotation, Password Reset, Dashboard, Grievance Submission, SLA Countdown, Structured Communication, Resolution Feedback & Reopen Requests.
- **Anonymous Citizen Engine**: Submit grievances without creating an account. Generates Complaint ID + Secret Tracking Code + Secure Session Access Token. IDENTITY IS NEVER EXPOSED UNNECESSARILY.
- **Strict District Data Isolation**: District Admins and Grievance Officers can ONLY query, manage, and view data belonging to their assigned district. Cross-district data queries return HTTP 403 Forbidden.
- **Dynamic Category → Department SLA Routing**: System maps category to department. Priority (`HIGH`: 0.5x, `MEDIUM`: 1.0x, `LOW`: 1.5x) dynamically modifies the SLA deadline.
- **Workload-Based Officer Assignment**: System auto-recommends eligible officers based on matching department, same district, active availability status, and lowest active workload.
- **Administrative Review Authority**: Internal authorized oversight portal allowing citizens to submit misconduct reports against District Admins. Validated report threshold flags District Admins for human review (NO automated penalty or replacement).
- **Optional Gemini AI Layer**: Uses Gemini API for smart category/priority recommendations and executive district insights. IF GEMINI IS UNAVAILABLE OR UNCONFIGURED, THE SYSTEM AUTOMATICALLY FALLS BACK TO A KEYWORD RULE ENGINE WITHOUT BREAKING CORE FUNCTIONALITY.
- **Bilingual Interface (i18n)**: Instant English and Hindi UI toggle across public landing page, forms, dashboards, and error messages.
- **Public Portal Analytics**: Aggregated and anonymized public metrics & category trends charts. ZERO citizen names, emails, phones, or private text exposed.

---

## 🔑 Demo Role Credentials

| Role | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **Registered Citizen** | `citizen@example.com` | `Citizen@123` | Submit & track personal grievances, feedback |
| **District Admin (Indore)** | `admin.indore@mp.gov.in` | `Admin@123` | Isolated to Indore district (IND) complaints & officers |
| **District Admin (Bhopal)** | `admin.bhopal@mp.gov.in` | `Admin@123` | Isolated to Bhopal district (BHO) complaints & officers |
| **Grievance Officer (PHE)** | `officer.water.indore@mp.gov.in` | `Officer@123` | Assigned water supply grievances in Indore |
| **Grievance Officer (PWD)** | `officer.pwd.indore@mp.gov.in` | `Officer@123` | Assigned road repair grievances in Indore |
| **Admin Review Authority** | `review.authority@mp.gov.in` | `Authority@123` | Statewide oversight of reports against District Admins |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Recharts, Lucide Icons, Custom Civic CSS System, i18n English/Hindi Localization.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), PyJWT, Bcrypt hashing.
- **Database**: Supabase PostgreSQL (Production) / SQLite (Local Dev & Pytest).
- **Storage**: Private Storage Service with access-controlled file view proxy.
- **AI**: Gemini API with Keyword Rule Engine Fallback.
- **Email**: Configurable Email Provider Abstraction (Mock / SMTP / Resend).

---

## 📂 Project Structure

```
digital-grievance-system/
├── backend/
│   ├── app/
│   │   ├── api/            # REST API Routes (auth, complaints, district_admin, officers, review, ai, etc.)
│   │   ├── core/           # Security, Permissions, Database Config, Settings
│   │   ├── models/         # SQLAlchemy Models (User, Grievance, Complaint, Notification, Review, AI)
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic (SLA, Assignment, AI, Email, Storage)
│   │   └── main.py         # FastAPI App Entrypoint & CORS setup
│   ├── tests/              # Pytest Async Test Suite
│   ├── seed.py             # Seed Script for all 55 MP Districts, Depts, Categories & Accounts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, Badges, Modals, AI Recommendation Card, Charts
│   │   ├── contexts/       # AuthContext, LanguageContext
│   │   ├── i18n/           # English (en.json) & Hindi (hi.json) Translations
│   │   ├── pages/          # LandingPage, Login, Register, Dashboards, ComplaintDetail
│   │   ├── services/       # Axios API Client
│   │   └── styles/         # Global HSL Civic Styling & CSS Utility Variables
│   └── package.json
├── docs/                   # Architecture, DB Schema, API Specs, Deployment & Testing Reports
├── .env.example
└── README.md
```

---

## 🚀 Quick Local Run Instructions

### 1. Backend Setup & Seed
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install email-validator

# Run database seed script (Populates MP Districts, Depts, Demo Accounts)
python seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend Swagger API Documentation: `http://localhost:8000/api/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Portal: `http://localhost:5173`

### 3. Run Backend Automated Test Suite
```bash
cd backend
PYTHONPATH=. .venv/bin/python -m pytest -v
```

---

## 📋 Comprehensive Documentation Links

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema Specification](docs/DATABASE_SCHEMA.md)
- [API Reference Specs](docs/API_DOCUMENTATION.md)
- [Setup & Deployment Guide](docs/SETUP_AND_DEPLOYMENT.md)
- [Automated Testing Report](docs/TESTING_REPORT.md)

---

## 📜 License & Accreditation
Built for **Government of Madhya Pradesh Civic Governance** / MPOnline Grievance Redressal Standards.
