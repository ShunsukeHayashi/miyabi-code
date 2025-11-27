#!/usr/bin/env python3
"""
Miyabi OpenAI App - MCP Server
Exposes Miyabi agents and project management as ChatGPT tools
"""

import os
import json
import subprocess
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from github import Github
from dotenv import load_dotenv

from a2a_client import get_client as get_a2a_client

# Load environment variables from .env file
load_dotenv()

# Configuration
MIYABI_ROOT = Path(os.getenv("MIYABI_ROOT", Path.home() / "Dev" / "miyabi-private"))
BASE_URL = os.getenv("BASE_URL", "http://localhost:4444")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
REPO_OWNER = os.getenv("MIYABI_REPO_OWNER", "customer-cloud")
REPO_NAME = os.getenv("MIYABI_REPO_NAME", "miyabi-private")

app = FastAPI(title="Miyabi MCP Server", version="1.0.0")

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
    id: int | str
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: int | str
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


# MCP Endpoints
@app.post("/mcp")
async def mcp_handler(request: Request):
    """Main MCP protocol handler"""
    try:
        body = await request.json()
        mcp_request = MCPRequest(**body)

        # Handle different MCP methods
        if mcp_request.method == "tools/list":
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
