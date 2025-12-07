#!/bin/bash

# 🚀 Maximum Capacity Parallel Execution Script
# Version: 1.0.0
# Date: 2025-12-07
# Purpose: Launch maximum parallel Claude Code + Codex sessions

set -euo pipefail

echo "🚀 Starting Maximum Capacity Parallel Execution"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_SETTINGS="${PROJECT_ROOT}/.claude/settings.json"

echo -e "${BLUE}Project Root: ${PROJECT_ROOT}${NC}"
echo -e "${BLUE}Claude Settings: ${CLAUDE_SETTINGS}${NC}"

# Function to check SSH connectivity
check_ssh() {
    local machine=$1
    echo -e "${YELLOW}Checking SSH connectivity to ${machine}...${NC}"
    if ssh -o ConnectTimeout=5 ${machine} 'echo "Connected"' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ ${machine} is reachable${NC}"
        return 0
    else
        echo -e "${RED}❌ ${machine} is not reachable${NC}"
        return 1
    fi
}

# Function to launch MUGEN sessions (4 Claude + 2 Codex)
launch_mugen_sessions() {
    echo -e "${BLUE}🔥 Launching MUGEN (無限) Sessions...${NC}"

    # Claude Sessions
    echo -e "${YELLOW}Starting Claude sessions on MUGEN...${NC}"

    # Session 1: Heavy Build & Test
    ssh mugen "tmux new-session -d -s claude-build-test 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Session 2: Performance & Benchmark
    ssh mugen "tmux new-session -d -s claude-perf-bench 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Session 3: AI Processing & Analysis
    ssh mugen "tmux new-session -d -s claude-ai-analysis 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Session 4: Code Generation & Refactoring
    ssh mugen "tmux new-session -d -s claude-codegen 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Codex Sessions
    echo -e "${YELLOW}Starting Codex sessions on MUGEN...${NC}"

    # Codex Session 1: Documentation Generation
    ssh mugen "tmux new-session -d -s codex-docs 'cd ~/miyabi-private && echo \"Codex Documentation Session Ready\"'" || echo "Session already exists"

    # Codex Session 2: Test Generation
    ssh mugen "tmux new-session -d -s codex-tests 'cd ~/miyabi-private && echo \"Codex Test Generation Session Ready\"'" || echo "Session already exists"

    echo -e "${GREEN}✅ MUGEN sessions launched (6 total)${NC}"
}

# Function to launch MAJIN sessions (3 Claude + 2 Codex)
launch_majin_sessions() {
    echo -e "${BLUE}⚡ Launching MAJIN (魔神) Sessions...${NC}"

    # Claude Sessions
    echo -e "${YELLOW}Starting Claude sessions on MAJIN...${NC}"

    # Session 1: Code Review & Quality
    ssh majin "tmux new-session -d -s claude-review 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Session 2: Documentation & Writing
    ssh majin "tmux new-session -d -s claude-docs 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Session 3: Feature Development
    ssh majin "tmux new-session -d -s claude-feature 'cd ~/miyabi-private && claude --settings .claude/settings.json'" || echo "Session already exists"

    # Codex Sessions
    echo -e "${YELLOW}Starting Codex sessions on MAJIN...${NC}"

    # Codex Session 1: API Documentation
    ssh majin "tmux new-session -d -s codex-api-docs 'cd ~/miyabi-private && echo \"Codex API Documentation Session Ready\"'" || echo "Session already exists"

    # Codex Session 2: Configuration & Setup
    ssh majin "tmux new-session -d -s codex-config 'cd ~/miyabi-private && echo \"Codex Configuration Session Ready\"'" || echo "Session already exists"

    echo -e "${GREEN}✅ MAJIN sessions launched (5 total)${NC}"
}

# Function to launch local Codex session
launch_local_codex() {
    echo -e "${BLUE}💻 Launching Local Codex Session...${NC}"

    # Create new tmux session for local Codex control
    tmux new-session -d -s codex-controller "cd ${PROJECT_ROOT} && echo 'Local Codex Controller Session Ready. Use: codex exec --prompt \"your task\"'"

    echo -e "${GREEN}✅ Local Codex controller session created${NC}"
}

# Function to show status
show_session_status() {
    echo -e "${BLUE}📊 Session Status Summary${NC}"
    echo "=========================="

    echo -e "${YELLOW}Local (miyabi-oss + codex-controller):${NC}"
    tmux list-sessions | grep -E "(miyabi-oss|codex-controller)" || echo "No local sessions"

    echo -e "${YELLOW}MUGEN Sessions:${NC}"
    ssh mugen 'tmux list-sessions 2>/dev/null' || echo "No MUGEN sessions"

    echo -e "${YELLOW}MAJIN Sessions:${NC}"
    ssh majin 'tmux list-sessions 2>/dev/null' || echo "No MAJIN sessions"

    echo ""
    echo -e "${GREEN}🎯 Total Parallel Capacity: 17+ Sessions${NC}"
    echo -e "${GREEN}   • Local: miyabi-oss (10 windows) + codex-controller (1)${NC}"
    echo -e "${GREEN}   • MUGEN: Claude (4) + Codex (2)${NC}"
    echo -e "${GREEN}   • MAJIN: Claude (3) + Codex (2)${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting maximum capacity parallel execution setup...${NC}"

    # Check SSH connectivity
    if ! check_ssh mugen; then
        echo -e "${RED}Cannot connect to MUGEN. Please check SSH configuration.${NC}"
        exit 1
    fi

    if ! check_ssh majin; then
        echo -e "${RED}Cannot connect to MAJIN. Please check SSH configuration.${NC}"
        exit 1
    fi

    # Launch sessions
    launch_mugen_sessions
    launch_majin_sessions
    launch_local_codex

    # Show status
    echo ""
    show_session_status

    echo ""
    echo -e "${GREEN}🚀 Maximum capacity parallel execution environment is ready!${NC}"
    echo ""
    echo -e "${YELLOW}Quick Usage:${NC}"
    echo "• Connect to MUGEN Claude: ssh mugen -t tmux attach -t claude-build-test"
    echo "• Connect to MAJIN Claude: ssh majin -t tmux attach -t claude-review"
    echo "• Local Codex: tmux attach -t codex-controller"
    echo "• Check status: $0 status"
}

# Handle arguments
case "${1:-main}" in
    "status")
        show_session_status
        ;;
    "cleanup")
        echo -e "${RED}Cleaning up all remote sessions...${NC}"
        ssh mugen 'tmux kill-server 2>/dev/null || echo "No sessions to kill"'
        ssh majin 'tmux kill-server 2>/dev/null || echo "No sessions to kill"'
        tmux kill-session -t codex-controller 2>/dev/null || echo "No local codex session to kill"
        echo -e "${GREEN}Cleanup completed${NC}"
        ;;
    "main"|*)
        main
        ;;
esac