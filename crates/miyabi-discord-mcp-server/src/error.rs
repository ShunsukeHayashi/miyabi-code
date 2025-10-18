use thiserror::Error;

#[derive(Error, Debug)]
pub enum DiscordMcpError {
    #[error("Discord API error: {0}")]
    DiscordApi(String),

    #[error("Invalid parameters: {0}")]
    InvalidParams(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Rate limited: {0}")]
    RateLimited(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("HTTP error: {0}")]
    Http(String),
}

impl From<twilight_http::Error> for DiscordMcpError {
    fn from(err: twilight_http::Error) -> Self {
        Self::DiscordApi(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, DiscordMcpError>;
