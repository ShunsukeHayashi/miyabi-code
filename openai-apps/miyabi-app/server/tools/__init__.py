"""
Miyabi Tools - App SDK Pattern Implementation

Tool categories following ChatGPT App SDK best practices:
1. DATA tools - Fetch and return data (no UI)
2. UI tools - Display UI components (quick actions, onboarding, etc.)
3. ACTION tools - Execute operations and return results
4. AGENT tools - Execute Miyabi AI agents
"""

from .registry import ToolRegistry, ToolCategory
from .data_tools import DATA_TOOLS
from .ui_tools import UI_TOOLS
from .action_tools import ACTION_TOOLS
from .agent_tools import AGENT_TOOLS

# Combined tool registry
TOOL_REGISTRY = ToolRegistry()
TOOL_REGISTRY.register_category(ToolCategory.DATA, DATA_TOOLS)
TOOL_REGISTRY.register_category(ToolCategory.UI, UI_TOOLS)
TOOL_REGISTRY.register_category(ToolCategory.ACTION, ACTION_TOOLS)
TOOL_REGISTRY.register_category(ToolCategory.AGENT, AGENT_TOOLS)

__all__ = [
    "TOOL_REGISTRY",
    "ToolRegistry",
    "ToolCategory",
    "DATA_TOOLS",
    "UI_TOOLS",
    "ACTION_TOOLS",
    "AGENT_TOOLS",
]
