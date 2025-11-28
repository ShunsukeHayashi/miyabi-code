#!/usr/bin/env python3
"""
Miyabi MCP Server - MCP Protocol Router
Model Context Protocol (MCP) JSON-RPC 2.0 endpoint
"""

import time
import asyncio
from typing import Optional, Dict, Any, List, Union

from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.config import settings
from ..core.security import verify_bearer_token, check_rate_limit
from ..core.logging import get_logger, request_id_var
from ..core.exceptions import ValidationError, AgentExecutionError

logger = get_logger("miyabi.mcp")

router = APIRouter(prefix="/mcp", tags=["MCP"])


# ===========================================
# MCP Protocol Models
# ===========================================

class MCPRequest(BaseModel):
    """MCP JSON-RPC 2.0 Request"""
    jsonrpc: str = "2.0"
    id: Optional[Union[int, str]] = None
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    """MCP JSON-RPC 2.0 Response"""
    jsonrpc: str = "2.0"
    id: Union[int, str]
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class MCPError(BaseModel):
    """MCP JSON-RPC 2.0 Error"""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None


# ===========================================
# MCP Error Codes
# ===========================================

class MCPErrorCodes:
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603


# ===========================================
# Tool Definitions
# ===========================================

TOOLS = [
    {
        "name": "execute_agent",
        "description": "Execute a Miyabi agent (CodeGen, Review, Issue, PR, Deploy, etc.)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Agent name: codegen, review, issue, pr, deploy, coordinator, refresher, ai_entrepreneur, self_analysis, market_research, persona, product_concept, product_design, content_creation, funnel_design, sns_strategy, marketing, sales, crm, analytics, youtube",
                    "enum": ["coordinator", "codegen", "review", "issue", "pr", "deploy", "refresher", "ai_entrepreneur", "self_analysis", "market_research", "persona", "product_concept", "product_design", "content_creation", "funnel_design", "sns_strategy", "marketing", "sales", "crm", "analytics", "youtube"]
                },
                "issue_number": {"type": "integer", "description": "GitHub issue number to process (optional)"},
                "task": {"type": "string", "description": "Task description for the agent (optional)"},
                "context": {"type": "string", "description": "Additional context (optional)"}
            },
            "required": ["agent"]
        }
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
                            "agent": {"type": "string"},
                            "issue_number": {"type": "integer"},
                            "task": {"type": "string"},
                            "context": {"type": "string"}
                        },
                        "required": ["agent"]
                    }
                }
            },
            "required": ["agents"]
        }
    },
    {
        "name": "create_issue",
        "description": "Create a new GitHub issue in the Miyabi repository",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Issue title"},
                "body": {"type": "string", "description": "Issue description"},
                "labels": {"type": "array", "items": {"type": "string"}, "description": "Issue labels (optional)"}
            },
            "required": ["title", "body"]
        }
    },
    {
        "name": "list_issues",
        "description": "List GitHub issues in the Miyabi repository",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                "limit": {"type": "integer", "default": 10, "description": "Maximum number of issues to return"}
            }
        }
    },
    {
        "name": "get_issue",
        "description": "Get detailed information about a specific GitHub issue",
        "inputSchema": {
            "type": "object",
            "properties": {
                "issue_number": {"type": "integer", "description": "Issue number"}
            },
            "required": ["issue_number"]
        }
    },
    {
        "name": "get_project_status",
        "description": "Get current Miyabi project status (branch, crates, agents, commits)",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "list_agents",
        "description": "Show all available Miyabi agents with their descriptions",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_agent_status",
        "description": "Check status of running agents by inspecting tmux sessions",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent": {"type": "string", "description": "Agent name (optional, omit for all)"}
            }
        }
    },
    {
        "name": "show_agent_cards",
        "description": "Display Miyabi agents as collectible TCG trading cards with stats, skills, and achievements",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
]


# ===========================================
# Agent Mapping
# ===========================================

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


# ===========================================
# Helper Functions
# ===========================================

def make_response(text: str, is_error: bool = False) -> Dict[str, Any]:
    """Create standardized MCP response"""
    return {
        "content": [{"type": "text", "text": text}],
        "isError": is_error
    }


def make_error_response(code: int, message: str, data: Any = None) -> Dict[str, Any]:
    """Create MCP error response"""
    error = {"code": code, "message": message}
    if data:
        error["data"] = data
    return error


# ===========================================
# Tool Implementations
# ===========================================

async def execute_agent(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a Miyabi agent"""
    import subprocess
    
    agent = params.get("agent")
    if not agent or agent not in AGENT_MAPPING:
        return make_response(f"Unknown agent: {agent}. Available: {', '.join(AGENT_MAPPING.keys())}", is_error=True)
    
    agent_class = AGENT_MAPPING[agent]
    issue_number = params.get("issue_number")
    task = params.get("task")
    context = params.get("context")
    
    # Build command
    cmd = ["cargo", "run", "--release", "--bin", "miyabi-cli", "--", "agent", "execute", agent_class]
    
    if issue_number:
        cmd.extend(["--issue", str(issue_number)])
    if task:
        cmd.extend(["--task", task])
    if context:
        cmd.extend(["--context", context])
    
    try:
        result = subprocess.run(
            cmd,
            cwd=str(settings.miyabi_root),
            capture_output=True,
            text=True,
            timeout=300
        )
        
        output = result.stdout or result.stderr or "Agent executed successfully"
        return make_response(f"Agent '{agent}' executed:\n\n{output}")
    except subprocess.TimeoutExpired:
        return make_response(f"Agent '{agent}' execution timed out after 300 seconds", is_error=True)
    except Exception as e:
        return make_response(f"Error executing agent: {str(e)}", is_error=True)


async def execute_agents_parallel(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute multiple agents in parallel"""
    agents = params.get("agents", [])
    if not agents:
        return make_response("No agents specified", is_error=True)
    
    start_time = time.time()
    
    # Execute all agents concurrently
    tasks = [execute_agent(agent_params) for agent_params in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    duration = time.time() - start_time
    
    # Format results
    output_lines = [f"Parallel execution completed in {duration:.2f}s\n"]
    success_count = 0
    error_count = 0
    
    for i, (agent_params, result) in enumerate(zip(agents, results)):
        agent_name = agent_params.get("agent", "unknown")
        
        if isinstance(result, Exception):
            output_lines.append(f"❌ {agent_name}: Error - {str(result)}")
            error_count += 1
        elif result.get("isError"):
            output_lines.append(f"❌ {agent_name}: {result['content'][0]['text'][:100]}...")
            error_count += 1
        else:
            output_lines.append(f"✅ {agent_name}: Success")
            success_count += 1
    
    output_lines.append(f"\nSummary: {success_count} succeeded, {error_count} failed")
    
    return make_response("\n".join(output_lines))


async def create_issue(params: Dict[str, Any]) -> Dict[str, Any]:
    """Create a GitHub issue"""
    from github import Github
    
    title = params.get("title")
    body = params.get("body")
    labels = params.get("labels", [])
    
    if not title or not body:
        return make_response("Title and body are required", is_error=True)
    
    try:
        g = Github(settings.github_token)
        repo = g.get_repo(settings.github_repo_full_name)
        issue = repo.create_issue(title=title, body=body, labels=labels)
        
        return make_response(f"Created issue #{issue.number}: {issue.title}\nURL: {issue.html_url}")
    except Exception as e:
        return make_response(f"Failed to create issue: {str(e)}", is_error=True)


async def list_issues(params: Dict[str, Any]) -> Dict[str, Any]:
    """List GitHub issues"""
    from github import Github
    
    state = params.get("state", "open")
    limit = min(params.get("limit", 10), 100)
    
    try:
        g = Github(settings.github_token)
        repo = g.get_repo(settings.github_repo_full_name)
        issues = repo.get_issues(state=state)[:limit]
        
        lines = [f"Found {len(list(issues))} issue(s) in {settings.github_repo_full_name}:\n"]
        
        for issue in repo.get_issues(state=state)[:limit]:
            labels_str = ", ".join(l.name for l in issue.labels) if issue.labels else ""
            lines.append(f"#{issue.number} [{issue.state}] {issue.title}")
            if labels_str:
                lines.append(f"   Labels: {labels_str}")
        
        return make_response("\n".join(lines))
    except Exception as e:
        return make_response(f"Failed to list issues: {str(e)}", is_error=True)


async def get_issue(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get detailed issue information"""
    from github import Github
    
    issue_number = params.get("issue_number")
    if not issue_number:
        return make_response("issue_number is required", is_error=True)
    
    try:
        g = Github(settings.github_token)
        repo = g.get_repo(settings.github_repo_full_name)
        issue = repo.get_issue(issue_number)
        
        labels = ", ".join(l.name for l in issue.labels) if issue.labels else "None"
        assignees = ", ".join(a.login for a in issue.assignees) if issue.assignees else "None"
        
        output = f"""Issue #{issue.number}: {issue.title}
State: {issue.state}
Author: {issue.user.login}
Created: {issue.created_at}
Updated: {issue.updated_at}
Labels: {labels}
Assignees: {assignees}

Body:
{issue.body or 'No description'}"""
        
        return make_response(output)
    except Exception as e:
        return make_response(f"Failed to get issue: {str(e)}", is_error=True)


async def get_project_status(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get project status"""
    import subprocess
    
    try:
        # Get git info
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=str(settings.miyabi_root),
            capture_output=True, text=True
        ).stdout.strip()
        
        commit = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(settings.miyabi_root),
            capture_output=True, text=True
        ).stdout.strip()
        
        # Count crates
        crates_dir = settings.miyabi_root / "crates"
        crate_count = len(list(crates_dir.iterdir())) if crates_dir.exists() else 0
        
        # Count MCP servers
        mcp_config = settings.miyabi_root / ".claude" / "mcp.json"
        mcp_count = 0
        if mcp_config.exists():
            import json
            with open(mcp_config) as f:
                config = json.load(f)
                mcp_count = len(config.get("mcpServers", {}))
        
        output = f"""Miyabi Project Status
Branch: {branch}
Commit: {commit[:12]}
Crates: {crate_count}
MCP Servers: {mcp_count}
Agents: {len(AGENT_MAPPING)}"""
        
        return make_response(output)
    except Exception as e:
        return make_response(f"Failed to get project status: {str(e)}", is_error=True)


async def list_agents(params: Dict[str, Any]) -> Dict[str, Any]:
    """List all available agents"""
    lines = ["Available Miyabi Agents:\n"]
    
    categories = {
        "Development": ["coordinator", "codegen", "review", "issue", "pr", "deploy", "refresher"],
        "Business": ["ai_entrepreneur", "self_analysis", "market_research", "persona", "product_concept", "product_design"],
        "Marketing": ["content_creation", "funnel_design", "sns_strategy", "marketing", "sales", "crm", "analytics", "youtube"]
    }
    
    for category, agents in categories.items():
        lines.append(f"\n{category}:")
        for agent in agents:
            lines.append(f"  • {agent} ({AGENT_MAPPING[agent]})")
    
    return make_response("\n".join(lines))


async def get_agent_status(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get agent status from tmux"""
    import subprocess
    
    try:
        result = subprocess.run(
            ["tmux", "list-sessions", "-F", "#{session_name}:#{window_name}"],
            capture_output=True, text=True
        )
        
        if result.returncode != 0:
            return make_response("No tmux sessions found")
        
        sessions = result.stdout.strip().split("\n")
        agent_filter = params.get("agent")
        
        if agent_filter:
            sessions = [s for s in sessions if agent_filter in s.lower()]
        
        if not sessions:
            return make_response("No matching agent sessions found")
        
        output = "Agent Status:\n" + "\n".join(f"  - {s}" for s in sessions)
        return make_response(output)
    except Exception as e:
        return make_response(f"Failed to get agent status: {str(e)}", is_error=True)


async def show_agent_cards(params: Dict[str, Any]) -> Dict[str, Any]:
    """Show agent TCG cards"""
    # Return a reference to the TCG card widget
    return {
        "content": [
            {"type": "text", "text": "Miyabi Agent TCG Cards - 21 Collectible Agents"},
            {
                "type": "resource",
                "resource": {
                    "uri": f"{settings.base_url}/widgets/agent-cards",
                    "mimeType": "text/html"
                }
            }
        ]
    }


# Tool handler mapping
TOOL_HANDLERS = {
    "execute_agent": execute_agent,
    "execute_agents_parallel": execute_agents_parallel,
    "create_issue": create_issue,
    "list_issues": list_issues,
    "get_issue": get_issue,
    "get_project_status": get_project_status,
    "list_agents": list_agents,
    "get_agent_status": get_agent_status,
    "show_agent_cards": show_agent_cards,
}


# ===========================================
# MCP Endpoint
# ===========================================

@router.post("")
async def mcp_endpoint(
    request: Request,
    mcp_request: MCPRequest,
    token: str = Depends(verify_bearer_token),
    _: None = Depends(check_rate_limit)
):
    """
    MCP JSON-RPC 2.0 Endpoint
    
    Handles all MCP protocol methods:
    - initialize: Server initialization
    - tools/list: List available tools
    - tools/call: Execute a tool
    """
    method = mcp_request.method
    params = mcp_request.params or {}
    request_id = mcp_request.id
    
    logger.info(f"MCP request: {method}", data={"params": params})
    
    try:
        # Handle MCP methods
        if method == "initialize":
            result = {
                "protocolVersion": "2024-11-05",
                "serverInfo": {
                    "name": settings.app_name,
                    "version": settings.app_version,
                },
                "capabilities": {
                    "tools": {"listChanged": False},
                }
            }
        
        elif method == "tools/list":
            result = {"tools": TOOLS}
        
        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            
            if tool_name not in TOOL_HANDLERS:
                return MCPResponse(
                    id=request_id,
                    error=make_error_response(
                        MCPErrorCodes.METHOD_NOT_FOUND,
                        f"Unknown tool: {tool_name}"
                    )
                )
            
            handler = TOOL_HANDLERS[tool_name]
            result = await handler(tool_args)
        
        elif method == "notifications/initialized":
            # Client notification - no response needed
            return {"jsonrpc": "2.0"}
        
        else:
            return MCPResponse(
                id=request_id,
                error=make_error_response(
                    MCPErrorCodes.METHOD_NOT_FOUND,
                    f"Unknown method: {method}"
                )
            )
        
        return MCPResponse(
            id=request_id,
            result=result
        )
    
    except Exception as e:
        logger.error(f"MCP error: {str(e)}", exc_info=True)
        return MCPResponse(
            id=request_id,
            error=make_error_response(
                MCPErrorCodes.INTERNAL_ERROR,
                str(e)
            )
        )
