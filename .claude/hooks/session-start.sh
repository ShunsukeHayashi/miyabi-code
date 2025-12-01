#!/bin/bash
# ============================================================================
# Miyabi - Session Start Setup Script
# ============================================================================
# Purpose: Initialize Claude Code environment on session start
# Trigger: SessionStart hook (Claude Code Web / Desktop)
# Exit Codes: 0 (success), 1 (critical failure)
# ============================================================================
#
# Usage in settings.json:
# {
#   "hooks": {
#     "SessionStart": [".claude/hooks/session-start.sh"]
#   }
# }
# ============================================================================

# Don't exit on error - we want to complete all checks
# set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root detection
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="${PROJECT_DIR}/.ai/logs"
LOG_FILE="${LOG_DIR}/session-start.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level=$1
    local msg=$2
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $msg" | tee -a "$LOG_FILE"
}

# Header
echo ""
echo "=============================================="
echo "  🌸 Miyabi Session Start"
echo "  $(date +'%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

log "INFO" "Starting session initialization..."

# ============================================================================
# 1. Environment Validation
# ============================================================================
echo -e "${BLUE}[1/5] Validating Environment${NC}"

ERRORS=0
WARNINGS=0

# Check GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "  ${YELLOW}⚠️  GITHUB_TOKEN not set${NC}"
    log "WARN" "GITHUB_TOKEN not set"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "  ${GREEN}✅ GITHUB_TOKEN set${NC}"
fi

# Check ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "  ${YELLOW}⚠️  ANTHROPIC_API_KEY not set${NC}"
    log "WARN" "ANTHROPIC_API_KEY not set"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "  ${GREEN}✅ ANTHROPIC_API_KEY set${NC}"
fi

# Check optional API keys
for key in GEMINI_API_KEY OPENAI_API_KEY GROQ_API_KEY; do
    if [ -n "${!key}" ]; then
        echo -e "  ${GREEN}✅ $key set${NC}"
    fi
done

# ============================================================================
# 2. Tool Verification
# ============================================================================
echo ""
echo -e "${BLUE}[2/5] Verifying Tools${NC}"

# Rust toolchain
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✅ Rust: $RUST_VERSION${NC}"
else
    echo -e "  ${YELLOW}⚠️  Rust not installed${NC}"
    log "WARN" "Rust not installed"
    WARNINGS=$((WARNINGS + 1))
fi

# Cargo
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✅ Cargo: $CARGO_VERSION${NC}"
else
    echo -e "  ${YELLOW}⚠️  Cargo not available${NC}"
    log "WARN" "Cargo not available"
    WARNINGS=$((WARNINGS + 1))
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✅ Git: $GIT_VERSION${NC}"
else
    echo -e "  ${RED}❌ Git not installed (critical)${NC}"
    log "ERROR" "Git not installed"
    ERRORS=$((ERRORS + 1))
fi

# Node.js (optional)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✅ Node.js: $NODE_VERSION${NC}"
fi

# ============================================================================
# 3. Project Structure Verification
# ============================================================================
echo ""
echo -e "${BLUE}[3/5] Verifying Project Structure${NC}"

cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "  ${RED}❌ Cannot access project directory: $PROJECT_DIR${NC}"
    log "ERROR" "Cannot access project directory"
    exit 1
}

echo -e "  ${GREEN}✅ Project: $PROJECT_DIR${NC}"

# Check Cargo.toml
if [ -f "Cargo.toml" ]; then
    CRATE_COUNT=$(ls -d crates/*/ 2>/dev/null | wc -l || echo "0")
    echo -e "  ${GREEN}✅ Rust workspace with $CRATE_COUNT crates${NC}"
else
    echo -e "  ${YELLOW}⚠️  Cargo.toml not found${NC}"
fi

# Check .claude directory
if [ -d ".claude" ]; then
    HOOK_COUNT=$(ls .claude/hooks/*.sh 2>/dev/null | wc -l || echo "0")
    echo -e "  ${GREEN}✅ .claude directory ($HOOK_COUNT hooks)${NC}"
else
    echo -e "  ${YELLOW}⚠️  .claude directory not found${NC}"
fi

# Check MCP configuration
if [ -f ".claude/mcp.json" ]; then
    MCP_COUNT=$(grep -c '"command"' .claude/mcp.json 2>/dev/null || echo "0")
    echo -e "  ${GREEN}✅ MCP config ($MCP_COUNT servers)${NC}"
fi

# ============================================================================
# 4. Git Status
# ============================================================================
echo ""
echo -e "${BLUE}[4/5] Git Status${NC}"

if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✅ Branch: $BRANCH${NC}"

    # Check for uncommitted changes
    if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
        echo -e "  ${GREEN}✅ Working tree clean${NC}"
    else
        CHANGES=$(git status --porcelain 2>/dev/null | wc -l || echo "0")
        echo -e "  ${YELLOW}⚠️  $CHANGES uncommitted change(s)${NC}"
    fi

    # Last commit
    LAST_COMMIT=$(git log -1 --format='%h %s' 2>/dev/null | head -c 60 || echo "none")
    echo -e "  ${GREEN}✅ Last: $LAST_COMMIT${NC}"
else
    echo -e "  ${YELLOW}⚠️  Not a git repository${NC}"
fi

# ============================================================================
# 5. Quick Health Check (Skip heavy operations for fast startup)
# ============================================================================
echo ""
echo -e "${BLUE}[5/5] Quick Health Check${NC}"

# Skip cargo check by default (too slow for session start)
# Use 'make quick' manually for full validation
if [ -f "Cargo.toml" ] && command -v cargo &> /dev/null; then
    echo -e "  ${GREEN}✅ Cargo.toml found - use 'make quick' for full check${NC}"
fi

# Check disk space
DISK_FREE=$(df -h . 2>/dev/null | awk 'NR==2 {print $4}' || echo "unknown")
echo -e "  ${GREEN}✅ Disk available: $DISK_FREE${NC}"

# Check memory (if available)
if command -v free &> /dev/null; then
    MEM_FREE=$(free -h 2>/dev/null | awk '/^Mem:/ {print $7}' || echo "unknown")
    echo -e "  ${GREEN}✅ Memory available: $MEM_FREE${NC}"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=============================================="
echo "  📊 Session Start Summary"
echo "=============================================="
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "  ${RED}❌ Errors: $ERRORS${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "  ${GREEN}✅ All checks passed!${NC}"
fi

echo ""
echo "  🚀 Ready to develop!"
echo ""

log "INFO" "Session initialization complete (errors=$ERRORS, warnings=$WARNINGS)"

# Exit with error only if critical failures
if [ $ERRORS -gt 0 ]; then
    exit 1
fi

exit 0
