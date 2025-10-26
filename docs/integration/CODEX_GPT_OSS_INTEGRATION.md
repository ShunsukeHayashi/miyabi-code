# Codex × GPT-OSS-20B 統合アーキテクチャ

## 📋 概要

Codex-rsとMiyabiを統合し、GPT-OSS-20Bを使った完全自律型Agent実行システムを構築する。

**目標**: Codex UIから直接Miyabi Agentを呼び出し、Mac mini LLMサーバーで実行する統合システム

---

## 🏗️ 統合アーキテクチャ

### 現在の構造

```
┌─────────────────────────────────────────────────────────┐
│ Codex-rs (~/dev/codex/codex-rs/)                        │
│                                                          │
│ ├── miyabi-integration/                                 │
│ │   └── 既にmiyabi-agents等に依存                        │
│ │                                                        │
│ ├── miyabi-mcp-server/                                  │
│ │   └── MCP over JSON-RPC                               │
│ │                                                        │
│ └── tui/                                                 │
│     └── Codex UI                                         │
└─────────────────────────────────────────────────────────┘
        │
        │ workspace依存
        ▼
┌─────────────────────────────────────────────────────────┐
│ Miyabi-private (~/dev/miyabi-private/crates/)           │
│                                                          │
│ ├── miyabi-types/        # コア型定義                    │
│ ├── miyabi-core/         # 共通ユーティリティ             │
│ ├── miyabi-agents/       # 7 Agents実装                 │
│ ├── miyabi-github/       # GitHub API統合               │
│ ├── miyabi-worktree/     # Git Worktree管理            │
│ └── miyabi-llm/          # LLM抽象化層（新規）           │
└─────────────────────────────────────────────────────────┘
```

### 目標アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│ Codex UI (TUI/CLI)                                       │
│ - Agent実行トリガー                                       │
│ - 進捗表示                                                │
│ - 結果表示                                                │
└─────────────────────────────────────────────────────────┘
        │
        │ MCP over JSON-RPC
        ▼
┌─────────────────────────────────────────────────────────┐
│ codex-miyabi-mcp-server                                  │
│ - miyabi/* ツール提供                                     │
│ - Agent実行リクエスト処理                                  │
└─────────────────────────────────────────────────────────┘
        │
        │ miyabi-integration
        ▼
┌─────────────────────────────────────────────────────────┐
│ Miyabi Agents (miyabi-agents crate)                     │
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │CodeGenAgent │ │ ReviewAgent │ │IssueAgent   │      │
│ │             │ │             │ │             │      │
│ │ GPT-OSS-20B │ │ GPT-OSS-20B │ │ GPT-OSS-20B │ ← LLM呼び出し
│ │ 直接実行    │ │ 直接実行    │ │ 直接実行    │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
│        ↓               ↓               ↓              │
│        └───────────────┴───────────────┘              │
│                        │                                │
│                        │ miyabi-llm                     │
│                        ▼                                │
│         ┌──────────────────────────┐                   │
│         │ GPTOSSProvider           │                   │
│         │ - Mac mini接続            │                   │
│         │ - プロンプト送信           │                   │
│         └──────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
        │
        │ HTTP Request (OpenAI-compatible API)
        ▼
┌─────────────────────────────────────────────────────────┐
│ Mac mini LLM Server (192.168.3.27:11434)                │
│ - Ollama + gpt-oss:20b (16GB)                           │
│ - 並列実行対応（複数Agent同時処理）                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Codex-rs統合ポイント

### 1. `codex-miyabi-integration` crateの拡張

**場所**: `~/dev/codex/codex-rs/miyabi-integration/`

**現在の依存関係** (Cargo.toml):
```toml
[dependencies]
miyabi-agents = { workspace = true }
miyabi-core = { workspace = true }
miyabi-github = { workspace = true }
miyabi-types = { workspace = true }
```

**追加すべき依存関係**:
```toml
[dependencies]
# 既存
miyabi-agents = { workspace = true }
miyabi-core = { workspace = true }
miyabi-github = { workspace = true }
miyabi-types = { workspace = true }

# 新規追加
miyabi-llm = { path = "../../../../miyabi-private/crates/miyabi-llm" }  # GPT-OSS統合
miyabi-worktree = { workspace = true }
```

**新規実装ファイル**:

```rust
// ~/dev/codex/codex-rs/miyabi-integration/src/agent_executor.rs (新規作成)

use miyabi_agents::*;
use miyabi_llm::{GPTOSSProvider, LLMProvider};
use miyabi_types::{AgentConfig, AgentResult, Task};
use std::sync::Arc;

/// Codex統合用のAgent実行エンジン
pub struct AgentExecutor {
    llm_provider: Arc<dyn LLMProvider>,
    config: AgentConfig,
}

impl AgentExecutor {
    /// Mac mini LLMサーバーに接続
    pub async fn new_with_mac_mini(
        mac_mini_ip: &str,
        config: AgentConfig,
    ) -> Result<Self> {
        let provider = GPTOSSProvider::new_mac_mini(mac_mini_ip)?;

        Ok(Self {
            llm_provider: Arc::new(provider),
            config,
        })
    }

    /// Agent実行（統一インターフェース）
    pub async fn execute_agent(
        &self,
        agent_type: AgentType,
        task: &Task,
    ) -> Result<AgentResult> {
        use miyabi_agents::BaseAgent;

        match agent_type {
            AgentType::CodeGenAgent => {
                let agent = CodeGenAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::ReviewAgent => {
                let agent = ReviewAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::IssueAgent => {
                let agent = IssueAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::PRAgent => {
                let agent = PRAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::DeploymentAgent => {
                let agent = DeploymentAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::RefresherAgent => {
                let agent = RefresherAgent::new(self.config.clone());
                agent.execute(task).await
            }
            AgentType::CoordinatorAgent => {
                let agent = CoordinatorAgent::new(self.config.clone());
                agent.execute(task).await
            }
        }
    }

    /// 複数Agent並列実行（Worktree使用）
    pub async fn execute_agents_parallel(
        &self,
        tasks: Vec<(AgentType, Task)>,
    ) -> Result<Vec<AgentResult>> {
        use futures::future::try_join_all;

        let futures = tasks.into_iter().map(|(agent_type, task)| {
            let executor = self.clone(); // Arc<Self>にする
            async move {
                executor.execute_agent(agent_type, &task).await
            }
        });

        try_join_all(futures).await
    }
}
```

### 2. `codex-miyabi-mcp-server` crateの拡張

**場所**: `~/dev/codex/codex-rs/miyabi-mcp-server/`

**新規MCPツール追加**:

```rust
// ~/dev/codex/codex-rs/miyabi-mcp-server/src/tools.rs (新規作成)

use codex_miyabi_integration::AgentExecutor;
use jsonrpc_core::{Result as RpcResult, Value};
use serde_json::json;

/// Miyabi Agent実行ツール
pub async fn execute_miyabi_agent(
    agent_type: String,
    task_json: String,
) -> RpcResult<Value> {
    // AgentExecutor初期化
    let config = load_agent_config()?;
    let executor = AgentExecutor::new_with_mac_mini("192.168.3.27", config).await?;

    // Taskをパース
    let task: Task = serde_json::from_str(&task_json)?;

    // Agent実行
    let agent_type = parse_agent_type(&agent_type)?;
    let result = executor.execute_agent(agent_type, &task).await?;

    // 結果をJSON化
    Ok(json!({
        "status": result.status,
        "data": result.data,
        "metrics": result.metrics,
        "error": result.error,
    }))
}

/// Miyabi Issue分析ツール（IssueAgent呼び出し）
pub async fn analyze_issue(issue_number: u64) -> RpcResult<Value> {
    let config = load_agent_config()?;
    let executor = AgentExecutor::new_with_mac_mini("192.168.3.27", config).await?;

    // Issue取得
    let issue = fetch_github_issue(config.repo_owner, config.repo_name, issue_number).await?;

    // IssueAgentで分析
    let task = Task::from_issue(&issue);
    let result = executor.execute_agent(AgentType::IssueAgent, &task).await?;

    Ok(json!({
        "labels": result.data["suggested_labels"],
        "priority": result.data["priority"],
        "agent_assignment": result.data["suggested_agent"],
    }))
}

/// Miyabi コード生成ツール（CodeGenAgent呼び出し）
pub async fn generate_code(task_json: String) -> RpcResult<Value> {
    let config = load_agent_config()?;
    let executor = AgentExecutor::new_with_mac_mini("192.168.3.27", config).await?;

    let task: Task = serde_json::from_str(&task_json)?;
    let result = executor.execute_agent(AgentType::CodeGenAgent, &task).await?;

    Ok(json!({
        "files_created": result.data["files_created"],
        "files_modified": result.data["files_modified"],
        "lines_added": result.data["lines_added"],
        "commit_sha": result.data["commit_sha"],
    }))
}
```

**MCPサーバー登録** (main.rs):

```rust
// ~/dev/codex/codex-rs/miyabi-mcp-server/src/main.rs

use jsonrpc_core::IoHandler;
use jsonrpc_stdio_server::ServerBuilder;

mod tools;

#[tokio::main]
async fn main() {
    let mut io = IoHandler::new();

    // Miyabi Agent実行ツール
    io.add_async_method("miyabi/execute_agent", |params| async move {
        let agent_type: String = params.parse().unwrap();
        let task_json: String = params.parse().unwrap();
        tools::execute_miyabi_agent(agent_type, task_json).await
    });

    // Miyabi Issue分析ツール
    io.add_async_method("miyabi/analyze_issue", |params| async move {
        let issue_number: u64 = params.parse().unwrap();
        tools::analyze_issue(issue_number).await
    });

    // Miyabi コード生成ツール
    io.add_async_method("miyabi/generate_code", |params| async move {
        let task_json: String = params.parse().unwrap();
        tools::generate_code(task_json).await
    });

    // MCPサーバー起動
    let server = ServerBuilder::new(io)
        .build();

    tracing::info!("Miyabi MCP Server started");
    server.await.unwrap();
}
```

### 3. Codex-rsのWorkspace Cargo.tomlの更新

**場所**: `~/dev/codex/codex-rs/Cargo.toml`

**miyabi-llm crateへのパス追加**:

```toml
[workspace.dependencies]
# 既存のMiyabi crates
miyabi-agents = { path = "../../miyabi-private/crates/miyabi-agents" }
miyabi-core = { path = "../../miyabi-private/crates/miyabi-core" }
miyabi-github = { path = "../../miyabi-private/crates/miyabi-github" }
miyabi-types = { path = "../../miyabi-private/crates/miyabi-types" }
miyabi-worktree = { path = "../../miyabi-private/crates/miyabi-worktree" }

# 新規追加
miyabi-llm = { path = "../../miyabi-private/crates/miyabi-llm" }  # ← 追加
```

---

## 🚀 実装ステップ

### Phase 1: miyabi-llm crateの完成（Miyabi-privateリポジトリ）

**場所**: `~/dev/miyabi-private/crates/miyabi-llm/`

**実装項目**:

1. ✅ `GPTOSSProvider` の基本実装（完了）
2. ✅ Mac mini接続メソッド（完了）
3. ⏳ `LLMPromptTemplate` 実装（次のステップ）
4. ⏳ `LLMContext` + `LLMConversation` 実装
5. ⏳ プロンプトテンプレートライブラリ作成

**コマンド**:

```bash
cd ~/dev/miyabi-private/crates/miyabi-llm

# 新規モジュール作成
mkdir -p src/prompt src/context src/conversation src/prompts

# ファイル作成
touch src/prompt.rs src/context.rs src/conversation.rs
touch src/prompts/mod.rs src/prompts/codegen.rs src/prompts/review.rs
```

### Phase 2: Codex-rs統合（Codexリポジトリ）

**場所**: `~/dev/codex/codex-rs/`

**実装項目**:

1. `Cargo.toml` に `miyabi-llm` 依存追加
2. `miyabi-integration/src/agent_executor.rs` 実装
3. `miyabi-mcp-server/src/tools.rs` 実装
4. `miyabi-mcp-server/src/main.rs` 更新

**コマンド**:

```bash
cd ~/dev/codex/codex-rs

# Cargo.toml更新
# (手動で編集)

# 新規ファイル作成
touch miyabi-integration/src/agent_executor.rs
touch miyabi-mcp-server/src/tools.rs

# ビルド確認
cargo build --package codex-miyabi-integration
cargo build --package codex-miyabi-mcp-server
```

### Phase 3: Agent実装変更（Miyabi-privateリポジトリ）

**場所**: `~/dev/miyabi-private/crates/miyabi-agents/src/`

**実装項目**（各Agentファイルの変更）:

1. `codegen.rs` - `generate_code_with_llm()` メソッド追加
2. `review.rs` - `generate_review_comments_with_llm()` メソッド追加
3. `issue.rs` - `analyze_issue_with_llm()` メソッド追加
4. `pr.rs` - `generate_pr_description_with_llm()` メソッド追加
5. `deployment.rs` - `analyze_deployment_logs_with_llm()` メソッド追加
6. `refresher.rs` - `suggest_status_update_with_llm()` メソッド追加
7. `coordinator.rs` - `decompose_issue_with_llm()` メソッド追加

### Phase 4: 統合テスト

**場所**: `~/dev/codex/codex-rs/miyabi-integration/tests/`

**テストファイル作成**:

```bash
mkdir -p ~/dev/codex/codex-rs/miyabi-integration/tests
cd ~/dev/codex/codex-rs/miyabi-integration/tests

touch integration_test.rs
touch agent_execution_test.rs
touch mac_mini_connection_test.rs
```

**テスト実装例**:

```rust
// ~/dev/codex/codex-rs/miyabi-integration/tests/integration_test.rs

#[tokio::test]
#[ignore] // Mac miniが必要
async fn test_codegen_agent_with_mac_mini() {
    let config = AgentConfig {
        device_identifier: "test".to_string(),
        github_token: env::var("GITHUB_TOKEN").unwrap(),
        // ...
    };

    let executor = AgentExecutor::new_with_mac_mini("192.168.3.27", config)
        .await
        .unwrap();

    let task = Task {
        id: "test-1".to_string(),
        title: "Test code generation".to_string(),
        description: "Generate a Rust function to calculate factorial".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        // ...
    };

    let result = executor.execute_agent(AgentType::CodeGenAgent, &task).await;

    assert!(result.is_ok());
    let agent_result = result.unwrap();
    assert_eq!(agent_result.status, ResultStatus::Success);
}
```

---

## 📦 ワークフロー例

### ユーザーの操作フロー（Codex UI使用）

```bash
# 1. Codex起動
cd ~/dev/codex/codex-rs
cargo run --bin codex

# 2. Codex UI内でMiyabi Agent呼び出し
> miyabi analyze-issue 270

# 内部で実行されるフロー:
# - Codex TUI → MCP Request (miyabi/analyze_issue)
# - codex-miyabi-mcp-server → AgentExecutor::execute_agent()
# - IssueAgent::execute() → miyabi-llm → Mac mini LLM
# - 結果返却 → Codex UI表示
```

### プログラマティックな実行（Rust API使用）

```rust
use codex_miyabi_integration::AgentExecutor;
use miyabi_types::{AgentConfig, Task, AgentType, TaskType};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 設定
    let config = AgentConfig {
        device_identifier: "my-laptop".to_string(),
        github_token: std::env::var("GITHUB_TOKEN")?,
        repo_owner: Some("ShunsukeHayashi".to_string()),
        repo_name: Some("Miyabi".to_string()),
        use_worktree: true,
        // ...
    };

    // AgentExecutor初期化
    let executor = AgentExecutor::new_with_mac_mini("192.168.3.27", config).await?;

    // Taskを作成
    let task = Task {
        id: "task-270".to_string(),
        title: "Implement user authentication".to_string(),
        description: "Add JWT-based authentication system".to_string(),
        task_type: TaskType::Feature,
        priority: 0,
        // ...
    };

    // CodeGenAgent実行
    let result = executor.execute_agent(AgentType::CodeGenAgent, &task).await?;

    println!("Agent execution completed!");
    println!("Status: {:?}", result.status);
    println!("Files created: {:?}", result.data["files_created"]);

    Ok(())
}
```

---

## 🎯 成功指標

### 統合要件

- ✅ Codex UIからMiyabi Agent呼び出し可能
- ✅ MCP over JSON-RPCで通信
- ✅ Mac mini LLMサーバー経由で実行
- ✅ 結果がCodex UIに表示される

### パフォーマンス要件

- ✅ MCP呼び出しオーバーヘッド: 100ms以下
- ✅ Agent実行時間: 既存と同等（30秒以内/タスク）
- ✅ 並列実行対応: 3タスク同時実行可能

### 品質要件

- ✅ cargo clippy 警告0件（Codex-rs + Miyabi-private全体）
- ✅ 統合テスト合格率 100%
- ✅ E2Eテスト（Codex UI → Mac mini LLM）成功

---

## 📚 ドキュメント更新

### Codexリポジトリ

- `~/dev/codex/INTEGRATION_PLAN_MIYABI.md` - 更新（GPT-OSS統合を追記）
- `~/dev/codex/codex-rs/miyabi-integration/README.md` - 新規作成
- `~/dev/codex/codex-rs/miyabi-mcp-server/README.md` - 更新

### Miyabi-privateリポジトリ

- `~/dev/miyabi-private/docs/CODEX_MIYABI_INTEGRATION.md` - 既存（更新）
- `~/dev/miyabi-private/docs/GPT_OSS_COMPLETE_MIGRATION_PLAN.md` - 既存（更新）
- `~/dev/miyabi-private/crates/miyabi-llm/README.md` - 更新（Codex統合セクション追加）

---

## 🚀 次のアクション

**今すぐ実行可能**:

```bash
# 1. Mac miniモデルダウンロード完了確認
ssh macmini "ollama list | grep gpt-oss"

# 2. 統合テスト実行（Miyabi-private）
cd ~/dev/miyabi-private
export MAC_MINI_IP="192.168.3.27"
cargo run --example test_mac_mini

# 3. Codex-rs workspace更新
cd ~/dev/codex/codex-rs
# Cargo.toml手動編集: miyabi-llm依存追加

# 4. ビルド確認
cargo build --package codex-miyabi-integration
```

**次の作業ステップ**:

1. ✅ Mac miniダウンロード完了待ち（残り40分）
2. ⏳ miyabi-llm crateの `LLMPromptTemplate` 実装
3. ⏳ Codex-rs workspace設定更新
4. ⏳ `AgentExecutor` 実装

---

**このドキュメントは、Codex × Miyabi × GPT-OSS-20B 統合の完全ロードマップです。**
