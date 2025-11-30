"""Utility functions for common string operations."""


def reverse_string(s: str) -> str:
    """Return the reversed version of the input string."""
    return s[::-1]


def is_palindrome(s: str) -> bool:
    """Return True if the string reads the same forwards and backwards."""
    normalized = s
    return normalized == normalized[::-1]


def count_vowels(s: str) -> int:
    """Return the number of vowels (a, e, i, o, u) in the string, case-insensitive."""
    vowels = set("aeiouAEIOU")
    return sum(1 for ch in s if ch in vowels)


def capitalize_words(s: str) -> str:
    """Return a string with the first letter of each word capitalized."""
    return " ".join(word.capitalize() for word in s.split(" "))


def remove_spaces(s: str) -> str:
    """Return the string with all space characters removed."""
    return s.replace(" ", "")
