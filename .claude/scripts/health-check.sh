#!/bin/bash
#
# Claude Code Health Check Script
# Purpose: Monitor system resources and detect potential session stability issues
# Usage: ./claude/scripts/health-check.sh
#

set -e

echo "════════════════════════════════════════════════════════════"
echo "🏥 Claude Code Health Check"
echo "════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Exit codes
EXIT_OK=0
EXIT_WARNING=1
EXIT_CRITICAL=2

exit_code=$EXIT_OK

# ============================================================
# 1. Codex Process Check
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Codex Process Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

codex_processes=$(ps aux | grep -E 'codex/codex$' | grep -v grep || true)

if [ -z "$codex_processes" ]; then
    echo -e "${GREEN}✅ No codex process running${NC}"
else
    echo -e "${RED}❌ CRITICAL: Codex process detected!${NC}"
    echo ""
    echo "Details:"
    echo "$codex_processes" | awk '{printf "  PID: %s | CPU: %s%% | MEM: %s%% | TIME: %s\n", $2, $3, $4, $10}'
    echo ""
    echo "Action required:"
    echo "  kill -9 \$(ps aux | grep -E 'codex/codex$' | grep -v grep | awk '{print \$2}')"
    exit_code=$EXIT_CRITICAL
fi

echo ""

# ============================================================
# 2. Claude Session Count
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Claude Session Count"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

claude_count=$(ps aux | grep claude | grep -v grep | wc -l | tr -d ' ')

if [ "$claude_count" -le 3 ]; then
    echo -e "${GREEN}✅ Active sessions: $claude_count (Normal)${NC}"
elif [ "$claude_count" -le 5 ]; then
    echo -e "${YELLOW}⚠️  Active sessions: $claude_count (Warning)${NC}"
    echo "  Consider closing unused sessions"
    exit_code=$EXIT_WARNING
else
    echo -e "${RED}❌ Active sessions: $claude_count (Too many!)${NC}"
    echo ""
    echo "Details:"
    ps aux | grep claude | grep -v grep | awk '{printf "  PID: %s | CPU: %s%% | TIME: %s | CMD: %s\n", $2, $3, $10, $11}'
    echo ""
    echo "Action required: Close unused Claude Code sessions"
    exit_code=$EXIT_CRITICAL
fi

echo ""

# ============================================================
# 3. System Resources
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  System Resources"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# CPU Usage
cpu_info=$(top -l 1 | grep "CPU usage")
cpu_user=$(echo "$cpu_info" | awk '{print $3}' | sed 's/%//')
cpu_sys=$(echo "$cpu_info" | awk '{print $5}' | sed 's/%//')
cpu_idle=$(echo "$cpu_info" | awk '{print $7}' | sed 's/%//')

cpu_total=$(echo "$cpu_user + $cpu_sys" | bc)

echo "CPU Usage:"
if (( $(echo "$cpu_total < 20" | bc -l) )); then
    echo -e "  ${GREEN}✅ Total: ${cpu_total}% (user: ${cpu_user}%, sys: ${cpu_sys}%, idle: ${cpu_idle}%)${NC}"
elif (( $(echo "$cpu_total < 50" | bc -l) )); then
    echo -e "  ${YELLOW}⚠️  Total: ${cpu_total}% (user: ${cpu_user}%, sys: ${cpu_sys}%, idle: ${cpu_idle}%)${NC}"
    exit_code=$EXIT_WARNING
else
    echo -e "  ${RED}❌ Total: ${cpu_total}% (user: ${cpu_user}%, sys: ${cpu_sys}%, idle: ${cpu_idle}%)${NC}"
    exit_code=$EXIT_CRITICAL
fi

echo ""

# Memory Usage
mem_info=$(top -l 1 | grep "PhysMem")
mem_unused=$(echo "$mem_info" | awk '{print $6}' | sed 's/M.*//')

echo "Memory:"
if [ "$mem_unused" -gt 1000 ]; then
    echo -e "  ${GREEN}✅ Unused: ${mem_unused}MB${NC}"
elif [ "$mem_unused" -gt 500 ]; then
    echo -e "  ${YELLOW}⚠️  Unused: ${mem_unused}MB${NC}"
    exit_code=$EXIT_WARNING
else
    echo -e "  ${RED}❌ Unused: ${mem_unused}MB (Low!)${NC}"
    exit_code=$EXIT_CRITICAL
fi

echo ""

# ============================================================
# 4. MCP Configuration
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  MCP Server Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".claude/mcp.json" ]; then
    # Check if github-enhanced, project-context, ide-integration are disabled
    github_disabled=$(jq '.mcpServers["github-enhanced"].disabled // false' .claude/mcp.json)
    project_disabled=$(jq '.mcpServers["project-context"].disabled // false' .claude/mcp.json)
    ide_disabled=$(jq '.mcpServers["ide-integration"].disabled // false' .claude/mcp.json)

    all_disabled=true

    if [ "$github_disabled" != "true" ]; then
        echo -e "${YELLOW}⚠️  github-enhanced: enabled (consider disabling)${NC}"
        all_disabled=false
        exit_code=$EXIT_WARNING
    else
        echo -e "${GREEN}✅ github-enhanced: disabled${NC}"
    fi

    if [ "$project_disabled" != "true" ]; then
        echo -e "${YELLOW}⚠️  project-context: enabled (consider disabling)${NC}"
        all_disabled=false
        exit_code=$EXIT_WARNING
    else
        echo -e "${GREEN}✅ project-context: disabled${NC}"
    fi

    if [ "$ide_disabled" != "true" ]; then
        echo -e "${YELLOW}⚠️  ide-integration: enabled (consider disabling)${NC}"
        all_disabled=false
        exit_code=$EXIT_WARNING
    else
        echo -e "${GREEN}✅ ide-integration: disabled${NC}"
    fi

    if [ "$all_disabled" = true ]; then
        echo ""
        echo -e "${GREEN}MCP configuration is optimal for session stability${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .claude/mcp.json not found${NC}"
    exit_code=$EXIT_WARNING
fi

echo ""

# ============================================================
# 5. Summary
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $exit_code -eq $EXIT_OK ]; then
    echo -e "${GREEN}✅ All checks passed! System is healthy.${NC}"
elif [ $exit_code -eq $EXIT_WARNING ]; then
    echo -e "${YELLOW}⚠️  Warning: Some issues detected. Consider optimization.${NC}"
else
    echo -e "${RED}❌ Critical: Immediate action required!${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🤖 Generated with Claude Code"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"

exit $exit_code
