#!/bin/bash
# Decision Point D1: Label Validation
# Purpose: Check if Issue has valid Miyabi labels (type:*, priority:*)
# Decision: Binary (Pass/Fail)
# Mode: Script (Confirmed Process)
# Exit codes:
#   0 = Valid labels → Continue automation
#   1 = Invalid labels → Escalate to human

set -e

ISSUE_NUM="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$ISSUE_NUM" ]; then
    echo "ERROR: Issue number required"
    echo "Usage: $0 <issue_number>"
    exit 2
fi

echo "====================================="
echo "Decision Point D1: Label Validation"
echo "====================================="
echo "Issue: #$ISSUE_NUM"
echo "Mode: Script (Confirmed Process)"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Execute primitive: check-label.sh
if "$SCRIPT_DIR/../primitives/check-label.sh" "$ISSUE_NUM"; then
    echo ""
    echo "✅ DECISION: PASS - Labels are valid"
    echo "→ ACTION: Continue to D2 (Complexity Check)"
    exit 0
else
    echo ""
    echo "❌ DECISION: FAIL - Invalid or missing labels"
    echo "→ ACTION: Escalate to ProductOwner"
    echo ""

    # Escalate to Product Owner
    "$SCRIPT_DIR/../primitives/escalate.sh" \
        "PO" \
        "Issue #$ISSUE_NUM has invalid or missing labels. Please add required labels: type:*, priority:*" \
        "$ISSUE_NUM"

    exit 1
fi
