#!/usr/bin/env bash
#
# PostgreSQL Database Backup Script
# Purpose: Automated PostgreSQL backup with rotation and compression
# Author: Miyabi Backup System
# Version: 1.0.0
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

# Load environment variables from .env if exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/openai-apps/miyabi-app/server/.env"

if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/^/export /')
fi

# Database connection settings
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5433}"
DB_NAME="${DATABASE_NAME:-miyabi}"
DB_USER="${DATABASE_USER:-postgres}"
DB_PASSWORD="${DATABASE_PASSWORD:-temppass}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/postgres}"
BACKUP_PREFIX="postgres-${DB_NAME}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# Retention policy (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=28
MONTHLY_RETENTION=180

# Compression
COMPRESSION_LEVEL=9

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

log_info "Starting PostgreSQL backup for database: ${DB_NAME}"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump command not found. Please install PostgreSQL client tools."
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

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_TYPE}/${BACKUP_PREFIX}-${TIMESTAMP}.sql.gz"

log_info "Backup type: ${BACKUP_TYPE}"
log_info "Backup file: ${BACKUP_FILE}"

# Export password for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Execute backup with error handling
{
    pg_dump \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --format=plain \
        --create \
        --clean \
        --if-exists \
        --verbose \
        2>&1 | gzip -${COMPRESSION_LEVEL} > "${BACKUP_FILE}"
} || {
    log_error "Backup failed!"
    rm -f "${BACKUP_FILE}"
    exit 1
}

# Unset password
unset PGPASSWORD

# Verify backup file exists and has content
if [[ ! -s "${BACKUP_FILE}" ]]; then
    log_error "Backup file is empty or doesn't exist!"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log_info "Backup completed successfully! Size: ${BACKUP_SIZE}"

# ========================================
# Create metadata file
# ========================================

METADATA_FILE="${BACKUP_FILE}.meta"
cat > "${METADATA_FILE}" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "port": "${DB_PORT}",
  "backup_type": "${BACKUP_TYPE}",
  "size_bytes": $(stat -c%s "${BACKUP_FILE}"),
  "size_human": "${BACKUP_SIZE}",
  "compression": "gzip -${COMPRESSION_LEVEL}",
  "format": "sql"
}
EOF

log_info "Metadata file created: ${METADATA_FILE}"

# ========================================
# Backup Rotation
# ========================================

log_info "Running backup rotation..."

# Remove old daily backups
find "${BACKUP_DIR}/daily" -name "${BACKUP_PREFIX}-*.sql.gz" -mtime +${DAILY_RETENTION} -delete
DELETED_DAILY=$(find "${BACKUP_DIR}/daily" -name "${BACKUP_PREFIX}-*.sql.gz.meta" -mtime +${DAILY_RETENTION} -delete -print | wc -l)
[[ $DELETED_DAILY -gt 0 ]] && log_info "Removed ${DELETED_DAILY} old daily backups"

# Remove old weekly backups
find "${BACKUP_DIR}/weekly" -name "${BACKUP_PREFIX}-*.sql.gz" -mtime +${WEEKLY_RETENTION} -delete
DELETED_WEEKLY=$(find "${BACKUP_DIR}/weekly" -name "${BACKUP_PREFIX}-*.sql.gz.meta" -mtime +${WEEKLY_RETENTION} -delete -print | wc -l)
[[ $DELETED_WEEKLY -gt 0 ]] && log_info "Removed ${DELETED_WEEKLY} old weekly backups"

# Remove old monthly backups
find "${BACKUP_DIR}/monthly" -name "${BACKUP_PREFIX}-*.sql.gz" -mtime +${MONTHLY_RETENTION} -delete
DELETED_MONTHLY=$(find "${BACKUP_DIR}/monthly" -name "${BACKUP_PREFIX}-*.sql.gz.meta" -mtime +${MONTHLY_RETENTION} -delete -print | wc -l)
[[ $DELETED_MONTHLY -gt 0 ]] && log_info "Removed ${DELETED_MONTHLY} old monthly backups"

# ========================================
# Backup Statistics
# ========================================

TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "${BACKUP_PREFIX}-*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log_info "========================================="
log_info "Backup Summary"
log_info "========================================="
log_info "Total backups: ${TOTAL_BACKUPS}"
log_info "Total size: ${TOTAL_SIZE}"
log_info "Daily backups: $(find "${BACKUP_DIR}/daily" -name "*.sql.gz" | wc -l)"
log_info "Weekly backups: $(find "${BACKUP_DIR}/weekly" -name "*.sql.gz" | wc -l)"
log_info "Monthly backups: $(find "${BACKUP_DIR}/monthly" -name "*.sql.gz" | wc -l)"
log_info "========================================="

# ========================================
# Optional: Upload to S3
# ========================================

if [[ -n "${AWS_S3_BACKUP_BUCKET:-}" ]] && command -v aws &> /dev/null; then
    log_info "Uploading backup to S3..."

    S3_PATH="s3://${AWS_S3_BACKUP_BUCKET}/miyabi/postgres/${BACKUP_TYPE}/${BACKUP_PREFIX}-${TIMESTAMP}.sql.gz"

    if aws s3 cp "${BACKUP_FILE}" "${S3_PATH}" --storage-class STANDARD_IA; then
        log_info "S3 upload successful: ${S3_PATH}"

        # Upload metadata
        aws s3 cp "${METADATA_FILE}" "${S3_PATH}.meta" --storage-class STANDARD_IA
    else
        log_warn "S3 upload failed (non-critical)"
    fi
fi

log_info "PostgreSQL backup completed successfully!"

exit 0
