//! LINE Messaging API 型定義

use serde::{Deserialize, Serialize};

/// LINE Webhook Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookRequest {
    pub destination: String,
    pub events: Vec<Event>,
}

/// LINE Event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Event {
    #[serde(rename = "message")]
    Message(MessageEvent),
    #[serde(rename = "postback")]
    Postback(PostbackEvent),
    #[serde(rename = "follow")]
    Follow(FollowEvent),
    #[serde(rename = "unfollow")]
    Unfollow(UnfollowEvent),
}

/// Message Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEvent {
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    pub source: Source,
    pub timestamp: i64,
    pub message: Message,
}

/// Postback Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostbackEvent {
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    pub source: Source,
    pub timestamp: i64,
    pub postback: Postback,
}

/// Follow Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowEvent {
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    pub source: Source,
    pub timestamp: i64,
}

/// Unfollow Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnfollowEvent {
    pub source: Source,
    pub timestamp: i64,
}

/// Event Source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    #[serde(rename = "type")]
    pub source_type: String,
    #[serde(rename = "userId")]
    pub user_id: String,
}

/// Message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Message {
    #[serde(rename = "text")]
    Text { id: String, text: String },
    #[serde(rename = "image")]
    Image { id: String },
    #[serde(rename = "sticker")]
    Sticker {
        id: String,
        #[serde(rename = "packageId")]
        package_id: String,
        #[serde(rename = "stickerId")]
        sticker_id: String,
    },
}

/// Postback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Postback {
    pub data: String,
}

/// Reply Message Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyRequest {
    #[serde(rename = "replyToken")]
    pub reply_token: String,
    pub messages: Vec<ReplyMessage>,
}

/// Push Message Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushRequest {
    pub to: String,
    pub messages: Vec<ReplyMessage>,
}

/// Reply Message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ReplyMessage {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "flex")]
    Flex { #[serde(rename = "altText")] alt_text: String, contents: FlexContainer },
}

/// Flex Container
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FlexContainer {
    #[serde(rename = "bubble")]
    Bubble(FlexBubble),
    #[serde(rename = "carousel")]
    Carousel { contents: Vec<FlexBubble> },
}

/// Flex Bubble
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlexBubble {
    pub body: FlexBox,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub footer: Option<FlexBox>,
}

/// Flex Box
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlexBox {
    #[serde(rename = "type")]
    pub box_type: String, // "vertical" or "horizontal"
    pub layout: String,   // "vertical" or "horizontal"
    pub contents: Vec<FlexComponent>,
}

/// Flex Component
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FlexComponent {
    #[serde(rename = "text")]
    Text {
        text: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        size: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        color: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        weight: Option<String>,
    },
    #[serde(rename = "button")]
    Button {
        action: FlexAction,
        #[serde(skip_serializing_if = "Option::is_none")]
        style: Option<String>,
    },
}

/// Flex Action
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FlexAction {
    #[serde(rename = "postback")]
    Postback {
        label: String,
        data: String,
        #[serde(skip_serializing_if = "Option::is_none", rename = "displayText")]
        display_text: Option<String>,
    },
    #[serde(rename = "uri")]
    Uri { label: String, uri: String },
}
