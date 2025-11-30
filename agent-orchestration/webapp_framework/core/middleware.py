"""Middleware management for request/response processing."""

from __future__ import annotations

from typing import Callable, List


class MiddlewareManager:
    """Manages middleware chain execution."""

    def __init__(self) -> None:
        """Initialize the middleware manager."""
        self.middleware_stack: List[Callable] = []

    def add(self, middleware: Callable) -> None:
        """Add middleware to the stack.

        Args:
            middleware: Middleware function or class.
        """
        self.middleware_stack.append(middleware)

    def remove(self, middleware: Callable) -> bool:
        """Remove middleware from the stack.

        Args:
            middleware: Middleware to remove.

        Returns:
            True if removed, False if not found.
        """
        try:
            self.middleware_stack.remove(middleware)
            return True
        except ValueError:
            return False

    def clear(self) -> None:
        """Clear all middleware."""
        self.middleware_stack.clear()

    def count(self) -> int:
        """Get the number of registered middleware.

        Returns:
            Middleware count.
        """
        return len(self.middleware_stack)

    def process(self, request: Any, handler: Callable) -> Any:
        """Process request through middleware chain.

        Args:
            request: Request object.
            handler: Final request handler.

        Returns:
            Response from handler after middleware processing.
        """
        # Build middleware chain
        def build_chain(index: int) -> Callable:
            if index >= len(self.middleware_stack):
                return handler

            middleware = self.middleware_stack[index]
            next_handler = build_chain(index + 1)

            def wrapped(*args, **kwargs):
                return middleware(request, next_handler)

            return wrapped

        # Execute chain
        chain = build_chain(0)
        return chain(request)
