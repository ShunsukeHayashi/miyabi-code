"""Simple plot abstraction helpers that return structured plot specs."""

from __future__ import annotations

import statistics
from typing import Iterable, List, Sequence


class Plotter:
    """Build lightweight plot specifications without requiring heavy deps."""

    def _validate_pairwise(self, x: Iterable[float], y: Iterable[float]) -> tuple:
        xs = list(x)
        ys = list(y)
        if len(xs) != len(ys):
            raise ValueError("x and y must have the same length.")
        if not xs:
            raise ValueError("x and y must not be empty.")
        return xs, ys

    def line_plot(self, x: Iterable[float], y: Iterable[float], label: str | None = None) -> dict:
        xs, ys = self._validate_pairwise(x, y)
        return {"type": "line", "label": label or "line", "points": list(zip(xs, ys))}

    def scatter(self, x: Iterable[float], y: Iterable[float], label: str | None = None) -> dict:
        xs, ys = self._validate_pairwise(x, y)
        return {"type": "scatter", "label": label or "scatter", "points": list(zip(xs, ys))}

    def histogram(self, data: Iterable[float], bins: int = 10) -> dict:
        values = list(data)
        if not values:
            raise ValueError("Histogram data must not be empty.")
        if bins <= 0:
            raise ValueError("Bins must be positive.")

        lo, hi = min(values), max(values)
        if lo == hi:
            return {"type": "histogram", "bins": [{"range": (lo, hi), "count": len(values)}]}

        bin_size = (hi - lo) / bins
        counts = [0 for _ in range(bins)]
        for value in values:
            index = min(int((value - lo) / bin_size), bins - 1)
            counts[index] += 1

        ranges = []
        for i, count in enumerate(counts):
            start = lo + i * bin_size
            end = start + bin_size
            ranges.append({"range": (start, end), "count": count})

        return {"type": "histogram", "bins": ranges}

    def boxplot(self, data: Iterable[float]) -> dict:
        values = sorted(data)
        if not values:
            raise ValueError("Boxplot data must not be empty.")

        def median(slice_values: Sequence[float]) -> float:
            return statistics.median(slice_values)

        mid = len(values) // 2
        if len(values) % 2 == 0:
            lower = values[:mid]
            upper = values[mid:]
        else:
            lower = values[:mid]
            upper = values[mid + 1 :]

        return {
            "type": "boxplot",
            "min": values[0],
            "q1": median(lower),
            "median": median(values),
            "q3": median(upper),
            "max": values[-1],
        }

    def heatmap(self, matrix: List[List[float]]) -> dict:
        if not matrix or not matrix[0]:
            raise ValueError("Heatmap matrix must not be empty.")
        row_lengths = {len(row) for row in matrix}
        if len(row_lengths) != 1:
            raise ValueError("All heatmap rows must be the same length.")
        rows = len(matrix)
        cols = len(matrix[0])
        return {"type": "heatmap", "rows": rows, "cols": cols, "values": matrix}
