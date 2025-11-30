"""Validation rules."""
from __future__ import annotations

def required(value: Any) -> bool:
    """Check if value is present."""
    return value is not None and value != ""

def is_email(value: str) -> bool:
    """Check if valid email."""
    import re
    return bool(re.match(r"^[\w.+-]+@[\w.-]+\.[a-z]{2,}$", value, re.I))

def is_url(value: str) -> bool:
    """Check if valid URL."""
    import re
    return bool(re.match(r"^https?://", value, re.I))

def is_numeric(value: str) -> bool:
    """Check if numeric."""
    try:
        float(value)
        return True
    except ValueError:
        return False

def is_alpha(value: str) -> bool:
    """Check if alphabetic."""
    return value.isalpha()

def is_alphanumeric(value: str) -> bool:
    """Check if alphanumeric."""
    return value.isalnum()

def min_length(value: str, length: int) -> bool:
    """Check minimum length."""
    return len(value) >= length

def max_length(value: str, length: int) -> bool:
    """Check maximum length."""
    return len(value) <= length
