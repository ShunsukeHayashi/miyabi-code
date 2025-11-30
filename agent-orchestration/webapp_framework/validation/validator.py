"""Input validation."""
from __future__ import annotations
from typing import Any, Dict, List

class Validator:
    """Validates input data."""
    def __init__(self):
        self.errors: List[str] = []
    
    def validate_required(self, value: Any, field_name: str) -> bool:
        """Validate required field."""
        if value is None or value == "":
            self.errors.append(f"{field_name} is required")
            return False
        return True
    
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        import re
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, email):
            self.errors.append("Invalid email format")
            return False
        return True
    
    def validate_min_length(self, value: str, min_len: int) -> bool:
        """Validate minimum length."""
        if len(value) < min_len:
            self.errors.append(f"Must be at least {min_len} characters")
            return False
        return True
    
    def validate_max_length(self, value: str, max_len: int) -> bool:
        """Validate maximum length."""
        if len(value) > max_len:
            self.errors.append(f"Must be at most {max_len} characters")
            return False
        return True
    
    def validate_range(self, value: int | float, min_val: int | float, max_val: int | float) -> bool:
        """Validate numeric range."""
        if not (min_val <= value <= max_val):
            self.errors.append(f"Must be between {min_val} and {max_val}")
            return False
        return True
    
    def validate_pattern(self, value: str, pattern: str) -> bool:
        """Validate against regex pattern."""
        import re
        if not re.match(pattern, value):
            self.errors.append(f"Must match pattern: {pattern}")
            return False
        return True
    
    def get_errors(self) -> List[str]:
        """Get all validation errors."""
        return self.errors.copy()
    
    def clear_errors(self) -> None:
        """Clear all errors."""
        self.errors.clear()
