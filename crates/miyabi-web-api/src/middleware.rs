//! Middleware for authentication and authorization

use crate::{
    auth::JwtManager,
    error::{AppError, Result},
};
use axum::{
    extract::{Request, State},
    http::HeaderMap,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

/// Extension type for authenticated user ID
#[derive(Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub github_id: i64,
}

/// Extract JWT token from Authorization header
fn extract_token(headers: &HeaderMap) -> Result<String> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;

    crate::auth::extract_bearer_token(auth_header).map(|s| s.to_string())
}

/// Authentication middleware
///
/// Validates JWT token and attaches user info to request extensions
pub async fn auth_middleware(
    State(jwt_secret): State<String>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Extract token from headers
    let token = extract_token(request.headers())?;

    // Validate token
    let jwt_manager = JwtManager::new(&jwt_secret, 3600);
    let claims = jwt_manager.validate_token(&token)?;

    // Parse user ID
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID: {}", e)))?;

    // Attach user info to request
    let auth_user = AuthenticatedUser {
        user_id,
        github_id: claims.github_id,
    };
    request.extensions_mut().insert(auth_user);

    Ok(next.run(request).await)
}
