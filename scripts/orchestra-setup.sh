#!/bin/bash
# ============================================
# 🎼 Orchestra-Worker セットアップスクリプト
# Version: 1.0.0
# Date: 2025-11-22
# ============================================

set -e

SESSION="miyabi-orchestra"

echo "🎼 Orchestra-Worker セットアップ開始..."

# ============================================
# 1. ペインタイトル表示設定
# ============================================
echo "📋 ペインボーダー設定..."
tmux set-option -t $SESSION pane-border-status top
tmux set-option -t $SESSION pane-border-format " #{pane_index}: #{pane_title} "

# ============================================
# 2. ペインタイトル設定
# ============================================
echo "🏷️ ペインタイトル設定..."
tmux select-pane -t %1 -T "🎼 ORCHESTRATOR"
tmux select-pane -t %2 -T "⚙️ WORKER-1"
tmux select-pane -t %3 -T "⚙️ WORKER-2"
tmux select-pane -t %4 -T "⚙️ WORKER-3"
tmux select-pane -t %5 -T "⚙️ WORKER-4"

# ============================================
# 3. レイアウト設定
# ============================================
echo "📐 レイアウト設定..."
tmux select-layout -t $SESSION tiled

echo "✅ セットアップ完了!"
echo ""
echo "ペイン構成:"
echo "  %1 - 🎼 ORCHESTRATOR"
echo "  %2 - ⚙️ WORKER-1"
echo "  %3 - ⚙️ WORKER-2"
echo "  %4 - ⚙️ WORKER-3"
echo "  %5 - ⚙️ WORKER-4"
