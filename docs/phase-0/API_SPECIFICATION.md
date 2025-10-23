# Phase 0: API仕様書

**作成日**: 2025-10-24
**バージョン**: v1.0（概要版）
**ステータス**: ✅ 設計完了
**関連Issue**: #425

---

## 📋 目次

1. [概要](#概要)
2. [認証](#認証)
3. [エンドポイント一覧](#エンドポイント一覧)
4. [データモデル](#データモデル)
5. [エラーハンドリング](#エラーハンドリング)
6. [レート制限](#レート制限)

---

## 概要

### ベースURL

- **開発環境**: `http://localhost:8080`
- **本番環境**: `https://api.miyabi.example.com`

### プロトコル

- **REST API**: JSON形式
- **WebSocket**: `/ws/{execution_id}` - リアルタイム通信

### バージョニング

- **現行バージョン**: `v1`
- **URL形式**: `/api/v1/...`

---

## 認証

### JWT Bearer Token

全てのAPIエンドポイント（公開エンドポイントを除く）はJWT Bearer Tokenによる認証が必要です。

**リクエストヘッダー**:
```http
Authorization: Bearer <jwt_token>
```

**JWT Claims**:
```json
{
  "sub": "user_uuid",
  "github_login": "username",
  "is_admin": false,
  "exp": 1698019200
}
```

### GitHub OAuth フロー

```
1. GET  /auth/github          - GitHub認可ページへリダイレクト
2. GET  /auth/github/callback - GitHub callbackハンドリング
3. POST /auth/refresh         - トークンリフレッシュ
4. POST /auth/logout          - ログアウト
```

---

## エンドポイント一覧

### 1. 認証 (Authentication)

#### `GET /auth/github`

GitHub OAuth認可ページへリダイレクト

**レスポンス**:
- `302 Found` - GitHubへリダイレクト

---

#### `GET /auth/github/callback`

GitHub OAuth callback処理

**クエリパラメータ**:
- `code` (string, required) - GitHub Authorization Code
- `state` (string, required) - CSRF保護用state

**レスポンス** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "github_login": "username",
    "github_name": "Display Name",
    "github_avatar_url": "https://avatars.githubusercontent.com/...",
    "is_admin": false
  }
}
```

---

#### `POST /auth/refresh`

JWTトークンリフレッシュ

**リクエストボディ**:
```json
{
  "refresh_token": "refresh_token_string"
}
```

**レスポンス** (`200 OK`):
```json
{
  "access_token": "new_jwt_token",
  "expires_in": 86400
}
```

---

#### `POST /auth/logout`

ログアウト（トークン無効化）

**レスポンス** (`204 No Content`)

---

### 2. リポジトリ (Repositories)

#### `GET /api/v1/repositories`

接続されたリポジトリ一覧取得

**クエリパラメータ**:
- `page` (integer, default: 1) - ページ番号
- `per_page` (integer, default: 20, max: 100) - 1ページあたりの件数
- `is_enabled` (boolean, optional) - 有効フラグフィルタ

**レスポンス** (`200 OK`):
```json
{
  "repositories": [
    {
      "id": "uuid",
      "github_full_name": "owner/repo",
      "github_owner": "owner",
      "github_repo_name": "repo",
      "github_default_branch": "main",
      "github_is_private": false,
      "github_html_url": "https://github.com/owner/repo",
      "is_enabled": true,
      "miyabi_config": {
        "agents": ["CoordinatorAgent", "CodeGenAgent"],
        "auto_merge": false
      },
      "last_synced_at": "2025-10-24T08:00:00Z",
      "created_at": "2025-10-24T07:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

---

#### `GET /api/v1/repositories/:id`

リポジトリ詳細取得

**パスパラメータ**:
- `id` (uuid, required) - リポジトリID

**レスポンス** (`200 OK`):
```json
{
  "id": "uuid",
  "github_full_name": "owner/repo",
  "github_description": "Repository description",
  "github_default_branch": "main",
  "github_is_private": false,
  "github_html_url": "https://github.com/owner/repo",
  "github_clone_url": "https://github.com/owner/repo.git",
  "is_enabled": true,
  "miyabi_config": { ... },
  "webhook_id": 12345,
  "last_synced_at": "2025-10-24T08:00:00Z",
  "created_at": "2025-10-24T07:00:00Z",
  "updated_at": "2025-10-24T08:00:00Z"
}
```

---

#### `POST /api/v1/repositories`

リポジトリ接続（新規追加）

**リクエストボディ**:
```json
{
  "github_full_name": "owner/repo"
}
```

**レスポンス** (`201 Created`):
```json
{
  "id": "uuid",
  "github_full_name": "owner/repo",
  ...
}
```

---

#### `PUT /api/v1/repositories/:id`

リポジトリ設定更新

**リクエストボディ**:
```json
{
  "is_enabled": true,
  "miyabi_config": {
    "agents": ["CoordinatorAgent", "CodeGenAgent", "ReviewAgent"],
    "auto_merge": false
  }
}
```

**レスポンス** (`200 OK`):
```json
{
  "id": "uuid",
  "is_enabled": true,
  ...
}
```

---

#### `DELETE /api/v1/repositories/:id`

リポジトリ接続解除

**レスポンス** (`204 No Content`)

---

### 3. Agent実行 (Agent Executions)

#### `GET /api/v1/agent-executions`

Agent実行履歴一覧取得

**クエリパラメータ**:
- `page` (integer, default: 1)
- `per_page` (integer, default: 20, max: 100)
- `repository_id` (uuid, optional) - リポジトリフィルタ
- `agent_type` (string, optional) - Agent種別フィルタ
- `status` (string, optional) - ステータスフィルタ (pending/running/completed/failed)

**レスポンス** (`200 OK`):
```json
{
  "executions": [
    {
      "id": "uuid",
      "repository_id": "uuid",
      "agent_type": "CoordinatorAgent",
      "issue_number": 270,
      "issue_title": "Implement feature X",
      "status": "completed",
      "progress": 100,
      "started_at": "2025-10-24T08:00:00Z",
      "completed_at": "2025-10-24T08:15:00Z",
      "commit_sha": "abc1234",
      "pr_number": 123,
      "created_at": "2025-10-24T08:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### `GET /api/v1/agent-executions/:id`

Agent実行詳細取得

**レスポンス** (`200 OK`):
```json
{
  "id": "uuid",
  "repository_id": "uuid",
  "agent_type": "CoordinatorAgent",
  "issue_number": 270,
  "issue_title": "Implement feature X",
  "task_id": "task-001",
  "status": "completed",
  "progress": 100,
  "started_at": "2025-10-24T08:00:00Z",
  "completed_at": "2025-10-24T08:15:00Z",
  "error_message": null,
  "input_params": {
    "issue": 270,
    "auto_merge": false
  },
  "output_result": {
    "tasks_created": 5,
    "commits": ["abc1234"],
    "pr_url": "https://github.com/owner/repo/pull/123"
  },
  "worktree_path": ".worktrees/issue-270",
  "commit_sha": "abc1234",
  "pr_number": 123,
  "logs": [
    "Starting CoordinatorAgent...",
    "Analyzing Issue #270...",
    "Creating 5 subtasks...",
    "Execution completed successfully."
  ],
  "metadata": { ... },
  "created_at": "2025-10-24T08:00:00Z",
  "updated_at": "2025-10-24T08:15:00Z"
}
```

---

#### `POST /api/v1/agent-executions`

Agent実行開始

**リクエストボディ**:
```json
{
  "repository_id": "uuid",
  "agent_type": "CoordinatorAgent",
  "input_params": {
    "issue": 270,
    "auto_merge": false,
    "concurrency": 3
  }
}
```

**レスポンス** (`202 Accepted`):
```json
{
  "id": "uuid",
  "status": "pending",
  "websocket_url": "/ws/uuid"
}
```

---

#### `GET /api/v1/agent-executions/:id/logs`

Agent実行ログ取得（ストリーミング）

**クエリパラメータ**:
- `since` (integer, optional) - ログ行番号（0開始）

**レスポンス** (`200 OK`):
```json
{
  "logs": [
    "Starting CoordinatorAgent...",
    "Analyzing Issue #270...",
    "Creating 5 subtasks..."
  ],
  "total_logs": 3,
  "next_cursor": 3
}
```

---

### 4. ワークフロー (Workflows)

#### `GET /api/v1/workflows`

ワークフロー一覧取得

**クエリパラメータ**:
- `repository_id` (uuid, optional)
- `is_enabled` (boolean, optional)

**レスポンス** (`200 OK`):
```json
{
  "workflows": [
    {
      "id": "uuid",
      "repository_id": "uuid",
      "name": "Auto Review & Deploy",
      "description": "PR作成時に自動レビュー→承認→デプロイ",
      "is_enabled": true,
      "trigger_type": "webhook",
      "last_executed_at": "2025-10-24T08:00:00Z",
      "execution_count": 42,
      "success_count": 40,
      "failure_count": 2,
      "created_at": "2025-10-20T00:00:00Z"
    }
  ]
}
```

---

#### `GET /api/v1/workflows/:id`

ワークフロー詳細取得

**レスポンス** (`200 OK`):
```json
{
  "id": "uuid",
  "repository_id": "uuid",
  "name": "Auto Review & Deploy",
  "description": "...",
  "workflow_definition": {
    "nodes": [
      {
        "id": "node-1",
        "type": "agent",
        "agent_type": "ReviewAgent",
        "position": { "x": 100, "y": 100 }
      },
      {
        "id": "node-2",
        "type": "agent",
        "agent_type": "DeploymentAgent",
        "position": { "x": 300, "y": 100 }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "condition": "quality_score >= 80"
      }
    ]
  },
  "is_enabled": true,
  "trigger_type": "webhook",
  "trigger_config": {
    "events": ["pull_request.opened", "pull_request.synchronize"]
  },
  ...
}
```

---

#### `POST /api/v1/workflows`

ワークフロー作成

**リクエストボディ**:
```json
{
  "repository_id": "uuid",
  "name": "Auto Review & Deploy",
  "description": "...",
  "workflow_definition": { ... },
  "trigger_type": "webhook",
  "trigger_config": { ... }
}
```

**レスポンス** (`201 Created`)

---

#### `PUT /api/v1/workflows/:id`

ワークフロー更新

**レスポンス** (`200 OK`)

---

#### `DELETE /api/v1/workflows/:id`

ワークフロー削除

**レスポンス** (`204 No Content`)

---

### 5. WebSocket (リアルタイム通信)

#### `WS /ws/:execution_id`

Agent実行のリアルタイム進捗受信

**接続**:
```javascript
const ws = new WebSocket(`ws://localhost:8080/ws/${execution_id}?token=${jwt_token}`);
```

**受信メッセージ**:

**進捗更新**:
```json
{
  "type": "progress",
  "execution_id": "uuid",
  "progress": 50,
  "timestamp": "2025-10-24T08:05:00Z"
}
```

**ログメッセージ**:
```json
{
  "type": "log",
  "execution_id": "uuid",
  "log": "Analyzing Issue #270...",
  "timestamp": "2025-10-24T08:05:00Z"
}
```

**ステータス変更**:
```json
{
  "type": "status",
  "execution_id": "uuid",
  "status": "completed",
  "timestamp": "2025-10-24T08:15:00Z"
}
```

**エラー**:
```json
{
  "type": "error",
  "execution_id": "uuid",
  "error": "Agent execution failed: ...",
  "timestamp": "2025-10-24T08:05:00Z"
}
```

---

## データモデル

### User

```typescript
interface User {
  id: string; // UUID
  github_id: number;
  github_login: string;
  github_name: string | null;
  github_email: string | null;
  github_avatar_url: string | null;
  is_admin: boolean;
  is_active: boolean;
  last_login_at: string | null; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

### Repository

```typescript
interface Repository {
  id: string; // UUID
  user_id: string; // UUID
  github_repo_id: number;
  github_owner: string;
  github_repo_name: string;
  github_full_name: string;
  github_default_branch: string;
  github_description: string | null;
  github_is_private: boolean;
  github_html_url: string;
  github_clone_url: string;
  is_enabled: boolean;
  miyabi_config: Record<string, any> | null;
  webhook_id: number | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### AgentExecution

```typescript
interface AgentExecution {
  id: string; // UUID
  repository_id: string; // UUID
  user_id: string; // UUID
  agent_type: string;
  issue_number: number | null;
  issue_title: string | null;
  task_id: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  input_params: Record<string, any>;
  output_result: Record<string, any> | null;
  worktree_path: string | null;
  commit_sha: string | null;
  pr_number: number | null;
  logs: string[];
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
```

### Workflow

```typescript
interface Workflow {
  id: string; // UUID
  repository_id: string; // UUID
  user_id: string; // UUID
  name: string;
  description: string | null;
  workflow_definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  is_enabled: boolean;
  trigger_type: 'manual' | 'webhook' | 'schedule';
  trigger_config: Record<string, any> | null;
  last_executed_at: string | null;
  execution_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}
```

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Repository not found",
    "details": {
      "repository_id": "uuid"
    }
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| `200 OK` | 成功 |
| `201 Created` | リソース作成成功 |
| `202 Accepted` | 非同期処理受付 |
| `204 No Content` | 成功（レスポンスボディなし） |
| `400 Bad Request` | 不正なリクエスト |
| `401 Unauthorized` | 認証エラー |
| `403 Forbidden` | 権限不足 |
| `404 Not Found` | リソース未検出 |
| `409 Conflict` | リソース競合 |
| `422 Unprocessable Entity` | バリデーションエラー |
| `429 Too Many Requests` | レート制限超過 |
| `500 Internal Server Error` | サーバーエラー |
| `503 Service Unavailable` | サービス一時停止 |

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|--------------|------|
| `VALIDATION_ERROR` | 422 | バリデーションエラー |
| `RESOURCE_NOT_FOUND` | 404 | リソース未検出 |
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 権限不足 |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 |
| `GITHUB_API_ERROR` | 500 | GitHub API エラー |
| `AGENT_EXECUTION_FAILED` | 500 | Agent実行失敗 |

---

## レート制限

### 制限値

- **認証済みユーザー**: 60 requests/minute
- **バースト**: 10 requests/second

### レスポンスヘッダー

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1698019200
```

### 超過時のレスポンス

**`429 Too Many Requests`**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 60 seconds.",
    "details": {
      "limit": 60,
      "reset_at": "2025-10-24T09:00:00Z"
    }
  }
}
```

---

## 次のステップ

- [x] Task 0.3.1: システムアーキテクチャ図作成 ✅
- [x] Task 0.3.2: ER図作成 ✅
- [x] Task 0.3.3: API仕様書作成（概要版） ✅
- [ ] Task 0.3.4: ユーザーフロー図作成

**完全なOpenAPI 3.0仕様書**: 今後のフェーズで作成予定（Swagger UI統合）

---

**作成者**: Claude Code
**承認者**: （署名欄）
**承認日**: 2025-10-24

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
