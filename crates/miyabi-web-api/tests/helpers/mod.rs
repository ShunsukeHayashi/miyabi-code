//! Test helpers module
//!
//! Provides common test utilities, database setup, and helper functions.

pub mod database;
pub mod mock_github;

#[cfg(feature = "lambda")]
pub mod lambda;

#[allow(unused_imports)]
pub use database::TestDatabase;
pub use database::{cleanup_test_database, setup_test_database};
pub use mock_github::*;

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use tower::ServiceExt;

/// Make a test request to a router
#[allow(dead_code)]
pub async fn make_request(
    router: Router,
    method: &str,
    uri: &str,
    body: Option<String>,
) -> (StatusCode, String) {
    let request = Request::builder().uri(uri).method(method);

    let request = if let Some(body_content) = body {
        request
            .header("content-type", "application/json")
            .body(Body::from(body_content))
            .unwrap()
    } else {
        request.body(Body::empty()).unwrap()
    };

    let response = router.oneshot(request).await.unwrap();
    let status = response.status();

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body_string = String::from_utf8(body_bytes.to_vec()).unwrap();

    (status, body_string)
}

/// Create a test JWT token
pub fn create_test_jwt(user_id: i64, username: &str) -> String {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: i64,
        username: String,
        exp: usize,
    }

    let claims = Claims {
        sub: user_id,
        username: username.to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "test_secret_key".to_string());
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .expect("Failed to create test JWT")
}

/// Create a test app configuration
pub fn create_test_config() -> miyabi_web_api::AppConfig {
    miyabi_web_api::AppConfig {
        database_url: std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://localhost/miyabi_test".to_string()),
        server_address: "127.0.0.1:8080".to_string(),
        jwt_secret: "test_jwt_secret_key_for_testing_only".to_string(),
        github_client_id: "test_client_id".to_string(),
        github_client_secret: "test_client_secret".to_string(),
        github_callback_url: "http://localhost:8080/auth/github/callback".to_string(),
        frontend_url: "http://localhost:3000".to_string(),
        jwt_expiration: 3600,
        refresh_expiration: 604800,
        environment: "test".to_string(),
    }
}

/// Assert response is JSON and contains expected fields
#[macro_export]
macro_rules! assert_json_response {
    ($response_body:expr, $($key:expr => $value:expr),*) => {
        {
            let json: serde_json::Value = serde_json::from_str($response_body)
                .expect("Response should be valid JSON");

            $(
                assert_eq!(
                    json.get($key).and_then(|v| v.as_str()),
                    Some($value),
                    "Expected {} to be {}, got {:?}",
                    $key,
                    $value,
                    json.get($key)
                );
            )*
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_test_jwt() {
        let token = create_test_jwt(1, "testuser");
        assert!(!token.is_empty());
        assert!(token.contains('.'));
    }
}
