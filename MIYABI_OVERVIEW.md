# Miyabi Architecture Overview
## Claude Quick Reference Document

**Last Updated**: 2025-12-07  
**Purpose**: LLM最適化された概要（新規チャット時にこのファイルを提供）

---

## 🎯 Identity

```
Name: Miyabi（雅）
Type: AI Autonomous Development Platform
Language: Rust 2021 Edition
Structure: 58 Cargo Workspace Crates + 38 MCP Servers
Vision: AIエージェント集団による完全自律開発
```

---

## 📦 Core Layer (最重要・必ず理解)

| Crate | 責務 | 依存される数 |
|-------|------|-------------|
| `miyabi-types` | 共通型・MiyabiError・Result | 全クレート |
| `miyabi-core` | 設定・初期化・基盤関数 | 50+ |
| `miyabi-llm-core` | LLMプロバイダ抽象化 | 10+ |
| `miyabi-persistence` | データ永続化 | 15+ |
| `miyabi-logging-monitor` | ログ・メトリクス | 30+ |

### 共通型 (miyabi-types)
```rust
// 全クレートで使用
pub type Result<T> = std::result::Result<T, MiyabiError>;

#[derive(Debug, thiserror::Error)]
pub enum MiyabiError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Config error: {0}")]
    Config(String),
    #[error("LLM error: {0}")]
    Llm(String),
    #[error("Agent error: {0}")]
    Agent(String),
    // ...
}
```

---

## 🤖 Agent Layer

### BaseAgent Trait (全エージェントが実装)
```rust
// crates/miyabi-agents/src/lib.rs
#[async_trait]
pub trait BaseAgent: Send + Sync {
    fn name(&self) -> &str;
    async fn execute(&self, task: Task) -> Result<AgentResult>;
}
```

### 主要エージェント

| Agent | クレート | 役割 |
|-------|---------|------|
| Coordinator (しきるん) | `miyabi-agent-coordinator` | タスク分解・オーケストレーション |
| CodeGen (カエデ) | `miyabi-agent-codegen` | コード生成・実装 |
| Review (サクラ) | `miyabi-agent-review` | コードレビュー・品質チェック |
| Issue (ツバキ) | `miyabi-agent-issue` | Issue分析・要件定義 |
| PR (ボタン) | `miyabi-agent-pr` | PR作成・マージ |

### エージェント実装パターン
```rust
pub struct MyAgent {
    config: AgentConfig,
    llm: Arc<dyn LlmProvider>,
}

impl MyAgent {
    pub fn new(config: AgentConfig, llm: Arc<dyn LlmProvider>) -> Self {
        Self { config, llm }
    }
}

#[async_trait]
impl BaseAgent for MyAgent {
    fn name(&self) -> &str { "my-agent" }
    
    async fn execute(&self, task: Task) -> Result<AgentResult> {
        // 1. タスク解析
        // 2. LLM呼び出し
        // 3. 結果整形
        Ok(AgentResult::success(json!({"status": "done"})))
    }
}
```

---

## 🔌 Infrastructure Layer

### LLM Providers (miyabi-llm)
```
miyabi-llm (facade)
├── miyabi-llm-anthropic  # Claude API
├── miyabi-llm-openai     # GPT API
└── miyabi-llm-google     # Gemini API
```

### GitHub Integration (miyabi-github)
```rust
// Octocrab経由のGitHub操作
pub struct GitHubClient { ... }

impl GitHubClient {
    pub async fn create_issue(&self, ...) -> Result<Issue>;
    pub async fn create_pr(&self, ...) -> Result<PullRequest>;
    pub async fn list_issues(&self, ...) -> Result<Vec<Issue>>;
}
```

### MCP Server (miyabi-mcp-server)
- Model Context Protocol準拠
- 38種類のツールを提供
- Claude Desktopから直接呼び出し可能

---

## 🚀 Application Layer

| Crate | 用途 |
|-------|------|
| `miyabi-cli` | CLI (`miyabi agent run coordinator`) |
| `miyabi-web-ui` | Dashboard (React/Next.js + Rust) |
| `miyabi-console` | TUI (ratatui) |
| `miyabi-desktop` | デスクトップアプリ (Tauri) |

---

## 📁 Directory Structure

```
miyabi-private/
├── crates/              # 58 Rustクレート
│   ├── miyabi-core/
│   ├── miyabi-types/
│   ├── miyabi-agents/
│   └── ...
├── mcp-servers/         # MCPサーバー (Node.js/TypeScript)
├── docs/
│   └── obsidian-vault/  # ドキュメント
├── .claude/
│   └── context/         # Claude用コンテキスト
├── CLAUDE.md            # 開発ルール (P0-P3)
└── MIYABI_OVERVIEW.md   # このファイル
```

---

## 🔄 Dependency Flow

```
Application Layer
    ↓
Agent Layer
    ↓
Infrastructure Layer
    ↓
Core Layer
```

```
miyabi-cli
    ↓
miyabi-agent-coordinator
    ↓ (uses)
├── miyabi-agent-codegen
├── miyabi-agent-review
└── miyabi-github
    ↓
miyabi-llm
    ↓
miyabi-types / miyabi-core
```

---

## ⚡ Quick Commands

```bash
# ビルド
cargo build                          # 全体
cargo build -p miyabi-agent-codegen  # 単一クレート

# テスト
cargo test --all                     # 全体
cargo test -p miyabi-types           # 単一クレート

# Lint
cargo clippy --all -- -D warnings    # 警告0必須

# フォーマット
cargo fmt --all

# 実行
cargo run --bin miyabi -- agent run coordinator --issue 123
```

---

## 🎨 Coding Conventions

### Error Handling
```rust
// ✅ Good
fn process() -> Result<String> {
    let data = fetch_data()?;
    Ok(data)
}

// ❌ Bad
fn process() -> String {
    fetch_data().unwrap()  // panic!の可能性
}
```

### Async Pattern
```rust
// 必ずtokio使用
#[tokio::main]
async fn main() -> Result<()> {
    let result = some_async_fn().await?;
    Ok(())
}
```

### Module Structure
```rust
// lib.rs
pub mod agent;
pub mod config;
pub mod error;

pub use agent::*;
pub use config::*;
pub use error::*;
```

---

## 📊 Key Metrics

- **Crates**: 58
- **MCP Servers**: 38
- **Agents**: 21+
- **Test Coverage Target**: 80%+
- **Clippy Warnings**: 0 (required)

---

## 🔗 Related Documents

- `CLAUDE.md` - 開発ルール（P0-P3優先度）
- `.claude/context/rust.md` - Rust詳細ガイド
- `.claude/context/agents.md` - エージェント詳細
- `docs/obsidian-vault/` - 全ドキュメント

---

*このファイルは新規Claudeチャット開始時に提供し、プロジェクトコンテキストを即座に注入するために使用します。*
