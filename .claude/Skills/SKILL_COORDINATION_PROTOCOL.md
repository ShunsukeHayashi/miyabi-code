# Skill Coordination Protocol

**Version**: 1.0.0
**Created**: 2025-12-07
**Purpose**: Inter-skill communication and perpetual activation architecture

---

## Architecture Overview

```
                    +------------------+
                    |  ORCHESTRATION   |
                    |     LAYER        |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v--------+ +--------v--------+ +--------v--------+
|  INFRASTRUCTURE |  |   DEVELOPMENT   |  |    BUSINESS    |
|     SKILLS      |  |     SKILLS      |  |     SKILLS     |
+-----------------+ +-----------------+ +-----------------+
| aws-ec2-mgmt    | | rust-development| | marketing-camp  |
| docker-compose  | | ci-cd-pipeline  | | sns-content     |
| codex-danger    | | gemini-slides   | | youtube-opt     |
+-----------------+ +-----------------+ +-----------------+
         |                   |                   |
         +-------------------+-------------------+
                             |
                    +--------v--------+
                    |  COORDINATION   |
                    |     SKILLS      |
                    +-----------------+
                    | tmux-a2a-comm   |
                    | tmux-pane-tgt   |
                    | tmux-multiagent |
                    | miyabi-orchest  |
                    | miyabi-session  |
                    | miyabi-worktree |
                    | obj-observation |
                    +-----------------+
```

---

## Skill Categories

### Category A: Infrastructure Skills
| Skill | Role | Dependencies |
|-------|------|--------------|
| `aws-ec2-management` | Cloud resource management | None |
| `docker-compose-workflow` | Container orchestration | aws-ec2-management (optional) |
| `codex-danger-full-access` | Autonomous execution | tmux-a2a-communication |

### Category B: Development Skills
| Skill | Role | Dependencies |
|-------|------|--------------|
| `ci-cd-pipeline` | Automation workflows | docker-compose-workflow |
| `gemini-slide-generator` | Visual content creation | None |
| `rust-development` | Code quality | ci-cd-pipeline |

### Category C: Business Skills
| Skill | Role | Dependencies |
|-------|------|--------------|
| `marketing-campaign` | Campaign strategy | gemini-slide-generator |
| `sns-content-creation` | Social media | gemini-slide-generator |
| `youtube-optimization` | Video SEO | sns-content-creation |

### Category D: Coordination Skills
| Skill | Role | Dependencies |
|-------|------|--------------|
| `tmux-a2a-communication` | Agent messaging | tmux-permanent-pane-targeting |
| `tmux-permanent-pane-targeting` | Reliable targeting | None |
| `tmux-multiagent-messaging` | Multi-agent coordination | tmux-a2a-communication |
| `miyabi-agent-orchestration` | Workflow management | All tmux skills |
| `miyabi-session-recovery` | System restoration | miyabi-agent-orchestration |
| `miyabi-worktree-management` | Parallel development | None |
| `objective-observation-reporting` | Quality reporting | None |

---

## Auto-Trigger Sequences

### Sequence 1: Development Pipeline
```
[Trigger: Code change detected]
    |
    v
rust-development (build + test)
    |
    +--[Pass]--> ci-cd-pipeline (lint + format)
    |                |
    |                +--[Pass]--> docker-compose-workflow (container build)
    |                                |
    |                                v
    |                           [Deploy ready]
    |
    +--[Fail]--> objective-observation-reporting (error report)
                    |
                    v
               miyabi-session-recovery (if needed)
```

### Sequence 2: Content Generation Pipeline
```
[Trigger: Content request]
    |
    v
gemini-slide-generator (create visuals)
    |
    +---> marketing-campaign (campaign deck)
    |         |
    |         v
    |     sns-content-creation (social posts)
    |         |
    |         v
    |     youtube-optimization (video content)
    |
    +---> objective-observation-reporting (quality check)
```

### Sequence 3: Multi-Agent Execution Pipeline
```
[Trigger: Issue assignment]
    |
    v
miyabi-worktree-management (create worktree)
    |
    v
tmux-permanent-pane-targeting (get pane IDs)
    |
    v
miyabi-agent-orchestration (assign agents)
    |
    +---> codex-danger-full-access (execute in panes)
    |         |
    |         v
    |     tmux-a2a-communication (progress reports)
    |         |
    |         v
    |     tmux-multiagent-messaging (coordination)
    |
    +---> miyabi-session-recovery (on failure)
```

### Sequence 4: Infrastructure Operations
```
[Trigger: Deploy request]
    |
    v
aws-ec2-management (start/verify instance)
    |
    v
docker-compose-workflow (prepare containers)
    |
    v
ci-cd-pipeline (deploy workflow)
    |
    +--[Success]--> objective-observation-reporting (deployment report)
    |
    +--[Fail]--> miyabi-session-recovery (rollback)
```

---

## Perpetual Activation Triggers

### Trigger Matrix

| Condition | Primary Skill | Auto-Activate |
|-----------|--------------|---------------|
| `cargo build` executed | rust-development | ci-cd-pipeline, objective-observation-reporting |
| `docker compose up` | docker-compose-workflow | aws-ec2-management (if remote) |
| `codex -s danger` | codex-danger-full-access | tmux-a2a-communication |
| `gh issue` command | miyabi-agent-orchestration | miyabi-worktree-management |
| Session crash detected | miyabi-session-recovery | All coordination skills |
| Content request | gemini-slide-generator | marketing-campaign, sns-content-creation |
| Error/failure logged | objective-observation-reporting | miyabi-session-recovery |
| Agent idle > 5min | tmux-multiagent-messaging | miyabi-agent-orchestration |
| PR merged | ci-cd-pipeline | docker-compose-workflow, aws-ec2-management |

### Feedback Loops

```
Loop 1: Development Quality Loop
rust-development --> ci-cd-pipeline --> rust-development
(Each cycle improves code quality metrics)

Loop 2: Content Optimization Loop
gemini-slide-generator --> sns-content-creation --> youtube-optimization --> gemini-slide-generator
(Each cycle refines content based on engagement)

Loop 3: Agent Coordination Loop
miyabi-agent-orchestration --> tmux-a2a-communication --> miyabi-agent-orchestration
(Continuous coordination improvement)

Loop 4: Infrastructure Reliability Loop
aws-ec2-management --> docker-compose-workflow --> ci-cd-pipeline --> aws-ec2-management
(Continuous deployment optimization)
```

---

## Resource Sharing Protocol

### Shared Resources

| Resource | Producer Skills | Consumer Skills |
|----------|----------------|-----------------|
| Pane IDs | tmux-permanent-pane-targeting | All tmux skills |
| Worktree paths | miyabi-worktree-management | codex-danger-full-access, rust-development |
| EC2 instances | aws-ec2-management | docker-compose-workflow, ci-cd-pipeline |
| Generated images | gemini-slide-generator | marketing-campaign, sns-content-creation |
| Build artifacts | rust-development | ci-cd-pipeline, docker-compose-workflow |
| Session state | miyabi-session-recovery | All coordination skills |

### Resource Format

```yaml
# Shared resource format
resource:
  id: "resource-uuid"
  type: "pane_id | worktree | instance | image | artifact | session"
  producer: "skill-name"
  data: {}
  created_at: "ISO8601"
  expires_at: "ISO8601 | never"
```

---

## Self-Healing Ecosystem

### Health Checks

| Skill | Health Check | Recovery Action |
|-------|-------------|-----------------|
| tmux-a2a-communication | Pane responsiveness | miyabi-session-recovery |
| aws-ec2-management | Instance status | Auto-restart instance |
| docker-compose-workflow | Container health | Container restart |
| miyabi-agent-orchestration | Agent heartbeats | Re-assign agents |
| ci-cd-pipeline | Workflow status | Retry or rollback |

### Recovery Chain

```
[Error Detected]
    |
    v
objective-observation-reporting (log error)
    |
    v
miyabi-session-recovery (assess damage)
    |
    +--[Level 1: Pane]--> tmux-permanent-pane-targeting (re-target)
    |
    +--[Level 2: Session]--> tmux-multiagent-messaging (re-init agents)
    |
    +--[Level 3: Environment]--> miyabi-worktree-management (cleanup)
    |
    +--[Level 4: Infrastructure]--> aws-ec2-management (restart)
```

---

## Momentum Multiplication Patterns

### Pattern 1: Parallel Execution Multiplier
```
Input: 1 task
Output: N parallel executions

Trigger: Large task detected
Skills: miyabi-worktree-management + codex-danger-full-access
Multiplier: N worktrees = N concurrent agents

Result: 3-5x throughput increase
```

### Pattern 2: Content Cascade Multiplier
```
Input: 1 concept
Output: Multi-platform content

Trigger: Content request
Skills: gemini-slide-generator -> marketing-campaign -> sns-content-creation -> youtube-optimization

Result: 1 input -> 10+ content pieces
```

### Pattern 3: Automation Chain Multiplier
```
Input: 1 code change
Output: Full deployment

Trigger: Git push
Skills: rust-development -> ci-cd-pipeline -> docker-compose-workflow -> aws-ec2-management

Result: Zero-touch deployment
```

### Pattern 4: Recovery Cascade Multiplier
```
Input: 1 error
Output: Full system restoration

Trigger: System failure
Skills: objective-observation-reporting -> miyabi-session-recovery -> all coordination skills

Result: Auto-healing with minimal downtime
```

---

## Implementation Commands

### Initialize Skill Coordination
```bash
# Get all pane IDs for coordination
tmux list-panes -a -F "#{pane_id} #{session_name}:#{window_index}.#{pane_index}"

# Verify skill dependencies
for skill in aws-ec2-management ci-cd-pipeline docker-compose-workflow; do
  test -f ".claude/Skills/$skill/SKILL.md" && echo "[OK] $skill"
done

# Test skill chain
echo "Testing development pipeline..."
cargo check && echo "[CHAIN] rust-development -> ci-cd-pipeline"
```

### Monitor Skill Activations
```bash
# Log skill activations
tail -f ~/.claude/logs/skill-activations.log

# Check active skills
ps aux | grep -E "codex|claude" | grep -v grep
```

---

## Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Skill activation latency | < 1s | Time from trigger to execution |
| Chain completion rate | > 95% | Successful chain completions |
| Recovery time | < 30s | Time from error to recovery |
| Parallel efficiency | > 80% | Actual vs theoretical speedup |
| Resource utilization | < 70% | CPU/Memory usage |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-07 | Initial protocol design |
