//! Error types and handling

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

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
    /// Telegram error
    #[error("Telegram error: {0}")]
    Telegram(String),
    /// Generic internal error
    #[error("Internal error: {0}")]
    Internal(String),
}

// Implement From<TelegramError> for AppError
impl From<miyabi_telegram::TelegramError> for AppError {
    fn from(err: miyabi_telegram::TelegramError) -> Self {
        AppError::Telegram(err.to_string())
    }
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
            AppError::Telegram(ref msg) => (
                StatusCode::BAD_GATEWAY,
                "telegram_error",
                "Telegram API error",
                Some(msg.clone()),
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

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for AppError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::Database(_) => ErrorCode::STORAGE_ERROR,
            Self::Authentication(_) => ErrorCode::AUTH_ERROR,
            Self::Authorization(_) => ErrorCode::AUTH_ERROR,
            Self::NotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::Validation(_) => ErrorCode::VALIDATION_ERROR,
            Self::Configuration(_) => ErrorCode::CONFIG_ERROR,
            Self::Server(_) => ErrorCode::INTERNAL_ERROR,
            Self::ExternalApi(_) => ErrorCode::HTTP_ERROR,
            Self::Jwt(_) => ErrorCode::AUTH_ERROR,
            Self::Telegram(_) => ErrorCode::HTTP_ERROR,
            Self::Internal(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::Database(_) => {
                "A database error occurred. Please try again later or contact support.".to_string()
            }
            Self::Authentication(msg) => format!(
                "Authentication failed: {}. Please check your credentials and try again.",
                msg
            ),
            Self::Authorization(msg) => format!(
                "Access denied: {}. You don't have permission to access this resource.",
                msg
            ),
            Self::NotFound(msg) => format!(
                "Resource not found: {}. The requested resource may not exist or has been removed.",
                msg
            ),
            Self::Validation(msg) => format!(
                "Invalid input: {}. Please check your data and try again.",
                msg
            ),
            Self::Configuration(msg) => format!(
                "Server configuration error: {}. Please contact the administrator.",
                msg
            ),
            Self::Server(msg) => format!(
                "Server error: {}. Please try again later.",
                msg
            ),
            Self::ExternalApi(msg) => format!(
                "External service error: {}. The external service may be temporarily unavailable.",
                msg
            ),
            Self::Telegram(msg) => format!(
                "Telegram API error: {}. Please check your Telegram bot configuration.",
                msg
            ),
            Self::Internal(msg) => format!(
                "An internal error occurred: {}. Please try again or contact support.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::Authentication(msg) => Some(msg as &dyn Any),
            Self::Authorization(msg) => Some(msg as &dyn Any),
            Self::NotFound(msg) => Some(msg as &dyn Any),
            Self::Validation(msg) => Some(msg as &dyn Any),
            Self::Configuration(msg) => Some(msg as &dyn Any),
            Self::Server(msg) => Some(msg as &dyn Any),
            Self::ExternalApi(msg) => Some(msg as &dyn Any),
            Self::Telegram(msg) => Some(msg as &dyn Any),
            Self::Internal(msg) => Some(msg as &dyn Any),
            _ => None,
        }
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

    #[test]
    fn test_app_error_codes() {
        let error = AppError::Authentication("invalid".to_string());
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = AppError::NotFound("user".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = AppError::Validation("bad input".to_string());
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = AppError::Configuration("missing key".to_string());
        assert_eq!(error.code(), ErrorCode::CONFIG_ERROR);

        let error = AppError::ExternalApi("service down".to_string());
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = AppError::Authentication("bad token".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Authentication failed"));
        assert!(msg.contains("bad token"));

        let error = AppError::NotFound("page".to_string());
        let msg = error.user_message();
        assert!(msg.contains("not found"));
        assert!(msg.contains("page"));

        let error = AppError::Validation("required field".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Invalid input"));
        assert!(msg.contains("required field"));
    }

    #[test]
    fn test_context_extraction() {
        let error = AppError::Authentication("error".to_string());
        assert!(error.context().is_some());

        let error = AppError::NotFound("item".to_string());
        assert!(error.context().is_some());

        let error = AppError::Database(sqlx::Error::RowNotFound);
        assert!(error.context().is_none());
    }
}
