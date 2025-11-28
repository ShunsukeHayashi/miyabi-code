#!/usr/bin/env python3
"""
Miyabi MCP Server - Security Module
Authentication, authorization, and security utilities
"""

import time
import hashlib
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN, HTTP_429_TOO_MANY_REQUESTS

from .config import settings

# Security scheme
security = HTTPBearer(auto_error=False)


# ===========================================
# In-Memory Token Storage (fallback)
# ===========================================
# TODO: Replace with Redis in production

class TokenStore:
    """In-memory token storage with Redis fallback"""
    
    def __init__(self):
        self.access_tokens: Dict[str, Dict[str, Any]] = {}
        self.refresh_tokens: Dict[str, Dict[str, Any]] = {}
        self.authorization_codes: Dict[str, Dict[str, Any]] = {}
        self.pkce_challenges: Dict[str, str] = {}
        self._redis_client = None
    
    async def init_redis(self):
        """Initialize Redis connection if enabled"""
        if settings.redis_enabled:
            try:
                import redis.asyncio as redis
                self._redis_client = redis.from_url(settings.redis_url)
                await self._redis_client.ping()
                return True
            except Exception as e:
                print(f"Redis connection failed: {e}, falling back to in-memory")
                self._redis_client = None
        return False
    
    def _hash_token(self, token: str) -> str:
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    async def store_access_token(self, token: str, data: Dict[str, Any], ttl: int = 3600):
        """Store access token"""
        token_hash = self._hash_token(token)
        data["created_at"] = time.time()
        data["expires_at"] = time.time() + ttl
        
        if self._redis_client:
            import json
            await self._redis_client.setex(
                f"access_token:{token_hash}",
                ttl,
                json.dumps(data)
            )
        else:
            self.access_tokens[token] = data
    
    async def get_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get access token data"""
        if self._redis_client:
            import json
            token_hash = self._hash_token(token)
            data = await self._redis_client.get(f"access_token:{token_hash}")
            if data:
                return json.loads(data)
            return None
        else:
            return self.access_tokens.get(token)
    
    async def revoke_access_token(self, token: str):
        """Revoke access token"""
        if self._redis_client:
            token_hash = self._hash_token(token)
            await self._redis_client.delete(f"access_token:{token_hash}")
        else:
            self.access_tokens.pop(token, None)
    
    def is_token_expired(self, token_data: Dict[str, Any]) -> bool:
        """Check if token is expired"""
        expires_at = token_data.get("expires_at", 0)
        return time.time() > expires_at


# Global token store instance
token_store = TokenStore()


# ===========================================
# Rate Limiting
# ===========================================

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, requests_per_minute: int = 60, burst: int = 10):
        self.requests_per_minute = requests_per_minute
        self.burst = burst
        self.requests: Dict[str, list] = {}
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request"""
        # Try to get from X-Forwarded-For header (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Fall back to client host
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _cleanup_old_requests(self, client_id: str):
        """Remove requests older than 1 minute"""
        if client_id not in self.requests:
            return
        
        current_time = time.time()
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if current_time - req_time < 60
        ]
    
    def is_rate_limited(self, request: Request) -> bool:
        """Check if request should be rate limited"""
        client_id = self._get_client_id(request)
        current_time = time.time()
        
        # Initialize client's request list
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Cleanup old requests
        self._cleanup_old_requests(client_id)
        
        # Check rate limit
        request_count = len(self.requests[client_id])
        if request_count >= self.requests_per_minute:
            return True
        
        # Record this request
        self.requests[client_id].append(current_time)
        return False
    
    def get_retry_after(self, request: Request) -> int:
        """Get seconds until rate limit resets"""
        client_id = self._get_client_id(request)
        if client_id not in self.requests or not self.requests[client_id]:
            return 0
        
        oldest_request = min(self.requests[client_id])
        return max(0, int(60 - (time.time() - oldest_request)))


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=settings.rate_limit_per_minute,
    burst=settings.rate_limit_burst
)


# ===========================================
# Authentication Dependencies
# ===========================================

async def verify_bearer_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Verify Bearer token per MCP specification (OAuth 2.1 subset)
    
    MCP spec requires:
    - Authorization: Bearer <token>
    - HTTPS in production
    - Tokens must be in headers, not query strings
    
    Accepts:
    1. Static ACCESS_TOKEN (for simple integrations)
    2. OAuth 2.1 issued tokens (for MCP clients)
    """
    # Development mode: skip auth if no token configured
    if not settings.access_token and not token_store.access_tokens:
        return "dev-mode"
    
    if not credentials:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Bearer token required. Include Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Check static token first
    if settings.access_token and token == settings.access_token:
        return token
    
    # Check OAuth issued tokens
    token_data = await token_store.get_access_token(token)
    if token_data:
        if token_store.is_token_expired(token_data):
            await token_store.revoke_access_token(token)
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Access token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token
    
    raise HTTPException(
        status_code=HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def check_rate_limit(request: Request):
    """Dependency to check rate limit"""
    if rate_limiter.is_rate_limited(request):
        retry_after = rate_limiter.get_retry_after(request)
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


# ===========================================
# Security Utilities
# ===========================================

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hash a password with salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt.encode(),
        100000
    ).hex()
    
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify a password against its hash"""
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, hashed)


def sanitize_path(path: str, base_path: str = None) -> str:
    """Sanitize file path to prevent directory traversal"""
    import os
    from pathlib import Path
    
    # Normalize the path
    normalized = os.path.normpath(path)
    
    # Remove any leading slashes for relative paths
    if not os.path.isabs(normalized):
        normalized = normalized.lstrip("/\\")
    
    # If base_path provided, ensure path is within it
    if base_path:
        base = Path(base_path).resolve()
        full_path = (base / normalized).resolve()
        
        # Check for directory traversal
        if not str(full_path).startswith(str(base)):
            raise ValueError("Path traversal detected")
        
        return str(full_path)
    
    return normalized
