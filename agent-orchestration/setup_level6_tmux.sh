#!/bin/bash
# Level 6 Multi-Agent Orchestration - Tmux Setup Script
# Version: 1.0.0
# Date: 2025-11-30

set -e

SESSION="miyabi-level6-orchestra"
LOG_DIR="/tmp/miyabi-level6"
PROJECT_ROOT="$HOME/Dev/01-miyabi/_core/miyabi-private/agent-orchestration"

echo "🚀 Setting up Level 6 Multi-Agent Orchestration..."

# Create log directory
mkdir -p "$LOG_DIR/results"
mkdir -p "$LOG_DIR/logs"
echo "✅ Created log directory: $LOG_DIR"

# Initialize task queue and agent status files
cat > "$LOG_DIR/task_queue.json" <<EOF
{
  "version": "1.0.0",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tasks": [
    {
      "task_id": "Task-1",
      "agent": "CCG-1",
      "description": "Analyze requirements and create implementation plan",
      "dependencies": [],
      "status": "PENDING",
      "priority": 1,
      "estimated_time": 600,
      "module": "planning"
    },
    {
      "task_id": "Task-2",
      "agent": "CG-1",
      "description": "Implement core/ module (5 files)",
      "dependencies": ["Task-1"],
      "status": "PENDING",
      "priority": 2,
      "estimated_time": 900,
      "module": "core"
    },
    {
      "task_id": "Task-3",
      "agent": "CG-2",
      "description": "Implement http/ module (4 files)",
      "dependencies": ["Task-1"],
      "status": "PENDING",
      "priority": 2,
      "estimated_time": 900,
      "module": "http"
    },
    {
      "task_id": "Task-4",
      "agent": "CG-3",
      "description": "Implement routing/ module (3 files)",
      "dependencies": ["Task-1"],
      "status": "PENDING",
      "priority": 2,
      "estimated_time": 900,
      "module": "routing"
    },
    {
      "task_id": "Task-5",
      "agent": "CG-4",
      "description": "Implement utils/ module (4 files)",
      "dependencies": ["Task-1"],
      "status": "PENDING",
      "priority": 2,
      "estimated_time": 900,
      "module": "utils"
    },
    {
      "task_id": "Task-6",
      "agent": "CG-5",
      "description": "Implement templating/ module (3 files)",
      "dependencies": ["Task-2", "Task-3"],
      "status": "PENDING",
      "priority": 3,
      "estimated_time": 1200,
      "module": "templating"
    },
    {
      "task_id": "Task-7",
      "agent": "CG-6",
      "description": "Implement database/ module (4 files)",
      "dependencies": ["Task-4", "Task-5"],
      "status": "PENDING",
      "priority": 3,
      "estimated_time": 1200,
      "module": "database"
    },
    {
      "task_id": "Task-8",
      "agent": "CG-7",
      "description": "Implement auth/ module (3 files)",
      "dependencies": ["Task-6"],
      "status": "PENDING",
      "priority": 4,
      "estimated_time": 1200,
      "module": "auth"
    },
    {
      "task_id": "Task-9",
      "agent": "CG-8",
      "description": "Implement validation/ module (3 files)",
      "dependencies": ["Task-6"],
      "status": "PENDING",
      "priority": 4,
      "estimated_time": 1200,
      "module": "validation"
    },
    {
      "task_id": "Task-10",
      "agent": "CG-9",
      "description": "Implement testing/ and cli/ modules (5 files)",
      "dependencies": ["Task-7", "Task-8", "Task-9"],
      "status": "PENDING",
      "priority": 5,
      "estimated_time": 600,
      "module": "testing"
    },
    {
      "task_id": "Task-11",
      "agent": "CCG-2",
      "description": "Create test suite (4 test files)",
      "dependencies": ["Task-10"],
      "status": "PENDING",
      "priority": 6,
      "estimated_time": 1200,
      "module": "tests"
    },
    {
      "task_id": "Task-12",
      "agent": "CCG-3",
      "description": "Generate documentation (4 docs)",
      "dependencies": ["Task-10"],
      "status": "PENDING",
      "priority": 6,
      "estimated_time": 1200,
      "module": "docs"
    },
    {
      "task_id": "Task-13",
      "agent": "CCG-4",
      "description": "Create configuration files (8 files)",
      "dependencies": ["Task-10"],
      "status": "PENDING",
      "priority": 6,
      "estimated_time": 1200,
      "module": "config"
    },
    {
      "task_id": "Task-14",
      "agent": "CCG-5",
      "description": "Final review and integration",
      "dependencies": ["Task-11", "Task-12", "Task-13"],
      "status": "PENDING",
      "priority": 7,
      "estimated_time": 900,
      "module": "review"
    },
    {
      "task_id": "Task-15",
      "agent": "CCG-6",
      "description": "Run all tests and verify 100% pass rate",
      "dependencies": ["Task-14"],
      "status": "PENDING",
      "priority": 8,
      "estimated_time": 900,
      "module": "verify"
    }
  ]
}
EOF
echo "✅ Created task queue: $LOG_DIR/task_queue.json"

# Initialize agent status files (10 agents)
for i in {1..6}; do
  cat > "$LOG_DIR/agent_CCG-${i}_status.json" <<EOF
{
  "agent_id": "CCG-${i}",
  "task_id": null,
  "status": "IDLE",
  "progress": 0.0,
  "started_at": null,
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "output_files": [],
  "errors": [],
  "next_task": null
}
EOF
done

for i in {1..9}; do
  cat > "$LOG_DIR/agent_CG-${i}_status.json" <<EOF
{
  "agent_id": "CG-${i}",
  "task_id": null,
  "status": "IDLE",
  "progress": 0.0,
  "started_at": null,
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "output_files": [],
  "errors": [],
  "next_task": null
}
EOF
done
echo "✅ Initialized 15 agent status files"

# Kill existing session if it exists
tmux has-session -t "$SESSION" 2>/dev/null && tmux kill-session -t "$SESSION"

# Create new tmux session
tmux new-session -d -s "$SESSION" -n "Orchestrator"

# Window 0: Orchestrator (MacBook)
tmux send-keys -t "$SESSION:0" "cd $PROJECT_ROOT" C-m
tmux send-keys -t "$SESSION:0" "echo '🎯 Orchestrator - Ready to coordinate agents'" C-m
tmux send-keys -t "$SESSION:0" "echo 'Run: python3 orchestrator.py to start'" C-m

# Window 1: CCG-1 (MUGEN) - Planning
tmux new-window -t "$SESSION:1" -n "CCG-1-Plan"
tmux send-keys -t "$SESSION:1" "ssh mugen -t 'cd miyabi-private/agent-orchestration && echo \"🤖 CCG-1 (Planning Agent) - Ready\" && bash -l'" C-m

# Window 2: CG-1 (MUGEN) - Core module
tmux new-window -t "$SESSION:2" -n "CG-1-Core"
tmux send-keys -t "$SESSION:2" "ssh mugen -t 'cd miyabi-private/agent-orchestration && echo \"⚙️ CG-1 (Core Module) - Ready\" && bash -l'" C-m

# Window 3: CG-2 (MUGEN) - HTTP module
tmux new-window -t "$SESSION:3" -n "CG-2-HTTP"
tmux send-keys -t "$SESSION:3" "ssh mugen -t 'cd miyabi-private/agent-orchestration && echo \"🌐 CG-2 (HTTP Module) - Ready\" && bash -l'" C-m

# Window 4: CG-3 (MUGEN) - Routing module
tmux new-window -t "$SESSION:4" -n "CG-3-Route"
tmux send-keys -t "$SESSION:4" "ssh mugen -t 'cd miyabi-private/agent-orchestration && echo \"🚦 CG-3 (Routing Module) - Ready\" && bash -l'" C-m

# Window 5: CG-4 (MUGEN) - Utils module
tmux new-window -t "$SESSION:5" -n "CG-4-Utils"
tmux send-keys -t "$SESSION:5" "ssh mugen -t 'cd miyabi-private/agent-orchestration && echo \"🛠️ CG-4 (Utils Module) - Ready\" && bash -l'" C-m

# Window 6: CG-5 (MAJIN) - Templating module
tmux new-window -t "$SESSION:6" -n "CG-5-Tmpl"
tmux send-keys -t "$SESSION:6" "ssh majin -t 'cd miyabi-private/agent-orchestration && echo \"📄 CG-5 (Templating) - Ready\" && bash -l'" C-m

# Window 7: CG-6 (MAJIN) - Database module
tmux new-window -t "$SESSION:7" -n "CG-6-DB"
tmux send-keys -t "$SESSION:7" "ssh majin -t 'cd miyabi-private/agent-orchestration && echo \"💾 CG-6 (Database) - Ready\" && bash -l'" C-m

# Window 8: CG-7 (MAJIN) - Auth module
tmux new-window -t "$SESSION:8" -n "CG-7-Auth"
tmux send-keys -t "$SESSION:8" "ssh majin -t 'cd miyabi-private/agent-orchestration && echo \"🔐 CG-7 (Auth) - Ready\" && bash -l'" C-m

# Window 9: CG-8 (MAJIN) - Validation module
tmux new-window -t "$SESSION:9" -n "CG-8-Valid"
tmux send-keys -t "$SESSION:9" "ssh majin -t 'cd miyabi-private/agent-orchestration && echo \"✓ CG-8 (Validation) - Ready\" && bash -l'" C-m

# Window 10: Monitoring Dashboard
tmux new-window -t "$SESSION:10" -n "Monitor"
tmux send-keys -t "$SESSION:10" "cd $PROJECT_ROOT" C-m
tmux send-keys -t "$SESSION:10" "watch -n 5 'python3 monitor_dashboard.py'" C-m

echo ""
echo "✅ Tmux session '$SESSION' created with 11 windows"
echo ""
echo "📊 Architecture:"
echo "  Window 0:  Orchestrator (MacBook)"
echo "  Windows 1-5:  CCG-1, CG-1~4 (MUGEN)"
echo "  Windows 6-9:  CG-5~8 (MAJIN)"
echo "  Window 10: Monitoring Dashboard"
echo ""
echo "🔌 Next steps:"
echo "  1. Test MCP Codex connectivity"
echo "  2. Run: tmux attach -t $SESSION"
echo "  3. Navigate with: Ctrl-b [0-10]"
echo ""
echo "🚀 To start orchestration:"
echo "  cd $PROJECT_ROOT"
echo "  python3 orchestrator.py"
echo ""
echo "📁 Logs: $LOG_DIR"
echo "📋 Task Queue: $LOG_DIR/task_queue.json"
echo "📊 Agent Status: $LOG_DIR/agent_*_status.json"
