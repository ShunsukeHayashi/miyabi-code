"""Token management."""
from __future__ import annotations
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict

class TokenManager:
    """Manages authentication tokens."""
    
    def __init__(self):
        self._tokens: Dict[str, Dict] = {}
    
    def generate(self, user_id: str, expires_in: int = 3600) -> str:
        """Generate a new token."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(seconds=expires_in)
        self._tokens[token] = {"user_id": user_id, "expires_at": expires_at}
        return token
    
    def verify(self, token: str) -> Optional[str]:
        """Verify token and return user_id."""
        token_data = self._tokens.get(token)
        if token_data and datetime.now() < token_data["expires_at"]:
            return token_data["user_id"]
        return None
    
    def revoke(self, token: str) -> bool:
        """Revoke a token."""
        if token in self._tokens:
            del self._tokens[token]
            return True
        return False
    
    def refresh(self, token: str, expires_in: int = 3600) -> Optional[str]:
        """Refresh a token."""
        user_id = self.verify(token)
        if user_id:
            self.revoke(token)
            return self.generate(user_id, expires_in)
        return None
    
    def cleanup_expired(self) -> int:
        """Remove expired tokens."""
        now = datetime.now()
        expired = [t for t, data in self._tokens.items() if now >= data["expires_at"]]
        for token in expired:
            del self._tokens[token]
        return len(expired)
