#!/bin/bash
# 全セッション状態レポート

echo "# 🎯 Miyabi System Full Status Report"
echo "Generated: $(date)"
echo ""

echo "## 📊 tmux Sessions Overview"
echo ""
echo "| Session | Windows | Status |"
echo "|---------|---------|--------|"
tmux list-sessions 2>/dev/null | while read line; do
    SESSION=$(echo "$line" | cut -d: -f1)
    WINDOWS=$(echo "$line" | grep -o "[0-9]* windows" | cut -d' ' -f1)
    ATTACHED=$(echo "$line" | grep -c "attached")
    if [ "$ATTACHED" -gt 0 ]; then
        STATUS="🟢 Attached"
    else
        STATUS="🔵 Running"
    fi
    echo "| $SESSION | $WINDOWS | $STATUS |"
done

echo ""
echo "## 👑 Coordinators (Claude Code)"
echo ""
for session in orchestra-conductor orchestra-hub; do
    echo "### $session"
    echo '```'
    tmux capture-pane -t "$session" -p 2>/dev/null | tail -15
    echo '```'
    echo ""
done

echo "## 🎭 Orchestra Squads"
echo ""
for i in 1 2 3 4 5; do
    echo "### Squad-$i"
    echo '```'
    tmux capture-pane -t "orchestra-squad-$i" -p 2>/dev/null | tail -10
    echo '```'
    echo ""
done

echo "## 🤖 Agent Directories"
echo ""
echo "Total: $(ls -d /home/agent-* 2>/dev/null | wc -l)/100"
echo ""

echo "## 🔧 Codex Workers"
echo ""
CODEX_COUNT=$(tmux list-sessions 2>/dev/null | grep -c "codex-worker")
echo "Running: $CODEX_COUNT/100"
echo ""

echo "## 📡 MCP Servers"
echo '```'
cd /home/ubuntu/miyabi-private && claude mcp list 2>/dev/null | head -20
echo '```'
