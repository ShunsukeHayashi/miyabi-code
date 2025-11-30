"""Template filters."""
from __future__ import annotations

def upper(text: str) -> str:
    """Convert to uppercase."""
    return text.upper()

def lower(text: str) -> str:
    """Convert to lowercase."""
    return text.lower()

def capitalize(text: str) -> str:
    """Capitalize first letter."""
    return text.capitalize()

def truncate(text: str, length: int) -> str:
    """Truncate text."""
    return text[:length] + "..." if len(text) > length else text

def replace(text: str, old: str, new: str) -> str:
    """Replace substring."""
    return text.replace(old, new)

def strip(text: str) -> str:
    """Strip whitespace."""
    return text.strip()
