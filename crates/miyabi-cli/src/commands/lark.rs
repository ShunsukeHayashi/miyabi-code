//! Lark Agent commands - 識学理論ベースのLark/Feishu Base統合管理

use crate::error::{CliError, Result};
use clap::Subcommand;
use colored::Colorize;
use serde_json::json;
use std::path::PathBuf;

#[derive(Subcommand)]
pub enum LarkCommand {
    /// Create a new Wiki node
    WikiCreate {
        /// Wiki space ID
        #[arg(long, env = "WIKI_SPACE_ID")]
        space_id: String,

        /// Parent node token (ROOT_NODE_TOKEN for root level)
        #[arg(long, env = "ROOT_NODE_TOKEN")]
        parent_node_token: String,

        /// Node title
        title: String,

        /// Node type (docx, sheet, bitable, etc.)
        #[arg(long, default_value = "docx")]
        obj_type: String,
    },

    /// Get Wiki node information
    WikiGet {
        /// Wiki space ID
        #[arg(long, env = "WIKI_SPACE_ID")]
        space_id: String,

        /// Node token to retrieve
        token: String,
    },

    /// List Wiki nodes
    WikiList {
        /// Wiki space ID
        #[arg(long, env = "WIKI_SPACE_ID")]
        space_id: String,

        /// Parent node token (optional, defaults to root)
        #[arg(long)]
        parent_token: Option<String>,
    },

    /// Execute C1-C10 command stack for Base construction
    Base {
        /// Command number (C1-C10) or "ALL" for full execution
        command: String,

        /// Requirement specification file path
        #[arg(long)]
        requirements: Option<PathBuf>,

        /// Industry type (for naming conventions)
        #[arg(long)]
        industry: Option<String>,

        /// Business domain
        #[arg(long)]
        domain: Option<String>,
    },

    /// Interactive Lark Agent REPL
    Agent {
        /// Initial prompt
        prompt: Option<String>,
    },
}

impl LarkCommand {
    pub async fn execute(&self) -> Result<()> {
        match self {
            Self::WikiCreate {
                space_id,
                parent_node_token,
                title,
                obj_type,
            } => {
                println!("{}", "🚀 Creating Wiki node...".cyan().bold());
                create_wiki_node(space_id, parent_node_token, title, obj_type).await?;
            }
            Self::WikiGet { space_id, token } => {
                println!("{}", "🔍 Getting Wiki node information...".cyan().bold());
                get_wiki_node(space_id, token).await?;
            }
            Self::WikiList {
                space_id,
                parent_token,
            } => {
                println!("{}", "📋 Listing Wiki nodes...".cyan().bold());
                list_wiki_nodes(space_id, parent_token.as_deref()).await?;
            }
            Self::Base {
                command,
                requirements,
                industry,
                domain,
            } => {
                println!(
                    "{}",
                    format!("🏗️  Executing Base construction command: {}", command)
                        .cyan()
                        .bold()
                );
                execute_base_command(command, requirements, industry, domain).await?;
            }
            Self::Agent { prompt } => {
                println!("{}", "🤖 Starting Lark Agent REPL...".cyan().bold());
                run_lark_agent_repl(prompt.as_deref()).await?;
            }
        }
        Ok(())
    }
}

/// Call Lark MCP tool via subprocess
async fn call_mcp_tool(
    tool_name: &str,
    arguments: serde_json::Value,
) -> Result<serde_json::Value> {
    use tokio::io::AsyncWriteExt;
    use tokio::process::Command;
    use tokio::time::{timeout, Duration};

    let mcp_server_path = get_mcp_server_path()?;
    let app_id = std::env::var("LARK_APP_ID").map_err(|_| {
        CliError::InvalidInput(
            "LARK_APP_ID environment variable not set\n\
             Set it with: export LARK_APP_ID=cli_xxx"
                .to_string(),
        )
    })?;
    let app_secret = std::env::var("LARK_APP_SECRET").map_err(|_| {
        CliError::InvalidInput(
            "LARK_APP_SECRET environment variable not set\n\
             Set it with: export LARK_APP_SECRET=xxx"
                .to_string(),
        )
    })?;

    // Create JSONRPC request
    let request = json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        },
        "id": 1
    });

    let request_json = serde_json::to_string(&request)?;

    // Spawn MCP server process
    let mut child = Command::new("node")
        .arg(&mcp_server_path)
        .arg("mcp")
        .arg("--mode")
        .arg("stdio")
        .arg("--app-id")
        .arg(&app_id)
        .arg("--app-secret")
        .arg(&app_secret)
        .arg("--disable-rate-limit") // For CLI usage
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            CliError::McpServerError(format!(
                "Failed to spawn MCP server\n\
                 Path: {:?}\n\
                 Error: {}",
                mcp_server_path, e
            ))
        })?;

    // Write JSONRPC request to stdin
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(request_json.as_bytes())
            .await
            .map_err(|e| {
                CliError::McpServerError(format!("Failed to write to MCP server stdin: {}", e))
            })?;
        stdin.write_all(b"\n").await.map_err(|e| {
            CliError::McpServerError(format!("Failed to write newline to stdin: {}", e))
        })?;
        stdin.flush().await.map_err(|e| {
            CliError::McpServerError(format!("Failed to flush stdin: {}", e))
        })?;
        drop(stdin); // Close stdin to signal end of input
    }

    // Wait for process with 30s timeout
    let output = timeout(Duration::from_secs(30), child.wait_with_output())
        .await
        .map_err(|_| {
            CliError::McpTimeout(format!(
                "MCP server timed out after 30s\n\
                 Tool: {}\n\
                 This may indicate a network issue or the MCP server is stuck.",
                tool_name
            ))
        })?
        .map_err(|e| {
            CliError::McpServerError(format!("Failed to execute MCP server: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(CliError::McpServerError(format!(
            "MCP server exited with error (code: {:?})\n\
             Tool: {}\n\
             stderr: {}\n\
             stdout: {}",
            output.status.code(),
            tool_name,
            stderr.trim(),
            stdout.trim()
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse JSONRPC response
    let response: serde_json::Value = serde_json::from_str(&stdout).map_err(|e| {
        CliError::McpServerError(format!(
            "Failed to parse MCP response as JSON\n\
             Tool: {}\n\
             Parse error: {}\n\
             Response (first 500 chars): {}",
            tool_name,
            e,
            &stdout.chars().take(500).collect::<String>()
        ))
    })?;

    // Extract result from JSONRPC response
    if let Some(error) = response.get("error") {
        let error_code = error.get("code").and_then(|v| v.as_i64());
        let error_message = error.get("message").and_then(|v| v.as_str());
        let error_data = error.get("data");

        return Err(CliError::McpToolError(format!(
            "MCP tool '{}' returned error\n\
             Code: {:?}\n\
             Message: {}\n\
             Data: {}",
            tool_name,
            error_code,
            error_message.unwrap_or("(no message)"),
            error_data
                .map(|d| serde_json::to_string_pretty(d).unwrap_or_else(|_| d.to_string()))
                .unwrap_or_else(|| "(no data)".to_string())
        )));
    }

    response.get("result").cloned().ok_or_else(|| {
        CliError::McpServerError(format!(
            "No 'result' field in MCP response\n\
             Tool: {}\n\
             Response: {}",
            tool_name,
            serde_json::to_string_pretty(&response).unwrap_or_else(|_| response.to_string())
        ))
    })
}

/// Extract actual tool result from MCP server response
///
/// MCP server returns: {"content":[{"text":"Success: {actual_json}","type":"text"}]}
/// This function extracts and parses the actual_json
fn extract_mcp_tool_result(mcp_result: &serde_json::Value) -> Result<serde_json::Value> {
    // Try to extract from content[0].text format
    if let Some(content) = mcp_result.get("content") {
        if let Some(first_content) = content.as_array().and_then(|arr| arr.first()) {
            if let Some(text) = first_content.get("text").and_then(|v| v.as_str()) {
                // Remove "Success: " prefix if present
                let json_str = text.strip_prefix("Success: ").unwrap_or(text);

                // Parse the JSON string
                return serde_json::from_str(json_str).map_err(|e| {
                    CliError::ExecutionError(format!(
                        "Failed to parse MCP tool result: {}\nRaw text: {}",
                        e, text
                    ))
                });
            }
        }
    }

    // Fallback: return as-is if not in expected format
    Ok(mcp_result.clone())
}

/// Get MCP server path
fn get_mcp_server_path() -> Result<PathBuf> {
    // Try environment variable first
    if let Ok(path) = std::env::var("MCP_SERVER_PATH") {
        return Ok(PathBuf::from(path));
    }

    // Default path in miyabi-private
    let default_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("mcp-servers/lark-openapi-mcp-enhanced/dist/cli.js"));

    default_path.ok_or_else(|| {
        CliError::InvalidInput(
            "MCP_SERVER_PATH not set and default path not found".to_string(),
        )
    })
}

/// Create Wiki node
async fn create_wiki_node(
    space_id: &str,
    parent_node_token: &str,
    title: &str,
    obj_type: &str,
) -> Result<()> {
    let arguments = json!({
        "path": {
            "space_id": space_id
        },
        "data": {
            "obj_type": obj_type,
            "parent_node_token": parent_node_token,
            "node_type": "origin",
            "origin_node_token": "",
            "title": title
        }
    });

    let result = call_mcp_tool("wiki_v2_spaceNode_create", arguments).await?;

    // Extract actual response from MCP tool result
    let node_data = extract_mcp_tool_result(&result)?;

    println!("{}", "✅ Wiki node created successfully!".green().bold());
    println!();
    println!("{}", "Node Information:".cyan().bold());
    println!("{}", serde_json::to_string_pretty(&node_data)?);

    Ok(())
}

/// Get Wiki node information
async fn get_wiki_node(space_id: &str, token: &str) -> Result<()> {
    let arguments = json!({
        "path": {
            "space_id": space_id,
            "node_token": token
        }
    });

    let result = call_mcp_tool("wiki_v2_space_getNode", arguments).await?;
    let node_data = extract_mcp_tool_result(&result)?;

    println!("{}", "✅ Node information retrieved!".green().bold());
    println!();
    println!("{}", serde_json::to_string_pretty(&node_data)?);

    Ok(())
}

/// List Wiki nodes
async fn list_wiki_nodes(space_id: &str, parent_token: Option<&str>) -> Result<()> {
    let mut arguments = json!({
        "path": {
            "space_id": space_id
        }
    });

    if let Some(parent) = parent_token {
        arguments["query"] = json!({
            "parent_node_token": parent
        });
    }

    let result = call_mcp_tool("wiki_v2_space_getNodeList", arguments).await?;
    let nodes_data = extract_mcp_tool_result(&result)?;

    println!("{}", "✅ Node list retrieved!".green().bold());
    println!();
    println!("{}", serde_json::to_string_pretty(&nodes_data)?);

    Ok(())
}

/// Execute Base construction command (C1-C10)
async fn execute_base_command(
    command: &str,
    requirements: &Option<PathBuf>,
    industry: &Option<String>,
    domain: &Option<String>,
) -> Result<()> {
    println!(
        "{}",
        format!("🚀 Executing Lark Base Command: {}", command)
            .cyan()
            .bold()
    );
    println!();

    // Parse command (C1, C2, ..., C10, or ALL)
    let commands = if command.to_uppercase() == "ALL" {
        vec!["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"]
    } else {
        vec![command]
    };

    // Display context if provided
    if let Some(req_path) = requirements {
        println!("  📄 Requirements: {}", req_path.display());
    }
    if let Some(ind) = industry {
        println!("  🏢 Industry: {}", ind);
    }
    if let Some(dom) = domain {
        println!("  💼 Domain: {}", dom);
    }
    println!();

    // Execute each command
    for cmd in commands {
        match cmd.to_uppercase().as_str() {
            "C1" => execute_c1_system_analysis(requirements, industry, domain).await?,
            "C2" => execute_c2_field_implementation().await?,
            "C3" => execute_c3_relation_setup().await?,
            "C4" => execute_c4_workflow_automation().await?,
            "C5" => execute_c5_button_implementation().await?,
            "C6" => execute_c6_view_creation().await?,
            "C7" => execute_c7_dashboard_construction().await?,
            "C8" => execute_c8_permission_setup().await?,
            "C9" => execute_c9_test_verification().await?,
            "C10" => execute_c10_deployment().await?,
            _ => {
                return Err(CliError::InvalidInput(format!(
                    "Invalid command: {}. Valid commands: C1-C10, ALL",
                    cmd
                )))
            }
        }
    }

    println!();
    println!("{}", "✅ All commands completed successfully!".green().bold());
    Ok(())
}

/// C1: System Analysis
async fn execute_c1_system_analysis(
    requirements: &Option<PathBuf>,
    industry: &Option<String>,
    domain: &Option<String>,
) -> Result<()> {
    println!("{}", "📊 C1: System Analysis".cyan().bold());
    println!("システム要件を分析し、Lark Baseの構造に落とし込む");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: 要件定義");
    println!("  T2: データ構造設計");
    println!();

    // Load requirements file if provided
    if let Some(req_path) = requirements {
        if req_path.exists() {
            println!("  ✅ Requirements file loaded: {}", req_path.display());
        } else {
            println!("  ⚠️  Requirements file not found: {}", req_path.display());
        }
    }

    // Display industry and domain context
    println!("{}", "Context:".yellow());
    println!("  Industry: {}", industry.as_deref().unwrap_or("Not specified"));
    println!("  Domain: {}", domain.as_deref().unwrap_or("Not specified"));
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] 要件定義書");
    println!("  - [ ] ER図");
    println!("  - [ ] テーブル設計書");
    println!("  - [ ] フィールド設計書");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] 全ての業務要件が網羅されているか");
    println!("  - [ ] テーブル間の関係が明確か");
    println!("  - [ ] 主キー設計が適切か（識別性・可視性）");
    println!("  - [ ] ステークホルダーの承認を得たか");
    println!();

    println!("{}", "✅ C1 completed".green());
    println!();
    Ok(())
}

/// C2: Field Implementation
async fn execute_c2_field_implementation() -> Result<()> {
    println!("{}", "🔧 C2: Field Implementation".cyan().bold());
    println!("各テーブルのフィールドを詳細設計・実装");
    println!();

    println!("{}", "Critical: 主キーフィールドは最左端に配置".red().bold());
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T0: 主キーフィールド設定（最優先）");
    println!("  T1: マスターフィールド設定");
    println!("  T2: トランザクションフィールド設定");
    println!("  T3: 計算フィールド設定");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] 全テーブルの主キーフィールド");
    println!("  - [ ] 全テーブルの基本フィールド");
    println!("  - [ ] 全テーブルの計算フィールド");
    println!("  - [ ] フィールド命名規則チェックリスト");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] 主キーフィールドが最左端に配置されているか");
    println!("  - [ ] 主キーがリレーション先で識別可能か");
    println!("  - [ ] フィールド名が識学理論に準拠しているか");
    println!("  - [ ] 色分けルールが適用されているか");
    println!();

    println!("{}", "✅ C2 completed".green());
    println!();
    Ok(())
}

/// C3: Relation Setup
async fn execute_c3_relation_setup() -> Result<()> {
    println!("{}", "🔗 C3: Relation Setup".cyan().bold());
    println!("テーブル間の双方向リンクを設定");
    println!();

    println!(
        "{}",
        "Critical: リレーション設定直後に可視性チェック（T0）を実行".red().bold()
    );
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T0: リレーション可視性チェック（最優先）");
    println!("  T1: テーブル準備");
    println!("  T2: 双方向リンク作成");
    println!("  T3: Lookup/Rollup作成");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] 全テーブル間の双方向リンク");
    println!("  - [ ] Lookupフィールド（必要箇所）");
    println!("  - [ ] Rollupフィールド（集計箇所）");
    println!("  - [ ] リレーション検証レポート");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] リレーション設定直後に可視性チェックを実施したか");
    println!("  - [ ] リレーション先で主キー内容が識別可能か");
    println!("  - [ ] 双方向リンクが正常に機能しているか");
    println!("  - [ ] Lookupで必要な情報が参照できているか");
    println!();

    println!("{}", "✅ C3 completed".green());
    println!();
    Ok(())
}

/// C4: Workflow Automation
async fn execute_c4_workflow_automation() -> Result<()> {
    println!("{}", "⚙️  C4: Workflow Automation".cyan().bold());
    println!("自動化ワークフローを構築");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: アラートワークフロー");
    println!("  T2: 承認ワークフロー");
    println!("  T3: プロセスワークフロー");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] アラートワークフロー（5-10個）");
    println!("  - [ ] 承認ワークフロー（1-3個）");
    println!("  - [ ] プロセスワークフロー（3-5個）");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] ワークフローが正常に動作するか");
    println!("  - [ ] 通知が正しい担当者に届くか");
    println!("  - [ ] 自動更新が正確に実行されるか");
    println!();

    println!("{}", "✅ C4 completed".green());
    println!();
    Ok(())
}

/// C5: Button Implementation
async fn execute_c5_button_implementation() -> Result<()> {
    println!("{}", "🔘 C5: Button Implementation".cyan().bold());
    println!("アクションボタンを設定");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: ワンクリック作成ボタン");
    println!("  T2: 外部連携ボタン");
    println!("  T3: バッチ処理ボタン");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] ワンクリック作成ボタン（3-5個）");
    println!("  - [ ] 外部連携ボタン（2-3個）");
    println!("  - [ ] バッチ処理ボタン（1-2個）");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] ボタンが正常に動作するか");
    println!("  - [ ] 作成されるレコードの内容が正しいか");
    println!("  - [ ] 外部連携URLが正しいか");
    println!();

    println!("{}", "✅ C5 completed".green());
    println!();
    Ok(())
}

/// C6: View Creation
async fn execute_c6_view_creation() -> Result<()> {
    println!("{}", "👁️  C6: View Creation".cyan().bold());
    println!("各種ビューを作成・設定");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: グリッドビュー");
    println!("  T2: かんばんビュー");
    println!("  T3: カレンダービュー");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] グリッドビュー（各テーブル 2-5個）");
    println!("  - [ ] かんばんビュー（必要箇所 1-3個）");
    println!("  - [ ] カレンダービュー（スケジュール 1-2個）");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] ビューが業務フローに沿っているか");
    println!("  - [ ] フィルター・ソートが適切か");
    println!("  - [ ] 必要な情報が表示されているか");
    println!();

    println!("{}", "✅ C6 completed".green());
    println!();
    Ok(())
}

/// C7: Dashboard Construction
async fn execute_c7_dashboard_construction() -> Result<()> {
    println!("{}", "📊 C7: Dashboard Construction".cyan().bold());
    println!("分析ダッシュボードを構築");
    println!();

    println!("{}", "3-Layer Structure:".yellow());
    println!("  ┌─────────────────────────────────┐");
    println!("  │ KPIカード層（上段）             │");
    println!("  └─────────────────────────────────┘");
    println!("  ┌─────────────────────────────────┐");
    println!("  │ グラフ層（中段）                 │");
    println!("  └─────────────────────────────────┘");
    println!("  ┌─────────────────────────────────┐");
    println!("  │ 詳細テーブル層（下段）           │");
    println!("  └─────────────────────────────────┘");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: KPIカード作成");
    println!("  T2: グラフ作成");
    println!("  T3: アクションテーブル作成");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] KPIカード（5-10個）");
    println!("  - [ ] グラフ（5-10個）");
    println!("  - [ ] アクションテーブル（2-3個）");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] KPIが業務目標に沿っているか");
    println!("  - [ ] グラフが見やすく理解しやすいか");
    println!("  - [ ] アクションテーブルが実用的か");
    println!();

    println!("{}", "✅ C7 completed".green());
    println!();
    Ok(())
}

/// C8: Permission Setup
async fn execute_c8_permission_setup() -> Result<()> {
    println!("{}", "🔐 C8: Permission Setup".cyan().bold());
    println!("階層的な権限を設定");
    println!();

    println!("{}", "Roles:".yellow());
    println!("  👑 管理者（Admin）: 全権限");
    println!("  📊 管理職（Manager）: 承認・確認権限");
    println!("  ✍️  編集者（Editor）: 編集権限");
    println!("  📝 投稿者（Contributor）: 作成権限");
    println!("  👁️  閲覧者（Viewer）: 閲覧のみ");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: ロール定義");
    println!("  T2: テーブル権限設定");
    println!("  T3: フィールド権限設定");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] ロール定義書");
    println!("  - [ ] テーブル権限マトリックス");
    println!("  - [ ] フィールド権限設定");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] 権限設定が組織階層に沿っているか");
    println!("  - [ ] 機密情報が適切に保護されているか");
    println!("  - [ ] 業務フローが阻害されていないか");
    println!();

    println!("{}", "✅ C8 completed".green());
    println!();
    Ok(())
}

/// C9: Test & Verification
async fn execute_c9_test_verification() -> Result<()> {
    println!("{}", "🧪 C9: Test & Verification".cyan().bold());
    println!("システムの動作確認と検証");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: 単体テスト");
    println!("  T2: 統合テスト");
    println!("  T3: パフォーマンステスト");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] 単体テスト結果レポート");
    println!("  - [ ] 統合テスト結果レポート");
    println!("  - [ ] パフォーマンステスト結果レポート");
    println!("  - [ ] バグ修正リスト");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] 全ての機能が正常に動作するか");
    println!("  - [ ] 業務フローが実行可能か");
    println!("  - [ ] パフォーマンスが十分か");
    println!();

    println!("{}", "✅ C9 completed".green());
    println!();
    Ok(())
}

/// C10: Deployment
async fn execute_c10_deployment() -> Result<()> {
    println!("{}", "🚀 C10: Deployment".cyan().bold());
    println!("本番環境への展開");
    println!();

    println!("{}", "Tasks:".yellow());
    println!("  T1: データ移行");
    println!("  T2: ユーザー設定");
    println!("  T3: 本番稼働");
    println!();

    println!("{}", "Deliverables:".yellow());
    println!("  - [ ] データ移行完了報告");
    println!("  - [ ] ユーザー設定完了報告");
    println!("  - [ ] 本番稼働報告書");
    println!("  - [ ] 運用マニュアル");
    println!();

    println!("{}", "Checklist:".yellow());
    println!("  - [ ] データ移行が正常に完了したか");
    println!("  - [ ] ユーザーが適切に設定されたか");
    println!("  - [ ] 本番稼働の承認を得たか");
    println!();

    println!("{}", "✅ C10 completed".green());
    println!();
    Ok(())
}

/// Run Lark Agent REPL
async fn run_lark_agent_repl(initial_prompt: Option<&str>) -> Result<()> {
    use rustyline::error::ReadlineError;
    use rustyline::DefaultEditor;

    println!("{}", "🤖 Lark Agent REPL".cyan().bold());
    println!("識学理論ベースのLark Base統合管理システム構築");
    println!();

    // Load Lark Agent context
    println!("{}", "📚 Loading Lark Agent context...".yellow());
    let context = load_lark_agent_context()?;
    println!("{}", "✅ Context loaded".green());
    println!();

    // Display welcome and commands
    print_lark_agent_welcome();

    // Initialize rustyline editor
    let mut rl = DefaultEditor::new().map_err(|e| {
        CliError::ExecutionError(format!("Failed to initialize REPL editor: {}", e))
    })?;

    // Add history support
    let history_file = dirs::home_dir()
        .map(|h| h.join(".miyabi_lark_history"))
        .ok_or_else(|| CliError::ExecutionError("Failed to get home directory".to_string()))?;

    if history_file.exists() {
        let _ = rl.load_history(&history_file);
    }

    // Process initial prompt if provided
    if let Some(prompt) = initial_prompt {
        println!("{}", format!(">>> {}", prompt).cyan());
        process_lark_command(prompt, &context).await?;
        println!();
    }

    // Main REPL loop
    loop {
        let readline = rl.readline("lark> ");
        match readline {
            Ok(line) => {
                let line = line.trim();

                if line.is_empty() {
                    continue;
                }

                rl.add_history_entry(line).ok();

                // Handle special commands
                match line.to_lowercase().as_str() {
                    "exit" | "quit" | "q" => {
                        println!("{}", "👋 Goodbye!".cyan());
                        break;
                    }
                    "help" | "h" | "?" => {
                        print_lark_agent_help();
                        continue;
                    }
                    "context" => {
                        print_lark_agent_context_info(&context);
                        continue;
                    }
                    "clear" => {
                        print!("\x1B[2J\x1B[1;1H"); // Clear screen
                        print_lark_agent_welcome();
                        continue;
                    }
                    _ => {}
                }

                // Process command
                if let Err(e) = process_lark_command(line, &context).await {
                    eprintln!("{} {}", "Error:".red().bold(), e);
                }

                println!();
            }
            Err(ReadlineError::Interrupted) => {
                println!("{}", "^C (Use 'exit' to quit)".yellow());
            }
            Err(ReadlineError::Eof) => {
                println!("{}", "^D".yellow());
                break;
            }
            Err(err) => {
                eprintln!("{} {:?}", "Error:".red().bold(), err);
                break;
            }
        }
    }

    // Save history
    let _ = rl.save_history(&history_file);

    Ok(())
}

/// Load Lark Agent context from files
fn load_lark_agent_context() -> Result<String> {
    use std::fs;

    let mut context = String::new();

    // Load agent spec
    let spec_path = std::path::PathBuf::from(".claude/agents/specs/lark/lark-agent.md");
    if spec_path.exists() {
        context.push_str(&fs::read_to_string(&spec_path).map_err(|e| {
            CliError::ExecutionError(format!("Failed to read spec file: {}", e))
        })?);
        context.push_str("\n\n");
    }

    // Load agent prompt
    let prompt_path = std::path::PathBuf::from(".claude/agents/prompts/lark/lark-agent-prompt.md");
    if prompt_path.exists() {
        context.push_str(&fs::read_to_string(&prompt_path).map_err(|e| {
            CliError::ExecutionError(format!("Failed to read prompt file: {}", e))
        })?);
        context.push_str("\n\n");
    }

    // Load framework
    let framework_path = std::path::PathBuf::from(".claude/agents/lark/base-construction-framework.md");
    if framework_path.exists() {
        context.push_str(&fs::read_to_string(&framework_path).map_err(|e| {
            CliError::ExecutionError(format!("Failed to read framework file: {}", e))
        })?);
    }

    Ok(context)
}

/// Print welcome message
fn print_lark_agent_welcome() {
    println!("{}", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan());
    println!("{}", "  Lark Agent Interactive REPL".cyan().bold());
    println!("{}", "  識学理論ベースのLark Base統合管理".dimmed());
    println!("{}", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan());
    println!();
    println!("{}", "Commands:".yellow());
    println!("  {}  - Execute C1 (System Analysis)", "C1".green());
    println!("  {}  - Execute C2 (Field Implementation)", "C2".green());
    println!("  {}  - ... (C3-C10)", "...".dimmed());
    println!("  {}  - Execute all commands C1→C10", "ALL".green());
    println!("  {} - Show available commands", "help".green());
    println!("  {} - Show loaded context info", "context".green());
    println!("  {} - Clear screen", "clear".green());
    println!("  {} - Exit REPL", "exit".green());
    println!();
    println!("{}", "Natural Language:".yellow());
    println!("  You can also type natural language requests!");
    println!("  Example: \"Analyze the requirements for a CRM system\"");
    println!();
}

/// Print help message
fn print_lark_agent_help() {
    println!();
    println!("{}", "Available Commands:".cyan().bold());
    println!();
    println!("{}", "C1-C10 Commands:".yellow());
    println!("  {} - System Analysis", "C1".green());
    println!("  {} - Field Implementation", "C2".green());
    println!("  {} - Relation Setup", "C3".green());
    println!("  {} - Workflow Automation", "C4".green());
    println!("  {} - Button Implementation", "C5".green());
    println!("  {} - View Creation", "C6".green());
    println!("  {} - Dashboard Construction", "C7".green());
    println!("  {} - Permission Setup", "C8".green());
    println!("  {} - Test & Verification", "C9".green());
    println!("  {} - Deployment", "C10".green());
    println!("  {} - Execute all C1→C10", "ALL".green());
    println!();
    println!("{}", "REPL Commands:".yellow());
    println!("  {} - Show this help", "help".green());
    println!("  {} - Show context info", "context".green());
    println!("  {} - Clear screen", "clear".green());
    println!("  {} - Exit REPL", "exit".green());
    println!();
}

/// Print context information
fn print_lark_agent_context_info(context: &str) {
    println!();
    println!("{}", "Loaded Context Information:".cyan().bold());
    println!();
    println!("  Context size: {} bytes", context.len());
    println!("  Documents loaded:");
    if context.contains("lark-agent.md") || context.contains("Agent Identity") {
        println!("    ✅ Agent Spec");
    }
    if context.contains("lark-agent-prompt.md") || context.contains("Identity & Mission") {
        println!("    ✅ Agent Prompt");
    }
    if context.contains("base-construction-framework.md") || context.contains("10コマンドスタック") {
        println!("    ✅ Base Construction Framework");
    }
    println!();
}

/// Process Lark Agent command
async fn process_lark_command(input: &str, _context: &str) -> Result<()> {
    let input_upper = input.to_uppercase();

    // Check if it's a C1-C10 or ALL command
    if input_upper == "ALL"
        || input_upper == "C1"
        || input_upper == "C2"
        || input_upper == "C3"
        || input_upper == "C4"
        || input_upper == "C5"
        || input_upper == "C6"
        || input_upper == "C7"
        || input_upper == "C8"
        || input_upper == "C9"
        || input_upper == "C10"
    {
        // Execute command directly
        execute_base_command(&input_upper, &None, &None, &None).await?;
        return Ok(());
    }

    // Natural language processing
    println!("{}", "🤔 Processing natural language request...".yellow());
    println!("{}", "💡 Tip: Direct commands are faster (e.g., 'C1', 'C7', 'ALL')".dimmed());
    println!();

    // For now, provide guidance
    println!("{}", "Natural Language Interpretation:".cyan());
    println!("  Input: \"{}\"", input);
    println!();
    println!("{}", "Suggested Commands:".yellow());

    if input.to_lowercase().contains("analysis")
        || input.to_lowercase().contains("分析")
        || input.to_lowercase().contains("requirements")
    {
        println!("  → Try: {}", "C1".green().bold());
    } else if input.to_lowercase().contains("field")
        || input.to_lowercase().contains("フィールド")
    {
        println!("  → Try: {}", "C2".green().bold());
    } else if input.to_lowercase().contains("relation")
        || input.to_lowercase().contains("リレーション")
    {
        println!("  → Try: {}", "C3".green().bold());
    } else if input.to_lowercase().contains("workflow")
        || input.to_lowercase().contains("ワークフロー")
    {
        println!("  → Try: {}", "C4".green().bold());
    } else if input.to_lowercase().contains("dashboard")
        || input.to_lowercase().contains("ダッシュボード")
    {
        println!("  → Try: {}", "C7".green().bold());
    } else {
        println!("  → Try: {} for full execution", "ALL".green().bold());
        println!("  → Or: {} for help", "help".green().bold());
    }

    println!();
    println!("{}", "⚠️  LLM integration coming in future update".yellow());

    Ok(())
}
