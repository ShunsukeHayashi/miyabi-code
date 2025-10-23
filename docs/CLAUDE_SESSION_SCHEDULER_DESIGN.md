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

## 8. 未決事項

- ジョブ再試行ポリシー (指数バックオフ vs 固定間隔)。
- コスト算出のソース (Claude CLI JSON vs API レシート)。
- セッション削除・アーカイブ時の保持期間ポリシー。
- 機微メッセージを扱う場合の暗号化/ログマスキング方法。

この設計を基に `miyabi-orchestrator` crate にスケジューラを実装し、Phase 1〜2 の開発を開始する。
