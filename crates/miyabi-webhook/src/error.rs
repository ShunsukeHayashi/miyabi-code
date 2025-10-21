//! Error types for webhook signature verification

use thiserror::Error;

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
