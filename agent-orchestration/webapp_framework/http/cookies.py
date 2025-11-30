"""Cookie management."""

from __future__ import annotations

from typing import Dict, Optional
from http.cookies import SimpleCookie


class CookieJar:
    """Manages HTTP cookies."""

    def __init__(self) -> None:
        """Initialize cookie jar."""
        self._cookies: SimpleCookie = SimpleCookie()

    def set(
        self,
        name: str,
        value: str,
        max_age: int | None = None,
        path: str = "/",
        domain: str | None = None,
        secure: bool = False,
        httponly: bool = False,
    ) -> None:
        """Set a cookie.
        
        Args:
            name: Cookie name.
            value: Cookie value.
            max_age: Max age in seconds.
            path: Cookie path.
            domain: Cookie domain.
            secure: Secure flag.
            httponly: HttpOnly flag.
        """
        self._cookies[name] = value
        if max_age is not None:
            self._cookies[name]["max-age"] = max_age
        self._cookies[name]["path"] = path
        if domain:
            self._cookies[name]["domain"] = domain
        if secure:
            self._cookies[name]["secure"] = True
        if httponly:
            self._cookies[name]["httponly"] = True

    def get(self, name: str, default: str | None = None) -> str | None:
        """Get a cookie value.
        
        Args:
            name: Cookie name.
            default: Default value if not found.
        
        Returns:
            Cookie value or default.
        """
        morsel = self._cookies.get(name)
        return morsel.value if morsel else default

    def delete(self, name: str, path: str = "/", domain: str | None = None) -> None:
        """Delete a cookie.
        
        Args:
            name: Cookie name.
            path: Cookie path.
            domain: Cookie domain.
        """
        self.set(name, "", max_age=0, path=path, domain=domain)

    def has(self, name: str) -> bool:
        """Check if cookie exists.
        
        Args:
            name: Cookie name.
        
        Returns:
            True if cookie exists.
        """
        return name in self._cookies

    def clear(self) -> None:
        """Clear all cookies."""
        self._cookies.clear()

    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary.
        
        Returns:
            Cookies as dict.
        """
        return {name: morsel.value for name, morsel in self._cookies.items()}
