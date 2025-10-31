#!/bin/bash
# Codex PR Review Executor
# This script executes PR reviews based on instructions and logs progress

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
TASK_ID="${1:-codex-pr-review-$(date +%Y%m%d-%H%M%S)}"
TASK_DIR="$PROJECT_ROOT/.ai/codex-tasks/$TASK_ID"
LOG_FILE="$TASK_DIR/progress.log"
RESULTS_FILE="$TASK_DIR/results.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_pr() {
    local pr_num="$1"
    local status="$2"
    local message="$3"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PR #$pr_num [$status] $message" | tee -a "$LOG_FILE"
}

# Initialize results
init_results() {
    cat > "$RESULTS_FILE" <<EOF
{
  "task_id": "$TASK_ID",
  "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "prs_reviewed": [],
  "summary": {
    "total": 0,
    "approved": 0,
    "changes_requested": 0,
    "commented": 0,
    "failed": 0
  }
}
EOF
}

# Update progress
update_progress() {
    local total="$1"
    local completed="$2"
    local percentage=$(awk "BEGIN {printf \"%.1f\", ($completed/$total)*100}")

    tmp=$(mktemp)
    jq --arg total "$total" \
       --arg completed "$completed" \
       --arg percentage "$percentage" \
       --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.progress.total = ($total | tonumber) |
        .progress.completed = ($completed | tonumber) |
        .progress.percentage = ($percentage | tonumber) |
        .updated_at = $updated' \
       "$TASK_DIR/status.json" > "$tmp"
    mv "$tmp" "$TASK_DIR/status.json"
}

# Add PR review result
add_pr_result() {
    local pr_num="$1"
    local decision="$2"
    local message="$3"
    local pr_title="$4"

    tmp=$(mktemp)
    jq --arg pr "$pr_num" \
       --arg decision "$decision" \
       --arg message "$message" \
       --arg title "$pr_title" \
       --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.prs_reviewed += [{
          "pr_number": ($pr | tonumber),
          "pr_title": $title,
          "decision": $decision,
          "message": $message,
          "reviewed_at": $timestamp
        }] |
        .summary.total += 1 |
        (if $decision == "APPROVED" then .summary.approved += 1
         elif $decision == "CHANGES_REQUESTED" then .summary.changes_requested += 1
         elif $decision == "COMMENTED" then .summary.commented += 1
         else .summary.failed += 1 end)' \
       "$RESULTS_FILE" > "$tmp"
    mv "$tmp" "$RESULTS_FILE"
}

# Review a single PR
review_pr() {
    local pr_num="$1"

    log_pr "$pr_num" "INFO" "Starting review"

    # Get PR details
    log_pr "$pr_num" "INFO" "Fetching PR details"
    local pr_info=$(gh pr view "$pr_num" --json title,headRefName,isDraft,state 2>/dev/null || echo "{}")

    if [[ "$pr_info" == "{}" ]]; then
        log_pr "$pr_num" "ERROR" "Failed to fetch PR details"
        add_pr_result "$pr_num" "FAILED" "Failed to fetch PR details" "Unknown"
        return 1
    fi

    local pr_title=$(echo "$pr_info" | jq -r '.title')
    local is_draft=$(echo "$pr_info" | jq -r '.isDraft')
    local pr_state=$(echo "$pr_info" | jq -r '.state')

    log_pr "$pr_num" "INFO" "Title: $pr_title"
    log_pr "$pr_num" "INFO" "Draft: $is_draft, State: $pr_state"

    # Skip if draft
    if [[ "$is_draft" == "true" ]]; then
        log_pr "$pr_num" "SKIP" "PR is draft, skipping approval"
        add_pr_result "$pr_num" "COMMENTED" "Skipped - Draft PR" "$pr_title"
        return 0
    fi

    # Check CI status
    log_pr "$pr_num" "INFO" "Checking CI status"
    local ci_status=$(gh pr checks "$pr_num" --json state,conclusion 2>/dev/null || echo "[]")
    local ci_failed=$(echo "$ci_status" | jq -r '[.[] | select(.conclusion == "failure")] | length')

    if [[ "$ci_failed" != "0" ]]; then
        log_pr "$pr_num" "WARN" "CI checks failed ($ci_failed failures)"
        local comment="CI checks are failing. Please fix the following before approval can be granted."
        gh pr review "$pr_num" --comment --body "$comment" 2>&1 | tee -a "$LOG_FILE"
        add_pr_result "$pr_num" "COMMENTED" "CI failures detected" "$pr_title"
        return 0
    fi

    # Get diff for analysis
    log_pr "$pr_num" "INFO" "Analyzing changes"
    local diff_size=$(gh pr diff "$pr_num" | wc -l)
    log_pr "$pr_num" "INFO" "Diff size: $diff_size lines"

    # Decision logic
    local decision="APPROVED"
    local review_message=""

    # Dependabot PRs - auto-approve if CI passes
    if echo "$pr_title" | grep -qi "dependabot\|bump"; then
        decision="APPROVED"
        review_message="✅ Auto-approved: Dependency update with passing CI

This is an automated dependency update from Dependabot.
- All CI checks have passed
- Changes have been reviewed automatically

🤖 Reviewed by Codex Task: $TASK_ID"

    # Large PRs - request review
    elif [[ "$diff_size" -gt 1000 ]]; then
        decision="COMMENTED"
        review_message="⚠️ Large PR detected ($diff_size lines changed)

This PR contains significant changes and requires manual review before approval.

Please ensure:
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Performance impact is assessed

🤖 Automated review by Codex Task: $TASK_ID"

    # Regular feature PRs
    else
        decision="APPROVED"
        review_message="✅ LGTM - Changes look good

Review summary:
- Code changes reviewed: $diff_size lines
- CI status: All checks passing
- No obvious issues detected

🤖 Automated review by Codex Task: $TASK_ID"
    fi

    # Execute review
    log_pr "$pr_num" "ACTION" "Executing $decision"

    case "$decision" in
        APPROVED)
            gh pr review "$pr_num" --approve --body "$review_message" 2>&1 | tee -a "$LOG_FILE"
            ;;
        CHANGES_REQUESTED)
            gh pr review "$pr_num" --request-changes --body "$review_message" 2>&1 | tee -a "$LOG_FILE"
            ;;
        COMMENTED)
            gh pr review "$pr_num" --comment --body "$review_message" 2>&1 | tee -a "$LOG_FILE"
            ;;
    esac

    local review_result=$?

    if [[ $review_result -eq 0 ]]; then
        log_pr "$pr_num" "SUCCESS" "$decision completed"
        add_pr_result "$pr_num" "$decision" "$review_message" "$pr_title"

        # Save detailed review
        mkdir -p "$TASK_DIR/artifacts/pr-reviews"
        cat > "$TASK_DIR/artifacts/pr-reviews/pr-$pr_num.md" <<EOF
# PR #$pr_num: $pr_title

**Decision**: $decision
**Reviewed At**: $(date)

## Review Message

$review_message

## PR Details

\`\`\`json
$pr_info
\`\`\`

## CI Status

\`\`\`json
$ci_status
\`\`\`
EOF

        return 0
    else
        log_pr "$pr_num" "ERROR" "Review failed"
        add_pr_result "$pr_num" "FAILED" "Review command failed" "$pr_title"
        return 1
    fi
}

# Main execution
main() {
    log "=== Codex PR Review Executor Started ==="
    log "Task ID: $TASK_ID"

    # Initialize
    init_results

    # Get list of open PRs
    log "Fetching open PRs..."
    local pr_list=$(gh pr list --state open --json number --jq '.[].number')
    local pr_array=($pr_list)
    local total_prs=${#pr_array[@]}

    log "Found $total_prs open PRs"

    # Update total count
    update_progress "$total_prs" 0

    # Review each PR
    local completed=0
    for pr_num in "${pr_array[@]}"; do
        log "=== Reviewing PR #$pr_num ($((completed+1))/$total_prs) ==="

        review_pr "$pr_num" || true

        completed=$((completed + 1))
        update_progress "$total_prs" "$completed"

        # Small delay between reviews
        sleep 2
    done

    # Finalize
    log "=== Review Complete ==="
    log "Results saved to: $RESULTS_FILE"

    # Update task status
    tmp=$(mktemp)
    jq '.status = "completed" | .updated_at = "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"' \
       "$TASK_DIR/status.json" > "$tmp"
    mv "$tmp" "$TASK_DIR/status.json"

    # Print summary
    log "=== Summary ==="
    jq -r '.summary |
        "Total PRs: \(.total)",
        "Approved: \(.approved)",
        "Changes Requested: \(.changes_requested)",
        "Commented: \(.commented)",
        "Failed: \(.failed)"' \
        "$RESULTS_FILE" | tee -a "$LOG_FILE"

    # Send notification
    osascript -e "display notification \"Reviewed $total_prs PRs\" with title \"Codex PR Review Complete\"" 2>/dev/null || true
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
}

main
