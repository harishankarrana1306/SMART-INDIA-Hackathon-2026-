from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.postgres import sync_engine
from app.db.base import Base
from app.seed.seed_data import seed_database
import app.models  # Ensure all SQLAlchemy models are registered

# Import routers
from app.api.routes_auth import router as auth_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_graph import router as graph_router
from app.api.routes_entities import router as entities_router
from app.api.routes_resolution import router as resolution_router
from app.api.routes_audit import router as audit_router
from app.api.routes_seed import router as seed_router
from app.api.routes_ingestion import router as ingestion_router
from app.api.routes_timeline import router as timeline_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_brief import router as brief_router
from app.api.routes_reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo data
    try:
        Base.metadata.create_all(bind=sync_engine)
        seed_database()
    except Exception as e:
        print(f"[!] Warning during database startup: {e}")
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Criminal Network Analysis System — Decision-Support Tool for NCRB / MHA",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(entities_router, prefix="/api")
app.include_router(resolution_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(seed_router, prefix="/api")
app.include_router(ingestion_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(brief_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "ethics_statement": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
        "documentation": "/docs",
    }
