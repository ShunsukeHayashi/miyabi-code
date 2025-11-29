#!/usr/bin/env bash
#
# Backup Schedule Setup Script
# Purpose: Configure automated backups using cron or systemd timer
# Author: Miyabi Backup System
# Version: 1.0.0
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-all.sh"

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

show_usage() {
    cat <<EOF
${BLUE}Miyabi Backup Schedule Setup${NC}

Usage: $0 [OPTIONS]

Options:
    -m, --method METHOD     Scheduling method: cron|systemd (default: auto-detect)
    -t, --time TIME         Backup time in HH:MM format (default: 03:00)
    --uninstall            Remove backup schedule
    -h, --help             Show this help message

Examples:
    # Auto-detect and install with default time (3:00 AM)
    $0

    # Use cron with custom time
    $0 --method cron --time 02:30

    # Use systemd timer
    $0 --method systemd --time 04:00

    # Uninstall backup schedule
    $0 --uninstall

EOF
    exit 0
}

# ========================================
# Parse Arguments
# ========================================

METHOD="auto"
BACKUP_TIME="03:00"
UNINSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--method)
            METHOD="$2"
            shift 2
            ;;
        -t|--time)
            BACKUP_TIME="$2"
            shift 2
            ;;
        --uninstall)
            UNINSTALL=true
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

# Validate time format
if [[ ! "$BACKUP_TIME" =~ ^[0-2][0-9]:[0-5][0-9]$ ]]; then
    log_error "Invalid time format: ${BACKUP_TIME} (expected HH:MM)"
    exit 1
fi

HOUR=$(echo "$BACKUP_TIME" | cut -d: -f1)
MINUTE=$(echo "$BACKUP_TIME" | cut -d: -f2)

# ========================================
# Uninstall Function
# ========================================

uninstall_backup_schedule() {
    log_section "Uninstalling Backup Schedule"

    # Remove cron job
    if crontab -l 2>/dev/null | grep -q "backup-all.sh"; then
        log_info "Removing cron job..."
        crontab -l 2>/dev/null | grep -v "backup-all.sh" | crontab -
        log_info "Cron job removed"
    fi

    # Remove systemd timer
    if systemctl --user list-unit-files 2>/dev/null | grep -q "miyabi-backup.timer"; then
        log_info "Removing systemd timer..."
        systemctl --user stop miyabi-backup.timer 2>/dev/null || true
        systemctl --user disable miyabi-backup.timer 2>/dev/null || true
        rm -f ~/.config/systemd/user/miyabi-backup.{service,timer}
        systemctl --user daemon-reload
        log_info "Systemd timer removed"
    fi

    log_section "Backup Schedule Uninstalled"
    exit 0
}

if [[ "$UNINSTALL" == true ]]; then
    uninstall_backup_schedule
fi

# ========================================
# Auto-detect Method
# ========================================

if [[ "$METHOD" == "auto" ]]; then
    if systemctl --version &>/dev/null; then
        METHOD="systemd"
        log_info "Auto-detected: systemd"
    else
        METHOD="cron"
        log_info "Auto-detected: cron"
    fi
fi

# ========================================
# Setup Cron
# ========================================

setup_cron() {
    log_section "Setting up Cron Schedule"

    # Make backup script executable
    chmod +x "${BACKUP_SCRIPT}"

    # Create new cron entry
    CRON_ENTRY="${MINUTE} ${HOUR} * * * ${BACKUP_SCRIPT} >> ${PROJECT_ROOT}/logs/backup-cron.log 2>&1"

    # Remove existing entry if present
    crontab -l 2>/dev/null | grep -v "backup-all.sh" | crontab - 2>/dev/null || true

    # Add new entry
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

    log_info "Cron job installed successfully!"
    log_info "Schedule: Daily at ${BACKUP_TIME}"
    log_info "Log file: ${PROJECT_ROOT}/logs/backup-cron.log"

    # Show current crontab
    echo ""
    log_info "Current crontab:"
    crontab -l | grep "backup-all.sh"
}

# ========================================
# Setup Systemd Timer
# ========================================

setup_systemd() {
    log_section "Setting up Systemd Timer"

    # Create systemd user directory
    mkdir -p ~/.config/systemd/user

    # Make backup script executable
    chmod +x "${BACKUP_SCRIPT}"

    # Create service file
    SERVICE_FILE=~/.config/systemd/user/miyabi-backup.service
    cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Miyabi Database Backup
Documentation=file://${PROJECT_ROOT}/docs/BACKUP_STRATEGY.md

[Service]
Type=oneshot
ExecStart=${BACKUP_SCRIPT}
StandardOutput=journal
StandardError=journal
SyslogIdentifier=miyabi-backup

# Environment
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
WorkingDirectory=${PROJECT_ROOT}

# Security
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${PROJECT_ROOT}/backups ${PROJECT_ROOT}/logs

[Install]
WantedBy=default.target
EOF

    # Create timer file
    TIMER_FILE=~/.config/systemd/user/miyabi-backup.timer
    cat > "${TIMER_FILE}" <<EOF
[Unit]
Description=Miyabi Database Backup Timer
Documentation=file://${PROJECT_ROOT}/docs/BACKUP_STRATEGY.md

[Timer]
# Run daily at specified time
OnCalendar=*-*-* ${HOUR}:${MINUTE}:00

# Run 5 minutes after boot if missed
Persistent=true

# Randomize start time by up to 5 minutes to avoid load spikes
RandomizedDelaySec=5min

[Install]
WantedBy=timers.target
EOF

    # Reload systemd and enable timer
    systemctl --user daemon-reload
    systemctl --user enable miyabi-backup.timer
    systemctl --user start miyabi-backup.timer

    log_info "Systemd timer installed successfully!"
    log_info "Schedule: Daily at ${BACKUP_TIME}"

    # Show timer status
    echo ""
    log_info "Timer status:"
    systemctl --user status miyabi-backup.timer --no-pager || true

    echo ""
    log_info "Next scheduled run:"
    systemctl --user list-timers miyabi-backup.timer --no-pager || true
}

# ========================================
# Main Execution
# ========================================

log_section "Miyabi Backup Schedule Setup"
log_info "Method: ${METHOD}"
log_info "Time: ${BACKUP_TIME}"
log_info "Backup script: ${BACKUP_SCRIPT}"

# Verify backup script exists
if [[ ! -f "$BACKUP_SCRIPT" ]]; then
    log_error "Backup script not found: ${BACKUP_SCRIPT}"
    exit 1
fi

# Create logs directory
mkdir -p "${PROJECT_ROOT}/logs"

# Execute setup based on method
case "$METHOD" in
    cron)
        setup_cron
        ;;
    systemd)
        setup_systemd
        ;;
    *)
        log_error "Invalid method: ${METHOD}"
        log_error "Supported methods: cron, systemd"
        exit 1
        ;;
esac

log_section "Setup Complete!"
log_info "Backups will run daily at ${BACKUP_TIME}"
log_info ""
log_info "Useful commands:"

if [[ "$METHOD" == "cron" ]]; then
    log_info "  View schedule:  crontab -l"
    log_info "  View logs:      tail -f ${PROJECT_ROOT}/logs/backup-cron.log"
    log_info "  Run manually:   ${BACKUP_SCRIPT}"
else
    log_info "  View timers:    systemctl --user list-timers"
    log_info "  View status:    systemctl --user status miyabi-backup.timer"
    log_info "  View logs:      journalctl --user -u miyabi-backup.service"
    log_info "  Run manually:   systemctl --user start miyabi-backup.service"
fi

exit 0
