use clap::Parser;
use dotenv::dotenv;
use miyabi_discord_mcp_server::{DiscordClient, rpc::RpcHandler, DiscordMcpError};
use std::env;
use std::sync::Arc;
use tracing_subscriber;

/// Miyabi Discord MCP Server - JSON-RPC 2.0 interface to Discord API
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// 実行モード (stdio, http)
    #[arg(long, default_value = "stdio")]
    mode: String,

    /// HTTPモード時のポート番号
    #[arg(long, default_value = "8080")]
    port: u16,

    /// Discord Bot Token（環境変数 DISCORD_BOT_TOKEN を優先）
    #[arg(long)]
    token: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // .envファイルを読み込み
    dotenv().ok();

    // ログ初期化
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG").unwrap_or_else(|_| "miyabi_discord_mcp_server=info".to_string()),
        )
        .init();

    // 引数パース
    let args = Args::parse();

    // Discord Bot Token取得
    let token = args
        .token
        .or_else(|| env::var("DISCORD_BOT_TOKEN").ok())
        .ok_or_else(|| {
            DiscordMcpError::Internal(
                "DISCORD_BOT_TOKEN not found in environment or args".to_string(),
            )
        })?;

    tracing::info!("Starting Miyabi Discord MCP Server...");
    tracing::info!("Mode: {}", args.mode);

    // Discord APIクライアント初期化
    let discord_client = Arc::new(DiscordClient::new(token));

    // ヘルスチェック
    match discord_client.health_check().await {
        Ok(true) => tracing::info!("✓ Discord API connection successful"),
        Ok(false) => tracing::warn!("⚠ Discord API connection failed"),
        Err(e) => {
            tracing::error!("✗ Discord API health check error: {}", e);
            return Err(Box::new(e) as Box<dyn std::error::Error>);
        }
    }

    // JSON-RPC 2.0ハンドラー初期化
    let _rpc_handler = RpcHandler::new(Arc::clone(&discord_client));

    match args.mode.as_str() {
        "stdio" => {
            tracing::info!("Running in stdio mode...");
            tracing::info!("Ready to accept JSON-RPC 2.0 requests on stdin");

            // TODO: stdio モード実装
            // jsonrpc_stdio_server::ServerBuilder::new(rpc_handler.io_handler())
            //     .build()
            //     .await?;

            tracing::warn!("stdio mode is not yet implemented");
        }
        "http" => {
            tracing::info!("Running in HTTP mode on port {}...", args.port);

            // TODO: HTTPサーバー実装
            tracing::warn!("HTTP mode is not yet implemented");
        }
        _ => {
            tracing::error!("Invalid mode: {}", args.mode);
            return Err(Box::new(DiscordMcpError::InvalidParams(
                "Invalid mode. Use 'stdio' or 'http'".to_string(),
            )));
        }
    }

    Ok(())
}
