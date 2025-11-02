# ARCH: Codex × Miyabi（Rust）統合 Phase 1

- date: 2025-10-16
- owner: Codex
- status: APPROVED (2025-10-17)

## 1. System Context
- Codex CLI (Rust) から Miyabi Rust Edition の各クレートを一貫APIで呼び出す
- 目的: 単一バイナリ、低レイテンシ、高信頼の実行経路

## 2. Components
- codex-cli: CLI/Command 層（`codex miyabi ...`）
- miyabi-integration: 統合レイヤー（新規）
  - `MiyabiClient`（Facade）: `execute_agent`, `status`
  - `AgentExecutor`: エージェント実行制御
  - `WorktreeManager` adapter: `miyabi-worktree` 呼び出し
- miyabi-* (submodule crates):
  - `miyabi-core`, `miyabi-agents`, `miyabi-worktree`, `miyabi-github`, `miyabi-types`, `miyabi-cli`

## 3. Boundaries & Contracts
- Input: CLI args, GitHub token, repo path
- Output: JSON stdout（status, results, errors）
- Errors: 統一的に `IntegrationError` でwrap（`thiserror`）

## 4. Interfaces (Rust, draft)
```rust
pub struct MiyabiClient { /* ... */ }

impl MiyabiClient {
    pub fn new(config: Config) -> Self { /* ... */ }
    pub async fn status(&self) -> Result<Status, IntegrationError> { /* ... */ }
    pub async fn execute_agent(
        &self,
        agent: AgentKind,
        issue: Option<u64>,
    ) -> Result<ExecutionReport, IntegrationError> { /* ... */ }
}
```

## 5. CLI Commands (draft)
- `codex miyabi status` → `MiyabiClient::status()`
- `codex miyabi agent run --type <name> --issue <N>` → `MiyabiClient::execute_agent()`

## 6. Config & Secrets
- `GITHUB_TOKEN`（`gh auth token` を推奨）
- `.env`/`.env.local` は `.gitignore` 対象

## 7. Testing Strategy
- `cargo check` / unit tests（integration レイヤー）
- CLI smoke tests（最小）
- 重要経路は `miyabi-worktree` との疎通をモック/エミュレーション

## 8. Non-Functional Requirements
- Performance: 初回起動<800ms（目安）、連続実行は<300ms（warm）
- Reliability: 一貫したエラーハンドリングと冪等性
- Observability: 構造化ログ（level, span, latency）

## 9. Open Questions
- TypeScript 版 MCP Server との共存期間の扱い
- Codex TUI への連携（Phase 2〜3）

## 10. ADRs (placeholders)
- ADR-0001: Integration Error Model
- ADR-0002: Feature Flag Strategy (Rust-first)
- ADR-0003: Worktree Parallelism Policy
