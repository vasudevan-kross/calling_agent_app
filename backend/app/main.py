from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Import routers
from app.routers import leads, calls, search, import_files, webhooks, agents

app = FastAPI(
    title=settings.app_name,
    description="AI-powered cold calling application with lead management",
    version="1.0.0",
    debug=settings.debug,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(calls.router, prefix="/api/calls", tags=["calls"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(import_files.router, prefix="/api/import", tags=["import"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "provider": settings.active_voice_provider
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
