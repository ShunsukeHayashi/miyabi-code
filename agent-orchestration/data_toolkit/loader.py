"""Data loading and validation utilities."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Tuple


class DataLoader:
    """Handle loading, validating, transforming, and saving structured data."""

    def __init__(self) -> None:
        self._last_data: Any = None

    def load_csv(self, path: Path | str) -> List[Dict[str, Any]]:
        path = Path(path)
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            data = [dict(row) for row in reader]
        self._last_data = data
        return data

    def load_json(self, path: Path | str) -> Any:
        path = Path(path)
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
        self._last_data = data
        return data

    def validate(
        self, data: Iterable[Any], required_fields: Iterable[str] | None = None
    ) -> Tuple[bool, List[str]]:
        errors: List[str] = []
        if not isinstance(data, list):
            errors.append("Data must be a list.")
            return False, errors

        for index, item in enumerate(data):
            if not isinstance(item, dict):
                errors.append(f"Item {index} is not a dictionary.")
                continue
            if required_fields:
                missing = [field for field in required_fields if field not in item]
                if missing:
                    errors.append(f"Item {index} missing fields: {', '.join(missing)}")

        return len(errors) == 0, errors

    def transform(self, data: Iterable[Any], func: Callable[[Any], Any]) -> List[Any]:
        if not callable(func):
            raise TypeError("Transform requires a callable.")
        transformed = [func(item) for item in data]
        self._last_data = transformed
        return transformed

    def save(self, data: Iterable[Any], path: Path | str) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.suffix.lower() == ".json":
            with path.open("w", encoding="utf-8") as handle:
                json.dump(data, handle, ensure_ascii=False, indent=2)
            return path

        if path.suffix.lower() == ".csv":
            rows = list(data)
            if not rows:
                with path.open("w", newline="", encoding="utf-8") as handle:
                    handle.write("")
                return path
            if not all(isinstance(row, dict) for row in rows):
                raise TypeError("CSV save requires an iterable of dictionaries.")
            fieldnames = sorted({field for row in rows for field in row})
            with path.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            return path

        raise ValueError(f"Unsupported file extension: {path.suffix}")
