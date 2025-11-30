"""Custom test assertions."""
from __future__ import annotations

def assert_status_code(response: dict, expected: int) -> None:
    """Assert response status code."""
    assert response["status"] == expected, f"Expected {expected}, got {response['status']}"

def assert_json(response: dict) -> None:
    """Assert response is JSON."""
    assert "application/json" in response.get("content-type", "")

def assert_contains(text: str, substring: str) -> None:
    """Assert text contains substring."""
    assert substring in text, f"'{substring}' not found in text"

def assert_redirects(response: dict, location: str) -> None:
    """Assert response redirects to location."""
    assert response["status"] in [301, 302, 303, 307, 308]
    assert response.get("location") == location

def assert_header_exists(response: dict, header: str) -> None:
    """Assert header exists."""
    headers = response.get("headers", {})
    assert header.lower() in (k.lower() for k in headers)

def assert_cookie_set(response: dict, name: str) -> None:
    """Assert cookie is set."""
    cookies = response.get("cookies", {})
    assert name in cookies
