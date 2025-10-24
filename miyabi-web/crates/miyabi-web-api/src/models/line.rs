/// LINE Messaging API 型定義
///
/// Reference: https://developers.line.biz/ja/reference/messaging-api/

use serde::{Deserialize, Serialize};

/// Webhookリクエストペイロード
#[derive(Debug, Deserialize, Serialize)]
pub struct WebhookRequest {
    /// イベントの宛先（Bot User ID）
    pub destination: String,
    /// Webhookイベントのリスト
    pub events: Vec<WebhookEvent>,
}

/// Webhookイベント
#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum WebhookEvent {
    /// メッセージイベント
    Message(MessageEvent),
    /// ポストバックイベント（リッチメニュー等のボタンクリック）
    Postback(PostbackEvent),
    /// フォローイベント（友だち追加）
    Follow(FollowEvent),
    /// アンフォローイベント（ブロック）
    Unfollow(UnfollowEvent),
}

/// メッセージイベント
#[derive(Debug, Deserialize, Serialize)]
pub struct MessageEvent {
    /// イベントID
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    /// 送信元ユーザー
    pub source: EventSource,
    /// メッセージ内容
    pub message: Message,
    /// タイムスタンプ（ミリ秒）
    pub timestamp: u64,
}

/// ポストバックイベント
#[derive(Debug, Deserialize, Serialize)]
pub struct PostbackEvent {
    /// イベントID
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    /// 送信元ユーザー
    pub source: EventSource,
    /// ポストバックデータ
    pub postback: PostbackData,
    /// タイムスタンプ（ミリ秒）
    pub timestamp: u64,
}

/// フォローイベント
#[derive(Debug, Deserialize, Serialize)]
pub struct FollowEvent {
    /// イベントID
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    /// 送信元ユーザー
    pub source: EventSource,
    /// タイムスタンプ（ミリ秒）
    pub timestamp: u64,
}

/// アンフォローイベント
#[derive(Debug, Deserialize, Serialize)]
pub struct UnfollowEvent {
    /// 送信元ユーザー
    pub source: EventSource,
    /// タイムスタンプ（ミリ秒）
    pub timestamp: u64,
}

/// イベント送信元
#[derive(Debug, Deserialize, Serialize)]
pub struct EventSource {
    /// 送信元タイプ（user/group/room）
    #[serde(rename = "type")]
    pub source_type: String,
    /// ユーザーID
    #[serde(rename = "userId")]
    pub user_id: String,
}

/// メッセージ
#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Message {
    /// テキストメッセージ
    Text(TextMessage),
    /// 画像メッセージ
    Image(ImageMessage),
    /// 動画メッセージ
    Video(VideoMessage),
    /// スタンプメッセージ
    Sticker(StickerMessage),
}

/// テキストメッセージ
#[derive(Debug, Deserialize, Serialize)]
pub struct TextMessage {
    /// メッセージID
    pub id: String,
    /// テキスト内容
    pub text: String,
}

/// 画像メッセージ
#[derive(Debug, Deserialize, Serialize)]
pub struct ImageMessage {
    /// メッセージID
    pub id: String,
}

/// 動画メッセージ
#[derive(Debug, Deserialize, Serialize)]
pub struct VideoMessage {
    /// メッセージID
    pub id: String,
}

/// スタンプメッセージ
#[derive(Debug, Deserialize, Serialize)]
pub struct StickerMessage {
    /// メッセージID
    pub id: String,
    /// パッケージID
    #[serde(rename = "packageId")]
    pub package_id: String,
    /// スタンプID
    #[serde(rename = "stickerId")]
    pub sticker_id: String,
}

/// ポストバックデータ
#[derive(Debug, Deserialize, Serialize)]
pub struct PostbackData {
    /// ポストバックデータ文字列
    pub data: String,
}

/// Reply Message API リクエスト
#[derive(Debug, Serialize)]
pub struct ReplyRequest {
    /// Reply Token
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    /// 送信するメッセージ（最大5件）
    pub messages: Vec<ReplyMessage>,
}

/// Push Message API リクエスト
#[derive(Debug, Serialize)]
pub struct PushRequest {
    /// 送信先ユーザーID
    pub to: String,
    /// 送信するメッセージ（最大5件）
    pub messages: Vec<ReplyMessage>,
}

/// 返信メッセージ
#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ReplyMessage {
    /// テキストメッセージ
    Text { text: String },
    /// Flex Messageメッセージ（JSON）
    Flex {
        #[serde(rename = "altText")]
        alt_text: String,
        contents: serde_json::Value,
    },
}

impl ReplyMessage {
    /// テキストメッセージを作成
    pub fn text(text: impl Into<String>) -> Self {
        Self::Text { text: text.into() }
    }

    /// Flex Messageメッセージを作成
    pub fn flex(alt_text: impl Into<String>, contents: serde_json::Value) -> Self {
        Self::Flex {
            alt_text: alt_text.into(),
            contents,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deserialize_webhook_request() {
        let json = r#"{
            "destination": "U1234567890abcdef1234567890abcdef",
            "events": [
                {
                    "type": "message",
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "source": {
                        "type": "user",
                        "userId": "U1234567890abcdef1234567890abcdef"
                    },
                    "message": {
                        "type": "text",
                        "id": "325708",
                        "text": "Hello, world!"
                    },
                    "timestamp": 1462629479859
                }
            ]
        }"#;

        let req: WebhookRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.destination, "U1234567890abcdef1234567890abcdef");
        assert_eq!(req.events.len(), 1);

        match &req.events[0] {
            WebhookEvent::Message(msg_event) => {
                assert_eq!(msg_event.reply_token, "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA");
                assert_eq!(msg_event.source.user_id, "U1234567890abcdef1234567890abcdef");
                match &msg_event.message {
                    Message::Text(text_msg) => {
                        assert_eq!(text_msg.text, "Hello, world!");
                    }
                    _ => panic!("Expected text message"),
                }
            }
            _ => panic!("Expected message event"),
        }
    }

    #[test]
    fn test_serialize_reply_request() {
        let req = ReplyRequest {
            reply_token: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA".to_string(),
            messages: vec![ReplyMessage::text("こんにちは！")],
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("replyToken"));
        assert!(json.contains("messages"));
        assert!(json.contains("こんにちは！"));
    }

    #[test]
    fn test_reply_message_text() {
        let msg = ReplyMessage::text("Hello");
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains(r#""type":"text""#));
        assert!(json.contains(r#""text":"Hello""#));
    }
}
