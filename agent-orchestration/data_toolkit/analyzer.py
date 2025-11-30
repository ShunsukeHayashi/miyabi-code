"""Lightweight numeric analysis helpers."""

from __future__ import annotations

import math
import statistics
from typing import Iterable, List, Tuple


class Analyzer:
    """Perform simple descriptive and inferential analysis."""

    def mean(self, values: Iterable[float]) -> float:
        data = list(values)
        if not data:
            raise ValueError("Cannot compute mean of empty data.")
        return statistics.fmean(data)

    def median(self, values: Iterable[float]) -> float:
        data = list(values)
        if not data:
            raise ValueError("Cannot compute median of empty data.")
        return statistics.median(data)

    def correlation(self, x: Iterable[float], y: Iterable[float]) -> float:
        xs = list(x)
        ys = list(y)
        if len(xs) != len(ys):
            raise ValueError("Correlation requires sequences of equal length.")
        if len(xs) < 2:
            raise ValueError("Correlation requires at least two samples.")

        mean_x = statistics.fmean(xs)
        mean_y = statistics.fmean(ys)
        num = sum((a - mean_x) * (b - mean_y) for a, b in zip(xs, ys))
        denom_x = math.sqrt(sum((a - mean_x) ** 2 for a in xs))
        denom_y = math.sqrt(sum((b - mean_y) ** 2 for b in ys))
        if denom_x == 0 or denom_y == 0:
            raise ValueError("Correlation undefined when variance is zero.")
        return num / (denom_x * denom_y)

    def regression(self, x: Iterable[float], y: Iterable[float]) -> Tuple[float, float]:
        xs = list(x)
        ys = list(y)
        if len(xs) != len(ys):
            raise ValueError("Regression requires sequences of equal length.")
        if len(xs) < 2:
            raise ValueError("Regression requires at least two samples.")

        mean_x = statistics.fmean(xs)
        mean_y = statistics.fmean(ys)
        num = sum((a - mean_x) * (b - mean_y) for a, b in zip(xs, ys))
        den = sum((a - mean_x) ** 2 for a in xs)
        if den == 0:
            raise ValueError("Regression undefined when x variance is zero.")
        slope = num / den
        intercept = mean_y - slope * mean_x
        return slope, intercept

    def summary(self, values: Iterable[float]) -> dict:
        data = list(values)
        if not data:
            raise ValueError("Cannot summarize empty data.")
        return {
            "count": len(data),
            "mean": self.mean(data),
            "median": self.median(data),
            "min": min(data),
            "max": max(data),
        }
