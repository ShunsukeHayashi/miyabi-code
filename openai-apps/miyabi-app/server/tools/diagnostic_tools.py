"""
DIAGNOSTIC Tools - System health check and connectivity verification

These tools are designed for debugging and monitoring the full stack:
- ChatGPT UI → Connector → MCP Server → Miyabi Tools

Usage:
- miyabi_connector_ping: Quick connectivity check
- miyabi_tools_self_check: Comprehensive tool validation
- miyabi_layer_diagnostics: Full 4-layer health report
"""

import os
import time
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

from .registry import ToolDefinition, ToolCategory

# Version and build info
VERSION = "2025.12.02-rc2"
BUILD_DATE = "2025-12-02"

# Environment checks
ENV_CHECKS = {
    "GITHUB_TOKEN": os.getenv("GITHUB_TOKEN", ""),
    "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
    "MIYABI_ROOT": os.getenv("MIYABI_ROOT", ""),
    "OBSIDIAN_VAULT": os.getenv("OBSIDIAN_VAULT", ""),
}


def check_environment() -> Dict[str, Any]:
    """Check critical environment variables"""
    results = {}
    for key, value in ENV_CHECKS.items():
        results[key] = "configured" if value else "missing"
    return results


def check_filesystem() -> Dict[str, Any]:
    """Check filesystem access"""
    miyabi_root = os.getenv("MIYABI_ROOT", Path.home() / "miyabi-private")
    results = {
        "miyabi_root_exists": Path(miyabi_root).exists(),
        "miyabi_root_path": str(miyabi_root),
    }
    return results


def check_tools_registry() -> Dict[str, Any]:
    """Check tool registry status"""
    from .data_tools import DATA_TOOLS
    from .action_tools import ACTION_TOOLS
    from .ui_tools import UI_TOOLS
    from .agent_tools import AGENT_TOOLS
    
    return {
        "data_tools": len(DATA_TOOLS),
        "action_tools": len(ACTION_TOOLS),
        "ui_tools": len(UI_TOOLS),
        "agent_tools": len(AGENT_TOOLS),
        "total": len(DATA_TOOLS) + len(ACTION_TOOLS) + len(UI_TOOLS) + len(AGENT_TOOLS),
    }


# Diagnostic tool definitions
DIAGNOSTIC_TOOLS = [
    # === Connector Ping ===
    ToolDefinition(
        name="miyabi_connector_ping",
        title="Connector Health Check",
        description="Quick connectivity check: ChatGPT → Connector → MCP Server. Returns OK if all layers are connected.",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
        meta={
            "openai/toolInvocation/invoking": "Checking connectivity...",
            "openai/toolInvocation/invoked": "Connectivity check complete.",
        },
    ),

    # === Tools Self Check ===
    ToolDefinition(
        name="miyabi_tools_self_check",
        title="Tools Self Check",
        description="Run self-diagnostics on all Miyabi tools. Returns status for each tool category.",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Specific category to check (data, action, ui, agent, all)",
                    "enum": ["data", "action", "ui", "agent", "all"],
                    "default": "all",
                },
                "verbose": {
                    "type": "boolean",
                    "description": "Include detailed error messages",
                    "default": False,
                },
            },
            "required": [],
        },
        meta={
            "openai/toolInvocation/invoking": "Running self-diagnostics...",
            "openai/toolInvocation/invoked": "Diagnostics complete.",
        },
    ),

    # === Layer Diagnostics ===
    ToolDefinition(
        name="miyabi_layer_diagnostics",
        title="4-Layer Diagnostics",
        description="Full health report for all 4 layers: MCP Server, Connector, UI Definition, UX Flow",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {
                "include_env": {
                    "type": "boolean",
                    "description": "Include environment variable status (redacted)",
                    "default": True,
                },
            },
            "required": [],
        },
        meta={
            "openai/toolInvocation/invoking": "Running full layer diagnostics...",
            "openai/toolInvocation/invoked": "Layer diagnostics complete.",
        },
    ),

    # === Quick Fix Suggestions ===
    ToolDefinition(
        name="miyabi_suggest_fixes",
        title="Suggest Fixes",
        description="Based on diagnostics, suggest configuration fixes for broken tools",
        category=ToolCategory.DATA,
        input_schema={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
]


# Handler implementations
async def handle_connector_ping() -> Dict[str, Any]:
    """Handle miyabi_connector_ping tool call"""
    start_time = time.time()
    
    result = {
        "connector": "ok",
        "mcp_server": "ok",
        "tools_count": check_tools_registry()["total"],
        "environment": "production" if os.getenv("ENV") == "production" else "development",
        "version": VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "latency_ms": 0,
    }
    
    # Check filesystem
    fs_check = check_filesystem()
    if not fs_check["miyabi_root_exists"]:
        result["mcp_server"] = "degraded"
        result["warning"] = "MIYABI_ROOT not accessible"
    
    result["latency_ms"] = round((time.time() - start_time) * 1000, 2)
    return result


async def handle_tools_self_check(category: str = "all", verbose: bool = False) -> Dict[str, Any]:
    """Handle miyabi_tools_self_check tool call"""
    from .data_tools import DATA_TOOLS
    from .action_tools import ACTION_TOOLS
    from .ui_tools import UI_TOOLS
    from .agent_tools import AGENT_TOOLS
    
    env_status = check_environment()
    
    # Define what each category needs
    category_requirements = {
        "data": {
            "tools": DATA_TOOLS,
            "env_deps": ["MIYABI_ROOT"],
        },
        "action": {
            "tools": ACTION_TOOLS,
            "env_deps": ["MIYABI_ROOT", "GITHUB_TOKEN"],
        },
        "ui": {
            "tools": UI_TOOLS,
            "env_deps": [],
        },
        "agent": {
            "tools": AGENT_TOOLS,
            "env_deps": ["MIYABI_ROOT"],
        },
    }
    
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "version": VERSION,
        "summary": {},
        "details": {},
    }
    
    categories_to_check = [category] if category != "all" else list(category_requirements.keys())
    
    total_ok = 0
    total_fail = 0
    
    for cat in categories_to_check:
        cat_info = category_requirements[cat]
        tools = cat_info["tools"]
        env_deps = cat_info["env_deps"]
        
        # Check if required env vars are set
        missing_env = [dep for dep in env_deps if env_status.get(dep) == "missing"]
        
        cat_result = {
            "tools_count": len(tools),
            "env_status": "ok" if not missing_env else "missing",
            "missing_env": missing_env,
            "status": "ok" if not missing_env else "degraded",
        }
        
        if missing_env:
            total_fail += len(tools)
        else:
            total_ok += len(tools)
        
        if verbose:
            cat_result["tools"] = [t.name for t in tools]
        
        results["details"][cat] = cat_result
    
    results["summary"] = {
        "total_tools": total_ok + total_fail,
        "functional": total_ok,
        "blocked": total_fail,
        "health_percent": round(total_ok / (total_ok + total_fail) * 100, 1) if (total_ok + total_fail) > 0 else 0,
    }
    
    return results


async def handle_layer_diagnostics(include_env: bool = True) -> Dict[str, Any]:
    """Handle miyabi_layer_diagnostics tool call"""
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "version": VERSION,
        "layers": {},
    }
    
    # Layer 1: MCP Server
    results["layers"]["mcp_server"] = {
        "status": "ok",
        "tools_registered": check_tools_registry()["total"],
        "filesystem": check_filesystem(),
    }
    
    # Layer 2: Connector (if we're here, it's working)
    results["layers"]["connector"] = {
        "status": "ok",
        "note": "Request reached MCP server successfully",
    }
    
    # Layer 3: UI Definition
    results["layers"]["ui_definition"] = {
        "status": "ok",
        "note": "Tool was invoked, UI definition is correct",
    }
    
    # Layer 4: UX Flow (can't fully check programmatically)
    results["layers"]["ux_flow"] = {
        "status": "check_manually",
        "note": "Verify tool responses match expected behavior",
    }
    
    # Environment status
    if include_env:
        env_status = check_environment()
        redacted = {}
        for key, status in env_status.items():
            redacted[key] = status  # Already shows only "configured" or "missing"
        results["environment"] = redacted
    
    # Overall health
    issues = []
    env_status = check_environment()
    if env_status.get("GITHUB_TOKEN") == "missing":
        issues.append("GITHUB_TOKEN not set - GitHub operations will fail")
    if env_status.get("GEMINI_API_KEY") == "missing":
        issues.append("GEMINI_API_KEY not set - AI image features disabled")
    if not check_filesystem()["miyabi_root_exists"]:
        issues.append("MIYABI_ROOT not accessible")
    
    results["issues"] = issues
    results["overall_status"] = "healthy" if not issues else "degraded"
    
    return results


async def handle_suggest_fixes() -> Dict[str, Any]:
    """Handle miyabi_suggest_fixes tool call"""
    env_status = check_environment()
    fs_status = check_filesystem()
    
    fixes = []
    
    if env_status.get("GITHUB_TOKEN") == "missing":
        fixes.append({
            "issue": "GITHUB_TOKEN not set",
            "impact": "All GitHub operations (issues, PRs, repos) will fail",
            "fix": "Set GITHUB_TOKEN environment variable with a valid GitHub Personal Access Token",
            "command": "export GITHUB_TOKEN=ghp_your_token_here",
            "priority": "HIGH",
        })
    
    if env_status.get("GEMINI_API_KEY") == "missing":
        fixes.append({
            "issue": "GEMINI_API_KEY not set",
            "impact": "AI image generation and analysis disabled",
            "fix": "Set GEMINI_API_KEY environment variable with a valid Google AI API key",
            "command": "export GEMINI_API_KEY=your_api_key_here",
            "priority": "MEDIUM",
        })
    
    if not fs_status.get("miyabi_root_exists"):
        fixes.append({
            "issue": "MIYABI_ROOT not accessible",
            "impact": "File operations may fail",
            "fix": "Ensure MIYABI_ROOT points to a valid directory",
            "command": f"export MIYABI_ROOT={fs_status.get('miyabi_root_path')}",
            "priority": "HIGH",
        })
    
    if not fixes:
        return {
            "status": "all_clear",
            "message": "No configuration issues detected! All systems are properly configured.",
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    return {
        "status": "fixes_available",
        "count": len(fixes),
        "fixes": fixes,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Handler registry
DIAGNOSTIC_HANDLERS = {
    "miyabi_connector_ping": handle_connector_ping,
    "miyabi_tools_self_check": handle_tools_self_check,
    "miyabi_layer_diagnostics": handle_layer_diagnostics,
    "miyabi_suggest_fixes": handle_suggest_fixes,
}
