# Miyabi (Rust Edition) × Codex 統合計画書

**作成日**: 2025-10-16
**対象**: Codex CLI (Rust) ← Miyabi (Rust Edition)
**推定期間**: 3-4週間 (約22日)
**統合方式**: Rust-to-Rust Native Integration + MCP Server

---

## 📋 エグゼクティブサマリー

### 背景

Miyabiは現在、TypeScript版からRust版へ完全移行しました（v1.0.0リリース済み）。一方、Codexリポジトリには古いTypeScript版Miyabiが`codex-miyabi/`に統合されています。

**この計画では**:
1. **Rust版Miyabi**（最新v1.0.0）をCodexに統合
2. Rust-to-Rust直接連携による高性能統合
3. MCP Serverによる柔軟な拡張性

### 統合の目標

1. **高性能統合**: Rustネイティブ連携により、TypeScript版の2-3倍の速度
2. **型安全性**: コンパイル時型チェックによるランタイムエラー削減
3. **シングルバイナリ**: 依存関係なしの単一実行ファイル配布
4. **完全機能性**: Miyabiの全21 Agents（Coding 7 + Business 14）を利用可能

---

## 🏗️ アーキテクチャ設計

### 統合後の構成

```
codex/
├── codex-rs/                     # Codex Rustコア
│   ├── cli/                      # CLI エントリポイント
│   ├── core/                     # ビジネスロジック
│   ├── tui/                      # Ratatui TUI
│   ├── mcp-client/               # MCP client
│   ├── mcp-server/               # MCP server
│   └── miyabi-integration/       # ★ Miyabi統合層 (新規)
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs            # 統合API
│       │   ├── agent_bridge.rs   # Agent呼び出し
│       │   ├── mcp_server.rs     # MCP Server実装
│       │   └── cli_commands.rs   # CLIコマンド拡張
│       └── tests/
│
├── miyabi/                       # ★ Miyabi Rust版（新規）
│   ├── Cargo.toml                # Workspace設定
│   ├── crates/
│   │   ├── miyabi-types/         # コア型定義
│   │   ├── miyabi-core/          # 共通ユーティリティ
│   │   ├── miyabi-github/        # GitHub API統合
│   │   ├── miyabi-agents/        # Coding Agents (7個)
│   │   ├── miyabi-business-agents/ # Business Agents (14個)
│   │   ├── miyabi-worktree/      # Git Worktree管理
│   │   └── miyabi-cli/           # Miyabi CLI
│   └── target/
│
├── codex-miyabi/                 # TypeScript版（非推奨・削除予定）
│   └── packages/                 # 旧TypeScript実装
│
└── Cargo.toml                    # ★ Workspace root（更新）
```

### 依存関係グラフ

```
Codex CLI (Rust)
    ↓ uses
Codex Core
    ↓ depends on
miyabi-integration (new crate)
    ↓ uses
┌────────────┬─────────────┬──────────────┐
│            │             │              │
miyabi-agents miyabi-business-agents miyabi-github
    ↓            ↓              ↓
miyabi-types  miyabi-core
```

---

## 🎯 統合方式の選択

### Option 1: Cargo Workspace統合（推奨）

**方式**:
- CodexのワークスペースにMiyabi cratesを追加
- `codex-rs/miyabi-integration/`でラッパーcrate作成
- Codex CLIから直接Miyabi APIを呼び出し

**メリット**:
- ✅ コンパイル時型チェック
- ✅ 最高のパフォーマンス（関数呼び出し）
- ✅ デバッグが容易
- ✅ シングルバイナリ配布

**デメリット**:
- ❌ Codexとの結合度が高い
- ❌ Miyabiの独立性が下がる

### Option 2: MCP Server統合

**方式**:
- Miyabi CLI自体をMCP Serverとして起動
- Codexの既存MCP Clientから接続
- プロセス間通信（stdio）

**メリット**:
- ✅ 疎結合
- ✅ Miyabiの独立性維持
- ✅ 他のMCP ClientからPowered by利用可能

**デメリット**:
- ❌ プロセス間通信オーバーヘッド
- ❌ エラーハンドリングが複雑

### 推奨: ハイブリッドアプローチ

**Phase 1**: Cargo Workspace統合（高速・型安全）
**Phase 2**: MCP Server対応（拡張性）

```rust
// codex-rs/miyabi-integration/src/lib.rs
pub mod native {
    // 直接Rust API呼び出し
    pub use miyabi_agents::*;
    pub use miyabi_business_agents::*;
}

pub mod mcp {
    // MCP Server実装
    pub struct MiyabiMCPServer;
}
```

---

## 📅 実装フェーズ（詳細）

### Phase 1: Cargo Workspace統合（5-7日）

**目標**: Miyabi Rust版をCodex workspaceに追加

#### タスク 1.1: Workspace設定

```bash
cd /path/to/codex

# 1. MiyabiリポジトリをGit submoduleとして追加
git submodule add https://github.com/ShunsukeHayashi/miyabi-private.git miyabi

# 2. Cargo.toml更新
```

```toml
# codex/Cargo.toml
[workspace]
members = [
    "codex-rs/cli",
    "codex-rs/core",
    "codex-rs/tui",
    "codex-rs/mcp-client",
    "codex-rs/mcp-server",
    "codex-rs/miyabi-integration",  # 新規

    # Miyabi crates
    "miyabi/crates/miyabi-types",
    "miyabi/crates/miyabi-core",
    "miyabi/crates/miyabi-github",
    "miyabi/crates/miyabi-agents",
    "miyabi/crates/miyabi-business-agents",
    "miyabi/crates/miyabi-worktree",
]

[workspace.dependencies]
# Miyabi共通依存関係
miyabi-types = { path = "miyabi/crates/miyabi-types", version = "1.0.0" }
miyabi-core = { path = "miyabi/crates/miyabi-core", version = "1.0.0" }
miyabi-github = { path = "miyabi/crates/miyabi-github", version = "1.0.0" }
miyabi-agents = { path = "miyabi/crates/miyabi-agents", version = "1.0.0" }
miyabi-business-agents = { path = "miyabi/crates/miyabi-business-agents", version = "1.0.0" }
```

#### タスク 1.2: 統合レイヤー実装

```bash
cd codex/codex-rs
cargo new --lib miyabi-integration
```

```rust
// codex-rs/miyabi-integration/Cargo.toml
[package]
name = "miyabi-integration"
version = "0.1.0"
edition = "2021"

[dependencies]
# Miyabi crates
miyabi-types = { workspace = true }
miyabi-core = { workspace = true }
miyabi-github = { workspace = true }
miyabi-agents = { workspace = true }
miyabi-business-agents = { workspace = true }

# Codex dependencies
tokio = { version = "1.40", features = ["full"] }
async-trait = "0.1"
anyhow = "1.0"
tracing = "0.1"
```

```rust
// codex-rs/miyabi-integration/src/lib.rs
//! Miyabi Integration Layer for Codex
//!
//! This crate provides a unified API for accessing Miyabi functionality
//! from Codex CLI.

pub mod agent_bridge;
pub mod config;
pub mod cli_commands;

use miyabi_agents::BaseAgent;
use miyabi_types::{Task, AgentResult};
use anyhow::Result;

/// Unified Miyabi API for Codex
pub struct MiyabiClient {
    github_token: String,
    anthropic_key: Option<String>,
}

impl MiyabiClient {
    pub fn new(github_token: String, anthropic_key: Option<String>) -> Self {
        Self {
            github_token,
            anthropic_key,
        }
    }

    /// Execute a Miyabi agent
    pub async fn execute_agent(
        &self,
        agent_type: &str,
        task: Task,
    ) -> Result<AgentResult> {
        use miyabi_agents::*;

        match agent_type {
            "coordinator" => {
                let agent = CoordinatorAgent::new(self.github_token.clone())?;
                agent.execute(task).await
            }
            "codegen" => {
                let agent = CodeGenAgent::new(
                    self.anthropic_key.clone()
                        .ok_or_else(|| anyhow::anyhow!("ANTHROPIC_API_KEY required"))?
                )?;
                agent.execute(task).await
            }
            "review" => {
                let agent = ReviewAgent::new()?;
                agent.execute(task).await
            }
            // ... 他のagents
            _ => Err(anyhow::anyhow!("Unknown agent: {}", agent_type))
        }
    }

    /// Generate business plan (AIEntrepreneurAgent)
    pub async fn generate_business_plan(
        &self,
        input: miyabi_business_agents::types::BusinessInput,
    ) -> Result<miyabi_business_agents::types::BusinessPlan> {
        use miyabi_business_agents::strategy::AIEntrepreneurAgent;
        use miyabi_business_agents::BusinessAgent;

        let agent = AIEntrepreneurAgent::new()?;
        Ok(agent.generate_plan(&input).await?)
    }
}
```

#### タスク 1.3: Codex CLI統合

```rust
// codex-rs/cli/Cargo.toml に追加
[dependencies]
miyabi-integration = { path = "../miyabi-integration" }
```

```rust
// codex-rs/cli/src/main.rs
use miyabi_integration::MiyabiClient;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Codex CLI初期化
    // ...

    // Miyabi統合初期化
    let miyabi = MiyabiClient::new(
        std::env::var("GITHUB_TOKEN")?,
        std::env::var("ANTHROPIC_API_KEY").ok(),
    );

    // コマンドパーシング
    match command {
        "miyabi-agent" => {
            // Miyabi Agent実行
            let result = miyabi.execute_agent("coordinator", task).await?;
            println!("{:?}", result);
        }
        "miyabi-business-plan" => {
            // Business Plan生成
            let plan = miyabi.generate_business_plan(input).await?;
            println!("{}", plan.title);
        }
        _ => {
            // 既存のCodex処理
        }
    }

    Ok(())
}
```

**成果物**:
- ✅ Miyabi cratesがCodex workspaceに統合
- ✅ `miyabi-integration` crateでラッパーAPI提供
- ✅ Codex CLIから`miyabi-agent`, `miyabi-business-plan`コマンド実行可能
- ✅ シングルバイナリビルド

**検証**:
```bash
cd codex
cargo build --release

# Miyabi Agent実行
./target/release/codex miyabi-agent coordinator --issue 123

# Business Plan生成
./target/release/codex miyabi-business-plan --industry "SaaS" --budget 500000
```

---

### Phase 2: CLI拡張（3-4日）

**目標**: Codex CLIにMiyabi専用サブコマンド追加

#### タスク 2.1: サブコマンド定義

```rust
// codex-rs/miyabi-integration/src/cli_commands.rs
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "miyabi")]
#[command(about = "Miyabi autonomous agents integration", long_about = None)]
pub struct MiyabiCli {
    #[command(subcommand)]
    pub command: MiyabiCommands,
}

#[derive(Subcommand)]
pub enum MiyabiCommands {
    /// Execute a Miyabi agent
    Agent {
        /// Agent type (coordinator, codegen, review, etc.)
        #[arg(short, long)]
        agent_type: String,

        /// GitHub issue number
        #[arg(short, long)]
        issue: Option<u64>,

        /// Task description
        #[arg(short, long)]
        task: Option<String>,
    },

    /// Generate business plan
    BusinessPlan {
        /// Industry sector
        #[arg(short, long)]
        industry: String,

        /// Target market
        #[arg(short, long)]
        target_market: String,

        /// Initial budget (USD)
        #[arg(short, long)]
        budget: u64,

        /// Output file path
        #[arg(short, long, default_value = "docs/business_plan.md")]
        output: String,
    },

    /// Show Miyabi status
    Status {
        /// Show detailed status
        #[arg(short, long)]
        verbose: bool,
    },

    /// Run multiple agents in parallel
    Parallel {
        /// Issue numbers (comma-separated)
        #[arg(short, long)]
        issues: String,

        /// Concurrency level
        #[arg(short, long, default_value = "3")]
        concurrency: usize,
    },
}
```

#### タスク 2.2: コマンドハンドラー実装

```rust
// codex-rs/miyabi-integration/src/cli_commands.rs (続き)
impl MiyabiCli {
    pub async fn execute(&self, client: &MiyabiClient) -> anyhow::Result<()> {
        use MiyabiCommands::*;

        match &self.command {
            Agent { agent_type, issue, task } => {
                self.handle_agent(client, agent_type, *issue, task).await
            }
            BusinessPlan { industry, target_market, budget, output } => {
                self.handle_business_plan(client, industry, target_market, *budget, output).await
            }
            Status { verbose } => {
                self.handle_status(client, *verbose).await
            }
            Parallel { issues, concurrency } => {
                self.handle_parallel(client, issues, *concurrency).await
            }
        }
    }

    async fn handle_agent(
        &self,
        client: &MiyabiClient,
        agent_type: &str,
        issue: Option<u64>,
        task: &Option<String>,
    ) -> anyhow::Result<()> {
        println!("🤖 Executing Miyabi agent: {}", agent_type);

        let task = if let Some(issue_num) = issue {
            // GitHubからIssue取得してTask作成
            client.create_task_from_issue(issue_num).await?
        } else if let Some(desc) = task {
            // タスク説明からTask作成
            Task::from_description(desc)
        } else {
            anyhow::bail!("Either --issue or --task is required");
        };

        let result = client.execute_agent(agent_type, task).await?;

        println!("✅ Agent execution completed");
        println!("{:#?}", result);

        Ok(())
    }

    async fn handle_business_plan(
        &self,
        client: &MiyabiClient,
        industry: &str,
        target_market: &str,
        budget: u64,
        output: &str,
    ) -> anyhow::Result<()> {
        use miyabi_business_agents::types::BusinessInput;

        println!("📊 Generating business plan...");
        println!("  Industry: {}", industry);
        println!("  Target Market: {}", target_market);
        println!("  Budget: ${}", budget);

        let input = BusinessInput {
            industry: industry.to_string(),
            target_market: target_market.to_string(),
            budget,
            geography: None,
            timeframe_months: Some(24),
            context: None,
        };

        let plan = client.generate_business_plan(input).await?;

        // Markdownファイルに保存
        let markdown = format_business_plan_markdown(&plan);
        std::fs::write(output, markdown)?;

        println!("✅ Business plan generated: {}", output);
        println!("  Title: {}", plan.title);
        println!("  Recommendations: {}", plan.recommendations.len());
        println!("  KPIs: {}", plan.kpis.len());

        Ok(())
    }
}
```

**成果物**:
- ✅ `codex miyabi agent --agent-type coordinator --issue 123`
- ✅ `codex miyabi business-plan --industry SaaS --budget 500000`
- ✅ `codex miyabi status --verbose`
- ✅ `codex miyabi parallel --issues 1,2,3 --concurrency 3`

---

### Phase 3: MCP Server実装（4-5日）

**目標**: Miyabi機能をMCP Serverとして公開

#### タスク 3.1: MCP Server実装

```rust
// codex-rs/miyabi-integration/src/mcp_server.rs
use async_trait::async_trait;
use serde_json::{json, Value};
use std::collections::HashMap;

pub struct MiyabiMCPServer {
    client: MiyabiClient,
}

impl MiyabiMCPServer {
    pub fn new(github_token: String, anthropic_key: Option<String>) -> Self {
        Self {
            client: MiyabiClient::new(github_token, anthropic_key),
        }
    }

    pub fn list_tools(&self) -> Vec<MCPTool> {
        vec![
            MCPTool {
                name: "miyabi_analyze_issue".to_string(),
                description: "Analyze a GitHub issue and suggest labels".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "issue_number": { "type": "number" },
                        "repo_owner": { "type": "string" },
                        "repo_name": { "type": "string" }
                    },
                    "required": ["issue_number", "repo_owner", "repo_name"]
                }),
            },
            MCPTool {
                name: "miyabi_generate_code".to_string(),
                description: "Generate code based on task description".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "task_description": { "type": "string" },
                        "language": { "type": "string" },
                        "framework": { "type": "string" }
                    },
                    "required": ["task_description"]
                }),
            },
            MCPTool {
                name: "miyabi_review_code".to_string(),
                description: "Review code and provide quality score".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "code": { "type": "string" },
                        "language": { "type": "string" }
                    },
                    "required": ["code"]
                }),
            },
            MCPTool {
                name: "miyabi_business_plan".to_string(),
                description: "Generate 8-phase business plan".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "industry": { "type": "string" },
                        "target_market": { "type": "string" },
                        "budget": { "type": "number" }
                    },
                    "required": ["industry", "target_market", "budget"]
                }),
            },
            // ... 他のツール
        ]
    }

    pub async fn call_tool(&self, name: &str, arguments: Value) -> anyhow::Result<Value> {
        match name {
            "miyabi_analyze_issue" => self.handle_analyze_issue(arguments).await,
            "miyabi_generate_code" => self.handle_generate_code(arguments).await,
            "miyabi_review_code" => self.handle_review_code(arguments).await,
            "miyabi_business_plan" => self.handle_business_plan(arguments).await,
            _ => Err(anyhow::anyhow!("Unknown tool: {}", name)),
        }
    }

    async fn handle_analyze_issue(&self, args: Value) -> anyhow::Result<Value> {
        let issue_number = args["issue_number"].as_u64().ok_or_else(||
            anyhow::anyhow!("Missing issue_number"))?;

        // IssueAgent実行
        // ...

        Ok(json!({
            "labels": ["type:feature", "priority:high"],
            "severity": "medium",
            "estimated_hours": 8
        }))
    }

    async fn handle_business_plan(&self, args: Value) -> anyhow::Result<Value> {
        use miyabi_business_agents::types::BusinessInput;

        let input: BusinessInput = serde_json::from_value(args)?;
        let plan = self.client.generate_business_plan(input).await?;

        Ok(serde_json::to_value(plan)?)
    }
}

#[derive(Debug, Clone)]
pub struct MCPTool {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}
```

#### タスク 3.2: MCP Server起動

```rust
// codex-rs/miyabi-integration/src/bin/miyabi-mcp-server.rs
use miyabi_integration::mcp_server::MiyabiMCPServer;
use tokio::io::{AsyncBufReadExt, BufReader};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let github_token = std::env::var("GITHUB_TOKEN")?;
    let anthropic_key = std::env::var("ANTHROPIC_API_KEY").ok();

    let server = MiyabiMCPServer::new(github_token, anthropic_key);

    // stdio経由でMCP Protocol処理
    let stdin = tokio::io::stdin();
    let reader = BufReader::new(stdin);
    let mut lines = reader.lines();

    while let Some(line) = lines.next_line().await? {
        let request: serde_json::Value = serde_json::from_str(&line)?;

        let response = match request["method"].as_str() {
            Some("tools/list") => {
                let tools = server.list_tools();
                json!({
                    "result": {
                        "tools": tools
                    }
                })
            }
            Some("tools/call") => {
                let name = request["params"]["name"].as_str().unwrap();
                let args = request["params"]["arguments"].clone();
                let result = server.call_tool(name, args).await?;
                json!({
                    "result": result
                })
            }
            _ => {
                json!({
                    "error": {
                        "code": -32601,
                        "message": "Method not found"
                    }
                })
            }
        };

        println!("{}", serde_json::to_string(&response)?);
    }

    Ok(())
}
```

**Codex設定**:
```toml
# ~/.codex/config.toml
[[mcp_servers]]
name = "miyabi"
command = "/path/to/codex/target/release/miyabi-mcp-server"
env = {
    GITHUB_TOKEN = "ghp_xxx",
    ANTHROPIC_API_KEY = "sk-ant-xxx"
}
```

**成果物**:
- ✅ Miyabi MCP Server (Rust実装)
- ✅ 4つのMCP tools (analyze_issue, generate_code, review_code, business_plan)
- ✅ Codex MCPClientから呼び出し可能

---

### Phase 4: TUI統合（3-4日）

**目標**: Codex TUIにMiyabiステータス表示

#### タスク 4.1: Miyabiステータスウィジェット

```rust
// codex-rs/tui/src/widgets/miyabi_status.rs
use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};

pub struct MiyabiStatusWidget {
    agents_running: Vec<String>,
    tasks_completed: usize,
    tasks_pending: usize,
    budget_used: f64,
    budget_limit: f64,
}

impl MiyabiStatusWidget {
    pub fn render(&self, frame: &mut Frame, area: ratatui::layout::Rect) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),  // Header
                Constraint::Length(5),  // Agents
                Constraint::Length(3),  // Tasks
                Constraint::Length(3),  // Budget
                Constraint::Min(0),     // Rest
            ])
            .split(area);

        // Header
        let header = Paragraph::new("🤖 Miyabi Status")
            .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
            .block(Block::default().borders(Borders::ALL));
        frame.render_widget(header, chunks[0]);

        // Running Agents
        let agents: Vec<ListItem> = self.agents_running
            .iter()
            .map(|agent| ListItem::new(format!("▶ {}", agent)))
            .collect();
        let agents_list = List::new(agents)
            .block(Block::default().title("Running Agents").borders(Borders::ALL));
        frame.render_widget(agents_list, chunks[1]);

        // Tasks
        let tasks_text = format!(
            "Completed: {} | Pending: {}",
            self.tasks_completed, self.tasks_pending
        );
        let tasks = Paragraph::new(tasks_text)
            .block(Block::default().title("Tasks").borders(Borders::ALL));
        frame.render_widget(tasks, chunks[2]);

        // Budget
        let budget_usage = (self.budget_used / self.budget_limit * 100.0) as u16;
        let budget_color = if budget_usage > 90 {
            Color::Red
        } else if budget_usage > 70 {
            Color::Yellow
        } else {
            Color::Green
        };

        let budget_text = format!(
            "Used: ${:.2} / ${:.2} ({}%)",
            self.budget_used, self.budget_limit, budget_usage
        );
        let budget = Paragraph::new(budget_text)
            .style(Style::default().fg(budget_color))
            .block(Block::default().title("Budget").borders(Borders::ALL));
        frame.render_widget(budget, chunks[3]);
    }
}
```

**成果物**:
- ✅ Codex TUIにMiyabiステータス表示
- ✅ リアルタイムAgent実行状況
- ✅ 予算使用量表示（Circuit Breaker）

---

### Phase 5: テスト・ドキュメント（3-4日）

**目標**: 統合テスト・ドキュメント整備

#### タスク 5.1: 統合テスト

```rust
// codex-rs/miyabi-integration/tests/integration_test.rs
use miyabi_integration::MiyabiClient;
use miyabi_types::Task;

#[tokio::test]
async fn test_execute_coordinator_agent() {
    let client = MiyabiClient::new(
        std::env::var("GITHUB_TOKEN").unwrap(),
        None,
    );

    let task = Task {
        id: "test-1".to_string(),
        title: "Test task".to_string(),
        description: "Test coordinator agent".to_string(),
        // ...
    };

    let result = client.execute_agent("coordinator", task).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_business_plan_generation() {
    use miyabi_business_agents::types::BusinessInput;

    let client = MiyabiClient::new(
        std::env::var("GITHUB_TOKEN").unwrap(),
        std::env::var("ANTHROPIC_API_KEY").ok(),
    );

    let input = BusinessInput {
        industry: "SaaS".to_string(),
        target_market: "SMB".to_string(),
        budget: 100_000,
        geography: None,
        timeframe_months: Some(12),
        context: None,
    };

    let plan = client.generate_business_plan(input).await.unwrap();
    assert!(!plan.recommendations.is_empty());
}
```

#### タスク 5.2: ドキュメント

```markdown
# Miyabi Integration for Codex

## Installation

\`\`\`bash
cd codex
git submodule add https://github.com/ShunsukeHayashi/miyabi-private.git miyabi
cargo build --release
\`\`\`

## Usage

### Execute Miyabi Agent

\`\`\`bash
codex miyabi agent --agent-type coordinator --issue 123
\`\`\`

### Generate Business Plan

\`\`\`bash
codex miyabi business-plan \\
  --industry "SaaS" \\
  --target-market "Enterprise DevOps" \\
  --budget 500000 \\
  --output docs/plan.md
\`\`\`

### Use MCP Server

\`\`\`toml
# ~/.codex/config.toml
[[mcp_servers]]
name = "miyabi"
command = "miyabi-mcp-server"
\`\`\`

## Architecture

See [CODEX_INTEGRATION_PLAN_RUST.md](docs/CODEX_INTEGRATION_PLAN_RUST.md)
```

**成果物**:
- ✅ 統合テストスイート（カバレッジ80%以上）
- ✅ 統合ドキュメント
- ✅ チュートリアル
- ✅ トラブルシューティングガイド

---

## 🚀 統合後の使用例

### 例1: IssueからPRまで完全自動化

```bash
# Codex CLI経由
codex miyabi agent --agent-type coordinator --issue 42

# 内部動作:
# 1. CoordinatorAgentがIssue #42を分析
# 2. Task分解 (DAG構築)
# 3. CodeGenAgent並列実行
# 4. ReviewAgent品質チェック
# 5. PRAgent PR作成
# 6. TUIに進捗表示
```

### 例2: Business Plan生成

```bash
codex miyabi business-plan \
  --industry "SaaS / AI Automation" \
  --target-market "Enterprise DevOps teams" \
  --budget 500000 \
  --output docs/MIYABI_BUSINESS_PLAN_2025.md

# 出力:
# ✅ Business plan generated: docs/MIYABI_BUSINESS_PLAN_2025.md
#   Title: Miyabi AI DevOps Platform - Global Enterprise Expansion
#   Recommendations: 5
#   KPIs: 6
```

### 例3: 並列Agent実行

```bash
codex miyabi parallel \
  --issues 10,11,12,13,14 \
  --concurrency 3

# 内部動作:
# - 3つのWorktree作成
# - 各IssueでAgent並列実行
# - Git Worktree並列実行アーキテクチャ
# - 結果をmainにマージ
```

---

## 📊 推定コスト・工数

| Phase | 期間 | 人日 | 累計 |
|-------|------|------|------|
| Phase 1: Workspace統合 | 5-7日 | 6 | 6 |
| Phase 2: CLI拡張 | 3-4日 | 3.5 | 9.5 |
| Phase 3: MCP Server | 4-5日 | 4.5 | 14 |
| Phase 4: TUI統合 | 3-4日 | 3.5 | 17.5 |
| Phase 5: テスト・ドキュメント | 3-4日 | 3.5 | **21人日** |

**合計: 約21人日 (4.2週間 @ 1人)**

**最小構成 (MVP)**: Phase 1-2 = 9.5人日 (約2週間)

---

## ✅ 成功基準

### Phase 1完了時
- ✅ Miyabi cratesがCodex workspaceに統合
- ✅ `cargo build --workspace`が成功
- ✅ `codex miyabi agent`コマンドが動作

### Phase 3完了時
- ✅ MCP Server経由でMiyabi機能呼び出し可能
- ✅ `miyabi_business_plan` toolが動作

### 全Phase完了時
- ✅ Issue → PR完全自動化
- ✅ Business Plan生成機能
- ✅ TUIでMiyabiステータス表示
- ✅ シングルバイナリ配布
- ✅ テストカバレッジ80%以上

---

## 🔄 移行パス（TypeScript版から）

### 現在の状況

- `codex-miyabi/` に古いTypeScript版Miyabi統合済み
- Rust版Miyabi (v1.0.0) は別リポジトリ

### 移行手順

1. **Phase 0準備**:
   ```bash
   cd codex
   # TypeScript版をバックアップ
   mv codex-miyabi codex-miyabi-legacy

   # Rust版を追加
   git submodule add https://github.com/ShunsukeHayashi/miyabi-private.git miyabi
   ```

2. **段階的移行**:
   - Week 1-2: Rust版統合（Phase 1-2）
   - Week 3: TypeScript版とRust版の並行稼働
   - Week 4: TypeScript版deprecation警告
   - Week 5: TypeScript版削除

3. **互換性維持**:
   ```rust
   // 互換性ラッパー
   pub mod legacy {
       // TypeScript版API互換インターフェース
   }
   ```

---

## 📚 参考資料

- **Miyabi (Rust Edition)**: `/data/data/com.termux/files/home/projects/miyabi-private`
- **Codex CLI**: `/data/data/com.termux/files/home/projects/codex`
- **統合計画 (TypeScript版)**: `INTEGRATION_PLAN_MIYABI.md`
- **Cargo Book**: https://doc.rust-lang.org/cargo/
- **Tokio**: https://tokio.rs/

---

**作成者**: Claude (Anthropic)
**レビュワー**: TBD
**承認者**: TBD
**次回更新**: 統合開始時
