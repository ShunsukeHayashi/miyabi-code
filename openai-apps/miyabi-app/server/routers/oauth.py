#!/usr/bin/env python3
"""
Miyabi MCP Server - OAuth Router
OAuth 2.1 authentication endpoints
"""

import time
import secrets
import hashlib
import base64
from typing import Optional, Dict, Any
from urllib.parse import urlencode

from fastapi import APIRouter, Request, HTTPException, Form, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED

from ..core.config import settings
from ..core.security import token_store, generate_secure_token
from ..core.logging import get_logger

logger = get_logger("miyabi.oauth")

router = APIRouter(prefix="/oauth", tags=["OAuth"])


# ===========================================
# OAuth Models
# ===========================================

class TokenResponse(BaseModel):
    """OAuth token response"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    scope: Optional[str] = None


class TokenRequest(BaseModel):
    """OAuth token request"""
    grant_type: str
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    refresh_token: Optional[str] = None
    code_verifier: Optional[str] = None


# ===========================================
# PKCE Helpers
# ===========================================

def generate_code_challenge(verifier: str) -> str:
    """Generate PKCE code challenge from verifier"""
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def verify_pkce(code_verifier: str, stored_challenge: str) -> bool:
    """Verify PKCE code verifier against stored challenge"""
    calculated = generate_code_challenge(code_verifier)
    return secrets.compare_digest(calculated, stored_challenge)


# ===========================================
# OAuth Endpoints
# ===========================================

@router.get("/authorize")
async def authorize(
    response_type: str = Query(...),
    client_id: str = Query(...),
    redirect_uri: str = Query(...),
    scope: str = Query(default=""),
    state: Optional[str] = Query(default=None),
    code_challenge: Optional[str] = Query(default=None),
    code_challenge_method: Optional[str] = Query(default=None),
):
    """
    OAuth 2.1 Authorization Endpoint
    
    Supports:
    - Authorization Code flow with PKCE
    - GitHub OAuth App integration
    """
    logger.info(f"OAuth authorize request", data={
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
    })
    
    # Validate response_type
    if response_type != "code":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Only 'code' response_type is supported"
        )
    
    # PKCE is required for OAuth 2.1
    if code_challenge and code_challenge_method != "S256":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Only S256 code_challenge_method is supported"
        )
    
    # If GitHub OAuth is configured, redirect to GitHub
    if settings.github_oauth_client_id:
        github_params = {
            "client_id": settings.github_oauth_client_id,
            "redirect_uri": settings.github_oauth_callback_url,
            "scope": "read:user user:email repo",
            "state": state or generate_secure_token(16),
        }
        
        # Store state for verification
        if code_challenge:
            token_store.pkce_challenges[github_params["state"]] = code_challenge
        
        github_url = f"https://github.com/login/oauth/authorize?{urlencode(github_params)}"
        return RedirectResponse(url=github_url)
    
    # For development: Generate authorization code directly
    auth_code = generate_secure_token(32)
    
    # Store authorization code
    await token_store.store_access_token(
        f"auth_code:{auth_code}",
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scope,
            "code_challenge": code_challenge,
        },
        ttl=600  # 10 minutes
    )
    
    # Redirect back with code
    redirect_params = {"code": auth_code}
    if state:
        redirect_params["state"] = state
    
    return RedirectResponse(url=f"{redirect_uri}?{urlencode(redirect_params)}")


@router.get("/callback")
async def github_callback(
    code: str = Query(...),
    state: Optional[str] = Query(default=None),
):
    """
    GitHub OAuth Callback
    
    Exchanges GitHub authorization code for access token.
    """
    import httpx
    
    logger.info(f"GitHub OAuth callback", data={"state": state})
    
    if not settings.github_oauth_client_id:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="GitHub OAuth not configured"
        )
    
    # Exchange code for GitHub access token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_oauth_client_id,
                "client_secret": settings.github_oauth_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Failed to exchange code for token"
            )
        
        github_token_data = response.json()
        github_access_token = github_token_data.get("access_token")
        
        if not github_access_token:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="No access token in response"
            )
        
        # Get user info from GitHub
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_access_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Failed to get user info"
            )
        
        github_user = user_response.json()
    
    # Generate our own access token
    access_token = generate_secure_token(32)
    refresh_token = generate_secure_token(32)
    
    # Store token with user info
    await token_store.store_access_token(
        access_token,
        {
            "github_user_id": github_user["id"],
            "github_username": github_user["login"],
            "github_access_token": github_access_token,
            "scope": "read:user user:email repo",
        },
        ttl=3600  # 1 hour
    )
    
    # Store refresh token
    await token_store.store_access_token(
        f"refresh:{refresh_token}",
        {
            "access_token": access_token,
            "github_user_id": github_user["id"],
        },
        ttl=86400 * 30  # 30 days
    )
    
    logger.info(f"OAuth successful for user: {github_user['login']}")
    
    # Return success page with token info
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Miyabi MCP - Authorization Successful</title>
        <style>
            body {{ font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }}
            .success {{ color: green; }}
            .token {{ background: #f0f0f0; padding: 10px; border-radius: 4px; word-break: break-all; }}
        </style>
    </head>
    <body>
        <h1 class="success">✅ Authorization Successful</h1>
        <p>Welcome, <strong>{github_user['login']}</strong>!</p>
        <p>Your access token:</p>
        <div class="token">{access_token}</div>
        <p>Use this token in the Authorization header:</p>
        <code>Authorization: Bearer {access_token}</code>
        <p><small>This token expires in 1 hour.</small></p>
    </body>
    </html>
    """)


@router.post("/token")
async def token(
    grant_type: str = Form(...),
    code: Optional[str] = Form(default=None),
    redirect_uri: Optional[str] = Form(default=None),
    client_id: Optional[str] = Form(default=None),
    client_secret: Optional[str] = Form(default=None),
    refresh_token: Optional[str] = Form(default=None),
    code_verifier: Optional[str] = Form(default=None),
):
    """
    OAuth 2.1 Token Endpoint
    
    Supports:
    - authorization_code grant (with PKCE)
    - refresh_token grant
    """
    logger.info(f"Token request", data={"grant_type": grant_type})
    
    if grant_type == "authorization_code":
        if not code:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Authorization code required"
            )
        
        # Get stored authorization code data
        code_data = await token_store.get_access_token(f"auth_code:{code}")
        
        if not code_data:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authorization code"
            )
        
        # Verify PKCE if code_challenge was used
        if code_data.get("code_challenge"):
            if not code_verifier:
                raise HTTPException(
                    status_code=HTTP_400_BAD_REQUEST,
                    detail="code_verifier required for PKCE"
                )
            
            if not verify_pkce(code_verifier, code_data["code_challenge"]):
                raise HTTPException(
                    status_code=HTTP_401_UNAUTHORIZED,
                    detail="Invalid code_verifier"
                )
        
        # Revoke the authorization code (one-time use)
        await token_store.revoke_access_token(f"auth_code:{code}")
        
        # Generate tokens
        access_token = generate_secure_token(32)
        new_refresh_token = generate_secure_token(32)
        
        await token_store.store_access_token(
            access_token,
            {"scope": code_data.get("scope", "")},
            ttl=3600
        )
        
        await token_store.store_access_token(
            f"refresh:{new_refresh_token}",
            {"access_token": access_token},
            ttl=86400 * 30
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=3600,
            refresh_token=new_refresh_token,
            scope=code_data.get("scope"),
        )
    
    elif grant_type == "refresh_token":
        if not refresh_token:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Refresh token required"
            )
        
        refresh_data = await token_store.get_access_token(f"refresh:{refresh_token}")
        
        if not refresh_data:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Generate new access token
        access_token = generate_secure_token(32)
        
        await token_store.store_access_token(
            access_token,
            {"scope": refresh_data.get("scope", "")},
            ttl=3600
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=3600,
        )
    
    else:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Unsupported grant_type: {grant_type}"
        )


@router.post("/revoke")
async def revoke_token(
    token: str = Form(...),
    token_type_hint: Optional[str] = Form(default=None),
):
    """
    OAuth 2.1 Token Revocation Endpoint
    """
    logger.info(f"Token revocation request")
    
    # Try to revoke as access token
    await token_store.revoke_access_token(token)
    
    # Try to revoke as refresh token
    await token_store.revoke_access_token(f"refresh:{token}")
    
    return {"status": "revoked"}


@router.get("/.well-known/oauth-authorization-server")
async def oauth_metadata():
    """
    OAuth 2.1 Authorization Server Metadata
    """
    base_url = settings.oauth_issuer
    
    return {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/oauth/authorize",
        "token_endpoint": f"{base_url}/oauth/token",
        "revocation_endpoint": f"{base_url}/oauth/revoke",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
    }
