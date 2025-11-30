"""
Calculator class that composes basic, advanced, and statistical operations.
"""

from typing import Sequence, Union

from .advanced_ops import factorial, gcd, is_prime, lcm, sqrt
from .basic_ops import add, divide, multiply, power, subtract
from .statistics import mean, median, mode, std_dev, variance

Number = Union[int, float]


class Calculator:
    """
    Unified calculator providing arithmetic, advanced math, and statistics.
    """

    def add(self, a: Number, b: Number) -> float:
        """
        Return the sum of two numbers.
        """
        return add(a, b)

    def subtract(self, a: Number, b: Number) -> float:
        """
        Return the difference of two numbers.
        """
        return subtract(a, b)

    def multiply(self, a: Number, b: Number) -> float:
        """
        Return the product of two numbers.
        """
        return multiply(a, b)

    def divide(self, a: Number, b: Number) -> float:
        """
        Return the quotient of two numbers.
        """
        return divide(a, b)

    def power(self, base: Number, exponent: Number) -> float:
        """
        Raise base to the given exponent.
        """
        return power(base, exponent)

    def sqrt(self, value: Number) -> float:
        """
        Return the square root of a non-negative number.
        """
        return sqrt(value)

    def factorial(self, value: int) -> int:
        """
        Return the factorial of a non-negative integer.
        """
        return factorial(value)

    def gcd(self, a: int, b: int) -> int:
        """
        Return the greatest common divisor of two integers.
        """
        return gcd(a, b)

    def lcm(self, a: int, b: int) -> int:
        """
        Return the least common multiple of two integers.
        """
        return lcm(a, b)

    def is_prime(self, n: int) -> bool:
        """
        Return True if n is prime, False otherwise.
        """
        return is_prime(n)

    def mean(self, values: Sequence[Number]) -> float:
        """
        Return the arithmetic mean of the given values.
        """
        return mean(values)

    def median(self, values: Sequence[Number]) -> float:
        """
        Return the median of the given values.
        """
        return median(values)

    def mode(self, values: Sequence[Number]) -> Number:
        """
        Return the mode of the given values.
        """
        return mode(values)

    def variance(self, values: Sequence[Number]) -> float:
        """
        Return the population variance of the given values.
        """
        return variance(values)

    def std_dev(self, values: Sequence[Number]) -> float:
        """
        Return the population standard deviation of the given values.
        """
        return std_dev(values)
