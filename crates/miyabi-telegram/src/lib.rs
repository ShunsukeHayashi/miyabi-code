//! Telegram Bot API integration for Miyabi
//!
//! This crate provides a simple Telegram Bot API client for Miyabi,
//! enabling natural language interaction and real-time notifications.

pub mod client;
pub mod error;
pub mod types;

pub use client::TelegramClient;
pub use error::{Result, TelegramError};
pub use types::*;

/// Re-export commonly used types
pub mod prelude {
    pub use crate::client::TelegramClient;
    pub use crate::error::{Result, TelegramError};
    pub use crate::types::{InlineKeyboard, InlineKeyboardButton, Message, SendMessageRequest, Update, User};
}
