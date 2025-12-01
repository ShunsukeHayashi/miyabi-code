"""
Tool Registry - Centralized tool management for App SDK pattern
"""

from enum import Enum
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
import logging

logger = logging.getLogger("miyabi-tools")


class ToolCategory(Enum):
    """Tool categories following App SDK best practices"""
    DATA = "data"       # Read-only data fetching
    UI = "ui"           # UI component rendering
    ACTION = "action"   # State-changing operations
    AGENT = "agent"     # AI agent execution


@dataclass
class ToolDefinition:
    """Tool definition with metadata"""
    name: str
    title: str
    description: str
    category: ToolCategory
    input_schema: Dict[str, Any]
    handler: Optional[Callable] = None
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_mcp_format(self) -> Dict[str, Any]:
        """Convert to MCP tool format"""
        tool = {
            "name": self.name,
            "title": self.title,
            "description": self.description,
            "inputSchema": self.input_schema,
        }
        if self.meta:
            tool["_meta"] = self.meta
        return tool


class ToolRegistry:
    """
    Centralized tool registry with validation and lookup

    Features:
    - Category-based organization
    - Tool existence validation
    - Handler registration
    - MCP format export
    """

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._categories: Dict[ToolCategory, List[str]] = {
            cat: [] for cat in ToolCategory
        }
        self._handlers: Dict[str, Callable] = {}

    def register(self, tool: ToolDefinition) -> None:
        """Register a single tool"""
        if tool.name in self._tools:
            logger.warning(f"Tool '{tool.name}' already registered, overwriting")

        self._tools[tool.name] = tool
        self._categories[tool.category].append(tool.name)

        if tool.handler:
            self._handlers[tool.name] = tool.handler

    def register_category(self, category: ToolCategory, tools: List[ToolDefinition]) -> None:
        """Register all tools in a category"""
        for tool in tools:
            tool.category = category
            self.register(tool)

    def register_handler(self, tool_name: str, handler: Callable) -> None:
        """Register a handler for a tool"""
        if tool_name not in self._tools:
            raise ValueError(f"Tool '{tool_name}' not found in registry")
        self._handlers[tool_name] = handler
        self._tools[tool_name].handler = handler

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        """Get tool by name"""
        return self._tools.get(name)

    def get_handler(self, name: str) -> Optional[Callable]:
        """Get handler for a tool"""
        return self._handlers.get(name)

    def get_by_category(self, category: ToolCategory) -> List[ToolDefinition]:
        """Get all tools in a category"""
        return [self._tools[name] for name in self._categories[category]]

    def list_all(self) -> List[ToolDefinition]:
        """List all registered tools"""
        return list(self._tools.values())

    def to_mcp_tools_list(self) -> List[Dict[str, Any]]:
        """Export all tools in MCP format"""
        return [tool.to_mcp_format() for tool in self._tools.values()]

    def validate_all(self) -> Dict[str, bool]:
        """
        Validate all registered tools
        Returns dict of tool_name -> is_valid
        """
        results = {}
        for name, tool in self._tools.items():
            # Check handler exists
            has_handler = name in self._handlers
            # Check required fields
            has_required = bool(tool.name and tool.description and tool.input_schema)
            results[name] = has_handler and has_required
        return results

    def get_missing_handlers(self) -> List[str]:
        """Get list of tools without handlers"""
        return [name for name in self._tools if name not in self._handlers]

    def __len__(self) -> int:
        return len(self._tools)

    def __contains__(self, name: str) -> bool:
        return name in self._tools


# Tool category metadata for UI
CATEGORY_META = {
    ToolCategory.DATA: {
        "icon": "database",
        "color": "blue",
        "description": "Data fetching tools (read-only)",
    },
    ToolCategory.UI: {
        "icon": "layout",
        "color": "purple",
        "description": "UI component rendering tools",
    },
    ToolCategory.ACTION: {
        "icon": "zap",
        "color": "orange",
        "description": "State-changing operation tools",
    },
    ToolCategory.AGENT: {
        "icon": "bot",
        "color": "green",
        "description": "AI agent execution tools",
    },
}
