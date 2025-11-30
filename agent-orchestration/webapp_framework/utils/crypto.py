"""Cryptographic utilities."""
from __future__ import annotations
import hashlib
import secrets

def generate_secret_key(length: int = 32) -> str:
    """Generate a random secret key."""
    return secrets.token_hex(length)

def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return hash_password(password) == hashed

def generate_token(length: int = 32) -> str:
    """Generate a random token."""
    return secrets.token_urlsafe(length)

def constant_time_compare(a: str, b: str) -> bool:
    """Compare two strings in constant time."""
    return secrets.compare_digest(a, b)

def md5_hash(data: bytes) -> str:
    """Calculate MD5 hash."""
    return hashlib.md5(data).hexdigest()
