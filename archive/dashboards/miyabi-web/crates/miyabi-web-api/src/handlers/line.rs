/// LINE Messaging API Webhook ハンドラー
///
/// Phase 6.2: LINE Webhook実装

use axum::{extract::State, http::StatusCode, Json};
use tracing::{debug, error, info};

use crate::models::line::{
    Message, PushRequest, ReplyMessage, ReplyRequest, WebhookEvent, WebhookRequest,
};
use crate::services::github::GitHubService;
use crate::services::nlp::NlpService;

/// アプリケーション状態
#[derive(Clone)]
pub struct AppState {
    pub line_channel_access_token: String,
    pub http_client: reqwest::Client,
    pub nlp_service: Option<NlpService>,
    pub github_service: Option<GitHubService>,
}

impl AppState {
    pub fn new(line_channel_access_token: String) -> Self {
        // Claude API key取得（オプショナル）
        let nlp_service = std::env::var("ANTHROPIC_API_KEY")
            .ok()
            .map(|api_key| NlpService::new(api_key));

        // GitHub設定取得（オプショナル）
        let github_service = match (
            std::env::var("GITHUB_TOKEN").ok(),
            std::env::var("GITHUB_OWNER").ok(),
            std::env::var("GITHUB_REPO").ok(),
        ) {
            (Some(token), Some(owner), Some(repo)) => {
                tracing::info!("GitHub integration enabled: {}/{}", owner, repo);
                Some(GitHubService::new(token, owner, repo))
            }
            _ => {
                tracing::warn!("GitHub integration disabled: missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO");
                None
            }
        };

        Self {
            line_channel_access_token,
            http_client: reqwest::Client::new(),
            nlp_service,
            github_service,
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

            // Phase 6.3: 自然言語処理統合
            if let Some(nlp_service) = &state.nlp_service {
                // NLPでタスク解析
                match nlp_service.analyze_task(&text_msg.text).await {
                    Ok(analysis) => {
                        info!("Task analysis completed: {:?}", analysis);

                        // GitHub Issue作成
                        if let Some(github_service) = &state.github_service {
                            let labels = GitHubService::infer_labels(analysis.category.display_name());

                            match github_service
                                .create_issue(&analysis.title, &analysis.description, labels)
                                .await
                            {
                                Ok(created_issue) => {
                                    info!(
                                        "GitHub Issue created: #{} - {}",
                                        created_issue.number, created_issue.html_url
                                    );

                                    // タスク登録完了カードを送信
                                    let task_card = create_task_registered_card(
                                        created_issue.number,
                                        &analysis.title,
                                        &created_issue.html_url,
                                        analysis.category.display_name(),
                                    );

                                    send_reply_message(state, &event.reply_token, vec![task_card])
                                        .await?;
                                }
                                Err(e) => {
                                    error!("GitHub Issue creation failed: {}", e);

                                    // エラーカード送信
                                    let error_card = create_error_card(
                                        "Issue作成",
                                        "GitHubにタスクを登録できませんでした。",
                                        "少し待ってから再度お試しください。",
                                    );

                                    send_reply_message(state, &event.reply_token, vec![error_card])
                                        .await?;
                                }
                            }
                        } else {
                            // GitHub統合なし（モックデータ）
                            let task_card = create_task_registered_card(
                                999,
                                &analysis.title,
                                "https://github.com/user/repo/issues/999",
                                analysis.category.display_name(),
                            );

                            send_reply_message(state, &event.reply_token, vec![task_card])
                                .await?;
                        }
                    }
                    Err(e) => {
                        error!("NLP analysis failed: {}", e);

                        // エラーカード送信
                        let error_card = create_error_card(
                            "メッセージ解析",
                            "AIがメッセージを理解できませんでした。",
                            "もう一度、わかりやすく依頼内容を送信してください。",
                        );

                        send_reply_message(state, &event.reply_token, vec![error_card])
                            .await?;
                    }
                }
            } else {
                // NLPサービスなし（Claude API key未設定）
                let flex_message = create_processing_card(&text_msg.text);
                send_reply_message(state, &event.reply_token, vec![flex_message])
                    .await?;
            }
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
        Message::Image(image_msg) => {
            info!(
                "Received image message from {}: message_id={}",
                event.source.user_id, image_msg.id
            );

            // Phase 6.4: 画像解析統合予定
            // 現在は受信確認のみ
            let response_card = create_image_received_card(&image_msg.id);

            send_reply_message(state, &event.reply_token, vec![response_card])
                .await?;
        }
        Message::Video(video_msg) => {
            info!(
                "Received video message from {}: message_id={}",
                event.source.user_id, video_msg.id
            );

            send_reply_message(
                state,
                &event.reply_token,
                vec![ReplyMessage::text(
                    "動画メッセージを受信しました。現在、動画の解析機能は準備中です。",
                )],
            )
            .await?;
        }
        Message::Audio(audio_msg) => {
            info!(
                "Received audio message from {}: message_id={}, duration={}ms",
                event.source.user_id, audio_msg.id, audio_msg.duration
            );

            // Phase 6.4: 音声→テキスト変換統合予定
            let response_card = create_audio_received_card(audio_msg.duration);

            send_reply_message(state, &event.reply_token, vec![response_card])
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
Miyabiへようこそ！🎉

あなたの「やりたいこと」をAIが自動で処理します。

【使い方】
1. 普通の日本語でやりたいことをメッセージ
   例: 「ログイン機能をつけたい」
2. AIが自動でタスクを登録
3. 担当AIが作業を開始
4. 進捗を随時お知らせ

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

/// Flex Message: タスク進捗カードを作成（一般ユーザー向け）
///
/// ## パラメータ
/// - `task_name`: タスク名
/// - `ai_worker`: AIの役割（例: コード作成AI、レビューAI）
/// - `progress`: 進捗率 (0-100)
/// - `status`: ステータス（"running" | "completed" | "failed"）
pub fn create_task_progress_card(
    task_name: &str,
    ai_worker: &str,
    progress: u8,
    status: &str,
) -> ReplyMessage {
    let (status_color, status_text, status_emoji) = match status {
        "running" => ("#1DB446", "作業中", "🔄"),
        "completed" => ("#06C755", "完了しました", "✅"),
        "failed" => ("#FF334B", "エラーが発生", "❌"),
        _ => ("#AAAAAA", "確認中", "❓"),
    };

    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": format!("{} タスク進捗", status_emoji),
                    "weight": "bold",
                    "size": "xl",
                    "color": status_color
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#F7F7F7"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "タスク:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": task_name,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "担当AI:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": ai_worker,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "状態:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": status_text,
                                    "wrap": true,
                                    "color": status_color,
                                    "size": "sm",
                                    "flex": 5,
                                    "weight": "bold"
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "margin": "md",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": format!("進捗: {}%", progress),
                                    "size": "xs",
                                    "color": "#aaaaaa"
                                },
                                {
                                    "type": "box",
                                    "layout": "vertical",
                                    "contents": [
                                        {
                                            "type": "box",
                                            "layout": "vertical",
                                            "contents": [],
                                            "width": format!("{}%", progress),
                                            "backgroundColor": status_color,
                                            "height": "6px"
                                        }
                                    ],
                                    "backgroundColor": "#E0E0E0",
                                    "height": "6px",
                                    "margin": "sm"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "🤖 Powered by Miyabi",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("タスク進捗", contents)
}

/// Flex Message: タスク登録完了カードを作成（一般ユーザー向け）
///
/// ## パラメータ
/// - `task_number`: タスク番号
/// - `task_title`: タスクタイトル
/// - `task_url`: タスク詳細URL
/// - `category`: カテゴリ（例: バグ修正、新機能、改善）
pub fn create_task_registered_card(
    task_number: u64,
    task_title: &str,
    task_url: &str,
    category: &str,
) -> ReplyMessage {
    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "✅ タスク登録完了",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#06C755"
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#F7F7F7"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "AIが自動で処理を開始します",
                    "weight": "bold",
                    "size": "md",
                    "margin": "md",
                    "color": "#666666"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "タスク番号:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 3
                                },
                                {
                                    "type": "text",
                                    "text": format!("#{}", task_number),
                                    "wrap": true,
                                    "color": "#06C755",
                                    "size": "sm",
                                    "flex": 5,
                                    "weight": "bold"
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "内容:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 3
                                },
                                {
                                    "type": "text",
                                    "text": task_title,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "種類:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 3
                                },
                                {
                                    "type": "text",
                                    "text": category,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "button",
                    "action": {
                        "type": "uri",
                        "label": "詳細を見る",
                        "uri": task_url
                    },
                    "style": "primary",
                    "color": "#06C755"
                },
                {
                    "type": "separator",
                    "margin": "md"
                },
                {
                    "type": "text",
                    "text": "進捗は随時お知らせします",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center",
                    "margin": "md"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("タスク登録完了", contents)
}

/// Flex Message: エラーカードを作成（一般ユーザー向け）
///
/// ## パラメータ
/// - `task_name`: タスク名
/// - `error_summary`: エラー概要（一般ユーザー向けの説明）
/// - `suggestion`: 提案（次にどうすべきか）
pub fn create_error_card(
    task_name: &str,
    error_summary: &str,
    suggestion: &str,
) -> ReplyMessage {
    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "❌ 処理でエラーが発生",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#FF334B"
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#FFF0F0"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "タスク:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": task_name,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        },
                        {
                            "type": "separator",
                            "margin": "lg"
                        },
                        {
                            "type": "text",
                            "text": "何が起きたか:",
                            "weight": "bold",
                            "size": "sm",
                            "margin": "lg",
                            "color": "#666666"
                        },
                        {
                            "type": "text",
                            "text": error_summary,
                            "wrap": true,
                            "color": "#666666",
                            "size": "sm",
                            "margin": "sm"
                        },
                        {
                            "type": "separator",
                            "margin": "lg"
                        },
                        {
                            "type": "text",
                            "text": "💡 提案:",
                            "weight": "bold",
                            "size": "sm",
                            "margin": "lg",
                            "color": "#1DB446"
                        },
                        {
                            "type": "text",
                            "text": suggestion,
                            "wrap": true,
                            "color": "#666666",
                            "size": "sm",
                            "margin": "sm"
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "お困りの場合は「ヘルプ」とメッセージください",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("エラーが発生しました", contents)
}

/// Flex Message: 音声受信カードを作成（一般ユーザー向け）
fn create_audio_received_card(duration_ms: u64) -> ReplyMessage {
    let duration_sec = duration_ms / 1000;

    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "🎤 音声を受信しました",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#1DB446"
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#F7F7F7"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "AIが音声を文字に変換しています",
                    "weight": "bold",
                    "size": "md",
                    "margin": "md",
                    "color": "#666666"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "長さ:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 2
                                },
                                {
                                    "type": "text",
                                    "text": format!("{}秒", duration_sec),
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 5
                                }
                            ]
                        },
                        {
                            "type": "separator",
                            "margin": "lg"
                        },
                        {
                            "type": "text",
                            "text": "📋 次のステップ:",
                            "weight": "bold",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "lg"
                        },
                        {
                            "type": "text",
                            "text": "1. 音声を自動で文字変換",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        },
                        {
                            "type": "text",
                            "text": "2. 内容を理解してタスク化",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        },
                        {
                            "type": "text",
                            "text": "3. AIが自動で処理開始",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "変換結果は少々お待ちください",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("音声を受信しました", contents)
}

/// Flex Message: 画像受信カードを作成（一般ユーザー向け）
fn create_image_received_card(_message_id: &str) -> ReplyMessage {
    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "📸 画像を受信しました",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#1DB446"
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#F7F7F7"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "AIが画像を確認しています",
                    "weight": "bold",
                    "size": "md",
                    "margin": "md",
                    "color": "#666666"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "text",
                            "text": "📋 次のステップ:",
                            "weight": "bold",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "md"
                        },
                        {
                            "type": "text",
                            "text": "1. 画像の内容を自動解析",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        },
                        {
                            "type": "text",
                            "text": "2. 必要なタスクを判定",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        },
                        {
                            "type": "text",
                            "text": "3. AIが自動で処理開始",
                            "size": "sm",
                            "color": "#666666",
                            "margin": "sm"
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "解析結果は少々お待ちください",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("画像を受信しました", contents)
}

/// Flex Message: メッセージ受信カードを作成（一般ユーザー向け）
fn create_processing_card(user_message: &str) -> ReplyMessage {
    let contents = serde_json::json!({
        "type": "bubble",
        "hero": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "💬 メッセージ受信",
                    "weight": "bold",
                    "size": "xl",
                    "color": "#1DB446"
                }
            ],
            "paddingAll": "20px",
            "backgroundColor": "#F7F7F7"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "AIがあなたのメッセージを確認しています",
                    "weight": "bold",
                    "size": "md",
                    "margin": "md",
                    "color": "#666666"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "内容:",
                                    "color": "#aaaaaa",
                                    "size": "sm",
                                    "flex": 1
                                },
                                {
                                    "type": "text",
                                    "text": user_message,
                                    "wrap": true,
                                    "color": "#666666",
                                    "size": "sm",
                                    "flex": 4
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "次のステップで自動処理が始まります",
                    "color": "#aaaaaa",
                    "size": "xs",
                    "align": "center"
                }
            ],
            "flex": 0
        }
    });

    ReplyMessage::flex("メッセージを受信しました", contents)
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

/// Push Message API でメッセージを送信
///
/// ## 機能
/// Agent実行の進捗通知をユーザーに送信するために使用
///
/// ## パラメータ
/// - `state`: アプリケーション状態
/// - `user_id`: 送信先のLINE User ID
/// - `messages`: 送信するメッセージ（最大5件）
///
/// ## 戻り値
/// - `Ok(())`: 送信成功
/// - `Err(WebhookError)`: 送信失敗
///
/// Reference: https://developers.line.biz/ja/reference/messaging-api/#send-push-message
pub async fn send_push_message(
    state: &AppState,
    user_id: &str,
    messages: Vec<ReplyMessage>,
) -> Result<(), WebhookError> {
    let request = PushRequest {
        to: user_id.to_string(),
        messages,
    };

    info!("Sending push message to user: {}", user_id);

    let response = state
        .http_client
        .post("https://api.line.me/v2/bot/message/push")
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
        error!("LINE Push API error: {} - {}", status, body);
        return Err(WebhookError::LineApiError { status, body });
    }

    info!("Push message sent successfully to user: {}", user_id);
    Ok(())
}

/// Agent実行進捗をプッシュ通知
///
/// ## 使用例
/// ```rust
/// // Agent実行開始時
/// notify_agent_progress(&state, "U1234567890", "task-001", "running", 0).await?;
///
/// // Agent実行中（50%完了）
/// notify_agent_progress(&state, "U1234567890", "task-001", "running", 50).await?;
///
/// // Agent実行完了
/// notify_agent_progress(&state, "U1234567890", "task-001", "completed", 100).await?;
/// ```
pub async fn notify_agent_progress(
    state: &AppState,
    user_id: &str,
    task_name: &str,
    status: &str,
    progress: u8,
) -> Result<(), WebhookError> {
    let ai_worker = match status {
        "running" => "コード作成AI (しきるん)",
        "completed" => "処理完了",
        "failed" => "エラー処理",
        _ => "AI処理中",
    };

    let progress_card = create_task_progress_card(task_name, ai_worker, progress, status);

    send_push_message(state, user_id, vec![progress_card]).await
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
