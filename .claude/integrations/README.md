# Miyabi → External System Integrations

**Last Updated**: 2025-11-11
**Version**: 1.0.0

## Overview

This directory contains integration bridges that allow Miyabi to control external systems and orchestrations.

## Available Integrations

### 1. Orchestra 200-Parallel Control

**Purpose**: Control the 200-parallel Claude Code/Codex orchestration on MUGEN/MAJIN EC2 instances

**Files**:
- `orchestra-200-control.sh` - Control bridge script
- `orchestra-200-config.yaml` - Integration configuration
- `orchestra-200-agents.yaml` - Agent deployment manifest

**Usage**:

```bash
# Start 200-parallel orchestration from Miyabi
cd /Users/shunsuke/Dev/miyabi-private
./.claude/integrations/orchestra-200-control.sh start 200 "mugen:100,majin:100"

# Execute a Miyabi agent via orchestra
./.claude/integrations/orchestra-200-control.sh agent-execute ai-entrepreneur 270

# Deploy all 14 Business Agents
./.claude/integrations/orchestra-200-control.sh deploy-business-agents

# Watch real-time
./.claude/integrations/orchestra-200-control.sh watch

# Emergency stop
./.claude/integrations/orchestra-200-control.sh emergency-stop "API_LIMIT_REACHED"
```

**Architecture**:

```
Miyabi (Local tmux Orchestra)
    ↓ Control Bridge (.claude/integrations/orchestra-200-control.sh)
    ↓
200-Parallel Orchestra (/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/)
    ↓ SSH Control
    ├── MUGEN (100 instances)
    └── MAJIN (100 instances)
```

**Agent Distribution**:

- **Coding Agents** (6): Primarily run in Miyabi's local tmux, can scale out to orchestra
  - IssueAgent (みつけるん) - Local only
  - CoordinatorAgent (しきるん) - Local only
  - CodeGenAgent (カエデ) - Scalable to 10 instances
  - ReviewAgent (サクラ) - Scalable to 10 instances
  - PRAgent (ツバキ) - Scalable to 5 instances
  - DeploymentAgent (ボタン) - Scalable to 5 instances

- **Business Agents** (14): Distribute across 200 instances
  - Strategy (6 agents): 56 total instances
  - Marketing (5 agents): 70 total instances
  - Sales (3 agents): 50 total instances
  - **Total**: 176 instances allocated

**Remaining Capacity**: 24 instances for dynamic task queue

## Configuration

Edit `orchestra-200-config.yaml` to customize:

- Instance distribution
- Agent mapping
- Task routing rules
- Rate limiting
- Monitoring settings
- Emergency procedures

## Integration Patterns

### Pattern 1: Direct Agent Execution

```bash
# From Miyabi, execute an agent on the orchestra
./.claude/integrations/orchestra-200-control.sh agent-execute <agent-name> <issue-number>
```

### Pattern 2: Batch Execution

```bash
# Create batch file: agents-batch.csv
# Format: agent_name,issue_number,priority
# Example:
#   market-research,270,high
#   content-creation,271,medium
#   analytics,272,high

./.claude/integrations/orchestra-200-control.sh agent-batch agents-batch.csv
```

### Pattern 3: Task Submission

```bash
# Submit a custom task
./.claude/integrations/orchestra-200-control.sh submit-task "business_analysis" '{"target":"競合分析"}' "high"
```

### Pattern 4: Auto-Scale from Miyabi

When Miyabi's local agents detect workload spikes, they can auto-trigger scale-out:

```rust
// In Miyabi agent code
if workload.is_high() {
    orchestra_control::scale(200);
    orchestra_control::distribute_tasks(tasks);
}
```

## Monitoring

### Real-time Dashboard

```bash
./.claude/integrations/orchestra-200-control.sh watch
```

### Export Metrics

```bash
# Export to Miyabi's metrics directory
./.claude/integrations/orchestra-200-control.sh export-metrics
```

### View Logs

```bash
tail -f ~/.miyabi/logs/orchestra-control-$(date +%Y%m%d).log
```

## Emergency Procedures

### Emergency Stop

```bash
./.claude/integrations/orchestra-200-control.sh emergency-stop "REASON"
```

### Circuit Breaker

Automatic shutdown triggers (configured in `orchestra-200-config.yaml`):
- API error rate > 50%
- Cost per hour > $100
- Memory usage > 95%

## Development

### Adding New Integration

1. Create control script: `.claude/integrations/<system>-control.sh`
2. Create config: `.claude/integrations/<system>-config.yaml`
3. Update this README
4. Test integration

### Testing

```bash
# Test connection
./.claude/integrations/orchestra-200-control.sh status

# Test agent execution (dry-run)
DRY_RUN=1 ./.claude/integrations/orchestra-200-control.sh agent-execute test-agent 1
```

## Troubleshooting

### Connection Failed

```bash
# Check SSH connectivity
ssh mugen "hostname"
ssh majin "hostname"

# Check control socket
ls -la /tmp/miyabi-orchestra-control.sock
```

### Agent Not Found

```bash
# Verify agent list
yq eval '.agent_mapping' .claude/integrations/orchestra-200-config.yaml
```

### Rate Limit Errors

```bash
# Check current rate limit status
./.claude/integrations/orchestra-200-control.sh status | jq .rate_limits
```

## References

- Main Project: `/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/`
- Miyabi Agents: `.claude/context/agents.md`
- Orchestra Definition: `multi_codex_Mugen_miyabi-orchestra/def.md`
- Control Interface: `multi_codex_Mugen_miyabi-orchestra/claude.md.outsider`

---

**Maintained by**: Miyabi Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.claude/integrations/`
