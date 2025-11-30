"""Permission management."""
from __future__ import annotations
from typing import Set, Dict

class PermissionManager:
    """Manages user permissions."""
    
    def __init__(self):
        self._permissions: Dict[str, Set[str]] = {}
    
    def grant(self, user: str, permission: str) -> None:
        """Grant permission to user."""
        if user not in self._permissions:
            self._permissions[user] = set()
        self._permissions[user].add(permission)
    
    def revoke(self, user: str, permission: str) -> bool:
        """Revoke permission from user."""
        if user in self._permissions and permission in self._permissions[user]:
            self._permissions[user].remove(permission)
            return True
        return False
    
    def has_permission(self, user: str, permission: str) -> bool:
        """Check if user has permission."""
        return permission in self._permissions.get(user, set())
    
    def get_permissions(self, user: str) -> Set[str]:
        """Get all permissions for user."""
        return self._permissions.get(user, set()).copy()
    
    def clear_permissions(self, user: str) -> None:
        """Clear all permissions for user."""
        if user in self._permissions:
            self._permissions[user].clear()
    
    def list_users(self) -> list:
        """List all users with permissions."""
        return list(self._permissions.keys())
