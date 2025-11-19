# Miyabi Task Queue System

Maestroからの指示を永続化するタスク管理システムです。

## ディレクトリ構造

```
.claude/tasks/
├── pending/       # 未着手タスク
├── in_progress/   # 実行中タスク
├── completed/     # 完了タスク
└── blocked/       # ブロックされたタスク
```

## タスクフォーマット

各タスクは JSON ファイルとして保存されます:

```json
{
  "task_id": "uuid",
  "from": "maestro",
  "priority": "P0|P1|P2",
  "directive": "High-level goal description",
  "created_at": "2025-11-16T10:00:00Z",
  "assigned_to": "orchestrator|mugen|majin",
  "status": "pending|in_progress|completed|blocked",
  "dependencies": []
}
```

## 使用方法

```bash
# タスク作成
miyabi task create --from maestro --priority P1 --directive "Implement feature X"

# タスク一覧
miyabi task list

# タスク更新
miyabi task update <task_id> --status in_progress

# タスク完了
miyabi task complete <task_id>
```
