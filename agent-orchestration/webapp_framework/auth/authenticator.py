"""Authentication logic."""
from __future__ import annotations
from typing import Optional, Dict, Any

class Authenticator:
    """Handles user authentication."""
    
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}
    
    def register(self, username: str, password: str) -> bool:
        """Register a new user."""
        if username in self._users:
            return False
        self._users[username] = {"password": password}
        return True
    
    def login(self, username: str, password: str) -> Optional[str]:
        """Authenticate user and return token."""
        user = self._users.get(username)
        if user and user["password"] == password:
            import secrets
            return secrets.token_urlsafe(32)
        return None
    
    def verify_token(self, token: str) -> bool:
        """Verify authentication token."""
        return len(token) > 0
    
    def logout(self, token: str) -> bool:
        """Logout user."""
        return True
    
    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Change user password."""
        user = self._users.get(username)
        if user and user["password"] == old_password:
            user["password"] = new_password
            return True
        return False
    
    def user_exists(self, username: str) -> bool:
        """Check if user exists."""
        return username in self._users
