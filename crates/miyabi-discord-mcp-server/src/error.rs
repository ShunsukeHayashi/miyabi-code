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
