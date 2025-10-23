use axum::{
    extract::Query,
    response::{IntoResponse, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Deserialize)]
pub struct GitHubCallbackQuery {
    code: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    token: String,
    user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    id: String,
    github_username: String,
    email: Option<String>,
    avatar_url: Option<String>,
}

/// GET /api/auth/github
/// Redirects to GitHub OAuth authorization page
pub async fn github_auth_redirect() -> impl IntoResponse {
    let client_id = env::var("GITHUB_CLIENT_ID").expect("GITHUB_CLIENT_ID must be set");
    let redirect_uri = env::var("GITHUB_REDIRECT_URI").expect("GITHUB_REDIRECT_URI must be set");

    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo,read:user",
        client_id, redirect_uri
    );

    Redirect::temporary(&url)
}

/// GET /api/auth/github/callback?code=xxx
/// Handles GitHub OAuth callback
pub async fn github_auth_callback(
    Query(query): Query<GitHubCallbackQuery>,
) -> Result<Json<AuthResponse>, String> {
    // Exchange code for access token
    let access_token = exchange_code_for_token(&query.code)
        .await
        .map_err(|e| e.to_string())?;

    // Fetch GitHub user info
    let github_user = fetch_github_user(&access_token)
        .await
        .map_err(|e| e.to_string())?;

    // TODO: Create/update user in database

    // Generate JWT
    let jwt_token = generate_jwt(&github_user.login).map_err(|e| e.to_string())?;

    Ok(Json(AuthResponse {
        token: jwt_token,
        user: UserResponse {
            id: github_user.id.to_string(),
            github_username: github_user.login.clone(),
            email: github_user.email,
            avatar_url: Some(github_user.avatar_url),
        },
    }))
}

/// GET /api/auth/me
/// Returns current authenticated user
pub async fn get_current_user() -> Result<Json<UserResponse>, String> {
    // TODO: Implement JWT validation and user fetching
    Err("Not implemented".to_string())
}

/// POST /api/auth/logout
/// Logs out the current user
pub async fn logout() -> Result<Json<serde_json::Value>, String> {
    Ok(Json(serde_json::json!({"success": true})))
}

/// POST /api/auth/mock
/// Mock authentication endpoint for development (bypasses GitHub OAuth)
/// Request body: { "username": "test-user" }
pub async fn mock_auth(Json(payload): Json<serde_json::Value>) -> Result<Json<AuthResponse>, String> {
    // Only allow in development mode
    if std::env::var("RUST_ENV").unwrap_or_default() == "production" {
        return Err("Mock auth not available in production".to_string());
    }

    let username = payload
        .get("username")
        .and_then(|v| v.as_str())
        .unwrap_or("test-user");

    // Generate JWT
    let jwt_token = generate_jwt(username).map_err(|e| e.to_string())?;

    Ok(Json(AuthResponse {
        token: jwt_token,
        user: UserResponse {
            id: "mock-user-123".to_string(),
            github_username: username.to_string(),
            email: Some(format!("{}@example.com", username)),
            avatar_url: Some("https://github.com/github.png".to_string()),
        },
    }))
}

// Helper functions

#[derive(Debug, Deserialize)]
struct GitHubTokenResponse {
    access_token: String,
}

async fn exchange_code_for_token(code: &str) -> anyhow::Result<String> {
    let client_id = env::var("GITHUB_CLIENT_ID")?;
    let client_secret = env::var("GITHUB_CLIENT_SECRET")?;

    let client = reqwest::Client::new();
    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
        }))
        .send()
        .await?;

    let token_response: GitHubTokenResponse = response.json().await?;
    Ok(token_response.access_token)
}

#[derive(Debug, Deserialize)]
struct GitHubUser {
    id: u64,
    login: String,
    email: Option<String>,
    avatar_url: String,
}

async fn fetch_github_user(access_token: &str) -> anyhow::Result<GitHubUser> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("User-Agent", "Miyabi-Web-API")
        .send()
        .await?;

    let user: GitHubUser = response.json().await?;
    Ok(user)
}

fn generate_jwt(username: &str) -> anyhow::Result<String> {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        exp: usize,
    }

    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "default-secret-change-me".to_string());

    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(7))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: username.to_string(),
        exp: expiration as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )?;

    Ok(token)
}
