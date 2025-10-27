#!/bin/bash
# Create Test Issue for Miyabi Autonomous Workflow
# Version: 1.0.0
# Description: Creates a small complexity test Issue to validate the autonomous workflow

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Miyabi Autonomous Workflow - Test Issue Creator${NC}"
echo "======================================================"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) is not installed${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Repository info
REPO="customer-cloud/miyabi-private"
echo -e "${GREEN}✅ Repository: $REPO${NC}"
echo ""

# Test Issue details
TITLE="test: Small complexity test for autonomous workflow validation"

BODY=$(cat <<'EOF'
## 🎯 Test Description

This is a **small complexity test** (target: < 3.0) for validating the complete Miyabi autonomous workflow from Issue creation to PR auto-merge.

## 📋 Expected Behavior

### Phase Execution Targets
- **Complexity Score**: < 3.0 (auto-approved)
- **Total Time**: < 45 minutes (Issue → PR merge)
- **Auto-Merge**: Enabled (no human intervention)

### Phase Timeline

| Phase | Target Time | Description |
|-------|-------------|-------------|
| Phase 1 | < 2 min | Issue Analysis & Auto-Label |
| Phase 2 | < 5 min | Task Decomposition & DAG |
| Phase 3 | < 2 min | Worktree Creation |
| Phase 4 | < 10 min | Claude Code Execution (5-Worlds) |
| Phase 6 | < 3 min | Quality Check & Auto-Fix |
| Phase 7 | < 1 min | PR Creation |
| Phase 8 | < 5 min | Code Review |
| Phase 9 | < 3 min | Auto-Merge & Deployment |

**Total Target**: < 31 minutes (with buffer: 45 minutes)

## ✅ Test Checklist

- [ ] **Phase 1**: Issue Analysis complete, labels applied
- [ ] **Phase 2**: Tasks decomposed, DAG created
- [ ] **Phase 3**: Worktree created successfully
- [ ] **Phase 4**: Code generated via Claude Code
- [ ] **Phase 6**: Quality check passed (score >= 80)
- [ ] **Phase 7**: PR created with Conventional Commits format
- [ ] **Phase 8**: Code review complete (score >= 80)
- [ ] **Phase 9**: PR auto-merged successfully

## 📊 Performance Metrics

**Start Time**: (Webhook received timestamp)
**End Time**: (PR merged timestamp)
**Total Duration**: (calculated)

## 🔍 Test Task

**Objective**: Add a simple utility function to demonstrate workflow

**Requirements**:
1. Create a new file: `crates/miyabi-core/src/utils/test_helper.rs`
2. Implement a simple function:
   ```rust
   /// Test helper function to validate workflow
   pub fn generate_test_message(prefix: &str) -> String {
       format!("{}: Miyabi autonomous workflow test", prefix)
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_generate_test_message() {
           let msg = generate_test_message("INFO");
           assert!(msg.contains("INFO"));
           assert!(msg.contains("Miyabi"));
       }
   }
   ```
3. Export the module in `crates/miyabi-core/src/utils/mod.rs`
4. All tests must pass
5. Code must pass clippy and fmt checks

## 🎯 Success Criteria

1. ✅ **Complexity < 3.0**: Auto-approved without human intervention
2. ✅ **All phases complete**: Phase 1-9 executed successfully
3. ✅ **Time < 45 min**: Total duration from webhook to PR merge
4. ✅ **Quality >= 80**: Both quality check and code review scores
5. ✅ **Auto-merge**: PR merged automatically without human approval
6. ✅ **Tests pass**: All cargo tests pass (100%)

## 📝 Notes

- This is an automated test Issue for production validation
- Expected workflow: **fully autonomous** (no human intervention)
- Monitor logs: `tail -f logs/miyabi-orchestrator.log`
- Webhook events: All 18+ event types should trigger correctly

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)

LABELS="test,complexity:low,priority:P3,type:enhancement"

echo -e "${YELLOW}Creating test Issue...${NC}"
echo ""
echo "Title: $TITLE"
echo "Labels: $LABELS"
echo ""

# Create the Issue
ISSUE_URL=$(gh issue create \
    --repo "$REPO" \
    --title "$TITLE" \
    --body "$BODY" \
    --label "$LABELS")

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Test Issue created successfully!${NC}"
    echo ""
    echo -e "${BLUE}Issue URL:${NC} $ISSUE_URL"
    echo ""

    # Extract Issue number
    ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
    echo -e "${YELLOW}📋 Issue #$ISSUE_NUMBER${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Monitor webhook delivery in GitHub Settings → Webhooks"
    echo "2. Watch logs: tail -f logs/miyabi-orchestrator.log"
    echo "3. Track progress: gh issue view $ISSUE_NUMBER"
    echo "4. Check PR creation: gh pr list --state open"
    echo ""
    echo "Expected timeline: ~31-45 minutes for full workflow"
else
    echo -e "${RED}❌ Failed to create test Issue${NC}"
    exit 1
fi
