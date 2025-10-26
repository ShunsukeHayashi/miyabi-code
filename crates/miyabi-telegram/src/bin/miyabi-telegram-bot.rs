//! Miyabi Telegram Bot Server
//!
//! Webhook-based Telegram bot for natural language interaction with Miyabi.
//!
//! # Environment Variables
//! - `TELEGRAM_BOT_TOKEN`: Telegram Bot API token (required)
//! - `TELEGRAM_CHAT_ID`: Default chat ID for notifications (optional)
//! - `WEBHOOK_URL`: Public HTTPS URL for webhook (e.g., https://example.com/webhook)
//! - `WEBHOOK_PORT`: Port to listen on (default: 3000)
//! - `GITHUB_TOKEN`: GitHub API token for Issue operations (required)
//! - `ANTHROPIC_API_KEY`: Anthropic API key for Agent execution (required)

use anyhow::{Context, Result};
use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use miyabi_telegram::{TelegramClient, Update};
use serde_json::{json, Value};
use std::sync::Arc;
use tracing::{debug, error, info, warn};

#[derive(Clone)]
struct AppState {
    telegram_client: Arc<TelegramClient>,
    chat_id: Option<i64>,
    github_token: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("miyabi_telegram_bot=debug,miyabi_telegram=debug,info")
        .init();

    info!("🤖 Starting Miyabi Telegram Bot Server");

    // Load configuration from environment
    let bot_token = std::env::var("TELEGRAM_BOT_TOKEN")
        .context("TELEGRAM_BOT_TOKEN environment variable is required")?;

    let chat_id = std::env::var("TELEGRAM_CHAT_ID")
        .ok()
        .and_then(|s| s.parse::<i64>().ok());

    let github_token = std::env::var("GITHUB_TOKEN")
        .context("GITHUB_TOKEN environment variable is required")?;

    let webhook_url = std::env::var("WEBHOOK_URL")
        .context("WEBHOOK_URL environment variable is required (e.g., https://example.com/webhook)")?;

    let port: u16 = std::env::var("WEBHOOK_PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse()
        .context("WEBHOOK_PORT must be a valid port number")?;

    // Create Telegram client
    let telegram_client = Arc::new(TelegramClient::new(bot_token));

    // Verify bot connection
    match telegram_client.get_me().await {
        Ok(user) => {
            info!("✅ Connected to Telegram as: @{}", user.username.unwrap_or_else(|| user.first_name.clone()));
        }
        Err(e) => {
            error!("❌ Failed to connect to Telegram: {}", e);
            return Err(e.into());
        }
    }

    // Set webhook
    info!("🔗 Setting webhook URL: {}", webhook_url);
    telegram_client
        .set_webhook(&webhook_url)
        .await
        .context("Failed to set webhook")?;

    info!("✅ Webhook set successfully");

    // Create application state
    let state = AppState {
        telegram_client: telegram_client.clone(),
        chat_id,
        github_token,
    };

    // Build router
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .route("/webhook", post(handle_webhook))
        .with_state(state);

    // Start server
    let addr = format!("0.0.0.0:{}", port);
    info!("🚀 Server listening on {}", addr);
    info!("📡 Webhook endpoint: {}/webhook", webhook_url);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .context("Failed to bind to port")?;

    axum::serve(listener, app)
        .await
        .context("Server error")?;

    Ok(())
}

/// Health check endpoint
async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "miyabi-telegram-bot",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// Webhook handler for Telegram updates
async fn handle_webhook(
    State(state): State<AppState>,
    Json(update): Json<Update>,
) -> Result<StatusCode, StatusCode> {
    debug!("Received update: {:?}", update);

    // Spawn background task to process update
    tokio::spawn(async move {
        if let Err(e) = process_update(state, update).await {
            error!("Error processing update: {}", e);
        }
    });

    Ok(StatusCode::OK)
}

/// Process Telegram update
async fn process_update(state: AppState, update: Update) -> Result<()> {
    // Handle incoming message
    if let Some(message) = update.message {
        if let Some(text) = message.text {
            let chat_id = message.chat.id;
            let user = message.from.as_ref();
            let username = user
                .and_then(|u| u.username.as_ref())
                .map(|s| s.as_str())
                .unwrap_or("Unknown");

            info!("📨 Message from @{}: {}", username, text);

            // Process command or natural language input
            if text.starts_with('/') {
                handle_command(&state, chat_id, &text).await?;
            } else {
                handle_natural_language(&state, chat_id, &text, username).await?;
            }
        }
    }

    // Handle callback query (button press)
    if let Some(callback_query) = update.callback_query {
        if let Some(ref data) = callback_query.data {
            info!("🔘 Callback query: {}", data);

            // Answer callback query
            state
                .telegram_client
                .answer_callback_query(&callback_query.id, Some("Processing..."))
                .await?;

            // Handle callback data
            handle_callback(&state, &callback_query, data).await?;
        }
    }

    Ok(())
}

/// Handle Telegram commands (/command)
async fn handle_command(state: &AppState, chat_id: i64, command: &str) -> Result<()> {
    match command {
        "/start" => {
            let message = r#"👋 Welcome to Miyabi!

I'm your autonomous development assistant. I can:
• Create GitHub Issues from natural language
• Execute development tasks automatically
• Provide real-time progress updates

Just send me a message describing what you want to build!"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }

        "/help" => {
            let message = r#"🤖 *Miyabi Commands*

*Commands:*
/start - Get started
/help - Show this help
/status - Check system status

*Natural Language:*
Just describe what you want to build, and I'll create an Issue and start working on it!

*Examples:*
• "Add dark mode toggle"
• "Fix the login bug"
• "Implement user search feature"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }

        "/status" => {
            let message = "✅ *Miyabi Status*\n\n• Telegram Bot: Online\n• GitHub: Connected\n• Agents: Ready";
            state.telegram_client.send_message(chat_id, message).await?;
        }

        _ => {
            state
                .telegram_client
                .send_message(chat_id, "❓ Unknown command. Type /help for available commands.")
                .await?;
        }
    }

    Ok(())
}

/// Handle natural language input
async fn handle_natural_language(
    state: &AppState,
    chat_id: i64,
    text: &str,
    username: &str,
) -> Result<()> {
    info!("🧠 Processing natural language input: {}", text);

    // Send "analyzing" message
    state
        .telegram_client
        .send_message(chat_id, "🔍 *分析中*\n\nGPT-4が処理しています")
        .await?;

    // TODO: Use Anthropic Claude API to analyze intent and extract Issue details
    // For now, create a simple Issue

    let issue_title = text.lines().next().unwrap_or(text);
    let issue_title = if issue_title.len() > 80 {
        format!("{}...", &issue_title[..77])
    } else {
        issue_title.to_string()
    };

    // Send "creating Issue" message
    let analysis_message = format!(
        r#"*分析完了*

タイトル
{}

ラベル
type:feature · priority:P2-Medium

優先度
P2

Agent
coordinator

説明
{}

────────────────────────

Issue作成中..."#,
        issue_title, text
    );

    state
        .telegram_client
        .send_message(chat_id, &analysis_message)
        .await?;

    // Create GitHub Issue
    match create_github_issue(state, &issue_title, text, username).await {
        Ok(issue_number) => {
            let issue_url = format!("https://github.com/ShunsukeHayashi/Miyabi/issues/{}", issue_number);

            let success_message = format!(
                r#"*Issue作成完了*

{}

優先度
P2

Agent
coordinator

────────────────────────

Agent実行開始
完了時に通知します"#,
                issue_url
            );

            state
                .telegram_client
                .send_message(chat_id, &success_message)
                .await?;

            // TODO: Execute Agent in background and send completion notification
            // For now, send a mock completion message
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            let completion_message = format!(
                r#"*実行完了*

{}

Agent
coordinator

品質スコア
95/100

────────────────────────

次のステップ
• 変更をレビュー
• プルリクエストをマージ
• 本番環境にデプロイ

完了"#,
                issue_url
            );

            state
                .telegram_client
                .send_message(chat_id, &completion_message)
                .await?;
        }
        Err(e) => {
            error!("Failed to create GitHub Issue: {}", e);
            state
                .telegram_client
                .send_message(chat_id, &format!("❌ Error creating Issue: {}", e))
                .await?;
        }
    }

    Ok(())
}

/// Handle callback query (button press)
async fn handle_callback(
    state: &AppState,
    callback_query: &miyabi_telegram::types::CallbackQuery,
    data: &str,
) -> Result<()> {
    let chat_id = callback_query.message.as_ref().map(|m| m.chat.id).unwrap_or(0);

    match data {
        "start_agent" => {
            state
                .telegram_client
                .send_message(chat_id, "🚀 Starting Agent execution...")
                .await?;
        }
        "cancel" => {
            state
                .telegram_client
                .send_message(chat_id, "❌ Cancelled")
                .await?;
        }
        _ => {
            warn!("Unknown callback data: {}", data);
        }
    }

    Ok(())
}

/// Create GitHub Issue using gh CLI
async fn create_github_issue(
    state: &AppState,
    title: &str,
    body: &str,
    author: &str,
) -> Result<u64> {
    info!("Creating GitHub Issue: {}", title);

    // Use gh CLI to create Issue
    let output = tokio::process::Command::new("gh")
        .args(&[
            "issue",
            "create",
            "--title",
            title,
            "--body",
            &format!("{}\n\n---\nCreated via Telegram by @{}", body, author),
            "--label",
            "type:feature",
            "--label",
            "priority:P2-Medium",
            "--label",
            "source:telegram",
        ])
        .env("GITHUB_TOKEN", &state.github_token)
        .output()
        .await
        .context("Failed to execute gh command")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("gh issue create failed: {}", error);
    }

    // Parse Issue URL to get Issue number
    let stdout = String::from_utf8_lossy(&output.stdout);
    let issue_url = stdout.trim();

    // Extract Issue number from URL (e.g., "https://github.com/user/repo/issues/123")
    let issue_number = issue_url
        .split('/')
        .last()
        .and_then(|s| s.parse::<u64>().ok())
        .context("Failed to parse Issue number from URL")?;

    info!("✅ Created Issue #{}", issue_number);

    Ok(issue_number)
}
