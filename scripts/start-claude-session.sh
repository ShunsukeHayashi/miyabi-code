#!/bin/bash
# Miyabi Private - Claude Code Session Starter
# Usage: ./start-claude-session.sh

set -e

MIYABI_PRIVATE="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
SESSION_CONTEXT="$MIYABI_PRIVATE/.claude/context/SESSION_CONTEXT.md"

echo "🚀 Starting Miyabi Private Claude Code Session..."
echo ""

# Check if in correct directory
if [ "$(pwd)" != "$MIYABI_PRIVATE" ]; then
    echo "📂 Changing to miyabi-private directory..."
    cd "$MIYABI_PRIVATE"
fi

# Check context file exists
if [ -f "$SESSION_CONTEXT" ]; then
    echo "✅ Session context found: $SESSION_CONTEXT"
else
    echo "⚠️  Session context not found. Creating placeholder..."
    mkdir -p "$(dirname "$SESSION_CONTEXT")"
    echo "# Session Context - Placeholder" > "$SESSION_CONTEXT"
fi

# Display current status
echo ""
echo "📊 Current Status:"
echo "   Directory: $(pwd)"
echo "   Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "   Skills: $(ls -d .claude/Skills/*/ 2>/dev/null | wc -l | tr -d ' ') directories"
echo ""

# Launch Claude Code
echo "🤖 Launching Claude Code (--dangerously-skip-permissions)..."
echo ""
echo "💡 Initial prompt suggestion:"
echo '   "Read .claude/context/SESSION_CONTEXT.md and continue from the shared context"'
echo ""

# Run Claude Code
claude --dangerously-skip-permissions
