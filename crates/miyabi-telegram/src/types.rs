//! Telegram Bot API types
//!
//! Type definitions for Telegram Bot API objects and requests.
//! Based on: https://core.telegram.org/bots/api

use serde::{Deserialize, Serialize};

/// Telegram Update object
/// https://core.telegram.org/bots/api#update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Update {
    /// Unique update identifier
    pub update_id: i64,

    /// Optional. New incoming message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<Message>,

    /// Optional. Callback query from inline keyboard
    #[serde(skip_serializing_if = "Option::is_none")]
    pub callback_query: Option<CallbackQuery>,
}

/// Telegram Message object
/// https://core.telegram.org/bots/api#message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// Unique message identifier
    pub message_id: i64,

    /// Sender (can be empty for channels)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<User>,

    /// Chat the message belongs to
    pub chat: Chat,

    /// Date the message was sent (Unix time)
    pub date: i64,

    /// Optional. Text of the message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

/// Telegram User object
/// https://core.telegram.org/bots/api#user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier for this user or bot
    pub id: i64,

    /// True if this user is a bot
    pub is_bot: bool,

    /// User's or bot's first name
    pub first_name: String,

    /// Optional. User's or bot's last name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,

    /// Optional. User's or bot's username
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,

    /// Optional. IETF language tag of the user's language
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language_code: Option<String>,
}

/// Telegram Chat object
/// https://core.telegram.org/bots/api#chat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    /// Unique identifier for this chat
    pub id: i64,

    /// Type of chat: "private", "group", "supergroup", "channel"
    #[serde(rename = "type")]
    pub chat_type: String,

    /// Optional. Title for supergroups, channels and group chats
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// Optional. Username for private chats, supergroups and channels
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,

    /// Optional. First name of the other party in a private chat
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
}

/// Telegram CallbackQuery object
/// https://core.telegram.org/bots/api#callbackquery
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallbackQuery {
    /// Unique identifier for this query
    pub id: String,

    /// Sender
    pub from: User,

    /// Optional. Message with the callback button
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<Message>,

    /// Optional. Data associated with the callback button
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
}

/// Request to send a message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    /// Unique identifier for the target chat
    pub chat_id: i64,

    /// Text of the message to be sent
    pub text: String,

    /// Optional. Parse mode: "Markdown" or "HTML"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parse_mode: Option<String>,

    /// Optional. Inline keyboard attached to the message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reply_markup: Option<InlineKeyboard>,
}

/// Inline keyboard markup
/// https://core.telegram.org/bots/api#inlinekeyboardmarkup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InlineKeyboard {
    /// Array of button rows
    pub inline_keyboard: Vec<Vec<InlineKeyboardButton>>,
}

/// Inline keyboard button
/// https://core.telegram.org/bots/api#inlinekeyboardbutton
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InlineKeyboardButton {
    /// Label text on the button
    pub text: String,

    /// Optional. Data to be sent in a callback query
    #[serde(skip_serializing_if = "Option::is_none")]
    pub callback_data: Option<String>,

    /// Optional. HTTP or tg:// URL to be opened
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

/// Response wrapper for API calls
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    /// True if request was successful
    pub ok: bool,

    /// Result object (present if ok == true)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<T>,

    /// Error description (present if ok == false)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

impl InlineKeyboard {
    /// Create a new inline keyboard with rows
    pub fn new(rows: Vec<Vec<InlineKeyboardButton>>) -> Self {
        Self { inline_keyboard: rows }
    }

    /// Create a simple keyboard with one row
    pub fn single_row(buttons: Vec<InlineKeyboardButton>) -> Self {
        Self::new(vec![buttons])
    }
}

impl InlineKeyboardButton {
    /// Create a button with callback data
    pub fn callback(text: impl Into<String>, data: impl Into<String>) -> Self {
        Self { text: text.into(), callback_data: Some(data.into()), url: None }
    }

    /// Create a button with URL
    pub fn url(text: impl Into<String>, url: impl Into<String>) -> Self {
        Self { text: text.into(), callback_data: None, url: Some(url.into()) }
    }
}
