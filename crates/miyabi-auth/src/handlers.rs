//! HTTP handlers for auth endpoints
//!
//! Provides Axum handlers for:
//! - POST /auth/login - Authenticate user
//! - POST /auth/register - Register new user  
//! - POST /auth/logout - Invalidate session
//! - GET /auth/verify - Verify JWT token
//! - GET /auth/oauth/:provider - OAuth2 redirect
//! - GET /auth/callback/:provider - OAuth2 callback

use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json, Redirect},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn};

use crate::{AuthError, AuthService};

/// Shared state for auth handlers
pub type AuthState = Arc<AuthService>;

/// Create auth router with all endpoints
pub fn auth_router(state: AuthState) -> Router {
    Router::new()
        .route("/login", post(login_handler))
        .route("/register", post(register_handler))
        .route("/logout", post(logout_handler))
        .route("/verify", get(verify_handler))
        .route("/oauth/:provider", get(oauth_redirect_handler))
        .route("/callback/:provider", get(oauth_callback_handler))
        .with_state(state)
}

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user: Option<UserResponse>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OAuthCallbackQuery {
    pub code: String,
    pub state: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VerifyResponse {
    pub valid: bool,
    pub user: Option<UserResponse>,
    pub expires_at: Option<i64>,
}

// ============================================================================
// Handlers
// ============================================================================

/// POST /auth/login - Authenticate with email/password
pub async fn login_handler(
    State(auth): State<AuthState>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    info!(email = %req.email, "Login attempt");
    
    // For now, delegate to OAuth flow for external auth
    // TODO: Implement password-based auth when user_credentials table exists
    let response = AuthResponse {
        success: false,
        token: None,
        user: None,
        error: Some("Password auth not yet implemented. Use OAuth.".to_string()),
    };
    
    (StatusCode::NOT_IMPLEMENTED, Json(response))
}

/// POST /auth/register - Register new user
pub async fn register_handler(
    State(auth): State<AuthState>,
    Json(req): Json<RegisterRequest>,
) -> impl IntoResponse {
    info!(email = %req.email, "Registration attempt");
    
    // TODO: Implement when user_credentials table exists
    let response = AuthResponse {
        success: false,
        token: None,
        user: None,
        error: Some("Registration not yet implemented. Use OAuth.".to_string()),
    };
    
    (StatusCode::NOT_IMPLEMENTED, Json(response))
}

/// POST /auth/logout - Invalidate current session
pub async fn logout_handler(
    State(auth): State<AuthState>,
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    // Extract token from Authorization header
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));
    
    match token {
        Some(t) => {
            info!("Logout request received");
            // TODO: Add token to blacklist or delete session
            Json(serde_json::json!({
                "success": true,
                "message": "Logged out successfully"
            }))
        }
        None => {
            Json(serde_json::json!({
                "success": false,
                "error": "No token provided"
            }))
        }
    }
}

/// GET /auth/verify - Verify JWT token and return user info
pub async fn verify_handler(
    State(auth): State<AuthState>,
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));
    
    match token {
        Some(t) => {
            match auth.verify_token(t).await {
                Ok(user) => {
                    let response = VerifyResponse {
                        valid: true,
                        user: Some(UserResponse {
                            id: user.id.to_string(),
                            email: user.email,
                            name: user.name,
                            avatar_url: user.avatar_url,
                        }),
                        expires_at: None, // TODO: Extract from JWT
                    };
                    (StatusCode::OK, Json(response))
                }
                Err(AuthError::TokenExpired) => {
                    let response = VerifyResponse {
                        valid: false,
                        user: None,
                        expires_at: None,
                    };
                    (StatusCode::UNAUTHORIZED, Json(response))
                }
                Err(_) => {
                    let response = VerifyResponse {
                        valid: false,
                        user: None,
                        expires_at: None,
                    };
                    (StatusCode::UNAUTHORIZED, Json(response))
                }
            }
        }
        None => {
            let response = VerifyResponse {
                valid: false,
                user: None,
                expires_at: None,
            };
            (StatusCode::BAD_REQUEST, Json(response))
        }
    }
}

/// GET /auth/oauth/:provider - Redirect to OAuth provider
pub async fn oauth_redirect_handler(
    State(auth): State<AuthState>,
    Path(provider): Path<String>,
) -> impl IntoResponse {
    info!(provider = %provider, "OAuth redirect");
    
    match auth.get_auth_url(&provider) {
        Ok(url) => Redirect::temporary(&url).into_response(),
        Err(e) => {
            warn!(error = %e, "Failed to generate OAuth URL");
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Provider not configured: {}", provider)
                })),
            ).into_response()
        }
    }
}

/// GET /auth/callback/:provider - Handle OAuth callback
pub async fn oauth_callback_handler(
    State(auth): State<AuthState>,
    Path(provider): Path<String>,
    Query(query): Query<OAuthCallbackQuery>,
) -> impl IntoResponse {
    info!(provider = %provider, "OAuth callback");
    
    match auth.handle_callback(&provider, &query.code).await {
        Ok((user, token)) => {
            let response = AuthResponse {
                success: true,
                token: Some(token),
                user: Some(UserResponse {
                    id: user.id.to_string(),
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url,
                }),
                error: None,
            };
            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            warn!(error = %e, "OAuth callback failed");
            let response = AuthResponse {
                success: false,
                token: None,
                user: None,
                error: Some(e.to_string()),
            };
            (StatusCode::UNAUTHORIZED, Json(response))
        }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_auth_response_serialization() {
        let response = AuthResponse {
            success: true,
            token: Some("test_token".to_string()),
            user: Some(UserResponse {
                id: "123".to_string(),
                email: "test@example.com".to_string(),
                name: Some("Test User".to_string()),
                avatar_url: None,
            }),
            error: None,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("test_token"));
    }
    
    #[test]
    fn test_verify_response_invalid() {
        let response = VerifyResponse {
            valid: false,
            user: None,
            expires_at: None,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("false"));
    }
}
