#!/usr/bin/env python3
"""
Multi-Agent Orchestration Monitoring Dashboard
Displays real-time status of all agents and tasks.

Usage:
    python3 monitor_dashboard.py
    watch -n 5 'python3 monitor_dashboard.py'
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

class OrchestrationMonitor:
    """Real-time monitoring dashboard for multi-agent orchestration."""

    def __init__(self, log_dir: Path = Path("/tmp/miyabi-level6")):
        self.log_dir = log_dir
        self.task_queue_file = log_dir / "task_queue.json"

    def load_tasks(self) -> List[Dict]:
        """Load task queue."""
        if not self.task_queue_file.exists():
            return []

        with open(self.task_queue_file, 'r') as f:
            data = json.load(f)

        return data.get('tasks', [])

    def load_agents(self) -> Dict[str, Dict]:
        """Load all agent statuses."""
        agents = {}

        agent_files = sorted(self.log_dir.glob("agent_*_status.json"))

        for agent_file in agent_files:
            with open(agent_file, 'r') as f:
                data = json.load(f)
                agents[data['agent_id']] = data

        return agents

    def print_header(self):
        """Print dashboard header."""
        print("\n" + "=" * 80)
        print(" " * 20 + "MIYABI LEVEL 6 MULTI-AGENT ORCHESTRATION")
        print(" " * 30 + "Real-time Dashboard")
        print("=" * 80)
        print(f"\n⏰ Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📁 Log Directory: {self.log_dir}")

    def print_progress_bar(self, completed: int, total: int, width: int = 50):
        """Print a progress bar."""
        if total == 0:
            percentage = 0
        else:
            percentage = completed / total

        filled = int(width * percentage)
        bar = "█" * filled + "░" * (width - filled)

        print(f"\n📊 Overall Progress: [{bar}] {percentage*100:.1f}% ({completed}/{total})")

    def print_task_summary(self, tasks: List[Dict]):
        """Print task execution summary."""
        total = len(tasks)
        pending = len([t for t in tasks if t['status'] == 'PENDING'])
        in_progress = len([t for t in tasks if t['status'] == 'IN_PROGRESS'])
        completed = len([t for t in tasks if t['status'] == 'COMPLETED'])
        failed = len([t for t in tasks if t['status'] == 'FAILED'])

        self.print_progress_bar(completed, total)

        print("\n┌─────────────────────────────────────────────────────────────────┐")
        print("│ TASK SUMMARY                                                     │")
        print("├─────────────────────────────────────────────────────────────────┤")
        print(f"│ Total Tasks:          {total:3d}                                     │")
        print(f"│ ✅ Completed:         {completed:3d}  ({completed/total*100 if total > 0 else 0:5.1f}%)                        │")
        print(f"│ 🔄 In Progress:       {in_progress:3d}                                     │")
        print(f"│ ⏳ Pending:           {pending:3d}                                     │")
        print(f"│ ❌ Failed:            {failed:3d}                                     │")
        print("└─────────────────────────────────────────────────────────────────┘")

    def print_active_tasks(self, tasks: List[Dict]):
        """Print currently active tasks."""
        active_tasks = [t for t in tasks if t['status'] == 'IN_PROGRESS']

        if not active_tasks:
            print("\n🔄 No tasks currently in progress")
            return

        print("\n┌─────────────────────────────────────────────────────────────────┐")
        print("│ ACTIVE TASKS                                                     │")
        print("├─────────────────────────────────────────────────────────────────┤")

        for task in active_tasks:
            task_id = task['task_id']
            agent = task['agent']
            module = task['module']
            desc = task['description'][:40] + "..." if len(task['description']) > 40 else task['description']

            print(f"│ 🔄 {task_id:10s} │ {agent:6s} │ {module:12s}              │")
            print(f"│    {desc:60s} │")

        print("└─────────────────────────────────────────────────────────────────┘")

    def print_agent_status(self, agents: Dict[str, Dict]):
        """Print agent status table."""
        print("\n┌─────────────────────────────────────────────────────────────────┐")
        print("│ AGENT STATUS                                                     │")
        print("├──────────┬────────────┬──────────────┬─────────────────────────┤")
        print("│ Agent ID │ Status     │ Progress     │ Current Task            │")
        print("├──────────┼────────────┼──────────────┼─────────────────────────┤")

        # Sort agents by ID
        sorted_agents = sorted(agents.items(), key=lambda x: (x[0].split('-')[0], int(x[0].split('-')[1])))

        for agent_id, agent in sorted_agents:
            status = agent.get('status', 'UNKNOWN')
            progress = agent.get('progress', 0.0)
            task_id = agent.get('task_id', '')

            # Status icon
            if status == 'IDLE':
                status_icon = "💤"
                status_text = "IDLE"
            elif status == 'BUSY':
                status_icon = "🔄"
                status_text = "BUSY"
            elif status == 'FAILED':
                status_icon = "❌"
                status_text = "FAILED"
            else:
                status_icon = "❓"
                status_text = status

            # Progress bar
            progress_bar_width = 10
            progress_filled = int(progress_bar_width * progress)
            progress_bar = "█" * progress_filled + "░" * (progress_bar_width - progress_filled)

            # Task display
            task_display = task_id if task_id else "-"

            print(f"│ {agent_id:8s} │ {status_icon} {status_text:8s} │ {progress_bar} {progress*100:3.0f}% │ {task_display:23s} │")

        print("└──────────┴────────────┴──────────────┴─────────────────────────┘")

    def print_next_tasks(self, tasks: List[Dict]):
        """Print upcoming tasks."""
        pending_tasks = [t for t in tasks if t['status'] == 'PENDING'][:5]

        if not pending_tasks:
            print("\n⏳ No pending tasks")
            return

        print("\n┌─────────────────────────────────────────────────────────────────┐")
        print("│ NEXT TASKS (Top 5)                                               │")
        print("├─────────────────────────────────────────────────────────────────┤")

        for task in pending_tasks:
            task_id = task['task_id']
            module = task['module']
            priority = task['priority']
            deps = len(task['dependencies'])

            print(f"│ {task_id:10s} │ {module:12s} │ Priority: {priority} │ Deps: {deps:2d}      │")

        print("└─────────────────────────────────────────────────────────────────┘")

    def print_completed_recent(self, tasks: List[Dict]):
        """Print recently completed tasks."""
        completed_tasks = [t for t in tasks if t['status'] == 'COMPLETED']
        recent = sorted(completed_tasks, key=lambda t: t.get('completed_at', ''), reverse=True)[:5]

        if not recent:
            return

        print("\n┌─────────────────────────────────────────────────────────────────┐")
        print("│ RECENTLY COMPLETED (Last 5)                                      │")
        print("├─────────────────────────────────────────────────────────────────┤")

        for task in recent:
            task_id = task['task_id']
            module = task['module']
            agent = task['agent']

            print(f"│ ✅ {task_id:10s} │ {module:12s} │ {agent:15s}           │")

        print("└─────────────────────────────────────────────────────────────────┘")

    def print_footer(self):
        """Print dashboard footer."""
        print("\n" + "=" * 80)
        print("Press Ctrl+C to exit  |  Refreshes every 5 seconds")
        print("=" * 80 + "\n")

    def display(self):
        """Display the complete dashboard."""
        # Clear screen
        print("\033[2J\033[H", end="")

        # Load data
        tasks = self.load_tasks()
        agents = self.load_agents()

        # Print sections
        self.print_header()
        self.print_task_summary(tasks)
        self.print_agent_status(agents)
        self.print_active_tasks(tasks)
        self.print_next_tasks(tasks)
        self.print_completed_recent(tasks)
        self.print_footer()

def main():
    """Main entry point."""
    monitor = OrchestrationMonitor()

    try:
        monitor.display()
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("\n💡 Hint: Make sure the orchestration has been initialized.")
        print("   Run: ./setup_level6_tmux.sh")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Dashboard closed")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
