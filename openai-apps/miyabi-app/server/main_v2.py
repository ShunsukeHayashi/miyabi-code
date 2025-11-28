#!/usr/bin/env python3
"""
Miyabi MCP Server - Main Application (Refactored)
FastAPI application with modular architecture
"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Core modules
from core.config import settings
from core.logging import setup_logging, get_logger, request_id_var
from core.security import token_store
from core.exceptions import register_exception_handlers

# Routers
from routers.health import router as health_router
from routers.mcp import router as mcp_router
from routers.oauth import router as oauth_router
from routers.github import router as github_router


# Setup logging
setup_logging()
logger = get_logger("miyabi.main")


# ===========================================
# Application Lifespan
# ===========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Miyabi Root: {settings.miyabi_root}")
    
    # Initialize Redis if enabled
    if settings.redis_enabled:
        await token_store.init_redis()
        logger.info("Redis connection initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


# ===========================================
# Create Application
# ===========================================

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MCP Server for Miyabi Autonomous Agent Framework",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# ===========================================
# Middleware
# ===========================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Add request context for logging and tracing"""
    # Generate request ID
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    request_id_var.set(request_id)
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path}",
        data={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else "unknown",
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response


# ===========================================
# Exception Handlers
# ===========================================

register_exception_handlers(app)


# ===========================================
# Routers
# ===========================================

# Health check routes (no prefix)
app.include_router(health_router)

# MCP protocol routes
app.include_router(mcp_router)

# OAuth routes
app.include_router(oauth_router)

# GitHub API routes
app.include_router(github_router)


# ===========================================
# Static Files (for UI widgets)
# ===========================================

# Mount static files if assets directory exists
from pathlib import Path
assets_dir = Path(__file__).parent.parent / "dist" / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


# ===========================================
# Legacy Compatibility Routes
# ===========================================
# These routes maintain backward compatibility with existing integrations

@app.get("/api/v1/health")
async def legacy_health():
    """Legacy health endpoint for backward compatibility"""
    return {"status": "healthy", "version": settings.app_version}


# ===========================================
# Development Server
# ===========================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main_v2:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
