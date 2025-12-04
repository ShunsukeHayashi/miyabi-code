#!/usr/bin/env python3
"""
GitHub Device Flow Authentication
For CLI/MCP clients that cannot use browser redirects
"""

import os
import time
import httpx
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth/github/device", tags=["GitHub Device Flow"])

# GitHub OAuth App Configuration
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID", "")

# In-memory storage for device flow states
device_flow_states: Dict[str, Dict[str, Any]] = {}


class DeviceFlowStartResponse(BaseModel):
    """Response from starting device flow"""
    device_code: str
    user_code: str
    verification_uri: str
    expires_in: int
    interval: int
    message: str


class DeviceFlowPollResponse(BaseModel):
    """Response from polling device flow status"""
    status: str  # pending, success, expired, error
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    scope: Optional[str] = None
    user: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None


@router.post("/start", response_model=DeviceFlowStartResponse)
async def start_device_flow(scope: str = "repo,user,read:org"):
    """
    Start GitHub Device Flow authentication
    
    This is ideal for CLI tools and MCP clients that cannot
    open a browser redirect flow.
    
    Steps:
    1. Call this endpoint to get a user_code
    2. User visits verification_uri and enters the code
    3. Poll /poll/{device_code} until success
    """
    if not GITHUB_OAUTH_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID."
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/device/code",
            data={
                "client_id": GITHUB_OAUTH_CLIENT_ID,
                "scope": scope,
            },
            headers={"Accept": "application/json"},
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"GitHub API error: {response.text}"
            )
        
        data = response.json()
        
        if "error" in data:
            raise HTTPException(
                status_code=400,
                detail=data.get("error_description", data["error"])
            )
        
        device_code = data["device_code"]
        
        # Store state
        device_flow_states[device_code] = {
            "user_code": data["user_code"],
            "verification_uri": data["verification_uri"],
            "expires_at": time.time() + data["expires_in"],
            "interval": data["interval"],
            "status": "pending",
        }
        
        return DeviceFlowStartResponse(
            device_code=device_code,
            user_code=data["user_code"],
            verification_uri=data["verification_uri"],
            expires_in=data["expires_in"],
            interval=data["interval"],
            message=f"ブラウザで {data['verification_uri']} を開き、コード {data['user_code']} を入力してください。"
        )


@router.get("/poll/{device_code}", response_model=DeviceFlowPollResponse)
async def poll_device_flow(device_code: str):
    """
    Poll for device flow completion
    
    Call this endpoint every `interval` seconds until:
    - status: "success" (with access_token)
    - status: "expired" (user didn't complete in time)
    - status: "error" (something went wrong)
    """
    if not GITHUB_OAUTH_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured"
        )
    
    # Check if we have this device code
    state = device_flow_states.get(device_code)
    if not state:
        return DeviceFlowPollResponse(
            status="error",
            error="invalid_device_code",
            message="デバイスコードが見つかりません。最初からやり直してください。"
        )
    
    # Check expiration
    if time.time() > state["expires_at"]:
        del device_flow_states[device_code]
        return DeviceFlowPollResponse(
            status="expired",
            error="expired_token",
            message="認証の有効期限が切れました。最初からやり直してください。"
        )
    
    # Poll GitHub
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_OAUTH_CLIENT_ID,
                "device_code": device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
            headers={"Accept": "application/json"},
        )
        
        data = response.json()
        
        # Still waiting for user
        if data.get("error") == "authorization_pending":
            return DeviceFlowPollResponse(
                status="pending",
                message=f"ユーザーの認証待ちです。{state['verification_uri']} でコード {state['user_code']} を入力してください。"
            )
        
        # Slow down polling
        if data.get("error") == "slow_down":
            state["interval"] = state.get("interval", 5) + 5
            return DeviceFlowPollResponse(
                status="pending",
                message=f"ポーリング間隔を {state['interval']} 秒に増やしてください。"
            )
        
        # Access denied
        if data.get("error") == "access_denied":
            del device_flow_states[device_code]
            return DeviceFlowPollResponse(
                status="error",
                error="access_denied",
                message="ユーザーがアクセスを拒否しました。"
            )
        
        # Expired
        if data.get("error") == "expired_token":
            del device_flow_states[device_code]
            return DeviceFlowPollResponse(
                status="expired",
                error="expired_token",
                message="認証の有効期限が切れました。"
            )
        
        # Other error
        if "error" in data:
            return DeviceFlowPollResponse(
                status="error",
                error=data["error"],
                message=data.get("error_description", data["error"])
            )
        
        # Success!
        access_token = data["access_token"]
        
        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        
        user_data = None
        if user_response.status_code == 200:
            user_data = user_response.json()
        
        # Clean up state
        del device_flow_states[device_code]
        
        return DeviceFlowPollResponse(
            status="success",
            access_token=access_token,
            token_type=data.get("token_type", "bearer"),
            scope=data.get("scope", ""),
            user=user_data,
            message=f"認証成功！ようこそ {user_data.get('login', 'User')} さん。"
        )


@router.get("/status/{device_code}")
async def device_flow_status(device_code: str):
    """
    Check device flow status without polling GitHub
    Returns cached state information
    """
    state = device_flow_states.get(device_code)
    
    if not state:
        return {
            "exists": False,
            "message": "デバイスコードが見つかりません"
        }
    
    remaining = max(0, int(state["expires_at"] - time.time()))
    
    return {
        "exists": True,
        "status": state["status"],
        "user_code": state["user_code"],
        "verification_uri": state["verification_uri"],
        "expires_in": remaining,
        "interval": state["interval"],
    }
