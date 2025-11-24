#!/bin/bash
# Setup script for Layer 1 direct tmux integration
# Run on: Mac Local

set -e

echo "🚀 Setting up Layer 1 → tmux direct integration..."

# Configuration
TMUX_SESSION="miyabi-orchestrator"
WINDOW_NAME="agent"
MIYABI_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"

# 1. Create new window for Claude Code Agent
echo "📺 Creating tmux window for Claude Code Agent..."
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    # Check if window exists
    if ! tmux list-windows -t "$TMUX_SESSION" | grep -q "$WINDOW_NAME"; then
        tmux new-window -t "$TMUX_SESSION" -n "$WINDOW_NAME" -c "$MIYABI_DIR"
        echo "   ✅ Created window: $WINDOW_NAME"
    else
        echo "   ℹ️  Window $WINDOW_NAME already exists"
    fi
else
    echo "   ❌ Session $TMUX_SESSION not found"
    exit 1
fi

# 2. Get pane ID
PANE_ID=$(tmux list-panes -t "$TMUX_SESSION:$WINDOW_NAME" -F '#{pane_id}' | head -1)
echo "   📍 Pane ID: $PANE_ID"

# 3. Set up the pane with initial prompt
echo "🤖 Setting up Claude Code Agent pane..."
tmux send-keys -t "$TMUX_SESSION:$WINDOW_NAME" "cd $MIYABI_DIR && clear" Enter
sleep 0.5
tmux send-keys -t "$TMUX_SESSION:$WINDOW_NAME" 'echo "🤖 Claude Code Agent - Layer 1 Integration Ready"' Enter
tmux send-keys -t "$TMUX_SESSION:$WINDOW_NAME" 'echo "📍 Pane: '$PANE_ID'"' Enter
tmux send-keys -t "$TMUX_SESSION:$WINDOW_NAME" 'echo "⏰ $(date)"' Enter
tmux send-keys -t "$TMUX_SESSION:$WINDOW_NAME" 'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' Enter

# 4. Save pane ID for reference
echo "$PANE_ID" > "$MIYABI_DIR/.miyabi/config/agent-pane-id"
echo "   💾 Saved pane ID to .miyabi/config/agent-pane-id"

# 5. Update layer1-integration.json with pane ID
if command -v jq &> /dev/null; then
    jq --arg pane "$PANE_ID" '.tmux.agentPane = $pane' \
        "$MIYABI_DIR/.miyabi/config/layer1-integration.json" > /tmp/layer1-temp.json && \
        mv /tmp/layer1-temp.json "$MIYABI_DIR/.miyabi/config/layer1-integration.json"
    echo "   📝 Updated layer1-integration.json"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy lark-event-handler.js to MAJIN"
echo "   2. Configure SSH from MAJIN to Mac Local"
echo "   3. Restart miyabi-lark-events.service on MAJIN"
echo ""
echo "📡 Test command from Lark:"
echo "   Send '状態' to Miyabi Dev Team group"
