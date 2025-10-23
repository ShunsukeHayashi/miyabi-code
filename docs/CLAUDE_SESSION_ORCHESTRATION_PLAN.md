# Claude Session Orchestration Roadmap

**作成日**: 2025-10-23  
**作成者**: Codex CLI (GPT-5)  
**対象リポジトリ**: `miyabi-private`

---

## 1. 現状整理 (2025-10-23 時点)

### 1.1 Rust ワークスペース
- `Cargo.toml` で 14 crates を包括 (`miyabi-core`, `miyabi-types`, `miyabi-cli`, `miyabi-agents`, `miyabi-mcp-server`, `miyabi-business-agents` など)。
- `miyabi-cli`: CLI エントリーポイント。`commands/agent.rs` で agent 実行と JSON-RPC 経由の制御を実装。
- `miyabi-mcp-server`: MCP transport (`stdio` / `http`) を抽象化。CLI から起動する Rust MCP サーバー。
- `miyabi-github`, `miyabi-worktree`, `miyabi-llm`: GitHub API、Git worktree 並列化、LLM 呼び出しを担当。

### 1.2 TypeScript / Node.js レイヤー
- `scripts/tools/claude-headless.ts`: `claude` CLI を headless 実行し、`.claude/mcp.json` で宣言された MCP サーバーと接続。
- `docs/CLAUDE_HEADLESS_MODE.md`: CLI ベースのヘッドレス操作手順を整理。
- `api/`: Supabase/Stripe と統合する Next.js ベースの Marketplace API。
- `services/context-api/`: Claude から参照する文脈生成サービス (`FastAPI` ベース)。

### 1.3 MCP / 設定
- `.claude/mcp.json`: `filesystem`, `miyabi`, `github-enhanced`, `ide-integration`, `project-context` などの MCP サーバーを登録。
- `.claude/mcp-servers/`: Node.js/Tsx ベースの MCP 実装 (`project-context.cjs`, `github-enhanced.cjs` など)。
- `docs/WEBUI_DASHBOARD_IMPLEMENTATION_GUIDE.md`: 既存ダッシュボード (Next.js) の実装ガイド。

### 1.4 オートメーション & ドキュメント資産
- `scripts/`: CI/CD, 並列実行 (`parallel-execution`), セッションレポートなど。
- 標準化ドキュメント: `docs/REPOSITORY_OVERVIEW.md`, `docs/MIYABI_ARCHITECTURE_V2.md`, `docs/CLAUDE_CODE_TASK_TOOL.md` 等。
- 既存の `docs/CLAUDE_CODE_TASK_TOOL.md` や `docs/WEBUI_DASHBOARD_IMPLEMENTATION_GUIDE.md` が WebUI 拡張のベースになる。

---

## 2. 目標とスコープ

### 2.1 ゴール
1. Claude CLI セッションを長期的に保持・再開できる「セッションオーケストレーター」を最上位に配置。
2. Miyabi の各エージェントから CLI セッションを制御し、ツール許可・権限制御を統合。
3. Orchestrator の状態 (稼働セッション、コスト、ジョブ進捗) を Web UI / LINE から遠隔監視・指示できるようにする。

### 2.2 スコープ
- 期間: Phase 0〜4 (6〜8 週間想定)。
- 対象: 新規 Rust サービス + API + フロント/LINE アダプタ。
- 非対象: Anthropic 側 API の拡張、既存 Marketplace や Discord 連携の大規模改修。

---

## 3. ターゲットアーキテクチャ

```
┌─────────────────────────────────────────────┐
│                Control Plane (New)           │
│                                             │
│  Claude Session Orchestrator (Rust, Axum)   │
│   • Session Store (SQLite → PostgreSQL)     │
│   • Prompt Queue (Redis/SQLite WAL)         │
│   • CLI Runner (tokio::process + claude)    │
│   • Cost Metrics (prometheus-exporter)      │
│                                             │
│   REST / gRPC API      ┌──────────────┐     │
│   WebSocket/SSE stream │  Web UI (Next) │    │
│                        └──────────────┘     │
│        ▲                                     │
│        │                                     │
│   LINE Adapter (Node/Fastify)                │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           Execution Plane (Existing)        │
│                                             │
│  miyabi-cli / miyabi-agents (Rust)          │
│  miyabi-mcp-server (Rust)                   │
│  scripts/tools/claude-headless.ts (TS)      │
│  External MCP servers (.claude/mcp.json)    │
└─────────────────────────────────────────────┘
```

- **Session Orchestrator**: Rust `axum` サービス。セッション管理、CLI プロセス制御、API 公開。
- **Session Store**: 初期は SQLite (ファイル `usage.sqlite` に統合可)、本番は PostgreSQL を想定。
- **Prompt Queue**: セッション単位に FIFO 処理。Redis を推奨 (導入難しい場合は SQLite WAL + tokio queue)。
- **Monitoring**: `prometheus` メトリクス (`claude_session_active`, `claude_prompt_latency_ms`, `anthropic_cost_usd_total`)。
- **Channel Adapters**:
  - Web UI: 既存ガイドに沿って Next.js 14 + shadcn/ui でダッシュボード構築。SSE/WS でリアルタイム監視。
  - LINE: Messaging API → Cloud Run (Fastify) → Orchestrator REST API。ユーザー ↔ セッションのマッピング。

---

## 4. 実装フェーズ詳細

### Phase 0: 着手前整備 (1 週間)
- [ ] `docs/` に現状調査を反映 (本ドキュメント)。
- [ ] `scripts/tools/claude-headless.ts` の挙動をテストし CLI 呼び出し仕様を確定。
- [ ] `.claude/mcp.json` のサニタイズ & 必須環境変数テンプレートを整理。
- Deliverables: テックデザインレビュー、CLI 実行ログ例。

### Phase 1: Orchestrator 基盤 (2 週間)
- [ ] 新 crate `crates/miyabi-orchestrator` を追加（設計詳細は `docs/CLAUDE_SESSION_SCHEDULER_DESIGN.md` を参照）。
  - `axum` または `warp` ベースの HTTP API (`POST /sessions`, `POST /sessions/{id}/messages`, `GET /sessions`).
  - `tokio::process::Command` で `claude` CLI を非同期制御。`--output-format json` を強制。
  - Session/Message schema を `sea-orm` or `sqlx` で定義。
- [ ] セッション再開 (`--resume`) と `session_id` の永続化。
- [ ] CLI プロセスの timeout/リトライ、並列実行数上限 (tokio semaphore) を実装。
- Deliverables: Orchestrator binary + README + unit tests。

### Phase 2: API / Telemetry 拡張 (1.5 週間)
- [ ] SSE / WebSocket stream (`/sessions/{id}/events`) でストリーミング応答を配信。
- [ ] `prometheus` エンドポイント (`/metrics`) と構成管理 (`/healthz`).
- [ ] ログ集約: JSON ログを [`logs/`](./logs) に保存、CloudWatch などへ forward 可能な構造に。
- [ ] 費用計算 (Claude JSON から `total_cost_usd` を抽出) と上限アラート設定。
- Deliverables: API 契約書 (OpenAPI), テレメトリダッシュボード。

### Phase 3: Miyabi 統合 (1.5 週間)
- [ ] `miyabi-cli` に orchestrator クライアントを追加し、エージェントが `session_id` を発行できるようにする。
- [ ] `miyabi-agents`: エージェントごとに `allowed_tools` ポリシーを設定し orchestrator に渡す。
- [ ] `miyabi-mcp-server`: Orchestrator 経由のリクエストでも GitHub/MCP 資産を利用できるように RPC Hook を追加。
- [ ] エージェント実行ログに session link を追記 (`ExecutionReport` に `claude_session_id` フィールド追加)。
- Deliverables: Rust integration tests (`cargo test -p miyabi-cli -- features orchestrator`), 更新された `AGENTS.md`。

### Phase 4: チャネルアダプタ (2 週間)
- **Web UI**:
  - [ ] `dashboard` プロジェクト (Next.js) に新セクション「Claude Control Plane」を追加。
  - [ ] セッション一覧 / 詳細 / リアルタイムコンソール / コストチャートを実装。
  - [ ] GitHub OAuth で認証 → orchestrator API に JWT 付与。
- **LINE Adapter**:
  - [ ] Fastify or Cloud Functions で Messaging API コールバックを処理。
  - [ ] `/new`, `/use <session>`, `/status`, `/stop` コマンドを整備。
  - [ ] Miyabi agent との紐付け (LINE user ↔ agent context) を orchestrator DB に保持。
- Deliverables: UI デモ、LINE Bot テストログ、運用 Runbook。

### Phase 5: 検証・移行 (1 週間)
- [ ] エンドツーエンドテスト (`pnpm mcp:test`, orchestrator 経由の CLI テスト)。
- [ ] 負荷テスト (同時セッション 20, プロンプト間隔 10s) で SLA 確認。
- [ ] 運用 Runbook: 障害対応、再起動手順、バックアップポリシー。
- [ ] ガードレール: `allowedTools` ブラックリスト、危険コマンドの検出。
- Deliverables: テストレポート、リリースチェックリスト更新。

---

## 5. リスクと対策

| リスク | 説明 | 対策 |
|--------|------|------|
| CLI 依存 | `claude` CLI の仕様変更で orchestrator が動作不全になる可能性 | CLI バージョンピニング (`ai-cli-versions.json`)、`claude doctor` の日次実行、互換性テストを CI に追加 |
| セッション競合 | 同一 session に複数ジョブが同時投下される | Orchestrator 側で session 単位ロック + queue 実装、API 層で冪等性キーを要求 |
| コスト暴走 | 外部チャネルからの過剰リクエスト | Rate-limit (LINE, WebUI) + コスト上限アラート + フェイルオープンで通知 |
| LINE API 障害 | LINE 側 webhook 障害時に指示が滞る | 再送バッファ (Redis)、手動 CLI フォールバック Runbook を準備 |
| セキュリティ | WebUI/LINE からの指示で危険操作が実行される | `allowedTools` をホワイトリスト方式にし、危険コマンド検知で保留 → 人間レビュー |

---

## 6. 今後 1 週間の優先アクション

1. Orchestrator crate のスケルトン生成 (`cargo new orchestrator --bin`).
2. `scripts/tools/claude-headless.ts` を参考に CLI ラッパーモジュールを Rust に移植する設計ドラフト。
3. セッションデータモデルの草案 (`Session`, `SessionMessage`, `ChannelBinding`) を `docs/schemas/` に追加。
4. WebUI ダッシュボード MVP の API 契約草案を `docs/` に追加。

---

## 7. 参考ドキュメント

- `docs/CLAUDE_HEADLESS_MODE.md`
- `docs/WEBUI_DASHBOARD_IMPLEMENTATION_GUIDE.md`
- `docs/CLAUDE_CODE_TASK_TOOL.md`
- `scripts/tools/claude-headless.ts`
- `.claude/mcp.json`

本計画に基づき、Claude セッション制御を中心とした Control Plane を構築し、Miyabi エージェントの自律性と遠隔操作性を強化する。
