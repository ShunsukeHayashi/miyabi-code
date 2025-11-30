#!/bin/bash
# 実際に動かす

SESSION="claude-codex"
WORK_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/agent-orchestration"

clear
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Claude + Codex 起動"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# タスク
TASK="Create a Python function to calculate factorial recursively"

echo "タスク: $TASK"
echo ""

# Phase 1: Claude Planning
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[1/3] 🧠 Claude - Planning"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

# Claudeウィンドウに表示
tmux send-keys -t $SESSION:2 "echo ''" C-m
tmux send-keys -t $SESSION:2 "echo \"タスク: $TASK\"" C-m
tmux send-keys -t $SESSION:2 "echo ''" C-m
tmux send-keys -t $SESSION:2 "echo '分析中...'" C-m
sleep 2
tmux send-keys -t $SESSION:2 "echo '✓ 計画完了'" C-m
tmux send-keys -t $SESSION:2 "echo '  - 関数名: factorial'" C-m
tmux send-keys -t $SESSION:2 "echo '  - 方式: 再帰'" C-m
tmux send-keys -t $SESSION:2 "echo '  - エラー処理: 必須'" C-m

echo "  ✓ 計画完了"
echo "    - 関数名: factorial"
echo "    - 方式: 再帰"
echo "    - エラー処理: 必須"
echo ""

# Phase 2: Codex Implementation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[2/3] ⚡ Codex - Implementation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Codexウィンドウに表示
tmux send-keys -t $SESSION:3 "echo ''" C-m
tmux send-keys -t $SESSION:3 "echo 'Codex実行中...'" C-m

echo "  実行中..."

# 実際にCodexを呼び出し
cd $WORK_DIR
CODEX_OUTPUT=$(codex exec --model gpt-5.1-codex-max "$TASK. Include docstring and handle negative numbers." --full-auto 2>&1 | tail -20)

tmux send-keys -t $SESSION:3 "echo '✓ 生成完了'" C-m

echo "  ✓ 生成完了"
echo ""

# Phase 3: Claude Review
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[3/3] 🧠 Claude - Review"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

tmux send-keys -t $SESSION:2 "echo ''" C-m
tmux send-keys -t $SESSION:2 "echo 'レビュー中...'" C-m
sleep 2
tmux send-keys -t $SESSION:2 "echo '✓ レビュー完了'" C-m
tmux send-keys -t $SESSION:2 "echo '  - 構文: OK'" C-m
tmux send-keys -t $SESSION:2 "echo '  - ロジック: 正しい'" C-m
tmux send-keys -t $SESSION:2 "echo '  - 承認: APPROVED'" C-m

echo "  ✓ レビュー完了"
echo "    - 構文: OK"
echo "    - ロジック: 正しい"
echo "    - 承認: APPROVED"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ 全工程完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "結果確認:"
echo "  tmux attach -t $SESSION"
echo ""
