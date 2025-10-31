# Miyabi Scheduled Tasks - Quick Reference

## Task Runner Commands

```bash
# List all tasks
./task-runner.sh --list

# Execute task
./task-runner.sh <task-id>

# Dry run
./task-runner.sh --dry-run <task-id>

# Show history
./task-runner.sh --history [task-id]
```

## Monitor Commands

```bash
# Show dashboard
./monitor.sh

# Watch mode (auto-refresh every 5s)
./monitor.sh --watch

# Task-specific metrics
./monitor.sh --task <task-id>
```

## Installation Commands

### macOS (Launchd)

```bash
# Install all enabled tasks
./install-launchd.sh

# Install specific task
./install-launchd.sh --task <task-id>

# List installed
./install-launchd.sh --list

# Uninstall all
./install-launchd.sh --uninstall
```

### Linux (Cron)

```bash
# Install all enabled tasks
./install-cron.sh

# Install specific task
./install-cron.sh --task <task-id>

# List installed
./install-cron.sh --list

# Show crontab
./install-cron.sh --show

# Uninstall all
./install-cron.sh --uninstall
```

## Task IDs

### Daily (Enabled)
- `ai-blog-daily` - AI news blog (9:00 AM)
- `worktree-cleanup` - Clean worktrees (2:00 AM)
- `session-logs-archival` - Archive logs (3:00 AM)
- `github-issue-triage` - Triage issues (every 6h)

### Weekly (Enabled)
- `security-audit-weekly` - Security audit (Mon 10 AM)
- `dependency-check-weekly` - Check deps (Mon 11 AM)
- `docs-generation` - Generate docs (Mon 1 PM)

### Monthly (Enabled)
- `dependency-audit-full` - Full audit (1st @ 10 AM)
- `disk-cleanup` - Clean disk (1st @ 4 AM)

## File Locations

```
scripts/scheduled-tasks/          # Scripts
  ├── tasks.yaml                 # Task config
  ├── task-runner.sh             # Runner
  ├── monitor.sh                 # Monitor
  └── install-*.sh               # Installers

.ai/logs/scheduled-tasks/         # Logs
  ├── history.json               # History
  └── *.log                      # Task logs

~/Library/LaunchAgents/           # macOS only
  └── com.miyabi.*.plist         # Launchd plists
```

## Cron Schedule Format

```
┌─ minute (0-59)
│ ┌─ hour (0-23)
│ │ ┌─ day (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌─ weekday (0-7, Sun=0/7)
* * * * *
```

### Examples
- `0 9 * * *` - Daily at 9:00 AM
- `0 */4 * * *` - Every 4 hours
- `0 10 * * 1` - Every Monday at 10:00 AM
- `*/30 * * * *` - Every 30 minutes

## Troubleshooting

```bash
# Check if yq/jq installed
which yq jq

# Check Claude Code
which claude

# View recent log
ls -lt .ai/logs/scheduled-tasks/*.log | head -1 | xargs cat

# Check launchd status (macOS)
launchctl list | grep miyabi

# Check cron status (Linux)
crontab -l | grep miyabi
```

## Quick Fixes

### Install dependencies
```bash
brew install yq jq  # macOS
```

### Make scripts executable
```bash
chmod +x scripts/scheduled-tasks/*.sh
```

### Reload launchd (macOS)
```bash
launchctl unload ~/Library/LaunchAgents/com.miyabi.*.plist
launchctl load ~/Library/LaunchAgents/com.miyabi.*.plist
```

### Edit crontab (Linux)
```bash
crontab -e
```

## Environment Variables

```bash
# Override config location
export TASKS_FILE=/path/to/tasks.yaml

# Override Claude binary
export CLAUDE_CODE_BIN=/path/to/claude
```

## Documentation

- Full docs: `docs/SCHEDULED_TASKS.md`
- Implementation summary: `scripts/scheduled-tasks/IMPLEMENTATION_SUMMARY.md`
- README: `scripts/scheduled-tasks/README.md`

## Support

Report issues with label: `scheduled-tasks`
