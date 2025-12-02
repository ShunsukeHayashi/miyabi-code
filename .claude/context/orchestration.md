# Multi-Agent tmux Orchestration Protocol

## 概要
複雑なタスクを複数のClaude Codeエージェントに分散し、tmuxセッション内で並列実行。

## 起動条件
- 3つ以上の独立サブタスク
- 推定30分以上の実装
- 複数crateへの変更

## セッション構造テンプレート
```
miyabi-{task-name}
├── Window 0: coordinator (Pane %0: 統括)
├── Window 1: core-dev
│   ├── Pane %1: Agent-A (主実装)
│   ├── Pane %2: Agent-B (補助)
│   └── Pane %3: Watcher
├── Window 2: integration
│   ├── Pane %4: Agent-C
│   └── Pane %5: Agent-D
├── Window 3: testing
│   ├── Pane %6: Agent-E
│   └── Pane %7: Test Runner
└── Window 4: dashboard
    ├── Pane %8: Log Aggregator
    └── Pane %9: Progress Tracker
```

## 実行フロー

### Phase 1: プランニング
1. タスク分解 (独立サブタスクへ)
2. 依存関係グラフ (DAG) 構築
3. tmux構造設計
4. エージェント役割定義

### Phase 2: 環境構築
```bash
tmux new-session -d -s miyabi-{name} -n coordinator -c {dir}
tmux new-window -t miyabi-{name} -n core-dev
tmux split-window -t miyabi-{name}:1 -v
tmux list-panes -a -F '#{pane_id} | #{window_name}'
```

### Phase 3: エージェントデプロイ
```bash
# Watcher (先に起動)
tmux send-keys -t %3 'cargo watch -x "check --all"' Enter

# 実装エージェント (並列起動)
tmux send-keys -t %1 'claude --dangerously-skip-permissions "TASK-001: {指示}"' Enter
tmux send-keys -t %4 'claude --dangerously-skip-permissions "TASK-002: {指示}"' Enter
```

### Phase 4: 監視
```bash
# 進捗確認
tmux capture-pane -t %{id} -p | tail -20

# 完了検知 → 次タスク起動
```

### Phase 5: 完了
1. 全テスト通過確認
2. git add -A && git commit
3. git push && PR作成
4. tmux kill-session -t miyabi-{name}

## 依存関係管理

```
TASK-001 ──┬──► TASK-003 ──► TASK-007
TASK-002 ──┘
```

判断: 前提完了 → 次タスク起動 / 並列可能 → 同時起動

## エラーハンドリング
- コンパイルエラー → Coordinator が HOTFIX 投入
- テスト失敗 → 該当エージェントに修正指示
- タイムアウト → バックグラウンド実行

## 実績 (2025-12-02)
- タスク: Dev Issue System
- エージェント: 5並列
- 所要時間: ~15分
- 結果: 19 files, +1763/-450, 50+ tests, PR #1224
