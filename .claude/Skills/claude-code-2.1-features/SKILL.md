---
name: claude-code-2.1-features
description: Leverage Claude Code 2.1.0 new features including fork context, skill hot-reload, hooks, agent selection, wildcard permissions, and MCP dynamic updates. Use when optimizing Miyabi workflows with latest Claude Code capabilities. Triggers include "2.1 features", "fork context", "skill hooks", "hot reload", "wildcard permissions", "MCP update".
context: fork
hooks:
  PreToolUse:
    - validate_feature_availability
  PostToolUse:
    - log_feature_usage
---

# Claude Code 2.1.0 Features for Miyabi

Comprehensive guide to leveraging Claude Code 2.1.0 features in Miyabi workflows.

## Feature Overview

| Feature | Miyabi Benefit | Status |
|---------|----------------|--------|
| Fork Context | Isolated sub-agent execution | ✅ Enabled |
| Skill Hot-Reload | Instant skill updates | ✅ Active |
| Hooks | Automation patterns | ✅ Configured |
| Agent Selection | Targeted skill execution | ✅ Ready |
| Wildcard Permissions | Reduced prompt fatigue | ✅ Available |
| MCP Dynamic Updates | Live server updates | ✅ Integrated |
| Language Settings | Japanese responses | ✅ Set |
| /plan Command | Task planning mode | ✅ Available |

## Fork Context

### What It Does
Runs skills in isolated sub-agent context without polluting main conversation.

### Miyabi Use Cases
- Parallel agent execution (カエデ instances)
- Review loops (サクラ → カエデ → サクラ)
- Deployment pipelines (ボタン operations)

### Implementation
```yaml
# In SKILL.md frontmatter
---
context: fork
---
```

### Execution
```bash
# Create fork for task
claude /context fork --name "issue-123-impl"

# Execute in fork
claude --context "issue-123-impl" "Implement feature X"

# Results return to main context automatically
```

## Skill Hot-Reload

### What It Does
Changes to skills in `~/.claude/skills` or `.claude/skills` are immediately available.

### Miyabi Workflow
1. Edit skill file
2. Changes apply instantly (no restart needed)
3. Test immediately

### Development Pattern
```bash
# Monitor skill changes
fswatch -o ~/.claude/skills | xargs -n1 -I{} echo "Skill updated at $(date)"

# Edit and test cycle
vim ~/.claude/skills/my-skill/SKILL.md
# Changes are live immediately!
```

## Hooks

### Available Hooks
- `PreToolUse`: Validate before tool execution
- `PostToolUse`: Process after tool completion
- `Stop`: Cleanup and aggregation on session end

### Miyabi Hook Patterns

#### Agent Validation (PreToolUse)
```yaml
hooks:
  PreToolUse:
    - validate_agent_availability
    - check_worktree_status
    - verify_mcp_connection
```

#### Execution Logging (PostToolUse)
```yaml
hooks:
  PostToolUse:
    - log_to_miyabi_db
    - update_notion_status
    - notify_slack_channel
```

#### Result Aggregation (Stop)
```yaml
hooks:
  Stop:
    - aggregate_agent_results
    - generate_summary_report
    - notify_guardian
```

## Agent Selection

### What It Does
Specify target agent type for skill execution.

### Agent Types for Miyabi
```yaml
agent: conductor  # しきるん - Coordination
agent: codegen    # カエデ - Implementation
agent: review     # サクラ - Review
agent: pr         # ツバキ - PR Management
agent: deploy     # ボタン - Deployment
```

### Multi-Agent Skill
```yaml
---
name: full-cycle-development
agent: conductor
context: fork
hooks:
  PostToolUse:
    - delegate_to_codegen
    - request_review
    - create_pr
---
```

## Wildcard Permissions

### What It Does
Use `*` in bash permissions to reduce approval prompts.

### Miyabi Configuration
```json
{
  "permissions": {
    "bash": [
      "Bash(npm *)",
      "Bash(pnpm *)",
      "Bash(git *)",
      "Bash(tmux *)",
      "Bash(miyabi *)",
      "Bash(claude *)",
      "Bash(cargo *)",
      "Bash(docker *)",
      "Bash(* install)"
    ]
  }
}
```

### Pattern Examples
```
Bash(npm *)       → npm install, npm run, npm test
Bash(git *)       → git add, git commit, git push
Bash(* install)   → npm install, pip install, brew install
```

## MCP Dynamic Updates

### What It Does
MCP servers can update tools/resources without reconnection.

### Miyabi Benefits
- 33+ MCP servers update live
- No restart required for tool changes
- Dynamic capability expansion

### Implementation
```javascript
// In MCP server
server.sendNotification({
  method: 'notifications/tools/list_changed'
});
```

### Monitoring
```bash
# Check MCP server status
claude /mcp status

# View available tools
claude /tools list
```

## Language Settings

### Japanese Mode for Miyabi
```bash
# Set response language
claude config set language ja

# Or via environment
export CLAUDE_LANGUAGE=ja
```

### Agent Communication
All Miyabi agents can communicate in Japanese:
```
[カエデ] 実装完了: Issue #123
[サクラ] レビュー開始: PR #456
```

## /plan Command

### What It Does
Enables planning mode for task decomposition.

### Miyabi Workflow
```bash
# Enter planning mode
claude /plan

# Plan complex feature
"Plan implementation for user authentication system"

# Claude creates structured plan with:
# - Task breakdown
# - Agent assignments
# - Dependencies
# - Estimated effort
```

## Vim Mode (Enhanced)

### Available Motions
```
y       - Yank (copy)
iw, a"  - Text objects
;, ,    - Repeat motions
>>, <<  - Indent
J       - Join lines
```

### Miyabi Benefit
Faster prompt editing for complex agent instructions.

## Background Processing

### Unified Ctrl+B
```bash
# Background any running task
Ctrl+B

# Both bash commands and agent tasks
# All foreground tasks processed simultaneously
```

### Parallel Agent Execution
```bash
# Start multiple agents in background
Ctrl+B  # Agent 1 continues in background
# Start Agent 2
Ctrl+B  # Agent 2 continues in background
# All agents working in parallel
```

## Remote Session (/teleport)

### Cross-Environment Continuity
```bash
# From Mac mini
claude /teleport

# Resume on EC2 (MUGEN/MAJIN)
claude /remote-env restore
```

### Miyabi Use Case
- Start work on local Mac
- Continue on EC2 servers
- Seamless context preservation

## Auto-Continuation

### What It Does
Automatically continues generation when token limit is reached.

### Benefit
- No manual "continue" prompts
- Uninterrupted long-form generation
- Better for documentation and code generation

## Best Practices for Miyabi

1. **Use fork context** for all sub-agent execution
2. **Define hooks** for automation and logging
3. **Configure wildcard permissions** to reduce prompts
4. **Enable hot-reload** for rapid skill development
5. **Set Japanese language** for agent communication
6. **Use /plan** for complex task decomposition
7. **Leverage /teleport** for cross-environment work
8. **Monitor MCP updates** for capability changes

## Quick Reference

### Skill Template (2.1.0)
```yaml
---
name: my-skill
description: Description with triggers
context: fork
agent: codegen
hooks:
  PreToolUse:
    - validate
  PostToolUse:
    - log
  Stop:
    - cleanup
---

# Skill Content
```

### Permission Template
```json
{
  "permissions": {
    "bash": ["Bash(npm *)", "Bash(git *)"]
  }
}
```

## Related Skills

- `miyabi-agent-orchestration`: Multi-agent coordination
- `tmux-a2a-communication`: Agent messaging
- `codex-danger-full-access`: Full autonomy mode
