# Codex Background Task Monitoring

## Quick Start

### 1. PR Review タスクの実行

```bash
# タスクの初期化と開始
TASK_ID=$(./scripts/codex-task-runner.sh start \
  --task-id "pr-review-$(date +%Y%m%d)" \
  --instructions "/tmp/codex_pr_review_instructions.md" \
  --type "pr_review")

echo "Task ID: $TASK_ID"

# バックグラウンドでPRレビュー実行
./scripts/codex-pr-review-executor.sh "$TASK_ID" &

# モニタリング（別ターミナル推奨）
./scripts/codex-task-runner.sh monitor "$TASK_ID"
```

### 2. リアルタイムモニタリング

#### ターミナル1: タスク実行
```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/codex-pr-review-executor.sh "pr-review-20251031"
```

#### ターミナル2: モニタリング
```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/codex-task-runner.sh monitor "pr-review-20251031"
```

#### ターミナル3: ログ追跡
```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/codex-task-runner.sh logs "pr-review-20251031" --follow
```

### 3. ワンライナー実行

```bash
# 実行 + バックグラウンド + モニタリング
TASK_ID="pr-review-$(date +%Y%m%d-%H%M%S)" && \
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review && \
./scripts/codex-pr-review-executor.sh "$TASK_ID" > /dev/null 2>&1 & \
echo "Background task started: $TASK_ID" && \
./scripts/codex-task-runner.sh monitor "$TASK_ID"
```

## Directory Structure

```
.ai/codex-tasks/
├── README.md                          # このファイル
└── <task-id>/
    ├── status.json                    # タスク状態
    ├── instructions.md                # 実行指示
    ├── progress.log                   # 進捗ログ
    ├── results.json                   # 実行結果
    └── artifacts/
        ├── pr-reviews/                # PRレビュー詳細
        │   ├── pr-634.md
        │   ├── pr-633.md
        │   └── ...
        └── reports/
            └── summary.md             # サマリーレポート
```

## Status JSON Schema

```json
{
  "task_id": "pr-review-20251031",
  "type": "pr_review",
  "status": "in_progress",
  "created_at": "2025-10-31T11:50:00Z",
  "updated_at": "2025-10-31T12:00:00Z",
  "progress": {
    "total": 19,
    "completed": 5,
    "percentage": 26.3
  },
  "results": {},
  "pid": null,
  "log_file": ".ai/codex-tasks/pr-review-20251031/progress.log"
}
```

## Results JSON Schema

```json
{
  "task_id": "pr-review-20251031",
  "started_at": "2025-10-31T11:50:00Z",
  "prs_reviewed": [
    {
      "pr_number": 626,
      "pr_title": "chore(deps): Bump toml from 0.8.23 to 0.9.8",
      "decision": "APPROVED",
      "message": "Auto-approved: Dependency update with passing CI",
      "reviewed_at": "2025-10-31T11:52:00Z"
    }
  ],
  "summary": {
    "total": 19,
    "approved": 15,
    "changes_requested": 2,
    "commented": 2,
    "failed": 0
  }
}
```

## Commands Reference

### Task Management

```bash
# タスク開始
./scripts/codex-task-runner.sh start \
  --task-id "<task-id>" \
  --instructions "<instructions-file>" \
  --type "<type>"

# ステータス確認
./scripts/codex-task-runner.sh status "<task-id>"

# リアルタイムモニタリング
./scripts/codex-task-runner.sh monitor "<task-id>"

# ログ表示
./scripts/codex-task-runner.sh logs "<task-id>"
./scripts/codex-task-runner.sh logs "<task-id>" --follow

# 結果取得
./scripts/codex-task-runner.sh results "<task-id>"

# タスク完了待機
./scripts/codex-task-runner.sh wait "<task-id>"

# レポート生成
./scripts/codex-task-runner.sh report "<task-id>" --format markdown
```

### PR Review Specific

```bash
# PRレビュー実行
./scripts/codex-pr-review-executor.sh "<task-id>"

# 特定のPRのみレビュー
# (スクリプト内でPRリストを編集)
```

## Monitoring Dashboard (TUI)

モニタリングコマンドを実行すると、以下のようなダッシュボードが表示されます：

```
╔═══════════════════════════════════════════════════════════════╗
║ Codex Task Monitor - pr-review-20251031                      ║
╠═══════════════════════════════════════════════════════════════╣
║ Status: in_progress                                           ║
║ Created: 2025-10-31T11:50:00Z                                 ║
║ Updated: 2025-10-31T12:00:00Z                                 ║
║                                                               ║
║ Progress: 5/19 (26.3%)                                        ║
╠═══════════════════════════════════════════════════════════════╣
║ Recent Logs:                                                  ║
║   [2025-10-31 12:00:00] PR #626 [SUCCESS] APPROVED completed  ║
║   [2025-10-31 12:00:05] PR #625 [SUCCESS] APPROVED completed  ║
║   [2025-10-31 12:00:10] PR #607 [INFO] Starting review        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ Refreshing in 5 seconds... (Ctrl+C to stop)                  ║
╚═══════════════════════════════════════════════════════════════╝
```

## Notification Settings

### macOS通知

タスク完了時に自動的にmacOS通知が送信されます。

### Slack/Discord通知（オプション）

環境変数を設定すると、Webhook経由で通知を送信できます：

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

## Integration with Miyabi CLI

将来的には以下のコマンドで実行可能になります：

```bash
# Miyabi CLIからの実行
miyabi codex pr-review --auto

# モニタリング
miyabi codex monitor <task-id>

# 結果確認
miyabi codex results <task-id>
```

## Troubleshooting

### タスクが見つからない

```bash
# タスク一覧確認
ls -la .ai/codex-tasks/

# 最新のタスク確認
ls -lt .ai/codex-tasks/ | head -5
```

### ログが更新されない

```bash
# プロセス確認
ps aux | grep codex-pr-review-executor

# 手動でログ確認
tail -f .ai/codex-tasks/<task-id>/progress.log
```

### JSONパースエラー

```bash
# status.jsonの検証
jq '.' .ai/codex-tasks/<task-id>/status.json

# results.jsonの検証
jq '.' .ai/codex-tasks/<task-id>/results.json
```

## Best Practices

1. **並列実行は避ける**: 同時に複数のPRレビュータスクを実行しない
2. **ログの定期削除**: 古いタスクログは定期的に削除する
3. **通知設定**: 長時間タスクには通知を有効にする
4. **手動確認**: 自動承認されたPRも最終的には手動確認を推奨

## Examples

### Example 1: 全PRレビュー + マージ

```bash
# ステップ1: PRレビュー
TASK_ID="pr-review-$(date +%Y%m%d)"
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review
./scripts/codex-pr-review-executor.sh "$TASK_ID"

# ステップ2: 結果確認
./scripts/codex-task-runner.sh results "$TASK_ID" | jq '.summary'

# ステップ3: 承認済みPRをマージ
./scripts/codex-task-runner.sh results "$TASK_ID" | \
  jq -r '.prs_reviewed[] | select(.decision == "APPROVED") | .pr_number' | \
  while read pr; do
    echo "Merging PR #$pr"
    gh pr merge "$pr" --auto --squash
  done
```

### Example 2: カスタムPRリストレビュー

```bash
# 特定のPRのみレビュー
PR_LIST="626 625 607 604 603 602"

for pr in $PR_LIST; do
  ./scripts/codex-pr-review-executor.sh "manual-review-$pr"
done
```

## Future Enhancements

- [ ] Rust製TUIダッシュボード（ratatui使用）
- [ ] Webhook統合（Slack/Discord/Teams）
- [ ] 自動リカバリー機能
- [ ] Miyabi CLI統合
- [ ] 並列レビュー対応
- [ ] AIレビューコメント生成（LLM統合）
- [ ] レビュー品質スコアリング
