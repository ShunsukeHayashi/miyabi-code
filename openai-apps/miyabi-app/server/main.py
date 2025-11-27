#!/usr/bin/env python3
"""
Miyabi OpenAI App - MCP Server
Exposes Miyabi agents and project management as ChatGPT tools
"""

import os
import json
import subprocess
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
