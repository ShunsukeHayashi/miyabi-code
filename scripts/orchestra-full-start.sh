#!/bin/bash
# ============================================
# 🎼 Miyabi Orchestra 完全起動スクリプト
# Version: 1.0.0
# Date: 2025-11-22
# ============================================
# Usage: ./scripts/orchestra-full-start.sh
# ============================================

set -e

SCRIPT_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/scripts"
SESSION="miyabi-orchestra"

echo "🎼 Miyabi Orchestra Full Start"
echo "=============================="
echo ""

# ============================================
# 1. セッション確認・作成
# ============================================
echo "📦 Checking session..."
if ! tmux has-session -t $SESSION 2>/dev/null; then
    echo "   Creating session: $SESSION"
    tmux new-session -d -s $SESSION -n "🎼 WORKERS"
else
    echo "   ✅ Session exists"
fi

# ============================================
# 2. ウィンドウ構成
# ============================================
echo "🪟 Setting up windows..."

# Window 1: Workers (既存)
tmux rename-window -t $SESSION:1 "🎼 WORKERS" 2>/dev/null || true

# Window 2-7: 監視・管理ウィンドウ
WINDOWS=(
    "2:🖥️ MONITOR"
    "3:🕷️ WATER-SPIDER"
    "4:📍 TRACKING"
    "5:📋 TASK-QUEUE"
    "6:📡 COMM-HUB"
    "7:💓 HEALTH"
)

for win_info in "${WINDOWS[@]}"; do
    IFS=':' read -r num name <<< "$win_info"
    if ! tmux list-windows -t $SESSION | grep -q "^$num:"; then
        tmux new-window -t $SESSION:$num -n "$name"
        echo "   Created: $name"
    else
        tmux rename-window -t $SESSION:$num "$name" 2>/dev/null || true
        echo "   ✅ Exists: $name"
    fi
done

# ============================================
# 3. ワーカーペイン設定 (Window 1)
# ============================================
echo "⚙️ Setting up worker panes..."

# ペインタイトル表示設定
tmux set-option -t $SESSION pane-border-status top
tmux set-option -t $SESSION pane-border-format " #{pane_index}: #{pane_title} "

# ============================================
# 4. デーモン起動
# ============================================
echo "🤖 Starting daemons..."

DAEMONS=(
    "2:monitor-daemon.sh"
    "3:water-spider-daemon.sh"
    "4:tracking-daemon.sh"
    "5:task-queue-daemon.sh"
    "6:comm-hub-daemon.sh"
    "7:health-daemon.sh"
)

for daemon_info in "${DAEMONS[@]}"; do
    IFS=':' read -r win script <<< "$daemon_info"
    echo "   Starting $script in window $win..."
    tmux send-keys -t $SESSION:$win "cd $SCRIPT_DIR/.. && bash scripts/$script" Enter
    sleep 0.5
done

# ============================================
# 5. プロトコル伝達
# ============================================
echo "📨 Broadcasting protocol..."
bash $SCRIPT_DIR/orchestra-protocol-broadcast.sh 2>/dev/null || true

# ============================================
# 6. 完了報告
# ============================================
echo ""
echo "=============================="
echo "✅ Miyabi Orchestra Started!"
echo ""
echo "Windows:"
tmux list-windows -t $SESSION
echo ""
echo "Commands:"
echo "  Attach: tmux attach -t $SESSION"
echo "  Switch window: Ctrl+b [number]"
echo ""
echo "Window Guide:"
echo "  1: 🎼 WORKERS    - Orchestrator + 4 Workers"
echo "  2: 🖥️ MONITOR    - System monitoring"
echo "  3: 🕷️ SPIDER     - Auto problem detection"
echo "  4: 📍 TRACKING   - Progress tracking"
echo "  5: 📋 QUEUE      - Task management"
echo "  6: 📡 COMM-HUB   - Communication monitor"
echo "  7: 💓 HEALTH     - System health check"
echo ""
echo "🎯 Mission: NO GUARDIAN INPUT REQUIRED"
echo "=============================="
