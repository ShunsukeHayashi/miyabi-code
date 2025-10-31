# Miyabi Scheduled Tasks System

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Status**: Production Ready

Complete automated scheduling system for Miyabi using Claude Code headless mode with cron/launchd.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Task Configuration](#task-configuration)
- [Installation](#installation)
- [Usage](#usage)
- [Available Tasks](#available-tasks)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Adding New Tasks](#adding-new-tasks)

---

## Overview

The Miyabi Scheduled Tasks System provides automated execution of periodic tasks using:

- **Claude Code Headless Mode** (`claude -p`) for AI-powered tasks
- **Task Runner** for orchestration and logging
- **Cron** (Linux) or **Launchd** (macOS) for scheduling
- **Monitoring Dashboard** for execution tracking
- **VOICEVOX Integration** for notifications

### Key Features

- Declarative task configuration in YAML
- Automatic logging and history tracking
- Failed task notifications (macOS + VOICEVOX)
- Execution metrics and monitoring dashboard
- Support for both simple and AI-powered tasks
- Dry-run mode for testing

---

## Quick Start

### 1. Install Dependencies

```bash
# macOS
brew install yq jq

# Linux
# Install yq from: https://github.com/mikefarah/yq
sudo apt-get install jq
```

### 2. Configure Tasks

Edit task configuration:

```bash
vim scripts/scheduled-tasks/tasks.yaml
```

### 3. Install Scheduled Jobs

**macOS (launchd)**:

```bash
cd scripts/scheduled-tasks
./install-launchd.sh
```

**Linux (cron)**:

```bash
cd scripts/scheduled-tasks
./install-cron.sh
```

### 4. Verify Installation

```bash
# List installed tasks
./task-runner.sh --list

# Monitor executions
./monitor.sh
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Scheduling Layer                          │
│  ┌─────────────┐              ┌──────────────┐             │
│  │   Launchd   │   (macOS)    │    Cron      │  (Linux)    │
│  │   (plist)   │              │  (crontab)   │             │
│  └──────┬──────┘              └──────┬───────┘             │
│         │                            │                      │
└─────────┼────────────────────────────┼──────────────────────┘
          │                            │
          └────────────┬───────────────┘
                       │
          ┌────────────▼────────────┐
          │    task-runner.sh      │
          │  (Orchestration Layer)  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │     tasks.yaml          │
          │  (Configuration)        │
          └────────────┬────────────┘
                       │
       ┌───────────────┴───────────────┐
       │                               │
┌──────▼─────┐              ┌──────────▼──────┐
│  Claude    │              │   Direct        │
│  Code      │              │   Execution     │
│  Headless  │              │   (bash/cargo)  │
└──────┬─────┘              └──────────┬──────┘
       │                               │
       └───────────────┬───────────────┘
                       │
          ┌────────────▼────────────┐
          │   Logging & History     │
          │   .ai/logs/             │
          └─────────────────────────┘
```

### Component Overview

| Component | Purpose | Location |
|-----------|---------|----------|
| **tasks.yaml** | Task definitions | `scripts/scheduled-tasks/tasks.yaml` |
| **task-runner.sh** | Task orchestration | `scripts/scheduled-tasks/task-runner.sh` |
| **monitor.sh** | Execution monitoring | `scripts/scheduled-tasks/monitor.sh` |
| **install-launchd.sh** | macOS installer | `scripts/scheduled-tasks/install-launchd.sh` |
| **install-cron.sh** | Linux installer | `scripts/scheduled-tasks/install-cron.sh` |
| **History** | Execution logs | `.ai/logs/scheduled-tasks/` |

---

## Task Configuration

### tasks.yaml Structure

```yaml
tasks:
  - id: task-identifier              # Unique task ID
    name: "Human Readable Name"      # Display name
    schedule: "0 9 * * *"            # Cron expression
    command: "path/to/script.sh"     # Command to execute
    timeout: 900                     # Timeout in seconds
    enabled: true                    # Enable/disable flag
    tools: "Bash,Read,Write"         # Claude Code tools (optional)
    description: "Task description"  # Help text
```

### Cron Schedule Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7) (Sunday=0 or 7)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Schedule Examples

| Expression | Meaning |
|------------|---------|
| `0 9 * * *` | Daily at 9:00 AM |
| `0 */4 * * *` | Every 4 hours |
| `0 10 * * 1` | Every Monday at 10:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 2 * * *` | Daily at 2:00 AM |
| `0 0 1 * *` | 1st day of month at midnight |

---

## Installation

### macOS (Launchd)

**Install all enabled tasks**:

```bash
cd scripts/scheduled-tasks
./install-launchd.sh
```

**Install specific task**:

```bash
./install-launchd.sh --task ai-blog-daily
```

**List installed tasks**:

```bash
./install-launchd.sh --list
```

**Uninstall all tasks**:

```bash
./install-launchd.sh --uninstall
```

### Linux (Cron)

**Install all enabled tasks**:

```bash
cd scripts/scheduled-tasks
./install-cron.sh
```

**Install specific task**:

```bash
./install-cron.sh --task worktree-cleanup
```

**List installed tasks**:

```bash
./install-cron.sh --list
```

**Show crontab**:

```bash
./install-cron.sh --show
```

**Uninstall all tasks**:

```bash
./install-cron.sh --uninstall
```

---

## Usage

### Task Runner

**Execute a task**:

```bash
./task-runner.sh ai-blog-daily
```

**List all tasks**:

```bash
./task-runner.sh --list
```

**Dry run**:

```bash
./task-runner.sh --dry-run worktree-cleanup
```

**Show execution history**:

```bash
./task-runner.sh --history
./task-runner.sh --history ai-blog-daily
```

### Monitoring

**Show dashboard**:

```bash
./monitor.sh
```

**Watch mode (auto-refresh)**:

```bash
./monitor.sh --watch
```

**Task-specific metrics**:

```bash
./monitor.sh --task ai-blog-daily
```

---

## Available Tasks

### Daily Tasks

| Task ID | Schedule | Description |
|---------|----------|-------------|
| `ai-blog-daily` | 9:00 AM | Generate AI news blog using WebSearch |
| `worktree-cleanup` | 2:00 AM | Remove worktrees older than 7 days |
| `session-logs-archival` | 3:00 AM | Archive old session logs |
| `github-issue-triage` | Every 6h | Auto-triage unlabeled issues |

### Weekly Tasks

| Task ID | Schedule | Description |
|---------|----------|-------------|
| `security-audit-weekly` | Mon 10:00 AM | Run cargo audit + clippy |
| `dependency-check-weekly` | Mon 11:00 AM | Check outdated dependencies |
| `docs-generation` | Mon 1:00 PM | Generate rustdoc documentation |
| `performance-benchmarks` | Mon 12:00 PM | Run performance benchmarks (disabled) |

### Monthly Tasks

| Task ID | Schedule | Description |
|---------|----------|-------------|
| `dependency-audit-full` | 1st @ 10:00 AM | Full dependency security audit |
| `disk-cleanup` | 1st @ 4:00 AM | Clean build artifacts |

### On-Demand Tasks (Disabled by Default)

| Task ID | Schedule | Description |
|---------|----------|-------------|
| `ci-health-check` | Hourly | Monitor CI/CD health |
| `agent-metrics-collect` | Every 30m | Collect agent metrics |
| `full-test-suite` | Sun midnight | Run full test suite |
| `docker-cleanup` | Sun 5:00 AM | Clean Docker resources |

---

## Monitoring

### Dashboard Overview

The monitoring dashboard (`monitor.sh`) provides:

- **Overall Statistics**: Total executions, success/failure counts, success rate
- **Recent Executions**: Last 10 task runs with status and duration
- **Task Statistics**: Per-task metrics (runs, successes, failures, avg duration)
- **Recent Failures**: Failed task details with log file paths

### Metrics Tracked

- Total executions
- Success/failure counts
- Success rate percentage
- Average duration per task
- Min/max execution times
- Exit codes for failures
- Log file locations

### Notifications

**macOS Notifications**:
- Success: Glass sound
- Failure: Basso sound

**VOICEVOX Notifications** (if enabled):
- Japanese voice notifications for failures

---

## Troubleshooting

### Task Not Running

**1. Check if task is enabled**:

```bash
./task-runner.sh --list
```

**2. Check if scheduler is running**:

```bash
# macOS
launchctl list | grep miyabi

# Linux
crontab -l | grep miyabi
```

**3. Check logs**:

```bash
tail -f .ai/logs/scheduled-tasks/launchd-<task-id>-stderr.log
```

### Task Failing

**1. Run manually**:

```bash
./task-runner.sh <task-id>
```

**2. Check execution history**:

```bash
./task-runner.sh --history <task-id>
```

**3. View log file**:

```bash
ls -lt .ai/logs/scheduled-tasks/<task-id>-*.log | head -1 | xargs cat
```

### Dependency Issues

**Missing yq**:

```bash
brew install yq  # macOS
```

**Missing jq**:

```bash
brew install jq  # macOS
sudo apt-get install jq  # Linux
```

**Claude Code not found**:

```bash
# Install from: https://claude.ai/download
# Or set CLAUDE_CODE_BIN environment variable
export CLAUDE_CODE_BIN=/path/to/claude
```

### Permission Issues

**Make scripts executable**:

```bash
chmod +x scripts/scheduled-tasks/*.sh
```

**Launchd permission error**:

```bash
# Unload and reload
launchctl unload ~/Library/LaunchAgents/com.miyabi.*.plist
launchctl load ~/Library/LaunchAgents/com.miyabi.*.plist
```

---

## Adding New Tasks

### Step 1: Define Task in tasks.yaml

```yaml
tasks:
  - id: my-new-task
    name: "My New Task"
    schedule: "0 10 * * *"  # Daily at 10:00 AM
    command: "scripts/my-script.sh"
    timeout: 300
    enabled: true
    description: "What this task does"
```

### Step 2: Create Task Script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting my task..."

# Task logic here

echo "✅ Task complete"
```

### Step 3: Test Task

```bash
# Dry run
./task-runner.sh --dry-run my-new-task

# Actual run
./task-runner.sh my-new-task
```

### Step 4: Install Task

```bash
# macOS
./install-launchd.sh --task my-new-task

# Linux
./install-cron.sh --task my-new-task
```

### Step 5: Verify

```bash
# Check installation
./install-launchd.sh --list  # macOS
./install-cron.sh --list     # Linux

# Monitor execution
./monitor.sh --task my-new-task
```

---

## Task Types

### Simple Tasks (Direct Execution)

Tasks without `tools` field execute directly:

```yaml
- id: simple-task
  command: "cargo test --all"
  # No tools field
```

### AI-Powered Tasks (Claude Code)

Tasks with `tools` field use Claude Code headless mode:

```yaml
- id: ai-task
  command: "Generate AI blog article"
  tools: "Bash,Read,Write,WebSearch"
```

---

## Advanced Configuration

### Task Groups

Execute multiple tasks together:

```yaml
task_groups:
  daily:
    - ai-blog-daily
    - worktree-cleanup

  weekly:
    - security-audit-weekly
    - docs-generation
```

### Global Configuration

```yaml
config:
  log_dir: ".ai/logs/scheduled-tasks"
  history_file: ".ai/logs/scheduled-tasks/history.json"
  max_concurrent_tasks: 3
  retry_on_failure: true
  max_retries: 2
  retry_delay_seconds: 60
  notification_on_failure: true
  voicevox_enabled: true
```

---

## Best Practices

### Scheduling

1. **Avoid overlap**: Schedule heavy tasks at different times
2. **Off-peak hours**: Run resource-intensive tasks at night
3. **Timeout wisely**: Set realistic timeouts (5-30 minutes typical)
4. **Test first**: Always dry-run before scheduling

### Task Design

1. **Idempotent**: Tasks should be safe to run multiple times
2. **Error handling**: Exit with proper exit codes (0=success, non-zero=failure)
3. **Logging**: Log progress for debugging
4. **Cleanup**: Clean up temporary files

### Monitoring

1. **Check regularly**: Monitor dashboard weekly
2. **Review failures**: Investigate all failures
3. **Archive logs**: Keep logs organized
4. **Update tasks**: Adjust schedules based on metrics

---

## File Locations

```
scripts/scheduled-tasks/
├── tasks.yaml                  # Task definitions
├── task-runner.sh             # Task orchestrator
├── monitor.sh                 # Monitoring dashboard
├── install-launchd.sh         # macOS installer
├── install-cron.sh            # Linux installer
├── archive-logs.sh            # Log archival helper
├── triage-issues.sh           # Issue triage helper
├── check-ci-status.sh         # CI health check helper
└── collect-agent-metrics.sh   # Metrics collection helper

.ai/logs/scheduled-tasks/
├── history.json                      # Execution history
├── <task-id>-<timestamp>.log        # Task logs
├── launchd-<task-id>-stdout.log     # Launchd stdout
├── launchd-<task-id>-stderr.log     # Launchd stderr
└── cron-<task-id>.log               # Cron logs

~/Library/LaunchAgents/               # macOS only
└── com.miyabi.scheduled-tasks.*.plist
```

---

## References

- [Cron Expression Syntax](https://crontab.guru/)
- [Launchd Reference](https://www.launchd.info/)
- [Claude Code CLI](https://claude.ai/download)
- [yq Documentation](https://github.com/mikefarah/yq)
- [VOICEVOX Engine](https://github.com/VOICEVOX/voicevox_engine)

---

## Support

**Issues**: Create a GitHub Issue with label `scheduled-tasks`
**Questions**: See [TROUBLESHOOTING.md](../.claude/TROUBLESHOOTING.md)
**Contributions**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Generated by**: Miyabi Scheduled Tasks System
**Version**: 1.0.0
**Date**: 2025-10-31
