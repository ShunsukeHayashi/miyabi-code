"""
Unit tests for basic arithmetic operations in Calculator.
"""

import unittest

from calculator_package.calculator import Calculator


class TestBasicOperations(unittest.TestCase):
    """
    Tests for addition, subtraction, multiplication, division, and power.
    """

    def setUp(self) -> None:
        """Set up a calculator instance for tests."""
        self.calc = Calculator()

    def test_add_and_subtract(self) -> None:
        """Ensure add and subtract return expected results."""
        self.assertEqual(self.calc.add(3, 2), 5.0)
        self.assertEqual(self.calc.subtract(10, 4), 6.0)

    def test_multiply_and_divide(self) -> None:
        """Ensure multiply and divide return expected results."""
        self.assertEqual(self.calc.multiply(3, 5), 15.0)
        self.assertAlmostEqual(self.calc.divide(10, 4), 2.5)

    def test_power(self) -> None:
        """Ensure power works for positive and negative exponents."""
        self.assertEqual(self.calc.power(2, 3), 8.0)
        self.assertAlmostEqual(self.calc.power(9, 0.5), 3.0)

    def test_divide_by_zero_raises(self) -> None:
        """Ensure division by zero raises ZeroDivisionError."""
        with self.assertRaises(ZeroDivisionError):
            self.calc.divide(5, 0)


if __name__ == "__main__":
    unittest.main()
