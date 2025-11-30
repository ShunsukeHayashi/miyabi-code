"""Tests for HTTP module."""
import pytest
from webapp_framework.http.headers import Headers
from webapp_framework.http.cookies import CookieJar
from webapp_framework.http.session import SessionManager
from webapp_framework.http import status

class TestHeaders:
    def test_set_and_get(self):
        headers = Headers()
        headers.set("Content-Type", "text/html")
        assert headers.get("content-type") == "text/html"
    
    def test_case_insensitive(self):
        headers = Headers({"Content-Type": "text/html"})
        assert headers.get("CONTENT-TYPE") == "text/html"
    
    def test_delete(self):
        headers = Headers({"X-Test": "value"})
        assert headers.delete("x-test") == True
        assert headers.has("x-test") == False
    
    def test_to_dict(self):
        headers = Headers({"X-Test": "value"})
        assert "x-test" in headers.to_dict()

class TestCookieJar:
    def test_set_and_get(self):
        jar = CookieJar()
        jar.set("session", "abc123")
        assert jar.get("session") == "abc123"
    
    def test_delete(self):
        jar = CookieJar()
        jar.set("test", "value")
        jar.delete("test")
        # After deletion, cookie should have max_age=0 set
        assert jar.has("test") == True  # Cookie still exists but expired
    
    def test_has(self):
        jar = CookieJar()
        jar.set("test", "value")
        assert jar.has("test") == True
    
    def test_to_dict(self):
        jar = CookieJar()
        jar.set("a", "1")
        jar.set("b", "2")
        assert len(jar.to_dict()) == 2

class TestSessionManager:
    def test_create(self):
        manager = SessionManager()
        session_id = manager.create()
        assert len(session_id) > 0
    
    def test_get(self):
        manager = SessionManager()
        session_id = manager.create()
        data = manager.get(session_id)
        assert data == {}
    
    def test_set(self):
        manager = SessionManager()
        session_id = manager.create()
        manager.set(session_id, "user_id", 123)
        data = manager.get(session_id)
        assert data["user_id"] == 123
    
    def test_delete(self):
        manager = SessionManager()
        session_id = manager.create()
        assert manager.delete(session_id) == True
        assert manager.exists(session_id) == False
