# Miyabi Claude Code Skills

**Version**: 4.0.0
**Last Updated**: 2025-12-07
**Priority**: P0
**Total Skills**: 41 Skills (28 Base + 13 Coordination-Enhanced)

---

## Overview

This directory contains **41 Specialized Skills** that extend Claude Code's capabilities.
Skills are **model-invoked** (automatic activation) and trigger based on task context.

### v4.0 New Feature: Perpetual Coordination Architecture

| Document | Purpose |
|----------|---------|
| **SKILL_COORDINATION_PROTOCOL.md** | Inter-skill communication protocol |
| **PERPETUAL_WORKFLOW.md** | Infinite coordination activation system |
| ***/COORDINATION.md** | Skill-specific coordination integration |

### Enhanced Skills (v4.0)

| Category | Skills | Coordination Features |
|----------|--------|----------------------|
| **Infrastructure** | aws-ec2-management, docker-compose-workflow, codex-danger-full-access | Auto-scaling, container orchestration |
| **Development** | ci-cd-pipeline, gemini-slide-generator | Matrix builds, visual generation |
| **Business** | marketing-campaign, sns-content-creation, youtube-optimization | Content multiplication |
| **Coordination** | miyabi-agent-orchestration, miyabi-session-recovery, miyabi-worktree-management, objective-observation-reporting, tmux-a2a-communication | Self-healing, parallel execution |

---

## P0: Skill Usage Principles

### 1. Auto-Invocation Principle

```
X BAD: Manually specify skills
V GOOD: Describe task in natural language -> Claude auto-selects appropriate skill
```

**Examples**:
```
User: "Build the project and run all tests"
-> Claude: Automatically invokes "Rust Development Workflow" Skill

User: "Process issues #270, #271, #272 in parallel"
-> Claude: Automatically invokes "Agent Execution with Worktree" Skill
```

### 2. Skill Selection Priority

| Priority | Category | Criteria |
|----------|----------|----------|
| **P0** | Core Rules | MCP First, Rust priority |
| **P1** | Technical | Development, testing, deployment |
| **P2** | Coordination | tmux, Git, Issue management |
| **P3** | Business | Strategy, marketing, analytics |

### 3. Skill Chaining (NEW in v4.0)

```
[Trigger Event]
    |
    v
[Primary Skill] --signal--> [Dependent Skill] --signal--> [Next Skill]
    |                              |                           |
    v                              v                           v
[Resource shared]           [Resource shared]           [Output]
```

---

## Skill Categories

### Infrastructure Skills (3)

| # | Skill | Purpose | Coordination |
|---|-------|---------|--------------|
| 1 | **aws-ec2-management** | Cloud resource management | COORDINATION.md |
| 2 | **docker-compose-workflow** | Container orchestration | COORDINATION.md |
| 3 | **codex-danger-full-access** | Autonomous execution | COORDINATION.md |

### Development Skills (3)

| # | Skill | Purpose | Coordination |
|---|-------|---------|--------------|
| 4 | **ci-cd-pipeline** | Automation workflows | COORDINATION.md |
| 5 | **gemini-slide-generator** | Visual content creation | COORDINATION.md |
| 6 | **rust-development** | Code quality | Base skill |

### Business Skills (3)

| # | Skill | Purpose | Coordination |
|---|-------|---------|--------------|
| 7 | **marketing-campaign** | Campaign strategy | COORDINATION.md |
| 8 | **sns-content-creation** | Social media | COORDINATION.md |
| 9 | **youtube-optimization** | Video SEO | COORDINATION.md |

### Coordination Skills (7)

| # | Skill | Purpose | Features |
|---|-------|---------|----------|
| 10 | **tmux-a2a-communication** | Agent messaging | PUSH protocol, P0.2 |
| 11 | **tmux-permanent-pane-targeting** | Reliable targeting | %N IDs |
| 12 | **tmux-multiagent-messaging** | Multi-agent coordination | Task queue |
| 13 | **miyabi-agent-orchestration** | Workflow management | T-MAX parallel |
| 14 | **miyabi-session-recovery** | System restoration | L1-L4 recovery |
| 15 | **miyabi-worktree-management** | Parallel development | Isolated environments |
| 16 | **objective-observation-reporting** | Quality reporting | Fact/speculation separation |

### Core Skills (6)

| # | Skill | Purpose | Triggers |
|---|-------|---------|----------|
| 17 | **spec-driven-development** | Spec -> Design -> Implement | Issue, "implement" |
| 18 | **natural-language-commands** | NL -> Operations | Any input |
| 19 | **mcp-discovery** | MCP-first tool selection | "what can you do?" |
| 20 | **auto-agent-orchestration** | Multi-agent auto-coordination | "omakase", "full auto" |
| 21 | **issue-to-pr-pipeline** | Issue -> PR automation | "#XXX", "Issue" |
| 22 | **dashboard-deployment** | Cloud deploy | "deploy", "release" |

### Technical Skills (17)

| # | Skill | Purpose | Triggers |
|---|-------|---------|----------|
| 23 | **agent-execution** | Agent execution, worktree | "run agent" |
| 24 | **issue-analysis** | Issue analysis, label inference | "analyze issue" |
| 25 | **documentation-generation** | Auto documentation | "document" |
| 26 | **git-workflow** | Git operations, PR | "commit", "create PR" |
| 27 | **project-setup** | Project initialization | "new project" |
| 28 | **debugging-troubleshooting** | Debug, error analysis | "debug" |
| 29 | **performance-analysis** | Performance analysis | "optimize" |
| 30 | **security-audit** | Security audit | "scan vulnerabilities" |
| 31 | **dependency-management** | Dependency management | "update dependencies" |
| 32 | **tmux-iterm-integration** | tmux x iTerm2 | "create session" |
| 33 | **context-eng** | Context engineering | "context" |
| 34 | **claude-code-x** | Claude Code extensions | "parallel" |
| 35 | **voicevox** | Voice synthesis | "speak" |
| 36 | **paper2agent** | Paper -> Agent | "paper to agent" |
| 37 | **tdd-workflow** | TDD Red-Green-Refactor | "TDD" |
| 38 | **desktop-app-development** | Desktop app dev | "desktop", "Tauri" |

### Business Skills (5)

| # | Skill | Purpose | Triggers |
|---|-------|---------|----------|
| 39 | **business-strategy-planning** | Strategy planning | "business plan" |
| 40 | **market-research-analysis** | Market research | "market" |
| 41 | **content-marketing-strategy** | Content marketing | "content strategy" |
| 42 | **sales-crm-management** | Sales/CRM | "sales process" |
| 43 | **growth-analytics-dashboard** | Growth analytics | "analytics" |

---

## Perpetual Workflow Pipelines

### Pipeline 1: Development Pipeline
```
rust-development -> ci-cd-pipeline -> docker-compose-workflow -> aws-ec2-management
```

### Pipeline 2: Multi-Agent Pipeline
```
miyabi-worktree-management -> tmux-permanent-pane-targeting -> miyabi-agent-orchestration -> codex-danger-full-access
```

### Pipeline 3: Content Pipeline
```
gemini-slide-generator -> marketing-campaign -> sns-content-creation -> youtube-optimization
```

### Pipeline 4: Recovery Pipeline
```
objective-observation-reporting -> miyabi-session-recovery -> [All coordination skills]
```

---

## Momentum Multipliers

### By Category

| Category | Multiplier | Effect |
|----------|-----------|--------|
| Infrastructure | 2-4x | Parallel instances/containers |
| Development | Nx | N parallel worktrees/agents |
| Content | 20x | 1 concept = 20+ assets |
| Coordination | N^2 | N agents fully connected |

### By Skill

| Skill | Multiplier | Mechanism |
|-------|-----------|-----------|
| miyabi-worktree-management | Nx | N parallel worktrees |
| codex-danger-full-access | Nx | N parallel agents |
| gemini-slide-generator | 20x | Multi-format output |
| ci-cd-pipeline | 4x | Matrix builds |
| tmux-a2a-communication | N^2 | Full mesh communication |

---

## Self-Healing Ecosystem

### Recovery Levels

| Level | Scope | Time Target | Trigger |
|-------|-------|-------------|---------|
| L1 | Single pane | < 10s | Pane unresponsive |
| L2 | Session | < 30s | Multiple panes affected |
| L3 | Full session | < 60s | Session lost |
| L4 | Infrastructure | < 5min | Instance failure |

### Health Monitoring

```
[Every 60s]
    |
    v
[Check all panes]
    |
    +--[Healthy]--> Continue
    +--[Unhealthy]--> Trigger appropriate recovery level
```

---

## Communication Protocols

### P0.2 Protocol (MANDATORY)

```bash
tmux send-keys -t <PANE_ID> '<MESSAGE>' && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

### PUSH Rule

```
V Workers proactively report to Conductor
X Never poll workers for status (PULL forbidden)
```

### Message Format

```
[Agent] {Status}: {Details}
[Sender->Receiver] {Action}: {Details}
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Skill activation latency | < 100ms |
| Chain completion rate | > 95% |
| Recovery time (L1) | < 10s |
| Parallel efficiency | > 80% |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `SKILL_COORDINATION_PROTOCOL.md` | Inter-skill communication |
| `PERPETUAL_WORKFLOW.md` | Pipeline definitions |
| `context/rust-tool-use-rules.md` | MCP tool optimization |
| `agents/specs/coding/*.md` | Agent specifications |

---

## Version History

- **4.0.0** (2025-12-07): Perpetual Coordination Architecture
  - Added SKILL_COORDINATION_PROTOCOL.md
  - Added PERPETUAL_WORKFLOW.md
  - Added COORDINATION.md to 12 skills
  - Implemented auto-trigger sequences
  - Implemented feedback loops
  - Implemented momentum multipliers
- **3.2.0** (2025-12-03): Spec-driven development skills
- **2.0.0** (2025-11-22): P0-P3 priority hierarchy
- **1.0.0** (2025-10-26): Initial release

---

**Miyabi Claude Code Skills - Infinite Coordination Acceleration**
