"""
Advanced mathematical operations.
"""

import math
from typing import Union

Number = Union[int, float]


def sqrt(value: Number) -> float:
    """
    Return the square root of a non-negative number.

    Raises:
        ValueError: If value is negative.
    """
    if value < 0:
        raise ValueError("Square root is undefined for negative numbers.")
    return math.sqrt(value)


def factorial(value: int) -> int:
    """
    Return the factorial of a non-negative integer.

    Raises:
        ValueError: If value is negative.
        TypeError: If value is not an integer.
    """
    if not isinstance(value, int):
        raise TypeError("Factorial is defined for integers only.")
    if value < 0:
        raise ValueError("Factorial is undefined for negative numbers.")
    return math.factorial(value)


def gcd(a: int, b: int) -> int:
    """
    Return the greatest common divisor of two integers.

    Raises:
        TypeError: If either argument is not an integer.
        ValueError: If both numbers are zero.
    """
    if not isinstance(a, int) or not isinstance(b, int):
        raise TypeError("GCD is defined for integers only.")
    if a == 0 and b == 0:
        raise ValueError("GCD is undefined when both numbers are zero.")
    return math.gcd(a, b)


def lcm(a: int, b: int) -> int:
    """
    Return the least common multiple of two integers.

    Raises:
        TypeError: If either argument is not an integer.
        ValueError: If both numbers are zero.
    """
    if not isinstance(a, int) or not isinstance(b, int):
        raise TypeError("LCM is defined for integers only.")
    if a == 0 and b == 0:
        raise ValueError("LCM is undefined when both numbers are zero.")
    return abs(a * b) // math.gcd(a, b) if a and b else 0


def is_prime(n: int) -> bool:
    """
    Return True if n is a prime number, False otherwise.

    Raises:
        TypeError: If n is not an integer.
    """
    if not isinstance(n, int):
        raise TypeError("Prime check is defined for integers only.")
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    limit = int(math.sqrt(n)) + 1
    for i in range(3, limit, 2):
        if n % i == 0:
            return False
    return True
