#!/bin/bash
# Miyabi Agent Monitor - CLI Dashboard

echo "🤖 Miyabi Agent Monitor"
echo "======================="
echo ""

# Agent Logs
echo "📋 Recent Agent Activity:"
echo "------------------------"
if [ -f .ai/logs/$(date +%Y-%m-%d).md ]; then
  tail -30 .ai/logs/$(date +%Y-%m-%d).md | grep -E "(Agent|Task|Issue|Status)" | tail -10
else
  echo "No logs for today"
fi
echo ""

# Worktrees
echo "🔄 Active Worktrees:"
echo "-------------------"
git worktree list 2>/dev/null | grep -v "bare" || echo "No active worktrees"
echo ""

# Recent Issues
echo "📌 Recent Issues (GitHub):"
echo "-------------------------"
gh issue list --limit 5 2>/dev/null || echo "GitHub CLI not configured"
echo ""

# System Status
echo "💻 System Status:"
echo "----------------"
echo "Rust: $(rustc --version 2>/dev/null || echo 'Not installed')"
echo "Cargo: $(cargo --version 2>/dev/null || echo 'Not installed')"
echo ""

# Quick Actions
echo "🚀 Quick Actions:"
echo "----------------"
echo "  cargo run --bin miyabi -- agent run coordinator --issue <N>"
echo "  cargo run --bin miyabi -- agent stats"
echo "  tail -f .ai/logs/\$(date +%Y-%m-%d).md"
echo ""

# Entity-Relation Graph
echo "🌐 Web Dashboard:"
echo "----------------"
if lsof -i :8081 > /dev/null 2>&1; then
  echo "  ✅ Entity-Relation Graph: http://localhost:8081/entity-graph.html"
else
  echo "  ❌ Entity-Relation Graph not running"
  echo "     Start: cd public && python3 -m http.server 8081 &"
fi
echo ""
