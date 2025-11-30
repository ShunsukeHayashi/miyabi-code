# Level 6 Multi-Agent Orchestration Plan
## webapp_framework - True Society Scale Implementation

**Version**: 1.0.0
**Date**: 2025-11-30
**Status**: PLANNING PHASE
**Reference**: miyabi-ccg-cg-coordination-ja.pdf, OPTIMAL_MIYABI_WORKFLOW, MASTER_COORDINATION_PLAN

---

## Executive Summary

Level 6を**真のマルチエージェントオーケストレーション**として再実装します。
単一エージェントから **5-10エージェント並列実行** へスケール。

### Core Principles (ベストプラクティス)

1. **Zero Trust in Agent Memory** - エージェントのメモリに依存しない
2. **GitHub/File as Source of Truth** - ファイルシステムとログが真実の情報源
3. **Parallel Execution** - 複数エージェントの並列実行
4. **Pattern 3: Hybrid Orchestration** - Claude (Plan/Review) + Codex (Implement)
5. **Full Visualization** - tmuxで全エージェント可視化

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (MacBook / Pixel)                                  │
│  - Overall coordination                                          │
│  - Task DAG management                                           │
│  - Progress monitoring                                           │
│  - GitHub/Log integration                                        │
└──────────────┬──────────────────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼──────┐    ┌────▼─────────┐
│ MUGEN (EC2)│    │ MAJIN (EC2)  │
│ CPU Heavy  │    │ Parallel Hvy │
└─────┬──────┘    └────┬─────────┘
      │                │
      │   ┌────────────┴────────────────────┐
      │   │                                  │
      ├───▼────────┐  ┌────────────┐  ┌────▼────────┐
      │ CCG Agent 1│  │ CG Agent 2 │  │ CCG Agent 3 │
      │ (Planning) │  │ (Implement)│  │ (Review)    │
      └────────────┘  └────────────┘  └─────────────┘
           │                │                │
           └────────────────┴────────────────┘
                          │
                    ┌─────▼──────┐
                    │ Task Queue │
                    └────────────┘
```

---

## Phase Breakdown

### Phase 1: Infrastructure Setup (30 min)

**Objective**: tmux環境、MCP接続、通信プロトコル確立

**Tasks**:
1. tmux session作成 (miyabi-level6-orchestra)
   - Window 1: Orchestrator (MacBook)
   - Windows 2-4: CCG Agents (MUGEN)
   - Windows 5-7: CG Agents (MUGEN)
   - Windows 8-10: CCG Review Agents (MAJIN)
   - Window 11: Monitoring Dashboard

2. MCP Codex サーバー起動確認
   ```bash
   node ~/Dev/miyabi-private/mcp-servers/miyabi-codex/dist/index.js
   ```

3. Communication Protocol Setup
   - Log directory: `/tmp/miyabi-level6/`
   - Task queue file: `task_queue.json`
   - Status file per agent: `agent_{N}_status.json`
   - Result directory: `results/`

**Deliverables**:
- `setup_level6_tmux.sh` - tmux起動スクリプト
- `task_queue.json` - タスクキュー初期化
- `/tmp/miyabi-level6/` - ログディレクトリ構造

---

### Phase 2: Task Decomposition (20 min)

**Objective**: webapp_framework 55ファイルを10-15タスクへ分割

**Task DAG Design**:
```
Task 1 (CCG-Planning) : Analyze Level 6 requirements → Task 2, 3
Task 2 (CG-Core)      : core/ module (5 files)        → Task 6
Task 3 (CG-HTTP)      : http/ module (4 files)        → Task 6
Task 4 (CG-Routing)   : routing/ module (3 files)     → Task 7
Task 5 (CG-Utils)     : utils/ module (4 files)       → Task 7
Task 6 (CG-Templating): templating/ module (3 files)  → Task 8
Task 7 (CG-Database)  : database/ module (4 files)    → Task 9
Task 8 (CG-Auth)      : auth/ module (3 files)        → Task 10
Task 9 (CG-Validation): validation/ module (3 files)  → Task 10
Task 10 (CG-Testing)  : testing/cli modules (5 files) → Task 11
Task 11 (CCG-Tests)   : Test suite (4 test files)     → Task 12
Task 12 (CCG-Docs)    : Documentation (4 docs)        → Task 13
Task 13 (CCG-Config)  : Configuration (8 files)       → Task 14
Task 14 (CCG-Review)  : Final review & integration    → Done
Task 15 (CCG-Verify)  : Run all tests, verify 100%    → Done
```

**Parallelization Strategy**:
- Wave 1: Task 1 (sequential)
- Wave 2: Tasks 2, 3, 4, 5 (parallel, 4 agents)
- Wave 3: Tasks 6, 7, 8, 9 (parallel, 4 agents)
- Wave 4: Task 10 (sequential)
- Wave 5: Tasks 11, 12, 13 (parallel, 3 agents)
- Wave 6: Tasks 14, 15 (sequential)

**Agent Assignment**:
- CCG-1 (Claude): Task 1 (Planning)
- CG-1 (Codex): Task 2 (Core)
- CG-2 (Codex): Task 3 (HTTP)
- CG-3 (Codex): Task 4 (Routing)
- CG-4 (Codex): Task 5 (Utils)
- CG-5 (Codex): Task 6 (Templating)
- CG-6 (Codex): Task 7 (Database)
- CG-7 (Codex): Task 8 (Auth)
- CG-8 (Codex): Task 9 (Validation)
- CG-9 (Codex): Task 10 (Testing)
- CCG-2 (Claude): Task 11 (Tests)
- CCG-3 (Claude): Task 12 (Docs)
- CCG-4 (Claude): Task 13 (Config)
- CCG-5 (Claude): Task 14 (Review)
- CCG-6 (Claude): Task 15 (Verify)

---

### Phase 3: Execution (60-90 min)

**Wave 1: Planning (CCG-1)** - 10 min
- Agent: Claude Code on MUGEN
- Task: Analyze requirements, create detailed implementation plans
- Output: `IMPLEMENTATION_PLAN.md` with module specifications

**Wave 2: Core Modules (CG-1~4)** - 15 min (parallel)
- Agents: Codex × 4 on MUGEN
- Tasks: core/, http/, routing/, utils/ modules
- Output: 16 Python files

**Wave 3: Advanced Modules (CG-5~9)** - 20 min (parallel)
- Agents: Codex × 5 on MUGEN/MAJIN
- Tasks: templating/, database/, auth/, validation/, testing/cli modules
- Output: 19 Python files

**Wave 4: Infrastructure (CG-10)** - 10 min
- Agent: Codex × 1 on MUGEN
- Task: testing/ and cli/ final integration
- Output: 5 files

**Wave 5: Documentation & Config (CCG-2~4)** - 20 min (parallel)
- Agents: Claude Code × 3 on MAJIN
- Tasks: Test suite, documentation, configuration
- Output: 16 files (tests + docs + configs)

**Wave 6: Review & Verification (CCG-5~6)** - 15 min (sequential)
- Agents: Claude Code × 2 on MAJIN
- Tasks: Final review, test execution, quality verification
- Output: Review report, test results (42/42 passed)

**Total Estimated Time**: 90 min (vs 単一エージェント180 min = **50% reduction**)

---

### Phase 4: Verification (15 min)

**Objective**: 全テスト実行、品質確認、レポート生成

**Tasks**:
1. Run pytest on all modules
   ```bash
   cd webapp_framework && pytest tests/ -v
   ```

2. Verify file count: 55 files
   ```bash
   find webapp_framework -name "*.py" | wc -l
   ```

3. Verify LOC: ~2,174 lines
   ```bash
   find webapp_framework -name "*.py" -exec wc -l {} + | tail -1
   ```

4. Generate final report
   - Test results: 42/42 passed
   - Code quality: Type hints, docstrings complete
   - Documentation: 4 docs + 3 examples complete

---

## Communication Protocol

### Task Status Format

Each agent writes to `/tmp/miyabi-level6/agent_{N}_status.json`:

```json
{
  "agent_id": "CCG-1",
  "task_id": "Task-1",
  "status": "IN_PROGRESS | COMPLETED | FAILED",
  "progress": 0.75,
  "started_at": "2025-11-30T19:00:00Z",
  "updated_at": "2025-11-30T19:05:00Z",
  "output_files": [
    "webapp_framework/core/application.py",
    "webapp_framework/core/request.py"
  ],
  "errors": [],
  "next_task": "Task-6"
}
```

### Task Queue Format

`/tmp/miyabi-level6/task_queue.json`:

```json
{
  "tasks": [
    {
      "task_id": "Task-1",
      "agent": "CCG-1",
      "description": "Analyze requirements and create implementation plan",
      "dependencies": [],
      "status": "PENDING | IN_PROGRESS | COMPLETED",
      "priority": 1,
      "estimated_time": 600
    },
    ...
  ]
}
```

### Progress Monitoring

Orchestrator reads all agent status files every 30 seconds:
```bash
watch -n 30 "jq -s '.' /tmp/miyabi-level6/agent_*_status.json"
```

---

## Tmux Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Window 0: Orchestrator (MacBook)                               │
│ - Task queue monitoring                                        │
│ - Agent status dashboard                                       │
│ - Overall progress bar                                         │
├────────────────────────┬───────────────────────────────────────┤
│ Win 1: CCG-1 (MUGEN)   │ Win 2: CG-1 (MUGEN)                   │
│ Task 1: Planning       │ Task 2: Core module                   │
├────────────────────────┼───────────────────────────────────────┤
│ Win 3: CG-2 (MUGEN)    │ Win 4: CG-3 (MUGEN)                   │
│ Task 3: HTTP module    │ Task 4: Routing module                │
├────────────────────────┼───────────────────────────────────────┤
│ Win 5: CG-4 (MUGEN)    │ Win 6: CG-5 (MAJIN)                   │
│ Task 5: Utils module   │ Task 6: Templating module             │
├────────────────────────┼───────────────────────────────────────┤
│ Win 7: CG-6 (MAJIN)    │ Win 8: CG-7 (MAJIN)                   │
│ Task 7: Database       │ Task 8: Auth module                   │
├────────────────────────┼───────────────────────────────────────┤
│ Win 9: CG-8 (MAJIN)    │ Win 10: CG-9 (MAJIN)                  │
│ Task 9: Validation     │ Task 10: Testing/CLI                  │
├────────────────────────┴───────────────────────────────────────┤
│ Win 11: Monitoring Dashboard                                   │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Progress: ████████████░░░░░░░░ 60% (9/15 tasks complete)│  │
│ │ CCG-1: ✅ Task-1 Complete                                │  │
│ │ CG-1:  🔄 Task-2 In Progress (75%)                       │  │
│ │ CG-2:  ✅ Task-3 Complete                                │  │
│ │ Errors: 0 | Time: 45m / 90m est                          │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### Quantitative Metrics
- ✅ **Agent Count**: 10+ agents active
- ✅ **Parallelism**: 4+ tasks running simultaneously
- ✅ **Files Generated**: 55 Python files
- ✅ **LOC**: ~2,174 lines
- ✅ **Test Pass Rate**: 42/42 (100%)
- ✅ **Time Reduction**: 50% vs single-agent (90m vs 180m)

### Qualitative Metrics
- ✅ **Zero-Trust Protocol**: All state persisted to files, no memory dependence
- ✅ **Fault Tolerance**: Agent failure doesn't affect others
- ✅ **Full Visibility**: All agents visible in tmux
- ✅ **Hybrid Pattern**: CCG (Plan/Review) + CG (Implement) successfully integrated

---

## Risk Management

### Critical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Agent coordination failure | High | File-based status, atomic operations |
| Codex MCP connection loss | High | Retry logic, fallback to CCG |
| Task dependency deadlock | Medium | DAG validation before execution |
| MUGEN/MAJIN SSH failure | Critical | Local fallback mode |
| File conflicts | Medium | Unique namespaces per agent |

### Contingency Plans

**If Agent Fails**:
1. Check agent status file
2. Restart agent with same task
3. Agent reads from file, continues from last checkpoint

**If Codex MCP Unavailable**:
1. Reassign CG tasks to CCG agents
2. Sequential execution fallback
3. Time estimate increases 50%

---

## Implementation Files

### Scripts to Create
1. `setup_level6_tmux.sh` - tmux environment setup
2. `orchestrator.py` - Main orchestration logic
3. `agent_ccg.py` - Claude Code agent wrapper
4. `agent_cg.py` - Codex agent wrapper
5. `task_queue.py` - Task queue management
6. `monitor_dashboard.py` - Progress monitoring

### Configuration Files
1. `task_dag.json` - Task dependency graph
2. `agent_config.json` - Agent assignments
3. `tmux_layout.conf` - tmux window configuration

---

## Next Steps

### Immediate Actions
1. **User Approval**: Review this plan
2. **Create Setup Script**: `setup_level6_tmux.sh`
3. **Test MCP Connection**: Verify Codex connectivity
4. **Initialize Task Queue**: Create `task_queue.json`

### Phase Execution Order
1. **Infrastructure Setup** (Phase 1) → 30 min
2. **Task Decomposition** (Phase 2) → 20 min
3. **Execution** (Phase 3) → 90 min
4. **Verification** (Phase 4) → 15 min

**Total Estimated Time**: 155 minutes (~2.5 hours)

---

## Comparison: Single-Agent vs Multi-Agent

| Metric | Single-Agent (Current) | Multi-Agent (This Plan) | Improvement |
|--------|------------------------|-------------------------|-------------|
| **Agents** | 1 (Claude Code only) | 10 (6 CCG + 9 CG) | **10x scale** |
| **Parallelism** | None (sequential) | 4-5 simultaneous tasks | **5x concurrency** |
| **Codex Usage** | 0% | 60% of implementation tasks | **True hybrid** |
| **Time** | ~180 min (estimated) | 90 min (estimated) | **50% faster** |
| **Visibility** | Single terminal | tmux 11-window dashboard | **Full visualization** |
| **Fault Tolerance** | Single point of failure | Isolated agent failures | **Resilient** |
| **Society Scale** | Individual (1) | Small team (10) | **Achieved** |

---

**Status**: ✅ PLAN COMPLETE - READY FOR APPROVAL
**Next**: User approval → Implementation
**Estimated Total Time**: 2.5 hours

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-30
**Author**: Claude Code (Planning Phase)
