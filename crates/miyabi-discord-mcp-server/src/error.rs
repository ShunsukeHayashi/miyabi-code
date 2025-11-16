use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
use thiserror::Error;

/// Error types for Discord MCP server operations
#[derive(Error, Debug)]
pub enum DiscordMcpError {
    /// Discord API returned an error
    #[error("Discord API error: {0}")]
    DiscordApi(String),

    /// Invalid parameters provided to an operation
    #[error("Invalid parameters: {0}")]
    InvalidParams(String),

    /// Requested resource was not found
    #[error("Not found: {0}")]
    NotFound(String),

    /// Authentication or authorization failed
    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    /// Rate limit exceeded
    #[error("Rate limited: {0}")]
    RateLimited(String),

    /// Internal server error
    #[error("Internal error: {0}")]
    Internal(String),

    /// JSON serialization/deserialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// HTTP request error
    #[error("HTTP error: {0}")]
    Http(String),
}

impl From<twilight_http::Error> for DiscordMcpError {
    fn from(err: twilight_http::Error) -> Self {
        Self::DiscordApi(err.to_string())
    }
}

/// Result type alias for Discord MCP operations
pub type Result<T> = std::result::Result<T, DiscordMcpError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for DiscordMcpError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::DiscordApi(_) => ErrorCode::HTTP_ERROR,
            Self::InvalidParams(_) => ErrorCode::INVALID_INPUT,
            Self::NotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::Unauthorized(_) => ErrorCode::AUTH_ERROR,
            Self::RateLimited(_) => ErrorCode::HTTP_ERROR,
            Self::Internal(_) => ErrorCode::INTERNAL_ERROR,
            Self::Serialization(_) => ErrorCode::PARSE_ERROR,
            Self::Http(_) => ErrorCode::HTTP_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::DiscordApi(msg) => format!(
                "Discord API error: {}. Please check your Discord bot configuration and permissions.",
                msg
            ),
            Self::InvalidParams(msg) => format!(
                "Invalid parameters: {}. Please check your input parameters.",
                msg
            ),
            Self::NotFound(resource) => format!(
                "Discord resource not found: {}. The requested resource may not exist or you may not have permission to access it.",
                resource
            ),
            Self::Unauthorized(msg) => format!(
                "Discord authorization failed: {}. Please verify your bot token and permissions.",
                msg
            ),
            Self::RateLimited(msg) => format!(
                "Discord rate limit exceeded: {}. Please wait before making more requests.",
                msg
            ),
            Self::Internal(msg) => format!(
                "Internal Discord MCP server error: {}. Please try again or contact support.",
                msg
            ),
            Self::Http(msg) => format!(
                "HTTP communication error: {}. Please check network connectivity.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::DiscordApi(msg) => Some(msg as &dyn Any),
            Self::InvalidParams(msg) => Some(msg as &dyn Any),
            Self::NotFound(resource) => Some(resource as &dyn Any),
            Self::Unauthorized(msg) => Some(msg as &dyn Any),
            Self::RateLimited(msg) => Some(msg as &dyn Any),
            Self::Internal(msg) => Some(msg as &dyn Any),
            Self::Http(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_discord_mcp_error_codes() {
        let error = DiscordMcpError::DiscordApi("error".to_string());
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);

        let error = DiscordMcpError::InvalidParams("bad params".to_string());
        assert_eq!(error.code(), ErrorCode::INVALID_INPUT);

        let error = DiscordMcpError::NotFound("channel".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = DiscordMcpError::Unauthorized("invalid token".to_string());
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = DiscordMcpError::RateLimited("too many requests".to_string());
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = DiscordMcpError::DiscordApi("forbidden".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Discord API"));
        assert!(msg.contains("forbidden"));

        let error = DiscordMcpError::NotFound("channel-123".to_string());
        let msg = error.user_message();
        assert!(msg.contains("not found"));
        assert!(msg.contains("channel-123"));

        let error = DiscordMcpError::RateLimited("retry after 60s".to_string());
        let msg = error.user_message();
        assert!(msg.contains("rate limit"));
        assert!(msg.contains("retry after 60s"));
    }

    #[test]
    fn test_context_extraction() {
        let error = DiscordMcpError::DiscordApi("error".to_string());
        assert!(error.context().is_some());

        let error = DiscordMcpError::NotFound("resource".to_string());
        assert!(error.context().is_some());

        let error = DiscordMcpError::Serialization(
            serde_json::from_str::<serde_json::Value>("invalid").unwrap_err(),
        );
        assert!(error.context().is_none());
    }
}
