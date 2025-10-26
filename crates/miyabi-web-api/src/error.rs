//! Error types and handling

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

/// Application result type
pub type Result<T> = std::result::Result<T, AppError>;

/// Application error types
#[derive(Debug, Error)]
pub enum AppError {
    /// Database error
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    /// Authentication error
    #[error("Authentication error: {0}")]
    Authentication(String),
    /// Authorization error
    #[error("Authorization error: {0}")]
    Authorization(String),
    /// Not found error
    #[error("Not found: {0}")]
    NotFound(String),
    /// Validation error
    #[error("Validation error: {0}")]
    Validation(String),
    /// Configuration error
    #[error("Configuration error: {0}")]
    Configuration(String),
    /// Server error
    #[error("Server error: {0}")]
    Server(String),
    /// External API error
    #[error("External API error: {0}")]
    ExternalApi(String),
    /// JSON Web Token error
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    /// Generic internal error
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Error response for API clients
#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<String>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message, details) = match self {
            AppError::Database(ref e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "database_error",
                "A database error occurred",
                Some(e.to_string()),
            ),
            AppError::Authentication(ref msg) => (
                StatusCode::UNAUTHORIZED,
                "authentication_error",
                "Authentication failed",
                Some(msg.clone()),
            ),
            AppError::Authorization(ref msg) => (
                StatusCode::FORBIDDEN,
                "authorization_error",
                "Access denied",
                Some(msg.clone()),
            ),
            AppError::NotFound(ref msg) => (
                StatusCode::NOT_FOUND,
                "not_found",
                "Resource not found",
                Some(msg.clone()),
            ),
            AppError::Validation(ref msg) => (
                StatusCode::BAD_REQUEST,
                "validation_error",
                "Invalid input",
                Some(msg.clone()),
            ),
            AppError::Configuration(ref msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "configuration_error",
                "Server configuration error",
                Some(msg.clone()),
            ),
            AppError::Server(ref msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "server_error",
                "Server error",
                Some(msg.clone()),
            ),
            AppError::ExternalApi(ref msg) => (
                StatusCode::BAD_GATEWAY,
                "external_api_error",
                "External service error",
                Some(msg.clone()),
            ),
            AppError::Jwt(ref e) => (
                StatusCode::UNAUTHORIZED,
                "jwt_error",
                "Invalid or expired token",
                Some(e.to_string()),
            ),
            AppError::Internal(ref msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal_error",
                "An internal error occurred",
                Some(msg.clone()),
            ),
        };

        let error_response = ErrorResponse {
            error: error_type.to_string(),
            message: message.to_string(),
            details,
        };

        tracing::error!("API error: {:?}", self);

        (status, Json(error_response)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = AppError::NotFound("User not found".to_string());
        assert_eq!(err.to_string(), "Not found: User not found");
    }

    #[test]
    fn test_authentication_error() {
        let err = AppError::Authentication("Invalid credentials".to_string());
        assert_eq!(err.to_string(), "Authentication error: Invalid credentials");
    }
}
