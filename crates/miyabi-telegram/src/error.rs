//! Error types for Telegram Bot API

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
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

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for TelegramError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::JsonError(_) => ErrorCode::PARSE_ERROR,
            Self::ApiError(_) => ErrorCode::HTTP_ERROR,
            Self::InvalidToken => ErrorCode::AUTH_ERROR,
            Self::MissingEnvVar(_) => ErrorCode::MISSING_CONFIG,
            Self::Other(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::ApiError(msg) => {
                format!("Telegram API returned an error: {}. Please check your bot configuration and try again.", msg)
            }
            Self::InvalidToken => {
                "Invalid Telegram bot token. Please verify your bot token in the configuration.".to_string()
            }
            Self::MissingEnvVar(var) => format!(
                "Missing environment variable: {}. Please set this variable in your .env file or environment.",
                var
            ),
            Self::Other(msg) => format!("Telegram bot error: {}. Please check logs for more details.", msg),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::ApiError(msg) => Some(msg as &dyn Any),
            Self::MissingEnvVar(var) => Some(var as &dyn Any),
            Self::Other(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_telegram_error_codes() {
        let error = TelegramError::ApiError("rate limit".to_string());
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);

        let error = TelegramError::InvalidToken;
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = TelegramError::MissingEnvVar("TELEGRAM_BOT_TOKEN".to_string());
        assert_eq!(error.code(), ErrorCode::MISSING_CONFIG);

        let error = TelegramError::Other("unknown".to_string());
        assert_eq!(error.code(), ErrorCode::INTERNAL_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = TelegramError::ApiError("Bad Request: message too long".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Telegram API"));
        assert!(msg.contains("message too long"));

        let error = TelegramError::InvalidToken;
        let msg = error.user_message();
        assert!(msg.contains("Invalid"));
        assert!(msg.contains("bot token"));

        let error = TelegramError::MissingEnvVar("TELEGRAM_CHAT_ID".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Missing environment variable"));
        assert!(msg.contains("TELEGRAM_CHAT_ID"));
    }

    #[test]
    fn test_context_extraction() {
        let error = TelegramError::ApiError("error".to_string());
        assert!(error.context().is_some());

        let error = TelegramError::MissingEnvVar("TOKEN".to_string());
        assert!(error.context().is_some());

        let error = TelegramError::InvalidToken;
        assert!(error.context().is_none());

        // Note: reqwest::Error cannot be constructed directly (private constructor)
        // HttpError context test is implicitly covered by the InvalidToken test above
        // as both return None from context()
    }
}
