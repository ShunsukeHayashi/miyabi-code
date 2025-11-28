#!/usr/bin/env python3
"""
Miyabi MCP Server - Integration Tests
End-to-end API tests
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock


# ===========================================
# Fixtures
# ===========================================

@pytest.fixture
def mock_env():
    """Mock environment for testing"""
    env_vars = {
        "MIYABI_ROOT": "/tmp/miyabi-test",
        "GITHUB_TOKEN": "test_github_token",
        "MIYABI_REPO_OWNER": "test-owner",
        "MIYABI_REPO_NAME": "test-repo",
        "MIYABI_ACCESS_TOKEN": "",  # No auth required for testing
        "ENVIRONMENT": "test",
    }
    with patch.dict("os.environ", env_vars):
        yield


@pytest.fixture
async def client(mock_env):
    """Create test client"""
    # Import after mocking env
    from main_v2 import app
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ===========================================
# Health Endpoint Tests
# ===========================================

class TestHealthEndpoints:
    """Test health check endpoints"""
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        """Test root endpoint returns server info"""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Miyabi MCP Server"
        assert "version" in data
        assert data["status"] == "running"
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test health endpoint"""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert "checks" in data
        assert "uptime_seconds" in data
    
    @pytest.mark.asyncio
    async def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe"""
        response = await client.get("/health/live")
        
        assert response.status_code == 200
        assert response.json()["status"] == "alive"
    
    @pytest.mark.asyncio
    async def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe"""
        response = await client.get("/health/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
        assert "checks" in data


# ===========================================
# MCP Endpoint Tests
# ===========================================

class TestMCPEndpoint:
    """Test MCP protocol endpoint"""
    
    @pytest.mark.asyncio
    async def test_mcp_initialize(self, client):
        """Test MCP initialize method"""
        response = await client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == 1
        assert "result" in data
        assert "protocolVersion" in data["result"]
        assert "serverInfo" in data["result"]
    
    @pytest.mark.asyncio
    async def test_mcp_tools_list(self, client):
        """Test MCP tools/list method"""
        response = await client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert "tools" in data["result"]
        
        tools = data["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        
        # Verify essential tools are present
        assert "execute_agent" in tool_names
        assert "create_issue" in tool_names
        assert "list_issues" in tool_names
        assert "get_project_status" in tool_names
    
    @pytest.mark.asyncio
    async def test_mcp_list_agents(self, client):
        """Test list_agents tool"""
        response = await client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "list_agents",
                "arguments": {}
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert "content" in data["result"]
        
        content = data["result"]["content"][0]["text"]
        assert "coordinator" in content.lower()
        assert "codegen" in content.lower()
    
    @pytest.mark.asyncio
    async def test_mcp_unknown_method(self, client):
        """Test MCP unknown method returns error"""
        response = await client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 4,
            "method": "unknown/method",
            "params": {}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == -32601  # Method not found
    
    @pytest.mark.asyncio
    async def test_mcp_unknown_tool(self, client):
        """Test calling unknown tool returns error"""
        response = await client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "unknown_tool",
                "arguments": {}
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "error" in data


# ===========================================
# OAuth Endpoint Tests
# ===========================================

class TestOAuthEndpoints:
    """Test OAuth endpoints"""
    
    @pytest.mark.asyncio
    async def test_oauth_metadata(self, client):
        """Test OAuth metadata endpoint"""
        response = await client.get("/oauth/.well-known/oauth-authorization-server")
        
        assert response.status_code == 200
        data = response.json()
        assert "issuer" in data
        assert "authorization_endpoint" in data
        assert "token_endpoint" in data
        assert "S256" in data["code_challenge_methods_supported"]
    
    @pytest.mark.asyncio
    async def test_oauth_authorize_invalid_response_type(self, client):
        """Test OAuth authorize with invalid response_type"""
        response = await client.get("/oauth/authorize", params={
            "response_type": "token",  # Invalid - only 'code' supported
            "client_id": "test",
            "redirect_uri": "http://localhost/callback",
        })
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_oauth_token_invalid_grant(self, client):
        """Test OAuth token with invalid grant_type"""
        response = await client.post("/oauth/token", data={
            "grant_type": "password",  # Not supported
            "username": "test",
            "password": "test",
        })
        
        assert response.status_code == 400


# ===========================================
# GitHub Endpoint Tests
# ===========================================

class TestGitHubEndpoints:
    """Test GitHub API endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_issues_mock(self, client):
        """Test list issues with mocked GitHub"""
        # Mock GitHub client
        with patch("routers.github.get_github_client") as mock_client:
            mock_repo = MagicMock()
            mock_issue = MagicMock()
            mock_issue.number = 1
            mock_issue.title = "Test Issue"
            mock_issue.state = "open"
            mock_issue.user.login = "testuser"
            mock_issue.created_at = "2024-01-01T00:00:00Z"
            mock_issue.updated_at = "2024-01-01T00:00:00Z"
            mock_issue.labels = []
            mock_issue.assignees = []
            mock_issue.body = "Test body"
            mock_issue.html_url = "https://github.com/test/test/issues/1"
            mock_issue.pull_request = None
            
            mock_repo.get_issues.return_value = [mock_issue]
            mock_client.return_value.get_repo.return_value = mock_repo
            
            response = await client.get("/github/issues")
            
            # Should return 200 (or 401 if auth required)
            assert response.status_code in [200, 401]


# ===========================================
# Error Handling Tests
# ===========================================

class TestErrorHandling:
    """Test error handling"""
    
    @pytest.mark.asyncio
    async def test_404_endpoint(self, client):
        """Test 404 for unknown endpoint"""
        response = await client.get("/nonexistent")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_method_not_allowed(self, client):
        """Test 405 for wrong HTTP method"""
        response = await client.put("/health")
        
        assert response.status_code == 405


# ===========================================
# Run Tests
# ===========================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
