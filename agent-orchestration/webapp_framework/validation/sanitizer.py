"""Input sanitization."""
from __future__ import annotations

class Sanitizer:
    """Sanitizes user input."""
    
    def strip_tags(self, text: str) -> str:
        """Remove HTML tags."""
        import re
        return re.sub(r"<[^>]+>", "", text)
    
    def escape_html(self, text: str) -> str:
        """Escape HTML special characters."""
        return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#x27;"))
    
    def trim(self, text: str) -> str:
        """Remove whitespace."""
        return text.strip()
    
    def lowercase(self, text: str) -> str:
        """Convert to lowercase."""
        return text.lower()
    
    def remove_special_chars(self, text: str) -> str:
        """Remove special characters."""
        import re
        return re.sub(r"[^a-zA-Z0-9\s]", "", text)
