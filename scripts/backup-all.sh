#!/usr/bin/env bash
#
# Unified Database Backup Script
# Purpose: Execute all database backups (PostgreSQL + SQLite) in one command
# Author: Miyabi Backup System
# Version: 1.0.0
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# ========================================
# Main Execution
# ========================================

START_TIME=$(date +%s)
log_section "Miyabi Database Backup - Full System"
log_info "Started at: $(date '+%Y-%m-%d %H:%M:%S')"

POSTGRES_SUCCESS=false
SQLITE_SUCCESS=false

# ========================================
# PostgreSQL Backup
# ========================================

log_section "PostgreSQL Backup"

if [[ -x "${SCRIPT_DIR}/backup-postgres.sh" ]]; then
    if "${SCRIPT_DIR}/backup-postgres.sh"; then
        log_info "PostgreSQL backup completed successfully"
        POSTGRES_SUCCESS=true
    else
        log_error "PostgreSQL backup failed!"
    fi
else
    log_warn "PostgreSQL backup script not found or not executable"
fi

# ========================================
# SQLite Backup
# ========================================

log_section "SQLite Backup"

if [[ -x "${SCRIPT_DIR}/backup-sqlite.sh" ]]; then
    if "${SCRIPT_DIR}/backup-sqlite.sh"; then
        log_info "SQLite backup completed successfully"
        SQLITE_SUCCESS=true
    else
        log_error "SQLite backup failed!"
    fi
else
    log_warn "SQLite backup script not found or not executable"
fi

# ========================================
# Summary Report
# ========================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_section "Backup Summary"

echo -e "PostgreSQL: ${POSTGRES_SUCCESS}" | sed "s/true/${GREEN}✓ Success${NC}/;s/false/${RED}✗ Failed${NC}/"
echo -e "SQLite:     ${SQLITE_SUCCESS}" | sed "s/true/${GREEN}✓ Success${NC}/;s/false/${RED}✗ Failed${NC}/"
echo ""
log_info "Total duration: ${DURATION} seconds"
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"

# ========================================
# Exit Code
# ========================================

if [[ "$POSTGRES_SUCCESS" == true ]] && [[ "$SQLITE_SUCCESS" == true ]]; then
    log_section "All Backups Completed Successfully!"
    exit 0
elif [[ "$POSTGRES_SUCCESS" == true ]] || [[ "$SQLITE_SUCCESS" == true ]]; then
    log_section "Partial Success - Some Backups Failed"
    exit 1
else
    log_section "All Backups Failed!"
    exit 2
fi
