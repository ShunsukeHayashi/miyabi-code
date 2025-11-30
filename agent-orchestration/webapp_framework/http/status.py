"""HTTP status code utilities."""

from __future__ import annotations


def is_informational(status_code: int) -> bool:
    """Check if status code is informational (1xx).
    
    Args:
        status_code: HTTP status code.
    
    Returns:
        True if informational.
    """
    return 100 <= status_code < 200


def is_success(status_code: int) -> bool:
    """Check if status code is success (2xx).
    
    Args:
        status_code: HTTP status code.
    
    Returns:
        True if success.
    """
    return 200 <= status_code < 300


def is_redirect(status_code: int) -> bool:
    """Check if status code is redirect (3xx).
    
    Args:
        status_code: HTTP status code.
    
    Returns:
        True if redirect.
    """
    return 300 <= status_code < 400


def is_client_error(status_code: int) -> bool:
    """Check if status code is client error (4xx).
    
    Args:
        status_code: HTTP status code.
    
    Returns:
        True if client error.
    """
    return 400 <= status_code < 500


def is_server_error(status_code: int) -> bool:
    """Check if status code is server error (5xx).
    
    Args:
        status_code: HTTP status code.
    
    Returns:
        True if server error.
    """
    return 500 <= status_code < 600
