"""
Claude.ai Web MCP Integration Module
Adds OAuth 2.1 and SSE endpoints for Claude.ai Web remote MCP connection
"""

import os
import json
import time
import uuid
import hashlib
import secrets
import asyncio
from typing import Dict, Any, Optional
from urllib.parse import urlencode, parse_qs

from fastapi import APIRouter, Request, HTTPException, Query, Form
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from sse_starlette.sse import EventSourceResponse

# Router for Claude.ai Web MCP endpoints
claude_router = APIRouter()

# Base URL for OAuth
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "https://mcp.miyabi-world.com")

# GitHub OAuth Configuration
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID", "")
GITHUB_OAUTH_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET", "")

# In-memory storage (use Redis in production)
_auth_codes: Dict[str, Dict[str, Any]] = {}
_access_tokens: Dict[str, Dict[str, Any]] = {}
_pkce_challenges: Dict[str, str] = {}
_sse_clients: Dict[str, asyncio.Queue] = {}


# ============================================
# .well-known endpoints (OAuth discovery)
# ============================================

@claude_router.get("/.well-known/oauth-authorization-server")
async def oauth_authorization_server_metadata():
    """
    OAuth 2.1 Authorization Server Metadata (RFC 8414)
    Required for Claude.ai Web MCP client discovery
    """
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
    code_challenge: str = Query(...),
    code_challenge_method: str = Query("S256"),
):
    """
    OAuth 2.1 Authorization Endpoint with PKCE
    Redirects to GitHub OAuth for authentication
    """
    if response_type != "code":
        raise HTTPException(400, "Only 'code' response_type is supported")

    if code_challenge_method != "S256":
        raise HTTPException(400, "Only S256 code_challenge_method is supported")

    # Store PKCE challenge and OAuth params
    auth_session_id = secrets.token_urlsafe(32)
    _pkce_challenges[auth_session_id] = {
        "code_challenge": code_challenge,
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "state": state,
        "created_at": time.time(),
    }

    # If GitHub OAuth is configured, redirect to GitHub
    if GITHUB_OAUTH_CLIENT_ID:
        github_params = {
            "client_id": GITHUB_OAUTH_CLIENT_ID,
            "redirect_uri": f"{MCP_BASE_URL}/oauth/github/callback",
            "scope": "repo,read:user,user:email",
            "state": auth_session_id,
        }
        return RedirectResponse(
            f"https://github.com/login/oauth/authorize?{urlencode(github_params)}"
        )

    # Fallback: Show simple authorization page
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


@claude_router.post("/oauth/approve")
async def oauth_approve(session_id: str = Form(...)):
    """
    Handle authorization approval (fallback when GitHub OAuth not configured)
    """
    if session_id not in _pkce_challenges:
        raise HTTPException(400, "Invalid session")

    session = _pkce_challenges[session_id]

    # Generate authorization code
    auth_code = secrets.token_urlsafe(32)
    _auth_codes[auth_code] = {
        "client_id": session["client_id"],
        "redirect_uri": session["redirect_uri"],
        "scope": session["scope"],
        "code_challenge": session["code_challenge"],
        "created_at": time.time(),
        "user_id": "miyabi-user",  # Fallback user
    }

    # Redirect back to client with auth code
    redirect_params = {
        "code": auth_code,
        "state": session["state"],
    }
    return RedirectResponse(f"{session['redirect_uri']}?{urlencode(redirect_params)}")


@claude_router.get("/oauth/github/callback")
async def oauth_github_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    GitHub OAuth callback handler
    """
    if state not in _pkce_challenges:
        raise HTTPException(400, "Invalid state parameter")

    session = _pkce_challenges[state]

    # Exchange code for GitHub access token
    import httpx
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

        if token_response.status_code != 200:
            raise HTTPException(400, "Failed to exchange GitHub code")

        github_token_data = token_response.json()
        github_access_token = github_token_data.get("access_token")

        if not github_access_token:
            raise HTTPException(400, "No access token from GitHub")

        # Get GitHub user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_access_token}"},
        )

        if user_response.status_code != 200:
            raise HTTPException(400, "Failed to get GitHub user info")

        github_user = user_response.json()

    # Generate MCP authorization code
    auth_code = secrets.token_urlsafe(32)
    _auth_codes[auth_code] = {
        "client_id": session["client_id"],
        "redirect_uri": session["redirect_uri"],
        "scope": session["scope"],
        "code_challenge": session["code_challenge"],
        "created_at": time.time(),
        "user_id": github_user["login"],
        "github_token": github_access_token,
    }

    # Clean up session
    del _pkce_challenges[state]

    # Redirect back to Claude.ai with auth code
    redirect_params = {
        "code": auth_code,
        "state": session["state"],
    }
    return RedirectResponse(f"{session['redirect_uri']}?{urlencode(redirect_params)}")


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
    if grant_type == "authorization_code":
        if not code or not code_verifier:
            raise HTTPException(400, "Missing code or code_verifier")

        if code not in _auth_codes:
            raise HTTPException(400, "Invalid authorization code")

        auth_data = _auth_codes[code]

        # Verify PKCE
        verifier_hash = hashlib.sha256(code_verifier.encode()).digest()
        verifier_challenge = secrets.token_urlsafe(len(verifier_hash))
        import base64
        expected_challenge = base64.urlsafe_b64encode(verifier_hash).decode().rstrip("=")

        if expected_challenge != auth_data["code_challenge"]:
            raise HTTPException(400, "Invalid code_verifier")

        # Verify redirect_uri matches
        if redirect_uri != auth_data["redirect_uri"]:
            raise HTTPException(400, "redirect_uri mismatch")

        # Generate access token
        access_token = secrets.token_urlsafe(32)
        refresh_token_value = secrets.token_urlsafe(32)

        _access_tokens[access_token] = {
            "user_id": auth_data["user_id"],
            "scope": auth_data["scope"],
            "client_id": client_id,
            "github_token": auth_data.get("github_token"),
            "created_at": time.time(),
            "expires_at": time.time() + 3600,  # 1 hour
        }

        # Clean up auth code (one-time use)
        del _auth_codes[code]

        return JSONResponse({
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": refresh_token_value,
            "scope": auth_data["scope"],
        })

    elif grant_type == "refresh_token":
        # Handle refresh token
        raise HTTPException(400, "Refresh token not implemented yet")

    else:
        raise HTTPException(400, f"Unsupported grant_type: {grant_type}")


@claude_router.post("/oauth/register")
async def oauth_register(request: Request):
    """
    Dynamic Client Registration (RFC 7591)
    Allows Claude.ai to register as an OAuth client
    """
    try:
        client_metadata = await request.json()
    except:
        raise HTTPException(400, "Invalid JSON body")

    # Generate client credentials
    client_id = f"claude-{secrets.token_urlsafe(8)}"
    client_secret = secrets.token_urlsafe(32)

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
    if token in _access_tokens:
        del _access_tokens[token]
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

    async def event_generator():
        try:
            # Send connection event
            yield f"event: connected\ndata: {json.dumps({'client_id': client_id})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
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
    if client_id not in _sse_clients:
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
    if token in _access_tokens:
        token_data = _access_tokens[token]
        if time.time() < token_data["expires_at"]:
            return token_data
        else:
            del _access_tokens[token]
    return None


def get_token_user_id(token: str) -> Optional[str]:
    """Get user ID from token"""
    token_data = verify_claude_token(token)
    return token_data["user_id"] if token_data else None
