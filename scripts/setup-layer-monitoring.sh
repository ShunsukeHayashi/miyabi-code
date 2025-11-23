#!/bin/bash
# ============================================
# Miyabi Multi-Layer Monitoring Setup
# Layer 1: Pixel | Layer 3a: MUGEN | Layer 3b: MAJIN
# ============================================

SESSION="miyabi-orchestrator"

echo "🎯 Setting up Miyabi Multi-Layer Monitoring..."

# Create new window for Layer Monitoring
tmux new-window -t $SESSION -n "layer-monitor"

# Split into 4 panes (2x2 grid)
# Layout:
# +------------------+------------------+
# |   Layer 1        |   Layer 3a       |
# |   Pixel ADB      |   MUGEN          |
# +------------------+------------------+
# |   Layer 3b       |   Aggregator     |
# |   MAJIN          |   Logs           |
# +------------------+------------------+

# First horizontal split (top/bottom)
tmux split-window -t $SESSION:layer-monitor -v

# Split top pane horizontally
tmux split-window -t $SESSION:layer-monitor.0 -h

# Split bottom pane horizontally  
tmux split-window -t $SESSION:layer-monitor.2 -h

# Configure each pane
echo "📱 Configuring Layer 1 (Pixel)..."
tmux send-keys -t $SESSION:layer-monitor.0 'echo "=== LAYER 1: Pixel 9 Pro XL ===" && adb connect 100.120.173.54:5555 && watch -n 5 "adb devices && adb shell dumpsys battery | head -10"' Enter

echo "☁️ Configuring Layer 3a (MUGEN)..."
tmux send-keys -t $SESSION:layer-monitor.1 'echo "=== LAYER 3a: MUGEN (無限) ===" && ssh mugen -t "htop"' Enter

echo "🔮 Configuring Layer 3b (MAJIN)..."
tmux send-keys -t $SESSION:layer-monitor.2 'echo "=== LAYER 3b: MAJIN (魔人) ===" && ssh majin -t "htop"' Enter

echo "📊 Configuring Log Aggregator..."
tmux send-keys -t $SESSION:layer-monitor.3 'echo "=== LOG AGGREGATOR ===" && tail -f ~/Dev/01-miyabi/_core/miyabi-private/logs/*.log 2>/dev/null || echo "Waiting for logs..."' Enter

# Select even layout
tmux select-layout -t $SESSION:layer-monitor tiled

echo ""
echo "✅ Miyabi Multi-Layer Monitoring Setup Complete!"
echo ""
echo "┌─────────────────────────────────────────────────────┐"
echo "│           MIYABI LAYER MONITORING                   │"
echo "├─────────────────────────────────────────────────────┤"
echo "│  Pane 0: 📱 Layer 1 - Pixel ADB Monitor             │"
echo "│  Pane 1: ☁️  Layer 3a - MUGEN htop                   │"
echo "│  Pane 2: 🔮 Layer 3b - MAJIN htop                   │"
echo "│  Pane 3: 📊 Log Aggregator                          │"
echo "└─────────────────────────────────────────────────────┘"
echo ""
echo "🎯 To attach: tmux attach -t $SESSION:layer-monitor"
