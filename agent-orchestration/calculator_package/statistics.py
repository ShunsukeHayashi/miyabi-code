"""
Statistical utility functions.
"""

import math
from collections import Counter
from typing import Iterable, Sequence, Union

Number = Union[int, float]


def _ensure_non_empty(values: Sequence[Number]) -> None:
    """
    Validate that the input sequence is not empty.

    Raises:
        ValueError: If the sequence is empty.
    """
    if len(values) == 0:
        raise ValueError("At least one value is required.")


def mean(values: Sequence[Number]) -> float:
    """
    Return the arithmetic mean of the given values.
    """
    _ensure_non_empty(values)
    return float(sum(values) / len(values))


def median(values: Sequence[Number]) -> float:
    """
    Return the median of the given values.
    """
    _ensure_non_empty(values)
    sorted_values = sorted(values)
    n = len(sorted_values)
    mid = n // 2
    if n % 2 == 1:
        return float(sorted_values[mid])
    return float((sorted_values[mid - 1] + sorted_values[mid]) / 2)


def mode(values: Sequence[Number]) -> Number:
    """
    Return the mode of the given values.

    Raises:
        ValueError: If the dataset is empty or has multiple modes.
    """
    _ensure_non_empty(values)
    counts = Counter(values)
    most_common = counts.most_common()
    max_count = most_common[0][1]
    modes = [value for value, count in most_common if count == max_count]
    if len(modes) > 1:
        raise ValueError("Mode is undefined for multimodal data.")
    return modes[0]


def variance(values: Sequence[Number]) -> float:
    """
    Return the population variance of the given values.
    """
    _ensure_non_empty(values)
    avg = mean(values)
    squared_diffs = [(value - avg) ** 2 for value in values]
    return float(sum(squared_diffs) / len(values))


def std_dev(values: Sequence[Number]) -> float:
    """
    Return the population standard deviation of the given values.
    """
    return math.sqrt(variance(values))
