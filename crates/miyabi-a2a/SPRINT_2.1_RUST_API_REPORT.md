# Sprint 2.1 Rust API Implementation - Progress Report

**日付**: 2025-10-22
**Sprint**: Phase 2.1 - Error Recovery UI (Day 6-8) - Rust API Part
**目標**: エラーリカバリー機能のRust APIエンドポイント実装

---

## 📊 実装サマリー

### 完了したタスク (Rust API: 6h / 18h)

**Task 2.1.1: リトライエンドポイント追加** ✅ (3h)
- POST `/api/tasks/:id/retry` - タスク再実行エンドポイント
- POST `/api/tasks/:id/cancel` - タスクキャンセルエンドポイント
- 型定義: `TaskRetryRequest`, `TaskRetryResponse`, `TaskCancelResponse`

**Task 2.1.2: エラー情報WebSocket配信** ✅ (3h)
- `DashboardUpdate::Error` - WebSocketエラーイベント追加
- `ErrorInfo` - エラー詳細情報構造体
- `ErrorSeverity` - 4段階の重要度レベル (Critical/High/Medium/Low)

---

## 🔧 実装詳細

### 1. Task Retry/Cancel Endpoints

**ファイル**: `crates/miyabi-a2a/src/http/routes.rs` (追加: 96行)

#### 型定義

**TaskRetryRequest**:
```rust
pub struct TaskRetryRequest {
    /// Optional reason for retry
    pub reason: Option<String>,
}
```

**TaskRetryResponse**:
```rust
pub struct TaskRetryResponse {
    /// Task ID that was retried
    pub task_id: String,
    /// Current task status after retry
    pub status: String,
    /// Response message
    pub message: String,
    /// Number of retry attempts
    pub retry_count: u32,
}
```

**TaskCancelResponse**:
```rust
pub struct TaskCancelResponse {
    /// Task ID that was cancelled
    pub task_id: String,
    /// Current task status after cancellation
    pub status: String,
    /// Response message
    pub message: String,
}
```

#### エンドポイント実装

**POST `/api/tasks/:id/retry`**:
```rust
pub async fn retry_task(
    Path(task_id): Path<String>,
    Json(payload): Json<TaskRetryRequest>,
) -> Result<Json<TaskRetryResponse>, StatusCode> {
    tracing::info!(
        "Retrying task: {} (reason: {:?})",
        task_id,
        payload.reason
    );

    Ok(Json(TaskRetryResponse {
        task_id: task_id.clone(),
        status: "retrying".to_string(),
        message: format!("Task {} has been queued for retry", task_id),
        retry_count: 1,
    }))
}
```

**POST `/api/tasks/:id/cancel`**:
```rust
pub async fn cancel_task(
    Path(task_id): Path<String>,
) -> Result<Json<TaskCancelResponse>, StatusCode> {
    tracing::info!("Cancelling task: {}", task_id);

    Ok(Json(TaskCancelResponse {
        task_id: task_id.clone(),
        status: "cancelled".to_string(),
        message: format!("Task {} has been cancelled", task_id),
    }))
}
```

**TODO (Production Implementation)**:
1. Check if task exists
2. Check if task is in failed state (for retry) / running state (for cancel)
3. Check retry count limit
4. Queue task for retry / Send cancellation signal
5. Update task status in database
6. Broadcast event via WebSocket

---

### 2. Error Info WebSocket Broadcasting

**ファイル**: `crates/miyabi-a2a/src/http/websocket.rs` (追加: 49行)

#### 型定義

**DashboardUpdate (拡張)**:
```rust
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DashboardUpdate {
    Agents { agents: Vec<Agent> },
    SystemStatus { status: SystemStatus },
    Error { error: ErrorInfo },  // 新規追加
    Ping,
}
```

**ErrorInfo**:
```rust
pub struct ErrorInfo {
    /// Unique error ID
    pub id: String,
    /// Associated task ID (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    /// Associated agent ID (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_id: Option<String>,
    /// Associated agent name (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    /// Error message
    pub message: String,
    /// Stack trace (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_trace: Option<String>,
    /// Timestamp when error occurred
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Error severity level
    pub severity: ErrorSeverity,
    /// Whether this error can be retried
    pub is_retryable: bool,
}
```

**ErrorSeverity**:
```rust
#[derive(Debug, Clone, Copy, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorSeverity {
    /// Critical error - system failure
    Critical,
    /// High severity - major functionality broken
    High,
    /// Medium severity - some functionality impaired
    Medium,
    /// Low severity - minor issue
    Low,
}
```

#### 使用例

**エラーブロードキャスト**:
```rust
let error = ErrorInfo {
    id: uuid::Uuid::new_v4().to_string(),
    task_id: Some("task-123".to_string()),
    agent_id: Some("agent-456".to_string()),
    agent_name: Some("CodeGenAgent".to_string()),
    message: "Task execution failed".to_string(),
    stack_trace: Some("... stack trace ...".to_string()),
    timestamp: chrono::Utc::now(),
    severity: ErrorSeverity::High,
    is_retryable: true,
};

ws_state.tx.send(DashboardUpdate::Error { error })?;
```

---

### 3. Server Route Registration

**ファイル**: `crates/miyabi-a2a/src/http/server.rs` (変更)

#### Route追加

```rust
use axum::{
    http::{header, HeaderValue, Method},
    routing::{get, post},  // post 追加
    Router,
};

use super::routes::{
    get_agents, get_system_status, get_events, get_workflow_dag, health_check,
    retry_task, cancel_task,  // 新規追加
};

let app = Router::new()
    .route("/health", get(health_check))
    .route("/api/agents", get(get_agents))
    .route("/api/system", get(get_system_status))
    .route("/api/events", get(get_events))
    .route("/api/workflow/dag", get(get_workflow_dag))
    // Task recovery endpoints (新規追加)
    .route("/api/tasks/:id/retry", post(retry_task))
    .route("/api/tasks/:id/cancel", post(cancel_task))
    .route("/ws", get(ws_handler))
    .with_state(ws_state)
    .layer(cors);
```

---

## ✅ コンパイル結果

**ステータス**: ✅ **成功**

```bash
$ cargo check --package miyabi-a2a

Compiling miyabi-a2a v0.1.1
warning: constant `CACHE_TTL` is never used (既存の警告)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.16s
```

- **エラー**: 0件
- **警告**: 2件 (既存の未使用定数、実装とは無関係)
- **コンパイル時間**: 6.16秒

---

## 📦 変更ファイル一覧

### 変更ファイル (3ファイル)

```
crates/miyabi-a2a/src/http/
├── routes.rs         (+96行) - retry/cancel エンドポイント追加
├── websocket.rs      (+49行) - Error broadcasting追加
└── server.rs         (+4行)  - Route登録
```

**総追加行数**: 149行

---

## 🎯 達成状況

### Rust API実装 (6h / 18h)

**完了**:
- ✅ Task 2.1.1: リトライエンドポイント追加 (3h)
- ✅ Task 2.1.2: エラー情報WebSocket配信 (3h)

**残タスク**:
- ⏳ Task 2.1.3: Frontend統合 (9h)
- ⏳ Task 2.1.4: 統合テスト (3h)

**進捗率**: 33% (6h / 18h) of Sprint 2.1

---

## 🔍 API仕様

### POST /api/tasks/:id/retry

**リクエスト**:
```json
{
  "reason": "Timeout error - retrying"
}
```

**レスポンス** (200 OK):
```json
{
  "task_id": "task-123",
  "status": "retrying",
  "message": "Task task-123 has been queued for retry",
  "retry_count": 1
}
```

### POST /api/tasks/:id/cancel

**リクエスト**: (Body不要)

**レスポンス** (200 OK):
```json
{
  "task_id": "task-456",
  "status": "cancelled",
  "message": "Task task-456 has been cancelled"
}
```

### WebSocket Error Event

**ブロードキャスト**:
```json
{
  "type": "error",
  "error": {
    "id": "uuid-here",
    "task_id": "task-123",
    "agent_id": "agent-456",
    "agent_name": "CodeGenAgent",
    "message": "Task execution failed",
    "stack_trace": "...",
    "timestamp": "2025-10-22T12:00:00Z",
    "severity": "high",
    "is_retryable": true
  }
}
```

---

## 🚀 次のステップ

**Task 2.1.3: Frontend統合** (9h)

予定実装:
1. **TypeScript型定義** (1h)
   - `TaskRetryRequest`, `TaskRetryResponse`
   - `ErrorInfo`, `ErrorSeverity`

2. **API Client実装** (2h)
   - `retryTask(taskId, reason)`
   - `cancelTask(taskId)`

3. **UI統合** (4h)
   - エラーダッシュボードにリトライボタン追加
   - エラー詳細モーダル
   - WebSocketエラーイベントハンドリング

4. **テスト** (2h)
   - 単体テスト
   - 統合テスト

---

## 📝 学習ポイント

### 成功したこと

1. **型安全なAPI設計**
   - Rust型定義がそのままJSON APIへマッピング
   - `serde`による自動シリアライゼーション

2. **WebSocketイベント拡張**
   - 既存の `DashboardUpdate` enumに容易に追加
   - JSON `tag` フィールドで型判別

3. **ドキュメント付きAPI**
   - Rustdocコメントによる自己文書化
   - TODO コメントで将来実装の明確化

### 改善点

1. **Production実装未完了**
   - 現在はモックレスポンス
   - データベース統合が必要

2. **エラーハンドリング**
   - 現在は常に200 OK
   - 404 Not Found、409 Conflict等のステータスコード実装が必要

3. **リトライロジック**
   - 実際のタスクキュー統合
   - 指数バックオフ戦略

---

**報告者**: Claude Code
**作成日**: 2025-10-22
**Sprint 2.1 Rust API**: 33%完了 (6h / 18h)

**次のマイルストーン**: Task 2.1.3 Frontend統合開始
