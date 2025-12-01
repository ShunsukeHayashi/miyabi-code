"""
AGENT Tools - AI agent execution tools

These tools execute Miyabi AI agents for complex tasks.
They are the "intelligence" layer of the App SDK pattern.
"""

from .registry import ToolDefinition, ToolCategory

# Available agents
CODING_AGENTS = [
    "coordinator", "codegen", "review", "issue", "pr", "deploy", "refresher"
]
BUSINESS_AGENTS = [
    "ai_entrepreneur", "self_analysis", "market_research", "persona",
    "product_concept", "product_design", "content_creation", "funnel_design",
    "sns_strategy", "marketing", "sales", "crm", "analytics", "youtube"
]
ALL_AGENTS = CODING_AGENTS + BUSINESS_AGENTS

# Agent tool definitions
AGENT_TOOLS = [
    ToolDefinition(
        name="execute_agent",
        title="Execute Miyabi Agent",
        description="Execute a Miyabi AI agent to perform complex tasks",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name",
                    "enum": ALL_AGENTS,
                },
                "issue_number": {
                    "type": "integer",
                    "description": "GitHub issue to process (optional)",
                },
                "task": {
                    "type": "string",
                    "description": "Task description for the agent",
                },
                "context": {
                    "type": "string",
                    "description": "Additional context",
                },
            },
            "required": ["agent"],
        },
        meta={
            "openai/outputTemplate": "ui://widget/agent-execution.html",
            "openai/toolInvocation/invoking": "Executing agent...",
            "openai/toolInvocation/invoked": "Agent execution complete.",
            "openai/widgetAccessible": True,
        },
    ),

    ToolDefinition(
        name="execute_agents_parallel",
        title="Execute Agents in Parallel",
        description="Execute multiple Miyabi agents concurrently",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "agents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "agent": {
                                "type": "string",
                                "enum": ALL_AGENTS,
                            },
                            "task": {"type": "string"},
                            "issue_number": {"type": "integer"},
                        },
                        "required": ["agent"],
                    },
                    "description": "List of agents to execute",
                },
                "wait_for_all": {
                    "type": "boolean",
                    "description": "Wait for all agents to complete",
                    "default": True,
                },
            },
            "required": ["agents"],
        },
        meta={
            "openai/outputTemplate": "ui://widget/parallel-execution.html",
            "openai/toolInvocation/invoking": "Executing agents in parallel...",
            "openai/toolInvocation/invoked": "Parallel execution complete.",
            "openai/widgetAccessible": True,
        },
    ),

    ToolDefinition(
        name="stop_agent",
        title="Stop Agent",
        description="Stop a running agent execution",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name to stop",
                },
                "execution_id": {
                    "type": "string",
                    "description": "Specific execution ID",
                },
            },
            "required": ["agent"],
        },
    ),

    # === Image Generation (Gemini) ===
    ToolDefinition(
        name="gemini_generate_image",
        title="Generate Image with Gemini",
        description="Generate an image using Gemini AI",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Image generation prompt",
                },
                "style": {
                    "type": "string",
                    "description": "Image style (realistic, anime, abstract, etc.)",
                },
            },
            "required": ["prompt"],
        },
        meta={
            "openai/toolInvocation/invoking": "Generating image...",
            "openai/toolInvocation/invoked": "Image generated.",
        },
    ),
    ToolDefinition(
        name="gemini_analyze_image",
        title="Analyze Image with Gemini",
        description="Analyze an image using Gemini AI",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "image_url": {
                    "type": "string",
                    "description": "Image URL to analyze",
                },
                "question": {
                    "type": "string",
                    "description": "Question about the image",
                },
            },
            "required": ["image_url"],
        },
    ),
    ToolDefinition(
        name="gemini_generate_image_description",
        title="Generate Image Description",
        description="Generate a detailed description for image generation",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "concept": {
                    "type": "string",
                    "description": "Concept to describe",
                },
            },
            "required": ["concept"],
        },
    ),

    # === Agent Card Generation ===
    ToolDefinition(
        name="generate_agent_card_image",
        title="Generate Agent Card Image",
        description="Generate a TCG-style card image for an agent",
        category=ToolCategory.AGENT,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name",
                },
                "style": {
                    "type": "string",
                    "enum": ["tcg", "minimal", "cyberpunk"],
                    "default": "tcg",
                },
            },
            "required": ["agent"],
        },
        meta={
            "openai/outputTemplate": "ui://widget/agent-card-generated.html",
            "openai/widgetAccessible": True,
        },
    ),
]

# Quick access to agent lists
def get_coding_agents():
    return CODING_AGENTS

def get_business_agents():
    return BUSINESS_AGENTS

def get_all_agents():
    return ALL_AGENTS
