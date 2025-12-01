"""
UI Tools - UI component rendering tools

These tools return UI components (widgets, quick actions, onboarding flows).
They are the "presentation" layer of the App SDK pattern.
"""

from .registry import ToolDefinition, ToolCategory

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
            "openai/outputTemplate": "ui://widget/onboarding.html",
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
            "openai/outputTemplate": "ui://widget/quick-actions.html",
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
            "openai/outputTemplate": "ui://widget/agent-cards.html",
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
            "openai/outputTemplate": "ui://widget/agent-card-detail.html",
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
            "openai/outputTemplate": "ui://widget/agent-collection.html",
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
            "openai/outputTemplate": "ui://widget/tcg-card.html",
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
            "openai/outputTemplate": "ui://widget/notification.html",
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
            "openai/outputTemplate": "ui://widget/subscription.html",
            **WIDGET_META,
        },
    ),
]
