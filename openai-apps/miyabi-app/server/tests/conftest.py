#!/usr/bin/env python3
"""
Pytest configuration and fixtures for Miyabi MCP Server tests
"""

import sys
import os
from pathlib import Path

# Add server directory to Python path for proper imports
server_dir = Path(__file__).parent.parent
if str(server_dir) not in sys.path:
    sys.path.insert(0, str(server_dir))

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch


# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


@pytest.fixture
def mock_env():
    """Mock environment for testing"""
    env_vars = {
        "MIYABI_ROOT": "/tmp/miyabi-test",
        "GITHUB_TOKEN": "test_github_token",
        "MIYABI_REPO_OWNER": "test-owner",
        "MIYABI_REPO_NAME": "test-repo",
        "MIYABI_ACCESS_TOKEN": "",
        "ENVIRONMENT": "test",
        "DATABASE_URL": "sqlite:///./test.db",
    }
    with patch.dict("os.environ", env_vars, clear=False):
        yield


@pytest_asyncio.fixture
async def client(mock_env):
    """Create async test client - properly configured for pytest-asyncio"""
    from main_v2 import app
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
