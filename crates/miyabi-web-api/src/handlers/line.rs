//! LINE Webhook Handler
//!
//! Handles incoming LINE webhook events and processes user messages.

use axum::{
    extract::{Json, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};

use crate::integrations::{line::*, openai::*};
use miyabi_github::GitHubClient;

/// LINE webhook handler state
#[derive(Clone)]
pub struct LineWebhookState {
    pub line_client: LineClient,
    pub openai_client: OpenAIClient,
    pub github_client: Arc<GitHubClient>,
    pub channel_secret: String,
}

/// LINE webhook request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineWebhookRequest {
    pub destination: String,
    pub events: Vec<LineEvent>,
}

/// LINE event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LineEvent {
    #[serde(rename = "message")]
    Message {
        #[serde(rename = "replyToken")]
        reply_token: String,
        source: LineSource,
        message: LineIncomingMessage,
    },

    #[serde(rename = "postback")]
    Postback {
        #[serde(rename = "replyToken")]
        reply_token: String,
        source: LineSource,
        postback: PostbackData,
    },

    #[serde(rename = "follow")]
    Follow {
        #[serde(rename = "replyToken")]
        reply_token: String,
        source: LineSource,
    },

    #[serde(rename = "unfollow")]
    Unfollow { source: LineSource },
}

/// LINE message source
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LineSource {
    #[serde(rename = "user")]
    User {
        #[serde(rename = "userId")]
        user_id: String,
    },
    #[serde(rename = "group")]
    Group {
        #[serde(rename = "groupId")]
        group_id: String,
        #[serde(rename = "userId")]
        user_id: Option<String>,
    },
}

/// Incoming LINE message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LineIncomingMessage {
    #[serde(rename = "text")]
    Text {
        id: String,
        text: String,
    },
}

/// Postback data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostbackData {
    pub data: String,
}

/// Handle LINE webhook
pub async fn handle_line_webhook(
    State(state): State<LineWebhookState>,
    headers: HeaderMap,
    body: String,
) -> impl IntoResponse {
    // Verify LINE signature
    let signature = match headers.get("x-line-signature") {
        Some(sig) => sig.to_str().unwrap_or(""),
        None => {
            warn!("Missing x-line-signature header");
            return (StatusCode::BAD_REQUEST, "Missing signature").into_response();
        }
    };

    if !verify_signature(&state.channel_secret, body.as_bytes(), signature) {
        error!("Invalid LINE signature");
        return (StatusCode::UNAUTHORIZED, "Invalid signature").into_response();
    }

    // Parse webhook request
    let webhook_request: LineWebhookRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(e) => {
            error!("Failed to parse LINE webhook: {}", e);
            return (StatusCode::BAD_REQUEST, "Invalid JSON").into_response();
        }
    };

    info!("Received {} LINE events", webhook_request.events.len());

    // Process each event
    for event in webhook_request.events {
        if let Err(e) = process_line_event(&state, event).await {
            error!("Failed to process LINE event: {}", e);
        }
    }

    StatusCode::OK.into_response()
}

/// Process a single LINE event
async fn process_line_event(
    state: &LineWebhookState,
    event: LineEvent,
) -> Result<(), Box<dyn std::error::Error>> {
    match event {
        LineEvent::Message {
            reply_token,
            source,
            message,
        } => {
            process_message_event(state, &reply_token, source, message).await?;
        }

        LineEvent::Postback {
            reply_token,
            source,
            postback,
        } => {
            process_postback_event(state, &reply_token, source, postback).await?;
        }

        LineEvent::Follow {
            reply_token,
            source,
        } => {
            process_follow_event(state, &reply_token, source).await?;
        }

        LineEvent::Unfollow { source } => {
            process_unfollow_event(state, source).await?;
        }
    }

    Ok(())
}

/// Process message event
async fn process_message_event(
    state: &LineWebhookState,
    reply_token: &str,
    _source: LineSource,
    message: LineIncomingMessage,
) -> Result<(), Box<dyn std::error::Error>> {
    match message {
        LineIncomingMessage::Text { text, .. } => {
            info!("Received text message: {}", text);

            // Analyze user message with GPT-4
            let issue_analysis = match state.openai_client.analyze_issue_request(&text).await {
                Ok(analysis) => analysis,
                Err(e) => {
                    error!("Failed to analyze message: {}", e);
                    // Send error reply
                    state
                        .line_client
                        .reply_message(
                            reply_token,
                            vec![LineMessage::text(
                                "申し訳ございません。メッセージの解析に失敗しました。もう一度お試しください。",
                            )],
                        )
                        .await?;
                    return Ok(());
                }
            };

            // Create GitHub Issue
            let issue_number = match create_github_issue(state, &issue_analysis).await {
                Ok(number) => number,
                Err(e) => {
                    error!("Failed to create GitHub Issue: {}", e);
                    state
                        .line_client
                        .reply_message(
                            reply_token,
                            vec![LineMessage::text(
                                "Issue の作成に失敗しました。システム管理者にお問い合わせください。",
                            )],
                        )
                        .await?;
                    return Ok(());
                }
            };

            // Send success reply with Issue number
            let reply_text = format!(
                "✅ Issue #{} を作成しました！\n\n📋 タイトル: {}\n🤖 担当Agent: {}\n⚡ 優先度: {}\n⏱️ 推定時間: {}分\n\nAgentが自動処理を開始します。完了したらお知らせします！",
                issue_number,
                issue_analysis.title,
                issue_analysis.agent,
                issue_analysis.priority,
                issue_analysis.estimated_duration_minutes
            );

            state
                .line_client
                .reply_message(reply_token, vec![LineMessage::text(reply_text)])
                .await?;

            info!("Created Issue #{} and replied to user", issue_number);
        }
    }

    Ok(())
}

/// Process postback event (Rich Menu button clicks)
async fn process_postback_event(
    state: &LineWebhookState,
    reply_token: &str,
    _source: LineSource,
    postback: PostbackData,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Received postback: {}", postback.data);

    // Handle Rich Menu actions
    let response_text = match postback.data.as_str() {
        "agent_list" => "🤖 利用可能なAgent一覧:\n\n1. しきるん (Coordinator)\n2. つくるん (CodeGen)\n3. めだまん (Review)\n4. まとめるん (PR)\n5. はこぶん (Deploy)\n6. みつけるん (Issue)",
        "execution_status" => "📊 現在実行中のタスクを確認しています...",
        "settings" => "⚙️ 設定メニュー",
        "help" => "❓ ヘルプ:\nメッセージを送信するだけでIssueが自動作成されます。例: 「ログイン機能にGoogle OAuth追加して」",
        _ => "不明なアクション",
    };

    state
        .line_client
        .reply_message(reply_token, vec![LineMessage::text(response_text)])
        .await?;

    Ok(())
}

/// Process follow event (user adds bot as friend)
async fn process_follow_event(
    state: &LineWebhookState,
    reply_token: &str,
    _source: LineSource,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("New user followed the bot");

    let welcome_message = r#"🎉 Miyabiへようこそ！

私はAI開発フレームワーク「Miyabi」のアシスタントです。

📝 使い方:
メッセージを送信するだけで、自動的にGitHub Issueを作成し、適切なAgentが処理を開始します。

例:
「ログイン機能にGoogle OAuth追加して」
「ダッシュボードのグラフを見やすくして」
「APIのレスポンス速度を改善して」

🤖 7つのAgentがあなたの開発をサポートします！"#;

    state
        .line_client
        .reply_message(reply_token, vec![LineMessage::text(welcome_message)])
        .await?;

    Ok(())
}

/// Process unfollow event (user blocks or removes bot)
async fn process_unfollow_event(
    _state: &LineWebhookState,
    _source: LineSource,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("User unfollowed the bot");
    // No action needed for unfollow
    Ok(())
}

/// Create GitHub Issue from analysis
async fn create_github_issue(
    state: &LineWebhookState,
    analysis: &IssueAnalysis,
) -> Result<u64, Box<dyn std::error::Error>> {
    // Build Issue body with metadata
    let body = format!(
        r#"{}

---

**Agent**: {}
**Priority**: {}
**Estimated Duration**: {} minutes

**Labels**: {}

---

🤖 Generated via LINE Bot with GPT-4 analysis
"#,
        analysis.description,
        analysis.agent,
        analysis.priority,
        analysis.estimated_duration_minutes,
        analysis.labels.join(", ")
    );

    // Create Issue via GitHub API
    let issue = state
        .github_client
        .create_issue(&analysis.title, &body, analysis.labels.clone())
        .await?;

    Ok(issue.number)
}
