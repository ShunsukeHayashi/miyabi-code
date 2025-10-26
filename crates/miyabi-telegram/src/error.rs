//! Error types for Telegram Bot API

use thiserror::Error;

/// Telegram Bot API error types
#[derive(Error, Debug)]
pub enum TelegramError {
    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// JSON serialization/deserialization failed
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// Telegram API returned an error
    #[error("Telegram API error: {0}")]
    ApiError(String),

    /// Invalid bot token
    #[error("Invalid bot token")]
    InvalidToken,

    /// Missing environment variable
    #[error("Missing environment variable: {0}")]
    MissingEnvVar(String),

    /// Other errors
    #[error("Other error: {0}")]
    Other(String),
}

/// Result type alias for Telegram operations
pub type Result<T> = std::result::Result<T, TelegramError>;
