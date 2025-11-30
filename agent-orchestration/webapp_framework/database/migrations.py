"""Database migration runner."""
from __future__ import annotations
from typing import List, Callable

class MigrationRunner:
    """Runs database migrations."""
    def __init__(self):
        self._migrations: List[Callable] = []
    
    def add_migration(self, migration: Callable) -> None:
        """Add migration."""
        self._migrations.append(migration)
    
    def run(self) -> int:
        """Run all migrations."""
        for migration in self._migrations:
            migration()
        return len(self._migrations)
    
    def rollback(self) -> int:
        """Rollback last migration."""
        if self._migrations:
            self._migrations.pop()
            return 1
        return 0
    
    def count(self) -> int:
        """Get migration count."""
        return len(self._migrations)
    
    def clear(self) -> None:
        """Clear all migrations."""
        self._migrations.clear()
