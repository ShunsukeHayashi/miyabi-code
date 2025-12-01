"""
Claude.ai Web MCP Integration Module
Adds OAuth 2.1 and SSE endpoints for Claude.ai Web remote MCP connection

DEBUG MODE: Comprehensive logging enabled for development
STORAGE: PostgreSQL for multi-user production environment
"""

import os
import json
import time
import uuid
import hashlib
import secrets
import asyncio
import traceback
from typing import Dict, Any, Optional
from urllib.parse import urlencode, parse_qs

# Load .env before any os.getenv calls
from dotenv import load_dotenv
load_dotenv()

import logging

# Configure detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("miyabi-mcp-oauth")
logger.setLevel(logging.DEBUG)

# Add console handler if not present
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(name)s: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

from fastapi import APIRouter, Request, HTTPException, Query, Form, Header
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from sse_starlette.sse import EventSourceResponse

# Router for Claude.ai Web MCP endpoints
claude_router = APIRouter()

# Base URL for OAuth
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "https://mcp.miyabi-world.com")

# GitHub OAuth Configuration
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID", "")
GITHUB_OAUTH_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET", "")

# PostgreSQL Configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "miyabi_oauth")
POSTGRES_USER = os.getenv("POSTGRES_USER", "miyabi_oauth_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "miyabi_oauth_secure_2025")

# Debug API Key (required for /debug/* endpoints)
DEBUG_API_KEY = os.getenv("DEBUG_API_KEY", "")

# Log startup configuration
logger.info("=" * 60)
logger.info("[STARTUP] Claude Web MCP Module Initialized")
logger.info(f"[STARTUP] MCP_BASE_URL={MCP_BASE_URL}")
logger.info(f"[STARTUP] GITHUB_OAUTH_CLIENT_ID={'SET (' + GITHUB_OAUTH_CLIENT_ID[:8] + '...)' if GITHUB_OAUTH_CLIENT_ID else 'NOT SET'}")
logger.info(f"[STARTUP] GITHUB_OAUTH_CLIENT_SECRET={'SET' if GITHUB_OAUTH_CLIENT_SECRET else 'NOT SET'}")
logger.info(f"[STARTUP] PostgreSQL: {POSTGRES_USER}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
logger.info("=" * 60)

# ============================================
# PostgreSQL Connection Pool
# ============================================

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# Connection pool (min 2, max 10 connections)
_db_pool: Optional[pool.ThreadedConnectionPool] = None


def init_db_pool():
    """Initialize PostgreSQL connection pool"""
    global _db_pool
    try:
        _db_pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
        )
        logger.info(f"[DB] PostgreSQL connection pool initialized")

        # Test connection and clean up expired entries
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Clean up expired entries on startup
                now = time.time()
                cursor.execute("DELETE FROM auth_codes WHERE expires_at < NOW()")
                cursor.execute("DELETE FROM access_tokens WHERE expires_at < NOW()")
                cursor.execute("DELETE FROM pkce_challenges WHERE expires_at < NOW()")
                conn.commit()

                # Log current state
                cursor.execute("SELECT COUNT(*) FROM auth_codes")
                auth_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM access_tokens")
                token_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM pkce_challenges")
                pkce_count = cursor.fetchone()[0]

                logger.info(f"[DB] Current state: auth_codes={auth_count}, access_tokens={token_count}, pkce_challenges={pkce_count}")

    except Exception as e:
        logger.error(f"[DB] Failed to initialize connection pool: {e}")
        logger.error(f"[DB] Traceback: {traceback.format_exc()}")
        raise


@contextmanager
def get_db():
    """Get database connection from pool"""
    conn = None
    try:
        conn = _db_pool.getconn()
        yield conn
    except Exception as e:
        logger.error(f"[DB] Connection error: {e}")
        raise
    finally:
        if conn:
            _db_pool.putconn(conn)


# Initialize connection pool on module load
try:
    init_db_pool()
except Exception as e:
    logger.error(f"[DB] Pool initialization failed, will retry on first request: {e}")


# ============================================
# Database Operations
# ============================================

class PostgresStore:
    """PostgreSQL-backed storage for OAuth data"""

    @staticmethod
    def store_pkce_challenge(session_id: str, data: Dict[str, Any], expires_in_seconds: int = 600):
        """Store PKCE challenge data"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    expires_at = time.time() + expires_in_seconds
                    cursor.execute("""
                        INSERT INTO pkce_challenges (session_id, code_challenge, code_challenge_method, redirect_uri, scope, data, expires_at)
                        VALUES (%s, %s, %s, %s, %s, %s, to_timestamp(%s))
                        ON CONFLICT (session_id) DO UPDATE SET
                            code_challenge = EXCLUDED.code_challenge,
                            code_challenge_method = EXCLUDED.code_challenge_method,
                            redirect_uri = EXCLUDED.redirect_uri,
                            scope = EXCLUDED.scope,
                            data = EXCLUDED.data,
                            expires_at = EXCLUDED.expires_at
                    """, (
                        session_id,
                        data.get("code_challenge"),
                        data.get("code_challenge_method", "S256"),
                        data.get("redirect_uri"),
                        data.get("scope"),
                        json.dumps(data),
                        expires_at
                    ))
                    conn.commit()
                    logger.debug(f"[DB] Stored PKCE challenge: {session_id[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to store PKCE challenge: {e}")
            raise

    @staticmethod
    def get_pkce_challenge(session_id: str) -> Optional[Dict[str, Any]]:
        """Get PKCE challenge data"""
        try:
            with get_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT data FROM pkce_challenges
                        WHERE session_id = %s AND expires_at > NOW()
                    """, (session_id,))
                    row = cursor.fetchone()
                    if row:
                        # JSONB columns are auto-converted to dict by psycopg2
                        data = row["data"]
                        return data if isinstance(data, dict) else json.loads(data)
                    return None
        except Exception as e:
            logger.error(f"[DB] Failed to get PKCE challenge: {e}")
            return None

    @staticmethod
    def delete_pkce_challenge(session_id: str):
        """Delete PKCE challenge data"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM pkce_challenges WHERE session_id = %s", (session_id,))
                    conn.commit()
                    logger.debug(f"[DB] Deleted PKCE challenge: {session_id[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to delete PKCE challenge: {e}")

    @staticmethod
    def store_auth_code(code: str, data: Dict[str, Any], expires_in_seconds: int = 600):
        """Store authorization code"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    expires_at = time.time() + expires_in_seconds
                    cursor.execute("""
                        INSERT INTO auth_codes (code, data, expires_at)
                        VALUES (%s, %s, to_timestamp(%s))
                        ON CONFLICT (code) DO UPDATE SET
                            data = EXCLUDED.data,
                            expires_at = EXCLUDED.expires_at
                    """, (code, json.dumps(data), expires_at))
                    conn.commit()
                    logger.debug(f"[DB] Stored auth code: {code[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to store auth code: {e}")
            raise

    @staticmethod
    def get_auth_code(code: str) -> Optional[Dict[str, Any]]:
        """Get authorization code data"""
        try:
            with get_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT data FROM auth_codes
                        WHERE code = %s AND expires_at > NOW()
                    """, (code,))
                    row = cursor.fetchone()
                    if row:
                        # JSONB columns are auto-converted to dict by psycopg2
                        data = row["data"]
                        return data if isinstance(data, dict) else json.loads(data)
                    return None
        except Exception as e:
            logger.error(f"[DB] Failed to get auth code: {e}")
            return None

    @staticmethod
    def delete_auth_code(code: str):
        """Delete authorization code (one-time use)"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM auth_codes WHERE code = %s", (code,))
                    conn.commit()
                    logger.debug(f"[DB] Deleted auth code: {code[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to delete auth code: {e}")

    @staticmethod
    def store_access_token(token: str, user_id: str, data: Dict[str, Any], expires_in_seconds: int = 3600):
        """Store access token"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    expires_at = time.time() + expires_in_seconds
                    cursor.execute("""
                        INSERT INTO access_tokens (token, user_id, data, expires_at)
                        VALUES (%s, %s, %s, to_timestamp(%s))
                        ON CONFLICT (token) DO UPDATE SET
                            user_id = EXCLUDED.user_id,
                            data = EXCLUDED.data,
                            expires_at = EXCLUDED.expires_at
                    """, (token, user_id, json.dumps(data), expires_at))
                    conn.commit()
                    logger.debug(f"[DB] Stored access token for user: {user_id}")
        except Exception as e:
            logger.error(f"[DB] Failed to store access token: {e}")
            raise

    @staticmethod
    def get_access_token(token: str) -> Optional[Dict[str, Any]]:
        """Get access token data"""
        try:
            with get_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT user_id, data FROM access_tokens
                        WHERE token = %s AND expires_at > NOW()
                    """, (token,))
                    row = cursor.fetchone()
                    if row:
                        # JSONB columns are auto-converted to dict by psycopg2
                        data = row["data"]
                        if not isinstance(data, dict):
                            data = json.loads(data)
                        data["user_id"] = row["user_id"]
                        return data
                    return None
        except Exception as e:
            logger.error(f"[DB] Failed to get access token: {e}")
            return None

    @staticmethod
    def delete_access_token(token: str):
        """Delete access token (revoke)"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM access_tokens WHERE token = %s", (token,))
                    conn.commit()
                    logger.debug(f"[DB] Deleted access token: {token[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to delete access token: {e}")

    @staticmethod
    def store_refresh_token(token: str, user_id: str, access_token: str, data: Dict[str, Any], expires_in_seconds: int = 2592000):
        """Store refresh token (default 30 days expiry)"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    expires_at = time.time() + expires_in_seconds
                    cursor.execute("""
                        INSERT INTO refresh_tokens (token, user_id, access_token, data, expires_at)
                        VALUES (%s, %s, %s, %s, to_timestamp(%s))
                        ON CONFLICT (token) DO UPDATE SET
                            user_id = EXCLUDED.user_id,
                            access_token = EXCLUDED.access_token,
                            data = EXCLUDED.data,
                            expires_at = EXCLUDED.expires_at
                    """, (token, user_id, access_token, json.dumps(data), expires_at))
                    conn.commit()
                    logger.debug(f"[DB] Stored refresh token for user: {user_id}")
        except Exception as e:
            logger.error(f"[DB] Failed to store refresh token: {e}")
            raise

    @staticmethod
    def get_refresh_token(token: str) -> Optional[Dict[str, Any]]:
        """Get refresh token data"""
        try:
            with get_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT user_id, access_token, data FROM refresh_tokens
                        WHERE token = %s AND expires_at > NOW()
                    """, (token,))
                    row = cursor.fetchone()
                    if row:
                        data = row["data"]
                        if not isinstance(data, dict):
                            data = json.loads(data)
                        data["user_id"] = row["user_id"]
                        data["access_token"] = row["access_token"]
                        return data
                    return None
        except Exception as e:
            logger.error(f"[DB] Failed to get refresh token: {e}")
            return None

    @staticmethod
    def delete_refresh_token(token: str):
        """Delete refresh token (revoke)"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM refresh_tokens WHERE token = %s", (token,))
                    conn.commit()
                    logger.debug(f"[DB] Deleted refresh token: {token[:20]}...")
        except Exception as e:
            logger.error(f"[DB] Failed to delete refresh token: {e}")

    @staticmethod
    def delete_refresh_tokens_by_user(user_id: str):
        """Delete all refresh tokens for a user"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM refresh_tokens WHERE user_id = %s", (user_id,))
                    conn.commit()
                    logger.debug(f"[DB] Deleted all refresh tokens for user: {user_id}")
        except Exception as e:
            logger.error(f"[DB] Failed to delete refresh tokens for user: {e}")

    @staticmethod
    def get_stats() -> Dict[str, int]:
        """Get storage statistics"""
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM auth_codes WHERE expires_at > NOW()")
                    auth_count = cursor.fetchone()[0]
                    cursor.execute("SELECT COUNT(*) FROM access_tokens WHERE expires_at > NOW()")
                    token_count = cursor.fetchone()[0]
                    cursor.execute("SELECT COUNT(*) FROM pkce_challenges WHERE expires_at > NOW()")
                    pkce_count = cursor.fetchone()[0]
                    cursor.execute("SELECT COUNT(*) FROM refresh_tokens WHERE expires_at > NOW()")
                    refresh_count = cursor.fetchone()[0]
                    return {
                        "auth_codes": auth_count,
                        "access_tokens": token_count,
                        "pkce_challenges": pkce_count,
                        "refresh_tokens": refresh_count,
                    }
        except Exception as e:
            logger.error(f"[DB] Failed to get stats: {e}")
            return {"auth_codes": -1, "access_tokens": -1, "pkce_challenges": -1, "refresh_tokens": -1}


# SSE clients still in memory (connection-specific, not persistent)
_sse_clients: Dict[str, asyncio.Queue] = {}


def _log_storage_state(context: str):
    """Log current state of database storage"""
    stats = PostgresStore.get_stats()
    logger.debug(f"[{context}] Storage State:")
    logger.debug(f"  - auth_codes: {stats['auth_codes']} entries")
    logger.debug(f"  - access_tokens: {stats['access_tokens']} entries")
    logger.debug(f"  - pkce_challenges: {stats['pkce_challenges']} entries")


# ============================================
# .well-known endpoints (OAuth discovery)
# ============================================

@claude_router.get("/.well-known/oauth-authorization-server")
async def oauth_authorization_server_metadata():
    """
    OAuth 2.1 Authorization Server Metadata (RFC 8414)
    Required for Claude.ai Web MCP client discovery
    """
    logger.info("[.well-known/oauth-authorization-server] Metadata requested")
    return JSONResponse({
        "issuer": MCP_BASE_URL,
        "authorization_endpoint": f"{MCP_BASE_URL}/oauth/authorize",
        "token_endpoint": f"{MCP_BASE_URL}/oauth/token",
        "registration_endpoint": f"{MCP_BASE_URL}/oauth/register",
        "revocation_endpoint": f"{MCP_BASE_URL}/oauth/revoke",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
        "scopes_supported": ["mcp:tools", "mcp:resources", "mcp:prompts", "offline_access"],
        "service_documentation": f"{MCP_BASE_URL}/docs",
    })


@claude_router.get("/.well-known/oauth-protected-resource")
async def oauth_protected_resource_metadata():
    """
    OAuth 2.0 Protected Resource Metadata (RFC 9728)
    Tells Claude.ai Web which authorization server to use
    """
    logger.info("[.well-known/oauth-protected-resource] Metadata requested")
    return JSONResponse({
        "resource": f"{MCP_BASE_URL}/mcp",
        "authorization_servers": [MCP_BASE_URL],
        "scopes_supported": ["mcp:tools", "mcp:resources", "mcp:prompts"],
        "bearer_methods_supported": ["header"],
    })


# ============================================
# OAuth 2.1 Endpoints
# ============================================

@claude_router.get("/oauth/authorize")
async def oauth_authorize(
    request: Request,
    response_type: str = Query(...),
    client_id: str = Query(...),
    redirect_uri: str = Query(...),
    scope: str = Query("mcp:tools"),
    state: str = Query(...),
    code_challenge: Optional[str] = Query(None),
    code_challenge_method: str = Query("S256"),
):
    """
    OAuth 2.1 Authorization Endpoint with PKCE (optional)
    Redirects to GitHub OAuth for authentication
    """
    logger.info("=" * 50)
    logger.info("[oauth/authorize] === AUTHORIZATION REQUEST ===")
    logger.info(f"[oauth/authorize] response_type={response_type}")
    logger.info(f"[oauth/authorize] client_id={client_id}")
    logger.info(f"[oauth/authorize] redirect_uri={redirect_uri}")
    logger.info(f"[oauth/authorize] scope={scope}")
    logger.info(f"[oauth/authorize] state={state[:20]}...")
    logger.info(f"[oauth/authorize] code_challenge={'SET' if code_challenge else 'NOT SET'}")
    logger.info(f"[oauth/authorize] code_challenge_method={code_challenge_method}")
    logger.info(f"[oauth/authorize] GITHUB_OAUTH_CLIENT_ID configured: {bool(GITHUB_OAUTH_CLIENT_ID)}")

    try:
        if response_type != "code":
            logger.error(f"[oauth/authorize] Invalid response_type: {response_type}")
            raise HTTPException(400, "Only 'code' response_type is supported")

        if code_challenge and code_challenge_method != "S256":
            logger.error(f"[oauth/authorize] Invalid code_challenge_method: {code_challenge_method}")
            raise HTTPException(400, "Only S256 code_challenge_method is supported")

        # Store PKCE challenge and OAuth params in PostgreSQL
        auth_session_id = secrets.token_urlsafe(32)
        session_data = {
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scope,
            "state": state,
            "created_at": time.time(),
        }
        PostgresStore.store_pkce_challenge(auth_session_id, session_data)

        logger.info(f"[oauth/authorize] Created session: {auth_session_id[:20]}...")
        logger.info(f"[oauth/authorize] Session data: {json.dumps({k: str(v)[:50] for k, v in session_data.items()})}")
        _log_storage_state("oauth/authorize")

        # If GitHub OAuth is configured, redirect to GitHub
        if GITHUB_OAUTH_CLIENT_ID:
            github_params = {
                "client_id": GITHUB_OAUTH_CLIENT_ID,
                "redirect_uri": f"{MCP_BASE_URL}/oauth/github/callback",
                "scope": "repo,read:user,user:email",
                "state": auth_session_id,
            }
            github_url = f"https://github.com/login/oauth/authorize?{urlencode(github_params)}"
            logger.info(f"[oauth/authorize] Redirecting to GitHub: {github_url[:100]}...")
            return RedirectResponse(github_url)

        # Fallback: Show simple authorization page
        logger.info("[oauth/authorize] GitHub OAuth not configured, showing fallback page")
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Miyabi MCP Authorization</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: system-ui; max-width: 480px; margin: 50px auto; padding: 20px; }}
                .card {{ background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 20px 0; }}
                h1 {{ color: #1a1a1a; font-size: 24px; }}
                p {{ color: #666; line-height: 1.6; }}
                .scopes {{ background: #fff; border-radius: 8px; padding: 16px; margin: 16px 0; }}
                .scope {{ display: flex; align-items: center; gap: 8px; margin: 8px 0; }}
                .btn {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
                       border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px;
                       cursor: pointer; width: 100%; margin-top: 16px; }}
                .btn:hover {{ opacity: 0.9; }}
            </style>
        </head>
        <body>
            <h1>Authorize Miyabi MCP</h1>
            <div class="card">
                <p><strong>{client_id}</strong> wants to access your Miyabi MCP tools.</p>
                <div class="scopes">
                    <div class="scope">✓ Access MCP tools (mcp:tools)</div>
                    <div class="scope">✓ Read resources (mcp:resources)</div>
                    <div class="scope">✓ Use prompts (mcp:prompts)</div>
                </div>
                <form action="/oauth/approve" method="POST">
                    <input type="hidden" name="session_id" value="{auth_session_id}">
                    <button type="submit" class="btn">Authorize</button>
                </form>
            </div>
        </body>
        </html>
        """)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[oauth/authorize] UNEXPECTED ERROR: {str(e)}")
        logger.error(f"[oauth/authorize] Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Internal error: {str(e)}")


@claude_router.post("/oauth/approve")
async def oauth_approve(session_id: str = Form(...)):
    """
    Handle authorization approval (fallback when GitHub OAuth not configured)
    """
    logger.info("=" * 50)
    logger.info("[oauth/approve] === APPROVAL REQUEST ===")
    logger.info(f"[oauth/approve] session_id={session_id[:30]}...")
    _log_storage_state("oauth/approve-start")

    try:
        session = PostgresStore.get_pkce_challenge(session_id)
        if not session:
            logger.error(f"[oauth/approve] SESSION NOT FOUND!")
            raise HTTPException(400, "Invalid session")

        logger.info(f"[oauth/approve] Found session for client_id={session['client_id']}")
        logger.info(f"[oauth/approve] Session data: {json.dumps({k: str(v)[:50] for k, v in session.items()})}")

        # Generate authorization code
        auth_code = secrets.token_urlsafe(32)
        auth_code_data = {
            "client_id": session["client_id"],
            "redirect_uri": session["redirect_uri"],
            "scope": session["scope"],
            "code_challenge": session["code_challenge"],
            "created_at": time.time(),
            "user_id": "miyabi-user",  # Fallback user
            "github_token": None,
        }
        PostgresStore.store_auth_code(auth_code, auth_code_data)

        logger.info(f"[oauth/approve] Created auth_code: {auth_code[:20]}...")
        logger.info(f"[oauth/approve] Auth code data: {json.dumps({k: str(v)[:50] if v else 'None' for k, v in auth_code_data.items()})}")

        # Clean up session
        PostgresStore.delete_pkce_challenge(session_id)
        logger.info(f"[oauth/approve] Cleaned up session")
        _log_storage_state("oauth/approve-end")

        # Redirect back to client with auth code
        redirect_params = {
            "code": auth_code,
            "state": session["state"],
        }
        redirect_url = f"{session['redirect_uri']}?{urlencode(redirect_params)}"
        logger.info(f"[oauth/approve] Redirecting to: {redirect_url[:100]}...")
        return RedirectResponse(redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[oauth/approve] UNEXPECTED ERROR: {str(e)}")
        logger.error(f"[oauth/approve] Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Internal error: {str(e)}")


@claude_router.get("/oauth/github/callback")
async def oauth_github_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    GitHub OAuth callback handler
    """
    logger.info("=" * 50)
    logger.info("[oauth/github/callback] === GITHUB CALLBACK ===")
    logger.info(f"[oauth/github/callback] code={code[:20]}...")
    logger.info(f"[oauth/github/callback] state={state[:30]}...")
    _log_storage_state("github-callback-start")

    try:
        session = PostgresStore.get_pkce_challenge(state)
        if not session:
            logger.error(f"[oauth/github/callback] STATE NOT FOUND in database!")
            raise HTTPException(400, "Invalid state parameter")

        logger.info(f"[oauth/github/callback] Found session for client_id={session['client_id']}")

        # Exchange code for GitHub access token
        import httpx
        logger.info("[oauth/github/callback] Exchanging code for GitHub token...")

        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_OAUTH_CLIENT_ID,
                    "client_secret": GITHUB_OAUTH_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )

            logger.info(f"[oauth/github/callback] GitHub token response status: {token_response.status_code}")
            logger.debug(f"[oauth/github/callback] GitHub token response: {token_response.text[:200]}")

            if token_response.status_code != 200:
                logger.error(f"[oauth/github/callback] GitHub token exchange failed: {token_response.text}")
                raise HTTPException(400, f"Failed to exchange GitHub code: {token_response.text}")

            github_token_data = token_response.json()

            if "error" in github_token_data:
                logger.error(f"[oauth/github/callback] GitHub returned error: {github_token_data}")
                raise HTTPException(400, f"GitHub error: {github_token_data.get('error_description', github_token_data.get('error'))}")

            github_access_token = github_token_data.get("access_token")
            logger.info(f"[oauth/github/callback] Got GitHub token: {'SET' if github_access_token else 'NOT SET'}")

            if not github_access_token:
                logger.error(f"[oauth/github/callback] No access_token in response: {github_token_data}")
                raise HTTPException(400, "No access token from GitHub")

            # Get GitHub user info
            logger.info("[oauth/github/callback] Fetching GitHub user info...")
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {github_access_token}"},
            )

            logger.info(f"[oauth/github/callback] GitHub user response status: {user_response.status_code}")

            if user_response.status_code != 200:
                logger.error(f"[oauth/github/callback] Failed to get user info: {user_response.text}")
                raise HTTPException(400, f"Failed to get GitHub user info: {user_response.text}")

            github_user = user_response.json()
            logger.info(f"[oauth/github/callback] GitHub user: login={github_user.get('login')}, id={github_user.get('id')}")

        # Generate MCP authorization code
        auth_code = secrets.token_urlsafe(32)
        auth_code_data = {
            "client_id": session["client_id"],
            "redirect_uri": session["redirect_uri"],
            "scope": session["scope"],
            "code_challenge": session["code_challenge"],
            "created_at": time.time(),
            "user_id": github_user["login"],
            "github_token": github_access_token,
        }
        PostgresStore.store_auth_code(auth_code, auth_code_data)

        logger.info(f"[oauth/github/callback] Created auth_code: {auth_code[:20]}...")
        logger.info(f"[oauth/github/callback] Auth code data: user_id={auth_code_data['user_id']}, github_token={'SET' if auth_code_data['github_token'] else 'NOT SET'}")

        # Clean up session
        PostgresStore.delete_pkce_challenge(state)
        logger.info("[oauth/github/callback] Cleaned up PKCE session")
        _log_storage_state("github-callback-end")

        # Redirect back to ChatGPT/Claude.ai with auth code
        redirect_params = {
            "code": auth_code,
            "state": session["state"],
        }
        redirect_url = f"{session['redirect_uri']}?{urlencode(redirect_params)}"
        logger.info(f"[oauth/github/callback] Redirecting to: {redirect_url[:100]}...")
        return RedirectResponse(redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[oauth/github/callback] UNEXPECTED ERROR: {str(e)}")
        logger.error(f"[oauth/github/callback] Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Internal error: {str(e)}")


@claude_router.post("/oauth/token")
async def oauth_token(
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: str = Form(...),
    client_secret: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    refresh_token: Optional[str] = Form(None),
):
    """
    OAuth 2.1 Token Endpoint
    Exchanges authorization code for access token
    """
    logger.info("=" * 50)
    logger.info("[oauth/token] === TOKEN REQUEST ===")
    logger.info(f"[oauth/token] grant_type={grant_type}")
    logger.info(f"[oauth/token] code={code[:20] if code else 'None'}...")
    logger.info(f"[oauth/token] client_id={client_id}")
    logger.info(f"[oauth/token] redirect_uri={redirect_uri[:50] if redirect_uri else 'None'}...")
    logger.info(f"[oauth/token] code_verifier={'SET' if code_verifier else 'NOT SET'}")
    _log_storage_state("oauth/token-start")

    try:
        if grant_type == "authorization_code":
            if not code:
                logger.error("[oauth/token] Missing code parameter")
                raise HTTPException(400, "Missing code")

            auth_data = PostgresStore.get_auth_code(code)
            if not auth_data:
                logger.error(f"[oauth/token] AUTH CODE NOT FOUND!")
                logger.error(f"[oauth/token] Requested code: {code[:20]}...")
                raise HTTPException(400, "Invalid authorization code")

            logger.info(f"[oauth/token] Found auth_code for user_id={auth_data.get('user_id')}")
            logger.info(f"[oauth/token] Auth data: github_token={'SET' if auth_data.get('github_token') else 'NOT SET'}")

            # Verify PKCE if code_challenge was provided during authorization
            stored_challenge = auth_data.get("code_challenge")
            if stored_challenge:
                logger.info("[oauth/token] PKCE verification required")
                if not code_verifier:
                    logger.error("[oauth/token] Missing code_verifier but code_challenge was set")
                    raise HTTPException(400, "Missing code_verifier (PKCE required)")
                import base64
                verifier_hash = hashlib.sha256(code_verifier.encode()).digest()
                expected_challenge = base64.urlsafe_b64encode(verifier_hash).decode().rstrip("=")
                if expected_challenge != stored_challenge:
                    logger.error(f"[oauth/token] PKCE verification failed!")
                    logger.error(f"[oauth/token] Expected: {stored_challenge[:30]}...")
                    logger.error(f"[oauth/token] Got: {expected_challenge[:30]}...")
                    raise HTTPException(400, "Invalid code_verifier")
                logger.info("[oauth/token] PKCE verification passed")
            else:
                logger.info("[oauth/token] No PKCE challenge stored, skipping verification")

            # Verify redirect_uri matches
            if redirect_uri != auth_data["redirect_uri"]:
                logger.error(f"[oauth/token] redirect_uri mismatch!")
                logger.error(f"[oauth/token] Expected: {auth_data['redirect_uri']}")
                logger.error(f"[oauth/token] Got: {redirect_uri}")
                raise HTTPException(400, "redirect_uri mismatch")

            # Generate access token
            access_token = secrets.token_urlsafe(32)
            refresh_token_value = secrets.token_urlsafe(32)

            user_id = auth_data["user_id"]
            github_token = auth_data.get("github_token")

            logger.info(f"[oauth/token] Generating tokens for user_id={user_id}")
            logger.info(f"[oauth/token] github_token from auth_data: {'SET' if github_token else 'NOT SET'}")

            token_data = {
                "scope": auth_data["scope"],
                "client_id": client_id,
                "github_token": github_token,
                "created_at": time.time(),
            }
            PostgresStore.store_access_token(access_token, user_id, token_data)
            logger.info(f"[oauth/token] Stored access_token in PostgreSQL: {access_token[:20]}...")

            # Store refresh token in PostgreSQL (30 days expiry)
            refresh_token_data = {
                "scope": auth_data["scope"],
                "client_id": client_id,
                "github_token": github_token,
                "created_at": time.time(),
            }
            PostgresStore.store_refresh_token(refresh_token_value, user_id, access_token, refresh_token_data)
            logger.info(f"[oauth/token] Stored refresh_token in PostgreSQL: {refresh_token_value[:20]}...")

            # Also register in main.py's token stores for tool access
            try:
                import main
                main.token_to_user[access_token] = user_id
                main.user_profiles[user_id] = {
                    "github_token": github_token,
                    "user_info": {"login": user_id},
                    "scope": auth_data["scope"],
                }
                logger.info(f"[oauth/token] SUCCESS: Registered in main.py for user={user_id}")
                logger.info(f"[oauth/token] main.token_to_user now has {len(main.token_to_user)} entries")
                logger.info(f"[oauth/token] main.user_profiles now has {len(main.user_profiles)} entries")
                logger.info(f"[oauth/token] main.user_profiles[{user_id}] = github_token={'SET' if github_token else 'NOT SET'}")
            except Exception as e:
                logger.error(f"[oauth/token] FAILED to register in main.py: {str(e)}")
                logger.error(f"[oauth/token] Traceback: {traceback.format_exc()}")

            # Clean up auth code (one-time use)
            PostgresStore.delete_auth_code(code)
            logger.info("[oauth/token] Cleaned up auth_code")
            _log_storage_state("oauth/token-end")

            response_data = {
                "access_token": access_token,
                "token_type": "Bearer",
                "expires_in": 3600,
                "refresh_token": refresh_token_value,
                "scope": auth_data["scope"],
            }
            logger.info(f"[oauth/token] Returning token response: access_token={access_token[:20]}...")
            return JSONResponse(response_data)

        elif grant_type == "refresh_token":
            # Refresh token grant - issue new access token
            logger.info("[oauth/token] Processing refresh_token grant")

            if not refresh_token:
                logger.error("[oauth/token] Missing refresh_token parameter")
                raise HTTPException(400, "Missing refresh_token")

            # Get refresh token data from PostgreSQL
            refresh_data = PostgresStore.get_refresh_token(refresh_token)
            if not refresh_data:
                logger.error(f"[oauth/token] REFRESH TOKEN NOT FOUND or expired!")
                raise HTTPException(400, "Invalid or expired refresh token")

            user_id = refresh_data["user_id"]
            github_token = refresh_data.get("github_token")
            scope = refresh_data.get("scope", "mcp:tools")

            logger.info(f"[oauth/token] Found refresh_token for user_id={user_id}")

            # Generate new access token
            new_access_token = secrets.token_urlsafe(32)
            new_refresh_token = secrets.token_urlsafe(32)

            # Store new access token
            new_token_data = {
                "scope": scope,
                "client_id": client_id,
                "github_token": github_token,
                "created_at": time.time(),
            }
            PostgresStore.store_access_token(new_access_token, user_id, new_token_data)
            logger.info(f"[oauth/token] Stored new access_token: {new_access_token[:20]}...")

            # Rotate refresh token (delete old, store new)
            PostgresStore.delete_refresh_token(refresh_token)
            PostgresStore.store_refresh_token(new_refresh_token, user_id, new_access_token, new_token_data)
            logger.info(f"[oauth/token] Rotated refresh_token: {new_refresh_token[:20]}...")

            # Update main.py token stores
            try:
                import main
                # Remove old token mapping if exists
                old_access_token = refresh_data.get("access_token")
                if old_access_token and old_access_token in main.token_to_user:
                    del main.token_to_user[old_access_token]

                main.token_to_user[new_access_token] = user_id
                main.user_profiles[user_id] = {
                    "github_token": github_token,
                    "user_info": {"login": user_id},
                    "scope": scope,
                }
                logger.info(f"[oauth/token] Updated main.py for user={user_id}")
            except Exception as e:
                logger.error(f"[oauth/token] FAILED to update main.py: {str(e)}")

            _log_storage_state("oauth/token-refresh-end")

            response_data = {
                "access_token": new_access_token,
                "token_type": "Bearer",
                "expires_in": 3600,
                "refresh_token": new_refresh_token,
                "scope": scope,
            }
            logger.info(f"[oauth/token] Returning refreshed token response")
            return JSONResponse(response_data)

        else:
            logger.error(f"[oauth/token] Unsupported grant_type: {grant_type}")
            raise HTTPException(400, f"Unsupported grant_type: {grant_type}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[oauth/token] UNEXPECTED ERROR: {str(e)}")
        logger.error(f"[oauth/token] Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Internal error: {str(e)}")


@claude_router.post("/oauth/register")
async def oauth_register(request: Request):
    """
    Dynamic Client Registration (RFC 7591)
    Allows Claude.ai to register as an OAuth client
    """
    logger.info("[oauth/register] Client registration request")
    try:
        client_metadata = await request.json()
        logger.info(f"[oauth/register] Metadata: {json.dumps(client_metadata)[:200]}")
    except Exception as e:
        logger.error(f"[oauth/register] Invalid JSON: {str(e)}")
        raise HTTPException(400, "Invalid JSON body")

    # Generate client credentials
    client_id = f"claude-{secrets.token_urlsafe(8)}"
    client_secret = secrets.token_urlsafe(32)

    logger.info(f"[oauth/register] Generated client_id={client_id}")

    return JSONResponse({
        "client_id": client_id,
        "client_secret": client_secret,
        "client_id_issued_at": int(time.time()),
        "client_secret_expires_at": 0,  # Never expires
        "redirect_uris": client_metadata.get("redirect_uris", []),
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "client_secret_post",
    })


@claude_router.post("/oauth/revoke")
async def oauth_revoke(token: str = Form(...)):
    """
    Token Revocation Endpoint (RFC 7009)
    """
    logger.info(f"[oauth/revoke] Revoking token: {token[:20]}...")
    PostgresStore.delete_access_token(token)
    logger.info("[oauth/revoke] Token revoked")
    return JSONResponse({"status": "ok"})


# ============================================
# SSE Endpoint for MCP Transport
# ============================================

@claude_router.get("/sse")
async def sse_endpoint(request: Request):
    """
    Server-Sent Events endpoint for MCP remote transport
    Claude.ai Web uses this for real-time MCP communication
    """
    from starlette.responses import StreamingResponse

    client_id = str(uuid.uuid4())
    message_queue: asyncio.Queue = asyncio.Queue()
    _sse_clients[client_id] = message_queue

    logger.info(f"[sse] New SSE client connected: {client_id}")

    async def event_generator():
        try:
            # Send connection event
            yield f"event: connected\ndata: {json.dumps({'client_id': client_id})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info(f"[sse] Client disconnected: {client_id}")
                    break

                try:
                    # Wait for messages with timeout
                    message = await asyncio.wait_for(
                        message_queue.get(),
                        timeout=30.0
                    )
                    yield f"event: message\ndata: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f"event: ping\ndata: {json.dumps({'time': time.time()})}\n\n"
        finally:
            # Clean up on disconnect
            if client_id in _sse_clients:
                del _sse_clients[client_id]
                logger.info(f"[sse] Cleaned up client: {client_id}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@claude_router.post("/sse/messages")
async def sse_send_message(request: Request, client_id: str = Query(...)):
    """
    Send message to SSE client
    Used by MCP to push responses to Claude.ai
    """
    logger.debug(f"[sse/messages] Sending message to client: {client_id}")
    if client_id not in _sse_clients:
        logger.warning(f"[sse/messages] Client not found: {client_id}")
        raise HTTPException(404, "Client not found")

    message = await request.json()
    await _sse_clients[client_id].put(message)
    return JSONResponse({"status": "sent"})


# ============================================
# Utility function to verify tokens
# ============================================

def verify_claude_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Claude.ai access token
    Returns token data if valid, None otherwise
    """
    logger.debug(f"[verify_claude_token] Verifying token: {token[:20] if token else 'None'}...")

    token_data = PostgresStore.get_access_token(token)
    if token_data:
        logger.debug(f"[verify_claude_token] Token valid for user: {token_data.get('user_id')}")
        return token_data
    else:
        logger.debug("[verify_claude_token] Token not found or expired")
    return None


def get_token_user_id(token: str) -> Optional[str]:
    """Get user ID from token"""
    token_data = verify_claude_token(token)
    return token_data["user_id"] if token_data else None


# ============================================
# Debug endpoint to check storage state
# ============================================

def verify_debug_key(x_debug_key: str = Header(None, alias="X-Debug-Key")):
    """Verify debug API key for protected endpoints"""
    if not DEBUG_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Debug endpoint disabled (DEBUG_API_KEY not configured)"
        )
    if not x_debug_key or not secrets.compare_digest(x_debug_key, DEBUG_API_KEY):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-Debug-Key header"
        )
    return True


@claude_router.get("/debug/oauth-state")
async def debug_oauth_state(x_debug_key: str = Header(None, alias="X-Debug-Key")):
    """
    Debug endpoint to check OAuth storage state
    Requires X-Debug-Key header with valid DEBUG_API_KEY
    """
    verify_debug_key(x_debug_key)

    logger.info("[debug/oauth-state] State requested (authenticated)")
    stats = PostgresStore.get_stats()
    return JSONResponse({
        "storage_type": "PostgreSQL",
        "database": f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}",
        "auth_codes_count": stats["auth_codes"],
        "access_tokens_count": stats["access_tokens"],
        "refresh_tokens_count": stats.get("refresh_tokens", 0),
        "pkce_challenges_count": stats["pkce_challenges"],
        "sse_clients_count": len(_sse_clients),
    })
