# P1.5 Multi-Agent tmux Orchestration

## 概要
複雑なタスク（3+サブタスク、30分+実装、複数crate変更）は
複数のClaude Codeエージェントをtmuxで並列実行する。

## プロトコル優先度
- P0: 安全性（破壊的操作防止）
- P1: 依存関係の遵守
- P2: 並列性の最大化
- P3: 進捗の可視化

## セッション構造
```
miyabi-{task}
├── coordinator (統括・HOTFIX)
├── core-dev (主要実装 + Watcher)
├── integration (連携・API)
├── testing (テスト)
└── dashboard (ログ・進捗)
```

## 実行フロー
1. **プランニング**: タスク分解 → DAG → tmux設計 → 役割定義
2. **環境構築**: セッション → ウィンドウ → ペイン → ID記録
3. **デプロイ**: Watcher起動 → エージェント並列起動
4. **監視**: capture-pane → 完了検知 → 次タスク起動 → HOTFIX
5. **完了**: テスト → commit → PR → クリーンアップ

## コマンドリファレンス

### セッション管理
```bash
tmux new-session -d -s miyabi-{name} -n coordinator -c {dir}
tmux new-window -t miyabi-{name} -n {window}
tmux split-window -t miyabi-{name}:{window} -v
tmux kill-session -t miyabi-{name}
```

### エージェント起動
```bash
claude --dangerously-skip-permissions "TASK-XXX: {具体的指示}"
```

### 監視
```bash
tmux list-panes -a -F '#{pane_id} | #{window_name}'
tmux capture-pane -t %{id} -p | tail -20
```

## 判断基準
- 独立タスク → 並列起動
- 依存あり → 前提完了後に起動
- エラー発生 → Coordinator が HOTFIX 投入
- 全完了 → 統合テスト → PR作成

## 完了条件
- [ ] 全テスト通過
- [ ] cargo check --all 成功
- [ ] Git commit完了
- [ ] PR作成
- [ ] tmuxセッション終了

## 参照
- 詳細: `.claude/context/orchestration.md`
- 実績: Dev Issue System (2025-12-02, 5agents, 15min, PR#1224)
