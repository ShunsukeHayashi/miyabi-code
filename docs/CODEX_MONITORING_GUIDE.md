# Codex Background Task Monitoring Guide

## 概要

このガイドでは、Codexバックグラウンドタスク（PRレビュー、ブランチ整理など）を実行・監視する方法を説明します。

## クイックスタート

### 1. PRレビュータスクの実行

```bash
cd /Users/shunsuke/Dev/miyabi-private

# ステップ1: タスク初期化
TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)"
./scripts/codex-task-runner.sh start \
  --task-id "$TASK_ID" \
  --instructions "/tmp/codex_pr_review_instructions.md" \
  --type pr_review

# ステップ2: バックグラウンドで実行
nohup ./scripts/codex-pr-review-executor.sh "$TASK_ID" > /tmp/pr-review-bg.log 2>&1 &
echo "Background task started with PID: $!"

# ステップ3: モニタリング（別ターミナル推奨）
./scripts/codex-task-runner.sh monitor "$TASK_ID"
```

### 2. ワンライナー実行

```bash
TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)" && \
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review && \
nohup ./scripts/codex-pr-review-executor.sh "$TASK_ID" > /tmp/pr-review.log 2>&1 & \
echo "Task ID: $TASK_ID | PID: $! | Monitor: ./scripts/codex-task-runner.sh monitor $TASK_ID"
```

## モニタリングコマンド

### ステータス確認

```bash
# 現在の状態を確認
./scripts/codex-task-runner.sh status "pr-review-20251031-115806"

# 出力例:
# Task ID: pr-review-20251031-115806
# Type: pr_review
# Status: in_progress
# Created: 2025-10-31T02:58:06Z
# Updated: 2025-10-31T02:58:41Z
# Progress:
#   Total: 19
#   Completed: 5
#   Percentage: 26.3%
```

### リアルタイムモニタリング（TUI）

```bash
# 5秒間隔で自動更新されるダッシュボード
./scripts/codex-task-runner.sh monitor "pr-review-20251031-115806"

# 出力例:
╔═══════════════════════════════════════════════════════════════╗
║ Codex Task Monitor - pr-review-20251031-115806               ║
╠═══════════════════════════════════════════════════════════════╣
║ Status: in_progress                                           ║
║ Created: 2025-10-31T02:58:06Z                                 ║
║ Updated: 2025-10-31T03:05:00Z                                 ║
║                                                               ║
║ Progress: 5/19 (26.3%)                                        ║
╠═══════════════════════════════════════════════════════════════╣
║ Recent Logs:                                                  ║
║   [2025-10-31 11:58:41] PR #634 [SUCCESS] COMMENTED completed ║
║   [2025-10-31 11:58:46] PR #633 [SUCCESS] COMMENTED completed ║
║   [2025-10-31 11:58:50] PR #631 [INFO] Starting review        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ Refreshing in 5 seconds... (Ctrl+C to stop)                  ║
╚═══════════════════════════════════════════════════════════════╝
```

### ログ表示

```bash
# 全ログ表示
./scripts/codex-task-runner.sh logs "pr-review-20251031-115806"

# リアルタイムでログを追跡
./scripts/codex-task-runner.sh logs "pr-review-20251031-115806" --follow

# 直接tailでも可能
tail -f .ai/codex-tasks/pr-review-20251031-115806/progress.log
```

### タスク完了待機

```bash
# ブロッキングモードで待機（完了まで待つ）
./scripts/codex-task-runner.sh wait "pr-review-20251031-115806"

# 完了したら自動的に結果を表示
if ./scripts/codex-task-runner.sh wait "pr-review-20251031-115806"; then
  ./scripts/codex-task-runner.sh results "pr-review-20251031-115806"
fi
```

## 結果の確認

### 結果JSON取得

```bash
# 結果JSON表示
./scripts/codex-task-runner.sh results "pr-review-20251031-115806"

# 出力例:
{
  "task_id": "pr-review-20251031-115806",
  "started_at": "2025-10-31T02:58:39Z",
  "prs_reviewed": [
    {
      "pr_number": 634,
      "pr_title": "feat(desktop): Miyabi Desktop Electron App",
      "decision": "COMMENTED",
      "message": "⚠️ Large PR detected (76794 lines changed)...",
      "reviewed_at": "2025-10-31T02:58:41Z"
    },
    ...
  ],
  "summary": {
    "total": 19,
    "approved": 15,
    "changes_requested": 0,
    "commented": 4,
    "failed": 0
  }
}
```

### サマリー表示

```bash
# サマリーのみ表示
./scripts/codex-task-runner.sh results "pr-review-20251031-115806" | jq '.summary'

# 承認済みPRリストのみ表示
./scripts/codex-task-runner.sh results "pr-review-20251031-115806" | \
  jq -r '.prs_reviewed[] | select(.decision == "APPROVED") | "#\(.pr_number): \(.pr_title)"'
```

### レポート生成

```bash
# Markdownレポート生成
./scripts/codex-task-runner.sh report "pr-review-20251031-115806" --format markdown

# 出力先指定
./scripts/codex-task-runner.sh report "pr-review-20251031-115806" --format markdown > PR_REVIEW_REPORT.md
```

## ディレクトリ構造

```
.ai/codex-tasks/pr-review-20251031-115806/
├── status.json                    # タスク状態（リアルタイム更新）
├── instructions.md                # 実行指示（コピー）
├── progress.log                   # 詳細ログ
├── results.json                   # 実行結果（完了後）
└── artifacts/
    ├── pr-reviews/                # 各PRの詳細レビュー
    │   ├── pr-634.md
    │   ├── pr-633.md
    │   ├── pr-631.md
    │   └── ...
    └── reports/
        └── summary.md             # サマリーレポート
```

## マルチターミナルワークフロー

### 推奨セットアップ（3ターミナル）

**ターミナル1: タスク実行**
```bash
cd /Users/shunsuke/Dev/miyabi-private
TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)"
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review
./scripts/codex-pr-review-executor.sh "$TASK_ID"
```

**ターミナル2: リアルタイムモニタリング**
```bash
cd /Users/shunsuke/Dev/miyabi-private
# ターミナル1から取得したTASK_IDを使用
./scripts/codex-task-runner.sh monitor "pr-review-YYYYMMDD-HHMMSS"
```

**ターミナル3: ログ追跡**
```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/codex-task-runner.sh logs "pr-review-YYYYMMDD-HHMMSS" --follow
```

## 実行例

### 例1: 全PRレビュー + 承認済みPRを自動マージ

```bash
#!/bin/bash

# ステップ1: PRレビュー
TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)"
echo "Starting PR review task: $TASK_ID"

./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review
./scripts/codex-pr-review-executor.sh "$TASK_ID"

# ステップ2: 結果サマリー表示
echo "=== Review Summary ==="
./scripts/codex-task-runner.sh results "$TASK_ID" | jq '.summary'

# ステップ3: 承認済みPRを抽出してマージ
echo "=== Merging Approved PRs ==="
./scripts/codex-task-runner.sh results "$TASK_ID" | \
  jq -r '.prs_reviewed[] | select(.decision == "APPROVED") | .pr_number' | \
  while read pr; do
    echo "Merging PR #$pr"
    gh pr merge "$pr" --auto --squash
    sleep 2
  done

echo "=== Complete ==="
```

### 例2: バックグラウンド実行 + 通知

```bash
#!/bin/bash

TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)"

# バックグラウンド実行
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review
nohup ./scripts/codex-pr-review-executor.sh "$TASK_ID" > /tmp/pr-review.log 2>&1 &

echo "Task started in background: $TASK_ID"
echo "Monitor: ./scripts/codex-task-runner.sh monitor $TASK_ID"

# 完了待機 + 通知
./scripts/codex-task-runner.sh wait "$TASK_ID"

# macOS通知
osascript -e 'display notification "PR review completed" with title "Miyabi Codex"'

# 結果表示
./scripts/codex-task-runner.sh results "$TASK_ID" | jq '.summary'
```

## トラブルシューティング

### タスクが見つからない

```bash
# 全タスク一覧
ls -lt .ai/codex-tasks/

# 特定タスクの存在確認
test -d ".ai/codex-tasks/pr-review-20251031-115806" && echo "Exists" || echo "Not found"
```

### ログが更新されない

```bash
# プロセス確認
ps aux | grep codex-pr-review-executor

# 手動でプロセスKill
pkill -f codex-pr-review-executor

# 再実行
./scripts/codex-pr-review-executor.sh "pr-review-20251031-115806"
```

### JSONパースエラー

```bash
# status.json検証
jq '.' .ai/codex-tasks/pr-review-20251031-115806/status.json

# results.json検証
jq '.' .ai/codex-tasks/pr-review-20251031-115806/results.json

# 修復（再初期化）
./scripts/codex-task-runner.sh start --task-id "pr-review-20251031-115806" --type pr_review
```

## ベストプラクティス

### 1. 並列実行は避ける
同時に複数のPRレビュータスクを実行しないでください（GitHub API rate limitに注意）。

### 2. 定期的なクリーンアップ
```bash
# 30日以上古いタスクを削除
find .ai/codex-tasks/ -type d -mtime +30 -exec rm -rf {} \;
```

### 3. 重要なタスクはアーカイブ
```bash
# 重要なタスク結果を保存
mkdir -p .ai/archive/pr-reviews/
cp -r .ai/codex-tasks/pr-review-20251031-115806 .ai/archive/pr-reviews/
```

### 4. 承認前の手動確認
自動承認されたPRも最終的には手動で差分確認を推奨します。

```bash
# 承認済みPRの差分を一括確認
./scripts/codex-task-runner.sh results "$TASK_ID" | \
  jq -r '.prs_reviewed[] | select(.decision == "APPROVED") | .pr_number' | \
  while read pr; do
    echo "=== PR #$pr ==="
    gh pr diff "$pr" | head -100
    read -p "Continue? (y/n) " -n 1 -r
    echo
  done
```

## 今後の拡張予定

- [ ] Rust製TUIダッシュボード（ratatui）
- [ ] Slack/Discord Webhook統合
- [ ] 自動リカバリー機能
- [ ] Miyabi CLI統合 (`miyabi codex monitor`)
- [ ] 並列レビュー対応（複数PRを同時処理）
- [ ] AIレビューコメント生成（LLM統合）
- [ ] レビュー品質スコアリング

## 関連ドキュメント

- [.claude/commands/codex-monitor.md](.claude/commands/codex-monitor.md) - モニタリングシステム設計
- [.ai/codex-tasks/README.md](.ai/codex-tasks/README.md) - タスク管理詳細
- [scripts/codex-task-runner.sh](scripts/codex-task-runner.sh) - タスクランナースクリプト
- [scripts/codex-pr-review-executor.sh](scripts/codex-pr-review-executor.sh) - PRレビュー実行スクリプト

## サポート

問題が発生した場合:
1. ログを確認: `./scripts/codex-task-runner.sh logs <task-id>`
2. ステータス確認: `./scripts/codex-task-runner.sh status <task-id>`
3. GitHub Issueで報告: https://github.com/customer-cloud/miyabi-private/issues
