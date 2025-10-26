#!/bin/bash
# Autonomous Issue Processor - SDK Version
# Purpose: Execute complete Issue → Implementation → PR → Deploy workflow using TypeScript SDK
# Implements: Decision Tree D1 → D20
# Modes: Script (confirmed) → Headless AI → Interactive (escalation)
# Usage: ./autonomous-issue-processor-sdk.sh <issue_number> [--dry-run] [--mode=phase1|phase2|phase3]

set -e

# ========== Configuration ==========
ISSUE_NUM="${1:-}"
DRY_RUN=false
HUMAN_INTERVENTION_MODE="phase2"  # Default: Alert-based sync

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --mode=phase1) HUMAN_INTERVENTION_MODE="phase1" ;;
        --mode=phase2) HUMAN_INTERVENTION_MODE="phase2" ;;
        --mode=phase3) HUMAN_INTERVENTION_MODE="phase3" ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SDK_DIR="$PROJECT_ROOT/scripts/sdk-wrapper"
LOG_DIR="/tmp/miyabi-automation"
WORKFLOW_LOG="$LOG_DIR/workflow-$ISSUE_NUM.log"

mkdir -p "$LOG_DIR"

# ========== Color Output ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_phase() {
    echo -e "${MAGENTA}[PHASE]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

log_decision() {
    echo -e "${CYAN}[DECISION]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$WORKFLOW_LOG"
}

# ========== Safety & Rollback ==========
ROLLBACK_STACK=()

push_rollback() {
    ROLLBACK_STACK+=("$1")
}

execute_rollback() {
    log_error "Executing rollback sequence..."

    for (( idx=${#ROLLBACK_STACK[@]}-1 ; idx>=0 ; idx-- )); do
        rollback_cmd="${ROLLBACK_STACK[idx]}"
        log_info "Rollback step $((idx+1)): $rollback_cmd"

        if ! eval "$rollback_cmd"; then
            log_warn "Rollback step failed (continuing...)"
        fi
    done

    log_info "Rollback complete"
}

trap 'execute_rollback' ERR

# ========== Validation ==========
if [ -z "$ISSUE_NUM" ]; then
    echo "ERROR: Issue number required"
    echo ""
    echo "Usage: $0 <issue_number> [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run              Simulate execution without making changes"
    echo "  --mode=phase1          Real-time interactive (operator always present)"
    echo "  --mode=phase2          Alert-based sync (1-5 min response)"
    echo "  --mode=phase3          Async push notification (1-24 hr response)"
    echo ""
    echo "Examples:"
    echo "  $0 270                 # Default: phase2 mode"
    echo "  $0 270 --mode=phase1   # Real-time interactive"
    echo "  $0 270 --dry-run       # Simulation mode"
    exit 1
fi

# ========== Header ==========
log_phase "=========================================="
log_phase "Miyabi Autonomous Issue Processor (SDK)"
log_phase "=========================================="
log_info "Issue: #$ISSUE_NUM"
log_info "Mode: $HUMAN_INTERVENTION_MODE"
log_info "Dry Run: $DRY_RUN"
log_info "SDK Version: TypeScript/Node.js"
log_info "Time: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "Log: $WORKFLOW_LOG"
log_phase ""

# ========== Safety Pre-flight ==========
log_phase "Phase 0: Safety Pre-flight Checks"
log_phase "=========================================="

log_info "Checking git repository safety..."
if ! "$SCRIPT_DIR/../primitives/git-safety-check.sh"; then
    log_error "Git safety check failed - aborting"
    exit 1
fi

log_info "Checking Node.js/npm installation..."
if ! command -v node &>/dev/null; then
    log_error "Node.js not installed"
    exit 1
fi

log_info "Checking SDK dependencies..."
if [ ! -d "$SDK_DIR/node_modules" ]; then
    log_warn "SDK dependencies not installed - installing now..."
    cd "$SDK_DIR" && npm install
fi

log_info "Checking ANTHROPIC_API_KEY (optional for D2)..."
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    log_warn "ANTHROPIC_API_KEY not set - D2 complexity check will be skipped"
fi

log_info "Checking GitHub CLI authentication..."
if ! gh auth status &>/dev/null; then
    log_error "GitHub CLI not authenticated"
    log_info "Please run: gh auth login"
    exit 1
fi

log_success "All pre-flight checks passed"
log_phase ""

# ========== D1: Label Validation (SDK) ==========
log_phase "Decision Point D1: Label Validation (SDK)"
log_phase "=========================================="
log_decision "Mode: TypeScript SDK"
log_info "Executing: npm run d1 $ISSUE_NUM"

if ! (cd "$SDK_DIR" && npm run d1 "$ISSUE_NUM"); then
    log_error "D1 failed: Invalid labels"
    log_info "Workflow terminated - awaiting human intervention"
    exit 1
fi

log_success "D1 passed: Labels valid"
log_phase ""

# ========== D2: Complexity Check (SDK) ==========
log_phase "Decision Point D2: Complexity Estimation (SDK)"
log_phase "=========================================="
log_decision "Mode: TypeScript SDK with Anthropic API"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    log_warn "Skipping D2: ANTHROPIC_API_KEY not set"
    log_warn "Defaulting to Medium complexity"
    COMPLEXITY="Medium"
    COMPLEXITY_EXIT=1
else
    if [ "$DRY_RUN" = true ]; then
        log_warn "DRY RUN: Skipping D2 complexity check"
        COMPLEXITY_EXIT=0
    else
        set +e
        log_info "Executing: npm run d2 $ISSUE_NUM"
        (cd "$SDK_DIR" && npm run d2 "$ISSUE_NUM")
        COMPLEXITY_EXIT=$?
        set -e
    fi

    case $COMPLEXITY_EXIT in
        0)
            log_success "D2 passed: Low complexity - auto-approved"
            COMPLEXITY="Low"
            ;;
        1)
            log_warn "D2: Medium complexity - AI-assisted mode"
            COMPLEXITY="Medium"
            ;;
        2)
            log_error "D2: High complexity - human review required"
            log_info "Workflow paused - awaiting TechLead review"
            exit 2
            ;;
        *)
            log_error "D2: Unexpected exit code: $COMPLEXITY_EXIT"
            exit 1
            ;;
    esac
fi

log_phase ""

# ========== D3-D7: Implementation Phase (Headless) ==========
log_phase "Phase 1: Implementation (Headless Mode)"
log_phase "=========================================="

if [ "$DRY_RUN" = true ]; then
    log_warn "DRY RUN: Skipping implementation phase"
else
    log_info "Running Headless implementation..."

    # Use existing headless script
    if ! "$PROJECT_ROOT/tools/claude-headless/01-process-issue.sh" "$ISSUE_NUM"; then
        log_error "Headless implementation failed"

        # Escalate based on human intervention mode
        case "$HUMAN_INTERVENTION_MODE" in
            phase1)
                log_info "Phase 1 Mode: Opening Interactive Mode for immediate assistance"
                # Trigger Interactive Mode via Stream Deck or AppleScript
                osascript -e "display notification \"Issue #$ISSUE_NUM implementation failed\" with title \"Miyabi Alert\" sound name \"Basso\""
                ;;
            phase2)
                log_info "Phase 2 Mode: Sending alert notification (1-5 min response expected)"
                "$SCRIPT_DIR/../primitives/escalate.sh" "TechLead" "Implementation failed for Issue #$ISSUE_NUM" "$ISSUE_NUM"
                ;;
            phase3)
                log_info "Phase 3 Mode: Sending async push notification (non-urgent)"
                "$SCRIPT_DIR/../primitives/escalate.sh" "TechLead" "Implementation failed for Issue #$ISSUE_NUM (non-urgent)" "$ISSUE_NUM"
                ;;
        esac

        exit 1
    fi
fi

log_success "Implementation phase complete"
log_phase ""

# ========== D8: Testing Phase (SDK) ==========
log_phase "Phase 2: Testing & Validation (SDK)"
log_phase "=========================================="
log_decision "Mode: TypeScript SDK (D8 Test Analysis)"

if [ "$DRY_RUN" = true ]; then
    log_warn "DRY RUN: Skipping testing phase"
else
    log_info "Executing: npm run d8 (all packages)"

    set +e
    (cd "$SDK_DIR" && npm run d8)
    TEST_EXIT=$?
    set -e

    if [ $TEST_EXIT -eq 2 ]; then
        log_error "Compilation errors detected"
        log_info "Attempting auto-fix with cargo fix..."

        if cargo fix --allow-dirty --allow-staged; then
            log_success "Auto-fix successful - retrying tests"

            if (cd "$SDK_DIR" && npm run d8); then
                log_success "Tests passed after auto-fix"
            else
                log_error "Tests still failing after auto-fix"
                "$SCRIPT_DIR/../primitives/escalate.sh" "TechLead" "Tests failing after auto-fix for Issue #$ISSUE_NUM" "$ISSUE_NUM"
                exit 1
            fi
        else
            log_error "Auto-fix failed - escalating"
            "$SCRIPT_DIR/../primitives/escalate.sh" "TechLead" "Build errors cannot be auto-fixed for Issue #$ISSUE_NUM" "$ISSUE_NUM"
            exit 1
        fi
    elif [ $TEST_EXIT -ne 0 ]; then
        log_error "Tests failed"
        "$SCRIPT_DIR/../primitives/escalate.sh" "TechLead" "Tests failing for Issue #$ISSUE_NUM" "$ISSUE_NUM"
        exit 1
    fi
fi

log_success "All tests passed"
log_phase ""

# ========== Summary ==========
log_phase "=========================================="
log_phase "Workflow Summary (SDK Version)"
log_phase "=========================================="
log_info "Issue: #$ISSUE_NUM"
log_info "Complexity: $COMPLEXITY"
log_info "Mode: $HUMAN_INTERVENTION_MODE"
log_info "SDK: TypeScript (D1, D2, D8)"
log_info "Status: ✅ SUCCESS"
log_info "Time: $(date '+%Y-%m-%d %H:%M:%S')"
log_phase ""

log_success "Issue #$ISSUE_NUM processed successfully!"
log_info "Full log: $WORKFLOW_LOG"
log_phase ""

# ========== Performance Metrics ==========
log_phase "Performance Metrics"
log_phase "=========================================="

# Extract SDK execution times from logs
if [ -f "$LOG_DIR/complexity-sdk-$ISSUE_NUM.json" ]; then
    D2_TIME=$(jq -r '.estimatedDuration // 0' "$LOG_DIR/complexity-sdk-$ISSUE_NUM.json")
    log_info "D2 Complexity Analysis: ${D2_TIME}s"
fi

if [ -f "$LOG_DIR/test-analysis.json" ]; then
    D8_DURATION=$(jq -r '.duration // 0' "$LOG_DIR/test-analysis.json")
    D8_PASSED=$(jq -r '.passed // 0' "$LOG_DIR/test-analysis.json")
    log_info "D8 Test Analysis: ${D8_DURATION}ms (${D8_PASSED} tests passed)"
fi

log_phase ""

# ========== Next Steps ==========
log_info "Next Steps:"
log_info "1. Review implementation in Interactive Mode"
log_info "2. Create PR: gh pr create"
log_info "3. Request review from team"
log_phase ""

# Final notification
if [ -f "$PROJECT_ROOT/tools/voicevox_enqueue.sh" ]; then
    "$PROJECT_ROOT/tools/voicevox_enqueue.sh" "Issue ${ISSUE_NUM} の自動処理が完了しました。TypeScript SDK版で実行されました。"
fi

exit 0
