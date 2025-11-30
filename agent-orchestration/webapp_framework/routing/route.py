"""Route representation."""
from __future__ import annotations
from typing import Callable, List

class Route:
    """Represents a single route."""
    def __init__(self, path: str, handler: Callable, methods: List[str], name: str | None = None):
        self.path = path
        self.handler = handler
        self.methods = [m.upper() for m in methods]
        self.name = name
    
    def matches_method(self, method: str) -> bool:
        return method.upper() in self.methods
    
    def get_path(self) -> str:
        return self.path
    
    def get_handler(self) -> Callable:
        return self.handler
    
    def get_name(self) -> str | None:
        return self.name
