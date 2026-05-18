# ImpactLens — NGO Impact Reporting Copilot

A full-stack web application that helps NGOs transform raw field data (CSV, Excel, text feedback) into professional impact reports, KPI dashboards, sentiment analysis, and donor-ready narratives using AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | FastAPI (Python 3.11+), Pandas, Pydantic v2 |
| **Database** | MongoDB (Motor async driver) |
| **Auth** | NextAuth v4 + JWT (FastAPI issues tokens) |
| **AI** | OpenAI GPT-4o / Google Gemini (with mock fallback) |
| **PDF** | ReportLab |

## Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas connection string)

### 1. Clone & Setup Backend

```bash
cd backend
cp .env.example .env          # Edit .env if needed
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env.local    # Edit if needed
npm install
```

### 3. Start MongoDB
Make sure MongoDB is running on `localhost:27017`, or update `MONGODB_URL` in `backend/.env`.

### 4. Run Both Servers

**Backend** (from `backend/` directory):
```bash
uvicorn app.main:app --reload --port 8000
```

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Account

On first backend startup, sample data is automatically seeded:
- **Email:** `demo@impactlens.org`
- **Password:** `demo1234`

This includes a sample NGO dataset (50 records) and a pre-generated impact report.

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `ngo_impact` |
| `JWT_SECRET` | Secret for JWT tokens | (change in production) |
| `AI_PROVIDER` | `openai`, `gemini`, or `mock` | `mock` |
| `OPENAI_API_KEY` | OpenAI API key (if using openai) | — |
| `GEMINI_API_KEY` | Gemini API key (if using gemini) | — |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXTAUTH_URL` | Frontend URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth session secret | (change in production) |

## Project Structure

```
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # App entry, CORS, lifespan
│   │   ├── config.py          # Pydantic settings
│   │   ├── database.py        # MongoDB connection
│   │   ├── auth/              # JWT auth (register, login, me)
│   │   ├── uploads/           # File upload & data processing
│   │   ├── dashboard/         # Aggregated statistics
│   │   ├── reports/           # AI report generation & PDF
│   │   └── seed/              # Auto-seed sample data
│   └── requirements.txt
├── frontend/                   # Next.js 15 frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # UI components
│   │   ├── lib/               # API client, auth config
│   │   ├── providers/         # Context providers
│   │   └── types/             # TypeScript types
│   └── package.json
└── README.md
```

## Core Workflow

1. **Upload** — Drag & drop CSV/Excel/TXT files
2. **Process** — Backend parses, cleans, and extracts KPIs
3. **Analyze** — Keyword-based sentiment analysis on feedback
4. **Dashboard** — Interactive charts (sentiment, regions, trends)
5. **Generate** — AI creates polished reports in 3 tones
6. **Export** — Download professional PDF reports

## License

MIT
