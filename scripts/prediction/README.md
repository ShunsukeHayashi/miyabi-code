# Failure Prediction System

Issue: #877 - 障害予測システム

## Overview

The Miyabi Failure Prediction System analyzes system metrics and historical patterns to predict potential failures and provide proactive recommendations.

## Features

- **Metric Collection**: CPU, memory, disk, process, and Git metrics
- **Anomaly Detection**: Threshold-based detection with multiple severity levels
- **Failure Prediction**: Component-level failure prediction with confidence scores
- **Recommendations**: Actionable recommendations based on detected issues
- **Watch Mode**: Continuous monitoring with configurable intervals
- **Integration**: Slack and GitHub issue alerting support

## Quick Start

```bash
# Run a single prediction analysis
./run_prediction.sh

# Or directly with Python
python3 failure_predictor.py

# Continuous monitoring
./run_prediction.sh --watch --interval 300

# JSON output
./run_prediction.sh --json
```

## Usage

### CLI Options

```
USAGE:
    ./run_prediction.sh [OPTIONS]

OPTIONS:
    -j, --json          Output as JSON
    -w, --watch         Continuous monitoring mode
    -i, --interval SEC  Interval between checks (default: 300)
    -s, --slack         Send alerts to Slack
    -g, --github        Create GitHub issue on critical findings
    -q, --quiet         Suppress non-critical output
    -h, --help          Show help message
```

### Python Script Options

```bash
python3 failure_predictor.py --help

# Single run
python3 failure_predictor.py

# JSON output
python3 failure_predictor.py --json

# Watch mode
python3 failure_predictor.py --watch --interval 60
```

## Prediction Levels

| Level | Description | Action |
|-------|-------------|--------|
| `healthy` | All metrics normal | No action required |
| `warning` | Metrics approaching thresholds | Monitor closely |
| `critical` | Thresholds exceeded | Immediate attention |
| `failure_imminent` | Failure expected within 30 min | Emergency action |

## Metrics Monitored

### System Metrics

| Metric | Warning | Critical | Failure |
|--------|---------|----------|---------|
| CPU % | 70% | 85% | 95% |
| Memory % | 75% | 85% | 95% |
| Disk % | 80% | 90% | 95% |

### Process Metrics

| Metric | Warning | Critical | Failure |
|--------|---------|----------|---------|
| Miyabi processes | 20 | 50 | 100 |
| Zombie processes | 5 | 10 | 20 |

### Git Metrics

| Metric | Warning | Critical | Failure |
|--------|---------|----------|---------|
| Worktree count | 10 | 20 | 50 |
| Uncommitted files | 50 | 100 | 200 |

## Sample Output

```
============================================================
🔮 Miyabi Failure Prediction Report
============================================================

📅 Timestamp: 2025-11-26 10:30:00
🏥 Overall Health: 🟡 WARNING

📊 Current Metrics:
----------------------------------------
  • cpu_percent: 45.2%
  • memory_percent: 72.1%
  • disk_percent: 65.0%
  • miyabi_process_count: 5
  • zombie_process_count: 0
  • git_worktree_count: 8
  • git_uncommitted_count: 12

⚠️  Detected Anomalies:
----------------------------------------
  🟡 memory_percent
     Current: 72.1
     Threshold: 70.0
     Status: warning

🔮 Failure Predictions:
----------------------------------------
  🟡 Component: MEMORY
     Level: warning
     Confidence: 50%
     Predicted Time: 16:30:00
     Factors:
       - memory_percent: 72.1 (threshold: 70.0)

💡 Recommendations:
----------------------------------------
  1. Run `miyabi cleanup` to free memory
  2. Consider increasing memory allocation

⚠️  Warning: Some metrics are approaching thresholds.
   Consider taking preventive action.

============================================================
```

## JSON Output Format

```json
{
  "timestamp": "2025-11-26T10:30:00",
  "overall_health": "warning",
  "predictions": [
    {
      "component": "memory",
      "level": "warning",
      "confidence": 0.5,
      "predicted_time": "2025-11-26T16:30:00",
      "factors": ["memory_percent: 72.1 (threshold: 70.0)"],
      "recommendations": ["Run `miyabi cleanup` to free memory"]
    }
  ],
  "anomalies": [
    {
      "metric": "memory_percent",
      "current_value": 72.1,
      "threshold": 70.0,
      "severity": "warning"
    }
  ],
  "metrics_summary": {
    "cpu_percent": 45.2,
    "memory_percent": 72.1,
    "disk_percent": 65.0
  },
  "recommendations": [
    "Run `miyabi cleanup` to free memory"
  ]
}
```

## Integration

### Slack Alerts

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
./run_prediction.sh --watch --slack
```

### GitHub Issue Creation

```bash
export GITHUB_TOKEN="ghp_..."
./run_prediction.sh --watch --github
```

### Cron Job

```bash
# Add to crontab for hourly checks
0 * * * * /path/to/scripts/prediction/run_prediction.sh --quiet --slack 2>&1 | logger -t miyabi-prediction
```

### systemd Timer

```ini
# /etc/systemd/system/miyabi-prediction.timer
[Unit]
Description=Miyabi Failure Prediction Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min

[Install]
WantedBy=timers.target
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | System healthy |
| 1 | Critical issues detected |
| 2 | Failure imminent |

## Future Enhancements

1. **Machine Learning Integration**: Train models on historical data
2. **Historical Analysis**: Store and analyze metrics over time
3. **Custom Thresholds**: Configurable thresholds per environment
4. **Dashboard Integration**: Real-time web dashboard
5. **Rust Implementation**: Native Rust crate (`miyabi-prediction`)

## Related Issues

- Issue #877: 障害予測システム
- Issue #878: 自己修復機能
- Issue #847: CloudWatch監視ダッシュボード
