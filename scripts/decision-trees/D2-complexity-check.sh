#!/bin/bash
# Decision Point D2: Complexity Estimation
# Purpose: Estimate task complexity and determine if auto-processing is appropriate
# Decision: Ternary (Low → Auto / Medium → AI / High → Human)
# Mode: Headless AI Judgment
# Exit codes:
#   0 = Low complexity → Auto-approve
#   1 = Medium complexity → AI judgment required
#   2 = High complexity → Human review required

set -e

ISSUE_NUM="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/tmp/miyabi-automation"
mkdir -p "$LOG_DIR"

if [ -z "$ISSUE_NUM" ]; then
    echo "ERROR: Issue number required"
    echo "Usage: $0 <issue_number>"
    exit 3
fi

echo "====================================="
echo "Decision Point D2: Complexity Check"
echo "====================================="
echo "Issue: #$ISSUE_NUM"
echo "Mode: Headless AI Judgment"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Fetch Issue data
echo "Fetching Issue data..."
gh issue view "$ISSUE_NUM" --json title,body,labels > "$LOG_DIR/issue-$ISSUE_NUM.json"

ISSUE_TITLE=$(jq -r '.title' "$LOG_DIR/issue-$ISSUE_NUM.json")
ISSUE_BODY=$(jq -r '.body' "$LOG_DIR/issue-$ISSUE_NUM.json")
ISSUE_LABELS=$(jq -r '.labels[].name' "$LOG_DIR/issue-$ISSUE_NUM.json" | tr '\n' ',' | sed 's/,$//')

echo "Title: $ISSUE_TITLE"
echo "Labels: $ISSUE_LABELS"
echo ""

# Use Claude Code Headless Mode for complexity estimation
echo "Running AI complexity analysis..."

PROMPT="Analyze the complexity of this GitHub Issue:

**Title**: ${ISSUE_TITLE}

**Labels**: ${ISSUE_LABELS}

**Description**:
${ISSUE_BODY}

**Task**: Estimate the implementation complexity based on:
1. Number of files to modify
2. Scope of changes (isolated vs cross-cutting)
3. Testing requirements
4. External dependencies
5. Risk of breaking changes

**Output**: JSON format only
\`\`\`json
{
  \"complexity\": \"Low\" | \"Medium\" | \"High\",
  \"reasoning\": \"Brief explanation\",
  \"estimatedFiles\": <number>,
  \"estimatedDuration\": <minutes>
}
\`\`\`

**Complexity Criteria**:
- **Low**: 1-3 files, isolated changes, < 30 minutes, no external deps
- **Medium**: 4-10 files, some cross-cutting, 30-90 minutes, minor deps
- **High**: 10+ files, major refactoring, > 90 minutes, new dependencies
"

if ! claude -p "$PROMPT" \
    --output-format json \
    --allowedTools "Read,Grep,Glob" \
    > "$LOG_DIR/complexity-$ISSUE_NUM.json" 2>&1; then
    echo "ERROR: Claude Code Headless execution failed"
    cat "$LOG_DIR/complexity-$ISSUE_NUM.json"
    exit 3
fi

# Extract complexity from result
RESULT=$(jq -r '.result' "$LOG_DIR/complexity-$ISSUE_NUM.json" 2>/dev/null || echo "")

# Parse JSON from result (handle markdown code blocks)
COMPLEXITY_JSON=$(echo "$RESULT" | sed -n '/```json/,/```/p' | sed '1d;$d' | jq -r '.')

if [ -z "$COMPLEXITY_JSON" ]; then
    # Fallback: try to extract JSON directly
    COMPLEXITY_JSON=$(echo "$RESULT" | jq -r '.' 2>/dev/null || echo "{}")
fi

COMPLEXITY=$(echo "$COMPLEXITY_JSON" | jq -r '.complexity' 2>/dev/null || echo "Unknown")
REASONING=$(echo "$COMPLEXITY_JSON" | jq -r '.reasoning' 2>/dev/null || echo "N/A")
ESTIMATED_FILES=$(echo "$COMPLEXITY_JSON" | jq -r '.estimatedFiles' 2>/dev/null || echo "0")
ESTIMATED_DURATION=$(echo "$COMPLEXITY_JSON" | jq -r '.estimatedDuration' 2>/dev/null || echo "0")

echo ""
echo "====================================="
echo "Complexity Analysis Result"
echo "====================================="
echo "Complexity: $COMPLEXITY"
echo "Estimated Files: $ESTIMATED_FILES"
echo "Estimated Duration: ${ESTIMATED_DURATION} minutes"
echo ""
echo "Reasoning:"
echo "$REASONING"
echo ""

# Make decision based on complexity
case "$COMPLEXITY" in
    "Low")
        echo "✅ DECISION: LOW COMPLEXITY - Auto-approve"
        echo "→ ACTION: Continue to D3 (Task Decomposition)"
        exit 0
        ;;

    "Medium")
        echo "⚠️  DECISION: MEDIUM COMPLEXITY - AI judgment required"
        echo "→ ACTION: Proceed with AI-assisted implementation"
        exit 1
        ;;

    "High")
        echo "🚨 DECISION: HIGH COMPLEXITY - Human review required"
        echo "→ ACTION: Escalate to TechLead"
        echo ""

        "$SCRIPT_DIR/../primitives/escalate.sh" \
            "TechLead" \
            "Issue #$ISSUE_NUM requires human review. Complexity: High. Estimated: $ESTIMATED_FILES files, $ESTIMATED_DURATION minutes. Reason: $REASONING" \
            "$ISSUE_NUM"

        exit 2
        ;;

    *)
        echo "❌ ERROR: Unable to determine complexity"
        echo "→ ACTION: Escalate to TechLead (safety fallback)"

        "$SCRIPT_DIR/../primitives/escalate.sh" \
            "TechLead" \
            "Issue #$ISSUE_NUM complexity analysis failed. Manual review required." \
            "$ISSUE_NUM"

        exit 2
        ;;
esac
