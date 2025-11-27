#!/usr/bin/env python3
"""
Miyabi OpenAI App - End-to-End Test Suite (Python)

Tests the complete MCP server implementation including:
- Server health
- MCP protocol compliance
- Tool discovery
- Tool execution
- Authentication
- Error handling
"""

import os
import sys
import json
import time
import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass

# Configuration
SERVER_HOST = os.getenv("SERVER_HOST", "localhost")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
ASSET_PORT = int(os.getenv("ASSET_PORT", "4444"))
BASE_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"
ASSET_URL = f"http://{SERVER_HOST}:{ASSET_PORT}"
ACCESS_TOKEN = os.getenv("MIYABI_ACCESS_TOKEN", "")

# Colors
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
BLUE = '\033[0;34m'
NC = '\033[0m'


@dataclass
class TestResult:
    """Test result data"""
    name: str
    passed: bool
    error: Optional[str] = None
    duration: float = 0.0


class E2ETestSuite:
    """End-to-end test suite for Miyabi MCP server"""

    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.tests_total = 0
        self.results: list[TestResult] = []

    def run_test(self, test_name: str, test_func):
        """Run a single test"""
        self.tests_total += 1
        print(f"{BLUE}[TEST {self.tests_total}]{NC} {test_name}")

        start = time.time()
        try:
            test_func()
            duration = time.time() - start
            print(f"{GREEN}  ✅ PASS{NC} ({duration:.3f}s)")
            self.tests_passed += 1
            self.results.append(TestResult(test_name, True, duration=duration))
        except AssertionError as e:
            duration = time.time() - start
            print(f"{RED}  ❌ FAIL{NC} ({duration:.3f}s)")
            print(f"{YELLOW}  Error: {e}{NC}")
            self.tests_failed += 1
            self.results.append(TestResult(test_name, False, str(e), duration))
        except Exception as e:
            duration = time.time() - start
            print(f"{RED}  ❌ ERROR{NC} ({duration:.3f}s)")
            print(f"{YELLOW}  Exception: {e}{NC}")
            self.tests_failed += 1
            self.results.append(TestResult(test_name, False, str(e), duration))

    def mcp_request(self, method: str, params: Optional[Dict] = None, auth: bool = False) -> Dict:
        """Make MCP JSON-RPC request"""
        headers = {"Content-Type": "application/json"}
        if auth and ACCESS_TOKEN:
            headers["Authorization"] = f"Bearer {ACCESS_TOKEN}"

        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
        }
        if params:
            payload["params"] = params

        response = requests.post(f"{BASE_URL}/mcp", json=payload, headers=headers)
        return response.json()

    # ========================================
    # Test Suite 1: Server Health Checks
    # ========================================

    def test_asset_server_running(self):
        """Asset server is running"""
        response = requests.get(ASSET_URL)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_mcp_server_health(self):
        """MCP server health check"""
        response = requests.get(f"{BASE_URL}/")
        data = response.json()
        assert data["name"] == "Miyabi MCP Server"
        assert data["version"] == "1.0.0"

    def test_mcp_server_tools_count(self):
        """MCP server reports correct tool count"""
        response = requests.get(f"{BASE_URL}/")
        data = response.json()
        assert data["tools"] == 7, f"Expected 7 tools, got {data['tools']}"

    # ========================================
    # Test Suite 2: MCP Protocol
    # ========================================

    def test_mcp_endpoint_info(self):
        """MCP endpoint info (GET)"""
        response = requests.get(f"{BASE_URL}/mcp")
        data = response.json()
        assert data["name"] == "Miyabi MCP Server"
        assert data["protocol"] == "Model Context Protocol (MCP)"

    def test_mcp_initialize(self):
        """MCP protocol initialize handshake"""
        result = self.mcp_request("initialize")
        assert "result" in result
        assert result["result"]["protocolVersion"] == "2024-11-05"
        assert "capabilities" in result["result"]

    # ========================================
    # Test Suite 3: Tool Discovery
    # ========================================

    def test_tools_list(self):
        """tools/list - MCP protocol"""
        result = self.mcp_request("tools/list")
        assert "result" in result
        assert "tools" in result["result"]
        tools = result["result"]["tools"]
        assert len(tools) == 7, f"Expected 7 tools, got {len(tools)}"

    def test_execute_agent_tool_exists(self):
        """tools/list - execute_agent tool exists"""
        result = self.mcp_request("tools/list")
        tools = result["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        assert "execute_agent" in tool_names

    def test_parallel_execution_tool_exists(self):
        """tools/list - execute_agents_parallel tool exists"""
        result = self.mcp_request("tools/list")
        tools = result["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        assert "execute_agents_parallel" in tool_names

    def test_all_expected_tools(self):
        """All expected tools are present"""
        result = self.mcp_request("tools/list")
        tools = result["result"]["tools"]
        tool_names = set(t["name"] for t in tools)

        expected_tools = {
            "execute_agent",
            "create_issue",
            "list_issues",
            "get_project_status",
            "list_agents",
            "show_agent_cards",
            "execute_agents_parallel",
        }

        missing = expected_tools - tool_names
        assert not missing, f"Missing tools: {missing}"

    # ========================================
    # Test Suite 4: Tool Execution
    # ========================================

    def test_get_project_status(self):
        """Execute get_project_status"""
        result = self.mcp_request(
            "tools/call",
            {"name": "get_project_status", "arguments": {}},
        )
        assert "result" in result
        assert "content" in result["result"]

    def test_list_agents(self):
        """Execute list_agents"""
        result = self.mcp_request(
            "tools/call",
            {"name": "list_agents", "arguments": {}},
        )
        assert "result" in result
        assert "content" in result["result"]

    # ========================================
    # Test Suite 5: Authentication
    # ========================================

    def test_authenticated_request(self):
        """Authenticated tools/list"""
        if not ACCESS_TOKEN:
            print(f"{YELLOW}  ⚠️  SKIP - No MIYABI_ACCESS_TOKEN set{NC}")
            return

        result = self.mcp_request("tools/list", auth=True)
        assert "result" in result
        assert len(result["result"]["tools"]) == 7

    def test_reject_without_token(self):
        """Reject request without token (if auth enabled)"""
        if not ACCESS_TOKEN:
            print(f"{YELLOW}  ⚠️  SKIP - Auth not configured{NC}")
            return

        # Request without token should fail
        headers = {"Content-Type": "application/json"}
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
        }

        response = requests.post(f"{BASE_URL}/mcp", json=payload, headers=headers)
        # Should get 401 or error response
        assert response.status_code in [401, 403] or "detail" in response.json()

    # ========================================
    # Test Suite 6: Error Handling
    # ========================================

    def test_unknown_method(self):
        """Handle unknown method"""
        result = self.mcp_request("unknown_method")
        assert "error" in result
        assert "message" in result["error"]

    def test_unknown_tool(self):
        """Handle unknown tool"""
        result = self.mcp_request(
            "tools/call",
            {"name": "unknown_tool", "arguments": {}},
        )
        assert "error" in result

    def test_invalid_json_rpc(self):
        """Handle invalid JSON-RPC"""
        headers = {"Content-Type": "application/json"}
        payload = {"invalid": "request"}

        response = requests.post(f"{BASE_URL}/mcp", json=payload, headers=headers)
        data = response.json()
        # Should have error or jsonrpc field
        assert "error" in data or "jsonrpc" in data

    # ========================================
    # Main Test Runner
    # ========================================

    def run_all(self):
        """Run all test suites"""
        print(f"\n🧪 Miyabi OpenAI App - E2E Test Suite (Python)")
        print("=" * 50)
        print()
        print(f"🔧 Configuration:")
        print(f"  MCP Server: {BASE_URL}")
        print(f"  Asset Server: {ASSET_URL}")
        print(f"  Auth Token: {'SET' if ACCESS_TOKEN else 'NOT SET (dev mode)'}")
        print()

        # Test Suite 1
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 1: Server Health Checks{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("Asset server is running", self.test_asset_server_running)
        self.run_test("MCP server health check", self.test_mcp_server_health)
        self.run_test("MCP server tools count", self.test_mcp_server_tools_count)

        # Test Suite 2
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 2: MCP Protocol{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("MCP endpoint info", self.test_mcp_endpoint_info)
        self.run_test("MCP initialize handshake", self.test_mcp_initialize)

        # Test Suite 3
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 3: Tool Discovery{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("tools/list", self.test_tools_list)
        self.run_test("execute_agent tool exists", self.test_execute_agent_tool_exists)
        self.run_test("execute_agents_parallel exists", self.test_parallel_execution_tool_exists)
        self.run_test("All expected tools present", self.test_all_expected_tools)

        # Test Suite 4
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 4: Tool Execution{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("Execute get_project_status", self.test_get_project_status)
        self.run_test("Execute list_agents", self.test_list_agents)

        # Test Suite 5
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 5: Authentication{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("Authenticated tools/list", self.test_authenticated_request)
        self.run_test("Reject without token", self.test_reject_without_token)

        # Test Suite 6
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Suite 6: Error Handling{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()
        self.run_test("Handle unknown method", self.test_unknown_method)
        self.run_test("Handle unknown tool", self.test_unknown_tool)
        self.run_test("Handle invalid JSON-RPC", self.test_invalid_json_rpc)

        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print()
        print(f"{BLUE}{'=' * 50}{NC}")
        print(f"{BLUE}Test Results Summary{NC}")
        print(f"{BLUE}{'=' * 50}{NC}")
        print()

        print("Results:")
        for result in self.results:
            status = "✅" if result.passed else "❌"
            print(f"  {status} {result.name}")

        print()
        print("=" * 50)
        print(f"Total Tests:  {self.tests_total}")
        print(f"{GREEN}Passed:       {self.tests_passed}{NC}")
        print(f"{RED}Failed:       {self.tests_failed}{NC}")
        print("=" * 50)

        if self.tests_total > 0:
            pass_rate = (self.tests_passed / self.tests_total) * 100
            print(f"Pass Rate:    {pass_rate:.1f}%")

        # Total duration
        total_duration = sum(r.duration for r in self.results)
        print(f"Total Time:   {total_duration:.3f}s")
        print()

        if self.tests_failed > 0:
            print(f"{RED}❌ Some tests failed{NC}")
            sys.exit(1)
        else:
            print(f"{GREEN}✅ All tests passed!{NC}")
            sys.exit(0)


if __name__ == "__main__":
    suite = E2ETestSuite()
    suite.run_all()
