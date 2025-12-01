# Miyabi Task API

> Issue #1214: ChatGPT UI から Miyabi にタスク指示して自動実行〜完了報告

## 概要

ChatGPT UIやその他のクライアントからMiyabiにタスクを投入し、自動でコード変更→テスト→PR作成→レビュー→完了報告まで実行するAPIです。

## エンドポイント

### ベースURL
```
https://your-domain.com/api/v1
```

### 認証

すべてのエンドポイントはAPI Key認証が必要です。

```bash
# Authorization ヘッダー (推奨)
Authorization: Bearer miyabi-demo-key-12345

# または X-API-Key ヘッダー
X-API-Key: miyabi-demo-key-12345
```

### Rate Limit

- デフォルト: 100 リクエスト/時間
- レスポンスヘッダーで残り回数を確認可能:
  - `X-RateLimit-Remaining`: 残りリクエスト数
  - `X-RateLimit-Reset`: リセット時刻 (Unix timestamp)

---

## POST /tasks

新しいタスクを作成します。

### リクエスト

```bash
curl -X POST https://your-domain.com/api/v1/tasks \
  -H "Authorization: Bearer miyabi-demo-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "ユーザー認証機能を実装してください。JWTを使用し、ログイン・ログアウト・トークンリフレッシュのエンドポイントを作成してください。",
    "repository": "owner/repo-name",
    "options": {
      "auto_merge": false,
      "notify": true,
      "priority": "normal",
      "target_branch": "main",
      "require_review": true,
      "callback_url": "https://your-callback.com/webhook"
    }
  }'
```

### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `instruction` | string | ✅ | 自然言語によるタスク指示 (10-5000文字) |
| `repository` | string | ✅ | 対象リポジトリ (owner/repo形式) |
| `options.auto_merge` | boolean | ❌ | PR作成後に自動マージ (デフォルト: false) |
| `options.notify` | boolean | ❌ | 完了時に通知 (デフォルト: true) |
| `options.priority` | string | ❌ | 優先度: low, normal, high, critical |
| `options.target_branch` | string | ❌ | ターゲットブランチ (デフォルト: main) |
| `options.require_review` | boolean | ❌ | レビュー必須か |
| `options.callback_url` | string | ❌ | 完了時のコールバックURL |

### レスポンス

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "estimated_time": 120,
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:00:00Z",
  "progress": {
    "current_step": "キュー待機中",
    "total_steps": 5,
    "completed_steps": 0,
    "percentage": 0
  }
}
```

---

## GET /tasks

タスク一覧を取得します。

### リクエスト

```bash
curl -X GET "https://your-domain.com/api/v1/tasks?limit=20" \
  -H "Authorization: Bearer miyabi-demo-key-12345"
```

### レスポンス

```json
{
  "tasks": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "running",
      "created_at": "2025-11-29T10:00:00Z",
      "progress": {
        "current_step": "コード生成",
        "percentage": 40
      }
    }
  ],
  "count": 1
}
```

---

## GET /tasks/{taskId}

タスクの詳細を取得します。

### リクエスト

```bash
curl -X GET https://your-domain.com/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer miyabi-demo-key-12345"
```

### レスポンス (実行中)

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "estimated_time": 60,
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:01:00Z",
  "progress": {
    "current_step": "コードレビュー",
    "total_steps": 5,
    "completed_steps": 3,
    "percentage": 60,
    "current_agent": "review"
  }
}
```

### レスポンス (完了)

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:05:00Z",
  "progress": {
    "current_step": "完了",
    "total_steps": 5,
    "completed_steps": 5,
    "percentage": 100
  },
  "result": {
    "pr_url": "https://github.com/owner/repo/pull/123",
    "changes": [
      {
        "path": "src/auth/jwt.ts",
        "type": "added",
        "additions": 150,
        "deletions": 0
      },
      {
        "path": "src/routes/auth.ts",
        "type": "added",
        "additions": 80,
        "deletions": 0
      }
    ],
    "review_status": "approved",
    "merge_status": "pending"
  }
}
```

---

## DELETE /tasks/{taskId}

タスクをキャンセルします。

### リクエスト

```bash
curl -X DELETE https://your-domain.com/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer miyabi-demo-key-12345"
```

### レスポンス

```json
{
  "message": "Task cancelled successfully",
  "task": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled"
  }
}
```

---

## GET /health

ヘルスチェック (認証不要)

### リクエスト

```bash
curl -X GET https://your-domain.com/api/v1/health
```

### レスポンス

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-29T10:00:00Z",
  "tasks": {
    "total": 100,
    "queued": 5,
    "running": 3,
    "completed": 90,
    "failed": 2
  }
}
```

---

## エラーレスポンス

すべてのエラーは以下の形式で返されます:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| `MISSING_API_KEY` | 401 | API Keyがない |
| `INVALID_API_KEY` | 401 | 無効なAPI Key |
| `EXPIRED_API_KEY` | 401 | 期限切れのAPI Key |
| `INSUFFICIENT_PERMISSIONS` | 403 | 権限不足 |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit超過 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `INTERNAL_ERROR` | 500 | 内部エラー |

---

## ChatGPT カスタムGPT統合

ChatGPTのカスタムGPTから呼び出す場合は、以下のOpenAPI仕様を使用してください:

```yaml
openapi: 3.0.0
info:
  title: Miyabi Task API
  version: 1.0.0
servers:
  - url: https://your-domain.com/api/v1
paths:
  /tasks:
    post:
      operationId: createTask
      summary: Create a new automation task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - instruction
                - repository
              properties:
                instruction:
                  type: string
                repository:
                  type: string
      responses:
        '201':
          description: Task created
```

---

## セキュリティ

### ガードレール

| チェックポイント | 動作 |
|----------------|------|
| タスク開始 | 自動 (API Key認証) |
| コード生成 | 自動 |
| テスト実行 | 自動 |
| PR作成 | 自動 |
| **マージ** | **人間承認必須** (デフォルト) |
| 通知 | 自動 |

### ベストプラクティス

1. API Keyは安全に保管
2. `auto_merge: true` は信頼できる環境でのみ使用
3. `callback_url` はHTTPSを使用
4. Rate Limitに注意

---

## 今後の予定

- [ ] WebSocket対応 (リアルタイム進捗)
- [ ] Slack/Discord通知
- [ ] 複数リポジトリ対応
- [ ] カスタムワークフロー定義
