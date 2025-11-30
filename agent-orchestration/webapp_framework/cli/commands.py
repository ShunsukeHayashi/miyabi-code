"""CLI command registry."""
from __future__ import annotations
from typing import Callable, Dict

class CommandRegistry:
    """Manages CLI commands."""
    def __init__(self):
        self._commands: Dict[str, Callable] = {}
    
    def register(self, name: str, handler: Callable) -> None:
        """Register command."""
        self._commands[name] = handler
    
    def execute(self, name: str, *args, **kwargs) -> Any:
        """Execute command."""
        if name in self._commands:
            return self._commands[name](*args, **kwargs)
        raise ValueError(f"Unknown command: {name}")
    
    def list_commands(self) -> list:
        """List all commands."""
        return list(self._commands.keys())
    
    def has_command(self, name: str) -> bool:
        """Check if command exists."""
        return name in self._commands
    
    def unregister(self, name: str) -> bool:
        """Unregister command."""
        if name in self._commands:
            del self._commands[name]
            return True
        return False
