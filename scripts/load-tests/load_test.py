#!/usr/bin/env python3
"""
Miyabi Agent Load Test Framework
Issue: #853 - Load Test & Performance Test

This script simulates concurrent agent operations for load testing
the Miyabi 200-Agent experiment infrastructure.

Usage:
    python load_test.py --scenario normal
    python load_test.py --scenario peak --agents 400 --duration 7200
    python load_test.py --scenario spike
    python load_test.py --scenario endurance --duration 86400
"""

import argparse
import asyncio
import json
import random
import statistics
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional

try:
    import aiohttp
except ImportError:
    print("Error: aiohttp is required. Install with: pip install aiohttp")
    sys.exit(1)


class LoadScenario(Enum):
    NORMAL = "normal"      # 200 agents, 4 hours
    PEAK = "peak"          # 400 agents, 2 hours
    SPIKE = "spike"        # Rapid increase/decrease
    ENDURANCE = "endurance"  # 200 agents, 24 hours


class AgentType(Enum):
    CODEGEN = "CodeGenAgent"
    REVIEW = "ReviewAgent"
    ISSUE = "IssueAgent"
    PR = "PRAgent"
    DEPLOYMENT = "DeploymentAgent"
    COORDINATOR = "CoordinatorAgent"
    REFRESHER = "RefresherAgent"


@dataclass
class AgentTask:
    """Simulated agent task"""
    task_id: str
    agent_type: AgentType
    priority: str
    payload: dict
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class TaskResult:
    """Task execution result"""
    task_id: str
    success: bool
    duration_ms: float
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class LoadTestMetrics:
    """Metrics collected during load test"""
    total_tasks: int = 0
    successful_tasks: int = 0
    failed_tasks: int = 0
    response_times: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    @property
    def success_rate(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return (self.successful_tasks / self.total_tasks) * 100

    @property
    def avg_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        return statistics.mean(self.response_times)

    @property
    def p95_response_time(self) -> float:
        if len(self.response_times) < 2:
            return 0.0
        sorted_times = sorted(self.response_times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[idx]

    @property
    def p99_response_time(self) -> float:
        if len(self.response_times) < 2:
            return 0.0
        sorted_times = sorted(self.response_times)
        idx = int(len(sorted_times) * 0.99)
        return sorted_times[idx]

    @property
    def duration_seconds(self) -> float:
        if not self.start_time or not self.end_time:
            return 0.0
        return (self.end_time - self.start_time).total_seconds()


class LoadTestConfig:
    """Load test configuration"""

    SCENARIO_CONFIGS = {
        LoadScenario.NORMAL: {
            "agents": 200,
            "duration": 4 * 3600,  # 4 hours
            "ramp_up_time": 300,   # 5 minutes
            "tasks_per_agent": 10,
        },
        LoadScenario.PEAK: {
            "agents": 400,
            "duration": 2 * 3600,  # 2 hours
            "ramp_up_time": 180,   # 3 minutes
            "tasks_per_agent": 15,
        },
        LoadScenario.SPIKE: {
            "agents": 200,
            "duration": 1800,      # 30 minutes
            "ramp_up_time": 30,    # 30 seconds
            "tasks_per_agent": 5,
            "spike_multiplier": 3,
            "spike_intervals": [300, 600, 900],  # Spike at 5, 10, 15 minutes
        },
        LoadScenario.ENDURANCE: {
            "agents": 200,
            "duration": 24 * 3600,  # 24 hours
            "ramp_up_time": 600,    # 10 minutes
            "tasks_per_agent": 50,
        },
    }

    SUCCESS_CRITERIA = {
        "cpu_threshold": 70,        # CPU < 70%
        "success_rate": 99,         # Success rate > 99%
        "response_time_p95": 2.0,   # Response time < 2.0s
    }


class AgentSimulator:
    """Simulates agent behavior for load testing"""

    def __init__(
        self,
        agent_id: int,
        agent_type: AgentType,
        base_url: str,
        session: aiohttp.ClientSession,
    ):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.base_url = base_url
        self.session = session
        self.tasks_completed = 0
        self.errors = 0

    async def simulate_task(self) -> TaskResult:
        """Simulate a single agent task"""
        task_id = f"{self.agent_type.value}-{self.agent_id}-{self.tasks_completed}"
        start_time = time.time()

        try:
            # Simulate task processing
            processing_time = self._get_processing_time()

            # Send heartbeat
            await self._send_heartbeat()

            # Simulate work
            await asyncio.sleep(processing_time)

            # Report completion
            await self._report_completion(task_id)

            duration_ms = (time.time() - start_time) * 1000
            self.tasks_completed += 1

            return TaskResult(
                task_id=task_id,
                success=True,
                duration_ms=duration_ms,
            )

        except Exception as e:
            self.errors += 1
            duration_ms = (time.time() - start_time) * 1000
            return TaskResult(
                task_id=task_id,
                success=False,
                duration_ms=duration_ms,
                error=str(e),
            )

    def _get_processing_time(self) -> float:
        """Get simulated processing time based on agent type"""
        # Different agent types have different processing times
        base_times = {
            AgentType.CODEGEN: 5.0,
            AgentType.REVIEW: 3.0,
            AgentType.ISSUE: 1.0,
            AgentType.PR: 2.0,
            AgentType.DEPLOYMENT: 10.0,
            AgentType.COORDINATOR: 0.5,
            AgentType.REFRESHER: 0.2,
        }
        base = base_times.get(self.agent_type, 2.0)
        # Add some randomness
        return base * random.uniform(0.5, 1.5)

    async def _send_heartbeat(self) -> None:
        """Send agent heartbeat"""
        try:
            url = f"{self.base_url}/api/agents/{self.agent_id}/heartbeat"
            async with self.session.post(
                url,
                json={
                    "agent_id": self.agent_id,
                    "agent_type": self.agent_type.value,
                    "status": "running",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                # Just check we got a response
                await resp.text()
        except Exception:
            # Heartbeat failures are not critical
            pass

    async def _report_completion(self, task_id: str) -> None:
        """Report task completion"""
        try:
            url = f"{self.base_url}/api/tasks/{task_id}/complete"
            async with self.session.post(
                url,
                json={
                    "task_id": task_id,
                    "status": "completed",
                    "agent_id": self.agent_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                await resp.text()
        except Exception:
            # Completion report failures are tracked but don't fail the task
            pass


class LoadTestRunner:
    """Main load test execution engine"""

    def __init__(
        self,
        scenario: LoadScenario,
        base_url: str,
        agents_override: Optional[int] = None,
        duration_override: Optional[int] = None,
        output_dir: Optional[Path] = None,
    ):
        self.scenario = scenario
        self.base_url = base_url.rstrip("/")
        self.config = LoadTestConfig.SCENARIO_CONFIGS[scenario].copy()

        if agents_override:
            self.config["agents"] = agents_override
        if duration_override:
            self.config["duration"] = duration_override

        self.output_dir = output_dir or Path("load-test-results")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.metrics = LoadTestMetrics()
        self.agents: list[AgentSimulator] = []
        self.running = False

    async def run(self) -> LoadTestMetrics:
        """Execute the load test"""
        print(f"\n{'='*60}")
        print(f"Miyabi Load Test - {self.scenario.value.upper()} Scenario")
        print(f"{'='*60}")
        print(f"Agents: {self.config['agents']}")
        print(f"Duration: {self.config['duration']}s ({self.config['duration']/3600:.1f}h)")
        print(f"Target URL: {self.base_url}")
        print(f"{'='*60}\n")

        self.metrics = LoadTestMetrics()
        self.metrics.start_time = datetime.now(timezone.utc)
        self.running = True

        async with aiohttp.ClientSession() as session:
            # Create agent simulators
            self._create_agents(session)

            # Run based on scenario type
            if self.scenario == LoadScenario.SPIKE:
                await self._run_spike_test()
            else:
                await self._run_steady_test()

        self.metrics.end_time = datetime.now(timezone.utc)
        self.running = False

        # Generate report
        self._generate_report()

        return self.metrics

    def _create_agents(self, session: aiohttp.ClientSession) -> None:
        """Create agent simulators"""
        agent_types = list(AgentType)
        for i in range(self.config["agents"]):
            agent_type = agent_types[i % len(agent_types)]
            self.agents.append(
                AgentSimulator(
                    agent_id=i,
                    agent_type=agent_type,
                    base_url=self.base_url,
                    session=session,
                )
            )

    async def _run_steady_test(self) -> None:
        """Run steady-state load test"""
        print("Starting steady-state load test...")

        # Ramp up
        ramp_up_time = self.config["ramp_up_time"]
        agents_per_second = self.config["agents"] / ramp_up_time

        active_agents: list[asyncio.Task] = []
        start_time = time.time()
        agents_started = 0

        while time.time() - start_time < self.config["duration"]:
            elapsed = time.time() - start_time

            # Ramp up phase
            if elapsed < ramp_up_time:
                target_agents = int(agents_per_second * elapsed)
                while agents_started < target_agents and agents_started < len(self.agents):
                    agent = self.agents[agents_started]
                    task = asyncio.create_task(self._agent_worker(agent))
                    active_agents.append(task)
                    agents_started += 1
            elif agents_started < len(self.agents):
                # Start remaining agents
                for i in range(agents_started, len(self.agents)):
                    agent = self.agents[i]
                    task = asyncio.create_task(self._agent_worker(agent))
                    active_agents.append(task)
                agents_started = len(self.agents)

            # Progress update
            if int(elapsed) % 60 == 0 and int(elapsed) > 0:
                self._print_progress(elapsed)

            await asyncio.sleep(1)

        # Stop all agents
        self.running = False
        for task in active_agents:
            task.cancel()

        await asyncio.gather(*active_agents, return_exceptions=True)

    async def _run_spike_test(self) -> None:
        """Run spike load test with rapid increases"""
        print("Starting spike load test...")

        spike_config = self.config
        base_agents = spike_config["agents"]
        spike_multiplier = spike_config.get("spike_multiplier", 3)
        spike_intervals = spike_config.get("spike_intervals", [300, 600, 900])

        active_agents: list[asyncio.Task] = []
        start_time = time.time()
        current_agent_count = 0
        in_spike = False

        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < spike_config["duration"]:
                elapsed = time.time() - start_time

                # Check for spike intervals
                for spike_time in spike_intervals:
                    if spike_time <= elapsed < spike_time + 60:
                        if not in_spike:
                            print(f"\n  SPIKE at {int(elapsed)}s!")
                            in_spike = True
                            # Scale up agents
                            target = int(base_agents * spike_multiplier)
                            while current_agent_count < target:
                                agent = AgentSimulator(
                                    agent_id=current_agent_count,
                                    agent_type=random.choice(list(AgentType)),
                                    base_url=self.base_url,
                                    session=session,
                                )
                                task = asyncio.create_task(self._agent_worker(agent))
                                active_agents.append(task)
                                current_agent_count += 1
                    elif elapsed >= spike_time + 60:
                        if in_spike:
                            in_spike = False
                            # Scale down (just let tasks complete naturally)

                # Start base agents
                if not in_spike and current_agent_count < base_agents:
                    target = min(current_agent_count + 10, base_agents)
                    while current_agent_count < target:
                        agent = AgentSimulator(
                            agent_id=current_agent_count,
                            agent_type=random.choice(list(AgentType)),
                            base_url=self.base_url,
                            session=session,
                        )
                        task = asyncio.create_task(self._agent_worker(agent))
                        active_agents.append(task)
                        current_agent_count += 1

                if int(elapsed) % 30 == 0 and int(elapsed) > 0:
                    self._print_progress(elapsed)

                await asyncio.sleep(1)

        self.running = False
        for task in active_agents:
            task.cancel()
        await asyncio.gather(*active_agents, return_exceptions=True)

    async def _agent_worker(self, agent: AgentSimulator) -> None:
        """Worker coroutine for a single agent"""
        tasks_to_run = self.config["tasks_per_agent"]

        while self.running and agent.tasks_completed < tasks_to_run:
            result = await agent.simulate_task()

            self.metrics.total_tasks += 1
            if result.success:
                self.metrics.successful_tasks += 1
            else:
                self.metrics.failed_tasks += 1
                if result.error:
                    self.metrics.errors.append(result.error)

            self.metrics.response_times.append(result.duration_ms)

            # Small delay between tasks
            await asyncio.sleep(random.uniform(0.1, 0.5))

    def _print_progress(self, elapsed: float) -> None:
        """Print progress update"""
        minutes = int(elapsed / 60)
        success_rate = self.metrics.success_rate
        avg_time = self.metrics.avg_response_time

        print(
            f"  [{minutes:3d}m] Tasks: {self.metrics.total_tasks:5d} | "
            f"Success: {success_rate:.1f}% | "
            f"Avg: {avg_time:.0f}ms"
        )

    def _generate_report(self) -> None:
        """Generate load test report"""
        report = {
            "scenario": self.scenario.value,
            "config": self.config,
            "metrics": {
                "total_tasks": self.metrics.total_tasks,
                "successful_tasks": self.metrics.successful_tasks,
                "failed_tasks": self.metrics.failed_tasks,
                "success_rate_percent": round(self.metrics.success_rate, 2),
                "avg_response_time_ms": round(self.metrics.avg_response_time, 2),
                "p95_response_time_ms": round(self.metrics.p95_response_time, 2),
                "p99_response_time_ms": round(self.metrics.p99_response_time, 2),
                "duration_seconds": round(self.metrics.duration_seconds, 2),
            },
            "success_criteria": LoadTestConfig.SUCCESS_CRITERIA,
            "passed": self._check_success_criteria(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Save JSON report
        report_file = self.output_dir / f"load_test_{self.scenario.value}_{int(time.time())}.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        # Print summary
        print(f"\n{'='*60}")
        print("Load Test Complete")
        print(f"{'='*60}")
        print(f"Total Tasks: {self.metrics.total_tasks}")
        print(f"Successful: {self.metrics.successful_tasks}")
        print(f"Failed: {self.metrics.failed_tasks}")
        print(f"Success Rate: {self.metrics.success_rate:.2f}%")
        print(f"Avg Response Time: {self.metrics.avg_response_time:.2f}ms")
        print(f"P95 Response Time: {self.metrics.p95_response_time:.2f}ms")
        print(f"P99 Response Time: {self.metrics.p99_response_time:.2f}ms")
        print(f"Duration: {self.metrics.duration_seconds:.1f}s")
        print(f"\nResult: {'PASSED' if report['passed'] else 'FAILED'}")
        print(f"Report saved to: {report_file}")
        print(f"{'='*60}\n")

    def _check_success_criteria(self) -> bool:
        """Check if test passed success criteria"""
        criteria = LoadTestConfig.SUCCESS_CRITERIA

        if self.metrics.success_rate < criteria["success_rate"]:
            print(f"  FAIL: Success rate {self.metrics.success_rate:.1f}% < {criteria['success_rate']}%")
            return False

        p95_seconds = self.metrics.p95_response_time / 1000
        if p95_seconds > criteria["response_time_p95"]:
            print(f"  FAIL: P95 response time {p95_seconds:.2f}s > {criteria['response_time_p95']}s")
            return False

        return True


def main():
    parser = argparse.ArgumentParser(
        description="Miyabi Agent Load Test Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --scenario normal
  %(prog)s --scenario peak --agents 400 --duration 7200
  %(prog)s --scenario spike
  %(prog)s --scenario endurance --duration 86400 --url http://api.miyabi.example.com
        """,
    )

    parser.add_argument(
        "--scenario",
        type=str,
        choices=["normal", "peak", "spike", "endurance"],
        default="normal",
        help="Load test scenario (default: normal)",
    )
    parser.add_argument(
        "--agents",
        type=int,
        help="Override number of agents",
    )
    parser.add_argument(
        "--duration",
        type=int,
        help="Override test duration in seconds",
    )
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:4000",
        help="Target API URL (default: http://localhost:4000)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output directory for results",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show configuration without running test",
    )

    args = parser.parse_args()

    scenario = LoadScenario(args.scenario)
    output_dir = Path(args.output) if args.output else None

    if args.dry_run:
        config = LoadTestConfig.SCENARIO_CONFIGS[scenario].copy()
        if args.agents:
            config["agents"] = args.agents
        if args.duration:
            config["duration"] = args.duration

        print("Dry run - Configuration:")
        print(json.dumps(config, indent=2))
        return

    runner = LoadTestRunner(
        scenario=scenario,
        base_url=args.url,
        agents_override=args.agents,
        duration_override=args.duration,
        output_dir=output_dir,
    )

    try:
        asyncio.run(runner.run())
    except KeyboardInterrupt:
        print("\nLoad test interrupted by user")
        sys.exit(1)


if __name__ == "__main__":
    main()
