import math
import pytest

from data_toolkit.analyzer import Analyzer


def test_mean_and_median():
    analyzer = Analyzer()
    data = [1, 2, 3, 4]
    assert analyzer.mean(data) == 2.5
    assert analyzer.median(data) == 2.5


def test_correlation_perfect_positive():
    analyzer = Analyzer()
    x = [1, 2, 3, 4, 5]
    y = [2, 4, 6, 8, 10]
    assert math.isclose(analyzer.correlation(x, y), 1.0)


def test_regression_slope_and_intercept():
    analyzer = Analyzer()
    x = [0, 1, 2]
    y = [1, 3, 5]
    slope, intercept = analyzer.regression(x, y)
    assert math.isclose(slope, 2.0)
    assert math.isclose(intercept, 1.0)


def test_summary_contains_expected_keys():
    analyzer = Analyzer()
    data = [3, 1, 4, 1, 5]
    summary = analyzer.summary(data)
    assert summary["count"] == 5
    assert summary["min"] == 1
    assert summary["max"] == 5
    assert math.isclose(summary["mean"], analyzer.mean(data))
    assert math.isclose(summary["median"], analyzer.median(data))


def test_correlation_raises_on_mismatch():
    analyzer = Analyzer()
    with pytest.raises(ValueError):
        analyzer.correlation([1, 2], [1])
