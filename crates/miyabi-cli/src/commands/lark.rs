//! Lark Agent commands - 識学理論ベースのLark/Feishu Base統合管理

use crate::error::{CliError, Result};
use clap::Subcommand;
use colored::Colorize;
use serde_json::json;
use std::path::PathBuf;
use std::process::Command;

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
    let mcp_server_path = get_mcp_server_path()?;
    let app_id = std::env::var("LARK_APP_ID").map_err(|_| {
        CliError::ConfigError("LARK_APP_ID environment variable not set".to_string())
    })?;
    let app_secret = std::env::var("LARK_APP_SECRET").map_err(|_| {
        CliError::ConfigError("LARK_APP_SECRET environment variable not set".to_string())
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

    // Execute MCP server
    let output = Command::new("node")
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
        .map_err(|e| CliError::ExecError(format!("Failed to spawn MCP server: {}", e)))?
        .wait_with_output()
        .map_err(|e| CliError::ExecError(format!("Failed to execute MCP server: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(CliError::ExecError(format!(
            "MCP server failed: {}",
            stderr
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let response: serde_json::Value = serde_json::from_str(&stdout)?;

    // Extract result from JSONRPC response
    if let Some(error) = response.get("error") {
        return Err(CliError::ExecError(format!(
            "MCP tool error: {}",
            error
        )));
    }

    response
        .get("result")
        .cloned()
        .ok_or_else(|| CliError::ExecError("No result in MCP response".to_string()))
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
        CliError::ConfigError(
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

    println!("{}", "✅ Wiki node created successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&result)?);

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

    println!("{}", "✅ Node information retrieved!".green().bold());
    println!("{}", serde_json::to_string_pretty(&result)?);

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

    println!("{}", "✅ Node list retrieved!".green().bold());
    println!("{}", serde_json::to_string_pretty(&result)?);

    Ok(())
}

/// Execute Base construction command (C1-C10)
async fn execute_base_command(
    command: &str,
    _requirements: &Option<PathBuf>,
    _industry: &Option<String>,
    _domain: &Option<String>,
) -> Result<()> {
    println!(
        "{}",
        format!("📋 Executing command: {}", command).yellow()
    );

    // TODO: Implement C1-C10 command stack
    // This will involve:
    // 1. Loading Lark Agent prompt
    // 2. Executing command-specific logic
    // 3. Calling appropriate MCP tools
    // 4. Reporting results

    println!(
        "{}",
        "⚠️  Base construction commands not yet implemented".yellow()
    );
    println!("{}","Command stack C1-C10 will be implemented based on .claude/agents/lark/ specifications");

    Ok(())
}

/// Run Lark Agent REPL
async fn run_lark_agent_repl(_prompt: Option<&str>) -> Result<()> {
    println!("{}", "🤖 Lark Agent REPL".cyan().bold());
    println!("{}", "識学理論ベースのLark Base統合管理システム構築");
    println!();

    // TODO: Implement interactive REPL
    // This will involve:
    // 1. Loading Lark Agent context
    // 2. Interactive command processing
    // 3. LLM-powered assistance
    // 4. MCP tool integration

    println!(
        "{}",
        "⚠️  Interactive REPL not yet implemented".yellow()
    );
    println!(
        "{}",
        "Will provide interactive Lark Agent experience with C1-C10 command stack"
    );

    Ok(())
}
