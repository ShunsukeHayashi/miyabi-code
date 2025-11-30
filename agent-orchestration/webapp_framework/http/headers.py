"""HTTP headers management."""

from __future__ import annotations

from typing import Dict, List, Optional


class Headers:
    """Manages HTTP headers with case-insensitive access."""

    def __init__(self, headers: Dict[str, str] | None = None) -> None:
        """Initialize headers.
        
        Args:
            headers: Initial headers dict.
        """
        self._headers: Dict[str, str] = {}
        if headers:
            for key, value in headers.items():
                self.set(key, value)

    def set(self, name: str, value: str) -> None:
        """Set a header value.
        
        Args:
            name: Header name.
            value: Header value.
        """
        self._headers[name.lower()] = value

    def get(self, name: str, default: str | None = None) -> str | None:
        """Get a header value.
        
        Args:
            name: Header name (case-insensitive).
            default: Default value if not found.
        
        Returns:
            Header value or default.
        """
        return self._headers.get(name.lower(), default)

    def delete(self, name: str) -> bool:
        """Delete a header.
        
        Args:
            name: Header name.
        
        Returns:
            True if deleted, False if not found.
        """
        key = name.lower()
        if key in self._headers:
            del self._headers[key]
            return True
        return False

    def has(self, name: str) -> bool:
        """Check if header exists.
        
        Args:
            name: Header name.
        
        Returns:
            True if header exists.
        """
        return name.lower() in self._headers

    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary.
        
        Returns:
            Headers as dict.
        """
        return self._headers.copy()

    def items(self) -> List[tuple]:
        """Get all header items.
        
        Returns:
            List of (name, value) tuples.
        """
        return list(self._headers.items())
