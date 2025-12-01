"""
ACTION Tools - State-changing operation tools

These tools perform operations that modify state (create, update, delete).
They are the "write" layer of the App SDK pattern.
"""

from .registry import ToolDefinition, ToolCategory

# Action tool definitions
ACTION_TOOLS = [
    # === GitHub Issues ===
    ToolDefinition(
        name="create_issue",
        title="Create GitHub Issue",
        description="Create a new GitHub issue",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Issue title",
                },
                "body": {
                    "type": "string",
                    "description": "Issue description",
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Labels to apply",
                },
                "assignees": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Assignees",
                },
            },
            "required": ["title"],
        },
        meta={
            "openai/toolInvocation/invoking": "Creating issue...",
            "openai/toolInvocation/invoked": "Issue created.",
        },
    ),
    ToolDefinition(
        name="update_issue",
        title="Update Issue",
        description="Update an existing GitHub issue",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "issue_number": {
                    "type": "integer",
                    "description": "Issue number to update",
                },
                "title": {"type": "string"},
                "body": {"type": "string"},
                "state": {
                    "type": "string",
                    "enum": ["open", "closed"],
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["issue_number"],
        },
    ),
    ToolDefinition(
        name="close_issue",
        title="Close Issue",
        description="Close a GitHub issue",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "issue_number": {
                    "type": "integer",
                    "description": "Issue number to close",
                },
                "comment": {
                    "type": "string",
                    "description": "Optional closing comment",
                },
            },
            "required": ["issue_number"],
        },
    ),
    ToolDefinition(
        name="add_issue_comment",
        title="Add Issue Comment",
        description="Add a comment to a GitHub issue",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "issue_number": {
                    "type": "integer",
                },
                "body": {
                    "type": "string",
                    "description": "Comment text",
                },
            },
            "required": ["issue_number", "body"],
        },
    ),

    # === GitHub PRs ===
    ToolDefinition(
        name="create_pr",
        title="Create Pull Request",
        description="Create a new pull request",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string"},
                "head": {
                    "type": "string",
                    "description": "Source branch",
                },
                "base": {
                    "type": "string",
                    "description": "Target branch",
                    "default": "main",
                },
            },
            "required": ["title", "head"],
        },
    ),
    ToolDefinition(
        name="merge_pr",
        title="Merge Pull Request",
        description="Merge a pull request",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "pr_number": {
                    "type": "integer",
                },
                "merge_method": {
                    "type": "string",
                    "enum": ["merge", "squash", "rebase"],
                    "default": "squash",
                },
            },
            "required": ["pr_number"],
        },
    ),

    # === Git Operations ===
    ToolDefinition(
        name="git_commit",
        title="Git Commit",
        description="Create a git commit",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Commit message",
                },
                "files": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Files to commit (default: all staged)",
                },
            },
            "required": ["message"],
        },
    ),
    ToolDefinition(
        name="git_push",
        title="Git Push",
        description="Push commits to remote",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "remote": {
                    "type": "string",
                    "default": "origin",
                },
                "branch": {
                    "type": "string",
                    "description": "Branch to push",
                },
                "force": {
                    "type": "boolean",
                    "default": False,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="git_pull",
        title="Git Pull",
        description="Pull changes from remote",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "remote": {
                    "type": "string",
                    "default": "origin",
                },
                "branch": {
                    "type": "string",
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="git_checkout",
        title="Git Checkout",
        description="Switch branches or restore files",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "Branch name or file path",
                },
                "create": {
                    "type": "boolean",
                    "description": "Create new branch",
                    "default": False,
                },
            },
            "required": ["target"],
        },
    ),
    ToolDefinition(
        name="git_create_branch",
        title="Create Branch",
        description="Create a new git branch",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Branch name",
                },
                "from_branch": {
                    "type": "string",
                    "description": "Base branch",
                    "default": "main",
                },
            },
            "required": ["name"],
        },
    ),
    ToolDefinition(
        name="git_stash",
        title="Git Stash",
        description="Stash or apply stashed changes",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["push", "pop", "list", "drop"],
                    "default": "push",
                },
                "message": {
                    "type": "string",
                    "description": "Stash message",
                },
            },
            "required": [],
        },
    ),

    # === File Operations ===
    ToolDefinition(
        name="write_file",
        title="Write File",
        description="Write content to a file",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "File path",
                },
                "content": {
                    "type": "string",
                    "description": "File content",
                },
                "append": {
                    "type": "boolean",
                    "default": False,
                },
            },
            "required": ["path", "content"],
        },
    ),

    # === Build Operations ===
    ToolDefinition(
        name="cargo_build",
        title="Cargo Build",
        description="Build Rust project with cargo",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "release": {
                    "type": "boolean",
                    "default": False,
                },
                "package": {
                    "type": "string",
                    "description": "Specific package to build",
                },
            },
            "required": [],
        },
        meta={
            "openai/toolInvocation/invoking": "Building Rust project...",
            "openai/toolInvocation/invoked": "Build complete.",
        },
    ),
    ToolDefinition(
        name="cargo_test",
        title="Cargo Test",
        description="Run Rust tests",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "package": {
                    "type": "string",
                },
                "test_name": {
                    "type": "string",
                    "description": "Specific test to run",
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="cargo_clippy",
        title="Cargo Clippy",
        description="Run Clippy linter",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "fix": {
                    "type": "boolean",
                    "description": "Auto-fix issues",
                    "default": False,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="npm_install",
        title="NPM Install",
        description="Install NPM dependencies",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "package": {
                    "type": "string",
                    "description": "Specific package to install",
                },
                "dev": {
                    "type": "boolean",
                    "default": False,
                },
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="npm_run",
        title="NPM Run",
        description="Run NPM script",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "script": {
                    "type": "string",
                    "description": "Script name to run",
                },
            },
            "required": ["script"],
        },
    ),

    # === Tmux ===
    ToolDefinition(
        name="tmux_send_keys",
        title="Send Tmux Keys",
        description="Send keystrokes to a tmux session",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "session": {
                    "type": "string",
                    "description": "Tmux session name",
                },
                "keys": {
                    "type": "string",
                    "description": "Keys to send",
                },
            },
            "required": ["session", "keys"],
        },
    ),

    # === Obsidian ===
    ToolDefinition(
        name="obsidian_create_note",
        title="Create Obsidian Note",
        description="Create a new note in Obsidian vault",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Note title",
                },
                "content": {
                    "type": "string",
                    "description": "Note content (markdown)",
                },
                "folder": {
                    "type": "string",
                    "description": "Target folder",
                },
            },
            "required": ["title", "content"],
        },
    ),
    ToolDefinition(
        name="obsidian_update_note",
        title="Update Obsidian Note",
        description="Update an existing Obsidian note",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Note path",
                },
                "content": {
                    "type": "string",
                    "description": "New content",
                },
                "append": {
                    "type": "boolean",
                    "default": False,
                },
            },
            "required": ["path", "content"],
        },
    ),

    # === Project Setup ===
    ToolDefinition(
        name="setup_project",
        title="Setup Project",
        description="Initialize Miyabi for a project",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
    ToolDefinition(
        name="set_project",
        title="Set Project",
        description="Set the current working project",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "repository": {
                    "type": "string",
                    "description": "Repository name (owner/repo)",
                },
            },
            "required": ["repository"],
        },
    ),

    # === Subscription ===
    ToolDefinition(
        name="start_checkout",
        title="Start Checkout",
        description="Start subscription checkout process",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "plan": {
                    "type": "string",
                    "enum": ["pro", "team", "enterprise"],
                },
            },
            "required": ["plan"],
        },
    ),
    ToolDefinition(
        name="manage_subscription",
        title="Manage Subscription",
        description="Manage subscription settings",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["upgrade", "downgrade", "cancel"],
                },
            },
            "required": ["action"],
        },
    ),

    # === Workflow ===
    ToolDefinition(
        name="run_workflow",
        title="Run GitHub Workflow",
        description="Trigger a GitHub Actions workflow",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {
                "workflow": {
                    "type": "string",
                    "description": "Workflow file name",
                },
                "ref": {
                    "type": "string",
                    "description": "Branch or tag",
                    "default": "main",
                },
                "inputs": {
                    "type": "object",
                    "description": "Workflow inputs",
                },
            },
            "required": ["workflow"],
        },
    ),
    ToolDefinition(
        name="list_workflows",
        title="List Workflows",
        description="List GitHub Actions workflows",
        category=ToolCategory.ACTION,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
]
