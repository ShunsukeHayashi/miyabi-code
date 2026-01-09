//! Authentication route handlers

use crate::{
    auth::JwtManager,
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    models::{OrgMemberRole, User},
    AppState,
};
use axum::{
    extract::{Extension, State},
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
#[derive(Serialize, utoipa::ToSchema)]
pub struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
    user: UserResponse,
}

/// User response
#[derive(Serialize, utoipa::ToSchema)]
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
#[derive(Deserialize, utoipa::ToSchema)]
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

/// Logout request (optional, for explicit token invalidation)
#[derive(Deserialize, utoipa::ToSchema)]
pub struct LogoutRequest {
    /// Optional: specific token to invalidate (if not provided, uses Authorization header)
    #[serde(default)]
    pub token: Option<String>,
}

/// Logout handler
///
/// Invalidates the current session by adding the token to the blacklist.
/// Issue #1313: Implements secure logout with token invalidation.
#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "auth",
    responses(
        (status = 200, description = "Logged out successfully"),
        (status = 401, description = "Invalid or missing token"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn logout(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    body: Option<Json<LogoutRequest>>,
) -> Result<StatusCode> {
    // Extract token from header or body
    let token = if let Some(Json(req)) = body {
        if let Some(t) = req.token {
            t
        } else {
            extract_token_from_header(&headers)?
        }
    } else {
        extract_token_from_header(&headers)?
    };

    // Validate and get claims to determine expiration
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
    let claims = jwt_manager.validate_token(&token)?;

    // Add token to blacklist with its expiration time
    state
        .token_blacklist
        .add(&token, claims.exp)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to blacklist token: {}", e)))?;

    tracing::info!(
        user_id = %claims.sub,
        "User logged out, token blacklisted until {}",
        claims.exp
    );

    Ok(StatusCode::OK)
}

/// Extract bearer token from Authorization header
fn extract_token_from_header(headers: &axum::http::HeaderMap) -> Result<String> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;

    crate::auth::extract_bearer_token(auth_header).map(|s| s.to_string())
}

/// Switch organization request
///
/// Phase 1.5: Request to switch to a different organization context
#[derive(Deserialize, utoipa::ToSchema)]
pub struct SwitchOrganizationRequest {
    /// Organization ID to switch to (None to clear org context)
    pub organization_id: Option<Uuid>,
}

/// Switch organization response
#[derive(Serialize, utoipa::ToSchema)]
pub struct SwitchOrganizationResponse {
    /// New access token with org context
    pub access_token: String,
    /// Organization ID (if set)
    pub organization_id: Option<String>,
    /// User's role in the organization
    pub organization_role: Option<String>,
}

/// Switch organization handler
///
/// Phase 1.5: Issues a new token with organization context
#[utoipa::path(
    post,
    path = "/api/v1/auth/switch-organization",
    tag = "auth",
    request_body = SwitchOrganizationRequest,
    responses(
        (status = 200, description = "Organization switched", body = SwitchOrganizationResponse),
        (status = 401, description = "Not authenticated"),
        (status = 403, description = "Not a member of the organization"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn switch_organization(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Json(request): Json<SwitchOrganizationRequest>,
) -> Result<(StatusCode, Json<SwitchOrganizationResponse>)> {
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);

    // If no org_id provided, issue token without org context
    let (org_id, org_role) = match request.organization_id {
        None => (None, None),
        Some(org_id) => {
            // Verify user is a member of the organization
            let membership = sqlx::query_as::<_, (OrgMemberRole, String)>(
                r#"
                SELECT role, status
                FROM organization_members
                WHERE organization_id = $1 AND user_id = $2
                "#,
            )
            .bind(org_id)
            .bind(auth_user.user_id)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?;

            match membership {
                Some((role, status)) if status == "active" => {
                    (Some(org_id.to_string()), Some(role.to_string()))
                }
                Some((_, status)) => {
                    return Err(AppError::Authorization(format!(
                        "Membership is not active: {}",
                        status
                    )));
                }
                None => {
                    return Err(AppError::Authorization(
                        "Not a member of this organization".to_string(),
                    ));
                }
            }
        }
    };

    // Issue new token with org context
    let access_token = jwt_manager.create_token_with_org(
        &auth_user.user_id.to_string(),
        auth_user.github_id,
        org_id.as_deref(),
        org_role.as_deref(),
    )?;

    Ok((
        StatusCode::OK,
        Json(SwitchOrganizationResponse {
            access_token,
            organization_id: org_id,
            organization_role: org_role,
        }),
    ))
}

/// Mock login request
#[derive(Deserialize, utoipa::ToSchema)]
pub struct MockLoginRequest {
    github_id: i64,
    email: String,
    #[serde(default)]
    name: Option<String>,
}

/// Mock login handler (development only)
///
/// Creates a mock user for testing without OAuth flow
#[utoipa::path(
    post,
    path = "/api/v1/auth/mock",
    tag = "auth",
    request_body = MockLoginRequest,
    responses(
        (status = 200, description = "Mock login successful", body = TokenResponse),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn mock_login(
    State(state): State<AppState>,
    Json(request): Json<MockLoginRequest>,
) -> Result<(StatusCode, Json<TokenResponse>)> {
    // Create or update mock user
    let user = create_or_update_user(
        &state.db,
        request.github_id,
        &request.email,
        request.name.as_deref(),
        Some("https://avatars.githubusercontent.com/u/0"),
        "mock-access-token",
    )
    .await?;

    // Generate JWT tokens
    let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
    let access_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;
    let refresh_token = jwt_manager.create_token(&user.id.to_string(), user.github_id)?;

    Ok((
        StatusCode::OK,
        Json(TokenResponse {
            access_token,
            refresh_token,
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::AppConfig;
    use axum::{
        extract::State,
        http::{header, StatusCode},
        response::IntoResponse,
    };
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;

    fn test_config() -> AppConfig {
        AppConfig {
            database_url: "postgres://postgres:postgres@localhost/test".to_string(),
            server_address: "127.0.0.1:8080".to_string(),
            jwt_secret: "test_jwt_secret_key_for_routes".to_string(),
            github_client_id: "test-client-id".to_string(),
            github_client_secret: "test-client-secret".to_string(),
            github_callback_url: "http://localhost:8080/api/v1/auth/github/callback".to_string(),
            frontend_url: "http://localhost:3000".to_string(),
            jwt_expiration: 3600,
            refresh_expiration: 604800,
            environment: "test".to_string(),
        }
    }

    fn test_state() -> AppState {
        let config = Arc::new(test_config());
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect_lazy(&config.database_url)
            .expect("failed to create lazy pool");

        AppState {
            db: pool,
            jwt_secret: config.jwt_secret.clone(),
            jwt_manager: Arc::new(JwtManager::new(&config.jwt_secret, config.jwt_expiration)),
            token_blacklist: Arc::new(crate::auth::MemoryTokenBlacklist::new()),
            ws_manager: Arc::new(crate::websocket::WsState::new()),
            event_broadcaster: crate::events::EventBroadcaster::new(),
            config,
        }
    }

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

    #[tokio::test]
    async fn github_oauth_initiate_uses_redirect_parameter() {
        let state = test_state();
        let redirect = github_oauth_initiate(
            State(state),
            axum::extract::Query(GitHubInitQuery {
                redirect: Some("/custom/path".to_string()),
            }),
        )
        .await
        .unwrap()
        .into_response();

        let location = redirect
            .headers()
            .get(header::LOCATION)
            .expect("location header")
            .to_str()
            .unwrap();

        assert!(location.contains("client_id=test-client-id"));
        assert!(location.contains(
            "redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fv1%2Fauth%2Fgithub%2Fcallback"
        ));
        assert!(location.contains("state=%2Fcustom%2Fpath"));
    }

    #[tokio::test]
    async fn github_oauth_initiate_defaults_to_dashboard() {
        let state = test_state();
        let redirect = github_oauth_initiate(
            State(state),
            axum::extract::Query(GitHubInitQuery { redirect: None }),
        )
        .await
        .unwrap()
        .into_response();

        let location = redirect
            .headers()
            .get(header::LOCATION)
            .expect("location header")
            .to_str()
            .unwrap();

        assert!(location.contains("state=%2Fdashboard"));
    }

    #[tokio::test]
    async fn refresh_token_rejects_invalid_token() {
        let state = test_state();
        let result = refresh_token(
            State(state),
            Json(RefreshTokenRequest {
                refresh_token: "invalid-token".to_string(),
            }),
        )
        .await;

        assert!(matches!(result, Err(AppError::Jwt(_))));
    }

    #[tokio::test]
    async fn logout_rejects_missing_token() {
        let state = test_state();
        let headers = axum::http::HeaderMap::new();
        let result = logout(State(state), headers, None).await;
        assert!(matches!(result, Err(AppError::Authentication(_))));
    }

    #[tokio::test]
    async fn logout_blacklists_valid_token() {
        let state = test_state();
        let jwt_manager = JwtManager::new(&state.jwt_secret, state.config.jwt_expiration);
        let token = jwt_manager
            .create_token("123e4567-e89b-12d3-a456-426614174000", 12345)
            .unwrap();

        let mut headers = axum::http::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            format!("Bearer {}", token).parse().unwrap(),
        );

        // Logout should succeed
        let status = logout(State(state.clone()), headers, None).await.unwrap();
        assert_eq!(status, StatusCode::OK);

        // Token should now be blacklisted
        let is_blacklisted = state.token_blacklist.is_blacklisted(&token).await.unwrap();
        assert!(is_blacklisted);
    }
}
