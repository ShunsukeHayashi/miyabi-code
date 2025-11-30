"""Path parameter converters."""
from __future__ import annotations

def int_converter(value: str) -> int:
    """Convert string to integer."""
    return int(value)

def str_converter(value: str) -> str:
    """Convert string (identity)."""
    return value

def path_converter(value: str) -> str:
    """Convert path (allows slashes)."""
    return value

def uuid_converter(value: str) -> str:
    """Validate and return UUID string."""
    import uuid
    uuid.UUID(value)  # Validates format
    return value

def slug_converter(value: str) -> str:
    """Validate slug format."""
    import re
    if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", value):
        raise ValueError("Invalid slug format")
    return value
