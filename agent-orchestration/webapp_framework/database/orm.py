"""Simple ORM base class."""
from __future__ import annotations
from typing import Any, Dict, Optional, List

class Model:
    """Base model class for ORM."""
    _table_name: str = ""
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    @classmethod
    def table_name(cls) -> str:
        """Get table name."""
        return cls._table_name or cls.__name__.lower()
    
    def save(self) -> bool:
        """Save model to database."""
        return True
    
    def delete(self) -> bool:
        """Delete model from database."""
        return True
    
    @classmethod
    def find(cls, id: int) -> Optional[Model]:
        """Find by ID."""
        return None
    
    @classmethod
    def all(cls) -> List[Model]:
        """Get all records."""
        return []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Model:
        """Create from dictionary."""
        return cls(**data)
