from numbers import Number
from typing import Any, List


class DataProcessor:
    """Utility for basic list manipulation and numeric calculations."""

    def __init__(self, data: List[Any]) -> None:
        """
        Initialize the processor with an initial data list.

        Args:
            data: Initial list of items to manage.
        """
        self._data: List[Any] = list(data)

    def get_data(self) -> List[Any]:
        """
        Return a shallow copy of the current data.

        Returns:
            A list containing the current items.
        """
        return list(self._data)

    def add_item(self, item: Any) -> None:
        """
        Add an item to the data list.

        Args:
            item: The item to append.
        """
        self._data.append(item)

    def remove_item(self, item: Any) -> None:
        """
        Remove the first occurrence of an item from the data list.

        Args:
            item: The item to remove.

        Raises:
            ValueError: If the item is not present in the data.
        """
        try:
            self._data.remove(item)
        except ValueError as exc:
            raise ValueError(f"Item {item!r} not found in data.") from exc

    def get_length(self) -> int:
        """
        Get the number of items in the data list.

        Returns:
            The length of the data list.
        """
        return len(self._data)

    def get_sum(self) -> float:
        """
        Compute the sum of numeric items in the data.

        Returns:
            The sum of numeric items as a float.

        Raises:
            TypeError: If any item in the data is not numeric.
        """
        total = 0.0
        for item in self._data:
            if isinstance(item, bool) or not isinstance(item, Number):
                raise TypeError(f"Non-numeric item encountered: {item!r}")
            total += float(item)
        return total

    def get_average(self) -> float:
        """
        Compute the average of numeric items in the data.

        Returns:
            The average of numeric items as a float.

        Raises:
            ValueError: If the data list is empty.
            TypeError: If any item in the data is not numeric.
        """
        length = len(self._data)
        if length == 0:
            raise ValueError("Cannot compute average of empty data.")
        total = self.get_sum()
        return total / length

    def filter_positive(self) -> List[Number]:
        """
        Return a list of positive numeric items.

        Returns:
            A list containing items greater than zero.

        Raises:
            TypeError: If any item in the data is not numeric.
        """
        positives: List[Number] = []
        for item in self._data:
            if isinstance(item, bool) or not isinstance(item, Number):
                raise TypeError(f"Non-numeric item encountered: {item!r}")
            if item > 0:
                positives.append(item)
        return positives

    def sort_data(self, reverse: bool = False) -> List[Any]:
        """
        Sort the data list in place.

        Args:
            reverse: Sort in descending order when True.

        Returns:
            The sorted data list.

        Raises:
            TypeError: If the data contains unorderable items.
        """
        try:
            self._data.sort(reverse=reverse)
        except TypeError as exc:
            raise TypeError("Data contains unorderable items.") from exc
        return list(self._data)

    def clear_data(self) -> None:
        """
        Remove all items from the data list.

        Returns:
            None
        """
        self._data.clear()
