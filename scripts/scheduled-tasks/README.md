# Miyabi Scheduled Tasks

Automated task execution system using Claude Code headless mode with cron/launchd.

## Quick Start

### 1. List Available Tasks

```bash
./task-runner.sh --list
```

### 2. Test a Task (Dry Run)

```bash
./task-runner.sh --dry-run worktree-cleanup
```

### 3. Execute a Task Manually

```bash
./task-runner.sh worktree-cleanup
```

### 4. Monitor Executions

```bash
./monitor.sh
```

## Installation

### macOS (Launchd)

```bash
./install-launchd.sh
```

### Linux (Cron)

```bash
./install-cron.sh
```

## Files

| File | Description |
|------|-------------|
| `tasks.yaml` | Task configuration |
| `task-runner.sh` | Task orchestrator |
| `monitor.sh` | Monitoring dashboard |
| `install-launchd.sh` | macOS scheduler installer |
| `install-cron.sh` | Linux scheduler installer |
| `archive-logs.sh` | Log archival helper |
| `triage-issues.sh` | Issue triage helper |
| `check-ci-status.sh` | CI health check helper |
| `collect-agent-metrics.sh` | Metrics collection helper |

## Documentation

See [docs/SCHEDULED_TASKS.md](../../docs/SCHEDULED_TASKS.md) for comprehensive documentation.

## Logs

Execution logs and history are stored in `.ai/logs/scheduled-tasks/`.

## Requirements

- `yq` - YAML processor (`brew install yq`)
- `jq` - JSON processor (`brew install jq`)
- `claude` - Claude Code CLI (optional, for AI-powered tasks)

## Examples

```bash
# List all tasks with status
./task-runner.sh --list

# Execute specific task
./task-runner.sh ai-blog-daily

# Dry run
./task-runner.sh --dry-run security-audit-weekly

# Show execution history
./task-runner.sh --history

# Monitor dashboard (watch mode)
./monitor.sh --watch

# Install all enabled tasks (macOS)
./install-launchd.sh

# List installed launchd jobs
./install-launchd.sh --list

# Uninstall all tasks
./install-launchd.sh --uninstall
```

## Task Types

### Daily Tasks
- AI blog generation
- Worktree cleanup
- Log archival
- Issue triage (every 6h)

### Weekly Tasks
- Security audit
- Dependency check
- Documentation generation

### Monthly Tasks
- Full dependency audit
- Disk cleanup

## Support

For issues or questions, see [docs/SCHEDULED_TASKS.md](../../docs/SCHEDULED_TASKS.md).
