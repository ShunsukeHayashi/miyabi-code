#!/usr/bin/env python3
"""
Miyabi OpenAI App - MCP Server
Exposes Miyabi agents and project management as ChatGPT tools
"""

import os
import json
import subprocess
import asyncio
import psutil
import socket
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from github import Github
from dotenv import load_dotenv
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from a2a_client import get_client as get_a2a_client

# Load environment variables from .env file
load_dotenv()

# Configuration
MIYABI_ROOT = Path(os.getenv("MIYABI_ROOT", Path.home() / "Dev" / "miyabi-private"))
BASE_URL = os.getenv("BASE_URL", "http://localhost:4444")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
REPO_OWNER = os.getenv("MIYABI_REPO_OWNER", "customer-cloud")
REPO_NAME = os.getenv("MIYABI_REPO_NAME", "miyabi-private")
# MCP spec: OAuth 2.1 Bearer tokens (set MIYABI_ACCESS_TOKEN in .env)
ACCESS_TOKEN = os.getenv("MIYABI_ACCESS_TOKEN", "")

app = FastAPI(title="Miyabi MCP Server", version="1.0.0")

# MCP-compliant Bearer token authentication (OAuth 2.1 subset)
security = HTTPBearer(auto_error=False)


async def verify_bearer_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Verify Bearer token per MCP specification (OAuth 2.1 subset)

    MCP spec requires:
    - Authorization: Bearer <token>
    - HTTPS in production
    - Tokens must be in headers, not query strings
    """
    # Development mode: skip auth if no token configured
    if not ACCESS_TOKEN:
        return "dev-mode"

    if not credentials:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Bearer token required. Include Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.credentials != ACCESS_TOKEN:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return credentials.credentials

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent name mapping
AGENT_MAPPING = {
    "coordinator": "CoordinatorAgent",
    "codegen": "CodeGenAgent",
    "review": "ReviewAgent",
    "issue": "IssueAgent",
    "pr": "PRAgent",
    "deploy": "DeploymentAgent",
    "refresher": "RefresherAgent",
    "ai_entrepreneur": "AIEntrepreneurAgent",
    "self_analysis": "SelfAnalysisAgent",
    "market_research": "MarketResearchAgent",
    "persona": "PersonaAgent",
    "product_concept": "ProductConceptAgent",
    "product_design": "ProductDesignAgent",
    "content_creation": "ContentCreationAgent",
    "funnel_design": "FunnelDesignAgent",
    "sns_strategy": "SNSStrategyAgent",
    "marketing": "MarketingAgent",
    "sales": "SalesAgent",
    "crm": "CRMAgent",
    "analytics": "AnalyticsAgent",
    "youtube": "YouTubeAgent",
}


# MCP Protocol Models
class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Union[int, str]] = None  # Optional for notifications
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: Union[int, str]
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


# Tool Parameter Models
class ExecuteAgentParams(BaseModel):
    agent: str = Field(..., description="Agent name (e.g., 'codegen', 'review', 'issue')")
    issue_number: Optional[int] = Field(None, description="GitHub issue number to process")
    task: Optional[str] = Field(None, description="Task description for the agent")
    context: Optional[str] = Field(None, description="Additional context")


class CreateIssueParams(BaseModel):
    title: str = Field(..., description="Issue title")
    body: str = Field(..., description="Issue description")
    labels: Optional[List[str]] = Field(None, description="Issue labels")


class ListIssuesParams(BaseModel):
    state: str = Field("open", description="Issue state: 'open', 'closed', or 'all'")
    limit: int = Field(10, description="Maximum number of issues to return")


class ExecuteAgentsParallelParams(BaseModel):
    """Execute multiple agents in parallel"""
    agents: List[Dict[str, Any]] = Field(
        ...,
        description="List of agents to execute with their parameters",
        examples=[
            [
                {"agent": "codegen", "issue_number": 123},
                {"agent": "review", "task": "Review changes"},
            ]
        ],
    )


# ==========================================
# Git Operation Parameter Models
# ==========================================

class GitStatusParams(BaseModel):
    """Git status parameters"""
    path: Optional[str] = Field(None, description="Specific path to check status for")


class GitDiffParams(BaseModel):
    """Git diff parameters"""
    staged: bool = Field(False, description="Show staged changes only")
    file_path: Optional[str] = Field(None, description="Specific file to diff")


class GitLogParams(BaseModel):
    """Git log parameters"""
    limit: int = Field(10, description="Number of commits to show")
    oneline: bool = Field(True, description="One line per commit")


class GitBranchParams(BaseModel):
    """Git branch parameters"""
    all: bool = Field(False, description="Show all branches including remotes")


# ==========================================
# System Monitoring Parameter Models
# ==========================================

class ProcessListParams(BaseModel):
    """Process list parameters"""
    limit: int = Field(20, description="Number of processes to show")
    sort_by: str = Field("cpu", description="Sort by: cpu, memory, name")


class NetworkStatusParams(BaseModel):
    """Network status parameters"""
    include_connections: bool = Field(False, description="Include active connections")


# ==========================================
# Obsidian Parameter Models
# ==========================================

class ObsidianCreateNoteParams(BaseModel):
    """Create Obsidian note parameters"""
    title: str = Field(..., description="Note title")
    content: str = Field(..., description="Note content (markdown)")
    folder: Optional[str] = Field(None, description="Folder path within vault")
    tags: Optional[List[str]] = Field(None, description="Tags for the note")


class ObsidianSearchParams(BaseModel):
    """Search Obsidian notes parameters"""
    query: str = Field(..., description="Search query")
    limit: int = Field(10, description="Maximum results")


class ObsidianUpdateNoteParams(BaseModel):
    """Update Obsidian note parameters"""
    title: str = Field(..., description="Note title to update")
    content: str = Field(..., description="New content to append")
    replace: bool = Field(False, description="Replace entire content instead of append")


# ==========================================
# Tmux Parameter Models
# ==========================================

class TmuxListParams(BaseModel):
    """Tmux list parameters"""
    include_windows: bool = Field(True, description="Include window information")


class TmuxSendKeysParams(BaseModel):
    """Tmux send keys parameters"""
    session: str = Field(..., description="Session name")
    keys: str = Field(..., description="Keys/command to send")
    window: Optional[int] = Field(None, description="Window index")


# Helper Functions
def run_command(cmd: List[str], cwd: Path = MIYABI_ROOT) -> tuple[str, str, int]:
    """Run a shell command and return stdout, stderr, returncode"""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    return result.stdout, result.stderr, result.returncode


def get_github_client() -> Github:
    """Get authenticated GitHub client"""
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN not set")
    return Github(GITHUB_TOKEN)


def get_project_status() -> Dict[str, Any]:
    """Get current Miyabi project status"""
    # Get git branch
    branch_output, _, _ = run_command(["git", "branch", "--show-current"])
    branch = branch_output.strip()

    # Get crates count
    crates_output, _, _ = run_command(["find", "crates", "-name", "Cargo.toml"])
    crates_count = len([l for l in crates_output.strip().split("\n") if l])

    # Get MCP servers count
    mcp_servers_count = len([d for d in (MIYABI_ROOT / "mcp-servers").iterdir() if d.is_dir()])

    # Get last commit
    commit_hash, _, _ = run_command(["git", "log", "-1", "--format=%H"])
    commit_msg, _, _ = run_command(["git", "log", "-1", "--format=%s"])
    commit_author, _, _ = run_command(["git", "log", "-1", "--format=%an"])
    commit_date, _, _ = run_command(["git", "log", "-1", "--format=%aI"])

    return {
        "branch": branch,
        "crates_count": crates_count,
        "mcp_servers": mcp_servers_count,
        "agents_total": len(AGENT_MAPPING),
        "agents_running": 0,  # TODO: Track running agents
        "last_commit": {
            "hash": commit_hash.strip(),
            "message": commit_msg.strip(),
            "author": commit_author.strip(),
            "date": commit_date.strip(),
        },
    }


def create_widget_html(widget_name: str, data: Dict[str, Any]) -> str:
    """Create HTML for embedding widget with data"""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" crossorigin src="{BASE_URL}/assets/{widget_name}.js"></script>
    <link rel="stylesheet" href="{BASE_URL}/assets/{widget_name}.css">
    <style>
        body {{ margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }}
    </style>
</head>
<body>
    <div id="root"></div>
    <script id="widget-data" type="application/json">
        {json.dumps(data)}
    </script>
</body>
</html>"""


# MCP Tool Definitions
TOOLS = [
    {
        "name": "execute_agent",
        "description": "Execute a Miyabi agent (CodeGen, Review, Issue, PR, Deploy, etc.)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name: codegen, review, issue, pr, deploy, refresher, etc.",
                    "enum": list(AGENT_MAPPING.keys()),
                },
                "issue_number": {
                    "type": "integer",
                    "description": "GitHub issue number to process (optional)",
                },
                "task": {
                    "type": "string",
                    "description": "Task description for the agent (optional)",
                },
                "context": {
                    "type": "string",
                    "description": "Additional context (optional)",
                },
            },
            "required": ["agent"],
        },
    },
    {
        "name": "create_issue",
        "description": "Create a new GitHub issue in the Miyabi repository",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Issue title"},
                "body": {"type": "string", "description": "Issue description"},
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Issue labels (optional)",
                },
            },
            "required": ["title", "body"],
        },
    },
    {
        "name": "list_issues",
        "description": "List GitHub issues in the Miyabi repository",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {
                    "type": "string",
                    "description": "Issue state: open, closed, or all",
                    "enum": ["open", "closed", "all"],
                    "default": "open",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of issues to return",
                    "default": 10,
                },
            },
        },
    },
    {
        "name": "get_project_status",
        "description": "Get current Miyabi project status (branch, crates, agents, commits)",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_agents",
        "description": "Show interactive agent selector with all 21 Miyabi agents",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "show_agent_cards",
        "description": "Display Miyabi agents as collectible TCG trading cards with stats, skills, and achievements",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "execute_agents_parallel",
        "description": "Execute multiple Miyabi agents in parallel for faster processing",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agents": {
                    "type": "array",
                    "description": "List of agents to execute with their parameters",
                    "items": {
                        "type": "object",
                        "properties": {
                            "agent": {
                                "type": "string",
                                "description": "Agent name",
                                "enum": list(AGENT_MAPPING.keys()),
                            },
                            "issue_number": {"type": "integer"},
                            "task": {"type": "string"},
                            "context": {"type": "string"},
                        },
                        "required": ["agent"],
                    },
                }
            },
            "required": ["agents"],
        },
    },
    # ==========================================
    # Git Operation Tools
    # ==========================================
    {
        "name": "git_status",
        "description": "Get current git status showing modified, staged, and untracked files",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Specific path to check status for (optional)",
                },
            },
        },
    },
    {
        "name": "git_diff",
        "description": "Show git diff of changes in the repository",
        "inputSchema": {
            "type": "object",
            "properties": {
                "staged": {
                    "type": "boolean",
                    "description": "Show staged changes only",
                    "default": False,
                },
                "file_path": {
                    "type": "string",
                    "description": "Specific file to diff (optional)",
                },
            },
        },
    },
    {
        "name": "git_log",
        "description": "Show git commit history",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of commits to show",
                    "default": 10,
                },
                "oneline": {
                    "type": "boolean",
                    "description": "One line per commit",
                    "default": True,
                },
            },
        },
    },
    {
        "name": "git_branch",
        "description": "List git branches",
        "inputSchema": {
            "type": "object",
            "properties": {
                "all": {
                    "type": "boolean",
                    "description": "Show all branches including remotes",
                    "default": False,
                },
            },
        },
    },
    # ==========================================
    # System Monitoring Tools
    # ==========================================
    {
        "name": "system_resources",
        "description": "Get system resource usage (CPU, memory, disk)",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "process_list",
        "description": "List running processes sorted by resource usage",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of processes to show",
                    "default": 20,
                },
                "sort_by": {
                    "type": "string",
                    "description": "Sort by: cpu, memory, name",
                    "enum": ["cpu", "memory", "name"],
                    "default": "cpu",
                },
            },
        },
    },
    {
        "name": "network_status",
        "description": "Get network interface status and statistics",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_connections": {
                    "type": "boolean",
                    "description": "Include active connections",
                    "default": False,
                },
            },
        },
    },
    # ==========================================
    # Obsidian Tools
    # ==========================================
    {
        "name": "obsidian_create_note",
        "description": "Create a new note in the Obsidian vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Note title"},
                "content": {"type": "string", "description": "Note content (markdown)"},
                "folder": {"type": "string", "description": "Folder path within vault (optional)"},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Tags for the note (optional)",
                },
            },
            "required": ["title", "content"],
        },
    },
    {
        "name": "obsidian_search",
        "description": "Search notes in the Obsidian vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "limit": {
                    "type": "integer",
                    "description": "Maximum results",
                    "default": 10,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "obsidian_update_note",
        "description": "Update an existing note in the Obsidian vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Note title to update"},
                "content": {"type": "string", "description": "New content to append or replace"},
                "replace": {
                    "type": "boolean",
                    "description": "Replace entire content instead of append",
                    "default": False,
                },
            },
            "required": ["title", "content"],
        },
    },
    # ==========================================
    # Tmux Tools
    # ==========================================
    {
        "name": "tmux_list_sessions",
        "description": "List all tmux sessions and their windows",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_windows": {
                    "type": "boolean",
                    "description": "Include window information",
                    "default": True,
                },
            },
        },
    },
    {
        "name": "tmux_send_keys",
        "description": "Send keys/command to a tmux session",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session": {"type": "string", "description": "Session name"},
                "keys": {"type": "string", "description": "Keys/command to send"},
                "window": {"type": "integer", "description": "Window index (optional)"},
            },
            "required": ["session", "keys"],
        },
    },
    # ==========================================
    # Log Aggregation Tools
    # ==========================================
    {
        "name": "get_logs",
        "description": "Get aggregated logs from the Miyabi project",
        "inputSchema": {
            "type": "object",
            "properties": {
                "source": {
                    "type": "string",
                    "description": "Log source: all, agent, build, deploy",
                    "enum": ["all", "agent", "build", "deploy"],
                    "default": "all",
                },
                "limit": {
                    "type": "integer",
                    "description": "Number of log entries",
                    "default": 50,
                },
                "level": {
                    "type": "string",
                    "description": "Minimum log level: debug, info, warn, error",
                    "enum": ["debug", "info", "warn", "error"],
                    "default": "info",
                },
            },
        },
    },
]


# Tool Implementations
async def execute_agent_tool(params: ExecuteAgentParams) -> Dict[str, Any]:
    """Execute a Miyabi agent via A2A Bridge"""
    agent_name = AGENT_MAPPING.get(params.agent)
    if not agent_name:
        return {
            "status": "error",
            "error": f"Unknown agent: {params.agent}",
        }

    start_time = datetime.now()

    try:
        # Get A2A Bridge client
        a2a_client = get_a2a_client()

        # Build parameters for agent
        agent_params = {}
        if params.issue_number:
            agent_params["issue_number"] = params.issue_number
        if params.task:
            agent_params["task"] = params.task
        if params.context:
            agent_params["context"] = params.context

        # Execute agent via A2A Bridge
        result = await a2a_client.execute_agent(params.agent, agent_params)

        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # Extract output from result
        output = result.get("output", "") or json.dumps(result, indent=2)
        files_changed = result.get("files_changed", [])
        commits = result.get("commits", [])

        result_data = {
            "agent": agent_name,
            "status": "success",
            "output": output,
            "files_changed": files_changed,
            "commits": commits,
            "duration_ms": duration_ms,
        }

        # Return with widget metadata
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Executed {agent_name}",
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('agent-result', result_data)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": False,
        }

    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        error_data = {
            "agent": agent_name,
            "status": "error",
            "error": str(e),
            "duration_ms": duration_ms,
        }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error executing {agent_name}: {str(e)}",
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('agent-result', error_data)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": True,
        }


async def create_issue_tool(params: CreateIssueParams) -> Dict[str, Any]:
    """Create a GitHub issue"""
    try:
        gh = get_github_client()
        repo = gh.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        issue = repo.create_issue(
            title=params.title,
            body=params.body,
            labels=params.labels or [],
        )

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Created issue #{issue.number}: {params.title}\nURL: {issue.html_url}",
                }
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error creating issue: {str(e)}"}],
            "isError": True,
        }


async def list_issues_tool(params: ListIssuesParams) -> Dict[str, Any]:
    """List GitHub issues"""
    try:
        gh = get_github_client()
        repo = gh.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        issues = repo.get_issues(state=params.state)

        issue_list = []
        for issue in list(issues)[: params.limit]:
            issue_list.append(
                {
                    "number": issue.number,
                    "title": issue.title,
                    "state": issue.state,
                    "labels": [label.name for label in issue.labels],
                    "assignee": issue.assignee.login if issue.assignee else None,
                    "url": issue.html_url,
                    "created_at": issue.created_at.isoformat(),
                }
            )

        widget_data = {
            "issues": issue_list,
            "repository": f"{REPO_OWNER}/{REPO_NAME}",
        }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Found {len(issue_list)} issue(s)",
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('issue-list', widget_data)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error listing issues: {str(e)}"}],
            "isError": True,
        }


async def get_project_status_tool() -> Dict[str, Any]:
    """Get Miyabi project status"""
    try:
        status = get_project_status()

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Miyabi Project Status\nBranch: {status['branch']}\nCrates: {status['crates_count']}\nMCP Servers: {status['mcp_servers']}",
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('project-status', status)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting status: {str(e)}"}],
            "isError": True,
        }


async def list_agents_tool() -> Dict[str, Any]:
    """Show interactive agent selector widget with all 21 Miyabi agents"""
    try:
        # Get agent list from A2A Bridge
        client = get_a2a_client()
        agents = await client.list_agents()

        data = {
            "agents": agents,
            "count": len(agents),
        }

        return {
            "content": [
                {"type": "text", "text": f"🎯 Miyabi Agent Selector - Choose from {len(agents)} AI agents"},
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('agent-selector', data)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error loading agents: {str(e)}"}],
            "isError": True,
        }


async def show_agent_cards_tool() -> Dict[str, Any]:
    """Display Miyabi agents as collectible TCG trading cards"""
    try:
        # Load agent card data from JSON
        card_data_path = MIYABI_ROOT / ".claude" / "agents" / "AGENT_CARD_DATA.json"

        if not card_data_path.exists():
            return {
                "content": [{"type": "text", "text": f"❌ Agent card data not found at {card_data_path}"}],
                "isError": True,
            }

        with open(card_data_path, "r", encoding="utf-8") as f:
            card_data = json.load(f)

        agents = card_data.get("agents", [])

        return {
            "content": [
                {"type": "text", "text": f"⭐ MIYABI AGENTS TCG - {len(agents)} Collectible Agent Cards"},
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('agent-tcg-card', {'agents': agents})}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error loading TCG cards: {str(e)}"}],
            "isError": True,
        }


async def execute_agents_parallel_tool(params: ExecuteAgentsParallelParams) -> Dict[str, Any]:
    """
    Execute multiple Miyabi agents in parallel

    This enables concurrent agent execution for faster processing
    """
    start_time = datetime.now()

    try:
        # Create tasks for parallel execution
        tasks = []
        for agent_config in params.agents:
            agent_params = ExecuteAgentParams(**agent_config)
            task = execute_agent_tool(agent_params)
            tasks.append(task)

        # Execute all agents in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        success_count = 0
        error_count = 0
        agent_results = []

        for i, (config, result) in enumerate(zip(params.agents, results)):
            agent_name = AGENT_MAPPING.get(config["agent"])

            if isinstance(result, Exception):
                error_count += 1
                agent_results.append({
                    "agent": agent_name,
                    "status": "error",
                    "error": str(result),
                })
            else:
                if result.get("isError"):
                    error_count += 1
                else:
                    success_count += 1

                agent_results.append({
                    "agent": agent_name,
                    "status": "success" if not result.get("isError") else "error",
                    "result": result,
                })

        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        summary_data = {
            "total": len(params.agents),
            "success": success_count,
            "errors": error_count,
            "duration_ms": duration_ms,
            "results": agent_results,
        }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"🚀 Parallel Execution: {success_count}/{len(params.agents)} succeeded in {duration_ms}ms",
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": f"data:text/html;base64,{create_widget_html('parallel-results', summary_data)}",
                        "mimeType": "text/html",
                    },
                },
            ],
            "isError": error_count > 0,
        }

    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error in parallel execution: {str(e)}",
                }
            ],
            "isError": True,
        }


# ==========================================
# Git Operation Tool Implementations
# ==========================================

async def git_status_tool(params: GitStatusParams) -> Dict[str, Any]:
    """Get git status"""
    try:
        cmd = ["git", "status", "--porcelain"]
        if params.path:
            cmd.append(params.path)

        stdout, stderr, returncode = run_command(cmd)

        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        # Parse status
        files = []
        for line in stdout.strip().split("\n"):
            if line:
                status = line[:2]
                filepath = line[3:]
                files.append({"status": status, "path": filepath})

        # Get branch
        branch_out, _, _ = run_command(["git", "branch", "--show-current"])
        branch = branch_out.strip()

        result = {
            "branch": branch,
            "files": files,
            "total_changes": len(files),
        }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📁 Git Status on branch '{branch}'\n{len(files)} file(s) changed",
                }
            ],
            "isError": False,
            **result,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting git status: {str(e)}"}],
            "isError": True,
        }


async def git_diff_tool(params: GitDiffParams) -> Dict[str, Any]:
    """Get git diff"""
    try:
        cmd = ["git", "diff"]
        if params.staged:
            cmd.append("--staged")
        if params.file_path:
            cmd.append(params.file_path)

        stdout, stderr, returncode = run_command(cmd)

        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        # Truncate if too long
        diff_text = stdout[:10000] if len(stdout) > 10000 else stdout
        if len(stdout) > 10000:
            diff_text += "\n... (truncated)"

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📝 Git Diff {'(staged)' if params.staged else ''}\n```diff\n{diff_text}\n```",
                }
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting git diff: {str(e)}"}],
            "isError": True,
        }


async def git_log_tool(params: GitLogParams) -> Dict[str, Any]:
    """Get git log"""
    try:
        if params.oneline:
            cmd = ["git", "log", f"-{params.limit}", "--oneline"]
        else:
            cmd = ["git", "log", f"-{params.limit}", "--format=%H|%s|%an|%aI"]

        stdout, stderr, returncode = run_command(cmd)

        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        commits = []
        for line in stdout.strip().split("\n"):
            if line:
                if params.oneline:
                    parts = line.split(" ", 1)
                    commits.append({"hash": parts[0], "message": parts[1] if len(parts) > 1 else ""})
                else:
                    parts = line.split("|")
                    commits.append({
                        "hash": parts[0],
                        "message": parts[1] if len(parts) > 1 else "",
                        "author": parts[2] if len(parts) > 2 else "",
                        "date": parts[3] if len(parts) > 3 else "",
                    })

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📜 Git Log ({len(commits)} commits)\n" + "\n".join([f"• {c['hash'][:7]} {c['message']}" for c in commits]),
                }
            ],
            "isError": False,
            "commits": commits,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting git log: {str(e)}"}],
            "isError": True,
        }


async def git_branch_tool(params: GitBranchParams) -> Dict[str, Any]:
    """List git branches"""
    try:
        cmd = ["git", "branch"]
        if params.all:
            cmd.append("-a")

        stdout, stderr, returncode = run_command(cmd)

        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        branches = []
        current = None
        for line in stdout.strip().split("\n"):
            if line:
                is_current = line.startswith("*")
                branch_name = line.replace("*", "").strip()
                branches.append({"name": branch_name, "current": is_current})
                if is_current:
                    current = branch_name

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"🌿 Git Branches ({len(branches)} total)\nCurrent: {current}\n" + "\n".join([f"{'→ ' if b['current'] else '  '}{b['name']}" for b in branches]),
                }
            ],
            "isError": False,
            "branches": branches,
            "current": current,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error listing branches: {str(e)}"}],
            "isError": True,
        }


# ==========================================
# System Monitoring Tool Implementations
# ==========================================

async def system_resources_tool() -> Dict[str, Any]:
    """Get system resource usage"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        result = {
            "cpu": {
                "percent": cpu_percent,
                "cores": psutil.cpu_count(),
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "percent": memory.percent,
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "percent": disk.percent,
            },
        }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"💻 System Resources\n"
                           f"CPU: {cpu_percent}% ({psutil.cpu_count()} cores)\n"
                           f"Memory: {memory.percent}% ({result['memory']['used_gb']}/{result['memory']['total_gb']} GB)\n"
                           f"Disk: {disk.percent}% ({result['disk']['used_gb']}/{result['disk']['total_gb']} GB)",
                }
            ],
            "isError": False,
            **result,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting resources: {str(e)}"}],
            "isError": True,
        }


async def process_list_tool(params: ProcessListParams) -> Dict[str, Any]:
    """List running processes"""
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                pinfo = proc.info
                processes.append({
                    "pid": pinfo['pid'],
                    "name": pinfo['name'],
                    "cpu": pinfo['cpu_percent'] or 0,
                    "memory": pinfo['memory_percent'] or 0,
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Sort
        if params.sort_by == "cpu":
            processes.sort(key=lambda x: x['cpu'], reverse=True)
        elif params.sort_by == "memory":
            processes.sort(key=lambda x: x['memory'], reverse=True)
        else:
            processes.sort(key=lambda x: x['name'].lower())

        processes = processes[:params.limit]

        text_lines = [f"🔄 Top {len(processes)} Processes (by {params.sort_by})"]
        for p in processes[:10]:
            text_lines.append(f"  {p['pid']:6} | {p['name'][:20]:20} | CPU: {p['cpu']:5.1f}% | Mem: {p['memory']:5.1f}%")

        return {
            "content": [{"type": "text", "text": "\n".join(text_lines)}],
            "isError": False,
            "processes": processes,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error listing processes: {str(e)}"}],
            "isError": True,
        }


async def network_status_tool(params: NetworkStatusParams) -> Dict[str, Any]:
    """Get network status"""
    try:
        interfaces = {}
        for name, addrs in psutil.net_if_addrs().items():
            interfaces[name] = []
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    interfaces[name].append({
                        "type": "ipv4",
                        "address": addr.address,
                    })

        stats = psutil.net_io_counters()

        result = {
            "interfaces": interfaces,
            "io": {
                "bytes_sent": stats.bytes_sent,
                "bytes_recv": stats.bytes_recv,
                "packets_sent": stats.packets_sent,
                "packets_recv": stats.packets_recv,
            },
        }

        if params.include_connections:
            connections = []
            for conn in psutil.net_connections(kind='inet')[:20]:
                connections.append({
                    "local": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                    "remote": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    "status": conn.status,
                })
            result["connections"] = connections

        text_lines = ["🌐 Network Status"]
        for name, addrs in interfaces.items():
            for a in addrs:
                text_lines.append(f"  {name}: {a['address']}")
        text_lines.append(f"  I/O: ↑{stats.bytes_sent/1024/1024:.1f}MB ↓{stats.bytes_recv/1024/1024:.1f}MB")

        return {
            "content": [{"type": "text", "text": "\n".join(text_lines)}],
            "isError": False,
            **result,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting network status: {str(e)}"}],
            "isError": True,
        }


# ==========================================
# Obsidian Tool Implementations
# ==========================================

# Obsidian vault path configuration
OBSIDIAN_VAULT = Path(os.getenv("OBSIDIAN_VAULT", Path.home() / "Obsidian" / "MIYABI"))


async def obsidian_create_note_tool(params: ObsidianCreateNoteParams) -> Dict[str, Any]:
    """Create a new Obsidian note"""
    try:
        # Build file path
        folder = OBSIDIAN_VAULT / params.folder if params.folder else OBSIDIAN_VAULT
        folder.mkdir(parents=True, exist_ok=True)

        # Sanitize title for filename
        safe_title = "".join(c for c in params.title if c.isalnum() or c in " -_").strip()
        file_path = folder / f"{safe_title}.md"

        # Build content with frontmatter
        frontmatter = ["---", f"title: {params.title}", f"created: {datetime.now().isoformat()}"]
        if params.tags:
            frontmatter.append(f"tags: [{', '.join(params.tags)}]")
        frontmatter.append("---\n")

        content = "\n".join(frontmatter) + params.content

        file_path.write_text(content, encoding="utf-8")

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📝 Created note: {params.title}\nPath: {file_path}",
                }
            ],
            "isError": False,
            "path": str(file_path),
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error creating note: {str(e)}"}],
            "isError": True,
        }


async def obsidian_search_tool(params: ObsidianSearchParams) -> Dict[str, Any]:
    """Search Obsidian notes"""
    try:
        results = []
        query_lower = params.query.lower()

        for md_file in OBSIDIAN_VAULT.rglob("*.md"):
            try:
                content = md_file.read_text(encoding="utf-8")
                if query_lower in content.lower() or query_lower in md_file.stem.lower():
                    # Find matching line
                    lines = content.split("\n")
                    match_line = None
                    for i, line in enumerate(lines):
                        if query_lower in line.lower():
                            match_line = {"line": i + 1, "text": line[:100]}
                            break

                    results.append({
                        "title": md_file.stem,
                        "path": str(md_file.relative_to(OBSIDIAN_VAULT)),
                        "match": match_line,
                    })

                    if len(results) >= params.limit:
                        break
            except Exception:
                pass

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"🔍 Search results for '{params.query}': {len(results)} found\n" +
                           "\n".join([f"  • {r['title']} ({r['path']})" for r in results]),
                }
            ],
            "isError": False,
            "results": results,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error searching notes: {str(e)}"}],
            "isError": True,
        }


async def obsidian_update_note_tool(params: ObsidianUpdateNoteParams) -> Dict[str, Any]:
    """Update an Obsidian note"""
    try:
        # Find note by title
        target_file = None
        for md_file in OBSIDIAN_VAULT.rglob("*.md"):
            if md_file.stem.lower() == params.title.lower():
                target_file = md_file
                break

        if not target_file:
            return {
                "content": [{"type": "text", "text": f"Note not found: {params.title}"}],
                "isError": True,
            }

        if params.replace:
            target_file.write_text(params.content, encoding="utf-8")
        else:
            existing = target_file.read_text(encoding="utf-8")
            target_file.write_text(existing + "\n\n" + params.content, encoding="utf-8")

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📝 Updated note: {params.title}\n{'Replaced' if params.replace else 'Appended'} content",
                }
            ],
            "isError": False,
            "path": str(target_file),
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error updating note: {str(e)}"}],
            "isError": True,
        }


# ==========================================
# Tmux Tool Implementations
# ==========================================

async def tmux_list_sessions_tool(params: TmuxListParams) -> Dict[str, Any]:
    """List tmux sessions"""
    try:
        stdout, stderr, returncode = run_command(["tmux", "list-sessions", "-F", "#{session_name}|#{session_windows}|#{session_attached}"])

        if returncode != 0:
            if "no server running" in stderr.lower():
                return {
                    "content": [{"type": "text", "text": "📺 No tmux server running"}],
                    "isError": False,
                    "sessions": [],
                }
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        sessions = []
        for line in stdout.strip().split("\n"):
            if line:
                parts = line.split("|")
                session = {
                    "name": parts[0],
                    "windows": int(parts[1]) if len(parts) > 1 else 0,
                    "attached": parts[2] == "1" if len(parts) > 2 else False,
                }

                if params.include_windows:
                    win_out, _, _ = run_command(["tmux", "list-windows", "-t", parts[0], "-F", "#{window_index}|#{window_name}|#{window_active}"])
                    windows = []
                    for win_line in win_out.strip().split("\n"):
                        if win_line:
                            win_parts = win_line.split("|")
                            windows.append({
                                "index": int(win_parts[0]),
                                "name": win_parts[1] if len(win_parts) > 1 else "",
                                "active": win_parts[2] == "1" if len(win_parts) > 2 else False,
                            })
                    session["windows_list"] = windows

                sessions.append(session)

        text_lines = [f"📺 Tmux Sessions ({len(sessions)})"]
        for s in sessions:
            status = "🟢" if s["attached"] else "⚪"
            text_lines.append(f"  {status} {s['name']} ({s['windows']} windows)")

        return {
            "content": [{"type": "text", "text": "\n".join(text_lines)}],
            "isError": False,
            "sessions": sessions,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error listing sessions: {str(e)}"}],
            "isError": True,
        }


async def tmux_send_keys_tool(params: TmuxSendKeysParams) -> Dict[str, Any]:
    """Send keys to tmux session"""
    try:
        target = params.session
        if params.window is not None:
            target = f"{params.session}:{params.window}"

        stdout, stderr, returncode = run_command(["tmux", "send-keys", "-t", target, params.keys, "Enter"])

        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Error: {stderr}"}],
                "isError": True,
            }

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"⌨️ Sent to {target}: {params.keys}",
                }
            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error sending keys: {str(e)}"}],
            "isError": True,
        }


# ==========================================
# Log Aggregation Tool Implementation
# ==========================================

async def get_logs_tool(source: str = "all", limit: int = 50, level: str = "info") -> Dict[str, Any]:
    """Get aggregated logs"""
    try:
        log_dir = MIYABI_ROOT / ".ai" / "logs"
        logs = []

        level_priority = {"debug": 0, "info": 1, "warn": 2, "error": 3}
        min_level = level_priority.get(level, 1)

        # Read log files
        for log_file in sorted(log_dir.glob("*.md"), reverse=True)[:5]:
            try:
                content = log_file.read_text(encoding="utf-8")
                for line in content.split("\n"):
                    if line.strip():
                        # Simple log parsing
                        log_entry = {
                            "source": log_file.stem,
                            "message": line[:200],
                            "level": "info",
                        }

                        # Detect level
                        line_lower = line.lower()
                        if "error" in line_lower:
                            log_entry["level"] = "error"
                        elif "warn" in line_lower:
                            log_entry["level"] = "warn"
                        elif "debug" in line_lower:
                            log_entry["level"] = "debug"

                        if level_priority.get(log_entry["level"], 1) >= min_level:
                            logs.append(log_entry)

                        if len(logs) >= limit:
                            break
            except Exception:
                pass

            if len(logs) >= limit:
                break

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"📋 Logs ({len(logs)} entries, level >= {level})\n" +
                           "\n".join([f"[{l['level'].upper()}] {l['message'][:80]}" for l in logs[:20]]),
                }
            ],
            "isError": False,
            "logs": logs,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting logs: {str(e)}"}],
            "isError": True,
        }


# MCP Endpoints
@app.post("/mcp")
async def mcp_handler(
    request: Request,
    token: str = Depends(verify_bearer_token)
):
    """
    Main MCP protocol handler (MCP-compliant OAuth 2.1 authentication)

    Requires: Authorization: Bearer <token>
    """
    try:
        body = await request.json()
        mcp_request = MCPRequest(**body)

        # Handle different MCP methods
        if mcp_request.method == "initialize":
            # MCP protocol initialization handshake
            return MCPResponse(
                id=mcp_request.id,
                result={
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "prompts": {},
                        "resources": {}
                    },
                    "serverInfo": {
                        "name": "Miyabi MCP Server",
                        "version": "1.0.0"
                    }
                }
            ).dict()

        elif mcp_request.method in ("initialized", "notifications/initialized"):
            # Client acknowledges initialization - no response needed for notifications
            # Return 204 No Content
            return Response(status_code=204)

        elif mcp_request.method == "tools/list":
            return MCPResponse(id=mcp_request.id, result={"tools": TOOLS}).dict()

        elif mcp_request.method == "tools/call":
            tool_name = mcp_request.params.get("name")
            arguments = mcp_request.params.get("arguments", {})

            # Route to appropriate tool
            if tool_name == "execute_agent":
                result = await execute_agent_tool(ExecuteAgentParams(**arguments))
            elif tool_name == "create_issue":
                result = await create_issue_tool(CreateIssueParams(**arguments))
            elif tool_name == "list_issues":
                result = await list_issues_tool(ListIssuesParams(**arguments))
            elif tool_name == "get_project_status":
                result = await get_project_status_tool()
            elif tool_name == "list_agents":
                result = await list_agents_tool()
            elif tool_name == "show_agent_cards":
                result = await show_agent_cards_tool()
            elif tool_name == "execute_agents_parallel":
                result = await execute_agents_parallel_tool(ExecuteAgentsParallelParams(**arguments))
            # Git tools
            elif tool_name == "git_status":
                result = await git_status_tool(GitStatusParams(**arguments))
            elif tool_name == "git_diff":
                result = await git_diff_tool(GitDiffParams(**arguments))
            elif tool_name == "git_log":
                result = await git_log_tool(GitLogParams(**arguments))
            elif tool_name == "git_branch":
                result = await git_branch_tool(GitBranchParams(**arguments))
            # System monitoring tools
            elif tool_name == "system_resources":
                result = await system_resources_tool()
            elif tool_name == "process_list":
                result = await process_list_tool(ProcessListParams(**arguments))
            elif tool_name == "network_status":
                result = await network_status_tool(NetworkStatusParams(**arguments))
            # Obsidian tools
            elif tool_name == "obsidian_create_note":
                result = await obsidian_create_note_tool(ObsidianCreateNoteParams(**arguments))
            elif tool_name == "obsidian_search":
                result = await obsidian_search_tool(ObsidianSearchParams(**arguments))
            elif tool_name == "obsidian_update_note":
                result = await obsidian_update_note_tool(ObsidianUpdateNoteParams(**arguments))
            # Tmux tools
            elif tool_name == "tmux_list_sessions":
                result = await tmux_list_sessions_tool(TmuxListParams(**arguments))
            elif tool_name == "tmux_send_keys":
                result = await tmux_send_keys_tool(TmuxSendKeysParams(**arguments))
            # Log tools
            elif tool_name == "get_logs":
                result = await get_logs_tool(**arguments)
            else:
                return MCPResponse(
                    id=mcp_request.id,
                    error={"code": -32601, "message": f"Unknown tool: {tool_name}"},
                ).dict()

            return MCPResponse(id=mcp_request.id, result=result).dict()

        else:
            return MCPResponse(
                id=mcp_request.id,
                error={"code": -32601, "message": f"Unknown method: {mcp_request.method}"},
            ).dict()

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "jsonrpc": "2.0",
                "id": 0,
                "error": {"code": -32603, "message": str(e)},
            },
        )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": "Miyabi MCP Server",
        "version": "1.0.0",
        "status": "running",
        "tools": len(TOOLS),
    }


@app.get("/mcp")
async def mcp_info():
    """MCP endpoint information (use POST for actual MCP requests)"""
    return {
        "name": "Miyabi MCP Server",
        "version": "1.0.0",
        "protocol": "Model Context Protocol (MCP)",
        "description": "MCP server for Miyabi autonomous agent framework",
        "methods": ["tools/list", "tools/call"],
        "tools": len(TOOLS),
        "usage": {
            "method": "POST",
            "content_type": "application/json",
            "body_format": {
                "jsonrpc": "2.0",
                "id": "<number>",
                "method": "<tools/list | tools/call>",
                "params": {}
            }
        },
        "available_tools": [tool["name"] for tool in TOOLS],
        "endpoint": "/mcp"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
