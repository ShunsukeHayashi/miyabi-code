#!/usr/bin/env bash
#
# SQLite Database Backup Script
# Purpose: Automated SQLite backup with rotation and compression
# Author: Miyabi Backup System
# Version: 1.0.0
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# SQLite database paths
SQLITE_DBS=(
    "${PROJECT_ROOT}/data/miyabi.db"
    "${PROJECT_ROOT}/crates/miyabi-persistence/miyabi-persistence.db"
)

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/sqlite}"
BACKUP_PREFIX="sqlite"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# Retention policy (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=28
MONTHLY_RETENTION=180

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# Helper Functions
# ========================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ========================================
# Pre-flight Checks
# ========================================

log_info "Starting SQLite backup..."

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    log_error "sqlite3 command not found. Please install SQLite."
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"/{daily,weekly,monthly}

# ========================================
# Backup Execution
# ========================================

# Determine backup type based on day of week and month
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

if [[ "$DAY_OF_MONTH" == "01" ]]; then
    BACKUP_TYPE="monthly"
elif [[ "$DAY_OF_WEEK" == "1" ]]; then
    BACKUP_TYPE="weekly"
else
    BACKUP_TYPE="daily"
fi

log_info "Backup type: ${BACKUP_TYPE}"

TOTAL_BACKED_UP=0
BACKUP_MANIFEST="${BACKUP_DIR}/${BACKUP_TYPE}/manifest-${TIMESTAMP}.json"

echo "{" > "${BACKUP_MANIFEST}"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "${BACKUP_MANIFEST}"
echo "  \"backup_type\": \"${BACKUP_TYPE}\"," >> "${BACKUP_MANIFEST}"
echo "  \"databases\": [" >> "${BACKUP_MANIFEST}"

FIRST_DB=true

# Backup each SQLite database
for DB_PATH in "${SQLITE_DBS[@]}"; do
    if [[ ! -f "$DB_PATH" ]]; then
        log_warn "Database not found: ${DB_PATH}, skipping..."
        continue
    fi

    DB_NAME=$(basename "$DB_PATH" .db)
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_TYPE}/${BACKUP_PREFIX}-${DB_NAME}-${TIMESTAMP}.db.gz"

    log_info "Backing up: ${DB_NAME} (${DB_PATH})"

    # Use sqlite3 .backup command for consistent backup
    {
        sqlite3 "$DB_PATH" ".backup /dev/stdout" | gzip -9 > "${BACKUP_FILE}"
    } || {
        log_error "Backup failed for ${DB_NAME}!"
        rm -f "${BACKUP_FILE}"
        continue
    }

    # Verify backup file exists and has content
    if [[ ! -s "${BACKUP_FILE}" ]]; then
        log_error "Backup file is empty for ${DB_NAME}!"
        rm -f "${BACKUP_FILE}"
        continue
    fi

    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    SIZE_BYTES=$(stat -c%s "${BACKUP_FILE}")

    log_info "  ✓ Backup completed: ${BACKUP_SIZE}"

    # Add to manifest
    [[ "$FIRST_DB" == "false" ]] && echo "    ," >> "${BACKUP_MANIFEST}"
    cat >> "${BACKUP_MANIFEST}" <<EOF
    {
      "name": "${DB_NAME}",
      "original_path": "${DB_PATH}",
      "backup_file": "${BACKUP_FILE}",
      "size_bytes": ${SIZE_BYTES},
      "size_human": "${BACKUP_SIZE}",
      "compression": "gzip -9"
    }
EOF
    FIRST_DB=false

    ((TOTAL_BACKED_UP++))
done

echo "  ]" >> "${BACKUP_MANIFEST}"
echo "}" >> "${BACKUP_MANIFEST}"

log_info "Backed up ${TOTAL_BACKED_UP} database(s)"
log_info "Manifest created: ${BACKUP_MANIFEST}"

# ========================================
# Backup Rotation
# ========================================

log_info "Running backup rotation..."

# Remove old daily backups
DELETED_DAILY=$(find "${BACKUP_DIR}/daily" -name "${BACKUP_PREFIX}-*.db.gz" -mtime +${DAILY_RETENTION} -delete -print | wc -l)
find "${BACKUP_DIR}/daily" -name "manifest-*.json" -mtime +${DAILY_RETENTION} -delete
[[ $DELETED_DAILY -gt 0 ]] && log_info "Removed ${DELETED_DAILY} old daily backups"

# Remove old weekly backups
DELETED_WEEKLY=$(find "${BACKUP_DIR}/weekly" -name "${BACKUP_PREFIX}-*.db.gz" -mtime +${WEEKLY_RETENTION} -delete -print | wc -l)
find "${BACKUP_DIR}/weekly" -name "manifest-*.json" -mtime +${WEEKLY_RETENTION} -delete
[[ $DELETED_WEEKLY -gt 0 ]] && log_info "Removed ${DELETED_WEEKLY} old weekly backups"

# Remove old monthly backups
DELETED_MONTHLY=$(find "${BACKUP_DIR}/monthly" -name "${BACKUP_PREFIX}-*.db.gz" -mtime +${MONTHLY_RETENTION} -delete -print | wc -l)
find "${BACKUP_DIR}/monthly" -name "manifest-*.json" -mtime +${MONTHLY_RETENTION} -delete
[[ $DELETED_MONTHLY -gt 0 ]] && log_info "Removed ${DELETED_MONTHLY} old monthly backups"

# ========================================
# Backup Statistics
# ========================================

TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "${BACKUP_PREFIX}-*.db.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log_info "========================================="
log_info "Backup Summary"
log_info "========================================="
log_info "Total backups: ${TOTAL_BACKUPS}"
log_info "Total size: ${TOTAL_SIZE}"
log_info "Daily backups: $(find "${BACKUP_DIR}/daily" -name "*.db.gz" | wc -l)"
log_info "Weekly backups: $(find "${BACKUP_DIR}/weekly" -name "*.db.gz" | wc -l)"
log_info "Monthly backups: $(find "${BACKUP_DIR}/monthly" -name "*.db.gz" | wc -l)"
log_info "========================================="

# ========================================
# Optional: Upload to S3
# ========================================

if [[ -n "${AWS_S3_BACKUP_BUCKET:-}" ]] && command -v aws &> /dev/null; then
    log_info "Uploading backups to S3..."

    for BACKUP_FILE in "${BACKUP_DIR}/${BACKUP_TYPE}/${BACKUP_PREFIX}"-*-"${TIMESTAMP}".db.gz; do
        [[ ! -f "$BACKUP_FILE" ]] && continue

        FILENAME=$(basename "$BACKUP_FILE")
        S3_PATH="s3://${AWS_S3_BACKUP_BUCKET}/miyabi/sqlite/${BACKUP_TYPE}/${FILENAME}"

        if aws s3 cp "${BACKUP_FILE}" "${S3_PATH}" --storage-class STANDARD_IA; then
            log_info "  ✓ S3 upload: ${FILENAME}"
        else
            log_warn "  ✗ S3 upload failed: ${FILENAME} (non-critical)"
        fi
    done

    # Upload manifest
    aws s3 cp "${BACKUP_MANIFEST}" "s3://${AWS_S3_BACKUP_BUCKET}/miyabi/sqlite/${BACKUP_TYPE}/manifest-${TIMESTAMP}.json" \
        --storage-class STANDARD_IA || true
fi

log_info "SQLite backup completed successfully!"

exit 0
