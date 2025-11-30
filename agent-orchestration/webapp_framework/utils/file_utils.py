"""File utility functions."""
from __future__ import annotations
from pathlib import Path
from typing import List

def read_file(path: str) -> str:
    """Read file contents."""
    return Path(path).read_text()

def write_file(path: str, content: str) -> None:
    """Write content to file."""
    Path(path).write_text(content)

def file_exists(path: str) -> bool:
    """Check if file exists."""
    return Path(path).exists()

def list_files(directory: str, pattern: str = "*") -> List[str]:
    """List files in directory."""
    return [str(p) for p in Path(directory).glob(pattern)]

def get_file_size(path: str) -> int:
    """Get file size in bytes."""
    return Path(path).stat().st_size
