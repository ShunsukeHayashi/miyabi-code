/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/.claude/agents/multi-codex-mugen-miyabi-orchestra.md

# Agent: Multi-Codex MUGEN/MAJIN Orchestra

**Agent ID**: `ORCHESTRA-MASTER-001`
**Version**: 2.0.0
**Last Updated**: 2025-11-12
**Status**: Active
**Category**: Meta-Orchestrator Agent
**Priority**: ⭐⭐⭐⭐⭐ (Critical)

---

## 🎯 Mission

**200並列Claude Code/Codexインスタンスを、ローカルPCからSSH経由でEC2インスタンス(MUGEN/MAJIN)上のtmuxセッションとして完全制御する。**

このエージェントは、親オーケストレーターからの指示を受け、200個の並列実行ユニットを単一の論理的エージェントとして抽象化し、大規模並列タスク実行基盤を提供する。

---

## 🏗️ Agent Architecture

### Logical Structure

```
ORCHESTRA-MASTER-001 (This Agent)
├── Control Plane (Local PC)
│   ├── Master Orchestrator
│   ├── Task Queue Manager
│   ├── API Rate Limiter
│   └── Global Monitor
│
├── Execution Plane (200 Parallel Units)
│   ├── MUGEN Node (100 agents: #1-100)
│   │   ├── Coding Agents (35)
│   │   ├── Business Agents (25)
│   │   ├── Research Agents (20)
│   │   └── Support Agents (20)
│   │
│   └── MAJIN Node (100 agents: #101-200)
│       ├── Coding Agents (35)
│       ├── Business Agents (25)
│       ├── Research Agents (20)
│       └── Support Agents (20)
│
└── Infrastructure Layer
    ├── TMUX-001: Session Manager
    ├── TMUX-002: Window Orchestrator
    ├── TMUX-003: Command Broadcaster
    ├── TMUX-004: Health Monitor
    ├── TMUX-005: Recovery Agent
    └── TMUX-006: State Tracker
```

### Physical Architecture

```
┌──────────────────────────────────────────────────────┐
│ Local PC (Master Control)                            │
│ - SSH Client                                         │
│ - Orchestrator Scripts                               │
│ - Monitoring Dashboard                               │
└─────────────┬────────────────────────────────────────┘
              │
              ├─────────────────┬───────────────────────
              │                 │
              ▼                 ▼
┌─────────────────────┐   ┌─────────────────────┐
│ MUGEN (EC2)         │   │ MAJIN (EC2)         │
│ 16 vCPU / 124GB RAM │   │ TBD vCPU / TBD RAM  │
│                     │   │                     │
│ tmux session:       │   │ tmux session:       │
│ "miyabi-orchestra"  │   │ "miyabi-orchestra"  │
│   ├── 100 windows   │   │   ├── 100 windows   │
│   └── Agents #1-100 │   │   └── Agents #101-200│
└─────────────────────┘   └─────────────────────┘
```

---

## 📋 Agent Specification

```yaml
agent_specification:
  name: "Multi-Codex MUGEN/MAJIN Orchestra"
  agent_id: "ORCHESTRA-MASTER-001"
  version: "2.0.0"
  type: "Meta-Orchestrator"

  description: |
    200並列Claude Code/Codexインスタンスを統合管理する
    メタオーケストレーターエージェント。
    親オーケストレーターからの高レベル指示を受け、
    大規模並列実行タスクを自律的に実行・管理する。

  core_capabilities:
    - "200並列エージェントの起動・停止・監視"
    - "タスクの自動分配と負荷分散"
    - "APIレート制限管理（RPM/TPM）"
    - "エラー検出と自動回復"
    - "リアルタイムステータス報告"
    - "3段階フェーズ実行（18→50-100→200並列）"
    - "コスト追跡とアラート"
    - "SSH/tmuxインフラ管理"

  operational_modes:
    - phase_1:
        name: "Proof of Concept"
        parallelism: 18
        targets: ["MUGEN:12", "MAJIN:6"]
        purpose: "APIリミット測定、基本動作検証"

    - phase_2:
        name: "Controlled Scale-Up"
        parallelism: "50-100"
        targets: ["MUGEN:14", "MAJIN:7", "NEW:3-4"]
        purpose: "流量制御実装、段階的スケール"

    - phase_3:
        name: "Full Scale"
        parallelism: 200
        targets: ["MUGEN:100", "MAJIN:100"]
        purpose: "完全自動化、クラウドネイティブ化"

  sub_agents:
    - id: "TMUX-001"
      name: "Session Manager"
      responsibility: "tmuxセッションライフサイクル管理"

    - id: "TMUX-002"
      name: "Window Orchestrator"
      responsibility: "100ウィンドウ作成・管理"

    - id: "TMUX-003"
      name: "Command Broadcaster"
      responsibility: "複数ウィンドウへのコマンド配信"

    - id: "TMUX-004"
      name: "Health Monitor"
      responsibility: "200エージェント継続監視"

    - id: "TMUX-005"
      name: "Recovery Agent"
      responsibility: "障害自動検出・回復"

    - id: "TMUX-006"
      name: "State Tracker"
      responsibility: "状態追跡・永続化"

  interface:
    protocol: "JSON-RPC over File System + SSH"
    request_dir: ".codex/queue/incoming/"
    response_dir: ".codex/queue/responses/"
    status_file: ".codex/state/orchestra-status.json"

  dependencies:
    - "SSH connectivity to MUGEN/MAJIN"
    - "tmux installed on remote hosts"
    - "Claude Code/Codex API keys configured"
    - "Bash 4.0+ on all hosts"

  constraints:
    critical:
      - name: "API Rate Limits"
        description: "OpenAI/Anthropic APIのRPM/TPM制限が最大ボトルネック"
        mitigation: "流量制御、キューイング、指数バックオフ、複数キー回転"

      - name: "SSH Connection Stability"
        description: "200インスタンスを2つのSSH接続で制御"
        mitigation: "Keep-Alive設定、自動再接続、タイムアウト最適化"

      - name: "tmux Session Scale"
        description: "100ウィンドウ/セッションが推奨上限"
        mitigation: "2セッション分散（MUGEN/MAJIN各100）"

    resource:
      mugen_cpu: "16 vCPU"
      mugen_memory: "124 GB"
      majin_cpu: "TBD"
      majin_memory: "TBD"

    cost:
      phase_1: "$0 (既存リソース)"
      phase_2: "$2,000-3,000/月"
      phase_3: "$500-1,500/月（変動）"
```

---

## 🔌 Parent Orchestrator Interface

### Command API

親オーケストレーターは以下のコマンドでこのエージェントを制御する:

#### 1. Initialize Orchestra

```yaml
command: "orchestra.init"
parameters:
  phase: 1 | 2 | 3
  nodes:
    - mugen
    - majin
  agent_count: 18 | 50-100 | 200

returns:
  status: "initialized"
  session_ids:
    mugen: "miyabi-orchestra-mugen-{timestamp}"
    majin: "miyabi-orchestra-majin-{timestamp}"
  agent_manifest:
    total: 18
    mugen: 12
    majin: 6
```

#### 2. Submit Task

```yaml
command: "orchestra.submit_task"
parameters:
  task_id: "TASK-{UUID}"
  description: "Task description"
  category: "coding" | "business" | "research" | "support"
  priority: "high" | "medium" | "low"
  target_agents:
    strategy: "priority" | "round-robin" | "load-based" | "affinity"
    count: 1-200
  payload:
    type: "command" | "code" | "analysis"
    content: "..."

returns:
  task_id: "TASK-{UUID}"
  status: "queued"
  assigned_agents: [1, 5, 10, ...]
  estimated_completion: "2025-11-12T15:30:00Z"
```

#### 3. Query Status

```yaml
command: "orchestra.status"
parameters:
  scope: "global" | "node" | "agent" | "task"
  target: "all" | "mugen" | "majin" | agent_id | task_id

returns:
  status: "running"
  health: "healthy" | "degraded" | "critical"
  agents:
    total: 200
    running: 195
    idle: 180
    busy: 15
    error: 5
  api_limits:
    rpm_usage: "750/1000"
    tpm_usage: "45000/60000"
  tasks:
    queued: 50
    in_progress: 15
    completed: 1234
    failed: 8
  uptime_seconds: 86400
```

#### 4. Scale

```yaml
command: "orchestra.scale"
parameters:
  target_count: 50 | 100 | 200
  strategy: "gradual" | "immediate"

returns:
  status: "scaling"
  current_count: 18
  target_count: 50
  eta_seconds: 300
```

#### 5. Shutdown

```yaml
command: "orchestra.shutdown"
parameters:
  graceful: true | false
  drain_tasks: true | false
  timeout_seconds: 300

returns:
  status: "shutdown_initiated"
  pending_tasks: 5
  estimated_completion: "2025-11-12T15:45:00Z"
```

---

## 🔄 State Machine

```
┌─────────────┐
│ UNINITIALIZED│
└──────┬──────┘
       │ orchestra.init
       ▼
┌─────────────┐
│ INITIALIZING│──────┐
└──────┬──────┘      │ (error)
       │             ▼
       │ (success)  ┌──────┐
       ▼            │FAILED│
┌─────────────┐     └──────┘
│    READY    │
└──────┬──────┘
       │ orchestra.submit_task
       ▼
┌─────────────┐
│   RUNNING   │◄─────┐
└──────┬──────┘      │
       │             │
       ├─────────────┤ (task cycle)
       │             │
       │ orchestra.scale
       ▼             │
┌─────────────┐     │
│   SCALING   │─────┘
└──────┬──────┘
       │
       │ orchestra.shutdown
       ▼
┌─────────────┐
│  DRAINING   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ TERMINATED  │
└─────────────┘
```

---

## 📥 Input Schema

### Task Input Format

```json
{
  "task_id": "TASK-a3f2c5d8-1234-5678-9abc-def012345678",
  "submitted_at": "2025-11-12T12:00:00Z",
  "submitted_by": "PARENT-ORCHESTRATOR-001",
  "category": "coding",
  "priority": "high",
  "description": "Implement user authentication module",
  "requirements": {
    "language": "rust",
    "framework": "axum",
    "target_path": "crates/miyabi-auth/",
    "tests_required": true
  },
  "constraints": {
    "max_execution_time_seconds": 3600,
    "max_cost_dollars": 5.0
  },
  "success_criteria": [
    "All tests pass",
    "Code coverage > 80%",
    "Linter passes"
  ]
}
```

---

## 📤 Output Schema

### Task Result Format

```json
{
  "task_id": "TASK-a3f2c5d8-1234-5678-9abc-def012345678",
  "status": "completed",
  "started_at": "2025-11-12T12:00:05Z",
  "completed_at": "2025-11-12T12:45:23Z",
  "duration_seconds": 2718,
  "assigned_agents": [1, 5, 10],
  "primary_agent": 1,
  "result": {
    "success": true,
    "output": {
      "files_created": [
        "crates/miyabi-auth/src/lib.rs",
        "crates/miyabi-auth/src/handlers.rs",
        "crates/miyabi-auth/tests/integration_tests.rs"
      ],
      "tests_passed": 42,
      "tests_failed": 0,
      "coverage_percent": 87.5,
      "linter_errors": 0
    },
    "artifacts": {
      "code_diff": ".codex/results/TASK-a3f2.../diff.patch",
      "test_report": ".codex/results/TASK-a3f2.../test_report.html",
      "logs": ".codex/results/TASK-a3f2.../execution.log"
    }
  },
  "cost": {
    "api_requests": 234,
    "tokens_consumed": 45678,
    "estimated_cost_dollars": 2.34
  },
  "errors": [],
  "warnings": [
    "Agent #5 experienced API rate limit, retried successfully"
  ]
}
```

### Health Status Format

```json
{
  "timestamp": "2025-11-12T12:00:00Z",
  "overall_status": "healthy",
  "nodes": {
    "mugen": {
      "status": "healthy",
      "agents_running": 98,
      "agents_total": 100,
      "cpu_percent": 65.2,
      "memory_percent": 48.7,
      "ssh_connected": true
    },
    "majin": {
      "status": "degraded",
      "agents_running": 97,
      "agents_total": 100,
      "cpu_percent": 72.1,
      "memory_percent": 55.3,
      "ssh_connected": true,
      "warnings": ["Agent #105 not responding"]
    }
  },
  "api_limits": {
    "anthropic": {
      "rpm_current": 750,
      "rpm_limit": 1000,
      "rpm_usage_percent": 75.0,
      "tpm_current": 45000,
      "tpm_limit": 60000,
      "tpm_usage_percent": 75.0
    }
  },
  "tasks": {
    "queued": 15,
    "in_progress": 23,
    "completed_today": 456,
    "failed_today": 3
  },
  "uptime_seconds": 86400
}
```

---

## 🎬 Operational Workflow

### 1. Initialization Phase

```bash
# Parent orchestrator initiates
COMMAND: orchestra.init --phase 1

# Internal workflow:
1. Verify SSH connectivity to MUGEN/MAJIN
2. Check remote host prerequisites
3. Create tmux sessions (TMUX-001)
4. Create windows (TMUX-002) - 12 on MUGEN, 6 on MAJIN
5. Initialize monitoring (TMUX-004)
6. Start recovery agent (TMUX-005)
7. Begin state tracking (TMUX-006)

# Response to parent:
{
  "status": "initialized",
  "agents_ready": 18,
  "health": "healthy"
}
```

### 2. Task Execution Phase

```bash
# Parent orchestrator submits task
COMMAND: orchestra.submit_task --category coding --priority high

# Internal workflow:
1. Validate task input
2. Determine target agents (strategy: priority)
3. Check API rate limits
4. Queue task if limits near
5. Broadcast command to selected agents (TMUX-003)
6. Monitor execution (TMUX-004)
7. Aggregate results
8. Update state (TMUX-006)

# Response to parent:
{
  "task_id": "TASK-xyz",
  "status": "in_progress",
  "assigned_agents": [1, 2, 3]
}
```

### 3. Auto-Recovery Phase

```bash
# TMUX-004 detects agent failure
EVENT: Agent #42 not responding

# Internal workflow (automatic):
1. TMUX-004 detects anomaly
2. TMUX-005 triggered
3. Attempt recovery:
   a. Check window state
   b. Try graceful restart
   c. If failed, force restart
   d. Restore state from TMUX-006
4. Notify parent orchestrator if unrecoverable

# Parent notification:
{
  "event": "agent_recovered",
  "agent_id": 42,
  "downtime_seconds": 45
}
```

### 4. Scaling Phase

```bash
# Parent orchestrator requests scale-up
COMMAND: orchestra.scale --target 50 --strategy gradual

# Internal workflow:
1. Calculate new distribution
2. Provision additional resources (if Phase 2/3)
3. Create new sessions/windows
4. Stagger agent startup (API rate consideration)
5. Integrate new agents into monitoring
6. Redistribute pending tasks

# Progress updates to parent:
{
  "status": "scaling",
  "progress": "30/50",
  "eta_seconds": 120
}
```

---

## 🛡️ Error Handling & Recovery

### Error Categories

#### 1. Infrastructure Errors

```yaml
error_type: "SSH_CONNECTION_LOST"
severity: "critical"
auto_recovery: true
strategy:
  - Attempt SSH reconnection (max 5 retries, exponential backoff)
  - If persistent, mark node as degraded
  - Redistribute tasks to healthy node
  - Alert parent orchestrator
```

#### 2. API Errors

```yaml
error_type: "API_RATE_LIMIT_EXCEEDED"
severity: "high"
auto_recovery: true
strategy:
  - Pause new task assignments
  - Queue pending requests
  - Wait for rate limit window reset
  - Resume with staggered execution
  - No parent notification if recovered within 5 minutes
```

#### 3. Agent Errors

```yaml
error_type: "AGENT_UNRESPONSIVE"
severity: "medium"
auto_recovery: true
strategy:
  - TMUX-005 attempts graceful restart
  - If failed, force restart
  - Restore state from TMUX-006
  - Reassign incomplete tasks
  - Log incident
```

#### 4. Task Errors

```yaml
error_type: "TASK_EXECUTION_FAILED"
severity: "low-medium"
auto_recovery: false
strategy:
  - Capture error logs
  - Return failure result to parent
  - Mark agent as available
  - Preserve artifacts for debugging
```

---

## 📊 Monitoring & Observability

### Real-Time Metrics

```yaml
metrics:
  agent_health:
    - agents_total
    - agents_running
    - agents_idle
    - agents_busy
    - agents_error

  api_usage:
    - rpm_current
    - rpm_limit
    - tpm_current
    - tpm_limit

  task_metrics:
    - tasks_queued
    - tasks_in_progress
    - tasks_completed
    - tasks_failed
    - avg_execution_time_seconds

  resource_metrics:
    - cpu_percent_mugen
    - cpu_percent_majin
    - memory_percent_mugen
    - memory_percent_majin

  cost_metrics:
    - api_requests_total
    - tokens_consumed_total
    - estimated_cost_dollars
```

### Dashboard Commands

```bash
# Real-time dashboard
./scripts/realtime-dashboard.sh

# Protocol monitoring
./scripts/protocol-monitor.sh

# Global status
./scripts/global-monitor.sh watch

# Cost tracking
./scripts/cost-tracker.sh report
```

---

## 🧪 Testing Interface

### Test Commands

```bash
# Unit tests
TEST: orchestra.test --level unit

# Integration tests
TEST: orchestra.test --level integration --phase 1

# E2E tests
TEST: orchestra.test --level e2e --agents 50

# 24-hour stability test
TEST: orchestra.test --stability --duration 86400

# Chaos testing
TEST: orchestra.test --chaos --duration 3600
```

### Test Scenarios

```yaml
test_scenarios:
  - name: "Phase 1 Smoke Test"
    agents: 18
    duration_seconds: 300
    success_criteria:
      - "All agents start successfully"
      - "No crashes within 5 minutes"
      - "API error rate < 5%"

  - name: "API Rate Limit Stress"
    agents: 50
    duration_seconds: 1800
    inject_failures:
      - "Simulate API 429 errors"
    success_criteria:
      - "Auto-recovery within 5 minutes"
      - "Task completion rate > 95%"

  - name: "24-Hour Stability"
    agents: 200
    duration_seconds: 86400
    success_criteria:
      - "Uptime > 99%"
      - "Memory leak detection: none"
      - "Total crashes < 10"
```

---

## 💰 Cost Management

### Cost Tracking

```yaml
cost_tracking:
  enabled: true
  granularity: "per_task" | "per_agent" | "global"

  metrics:
    - api_requests_count
    - tokens_input
    - tokens_output
    - estimated_cost_usd

  alerts:
    - condition: "daily_cost > $100"
      action: "email_alert + pause_non_critical_tasks"

    - condition: "task_cost > $10"
      action: "log_warning + notify_parent"
```

### Cost Estimation

```bash
# Estimate cost for task
ESTIMATE: orchestra.estimate_cost
  --task "Implement feature X"
  --agents 10
  --estimated_tokens 50000

RETURNS:
  estimated_cost_usd: 3.50
  estimated_duration_seconds: 1200
```

---

## 🔗 Integration with Parent Orchestrator

### Communication Protocol

```yaml
protocol:
  type: "File-based JSON-RPC"

  request_flow:
    1. Parent writes command to: .codex/queue/incoming/{command_id}.json
    2. Orchestra detects new file (inotify/polling)
    3. Orchestra processes command
    4. Orchestra writes response to: .codex/queue/responses/{command_id}.json
    5. Orchestra updates status: .codex/state/orchestra-status.json

  heartbeat:
    interval_seconds: 60
    file: .codex/state/heartbeat.json
    format:
      timestamp: "2025-11-12T12:00:00Z"
      status: "alive"
      uptime_seconds: 3600
```

### Event Notifications

```yaml
events:
  - name: "agent_failure"
    severity: "high"
    notification: "immediate"

  - name: "task_completed"
    severity: "info"
    notification: "batched"

  - name: "api_limit_warning"
    severity: "medium"
    notification: "immediate"

  - name: "cost_threshold_exceeded"
    severity: "high"
    notification: "immediate"
```

---

## 🎓 Best Practices for Parent Orchestrator

### 1. Task Submission

```yaml
# DO: Submit tasks with clear success criteria
task:
  description: "Implement auth module"
  success_criteria:
    - "All tests pass"
    - "Coverage > 80%"
  constraints:
    max_execution_time: 3600

# DON'T: Submit vague tasks
task:
  description: "Make it better"  # ❌ Too vague
```

### 2. Resource Management

```yaml
# DO: Monitor API limits before submitting large batches
STATUS_CHECK -> SUBMIT if rpm_usage < 70%

# DON'T: Submit 100 tasks when at 90% API limit
```

### 3. Error Handling

```yaml
# DO: Implement retry logic with exponential backoff
if task.status == "failed":
  if retries < 3:
    wait(2^retries * 60)
    retry_task()

# DON'T: Immediately retry failed tasks
```

---

## 📚 Usage Examples

### Example 1: Initialize and Run Simple Task

```yaml
# Step 1: Initialize
REQUEST:
  command: "orchestra.init"
  parameters:
    phase: 1

RESPONSE:
  status: "initialized"
  agents_ready: 18

# Step 2: Submit Task
REQUEST:
  command: "orchestra.submit_task"
  parameters:
    category: "coding"
    description: "Fix bug in auth module"

RESPONSE:
  task_id: "TASK-xyz"
  assigned_agents: [1, 2]

# Step 3: Poll Status
REQUEST:
  command: "orchestra.status"
  parameters:
    scope: "task"
    target: "TASK-xyz"

RESPONSE:
  status: "completed"
  result: {...}
```

### Example 2: Scale Up for Large Workload

```yaml
# Step 1: Check Current Capacity
REQUEST:
  command: "orchestra.status"

RESPONSE:
  agents: {total: 18, idle: 2, busy: 16}

# Step 2: Scale Up
REQUEST:
  command: "orchestra.scale"
  parameters:
    target_count: 50
    strategy: "gradual"

RESPONSE:
  status: "scaling"
  eta_seconds: 300

# Step 3: Submit Batch Tasks
REQUEST:
  command: "orchestra.submit_batch"
  parameters:
    tasks: [task1, task2, ..., task50]
```

---

## 🔧 Configuration

### Agent Configuration File

Location: `.codex/config/orchestra.yaml`

```yaml
orchestra:
  name: "miyabi-orchestra"
  version: "2.0.0"

  nodes:
    mugen:
      host: "mugen"
      ssh_user: "ubuntu"
      max_agents: 100

    majin:
      host: "majin"
      ssh_user: "ubuntu"
      max_agents: 100

  api:
    provider: "anthropic"
    rate_limits:
      rpm: 1000
      tpm: 60000
    retry:
      max_attempts: 5
      backoff_multiplier: 2

  monitoring:
    health_check_interval: 60
    state_snapshot_interval: 300

  recovery:
    auto_recovery_enabled: true
    max_recovery_attempts: 3
    escalation_threshold: 3

  cost:
    tracking_enabled: true
    daily_budget_usd: 100
    task_budget_usd: 10
```

---

## 📞 Support & Maintenance

### Health Check

```bash
# Check orchestra health
./scripts/health-check.sh

# Expected output:
✓ SSH connectivity to MUGEN
✓ SSH connectivity to MAJIN
✓ tmux sessions active
✓ All 200 agents responding
✓ API limits within threshold
✓ No critical errors in last hour
```

### Troubleshooting

```yaml
common_issues:
  - symptom: "Agents not starting"
    diagnosis: "SSH connection issue"
    solution: "Check ~/.ssh/config, verify key-based auth"

  - symptom: "High API error rate"
    diagnosis: "Rate limit exceeded"
    solution: "Reduce parallelism or implement rate limiting"

  - symptom: "Tasks stuck in queue"
    diagnosis: "All agents busy or failed"
    solution: "Check agent health, restart failed agents"
```

---

## 📈 Performance Characteristics

### Throughput

```yaml
performance:
  phase_1:
    agents: 18
    tasks_per_hour: ~50-100
    api_requests_per_hour: ~5000

  phase_2:
    agents: 50-100
    tasks_per_hour: ~200-400
    api_requests_per_hour: ~20000

  phase_3:
    agents: 200
    tasks_per_hour: ~800-1200
    api_requests_per_hour: ~60000 (rate limited)
```

### Latency

```yaml
latency:
  task_queue_to_execution: "< 5 seconds"
  agent_health_check: "< 10 seconds"
  failure_detection: "< 60 seconds"
  auto_recovery: "< 120 seconds"
  parent_notification: "< 5 seconds"
```

---

## 🎯 Success Criteria

### For Phase 1 (18 agents)

- ✅ All 18 agents start successfully
- ✅ SSH connectivity stable for 24+ hours
- ✅ API error rate < 5%
- ✅ Zero manual interventions required
- ✅ Task completion rate > 95%

### For Phase 2 (50-100 agents)

- ✅ Scale from 18 to 50+ agents without downtime
- ✅ API rate limiting effective
- ✅ Auto-recovery success rate > 90%
- ✅ Cost per task < $5

### For Phase 3 (200 agents)

- ✅ All 200 agents operational
- ✅ 99% uptime over 7 days
- ✅ Fully automated task distribution
- ✅ Cost-optimized (< $1500/month)

---

## 📦 Deliverables to Parent Orchestrator

### 1. Status Reports

- Real-time health status (every 60s)
- Task completion reports
- API usage statistics
- Cost tracking reports

### 2. Task Results

- Execution logs
- Generated artifacts (code, analysis, reports)
- Performance metrics
- Error traces (if failed)

### 3. Alerts

- Critical: Infrastructure failures, unrecoverable errors
- High: API limit warnings, cost threshold exceeded
- Medium: Agent failures (auto-recovered)
- Low: Task completion notifications

---

## 🔒 Security Considerations

```yaml
security:
  ssh:
    - "Key-based authentication only"
    - "No password authentication"
    - "SSH keys with passphrase protection"

  api_keys:
    - "Stored in environment variables"
    - "Never logged or committed"
    - "Rotated regularly"

  access_control:
    - "Parent orchestrator authentication required"
    - "Command validation and sanitization"
    - "Rate limiting on control plane"
```

---

## 📋 Checklist for Parent Orchestrator Integration

```yaml
pre_integration:
  - [ ] Verify SSH connectivity to MUGEN/MAJIN
  - [ ] Configure API keys
  - [ ] Create necessary directories (.codex/queue, .codex/state)
  - [ ] Test file-based communication protocol

integration:
  - [ ] Send orchestra.init command
  - [ ] Verify initialization response
  - [ ] Submit test task
  - [ ] Confirm task completion

post_integration:
  - [ ] Monitor health for 24 hours
  - [ ] Review logs for errors
  - [ ] Validate cost tracking
  - [ ] Test auto-recovery by simulating failures
```

---

## 🔗 Related Documentation

### Internal Documentation
- `.claude/agents/README.md` - Sub-agent overview
- `.claude/agents/tmux-*.md` - Infrastructure agent specs
- `.claude/context/architecture.md` - System architecture
- `def.md` - Phase plan and constraints
- `agents.md` - 200 agent definitions

### Reference Implementation
- `/Users/shunsuke/Dev/miyabi-private/` - Parent project

---

## 📝 Version History

### v2.0.0 (2025-11-12)
- Initial meta-agent specification
- Parent orchestrator interface defined
- 3-phase execution model
- JSON-RPC communication protocol
- Auto-recovery and monitoring

---

## 📞 Contact

**Project**: Multi-Codex MUGEN/MAJIN Orchestra
**Location**: `/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/`
**Agent ID**: `ORCHESTRA-MASTER-001`
**Status**: Active

---

**End of Agent Specification**
