"""
FastAPI application entry point.
Sets up CORS, lifespan events (DB + seed), and includes all routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_db, close_db
from app.auth.router import router as auth_router
from app.uploads.router import router as uploads_router
from app.dashboard.router import router as dashboard_router
from app.reports.router import router as reports_router
from app.seed.seeder import seed_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect DB and seed on startup, close on shutdown."""
    print("🚀 Starting app lifespan: connect_db()")
    await connect_db()
    print("🚀 Finished connect_db(), starting seed_sample_data()")
    try:
        await seed_sample_data()
    except Exception as e:
        print(f"⚠️  Seeding failed (non-fatal): {e}")
    print("🚀 Seed complete, yielding startup")
    yield
    print("🚪 Shutting down app lifespan: close_db()")
    await close_db()


app = FastAPI(
    title="ImpactLens API",
    description="NGO Impact Reporting Copilot — Transform field data into professional impact reports",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(uploads_router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0", "service": "ImpactLens API"}
