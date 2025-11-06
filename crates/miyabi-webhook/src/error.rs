//! Error types for webhook signature verification

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

/// Webhook verification errors
#[derive(Debug, Error)]
pub enum WebhookError {
    /// Invalid signature format (expected `sha256=<hex>`)
    #[error("Invalid signature format: {0}")]
    InvalidFormat(String),

    /// Signature verification failed
    #[error("Signature verification failed")]
    VerificationFailed,

    /// Timestamp is outside acceptable window (replay attack)
    #[error("Timestamp out of range: {0}s (tolerance: {1}s)")]
    TimestampOutOfRange(i64, i64),

    /// Hex decoding error
    #[error("Hex decode error: {0}")]
    HexDecode(#[from] hex::FromHexError),
}

/// Result type for webhook operations
pub type Result<T> = std::result::Result<T, WebhookError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for WebhookError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::InvalidFormat(_) => ErrorCode::INVALID_FORMAT,
            Self::VerificationFailed => ErrorCode::AUTH_ERROR,
            Self::TimestampOutOfRange(_, _) => ErrorCode::VALIDATION_ERROR,
            Self::HexDecode(_) => ErrorCode::PARSE_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::InvalidFormat(msg) => format!(
                "Invalid webhook signature format: {}. Expected format: sha256=<hex>",
                msg
            ),
            Self::VerificationFailed => {
                "Webhook signature verification failed. The signature does not match the payload. This request may be malicious.".to_string()
            }
            Self::TimestampOutOfRange(actual, tolerance) => format!(
                "Webhook timestamp is {}s old, which exceeds the {}s tolerance window. This may be a replay attack.",
                actual.abs(), tolerance
            ),
            Self::HexDecode(e) => format!(
                "Failed to decode webhook signature hex: {}. The signature format is invalid.",
                e
            ),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::InvalidFormat(msg) => Some(msg as &dyn Any),
            Self::TimestampOutOfRange(actual, _) => Some(actual as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_webhook_error_codes() {
        let error = WebhookError::InvalidFormat("bad format".to_string());
        assert_eq!(error.code(), ErrorCode::INVALID_FORMAT);

        let error = WebhookError::VerificationFailed;
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = WebhookError::TimestampOutOfRange(300, 60);
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = WebhookError::InvalidFormat("missing sha256 prefix".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Invalid webhook signature format"));
        assert!(msg.contains("missing sha256 prefix"));

        let error = WebhookError::VerificationFailed;
        let msg = error.user_message();
        assert!(msg.contains("verification failed"));
        assert!(msg.contains("malicious"));

        let error = WebhookError::TimestampOutOfRange(300, 60);
        let msg = error.user_message();
        assert!(msg.contains("300s"));
        assert!(msg.contains("60s"));
    }

    #[test]
    fn test_context_extraction() {
        let error = WebhookError::InvalidFormat("error".to_string());
        assert!(error.context().is_some());

        let error = WebhookError::TimestampOutOfRange(300, 60);
        assert!(error.context().is_some());

        let error = WebhookError::VerificationFailed;
        assert!(error.context().is_none());
    }
}
