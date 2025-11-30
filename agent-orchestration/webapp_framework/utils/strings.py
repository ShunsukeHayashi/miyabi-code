"""String utility functions."""
from __future__ import annotations

def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])

def camel_to_snake(camel_str: str) -> str:
    """Convert camelCase to snake_case."""
    import re
    return re.sub(r"(?<!^)(?=[A-Z])", "_", camel_str).lower()

def truncate(text: str, length: int, suffix: str = "...") -> str:
    """Truncate text to length."""
    if len(text) <= length:
        return text
    return text[:length - len(suffix)] + suffix

def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    import re
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

def random_string(length: int = 10) -> str:
    """Generate random alphanumeric string."""
    import secrets
    import string
    return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))

def escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
