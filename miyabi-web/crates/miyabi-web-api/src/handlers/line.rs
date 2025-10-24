/// LINE Messaging API Webhook ハンドラー
///
/// Phase 6.2: LINE Webhook実装

use axum::{extract::State, http::StatusCode, Json};
use tracing::{debug, error, info, warn};

use crate::models::line::{
    Message, ReplyMessage, ReplyRequest, WebhookEvent, WebhookRequest,
};

/// アプリケーション状態
#[derive(Clone)]
pub struct AppState {
    pub line_channel_access_token: String,
    pub http_client: reqwest::Client,
}

impl AppState {
    pub fn new(line_channel_access_token: String) -> Self {
        Self {
            line_channel_access_token,
            http_client: reqwest::Client::new(),
        }
    }
}

/// Webhookハンドラーエラー
#[derive(Debug, thiserror::Error)]
pub enum WebhookError {
    #[error("Failed to send reply message: {0}")]
    ReplyError(#[from] reqwest::Error),

    #[error("LINE API returned error: {status} - {body}")]
    LineApiError { status: u16, body: String },

    #[error("JSON serialization error: {0}")]
    JsonError(#[from] serde_json::Error),
}

impl axum::response::IntoResponse for WebhookError {
    fn into_response(self) -> axum::response::Response {
        error!("Webhook handler error: {}", self);
        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()).into_response()
    }
}

/// LINE Webhook エンドポイント
///
/// ## エンドポイント
/// `POST /api/line/webhook`
///
/// ## リクエスト
/// - Header: `X-Line-Signature` - HMAC-SHA256署名（Base64）
/// - Body: JSON (WebhookRequest)
///
/// ## レスポンス
/// - 200 OK: 正常処理
/// - 400 Bad Request: 不正なリクエスト
/// - 401 Unauthorized: 署名検証失敗
/// - 500 Internal Server Error: サーバーエラー
#[axum::debug_handler]
pub async fn handle_webhook(
    State(state): State<AppState>,
    Json(payload): Json<WebhookRequest>,
) -> Result<StatusCode, WebhookError> {
    info!(
        "Received LINE webhook with {} event(s) for destination: {}",
        payload.events.len(),
        payload.destination
    );

    // 各イベントを処理
    for event in payload.events {
        match event {
            WebhookEvent::Message(msg_event) => {
                debug!(
                    "Processing message event from user: {}",
                    msg_event.source.user_id
                );
                handle_message_event(&state, msg_event).await?;
            }
            WebhookEvent::Postback(pb_event) => {
                debug!(
                    "Processing postback event from user: {} - data: {}",
                    pb_event.source.user_id, pb_event.postback.data
                );
                handle_postback_event(&state, pb_event).await?;
            }
            WebhookEvent::Follow(follow_event) => {
                info!(
                    "New follower: {} (timestamp: {})",
                    follow_event.source.user_id, follow_event.timestamp
                );
                handle_follow_event(&state, follow_event).await?;
            }
            WebhookEvent::Unfollow(unfollow_event) => {
                info!(
                    "User unfollowed: {} (timestamp: {})",
                    unfollow_event.source.user_id, unfollow_event.timestamp
                );
                // アンフォローは reply_token がないため、ログのみ
            }
        }
    }

    Ok(StatusCode::OK)
}

/// メッセージイベントの処理
async fn handle_message_event(
    state: &AppState,
    event: crate::models::line::MessageEvent,
) -> Result<(), WebhookError> {
    match event.message {
        Message::Text(text_msg) => {
            info!(
                "Received text message from {}: \"{}\"",
                event.source.user_id, text_msg.text
            );

            // TODO: Phase 6.3 で GPT-4 自然言語処理を統合
            // 現在はエコーバックのみ
            let reply_text = format!("受信しました: {}", text_msg.text);

            send_reply_message(state, &event.reply_token, vec![ReplyMessage::text(reply_text)])
                .await?;
        }
        Message::Sticker(sticker_msg) => {
            info!(
                "Received sticker from {}: package={}, sticker={}",
                event.source.user_id, sticker_msg.package_id, sticker_msg.sticker_id
            );

            send_reply_message(
                state,
                &event.reply_token,
                vec![ReplyMessage::text("スタンプありがとうございます！")],
            )
            .await?;
        }
        Message::Image(_) | Message::Video(_) => {
            warn!(
                "Unsupported message type received from {}",
                event.source.user_id
            );

            send_reply_message(
                state,
                &event.reply_token,
                vec![ReplyMessage::text(
                    "申し訳ございません、現在テキストメッセージのみ対応しています。",
                )],
            )
            .await?;
        }
    }

    Ok(())
}

/// ポストバックイベントの処理（リッチメニューのボタンクリック等）
async fn handle_postback_event(
    state: &AppState,
    event: crate::models::line::PostbackEvent,
) -> Result<(), WebhookError> {
    let data = &event.postback.data;

    // TODO: Phase 6.4 でリッチメニュー実装時に処理を追加
    let reply_text = match data.as_str() {
        "action=agent_list" => "Agent一覧を表示します（未実装）".to_string(),
        "action=execution_status" => "実行ステータスを表示します（未実装）".to_string(),
        "action=settings" => "設定画面を開きます（未実装）".to_string(),
        _ => format!("ポストバックデータ: {}", data),
    };

    send_reply_message(state, &event.reply_token, vec![ReplyMessage::text(reply_text)]).await?;

    Ok(())
}

/// フォローイベントの処理（友だち追加）
async fn handle_follow_event(
    state: &AppState,
    event: crate::models::line::FollowEvent,
) -> Result<(), WebhookError> {
    let welcome_message = r#"
Miyabi Bot へようこそ！🎉

このBotでは、自然な日本語でAIエージェントの実行を依頼できます。

【使い方】
1. 「ログイン機能を追加して」のようにメッセージを送信
2. BotがGitHub Issueを自動作成
3. AIエージェントが実装を開始
4. 進捗を随時通知

まずは試しに何か依頼してみてください！
"#
    .trim();

    send_reply_message(
        state,
        &event.reply_token,
        vec![ReplyMessage::text(welcome_message)],
    )
    .await?;

    Ok(())
}

/// Reply Message API でメッセージを送信
///
/// Reference: https://developers.line.biz/ja/reference/messaging-api/#send-reply-message
async fn send_reply_message(
    state: &AppState,
    reply_token: &str,
    messages: Vec<ReplyMessage>,
) -> Result<(), WebhookError> {
    let request = ReplyRequest {
        reply_token: reply_token.to_string(),
        messages,
    };

    let response = state
        .http_client
        .post("https://api.line.me/v2/bot/message/reply")
        .header(
            "Authorization",
            format!("Bearer {}", state.line_channel_access_token),
        )
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let body = response.text().await.unwrap_or_default();
        error!("LINE API error: {} - {}", status, body);
        return Err(WebhookError::LineApiError { status, body });
    }

    debug!("Reply message sent successfully");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::line::{EventSource, TextMessage};

    #[test]
    fn test_app_state_creation() {
        let token = "test_token_123".to_string();
        let state = AppState::new(token.clone());
        assert_eq!(state.line_channel_access_token, token);
    }

    #[tokio::test]
    async fn test_handle_webhook_empty_events() {
        let state = AppState::new("test_token".to_string());
        let payload = WebhookRequest {
            destination: "U1234567890abcdef".to_string(),
            events: vec![],
        };

        let result = handle_webhook(State(state), Json(payload)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), StatusCode::OK);
    }

    // Note: 実際のLINE API呼び出しのテストにはモックが必要
    // wiremock や mockito クレートを使用して統合テストを作成
}
