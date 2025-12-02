#!/bin/bash
# AntiGravity Miyabi - Quick Start Script
# Usage: source scripts/miyabi-init.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project Root
MIYABI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export MIYABI_ROOT

echo -e "${BLUE}🚀 AntiGravity Miyabi Edition - Initializing...${NC}"
echo ""

# ===== Environment Variables =====
export MIYABI_ENV=${MIYABI_ENV:-development}
export MIYABI_LOG_LEVEL=${MIYABI_LOG_LEVEL:-info}

# ===== Aliases =====
echo -e "${YELLOW}📝 Setting up aliases...${NC}"

# Git aliases
alias gs='git status'
alias gl='git log --oneline -20'
alias gd='git diff'
alias gb='git branch'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gp='git pull'
alias gpu='git push'
alias gc='git commit'

# Miyabi aliases
alias mi='miyabi issue'
alias mp='miyabi pr'
alias ma='miyabi agent'
alias mg='miyabi git'
alias mb='cargo build --release'
alias mt='cargo test'
alias mc='cargo clippy && cargo fmt --check'

# Directory aliases
alias proj='cd $MIYABI_ROOT'
alias crates='cd $MIYABI_ROOT/crates'
alias mcp='cd $MIYABI_ROOT/mcp-servers'
alias docs='cd $MIYABI_ROOT/docs'

# ===== Functions =====

# Create feature branch
feature() {
    if [ -z "$1" ]; then
        echo "Usage: feature <issue-number> [description]"
        return 1
    fi
    local branch="feature/issue-$1${2:+-$2}"
    git checkout -b "$branch"
    echo -e "${GREEN}✅ Created branch: $branch${NC}"
}

# Create fix branch
fix() {
    if [ -z "$1" ]; then
        echo "Usage: fix <issue-number> [description]"
        return 1
    fi
    local branch="fix/issue-$1${2:+-$2}"
    git checkout -b "$branch"
    echo -e "${GREEN}✅ Created branch: $branch${NC}"
}

# Quick commit
qc() {
    if [ -z "$1" ]; then
        echo "Usage: qc <message>"
        return 1
    fi
    git add .
    git commit -m "$1"
    echo -e "${GREEN}✅ Committed: $1${NC}"
}

# Build and test
bt() {
    echo -e "${YELLOW}🔨 Building...${NC}"
    cargo build --release
    echo -e "${YELLOW}🧪 Testing...${NC}"
    cargo test
    echo -e "${GREEN}✅ Build and test complete!${NC}"
}

# Show project status
status() {
    echo -e "${BLUE}📊 Project Status${NC}"
    echo "========================"
    echo -e "Branch: ${GREEN}$(git branch --show-current)${NC}"
    echo -e "Environment: ${YELLOW}$MIYABI_ENV${NC}"
    echo ""
    echo -e "${YELLOW}Modified files:${NC}"
    git status -s
}

# ===== Completion Message =====
echo ""
echo -e "${GREEN}✅ Miyabi initialized!${NC}"
echo ""
echo -e "Available commands:"
echo -e "  ${BLUE}feature <issue> [desc]${NC} - Create feature branch"
echo -e "  ${BLUE}fix <issue> [desc]${NC}     - Create fix branch"
echo -e "  ${BLUE}qc <message>${NC}           - Quick commit"
echo -e "  ${BLUE}bt${NC}                     - Build and test"
echo -e "  ${BLUE}status${NC}                 - Show project status"
echo ""
echo -e "  ${YELLOW}mi${NC} - Issue commands"
echo -e "  ${YELLOW}mp${NC} - PR commands"
echo -e "  ${YELLOW}ma${NC} - Agent commands"
echo ""

# Move to project root
cd "$MIYABI_ROOT"
