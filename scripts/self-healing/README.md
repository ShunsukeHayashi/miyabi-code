# Self-Healing System

Issue: #878 - 自己修復機能

## Overview

The Miyabi Self-Healing System automatically detects and repairs common issues, minimizing the need for human intervention.

## Features

- **Issue Detection**: Automatically detects common problems
- **Automatic Repair**: Fixes issues without manual intervention
- **Dry Run Mode**: Preview changes before applying
- **Watch Mode**: Continuous monitoring and healing
- **Slack Integration**: Alert notifications

## Quick Start

```bash
# Run single healing pass
./run_healing.sh

# Dry run (see what would be done)
./run_healing.sh --dry-run

# Continuous monitoring
./run_healing.sh --watch --interval 300

# JSON output
./run_healing.sh --json
```

## Issues Detected

| Issue | Severity | Description |
|-------|----------|-------------|
| `disk_space_critical` | High/Critical | Disk usage > 90% |
| `excessive_worktrees` | Medium/High | > 15 git worktrees |
| `zombie_processes` | Medium | > 5 zombie processes |
| `stale_git_lock` | Medium | Git lock file > 10 min old |
| `large_log_files` | Medium | Log files > 500MB |
| `high_memory_usage` | High/Critical | Memory usage > 90% |

## Healing Actions

### cleanup_disk
Cleans up disk space by:
- Clearing macOS caches
- Cleaning npm cache
- Cleaning cargo cache
- Removing old downloads

### cleanup_worktrees
Cleans git worktrees by:
- Pruning stale worktree references
- Removing worktrees for merged branches

### kill_zombies
Removes zombie processes by:
- Finding zombie processes
- Killing their parent processes

### fix_git_locks
Fixes git lock issues by:
- Removing stale `.git/index.lock` files

### prune_logs
Cleans log files by:
- Removing log files older than 1 day
- Truncating current logs to last 1000 lines

### clear_cache
Frees memory by:
- Clearing npm cache
- Requesting OS to purge memory caches

## Usage

### CLI Options

```
USAGE:
    ./run_healing.sh [OPTIONS]

OPTIONS:
    -d, --dry-run       Show what would be done without making changes
    -j, --json          Output as JSON
    -w, --watch         Continuous healing mode
    -i, --interval SEC  Interval between checks (default: 300)
    -s, --slack         Send alerts to Slack
    -q, --quiet         Suppress non-critical output
    -h, --help          Show help message
```

### Python Script

```bash
# Single run
python3 self_healer.py

# Dry run
python3 self_healer.py --dry-run

# JSON output
python3 self_healer.py --json

# Watch mode
python3 self_healer.py --watch --interval 60
```

## Sample Output

```
============================================================
🔧 Miyabi Self-Healing Report
============================================================

📅 Timestamp: 2025-11-26 10:30:00
✅ Overall: Success
📝 Summary: Successfully healed 2 issue(s).

🔍 Issues Detected:
----------------------------------------
  🟡 excessive_worktrees
     Found 18 git worktrees
     Value: 18.0 (threshold: 15)
  🟡 stale_git_lock
     Found stale .git/index.lock file
     Value: 720.0 (threshold: 600)

🔧 Actions Taken:
----------------------------------------
  ✅ cleanup_worktrees
     Cleaned 3 worktrees, pruned stale references
     Duration: 1.23s
     worktrees_removed: 3
  ✅ fix_git_locks
     Removed stale git lock file
     Duration: 0.01s

✅ All issues have been addressed successfully!

============================================================
```

## JSON Output Format

```json
{
  "timestamp": "2025-11-26T10:30:00",
  "overall_success": true,
  "summary": "Successfully healed 2 issue(s).",
  "issues_detected": [
    {
      "name": "excessive_worktrees",
      "description": "Found 18 git worktrees",
      "severity": "medium",
      "metric_value": 18.0,
      "threshold": 15
    }
  ],
  "actions_taken": [
    {
      "action": "cleanup_worktrees",
      "status": "success",
      "message": "Cleaned 3 worktrees, pruned stale references",
      "duration_seconds": 1.23,
      "details": {
        "worktrees_removed": 3,
        "pruned": true
      }
    }
  ]
}
```

## Integration

### With Failure Prediction

Combine with the failure prediction system for proactive healing:

```bash
# Check for issues
python3 ../prediction/failure_predictor.py --json > /tmp/prediction.json

# If issues found, run healing
if jq -e '.overall_health != "healthy"' /tmp/prediction.json > /dev/null; then
    ./run_healing.sh
fi
```

### Cron Job

```bash
# Add to crontab for hourly healing
0 * * * * /path/to/scripts/self-healing/run_healing.sh --quiet 2>&1 | logger -t miyabi-healing
```

### systemd Service

```ini
# /etc/systemd/system/miyabi-healing.service
[Unit]
Description=Miyabi Self-Healing System
After=network.target

[Service]
Type=simple
ExecStart=/path/to/run_healing.sh --watch --interval 300
Restart=always

[Install]
WantedBy=multi-user.target
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All issues healed |
| 1 | Some issues remain |

## Future Enhancements

1. **Learning-based Healing**: Learn from successful repairs
2. **Predictive Integration**: Heal before issues occur
3. **Complex Diagnostics**: Handle multi-factor issues
4. **Coordinator Failover**: Automatic task reassignment
5. **Rollback Support**: Revert failed healing actions

## Related Issues

- Issue #878: 自己修復機能
- Issue #877: 障害予測システム
- Issue #876: tmuxレイアウト自動最適化
