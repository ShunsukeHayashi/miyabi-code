#!/usr/bin/env python3
"""
Claude.ai Web MCP E2E Test Suite
Tests OAuth flow, SSE connection, and MCP tool invocation
"""

import asyncio
import httpx
import json
import time
import hashlib
import base64
import secrets
from typing import Dict, Any, Optional

# Configuration
MCP_BASE_URL = "https://mcp.miyabi-world.com"
# MCP_BASE_URL = "http://localhost:8000"  # For local testing

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def success(self, name: str, message: str = ""):
        self.passed += 1
        print(f"  \033[92m✓\033[0m {name}" + (f" - {message}" if message else ""))

    def fail(self, name: str, error: str):
        self.failed += 1
        self.errors.append((name, error))
        print(f"  \033[91m✗\033[0m {name} - {error}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"Test Results: {self.passed}/{total} passed")
        if self.errors:
            print("\nFailed tests:")
            for name, error in self.errors:
                print(f"  - {name}: {error}")
        return self.failed == 0


results = TestResults()


async def test_oauth_discovery():
    """Test OAuth 2.1 discovery endpoints"""
    print("\n1. OAuth Discovery Endpoints")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test authorization server metadata
        try:
            resp = await client.get(f"{MCP_BASE_URL}/.well-known/oauth-authorization-server")
            if resp.status_code == 200:
                data = resp.json()
                required_fields = ["issuer", "authorization_endpoint", "token_endpoint", "code_challenge_methods_supported"]
                missing = [f for f in required_fields if f not in data]
                if missing:
                    results.fail("oauth-authorization-server", f"Missing fields: {missing}")
                elif "S256" not in data.get("code_challenge_methods_supported", []):
                    results.fail("oauth-authorization-server", "S256 not in code_challenge_methods_supported")
                else:
                    results.success("oauth-authorization-server", f"issuer={data['issuer']}")
            else:
                results.fail("oauth-authorization-server", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("oauth-authorization-server", str(e))

        # Test protected resource metadata
        try:
            resp = await client.get(f"{MCP_BASE_URL}/.well-known/oauth-protected-resource")
            if resp.status_code == 200:
                data = resp.json()
                if "resource" in data and "authorization_servers" in data:
                    results.success("oauth-protected-resource", f"resource={data['resource']}")
                else:
                    results.fail("oauth-protected-resource", "Missing required fields")
            else:
                results.fail("oauth-protected-resource", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("oauth-protected-resource", str(e))


async def test_oauth_flow():
    """Test OAuth 2.1 authorization flow with PKCE"""
    print("\n2. OAuth Flow (PKCE)")

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
        # Generate PKCE challenge
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip("=")

        state = secrets.token_urlsafe(16)

        # Test authorization endpoint
        try:
            params = {
                "response_type": "code",
                "client_id": "test-client",
                "redirect_uri": "http://localhost:3000/callback",
                "scope": "mcp:tools",
                "state": state,
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
            }
            resp = await client.get(f"{MCP_BASE_URL}/oauth/authorize", params=params)

            # Should redirect to GitHub or show authorization page
            if resp.status_code in [200, 302, 303, 307]:
                if resp.status_code in [302, 303, 307]:
                    location = resp.headers.get("location", "")
                    if "github.com" in location:
                        results.success("oauth/authorize", "Redirects to GitHub OAuth")
                    else:
                        results.success("oauth/authorize", f"Redirect to: {location[:50]}...")
                else:
                    # HTML authorization page
                    if "Authorize" in resp.text or "authorize" in resp.text.lower():
                        results.success("oauth/authorize", "Shows authorization page")
                    else:
                        results.success("oauth/authorize", "Returns auth response")
            else:
                results.fail("oauth/authorize", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("oauth/authorize", str(e))

        # Test invalid request handling
        try:
            resp = await client.get(f"{MCP_BASE_URL}/oauth/authorize", params={
                "response_type": "invalid",
                "client_id": "test",
                "redirect_uri": "http://localhost/callback",
                "state": "test",
                "code_challenge": "test",
                "code_challenge_method": "S256",
            })
            if resp.status_code in [400, 422]:
                results.success("oauth/authorize-validation", "Rejects invalid response_type")
            else:
                results.fail("oauth/authorize-validation", f"Expected 400, got {resp.status_code}")
        except Exception as e:
            results.fail("oauth/authorize-validation", str(e))


async def test_dynamic_client_registration():
    """Test OAuth Dynamic Client Registration (RFC 7591)"""
    print("\n3. Dynamic Client Registration")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{MCP_BASE_URL}/oauth/register",
                json={
                    "redirect_uris": ["http://localhost:3000/callback"],
                    "client_name": "Test MCP Client",
                    "token_endpoint_auth_method": "client_secret_post",
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "client_id" in data and "client_secret" in data:
                    results.success("oauth/register", f"client_id={data['client_id'][:20]}...")
                else:
                    results.fail("oauth/register", "Missing client_id or client_secret")
            else:
                results.fail("oauth/register", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("oauth/register", str(e))


async def test_sse_connection():
    """Test SSE endpoint for MCP transport"""
    print("\n4. SSE Transport")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Test SSE endpoint
            async with client.stream("GET", f"{MCP_BASE_URL}/sse") as resp:
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    if "text/event-stream" in content_type:
                        # Read first event
                        first_line = ""
                        async for line in resp.aiter_lines():
                            if line.startswith("event:") or line.startswith("data:"):
                                first_line = line
                                break
                            if not line:
                                continue

                        if first_line:
                            results.success("sse-endpoint", f"Received: {first_line[:50]}...")
                        else:
                            results.success("sse-endpoint", "Connected (no events yet)")
                    else:
                        results.fail("sse-endpoint", f"Wrong content-type: {content_type}")
                else:
                    results.fail("sse-endpoint", f"HTTP {resp.status_code}")
        except httpx.ReadTimeout:
            results.success("sse-endpoint", "Connection established (timeout waiting for events)")
        except Exception as e:
            results.fail("sse-endpoint", str(e))


async def test_mcp_endpoint():
    """Test MCP SSE endpoint at /mcp"""
    print("\n5. MCP Endpoint")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Test MCP SSE endpoint
            async with client.stream("GET", f"{MCP_BASE_URL}/mcp", headers={"Accept": "text/event-stream"}) as resp:
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    events = []
                    async for line in resp.aiter_lines():
                        events.append(line)
                        if len(events) > 5:
                            break

                    if events:
                        results.success("mcp-sse", f"Events: {events[:2]}")
                    else:
                        results.success("mcp-sse", "Connected")
                else:
                    results.fail("mcp-sse", f"HTTP {resp.status_code}")
        except httpx.ReadTimeout:
            results.success("mcp-sse", "Connected (timeout waiting)")
        except Exception as e:
            results.fail("mcp-sse", str(e))

        # Test MCP POST (JSON-RPC)
        try:
            resp = await client.post(
                f"{MCP_BASE_URL}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "e2e-test", "version": "1.0.0"}
                    }
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "result" in data:
                    results.success("mcp-initialize", f"Server: {data['result'].get('serverInfo', {}).get('name', 'unknown')}")
                elif "error" in data:
                    results.fail("mcp-initialize", f"Error: {data['error']}")
                else:
                    results.success("mcp-initialize", "Response received")
            else:
                results.fail("mcp-initialize", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("mcp-initialize", str(e))


async def test_tools_list():
    """Test MCP tools/list method"""
    print("\n6. MCP Tools")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{MCP_BASE_URL}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/list",
                    "params": {}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "result" in data and "tools" in data["result"]:
                    tools = data["result"]["tools"]
                    tool_names = [t["name"] for t in tools[:5]]
                    results.success("tools/list", f"Found {len(tools)} tools: {tool_names}...")

                    # Check for key tools
                    key_tools = ["git_status", "list_files", "search_tools", "set_project"]
                    found_tools = [t for t in tools if t["name"] in key_tools]
                    if len(found_tools) >= 3:
                        results.success("key-tools", f"Key tools found: {[t['name'] for t in found_tools]}")
                    else:
                        results.fail("key-tools", f"Missing key tools. Found: {[t['name'] for t in found_tools]}")
                else:
                    results.fail("tools/list", "No tools in response")
            else:
                results.fail("tools/list", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("tools/list", str(e))


async def test_project_switching():
    """Test project switching functionality"""
    print("\n7. Project Switching")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Call set_project tool
            resp = await client.post(
                f"{MCP_BASE_URL}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {
                        "name": "set_project",
                        "arguments": {
                            "repository": "customer-cloud/miyabi-private"
                        }
                    }
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "result" in data:
                    content = data["result"].get("content", [])
                    if content and len(content) > 0:
                        text = content[0].get("text", "")
                        if "Connected" in text or "miyabi" in text.lower():
                            results.success("set_project", text[:60])
                        else:
                            results.success("set_project", f"Response: {text[:60]}")
                    else:
                        results.success("set_project", "Project set (no message)")
                elif "error" in data:
                    results.fail("set_project", f"Error: {data['error']}")
                else:
                    results.success("set_project", "Response received")
            else:
                results.fail("set_project", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("set_project", str(e))

        # Call list_repositories to verify
        try:
            resp = await client.post(
                f"{MCP_BASE_URL}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 4,
                    "method": "tools/call",
                    "params": {
                        "name": "list_repositories",
                        "arguments": {"limit": 5}
                    }
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "result" in data:
                    results.success("list_repositories", "Repositories listed")
                else:
                    results.fail("list_repositories", f"Error: {data.get('error', 'unknown')}")
            else:
                results.fail("list_repositories", f"HTTP {resp.status_code}")
        except Exception as e:
            results.fail("list_repositories", str(e))


async def test_system_tools():
    """Test system monitoring tools"""
    print("\n8. System Tools")

    async with httpx.AsyncClient(timeout=30.0) as client:
        for tool_name in ["system_resources", "network_status", "process_list"]:
            try:
                resp = await client.post(
                    f"{MCP_BASE_URL}/mcp",
                    json={
                        "jsonrpc": "2.0",
                        "id": 5,
                        "method": "tools/call",
                        "params": {
                            "name": tool_name,
                            "arguments": {}
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if "result" in data and not data["result"].get("isError"):
                        results.success(tool_name, "OK")
                    else:
                        error = data.get("result", {}).get("content", [{}])[0].get("text", "Unknown error")
                        results.fail(tool_name, error[:50])
                else:
                    results.fail(tool_name, f"HTTP {resp.status_code}")
            except Exception as e:
                results.fail(tool_name, str(e))


async def main():
    print("="*50)
    print("Claude.ai Web MCP E2E Test Suite")
    print(f"Target: {MCP_BASE_URL}")
    print("="*50)

    await test_oauth_discovery()
    await test_oauth_flow()
    await test_dynamic_client_registration()
    await test_sse_connection()
    await test_mcp_endpoint()
    await test_tools_list()
    await test_project_switching()
    await test_system_tools()

    success = results.summary()
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
