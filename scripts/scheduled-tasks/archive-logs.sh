#!/usr/bin/env bash
#
# Archive Session Logs
# Purpose: Archive and compress old session logs older than 30 days
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/.ai/logs"
ARCHIVE_DIR="${LOG_DIR}/archive"
DAYS_OLD=30

echo "📦 Archiving logs older than ${DAYS_OLD} days..."

mkdir -p "$ARCHIVE_DIR"

# Find and archive old log files
find "$LOG_DIR" -maxdepth 1 -type f -name "*.log" -mtime +${DAYS_OLD} -print0 | \
while IFS= read -r -d '' log_file; do
    log_basename=$(basename "$log_file")
    archive_name="${log_basename%.log}-$(date -r "$log_file" +%Y%m%d).log.gz"

    echo "  Archiving: $log_basename -> $archive_name"
    gzip -c "$log_file" > "$ARCHIVE_DIR/$archive_name"
    rm "$log_file"
done

# Archive old worktree logs
if [ -d "${LOG_DIR}/worktree" ]; then
    find "${LOG_DIR}/worktree" -type f -name "*.log" -mtime +${DAYS_OLD} -print0 | \
    while IFS= read -r -d '' log_file; do
        log_basename=$(basename "$log_file")
        archive_name="${log_basename%.log}-$(date -r "$log_file" +%Y%m%d).log.gz"

        echo "  Archiving: worktree/$log_basename -> $archive_name"
        gzip -c "$log_file" > "$ARCHIVE_DIR/$archive_name"
        rm "$log_file"
    done
fi

# Count archived files
archived_count=$(find "$ARCHIVE_DIR" -name "*.gz" | wc -l | xargs)
archive_size=$(du -sh "$ARCHIVE_DIR" | cut -f1)

echo "✅ Log archival complete"
echo "   Archived files: $archived_count"
echo "   Archive size: $archive_size"
