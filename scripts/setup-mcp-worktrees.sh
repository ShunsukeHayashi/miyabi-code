#!/bin/bash
#
# Miyabi MCP Migration - Worktree Setup Script
#
# This script creates 11 git worktrees for parallel MCP server migration.
# Each worktree is isolated in its own branch for conflict-free development.
#
# Usage: ./scripts/setup-mcp-worktrees.sh
#
# Prerequisites:
#   - Git 2.5+ (for worktree support)
#   - Clean working directory (no uncommitted changes)
#
# Created: 2025-11-19
# Part of: MCP Migration Master Plan
#

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKTREE_DIR=".worktrees"
BASE_BRANCH="main"

# Worktree definitions (ID, Name, Branch, Description)
declare -a WORKTREES=(
    "01|mcp-rules|feature/mcp-rules-rust|miyabi-rules-server"
    "02|mcp-context|feature/mcp-context-rust|context-engineering"
    "03|mcp-tmux|feature/mcp-tmux-rust|miyabi-tmux-server (CRITICAL)"
    "04|mcp-obsidian|feature/mcp-obsidian-rust|miyabi-obsidian-server"
    "05|mcp-pixel|feature/mcp-pixel-rust|miyabi-pixel-mcp"
    "06|mcp-sse|feature/mcp-sse-rust|miyabi-sse-gateway"
    "07|mcp-lark1|feature/mcp-lark1-rust|lark-mcp-enhanced"
    "08|mcp-lark2|feature/mcp-lark2-rust|lark-openapi-mcp-enhanced"
    "09|mcp-lark3|feature/mcp-lark3-rust|lark-wiki-mcp-agents"
    "10|mcp-miyabi|feature/mcp-miyabi-update|miyabi-mcp-server (update)"
    "11|mcp-discord|feature/mcp-discord-update|miyabi-discord-mcp-server (update)"
)

# Helper functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git is installed"

    # Check git version (need 2.5+ for worktree)
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_info "Git version: $GIT_VERSION"

    # Check if we're in a git repository
    if ! git rev-parse --is-inside-work-tree &> /dev/null; then
        print_error "Not in a git repository"
        exit 1
    fi
    print_success "Inside git repository"

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes"
        echo -e "${YELLOW}It's recommended to commit or stash changes before creating worktrees${NC}"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "No uncommitted changes"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: $CURRENT_BRANCH"

    if [ "$CURRENT_BRANCH" != "$BASE_BRANCH" ]; then
        print_warning "Not on $BASE_BRANCH branch"
        print_info "Worktrees will be created from $BASE_BRANCH"
    fi

    echo
}

# Create worktree directory
create_worktree_dir() {
    print_header "Creating Worktree Directory"

    if [ -d "$WORKTREE_DIR" ]; then
        print_warning "Worktree directory already exists: $WORKTREE_DIR"

        # Check if there are existing worktrees
        EXISTING_COUNT=$(ls -1 "$WORKTREE_DIR" 2>/dev/null | wc -l | xargs)
        if [ "$EXISTING_COUNT" -gt 0 ]; then
            print_info "Found $EXISTING_COUNT existing worktree(s)"
            read -p "Remove existing worktrees and recreate? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # Remove all worktrees
                for wt in "$WORKTREE_DIR"/*; do
                    if [ -d "$wt" ]; then
                        WT_NAME=$(basename "$wt")
                        print_info "Removing worktree: $WT_NAME"
                        git worktree remove "$wt" --force 2>/dev/null || true
                    fi
                done
                rm -rf "$WORKTREE_DIR"
                mkdir -p "$WORKTREE_DIR"
                print_success "Cleaned up and recreated worktree directory"
            else
                print_info "Keeping existing worktrees"
            fi
        fi
    else
        mkdir -p "$WORKTREE_DIR"
        print_success "Created worktree directory: $WORKTREE_DIR"
    fi

    echo
}

# Create individual worktree
create_worktree() {
    local id=$1
    local name=$2
    local branch=$3
    local description=$4
    local path="$WORKTREE_DIR/$name"

    echo -e "${BLUE}[$id]${NC} Creating: $name"
    echo -e "     Branch: $branch"
    echo -e "     Server: $description"

    # Check if worktree already exists
    if [ -d "$path" ]; then
        print_warning "Worktree already exists: $name"
        return
    fi

    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/$branch; then
        print_warning "Branch already exists: $branch"
        read -p "Use existing branch? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git worktree add "$path" "$branch"
        else
            print_error "Skipping $name"
            return
        fi
    else
        # Create new branch and worktree
        git worktree add -b "$branch" "$path" "$BASE_BRANCH"
    fi

    if [ -d "$path" ]; then
        print_success "Created worktree: $name"
    else
        print_error "Failed to create worktree: $name"
    fi

    echo
}

# Create all worktrees
create_all_worktrees() {
    print_header "Creating All Worktrees (11 total)"

    local count=0
    for worktree in "${WORKTREES[@]}"; do
        IFS='|' read -r id name branch description <<< "$worktree"
        create_worktree "$id" "$name" "$branch" "$description"
        ((count++))
    done

    print_success "Processed $count worktrees"
    echo
}

# Display worktree summary
display_summary() {
    print_header "Worktree Summary"

    echo -e "${BLUE}Created worktrees:${NC}"
    git worktree list

    echo
    echo -e "${GREEN}✓ Setup complete!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Assign each worktree to an agent"
    echo "  2. Each agent: cd .worktrees/mcp-<name>"
    echo "  3. Follow the Quick Start Guide: docs/MCP_MIGRATION_QUICK_START.md"
    echo
    echo -e "${BLUE}Check status:${NC}"
    echo "  ./scripts/check-mcp-worktree-status.sh"
    echo
}

# Main execution
main() {
    print_header "Miyabi MCP Migration - Worktree Setup"
    echo -e "${BLUE}This script will create 11 git worktrees for parallel development${NC}"
    echo

    check_prerequisites
    create_worktree_dir
    create_all_worktrees
    display_summary
}

# Run main function
main
