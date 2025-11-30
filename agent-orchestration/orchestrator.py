#!/usr/bin/env python3
"""
Level 6 Multi-Agent Orchestrator
Coordinates 10 agents (6 CCG + 4 CG) executing 15 tasks in parallel.

Architecture:
- Zero Trust: No reliance on agent memory
- File-based State: All state persisted to JSON files
- Wave-based Execution: Tasks grouped by dependencies
- Hybrid Pattern: CCG (Claude) for planning/review, CG (Codex) for implementation

Version: 1.0.0
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Set
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "PENDING"
    READY = "READY"  # Dependencies met, can start
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AgentStatus(Enum):
    """Agent availability status"""
    IDLE = "IDLE"
    BUSY = "BUSY"
    FAILED = "FAILED"

@dataclass
class Task:
    """Task definition"""
    task_id: str
    agent: str
    description: str
    dependencies: List[str]
    status: str
    priority: int
    estimated_time: int
    module: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None

@dataclass
class Agent:
    """Agent state"""
    agent_id: str
    status: str
    current_task: Optional[str]
    progress: float
    updated_at: str
    errors: List[str]

class MultiAgentOrchestrator:
    """
    Orchestrates multiple AI agents executing tasks in parallel.

    Features:
    - Zero-trust file-based coordination
    - Dependency-aware task scheduling
    - Parallel execution waves
    - Progress monitoring
    - Error handling and recovery
    """

    def __init__(self, log_dir: Path = Path("/tmp/miyabi-level6")):
        self.log_dir = log_dir
        self.task_queue_file = log_dir / "task_queue.json"
        self.results_dir = log_dir / "results"

        self.tasks: Dict[str, Task] = {}
        self.agents: Dict[str, Agent] = {}
        self.completed_tasks: Set[str] = set()
        self.failed_tasks: Set[str] = set()

        self.start_time = None
        self.end_time = None

    def load_task_queue(self) -> None:
        """Load task queue from JSON file."""
        print(f"📋 Loading task queue from {self.task_queue_file}...")

        with open(self.task_queue_file, 'r') as f:
            data = json.load(f)

        for task_data in data['tasks']:
            task = Task(**task_data)
            self.tasks[task.task_id] = task

        print(f"✅ Loaded {len(self.tasks)} tasks")

    def discover_agents(self) -> None:
        """Discover available agents from status files."""
        print("🔍 Discovering agents...")

        agent_files = list(self.log_dir.glob("agent_*_status.json"))

        for agent_file in agent_files:
            with open(agent_file, 'r') as f:
                data = json.load(f)

            agent = Agent(
                agent_id=data['agent_id'],
                status=data['status'],
                current_task=data.get('task_id'),
                progress=data.get('progress', 0.0),
                updated_at=data['updated_at'],
                errors=data.get('errors', [])
            )
            self.agents[agent.agent_id] = agent

        print(f"✅ Discovered {len(self.agents)} agents")
        print(f"   CCG agents: {len([a for a in self.agents if a.startswith('CCG')])}")
        print(f"   CG agents: {len([a for a in self.agents if a.startswith('CG')])}")

    def get_ready_tasks(self) -> List[Task]:
        """Get tasks that are ready to execute (dependencies met)."""
        ready_tasks = []

        for task in self.tasks.values():
            if task.status != TaskStatus.PENDING.value:
                continue

            # Check if all dependencies are completed
            deps_met = all(
                dep_id in self.completed_tasks
                for dep_id in task.dependencies
            )

            if deps_met:
                ready_tasks.append(task)

        # Sort by priority
        ready_tasks.sort(key=lambda t: t.priority)

        return ready_tasks

    def get_idle_agents(self) -> List[Agent]:
        """Get agents that are currently idle."""
        return [
            agent for agent in self.agents.values()
            if agent.status == AgentStatus.IDLE.value
        ]

    def assign_task_to_agent(self, task: Task, agent: Agent) -> None:
        """Assign a task to an agent by updating status files."""

        # Update task status
        task.status = TaskStatus.IN_PROGRESS.value
        task.started_at = datetime.utcnow().isoformat() + "Z"

        # Update agent status file
        agent_status_file = self.log_dir / f"agent_{agent.agent_id}_status.json"

        agent_data = {
            "agent_id": agent.agent_id,
            "task_id": task.task_id,
            "status": AgentStatus.BUSY.value,
            "progress": 0.0,
            "started_at": task.started_at,
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "output_files": [],
            "errors": [],
            "next_task": None
        }

        with open(agent_status_file, 'w') as f:
            json.dump(agent_data, f, indent=2)

        # Update local state
        agent.status = AgentStatus.BUSY.value
        agent.current_task = task.task_id

        print(f"✅ Assigned {task.task_id} ({task.module}) to {agent.agent_id}")

    def check_agent_status(self, agent_id: str) -> Dict:
        """Read agent status from file (zero-trust)."""
        agent_status_file = self.log_dir / f"agent_{agent_id}_status.json"

        if not agent_status_file.exists():
            return None

        with open(agent_status_file, 'r') as f:
            return json.load(f)

    def update_task_status(self) -> None:
        """Update task status by reading agent status files."""

        for agent_id, agent in self.agents.items():
            if agent.status != AgentStatus.BUSY.value:
                continue

            # Read agent status from file
            status_data = self.check_agent_status(agent_id)

            if not status_data or not status_data.get('task_id'):
                continue

            task_id = status_data['task_id']
            task = self.tasks.get(task_id)

            if not task:
                continue

            # Update task based on agent status
            if status_data['status'] == 'COMPLETED':
                task.status = TaskStatus.COMPLETED.value
                task.completed_at = datetime.utcnow().isoformat() + "Z"
                self.completed_tasks.add(task_id)

                # Mark agent as idle and clear its task assignment
                agent.status = AgentStatus.IDLE.value
                agent.current_task = None

                # Clear task_id from agent status file (acknowledge completion)
                status_data['task_id'] = None
                status_data['status'] = 'IDLE'
                agent_status_file = self.log_dir / f"agent_{agent_id}_status.json"
                with open(agent_status_file, 'w') as f:
                    json.dump(status_data, f, indent=2)

                print(f"✅ Task {task_id} completed by {agent_id}")

            elif status_data['status'] == 'FAILED':
                task.status = TaskStatus.FAILED.value
                task.error = status_data.get('errors', ['Unknown error'])[0]
                self.failed_tasks.add(task_id)

                # Mark agent as idle (can take new tasks) and clear its task assignment
                agent.status = AgentStatus.IDLE.value
                agent.current_task = None

                # Clear task_id from agent status file (acknowledge failure)
                status_data['task_id'] = None
                status_data['status'] = 'IDLE'
                agent_status_file = self.log_dir / f"agent_{agent_id}_status.json"
                with open(agent_status_file, 'w') as f:
                    json.dump(status_data, f, indent=2)

                print(f"❌ Task {task_id} failed on {agent_id}: {task.error}")

            elif status_data['status'] == 'IN_PROGRESS':
                # Update progress
                agent.progress = status_data.get('progress', 0.0)

    def save_task_queue(self) -> None:
        """Save current task queue state to file."""
        data = {
            "version": "1.0.0",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "tasks": [
                {
                    "task_id": task.task_id,
                    "agent": task.agent,
                    "description": task.description,
                    "dependencies": task.dependencies,
                    "status": task.status,
                    "priority": task.priority,
                    "estimated_time": task.estimated_time,
                    "module": task.module,
                    "started_at": task.started_at,
                    "completed_at": task.completed_at,
                    "error": task.error
                }
                for task in self.tasks.values()
            ]
        }

        with open(self.task_queue_file, 'w') as f:
            json.dump(data, f, indent=2)

    def print_status(self) -> None:
        """Print current orchestration status."""
        total_tasks = len(self.tasks)
        completed = len(self.completed_tasks)
        failed = len(self.failed_tasks)
        in_progress = len([t for t in self.tasks.values() if t.status == TaskStatus.IN_PROGRESS.value])

        print("\n" + "=" * 60)
        print(f"📊 Orchestration Status")
        print("=" * 60)
        print(f"Total Tasks:     {total_tasks}")
        print(f"Completed:       {completed} ({completed/total_tasks*100:.1f}%)")
        print(f"In Progress:     {in_progress}")
        print(f"Failed:          {failed}")
        print(f"Pending:         {total_tasks - completed - failed - in_progress}")
        print()

        # Show active agents
        busy_agents = [a for a in self.agents.values() if a.status == AgentStatus.BUSY.value]
        if busy_agents:
            print("🔄 Active Agents:")
            for agent in busy_agents:
                task = self.tasks.get(agent.current_task)
                if task:
                    print(f"   {agent.agent_id}: {task.task_id} ({task.module}) - {agent.progress*100:.0f}%")

        print("=" * 60)

    async def orchestrate(self) -> bool:
        """
        Main orchestration loop.

        Returns:
            True if all tasks completed successfully, False otherwise
        """
        print("\n🚀 Starting Multi-Agent Orchestration...")
        print(f"📁 Log directory: {self.log_dir}")
        print()

        self.start_time = time.time()

        # Load task queue and discover agents
        self.load_task_queue()
        self.discover_agents()

        print()
        print("🎯 Beginning task execution...")
        print()

        # Main orchestration loop
        iteration = 0
        while True:
            iteration += 1

            # Update task status from agent files
            self.update_task_status()

            # Get ready tasks and idle agents
            ready_tasks = self.get_ready_tasks()
            idle_agents = self.get_idle_agents()

            # Assign tasks to idle agents
            for task in ready_tasks:
                if not idle_agents:
                    break

                # Find matching agent for task
                # CCG tasks go to CCG agents, CG tasks go to CG agents
                task_agent_prefix = task.agent.split('-')[0]  # CCG or CG

                matching_agent = None
                for agent in idle_agents:
                    agent_prefix = agent.agent_id.split('-')[0]
                    if agent_prefix == task_agent_prefix:
                        matching_agent = agent
                        idle_agents.remove(agent)
                        break

                if matching_agent:
                    self.assign_task_to_agent(task, matching_agent)

            # Check if all tasks are done
            all_done = all(
                task.status in [TaskStatus.COMPLETED.value, TaskStatus.FAILED.value]
                for task in self.tasks.values()
            )

            if all_done:
                break

            # Print status every 10 iterations
            if iteration % 10 == 0:
                self.print_status()

            # Save state
            self.save_task_queue()

            # Wait before next iteration
            await asyncio.sleep(2)

        self.end_time = time.time()

        # Final status
        self.print_status()

        # Summary
        duration = self.end_time - self.start_time
        success = len(self.failed_tasks) == 0

        print()
        print("=" * 60)
        print("🏁 Orchestration Complete")
        print("=" * 60)
        print(f"Duration:        {duration:.1f} seconds ({duration/60:.1f} minutes)")
        print(f"Tasks Completed: {len(self.completed_tasks)}/{len(self.tasks)}")
        print(f"Tasks Failed:    {len(self.failed_tasks)}/{len(self.tasks)}")
        print(f"Success Rate:    {len(self.completed_tasks)/len(self.tasks)*100:.1f}%")
        print()

        if success:
            print("✅ All tasks completed successfully!")
        else:
            print(f"❌ {len(self.failed_tasks)} tasks failed:")
            for task_id in self.failed_tasks:
                task = self.tasks[task_id]
                print(f"   - {task_id}: {task.error}")

        print("=" * 60)

        return success

async def main():
    """Main entry point."""
    orchestrator = MultiAgentOrchestrator()

    try:
        success = await orchestrator.orchestrate()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️ Orchestration interrupted by user")
        orchestrator.save_task_queue()
        return 130
    except Exception as e:
        print(f"\n\n❌ Orchestration failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
