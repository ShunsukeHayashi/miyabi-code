"""URL routing and request dispatching."""

from __future__ import annotations

import re
from typing import Any, Callable, Dict, List, Optional, Tuple


class Router:
    """Manages route registration and request matching."""

    def __init__(self) -> None:
        """Initialize the router."""
        self.routes: List[Dict[str, Any]] = []
        self._compiled_routes: List[Tuple[re.Pattern, Dict[str, Any]]] = []

    def add_route(
        self, path: str, handler: Callable, methods: List[str] | None = None, name: str | None = None
    ) -> None:
        """Register a route.

        Args:
            path: URL path pattern (supports <param> placeholders).
            handler: Handler function for this route.
            methods: Allowed HTTP methods.
            name: Optional route name for reverse lookups.
        """
        if methods is None:
            methods = ["GET"]

        route_info = {
            "path": path,
            "handler": handler,
            "methods": [m.upper() for m in methods],
            "name": name,
        }
        self.routes.append(route_info)

        # Compile path pattern
        pattern = self._compile_path(path)
        self._compiled_routes.append((pattern, route_info))

    def _compile_path(self, path: str) -> re.Pattern:
        """Compile a path pattern to regex.

        Args:
            path: Path pattern with <param> placeholders.

        Returns:
            Compiled regex pattern.
        """
        # Convert <param> to named regex groups
        pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", path)
        # Escape forward slashes and anchor the pattern
        pattern = f"^{pattern}$"
        return re.compile(pattern)

    def match(self, path: str, method: str) -> Optional[Tuple[Callable, Dict[str, str]]]:
        """Match a request to a route.

        Args:
            path: Request path.
            method: HTTP method.

        Returns:
            Tuple of (handler, path_params) if matched, None otherwise.
        """
        method = method.upper()

        for pattern, route_info in self._compiled_routes:
            match = pattern.match(path)
            if match and method in route_info["methods"]:
                handler = route_info["handler"]
                path_params = match.groupdict()
                return handler, path_params

        return None

    def get_route_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get route information by name.

        Args:
            name: Route name.

        Returns:
            Route information dict or None.
        """
        for route in self.routes:
            if route.get("name") == name:
                return route
        return None

    def build_url(self, name: str, **params) -> str:
        """Build a URL from a named route.

        Args:
            name: Route name.
            **params: Path parameters.

        Returns:
            Built URL path.

        Raises:
            ValueError: If route not found or params missing.
        """
        route = self.get_route_by_name(name)
        if not route:
            raise ValueError(f"Route '{name}' not found")

        path = route["path"]
        for key, value in params.items():
            placeholder = f"<{key}>"
            if placeholder in path:
                path = path.replace(placeholder, str(value))

        # Check for remaining placeholders
        if "<" in path:
            raise ValueError(f"Missing parameters for route '{name}'")

        return path

    def list_routes(self) -> List[Dict[str, Any]]:
        """List all registered routes.

        Returns:
            List of route information dicts.
        """
        return self.routes.copy()

    def clear(self) -> None:
        """Clear all routes."""
        self.routes.clear()
        self._compiled_routes.clear()
