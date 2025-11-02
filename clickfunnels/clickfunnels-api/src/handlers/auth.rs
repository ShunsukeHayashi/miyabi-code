//! Authentication Handlers
//!
//! This module implements HTTP handlers for authentication operations.

use axum::{http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};

use crate::{
    error::{ApiError, ApiResult},
    middleware::auth::AuthenticatedUser,
    state::AppState,
    utils::{jwt::generate_token, password::verify_password},
};

/// Login request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub email: String,
}

/// Logout response
#[derive(Debug, Serialize)]
pub struct LogoutResponse {
    pub message: String,
}

/// User info response
#[derive(Debug, Serialize)]
pub struct UserInfoResponse {
    pub user_id: String,
    pub email: String,
}

/// Login handler
///
/// POST /api/v1/auth/login
pub async fn login(
    axum::extract::State(state): axum::extract::State<AppState>,
    Json(req): Json<LoginRequest>,
) -> ApiResult<Json<LoginResponse>> {
    // Find user by email
    let user = state
        .db
        .users()
        .find_by_email(&req.email)
        .await
        .map_err(|_| ApiError::Unauthorized("Invalid email or password".to_string()))?;

    // Verify password
    let is_valid = verify_password(&req.password, &user.password_hash)
        .map_err(|e| ApiError::InternalError(format!("Password verification failed: {}", e)))?;

    if !is_valid {
        return Err(ApiError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    // Generate JWT token
    let token = generate_token(user.id, user.email.clone())
        .map_err(|e| ApiError::InternalError(format!("Token generation failed: {}", e)))?;

    tracing::info!("User logged in: {}", user.email);

    Ok(Json(LoginResponse {
        token,
        user_id: user.id.to_string(),
        email: user.email,
    }))
}

/// Logout handler (stateless JWT, just returns success)
///
/// POST /api/v1/auth/logout
pub async fn logout(
    Extension(_user): Extension<AuthenticatedUser>,
) -> ApiResult<(StatusCode, Json<LogoutResponse>)> {
    // In a stateless JWT system, we can't actually invalidate the token
    // The client should delete the token on their side
    // For a more secure implementation, consider using a token blacklist

    Ok((
        StatusCode::OK,
        Json(LogoutResponse {
            message: "Logged out successfully".to_string(),
        }),
    ))
}

/// Get current user info
///
/// GET /api/v1/auth/me
pub async fn me(Extension(user): Extension<AuthenticatedUser>) -> ApiResult<Json<UserInfoResponse>> {
    Ok(Json(UserInfoResponse {
        user_id: user.sub,
        email: user.email,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_login_request_deserialize() {
        let json = r#"{"email":"test@example.com","password":"password123"}"#;
        let req: LoginRequest = serde_json::from_str(json).unwrap();

        assert_eq!(req.email, "test@example.com");
        assert_eq!(req.password, "password123");
    }

    #[test]
    fn test_login_response_serialize() {
        let response = LoginResponse {
            token: "token123".to_string(),
            user_id: "user-id".to_string(),
            email: "test@example.com".to_string(),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("token123"));
        assert!(json.contains("test@example.com"));
    }
}
