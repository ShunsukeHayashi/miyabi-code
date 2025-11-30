"""Session management."""

from __future__ import annotations

import secrets
from typing import Any, Dict, Optional


class SessionManager:
    """Manages user sessions."""

    def __init__(self) -> None:
        """Initialize session manager."""
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create(self) -> str:
        """Create a new session.
        
        Returns:
            Session ID.
        """
        session_id = secrets.token_urlsafe(32)
        self._sessions[session_id] = {}
        return session_id

    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data.
        
        Args:
            session_id: Session ID.
        
        Returns:
            Session data dict or None.
        """
        return self._sessions.get(session_id)

    def set(self, session_id: str, key: str, value: Any) -> None:
        """Set a value in session.
        
        Args:
            session_id: Session ID.
            key: Data key.
            value: Data value.
        """
        if session_id not in self._sessions:
            self._sessions[session_id] = {}
        self._sessions[session_id][key] = value

    def delete(self, session_id: str) -> bool:
        """Delete a session.
        
        Args:
            session_id: Session ID.
        
        Returns:
            True if deleted, False if not found.
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def exists(self, session_id: str) -> bool:
        """Check if session exists.
        
        Args:
            session_id: Session ID.
        
        Returns:
            True if session exists.
        """
        return session_id in self._sessions

    def clear_all(self) -> None:
        """Clear all sessions."""
        self._sessions.clear()
