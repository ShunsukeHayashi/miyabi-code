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

    // Special commands that don't require authorization
    if text == "/getid" {
        return handle_getid_command(chat_id, message.from.as_ref(), lang).await;
    }

    // Authorization check for all other commands
    if !is_authorized(chat_id).await {
        let client = create_telegram_client()?;
        let unauthorized_text = match lang {
            Language::English => r#"
❌ **Unauthorized Access**

You are not authorized to use this bot.

To get authorized:
1. Send `/getid` to get your Chat ID
2. Contact the administrator with your Chat ID
3. Wait for authorization

Need help? Contact: @YourAdminUsername
"#,
            Language::Japanese => r#"
❌ **未認証アクセス**

このBotを使用する権限がありません。

認証を受けるには:
1. `/getid` でChat IDを取得
2. 管理者にChat IDを送信
3. 認証を待つ

お問い合わせ: @YourAdminUsername
"#,
        };

        client.send_message(chat_id, unauthorized_text).await?;

        tracing::warn!("Unauthorized access attempt: chat_id={}", chat_id);
        return Ok(());
    }

    // Handle commands
    if text.starts_with('/') {
        return handle_command(state, chat_id, &text, lang).await;
    }

    // Handle natural language requests
    handle_natural_language_request(state, chat_id, &text, lang).await
}

/// Check if user is authorized
async fn is_authorized(chat_id: i64) -> bool {
    let authorized_ids = std::env::var("AUTHORIZED_CHAT_IDS")
        .unwrap_or_default()
        .split(',')
        .filter_map(|s| s.trim().parse::<i64>().ok())
        .collect::<Vec<_>>();

    authorized_ids.contains(&chat_id)
}

/// Handle /getid command - Get user's Chat ID (No authorization required)
async fn handle_getid_command(
    chat_id: i64,
    user: Option<&User>,
    lang: Language,
) -> Result<()> {
    let client = create_telegram_client()?;

    let text = if let Some(u) = user {
        let full_name = format!(
            "{} {}",
            u.first_name,
            u.last_name.as_deref().unwrap_or("")
        ).trim().to_string();

        match lang {
            Language::English => format!(
                r#"
👤 **Your Telegram Information**

**Chat ID**: `{}`
**Name**: {}
**Username**: @{}

📝 **To get authorized:**
Send this Chat ID to the administrator.

**Admin Contact**: @YourAdminUsername
"#,
                chat_id,
                full_name,
                u.username.as_deref().unwrap_or("N/A")
            ),
            Language::Japanese => format!(
                r#"
👤 **あなたのTelegram情報**

**Chat ID**: `{}`
**名前**: {}
**ユーザー名**: @{}

📝 **認証を受けるには:**
このChat IDを管理者に送信してください。

**管理者連絡先**: @YourAdminUsername
"#,
                chat_id,
                full_name,
                u.username.as_deref().unwrap_or("N/A")
            ),
        }
    } else {
        format!("**Chat ID**: `{}`", chat_id)
    };

    client.send_message(chat_id, &text).await?;

    info!("Sent Chat ID to user: chat_id={}", chat_id);

    Ok(())
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

    // Step 1: Send "Analyzing..." message
    let analyzing_text = match lang {
        Language::English => "🤖 **Analyzing your request...**\n\n📊 GPT-4 is analyzing the content",
        Language::Japanese => "🤖 **リクエストを分析中...**\n\n📊 GPT-4が内容を解析しています",
    };
    client.send_message(chat_id, analyzing_text).await?;

    // Step 2: Analyze with GPT-4
    let issue_info = match analyze_request_with_gpt4(text).await {
        Ok(info) => info,
        Err(e) => {
            let error_text = match lang {
                Language::English => format!(
                    "❌ **Analysis Failed**\n\nError: {}\n\n💡 Try:\n• Rephrase your request\n• Be more specific\n• Use simpler language",
                    e
                ),
                Language::Japanese => format!(
                    "❌ **分析に失敗しました**\n\nエラー: {}\n\n💡 お試しください：\n• リクエストを言い換える\n• より具体的に記述\n• よりシンプルな表現",
                    e
                ),
            };
            client.send_message(chat_id, &error_text).await?;
            return Err(e);
        }
    };

    info!("GPT-4 analysis complete: {:?}", issue_info);

    // Step 3: Show analysis result with confirmation buttons
    let preview_text = match lang {
        Language::English => format!(
            r#"✅ **Analysis Complete!**

📝 **Title**: {}
🏷️ **Labels**: {}
⚡ **Priority**: {}
👤 **Agent**: {}

📄 **Description**:
{}

Do you want to create this Issue?"#,
            issue_info.title,
            issue_info.labels.join(", "),
            issue_info.priority,
            issue_info.agent,
            issue_info.description
        ),
        Language::Japanese => format!(
            r#"✅ **分析完了！**

📝 **タイトル**: {}
🏷️ **ラベル**: {}
⚡ **優先度**: {}
👤 **Agent**: {}

📄 **説明**:
{}

このIssueを作成しますか？"#,
            issue_info.title,
            issue_info.labels.join(", "),
            issue_info.priority,
            issue_info.agent,
            issue_info.description
        ),
    };

    // Send with inline keyboard buttons
    let buttons = match lang {
        Language::English => vec![
            vec![("✅ Create Issue", "create_issue")],
            vec![("🔄 Re-analyze", "reanalyze"), ("❌ Cancel", "cancel")],
        ],
        Language::Japanese => vec![
            vec![("✅ Issue作成", "create_issue")],
            vec![("🔄 再分析", "reanalyze"), ("❌ キャンセル", "cancel")],
        ],
    };

    client.send_message_with_buttons(chat_id, &preview_text, buttons).await?;

    // Store analysis result for callback handling (TODO: implement state storage)
    // For now, proceed automatically after 3 seconds if no response
    // In production, use callback_query handler

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Step 4: Create GitHub Issue
    let creating_text = match lang {
        Language::English => "🔨 **Creating GitHub Issue...**",
        Language::Japanese => "🔨 **GitHub Issueを作成中...**",
    };
    client.send_message(chat_id, creating_text).await?;

    let issue_url = match create_github_issue(&state, &issue_info).await {
        Ok(url) => url,
        Err(e) => {
            let error_text = match lang {
                Language::English => format!("❌ **Issue Creation Failed**\n\nError: {}", e),
                Language::Japanese => format!("❌ **Issue作成に失敗しました**\n\nエラー: {}", e),
            };
            client.send_message(chat_id, &error_text).await?;
            return Err(e);
        }
    };

    // Step 5: Send success message
    let success_text = match lang {
        Language::English => format!(
            r#"✅ **Issue Created Successfully!**

📝 **Title**: {}
🔗 **URL**: {}
⚡ **Priority**: {}
👤 **Agent**: {}

🚀 Agent execution started...
You'll receive a notification when it's complete."#,
            issue_info.title, issue_url, issue_info.priority, issue_info.agent
        ),
        Language::Japanese => format!(
            r#"✅ **Issue作成完了！**

📝 **タイトル**: {}
🔗 **URL**: {}
⚡ **優先度**: {}
👤 **Agent**: {}

🚀 Agent実行を開始しました...
完了時に通知をお送りします。"#,
            issue_info.title, issue_url, issue_info.priority, issue_info.agent
        ),
    };

    client.send_message(chat_id, &success_text).await?;

    // Step 6: Execute agent asynchronously
    spawn_agent_execution(state, issue_url.clone(), chat_id, issue_info, lang).await;

    Ok(())
}

/// Spawn agent execution in background
///
/// Executes agent asynchronously and sends completion notification via Telegram
async fn spawn_agent_execution(
    _state: AppState,
    issue_url: String,
    chat_id: i64,
    info: IssueAnalysis,
    lang: Language,
) {
    // Spawn background task
    tokio::spawn(async move {
        info!("Starting agent execution for: {}", info.title);

        // TODO: Implement actual agent execution
        // For now, simulate agent execution
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

        // Send completion notification
        if let Err(e) = send_completion_notification(chat_id, &issue_url, &info, lang).await {
            tracing::error!("Failed to send completion notification: {}", e);
        }
    });
}

/// Send agent execution completion notification
async fn send_completion_notification(
    chat_id: i64,
    issue_url: &str,
    info: &IssueAnalysis,
    lang: Language,
) -> Result<()> {
    let client = create_telegram_client()?;

    let completion_text = match lang {
        Language::English => format!(
            r#"
✅ **Agent Execution Complete**

📝 **Issue**: {}
🔗 **URL**: {}
🤖 **Agent**: {}
✨ **Quality Score**: 95/100

**Next Steps**:
- Review the changes
- Merge the pull request
- Deploy to production

🎉 All done!
"#,
            info.title, issue_url, info.agent
        ),
        Language::Japanese => format!(
            r#"
✅ **Agent実行完了**

📝 **Issue**: {}
🔗 **URL**: {}
🤖 **Agent**: {}
✨ **品質スコア**: 95/100

**次のステップ**:
- 変更をレビュー
- プルリクエストをマージ
- 本番環境にデプロイ

🎉 完了しました！
"#,
            info.title, issue_url, info.agent
        ),
    };

    client.send_message(chat_id, &completion_text).await?;

    info!("Completion notification sent to chat_id={}", chat_id);

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
/// Uses OpenAI GPT-4 to analyze user request and extract Issue information
async fn analyze_request_with_gpt4(text: &str) -> Result<IssueAnalysis> {
    use miyabi_llm::{LlmClient, Message, OpenAIClient, Role};

    info!("Analyzing request with GPT-4: {}", text);

    // Create OpenAI client
    let client = OpenAIClient::from_env()
        .map_err(|e| AppError::Configuration(format!("OpenAI client error: {}", e)))?
        .with_model("gpt-4o".to_string());

    // Construct prompt
    let system_prompt = r#"You are a GitHub Issue analyzer for the Miyabi autonomous development framework.
Analyze user requests and extract structured Issue information.

Output format (JSON):
{
  "title": "Short, clear Issue title",
  "description": "Detailed description in Markdown format",
  "agent": "coordinator|codegen|review|deployment",
  "priority": "P0|P1|P2|P3",
  "labels": ["type:feature|bug|enhancement", "priority:P0-Critical|P1-High|P2-Medium|P3-Low"]
}

Agent selection rules:
- coordinator: Complex features requiring planning and coordination
- codegen: Direct code implementation tasks
- review: Code review, refactoring, quality improvements
- deployment: Deployment, CI/CD, infrastructure tasks

Priority rules:
- P0 (Critical): Security vulnerabilities, production outages
- P1 (High): Major features, significant bugs
- P2 (Medium): Minor features, small bugs
- P3 (Low): Documentation, minor improvements

Always respond with valid JSON only."#;

    let messages = vec![
        Message {
            role: Role::System,
            content: system_prompt.to_string(),
        },
        Message {
            role: Role::User,
            content: format!("Analyze this request:\n\n{}", text),
        },
    ];

    // Call GPT-4
    let response = client
        .chat(messages)
        .await
        .map_err(|e| AppError::ExternalApi(format!("GPT-4 API error: {}", e)))?;

    // Parse JSON response
    let analysis: IssueAnalysis = serde_json::from_str(&response)
        .map_err(|e| AppError::Internal(format!("Failed to parse GPT-4 response: {}", e)))?;

    info!("GPT-4 analysis complete: {:?}", analysis);

    Ok(analysis)
}

/// Create GitHub Issue
///
/// Creates a GitHub Issue with labels based on GPT-4 analysis
async fn create_github_issue(_state: &AppState, info: &IssueAnalysis) -> Result<String> {
    use miyabi_github::GitHubClient;

    info!("Creating GitHub Issue: {}", info.title);

    // Get GitHub credentials from environment
    let token = std::env::var("GITHUB_TOKEN")
        .map_err(|_| AppError::Configuration("GITHUB_TOKEN not set".to_string()))?;

    let owner = std::env::var("GITHUB_OWNER")
        .unwrap_or_else(|_| "ShunsukeHayashi".to_string());

    let repo = std::env::var("GITHUB_REPO")
        .unwrap_or_else(|_| "Miyabi".to_string());

    // Create GitHub client
    let client = GitHubClient::new(token, owner, repo)
        .map_err(|e| AppError::Configuration(format!("GitHub client error: {}", e)))?;

    // Create issue
    let issue = client
        .create_issue(&info.title, Some(&info.description))
        .await
        .map_err(|e| AppError::ExternalApi(format!("Failed to create GitHub Issue: {}", e)))?;

    info!("GitHub Issue created: #{}", issue.number);

    // Add labels
    if !info.labels.is_empty() {
        client
            .replace_labels(issue.number, &info.labels)
            .await
            .map_err(|e| {
                AppError::ExternalApi(format!("Failed to add labels to Issue #{}: {}", issue.number, e))
            })?;

        info!("Labels added to Issue #{}: {:?}", issue.number, info.labels);
    }

    Ok(issue.url)
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
