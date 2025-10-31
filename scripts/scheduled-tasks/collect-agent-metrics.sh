#!/usr/bin/env bash
#
# Collect Agent Execution Metrics
# Purpose: Collect and aggregate agent execution metrics
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
METRICS_DIR="${PROJECT_ROOT}/.ai/logs/metrics"
AGENT_LOG_DIR="${PROJECT_ROOT}/.ai/logs"

echo "📊 Collecting agent execution metrics..."

mkdir -p "$METRICS_DIR"

# Count agent executions
if [ -d "$AGENT_LOG_DIR" ]; then
    agent_log_count=$(find "$AGENT_LOG_DIR" -name "agent-*.log" -mtime -1 | wc -l | xargs)
    echo "   Agent logs (last 24h): $agent_log_count"
fi

# Generate metrics summary
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > "$METRICS_DIR/metrics-$(date +%Y-%m-%d-%H%M).json" <<EOF
{
  "timestamp": "$timestamp",
  "agent_executions_24h": ${agent_log_count:-0},
  "metrics_collection": "basic"
}
EOF

echo "✅ Metrics collected"
