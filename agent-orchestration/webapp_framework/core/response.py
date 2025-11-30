"""HTTP response handling."""

from __future__ import annotations

import json
from typing import Any, Dict, Optional


class Response:
    """Represents an HTTP response."""

    def __init__(
        self,
        body: str | bytes = "",
        status_code: int = 200,
        headers: Dict[str, str] | None = None,
        content_type: str = "text/html; charset=utf-8",
    ) -> None:
        """Initialize a response object.

        Args:
            body: Response body.
            status_code: HTTP status code.
            headers: Response headers.
            content_type: Content-Type header value.
        """
        self.body = body if isinstance(body, bytes) else body.encode("utf-8")
        self.status_code = status_code
        self.headers = headers or {}
        if "content-type" not in (k.lower() for k in self.headers):
            self.headers["Content-Type"] = content_type

    @classmethod
    def json(cls, data: Any, status_code: int = 200, **kwargs) -> Response:
        """Create a JSON response.

        Args:
            data: Data to serialize as JSON.
            status_code: HTTP status code.
            **kwargs: Additional headers.

        Returns:
            Response object with JSON content.
        """
        body = json.dumps(data, ensure_ascii=False, **kwargs)
        return cls(
            body=body,
            status_code=status_code,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    @classmethod
    def text(cls, text: str, status_code: int = 200) -> Response:
        """Create a plain text response.

        Args:
            text: Text content.
            status_code: HTTP status code.

        Returns:
            Response object with text content.
        """
        return cls(
            body=text, status_code=status_code, content_type="text/plain; charset=utf-8"
        )

    @classmethod
    def html(cls, html: str, status_code: int = 200) -> Response:
        """Create an HTML response.

        Args:
            html: HTML content.
            status_code: HTTP status code.

        Returns:
            Response object with HTML content.
        """
        return cls(
            body=html, status_code=status_code, content_type="text/html; charset=utf-8"
        )

    @classmethod
    def redirect(cls, location: str, status_code: int = 302) -> Response:
        """Create a redirect response.

        Args:
            location: Target URL.
            status_code: HTTP redirect status code (301, 302, etc.).

        Returns:
            Response object with redirect.
        """
        return cls(body="", status_code=status_code, headers={"Location": location})

    def set_header(self, name: str, value: str) -> None:
        """Set a response header.

        Args:
            name: Header name.
            value: Header value.
        """
        self.headers[name] = value

    def get_header(self, name: str, default: str | None = None) -> str | None:
        """Get a response header.

        Args:
            name: Header name.
            default: Default value if header not found.

        Returns:
            Header value or default.
        """
        return self.headers.get(name, default)

    def set_cookie(
        self,
        name: str,
        value: str,
        max_age: int | None = None,
        path: str = "/",
        domain: str | None = None,
        secure: bool = False,
        httponly: bool = False,
    ) -> None:
        """Set a cookie in the response.

        Args:
            name: Cookie name.
            value: Cookie value.
            max_age: Max age in seconds.
            path: Cookie path.
            domain: Cookie domain.
            secure: Secure flag.
            httponly: HttpOnly flag.
        """
        cookie_parts = [f"{name}={value}"]

        if max_age is not None:
            cookie_parts.append(f"Max-Age={max_age}")
        if path:
            cookie_parts.append(f"Path={path}")
        if domain:
            cookie_parts.append(f"Domain={domain}")
        if secure:
            cookie_parts.append("Secure")
        if httponly:
            cookie_parts.append("HttpOnly")

        self.headers["Set-Cookie"] = "; ".join(cookie_parts)

    def to_bytes(self) -> bytes:
        """Convert response to bytes for transmission.

        Returns:
            Complete HTTP response as bytes.
        """
        return self.body
