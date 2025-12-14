"""
UI Tools - UI component rendering tools

These tools return UI components (widgets, quick actions, onboarding flows).
They are the "presentation" layer of the App SDK pattern.

IMPORTANT: Widget file names MUST match files in server/widgets/ directory.
All widget files use snake_case naming convention.
"""

from .registry import ToolDefinition, ToolCategory

# =============================================================================
# Widget Name Mapping (PR-2: Naming Convention Enforcement)
# =============================================================================
# This mapping ensures consistency between tool definitions and actual widget files.
# All widget files in server/widgets/ use snake_case naming.
#
# Usage: WIDGET_MAP["tool_name"] -> "actual_file.html"
# =============================================================================
WIDGET_MAP = {
    "onboarding": "onboarding_wizard.html",
    "quick_actions": "quick_actions.html",
    "agent_cards": "agent_cards.html",
    "agent_card_detail": "agent_tcg.html",
    "agent_collection": "agent_cards.html",
    "agent_tcg": "agent_tcg.html",
    "notification": "toast_notification.html",
    "subscription": "subscription_manager.html",
    "project_status": "project_status.html",
    "git_status": "git_status.html",
    "issue_list": "issue_list.html",
    "pr_list": "pr_list.html",
    "agent_selector": "agent_selector.html",
    "agent_execution": "agent_execution.html",
    "build_output": "build_output.html",
    "code_search": "code_search.html",
    "commit_history": "commit_history.html",
    "file_viewer": "file_viewer.html",
    "image_analysis": "image_analysis.html",
    "image_generation": "image-generation.html",  # Note: legacy naming
    "repository_selector": "repository_selector.html",
    "resource_settings": "resource_settings.html",
    "system_resources": "system_resources.html",
    "user_profile": "user_profile.html",
    "dashboard": "dashboard.html",
}


def widget_uri(name: str) -> str:
    """Get the correct widget URI for a given widget name."""
    if name in WIDGET_MAP:
        return f"ui://widget/{WIDGET_MAP[name]}"
    # Fallback: assume snake_case with .html
    return f"ui://widget/{name}.html"


# Widget meta template
WIDGET_META = {
    "openai/widgetAccessible": True,
}

# UI tool definitions
UI_TOOLS = [
    # === Onboarding ===
    ToolDefinition(
        name="show_onboarding",
        title="Show Onboarding",
        description="Display the Miyabi onboarding wizard for new users",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "step": {
                    "type": "string",
                    "description": "Start at specific step",
                    "enum": ["welcome", "github", "repository", "complete"],
                },
            },
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("onboarding"),
            "openai/toolInvocation/invoking": "Loading onboarding...",
            "openai/toolInvocation/invoked": "Onboarding ready.",
            **WIDGET_META,
        },
    ),

    # === Quick Actions ===
    ToolDefinition(
        name="show_quick_actions",
        title="Show Quick Actions",
        description="Display context-aware quick action buttons",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "context": {
                    "type": "string",
                    "description": "Context for action filtering (project, issue, pr, agent)",
                },
            },
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("quick_actions"),
            "openai/toolInvocation/invoking": "Loading quick actions...",
            "openai/toolInvocation/invoked": "Quick actions ready.",
            **WIDGET_META,
        },
    ),

    # === Agent Cards ===
    ToolDefinition(
        name="show_agent_cards",
        title="Show Agent Cards",
        description="Display Miyabi agent cards with descriptions and status",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "filter": {
                    "type": "string",
                    "description": "Filter by category (coding, business, all)",
                    "default": "all",
                },
            },
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("agent_cards"),
            "openai/toolInvocation/invoking": "Loading agent cards...",
            "openai/toolInvocation/invoked": "Agent cards displayed.",
            **WIDGET_META,
        },
    ),
    ToolDefinition(
        name="get_agent_card",
        title="Get Agent Card",
        description="Get detailed card for a specific agent",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name",
                },
            },
            "required": ["agent"],
        },
        meta={
            "openai/outputTemplate": widget_uri("agent_card_detail"),
            **WIDGET_META,
        },
    ),
    ToolDefinition(
        name="show_agent_collection",
        title="Show Agent Collection",
        description="Display the full agent collection gallery",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("agent_collection"),
            **WIDGET_META,
        },
    ),
    ToolDefinition(
        name="get_agent_tcg_card",
        title="Get Agent TCG Card",
        description="Get trading card game style agent card",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name",
                },
            },
            "required": ["agent"],
        },
        meta={
            "openai/outputTemplate": widget_uri("agent_tcg"),
            **WIDGET_META,
        },
    ),

    # === Notifications ===
    ToolDefinition(
        name="show_notification",
        title="Show Notification",
        description="Display a notification message to the user",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Notification title",
                },
                "message": {
                    "type": "string",
                    "description": "Notification message",
                },
                "type": {
                    "type": "string",
                    "enum": ["info", "success", "warning", "error"],
                    "default": "info",
                },
            },
            "required": ["message"],
        },
        meta={
            "openai/outputTemplate": widget_uri("notification"),
            **WIDGET_META,
        },
    ),

    # === Subscription ===
    ToolDefinition(
        name="show_subscription",
        title="Show Subscription",
        description="Display current subscription status and upgrade options",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("subscription"),
            **WIDGET_META,
        },
    ),
    # === Dashboard ===
    ToolDefinition(
        name="show_dashboard",
        title="Show Dashboard",
        description="Display the Miyabi executive dashboard with quick actions, active agents, and system status",
        category=ToolCategory.UI,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
        meta={
            "openai/outputTemplate": widget_uri("dashboard"),
            "openai/toolInvocation/invoking": "Loading Miyabi Dashboard...",
            "openai/toolInvocation/invoked": "Dashboard ready.",
            **WIDGET_META,
        },
    ),

]
