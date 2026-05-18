# NGO Impact Reporting Copilot — Implementation Plan

A full-stack monorepo web application that transforms raw NGO field data into professional impact reports, KPI dashboards, sentiment analysis, and donor-ready narratives using AI.

## Project Architecture & Folder Structure

```
a:\NGO project\
├── frontend/                          # Next.js 15 App Router
│   ├── public/
│   │   └── sample-data/               # Sample NGO dataset files
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── upload/page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── page.tsx             # Reports list
│   │   │   │   │   └── [id]/page.tsx        # Report detail/preview
│   │   │   │   └── layout.tsx               # Sidebar + topbar layout
│   │   │   ├── layout.tsx                   # Root layout (fonts, providers)
│   │   │   ├── page.tsx                     # Landing / redirect
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                          # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── topbar.tsx
│   │   │   │   └── mobile-nav.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── kpi-cards.tsx
│   │   │   │   ├── sentiment-pie.tsx
│   │   │   │   ├── region-bar-chart.tsx
│   │   │   │   ├── monthly-trend-line.tsx
│   │   │   │   ├── beneficiary-distribution.tsx
│   │   │   │   └── recent-activity.tsx
│   │   │   ├── upload/
│   │   │   │   ├── dropzone.tsx
│   │   │   │   └── upload-progress.tsx
│   │   │   ├── reports/
│   │   │   │   ├── report-card.tsx
│   │   │   │   ├── report-preview.tsx
│   │   │   │   ├── tone-selector.tsx
│   │   │   │   └── generate-button.tsx
│   │   │   └── shared/
│   │   │       ├── loading-spinner.tsx
│   │   │       └── empty-state.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                       # Fetch wrapper for FastAPI
│   │   │   ├── auth.ts                      # Auth helpers (token storage)
│   │   │   ├── utils.ts                     # cn() and utilities
│   │   │   └── validations.ts              # Zod schemas
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-uploads.ts
│   │   │   └── use-reports.ts
│   │   ├── providers/
│   │   │   ├── auth-provider.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── toast-provider.tsx
│   │   └── types/
│   │       └── index.ts                     # Shared TypeScript types
│   ├── .env.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json                      # shadcn/ui config
│   └── package.json
│
├── backend/                               # FastAPI Python
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                        # FastAPI app entry, CORS, lifespan
│   │   ├── config.py                      # Settings via Pydantic
│   │   ├── database.py                    # MongoDB connection (Motor async)
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                  # /auth/register, /auth/login
│   │   │   ├── service.py                 # Password hash, JWT
│   │   │   ├── models.py                  # User Pydantic models
│   │   │   └── dependencies.py            # get_current_user dependency
│   │   ├── uploads/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                  # /uploads/ CRUD
│   │   │   ├── service.py                 # Parse CSV/Excel, clean data
│   │   │   ├── models.py                  # Upload Pydantic models
│   │   │   └── processor.py               # KPI extraction, sentiment
│   │   ├── reports/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                  # /reports/ CRUD + generate
│   │   │   ├── service.py                 # AI generation orchestration
│   │   │   ├── models.py                  # Report Pydantic models
│   │   │   ├── ai_client.py               # OpenAI/Gemini wrapper
│   │   │   └── pdf_generator.py           # ReportLab PDF creation
│   │   ├── dashboard/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                  # /dashboard/stats
│   │   │   └── service.py                 # Aggregate KPIs
│   │   └── seed/
│   │       ├── __init__.py
│   │       ├── seeder.py                  # Auto-seed sample data
│   │       └── sample_data.csv            # Sample NGO dataset
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
├── README.md                              # Root README with full setup
└── .gitignore
```

## User Review Required

> [!IMPORTANT]
> **Authentication Strategy**: I'll implement **JWT-based email/password auth** built directly into FastAPI (no third-party service). Tokens stored in `localStorage` on the frontend with an auth context provider. This keeps the project self-contained with zero external auth dependencies. Let me know if you'd prefer NextAuth or Clerk instead.

> [!IMPORTANT]
> **AI Provider**: The code will support both **OpenAI (GPT-4o)** and **Google Gemini** via environment variable toggle (`AI_PROVIDER=openai` or `AI_PROVIDER=gemini`). The system will work in a **mock/demo mode** when no API key is set, returning pre-built sample reports so you can test the full flow without API keys.

> [!IMPORTANT]
> **MongoDB**: The app requires a running MongoDB instance. I'll include instructions for both local MongoDB and MongoDB Atlas (free tier). The backend will gracefully handle connection failures.

> [!WARNING]
> **PDF Generation**: I'll use **ReportLab** (pure Python, no system dependencies) over WeasyPrint (which requires GTK/Cairo system libraries that are painful on Windows). This is more portable. The PDFs will still be professionally styled.

## Open Questions

> [!NOTE]
> **Branding**: I'll use "ImpactLens" as the app name with a calm blue-green color palette. Let me know if you have a preferred name or brand colors.

> [!NOTE]
> **Sample Dataset**: I'll create a realistic sample CSV with fields like: Region, Activity Type, Date, Beneficiaries, Attendance, Feedback Text, Gender, Age Group. This seeds automatically on first backend startup.

---

## Proposed Changes

### Phase 1: Project Scaffolding & Backend Foundation

#### [NEW] Root files
- `README.md` — Full setup guide for both frontend and backend
- `.gitignore` — Python + Node.js ignores

#### [NEW] `backend/` — FastAPI Application

**Core Setup:**
- `app/main.py` — FastAPI app with CORS, lifespan events (DB connect, auto-seed)
- `app/config.py` — Pydantic `BaseSettings` loading from `.env`
- `app/database.py` — Motor async MongoDB client singleton
- `requirements.txt` — All Python dependencies pinned

**Auth Module:**
- JWT auth with `python-jose`, password hashing with `passlib[bcrypt]`
- `POST /auth/register` — Create user with hashed password
- `POST /auth/login` — Return JWT access token
- `GET /auth/me` — Get current user from token
- `dependencies.py` — `get_current_user` dependency injection

**Upload Module:**
- `POST /uploads/` — Accept multipart file (CSV/Excel/TXT), parse with pandas
- `GET /uploads/` — List user's uploads
- `GET /uploads/{id}` — Get upload details + processed data
- `processor.py` — Extract KPIs (total beneficiaries, activity count, avg attendance, region breakdown, monthly trends) + basic sentiment analysis using keyword scoring (no external API needed)

**Dashboard Module:**
- `GET /dashboard/stats` — Aggregated KPIs across all uploads for the current user

**Reports Module:**
- `POST /reports/generate` — Takes upload_id + tone, calls AI to generate report
- `GET /reports/` — List user's reports
- `GET /reports/{id}` — Get report content
- `GET /reports/{id}/pdf` — Generate and return PDF
- `ai_client.py` — Abstraction over OpenAI/Gemini with mock fallback
- `pdf_generator.py` — ReportLab PDF with professional layout (header, sections, styled text)

**Seed Module:**
- `sample_data.csv` — ~50 rows of realistic NGO field data
- `seeder.py` — On first run, creates a demo user and seeds the sample dataset

---

### Phase 2: Frontend Application

#### [NEW] `frontend/` — Next.js 15 App Router

**Scaffolding:**
- Initialize with `npx create-next-app@latest` (App Router, TypeScript, Tailwind CSS, ESLint)
- Install shadcn/ui, Recharts, React Hook Form, Zod, Lucide, Sonner
- Configure Tailwind with custom NGO-friendly color palette (blues, greens, soft grays)
- Dark mode support via `next-themes`

**Design System (globals.css + tailwind.config.ts):**
- Custom CSS variables for the calm, professional palette
- shadcn/ui theme tokens for light + dark modes
- Inter or Plus Jakarta Sans font from Google Fonts
- Glassmorphism card styles, smooth transitions

**Auth Pages:**
- Login page with email/password form (React Hook Form + Zod)
- Register page
- Auth context provider managing JWT token + user state
- Protected route middleware (redirect to login if unauthenticated)

**Dashboard Layout:**
- Collapsible sidebar with navigation (Dashboard, Upload, Reports)
- Top bar with user avatar, theme toggle, logout
- Responsive: sidebar collapses to hamburger on mobile

**Dashboard Page:**
- 4 KPI cards (animated counters): Total Beneficiaries, Activities, Avg Attendance, Sentiment Score
- Sentiment Pie Chart (Recharts PieChart)
- Region Bar Chart (Recharts BarChart)
- Monthly Trend Line (Recharts LineChart)
- Beneficiary Distribution (Recharts AreaChart or stacked bar)
- Recent uploads + recent reports cards

**Upload Page:**
- Drag & drop zone with file type icons and validation
- Upload progress bar
- After upload: preview of parsed data (table), extracted KPIs summary
- "Generate Report" CTA button

**Reports Page:**
- Grid of report cards (title, date, tone, status)
- Click to open report detail

**Report Detail Page:**
- Markdown/HTML preview of the generated report
- Tone selector (Formal / Storytelling / Concise) with re-generate
- "Download PDF" button
- Share/copy options

**Shared Components:**
- Loading spinners, skeleton loaders
- Empty states with illustrations
- Toast notifications (Sonner)
- Error boundaries

---

### Phase 3: Integration & Polish

- Wire up all frontend API calls to FastAPI backend
- End-to-end test: upload → process → dashboard updates → generate report → preview → PDF download
- Loading states and error handling on every API call
- Toast notifications for success/error
- Responsive testing
- Sample data auto-seeds on first backend start

---

## Verification Plan

### Automated Tests
1. **Backend startup**: `uvicorn app.main:app` starts without errors
2. **Frontend startup**: `npm run dev` starts without errors
3. **API smoke test**: Register → Login → Upload CSV → Get Dashboard Stats → Generate Report → Download PDF
4. **Browser verification**: Navigate through the complete user flow using the browser tool

### Manual Verification
- Visual inspection of UI (dashboard, upload, reports) in the browser
- Verify dark mode toggle works
- Verify responsive layout on smaller viewport
- Verify PDF downloads correctly
- Verify sample data seeds on first run
