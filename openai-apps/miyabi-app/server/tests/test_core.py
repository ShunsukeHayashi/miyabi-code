#!/usr/bin/env python3
"""
Miyabi MCP Server - Unit Tests
Test suite for core functionality
"""

import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch

# ===========================================
# Fixtures
# ===========================================

@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    with patch("core.config.settings") as mock:
        mock.app_name = "Miyabi MCP Server"
        mock.app_version = "2.0.0"
        mock.environment = "test"
        mock.debug = True
        mock.github_token = "test_token"
        mock.github_repo_owner = "test-owner"
        mock.github_repo_name = "test-repo"
        mock.github_repo_full_name = "test-owner/test-repo"
        mock.miyabi_root = MagicMock()
        mock.miyabi_root.exists.return_value = True
        mock.allowed_origins = ["http://localhost"]
        mock.access_token = ""
        mock.redis_enabled = False
        mock.is_production = False
        yield mock


@pytest.fixture
def mock_github():
    """Mock GitHub client"""
    with patch("routers.github.Github") as mock:
        yield mock


# ===========================================
# Security Tests
# ===========================================

class TestRateLimiter:
    """Test rate limiting functionality"""
    
    def test_rate_limiter_allows_requests_under_limit(self):
        """Test that requests under limit are allowed"""
        from core.security import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=60)
        mock_request = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_request.headers.get.return_value = None
        
        # First request should not be limited
        assert not limiter.is_rate_limited(mock_request)
    
    def test_rate_limiter_blocks_excess_requests(self):
        """Test that excess requests are blocked"""
        from core.security import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=5)
        mock_request = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_request.headers.get.return_value = None
        
        # Make 5 requests (should all be allowed)
        for _ in range(5):
            limiter.is_rate_limited(mock_request)
        
        # 6th request should be blocked
        assert limiter.is_rate_limited(mock_request)
    
    def test_rate_limiter_resets_after_timeout(self):
        """Test that rate limit resets after timeout"""
        from core.security import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=2)
        mock_request = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_request.headers.get.return_value = None
        
        # Make requests to hit limit
        limiter.is_rate_limited(mock_request)
        limiter.is_rate_limited(mock_request)
        
        # Simulate time passing by clearing old requests
        limiter.requests["127.0.0.1"] = []
        
        # Should be allowed again
        assert not limiter.is_rate_limited(mock_request)


class TestTokenStore:
    """Test token storage functionality"""
    
    @pytest.mark.asyncio
    async def test_store_and_retrieve_token(self):
        """Test storing and retrieving tokens"""
        from core.security import TokenStore
        
        store = TokenStore()
        token = "test_token_123"
        data = {"user_id": "user1", "scope": "read"}
        
        await store.store_access_token(token, data, ttl=3600)
        retrieved = await store.get_access_token(token)
        
        assert retrieved is not None
        assert retrieved["user_id"] == "user1"
        assert retrieved["scope"] == "read"
    
    @pytest.mark.asyncio
    async def test_token_expiration(self):
        """Test token expiration detection"""
        from core.security import TokenStore
        
        store = TokenStore()
        token = "expired_token"
        data = {"expires_at": time.time() - 100}  # Already expired
        
        store.access_tokens[token] = data
        
        assert store.is_token_expired(data)
    
    @pytest.mark.asyncio
    async def test_revoke_token(self):
        """Test token revocation"""
        from core.security import TokenStore
        
        store = TokenStore()
        token = "to_revoke"
        data = {"user_id": "user1"}
        
        await store.store_access_token(token, data)
        await store.revoke_access_token(token)
        
        retrieved = await store.get_access_token(token)
        assert retrieved is None


# ===========================================
# Config Tests
# ===========================================

class TestConfig:
    """Test configuration management"""
    
    def test_settings_defaults(self):
        """Test default settings values"""
        from core.config import Settings
        
        settings = Settings()
        assert settings.app_name == "Miyabi MCP Server"
        assert settings.port == 8000
        assert settings.environment == "development"
    
    def test_settings_is_production(self):
        """Test production detection"""
        from core.config import Settings
        
        dev_settings = Settings(environment="development")
        assert not dev_settings.is_production
        
        prod_settings = Settings(environment="production")
        assert prod_settings.is_production


# ===========================================
# Exception Tests
# ===========================================

class TestExceptions:
    """Test custom exceptions"""
    
    def test_miyabi_exception(self):
        """Test base exception"""
        from core.exceptions import MiyabiException
        
        exc = MiyabiException("Test error", status_code=400, error_code="TEST_ERROR")
        assert exc.message == "Test error"
        assert exc.status_code == 400
        assert exc.error_code == "TEST_ERROR"
    
    def test_not_found_error(self):
        """Test NotFoundError"""
        from core.exceptions import NotFoundError
        
        exc = NotFoundError("Issue", 123)
        assert "Issue '123' not found" in exc.message
        assert exc.status_code == 404
    
    def test_validation_error(self):
        """Test ValidationError"""
        from core.exceptions import ValidationError
        
        exc = ValidationError("Invalid input", field="email")
        assert exc.message == "Invalid input"
        assert exc.status_code == 422


# ===========================================
# MCP Router Tests
# ===========================================

class TestMCPTools:
    """Test MCP tool implementations"""
    
    @pytest.mark.asyncio
    async def test_list_agents(self):
        """Test list_agents tool"""
        from routers.mcp import list_agents
        
        result = await list_agents({})
        
        assert "content" in result
        assert not result.get("isError", False)
        assert "coordinator" in result["content"][0]["text"].lower()
    
    @pytest.mark.asyncio
    async def test_make_response(self):
        """Test response helper"""
        from routers.mcp import make_response
        
        response = make_response("Test message")
        assert response["content"][0]["text"] == "Test message"
        assert not response["isError"]
        
        error_response = make_response("Error", is_error=True)
        assert error_response["isError"]


# ===========================================
# Logging Tests
# ===========================================

class TestLogging:
    """Test logging functionality"""
    
    def test_json_formatter(self):
        """Test JSON log formatting"""
        import logging
        import json
        from core.logging import JsonFormatter
        
        formatter = JsonFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None,
        )
        
        output = formatter.format(record)
        parsed = json.loads(output)
        
        assert parsed["message"] == "Test message"
        assert parsed["level"] == "INFO"
        assert "timestamp" in parsed


# ===========================================
# Run Tests
# ===========================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
