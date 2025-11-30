#!/usr/bin/env python3
"""
Test Multi-Agent Orchestration with minimal setup
Tests orchestrator with 2-3 agents to verify basic functionality.

Usage:
    python3 test_orchestration.py
"""

import asyncio
import subprocess
import time
import json
from pathlib import Path
import sys

class OrchestrationTester:
    """Test harness for multi-agent orchestration."""

    def __init__(self, log_dir: Path = Path("/tmp/miyabi-level6")):
        self.log_dir = log_dir
        self.processes = []

    def create_minimal_task_queue(self):
        """Create a minimal task queue for testing (3 tasks)."""
        task_queue_file = self.log_dir / "task_queue.json"

        minimal_tasks = {
            "version": "1.0.0",
            "created_at": "2025-11-30T00:00:00Z",
            "tasks": [
                {
                    "task_id": "Task-1",
                    "agent": "CCG-1",
                    "description": "Planning phase - analyze requirements",
                    "dependencies": [],
                    "status": "PENDING",
                    "priority": 1,
                    "estimated_time": 10,
                    "module": "planning"
                },
                {
                    "task_id": "Task-2",
                    "agent": "CG-1",
                    "description": "Implement core module",
                    "dependencies": ["Task-1"],
                    "status": "PENDING",
                    "priority": 2,
                    "estimated_time": 15,
                    "module": "core"
                },
                {
                    "task_id": "Task-3",
                    "agent": "CG-2",
                    "description": "Implement http module",
                    "dependencies": ["Task-1"],
                    "status": "PENDING",
                    "priority": 2,
                    "estimated_time": 15,
                    "module": "http"
                }
            ]
        }

        with open(task_queue_file, 'w') as f:
            json.dump(minimal_tasks, f, indent=2)

        print(f"✅ Created minimal task queue: 3 tasks")

    def initialize_test_agents(self):
        """Initialize status files for test agents (3 agents)."""
        from datetime import datetime

        for agent_id in ["CCG-1", "CG-1", "CG-2"]:
            status_file = self.log_dir / f"agent_{agent_id}_status.json"

            status = {
                "agent_id": agent_id,
                "task_id": None,
                "status": "IDLE",
                "progress": 0.0,
                "started_at": None,
                "updated_at": datetime.utcnow().isoformat() + "Z",
                "output_files": [],
                "errors": [],
                "next_task": None
            }

            with open(status_file, 'w') as f:
                json.dump(status, f, indent=2)

        print(f"✅ Initialized 3 agent status files")

    def start_agent(self, agent_id: str, script: str):
        """Start an agent process."""
        print(f"🚀 Starting {agent_id}...")

        process = subprocess.Popen(
            [sys.executable, script, agent_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        self.processes.append((agent_id, process))
        time.sleep(1)  # Give agent time to start

        return process

    def start_orchestrator(self):
        """Start orchestrator process."""
        print(f"🎯 Starting orchestrator...")

        process = subprocess.Popen(
            [sys.executable, "orchestrator.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        self.processes.append(("orchestrator", process))

        return process

    def monitor_progress(self, timeout: int = 120):
        """Monitor orchestration progress."""
        print(f"\n{'='*60}")
        print(f"📊 Monitoring orchestration (timeout: {timeout}s)")
        print(f"{'='*60}\n")

        start_time = time.time()

        while time.time() - start_time < timeout:
            # Read task queue
            task_queue_file = self.log_dir / "task_queue.json"

            if not task_queue_file.exists():
                time.sleep(2)
                continue

            with open(task_queue_file, 'r') as f:
                data = json.load(f)

            tasks = data.get('tasks', [])

            # Count statuses
            completed = len([t for t in tasks if t['status'] == 'COMPLETED'])
            in_progress = len([t for t in tasks if t['status'] == 'IN_PROGRESS'])
            failed = len([t for t in tasks if t['status'] == 'FAILED'])
            total = len(tasks)

            print(f"⏱️  [{int(time.time() - start_time):3d}s] Tasks: {completed}/{total} completed, {in_progress} in progress, {failed} failed")

            # Check if all done
            if completed + failed == total:
                print(f"\n✅ All tasks completed!")
                return completed == total  # True if all succeeded

            time.sleep(5)

        print(f"\n⚠️ Timeout reached after {timeout}s")
        return False

    def cleanup(self):
        """Stop all processes."""
        print(f"\n🛑 Stopping all processes...")

        for name, process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"   ✅ Stopped {name}")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"   ⚠️ Killed {name} (timeout)")
            except Exception as e:
                print(f"   ❌ Error stopping {name}: {e}")

    def print_results(self):
        """Print final test results."""
        task_queue_file = self.log_dir / "task_queue.json"

        if not task_queue_file.exists():
            print("❌ No results available")
            return False

        with open(task_queue_file, 'r') as f:
            data = json.load(f)

        tasks = data.get('tasks', [])

        print(f"\n{'='*60}")
        print(f"🏁 Test Results")
        print(f"{'='*60}\n")

        for task in tasks:
            status = task['status']
            icon = "✅" if status == "COMPLETED" else "❌" if status == "FAILED" else "⏳"
            print(f"{icon} {task['task_id']}: {task['description'][:50]}")
            print(f"   Status: {status} | Module: {task['module']}")

        completed = len([t for t in tasks if t['status'] == 'COMPLETED'])
        failed = len([t for t in tasks if t['status'] == 'FAILED'])

        print(f"\n{'='*60}")
        print(f"Summary: {completed}/{len(tasks)} completed, {failed}/{len(tasks)} failed")
        print(f"{'='*60}\n")

        return failed == 0

    async def run_test(self):
        """Run complete orchestration test."""
        print(f"\n{'='*60}")
        print(f"🧪 Level 6 Multi-Agent Orchestration Test")
        print(f"{'='*60}\n")

        # Setup
        print("📋 Phase 1: Setup")
        print("-" * 60)
        self.create_minimal_task_queue()
        self.initialize_test_agents()
        print()

        # Start agents
        print("🚀 Phase 2: Starting Agents")
        print("-" * 60)
        try:
            self.start_agent("CCG-1", "agent_ccg.py")
            self.start_agent("CG-1", "agent_cg.py")
            self.start_agent("CG-2", "agent_cg.py")
            print()

            # Start orchestrator
            print("🎯 Phase 3: Starting Orchestrator")
            print("-" * 60)
            self.start_orchestrator()
            print()

            # Give processes time to initialize
            time.sleep(3)

            # Monitor
            print("📊 Phase 4: Monitoring Execution")
            print("-" * 60)
            success = self.monitor_progress(timeout=60)

            # Wait a bit for final status updates
            time.sleep(2)

            # Results
            print("\n📈 Phase 5: Results")
            print("-" * 60)
            all_completed = self.print_results()

            if success and all_completed:
                print("✅ TEST PASSED: Orchestration completed successfully!")
                return True
            else:
                print("❌ TEST FAILED: Some tasks did not complete")
                return False

        finally:
            self.cleanup()

async def main():
    """Main entry point."""
    tester = OrchestrationTester()

    try:
        success = await tester.run_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        tester.cleanup()
        return 130
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        tester.cleanup()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
