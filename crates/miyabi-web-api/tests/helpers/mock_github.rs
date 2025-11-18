//! GitHub API mocking utilities for testing
//!
//! Provides mock GitHub OAuth responses for testing authentication flows

use serde_json::json;
use wiremock::{
    matchers::{method, path},
    Mock, MockServer, ResponseTemplate,
};

/// Create a mock GitHub OAuth token response
pub fn mock_github_token_response(access_token: &str, scope: &str) -> serde_json::Value {
    json!({
        "access_token": access_token,
        "token_type": "bearer",
        "scope": scope
    })
}

/// Create a mock GitHub user response
pub fn mock_github_user_response(
    id: i64,
    login: &str,
    email: Option<&str>,
    name: Option<&str>,
    avatar_url: Option<&str>,
) -> serde_json::Value {
    json!({
        "id": id,
        "login": login,
        "email": email,
        "name": name,
        "avatar_url": avatar_url
    })
}

/// Create a mock GitHub email response
pub fn mock_github_emails_response(email: &str) -> serde_json::Value {
    json!([
        {
            "email": email,
            "primary": true,
            "verified": true
        }
    ])
}

/// Setup mock GitHub OAuth server
pub async fn setup_mock_github_server() -> MockServer {
    MockServer::start().await
}

/// Mount successful OAuth token exchange
pub async fn mount_successful_token_exchange(
    server: &MockServer,
    access_token: &str,
) {
    Mock::given(method("POST"))
        .and(path("/login/oauth/access_token"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(mock_github_token_response(
                    access_token,
                    "read:user user:email repo",
                )),
        )
        .mount(server)
        .await;
}

/// Mount successful user fetch
pub async fn mount_successful_user_fetch(
    server: &MockServer,
    user_id: i64,
    login: &str,
    email: &str,
) {
    Mock::given(method("GET"))
        .and(path("/user"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(mock_github_user_response(
                    user_id,
                    login,
                    Some(email),
                    Some(login),
                    Some(&format!("https://avatars.githubusercontent.com/u/{}", user_id)),
                )),
        )
        .mount(server)
        .await;
}

/// Mount successful emails fetch
pub async fn mount_successful_emails_fetch(
    server: &MockServer,
    email: &str,
) {
    Mock::given(method("GET"))
        .and(path("/user/emails"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(mock_github_emails_response(email)),
        )
        .mount(server)
        .await;
}

/// Setup complete successful GitHub OAuth flow
pub async fn setup_successful_oauth_flow(
    server: &MockServer,
    access_token: &str,
    user_id: i64,
    login: &str,
    email: &str,
) {
    mount_successful_token_exchange(server, access_token).await;
    mount_successful_user_fetch(server, user_id, login, email).await;
    mount_successful_emails_fetch(server, email).await;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_github_server_setup() {
        let server = setup_mock_github_server().await;
        assert!(!server.uri().is_empty());
    }

    #[test]
    fn test_mock_responses() {
        let token_response = mock_github_token_response("token123", "read:user");
        assert_eq!(token_response["access_token"], "token123");

        let user_response = mock_github_user_response(
            12345,
            "testuser",
            Some("test@example.com"),
            Some("Test User"),
            Some("https://avatar.url"),
        );
        assert_eq!(user_response["id"], 12345);
        assert_eq!(user_response["login"], "testuser");
    }
}
