#!/usr/bin/env python3
"""
Run Full Level 6 Multi-Agent Orchestration
Automatically starts all 15 agents and orchestrator, monitors execution.

Usage:
    python3 run_full_orchestration.py
"""

import asyncio
import subprocess
import time
import json
import sys
from pathlib import Path
from typing import List, Tuple

class FullOrchestrationRunner:
    """Automated runner for full 15-agent orchestration."""

    def __init__(self, log_dir: Path = Path("/tmp/miyabi-level6")):
        self.log_dir = log_dir
        self.processes: List[Tuple[str, subprocess.Popen]] = []

    def start_agent(self, agent_id: str) -> subprocess.Popen:
        """Start an agent process."""
        script = "agent_ccg.py" if agent_id.startswith("CCG") else "agent_cg.py"

        print(f"🚀 Starting {agent_id}...")

        process = subprocess.Popen(
            [sys.executable, script, agent_id],
            stdout=subprocess.DEVNULL,  # Suppress output for cleaner display
            stderr=subprocess.DEVNULL,
            text=True
        )

        self.processes.append((agent_id, process))
        time.sleep(0.5)  # Stagger starts

        return process

    def start_orchestrator(self) -> subprocess.Popen:
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

    def monitor_progress(self, timeout: int = 300) -> bool:
        """
        Monitor orchestration progress.

        Args:
            timeout: Maximum seconds to wait (default 5 minutes)

        Returns:
            True if all tasks completed successfully
        """
        print(f"\n{'='*80}")
        print(f"📊 Monitoring Full Orchestration (15 tasks, 15 agents)")
        print(f"⏱️  Timeout: {timeout}s ({timeout/60:.1f} minutes)")
        print(f"{'='*80}\n")

        start_time = time.time()
        last_status = {}

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

            # Only print if status changed
            current_status = (completed, in_progress, failed)
            if current_status != last_status:
                elapsed = int(time.time() - start_time)
                progress = completed / total if total > 0 else 0

                # Progress bar
                bar_width = 50
                filled = int(bar_width * progress)
                bar = "█" * filled + "░" * (bar_width - filled)

                print(f"[{elapsed:4d}s] [{bar}] {completed}/{total} ✅ | {in_progress} 🔄 | {failed} ❌")

                # Show active tasks
                active_tasks = [t for t in tasks if t['status'] == 'IN_PROGRESS']
                if active_tasks:
                    for task in active_tasks[:3]:  # Show up to 3 active tasks
                        print(f"        🔄 {task['task_id']}: {task['module']}")

                last_status = current_status

            # Check if all done
            if completed + failed == total:
                print(f"\n✅ All tasks completed!")
                return failed == 0  # Success if no failures

            time.sleep(3)

        print(f"\n⚠️ Timeout reached after {timeout}s")
        return False

    def print_final_summary(self):
        """Print final execution summary."""
        task_queue_file = self.log_dir / "task_queue.json"

        if not task_queue_file.exists():
            print("❌ No results available")
            return

        with open(task_queue_file, 'r') as f:
            data = json.load(f)

        tasks = data.get('tasks', [])

        completed = [t for t in tasks if t['status'] == 'COMPLETED']
        failed = [t for t in tasks if t['status'] == 'FAILED']
        in_progress = [t for t in tasks if t['status'] == 'IN_PROGRESS']

        print(f"\n{'='*80}")
        print(f"🏁 Final Summary")
        print(f"{'='*80}")
        print(f"\n📊 Task Status:")
        print(f"  Total:        {len(tasks)}")
        print(f"  ✅ Completed: {len(completed)} ({len(completed)/len(tasks)*100:.1f}%)")
        print(f"  ❌ Failed:    {len(failed)} ({len(failed)/len(tasks)*100:.1f}%)")
        print(f"  🔄 Pending:   {len(in_progress)}")

        # Show completed by wave
        print(f"\n📈 Completed by Module:")
        modules = {}
        for task in completed:
            module = task['module']
            modules[module] = modules.get(module, 0) + 1

        for module, count in sorted(modules.items()):
            print(f"  {module:12s}: {count} tasks")

        # Show failures if any
        if failed:
            print(f"\n❌ Failed Tasks:")
            for task in failed:
                print(f"  - {task['task_id']}: {task['description']}")
                if task.get('error'):
                    print(f"    Error: {task['error']}")

        # Count results files
        results_dir = self.log_dir / "results"
        result_files = list(results_dir.glob("*.json"))
        print(f"\n📁 Results Generated: {len(result_files)} files")

        print(f"{'='*80}\n")

    def cleanup(self):
        """Stop all processes."""
        print(f"\n🛑 Stopping all processes...")

        for name, process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                # Don't print individual stop messages for cleaner output
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception:
                pass

        print(f"✅ All {len(self.processes)} processes stopped")

    async def run(self):
        """Run complete full orchestration."""
        print(f"\n{'='*80}")
        print(f"🚀 Level 6 Full Multi-Agent Orchestration")
        print(f"{'='*80}")
        print(f"\n📋 Configuration:")
        print(f"  Tasks:  15 (across 6 dependency waves)")
        print(f"  Agents: 15 (6 CCG + 9 CG)")
        print(f"  Mode:   Simulated execution (fast)")
        print(f"\n{'='*80}\n")

        try:
            # Start all agents
            print("🤖 Starting Agents:")
            print("-" * 80)

            # CCG agents
            for i in range(1, 7):
                self.start_agent(f"CCG-{i}")

            # CG agents
            for i in range(1, 10):
                self.start_agent(f"CG-{i}")

            print(f"✅ All 15 agents started\n")

            # Start orchestrator
            print("🎯 Starting Orchestrator:")
            print("-" * 80)
            self.start_orchestrator()
            print(f"✅ Orchestrator started\n")

            # Give processes time to initialize
            time.sleep(3)

            # Monitor execution
            success = self.monitor_progress(timeout=300)  # 5 minutes

            # Wait for final updates
            time.sleep(2)

            # Print summary
            self.print_final_summary()

            if success:
                print("✅ ORCHESTRATION SUCCEEDED")
                return 0
            else:
                print("❌ ORCHESTRATION FAILED OR INCOMPLETE")
                return 1

        finally:
            self.cleanup()

async def main():
    """Main entry point."""
    runner = FullOrchestrationRunner()

    try:
        exit_code = await runner.run()
        return exit_code
    except KeyboardInterrupt:
        print("\n\n⚠️ Orchestration interrupted by user")
        runner.cleanup()
        return 130
    except Exception as e:
        print(f"\n\n❌ Orchestration failed: {e}")
        import traceback
        traceback.print_exc()
        runner.cleanup()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
