"""
Basic arithmetic operations.
"""

from typing import Union

Number = Union[int, float]


def add(a: Number, b: Number) -> float:
    """
    Return the sum of two numbers.
    """
    return float(a + b)


def subtract(a: Number, b: Number) -> float:
    """
    Return the difference of two numbers (a - b).
    """
    return float(a - b)


def multiply(a: Number, b: Number) -> float:
    """
    Return the product of two numbers.
    """
    return float(a * b)


def divide(a: Number, b: Number) -> float:
    """
    Return the quotient of two numbers.

    Raises:
        ZeroDivisionError: If the divisor is zero.
    """
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero.")
    return float(a / b)


def power(base: Number, exponent: Number) -> float:
    """
    Raise base to the given exponent.
    """
    return float(base**exponent)
