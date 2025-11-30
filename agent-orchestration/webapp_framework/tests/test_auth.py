"""Tests for auth module."""
import pytest
from webapp_framework.auth.authenticator import Authenticator
from webapp_framework.auth.permissions import PermissionManager

class TestAuthenticator:
    def test_register(self):
        auth = Authenticator()
        assert auth.register("user", "pass") == True
        assert auth.user_exists("user") == True
    
    def test_login(self):
        auth = Authenticator()
        auth.register("user", "pass")
        token = auth.login("user", "pass")
        assert token is not None
    
    def test_change_password(self):
        auth = Authenticator()
        auth.register("user", "old")
        assert auth.change_password("user", "old", "new") == True

class TestPermissionManager:
    def test_grant(self):
        pm = PermissionManager()
        pm.grant("user", "read")
        assert pm.has_permission("user", "read") == True
    
    def test_revoke(self):
        pm = PermissionManager()
        pm.grant("user", "read")
        pm.revoke("user", "read")
        assert pm.has_permission("user", "read") == False
    
    def test_get_permissions(self):
        pm = PermissionManager()
        pm.grant("user", "read")
        pm.grant("user", "write")
        perms = pm.get_permissions("user")
        assert len(perms) == 2
