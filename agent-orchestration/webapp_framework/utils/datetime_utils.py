"""Datetime utility functions."""
from __future__ import annotations
from datetime import datetime, timedelta

def now() -> datetime:
    """Get current datetime."""
    return datetime.now()

def timestamp() -> int:
    """Get current Unix timestamp."""
    return int(datetime.now().timestamp())

def format_datetime(dt: datetime, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string."""
    return dt.strftime(fmt)

def parse_datetime(dt_str: str, fmt: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """Parse datetime from string."""
    return datetime.strptime(dt_str, fmt)

def add_days(dt: datetime, days: int) -> datetime:
    """Add days to datetime."""
    return dt + timedelta(days=days)
