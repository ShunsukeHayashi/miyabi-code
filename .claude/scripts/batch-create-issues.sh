#!/bin/bash
# Miyabi - GitHub Issue Batch Creation Script
# Usage: ./batch-create-issues.sh <template-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_DIR="$PROJECT_ROOT/.claude/templates"
PROMPT_FILE="$PROJECT_ROOT/.claude/prompts/batch-create-issues.txt"
LOG_DIR="$PROJECT_ROOT/.claude/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    cat << EOF
Usage: $0 <template-name> [options]

Arguments:
  template-name    Name of the template file (without .json extension)

Options:
  -d, --dry-run    Show what would be created without actually creating issues
  -v, --verbose    Enable verbose output
  -h, --help       Show this help message

Examples:
  $0 orchestrator-improvements
  $0 orchestrator-improvements --dry-run
  $0 security-audit --verbose

Available templates:
$(ls -1 "$TEMPLATE_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json$//' | sed 's/^/  - /' || echo "  No templates found")

EOF
    exit 0
}

# Parse arguments
TEMPLATE_NAME=""
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            if [[ -z "$TEMPLATE_NAME" ]]; then
                TEMPLATE_NAME="$1"
            else
                log_error "Unknown argument: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validation
if [[ -z "$TEMPLATE_NAME" ]]; then
    log_error "Template name is required"
    usage
fi

TEMPLATE_FILE="$TEMPLATE_DIR/${TEMPLATE_NAME}.json"

if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    log_info "Available templates:"
    ls -1 "$TEMPLATE_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/.json$//' | sed 's/^/  - /' || log_warning "No templates found"
    exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
    log_error "Prompt file not found: $PROMPT_FILE"
    exit 1
fi

# Check dependencies
if ! command -v claude &> /dev/null; then
    log_error "claude command not found. Please install Claude Code CLI."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    log_error "gh command not found. Please install GitHub CLI."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    log_error "Not in a git repository"
    exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"

# Generate log file name
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/batch-create-issues_${TEMPLATE_NAME}_${TIMESTAMP}.log"

# Banner
echo "================================"
echo "Miyabi - Issue Batch Creation"
echo "================================"
echo ""
log_info "Template: $TEMPLATE_NAME"
log_info "Template file: $TEMPLATE_FILE"
log_info "Log file: $LOG_FILE"

if [[ "$DRY_RUN" == true ]]; then
    log_warning "DRY RUN MODE - No issues will be created"
fi

echo ""

# Read template
TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")

# Extract batch info
BATCH_NAME=$(echo "$TEMPLATE_CONTENT" | jq -r '.batch_name // "Unknown"')
ISSUE_COUNT=$(echo "$TEMPLATE_CONTENT" | jq '.issues | length')

log_info "Batch: $BATCH_NAME"
log_info "Issues to create: $ISSUE_COUNT"
echo ""

# Confirmation prompt (skip in dry-run)
if [[ "$DRY_RUN" != true ]]; then
    read -p "Do you want to proceed? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Aborted by user"
        exit 0
    fi
fi

# Prepare full prompt
FULL_PROMPT=$(cat "$PROMPT_FILE")
FULL_PROMPT="${FULL_PROMPT}\n\n${TEMPLATE_CONTENT}"

if [[ "$DRY_RUN" == true ]]; then
    FULL_PROMPT="${FULL_PROMPT}\n\nIMPORTANT: This is a DRY RUN. Do not actually create any GitHub issues. Instead, show what commands would be executed and provide a summary."
fi

# Execute Claude Code in headless mode
log_info "Starting Claude Code in headless mode..."
echo ""

if [[ "$VERBOSE" == true ]]; then
    echo "$FULL_PROMPT" | claude -p - 2>&1 | tee "$LOG_FILE"
else
    echo "$FULL_PROMPT" | claude -p - 2>&1 | tee "$LOG_FILE" | grep -E "(INFO|SUCCESS|WARNING|ERROR|#[0-9]+|Created|Failed|Summary)"
fi

EXIT_CODE=${PIPESTATUS[0]}

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
    log_success "Batch creation completed successfully"
    log_info "Full log saved to: $LOG_FILE"
else
    log_error "Batch creation failed with exit code: $EXIT_CODE"
    log_info "Check log file for details: $LOG_FILE"
    exit $EXIT_CODE
fi

echo ""
echo "================================"
echo "Done"
echo "================================"
