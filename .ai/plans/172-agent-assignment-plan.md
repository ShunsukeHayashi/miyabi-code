# 172 Agent Assignment Plan

**Date**: 2025-11-29
**Total Agents**: 172
**Platform**: MUGEN (129) + MAJIN (43)

---

## Agent Inventory

| Server | Agent Type | Count | Status |
|--------|-----------|-------|--------|
| MUGEN | Claude Code | 49 | Active |
| MUGEN | Codex CLI | 80 | Active |
| MAJIN | Claude Code | 43 | Active |
| **TOTAL** | - | **172** | - |

---

## Task Categories & Agent Allocation

### Category 1: Core Infrastructure (50 agents)
**Priority**: P0 Critical

| Task | Agents | Type | Server |
|------|--------|------|--------|
| #832 Lambda Deploy | 5 | Claude | MUGEN |
| #843 AWS Phase 1 | 15 | Claude | MUGEN |
| Database Migration | 10 | Codex | MUGEN |
| API Development | 10 | Claude | MAJIN |
| Security Audit | 10 | Codex | MUGEN |

### Category 2: Miyabi Society (#970) (40 agents)
**Priority**: P0 Critical

| Task | Agents | Type | Server |
|------|--------|------|--------|
| Backend API (Axum) | 15 | Claude | MUGEN |
| Frontend (React) | 10 | Codex | MUGEN |
| Database Schema | 5 | Claude | MAJIN |
| WebSocket Real-time | 5 | Claude | MAJIN |
| Testing & QA | 5 | Codex | MUGEN |

### Category 3: Enterprise Customer (#837) (30 agents)
**Priority**: P1 High

| Task | Agents | Type | Server |
|------|--------|------|--------|
| Demo Environment | 10 | Claude | MAJIN |
| Sales Materials | 8 | Codex | MUGEN |
| Documentation | 7 | Codex | MUGEN |
| Pricing Calculator | 5 | Claude | MAJIN |

### Category 4: Code Quality (25 agents)
**Priority**: P2 Medium

| Task | Agents | Type | Server |
|------|--------|------|--------|
| Clippy Fixes | 10 | Codex | MUGEN |
| Test Coverage | 10 | Codex | MUGEN |
| Documentation | 5 | Codex | MUGEN |

### Category 5: Plugin Marketplace (20 agents)
**Priority**: P2 Medium

| Task | Agents | Type | Server |
|------|--------|------|--------|
| Plugin Validation | 8 | Claude | MAJIN |
| Plugin Templates | 7 | Codex | MUGEN |
| Marketplace API | 5 | Claude | MAJIN |

### Category 6: Reserve Pool (7 agents)
**Priority**: On-demand

| Task | Agents | Type | Server |
|------|--------|------|--------|
| Hot Standby | 4 | Claude | MUGEN |
| Escalation Support | 3 | Claude | MAJIN |

---

## Execution Sequence

```
Phase 1: Foundation (T+0 to T+2h)
├── [50 agents] Core Infrastructure
│   ├── Lambda Deploy (5)
│   ├── AWS Phase 1 (15)
│   └── Security Audit (10)
│
Phase 2: Development (T+2h to T+8h)
├── [40 agents] Miyabi Society
│   ├── Backend API (15)
│   ├── Frontend (10)
│   └── Database (5)
│
Phase 3: Business (T+4h to T+10h)
├── [30 agents] Enterprise Customer
│   ├── Demo Environment (10)
│   ├── Sales Materials (8)
│   └── Documentation (7)
│
Phase 4: Quality (Continuous)
└── [25 agents] Code Quality
    ├── Clippy Fixes (10)
    └── Test Coverage (10)
```

---

## Agent Command Templates

### Claude Code Agents
```bash
# Infrastructure Task
"Implement AWS Lambda function for pantheon-api.
 Build with cargo-lambda, deploy to us-east-1.
 Report progress every 10 minutes."

# Development Task
"Implement Axum REST endpoint for /api/v1/agents.
 Include authentication middleware.
 Write comprehensive tests."
```

### Codex CLI Agents
```bash
# Code Quality Task
codex "Run cargo clippy on all crates, fix all warnings.
       Commit fixes with conventional commit messages."

# Testing Task
codex "Generate unit tests for miyabi-core crate.
       Target 80% code coverage."
```

---

## Monitoring & Control

### Dashboard Commands
```bash
# View summary
tmux select-window -t miyabi-deploy:summary

# View specific category
tmux select-window -t miyabi-deploy:mugen-001-010

# Emergency stop all
tmux kill-session -t miyabi-deploy
```

### Rate Limit Management
- Anthropic: 4,000 RPM → Max 66 concurrent Claude requests
- OpenAI: Codex uses o3-mini → Higher throughput
- Stagger requests: 100ms delay between agent starts

### Escalation Path
1. Agent reports blocker → Reserve pool handles
2. Multiple failures → Pause category
3. Critical failure → Human intervention

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lambda Deploy | Working | HTTP 200 from endpoint |
| AWS Phase 1 | Complete | Terraform apply success |
| Miyabi Society | MVP | 5 core endpoints working |
| Enterprise Demo | Ready | 30-min demo script |
| Code Quality | 0 clippy warnings | cargo clippy --all |
| Test Coverage | 80% | cargo tarpaulin |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Rate Limit | Stagger starts, use reserve pool |
| Memory Exhaustion | No new MAJIN agents, monitor MUGEN |
| Disk Full | Pre-clean MUGEN /tmp |
| Task Conflict | Git worktree isolation per agent |
| API Failure | Retry with exponential backoff |

---

## Rollout Command

```bash
# Phase 1: Start Infrastructure agents
./scripts/assign-agents.sh infrastructure 50

# Phase 2: Start Development agents
./scripts/assign-agents.sh development 40

# Phase 3: Start Business agents
./scripts/assign-agents.sh business 30

# Phase 4: Start Quality agents
./scripts/assign-agents.sh quality 25
```

---

**Prepared by**: Claude Code
**Approved by**: [Pending]
**Execution Start**: [Pending User Confirmation]
