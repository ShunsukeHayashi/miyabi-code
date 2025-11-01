//! API Error Types
//!
//! This module defines error types for the API layer with proper HTTP status codes
//! and JSON error responses.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// API Error type
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error("Bad request: {0}")]
    BadRequest(String),
}

/// Error response body
#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_type) = match &self {
            ApiError::NotFound(_) => (StatusCode::NOT_FOUND, "NOT_FOUND"),
            ApiError::ValidationError(_) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR"),
            ApiError::Unauthorized(_) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            ApiError::Forbidden(_) => (StatusCode::FORBIDDEN, "FORBIDDEN"),
            ApiError::Conflict(_) => (StatusCode::CONFLICT, "CONFLICT"),
            ApiError::InternalError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
            ApiError::BadRequest(_) => (StatusCode::BAD_REQUEST, "BAD_REQUEST"),
        };

        let body = ErrorResponse {
            error: error_type.to_string(),
            message: self.to_string(),
            details: None,
        };

        (status, Json(body)).into_response()
    }
}

/// Result type alias for API operations
pub type ApiResult<T> = Result<T, ApiError>;
