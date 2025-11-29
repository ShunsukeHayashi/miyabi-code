//! Error types for miyabi-auth

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    
    #[error("OAuth error: {0}")]
    OAuth(String),
    
    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Invalid token")]
    InvalidToken,
    
    #[error("Token expired")]
    TokenExpired,
    
    #[error("Provider not configured: {0}")]
    ProviderNotConfigured(String),
    
    #[error("Sandbox error: {0}")]
    Sandbox(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
