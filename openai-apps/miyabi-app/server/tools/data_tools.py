"""
DATA Tools - Read-only data fetching tools

These tools fetch and return data without UI rendering.
They are the "pure data" layer of the App SDK pattern.
"""

from .registry import ToolDefinition, ToolCategory

# Data tool definitions
DATA_TOOLS = [
    # === Project Status ===
    ToolDefinition(
        name="get_project_status",
        title="Get Project Status",
        description="Get current Miyabi project status including branch, crates, and MCP servers",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
        meta={
            "openai/toolInvocation/invoking": "Fetching project status...",
            "openai/toolInvocation/invoked": "Project status retrieved.",
        },
    ),

    # === GitHub Issues ===
    ToolDefinition(
        name="list_issues",
        title="List GitHub Issues",
        description="List GitHub issues with optional state filter",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "state": {
                    "type": "string",
                    "enum": ["open", "closed", "all"],
                    "description": "Issue state filter",
                    "default": "open",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max issues to return",
                    "default": 10,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="get_issue",
        title="Get Issue Details",
        description="Get detailed information about a specific GitHub issue",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "issue_number": {
                    "type": "integer",
                    "description": "Issue number",
                },
            },
            "required": ["issue_number"],
        },
    ),

    # === GitHub PRs ===
    ToolDefinition(
        name="list_prs",
        title="List Pull Requests",
        description="List pull requests with optional state filter",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "state": {
                    "type": "string",
                    "enum": ["open", "closed", "all"],
                    "default": "open",
                },
                "limit": {
                    "type": "integer",
                    "default": 10,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="get_pr",
        title="Get PR Details",
        description="Get detailed information about a specific pull request",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "pr_number": {
                    "type": "integer",
                    "description": "PR number",
                },
            },
            "required": ["pr_number"],
        },
    ),

    # === Git Status ===
    ToolDefinition(
        name="git_status",
        title="Git Status",
        description="Get current git status (modified, staged, untracked files)",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Specific path to check (optional)",
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="git_diff",
        title="Git Diff",
        description="Get git diff for changes",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "staged": {
                    "type": "boolean",
                    "description": "Show staged changes only",
                    "default": False,
                },
                "path": {
                    "type": "string",
                    "description": "Specific path to diff",
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="git_log",
        title="Git Log",
        description="Get recent git commit history",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of commits to show",
                    "default": 10,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="git_branch",
        title="Git Branch",
        description="List git branches or get current branch",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "list_all": {
                    "type": "boolean",
                    "description": "List all branches including remote",
                    "default": False,
                },
            },
            "required": [],
        },
    ),

    # === System Resources ===
    ToolDefinition(
        name="system_resources",
        title="System Resources",
        description="Get system resource usage (CPU, memory, disk)",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
    ToolDefinition(
        name="process_list",
        title="Process List",
        description="List running processes",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "filter": {
                    "type": "string",
                    "description": "Filter processes by name",
                },
                "limit": {
                    "type": "integer",
                    "default": 20,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="network_status",
        title="Network Status",
        description="Get network connection status and ports",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "port": {
                    "type": "integer",
                    "description": "Check specific port",
                },
            },
            "required": [],
        },
    ),

    # === File System ===
    ToolDefinition(
        name="read_file",
        title="Read File",
        description="Read contents of a file",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "File path to read",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max lines to read",
                },
            },
            "required": ["path"],
        },
    ),
    ToolDefinition(
        name="list_files",
        title="List Files",
        description="List files in a directory",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Directory path",
                    "default": ".",
                },
                "pattern": {
                    "type": "string",
                    "description": "Glob pattern filter",
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="search_code",
        title="Search Code",
        description="Search for patterns in code files",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Search pattern (regex)",
                },
                "path": {
                    "type": "string",
                    "description": "Path to search in",
                    "default": ".",
                },
                "file_type": {
                    "type": "string",
                    "description": "File type filter (rs, ts, py, etc.)",
                },
            },
            "required": ["pattern"],
        },
    ),

    # === Agent Status ===
    ToolDefinition(
        name="list_agents",
        title="List Agents",
        description="List all available Miyabi agents",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
    ToolDefinition(
        name="get_agent_status",
        title="Get Agent Status",
        description="Get status of a running agent",
        category=ToolCategory.DATA,
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
    ),
    ToolDefinition(
        name="get_agent_logs",
        title="Get Agent Logs",
        description="Get logs from an agent execution",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name",
                },
                "lines": {
                    "type": "integer",
                    "description": "Number of log lines",
                    "default": 50,
                },
            },
            "required": ["agent"],
        },
    ),

    # === Logs ===
    ToolDefinition(
        name="get_logs",
        title="Get Logs",
        description="Get application or system logs",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "source": {
                    "type": "string",
                    "description": "Log source (app, system, agent)",
                    "default": "app",
                },
                "lines": {
                    "type": "integer",
                    "default": 100,
                },
            },
            "required": [],
        },
    ),

    # === Repository ===
    ToolDefinition(
        name="list_repositories",
        title="List Repositories",
        description="List GitHub repositories accessible to the user",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "default": 20,
                },
            },
            "required": [],
        },
    ),

    # === Tmux ===
    ToolDefinition(
        name="tmux_list_sessions",
        title="List Tmux Sessions",
        description="List active tmux sessions",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),

    # === Obsidian ===
    ToolDefinition(
        name="obsidian_search",
        title="Search Obsidian Notes",
        description="Search notes in Obsidian vault",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query",
                },
            },
            "required": ["query"],
        },
    ),

    # === Tool Search ===
    ToolDefinition(
        name="search_tools",
        title="Search Tools",
        description="Search available Miyabi tools by keyword",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search keyword",
                },
            },
            "required": ["query"],
        },
    ),
    ToolDefinition(
        name="mcp_docs",
        title="MCP Documentation",
        description="Get MCP server documentation and usage info",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "Documentation topic",
                },
            },
            "required": [],
        },
    ),
]
