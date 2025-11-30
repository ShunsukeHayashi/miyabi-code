#!/usr/bin/env python3
"""
CG Agent Wrapper - Codex Generator Agent
Executes tasks assigned by the orchestrator using Codex via MCP.

Usage:
    python3 agent_cg.py <agent_id>

Example:
    python3 agent_cg.py CG-1
"""

import sys
import json
import time
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

class CGAgent:
    """
    Codex Generator Agent Wrapper

    Responsibilities:
    - Poll status file for assigned tasks
    - Execute tasks using Codex via MCP
    - Update status file with progress
    - Handle errors and retries
    """

    def __init__(self, agent_id: str, log_dir: Path = Path("/tmp/miyabi-level6")):
        self.agent_id = agent_id
        self.log_dir = log_dir
        self.status_file = log_dir / f"agent_{agent_id}_status.json"
        self.results_dir = log_dir / "results"
        self.results_dir.mkdir(exist_ok=True)

        self.task_queue_file = log_dir / "task_queue.json"

        print(f"⚙️ {agent_id} initialized")
        print(f"📁 Status file: {self.status_file}")

    def read_status(self) -> Dict:
        """Read agent status from file."""
        if not self.status_file.exists():
            return {
                "agent_id": self.agent_id,
                "task_id": None,
                "status": "IDLE",
                "progress": 0.0,
                "started_at": None,
                "updated_at": datetime.utcnow().isoformat() + "Z",
                "output_files": [],
                "errors": [],
                "next_task": None
            }

        with open(self.status_file, 'r') as f:
            return json.load(f)

    def write_status(self, status_data: Dict) -> None:
        """Write agent status to file."""
        status_data['updated_at'] = datetime.utcnow().isoformat() + "Z"

        with open(self.status_file, 'w') as f:
            json.dump(status_data, f, indent=2)

    def get_task_details(self, task_id: str) -> Optional[Dict]:
        """Get task details from task queue."""
        if not self.task_queue_file.exists():
            return None

        with open(self.task_queue_file, 'r') as f:
            data = json.load(f)

        for task in data['tasks']:
            if task['task_id'] == task_id:
                return task

        return None

    def execute_task_via_codex(self, task: Dict) -> bool:
        """
        Execute task using Codex via MCP.

        This would call the MCP Codex server to execute implementation tasks.

        For now, this is a simulation. In production:
        1. Call MCP Codex server via subprocess/MCP protocol
        2. Pass task description and module specifications
        3. Monitor execution and collect generated code
        4. Save results to output files

        Returns:
            True if successful, False otherwise
        """
        task_id = task['task_id']
        module = task['module']
        description = task['description']

        print(f"\n{'='*60}")
        print(f"🔧 Executing {task_id} via Codex")
        print(f"📦 Module: {module}")
        print(f"📝 Description: {description}")
        print(f"{'='*60}\n")

        # Update status: IN_PROGRESS
        status = self.read_status()
        status['status'] = 'IN_PROGRESS'
        status['progress'] = 0.1
        self.write_status(status)

        try:
            # In production, this would call Codex via MCP:
            # subprocess.run([
            #     "codex",
            #     "exec",
            #     "--prompt", f"Implement {module} module: {description}",
            #     "--model", "sonnet"
            # ])

            # Simulate progress updates
            for progress in [0.25, 0.5, 0.75]:
                time.sleep(3)  # Simulate work (Codex is slower than Claude for complex tasks)
                status['progress'] = progress
                self.write_status(status)
                print(f"⏳ Progress: {progress*100:.0f}%")

            # Simulate completion
            time.sleep(3)
            output_file = self.results_dir / f"{task_id}_codex_result.json"

            # Create result file
            result_data = {
                "task_id": task_id,
                "agent_id": self.agent_id,
                "module": module,
                "status": "COMPLETED",
                "completed_at": datetime.utcnow().isoformat() + "Z",
                "output_files": [str(output_file)],
                "summary": f"Successfully implemented {module} module via Codex",
                "files_generated": self._simulate_files_generated(module)
            }

            with open(output_file, 'w') as f:
                json.dump(result_data, f, indent=2)

            # Update status: COMPLETED (keep task_id so orchestrator knows which task)
            status['status'] = 'COMPLETED'
            status['progress'] = 1.0
            status['output_files'] = [str(output_file)]
            # Don't clear task_id yet - orchestrator needs it to identify completed task
            self.write_status(status)

            print(f"\n✅ Task {task_id} completed successfully via Codex!")
            print(f"📁 Result saved to: {output_file}\n")

            return True

        except Exception as e:
            print(f"\n❌ Task {task_id} failed: {e}\n")

            # Update status: FAILED (keep task_id so orchestrator knows which task failed)
            status['status'] = 'FAILED'
            status['errors'] = [str(e)]
            # Don't clear task_id yet - orchestrator needs it
            self.write_status(status)

            return False

    def _simulate_files_generated(self, module: str) -> list:
        """Simulate file generation based on module."""
        module_files = {
            "core": ["application.py", "request.py", "response.py", "router.py", "middleware.py"],
            "http": ["headers.py", "cookies.py", "session.py", "status.py"],
            "routing": ["router.py", "matcher.py", "dispatcher.py"],
            "utils": ["validators.py", "helpers.py", "decorators.py", "exceptions.py"],
            "templating": ["engine.py", "filters.py", "loaders.py"],
            "database": ["connection.py", "query.py", "orm.py", "migrations.py"],
            "auth": ["authentication.py", "authorization.py", "tokens.py"],
            "validation": ["validators.py", "schemas.py", "sanitizers.py"],
            "testing": ["test_runner.py", "fixtures.py", "mocks.py"],
        }

        return module_files.get(module, ["__init__.py"])

    def run(self) -> None:
        """Main agent loop."""
        print(f"\n🎯 {self.agent_id} starting...")
        print("⏳ Waiting for task assignment...\n")

        iteration = 0

        while True:
            iteration += 1

            # Read current status
            status = self.read_status()

            # Check if we have a task assigned
            if status.get('task_id') and status.get('status') == 'BUSY':
                task_id = status['task_id']
                print(f"\n📥 Received task assignment: {task_id}")

                # Get task details
                task = self.get_task_details(task_id)

                if task:
                    # Execute task via Codex
                    success = self.execute_task_via_codex(task)

                    if success:
                        print(f"✅ {self.agent_id} completed {task_id} via Codex")
                    else:
                        print(f"❌ {self.agent_id} failed {task_id}")

                    # Go back to idle
                    print(f"\n⏳ {self.agent_id} waiting for next task...")
                else:
                    print(f"⚠️ Task {task_id} not found in queue")

            # Print heartbeat every 30 seconds
            if iteration % 15 == 0:
                print(f"💓 {self.agent_id} heartbeat (status: {status.get('status', 'IDLE')})")

            # Sleep
            time.sleep(2)

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python3 agent_cg.py <agent_id>")
        print("Example: python3 agent_cg.py CG-1")
        sys.exit(1)

    agent_id = sys.argv[1]

    # Validate agent ID
    if not agent_id.startswith('CG-'):
        print(f"❌ Invalid agent ID: {agent_id}")
        print("   CG agent IDs must start with 'CG-'")
        sys.exit(1)

    # Create and run agent
    agent = CGAgent(agent_id)

    try:
        agent.run()
    except KeyboardInterrupt:
        print(f"\n\n⚠️ {agent_id} stopped by user")
        # Update status to IDLE
        status = agent.read_status()
        status['status'] = 'IDLE'
        status['task_id'] = None
        agent.write_status(status)
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ {agent_id} crashed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
