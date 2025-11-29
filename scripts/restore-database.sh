#!/usr/bin/env bash
#
# Database Restore Script
# Purpose: Restore PostgreSQL or SQLite databases from backup
# Author: Miyabi Backup System
# Version: 1.0.0
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/openai-apps/miyabi-app/server/.env"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/^/export /')
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

show_usage() {
    cat <<EOF
${BLUE}Miyabi Database Restore Tool${NC}

Usage: $0 [OPTIONS]

Options:
    -t, --type TYPE         Database type: postgres|sqlite (required)
    -f, --file BACKUP_FILE  Path to backup file (required)
    -d, --database NAME     Database name (for PostgreSQL)
    --confirm              Skip confirmation prompt
    -h, --help             Show this help message

Examples:
    # Restore PostgreSQL from backup
    $0 --type postgres --file backups/postgres/daily/postgres-miyabi-20251129-120000.sql.gz

    # Restore SQLite from backup
    $0 --type sqlite --file backups/sqlite/daily/sqlite-miyabi-20251129-120000.db.gz --database data/miyabi.db

    # List available backups
    find backups/ -name "*.gz" -type f

EOF
    exit 0
}

# ========================================
# Parse Arguments
# ========================================

DB_TYPE=""
BACKUP_FILE=""
DB_NAME=""
CONFIRM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DB_TYPE="$2"
            shift 2
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        --confirm)
            CONFIRM=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate arguments
if [[ -z "$DB_TYPE" ]] || [[ -z "$BACKUP_FILE" ]]; then
    log_error "Missing required arguments"
    show_usage
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# ========================================
# Confirmation Prompt
# ========================================

if [[ "$CONFIRM" != true ]]; then
    log_warn "========================================="
    log_warn "WARNING: Database Restore Operation"
    log_warn "========================================="
    log_warn "Type: ${DB_TYPE}"
    log_warn "Backup: ${BACKUP_FILE}"
    [[ -n "$DB_NAME" ]] && log_warn "Database: ${DB_NAME}"
    echo ""
    log_warn "This will OVERWRITE the existing database!"
    echo ""
    read -rp "Are you sure you want to continue? [y/N] " -n 1
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
fi

# ========================================
# Restore PostgreSQL
# ========================================

restore_postgres() {
    log_info "Starting PostgreSQL restore..."

    # Database connection settings
    DB_HOST="${DATABASE_HOST:-localhost}"
    DB_PORT="${DATABASE_PORT:-5433}"
    DB_USER="${DATABASE_USER:-postgres}"
    DB_PASSWORD="${DATABASE_PASSWORD:-temppass}"
    TARGET_DB="${DB_NAME:-${DATABASE_NAME:-miyabi}}"

    # Check if pg_restore/psql is available
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi

    # Export password
    export PGPASSWORD="${DB_PASSWORD}"

    log_info "Dropping existing database (if exists)..."
    psql \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname=postgres \
        -c "DROP DATABASE IF EXISTS ${TARGET_DB};" || true

    log_info "Creating new database..."
    psql \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --dbname=postgres \
        -c "CREATE DATABASE ${TARGET_DB};"

    log_info "Restoring from backup: ${BACKUP_FILE}"

    # Restore based on file extension
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "${BACKUP_FILE}" | psql \
            --host="${DB_HOST}" \
            --port="${DB_PORT}" \
            --username="${DB_USER}" \
            --dbname="${TARGET_DB}" \
            --quiet
    else
        psql \
            --host="${DB_HOST}" \
            --port="${DB_PORT}" \
            --username="${DB_USER}" \
            --dbname="${TARGET_DB}" \
            --file="${BACKUP_FILE}" \
            --quiet
    fi

    # Unset password
    unset PGPASSWORD

    log_info "PostgreSQL restore completed successfully!"
    log_info "Database: ${TARGET_DB}"
}

# ========================================
# Restore SQLite
# ========================================

restore_sqlite() {
    log_info "Starting SQLite restore..."

    if [[ -z "$DB_NAME" ]]; then
        log_error "Target database path required for SQLite restore (use -d option)"
        exit 1
    fi

    # Check if sqlite3 is available
    if ! command -v sqlite3 &> /dev/null; then
        log_error "sqlite3 command not found. Please install SQLite."
        exit 1
    fi

    # Create parent directory if needed
    mkdir -p "$(dirname "$DB_NAME")"

    # Backup existing database if it exists
    if [[ -f "$DB_NAME" ]]; then
        BACKUP_EXISTING="${DB_NAME}.before-restore-$(date +%Y%m%d-%H%M%S)"
        log_info "Backing up existing database to: ${BACKUP_EXISTING}"
        cp "${DB_NAME}" "${BACKUP_EXISTING}"
    fi

    log_info "Restoring from backup: ${BACKUP_FILE}"

    # Restore based on file extension
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "${BACKUP_FILE}" > "${DB_NAME}"
    else
        cp "${BACKUP_FILE}" "${DB_NAME}"
    fi

    # Verify database integrity
    if sqlite3 "${DB_NAME}" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_info "SQLite restore completed successfully!"
        log_info "Database: ${DB_NAME}"
    else
        log_error "Database integrity check failed!"

        # Restore backup if it exists
        if [[ -f "${BACKUP_EXISTING}" ]]; then
            log_warn "Restoring previous database..."
            mv "${BACKUP_EXISTING}" "${DB_NAME}"
        fi

        exit 1
    fi
}

# ========================================
# Main Execution
# ========================================

log_info "========================================="
log_info "Miyabi Database Restore"
log_info "========================================="
log_info "Type: ${DB_TYPE}"
log_info "Backup: ${BACKUP_FILE}"
[[ -n "$DB_NAME" ]] && log_info "Database: ${DB_NAME}"
log_info "========================================="

case "$DB_TYPE" in
    postgres|postgresql)
        restore_postgres
        ;;
    sqlite)
        restore_sqlite
        ;;
    *)
        log_error "Invalid database type: ${DB_TYPE}"
        log_error "Supported types: postgres, sqlite"
        exit 1
        ;;
esac

log_info "========================================="
log_info "Restore Completed Successfully!"
log_info "========================================="

exit 0
