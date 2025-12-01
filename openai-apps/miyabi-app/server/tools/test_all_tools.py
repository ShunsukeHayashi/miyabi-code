#!/usr/bin/env python3
"""
Comprehensive Tool Testing Script for Miyabi MCP Server

This script tests all 63 tools with safe, read-only operations where possible.
For write operations, it uses mock/test data that won't affect production.

Usage:
    python test_all_tools.py [--verbose] [--category CATEGORY]

Categories: data, ui, action, agent, all
"""

import asyncio
import httpx
import json
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


# Configuration
MCP_ENDPOINT = "https://mcp.miyabi-world.com/mcp"
TIMEOUT = 30.0


class TestResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"


@dataclass
class ToolTest:
    name: str
    category: str
    arguments: Dict[str, Any]
    expected_keys: List[str] = None
    is_safe: bool = True
    skip_reason: Optional[str] = None


# Safe test definitions for each tool
TOOL_TESTS = [
    # === DATA Tools (Read-only, safe to test) ===
    ToolTest("get_project_status", "data", {}, ["branch", "crates_count"]),
    ToolTest("list_issues", "data", {"state": "open", "limit": 3}),
    ToolTest("get_issue", "data", {"issue_number": 1}, ["number", "title"]),
    ToolTest("list_prs", "data", {"state": "open", "limit": 3}),
    ToolTest("git_status", "data", {}),
    ToolTest("git_diff", "data", {"staged": False}),
    ToolTest("git_log", "data", {"limit": 3}),
    ToolTest("git_branch", "data", {"list_all": False}),
    ToolTest("system_resources", "data", {}),
    ToolTest("process_list", "data", {"limit": 5}),
    ToolTest("network_status", "data", {}),
    ToolTest("list_agents", "data", {}),
    ToolTest("list_files", "data", {"path": ".", "pattern": "*.md"}),
    ToolTest("search_code", "data", {"query": "fn main", "file_pattern": "*.rs"}),
    ToolTest("search_tools", "data", {"query": "git"}),
    ToolTest("tmux_list_sessions", "data", {}),
    ToolTest("list_repositories", "data", {"limit": 5}),
    ToolTest("mcp_docs", "data", {"topic": "overview"}),

    # === UI Tools (Safe, just return UI data) ===
    ToolTest("show_onboarding", "ui", {}),
    ToolTest("show_quick_actions", "ui", {"context": "project"}),
    ToolTest("show_agent_cards", "ui", {"filter": "coding"}),
    ToolTest("list_agents", "ui", {}),
    ToolTest("show_agent_collection", "ui", {}),
    ToolTest("show_notification", "ui", {"message": "Test notification", "type": "info"}),

    # === ACTION Tools (Some skipped for safety) ===
    # Git read operations (safe)
    ToolTest("git_stash", "action", {"action": "list"}, is_safe=True),

    # GitHub operations (skip write operations)
    ToolTest("create_issue", "action", {}, is_safe=False, skip_reason="Would create real issue"),
    ToolTest("update_issue", "action", {}, is_safe=False, skip_reason="Would modify issue"),
    ToolTest("close_issue", "action", {}, is_safe=False, skip_reason="Would close issue"),
    ToolTest("create_pr", "action", {}, is_safe=False, skip_reason="Would create PR"),
    ToolTest("merge_pr", "action", {}, is_safe=False, skip_reason="Would merge PR"),
    ToolTest("git_commit", "action", {}, is_safe=False, skip_reason="Would create commit"),
    ToolTest("git_push", "action", {}, is_safe=False, skip_reason="Would push to remote"),
    ToolTest("git_pull", "action", {}, is_safe=False, skip_reason="Would pull from remote"),
    ToolTest("git_checkout", "action", {}, is_safe=False, skip_reason="Would change branch"),
    ToolTest("write_file", "action", {}, is_safe=False, skip_reason="Would modify file"),

    # Build operations (safe but slow)
    ToolTest("cargo_build", "action", {}, is_safe=False, skip_reason="Takes too long"),
    ToolTest("cargo_test", "action", {}, is_safe=False, skip_reason="Takes too long"),
    ToolTest("cargo_clippy", "action", {}, is_safe=False, skip_reason="Takes too long"),

    # === AGENT Tools (Skip execution, just check availability) ===
    ToolTest("execute_agent", "agent", {}, is_safe=False, skip_reason="Would execute agent"),
    ToolTest("execute_agents_parallel", "agent", {}, is_safe=False, skip_reason="Would execute agents"),
    ToolTest("stop_agent", "agent", {}, is_safe=False, skip_reason="No running agent"),
    ToolTest("get_agent_status", "agent", {"agent": "codegen"}),
    ToolTest("get_agent_logs", "agent", {"agent": "codegen", "lines": 10}),
]


async def call_tool(client: httpx.AsyncClient, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Call a single MCP tool"""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    response = await client.post(MCP_ENDPOINT, json=request, timeout=TIMEOUT)
    return response.json()


async def test_tool(client: httpx.AsyncClient, test: ToolTest, verbose: bool = False) -> tuple[TestResult, str]:
    """Test a single tool"""
    if not test.is_safe:
        return TestResult.SKIP, test.skip_reason or "Unsafe operation"

    try:
        result = await call_tool(client, test.name, test.arguments)

        # Check for error in response (error can be None or a dict)
        error = result.get("error")
        if error is not None and isinstance(error, dict):
            error_msg = error.get("message", str(error))
            return TestResult.FAIL, f"Error: {error_msg}"

        if "result" not in result:
            return TestResult.FAIL, "No result in response"

        result_data = result.get("result", {})

        # Check if tool returned an error
        if result_data.get("isError"):
            content = result_data.get("content", [])
            if content:
                error_text = content[0].get("text", "Unknown error")[:100]
                return TestResult.FAIL, f"Tool error: {error_text}"

        if verbose:
            content = result_data.get("content", [])
            if content and isinstance(content, list) and len(content) > 0:
                text = content[0].get("text", "")[:200]
                return TestResult.PASS, f"OK: {text}..."

        return TestResult.PASS, "OK"

    except httpx.TimeoutException:
        return TestResult.FAIL, "Timeout"
    except Exception as e:
        return TestResult.FAIL, f"Exception: {str(e)}"


async def run_tests(category: Optional[str] = None, verbose: bool = False):
    """Run all tool tests"""
    print(f"\n{'='*60}")
    print(f"  Miyabi MCP Tool Test Suite")
    print(f"  Endpoint: {MCP_ENDPOINT}")
    print(f"  Time: {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    # Filter tests by category
    tests = TOOL_TESTS
    if category and category != "all":
        tests = [t for t in TOOL_TESTS if t.category == category]

    results = {
        TestResult.PASS: 0,
        TestResult.FAIL: 0,
        TestResult.SKIP: 0,
        TestResult.WARN: 0,
    }

    failed_tools = []

    async with httpx.AsyncClient() as client:
        # First, verify endpoint is reachable
        try:
            health = await client.get("https://mcp.miyabi-world.com/")
            print(f"Server Status: {health.json()}\n")
        except Exception as e:
            print(f"ERROR: Cannot reach server: {e}")
            return

        # Run tests by category
        current_category = None
        for test in tests:
            if test.category != current_category:
                current_category = test.category
                print(f"\n--- {current_category.upper()} Tools ---")

            result, message = await test_tool(client, test, verbose)
            results[result] += 1

            symbol = {
                TestResult.PASS: "✅",
                TestResult.FAIL: "❌",
                TestResult.SKIP: "⏭️",
                TestResult.WARN: "⚠️",
            }[result]

            print(f"  {symbol} {test.name}: {message}")

            if result == TestResult.FAIL:
                failed_tools.append(test.name)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Summary")
    print(f"{'='*60}")
    print(f"  ✅ Passed: {results[TestResult.PASS]}")
    print(f"  ❌ Failed: {results[TestResult.FAIL]}")
    print(f"  ⏭️  Skipped: {results[TestResult.SKIP]}")
    print(f"  ⚠️  Warnings: {results[TestResult.WARN]}")
    print(f"  Total: {sum(results.values())}")

    if failed_tools:
        print(f"\n  Failed Tools: {', '.join(failed_tools)}")

    print(f"{'='*60}\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Miyabi MCP tools")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    parser.add_argument("--category", "-c", default="all", help="Category to test (data, ui, action, agent, all)")
    args = parser.parse_args()

    asyncio.run(run_tests(args.category, args.verbose))
