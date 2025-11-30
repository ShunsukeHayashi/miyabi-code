"""Test fixtures."""
from __future__ import annotations

def create_test_app():
    """Create test application."""
    from ..core.application import Application
    return Application("TestApp")

def create_test_user():
    """Create test user."""
    return {"id": 1, "username": "testuser", "email": "test@example.com"}

def create_test_request():
    """Create test request."""
    from ..core.request import Request
    return Request("GET", "/test")

def create_test_response():
    """Create test response."""
    from ..core.response import Response
    return Response("Test")

def cleanup():
    """Cleanup test resources."""
    pass
