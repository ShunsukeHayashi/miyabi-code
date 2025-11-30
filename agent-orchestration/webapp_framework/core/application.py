"""Core application class for the webapp framework."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional


class Application:
    """Main application class that manages routes, middleware, and request handling."""

    def __init__(self, name: str = "WebApp") -> None:
        """Initialize the application.

        Args:
            name: The name of the application.
        """
        self.name = name
        self.routes: List[Dict[str, Any]] = []
        self.middleware: List[Callable] = []
        self.config: Dict[str, Any] = {}
        self._before_request_funcs: List[Callable] = []
        self._after_request_funcs: List[Callable] = []

    def route(self, path: str, methods: List[str] | None = None) -> Callable:
        """Register a route decorator.

        Args:
            path: The URL path pattern.
            methods: HTTP methods allowed (default: ['GET']).

        Returns:
            Decorator function.
        """
        if methods is None:
            methods = ["GET"]

        def decorator(func: Callable) -> Callable:
            self.routes.append({"path": path, "methods": methods, "handler": func})
            return func

        return decorator

    def add_middleware(self, middleware: Callable) -> None:
        """Add middleware to the application.

        Args:
            middleware: Middleware function to add.
        """
        self.middleware.append(middleware)

    def before_request(self, func: Callable) -> Callable:
        """Register a function to run before each request.

        Args:
            func: Function to execute before requests.

        Returns:
            The original function.
        """
        self._before_request_funcs.append(func)
        return func

    def after_request(self, func: Callable) -> Callable:
        """Register a function to run after each request.

        Args:
            func: Function to execute after requests.

        Returns:
            The original function.
        """
        self._after_request_funcs.append(func)
        return func

    def configure(self, key: str, value: Any) -> None:
        """Set a configuration value.

        Args:
            key: Configuration key.
            value: Configuration value.
        """
        self.config[key] = value

    def get_config(self, key: str, default: Any = None) -> Any:
        """Get a configuration value.

        Args:
            key: Configuration key.
            default: Default value if key not found.

        Returns:
            Configuration value or default.
        """
        return self.config.get(key, default)

    def run(self, host: str = "127.0.0.1", port: int = 5000, debug: bool = False) -> None:
        """Run the development server.

        Args:
            host: Host address to bind.
            port: Port number to listen on.
            debug: Enable debug mode.
        """
        print(f"Running {self.name} on http://{host}:{port}")
        print(f"Debug mode: {debug}")
        print(f"Registered routes: {len(self.routes)}")
