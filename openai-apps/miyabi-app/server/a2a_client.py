"""
A2A Bridge Client - Python client for Miyabi Agent-to-Agent Bridge
"""

import asyncio
import json
import subprocess
from typing import Dict, Any, Optional
from pathlib import Path
import os


class A2ABridgeClient:
    """Client for calling Miyabi Rust agents via A2A Bridge"""

    def __init__(self, miyabi_root: Optional[Path] = None):
        """
        Initialize A2A Bridge client

        Args:
            miyabi_root: Path to Miyabi project root
        """
        self.miyabi_root = miyabi_root or Path(
            os.getenv("MIYABI_ROOT", Path.home() / "Dev" / "miyabi-private")
        )
        self.binary_path = self.miyabi_root / "target" / "release" / "miyabi-mcp-server"

        # Agent name mapping (short name -> A2A tool name)
        self.agent_tools = {
            "coordinator": "a2a.task_coordination_and_parallel_execution_agent.orchestrate_agents",
            "codegen": "a2a.code_generation_agent.generate_code",
            "review": "a2a.code_quality_review_and_security_scan_agent.review_code",
            "issue": "a2a.issue_analysis_and_label_management_agent.analyze_issue",
            "pr": "a2a.pull_request_automation_agent.create_pr",
            "deploy": "a2a.cicd_deployment_automation_agent.deploy",
            "refresher": "a2a.issue_status_monitoring_and_auto_update_agent.refresh_issues",
            "ai_entrepreneur": "a2a.comprehensive_business_planning_and_startup_strategy_agent.plan_business",
            "self_analysis": "a2a.selfanalysis_agent.analyze_self",
            "market_research": "a2a.market_research_and_competitive_analysis_agent.research_market",
            "persona": "a2a.persona_development_and_customer_journey_design_agent.create_persona",
            "product_concept": "a2a.productconcept_agent.design_concept",
            "product_design": "a2a.productdesign_agent.design_product",
            "content_creation": "a2a.contentcreation_agent.create_content",
            "funnel_design": "a2a.funneldesign_agent.design_funnel",
            "sns_strategy": "a2a.snsstrategy_agent.plan_sns",
            "marketing": "a2a.marketing_agent.execute_marketing",
            "sales": "a2a.sales_agent.manage_sales",
            "crm": "a2a.crm_and_customer_management_agent.manage_customers",
            "analytics": "a2a.data_analysis_and_pdca_cycle_agent.analyze_data",
            "youtube": "a2a.youtube_channel_optimization_agent.optimize_youtube",
        }

    async def execute_agent(
        self,
        agent_name: str,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute a Miyabi agent via A2A Bridge

        Args:
            agent_name: Short agent name (e.g., "codegen", "review")
            params: Parameters to pass to the agent

        Returns:
            Agent execution result
        """
        tool_name = self.agent_tools.get(agent_name)
        if not tool_name:
            raise ValueError(f"Unknown agent: {agent_name}")

        # Build JSON-RPC request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "a2a.execute",
            "params": {
                "tool_name": tool_name,
                "input": params,
            },
        }

        # Call MCP server binary
        result = await self._call_mcp_server(request)
        return result

    async def _call_mcp_server(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the Miyabi MCP server binary with JSON-RPC request

        Args:
            request: JSON-RPC request

        Returns:
            JSON-RPC response
        """
        if not self.binary_path.exists():
            raise FileNotFoundError(
                f"MCP server binary not found at {self.binary_path}. "
                "Run 'cargo build --release' first."
            )

        # Prepare environment
        env = os.environ.copy()
        env["GITHUB_TOKEN"] = os.getenv("GITHUB_TOKEN", "")
        env["MIYABI_REPO_OWNER"] = os.getenv("MIYABI_REPO_OWNER", "customer-cloud")
        env["MIYABI_REPO_NAME"] = os.getenv("MIYABI_REPO_NAME", "miyabi-private")

        # Run the binary
        try:
            process = await asyncio.create_subprocess_exec(
                str(self.binary_path),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )

            # Send request
            request_json = json.dumps(request) + "\n"
            stdout, stderr = await process.communicate(request_json.encode())

            # Parse response
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                raise RuntimeError(f"MCP server failed: {error_msg}")

            response_text = stdout.decode().strip()
            if not response_text:
                raise RuntimeError("Empty response from MCP server")

            response = json.loads(response_text)

            # Check for errors
            if "error" in response:
                raise RuntimeError(
                    f"MCP server error: {response['error'].get('message', 'Unknown error')}"
                )

            return response.get("result", {})

        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON response from MCP server: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to call MCP server: {e}")

    async def list_agents(self) -> list[str]:
        """
        List all available agents

        Returns:
            List of agent names
        """
        return list(self.agent_tools.keys())

    async def get_agent_status(self, agent_name: str) -> Dict[str, Any]:
        """
        Get status of a specific agent

        Args:
            agent_name: Agent name

        Returns:
            Agent status information
        """
        # TODO: Implement agent status tracking
        return {
            "name": agent_name,
            "status": "idle",
            "available": agent_name in self.agent_tools,
        }


# Singleton instance
_client: Optional[A2ABridgeClient] = None


def get_client() -> A2ABridgeClient:
    """Get or create A2A Bridge client singleton"""
    global _client
    if _client is None:
        _client = A2ABridgeClient()
    return _client
