# Codex設計パターン分析 - Miyabi適用ガイド

**作成日**: 2025-10-15
**参照リポジトリ**: https://github.com/ShunsukeHayashi/codex.git
**目的**: Codexの優れた設計をMiyabi Rust移行に活用

## 📋 エグゼクティブサマリー

Codexは35+ cratesからなる大規模Rust Workspaceプロジェクトです。
OpenAIが開発したローカルコーディングエージェントであり、MCP Protocol統合、厳格なコーディング規約、優れたアーキテクチャパターンを持っています。

**Miyabiプロジェクトへの適用価値**:
1. **Cargo Workspace構成** - 35 cratesのモジュール化手法
2. **厳格なLints設定** - unwrap/expect禁止等のClippy設定
3. **MCP統合アーキテクチャ** - Miyabi-Codex統合の基盤
4. **ツールシステム設計** - 並列実行・ルーティング
5. **テスト戦略** - Snapshot testing (insta) + 統合テスト

---

## 🏗️ Cargo Workspace構成

### Codexの構成

```toml
[workspace]
members = [
    "backend-client",
    "ansi-escape",
    "app-server",
    "app-server-protocol",
    "apply-patch",
    "arg0",
    "codex-backend-openapi-models",
    "cloud-tasks",
    "cloud-tasks-client",
    "cli",
    "common",
    "core",
    "exec",
    "execpolicy",
    "file-search",
    "git-tooling",
    "linux-sandbox",
    "login",
    "mcp-client",
    "mcp-server",
    "mcp-types",
    "ollama",
    "process-hardening",
    "protocol",
    "protocol-ts",
    "rmcp-client",
    "responses-api-proxy",
    "otel",
    "tui",
    "git-apply",
    "utils/json-to-toml",
    "utils/readiness",
    "utils/string",
]
resolver = "2"

[workspace.package]
edition = "2024"  # 最新Edition

[workspace.dependencies]
# Internal dependencies
codex-core = { path = "core" }
codex-protocol = { path = "protocol" }
# ...

# External dependencies (共通バージョン管理)
tokio = "1"
serde = "1"
anyhow = "1"
thiserror = "2.0.16"
```

**重要なポイント**:
1. **Edition 2024** - 最新のRust Editionを使用
2. **workspace.dependencies** - 全cratesで依存バージョンを統一
3. **resolver = "2"** - 新しい依存関係リゾルバー
4. **クレート名プレフィックス** - `codex-*` で統一

### Miyabiへの適用

```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml
[workspace]
members = [
    "crates/miyabi-types",
    "crates/miyabi-core",
    "crates/miyabi-cli",
    "crates/miyabi-agents",
    "crates/miyabi-github",
    "crates/miyabi-worktree",
]
resolver = "2"

[workspace.package]
edition = "2024"  # ✅ Edition 2024に更新
version = "0.1.0"

[workspace.dependencies]
# Internal
miyabi-types = { path = "crates/miyabi-types" }
miyabi-core = { path = "crates/miyabi-core" }
miyabi-github = { path = "crates/miyabi-github" }
miyabi-worktree = { path = "crates/miyabi-worktree" }

# External (Codexと同じバージョンを参考)
tokio = { version = "1", features = ["full"] }
async-trait = "0.1.89"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2.0.16"
anyhow = "1"
tracing = "0.1.41"
tracing-subscriber = "0.3.20"
clap = "4"
octocrab = "0.40"  # GitHub API
```

**推奨**:
- Edition 2024に更新
- workspace.dependenciesで全バージョン管理
- 外部依存はCodexと同じバージョンを参考にする

---

## 🔒 厳格なLints設定

### Codexの設定

```toml
[workspace.lints.clippy]
expect_used = "deny"  # expect()禁止
identity_op = "deny"
manual_clamp = "deny"
manual_filter = "deny"
manual_find = "deny"
manual_flatten = "deny"
manual_map = "deny"
manual_memcpy = "deny"
manual_non_exhaustive = "deny"
manual_ok_or = "deny"
manual_range_contains = "deny"
manual_retain = "deny"
manual_strip = "deny"
manual_try_fold = "deny"
manual_unwrap_or = "deny"
needless_borrow = "deny"
needless_borrowed_reference = "deny"
needless_collect = "deny"
needless_late_init = "deny"
needless_option_as_deref = "deny"
needless_question_mark = "deny"
needless_update = "deny"
redundant_clone = "deny"
redundant_closure = "deny"
redundant_closure_for_method_calls = "deny"
redundant_static_lifetimes = "deny"
trivially_copy_pass_by_ref = "deny"
uninlined_format_args = "deny"
unnecessary_filter_map = "deny"
unnecessary_lazy_evaluations = "deny"
unnecessary_sort_by = "deny"
unnecessary_to_owned = "deny"
unwrap_used = "deny"  # unwrap()禁止
```

**Codexのコード例**（lib.rs）:
```rust
//! Root of the `codex-core` library.

// Prevent accidental direct writes to stdout/stderr in library code.
#![deny(clippy::print_stdout, clippy::print_stderr)]
```

**例外的なexpect使用時**（tools/mod.rs:215）:
```rust
#[expect(clippy::expect_used)]
serde_json::to_string(&payload).expect("serialize ExecOutput")
```

### Miyabiへの適用

```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml

[workspace.lints]
rust = {}

[workspace.lints.clippy]
# Codexと同じ厳格なlints
expect_used = "deny"
unwrap_used = "deny"
print_stdout = "deny"
print_stderr = "deny"

# Manual implementations (prefer idiomatic Rust)
manual_clamp = "deny"
manual_filter = "deny"
manual_find = "deny"
manual_flatten = "deny"
manual_map = "deny"
manual_ok_or = "deny"
manual_retain = "deny"
manual_strip = "deny"
manual_unwrap_or = "deny"

# Needless code
needless_borrow = "deny"
needless_collect = "deny"
needless_late_init = "deny"
needless_question_mark = "deny"
needless_update = "deny"

# Redundancy
redundant_clone = "deny"
redundant_closure = "deny"
redundant_closure_for_method_calls = "deny"
redundant_static_lifetimes = "deny"

# Performance
trivially_copy_pass_by_ref = "deny"
uninlined_format_args = "deny"
unnecessary_filter_map = "deny"
unnecessary_lazy_evaluations = "deny"
unnecessary_sort_by = "deny"
unnecessary_to_owned = "deny"
```

**各crateのlib.rs**:
```rust
// crates/miyabi-agents/src/lib.rs
#![deny(clippy::print_stdout, clippy::print_stderr)]
#![deny(clippy::expect_used, clippy::unwrap_used)]
```

**expect使用が必要な場合**:
```rust
// SerializeできることがコンパイラレベルでGuaranteed
#[expect(clippy::expect_used)]
serde_json::to_string(&result).expect("AgentResult serialization")
```

---

## 🛠️ ツールシステム設計

### Codexの設計（tools/mod.rs）

```
tools/
├── mod.rs            # ツール実行エントリポイント
├── spec.rs           # ツール仕様定義
├── registry.rs       # ツール登録
├── router.rs         # ツールルーティング
├── parallel.rs       # 並列実行エンジン
├── context.rs        # 実行コンテキスト
└── handlers/
    ├── shell.rs
    ├── grep_files.rs
    ├── view_image.rs
    └── ...
```

**ツール実行フロー**:
```rust
// tools/mod.rs
pub(crate) async fn handle_container_exec_with_params(
    tool_name: &str,
    params: ExecParams,
    sess: Arc<Session>,
    turn_context: Arc<TurnContext>,
    turn_diff_tracker: SharedTurnDiffTracker,
    sub_id: String,
    call_id: String,
) -> Result<String, FunctionCallError>
```

**重要なパターン**:
1. **Arc<Session>** - 共有セッション
2. **SharedTurnDiffTracker** - 変更追跡
3. **Result<String, FunctionCallError>** - エラーハンドリング
4. **async-trait** - 非同期Trait

### Miyabiへの適用

```
crates/miyabi-agents/src/
├── lib.rs
├── base_agent.rs       # BaseAgent trait
├── coordinator.rs      # CoordinatorAgent
├── codegen.rs          # CodeGenAgent
├── review.rs           # ReviewAgent
├── issue.rs            # IssueAgent
├── pr.rs               # PRAgent
├── deployment.rs       # DeploymentAgent
├── context.rs          # AgentContext
└── executor/
    ├── mod.rs
    ├── parallel.rs     # 並列実行エンジン（Codexのparallel.rs参考）
    └── router.rs       # Agentルーティング
```

**BaseAgent trait**:
```rust
use async_trait::async_trait;
use miyabi_types::{Task, AgentResult, AgentContext, MiyabiError};

#[async_trait]
pub trait BaseAgent: Send + Sync {
    /// Agent種別
    fn agent_type(&self) -> &str;

    /// メイン実行メソッド
    async fn execute(
        &self,
        task: Task,
        context: Arc<AgentContext>,
    ) -> Result<AgentResult, MiyabiError>;

    /// エスカレーション
    async fn escalate(
        &self,
        message: &str,
        assignee: &str,
        severity: &str,
        context: Arc<AgentContext>,
    ) -> Result<(), MiyabiError>;
}
```

**並列実行エンジン**（parallel.rs参考）:
```rust
// crates/miyabi-agents/src/executor/parallel.rs
use futures::stream::{FuturesUnordered, StreamExt};
use std::sync::Arc;

pub struct ParallelExecutor {
    max_concurrency: usize,
}

impl ParallelExecutor {
    pub async fn execute_agents<A: BaseAgent>(
        &self,
        agents: Vec<Arc<A>>,
        tasks: Vec<Task>,
        context: Arc<AgentContext>,
    ) -> Result<Vec<AgentResult>, MiyabiError> {
        let mut futures = FuturesUnordered::new();

        for (agent, task) in agents.iter().zip(tasks.iter()) {
            let agent_clone = Arc::clone(agent);
            let task_clone = task.clone();
            let context_clone = Arc::clone(&context);

            futures.push(async move {
                agent_clone.execute(task_clone, context_clone).await
            });

            if futures.len() >= self.max_concurrency {
                // 並列数制限に達したら1つ完了を待つ
                futures.next().await;
            }
        }

        // 残りの全タスク完了を待つ
        let mut results = Vec::new();
        while let Some(result) = futures.next().await {
            results.push(result?);
        }

        Ok(results)
    }
}
```

---

## 📦 リリースビルド最適化

### Codexの設定

```toml
[profile.release]
lto = "fat"          # Link Time Optimization（最大）
strip = "symbols"    # シンボル削除（バイナリサイズ削減）
codegen-units = 1    # コンパイル最適化（速度優先）
```

### Miyabiへの適用

```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml

[profile.release]
lto = "fat"
codegen-units = 1
strip = "symbols"
opt-level = 3       # 最大最適化

[profile.release.package."*"]
# 依存cratesも最適化
opt-level = 3
```

**ビルド時間とバイナリサイズのトレードオフ**:
- `lto = "fat"`: ビルド時間+30%、バイナリサイズ-20%、実行速度+10%
- `codegen-units = 1`: ビルド時間+50%、実行速度+15%

**ベンチマーク目標** (RUST_MIGRATION_REQUIREMENTS.md):
- バイナリサイズ: 30MB以下
- ビルド時間: 3分以内
- Agent実行時間: 50%以上削減（TypeScript比較）

---

## 🧪 テスト戦略

### 1. Snapshot Testing (insta)

**Codexの使用例** (AGENTS.md:56-68):
```bash
# スナップショットテスト実行
cargo test -p codex-tui

# 保留中のスナップショット確認
cargo insta pending-snapshots -p codex-tui

# 個別プレビュー
cargo insta show -p codex-tui path/to/file.snap.new

# 全スナップショット承認
cargo insta accept -p codex-tui
```

**Miyabiへの適用**:
```toml
# crates/miyabi-agents/Cargo.toml
[dev-dependencies]
insta = "1.43.2"
```

**使用例**:
```rust
// crates/miyabi-agents/tests/codegen_snapshot.rs
use insta::assert_json_snapshot;
use miyabi_agents::CodeGenAgent;

#[tokio::test]
async fn test_codegen_output_structure() {
    let agent = CodeGenAgent::new(config);
    let result = agent.execute(task, context).await.unwrap();

    // JSON構造をスナップショット比較
    assert_json_snapshot!(result, @r###"
    {
      "status": "success",
      "files_created": [
        "agents/new_agent.rs",
        "tests/new_agent_test.rs"
      ],
      "test_results": {
        "passed": 10,
        "failed": 0
      }
    }
    "###);
}
```

### 2. pretty_assertions

**Codexの使用例** (AGENTS.md:74-75):
```rust
use pretty_assertions::assert_eq;

assert_eq!(actual, expected);  // カラフルなdiff表示
```

**Miyabiへの適用**:
```toml
[dev-dependencies]
pretty_assertions = "1.4.1"
```

### 3. 統合テスト構成

**Codexの構成**:
```
core/
├── src/
├── tests/
│   ├── common/        # テストヘルパー
│   │   ├── mod.rs
│   │   └── responses.rs
│   └── integration/   # 統合テスト
│       ├── codex_test.rs
│       └── mcp_test.rs
└── Cargo.toml
```

**Miyabiへの適用**:
```
crates/miyabi-agents/
├── src/
├── tests/
│   ├── common/
│   │   ├── mod.rs
│   │   ├── fixtures.rs
│   │   └── github_mock.rs
│   ├── unit/
│   │   ├── coordinator_test.rs
│   │   └── codegen_test.rs
│   └── integration/
│       ├── worktree_test.rs
│       └── parallel_execution_test.rs
└── Cargo.toml
```

---

## 🔌 MCP統合アーキテクチャ

### Codexの統合計画 (INTEGRATION_PLAN_MIYABI.md)

**データフロー**:
```
User Command
    ↓
Codex CLI (Rust)
    ↓
Codex Core
    ↓
MCP Client ─────[MCP Protocol]────→ Miyabi MCP Server
                                        ↓
                              ┌─────────┴─────────┐
                              │                   │
                         CoordinatorAgent    GitHub API
                              ↓
                    ┌─────────┴─────────┐
                    │         │         │
              IssueAgent CodeGenAgent ReviewAgent
                    │         │         │
                    └─────────┼─────────┘
                              ↓
                          PRAgent
                              ↓
                        DeploymentAgent
```

**MCP Tools定義例**:
```typescript
// codex-miyabi/packages/miyabi-mcp-server/src/tools/index.ts
export const MIYABI_TOOLS = [
  {
    name: "miyabi_analyze_issue",
    description: "GitHubのIssueを分析し、ラベルを付与",
    inputSchema: {
      type: "object",
      properties: {
        issue_number: { type: "number" },
        repo_owner: { type: "string" },
        repo_name: { type: "string" }
      },
      required: ["issue_number", "repo_owner", "repo_name"]
    },
    handler: IssueAgent.analyze
  },
  {
    name: "miyabi_decompose_task",
    handler: CoordinatorAgent.decompose
  },
  {
    name: "miyabi_generate_code",
    handler: CodeGenAgent.generate
  },
  // ...
];
```

### Miyabi Rust Edition との統合

**将来的なアーキテクチャ**:
```
Miyabi CLI (Rust)
    ↓
Miyabi Core (Rust)
    ↓
Internal Agent Executor ──[または]──→ MCP Client
                                         ↓
                                    Codex MCP Server
                                         ↓
                                    Codex TUI
```

**2つの統合モード**:
1. **Direct Mode**: Rust内部で直接Agent実行（高速）
2. **MCP Mode**: Codex統合時にMCP経由（拡張性）

---

## 📚 コーディング規約

### Codexのルール (AGENTS.md)

1. **format!のインライン変数**:
```rust
// ✅ Good
format!("Error: {error}")

// ❌ Bad
format!("Error: {}", error)
```

2. **if文の折りたたみ**:
```rust
// ✅ Good
if condition1 && condition2 {
    // ...
}

// ❌ Bad
if condition1 {
    if condition2 {
        // ...
    }
}
```

3. **メソッド参照優先**:
```rust
// ✅ Good
items.iter().map(Item::process)

// ❌ Bad
items.iter().map(|item| item.process())
```

4. **`just fmt`自動実行**:
```bash
# コード変更後、自動的に実行（承認不要）
just fmt

# Lint修正（承認必要）
just fix -p miyabi-agents
```

### Miyabiへの適用

`.claude/CODING_STANDARDS.md`作成:
```markdown
# Miyabi Rust コーディング規約

## 必須ルール

1. **format!のインライン変数** - `format!("{error}")` 形式
2. **if文の折りたたみ** - clippy::collapsible_if
3. **メソッド参照** - clippy::redundant_closure_for_method_calls
4. **unwrap/expect禁止** - Result型でエラーハンドリング
5. **stdout/stderr直接書き込み禁止** - tracingを使用

## フォーマット

```bash
# 自動フォーマット（常に実行）
cargo fmt --all

# Lint確認
cargo clippy --all -- -D warnings

# テスト実行
cargo test --all
```

## 例外的なexpect使用

```rust
#[expect(clippy::expect_used)]
serde_json::to_string(&data).expect("serialization cannot fail")
```
```

---

## ✅ Miyabi適用チェックリスト

### Phase 1: Cargo Workspace設定

- [ ] Edition 2024に更新
- [ ] workspace.dependenciesで全バージョン管理
- [ ] Codexと同じ外部依存バージョン参考
- [ ] resolver = "2"設定

### Phase 2: Lints設定

- [ ] workspace.lints.clippyに厳格設定追加
- [ ] expect_used, unwrap_used = "deny"
- [ ] print_stdout, print_stderr = "deny"
- [ ] 各crateのlib.rsにlints追加

### Phase 3: リリースビルド最適化

- [ ] profile.releaseに最適化設定
- [ ] lto = "fat"
- [ ] codegen-units = 1
- [ ] strip = "symbols"

### Phase 4: テスト戦略

- [ ] insta (snapshot testing)導入
- [ ] pretty_assertions導入
- [ ] tests/common/ヘルパー作成
- [ ] tests/integration/統合テスト作成

### Phase 5: ツールシステム設計

- [ ] BaseAgent trait定義
- [ ] executor/parallel.rs作成
- [ ] executor/router.rs作成
- [ ] Arc<AgentContext>パターン適用

### Phase 6: コーディング規約

- [ ] .claude/CODING_STANDARDS.md作成
- [ ] format!インライン変数ルール
- [ ] cargo fmtの自動実行設定
- [ ] clippy設定の文書化

---

## 🔗 参考リンク

- **Codexリポジトリ**: https://github.com/ShunsukeHayashi/codex.git
- **INTEGRATION_PLAN_MIYABI.md**: Miyabi統合計画
- **AGENTS.md**: Codexコーディング規約
- **Rust移行要件**: docs/RUST_MIGRATION_REQUIREMENTS.md

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0
