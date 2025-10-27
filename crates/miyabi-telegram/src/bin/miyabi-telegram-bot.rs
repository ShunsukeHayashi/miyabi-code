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
    #[allow(dead_code)]
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
            let message = r#"👋 *こんにちは！*

私はMiyabi、あなたの開発アシスタントです 🤖

*✨ 私にできること*
あなたが「やりたいこと」を
普通に話してくれれば、
私が全部やっておきます！

*💬 こんな感じで話してください*
・「ダークモードがほしい」
・「ログインできないの直して」
・「もっと速くして」

難しい言葉は知らなくてOK！
普段使う言葉で大丈夫です 😊

*👇 まずはここから*"#;

            // Send message with interactive buttons
            let keyboard = miyabi_telegram::InlineKeyboard::new(vec![
                vec![
                    miyabi_telegram::InlineKeyboardButton::callback("📚 どう話せばいい？", "show_examples"),
                ],
                vec![
                    miyabi_telegram::InlineKeyboardButton::callback("🚀 すぐ始める", "get_started"),
                    miyabi_telegram::InlineKeyboardButton::callback("💡 詳しく知る", "show_help"),
                ],
            ]);

            state
                .telegram_client
                .send_message_with_keyboard(chat_id, message, keyboard)
                .await?;
        }

        "/help" => {
            let message = r#"💡 *詳しい説明*

*🎯 Miyabiって何？*
あなたの代わりに開発作業をする
AIアシスタントです。

*✨ できること*
・Webサイトやアプリの機能追加
・バグや不具合の修正
・デザインの改善
・速度アップ

*💬 使い方*
普通に話すだけ！

良い例：
「ダークモードがほしい」→ ⭕
「ログインが遅いから速くして」→ ⭕
「検索機能つけて」→ ⭕

悪い例：
「GitHub Issueを...」→ ❌ 難しい言葉不要
「プルリクエストで...」→ ❌ 専門用語不要

*📋 何が起こる？*
1️⃣ あなた：「○○して」と話す
2️⃣ 私：内容を理解
3️⃣ 私：タスクを登録
4️⃣ 私：作業開始（準備中）
5️⃣ 私：「できたよ！」と報告

*もっと知りたい*
「どう話せばいい？」→ /examples
「最初から見る」→ /start"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }

        "/examples" => {
            let message = r#"📚 *こんな風に話してください*

*🌙 見た目を変えたい*
「ダークモードがほしい」
「文字を大きくして」
「スマホでも見やすくして」

*🐛 動かないのを直したい*
「ログインできない」
「写真が出てこない」
「すぐ落ちる」

*✨ 新しいことがしたい*
「検索できるようにして」
「お知らせ機能がほしい」
「データをダウンロードしたい」

*⚡ 遅いのを速くしたい*
「ページが重い」
「読み込みが遅い」
「もっとサクサク動いてほしい」

*💡 こうするともっと良い*
・「何を」「どうしたい」を言う
・1回に1つのこと
・難しい言葉は使わない

例：
⭕「ログインを速くして」
❌「認証処理のパフォーマンス最適化を...」"#;

            let keyboard = miyabi_telegram::InlineKeyboard::new(vec![
                vec![
                    miyabi_telegram::InlineKeyboardButton::callback("🚀 試してみる", "try_now"),
                    miyabi_telegram::InlineKeyboardButton::callback("📖 ヘルプ", "show_help"),
                ],
            ]);

            state
                .telegram_client
                .send_message_with_keyboard(chat_id, message, keyboard)
                .await?;
        }

        "/status" => {
            let message = r#"✅ *今の状態*

🟢 私は元気に動いています！
🟢 あなたの依頼を受け付けられます

*今できること*
✅ タスクの登録
⏳ 自動実行（準備中）

*バージョン*
Miyabi v0.1.1

何でも話しかけてください！ 😊"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }

        _ => {
            let message = r#"❓ *そのコマンドは使えません*

使えるコマンド：
/start - 最初の説明
/examples - 使い方の例
/help - ヘルプ
/status - システム状態

または、普通に日本語で話しかけてください！
例：「ダークモードを追加して」"#;

            state.telegram_client.send_message(chat_id, message).await?;
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

    // Send "analyzing" message with progress indicator
    let analyzing_msg = r#"🔍 *わかりました！*

⏳ 今、内容を確認しています
📝 少しだけ待っててください..."#;

    state
        .telegram_client
        .send_message(chat_id, analyzing_msg)
        .await?;

    // TODO: Use Anthropic Claude API to analyze intent and extract Issue details
    // For now, create a simple task

    let task_title = text.lines().next().unwrap_or(text);
    let task_title = if task_title.len() > 80 {
        format!("{}...", &task_title[..77])
    } else {
        task_title.to_string()
    };

    // Send "creating task" message
    let analysis_message = format!(
        r#"✅ *内容を理解しました！*

*📋 やること*
{}

────────────────────────

📝 タスクリストに登録しています...
もうちょっとだけ待ってね"#,
        task_title
    );

    state
        .telegram_client
        .send_message(chat_id, &analysis_message)
        .await?;

    // Create GitHub Issue (internally - user doesn't need to know)
    match create_github_issue(state, &task_title, text, username).await {
        Ok(task_number) => {
            let task_url = format!("https://github.com/ShunsukeHayashi/Miyabi/issues/{}", task_number);

            let success_message = format!(
                r#"🎉 *登録できました！*

*📋 タスク番号*
タスク #{}

*✅ 現在の状態*
✓ タスクリストに追加済み
⏳ 作業開始の準備中

────────────────────────

*💡 今の状況*
タスクは登録されました！
自動で作業する機能は今準備中です。

*👇 次は何しますか？*
・別のことを頼む
・詳しい状況を見る
・ヘルプを見る

何でも話しかけてくださいね！"#,
                task_number
            );

            // Add interactive buttons
            let keyboard = miyabi_telegram::InlineKeyboard::new(vec![
                vec![
                    miyabi_telegram::InlineKeyboardButton::url("📊 詳しく見る", &task_url),
                ],
                vec![
                    miyabi_telegram::InlineKeyboardButton::callback("➕ 別のこと頼む", "new_task"),
                    miyabi_telegram::InlineKeyboardButton::callback("💡 ヘルプ", "show_help"),
                ],
            ]);

            state
                .telegram_client
                .send_message_with_keyboard(chat_id, &success_message, keyboard)
                .await?;
        }
        Err(e) => {
            error!("Failed to create task: {}", e);

            let error_message = r#"😢 *うまくいきませんでした*

ごめんなさい！
ちょっと問題が起きちゃいました。

*どうすればいい？*
1️⃣ もう一度同じことを言ってみる
2️⃣ 少し待ってからもう一度試す
3️⃣ 違う言い方で頼んでみる

困ったら「助けて」って言ってください！"#;

            state
                .telegram_client
                .send_message(chat_id, error_message)
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
        "show_examples" => {
            handle_command(state, chat_id, "/examples").await?;
        }
        "show_help" => {
            handle_command(state, chat_id, "/help").await?;
        }
        "get_started" => {
            let message = r#"🚀 *やってみよう！*

*ステップ1: したいことを思い浮かべる*
例えば...
・「こんな機能がほしい」
・「ここが壊れてる」
・「もっとかっこよくしたい」

*ステップ2: そのまま話す*
難しく考えないで！
友達に話すみたいに：

「ダークモードがほしい」
「ログインが遅い」
「検索機能つけて」

*ステップ3: 送信！*
それだけ！私が全部わかります 💪

*💡 コツ*
・具体的なほど良い
・1回に1つのこと
・専門用語は使わなくてOK

さあ、何がしたいですか？ 😊"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }
        "try_now" => {
            let message = r#"✨ *やってみよう！*

この下の入力欄に、
したいことを書いて送信してください。

*こんな感じで*
「ダークモードがほしい」
「検索できるようにして」
「ログインできない」

友達に話すみたいに、
普通に書けば大丈夫！ 💬"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }
        "new_task" => {
            let message = r#"➕ *次は何しますか？*

他にやってほしいことがあれば
教えてください！

例：
「もっと速くして」
「このボタンの色変えて」
「通知機能がほしい」

何でも言ってくださいね！ 😊"#;

            state.telegram_client.send_message(chat_id, message).await?;
        }
        _ => {
            warn!("Unknown callback data: {}", data);
            let message = "申し訳ございません、そのボタンの機能はまだ実装されていません。";
            state.telegram_client.send_message(chat_id, message).await?;
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

    // Use gh CLI to create Issue (without labels to avoid error)
    let output = tokio::process::Command::new("gh")
        .args([
            "issue",
            "create",
            "--title",
            title,
            "--body",
            &format!("{}\n\n---\n🤖 Created via Telegram by @{}", body, author),
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
        .next_back()
        .and_then(|s| s.parse::<u64>().ok())
        .context("Failed to parse Issue number from URL")?;

    info!("✅ Created Issue #{}", issue_number);

    Ok(issue_number)
}
