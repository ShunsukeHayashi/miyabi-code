# Water Spider Orchestrator - Architecture Diagrams

Generated on: 2025-10-24

## 📋 Overview

The **Water Spider Orchestrator** is Miyabi's complete autonomous execution system designed to minimize Claude Code session time and enable unlimited parallel task execution through GitHub Actions + Self-hosted runners.

### Design Goals

| Metric | Current | Target |
|--------|---------|--------|
| **Session Time** | 15-30min/Issue | **Minimize (seconds)** |
| **Parallel Execution** | 3 tasks (manual) | **Unlimited (auto)** |
| **Dependency Resolution** | Manual | **Fully Automatic** |
| **Completion Detection** | Manual check | **Auto notification** |
| **Integration Time** | Manual PR | **Auto Milestone integration** |

---

## 📊 Available Diagrams

### 1. System Architecture
![Water Spider System Architecture](Water%20Spider%20Orchestrator%20-%20System%20Architecture.png)

**Source**: `water-spider-system.puml`

Complete system architecture showing:

**GitHub OS Layer**:
- Issues as task storage (with labels)
- Webhooks (issues.labeled, issues.opened, etc.)
- GitHub Actions workflows
- Results (PRs, comments, milestones)

**Task Scheduler Service (24/7 Daemon)**:
- Issue Collector (10s polling + webhook listener)
- Priority Calculator (label + dependency + time estimation)
- Task Queues (Priority, Blocked, Running, Completed, Failed)
- Task Dispatcher (load balancer, workflow_dispatch trigger)
- SQLite Database (usage.sqlite)

**Self-hosted Runner (Mac mini / Local)**:
- GitHub Actions runner process
- Headless Claude Code sessions (1 Session = 1 Issue)
- Session Log Manager (git commit monitor, Issue comments, @mention escalation)
- Control Plane HTTP API (:8080)

**Key Principle**: **1 Session = 1 Issue** (strict mapping)

---

### 2. Task Lifecycle Flow
![Water Spider Task Flow](Water%20Spider%20Orchestrator%20-%20Task%20Lifecycle%20Flow.png)

**Source**: `water-spider-task-flow.puml`

Sequence diagram showing complete task lifecycle:

**Phase 1: Issue Creation & Collection** (< 30s)
- Developer creates Issue with labels
- Webhook triggers scheduler
- Priority calculation & enqueue

**Phase 2: Task Scheduling & Dispatch** (< 30s)
- Dequeue highest priority task
- Check runner capacity (max 5 concurrent)
- Trigger GitHub Actions workflow_dispatch

**Phase 3: Worktree Setup & Execution** (5-10s)
- Create isolated Git worktree (`.worktrees/issue-443/`)
- Write execution context files
- Spawn headless Claude Code session

**Phase 4: Agent Execution** (5-15min)
- Execute CoordinatorAgent
- Task decomposition & DAG building
- Execute CodeGenAgent (generate Rust code)
- Run tests (`cargo test --all`)
- Execute ReviewAgent (quality scoring)
- Progress logged to Issue comments

**Phase 5: Results & Cleanup** (< 10s)
- git commit & push
- Create PR automatically
- Cleanup worktree (optional)

**Phase 6: State Update & Milestone Integration** (< 10s)
- Update issue state to `state:done`
- Close issue automatically
- Link PR to Milestone

**Total Time**: ~15-20 minutes (fully automated, zero human intervention)

---

### 3. Task Scheduler Service
![Task Scheduler Architecture](Task%20Scheduler%20Service%20Architecture.png)

**Source**: `water-spider-scheduler.puml`

Internal architecture of the `miyabi-orchestrator` crate:

**Issue Collector Module**:
- GitHub API Client (Octocrab wrapper)
- Poller Loop (10s interval)
- Webhook Server (axum :8080/webhooks)
- Issue Parser (label extractor)

**Priority Calculator Module**:
- Label Analyzer (P0:100, P1:75, P2:50, P3:25)
- Dependency Resolver (DAG builder, cycle detector, topological sort)
- Time Estimator (historical data, agent type estimates)

**Task Queues (In-Memory)**:
- Priority Queue (heap-based, sorted by priority)
- Blocked Queue (dependency waiting)
- Running Queue (active sessions, max 5)
- Completed Queue (recent 100)
- Failed Queue (retry queue with exponential backoff)

**Task Dispatcher Module**:
- Load Balancer (max 5 concurrent sessions)
- GitHub Actions workflow_dispatch trigger
- Retry Manager (exponential backoff, max 3 retries)
- Session Tracker

**Monitoring Module**:
- Health Check (HTTP /healthz)
- Metrics Collector (Prometheus format)
- Alert Manager (Slack/Discord)
- Dashboard API (JSON stats)

**SQLite Database** (`usage.sqlite`):
- `sessions` table: Execution history (30 days retention)
- `metrics` table: Time-series performance data (90 days)
- `queue_history` table: Queue residence time tracking (7 days)

**Service Characteristics**:
- Runtime: Rust + Tokio async
- HTTP Server: axum (:8080)
- Database: SQLite (embedded)
- Deployment: systemd service
- Logging: tracing + JSON output

---

### 4. Task State Machine
![Task State Machine](Water%20Spider%20Orchestrator%20-%20Task%20State%20Transitions.png)

**Source**: `water-spider-state-machine.puml`

State machine diagram showing task lifecycle states:

**States**:
1. **Pending**: Issue just created, waiting for collector
2. **Queued**: In Priority Queue, ready for processing
3. **Blocked**: Has unresolved dependencies (blocked-by: #N)
4. **Ready**: Dependencies resolved, runner capacity available
5. **Dispatched**: workflow_dispatch sent to GitHub Actions
6. **Running**: Headless Claude Code executing (timeout: 2h default)
7. **Reviewing**: Quality check in progress
8. **Completing**: Creating PR
9. **Completed**: Issue closed, PR created, success
10. **Failed**: Execution error or timeout
11. **Retrying**: Retry with exponential backoff (max 3 retries)

**Transitions**:
- `Pending → Queued`: Collector polls & enqueues
- `Queued → Blocked`: Has dependencies
- `Queued → Ready`: No dependencies & runner available
- `Blocked → Ready`: Dependencies resolved
- `Ready → Dispatched`: Dispatcher triggers GitHub Actions
- `Dispatched → Running`: Self-hosted runner starts session
- `Running → Reviewing`: Code generation completed
- `Running → Failed`: Execution error or timeout
- `Reviewing → Completing`: Quality score >= 80
- `Reviewing → Failed`: Quality score < 80
- `Completing → Completed`: PR created & issue closed
- `Completing → Failed`: PR creation failed
- `Failed → Retrying`: Retry count < 3
- `Failed → [*]`: Max retries exceeded (manual intervention)
- `Retrying → Queued`: Exponential backoff complete

**Failure Handling**:
- Transient errors (network, API rate limit) → Retry
- External service failures → Retry
- Code compilation errors → Manual intervention
- Test failures → Manual intervention
- Quality score too low → Manual intervention

---

## 🔄 Regenerating Diagrams

### Prerequisites
```bash
brew install plantuml
```

### Generate All Water Spider Diagrams
```bash
plantuml -tpng docs/architecture/water-spider-*.puml
```

### Generate Individual Diagrams
```bash
plantuml -tpng docs/architecture/water-spider-system.puml
plantuml -tpng docs/architecture/water-spider-task-flow.puml
plantuml -tpng docs/architecture/water-spider-scheduler.puml
plantuml -tpng docs/architecture/water-spider-state-machine.puml
```

---

## 📈 Execution Metrics (Estimated)

| Phase | Duration | Bottleneck |
|-------|----------|------------|
| Issue Creation | 1s | Human input |
| Collection & Queueing | < 30s | Polling interval (10s) |
| Dispatch | < 10s | GitHub Actions API |
| Worktree Setup | 5-10s | git operations |
| Agent Execution | 5-15min | LLM API latency |
| PR Creation | < 10s | GitHub API |
| State Update | < 5s | GitHub API |
| **Total (Automated)** | **6-16min** | **Agent execution** |

**Parallelism**: 5 concurrent sessions (configurable, limited by runner resources)

---

## 🎯 Key Design Principles

### 1. Zero-Touch Operation
- No manual intervention required
- Automatic priority calculation
- Automatic dependency resolution
- Automatic retry on transient failures

### 2. Complete Observability
- All logs posted as Issue comments
- Real-time progress updates
- Metrics collected in SQLite
- Health check endpoint (/healthz)

### 3. Fault Tolerance
- Automatic retry with exponential backoff
- Max 3 retries per task
- Graceful degradation (queue persistence)
- @mention escalation on persistent failures

### 4. Scalability
- Unlimited queuing (memory-bounded only)
- Horizontal scaling via multiple runners
- Load balancing across runners
- Resource-aware scheduling

### 5. GitHub OS First
- All state stored in GitHub (Issues, PRs, Labels)
- GitHub Actions as execution engine
- Webhooks as event bus
- No external dependencies (besides SQLite for metrics)

---

## 🔗 Related Documentation

- **[WATER_SPIDER_ORCHESTRATOR_DESIGN.md](../WATER_SPIDER_ORCHESTRATOR_DESIGN.md)**: Complete design specification
- **[CRATE_DEPENDENCY_OPTIMIZATION_PLAN.md](../CRATE_DEPENDENCY_OPTIMIZATION_PLAN.md)**: Dependency optimization
- **[WORKTREE_PROTOCOL.md](../WORKTREE_PROTOCOL.md)**: Worktree lifecycle protocol
- **[CLAUDE_SESSION_SCHEDULER_DESIGN.md](../CLAUDE_SESSION_SCHEDULER_DESIGN.md)**: Session scheduling design

---

## 📝 Implementation Status

**Current Version**: v0.1.1 (Skeleton)

**Crate**: `crates/miyabi-orchestrator/`

**Implemented**:
- ✅ Basic HTTP server (axum :8080)
- ✅ /healthz endpoint
- ✅ SessionScheduler struct
- ✅ CLI argument parsing (clap)
- ✅ Graceful shutdown

**TODO** (from design document):
- ⏳ Issue Collector (GitHub API polling + webhooks)
- ⏳ Priority Calculator (label + dependency + time)
- ⏳ Task Queues (Priority, Blocked, Running, Completed, Failed)
- ⏳ Task Dispatcher (workflow_dispatch trigger)
- ⏳ SQLite integration (session history, metrics)
- ⏳ Monitoring module (Prometheus metrics, alerts)
- ⏳ Retry manager (exponential backoff)
- ⏳ Load balancer (max concurrent sessions)

---

**Last Updated**: 2025-10-24
**Diagram Format**: PlantUML (.puml)
**Output Format**: PNG
**Design Version**: v1.0.0
**Implementation Version**: v0.1.1 (skeleton)
