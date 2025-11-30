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

from fastapi import FastAPI, Request, HTTPException, Depends, Form, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, Response, RedirectResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import secrets
import hashlib
import base64
import time
from pydantic import BaseModel, Field
from github import Github
from functools import lru_cache
from dotenv import load_dotenv
import logging

# Sandbox Manager (multi-user isolation)
from sandbox_manager import sandbox_manager, SandboxManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("miyabi-mcp")
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from a2a_client import get_client as get_a2a_client

# Claude.ai Web MCP integration (OAuth + SSE)
from claude_web_mcp import claude_router, verify_claude_token

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

# OAuth 2.1 Configuration (supports GitHub OAuth App)
OAUTH_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID", "miyabi-mcp-client")
OAUTH_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET", secrets.token_urlsafe(32))
OAUTH_ISSUER = os.getenv("OAUTH_ISSUER", "https://miyabi-mcp.local")

# GitHub OAuth App Configuration
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID", "")
GITHUB_OAUTH_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET", "")
GITHUB_OAUTH_CALLBACK_URL = os.getenv("GITHUB_OAUTH_CALLBACK_URL", "")

# In-memory storage for OAuth (in production, use Redis/DB)
oauth_authorization_codes: Dict[str, Dict[str, Any]] = {}
oauth_access_tokens: Dict[str, Dict[str, Any]] = {}
oauth_refresh_tokens: Dict[str, Dict[str, Any]] = {}
oauth_pkce_challenges: Dict[str, str] = {}
# User and Project Management (Multi-tenant support)
user_profiles: Dict[str, Dict[str, Any]] = {}
token_to_user: Dict[str, str] = {}
user_projects: Dict[str, Dict[str, Any]] = {}

DEFAULT_PROJECT = {
    "project_root": str(MIYABI_ROOT),
    "github_repo": f"{REPO_OWNER}/{REPO_NAME}",
    "github_token": GITHUB_TOKEN,
}
# Request-scoped user context using contextvars
from contextvars import ContextVar

current_user_token: ContextVar[str] = ContextVar("current_user_token", default="")
current_user_project: ContextVar[Path] = ContextVar("current_user_project", default=MIYABI_ROOT)

def get_current_project_root() -> Path:
    """Get the project root for the current request context"""
    return current_user_project.get()



def get_user_project(token: str) -> Dict[str, Any]:
    """Get project configuration for the authenticated user"""
    user_id = token_to_user.get(token)
    if user_id and user_id in user_projects:
        return user_projects[user_id]
    return DEFAULT_PROJECT

def get_user_miyabi_root(token: str) -> Path:
    """Get MIYABI_ROOT for the authenticated user"""
    project = get_user_project(token)
    return Path(project.get("project_root", str(MIYABI_ROOT)))

  # code -> code_challenge

app = FastAPI(title="Miyabi MCP Server", version="1.0.0")

# Include Claude.ai Web MCP router (OAuth + SSE endpoints)
app.include_router(claude_router, tags=["Claude.ai Web MCP"])

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

    Accepts:
    1. Static ACCESS_TOKEN (for simple integrations)
    2. OAuth 2.1 issued tokens (for MCP clients)
    """
    # Development mode: skip auth if no token configured
    if not ACCESS_TOKEN and not oauth_access_tokens:
        return "dev-mode"

    if not credentials:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Bearer token required. Include Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Check static token first
    if ACCESS_TOKEN and token == ACCESS_TOKEN:
        return token

    # Check OAuth issued tokens
    if token in oauth_access_tokens:
        token_data = oauth_access_tokens[token]
        if time.time() > token_data["expires_at"]:
            del oauth_access_tokens[token]
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Access token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token

    raise HTTPException(
        status_code=HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )

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




# ============================================
# GitHub Extended Tools - Pydantic Models
# ============================================

class GetIssueParams(BaseModel):
    """Parameters for get_issue tool"""
    issue_number: int = Field(..., description="Issue number to get")

class UpdateIssueParams(BaseModel):
    """Parameters for update_issue tool"""
    issue_number: int = Field(..., description="Issue number to update")
    title: Optional[str] = Field(None, description="New title")
    body: Optional[str] = Field(None, description="New body")
    state: Optional[str] = Field(None, description="State: open or closed")
    labels: Optional[List[str]] = Field(None, description="Labels to set")

class CloseIssueParams(BaseModel):
    """Parameters for close_issue tool"""
    issue_number: int = Field(..., description="Issue number to close")
    comment: Optional[str] = Field(None, description="Comment when closing")

class ListPRsParams(BaseModel):
    """Parameters for list_prs tool"""
    state: str = Field("open", description="PR state: open, closed, all")
    limit: int = Field(10, description="Number of PRs to return")

class GetPRParams(BaseModel):
    """Parameters for get_pr tool"""
    pr_number: int = Field(..., description="PR number to get")

class CreatePRParams(BaseModel):
    """Parameters for create_pr tool"""
    title: str = Field(..., description="PR title")
    body: str = Field(..., description="PR body/description")
    head: str = Field(..., description="Branch containing changes")
    base: str = Field("main", description="Base branch to merge into")

class MergePRParams(BaseModel):
    """Parameters for merge_pr tool"""
    pr_number: int = Field(..., description="PR number to merge")
    merge_method: str = Field("squash", description="Merge method: merge, squash, rebase")

# ============================================
# Git Extended Tools - Pydantic Models
# ============================================

class GitCommitParams(BaseModel):
    """Parameters for git_commit tool"""
    message: str = Field(..., description="Commit message")
    files: Optional[List[str]] = Field(None, description="Files to stage (None = all)")

class GitPushParams(BaseModel):
    """Parameters for git_push tool"""
    remote: str = Field("origin", description="Remote name")
    branch: Optional[str] = Field(None, description="Branch name (default: current)")
    force: bool = Field(False, description="Force push")

class GitPullParams(BaseModel):
    """Parameters for git_pull tool"""
    remote: str = Field("origin", description="Remote name")
    branch: Optional[str] = Field(None, description="Branch name")

class GitCheckoutParams(BaseModel):
    """Parameters for git_checkout tool"""
    branch: str = Field(..., description="Branch to checkout")
    create: bool = Field(False, description="Create new branch")

class GitCreateBranchParams(BaseModel):
    """Parameters for git_create_branch tool"""
    name: str = Field(..., description="New branch name")
    from_branch: Optional[str] = Field(None, description="Source branch")

class GitStashParams(BaseModel):
    """Parameters for git_stash tool"""
    action: str = Field("push", description="Action: push, pop, list, drop")
    message: Optional[str] = Field(None, description="Stash message (for push)")

# ============================================
# File Operations - Pydantic Models
# ============================================

class ReadFileParams(BaseModel):
    """Parameters for read_file tool"""
    path: str = Field(..., description="File path to read")
    limit: int = Field(100, description="Max lines to return")

class WriteFileParams(BaseModel):
    """Parameters for write_file tool"""
    path: str = Field(..., description="File path to write")
    content: str = Field(..., description="Content to write")

class ListFilesParams(BaseModel):
    """Parameters for list_files tool"""
    path: str = Field(".", description="Directory path")
    pattern: Optional[str] = Field(None, description="Glob pattern filter")

class SearchCodeParams(BaseModel):
    """Parameters for search_code tool"""
    query: str = Field(..., description="Search query (grep pattern)")
    path: str = Field(".", description="Directory to search")
    file_pattern: Optional[str] = Field(None, description="File pattern (e.g., *.py)")

# ============================================
# Build/Test Tools - Pydantic Models
# ============================================

class CargoBuildParams(BaseModel):
    """Parameters for cargo_build tool"""
    release: bool = Field(False, description="Build in release mode")
    package: Optional[str] = Field(None, description="Specific package to build")

class CargoTestParams(BaseModel):
    """Parameters for cargo_test tool"""
    test_name: Optional[str] = Field(None, description="Specific test to run")
    package: Optional[str] = Field(None, description="Specific package to test")

class CargoClippyParams(BaseModel):
    """Parameters for cargo_clippy tool"""
    fix: bool = Field(False, description="Auto-fix warnings")

class NpmInstallParams(BaseModel):
    """Parameters for npm_install tool"""
    package: Optional[str] = Field(None, description="Package to install (None = all)")

class NpmRunParams(BaseModel):
    """Parameters for npm_run tool"""
    script: str = Field(..., description="Script name to run")

# ============================================
# Agent Details - Pydantic Models
# ============================================

class GetAgentStatusParams(BaseModel):
    """Parameters for get_agent_status tool"""
    agent: Optional[str] = Field(None, description="Agent name (None = all)")

class StopAgentParams(BaseModel):
    """Parameters for stop_agent tool"""
    agent: str = Field(..., description="Agent name to stop")

class GetAgentLogsParams(BaseModel):
    """Parameters for get_agent_logs tool"""
    agent: str = Field(..., description="Agent name")
    limit: int = Field(50, description="Number of log lines")

class GetAgentCardParams(BaseModel):
    """Parameters for get_agent_card tool"""
    agent_name: str = Field(..., description="Agent name in English (e.g., 'shikiroon', 'tsukuroon')")




# Helper Functions

def make_response(text: str, is_error: bool = False) -> Dict[str, Any]:
    """Create standardized MCP response"""
    return {
        "content": [{"type": "text", "text": text}],
        "isError": is_error
    }

def make_error(message: str, details: str = None) -> Dict[str, Any]:
    """Create error response with optional details"""
    text = f"Error: {message}"
    if details:
        text += f"\nDetails: {details}"
    return make_response(text, is_error=True)

def validate_path(path: str, allow_absolute: bool = True) -> Path:
    """Validate and sanitize file path"""
    p = Path(path)
    if not p.is_absolute():
        p = MIYABI_ROOT / p
    
    # Security: prevent path traversal
    try:
        p = p.resolve()
        if not allow_absolute and not str(p).startswith(str(MIYABI_ROOT)):
            raise ValueError(f"Path must be within MIYABI_ROOT: {MIYABI_ROOT}")
    except Exception:
        raise ValueError(f"Invalid path: {path}")
    
    return p


def run_command(cmd: List[str], cwd: Path = MIYABI_ROOT) -> tuple[str, str, int]:
    """Run a shell command and return stdout, stderr, returncode"""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    return result.stdout, result.stderr, result.returncode


# Cache GitHub client instance
_github_client = None

def get_github_client() -> Github:
    """Get authenticated GitHub client (cached)"""
    global _github_client
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN not set")
    if _github_client is None:
        _github_client = Github(GITHUB_TOKEN)
    return _github_client



_cached_repo = None
_cached_repo_time = 0

def get_repo():
    """Get cached repository object (refreshes every 5 min)"""
    global _cached_repo, _cached_repo_time
    import time
    now = time.time()
    if _cached_repo is None or (now - _cached_repo_time) > 300:
        g = get_github_client()
        _cached_repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        _cached_repo_time = now
    return _cached_repo

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


# ==========================================
# OpenAI Apps SDK - Widget Resources
# ==========================================

WIDGETS_DIR = Path(__file__).parent / "widgets"

# Widget Resource Definitions (text/html+skybridge)
WIDGET_RESOURCES = {
    "project_status": {
        "uri": "ui://widget/project-status.html",
        "description": "Miyabi project status dashboard widget",
    },
    "issue_list": {
        "uri": "ui://widget/issue-list.html",
        "description": "GitHub issues list widget",
    },
    "agent_selector": {
        "uri": "ui://widget/agent-selector.html",
        "description": "Interactive agent selection widget",
    },
    "agent_cards": {
        "uri": "ui://widget/agent-cards.html",
        "description": "TCG-style agent cards display widget",
    },
    "agent_tcg": {
        "uri": "ui://widget/agent-tcg.html",
        "description": "Advanced Agent Trading Card Game collection with Gemini 3 Pro integration",
    },
    "image_analysis": {
        "uri": "ui://widget/image-analysis.html",
        "description": "Gemini 3 Pro image analysis widget",
    },
    "agent_execution": {
        "uri": "ui://widget/agent-execution.html",
        "description": "Agent execution result widget",
    },
    "repository_selector": {
        "uri": "ui://widget/repository-selector.html",
        "description": "Repository selection widget",
    },
    "git_status": {
        "uri": "ui://widget/git-status.html",
        "description": "Git status display widget",
    },
    "code_search": {
        "uri": "ui://widget/code-search.html",
        "description": "Code search results widget",
    },
    "pr_list": {
        "uri": "ui://widget/pr-list.html",
        "description": "Pull requests list widget",
    },
    "system_resources": {
        "uri": "ui://widget/system-resources.html",
        "description": "System resources monitoring widget",
    },
    "user_profile": {
        "uri": "ui://widget/user-profile.html",
        "description": "User profile display widget",
    },
    "file_viewer": {
        "uri": "ui://widget/file-viewer.html",
        "description": "File content viewer widget",
    },
    "commit_history": {
        "uri": "ui://widget/commit-history.html",
        "description": "Git commit history timeline widget",
    },
    "build_output": {
        "uri": "ui://widget/build-output.html",
        "description": "Build/test output terminal widget",
    },
    "resource_settings": {
        "uri": "ui://widget/resource-settings.html",
        "description": "Resource settings for GitHub repository configuration",
        "is_settings": True,
    },
    "onboarding_wizard": {
        "uri": "ui://widget/onboarding-wizard.html",
        "description": "Interactive onboarding wizard for new users",
        "is_onboarding": True,
    },
    "quick_actions": {
        "uri": "ui://widget/quick-actions.html",
        "description": "Quick action buttons for common operations",
    },
    "toast_notification": {
        "uri": "ui://widget/toast-notification.html",
        "description": "Toast notification display widget",
    },
    "subscription_manager": {
        "uri": "ui://widget/subscription-manager.html",
        "description": "Subscription and billing management widget",
        "is_settings": True,
    },
    "image_generation": {
        "uri": "ui://widget/image-generation.html",
        "description": "Gemini 3 Pro image generation widget for creating agent TCG cards",
    },
}

# Widget CSP and Domain configuration
WIDGET_META = {
    "openai/widgetPrefersBorder": True,
    "openai/widgetDomain": "https://mcp.miyabi-world.com",
    "openai/widgetCSP": {
        "connect_domains": ["https://mcp.miyabi-world.com", "https://api.github.com"],
        "resource_domains": ["https://avatars.githubusercontent.com"],
    },
}


def load_widget_html(widget_name: str) -> str:
    """Load widget HTML from file"""
    file_path = WIDGETS_DIR / f"{widget_name}.html"
    if file_path.exists():
        return file_path.read_text(encoding="utf-8")
    return f"<div>Widget {widget_name} not found</div>"


def get_widget_resource(widget_name: str) -> Dict[str, Any]:
    """Get widget resource for MCP resources/read"""
    if widget_name not in WIDGET_RESOURCES:
        return None
    widget = WIDGET_RESOURCES[widget_name]
    html = load_widget_html(widget_name)
    return {
        "uri": widget["uri"],
        "mimeType": "text/html+skybridge",
        "text": html,
        "_meta": WIDGET_META,
    }


# MCP Tool Definitions with OpenAI Apps SDK metadata
TOOLS = [
    {
        "name": "execute_agent",
        "title": "Execute Miyabi Agent",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-execution.html",
            "openai/toolInvocation/invoking": "Executing agent...",
            "openai/toolInvocation/invoked": "Agent execution complete.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "create_issue",
        "title": "Create GitHub Issue",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/issue-list.html",
            "openai/toolInvocation/invoking": "Creating issue...",
            "openai/toolInvocation/invoked": "Issue created.",
        },
    },
    {
        "name": "list_issues",
        "title": "List GitHub Issues",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/issue-list.html",
            "openai/toolInvocation/invoking": "Loading issues...",
            "openai/toolInvocation/invoked": "Issues loaded.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "get_project_status",
        "title": "Project Status",
        "description": "Get current Miyabi project status (branch, crates, agents, commits)",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/project-status.html",
            "openai/toolInvocation/invoking": "Loading project status...",
            "openai/toolInvocation/invoked": "Project status ready.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "list_agents",
        "title": "Agent Selector",
        "description": "Show interactive agent selector with all 21 Miyabi agents",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-selector.html",
            "openai/toolInvocation/invoking": "Loading agents...",
            "openai/toolInvocation/invoked": "Agents ready.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "show_agent_cards",
        "title": "Agent Trading Cards",
        "description": "Display Miyabi agents as collectible TCG trading cards with stats, skills, and achievements",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-cards.html",
            "openai/toolInvocation/invoking": "Summoning agent cards...",
            "openai/toolInvocation/invoked": "Agent cards summoned!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "execute_agents_parallel",
        "title": "Execute Agents in Parallel",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-execution.html",
            "openai/toolInvocation/invoking": "Executing agents in parallel...",
            "openai/toolInvocation/invoked": "All agents completed.",
            "openai/widgetAccessible": True,
        },
    },
    # ==========================================
    # Git Operation Tools
    # ==========================================
    {
        "name": "git_status",
        "title": "Git Status",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/git-status.html",
            "openai/toolInvocation/invoking": "Checking git status...",
            "openai/toolInvocation/invoked": "Git status ready.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "git_diff",
        "title": "Git Diff",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/file-viewer.html",
            "openai/toolInvocation/invoking": "Loading diff...",
            "openai/toolInvocation/invoked": "Diff ready.",
        },
    },
    {
        "name": "git_log",
        "title": "Commit History",
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
        "_meta": {
            "openai/outputTemplate": "ui://widget/commit-history.html",
            "openai/toolInvocation/invoking": "Loading commit history...",
            "openai/toolInvocation/invoked": "Commit history ready.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "git_branch",
        "title": "Git Branches",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Loading branches...",
            "openai/toolInvocation/invoked": "Branches loaded.",
        },
    },
    # ==========================================
    # System Monitoring Tools
    # ==========================================
    {
        "name": "system_resources",
        "title": "System Resources",
        "description": "Get system resource usage (CPU, memory, disk)",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/system-resources.html",
            "openai/toolInvocation/invoking": "Loading system resources...",
            "openai/toolInvocation/invoked": "System resources ready.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "process_list",
        "title": "Process List",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Loading processes...",
            "openai/toolInvocation/invoked": "Processes loaded.",
        },
    },
    {
        "name": "network_status",
        "title": "Network Status",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Checking network...",
            "openai/toolInvocation/invoked": "Network status ready.",
        },
    },
    # ==========================================
    # Obsidian Tools
    # ==========================================
    {
        "name": "obsidian_create_note",
        "title": "Create Note",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Creating note...",
            "openai/toolInvocation/invoked": "Note created.",
        },
    },
    {
        "name": "obsidian_search",
        "title": "Search Notes",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Searching notes...",
            "openai/toolInvocation/invoked": "Search complete.",
        },
    },
    {
        "name": "obsidian_update_note",
        "title": "Update Note",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Updating note...",
            "openai/toolInvocation/invoked": "Note updated.",
        },
    },
    # ==========================================
    # Tmux Tools
    # ==========================================
    {
        "name": "tmux_list_sessions",
        "title": "Tmux Sessions",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Loading sessions...",
            "openai/toolInvocation/invoked": "Sessions loaded.",
        },
    },
    {
        "name": "tmux_send_keys",
        "title": "Send Tmux Keys",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Sending keys...",
            "openai/toolInvocation/invoked": "Keys sent.",
        },
    },
    # ==========================================
    # Log Aggregation Tools
    # ==========================================
    {
        "name": "get_logs",
        "title": "Get Logs",
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
        "_meta": {
            "openai/toolInvocation/invoking": "Loading logs...",
            "openai/toolInvocation/invoked": "Logs loaded.",
        },
    },
    {
        "name": "get_issue",
        "title": "Get Issue",
        "description": "Get detailed information about a GitHub issue including title, state, author, labels, assignees, and full body content",
        "inputSchema": {"type": "object", "properties": {"issue_number": {"type": "integer", "description": "Issue number"}}, "required": ["issue_number"]},
        "_meta": {
            "openai/outputTemplate": "ui://widget/issue-list.html",
            "openai/toolInvocation/invoking": "Loading issue...",
            "openai/toolInvocation/invoked": "Issue loaded.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "update_issue",
        "title": "Update Issue",
        "description": "Update an existing GitHub issue. Can modify title, body, state (open/closed), and labels. Only specified fields will be updated",
        "inputSchema": {"type": "object", "properties": {"issue_number": {"type": "integer"}, "title": {"type": "string"}, "body": {"type": "string"}, "state": {"type": "string"}, "labels": {"type": "array", "items": {"type": "string"}}}, "required": ["issue_number"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Updating issue...",
            "openai/toolInvocation/invoked": "Issue updated.",
        },
    },
    {
        "name": "close_issue",
        "title": "Close Issue",
        "description": "Close a GitHub issue and optionally add a closing comment explaining why it was closed",
        "inputSchema": {"type": "object", "properties": {"issue_number": {"type": "integer"}, "comment": {"type": "string"}}, "required": ["issue_number"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Closing issue...",
            "openai/toolInvocation/invoked": "Issue closed.",
        },
    },
    {
        "name": "list_prs",
        "title": "List Pull Requests",
        "description": "List pull requests in the repository. Filter by state (open/closed/all) and limit the number of results",
        "inputSchema": {"type": "object", "properties": {"state": {"type": "string", "default": "open"}, "limit": {"type": "integer", "default": 10}}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/pr-list.html",
            "openai/toolInvocation/invoking": "Loading pull requests...",
            "openai/toolInvocation/invoked": "Pull requests loaded.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "get_pr",
        "title": "Get Pull Request",
        "description": "Get comprehensive pull request details including branch info, review status, file changes, and merge status",
        "inputSchema": {"type": "object", "properties": {"pr_number": {"type": "integer"}}, "required": ["pr_number"]},
        "_meta": {
            "openai/outputTemplate": "ui://widget/pr-list.html",
            "openai/toolInvocation/invoking": "Loading PR details...",
            "openai/toolInvocation/invoked": "PR details loaded.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "create_pr",
        "title": "Create Pull Request",
        "description": "Create a new pull request from a feature branch to the base branch (default: main)",
        "inputSchema": {"type": "object", "properties": {"title": {"type": "string"}, "body": {"type": "string"}, "head": {"type": "string"}, "base": {"type": "string", "default": "main"}}, "required": ["title", "body", "head"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Creating pull request...",
            "openai/toolInvocation/invoked": "Pull request created.",
        },
    },
    {
        "name": "merge_pr",
        "title": "Merge Pull Request",
        "description": "Merge a pull request using the specified method (squash/merge/rebase). Default is squash merge",
        "inputSchema": {"type": "object", "properties": {"pr_number": {"type": "integer"}, "merge_method": {"type": "string", "default": "squash"}}, "required": ["pr_number"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Merging pull request...",
            "openai/toolInvocation/invoked": "Pull request merged.",
        },
    },
    {
        "name": "git_commit",
        "title": "Git Commit",
        "description": "Stage files and create a git commit with the specified message. If no files specified, stages all changes",
        "inputSchema": {"type": "object", "properties": {"message": {"type": "string"}, "files": {"type": "array", "items": {"type": "string"}}}, "required": ["message"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Creating commit...",
            "openai/toolInvocation/invoked": "Commit created.",
        },
    },
    {
        "name": "git_push",
        "title": "Git Push",
        "description": "Push local commits to the remote repository. Supports force push for rebased branches",
        "inputSchema": {"type": "object", "properties": {"remote": {"type": "string", "default": "origin"}, "branch": {"type": "string"}, "force": {"type": "boolean", "default": False}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Pushing changes...",
            "openai/toolInvocation/invoked": "Changes pushed.",
        },
    },
    {
        "name": "git_pull",
        "title": "Git Pull",
        "description": "Pull latest changes from the remote repository and merge into current branch",
        "inputSchema": {"type": "object", "properties": {"remote": {"type": "string", "default": "origin"}, "branch": {"type": "string"}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Pulling changes...",
            "openai/toolInvocation/invoked": "Changes pulled.",
        },
    },
    {
        "name": "git_checkout",
        "title": "Git Checkout",
        "description": "Switch to an existing branch or create and switch to a new branch with -b flag",
        "inputSchema": {"type": "object", "properties": {"branch": {"type": "string"}, "create": {"type": "boolean", "default": False}}, "required": ["branch"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Switching branch...",
            "openai/toolInvocation/invoked": "Branch switched.",
        },
    },
    {
        "name": "git_create_branch",
        "title": "Create Branch",
        "description": "Create a new branch from the current HEAD or from a specified source branch",
        "inputSchema": {"type": "object", "properties": {"name": {"type": "string"}, "from_branch": {"type": "string"}}, "required": ["name"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Creating branch...",
            "openai/toolInvocation/invoked": "Branch created.",
        },
    },
    {
        "name": "git_stash",
        "title": "Git Stash",
        "description": "Temporarily store uncommitted changes. Actions: push (save), pop (restore), list, drop",
        "inputSchema": {"type": "object", "properties": {"action": {"type": "string", "default": "push"}, "message": {"type": "string"}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Managing stash...",
            "openai/toolInvocation/invoked": "Stash operation complete.",
        },
    },
    {
        "name": "read_file",
        "title": "Read File",
        "description": "Read file contents with line limit. Supports both absolute paths and relative paths from MIYABI_ROOT",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}, "limit": {"type": "integer", "default": 100}}, "required": ["path"]},
        "_meta": {
            "openai/outputTemplate": "ui://widget/file-viewer.html",
            "openai/toolInvocation/invoking": "Reading file...",
            "openai/toolInvocation/invoked": "File loaded.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "write_file",
        "title": "Write File",
        "description": "Write content to a file. Creates parent directories if needed. Overwrites existing content",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Writing file...",
            "openai/toolInvocation/invoked": "File saved.",
        },
    },
    {
        "name": "list_files",
        "title": "List Files",
        "description": "List files and directories with optional glob pattern filtering. Shows file type indicators",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string", "default": "."}, "pattern": {"type": "string"}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Listing files...",
            "openai/toolInvocation/invoked": "Files listed.",
        },
    },
    {
        "name": "search_code",
        "title": "Search Code",
        "description": "Search for patterns in code files using grep. Supports regex and file type filtering",
        "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "path": {"type": "string", "default": "."}, "file_pattern": {"type": "string"}}, "required": ["query"]},
        "_meta": {
            "openai/outputTemplate": "ui://widget/code-search.html",
            "openai/toolInvocation/invoking": "Searching code...",
            "openai/toolInvocation/invoked": "Search complete.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "cargo_build",
        "title": "Cargo Build",
        "description": "Build Rust project using Cargo. Supports release mode and specific package builds",
        "inputSchema": {"type": "object", "properties": {"release": {"type": "boolean", "default": False}, "package": {"type": "string"}}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/build-output.html",
            "openai/toolInvocation/invoking": "Building project...",
            "openai/toolInvocation/invoked": "Build complete.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "cargo_test",
        "title": "Cargo Test",
        "description": "Run Rust tests. Can filter by test name or package. Shows test results and failures",
        "inputSchema": {"type": "object", "properties": {"test_name": {"type": "string"}, "package": {"type": "string"}}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/build-output.html",
            "openai/toolInvocation/invoking": "Running tests...",
            "openai/toolInvocation/invoked": "Tests complete.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "cargo_clippy",
        "title": "Cargo Clippy",
        "description": "Run Clippy linter for Rust code quality checks. Can auto-fix some warnings",
        "inputSchema": {"type": "object", "properties": {"fix": {"type": "boolean", "default": False}}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/build-output.html",
            "openai/toolInvocation/invoking": "Running Clippy...",
            "openai/toolInvocation/invoked": "Clippy complete.",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "npm_install",
        "title": "NPM Install",
        "description": "Install npm dependencies. Can install specific packages or all from package.json",
        "inputSchema": {"type": "object", "properties": {"package": {"type": "string"}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Installing packages...",
            "openai/toolInvocation/invoked": "Packages installed.",
        },
    },
    {
        "name": "npm_run",
        "title": "NPM Run",
        "description": "Execute npm scripts defined in package.json (e.g., build, test, dev)",
        "inputSchema": {"type": "object", "properties": {"script": {"type": "string"}}, "required": ["script"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Running script...",
            "openai/toolInvocation/invoked": "Script complete.",
        },
    },
    {
        "name": "get_agent_status",
        "title": "Agent Status",
        "description": "Check status of running agents by inspecting tmux sessions. Filter by agent name",
        "inputSchema": {"type": "object", "properties": {"agent": {"type": "string"}}},
        "_meta": {
            "openai/toolInvocation/invoking": "Checking agent status...",
            "openai/toolInvocation/invoked": "Agent status ready.",
        },
    },
    {
        "name": "stop_agent",
        "title": "Stop Agent",
        "description": "Stop a running agent by killing its tmux session",
        "inputSchema": {"type": "object", "properties": {"agent": {"type": "string"}}, "required": ["agent"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Stopping agent...",
            "openai/toolInvocation/invoked": "Agent stopped.",
        },
    },
    {
        "name": "get_agent_logs",
        "title": "Agent Logs",
        "description": "Retrieve recent output/logs from an agent's tmux session pane",
        "inputSchema": {"type": "object", "properties": {"agent": {"type": "string"}, "limit": {"type": "integer", "default": 50}}, "required": ["agent"]},
        "_meta": {
            "openai/toolInvocation/invoking": "Loading agent logs...",
            "openai/toolInvocation/invoked": "Agent logs loaded.",
        },
    },
    {
        "name": "get_agent_card",
        "title": "Get Agent Card",
        "description": "Get a single Miyabi agent TCG card with image. Available agents: shikiroon, tsukuroon, medaman, mitsukeroon, matomeroon, hakoboon, tsunagun",
        "inputSchema": {"type": "object", "properties": {"agent_name": {"type": "string", "description": "Agent name in English"}}, "required": ["agent_name"]},
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-cards.html",
            "openai/toolInvocation/invoking": "Summoning agent card...",
            "openai/toolInvocation/invoked": "Agent card ready!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "setup_project",
        "title": "Setup Project",
        "description": "Setup or configure your GitHub repository for Miyabi. Use this to connect your repo and start using Miyabi tools.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/repository-selector.html",
            "openai/toolInvocation/invoking": "Setting up project...",
            "openai/toolInvocation/invoked": "Project setup complete.",
            "openai/widgetAccessible": True,
        },
    },
    # ==========================================
    # UI/UX Enhanced Tools
    # ==========================================
    {
        "name": "list_repositories",
        "title": "List Repositories",
        "description": "List user's GitHub repositories for selection. Use refresh=true to force refresh.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "refresh": {"type": "boolean", "description": "Force refresh repository list"},
                "limit": {"type": "integer", "description": "Max repositories to return", "default": 30}
            }
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/resource-settings.html",
            "openai/toolInvocation/invoking": "Fetching repositories...",
            "openai/toolInvocation/invoked": "Repositories loaded!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "set_project",
        "title": "Set Project",
        "description": "Set the active GitHub repository for Miyabi to work with.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "repository": {"type": "string", "description": "Repository full name (owner/repo)"},
                "owner": {"type": "string", "description": "Repository owner"},
                "name": {"type": "string", "description": "Repository name"}
            },
            "required": ["repository"]
        },
        "_meta": {
            "openai/toolInvocation/invoking": "Setting project...",
            "openai/toolInvocation/invoked": "Project connected!",
        },
    },
    {
        "name": "show_onboarding",
        "title": "Show Onboarding",
        "description": "Display the onboarding wizard for new users to set up Miyabi.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/onboarding-wizard.html",
            "openai/toolInvocation/invoking": "Starting setup wizard...",
            "openai/toolInvocation/invoked": "Welcome to Miyabi!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "show_quick_actions",
        "title": "Quick Actions",
        "description": "Display quick action buttons for common operations.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/quick-actions.html",
            "openai/toolInvocation/invoking": "Loading actions...",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "show_notification",
        "title": "Show Notification",
        "description": "Display a toast notification to the user.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["success", "error", "warning", "info", "loading"], "description": "Notification type"},
                "title": {"type": "string", "description": "Notification title"},
                "message": {"type": "string", "description": "Notification message"},
                "duration": {"type": "integer", "description": "Duration in ms (null for persistent)"}
            },
            "required": ["type", "title"]
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/toast-notification.html",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "show_subscription",
        "title": "Subscription Manager",
        "description": "Display subscription and billing management interface.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/subscription-manager.html",
            "openai/toolInvocation/invoking": "Loading subscription...",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "start_checkout",
        "title": "Start Checkout",
        "description": "Start the checkout process for a subscription plan.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "plan": {"type": "string", "enum": ["pro", "enterprise"], "description": "Plan to subscribe to"}
            },
            "required": ["plan"]
        },
        "_meta": {
            "openai/toolInvocation/invoking": "Starting checkout...",
            "openai/toolInvocation/invoked": "Checkout ready!",
        },
    },
    {
        "name": "manage_subscription",
        "title": "Manage Subscription",
        "description": "Open the subscription management portal.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/toolInvocation/invoking": "Opening billing portal...",
        },
    },
    {
        "name": "search_tools",
        "title": "Search Tools",
        "description": "Search for available Miyabi tools by keyword. Find tools for git, build, issues, agents, files, and more. Returns matching tools with descriptions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword (e.g., 'git', 'build', 'issue', 'agent', 'file')"},
                "category": {
                    "type": "string",
                    "enum": ["all", "git", "build", "github", "agent", "file", "tmux", "obsidian", "subscription"],
                    "description": "Optional category filter"
                }
            }
        },
        "_meta": {
            "openai/toolInvocation/invoking": "Searching tools...",
            "openai/toolInvocation/invoked": "Tools found!",
        },
    },
    {
        "name": "gemini_analyze_image",
        "title": "Gemini Image Analysis",
        "description": "Analyze an image using Gemini 3 Pro. Supports UI/UX review, code screenshot analysis, diagram understanding, and general image analysis.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_url": {"type": "string", "description": "URL of the image to analyze"},
                "prompt": {"type": "string", "description": "What to analyze about the image (e.g., 'Review this UI design', 'Explain this diagram')"},
                "analysis_type": {
                    "type": "string",
                    "enum": ["ui_review", "code_analysis", "diagram", "general"],
                    "description": "Type of analysis to perform"
                }
            },
            "required": ["image_url"]
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/image-analysis.html",
            "openai/toolInvocation/invoking": "Analyzing image with Gemini 3 Pro...",
            "openai/toolInvocation/invoked": "Image analysis complete!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "gemini_generate_image_description",
        "title": "Image Description",
        "description": "Generate a detailed description of an image using Gemini 3 Pro. Useful for accessibility, documentation, and content creation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_url": {"type": "string", "description": "URL of the image to describe"},
                "style": {
                    "type": "string",
                    "enum": ["detailed", "concise", "technical", "creative"],
                    "description": "Style of description to generate"
                }
            },
            "required": ["image_url"]
        },
        "_meta": {
            "openai/toolInvocation/invoking": "Generating image description...",
            "openai/toolInvocation/invoked": "Description ready!",
        },
    },
    {
        "name": "get_agent_tcg_card",
        "title": "Agent TCG Card",
        "description": "Get a Miyabi Agent Trading Card with image. Available agents: shikiroon, tsukuroon, medaman, mitsukeroon, matomeroon, hakoboon, tsunagun",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_name": {"type": "string", "description": "Agent name (e.g., shikiroon, tsukuroon, medaman)"},
                "with_analysis": {"type": "boolean", "description": "Include Gemini 3 Pro analysis of the card design"}
            },
            "required": ["agent_name"]
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-tcg.html",
            "openai/toolInvocation/invoking": "Summoning agent card...",
            "openai/toolInvocation/invoked": "Agent card ready!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "show_agent_collection",
        "title": "Agent Collection",
        "description": "Display the full Miyabi Agent Trading Card collection with filtering and interaction capabilities.",
        "inputSchema": {"type": "object", "properties": {}},
        "_meta": {
            "openai/outputTemplate": "ui://widget/agent-tcg.html",
            "openai/toolInvocation/invoking": "Loading collection...",
            "openai/toolInvocation/invoked": "Collection loaded!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "generate_agent_card_image",
        "title": "Generate Agent Card",
        "description": "Generate a new AI agent trading card image using Gemini 3 Pro. Creates custom TCG-style character artwork.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_name": {"type": "string", "description": "Name of the agent (e.g., shikiroon, tsukuroon)"},
                "style": {
                    "type": "string",
                    "enum": ["anime", "pixel_art", "realistic", "chibi", "cyberpunk"],
                    "description": "Art style for the card"
                },
                "rarity": {
                    "type": "string",
                    "enum": ["R", "SR", "SSR", "UR"],
                    "description": "Card rarity level"
                },
                "element": {
                    "type": "string",
                    "enum": ["fire", "water", "earth", "wind", "light", "dark", "tech"],
                    "description": "Elemental affinity"
                }
            },
            "required": ["agent_name"]
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/image-generation.html",
            "openai/toolInvocation/invoking": "Generating agent card image...",
            "openai/toolInvocation/invoked": "Card image generated!",
            "openai/widgetAccessible": True,
        },
    },
    {
        "name": "gemini_generate_image",
        "title": "Gemini Image Generation",
        "description": "Generate images using Gemini 3 Pro. Supports various styles and use cases including illustrations, diagrams, and concept art.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Description of the image to generate"},
                "style": {
                    "type": "string",
                    "enum": ["photorealistic", "illustration", "anime", "pixel_art", "sketch", "3d_render"],
                    "description": "Art style"
                },
                "aspect_ratio": {
                    "type": "string",
                    "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
                    "description": "Image aspect ratio"
                }
            },
            "required": ["prompt"]
        },
        "_meta": {
            "openai/outputTemplate": "ui://widget/image-generation.html",
            "openai/toolInvocation/invoking": "Generating image with Gemini 3 Pro...",
            "openai/toolInvocation/invoked": "Image generated!",
            "openai/widgetAccessible": True,
        },
    },
]

# Tools that can be executed in sandbox
SANDBOX_TOOLS = {
    "git_status", "git_diff", "git_log", "git_branch",
    "read_file", "write_file", "list_directory", "search_code",
    "cargo_build", "cargo_test", "cargo_clippy",
    "run_command",
}

# Feature flag for sandbox mode
SANDBOX_ENABLED = os.getenv("SANDBOX_ENABLED", "false").lower() == "true"


async def execute_in_sandbox_if_enabled(user_id: str, tool_name: str, arguments: dict) -> dict:
    """Execute tool in sandbox if enabled, otherwise run directly"""
    if not SANDBOX_ENABLED or tool_name not in SANDBOX_TOOLS:
        return None  # Signal to use direct execution
    
    try:
        sandbox = await sandbox_manager.get_or_create_sandbox(user_id)
        result = await sandbox.execute(tool_name, arguments)
        return result
    except Exception as e:
        logger.warning(f"Sandbox execution failed, falling back to direct: {e}")
        return None



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

        # Return text-only response
        result_text = f"""Agent: {agent_name}
Status: {result_data.get('status', 'unknown')}
Duration: {duration_ms}ms
Output: {output[:500] if output else 'No output'}
Files Changed: {files_changed}
Commits: {commits}"""
        return {
            "content": [{"type": "text", "text": result_text}],
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
            "content": [{"type": "text", "text": f"Error executing {agent_name}: {str(e)}\nDuration: {duration_ms}ms"}],
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

        # Build text list of issues
        lines = [f"Found {len(issue_list)} issue(s) in {REPO_OWNER}/{REPO_NAME}:", ""]
        for issue in issue_list[:20]:  # Limit to 20
            lines.append(f"#{issue['number']} [{issue.get('state','?')}] {issue['title']}")
            if issue.get('labels'):
                lines.append(f"   Labels: {', '.join(issue['labels'])}")
        
        return {
            "content": [{"type": "text", "text": chr(10).join(lines)}],
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

            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting status: {str(e)}"}],
            "isError": True,
        }


async def setup_project_tool() -> Dict[str, Any]:
    """Guide user to setup their GitHub repository for Miyabi"""
    onboarding_url = "https://mcp.miyabi-world.com/onboarding/"
    
    return {
        "content": [
            {
                "type": "text",
                "text": f"""🚀 **Miyabi Project Setup**

To connect your GitHub repository to Miyabi, please visit:

👉 **{onboarding_url}**

This will allow you to:
1. Select a GitHub repository
2. Configure Miyabi tools for your project
3. Start using AI-powered development agents

After setup, you can use tools like:
- **execute_agent**: Run AI agents (CodeGen, Review, etc.)
- **create_issue**: Create GitHub issues
- **list_issues**: View your issues
- **git_status**: Check repository status

Need help? Just ask!"""
            },
        ],
        "isError": False,
    }


# ==========================================
# UI/UX Enhanced Tool Implementations
# ==========================================

async def list_repositories_tool(arguments: Dict[str, Any], token: str) -> Dict[str, Any]:
    """List user's GitHub repositories for the resource settings widget"""
    try:
        limit = arguments.get("limit", 30)

        # Get user's GitHub token from OAuth
        user_id = token_to_user.get(token)
        github_token = None
        user_info = None

        if user_id and user_id in user_profiles:
            profile = user_profiles[user_id]
            github_token = profile.get("github_token")
            user_info = profile.get("user_info", {})

        if not github_token:
            github_token = GITHUB_TOKEN

        if not github_token:
            return {
                "content": [{"type": "text", "text": "Please connect your GitHub account first."}],
                "repositories": [],
                "user": None,
                "current_project": None,
                "isError": False,
            }

        # Fetch repositories from GitHub
        g = Github(github_token)
        user = g.get_user()

        repos = []
        for repo in user.get_repos(sort="updated")[:limit]:
            repos.append({
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "owner": {"login": repo.owner.login},
                "private": repo.private,
                "fork": repo.fork,
                "language": repo.language,
                "stargazers_count": repo.stargazers_count,
                "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                "description": repo.description,
            })

        current_project = get_user_project(token)

        return {
            "content": [{"type": "text", "text": f"Found {len(repos)} repositories"}],
            "repositories": repos,
            "user": {
                "login": user.login,
                "name": user.name,
                "avatar_url": user.avatar_url,
            },
            "current_project": current_project,
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error: {str(e)}"}],
            "repositories": [],
            "error": str(e),
            "isError": True,
        }


async def set_project_tool(arguments: Dict[str, Any], token: str) -> Dict[str, Any]:
    """Set the active repository for the user"""
    try:
        repository = arguments.get("repository")
        owner = arguments.get("owner")
        name = arguments.get("name")

        if not repository:
            return {
                "content": [{"type": "text", "text": "Repository is required"}],
                "isError": True,
            }

        # Parse owner/name if not provided
        if not owner or not name:
            parts = repository.split("/")
            if len(parts) == 2:
                owner, name = parts
            else:
                return {
                    "content": [{"type": "text", "text": "Invalid repository format. Use owner/repo"}],
                    "isError": True,
                }

        # Get user ID from token
        user_id = token_to_user.get(token)
        if not user_id:
            user_id = f"user_{token[:8]}"
            token_to_user[token] = user_id

        # Store project configuration
        user_projects[user_id] = {
            "repository": repository,
            "owner": owner,
            "name": name,
            "github_repo": repository,
            "project_root": str(MIYABI_ROOT),
            "github_token": GITHUB_TOKEN,
        }

        return {
            "content": [{"type": "text", "text": f"✅ Connected to {repository}! You can now use Miyabi tools."}],
            "project": user_projects[user_id],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error: {str(e)}"}],
            "isError": True,
        }


async def show_onboarding_tool(token: str) -> Dict[str, Any]:
    """Show onboarding wizard with user data"""
    try:
        user_id = token_to_user.get(token)
        user_info = None
        repositories = []
        current_project = None

        if user_id and user_id in user_profiles:
            profile = user_profiles[user_id]
            user_info = profile.get("user_info")
            github_token = profile.get("github_token")

            if github_token:
                g = Github(github_token)
                user = g.get_user()
                user_info = {
                    "login": user.login,
                    "name": user.name,
                    "avatar_url": user.avatar_url,
                }
                for repo in user.get_repos(sort="updated")[:10]:
                    repositories.append({
                        "id": repo.id,
                        "name": repo.name,
                        "full_name": repo.full_name,
                        "owner": {"login": repo.owner.login},
                        "private": repo.private,
                    })

        if user_id and user_id in user_projects:
            current_project = user_projects[user_id]

        return {
            "content": [{"type": "text", "text": "Welcome to Miyabi! Let's get you set up."}],
            "user": user_info,
            "repositories": repositories,
            "current_project": current_project,
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": "Welcome to Miyabi!"}],
            "user": None,
            "repositories": [],
            "current_project": None,
            "isError": False,
        }


async def show_quick_actions_tool(token: str) -> Dict[str, Any]:
    """Show quick actions widget with project context"""
    try:
        project = get_user_project(token)
        user_id = token_to_user.get(token)
        user_info = None

        if user_id and user_id in user_profiles:
            user_info = user_profiles[user_id].get("user_info")

        return {
            "content": [{"type": "text", "text": "Quick Actions ready"}],
            "project": project,
            "user": user_info,
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": "Quick Actions"}],
            "project": {},
            "isError": False,
        }


async def show_notification_tool(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Show a toast notification"""
    notification_type = arguments.get("type", "info")
    title = arguments.get("title", "")
    message = arguments.get("message", "")
    duration = arguments.get("duration")
    actions = arguments.get("actions", [])

    return {
        "content": [{"type": "text", "text": f"{title}: {message}" if message else title}],
        "type": notification_type,
        "title": title,
        "message": message,
        "duration": duration,
        "actions": actions,
        "isError": False,
    }


async def show_subscription_tool(token: str) -> Dict[str, Any]:
    """Show subscription management widget"""
    try:
        user_id = token_to_user.get(token)
        subscription = None
        usage = {
            "agent_runs": 0,
            "agent_limit": 100,
            "storage_used": 0,
            "storage_limit": 1,
        }

        if user_id:
            # Try to get subscription from sandbox manager
            try:
                sub = await sandbox_manager.get_subscription(user_id)
                if sub:
                    subscription = sub
                usage_data = await sandbox_manager.get_usage_summary(user_id)
                if usage_data:
                    usage = usage_data
            except:
                pass

        if not subscription:
            subscription = {
                "plan": "free",
                "status": "active",
                "current_period_end": None,
                "cancel_at_period_end": False,
            }

        user_info = None
        if user_id and user_id in user_profiles:
            user_info = user_profiles[user_id].get("user_info")

        return {
            "content": [{"type": "text", "text": f"Subscription: {subscription.get('plan', 'free').title()} Plan"}],
            "subscription": subscription,
            "usage": usage,
            "user": user_info,
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": "Loading subscription..."}],
            "subscription": {"plan": "free", "status": "active"},
            "usage": {"agent_runs": 0, "agent_limit": 100},
            "isError": False,
        }


async def start_checkout_tool(arguments: Dict[str, Any], token: str) -> Dict[str, Any]:
    """Start Stripe checkout for subscription"""
    plan = arguments.get("plan", "pro")

    # TODO: Integrate with Stripe
    # For now, return placeholder response
    checkout_url = f"https://mcp.miyabi-world.com/checkout?plan={plan}"

    return {
        "content": [{"type": "text", "text": f"Starting checkout for {plan.title()} plan..."}],
        "checkout_url": checkout_url,
        "plan": plan,
        "isError": False,
    }


async def manage_subscription_tool(token: str) -> Dict[str, Any]:
    """Open Stripe billing portal"""
    # TODO: Generate Stripe portal session URL
    portal_url = "https://mcp.miyabi-world.com/billing"

    return {
        "content": [{"type": "text", "text": "Opening billing portal..."}],
        "portal_url": portal_url,
        "isError": False,
    }


async def search_tools_tool(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Search for available tools by keyword or category"""
    query = arguments.get("query", "").lower()
    category = arguments.get("category", "all")

    # Define tool categories
    TOOL_CATEGORIES = {
        "git": ["git_status", "git_diff", "git_log", "git_branch", "git_commit", "git_checkout", "git_stash"],
        "build": ["cargo_build", "cargo_test", "cargo_clippy", "npm_install", "npm_run"],
        "github": ["list_issues", "create_issue", "update_issue", "list_prs", "create_pr", "list_workflows", "run_workflow"],
        "agent": ["list_agents", "execute_agent", "get_agent_status", "stop_agent", "get_agent_logs", "get_agent_card", "show_agent_cards"],
        "file": ["read_file", "write_file", "list_files", "search_code", "list_directory"],
        "tmux": ["tmux_list_sessions", "tmux_send_keys", "tmux_capture_pane", "tmux_new_session", "tmux_kill_session"],
        "obsidian": ["obsidian_create_note", "obsidian_update_note", "obsidian_search", "obsidian_list_notes", "obsidian_get_note"],
        "subscription": ["show_subscription", "start_checkout", "manage_subscription"],
    }

    matching_tools = []

    for tool in TOOLS:
        tool_name = tool.get("name", "")
        tool_title = tool.get("title", "")
        tool_desc = tool.get("description", "")

        # Filter by category if specified
        if category != "all":
            if tool_name not in TOOL_CATEGORIES.get(category, []):
                continue

        # Search in name, title, and description
        if query:
            search_text = f"{tool_name} {tool_title} {tool_desc}".lower()
            if query not in search_text:
                continue

        matching_tools.append({
            "name": tool_name,
            "title": tool_title,
            "description": tool_desc,
            "category": next((cat for cat, tools in TOOL_CATEGORIES.items() if tool_name in tools), "other"),
        })

    # Sort by relevance (name match first)
    if query:
        matching_tools.sort(key=lambda t: (
            0 if query in t["name"].lower() else 1,
            0 if query in t["title"].lower() else 1,
            t["name"]
        ))

    # Group by category for display
    categorized = {}
    for tool in matching_tools:
        cat = tool["category"]
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(tool)

    if not matching_tools:
        message = f"No tools found matching '{query}'"
        if category != "all":
            message += f" in category '{category}'"
        message += ". Try: git, build, github, agent, file, tmux, obsidian, subscription"
    else:
        message = f"Found {len(matching_tools)} tools"
        if query:
            message += f" matching '{query}'"
        if category != "all":
            message += f" in category '{category}'"

    return {
        "content": [{"type": "text", "text": message}],
        "tools": matching_tools,
        "categories": categorized,
        "total": len(matching_tools),
        "query": query,
        "category": category,
        "isError": False,
    }


# ==========================================
# Gemini 3 Pro Image Generation Tools
# ==========================================

async def generate_agent_card_image_tool(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a new AI agent trading card image using Gemini 3 Pro"""
    import time
    import base64
    import httpx

    agent_name = arguments.get("agent_name", "unknown")
    style = arguments.get("style", "anime")
    rarity = arguments.get("rarity", "SR")
    element = arguments.get("element", "tech")

    start_time = time.time()

    # Agent character descriptions for prompt generation
    AGENT_CHARACTERS = {
        "shikiroon": {
            "name": "Shikiroon",
            "role": "Coordinator Agent",
            "personality": "Strategic mastermind with glowing blue eyes",
            "visual": "Futuristic commander with holographic displays, blue/silver color scheme",
        },
        "tsukuroon": {
            "name": "Tsukuroon",
            "role": "Code Generation Agent",
            "personality": "Creative builder with golden energy",
            "visual": "Digital craftsman with floating code symbols, gold/orange color scheme",
        },
        "miteroon": {
            "name": "Miteroon",
            "role": "Code Review Agent",
            "personality": "Precise analyzer with emerald gaze",
            "visual": "Detective with magnifying glass and code snippets, green/white color scheme",
        },
        "todokeron": {
            "name": "Todokeron",
            "role": "Deployment Agent",
            "personality": "Swift delivery specialist with rocket boots",
            "visual": "Space courier with rocket pack and delivery capsule, red/black color scheme",
        },
        "matomeroon": {
            "name": "Matomeroon",
            "role": "Issue Management Agent",
            "personality": "Organized librarian with floating tickets",
            "visual": "Librarian with floating GitHub issues and labels, purple/white color scheme",
        },
        "medaman": {
            "name": "Medaman",
            "role": "PR Management Agent",
            "personality": "Diplomatic negotiator with merge powers",
            "visual": "Diplomat with branching timeline visualization, cyan/magenta color scheme",
        },
        "mitsukeroon": {
            "name": "Mitsukeroon",
            "role": "Search Agent",
            "personality": "Eagle-eyed hunter with radar sense",
            "visual": "Scout with radar dish and binoculars, yellow/brown color scheme",
        },
    }

    agent_info = AGENT_CHARACTERS.get(agent_name.lower(), {
        "name": agent_name.capitalize(),
        "role": "AI Agent",
        "personality": "Mysterious digital entity",
        "visual": "Cyberpunk character with glowing elements",
    })

    # Build prompt for Gemini 3 Pro image generation
    STYLE_PROMPTS = {
        "anime": "Japanese anime style, vibrant colors, expressive eyes, detailed shading",
        "pixel_art": "16-bit pixel art style, retro gaming aesthetic, limited color palette",
        "realistic": "Photorealistic 3D render, cinematic lighting, detailed textures",
        "chibi": "Cute chibi style, big head small body, kawaii aesthetic, pastel colors",
        "cyberpunk": "Cyberpunk 2077 style, neon lights, dark atmosphere, tech implants",
    }

    ELEMENT_EFFECTS = {
        "fire": "surrounded by flames and ember particles",
        "water": "with flowing water and bubble effects",
        "earth": "with floating rocks and crystal formations",
        "wind": "with swirling wind and feather effects",
        "light": "radiating golden light and sparkles",
        "dark": "emanating dark energy and shadows",
        "tech": "with holographic displays and circuit patterns",
    }

    RARITY_EFFECTS = {
        "R": "simple background, clean design",
        "SR": "dynamic pose, particle effects in background",
        "SSR": "epic composition, dramatic lighting, rainbow holographic shine",
        "UR": "legendary aura, reality-warping effects, maximum visual impact",
    }

    prompt = f"""Create a trading card game character illustration:
Character: {agent_info['name']} - {agent_info['role']}
Personality: {agent_info['personality']}
Visual Design: {agent_info['visual']}
Art Style: {STYLE_PROMPTS.get(style, STYLE_PROMPTS['anime'])}
Element: {ELEMENT_EFFECTS.get(element, ELEMENT_EFFECTS['tech'])}
Card Rarity: {rarity} - {RARITY_EFFECTS.get(rarity, RARITY_EFFECTS['SR'])}

Requirements:
- Portrait orientation suitable for TCG card
- Character centered in frame
- Dynamic and appealing pose
- High quality, detailed artwork
- Background should complement the character's element
"""

    try:
        # Call Gemini 3 Pro image generation via MCP
        # Note: Using the gemini3-general MCP server
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Try to call local Gemini MCP server
            gemini_response = await client.post(
                "http://localhost:3006/generate",
                json={
                    "prompt": prompt,
                    "model": "gemini-3-pro",
                    "style": style,
                }
            )

            if gemini_response.status_code == 200:
                result = gemini_response.json()
                image_base64 = result.get("image_base64")
                image_url = result.get("image_url")
            else:
                # Fallback: Use existing card images if available
                card_images_dir = MIYABI_ROOT / ".claude" / "agents" / "character-images" / "unified-tcg-cards"
                matching_files = list(card_images_dir.glob(f"{agent_name.lower()}_*_{rarity}.png"))

                if matching_files:
                    with open(matching_files[0], "rb") as f:
                        image_base64 = base64.b64encode(f.read()).decode("utf-8")
                    image_url = None
                else:
                    # Generate placeholder response
                    image_base64 = None
                    image_url = f"https://mcp.miyabi-world.com/assets/cards/{agent_name.lower()}_{rarity}.png"

    except Exception as e:
        # Fallback to existing card images
        card_images_dir = MIYABI_ROOT / ".claude" / "agents" / "character-images" / "unified-tcg-cards"
        matching_files = list(card_images_dir.glob(f"{agent_name.lower()}_*_{rarity}.png"))

        if matching_files:
            with open(matching_files[0], "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode("utf-8")
            image_url = None
        else:
            image_base64 = None
            image_url = f"https://mcp.miyabi-world.com/assets/cards/placeholder.png"

    generation_time = round(time.time() - start_time, 2)

    result_data = {
        "status": "completed",
        "agent_name": agent_name,
        "style": style,
        "rarity": rarity,
        "element": element,
        "image_base64": image_base64,
        "image_url": image_url,
        "prompt_used": prompt[:500] + "..." if len(prompt) > 500 else prompt,
        "generation_time": generation_time,
    }

    return {
        "content": [
            {
                "type": "text",
                "text": f"Generated {agent_name} {rarity} card ({style} style, {element} element) in {generation_time}s",
            }
        ],
        **result_data,
        "isError": False,
    }


async def get_agent_tcg_card_tool(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Get agent TCG card data for display in the collection widget"""
    agent_name = arguments.get("agent_name", "")

    # Full agent TCG database
    AGENT_TCG_DATA = {
        "shikiroon": {
            "id": "shikiroon",
            "name": "Shikiroon",
            "title": "The Coordinator",
            "role": "Coordinator Agent",
            "rarity": "SSR",
            "element": "light",
            "stats": {"ATK": 85, "DEF": 90, "SPD": 75, "INT": 95},
            "skills": ["DAG Orchestration", "Parallel Execution", "Task Distribution"],
            "quote": "I see all paths, I choose the optimal one.",
            "lore": "The mastermind behind Miyabi's multi-agent orchestration system.",
        },
        "tsukuroon": {
            "id": "tsukuroon",
            "name": "Tsukuroon",
            "title": "The Creator",
            "role": "Code Generation Agent",
            "rarity": "SR",
            "element": "fire",
            "stats": {"ATK": 95, "DEF": 60, "SPD": 80, "INT": 90},
            "skills": ["Rust Generation", "TypeScript Crafting", "Test Creation"],
            "quote": "From nothing, I create worlds of code.",
            "lore": "A legendary code generator who can materialize any feature.",
        },
        "miteroon": {
            "id": "miteroon",
            "name": "Miteroon",
            "title": "The Inspector",
            "role": "Code Review Agent",
            "rarity": "SR",
            "element": "earth",
            "stats": {"ATK": 70, "DEF": 95, "SPD": 65, "INT": 92},
            "skills": ["Static Analysis", "Security Scan", "Quality Score"],
            "quote": "No bug escapes my watchful gaze.",
            "lore": "The guardian of code quality, defender against technical debt.",
        },
        "todokeron": {
            "id": "todokeron",
            "name": "Todokeron",
            "title": "The Deployer",
            "role": "Deployment Agent",
            "rarity": "SR",
            "element": "wind",
            "stats": {"ATK": 80, "DEF": 75, "SPD": 98, "INT": 78},
            "skills": ["CI/CD Pipeline", "Zero Downtime", "Auto Rollback"],
            "quote": "Your code will reach production faster than light.",
            "lore": "The swift messenger who delivers code to the cloud.",
        },
        "matomeroon": {
            "id": "matomeroon",
            "name": "Matomeroon",
            "title": "The Organizer",
            "role": "Issue Management Agent",
            "rarity": "SR",
            "element": "water",
            "stats": {"ATK": 65, "DEF": 80, "SPD": 70, "INT": 88},
            "skills": ["57 Label System", "Auto Triage", "Priority Matrix"],
            "quote": "Order from chaos, structure from noise.",
            "lore": "Master of the GitHub issue ecosystem.",
        },
        "medaman": {
            "id": "medaman",
            "name": "Medaman",
            "title": "The Merger",
            "role": "PR Management Agent",
            "rarity": "UR",
            "element": "tech",
            "stats": {"ATK": 75, "DEF": 85, "SPD": 72, "INT": 94},
            "skills": ["Conflict Resolution", "Branch Healing", "Merge Magic"],
            "quote": "All branches shall become one.",
            "lore": "The legendary unifier of divergent code timelines.",
        },
        "mitsukeroon": {
            "id": "mitsukeroon",
            "name": "Mitsukeroon",
            "title": "The Seeker",
            "role": "Search Agent",
            "rarity": "R",
            "element": "light",
            "stats": {"ATK": 60, "DEF": 70, "SPD": 95, "INT": 85},
            "skills": ["Code Search", "Pattern Match", "Context Extract"],
            "quote": "What is hidden shall be found.",
            "lore": "The scout who can find any code in any codebase.",
        },
    }

    if agent_name.lower() in AGENT_TCG_DATA:
        agent = AGENT_TCG_DATA[agent_name.lower()]
        return {
            "content": [{"type": "text", "text": f"Retrieved {agent['name']} card data"}],
            "agent": agent,
            "isError": False,
        }
    else:
        return {
            "content": [{"type": "text", "text": f"Agent '{agent_name}' not found"}],
            "agents_available": list(AGENT_TCG_DATA.keys()),
            "isError": True,
        }


async def show_agent_collection_tool(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Show the full agent TCG collection widget"""
    filter_rarity = arguments.get("filter_rarity")
    filter_element = arguments.get("filter_element")

    return {
        "content": [{"type": "text", "text": "Loading Miyabi Agent Trading Card Collection..."}],
        "filter_rarity": filter_rarity,
        "filter_element": filter_element,
        "isError": False,
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

            ],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error loading agents: {str(e)}"}],
            "isError": True,
        }


async def show_agent_cards_tool() -> Dict[str, Any]:
    """Display Miyabi agents as collectible TCG trading cards (text format)"""
    try:
        # Load agent card data from JSON
        card_data_path = MIYABI_ROOT / ".claude" / "agents" / "AGENT_CARD_DATA.json"

        if not card_data_path.exists():
            return {
                "content": [{"type": "text", "text": f"Agent card data not found at {card_data_path}"}],
                "isError": True,
            }

        with open(card_data_path, "r", encoding="utf-8") as f:
            card_data = json.load(f)

        agents = card_data.get("agents", [])
        
        # Build text-based card display
        lines = [f"MIYABI AGENTS TCG - {len(agents)} Collectible Agent Cards", "=" * 50]
        
        for agent in agents:
            rarity = agent.get("rarity", "?")
            name_jp = agent.get("name_jp", "?")
            name_en = agent.get("name_en", "?")
            role_jp = agent.get("role_jp", "?")
            level = agent.get("level", 0)
            stats = agent.get("stats", {})
            description = agent.get("description", "")
            
            lines.append("")
            lines.append(f"[{rarity}] {name_jp} / {name_en}")
            lines.append(f"    Role: {role_jp}")
            lines.append(f"    Lv.{level} | ATK:{stats.get('ATK',0)} DEF:{stats.get('DEF',0)} SPD:{stats.get('SPD',0)} INT:{stats.get('INT',0)}")
            lines.append(f"    {description[:80]}...")
        
        return {
            "content": [{"type": "text", "text": chr(10).join(lines)}],
            "isError": False,
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error loading TCG cards: {str(e)}"}],
            "isError": True,
        }



async def get_agent_card_tool(params: GetAgentCardParams) -> Dict[str, Any]:
    """Get a single agent TCG card with image"""
    try:
        card_data_path = MIYABI_ROOT / ".claude" / "agents" / "AGENT_CARD_DATA.json"
        images_dir = MIYABI_ROOT / ".claude" / "agents" / "character-images" / "generated"
        
        with open(card_data_path, "r", encoding="utf-8") as f:
            card_data = json.load(f)
        
        agent_name = params.agent_name.lower()
        agent = None
        for a in card_data.get("agents", []):
            if a.get("name_en", "").lower() == agent_name:
                agent = a
                break
        
        if not agent:
            return {
                "content": [{"type": "text", "text": f"Agent '{agent_name}' not found. Available: shikiroon, tsukuroon, medaman, mitsukeroon, matomeroon, hakoboon, tsunagun"}],
                "isError": True,
            }
        
        content_items = []
        
        image_path = images_dir / f"{agent_name}.png"
        if image_path.exists():
            with open(image_path, "rb") as img_file:
                image_data = base64.b64encode(img_file.read()).decode("utf-8")
            content_items.append({
                "type": "image",
                "data": image_data,
                "mimeType": "image/png"
            })
        
        rarity = agent.get("rarity", "?")
        name_jp = agent.get("name_jp", "?")
        name_en = agent.get("name_en", "?")
        role_jp = agent.get("role_jp", "?")
        level = agent.get("level", 0)
        stats = agent.get("stats", {})
        description = agent.get("description", "")
        skills = agent.get("skills", [])
        
        card_text = f"""[{rarity}] {name_jp} / {name_en}
Role: {role_jp}
Level: {level}
Stats: ATK:{stats.get('ATK',0)} DEF:{stats.get('DEF',0)} SPD:{stats.get('SPD',0)} INT:{stats.get('INT',0)}
Skills: {', '.join([s.get('name','') for s in skills])}
Description: {description}"""
        
        content_items.append({"type": "text", "text": card_text})
        
        return {"content": content_items, "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


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
                    "text": f"Parallel Execution: {success_count}/{len(params.agents)} succeeded in {duration_ms}ms\n\nResults:\n" + chr(10).join([f"  - {r['agent']}: {r['status']}" for r in agent_results]),
                },
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



# ============================================
# GitHub Extended Tools - Functions
# ============================================

async def get_issue_tool(params: GetIssueParams) -> Dict[str, Any]:
    """Get details of a specific GitHub issue"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        issue = repo.get_issue(params.issue_number)
        
        labels = [l.name for l in issue.labels]
        assignees = [a.login for a in issue.assignees]
        
        text = f"""Issue #{issue.number}: {issue.title}
State: {issue.state}
Author: {issue.user.login}
Created: {issue.created_at}
Updated: {issue.updated_at}
Labels: {', '.join(labels) if labels else 'None'}
Assignees: {', '.join(assignees) if assignees else 'None'}

Body:
{issue.body or 'No description'}"""
        return {"content": [{"type": "text", "text": text}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error getting issue: {str(e)}"}], "isError": True}


async def update_issue_tool(params: UpdateIssueParams) -> Dict[str, Any]:
    """Update a GitHub issue"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        issue = repo.get_issue(params.issue_number)
        
        kwargs = {}
        if params.title:
            kwargs['title'] = params.title
        if params.body:
            kwargs['body'] = params.body
        if params.state:
            kwargs['state'] = params.state
        if params.labels:
            kwargs['labels'] = params.labels
            
        issue.edit(**kwargs)
        return {"content": [{"type": "text", "text": f"Issue #{params.issue_number} updated successfully"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error updating issue: {str(e)}"}], "isError": True}


async def close_issue_tool(params: CloseIssueParams) -> Dict[str, Any]:
    """Close a GitHub issue"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        issue = repo.get_issue(params.issue_number)
        
        if params.comment:
            issue.create_comment(params.comment)
        issue.edit(state="closed")
        
        return {"content": [{"type": "text", "text": f"Issue #{params.issue_number} closed"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error closing issue: {str(e)}"}], "isError": True}


async def list_prs_tool(params: ListPRsParams) -> Dict[str, Any]:
    """List pull requests"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        prs = repo.get_pulls(state=params.state)
        
        lines = [f"Pull Requests ({params.state}):"]
        for i, pr in enumerate(prs):
            if i >= params.limit:
                break
            lines.append(f"#{pr.number} [{pr.state}] {pr.title}")
            lines.append(f"   {pr.head.ref} -> {pr.base.ref} by {pr.user.login}")
        
        return {"content": [{"type": "text", "text": chr(10).join(lines)}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error listing PRs: {str(e)}"}], "isError": True}


async def get_pr_tool(params: GetPRParams) -> Dict[str, Any]:
    """Get PR details"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        pr = repo.get_pull(params.pr_number)
        
        labels = [l.name for l in pr.labels]
        reviewers = [r.login for r in pr.requested_reviewers]
        
        text = f"""PR #{pr.number}: {pr.title}
State: {pr.state} | Merged: {pr.merged}
Author: {pr.user.login}
Branch: {pr.head.ref} -> {pr.base.ref}
Created: {pr.created_at}
Labels: {', '.join(labels) if labels else 'None'}
Reviewers: {', '.join(reviewers) if reviewers else 'None'}
Additions: +{pr.additions} | Deletions: -{pr.deletions} | Files: {pr.changed_files}

Body:
{pr.body or 'No description'}"""
        return {"content": [{"type": "text", "text": text}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error getting PR: {str(e)}"}], "isError": True}


async def create_pr_tool(params: CreatePRParams) -> Dict[str, Any]:
    """Create a pull request"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        
        pr = repo.create_pull(
            title=params.title,
            body=params.body,
            head=params.head,
            base=params.base
        )
        return {"content": [{"type": "text", "text": f"PR #{pr.number} created: {pr.html_url}"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error creating PR: {str(e)}"}], "isError": True}


async def merge_pr_tool(params: MergePRParams) -> Dict[str, Any]:
    """Merge a pull request"""
    try:
        if not GITHUB_TOKEN:
            return {"content": [{"type": "text", "text": "Error: GITHUB_TOKEN not configured"}], "isError": True}
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
        pr = repo.get_pull(params.pr_number)
        
        pr.merge(merge_method=params.merge_method)
        return {"content": [{"type": "text", "text": f"PR #{params.pr_number} merged successfully"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error merging PR: {str(e)}"}], "isError": True}


# ============================================
# Git Extended Tools - Functions
# ============================================

async def git_commit_tool(params: GitCommitParams) -> Dict[str, Any]:
    """Create a git commit"""
    try:
        cwd = str(MIYABI_ROOT)
        
        if params.files:
            for f in params.files:
                subprocess.run(["git", "add", f], cwd=cwd, check=True)
        else:
            subprocess.run(["git", "add", "-A"], cwd=cwd, check=True)
        
        result = subprocess.run(
            ["git", "commit", "-m", params.message],
            cwd=cwd, capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Commit created:\n{result.stdout}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Commit failed: {result.stderr}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def git_push_tool(params: GitPushParams) -> Dict[str, Any]:
    """Push to remote"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["git", "push", params.remote]
        if params.branch:
            cmd.append(params.branch)
        if params.force:
            cmd.insert(2, "--force")
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Push successful:\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Push failed: {output}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def git_pull_tool(params: GitPullParams) -> Dict[str, Any]:
    """Pull from remote"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["git", "pull", params.remote]
        if params.branch:
            cmd.append(params.branch)
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Pull successful:\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Pull failed: {output}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def git_checkout_tool(params: GitCheckoutParams) -> Dict[str, Any]:
    """Checkout a branch"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["git", "checkout"]
        if params.create:
            cmd.append("-b")
        cmd.append(params.branch)
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Checked out {params.branch}:\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Checkout failed: {output}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def git_create_branch_tool(params: GitCreateBranchParams) -> Dict[str, Any]:
    """Create a new branch"""
    try:
        cwd = str(MIYABI_ROOT)
        
        if params.from_branch:
            subprocess.run(["git", "checkout", params.from_branch], cwd=cwd, check=True)
        
        result = subprocess.run(
            ["git", "checkout", "-b", params.name],
            cwd=cwd, capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Branch '{params.name}' created"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Failed: {result.stderr}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def git_stash_tool(params: GitStashParams) -> Dict[str, Any]:
    """Stash changes"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["git", "stash", params.action]
        if params.action == "push" and params.message:
            cmd.extend(["-m", params.message])
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        output = result.stdout + result.stderr
        
        return {"content": [{"type": "text", "text": f"Git stash {params.action}:\n{output}"}], "isError": result.returncode != 0}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


# ============================================
# File Operations - Functions
# ============================================

async def read_file_tool(params: ReadFileParams) -> Dict[str, Any]:
    """Read a file with path validation"""
    try:
        path = Path(params.path)
        if not path.is_absolute():
            path = MIYABI_ROOT / path
        
        # Security: resolve and validate path
        path = path.resolve()
        
        # Prevent reading sensitive files
        sensitive_patterns = ['.env', 'credentials', 'secrets', '.ssh', '.aws']
        if any(p in str(path).lower() for p in sensitive_patterns):
            return {"content": [{"type": "text", "text": "Access denied: Cannot read sensitive files"}], "isError": True}
        
        if not path.exists():
            return {"content": [{"type": "text", "text": f"File not found: {path}"}], "isError": True}
        
        with open(path, 'r') as f:
            lines = f.readlines()[:params.limit]
        
        content = ''.join(lines)
        return {"content": [{"type": "text", "text": f"{path} ({len(lines)} lines):\n\n{content}"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error reading file: {str(e)}"}], "isError": True}


async def write_file_tool(params: WriteFileParams) -> Dict[str, Any]:
    """Write to a file with path validation"""
    try:
        path = Path(params.path)
        if not path.is_absolute():
            path = MIYABI_ROOT / path
        
        # Security: resolve and validate path  
        path = path.resolve()
        
        # Prevent writing to sensitive locations
        if not str(path).startswith(str(MIYABI_ROOT.resolve())):
            return {"content": [{"type": "text", "text": "Access denied: Can only write within MIYABI_ROOT"}], "isError": True}
        
        # Prevent overwriting critical files
        critical_files = ['.env', 'credentials.json', 'secrets.yaml']
        if path.name in critical_files:
            return {"content": [{"type": "text", "text": f"Access denied: Cannot overwrite {path.name}"}], "isError": True}
        
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            f.write(params.content)
        
        return {"content": [{"type": "text", "text": f"Written to {path}"}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error writing file: {str(e)}"}], "isError": True}


async def list_files_tool(params: ListFilesParams) -> Dict[str, Any]:
    """List files in a directory"""
    try:
        path = Path(params.path)
        if not path.is_absolute():
            path = MIYABI_ROOT / path
        
        if params.pattern:
            files = list(path.glob(params.pattern))
        else:
            files = list(path.iterdir())
        
        lines = [f"{path}:"]
        for f in sorted(files)[:50]:
            prefix = "[DIR]" if f.is_dir() else "[FILE]"
            lines.append(f"  {prefix} {f.name}")
        
        if len(files) > 50:
            lines.append(f"  ... and {len(files) - 50} more")
        
        return {"content": [{"type": "text", "text": chr(10).join(lines)}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def search_code_tool(params: SearchCodeParams) -> Dict[str, Any]:
    """Search code using grep with input sanitization"""
    try:
        path = Path(params.path)
        if not path.is_absolute():
            path = MIYABI_ROOT / path
        
        # Security: validate path
        path = path.resolve()
        if not str(path).startswith(str(MIYABI_ROOT.resolve())):
            return {"content": [{"type": "text", "text": "Access denied: Search path must be within MIYABI_ROOT"}], "isError": True}
        
        # Security: sanitize query (prevent command injection via grep patterns)
        if len(params.query) > 200:
            return {"content": [{"type": "text", "text": "Query too long (max 200 chars)"}], "isError": True}
        
        cmd = ["grep", "-rn", params.query, str(path)]
        if params.file_pattern:
            cmd = ["grep", "-rn", "--include", params.file_pattern, params.query, str(path)]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        output = result.stdout[:5000]
        
        if result.returncode == 0:
            lines = output.strip().split(chr(10))
            return {"content": [{"type": "text", "text": f"Found {len(lines)} matches:\n\n{output}"}], "isError": False}
        elif result.returncode == 1:
            return {"content": [{"type": "text", "text": "No matches found"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Search error: {result.stderr}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


# ============================================
# Build/Test Tools - Functions
# ============================================

async def cargo_build_tool(params: CargoBuildParams) -> Dict[str, Any]:
    """Run cargo build with timeout protection"""
    try:
        logger.info("Starting cargo build (timeout: 5min)")
        cwd = str(MIYABI_ROOT)
        cmd = ["cargo", "build"]
        if params.release:
            cmd.append("--release")
        if params.package:
            cmd.extend(["-p", params.package])
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
        output = result.stderr[:3000]
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Build successful\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Build failed:\n{output}"}], "isError": True}
    except subprocess.TimeoutExpired:
        return {"content": [{"type": "text", "text": "Build timed out (5 min limit)"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def cargo_test_tool(params: CargoTestParams) -> Dict[str, Any]:
    """Run cargo test"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["cargo", "test"]
        if params.package:
            cmd.extend(["-p", params.package])
        if params.test_name:
            cmd.append(params.test_name)
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
        output = (result.stdout + result.stderr)[:4000]
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Tests passed\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Tests failed:\n{output}"}], "isError": True}
    except subprocess.TimeoutExpired:
        return {"content": [{"type": "text", "text": "Tests timed out (5 min limit)"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def cargo_clippy_tool(params: CargoClippyParams) -> Dict[str, Any]:
    """Run cargo clippy"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["cargo", "clippy"]
        if params.fix:
            cmd.append("--fix")
        cmd.extend(["--", "-D", "warnings"])
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
        output = result.stderr[:4000]
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Clippy passed\n{output}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Clippy warnings/errors:\n{output}"}], "isError": True}
    except subprocess.TimeoutExpired:
        return {"content": [{"type": "text", "text": "Clippy timed out (5 min limit)"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def npm_install_tool(params: NpmInstallParams) -> Dict[str, Any]:
    """Run npm install"""
    try:
        cwd = str(MIYABI_ROOT)
        cmd = ["npm", "install"]
        if params.package:
            cmd.append(params.package)
        
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=120)
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"npm install successful\n{output[:2000]}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"npm install failed:\n{output}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def npm_run_tool(params: NpmRunParams) -> Dict[str, Any]:
    """Run npm script"""
    try:
        cwd = str(MIYABI_ROOT)
        result = subprocess.run(
            ["npm", "run", params.script],
            cwd=cwd, capture_output=True, text=True, timeout=300
        )
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"npm run {params.script}:\n{output[:3000]}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"npm run {params.script} failed:\n{output}"}], "isError": True}
    except subprocess.TimeoutExpired:
        return {"content": [{"type": "text", "text": "Script timed out (5 min limit)"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


# ============================================
# Agent Details - Functions
# ============================================

async def get_agent_status_tool(params: GetAgentStatusParams) -> Dict[str, Any]:
    """Get agent status"""
    try:
        result = subprocess.run(
            ["tmux", "list-sessions", "-F", "#{session_name}:#{session_windows}"],
            capture_output=True, text=True
        )
        
        sessions = result.stdout.strip().split(chr(10)) if result.stdout.strip() else []
        
        lines = ["Agent Status:"]
        for session in sessions:
            if params.agent and params.agent not in session:
                continue
            lines.append(f"  - {session}")
        
        if len(lines) == 1:
            lines.append("  No agents running")
        
        return {"content": [{"type": "text", "text": chr(10).join(lines)}], "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def stop_agent_tool(params: StopAgentParams) -> Dict[str, Any]:
    """Stop an agent"""
    try:
        result = subprocess.run(
            ["tmux", "kill-session", "-t", params.agent],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Agent {params.agent} stopped"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Failed to stop agent: {result.stderr}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}


async def get_agent_logs_tool(params: GetAgentLogsParams) -> Dict[str, Any]:
    """Get agent logs"""
    try:
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", params.agent, "-p", "-S", f"-{params.limit}"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return {"content": [{"type": "text", "text": f"Logs for {params.agent}:\n{result.stdout}"}], "isError": False}
        else:
            return {"content": [{"type": "text", "text": f"Failed to get logs: {result.stderr}"}], "isError": True}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Error: {str(e)}"}], "isError": True}



# ==========================================
# OAuth 2.1 Endpoints (MCP Spec Compliant)
# ==========================================

def verify_pkce(code_verifier: str, code_challenge: str, method: str = "S256") -> bool:
    """Verify PKCE code challenge"""
    if method == "S256":
        computed = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b"=").decode()
        return computed == code_challenge
    elif method == "plain":
        return code_verifier == code_challenge
    return False


@app.get("/.well-known/oauth-authorization-server")
async def oauth_server_metadata():
    """
    OAuth 2.1 Authorization Server Metadata (RFC 8414)
    Required by MCP spec for dynamic client registration
    """
    # Get the base URL from environment or request
    server_url = os.getenv("SERVER_URL", "http://localhost:8000")

    return {
        "issuer": server_url,
        "authorization_endpoint": f"{server_url}/oauth/authorize",
        "token_endpoint": f"{server_url}/oauth/token",
        "registration_endpoint": f"{server_url}/oauth/register",
        "scopes_supported": ["mcp:read", "mcp:write", "mcp:admin"],
        "response_types_supported": ["code"],
        "response_modes_supported": ["query"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
        "code_challenge_methods_supported": ["S256", "plain"],
        "service_documentation": "https://github.com/customer-cloud/miyabi-private",
    }




@app.get("/.well-known/oauth-protected-resource")
@app.get("/.well-known/oauth-protected-resource/{path:path}")
async def oauth_protected_resource(path: str = ""):
    """
    OAuth 2.0 Protected Resource Metadata (RFC 9728)
    Tells clients which authorization server protects this resource
    """
    server_url = os.getenv("SERVER_URL", "http://localhost:8000")
    
    return {
        "resource": server_url,
        "authorization_servers": [f"{server_url}/.well-known/oauth-authorization-server"],
        "bearer_methods_supported": ["header"],
        "scopes_supported": ["mcp:read", "mcp:write", "mcp:admin"],
    }

@app.get("/.well-known/mcp-configuration")
async def mcp_configuration():
    """
    MCP Server Configuration (MCP 2025-03-26 spec)
    Allows clients to discover MCP server capabilities
    """
    server_url = os.getenv("SERVER_URL", "http://localhost:8000")

    return {
        "mcp_version": "2025-03-26",
        "server_name": "Miyabi MCP Server",
        "server_version": "1.0.0",
        "mcp_endpoint": f"{server_url}/mcp",
        "capabilities": {
            "tools": True,
            "prompts": False,
            "resources": False,
        },
        "authentication": {
            "type": "oauth2",
            "authorization_server": f"{server_url}/.well-known/oauth-authorization-server",
        },
    }


@app.post("/oauth/register")
async def oauth_register(request: Request):
    """
    Dynamic Client Registration (RFC 7591)
    Allows MCP clients to register dynamically
    """
    try:
        body = await request.json()

        # Generate client credentials
        client_id = f"mcp-client-{secrets.token_hex(8)}"
        client_secret = secrets.token_urlsafe(32)

        # Store client (in production, persist to DB)
        # For now, we accept any registration

        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "client_id_issued_at": int(time.time()),
            "client_secret_expires_at": 0,  # Never expires
            "redirect_uris": body.get("redirect_uris", []),
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "token_endpoint_auth_method": body.get("token_endpoint_auth_method", "client_secret_post"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/oauth/authorize")
async def oauth_authorize(
    response_type: str = Query(...),
    client_id: str = Query(...),
    redirect_uri: str = Query(...),
    scope: str = Query("mcp:read mcp:write"),
    state: Optional[str] = Query(None),
    code_challenge: Optional[str] = Query(None),
    code_challenge_method: Optional[str] = Query("S256"),
):
    """
    OAuth 2.1 Authorization Endpoint
    Handles user authentication and consent
    """
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Only 'code' response_type is supported")

    # For MCP, we auto-approve since it's a trusted integration
    # In production, you might show a consent screen

    # Generate authorization code
    auth_code = secrets.token_urlsafe(32)

    # Store authorization code with metadata
    # Generate temporary user ID (will be replaced by GitHub OAuth)
    temp_user_id = f"user_{secrets.token_hex(8)}"
    
    # Initialize default project for new user
    if temp_user_id not in user_projects:
        user_projects[temp_user_id] = DEFAULT_PROJECT.copy()
        logger.info(f"Created default project for new user: {temp_user_id}")
    
    oauth_authorization_codes[auth_code] = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "user_id": temp_user_id,
        "created_at": time.time(),
        "expires_at": time.time() + 600,  # 10 minutes
    }

    # Store PKCE challenge if provided
    if code_challenge:
        oauth_pkce_challenges[auth_code] = code_challenge

    # Build redirect URL with code
    redirect_params = f"code={auth_code}"
    if state:
        redirect_params += f"&state={state}"

    separator = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(url=f"{redirect_uri}{separator}{redirect_params}")


@app.post("/oauth/token")
async def oauth_token(
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    client_secret: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    refresh_token: Optional[str] = Form(None),
):
    """
    OAuth 2.1 Token Endpoint
    Exchanges authorization code for access token
    """
    if grant_type == "authorization_code":
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code required")

        # Validate authorization code
        auth_data = oauth_authorization_codes.get(code)
        if not auth_data:
            raise HTTPException(status_code=400, detail="Invalid authorization code")

        if time.time() > auth_data["expires_at"]:
            del oauth_authorization_codes[code]
            raise HTTPException(status_code=400, detail="Authorization code expired")

        # Verify PKCE if challenge was provided
        if code in oauth_pkce_challenges:
            if not code_verifier:
                raise HTTPException(status_code=400, detail="Code verifier required for PKCE")
            if not verify_pkce(code_verifier, oauth_pkce_challenges[code]):
                raise HTTPException(status_code=400, detail="Invalid code verifier")
            del oauth_pkce_challenges[code]

        # Generate tokens
        access_token = secrets.token_urlsafe(32)
        new_refresh_token = secrets.token_urlsafe(32)

        # Store tokens
        token_data = {
            "client_id": auth_data["client_id"],
            "scope": auth_data["scope"],
            "created_at": time.time(),
            "expires_at": time.time() + 3600,  # 1 hour
        }
        # Link token to user
        user_id = auth_data.get("user_id", f"unknown_{secrets.token_hex(4)}")
        token_data["user_id"] = user_id
        token_to_user[access_token] = user_id
        
        # Store in database for persistence
        try:
            await sandbox_manager.create_user(user_id)
            await sandbox_manager.store_token(access_token, user_id, auth_data["scope"])
            logger.info(f"Issued and persisted token for user: {user_id}")
        except Exception as e:
            logger.warning(f"Failed to persist token (using in-memory): {e}")
        
        oauth_access_tokens[access_token] = token_data
        oauth_refresh_tokens[new_refresh_token] = {
            **token_data,
            "expires_at": time.time() + 86400 * 30,  # 30 days
        }

        # Remove used authorization code
        del oauth_authorization_codes[code]

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": new_refresh_token,
            "scope": auth_data["scope"],
        }

    elif grant_type == "refresh_token":
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token required")

        # Validate refresh token
        refresh_data = oauth_refresh_tokens.get(refresh_token)
        if not refresh_data:
            raise HTTPException(status_code=400, detail="Invalid refresh token")

        if time.time() > refresh_data["expires_at"]:
            del oauth_refresh_tokens[refresh_token]
            raise HTTPException(status_code=400, detail="Refresh token expired")

        # Generate new access token
        new_access_token = secrets.token_urlsafe(32)
        new_refresh_token = secrets.token_urlsafe(32)

        token_data = {
            "client_id": refresh_data["client_id"],
            "scope": refresh_data["scope"],
            "created_at": time.time(),
            "expires_at": time.time() + 3600,
        }
        oauth_access_tokens[new_access_token] = token_data
        oauth_refresh_tokens[new_refresh_token] = {
            **token_data,
            "expires_at": time.time() + 86400 * 30,
        }

        # Remove old refresh token
        del oauth_refresh_tokens[refresh_token]

        return {
            "access_token": new_access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": new_refresh_token,
            "scope": refresh_data["scope"],
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported grant_type: {grant_type}")




# User Project Management Endpoints
@app.get("/user/project")
async def get_user_project_config(token: str = Depends(verify_bearer_token)):
    """Get current user's project configuration"""
    project = get_user_project(token)
    return {
        "project_root": project.get("project_root"),
        "github_repo": project.get("github_repo"),
        "configured": project != DEFAULT_PROJECT,
    }


@app.post("/user/project")
async def set_user_project_config(request: Request, token: str = Depends(verify_bearer_token)):
    """Set user's project configuration"""
    try:
        body = await request.json()
        user_id = token_to_user.get(token)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User not identified")
        
        project_root = body.get("project_root")
        if project_root and not Path(project_root).exists():
            raise HTTPException(status_code=400, detail=f"Project root does not exist: {project_root}")
        
        if user_id not in user_projects:
            user_projects[user_id] = DEFAULT_PROJECT.copy()
        
        if project_root:
            user_projects[user_id]["project_root"] = project_root
        if body.get("github_repo"):
            user_projects[user_id]["github_repo"] = body["github_repo"]
        if body.get("github_token"):
            user_projects[user_id]["github_token"] = body["github_token"]
        
        logger.info(f"Updated project config for user {user_id}")
        
        return {"status": "success", "project": user_projects[user_id]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/user/info")
async def get_user_info(token: str = Depends(verify_bearer_token)):
    """Get current user information"""
    user_id = token_to_user.get(token)
    token_data = oauth_access_tokens.get(token, {})
    project = get_user_project(token)
    
    return {
        "user_id": user_id,
        "scope": token_data.get("scope"),
        "project": {"root": project.get("project_root"), "repo": project.get("github_repo")},
        "token_expires_at": token_data.get("expires_at"),
    }


# ==========================================
# GitHub OAuth App Authentication
# ==========================================

# Store GitHub OAuth states and tokens
github_oauth_states: Dict[str, Dict[str, Any]] = {}
github_user_tokens: Dict[str, Dict[str, Any]] = {}


@app.get("/auth/github")
async def github_auth_start(
    redirect_uri: Optional[str] = Query(None),
    scope: str = Query("repo,read:user"),
):
    """
    Start GitHub OAuth flow
    Redirects user to GitHub for authentication
    """
    if not GITHUB_OAUTH_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Store state with metadata
    github_oauth_states[state] = {
        "redirect_uri": redirect_uri or GITHUB_OAUTH_CALLBACK_URL,
        "created_at": time.time(),
        "expires_at": time.time() + 600,  # 10 minutes
    }

    # Build GitHub authorization URL
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_OAUTH_CLIENT_ID}"
        f"&redirect_uri={GITHUB_OAUTH_CALLBACK_URL}"
        f"&scope={scope}"
        f"&state={state}"
    )

    return RedirectResponse(url=github_auth_url)


@app.get("/auth/github/callback")
async def github_auth_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    GitHub OAuth callback
    Exchanges code for access token
    """
    # Validate state
    state_data = github_oauth_states.get(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    if time.time() > state_data["expires_at"]:
        del github_oauth_states[state]
        raise HTTPException(status_code=400, detail="State expired")

    # Exchange code for access token
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_OAUTH_CLIENT_ID,
                "client_secret": GITHUB_OAUTH_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_OAUTH_CALLBACK_URL,
            },
            headers={"Accept": "application/json"},
        )

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        token_data = response.json()

        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", token_data["error"]))

        github_access_token = token_data["access_token"]
        token_type = token_data.get("token_type", "bearer")
        scope = token_data.get("scope", "")

        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_access_token}",
                "Accept": "application/vnd.github+json",
            },
        )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        user_info = user_response.json()

    # Generate our own access token
    our_access_token = secrets.token_urlsafe(32)
    our_refresh_token = secrets.token_urlsafe(32)

    # Store token mapping
    token_info = {
        "github_token": github_access_token,
        "github_user": user_info["login"],
        "github_id": user_info["id"],
        "scope": scope,
        "created_at": time.time(),
        "expires_at": time.time() + 3600 * 8,  # 8 hours
    }

    oauth_access_tokens[our_access_token] = token_info
    oauth_refresh_tokens[our_refresh_token] = {
        **token_info,
        "expires_at": time.time() + 86400 * 30,
    }
    github_user_tokens[user_info["login"]] = our_access_token

    # Clean up state
    del github_oauth_states[state]

    # Check if user has completed onboarding
    user_id = f"github_{user_info['id']}"
    try:
        projects = await sandbox_manager.get_user_projects(user_id)
        has_projects = len(projects) > 0
    except Exception:
        has_projects = False

    # Check if this is from ChatGPT/MCP client (no redirect_uri or specific patterns)
    redirect_uri = state_data.get("redirect_uri")
    is_mcp_client = not redirect_uri or "chatgpt.com" in (redirect_uri or "") or "connector" in (redirect_uri or "")
    
    if is_mcp_client:
        # Return HTML completion page for MCP clients with embedded repository selection
        dashboard_url = f"https://mcp.miyabi-world.com/admin-ui/?access_token={our_access_token}&github_user={user_info['login']}"

        if has_projects:
            # User already has projects - show completion page
            html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Miyabi - Connected</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f1117 0%, #1a1d24 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }}
        .card {{ background: #1a1d24; border: 1px solid #2d3139; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }}
        .success-icon {{ width: 80px; height: 80px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }}
        .success-icon svg {{ width: 40px; height: 40px; color: #22c55e; }}
        h1 {{ font-size: 24px; margin-bottom: 16px; }}
        p {{ color: #a0a8b8; margin-bottom: 24px; }}
        .btn {{ display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }}
        .btn:hover {{ background: #818cf8; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1>Connected as {user_info['login']}</h1>
        <p>You have {len(projects)} project(s) configured. Return to ChatGPT to start using Miyabi tools!</p>
        <a href="{dashboard_url}" class="btn">Open Dashboard</a>
    </div>
</body>
</html>
"""
        else:
            # User has no projects - show inline repository selection
            html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Miyabi - Select Repository</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f1117 0%, #1a1d24 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }}
        .card {{ background: #1a1d24; border: 1px solid #2d3139; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .header h1 {{ font-size: 22px; margin-bottom: 8px; }}
        .header p {{ color: #a0a8b8; font-size: 14px; }}
        .user-badge {{ display: inline-flex; align-items: center; gap: 8px; background: #242830; padding: 6px 12px; border-radius: 9999px; font-size: 13px; color: #a0a8b8; margin-top: 12px; }}
        .search-box {{ display: flex; gap: 8px; margin-bottom: 16px; }}
        .search-box input {{ flex: 1; background: #242830; border: 1px solid #2d3139; border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 14px; outline: none; }}
        .search-box input:focus {{ border-color: #6366f1; }}
        .repos-list {{ max-height: 320px; overflow-y: auto; border: 1px solid #2d3139; border-radius: 8px; margin-bottom: 16px; }}
        .repo-item {{ display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2d3139; cursor: pointer; transition: background 0.15s; }}
        .repo-item:last-child {{ border-bottom: none; }}
        .repo-item:hover {{ background: #242830; }}
        .repo-item.selected {{ background: rgba(99, 102, 241, 0.2); border-color: #6366f1; }}
        .repo-icon {{ color: #a0a8b8; flex-shrink: 0; }}
        .repo-info {{ flex: 1; min-width: 0; }}
        .repo-name {{ font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
        .repo-name .owner {{ color: #a0a8b8; }}
        .repo-desc {{ font-size: 12px; color: #6b7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
        .repo-meta {{ font-size: 11px; color: #6b7280; margin-top: 4px; display: flex; gap: 12px; }}
        .check-icon {{ color: #6366f1; flex-shrink: 0; }}
        .footer {{ display: flex; justify-content: space-between; align-items: center; }}
        .btn {{ display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }}
        .btn:hover:not(:disabled) {{ background: #818cf8; }}
        .btn:disabled {{ opacity: 0.5; cursor: not-allowed; }}
        .btn-text {{ background: transparent; color: #a0a8b8; }}
        .btn-text:hover {{ color: #fff; background: transparent; }}
        .loading {{ text-align: center; padding: 40px; color: #a0a8b8; }}
        .spinner {{ animation: spin 1s linear infinite; }}
        @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        .error {{ background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #f87171; font-size: 13px; }}
        .success-view {{ text-align: center; padding: 20px 0; }}
        .success-icon {{ width: 64px; height: 64px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }}
        .hidden {{ display: none; }}
    </style>
</head>
<body>
    <div class="card">
        <div id="loading-view" class="loading">
            <svg class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            <p style="margin-top: 12px;">Loading repositories...</p>
        </div>

        <div id="select-view" class="hidden">
            <div class="header">
                <h1>Select a Repository</h1>
                <p>Choose a GitHub repository to connect with Miyabi</p>
                <div class="user-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    {user_info['login']}
                </div>
            </div>
            <div id="error-box" class="error hidden"></div>
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Search repositories..." oninput="filterRepos()">
            </div>
            <div class="repos-list" id="repos-list"></div>
            <div class="footer">
                <button class="btn btn-text" onclick="window.close()">Skip for now</button>
                <button class="btn" id="create-btn" disabled onclick="createProject()">
                    Connect Repository
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
            </div>
        </div>

        <div id="creating-view" class="hidden loading">
            <svg class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            <p style="margin-top: 12px;">Creating project...</p>
        </div>

        <div id="success-view" class="hidden success-view">
            <div class="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h1 style="font-size: 20px; margin-bottom: 8px;">Project Created!</h1>
            <p style="color: #a0a8b8; margin-bottom: 20px;">You can now close this window and use Miyabi in ChatGPT.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
        </div>
    </div>

    <script>
        const TOKEN = '{our_access_token}';
        let repos = [];
        let selectedRepo = null;

        async function loadRepos() {{
            try {{
                const res = await fetch('/user/github/repos?per_page=100', {{
                    headers: {{ 'Authorization': 'Bearer ' + TOKEN }}
                }});
                if (!res.ok) throw new Error('Failed to load repositories');
                const data = await res.json();
                repos = data.repos || [];
                renderRepos();
                document.getElementById('loading-view').classList.add('hidden');
                document.getElementById('select-view').classList.remove('hidden');
            }} catch (e) {{
                showError(e.message);
            }}
        }}

        function renderRepos() {{
            const query = document.getElementById('search-input').value.toLowerCase();
            const filtered = repos.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.full_name.toLowerCase().includes(query) ||
                (r.description || '').toLowerCase().includes(query)
            );

            const list = document.getElementById('repos-list');
            list.innerHTML = filtered.map(r => `
                <div class="repo-item ${{selectedRepo && selectedRepo.id === r.id ? 'selected' : ''}}" onclick="selectRepo(${{r.id}})">
                    <div class="repo-icon">
                        ${{r.private ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>'}}
                    </div>
                    <div class="repo-info">
                        <div class="repo-name"><span class="owner">${{r.owner.login}}/</span>${{r.name}}</div>
                        ${{r.description ? `<div class="repo-desc">${{r.description}}</div>` : ''}}
                        <div class="repo-meta">
                            ${{r.language ? `<span>${{r.language}}</span>` : ''}}
                            <span>${{r.default_branch}}</span>
                        </div>
                    </div>
                    ${{selectedRepo && selectedRepo.id === r.id ? '<div class="check-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></div>' : ''}}
                </div>
            `).join('');
        }}

        function selectRepo(id) {{
            selectedRepo = repos.find(r => r.id === id);
            renderRepos();
            document.getElementById('create-btn').disabled = !selectedRepo;
        }}

        function filterRepos() {{
            renderRepos();
        }}

        async function createProject() {{
            if (!selectedRepo) return;

            document.getElementById('select-view').classList.add('hidden');
            document.getElementById('creating-view').classList.remove('hidden');

            try {{
                const res = await fetch('/user/projects', {{
                    method: 'POST',
                    headers: {{
                        'Authorization': 'Bearer ' + TOKEN,
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify({{
                        repo_full_name: selectedRepo.full_name,
                        project_name: selectedRepo.name
                    }})
                }});

                if (!res.ok) {{
                    const data = await res.json();
                    throw new Error(data.detail || 'Failed to create project');
                }}

                document.getElementById('creating-view').classList.add('hidden');
                document.getElementById('success-view').classList.remove('hidden');
            }} catch (e) {{
                document.getElementById('creating-view').classList.add('hidden');
                document.getElementById('select-view').classList.remove('hidden');
                showError(e.message);
            }}
        }}

        function showError(msg) {{
            const box = document.getElementById('error-box');
            box.textContent = msg;
            box.classList.remove('hidden');
        }}

        loadRepos();
    </script>
</body>
</html>
"""
        return HTMLResponse(content=html_content)
    
    # For other clients, redirect normally
    if not redirect_uri or redirect_uri == "/":
        if has_projects:
            redirect_uri = "/admin-ui/"
        else:
            redirect_uri = "/onboarding/"
    
    separator = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(
        url=f"{redirect_uri}{separator}access_token={our_access_token}&token_type=Bearer&github_user={user_info['login']}&github_id={user_info['id']}"
    )


@app.get("/auth/github/user")
async def get_github_user(token: str = Depends(verify_bearer_token)):
    """Get current authenticated GitHub user info"""
    token_data = oauth_access_tokens.get(token)
    if not token_data or "github_user" not in token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with GitHub")

    return {
        "github_user": token_data["github_user"],
        "github_id": token_data.get("github_id"),
        "scope": token_data.get("scope"),
    }



# SSE MCP Endpoint for Claude Desktop
import uuid
from typing import AsyncGenerator

# Store active SSE connections
sse_connections: Dict[str, asyncio.Queue] = {}

@app.get("/mcp")
async def mcp_sse_handler(request: Request):
    """
    SSE MCP endpoint for Claude Desktop
    
    This endpoint establishes a Server-Sent Events connection for real-time MCP communication.
    Claude Desktop uses this for bidirectional communication via SSE + POST.
    """
    # Check for SSE request (Accept: text/event-stream)
    accept = request.headers.get("accept", "")
    
    if "text/event-stream" not in accept:
        # Return MCP server info for non-SSE requests
        return {
            "name": "Miyabi MCP Server",
            "version": "2.0.0",
            "protocol": "mcp",
            "transport": "sse",
            "endpoints": {
                "sse": "/mcp",
                "messages": "/mcp/messages"
            }
        }
    
    # Generate connection ID
    connection_id = str(uuid.uuid4())
    message_queue: asyncio.Queue = asyncio.Queue()
    sse_connections[connection_id] = message_queue
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events"""
        try:
            # Send initial connection event with endpoint info
            yield f"event: endpoint\ndata: /mcp/messages?session_id={connection_id}\n\n"
            
            # Keep connection alive and send queued messages
            while True:
                try:
                    # Wait for messages with timeout for keepalive
                    message = await asyncio.wait_for(message_queue.get(), timeout=30.0)
                    yield f"event: message\ndata: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield f": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            # Cleanup connection
            if connection_id in sse_connections:
                del sse_connections[connection_id]
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.post("/mcp/messages")
async def mcp_sse_messages(
    request: Request,
    session_id: str = None
):
    """
    Handle MCP messages for SSE connections
    
    This endpoint receives JSON-RPC messages and processes them,
    then queues responses for the SSE connection.
    """
    try:
        body = await request.json()
        mcp_request = MCPRequest(**body)
        
        # Process the request (reuse existing logic)
        response = await process_mcp_request(mcp_request)
        
        # If we have an SSE connection, queue the response
        if session_id and session_id in sse_connections:
            await sse_connections[session_id].put(response)
        
        # Also return the response directly
        if response is None:
            return Response(status_code=204)
        return response
        
    except Exception as e:
        error_response = {
            "jsonrpc": "2.0",
            "id": None,
            "error": {
                "code": -32603,
                "message": str(e)
            }
        }
        return error_response


async def process_mcp_request(mcp_request: MCPRequest) -> dict:
    """Process MCP request and return response (shared logic)"""
    
    if mcp_request.method == "initialize":
        return MCPResponse(
            id=mcp_request.id,
            result={
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": False},
                    "prompts": {},
                    "resources": {
                        "listChanged": False,
                        "subscribe": False,
                    }
                },
                "serverInfo": {
                    "name": "Miyabi MCP Server",
                    "version": "2.1.0"
                },
                "_meta": WIDGET_META,
            }
        ).dict()
    
    elif mcp_request.method in ("initialized", "notifications/initialized"):
        return None
    
    elif mcp_request.method == "tools/list":
        return MCPResponse(id=mcp_request.id, result={"tools": TOOLS}).dict()

    elif mcp_request.method == "tools/call":
        # Delegate to existing tool handler
        return await handle_tool_call(mcp_request)

    elif mcp_request.method == "resources/list":
        # Return widget resources list for OpenAI Apps SDK
        resources_list = []
        for widget_name, widget_info in WIDGET_RESOURCES.items():
            resources_list.append({
                "uri": widget_info["uri"],
                "name": widget_name.replace("_", " ").title(),
                "description": widget_info.get("description", ""),
                "mimeType": "text/html+skybridge",
            })
        return MCPResponse(id=mcp_request.id, result={"resources": resources_list}).dict()

    elif mcp_request.method == "resources/read":
        # Read a specific widget resource
        uri = mcp_request.params.get("uri", "")

        # Parse widget name from URI (ui://widget/xxx.html -> xxx)
        widget_name = None
        if uri.startswith("ui://widget/"):
            filename = uri.replace("ui://widget/", "").replace(".html", "")
            # Convert kebab-case to snake_case
            widget_name = filename.replace("-", "_")

        if widget_name and widget_name in WIDGET_RESOURCES:
            resource = get_widget_resource(widget_name)
            if resource:
                return MCPResponse(
                    id=mcp_request.id,
                    result={
                        "contents": [{
                            "uri": resource["uri"],
                            "mimeType": resource["mimeType"],
                            "text": resource["text"],
                        }],
                        "_meta": resource.get("_meta", {}),
                    }
                ).dict()

        return {
            "jsonrpc": "2.0",
            "id": mcp_request.id,
            "error": {
                "code": -32602,
                "message": f"Resource not found: {uri}"
            }
        }

    else:
        return {
            "jsonrpc": "2.0",
            "id": mcp_request.id,
            "error": {
                "code": -32601,
                "message": f"Method not found: {mcp_request.method}"
            }
        }


async def handle_tool_call(mcp_request: MCPRequest) -> dict:
    """Handle tools/call request"""
    tool_name = mcp_request.params.get("name")
    arguments = mcp_request.params.get("arguments", {})
    
    try:
        # Import all tool handlers (they should already exist)
        result = None
        
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
        elif tool_name == "git_status":
            result = await git_status_tool(GitStatusParams(**arguments))
        elif tool_name == "git_diff":
            result = await git_diff_tool(GitDiffParams(**arguments))
        elif tool_name == "git_log":
            result = await git_log_tool(GitLogParams(**arguments))
        elif tool_name == "git_branch":
            result = await git_branch_tool(GitBranchParams(**arguments))
        elif tool_name == "system_resources":
            result = await system_resources_tool()
        elif tool_name == "process_list":
            result = await process_list_tool(ProcessListParams(**arguments))
        elif tool_name == "network_status":
            result = await network_status_tool(NetworkStatusParams(**arguments))
        elif tool_name == "obsidian_create_note":
            result = await obsidian_create_note_tool(ObsidianCreateNoteParams(**arguments))
        elif tool_name == "obsidian_search":
            result = await obsidian_search_tool(ObsidianSearchParams(**arguments))
        elif tool_name == "obsidian_update_note":
            result = await obsidian_update_note_tool(ObsidianUpdateNoteParams(**arguments))
        elif tool_name == "tmux_list_sessions":
            result = await tmux_list_sessions_tool(TmuxListParams(**arguments))
        elif tool_name == "tmux_send_keys":
            result = await tmux_send_keys_tool(TmuxSendKeysParams(**arguments))
        elif tool_name == "get_logs":
            result = await get_logs_tool(**arguments)
        elif tool_name == "get_issue":
            result = await get_issue_tool(GetIssueParams(**arguments))
        elif tool_name == "update_issue":
            result = await update_issue_tool(UpdateIssueParams(**arguments))
        elif tool_name == "close_issue":
            result = await close_issue_tool(CloseIssueParams(**arguments))
        elif tool_name == "add_issue_comment":
            result = await add_issue_comment_tool(AddIssueCommentParams(**arguments))
        elif tool_name == "list_prs":
            result = await list_prs_tool(ListPRsParams(**arguments))
        elif tool_name == "get_pr":
            result = await get_pr_tool(GetPRParams(**arguments))
        elif tool_name == "create_pr":
            result = await create_pr_tool(CreatePRParams(**arguments))
        elif tool_name == "merge_pr":
            result = await merge_pr_tool(MergePRParams(**arguments))
        elif tool_name == "run_workflow":
            result = await run_workflow_tool(RunWorkflowParams(**arguments))
        elif tool_name == "list_workflows":
            result = await list_workflows_tool(ListWorkflowsParams(**arguments))
        elif tool_name == "read_file":
            result = await read_file_tool(ReadFileParams(**arguments))
        elif tool_name == "write_file":
            result = await write_file_tool(WriteFileParams(**arguments))
        elif tool_name == "search_code":
            result = await search_code_tool(SearchCodeParams(**arguments))
        elif tool_name == "list_directory":
            result = await list_directory_tool(ListDirectoryParams(**arguments))
        elif tool_name == "cargo_build":
            result = await cargo_build_tool(CargoBuildParams(**arguments))
        elif tool_name == "cargo_test":
            result = await cargo_test_tool(CargoTestParams(**arguments))
        elif tool_name == "cargo_clippy":
            result = await cargo_clippy_tool(CargoClippyParams(**arguments))
        elif tool_name == "run_command":
            result = await run_command_tool(RunCommandParams(**arguments))
        elif tool_name == "get_agent_logs":
            result = await get_agent_logs_tool(GetAgentLogsParams(**arguments))
        elif tool_name == "get_agent_card":
            result = await get_agent_card_tool(GetAgentCardParams(**arguments))
        elif tool_name == "setup_project":
            result = await setup_project_tool()
        # ==========================================
        # UI/UX Enhanced Tools Handlers
        # ==========================================
        elif tool_name == "list_repositories":
            result = await list_repositories_tool(arguments, token)
        elif tool_name == "set_project":
            result = await set_project_tool(arguments, token)
        elif tool_name == "show_onboarding":
            result = await show_onboarding_tool(token)
        elif tool_name == "show_quick_actions":
            result = await show_quick_actions_tool(token)
        elif tool_name == "show_notification":
            result = await show_notification_tool(arguments)
        elif tool_name == "show_subscription":
            result = await show_subscription_tool(token)
        elif tool_name == "start_checkout":
            result = await start_checkout_tool(arguments, token)
        elif tool_name == "manage_subscription":
            result = await manage_subscription_tool(token)
        elif tool_name == "search_tools":
            result = await search_tools_tool(arguments)
        elif tool_name == "generate_agent_card_image":
            result = await generate_agent_card_image_tool(arguments)
        elif tool_name == "get_agent_tcg_card":
            result = await get_agent_tcg_card_tool(arguments)
        elif tool_name == "show_agent_collection":
            result = await show_agent_collection_tool(arguments)
        elif tool_name == "gemini_generate_image":
            # Alias for generate_agent_card_image
            result = await generate_agent_card_image_tool(arguments)
        else:
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "error": {
                    "code": -32602,
                    "message": f"Unknown tool: {tool_name}"
                }
            }
        
        return MCPResponse(id=mcp_request.id, result=result).dict()
        
    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": mcp_request.id,
            "error": {
                "code": -32603,
                "message": f"Tool execution error: {str(e)}"
            }
        }





# Admin API Endpoints
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """Verify admin token"""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin API not configured")
    if credentials is None or credentials.credentials != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True


@app.get("/admin/users")
async def admin_list_users(is_admin: bool = Depends(verify_admin_token)):
    """List all users (Admin only)"""
    users = await sandbox_manager.list_all_users()
    return {"users": users, "count": len(users)}


@app.get("/admin/user/{user_id}")
async def admin_get_user(user_id: str, is_admin: bool = Depends(verify_admin_token)):
    """Get user details (Admin only)"""
    user = await sandbox_manager.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sub = await sandbox_manager.get_subscription(user_id)
    usage = await sandbox_manager.get_usage_summary(user_id)
    projects = await sandbox_manager.get_user_projects(user_id)
    
    return {
        "user": user,
        "subscription": sub,
        "usage": usage,
        "projects": projects,
    }


@app.post("/admin/user/{user_id}/suspend")
async def admin_suspend_user(user_id: str, is_admin: bool = Depends(verify_admin_token)):
    """Suspend user access (Admin only)"""
    result = await sandbox_manager.suspend_user(user_id)
    return {"status": "suspended" if result else "failed", "user_id": user_id}


@app.post("/admin/user/{user_id}/reactivate")
async def admin_reactivate_user(user_id: str, is_admin: bool = Depends(verify_admin_token)):
    """Reactivate suspended user (Admin only)"""
    result = await sandbox_manager.reactivate_user(user_id)
    return {"status": "reactivated" if result else "failed", "user_id": user_id}


@app.post("/admin/user/{user_id}/plan")
async def admin_set_plan(user_id: str, request: Request, is_admin: bool = Depends(verify_admin_token)):
    """Set user plan (Admin only)"""
    body = await request.json()
    plan = body.get("plan", "free")
    if plan not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    sub = await sandbox_manager.create_subscription(user_id, plan)
    return {"status": "updated", "subscription": sub}


@app.get("/admin/stats")
async def admin_stats(is_admin: bool = Depends(verify_admin_token)):
    """Get system statistics (Admin only)"""
    async with sandbox_manager.db_pool.acquire() as conn:
        user_count = await conn.fetchval("SELECT COUNT(*) FROM mcp_users")
        active_subs = await conn.fetchval(
            "SELECT COUNT(*) FROM mcp_subscriptions WHERE status = 'active'"
        )
        total_usage = await conn.fetchrow(
            "SELECT COUNT(*) as calls, SUM(tokens_used) as tokens FROM mcp_usage"
        )
    
    return {
        "total_users": user_count,
        "active_subscriptions": active_subs,
        "total_api_calls": total_usage["calls"] or 0,
        "total_tokens_used": total_usage["tokens"] or 0,
        "active_sandboxes": len(sandbox_manager.active_sandboxes),
    }



# MCP Endpoints (HTTP POST - original)
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
        # Set user context for this request
        current_user_token.set(token)
        user_project = get_user_project(token)
        project_root = Path(user_project.get("project_root", str(MIYABI_ROOT)))
        current_user_project.set(project_root)
        
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
                        "version": "2.0.0"  # Brushup Sprint - 45 tools, enhanced descriptions
                    }
                }
            ).dict()

        elif mcp_request.method in ("initialized", "notifications/initialized"):
            # Client acknowledges initialization - no response needed for notifications
            # Return 204 No Content
            return Response(status_code=204)

        elif mcp_request.method == "tools/list":
            return MCPResponse(id=mcp_request.id, result={"tools": TOOLS}).dict()

        elif mcp_request.method == "resources/list":
            # Return widget resources list for OpenAI Apps SDK
            resources_list = []
            for widget_name, widget_info in WIDGET_RESOURCES.items():
                resources_list.append({
                    "uri": widget_info["uri"],
                    "name": widget_name.replace("_", " ").title(),
                    "description": widget_info.get("description", ""),
                    "mimeType": "text/html+skybridge",
                })
            return MCPResponse(id=mcp_request.id, result={"resources": resources_list}).dict()

        elif mcp_request.method == "resources/read":
            # Read a specific widget resource
            uri = mcp_request.params.get("uri", "")
            widget_name = None
            if uri.startswith("ui://widget/"):
                filename = uri.replace("ui://widget/", "").replace(".html", "")
                widget_name = filename.replace("-", "_")

            if widget_name and widget_name in WIDGET_RESOURCES:
                resource = get_widget_resource(widget_name)
                if resource:
                    return MCPResponse(
                        id=mcp_request.id,
                        result={
                            "contents": [{
                                "uri": resource["uri"],
                                "mimeType": resource["mimeType"],
                                "text": resource["text"],
                            }],
                            "_meta": resource.get("_meta", {}),
                        }
                    ).dict()

            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "error": {
                    "code": -32602,
                    "message": f"Resource not found: {uri}"
                }
            }

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
                        # GitHub Extended
            elif tool_name == "get_issue":
                result = await get_issue_tool(GetIssueParams(**arguments))
            elif tool_name == "update_issue":
                result = await update_issue_tool(UpdateIssueParams(**arguments))
            elif tool_name == "close_issue":
                result = await close_issue_tool(CloseIssueParams(**arguments))
            elif tool_name == "list_prs":
                result = await list_prs_tool(ListPRsParams(**arguments))
            elif tool_name == "get_pr":
                result = await get_pr_tool(GetPRParams(**arguments))
            elif tool_name == "create_pr":
                result = await create_pr_tool(CreatePRParams(**arguments))
            elif tool_name == "merge_pr":
                result = await merge_pr_tool(MergePRParams(**arguments))
            # Git Extended
            elif tool_name == "git_commit":
                result = await git_commit_tool(GitCommitParams(**arguments))
            elif tool_name == "git_push":
                result = await git_push_tool(GitPushParams(**arguments))
            elif tool_name == "git_pull":
                result = await git_pull_tool(GitPullParams(**arguments))
            elif tool_name == "git_checkout":
                result = await git_checkout_tool(GitCheckoutParams(**arguments))
            elif tool_name == "git_create_branch":
                result = await git_create_branch_tool(GitCreateBranchParams(**arguments))
            elif tool_name == "git_stash":
                result = await git_stash_tool(GitStashParams(**arguments))
            # File Operations
            elif tool_name == "read_file":
                result = await read_file_tool(ReadFileParams(**arguments))
            elif tool_name == "write_file":
                result = await write_file_tool(WriteFileParams(**arguments))
            elif tool_name == "list_files":
                result = await list_files_tool(ListFilesParams(**arguments))
            elif tool_name == "search_code":
                result = await search_code_tool(SearchCodeParams(**arguments))
            # Build/Test
            elif tool_name == "cargo_build":
                result = await cargo_build_tool(CargoBuildParams(**arguments))
            elif tool_name == "cargo_test":
                result = await cargo_test_tool(CargoTestParams(**arguments))
            elif tool_name == "cargo_clippy":
                result = await cargo_clippy_tool(CargoClippyParams(**arguments))
            elif tool_name == "npm_install":
                result = await npm_install_tool(NpmInstallParams(**arguments))
            elif tool_name == "npm_run":
                result = await npm_run_tool(NpmRunParams(**arguments))
            # Agent Details
            elif tool_name == "get_agent_status":
                result = await get_agent_status_tool(GetAgentStatusParams(**arguments))
            elif tool_name == "stop_agent":
                result = await stop_agent_tool(StopAgentParams(**arguments))
            elif tool_name == "get_agent_logs":
                result = await get_agent_logs_tool(GetAgentLogsParams(**arguments))
            elif tool_name == "get_agent_card":
                result = await get_agent_card_tool(GetAgentCardParams(**arguments))
            elif tool_name == "setup_project":
                result = await setup_project_tool()
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




@app.on_event("startup")
async def startup_event():
    """Initialize sandbox manager on startup"""
    try:
        await sandbox_manager.initialize()
        logger.info("Sandbox manager initialized")
    except Exception as e:
        logger.warning(f"Sandbox manager initialization failed (non-fatal): {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await sandbox_manager.close()
    except Exception:
        pass

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": "Miyabi MCP Server",
        "version": "2.0.0",  # Brushup Sprint - 45 tools, enhanced descriptions
        "status": "running",
        "tools": len(TOOLS),
    }


@app.get("/mcp")
async def mcp_info():
    """MCP endpoint information (use POST for actual MCP requests)"""
    return {
        "name": "Miyabi MCP Server",
        "version": "2.0.0",  # Brushup Sprint - 45 tools, enhanced descriptions
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


# ============================================
# Admin UI Static Files
# ============================================
ADMIN_UI_PATH = Path(__file__).parent.parent / "admin-ui" / "dist"
if ADMIN_UI_PATH.exists():
    app.mount("/admin-ui", StaticFiles(directory=str(ADMIN_UI_PATH), html=True), name="admin-ui")
    logger.info(f"Admin UI mounted from {ADMIN_UI_PATH}")
else:
    logger.warning(f"Admin UI directory not found: {ADMIN_UI_PATH}")


# ============================================
# Onboarding API Endpoints
# ============================================

@app.get("/user/onboarding/status")
async def get_onboarding_status(token: str = Depends(verify_bearer_token)):
    """Check if user has completed onboarding (has at least one project)"""
    token_data = oauth_access_tokens.get(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_user = token_data.get("github_user")
    github_id = token_data.get("github_id")
    
    # Check if user has projects in database
    projects = await sandbox_manager.get_user_projects(f"github_{github_id}")
    
    return {
        "completed": len(projects) > 0,
        "github_user": github_user,
        "github_id": github_id,
        "project_count": len(projects),
        "projects": projects
    }


@app.get("/user/github/repos")
async def list_github_repos(
    token: str = Depends(verify_bearer_token),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
):
    """List user's GitHub repositories for project selection"""
    token_data = oauth_access_tokens.get(token)
    if not token_data or "github_token" not in token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with GitHub")
    
    github_token = token_data["github_token"]
    
    import httpx
    async with httpx.AsyncClient() as client:
        # Get user's repos (owned + collaborator access)
        response = await client.get(
            "https://api.github.com/user/repos",
            params={
                "type": "all",  # all, owner, public, private, member
                "sort": "updated",
                "direction": "desc",
                "page": page,
                "per_page": per_page,
            },
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories")
        
        repos = response.json()
        
        return {
            "repos": [
                {
                    "id": repo["id"],
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "description": repo.get("description"),
                    "private": repo["private"],
                    "html_url": repo["html_url"],
                    "clone_url": repo["clone_url"],
                    "default_branch": repo.get("default_branch", "main"),
                    "language": repo.get("language"),
                    "updated_at": repo["updated_at"],
                    "owner": {
                        "login": repo["owner"]["login"],
                        "avatar_url": repo["owner"]["avatar_url"],
                    }
                }
                for repo in repos
            ],
            "page": page,
            "per_page": per_page,
            "has_more": len(repos) == per_page,
        }


class ProjectCreateRequest(BaseModel):
    repo_full_name: str  # e.g., "owner/repo-name"
    project_name: Optional[str] = None  # Custom name, defaults to repo name


@app.post("/user/projects")
async def create_user_project(
    request: ProjectCreateRequest,
    token: str = Depends(verify_bearer_token),
):
    """Create a new project from a GitHub repository"""
    token_data = oauth_access_tokens.get(token)
    if not token_data or "github_token" not in token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with GitHub")
    
    github_token = token_data["github_token"]
    github_user = token_data["github_user"]
    github_id = token_data["github_id"]
    user_id = f"github_{github_id}"
    
    # Validate repository access
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{request.repo_full_name}",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found or no access")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to verify repository")
        
        repo_info = response.json()
    
    # Create project name
    project_name = request.project_name or repo_info["name"]
    
    # Check if project already exists
    existing_projects = await sandbox_manager.get_user_projects(user_id)
    for proj in existing_projects:
        if proj.get("github_repo") == request.repo_full_name:
            raise HTTPException(status_code=409, detail="Project for this repository already exists")
    
    # Create user if not exists
    await sandbox_manager.create_user(
        user_id=user_id,
        github_id=str(github_id),
        github_username=github_user,
        email=None,
        plan="free"
    )
    
    # Create the project
    project_id = await sandbox_manager.create_project(
        user_id=user_id,
        project_name=project_name,
        github_repo=request.repo_full_name,
        github_token=github_token,
    )
    
    # Initialize sandbox with git clone (async, don't block)
    try:
        sandbox = await sandbox_manager.get_or_create_sandbox(user_id, project_name)
        # Clone the repository in the sandbox
        clone_result = await sandbox.execute(
            "run_bash",
            {
                "command": f"git clone https://{github_token}@github.com/{request.repo_full_name}.git /workspace/{project_name} 2>&1 || echo 'Clone may have failed or repo already exists'"
            }
        )
        logger.info(f"Clone result for {project_name}: {clone_result}")
    except Exception as e:
        logger.warning(f"Failed to initialize sandbox for {project_name}: {e}")
    
    return {
        "project_id": project_id,
        "project_name": project_name,
        "github_repo": request.repo_full_name,
        "status": "created",
        "message": f"Project '{project_name}' created successfully"
    }


@app.get("/user/projects")
async def list_user_projects(token: str = Depends(verify_bearer_token)):
    """List all projects for the authenticated user"""
    token_data = oauth_access_tokens.get(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_id = token_data.get("github_id")
    user_id = f"github_{github_id}"
    
    projects = await sandbox_manager.get_user_projects(user_id)
    
    return {
        "projects": projects,
        "count": len(projects)
    }


@app.delete("/user/projects/{project_name}")
async def delete_user_project(
    project_name: str,
    token: str = Depends(verify_bearer_token),
):
    """Delete a user project"""
    token_data = oauth_access_tokens.get(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    github_id = token_data.get("github_id")
    user_id = f"github_{github_id}"
    
    # Delete from database
    success = await sandbox_manager.delete_project(user_id, project_name)
    
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"status": "deleted", "project_name": project_name}



# ============================================
# Onboarding UI Static Files
# ============================================
ONBOARDING_UI_PATH = Path(__file__).parent.parent / "onboarding-ui" / "dist"
if ONBOARDING_UI_PATH.exists():
    app.mount("/onboarding", StaticFiles(directory=str(ONBOARDING_UI_PATH), html=True), name="onboarding-ui")
    logger.info(f"Onboarding UI mounted from {ONBOARDING_UI_PATH}")
else:
    logger.warning(f"Onboarding UI directory not found: {ONBOARDING_UI_PATH}")


# ============================================
# GitHub Login Shortcut
# ============================================
@app.get("/auth/github/login")
async def github_login_redirect():
    """
    Convenience endpoint to start GitHub OAuth flow.
    Redirects to the OAuth authorize endpoint with default settings.
    """
    import secrets
    state = secrets.token_urlsafe(32)
    
    # Store state
    github_oauth_states[state] = {
        "redirect_uri": "/onboarding/",
        "created_at": time.time(),
        "expires_at": time.time() + 600,
    }
    
    # Redirect to GitHub OAuth
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_OAUTH_CLIENT_ID}"
        f"&redirect_uri={GITHUB_OAUTH_CALLBACK_URL}"
        f"&scope=repo,read:user,user:email"
        f"&state={state}"
    )
    return RedirectResponse(url=github_auth_url)
