#!/usr/bin/env python3
"""
Run Real AI-Powered Level 6 Orchestration
Uses actual code generation (template-based for demo, MCP Codex-ready).

Usage:
    python3 run_real_orchestration.py
"""

import asyncio
import subprocess
import time
import json
import sys
from pathlib import Path
from typing import List, Tuple

class RealOrchestrationRunner:
    """Runner for real AI-powered orchestration."""

    def __init__(self, log_dir: Path = Path("/tmp/miyabi-level6-real")):
        self.log_dir = log_dir
        self.output_dir = Path.home() / "Dev/01-miyabi/_core/miyabi-private/agent-orchestration/webapp_framework_v2"
        self.processes: List[Tuple[str, subprocess.Popen]] = []

    def setup_environment(self):
        """Setup log directory and initialize task queue."""
        print("🛠️  Setting up environment...")

        # Clean and create directories
        import shutil
        if self.log_dir.exists():
            shutil.rmtree(self.log_dir)

        self.log_dir.mkdir(parents=True)
        (self.log_dir / "results").mkdir()
        (self.log_dir / "logs").mkdir()

        # Clean output directory
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        self.output_dir.mkdir()

        # Create task queue (smaller for real execution)
        from datetime import datetime

        task_queue = {
            "version": "2.0.0",
            "mode": "REAL",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "tasks": [
                {
                    "task_id": "Task-1",
                    "agent": "CCG-1",
                    "description": "Analyze requirements and create implementation plan",
                    "dependencies": [],
                    "status": "PENDING",
                    "priority": 1,
                    "estimated_time": 60,
                    "module": "planning"
                },
                {
                    "task_id": "Task-2",
                    "agent": "CG-1",
                    "description": "Generate core module with real code generation",
                    "dependencies": ["Task-1"],
                    "status": "PENDING",
                    "priority": 2,
                    "estimated_time": 120,
                    "module": "core"
                },
                {
                    "task_id": "Task-3",
                    "agent": "CG-2",
                    "description": "Generate http module with real code generation",
                    "dependencies": ["Task-1"],
                    "status": "PENDING",
                    "priority": 2,
                    "estimated_time": 120,
                    "module": "http"
                },
                {
                    "task_id": "Task-4",
                    "agent": "CCG-2",
                    "description": "Create documentation and verify structure",
                    "dependencies": ["Task-2", "Task-3"],
                    "status": "PENDING",
                    "priority": 3,
                    "estimated_time": 60,
                    "module": "docs"
                }
            ]
        }

        with open(self.log_dir / "task_queue.json", 'w') as f:
            json.dump(task_queue, f, indent=2)

        # Initialize agent status files
        for agent_id in ["CCG-1", "CCG-2", "CG-1", "CG-2"]:
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

            with open(self.log_dir / f"agent_{agent_id}_status.json", 'w') as f:
                json.dump(status, f, indent=2)

        print(f"✅ Environment ready")
        print(f"   Log dir: {self.log_dir}")
        print(f"   Output dir: {self.output_dir}")
        print(f"   Tasks: 4 (planning + 2 modules + docs)")
        print()

    def start_agent(self, agent_id: str, real_mode: bool = True) -> subprocess.Popen:
        """Start an agent process."""
        if real_mode:
            script = "agent_ccg_real.py" if agent_id.startswith("CCG") else "agent_cg_real.py"
        else:
            script = "agent_ccg.py" if agent_id.startswith("CCG") else "agent_cg.py"

        print(f"🚀 Starting {agent_id} (REAL MODE)...")

        # Set environment variable for log directory
        import os
        env = os.environ.copy()

        process = subprocess.Popen(
            [sys.executable, script, agent_id],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            text=True,
            env=env
        )

        self.processes.append((agent_id, process))
        time.sleep(0.5)

        return process

    def start_orchestrator(self) -> subprocess.Popen:
        """Start orchestrator with custom log directory."""
        print(f"🎯 Starting orchestrator (REAL MODE)...")

        # Create temporary orchestrator wrapper
        wrapper_script = self.log_dir / "orchestrator_wrapper.py"

        wrapper_content = f'''#!/usr/bin/env python3
import sys
sys.path.insert(0, "{Path.cwd()}")

from orchestrator import MultiAgentOrchestrator
from pathlib import Path
import asyncio

async def main():
    orchestrator = MultiAgentOrchestrator(log_dir=Path("{self.log_dir}"))
    try:
        success = await orchestrator.orchestrate()
        return 0 if success else 1
    except Exception as e:
        print(f"Error: {{e}}")
        return 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
'''

        with open(wrapper_script, 'w') as f:
            f.write(wrapper_content)

        process = subprocess.Popen(
            [sys.executable, str(wrapper_script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        self.processes.append(("orchestrator", process))

        return process

    def monitor_progress(self, timeout: int = 180) -> bool:
        """Monitor orchestration progress."""
        print(f"\n{'='*80}")
        print(f"📊 Monitoring Real Orchestration")
        print(f"⏱️  Timeout: {timeout}s ({timeout/60:.1f} minutes)")
        print(f"{'='*80}\n")

        start_time = time.time()
        last_status = {}

        while time.time() - start_time < timeout:
            task_queue_file = self.log_dir / "task_queue.json"

            if not task_queue_file.exists():
                time.sleep(2)
                continue

            with open(task_queue_file, 'r') as f:
                data = json.load(f)

            tasks = data.get('tasks', [])

            completed = len([t for t in tasks if t['status'] == 'COMPLETED'])
            in_progress = len([t for t in tasks if t['status'] == 'IN_PROGRESS'])
            failed = len([t for t in tasks if t['status'] == 'FAILED'])
            total = len(tasks)

            current_status = (completed, in_progress, failed)
            if current_status != last_status:
                elapsed = int(time.time() - start_time)
                progress = completed / total if total > 0 else 0

                bar_width = 50
                filled = int(bar_width * progress)
                bar = "█" * filled + "░" * (bar_width - filled)

                print(f"[{elapsed:4d}s] [{bar}] {completed}/{total} ✅ | {in_progress} 🔄 | {failed} ❌")

                active_tasks = [t for t in tasks if t['status'] == 'IN_PROGRESS']
                if active_tasks:
                    for task in active_tasks:
                        print(f"        🔄 {task['task_id']}: {task['module']}")

                last_status = current_status

            if completed + failed == total:
                print(f"\n✅ All tasks completed!")
                return failed == 0

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

        print(f"\n{'='*80}")
        print(f"🏁 Real Orchestration Summary")
        print(f"{'='*80}")
        print(f"\n📊 Task Status:")
        print(f"  Total:        {len(tasks)}")
        print(f"  ✅ Completed: {len(completed)} ({len(completed)/len(tasks)*100:.1f}%)")
        print(f"  ❌ Failed:    {len(failed)}")

        # Check generated files
        if self.output_dir.exists():
            py_files = list(self.output_dir.rglob("*.py"))
            md_files = list(self.output_dir.rglob("*.md"))

            print(f"\n📁 Generated Files:")
            print(f"  Python files: {len(py_files)}")
            print(f"  Markdown files: {len(md_files)}")
            print(f"  Output directory: {self.output_dir}")

        result_files = list((self.log_dir / "results").glob("*_real_result.json"))
        print(f"\n📋 Results: {len(result_files)} files")

        print(f"{'='*80}\n")

    def cleanup(self):
        """Stop all processes."""
        print(f"\n🛑 Stopping all processes...")

        for name, process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception:
                pass

        print(f"✅ All {len(self.processes)} processes stopped")

    async def run(self):
        """Run complete real orchestration."""
        print(f"\n{'='*80}")
        print(f"🚀 Level 6 Real AI-Powered Orchestration")
        print(f"{'='*80}")
        print(f"\n📋 Configuration:")
        print(f"  Mode:   REAL (template-based code generation)")
        print(f"  Tasks:  4 (planning + 2 modules + docs)")
        print(f"  Agents: 4 (2 CCG + 2 CG)")
        print(f"  Output: {self.output_dir}")
        print(f"\n{'='*80}\n")

        try:
            # Setup
            self.setup_environment()

            # Start agents
            print("🤖 Starting Real Agents:")
            print("-" * 80)
            self.start_agent("CCG-1", real_mode=True)
            self.start_agent("CCG-2", real_mode=True)
            self.start_agent("CG-1", real_mode=True)
            self.start_agent("CG-2", real_mode=True)
            print(f"✅ All 4 agents started\n")

            # Start orchestrator
            print("🎯 Starting Orchestrator:")
            print("-" * 80)
            self.start_orchestrator()
            print(f"✅ Orchestrator started\n")

            # Give processes time to initialize
            time.sleep(3)

            # Monitor execution
            success = self.monitor_progress(timeout=180)

            # Wait for final updates
            time.sleep(2)

            # Print summary
            self.print_final_summary()

            if success:
                print("✅ REAL ORCHESTRATION SUCCEEDED")
                return 0
            else:
                print("❌ REAL ORCHESTRATION FAILED OR INCOMPLETE")
                return 1

        finally:
            self.cleanup()

async def main():
    """Main entry point."""
    runner = RealOrchestrationRunner()

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
