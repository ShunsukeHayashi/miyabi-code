# Claude Session Scheduler Design

**作成日**: 2025-10-23  
**作成者**: Codex CLI (GPT-5)  
**関連ドキュメント**: `docs/CLAUDE_SESSION_ORCHESTRATION_PLAN.md`

---

## 1. 目的と要求事項

Claude CLI のセッションを安全かつ効率的に共有するために、Orchestrator サービスは次の要件を満たすスケジューラ/ジョブ管理レイヤーを持つ必要がある。

1. **セッション整列性**: 同一 `session_id` に属するメッセージは順序を守り、一度に一つだけ実行する。
2. **グローバル同時実行数制御**: サービス全体で同時に走る Claude CLI プロセス数を上限 `max_concurrent_sessions` 以内に抑える。
3. **耐障害性**: プロセス強制終了や Orchestrator 再起動時にもキューに残るジョブを再実行できる。
4. **永続化と監査**: セッション・メッセージ・CLI 実行ログを永続化し、コストと実行履歴を追跡する。
5. **多チャネル統合**: Miyabi エージェント/Web UI/LINE 等の複数チャネルが同一セッションを共有しつつ、チャネルごとのポリシー (allowed tools など) を尊重する。
6. **リアルタイム通知**: 実行状態の変化を SSE/WebSocket/LINE 返信で配信できるようイベントを発火する。

---

## 2. 全体構成

```
┌─────────────────────────────────────────────┐
│                 Scheduler Layer             │
│                                             │
│  SessionStore (sqlx + SQLite/PostgreSQL)    │
│   ├─ sessions                               │
│   ├─ session_prompts                        │
│   ├─ cli_invocations                        │
│   ├─ channel_bindings                       │
│   └─ tool_policies                          │
│                                             │
│  QueueManager                               │
│   ├─ Global semaphore (tokio::Semaphore)    │
│   ├─ Per-session FIFO queues                │
│   └─ Recovery logic                         │
│                                             │
│  WorkerPool                                 │
│   ├─ Tokio tasks                            │
│   ├─ ClaudeProcess (tokio::process::Command)│
│   └─ Stream handlers (stdout/stderr)        │
└─────────────────────────────────────────────┘
```

- **SessionStore**: `sqlx` (async) で抽象化。初期は `sqlite://usage.sqlite`、本番では `postgres://` をサポート。`migrations/` ディレクトリでスキーマを管理。
- **QueueManager**: 永続化された `session_prompts` テーブルを基礎にしつつ、メモリ内構造 (`HashMap<SessionId, VecDeque<JobId>>`) を保持。再起動時は DB から再構築。
- **WorkerPool**: `tokio::spawn` で CLI プロセスを起動。グローバルセマフォを `acquire_owned` してからジョブを開始し、完了後に `permit` を返す。

---

## 3. データモデル

### 3.1 テーブル概要

| テーブル | 主キー | 説明 |
|----------|--------|------|
| `sessions` | `session_id (TEXT)` | Claude セッション単位。状態・最新レスポンス・累積コストを保存。 |
| `session_prompts` | `job_id (INTEGER AUTOINCREMENT)` | キュー化されたメッセージ/プロンプト。`session_id` FK、`status` 列を持つ。 |
| `cli_invocations` | `invocation_id (INTEGER AUTOINCREMENT)` | 実際の CLI 起動ごとのログ。exit code, duration, cost, tool usage JSON を保存。 |
| `channel_bindings` | `(session_id, channel_type, channel_ref)` | LINE や WebUI など外部チャネルからの紐づけ情報。 |
| `tool_policies` | `(session_id, tool_name)` | 許可/禁止ツール、上書きルール (allow/deny, scope)。 |

### 3.2 `session_prompts.status`

状態遷移:
- `queued`: 新規受付。開始待ち。
- `dequeued`: Worker が取り出し実行中。Orchestrator 起動時に `dequeued` を `queued` に戻してリカバリ。
- `running`: CLI プロセス起動済み。`cli_invocations` 行と紐づく。
- `succeeded`: 正常完了。レスポンス JSON を保存。
- `failed`: エラー終了。`error_type`, `stderr` を保持。
- `cancelled`: ユーザー操作または強制停止。

### 3.3 メッセージフォーマット

```json
{
  "job_id": 42,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "テストを更新して",
  "metadata": {
    "origin": "line",
    "user": "U1234567890",
    "allowed_tools": ["Bash(read-only)", "mcp__filesystem"],
    "disallowed_tools": ["Bash(git push)"]
  }
}
```

---

## 4. コンポーネント詳細

### 4.1 SessionStore
- `SessionStore::enqueue_prompt(prompt: NewPrompt) -> Result<JobId>`
- `SessionStore::fetch_next_jobs(limit: usize) -> Vec<Job>`: `queued` 状態をセッション ID でグルーピングし、一つずつ取得。
- `SessionStore::mark_running(job_id, invocation_id)` / `mark_finished(job_id, outcome)`
- `SessionStore::recover_stale_jobs(max_age: Duration)`
- スキーマ管理には `sqlx::migrate!` を用いる。

### 4.2 QueueManager
- メモリ内: `HashMap<SessionId, VecDeque<JobId>>`
- 起動時: DB から `queued` ジョブを読み込み `VecDeque` を構築。
- `QueueManager::tick()` で実行可能な `Job` を選択:
  1. 断続中 (別ジョブ実行中) のセッションをスキップ。
  2. 実行可能なセッションから最古のジョブをポップし、`SessionStore::mark_dequeued(job_id)` を呼ぶ。
  3. グローバルセマフォを取得できれば Worker に渡す。
- `QueueManager::release(session_id)` でセッションロック解除。

### 4.3 WorkerPool & ClaudeProcess
- `WorkerHandle` は `Job` と `permit` を保持。
- CLI 実行フロー:
  1. 一時ディレクトリ (作業コピー) を準備。
  2. `claude` CLI を `tokio::process::Command` で実行 (`--resume` or `-p` + JSON 入力)。
  3. 標準出力を `serde_json::Value` へパース、`session_id` 更新。
  4. `cli_invocations` に記録し、`SessionStore::mark_finished` を呼ぶ。
  5. `QueueManager::release(session_id)`。
- エラー処理: `Timeout` や `ExitStatus` 異常は `failed` 状態にし、リトライポリシー (最大3回など) を適用。

### 4.4 イベント配信
- 状態変更ごとに `EventBus::publish(Event)` を呼び、SSE/WebSocket/LINE へ配信。
- `Event` 例: `JobStarted`, `JobCompleted`, `JobFailed`, `SessionCostUpdated`。

---

## 5. リカバリ戦略

1. Orchestrator 起動時に `session_prompts` で `dequeued`/`running` 状態のレコードを検索。
2. `running` で `updated_at` が閾値を超えたものは `queued` に戻して再実行。
3. `cli_invocations` に最後の更新が残っている場合、二重実行を避けるため `idempotency_key` を比較しつつステータスを決定。
4. グローバルセマフォのカウントはプロセス再起動時に自動リセットされるので、DB 状態のみで制御。

---

## 6. API・モジュール設計

```
crates/miyabi-orchestrator/src/
├── main.rs               # Axum 起動・依存注入
├── config.rs             # CLI + .env 読み込み
├── scheduler/
│   ├── mod.rs            # public エクスポート
│   ├── queue.rs          # QueueManager 実装
│   ├── store.rs          # SessionStore (sqlx)
│   ├── worker.rs         # WorkerPool + ClaudeProcess
│   └── models.rs         # Job/Session/Invocation structs
├── api/
│   ├── router.rs         # Axum Router 初期化
│   ├── sessions.rs       # POST /sessions, GET /sessions/{id}
│   ├── prompts.rs        # POST /sessions/{id}/messages
│   └── events.rs         # SSE/WebSocket エンドポイント
└── telemetry/
    ├── metrics.rs        # Prometheus Collector
    └── events.rs         # EventBus 実装
```

- ファイル分割でモジュール化、テスト容易性を確保。
- `SessionStore` のユニットテストには `sqlx::SqlitePoolOptions::new().connect_lazy()` を使用。

---

## 7. 実装マイルストーン

1. **Milestone A**: `SessionStore` + `QueueManager` + `/healthz` 拡張 (`GET /sessions` でステータス確認)。
2. **Milestone B**: CLI 実行 Worker とジョブ状態遷移を実装。`cargo test -p miyabi-orchestrator` にユニットテスト追加。
3. **Milestone C**: SSE/SSEイベント配信と外部APIジョブ投入 (`POST /sessions/{id}/messages`)。
4. **Milestone D**: リカバリロジック、コスト集計、Prometheus `/metrics` 搭載。
5. **Milestone E**: LINE/WebUI 連携のための API 認可・レートリミット実装。

---

## 8. 運用ポリシー決定事項

### 8.1 再試行ポリシー

**基本方針**:
- リトライ回数: 最大3回
- バックオフ戦略: Exponential backoff（1秒 → 2秒 → 4秒 → 最大60秒）
- リトライ可能エラー: `timeout`, `claude_cli_crash`, `network_error`
- リトライ不可エラー: `invalid_tool`, `permission_denied`, `user_cancelled`

**ツール種別ごとの扱い**:
- `Bash(git push)`: リトライNG（べき等性なし）
- `Read/Grep/Glob`: リトライOK（べき等）
- `Write/Edit`: リトライ時の diff チェック必須

**実装場所**: `scheduler/worker.rs` + `models.rs::RetryPolicy`

**データモデル**:
```rust
pub struct RetryPolicy {
    pub max_attempts: u8,           // 最大3回
    pub initial_backoff_ms: u64,    // 1000ms
    pub backoff_multiplier: f64,    // 2.0
    pub max_backoff_ms: u64,        // 60000ms
}
```

---

### 8.2 コスト算出元

**Phase 1**: Claude CLI の `--json` 出力のみ（input/output tokens）

**データソース**:
```json
{
  "source": "claude_cli_json",
  "input_tokens": 1500,
  "output_tokens": 300,
  "cache_creation_tokens": 0,
  "cache_read_tokens": 1200,
  "model": "claude-sonnet-4-20250514",
  "cost_usd": 0.0234
}
```

**Phase 2**: Anthropic API レシート確認（`X-Request-Id` 経由）

**Phase 3**: 差異検出とアラート（5%以上の乖離で警告）

**実装場所**: `scheduler/worker.rs::parse_cli_output()` + `api/sessions.rs::GET /sessions/{id}/cost`

**`cli_invocations` テーブル拡張**:
```sql
ALTER TABLE cli_invocations ADD COLUMN cost_usd REAL;
ALTER TABLE cli_invocations ADD COLUMN input_tokens INTEGER;
ALTER TABLE cli_invocations ADD COLUMN output_tokens INTEGER;
ALTER TABLE cli_invocations ADD COLUMN cache_read_tokens INTEGER;
```

---

### 8.3 セッション保持ポリシー

**保持期間**:
- アーカイブ: 30日後（`last_active_at` 基準）
- 削除: 1年後（アーカイブ済みセッション）
- 自動クリーンアップ: Daily cron job（毎日0時UTC）
- 保持ラベル: `important`, `audit` ラベル付きは**永久保持**

**トリガー**:
- 自動: `scheduler/cleanup.rs` の daily job
- 手動: `DELETE /sessions/{id}?archive=true`

**実装場所**: `scheduler/cleanup.rs` + `api/sessions.rs::DELETE`

**データモデル**:
```rust
pub struct SessionRetentionPolicy {
    pub archive_after_days: u32,    // 30
    pub delete_after_days: u32,     // 365
    pub protected_labels: Vec<String>, // ["important", "audit"]
}
```

**`sessions` テーブル拡張**:
```sql
ALTER TABLE sessions ADD COLUMN archived_at TIMESTAMP NULL;
ALTER TABLE sessions ADD COLUMN labels TEXT NULL; -- JSON array
```

---

### 8.4 機密情報の取り扱い

**Phase 1**: Regex ベースのマスキング（`***MASKED***`）

**マスキング対象**:
- GitHub token: `ghp_[A-Za-z0-9]{36}`
- Anthropic API key: `sk-ant-api[A-Za-z0-9-]+`
- OAuth token: `Bearer [A-Za-z0-9._-]+`
- AWS access key: `\b[A-Z0-9]{20}\b`
- SSH private key: `-----BEGIN .* PRIVATE KEY-----`

**Phase 2**: AWS KMS/Google Secret Manager 統合

**Phase 3**: End-to-End 暗号化（チャネル側で復号）

**実装場所**: `scheduler/store.rs::mask_sensitive()` + `telemetry/events.rs`

**適用箇所**:
1. `session_prompts.prompt` - ユーザー入力
2. `cli_invocations.stdout` / `stderr` - CLI出力
3. `EventBus` イベントペイロード
4. Prometheus メトリクスラベル（セッションID以外）

**マスキング関数**:
```rust
pub fn mask_sensitive(text: &str) -> String {
    let patterns = [
        (r"ghp_[A-Za-z0-9]{36}", "***GITHUB_TOKEN***"),
        (r"sk-ant-api[A-Za-z0-9-]+", "***ANTHROPIC_KEY***"),
        (r"Bearer [A-Za-z0-9._-]+", "Bearer ***MASKED***"),
        (r"\b[A-Z0-9]{20}\b", "***AWS_ACCESS_KEY***"),
    ];

    let mut result = text.to_string();
    for (pattern, replacement) in patterns {
        result = Regex::new(pattern).unwrap().replace_all(&result, replacement).to_string();
    }
    result
}
```

---

### 8.5 チャネルポリシー

**チャネルごとの初期設定**:

| チャネル | allowed_tools | disallowed_tools |
|---------|---------------|------------------|
| **LINE** | Read, Grep, Bash(read-only) | Write, Edit, Bash(git push) |
| **WebUI** | Read, Write, Edit, Bash(safe) | Bash(rm -rf) |
| **Miyabi CLI** | **ALL** | なし（フル権限） |

**上書きルール**: `tool_policies.scope` 列で制御
- `global`: 全セッション適用
- `channel`: チャネル単位
- `session`: セッション単位（最優先）

**実装場所**: `scheduler/store.rs::check_tool_policy()` + `api/prompts.rs::POST /messages`

**`tool_policies` テーブルスキーマ**:
```sql
CREATE TABLE tool_policies (
    policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NULL,          -- NULL = global/channel policy
    channel_type TEXT NULL,        -- "line", "webui", "miyabi_cli"
    tool_name TEXT NOT NULL,       -- "Bash", "Write", etc.
    action TEXT NOT NULL,          -- "allow", "deny"
    scope TEXT NOT NULL,           -- "global", "channel", "session"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, tool_name)
);
```

**ポリシー評価順序**:
1. Session-specific policy (最優先)
2. Channel-specific policy
3. Global policy
4. Default (Miyabi CLIのみ全許可、他は制限)

**検証ロジック**:
```rust
pub fn check_tool_allowed(
    session_id: &str,
    channel_type: &str,
    tool_name: &str,
) -> Result<bool, PolicyError> {
    // 1. Session-specific
    if let Some(policy) = get_policy(session_id, tool_name, "session") {
        return Ok(policy.action == "allow");
    }

    // 2. Channel-specific
    if let Some(policy) = get_policy(NULL, tool_name, "channel") {
        return Ok(policy.action == "allow");
    }

    // 3. Global
    if let Some(policy) = get_policy(NULL, tool_name, "global") {
        return Ok(policy.action == "allow");
    }

    // 4. Default
    Ok(channel_type == "miyabi_cli")
}
```

---

この設計を基に `miyabi-orchestrator` crate にスケジューラを実装し、Phase 1〜2 の開発を開始する。
