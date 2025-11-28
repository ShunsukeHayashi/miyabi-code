#!/usr/bin/env python3
"""
Miyabi MCP Server - Health Check Router
System health and readiness endpoints
"""

import time
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger("miyabi.health")

router = APIRouter(tags=["Health"])


# ===========================================
# Response Models
# ===========================================

class HealthStatus(BaseModel):
    """Health check status"""
    status: str  # healthy, degraded, unhealthy
    version: str
    environment: str
    timestamp: str
    uptime_seconds: float
    checks: Dict[str, Dict[str, Any]]


class ReadinessStatus(BaseModel):
    """Readiness check status"""
    ready: bool
    checks: Dict[str, bool]


# ===========================================
# Health Check Functions
# ===========================================

_start_time = time.time()


async def check_github_connection() -> Dict[str, Any]:
    """Check GitHub API connection"""
    try:
        if not settings.github_token:
            return {"status": "skipped", "message": "No GitHub token configured"}
        
        from github import Github
        g = Github(settings.github_token)
        user = g.get_user()
        _ = user.login  # Force API call
        
        return {"status": "healthy", "message": "Connected"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def check_redis_connection() -> Dict[str, Any]:
    """Check Redis connection"""
    if not settings.redis_enabled:
        return {"status": "skipped", "message": "Redis not enabled"}
    
    try:
        import redis.asyncio as redis
        client = redis.from_url(settings.redis_url)
        await client.ping()
        await client.close()
        return {"status": "healthy", "message": "Connected"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def check_database_connection() -> Dict[str, Any]:
    """Check database connection"""
    try:
        import asyncpg
        conn = await asyncpg.connect(settings.database_url)
        await conn.execute("SELECT 1")
        await conn.close()
        return {"status": "healthy", "message": "Connected"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def check_miyabi_root() -> Dict[str, Any]:
    """Check Miyabi root directory"""
    try:
        if settings.miyabi_root.exists():
            return {"status": "healthy", "path": str(settings.miyabi_root)}
        else:
            return {"status": "unhealthy", "message": "Directory not found"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


# ===========================================
# Endpoints
# ===========================================

@router.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint - basic server info"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment,
    }


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Returns detailed status of all system components.
    """
    checks = {}
    
    # Run all health checks concurrently
    check_results = await asyncio.gather(
        check_github_connection(),
        check_redis_connection(),
        check_database_connection(),
        check_miyabi_root(),
        return_exceptions=True
    )
    
    check_names = ["github", "redis", "database", "miyabi_root"]
    
    for name, result in zip(check_names, check_results):
        if isinstance(result, Exception):
            checks[name] = {"status": "unhealthy", "message": str(result)}
        else:
            checks[name] = result
    
    # Determine overall status
    unhealthy_count = sum(
        1 for check in checks.values()
        if check.get("status") == "unhealthy"
    )
    
    if unhealthy_count == 0:
        overall_status = "healthy"
    elif unhealthy_count < len(checks):
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"
    
    return HealthStatus(
        status=overall_status,
        version=settings.app_version,
        environment=settings.environment,
        timestamp=datetime.utcnow().isoformat() + "Z",
        uptime_seconds=time.time() - _start_time,
        checks=checks
    )


@router.get("/health/live")
async def liveness():
    """
    Kubernetes liveness probe.
    
    Returns 200 if the service is alive.
    Simple check - just confirms the process is running.
    """
    return {"status": "alive"}


@router.get("/health/ready", response_model=ReadinessStatus)
async def readiness():
    """
    Kubernetes readiness probe.
    
    Returns 200 if the service is ready to accept traffic.
    Checks critical dependencies.
    """
    checks = {
        "miyabi_root": settings.miyabi_root.exists(),
    }
    
    # Check GitHub if configured
    if settings.github_token:
        try:
            from github import Github
            g = Github(settings.github_token)
            _ = g.get_user().login
            checks["github"] = True
        except:
            checks["github"] = False
    
    ready = all(checks.values())
    
    return ReadinessStatus(ready=ready, checks=checks)


@router.get("/health/metrics")
async def metrics():
    """
    Basic metrics endpoint.
    
    Returns system metrics for monitoring.
    """
    import psutil
    
    process = psutil.Process()
    
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": time.time() - _start_time,
        "process": {
            "pid": process.pid,
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads(),
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        },
    }
