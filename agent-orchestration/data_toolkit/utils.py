"""Utility helpers used across the toolkit."""

from __future__ import annotations

from typing import Iterable, List


def ensure_numeric(values: Iterable[float | str]) -> List[float]:
    return [float(v) for v in values]


def flatten(nested: Iterable[Iterable]) -> List:
    return [item for group in nested for item in group]


def chunk(sequence: Iterable, size: int) -> List[List]:
    if size <= 0:
        raise ValueError("Chunk size must be positive.")
    seq = list(sequence)
    return [seq[i : i + size] for i in range(0, len(seq), size)]


def moving_average(values: Iterable[float], window: int) -> List[float]:
    nums = list(values)
    if window <= 0:
        raise ValueError("Window must be positive.")
    if window > len(nums):
        return []
    return [sum(nums[i : i + window]) / window for i in range(len(nums) - window + 1)]


def normalize(values: Iterable[float]) -> List[float]:
    nums = list(values)
    if not nums:
        return []
    lo, hi = min(nums), max(nums)
    if lo == hi:
        return [0.0 for _ in nums]
    return [(val - lo) / (hi - lo) for val in nums]
