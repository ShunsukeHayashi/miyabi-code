#!/bin/bash
# Miyabi - System Info Collection Script
# Collects system information for demo report

set -e

TIMESTAMP=$(date -Iseconds)
PROJECT_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
OUTPUT_FILE="${PROJECT_ROOT}/.claude/templates/demo-system-report.json"

# Get system info
OS_NAME=$(uname -s)
ARCH=$(uname -m)
HOSTNAME=$(hostname)
UPTIME=$(uptime | awk '{print $3, $4}' | sed 's/,//')

# CPU info
CPU_CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo "N/A")
CPU_USAGE=$(ps aux | awk '{sum+=$3} END {print int(sum)}')

# Memory info (macOS)
MEMORY_TOTAL_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
MEMORY_TOTAL_GB=$(echo "scale=2; $MEMORY_TOTAL_BYTES / 1024 / 1024 / 1024" | bc)

# Get memory usage
VM_STAT=$(vm_stat 2>/dev/null || echo "")
if [ -n "$VM_STAT" ]; then
  PAGES_FREE=$(echo "$VM_STAT" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
  PAGES_ACTIVE=$(echo "$VM_STAT" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
  PAGES_INACTIVE=$(echo "$VM_STAT" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')

  PAGE_SIZE=16384
  MEMORY_FREE_GB=$(echo "scale=2; $PAGES_FREE * $PAGE_SIZE / 1024 / 1024 / 1024" | bc)
  MEMORY_USED_BYTES=$(echo "($PAGES_ACTIVE + $PAGES_INACTIVE) * $PAGE_SIZE" | bc)
  MEMORY_USED_GB=$(echo "scale=2; $MEMORY_USED_BYTES / 1024 / 1024 / 1024" | bc)
  MEMORY_USAGE=$(echo "scale=1; $MEMORY_USED_GB * 100 / $MEMORY_TOTAL_GB" | bc)
else
  MEMORY_FREE_GB="N/A"
  MEMORY_USED_GB="N/A"
  MEMORY_USAGE="N/A"
fi

# Disk info
DISK_INFO=$(df -h / | tail -1)
DISK_TOTAL=$(echo "$DISK_INFO" | awk '{print $2}' | sed 's/Gi//')
DISK_USED=$(echo "$DISK_INFO" | awk '{print $3}' | sed 's/Gi//')
DISK_FREE=$(echo "$DISK_INFO" | awk '{print $4}' | sed 's/Gi//')
DISK_USAGE=$(echo "$DISK_INFO" | awk '{print $5}' | sed 's/%//')

# Git info
cd "$PROJECT_ROOT"
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "N/A")
WORKTREE_COUNT=$(git worktree list 2>/dev/null | wc -l | xargs)

# Generate JSON
cat > "$OUTPUT_FILE" << EOF
{
  "demo_name": "Miyabi System Report Demo",
  "version": "1.0.0",
  "generated_at": "${TIMESTAMP}",
  "execution_start": "$(date +%s)",
  "system": {
    "os_name": "${OS_NAME}",
    "architecture": "${ARCH}",
    "hostname": "${HOSTNAME}",
    "uptime": "${UPTIME}"
  },
  "resources": {
    "cpu": {
      "cores": ${CPU_CORES},
      "usage_percent": ${CPU_USAGE}
    },
    "memory": {
      "total_gb": "${MEMORY_TOTAL_GB}",
      "used_gb": "${MEMORY_USED_GB}",
      "free_gb": "${MEMORY_FREE_GB}",
      "usage_percent": "${MEMORY_USAGE}"
    },
    "disk": {
      "total_gb": "${DISK_TOTAL}",
      "used_gb": "${DISK_USED}",
      "free_gb": "${DISK_FREE}",
      "usage_percent": ${DISK_USAGE}
    }
  },
  "miyabi": {
    "project_path": "${PROJECT_ROOT}",
    "git_branch": "${GIT_BRANCH}",
    "git_commit": "${GIT_COMMIT}",
    "worktree_count": ${WORKTREE_COUNT}
  }
}
EOF

echo "✅ System info collected: ${OUTPUT_FILE}"
