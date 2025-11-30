"""Query builder."""
from __future__ import annotations
from typing import Any, List

class QueryBuilder:
    """Builds SQL queries."""
    def __init__(self, table: str):
        self.table = table
        self._select_fields: List[str] = []
        self._where_conditions: List[str] = []
        self._order_by: List[str] = []
        self._limit: Optional[int] = None
    
    def select(self, *fields: str) -> QueryBuilder:
        """Add SELECT fields."""
        self._select_fields.extend(fields)
        return self
    
    def where(self, condition: str) -> QueryBuilder:
        """Add WHERE condition."""
        self._where_conditions.append(condition)
        return self
    
    def order_by(self, field: str, direction: str = "ASC") -> QueryBuilder:
        """Add ORDER BY."""
        self._order_by.append(f"{field} {direction}")
        return self
    
    def limit(self, limit: int) -> QueryBuilder:
        """Add LIMIT."""
        self._limit = limit
        return self
    
    def build(self) -> str:
        """Build final query."""
        fields = ", ".join(self._select_fields) if self._select_fields else "*"
        query = f"SELECT {fields} FROM {self.table}"
        if self._where_conditions:
            query += " WHERE " + " AND ".join(self._where_conditions)
        if self._order_by:
            query += " ORDER BY " + ", ".join(self._order_by)
        if self._limit:
            query += f" LIMIT {self._limit}"
        return query
    
    def insert(self, data: dict) -> str:
        """Build INSERT query."""
        fields = ", ".join(data.keys())
        values = ", ".join(f"'{v}'" for v in data.values())
        return f"INSERT INTO {self.table} ({fields}) VALUES ({values})"
    
    def update(self, data: dict) -> str:
        """Build UPDATE query."""
        sets = ", ".join(f"{k} = '{v}'" for k, v in data.items())
        query = f"UPDATE {self.table} SET {sets}"
        if self._where_conditions:
            query += " WHERE " + " AND ".join(self._where_conditions)
        return query
    
    def delete(self) -> str:
        """Build DELETE query."""
        query = f"DELETE FROM {self.table}"
        if self._where_conditions:
            query += " WHERE " + " AND ".join(self._where_conditions)
        return query
    
    def reset(self) -> None:
        """Reset builder state."""
        self._select_fields.clear()
        self._where_conditions.clear()
        self._order_by.clear()
        self._limit = None
