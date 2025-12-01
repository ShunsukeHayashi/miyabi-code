#!/usr/bin/env python3
"""
Miyabi MCP Server - OAuth State Store
Persistent storage for OAuth state parameters (CSRF protection)

SaaS/Multi-user ready:
- Redis backend for production (multi-instance safe)
- InMemory fallback for development
- One-time use + TTL for security
- User/tenant binding support
"""

import os
import time
import json
import secrets
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict

# Standalone logger (avoid circular imports with config)
logger = logging.getLogger("miyabi.oauth_state")

# Environment-based configuration (standalone, no dependency on core.config)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "false").lower() in ("true", "1", "yes")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"


# ===========================================
# Data Models
# ===========================================

@dataclass
class OAuthStateData:
    """OAuth state metadata"""
    provider: str  # "github", "google", etc.
    redirect_uri: str
    created_at: float
    expires_at: float
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    code_challenge: Optional[str] = None  # PKCE
    code_challenge_method: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OAuthStateData":
        return cls(**data)


# ===========================================
# Abstract Interface
# ===========================================

class OAuthStateStore(ABC):
    """Abstract base for OAuth state storage"""

    @abstractmethod
    async def save(
        self,
        state: str,
        data: OAuthStateData,
    ) -> None:
        """Store OAuth state with TTL"""
        pass

    @abstractmethod
    async def load(self, state: str) -> Optional[OAuthStateData]:
        """Load OAuth state (does NOT consume)"""
        pass

    @abstractmethod
    async def consume(self, state: str) -> Optional[OAuthStateData]:
        """Load and delete OAuth state (one-time use)"""
        pass

    @abstractmethod
    async def delete(self, state: str) -> None:
        """Delete OAuth state"""
        pass


# ===========================================
# InMemory Implementation (Development)
# ===========================================

class InMemoryOAuthStateStore(OAuthStateStore):
    """In-memory OAuth state store for development"""

    def __init__(self):
        self._store: Dict[str, OAuthStateData] = {}
        self._last_cleanup = time.time()

    def _cleanup_expired(self):
        """Remove expired states (runs every 60s)"""
        now = time.time()
        if now - self._last_cleanup < 60:
            return

        expired = [k for k, v in self._store.items() if v.is_expired()]
        for k in expired:
            del self._store[k]

        self._last_cleanup = now
        if expired:
            logger.debug(f"Cleaned up {len(expired)} expired OAuth states")

    async def save(self, state: str, data: OAuthStateData) -> None:
        self._cleanup_expired()
        self._store[state] = data
        logger.debug(f"Saved OAuth state: {state[:8]}...")

    async def load(self, state: str) -> Optional[OAuthStateData]:
        self._cleanup_expired()
        data = self._store.get(state)
        if data and data.is_expired():
            del self._store[state]
            return None
        return data

    async def consume(self, state: str) -> Optional[OAuthStateData]:
        self._cleanup_expired()
        data = self._store.pop(state, None)
        if data and data.is_expired():
            logger.debug(f"OAuth state expired: {state[:8]}...")
            return None
        if data:
            logger.debug(f"Consumed OAuth state: {state[:8]}...")
        return data

    async def delete(self, state: str) -> None:
        self._store.pop(state, None)


# ===========================================
# Redis Implementation (Production)
# ===========================================

class RedisOAuthStateStore(OAuthStateStore):
    """Redis-backed OAuth state store for production"""

    KEY_PREFIX = "oauth_state:"

    def __init__(self, redis_url: str):
        self._redis_url = redis_url
        self._client = None

    async def _get_client(self):
        """Lazy initialization of Redis client"""
        if self._client is None:
            import redis.asyncio as redis
            self._client = redis.from_url(self._redis_url)
            await self._client.ping()
            logger.info("Redis OAuth state store connected")
        return self._client

    def _key(self, state: str) -> str:
        return f"{self.KEY_PREFIX}{state}"

    async def save(self, state: str, data: OAuthStateData) -> None:
        client = await self._get_client()
        ttl = int(data.expires_at - time.time())
        if ttl <= 0:
            return

        await client.setex(
            self._key(state),
            ttl,
            json.dumps(data.to_dict())
        )
        logger.debug(f"Saved OAuth state to Redis: {state[:8]}... (TTL: {ttl}s)")

    async def load(self, state: str) -> Optional[OAuthStateData]:
        client = await self._get_client()
        raw = await client.get(self._key(state))
        if not raw:
            return None
        return OAuthStateData.from_dict(json.loads(raw))

    async def consume(self, state: str) -> Optional[OAuthStateData]:
        """Atomic get-and-delete using Lua script"""
        client = await self._get_client()
        key = self._key(state)

        # Lua script for atomic consume
        lua_script = """
        local value = redis.call('GET', KEYS[1])
        if value then
            redis.call('DEL', KEYS[1])
        end
        return value
        """

        raw = await client.eval(lua_script, 1, key)
        if not raw:
            logger.debug(f"OAuth state not found in Redis: {state[:8]}...")
            return None

        logger.debug(f"Consumed OAuth state from Redis: {state[:8]}...")
        return OAuthStateData.from_dict(json.loads(raw))

    async def delete(self, state: str) -> None:
        client = await self._get_client()
        await client.delete(self._key(state))


# ===========================================
# Factory & Global Instance
# ===========================================

def create_oauth_state_store() -> OAuthStateStore:
    """
    Factory function to create appropriate store based on environment.

    Uses Redis in production, InMemory in development.
    """
    if REDIS_ENABLED:
        logger.info("Using Redis OAuth state store")
        return RedisOAuthStateStore(REDIS_URL)

    if IS_PRODUCTION:
        logger.warning(
            "WARNING: Using InMemory OAuth state store in production! "
            "Enable Redis (REDIS_ENABLED=true) for multi-instance deployments."
        )
    else:
        logger.info("Using InMemory OAuth state store (development)")

    return InMemoryOAuthStateStore()


# Global instance
oauth_state_store = create_oauth_state_store()


# ===========================================
# Helper Functions
# ===========================================

def generate_state(length: int = 32) -> str:
    """Generate a cryptographically secure state parameter"""
    return secrets.token_urlsafe(length)


async def create_oauth_state(
    provider: str,
    redirect_uri: str,
    ttl_seconds: int = 600,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create and store a new OAuth state.

    Returns the state string to include in the authorization URL.
    """
    state = generate_state()
    now = time.time()

    data = OAuthStateData(
        provider=provider,
        redirect_uri=redirect_uri,
        created_at=now,
        expires_at=now + ttl_seconds,
        user_id=user_id,
        tenant_id=tenant_id,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        extra=extra,
    )

    await oauth_state_store.save(state, data)
    return state


async def validate_and_consume_state(state: str) -> OAuthStateData:
    """
    Validate and consume OAuth state (one-time use).

    Raises HTTPException if invalid or expired.
    """
    from fastapi import HTTPException

    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    data = await oauth_state_store.consume(state)

    if not data:
        logger.warning(f"Invalid or expired OAuth state: {state[:8]}...")
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    return data
