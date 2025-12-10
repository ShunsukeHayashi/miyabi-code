---
name: codex-danger-full-access
description: Execute Claude Code CLI (codex) in YOLO/danger-full-access mode for unrestricted autonomous coding. Use when maximum autonomy is needed for complex tasks requiring no approval prompts, full filesystem access, and unrestricted command execution. Triggers include "codex danger mode", "full auto codex", "yolo mode", "autonomous coding", "no approval needed", or when user explicitly requests `codex -s danger-full-access`.
---

# Codex Danger Full Access Skill

## ⚠️ CRITICAL WARNING

This mode removes ALL safety guardrails. Only use in isolated/sandboxed environments.

**Risks:**
- Unrestricted file system access (read/write/delete anywhere)
- No command execution approval required
- Can modify system files without confirmation
- Network access without restrictions

## Command Reference

### Basic Execution

```bash
# Full danger mode execution
codex -s danger-full-access "your task description"

# With specific model
codex -s danger-full-access -m opus "your task"
codex -s danger-full-access -m sonnet "your task"
codex -s danger-full-access -m haiku "your task"

# With working directory
codex -s danger-full-access -C /path/to/project "your task"

# Resume previous session
codex -s danger-full-access --resume

# Reply to existing session
codex -s danger-full-access --reply "follow up prompt"
```

### Security Modes Comparison

| Mode | Flag | Approvals | Sandboxing |
|------|------|-----------|------------|
| Default | (none) | All actions | Full |
| Auto-edit | `-s auto-edit` | Commands only | Full |
| Full-auto | `-s full-auto` | None | Limited |
| **Danger** | `-s danger-full-access` | **None** | **None** |

## When to Use

1. **Isolated development environments** (containers, VMs)
2. **Automated CI/CD pipelines** where human approval is impossible
3. **Bulk refactoring** requiring many file changes
4. **Complex multi-step tasks** where constant approval breaks flow
5. **Testing environments** where system integrity is not critical

## When NOT to Use

- Production systems
- Systems with sensitive data
- Shared development environments
- When you don't fully trust the task description

## Best Practices

1. **Snapshot first** - Create VM/container snapshot before execution
2. **Limit scope** - Use `-C` to restrict working directory
3. **Review after** - Always review changes via git diff
4. **Use branches** - Work on feature branches, not main
5. **Monitor output** - Watch execution for unexpected behavior

## Example Workflows

### Complex Refactoring

```bash
codex -s danger-full-access -C ./my-project \
  "Refactor all JavaScript files to TypeScript, update imports, and fix type errors"
```

### Full Project Setup

```bash
codex -s danger-full-access \
  "Create a new Next.js app with Tailwind, shadcn/ui, Prisma, and PostgreSQL setup"
```

### Automated Testing Suite

```bash
codex -s danger-full-access -C ./src \
  "Write comprehensive unit tests for all functions in utils/, achieving 90% coverage"
```

## Integration with Miyabi

When using within Miyabi's agent orchestration:

```bash
# Via MCP tool
miyabi-codex:codex_exec_yolo prompt="task" confirm_danger=true

# Via tmux session for long-running tasks
tmux new-session -d -s codex-task 'codex -s danger-full-access "complex task"'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Run with appropriate user permissions |
| Session timeout | Use `--resume` to continue |
| Unexpected changes | Review with `git status` and `git diff` |
| API errors | Check `~/.claude/logs/` for details |
