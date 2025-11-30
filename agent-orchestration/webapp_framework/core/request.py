"""HTTP request handling."""

from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import parse_qs


class Request:
    """Represents an HTTP request."""

    def __init__(
        self,
        method: str,
        path: str,
        headers: Dict[str, str] | None = None,
        body: bytes | None = None,
        query_string: str = "",
    ) -> None:
        """Initialize a request object.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: Request path.
            headers: Request headers.
            body: Request body as bytes.
            query_string: Query string from URL.
        """
        self.method = method.upper()
        self.path = path
        self.headers = headers or {}
        self.body = body
        self.query_string = query_string
        self._query_params: Optional[Dict[str, list]] = None
        self._form_data: Optional[Dict[str, Any]] = None

    def get_header(self, name: str, default: str | None = None) -> str | None:
        """Get a header value.

        Args:
            name: Header name (case-insensitive).
            default: Default value if header not found.

        Returns:
            Header value or default.
        """
        name_lower = name.lower()
        for key, value in self.headers.items():
            if key.lower() == name_lower:
                return value
        return default

    def get_query_param(self, name: str, default: Any = None) -> Any:
        """Get a query parameter value.

        Args:
            name: Parameter name.
            default: Default value if parameter not found.

        Returns:
            Parameter value or default.
        """
        if self._query_params is None:
            self._query_params = parse_qs(self.query_string)

        values = self._query_params.get(name, [])
        return values[0] if values else default

    def get_all_query_params(self, name: str) -> list:
        """Get all values for a query parameter.

        Args:
            name: Parameter name.

        Returns:
            List of parameter values.
        """
        if self._query_params is None:
            self._query_params = parse_qs(self.query_string)

        return self._query_params.get(name, [])

    def get_json(self) -> Dict[str, Any]:
        """Parse request body as JSON.

        Returns:
            Parsed JSON data.

        Raises:
            ValueError: If body is not valid JSON.
        """
        import json

        if not self.body:
            return {}

        try:
            return json.loads(self.body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ValueError(f"Invalid JSON in request body: {exc}")

    def is_json(self) -> bool:
        """Check if request content type is JSON.

        Returns:
            True if content type is JSON.
        """
        content_type = self.get_header("content-type", "")
        return "application/json" in content_type.lower()

    def is_form(self) -> bool:
        """Check if request is form-encoded.

        Returns:
            True if content type is form-encoded.
        """
        content_type = self.get_header("content-type", "")
        return "application/x-www-form-urlencoded" in content_type.lower()

    def get_body_text(self) -> str:
        """Get request body as text.

        Returns:
            Body decoded as UTF-8 string.
        """
        if not self.body:
            return ""
        return self.body.decode("utf-8", errors="replace")
