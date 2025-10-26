#!/bin/bash
# Primitive Script: Label Checker
# Purpose: Check if Issue has required Miyabi labels
# Usage: ./check-label.sh <issue_number>
# Exit codes:
#   0 = Valid labels found
#   1 = Missing required labels
#   2 = Invalid issue number

set -e

ISSUE_NUM="${1:-}"

if [ -z "$ISSUE_NUM" ]; then
    echo "ERROR: Issue number required"
    exit 2
fi

# Fetch Issue labels
if ! LABELS=$(gh issue view "$ISSUE_NUM" --json labels -q '.labels[].name' 2>/dev/null); then
    echo "ERROR: Failed to fetch Issue #$ISSUE_NUM"
    exit 2
fi

# Required label categories (at least one from each)
REQUIRED_CATEGORIES=(
    "type:*"        # type:bug, type:feature, type:chore, etc.
    "priority:*"    # priority:high, priority:medium, priority:low
)

# Check each required category
for category in "${REQUIRED_CATEGORIES[@]}"; do
    pattern="${category%%:*}"  # Extract prefix (e.g., "type")

    if ! echo "$LABELS" | grep -q "^${pattern}:"; then
        echo "INVALID: Missing required label category: ${pattern}:"
        echo "Available labels:"
        echo "$LABELS" | sed 's/^/  - /'
        exit 1
    fi
done

echo "VALID: All required labels present"
echo "Labels:"
echo "$LABELS" | sed 's/^/  - /'

# Output label data for downstream scripts
echo "$LABELS" > /tmp/miyabi-labels-${ISSUE_NUM}.txt

exit 0
