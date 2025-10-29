# Mission Control Dashboard PoC (Issue #608)

## 1. Objective
- Deliver a unified “Mission Control” view (CLI + Web) that surfaces agent execution state, branch controls, and workflow status—mirroring GitHub Agent HQ’s Mission Control.
- Enable coordinators to assign, monitor, and recover multi-agent runs without leaving Miyabi tooling.

## 2. Current Signals & Gaps
| Source | What we have | Gaps |
|--------|--------------|------|
| `.ai/logs/agent-execution-*.json` | Structured logs per run (timestamp, agent, status). | No real-time streaming; no aggregation or filters. |
| `miyabi status` | Snapshot of env, worktrees, pending logs. | Lacks per-agent metrics, no task-level drilldown. |
| MCP `miyabi__get_status` | Lightweight JSON summary. | Needs extension for active sessions, branch metadata, failure reasons. |
| Git | Worktree directories, branch names. | No centralized mapping to agent runs; manual correlation. |

## 3. Proposed Architecture
```
┌─────────────────────┐         ┌───────────────────────┐
│  Data Collectors    │         │   Control Plane API   │
│  - log watcher      │  JSON   │  (new miyabi service) │
│  - MCP status hook  ├────────▶│  - aggregate state    │
│  - git/worktree     │         │  - expose REST/MCP    │
└─────────────────────┘         └────────┬──────────────┘
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  │          Presentation Surfaces              │
                  │  - CLI `miyabi mission-control` dashboard   │
                  │  - Web (miyabi-dashboard module)            │
                  │  - Optional VS Code view (Phase 2)          │
                  └─────────────────────────────────────────────┘
```

### 3.1 Control Plane API (Phase 1)
- Implement in `crates/miyabi-web-api` with new endpoint `/api/mission-control/status`.
- Responsibilities:
  - Aggregate latest agent executions (read from `.ai/logs`).
  - Query MCP `miyabi__get_status` for queue depth, active skills.
  - Inspect `.worktrees/` to map branches to agents/issues.
  - Provide summarized metrics: running/failed/completed counts, oldest pending run.

### 3.2 CLI Dashboard
- Command: `miyabi mission-control [--watch]`.
- Features:
  - Table of active runs (issue, agent, branch, elapsed time).
  - Alerts for stalled runs (no heartbeat in N minutes).
  - Quick actions (Phase 2): open log, kill run, checkout branch.

### 3.3 Web Panel (Phase 1b)
- Extend `miyabi-dashboard` (React) with a “Mission Control” page:
  - Real-time (polling) cards for active agents, worktree health, failure feed.
  - Branch controls: button to toggle CI or trigger cleanup (integrate with existing CLI commands via API).

## 4. Implementation Plan
| Phase | Scope | Key Tasks |
|-------|-------|-----------|
| 1 | Data API + CLI read-only | - Define aggregator service.<br>- Create CLI dashboard view (read-only). |
| 1b | Web read-only view | - Add React page, leverage REST endpoint.<br>- Provide filters by agent/type. |
| 2 | Control actions | - Add endpoints/CLI for branch toggles, reruns.<br>- Integrate notifications (Slack/Linear). |
| 3 | Advanced telemetry | - Store historical metrics (sqlite or timeseries).<br>- Introduce alerting thresholds, concurrency heatmaps. |

## 5. Deliverables for Spike
- Confirm feasibility of reading `.ai/logs` incrementally (e.g., `tail`/file watcher vs. periodic scan).
- Identify modifications required in `miyabi__get_status` to report active sessions / plan queue.
- Draft API schema for `/api/mission-control/status`.
- Produce rough CLI wireframe (ASCII example) and React component outline.
- Enumerate risks:
  - Log volume/performance.
  - Long-running agents without heartbeat.
  - Race conditions when multiple coordinators act simultaneously.

## 6. Follow-up Tasks (Post-Spike)
- [ ] Implement Control Plane service module.
- [ ] Extend CLI with `mission-control` command.
- [ ] Build dashboard page in `miyabi-dashboard`.
- [ ] Add automated tests covering aggregator and API.
- [ ] Document operational playbook (alert thresholds, cleanup steps).

