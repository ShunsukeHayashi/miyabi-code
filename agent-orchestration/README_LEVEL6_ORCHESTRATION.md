# Level 6 Multi-Agent Orchestration System

**Version**: 1.0.0
**Date**: 2025-11-30
**Status**: ✅ INFRASTRUCTURE COMPLETE

## Overview

True multi-agent orchestration system scaling from **1 agent → 10 agents** for parallel task execution.

### Architecture

```
Orchestrator (MacBook)
    ↓
    ├─ CCG-1 (MUGEN) - Planning
    ├─ CG-1~4 (MUGEN) - Core implementation
    ├─ CG-5~8 (MAJIN) - Advanced modules
    └─ CCG-2~6 (MAJIN) - Review & verification
```

### Key Features

- ✅ **10 Agents**: 6 CCG (Claude Code) + 4 CG (Codex)
- ✅ **Zero-Trust Protocol**: File-based state management
- ✅ **Parallel Execution**: Up to 5 tasks simultaneously
- ✅ **Full Visualization**: tmux 11-window dashboard
- ✅ **Hybrid Pattern**: CCG (plan/review) + CG (implement)
- ✅ **Fault Tolerant**: Agent failures don't affect others

## Quick Start

### 1. Setup Environment

```bash
cd ~/Dev/01-miyabi/_core/miyabi-private/agent-orchestration

# Run setup script (creates tmux session + initializes files)
./setup_level6_tmux.sh
```

This will:
- Create tmux session: `miyabi-level6-orchestra`
- Initialize `/tmp/miyabi-level6/` with:
  - `task_queue.json` - 15 tasks with dependencies
  - `agent_*_status.json` - Status files for 15 agents
  - `results/` - Output directory
- Set up 11 tmux windows

### 2. Attach to tmux Session

```bash
tmux attach -t miyabi-level6-orchestra
```

### 3. Navigate Windows

```
Ctrl-b 0   : Orchestrator (MacBook)
Ctrl-b 1   : CCG-1 (Planning)
Ctrl-b 2-5 : CG-1~4 (Core modules)
Ctrl-b 6-9 : CG-5~8 (Advanced modules)
Ctrl-b 10  : Monitoring Dashboard
```

### 4. Start Agents (in each window)

**Window 1 (CCG-1)**:
```bash
cd ~/Dev/01-miyabi/_core/miyabi-private/agent-orchestration
python3 agent_ccg.py CCG-1
```

**Windows 2-5 (CG-1~4)**:
```bash
cd miyabi-private/agent-orchestration
python3 agent_cg.py CG-1  # CG-2, CG-3, CG-4 in respective windows
```

**Windows 6-9 (CG-5~8)**:
```bash
cd miyabi-private/agent-orchestration
python3 agent_cg.py CG-5  # CG-6, CG-7, CG-8 in respective windows
```

### 5. Start Orchestrator

**Window 0 (Orchestrator)**:
```bash
cd ~/Dev/01-miyabi/_core/miyabi-private/agent-orchestration
python3 orchestrator.py
```

### 6. Monitor Progress

**Window 10 (Monitor)**:
```bash
watch -n 5 'python3 monitor_dashboard.py'
```

## Architecture Details

### Task DAG (15 Tasks, 6 Waves)

```
Wave 1:  Task-1 (CCG-1: Planning)
Wave 2:  Tasks 2-5 (CG-1~4: Core/HTTP/Routing/Utils) [parallel]
Wave 3:  Tasks 6-9 (CG-5~8: Templating/DB/Auth/Validation) [parallel]
Wave 4:  Task-10 (CG-9: Testing/CLI)
Wave 5:  Tasks 11-13 (CCG-2~4: Tests/Docs/Config) [parallel]
Wave 6:  Tasks 14-15 (CCG-5~6: Review/Verify) [sequential]
```

### File Structure

```
/tmp/miyabi-level6/
├── task_queue.json              # Master task list
├── agent_CCG-1_status.json      # Agent status files
├── agent_CG-1_status.json       # (15 total)
├── ...
├── results/                     # Task outputs
│   ├── Task-1_result.json
│   ├── Task-2_codex_result.json
│   └── ...
└── logs/                        # Execution logs
```

### Communication Protocol

**Zero-Trust File-Based State**:
1. Orchestrator writes task assignment to `agent_*_status.json`
2. Agent reads assignment, executes task
3. Agent updates status file with progress
4. Agent marks complete when done
5. Orchestrator reads status, assigns next task

**No agent memory dependence** - all state in files.

## Scripts

### Core Scripts

| Script | Purpose |
|--------|---------|
| `setup_level6_tmux.sh` | Initialize tmux environment + files |
| `orchestrator.py` | Main coordination logic |
| `agent_ccg.py` | Claude Code agent wrapper |
| `agent_cg.py` | Codex agent wrapper |
| `monitor_dashboard.py` | Real-time progress dashboard |
| `test_mcp_codex.py` | MCP Codex connectivity test |

### Testing

```bash
# Test MCP Codex connectivity
python3 test_mcp_codex.py

# Test with 2 agents (manual)
./setup_level6_tmux.sh
# Start CCG-1 and CG-1 only
# Start orchestrator
```

## Task Execution Flow

### 1. Orchestrator Loop

```python
while True:
    # Read agent status files (zero-trust)
    update_task_status()

    # Find ready tasks (dependencies met)
    ready_tasks = get_ready_tasks()

    # Find idle agents
    idle_agents = get_idle_agents()

    # Assign tasks to agents
    for task, agent in zip(ready_tasks, idle_agents):
        assign_task_to_agent(task, agent)

    # Check if done
    if all_tasks_complete():
        break

    await asyncio.sleep(2)
```

### 2. Agent Loop

```python
while True:
    # Read status file (zero-trust)
    status = read_status()

    # Check for task assignment
    if status['task_id'] and status['status'] == 'BUSY':
        # Get task details
        task = get_task_details(status['task_id'])

        # Execute task
        execute_task(task)

        # Update status: COMPLETED
        write_status({'status': 'COMPLETED', 'task_id': None})

    await asyncio.sleep(2)
```

## Monitoring

### Dashboard View

```
============================================================
       MIYABI LEVEL 6 MULTI-AGENT ORCHESTRATION
                  Real-time Dashboard
============================================================

📊 Overall Progress: [████████████░░░░░░░░] 60% (9/15)

┌─────────────────────────────────────────────────────────┐
│ TASK SUMMARY                                             │
├─────────────────────────────────────────────────────────┤
│ Total Tasks:           15                                │
│ ✅ Completed:           9  (60.0%)                       │
│ 🔄 In Progress:         3                                │
│ ⏳ Pending:             3                                │
│ ❌ Failed:              0                                │
└─────────────────────────────────────────────────────────┘

┌──────────┬────────────┬──────────────┬──────────────────┐
│ Agent ID │ Status     │ Progress     │ Current Task     │
├──────────┼────────────┼──────────────┼──────────────────┤
│ CCG-1    │ 💤 IDLE    │ ░░░░░░░░░░ 0%│ -                │
│ CG-1     │ 🔄 BUSY    │ ██████░░░░60%│ Task-2           │
│ CG-2     │ 🔄 BUSY    │ ████░░░░░░40%│ Task-3           │
...
```

### Log Files

```bash
# View orchestrator logs
tail -f /tmp/miyabi-level6/logs/orchestrator.log

# View specific agent
tail -f /tmp/miyabi-level6/logs/agent_CCG-1.log

# Check task queue
cat /tmp/miyabi-level6/task_queue.json | jq '.tasks[] | select(.status == "IN_PROGRESS")'
```

## Best Practices

### 1. Zero Trust Protocol

- ❌ **Don't**: Rely on agent memory or context
- ✅ **Do**: Read state from files every iteration

### 2. Error Handling

- Agent failure → Mark task as FAILED → Reassign to another agent
- Orchestrator failure → Restart, reads state from files
- All state persisted, no data loss

### 3. Parallel Execution

- Max 5 tasks in parallel (configurable)
- Respects dependency constraints
- CCG tasks → CCG agents only
- CG tasks → CG agents only

### 4. Debugging

```bash
# Check agent status
cat /tmp/miyabi-level6/agent_CCG-1_status.json | jq

# List all idle agents
jq -s '.[] | select(.status == "IDLE") | .agent_id' /tmp/miyabi-level6/agent_*_status.json

# Show completed tasks
jq '.tasks[] | select(.status == "COMPLETED") | .task_id' /tmp/miyabi-level6/task_queue.json
```

## Performance

### Expected Timeline

| Phase | Tasks | Time | Notes |
|-------|-------|------|-------|
| Wave 1 | 1 | 10 min | Planning (sequential) |
| Wave 2 | 4 | 15 min | Core modules (parallel) |
| Wave 3 | 4 | 20 min | Advanced modules (parallel) |
| Wave 4 | 1 | 10 min | Testing (sequential) |
| Wave 5 | 3 | 20 min | Docs/config (parallel) |
| Wave 6 | 2 | 15 min | Review/verify (sequential) |
| **Total** | **15** | **90 min** | **50% faster than single-agent** |

### Scaling

- Single agent (Level 5): ~180 min
- Multi-agent (Level 6): ~90 min
- **Improvement**: 50% time reduction
- **Concurrency**: 5x parallelism

## Troubleshooting

### Issue: Orchestrator not assigning tasks

**Cause**: Agent status files not found
**Fix**: Run `./setup_level6_tmux.sh` to initialize

### Issue: Agent stuck in BUSY

**Cause**: Agent crashed without updating status
**Fix**:
```bash
# Manually reset agent
echo '{"agent_id":"CG-1","status":"IDLE","task_id":null,...}' > /tmp/miyabi-level6/agent_CG-1_status.json
```

### Issue: MCP Codex not working

**Cause**: Server not running or not configured
**Fix**:
```bash
# Test connectivity
python3 test_mcp_codex.py

# Check server
node ~/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex/dist/index.js
```

### Issue: Task dependencies not respected

**Cause**: task_queue.json corrupted
**Fix**: Re-run `./setup_level6_tmux.sh` to regenerate

## Advanced Usage

### Custom Task Queue

Edit `/tmp/miyabi-level6/task_queue.json` to customize tasks:

```json
{
  "tasks": [
    {
      "task_id": "Task-1",
      "agent": "CCG-1",
      "description": "Your custom task",
      "dependencies": [],
      "status": "PENDING",
      "priority": 1,
      "estimated_time": 600,
      "module": "custom"
    }
  ]
}
```

### Adding More Agents

1. Create status file: `agent_CG-10_status.json`
2. Start agent: `python3 agent_cg.py CG-10`
3. Orchestrator auto-discovers and assigns tasks

### Remote Execution

Agents can run on MUGEN/MAJIN:

```bash
# SSH to MUGEN
ssh mugen

# Start agent remotely
cd miyabi-private/agent-orchestration
python3 agent_cg.py CG-1

# Orchestrator on MacBook coordinates via shared filesystem
```

## References

- **Plan**: `PLAN_LEVEL6_MULTIAGENT.md` - Complete implementation plan
- **Best Practices**: `docs/MASTER_COORDINATION_PLAN.md` - Zero-trust protocol
- **Hybrid Pattern**: `docs/OPTIMAL_MIYABI_WORKFLOW_WITH_CODEX_CLAUDE.md` - Pattern 3

## Status

- ✅ Phase 1: Infrastructure Setup (Complete)
- ✅ Phase 2: Core Scripts (Complete)
- ⏳ Phase 3: Testing (In Progress)
- ⏳ Phase 4: Full Execution (Pending)

## Next Steps

1. **Test with 2-3 agents** - Verify basic functionality
2. **Run with all 10 agents** - Full orchestration
3. **Execute webapp_framework** - Generate 55 files
4. **Verification** - Run tests, confirm 100% pass rate

---

**Last Updated**: 2025-11-30
**Author**: Claude Code
**Version**: 1.0.0
