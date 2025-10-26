//! Telegram Bot Webhook Handler
//!
//! Handles incoming updates from Telegram Bot API and processes:
//! - Text messages -> GPT-4 analysis -> GitHub Issue creation
//! - Callback queries (button clicks)
//! - Commands (/start, /help)
//! - Multi-language support (EN/JA)

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use miyabi_telegram::{CallbackQuery, Message, Update, User};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::{AppError, AppState, Result};

// Re-export AppState for type annotations
use crate::AppState as State_;

/// Supported languages
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Language {
    English,
    Japanese,
}

impl Language {
    /// Detect language from user's language code
    fn from_user(user: &User) -> Self {
        match user.language_code.as_deref() {
            Some("ja") => Language::Japanese,
            _ => Language::English, // Default to English
        }
    }
}

/// Localized text provider
struct Texts;

impl Texts {
    fn welcome(lang: Language) -> &'static str {
        match lang {
            Language::English => r#"
🌸 **Welcome to Miyabi Bot!**

You can control Miyabi using natural language.

**How to use**:
Just send a message, and it will automatically:
1. Analyze with GPT-4
2. Create GitHub Issue
3. Execute Agent
4. Send completion notification

**Examples**:
"Add Google OAuth to login"
"Improve dashboard design"
"Add performance tests"

**/help** - Show this help
"#,
            Language::Japanese => r#"
🌸 **Miyabi Bot へようこそ！**

自然言語でMiyabiを操作できます。

**使い方**:
メッセージを送信するだけで、自動的に：
1. GPT-4が内容を解析
2. GitHub Issueを作成
3. Agentが自動実行
4. 完了通知を送信

**例**:
「ログイン機能にGoogle OAuth追加して」
「ダッシュボードのデザインを改善」
「パフォーマンステストを追加」

**/help** - このヘルプを表示
"#,
        }
    }

    fn help(lang: Language) -> &'static str {
        match lang {
            Language::English => r#"
📚 **Miyabi Bot Help**

**Commands**:
/start - Welcome message
/help - This help

**Natural Language Control**:
Just send a message.
Example: "Add login feature"

**Processing Flow**:
1. Receive message
2. Analyze with GPT-4
3. Create Issue
4. Execute Agent
5. Send completion notification

🔗 GitHub: https://github.com/ShunsukeHayashi/Miyabi
"#,
            Language::Japanese => r#"
📚 **Miyabi Bot ヘルプ**

**コマンド**:
/start - ウェルカムメッセージ
/help - このヘルプ

**自然言語操作**:
普通にメッセージを送信してください。
例: 「ログイン機能を追加して」

**処理フロー**:
1. メッセージ受信
2. GPT-4で解析
3. Issue作成
4. Agent実行
5. 完了通知

🔗 GitHub: https://github.com/ShunsukeHayashi/Miyabi
"#,
        }
    }

    fn unknown_command(lang: Language, command: &str) -> String {
        match lang {
            Language::English => format!("❌ Unknown command: {}\n\n/help for help", command),
            Language::Japanese => {
                format!("❌ 不明なコマンド: {}\n\n/help でヘルプを表示", command)
            }
        }
    }

    fn processing(lang: Language) -> &'static str {
        match lang {
            Language::English => "🤖 Processing...",
            Language::Japanese => "🤖 処理中...",
        }
    }

    fn issue_created(lang: Language, title: &str, url: &str, agent: &str, priority: &str) -> String {
        match lang {
            Language::English => format!(
                r#"
✅ **Issue Created**

📝 **Title**: {}
🔗 **URL**: {}
🤖 **Agent**: {}
⏱️ **Priority**: {}

Processing started...
"#,
                title, url, agent, priority
            ),
            Language::Japanese => format!(
                r#"
✅ **Issue作成完了**

📝 **タイトル**: {}
🔗 **URL**: {}
🤖 **Agent**: {}
⏱️ **優先度**: {}

処理を開始します...
"#,
                title, url, agent, priority
            ),
        }
    }

    fn agent_selected(lang: Language, agent_name: &str) -> String {
        match lang {
            Language::English => format!("🤖 Selected {}", agent_name),
            Language::Japanese => format!("🤖 {} を選択しました", agent_name),
        }
    }

    fn action_triggered(lang: Language, action: &str) -> String {
        match lang {
            Language::English => format!("⚙️ Action: {}", action),
            Language::Japanese => format!("⚙️ アクション: {}", action),
        }
    }
}

/// Telegram webhook handler routes
pub fn routes() -> Router<State_> {
    Router::new().route("/webhook", post(handle_webhook))
}

/// Telegram webhook endpoint
///
/// Receives updates from Telegram Bot API and processes them
pub async fn handle_webhook(
    State(state): State<AppState>,
    Json(update): Json<Update>,
) -> Result<Response> {
    info!("Received Telegram update: {:?}", update.update_id);

    // Handle different update types
    if let Some(message) = update.message {
        handle_message(state, message).await?;
    } else if let Some(callback) = update.callback_query {
        handle_callback_query(state, callback).await?;
    } else {
        warn!("Received unknown update type");
    }

    Ok((StatusCode::OK, "OK").into_response())
}

/// Handle incoming text messages
async fn handle_message(state: AppState, message: Message) -> Result<()> {
    let chat_id = message.chat.id;
    let text = message.text.unwrap_or_default();

    // Detect user language
    let lang = message.from.as_ref()
        .map(Language::from_user)
        .unwrap_or(Language::English);

    info!("Message from chat_id={} (lang={:?}): {}", chat_id, lang, text);

    // Handle commands
    if text.starts_with('/') {
        return handle_command(state, chat_id, &text, lang).await;
    }

    // Handle natural language requests
    handle_natural_language_request(state, chat_id, &text, lang).await
}

/// Handle Telegram commands (/start, /help, etc.)
async fn handle_command(_state: AppState, chat_id: i64, command: &str, lang: Language) -> Result<()> {
    let client = create_telegram_client()?;

    match command.trim() {
        "/start" => {
            client.send_message(chat_id, Texts::welcome(lang)).await?;
        }
        "/help" => {
            client.send_message(chat_id, Texts::help(lang)).await?;
        }
        _ => {
            client
                .send_message(chat_id, &Texts::unknown_command(lang, command))
                .await?;
        }
    }

    Ok(())
}

/// Handle natural language requests using GPT-4
async fn handle_natural_language_request(
    state: AppState,
    chat_id: i64,
    text: &str,
    lang: Language,
) -> Result<()> {
    let client = create_telegram_client()?;

    // Send processing message
    client.send_message(chat_id, Texts::processing(lang)).await?;

    // Analyze with GPT-4 (TODO: implement)
    let issue_info = analyze_request_with_gpt4(text).await?;

    // Create GitHub Issue (TODO: implement)
    let issue_url = create_github_issue(&state, &issue_info).await?;

    // Send success message
    let response = Texts::issue_created(
        lang,
        &issue_info.title,
        &issue_url,
        &issue_info.agent,
        &issue_info.priority,
    );

    client.send_message(chat_id, &response).await?;

    // Execute agent asynchronously (TODO: implement)
    // spawn_agent_execution(state, issue_info).await?;

    Ok(())
}

/// Handle callback queries (button clicks)
async fn handle_callback_query(state: AppState, callback: CallbackQuery) -> Result<()> {
    let client = create_telegram_client()?;
    let callback_data = callback.data.unwrap_or_default();

    // Detect user language
    let lang = Language::from_user(&callback.from);

    info!("Callback query: {}", callback_data);

    // Answer callback query
    client
        .answer_callback_query(&callback.id, Some(Texts::processing(lang)))
        .await?;

    // Handle different callback actions
    match callback_data.as_str() {
        data if data.starts_with("agent:") => {
            let agent_name = data.strip_prefix("agent:").unwrap();
            handle_agent_selection(state, callback.message, agent_name, lang).await?;
        }
        data if data.starts_with("action:") => {
            let action = data.strip_prefix("action:").unwrap();
            handle_action(state, callback.message, action, lang).await?;
        }
        _ => {
            warn!("Unknown callback data: {}", callback_data);
        }
    }

    Ok(())
}

/// Handle agent selection from inline keyboard
async fn handle_agent_selection(
    _state: AppState,
    message: Option<Message>,
    agent_name: &str,
    lang: Language,
) -> Result<()> {
    let client = create_telegram_client()?;

    if let Some(msg) = message {
        let chat_id = msg.chat.id;
        client.send_message(chat_id, &Texts::agent_selected(lang, agent_name)).await?;
    }

    Ok(())
}

/// Handle action buttons
async fn handle_action(
    _state: AppState,
    message: Option<Message>,
    action: &str,
    lang: Language,
) -> Result<()> {
    let client = create_telegram_client()?;

    if let Some(msg) = message {
        let chat_id = msg.chat.id;
        client.send_message(chat_id, &Texts::action_triggered(lang, action)).await?;
    }

    Ok(())
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Create Telegram client from environment
fn create_telegram_client() -> Result<miyabi_telegram::TelegramClient> {
    miyabi_telegram::TelegramClient::from_env()
        .map_err(|e| AppError::Configuration(format!("Telegram client error: {}", e)))
}

/// GPT-4 analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
struct IssueAnalysis {
    title: String,
    description: String,
    agent: String,
    priority: String,
    labels: Vec<String>,
}

/// Analyze request with GPT-4
///
/// TODO: Implement actual GPT-4 integration
async fn analyze_request_with_gpt4(text: &str) -> Result<IssueAnalysis> {
    // Mock implementation for now
    info!("Analyzing request with GPT-4: {}", text);

    Ok(IssueAnalysis {
        title: format!("Feature: {}", text),
        description: format!("User request from Telegram:\n\n{}", text),
        agent: "coordinator".to_string(),
        priority: "P1".to_string(),
        labels: vec!["type:feature".to_string(), "priority:P1-High".to_string()],
    })
}

/// Create GitHub Issue
///
/// TODO: Implement actual GitHub Issue creation
async fn create_github_issue(_state: &AppState, info: &IssueAnalysis) -> Result<String> {
    info!("Creating GitHub Issue: {}", info.title);

    // Mock implementation for now
    Ok(format!(
        "https://github.com/ShunsukeHayashi/Miyabi/issues/{}",
        564
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_issue_analysis_serialization() {
        let analysis = IssueAnalysis {
            title: "Test Issue".to_string(),
            description: "Test description".to_string(),
            agent: "coordinator".to_string(),
            priority: "P1".to_string(),
            labels: vec!["type:feature".to_string()],
        };

        let json = serde_json::to_string(&analysis).unwrap();
        assert!(json.contains("Test Issue"));
    }
}
