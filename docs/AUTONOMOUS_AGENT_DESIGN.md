# Miyabi Autonomous Agent - 完全設計ドキュメント

**バージョン**: 2.0.0
**日付**: 2025-10-25
**目標**: Codex/Claude Code を超える自律型開発フレームワーク

---

## 🌟 設計思想

### 核心原則

1. **自律性 (Autonomy)**
   - 人間の指示を最小限に、タスクを完全自動で実行
   - 失敗時の自動リトライとリカバリー
   - 状態永続化によるセッション再開

2. **安全性 (Safety)**
   - デフォルトRead-Only（破壊的操作の防止）
   - 段階的権限昇格（ReadOnly → FileEdits → FullAccess）
   - 実行前承認システム（Interactive モード）

3. **透明性 (Transparency)**
   - 全てのアクションをログ記録
   - 思考過程の可視化（Reasoning steps）
   - JSONL形式での機械可読出力

4. **拡張性 (Extensibility)**
   - Tool System による機能追加
   - 複数LLMプロバイダー対応
   - MCP (Model Context Protocol) 統合

5. **GitHub OS との融合**
   - Issue駆動開発との共存
   - Worktree ベースの並列実行
   - PR/Deploy の自動化連携

---

## 🏗️ アーキテクチャ全体像

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────────┬──────────────────┬────────────────────────┤
│  CLI (Terminal) │  REPL (Chat)     │  Web UI (Browser)      │
│  miyabi exec    │  miyabi chat     │  Agent Studio          │
└─────────────────┴──────────────────┴────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Session Management                        │
│  - Turn-by-turn conversation tracking                       │
│  - State persistence (~/.miyabi/sessions/)                  │
│  - Resume capability                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Execution Controller                       │
│  ┌─────────────┬──────────────┬─────────────────────────┐  │
│  │ Approval UI │ Tool Executor │ Output Formatter        │  │
│  │ (Safety)    │ (Action)      │ (JSONL/Human)           │  │
│  └─────────────┴──────────────┴─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      LLM Integration                         │
│  ┌──────────────┬──────────────┬─────────────────────────┐ │
│  │ Anthropic    │ Ollama       │ Groq                    │ │
│  │ Claude 3.5   │ (GPT-OSS)    │ (Llama 3)               │ │
│  └──────────────┴──────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Tool System                            │
│  - ReadFile / WriteFile / RunCommand                        │
│  - CreateIssue / CreatePR / SearchCode                      │
│  - GetGitStatus / CommitChanges / PushBranch                │
│  - ExecuteAgent (Miyabi 21 Agents)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     GitHub OS Layer                          │
│  - Issue管理 / Worktree並列実行 / PR自動作成               │
│  - Label体系 (53種) / Quality Report / DAG分解              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Crate 構成

### miyabi-llm (新規作成)

**責務**: LLM API統合と抽象化

```
crates/miyabi-llm/
├── Cargo.toml
├── src/
│   ├── lib.rs              // Public API
│   ├── client.rs           // LlmClient trait
│   ├── providers/
│   │   ├── mod.rs
│   │   ├── anthropic.rs    // Claude 3.5 Sonnet
│   │   ├── ollama.rs       // ローカルLLM (GPT-OSS)
│   │   └── groq.rs         // Groq Llama 3
│   ├── message.rs          // Message, Role, Content
│   ├── tools.rs            // Tool definition for Function Calling
│   ├── streaming.rs        // Streaming response handling
│   └── error.rs            // LlmError
└── tests/
    └── integration_test.rs
```

**主要型定義**:

```rust
pub trait LlmClient: Send + Sync {
    /// 単発の質問応答
    async fn chat(&self, messages: Vec<Message>) -> Result<String, LlmError>;

    /// ストリーミング応答
    async fn chat_stream(
        &self,
        messages: Vec<Message>,
    ) -> Result<impl Stream<Item = String>, LlmError>;

    /// Tool calls を含む構造化応答
    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse, LlmError>;
}

pub struct Message {
    pub role: Role,
    pub content: String,
}

pub enum Role {
    System,
    User,
    Assistant,
}

pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,  // JSON Schema
}

pub enum ToolCallResponse {
    /// LLMがツールを呼び出したい
    ToolCalls(Vec<ToolCall>),
    /// タスク完了（最終応答）
    Conclusion(String),
    /// ユーザー承認が必要
    NeedApproval(PendingAction),
}

pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}
```

---

### miyabi-core (拡張)

**新規追加モジュール**:

1. **`src/approval.rs`** - 承認システム
2. **`src/output.rs`** - JSONL出力
3. **`src/diff.rs`** - Diff生成と表示
4. **`src/repl.rs`** - REPLユーティリティ

---

### miyabi-cli (拡張)

**新規追加コマンド**:

1. **`src/commands/exec.rs`** - ✅ 骨格完成 → LLM統合追加
2. **`src/commands/chat.rs`** - インタラクティブREPL (新規)
3. **`src/commands/sessions.rs`** - セッション管理 (新規)

---

## 🔧 Phase 3: LLM統合 - 詳細設計

### 3.1 miyabi-llm crate 作成

**Cargo.toml**:

```toml
[package]
name = "miyabi-llm"
version = "0.1.0"
edition = "2021"

[dependencies]
# HTTP client
reqwest = { version = "0.12", features = ["json", "stream"] }
# Async runtime
tokio = { version = "1", features = ["full"] }
tokio-stream = "0.1"
# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"
# Error handling
thiserror = "2"
anyhow = "1"
# Logging
tracing = "0.1"

[dev-dependencies]
tokio-test = "0.4"
mockito = "1"
```

### 3.2 Anthropic Claude API統合

**実装**: `src/providers/anthropic.rs`

```rust
use crate::{LlmClient, Message, ToolCallResponse, ToolDefinition, LlmError};
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct AnthropicClient {
    api_key: String,
    model: String,
    client: Client,
}

impl AnthropicClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            model: "claude-3-5-sonnet-20241022".to_string(),
            client: Client::new(),
        }
    }

    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }
}

#[async_trait::async_trait]
impl LlmClient for AnthropicClient {
    async fn chat(&self, messages: Vec<Message>) -> Result<String, LlmError> {
        let request = AnthropicRequest {
            model: self.model.clone(),
            max_tokens: 4096,
            messages: messages.into_iter().map(Into::into).collect(),
        };

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&request)
            .send()
            .await?;

        let anthropic_response: AnthropicResponse = response.json().await?;

        Ok(anthropic_response.content[0].text.clone())
    }

    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse, LlmError> {
        let request = AnthropicRequest {
            model: self.model.clone(),
            max_tokens: 4096,
            messages: messages.into_iter().map(Into::into).collect(),
            tools: Some(tools.into_iter().map(Into::into).collect()),
        };

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&request)
            .send()
            .await?;

        let anthropic_response: AnthropicResponse = response.json().await?;

        // Parse tool calls from response
        if anthropic_response.stop_reason == "tool_use" {
            let tool_calls = self.parse_tool_calls(&anthropic_response)?;
            Ok(ToolCallResponse::ToolCalls(tool_calls))
        } else {
            Ok(ToolCallResponse::Conclusion(anthropic_response.content[0].text.clone()))
        }
    }
}

#[derive(Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: usize,
    messages: Vec<AnthropicMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<AnthropicTool>>,
}

#[derive(Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
    stop_reason: String,
}
```

### 3.3 Tool System実装

**実装**: `crates/miyabi-core/src/tools.rs`

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::{ExecutionMode, Result};

/// Tool definition for LLM Function Calling
#[derive(Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// Tool call from LLM
#[derive(Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}

/// Tool call result
#[derive(Clone, Serialize, Deserialize)]
pub struct ToolCallResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

/// Available tools for autonomous execution
pub struct ToolRegistry {
    mode: ExecutionMode,
}

impl ToolRegistry {
    pub fn new(mode: ExecutionMode) -> Self {
        Self { mode }
    }

    /// Get all available tools based on execution mode
    pub fn get_available_tools(&self) -> Vec<ToolDefinition> {
        let mut tools = vec![
            self.read_file_tool(),
            self.search_code_tool(),
            self.get_git_status_tool(),
        ];

        // File edits require elevated permissions
        if matches!(self.mode, ExecutionMode::FileEdits | ExecutionMode::FullAccess | ExecutionMode::Interactive) {
            tools.push(self.write_file_tool());
            tools.push(self.run_command_tool());
        }

        // Network access requires full access
        if matches!(self.mode, ExecutionMode::FullAccess) {
            tools.push(self.create_issue_tool());
            tools.push(self.create_pr_tool());
        }

        tools
    }

    /// Execute a tool call
    pub async fn execute(&self, call: &ToolCall) -> Result<ToolCallResult> {
        match call.name.as_str() {
            "read_file" => self.execute_read_file(call).await,
            "write_file" => self.execute_write_file(call).await,
            "run_command" => self.execute_run_command(call).await,
            "search_code" => self.execute_search_code(call).await,
            "get_git_status" => self.execute_get_git_status(call).await,
            "create_issue" => self.execute_create_issue(call).await,
            "create_pr" => self.execute_create_pr(call).await,
            _ => Err(format!("Unknown tool: {}", call.name).into()),
        }
    }

    // Tool definitions
    fn read_file_tool(&self) -> ToolDefinition {
        ToolDefinition {
            name: "read_file".to_string(),
            description: "Read the contents of a file".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The path to the file to read"
                    }
                },
                "required": ["path"]
            }),
        }
    }

    fn write_file_tool(&self) -> ToolDefinition {
        ToolDefinition {
            name: "write_file".to_string(),
            description: "Write content to a file (creates or overwrites)".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The path to the file to write"
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write to the file"
                    }
                },
                "required": ["path", "content"]
            }),
        }
    }

    fn run_command_tool(&self) -> ToolDefinition {
        ToolDefinition {
            name: "run_command".to_string(),
            description: "Execute a shell command".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The command to execute"
                    },
                    "args": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Arguments for the command"
                    }
                },
                "required": ["command"]
            }),
        }
    }

    // Tool implementations
    async fn execute_read_file(&self, call: &ToolCall) -> Result<ToolCallResult> {
        let path: String = serde_json::from_value(call.arguments["path"].clone())?;

        match tokio::fs::read_to_string(&path).await {
            Ok(content) => Ok(ToolCallResult {
                success: true,
                output: content,
                error: None,
            }),
            Err(e) => Ok(ToolCallResult {
                success: false,
                output: String::new(),
                error: Some(e.to_string()),
            }),
        }
    }

    async fn execute_write_file(&self, call: &ToolCall) -> Result<ToolCallResult> {
        // Check permissions
        if matches!(self.mode, ExecutionMode::ReadOnly) {
            return Ok(ToolCallResult {
                success: false,
                output: String::new(),
                error: Some("File writes not allowed in ReadOnly mode".to_string()),
            });
        }

        let path: String = serde_json::from_value(call.arguments["path"].clone())?;
        let content: String = serde_json::from_value(call.arguments["content"].clone())?;

        match tokio::fs::write(&path, &content).await {
            Ok(_) => Ok(ToolCallResult {
                success: true,
                output: format!("Successfully wrote {} bytes to {}", content.len(), path),
                error: None,
            }),
            Err(e) => Ok(ToolCallResult {
                success: false,
                output: String::new(),
                error: Some(e.to_string()),
            }),
        }
    }

    async fn execute_run_command(&self, call: &ToolCall) -> Result<ToolCallResult> {
        // Check permissions
        if matches!(self.mode, ExecutionMode::ReadOnly) {
            return Ok(ToolCallResult {
                success: false,
                output: String::new(),
                error: Some("Command execution not allowed in ReadOnly mode".to_string()),
            });
        }

        let command: String = serde_json::from_value(call.arguments["command"].clone())?;
        let args: Vec<String> = call.arguments.get("args")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        let output = tokio::process::Command::new(&command)
            .args(&args)
            .output()
            .await?;

        Ok(ToolCallResult {
            success: output.status.success(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            error: if output.status.success() {
                None
            } else {
                Some(String::from_utf8_lossy(&output.stderr).to_string())
            },
        })
    }
}
```

### 3.4 Autonomous Execution Loop実装

**実装**: `crates/miyabi-cli/src/commands/exec.rs` (update)

```rust
impl TaskExecutor {
    async fn run_autonomous(&mut self) -> Result<()> {
        // Get available tools based on execution mode
        let tool_registry = ToolRegistry::new(self.session.mode.clone());
        let available_tools = tool_registry.get_available_tools();

        // Build initial context
        let mut messages = vec![
            Message {
                role: Role::System,
                content: self.build_system_prompt(),
            },
            Message {
                role: Role::User,
                content: self.session.task.clone(),
            },
        ];

        loop {
            // Call LLM with tools
            let response = self.llm_client
                .chat_with_tools(messages.clone(), available_tools.clone())
                .await?;

            match response {
                ToolCallResponse::ToolCalls(calls) => {
                    println!("{}", "🔧 Executing tools...".cyan());

                    for call in calls {
                        // Execute tool
                        let result = tool_registry.execute(&call).await?;

                        // Log action to session
                        self.log_action(&call, &result);

                        // Display result
                        if result.success {
                            println!("  {} {}: {}", "✓".green(), call.name, result.output.lines().next().unwrap_or(""));
                        } else {
                            println!("  {} {}: {}", "✗".red(), call.name, result.error.unwrap_or_default());
                        }

                        // Add tool result to conversation
                        messages.push(Message {
                            role: Role::Assistant,
                            content: format!("Tool call: {}", call.name),
                        });
                        messages.push(Message {
                            role: Role::User,
                            content: format!("Tool result: {}", result.output),
                        });
                    }
                }
                ToolCallResponse::Conclusion(summary) => {
                    println!();
                    println!("{} {}", "✅".green(), summary);

                    // Mark session as completed
                    self.session.complete();
                    break;
                }
                ToolCallResponse::NeedApproval(action) => {
                    // Request user approval (Interactive mode only)
                    if !self.request_approval(&action).await? {
                        self.session.fail("User rejected action".to_string(), false);
                        return Err(CliError::ExecutionError("User aborted".to_string()));
                    }
                }
            }

            // Save session after each iteration
            self.session.save()
                .map_err(|e| CliError::SessionError(e.to_string()))?;
        }

        Ok(())
    }

    fn log_action(&mut self, call: &ToolCall, result: &ToolCallResult) {
        if let Some(turn) = self.session.turns.last_mut() {
            let action = match call.name.as_str() {
                "read_file" => Action::ReadFile {
                    path: call.arguments["path"].as_str().unwrap().to_string(),
                    success: result.success,
                    error: result.error.clone(),
                },
                "write_file" => Action::WriteFile {
                    path: call.arguments["path"].as_str().unwrap().to_string(),
                    content: call.arguments["content"].as_str().unwrap().to_string(),
                    approved: true,  // TODO: approval system
                    success: result.success,
                    error: result.error.clone(),
                },
                "run_command" => Action::RunCommand {
                    command: call.arguments["command"].as_str().unwrap().to_string(),
                    args: call.arguments.get("args")
                        .and_then(|v| serde_json::from_value(v.clone()).ok())
                        .unwrap_or_default(),
                    stdout: result.output.clone(),
                    stderr: result.error.clone().unwrap_or_default(),
                    exit_code: if result.success { 0 } else { 1 },
                    approved: true,
                },
                _ => Action::Reasoning {
                    content: format!("{}: {}", call.name, result.output),
                },
            };

            turn.actions.push(action);
        }
    }
}
```

---

## 📊 実装スケジュール

| タスク | 工数 | 担当 | 状態 |
|--------|------|------|------|
| Phase 3.1: miyabi-llm crate作成 | 1日 | 実装中 | 🟡 In Progress |
| Phase 3.2: Anthropic API統合 | 2日 | 次 | ⚪ Pending |
| Phase 3.3: Tool System実装 | 2日 | 次 | ⚪ Pending |
| Phase 3.4: Autonomous Loop実装 | 1日 | 次 | ⚪ Pending |
| Phase 4: Chat REPL | 3日 | Week 2 | ⚪ Pending |
| Phase 5: Approval System | 3日 | Week 2 | ⚪ Pending |
| Phase 6: JSONL完全対応 | 1日 | Week 3 | ⚪ Pending |

---

**次のアクション**: Phase 3.1 の実装を開始します。
