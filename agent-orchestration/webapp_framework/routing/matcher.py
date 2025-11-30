"""Route matching logic."""
from __future__ import annotations
import re
from typing import Dict, Optional, Tuple

class RouteMatcher:
    """Matches requests to routes."""
    def __init__(self):
        self._cache: Dict[str, Tuple] = {}
    
    def compile_pattern(self, path: str) -> re.Pattern:
        pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", path)
        return re.compile(f"^{pattern}$")
    
    def match(self, pattern: re.Pattern, path: str) -> Optional[Dict[str, str]]:
        match = pattern.match(path)
        return match.groupdict() if match else None
    
    def extract_params(self, path: str, pattern_str: str) -> Dict[str, str]:
        pattern = self.compile_pattern(pattern_str)
        result = self.match(pattern, path)
        return result or {}
    
    def clear_cache(self) -> None:
        self._cache.clear()
    
    def cache_size(self) -> int:
        return len(self._cache)
