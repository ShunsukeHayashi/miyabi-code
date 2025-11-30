"""
Unit tests for advanced and statistical operations in Calculator.
"""

import unittest

from calculator_package.calculator import Calculator


class TestAdvancedOperations(unittest.TestCase):
    """
    Tests for square root, factorial, gcd/lcm, primality, and statistics.
    """

    def setUp(self) -> None:
        """Set up a calculator instance for tests."""
        self.calc = Calculator()

    def test_sqrt_and_factorial(self) -> None:
        """Ensure sqrt and factorial operate correctly and validate inputs."""
        self.assertEqual(self.calc.sqrt(16), 4.0)
        self.assertEqual(self.calc.factorial(5), 120)
        with self.assertRaises(ValueError):
            self.calc.sqrt(-1)
        with self.assertRaises(ValueError):
            self.calc.factorial(-3)

    def test_gcd_and_lcm(self) -> None:
        """Ensure gcd and lcm compute correct values and guard invalid inputs."""
        self.assertEqual(self.calc.gcd(24, 36), 12)
        self.assertEqual(self.calc.lcm(4, 6), 12)
        with self.assertRaises(ValueError):
            self.calc.gcd(0, 0)
        with self.assertRaises(ValueError):
            self.calc.lcm(0, 0)

    def test_is_prime(self) -> None:
        """Ensure prime checking works for primes, composites, and small numbers."""
        self.assertTrue(self.calc.is_prime(13))
        self.assertFalse(self.calc.is_prime(15))
        self.assertFalse(self.calc.is_prime(1))
        with self.assertRaises(TypeError):
            self.calc.is_prime(3.5)

    def test_statistics_functions(self) -> None:
        """Ensure statistical functions return expected population metrics."""
        data = [1, 2, 2, 3]
        self.assertEqual(self.calc.mean(data), 2.0)
        self.assertEqual(self.calc.median(data), 2.0)
        self.assertEqual(self.calc.mode(data), 2)
        self.assertAlmostEqual(self.calc.variance(data), 0.5)
        self.assertAlmostEqual(self.calc.std_dev(data), 0.5**0.5)
        with self.assertRaises(ValueError):
            self.calc.mode([1, 2, 3, 4])  # multimodal
        with self.assertRaises(ValueError):
            self.calc.mean([])  # type: ignore[arg-type]


if __name__ == "__main__":
    unittest.main()
