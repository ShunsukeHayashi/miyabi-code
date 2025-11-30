#!/bin/bash
# Claude + Codex 視覚的デモ

SESSION="claude-codex-demo"

# タスク
TASK="Create a function to calculate fibonacci numbers"

# === Phase 1: Claude Planning ===
tmux send-keys -t $SESSION:1.1 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.1 "echo 'PHASE 1: Planning'" C-m
tmux send-keys -t $SESSION:1.1 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.1 "echo ''" C-m
tmux send-keys -t $SESSION:1.1 "echo 'Task: $TASK'" C-m
tmux send-keys -t $SESSION:1.1 "echo ''" C-m
tmux send-keys -t $SESSION:1.1 "echo '分析中...'" C-m
sleep 2
tmux send-keys -t $SESSION:1.1 "echo '✓ 計画完了'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → 関数名: fibonacci'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → アルゴリズム: 再帰'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → エラー処理: 必須'" C-m

# タスク実行エリアに表示
tmux send-keys -t $SESSION:1.3 "echo '[1/3] Claude が計画作成 ✓'" C-m
sleep 1

# === Phase 2: Codex Implementation ===
tmux send-keys -t $SESSION:1.2 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.2 "echo 'PHASE 2: Implementation'" C-m
tmux send-keys -t $SESSION:1.2 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.2 "echo ''" C-m
tmux send-keys -t $SESSION:1.2 "echo 'Codex実行中...'" C-m

# タスク実行エリア
tmux send-keys -t $SESSION:1.3 "echo '[2/3] Codex がコード実装中...'" C-m
sleep 3

# Codex実行（実際に）
tmux send-keys -t $SESSION:1.2 "codex exec --model gpt-5.1-codex-max 'Create a Python function called fibonacci that calculates fibonacci numbers. Use recursion. Include docstring and error handling for negative numbers.' --full-auto" C-m

# タスク実行エリア
sleep 5
tmux send-keys -t $SESSION:1.3 "echo '[2/3] Codex コード生成完了 ✓'" C-m

# === Phase 3: Claude Review ===
sleep 2
tmux send-keys -t $SESSION:1.1 "echo ''" C-m
tmux send-keys -t $SESSION:1.1 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.1 "echo 'PHASE 3: Review'" C-m
tmux send-keys -t $SESSION:1.1 "echo '─────────────────────────────────────'" C-m
tmux send-keys -t $SESSION:1.1 "echo ''" C-m
tmux send-keys -t $SESSION:1.1 "echo 'レビュー中...'" C-m
sleep 2
tmux send-keys -t $SESSION:1.1 "echo '✓ レビュー完了'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → 構文: OK'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → ロジック: 正しい'" C-m
tmux send-keys -t $SESSION:1.1 "echo '  → 承認: APPROVED ✓'" C-m

# タスク実行エリア
tmux send-keys -t $SESSION:1.3 "echo '[3/3] Claude がレビュー完了 ✓'" C-m
tmux send-keys -t $SESSION:1.3 "echo ''" C-m
tmux send-keys -t $SESSION:1.3 "echo '═══════════════════════════════════════════════════════════════════════════'" C-m
tmux send-keys -t $SESSION:1.3 "echo '✓ タスク完了！'" C-m
tmux send-keys -t $SESSION:1.3 "echo '  Claude (計画) → Codex (実装) → Claude (レビュー)'" C-m
tmux send-keys -t $SESSION:1.3 "echo '═══════════════════════════════════════════════════════════════════════════'" C-m

echo "デモ実行中..."
