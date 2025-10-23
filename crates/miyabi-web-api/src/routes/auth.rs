//! Authentication route handlers

use crate::{
    auth::JwtManager,
    error::{AppError, Result},
    models::User,
    AppState,
};
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// GitHub OAuth initiation query parameters
#[derive(Deserialize)]
pub struct GitHubInitQuery {
    #[serde(default)]
    redirect: Option<String>,
}

/// GitHub OAuth callback query parameters
#[derive(Deserialize)]
pub struct GitHubCallbackQuery {
    code: String,
    #[serde(default)]
    state: Option<String>,
}

/// GitHub access token response
#[derive(Deserialize)]
#[allow(dead_code)]
struct GitHubAccessTokenResponse {
    access_token: String,
    token_type: String,
    scope: String,
}

/// GitHub user response
#[derive(Deserialize)]
#[allow(dead_code)]
struct GitHubUser {
    id: i64,
    login: String,
    email: Option<String>,
    name: Option<String>,
    avatar_url: Option<String>,
}

/// Token response
#[derive(Serialize)]
pub struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
    user: UserResponse,
}

/// User response
#[derive(Serialize)]
pub struct UserResponse {
    id: String,
    github_id: i64,
    email: String,
    name: Option<String>,
    avatar_url: Option<String>,
}

/// GitHub OAuth initiation handler
///
/// Redirects to GitHub OAuth authorization page
#[utoipa::path(
    get,
    path = "/api/v1/auth/github",
    tag = "auth",
    params(
        ("redirect" = Option<String>, Query, description = "Frontend redirect path after login")
    ),
    responses(
        (status = 302, description = "Redirect to GitHub OAuth"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn github_oauth_initiate(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<GitHubInitQuery>,
) -> Result<Redirect> {
    // Build GitHub OAuth URL
    let redirect_path = query.redirect.unwrap_or_else(|| "/dashboard".to_string());

    // Use state parameter to pass redirect path
    use urlencoding::encode;
    let auth_url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=read:user user:email repo&state={}",
        state.config.github_client_id,
        encode(&state.config.github_callback_url),
        encode(&redirect_path)
    );

    Ok(Redirect::temporary(&auth_url))
}

/// GitHub OAuth callback handler
///
/// Exchanges authorization code for access token and redirects to frontend
#[utoipa::path(
    get,
    path = "/api/v1/auth/github/callback",
    tag = "auth",
    params(
        ("code" = String, Query, description = "GitHub authorization code"),
        ("state" = Option<String>, Query, description = "Frontend redirect path")
    ),
    responses(
        (status = 302, description = "Redirect to frontend with token"),
        (status = 400, description = "Invalid authorization code"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn github_oauth_callback(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<GitHubCallbackQuery>,
) -> Result<impl IntoResponse> {
    // 1. Exchange code for GitHub access token
    let client = reqwest::Client::new();
    let token_response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "client_id": state.config.github_client_id,
            "client_secret": state.config.github_client_secret,
            "code": query.code,
        }))
        .send()
        .await
        .map_err(|e| AppError::ExternalApi(format!("Failed to exchange code: {}", e)))?
        .json::<GitHubAccessTokenResponse>()
        .await
        .map_err(|e| AppError::ExternalApi(format!("Failed to parse token response: {}", e)))?;

    // 2. Fetch GitHub user info
    let github_user = client
        .get("https://api.github.com/user")
        .header("User-Agent", "Miyabi-Web-API")
        .header(
            "Authorization",
            format!("Bearer {}", token_response.access_token),
        )
        .send()
        .await
        .map_err(|e| AppError::ExternalApi(format!("Failed to fetch user: {}", e)))?
        .json::<GitHubUser>()
        .await
        .map_err(|e| AppError::ExternalApi(format!("Failed to parse user response: {}", e)))?;

    // Fetch user email if not provided in user profile
    let email = if let Some(email) = github_user.email {
        email
    } else {
        // Fetch primary email from GitHub
        #[derive(Deserialize)]
        struct GitHubEmail {
            email: String,
            primary: bool,
        }

        let emails = client
            .get("https://api.github.com/user/emails")
            .header("User-Agent", "Miyabi-Web-API")
            .header(
                "Authorization",
                format!("Bearer {}", token_response.access_token),
            )
            .send()
            .await
            .map_err(|e| AppError::ExternalApi(format!("Failed to fetch emails: {}", e)))?
            .json::<Vec<GitHubEmail>>()
            .await
            .map_err(|e| AppError::ExternalApi(format!("Failed to parse emails: {}", e)))?;

        emails
            .into_iter()
            .find(|e| e.primary)
            .map(|e| e.email)
            .ok_or_else(|| AppError::Authentication("No primary email found".to_string()))?
    };

    // 3. Create or update user in database
    let user = create_or_update_user(
        &state.db,
        github_user.id,
        &email,
        github_user.name.as_deref(),
        github_user.avatar_url.as_deref(),
        &token_response.access_token,
    )
    .await?;

    // 4. Generate JWT tokens
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
    let access_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;

    // TODO: implement proper refresh token mechanism
    // let _refresh_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;

    // 5. Redirect to frontend with token
    use urlencoding::encode;
    let redirect_path = query.state.as_deref().unwrap_or("/dashboard");
    let frontend_redirect = format!(
        "{}{}?token={}",
        state.config.frontend_url,
        redirect_path,
        encode(&access_token)
    );

    Ok(Redirect::temporary(&frontend_redirect))
}

/// Creates or updates a user in the database
async fn create_or_update_user(
    db: &sqlx::PgPool,
    github_id: i64,
    email: &str,
    name: Option<&str>,
    avatar_url: Option<&str>,
    access_token: &str,
) -> Result<User> {
    // Check if user exists
    let existing_user: Option<User> = sqlx::query_as::<_, User>(
        r#"
        SELECT id, github_id, email, name, avatar_url, access_token, created_at, updated_at
        FROM users
        WHERE github_id = $1
        "#,
    )
    .bind(github_id)
    .fetch_optional(db)
    .await?;

    if let Some(_user) = existing_user {
        // Update existing user
        let updated_user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET email = $2, name = $3, avatar_url = $4, access_token = $5, updated_at = NOW()
            WHERE github_id = $1
            RETURNING id, github_id, email, name, avatar_url, access_token, created_at, updated_at
            "#,
        )
        .bind(github_id)
        .bind(email)
        .bind(name)
        .bind(avatar_url)
        .bind(access_token)
        .fetch_one(db)
        .await?;

        Ok(updated_user)
    } else {
        // Create new user
        let new_user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (github_id, email, name, avatar_url, access_token)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, github_id, email, name, avatar_url, access_token, created_at, updated_at
            "#,
        )
        .bind(github_id)
        .bind(email)
        .bind(name)
        .bind(avatar_url)
        .bind(access_token)
        .fetch_one(db)
        .await?;

        Ok(new_user)
    }
}

/// Refresh token request
#[derive(Deserialize)]
pub struct RefreshTokenRequest {
    refresh_token: String,
}

/// Refresh token handler
///
/// Issues a new access token using a refresh token
#[utoipa::path(
    post,
    path = "/api/v1/auth/refresh",
    tag = "auth",
    request_body = RefreshTokenRequest,
    responses(
        (status = 200, description = "Token refreshed", body = TokenResponse),
        (status = 401, description = "Invalid refresh token"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> Result<(StatusCode, Json<TokenResponse>)> {
    // 1. Validate refresh token
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
    let claims = jwt_manager.validate_token(&request.refresh_token)?;

    // 2. Fetch user from database
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID: {}", e)))?;

    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, github_id, email, name, avatar_url, access_token, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Authentication("User not found".to_string()))?;

    // 3. Generate new tokens
    let access_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;
    let new_refresh_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;

    Ok((
        StatusCode::OK,
        Json(TokenResponse {
            access_token,
            refresh_token: new_refresh_token,
            expires_in: state.config.jwt_expiration,
            user: UserResponse {
                id: user.id.to_string(),
                github_id: user.github_id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            },
        }),
    ))
}

/// Logout handler
///
/// Invalidates the current session
#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "auth",
    responses(
        (status = 200, description = "Logged out successfully"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn logout(State(_state): State<AppState>) -> Result<StatusCode> {
    // TODO: Implement token blacklist or session store
    // For now, we rely on client-side token removal

    Ok(StatusCode::OK)
}

/// Mock login request (development only)
#[derive(Deserialize)]
pub struct MockLoginRequest {
    username: String,
}

/// Mock login response
#[derive(Serialize)]
pub struct MockLoginResponse {
    token: String,
    user: MockUserResponse,
}

/// Mock user response
#[derive(Serialize)]
pub struct MockUserResponse {
    id: String,
    email: String,
    name: String,
    github_id: i64,
}

/// Mock login handler (development/testing only)
///
/// Creates a temporary user without GitHub authentication
///
/// **WARNING**: This endpoint should NEVER be enabled in production
#[utoipa::path(
    post,
    path = "/api/v1/auth/mock",
    tag = "auth",
    request_body = MockLoginRequest,
    responses(
        (status = 200, description = "Mock login successful", body = MockLoginResponse),
        (status = 403, description = "Mock login disabled in production"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn mock_login(
    State(state): State<AppState>,
    Json(request): Json<MockLoginRequest>,
) -> Result<(StatusCode, Json<MockLoginResponse>)> {
    // SECURITY: Only allow in development/test environments
    if state.config.environment == "production" {
        return Err(AppError::Authentication(
            "Mock login is disabled in production".to_string(),
        ));
    }

    // Generate a deterministic user ID based on username
    let user_id = Uuid::new_v5(&Uuid::NAMESPACE_DNS, request.username.as_bytes());
    let github_id = 999999; // Mock GitHub ID

    // Create JWT token
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
    let token = jwt_manager.create_token(&user_id.to_string(), github_id)?;

    // Create mock user response
    let email = format!("{}@example.com", request.username);
    let response = MockLoginResponse {
        token,
        user: MockUserResponse {
            id: user_id.to_string(),
            email: email.clone(),
            name: request.username.clone(),
            github_id,
        },
    };

    tracing::info!(
        "Mock login successful: {} ({})",
        request.username,
        user_id
    );

    Ok((StatusCode::OK, Json(response)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_response_serialization() {
        let response = UserResponse {
            id: "123e4567-e89b-12d3-a456-426614174000".to_string(),
            github_id: 12345,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            avatar_url: Some("https://example.com/avatar.jpg".to_string()),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("github_id"));
        assert!(json.contains("12345"));
    }
}
