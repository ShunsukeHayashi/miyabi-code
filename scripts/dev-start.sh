#!/bin/bash
#==============================================================================
# Miyabi App Development Server Starter
# 全てのMiyabiアプリケーションを開発モードで起動
#==============================================================================

set -e

MIYABI_ROOT="${MIYABI_ROOT:-/home/ubuntu/miyabi-private}"

echo "🚀 Miyabi Development Server Launcher"
echo "======================================"
echo ""

# Ensure tmux is available
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Please install tmux first."
    exit 1
fi

# Create or attach to miyabi-dev session
SESSION="miyabi-dev"

# Kill existing session if exists
tmux kill-session -t $SESSION 2>/dev/null || true

echo "📺 Creating tmux session: $SESSION"

# Create new session with first window for console
tmux new-session -d -s $SESSION -n console -c "$MIYABI_ROOT/crates/miyabi-console"

# Window 0: miyabi-console (Vite)
echo "🖥️  Starting miyabi-console (Vite)..."
tmux send-keys -t $SESSION:console "cd $MIYABI_ROOT/crates/miyabi-console && npm install && npm run dev" Enter

# Window 1: miyabi-dashboard (Next.js) - if exists
if [ -f "$MIYABI_ROOT/package.json" ]; then
    echo "📊 Starting miyabi-dashboard (Next.js)..."
    tmux new-window -t $SESSION -n dashboard -c "$MIYABI_ROOT"
    tmux send-keys -t $SESSION:dashboard "npm install && npm run dev" Enter
fi

# Window 2: MCP Server (optional)
echo "🔌 Creating MCP server window..."
tmux new-window -t $SESSION -n mcp -c "$MIYABI_ROOT"
tmux send-keys -t $SESSION:mcp "# MCP Server - run: ./target/release/miyabi-mcp-server" Enter

# Window 3: Logs
echo "📋 Creating logs window..."
tmux new-window -t $SESSION -n logs -c "$MIYABI_ROOT"
tmux send-keys -t $SESSION:logs "tail -f logs/*.log 2>/dev/null || echo 'Waiting for logs...'" Enter

echo ""
echo "✅ Development servers starting!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Access Points:"
echo "   • miyabi-console: http://localhost:5173"
echo "   • miyabi-dashboard: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 tmux Commands:"
echo "   • Attach: tmux attach -t $SESSION"
echo "   • List windows: Ctrl+b w"
echo "   • Switch window: Ctrl+b [0-3]"
echo "   • Detach: Ctrl+b d"
echo ""

# Optionally attach
if [ "${1:-}" = "--attach" ] || [ "${1:-}" = "-a" ]; then
    tmux attach -t $SESSION
fi
