#!/bin/bash
#
# Miyabi MCP Migration - Worktree Status Checker
#
# Display status of all MCP migration worktrees
#
# Usage: ./scripts/check-mcp-worktree-status.sh
#

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

WORKTREE_DIR=".worktrees"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🌳 MCP Migration Worktree Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

if [ ! -d "$WORKTREE_DIR" ]; then
    echo -e "${RED}✗${NC} Worktree directory not found: $WORKTREE_DIR"
    echo "Run ./scripts/setup-mcp-worktrees.sh first"
    exit 1
fi

# Count worktrees
TOTAL=$(find "$WORKTREE_DIR" -maxdepth 1 -type d ! -path "$WORKTREE_DIR" | wc -l | xargs)
echo -e "${CYAN}Total worktrees: $TOTAL${NC}"
echo

# Process each worktree
for wt in "$WORKTREE_DIR"/mcp-*; do
    if [ ! -d "$wt" ]; then
        continue
    fi

    name=$(basename "$wt")
    cd "$wt" || continue

    # Get branch name
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")

    # Get status
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        status="${GREEN}✅ Clean${NC}"
    else
        status="${YELLOW}🔄 Changes${NC}"
    fi

    # Get commit count ahead of main
    commits=$(git rev-list --count HEAD ^main 2>/dev/null || echo "0")

    # Get last commit
    last_commit=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commits")

    # Check if crate exists
    if [ -d "crates/miyabi-mcp-${name#mcp-}" ]; then
        crate_status="${GREEN}📦 Crate exists${NC}"
    else
        crate_status="${YELLOW}⏳ No crate yet${NC}"
    fi

    echo -e "${BLUE}[$name]${NC}"
    echo -e "  Branch:  $branch"
    echo -e "  Status:  $status"
    echo -e "  Crate:   $crate_status"
    echo -e "  Commits: $commits ahead of main"
    echo -e "  Last:    $last_commit"
    echo

    cd - > /dev/null
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Use 'git worktree list' for detailed view${NC}"
