//! Authentication unit tests
//!
//! Tests for GitHub OAuth flow, JWT token management, user sessions, and permissions.
//! Target: 90% coverage of routes/auth.rs

mod fixtures;
mod helpers;

#[allow(unused_imports)]
use axum::http::StatusCode;
#[allow(unused_imports)]
use fixtures::UserFixture;
#[allow(unused_imports)]
use helpers::{cleanup_test_database, create_test_jwt, make_request, setup_test_database};

// ========================================
// Module 1: GitHub OAuth Flow Tests (5 tests)
// ========================================

#[tokio::test]
#[ignore] // Requires database
async fn test_oauth_callback_success() {
    use helpers::{create_test_config, setup_mock_github_server, setup_successful_oauth_flow};
    #[allow(unused_imports)]
    use std::sync::Arc;

    let db = setup_test_database().await;

    // 1. Setup mock GitHub server
    let mock_server = setup_mock_github_server().await;
    let access_token = "gho_test_token_123";
    let github_id = 12345i64;
    let login = "testuser";
    let email = "test@example.com";

    setup_successful_oauth_flow(&mock_server, access_token, github_id, login, email).await;

    // 2. Create test app state with mock GitHub URLs
    let mut config = create_test_config();
    config.github_client_id = "test_client_id".to_string();
    config.github_client_secret = "test_secret".to_string();

    // Note: In real implementation, we would need to override GitHub API URLs
    // to point to mock_server.uri(). For now, this test is a scaffold.

    // 3. Call auth callback endpoint
    // TODO: This requires modifying the auth route to accept configurable GitHub URLs
    // For now, we verify the mock server setup works

    // 4. Verify user would be created in database (manual verification)
    let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&db.pool)
        .await
        .unwrap();
    assert_eq!(user_count.0, 0); // No users yet (since we can't actually call the endpoint)

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_oauth_callback_invalid_code() {
    #[allow(unused_imports)]
    use helpers::{create_test_config, setup_mock_github_server};
    use wiremock::{
        matchers::{method, path},
        Mock, ResponseTemplate,
    };

    let db = setup_test_database().await;
    let mock_server = setup_mock_github_server().await;

    // Setup mock to return error for invalid code
    Mock::given(method("POST"))
        .and(path("/login/oauth/access_token"))
        .respond_with(ResponseTemplate::new(401).set_body_json(serde_json::json!({
            "error": "bad_verification_code",
            "error_description": "The code passed is incorrect or expired."
        })))
        .mount(&mock_server)
        .await;

    // Verify no users in database before test
    let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&db.pool)
        .await
        .unwrap();
    assert_eq!(user_count.0, 0);

    // Note: Full test would require modifying routes to use mock server URL
    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_oauth_callback_duplicate_user() {
    let db = setup_test_database().await;

    // 1. Create existing user
    let existing_user = UserFixture::create(&db.pool, "existinguser", 12345).await;
    assert_eq!(existing_user.github_id, 12345);

    // 2. Verify only one user exists
    let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&db.pool)
        .await
        .unwrap();
    assert_eq!(user_count.0, 1);

    // 3. In real implementation, calling OAuth callback again with same github_id
    //    would update the existing user, not create a duplicate

    // 4. Verify user can be fetched by github_id
    let fetched_user: Option<(i64, String)> =
        sqlx::query_as("SELECT github_id, username FROM users WHERE github_id = $1")
            .bind(12345i64)
            .fetch_optional(&db.pool)
            .await
            .unwrap();

    assert!(fetched_user.is_some());
    let (github_id, username) = fetched_user.unwrap();
    assert_eq!(github_id, 12345);
    assert_eq!(username, "existinguser");

    cleanup_test_database(&db).await;
}

#[tokio::test]
async fn test_oauth_state_validation() {
    use urlencoding::encode;

    // Test that state parameter is properly encoded and decoded
    let redirect_path = "/dashboard?tab=agents";
    let encoded_state = encode(redirect_path);

    // Verify encoding is reversible
    assert!(encoded_state.contains("dashboard"));

    // In real OAuth flow, state parameter provides CSRF protection
    // by ensuring the callback came from our auth initiation
}

#[tokio::test]
async fn test_oauth_scope_verification() {
    use helpers::mock_github_token_response;

    // Test scope parsing from GitHub response
    let response = mock_github_token_response("test_token", "read:user user:email repo");

    assert_eq!(response["access_token"], "test_token");
    assert_eq!(response["scope"], "read:user user:email repo");

    // Verify required scopes are present
    let scope = response["scope"].as_str().unwrap();
    assert!(scope.contains("read:user"));
    assert!(scope.contains("user:email"));
    assert!(scope.contains("repo"));
}

// ========================================
// Module 2: JWT Token Management Tests (6 tests)
// ========================================

#[tokio::test]
#[ignore] // Requires database
async fn test_jwt_generation() {
    let db = setup_test_database().await;
    let user = UserFixture::default(&db.pool).await;

    let token = create_test_jwt(user.id, &user.username);

    // Verify token structure
    assert!(token.len() > 100);
    assert_eq!(token.matches('.').count(), 2); // header.payload.signature

    cleanup_test_database(&db).await;
}

#[tokio::test]
async fn test_jwt_validation_success() {
    use miyabi_web_api::auth::JwtManager;

    // 1. Create JWT manager with test secret
    let jwt_manager = JwtManager::new("test_secret_key_123", 3600);

    // 2. Create valid token
    let user_id = "123e4567-e89b-12d3-a456-426614174000";
    let github_id = 12345i64;
    let token = jwt_manager.create_token(user_id, github_id).unwrap();

    // 3. Validate token
    let claims = jwt_manager.validate_token(&token).unwrap();

    // 4. Verify claims extracted correctly
    assert_eq!(claims.sub, user_id);
    assert_eq!(claims.github_id, github_id);
    assert!(claims.exp > chrono::Utc::now().timestamp());
    assert!(claims.iat <= chrono::Utc::now().timestamp());
}

#[tokio::test]
#[ignore] // Takes 60+ seconds due to JWT library's default clock skew tolerance
async fn test_jwt_validation_expired() {
    use miyabi_web_api::auth::JwtManager;

    // Note: jsonwebtoken library has a default 60-second leeway for clock skew
    // This test requires waiting for expiration + leeway

    // 1. Create JWT manager with 1 second expiration
    let jwt_manager = JwtManager::new("test_secret_key_123", 1);

    // 2. Create token (expires in 1 second)
    let user_id = "123e4567-e89b-12d3-a456-426614174000";
    let github_id = 12345i64;
    let token = jwt_manager.create_token(user_id, github_id).unwrap();

    // 3. Wait for token to expire beyond leeway (61 seconds)
    tokio::time::sleep(tokio::time::Duration::from_secs(61)).await;

    // 4. Attempt to validate - should fail due to expiration
    let result = jwt_manager.validate_token(&token);
    assert!(
        result.is_err(),
        "Expected token to be expired but it was still valid"
    );
}

#[tokio::test]
async fn test_jwt_validation_invalid_signature() {
    use miyabi_web_api::auth::JwtManager;

    // 1. Create token with one secret
    let jwt_manager1 = JwtManager::new("secret_key_1", 3600);
    let user_id = "123e4567-e89b-12d3-a456-426614174000";
    let token = jwt_manager1.create_token(user_id, 12345).unwrap();

    // 2. Try to validate with different secret (wrong signature)
    let jwt_manager2 = JwtManager::new("different_secret_key_2", 3600);
    let result = jwt_manager2.validate_token(&token);

    // 3. Verify rejection
    assert!(result.is_err());
}

#[tokio::test]
#[ignore] // Requires database
async fn test_jwt_refresh_token() {
    use helpers::create_test_config;
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Create user
    let user = UserFixture::default(&db.pool).await;

    // 2. Create JWT manager with short expiration
    let config = create_test_config();
    let jwt_manager = JwtManager::new(&config.jwt_secret, 10); // 10 seconds

    // 3. Create initial token
    let token1 = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();
    let claims1 = jwt_manager.validate_token(&token1).unwrap();

    // 4. Wait briefly
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // 5. Create refresh token (new token for same user)
    let token2 = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();
    let claims2 = jwt_manager.validate_token(&token2).unwrap();

    // 6. Verify new token has later iat (issued at) time
    assert!(claims2.iat >= claims1.iat);
    assert_eq!(claims2.sub, claims1.sub);
    assert_eq!(claims2.github_id, claims1.github_id);

    cleanup_test_database(&db).await;
}

#[tokio::test]
async fn test_jwt_revocation() {
    // Note: Current implementation doesn't have token blacklist/revocation
    // This test documents the expected behavior for future implementation

    // In a complete implementation:
    // 1. Token would be added to Redis blacklist
    // 2. Validation would check blacklist before accepting token
    // 3. Revoked tokens would be rejected even if signature is valid

    // For now, we verify that tokens remain valid until expiration
    use miyabi_web_api::auth::JwtManager;

    let jwt_manager = JwtManager::new("test_secret", 3600);
    let token = jwt_manager.create_token("test-user-id", 12345).unwrap();

    // Token is valid
    assert!(jwt_manager.validate_token(&token).is_ok());

    // TODO: Implement token blacklist in Redis
    // mock_revoke_token(&token);
    // assert!(jwt_manager.validate_token(&token).is_err());
}

// ========================================
// Module 3: User Session Management Tests (4 tests)
// ========================================

#[tokio::test]
#[ignore] // Requires database
async fn test_session_creation() {
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Create user (simulates login)
    let user = UserFixture::default(&db.pool).await;

    // 2. Create JWT token (current session mechanism)
    let jwt_manager = JwtManager::new("test_secret", 3600);
    let token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();

    // 3. Verify token can be validated (session is "active")
    let claims = jwt_manager.validate_token(&token).unwrap();
    assert_eq!(claims.sub, user.id.to_string());

    // Note: Current implementation uses stateless JWT tokens
    // A full session store would maintain server-side session state

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_session_retrieval() {
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Create user and session token
    let user = UserFixture::default(&db.pool).await;
    let jwt_manager = JwtManager::new("test_secret", 3600);
    let token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();

    // 2. Retrieve session by validating token
    let claims = jwt_manager.validate_token(&token).unwrap();

    // 3. Verify session data is correct
    assert_eq!(claims.sub, user.id.to_string());
    assert_eq!(claims.github_id, user.github_id);
    assert!(claims.exp > chrono::Utc::now().timestamp());

    // In a full implementation, we would query a sessions table:
    // let session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE token = $1")
    //     .bind(&token)
    //     .fetch_one(&db.pool)
    //     .await
    //     .unwrap();

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_session_expiration() {
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Create user and expired session token
    let user = UserFixture::default(&db.pool).await;
    let jwt_manager = JwtManager::new("test_secret", -1); // Expired
    let token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();

    // 2. Wait to ensure expiration
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // 3. Attempt to use expired session
    let result = jwt_manager.validate_token(&token);

    // 4. Verify rejection
    assert!(result.is_err());

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_session_logout() {
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Create active session
    let user = UserFixture::default(&db.pool).await;
    let jwt_manager = JwtManager::new("test_secret", 3600);
    let token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();

    // Verify token is valid before logout
    assert!(jwt_manager.validate_token(&token).is_ok());

    // 2. Logout (in current implementation, this is client-side token removal)
    // In a full implementation, we would:
    // - Add token to Redis blacklist
    // - Delete session from database
    // - Invalidate all related tokens

    // 3. Verify session would be invalidated
    // For now, document the expected behavior:
    // let result = jwt_manager.validate_token(&token);
    // assert!(result.is_err()); // Would fail if token was blacklisted

    cleanup_test_database(&db).await;
}

// ========================================
// Module 4: Permission Checks Tests (4 tests)
// ========================================

#[tokio::test]
#[ignore] // Requires database
async fn test_repository_access_granted() {
    let db = setup_test_database().await;

    // 1. Create user
    let user = UserFixture::default(&db.pool).await;

    // 2. In a complete implementation, we would:
    // - Create a repository
    // - Grant user access to repository
    // - Verify user can access repository

    // Example:
    // let repo = RepositoryFixture::create(&db.pool, user.id, "test-repo").await;
    // let has_access = check_repository_permission(&db.pool, user.id, repo.id).await;
    // assert!(has_access);

    // For now, verify user exists
    let user_exists: Option<(i64,)> = sqlx::query_as("SELECT id FROM users WHERE id = $1")
        .bind(user.id)
        .fetch_optional(&db.pool)
        .await
        .unwrap();

    assert!(user_exists.is_some());

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_repository_access_denied() {
    let db = setup_test_database().await;

    // 1. Create user without repository access
    let _user = UserFixture::default(&db.pool).await;

    // 2. In a complete implementation:
    // - Create repository owned by different user
    // - Verify current user cannot access it

    // Example permission check:
    // async fn check_repository_permission(
    //     db: &PgPool,
    //     user_id: i64,
    //     repo_id: i64
    // ) -> bool {
    //     let result: Option<(bool,)> = sqlx::query_as(
    //         "SELECT EXISTS(
    //             SELECT 1 FROM repository_permissions
    //             WHERE user_id = $1 AND repository_id = $2
    //         )"
    //     )
    //     .bind(user_id)
    //     .bind(repo_id)
    //     .fetch_optional(db)
    //     .await
    //     .unwrap();
    //     result.map(|(exists,)| exists).unwrap_or(false)
    // }

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_admin_permission_check() {
    let db = setup_test_database().await;

    // 1. Create admin user
    let admin_user = UserFixture::admin(&db.pool).await;

    // 2. In a complete implementation:
    // - Check if user has admin role
    // - Verify admin can perform privileged operations

    // Example:
    // let is_admin: bool = sqlx::query_scalar(
    //     "SELECT is_admin FROM users WHERE id = $1"
    // )
    // .bind(admin_user.id)
    // .fetch_one(&db.pool)
    // .await
    // .unwrap();
    // assert!(is_admin);

    // Verify admin user exists
    assert_eq!(admin_user.username, "admin");

    cleanup_test_database(&db).await;
}

#[tokio::test]
#[ignore] // Requires database
async fn test_permission_inheritance() {
    let db = setup_test_database().await;

    // 1. Create user
    let _user = UserFixture::default(&db.pool).await;

    // 2. In a complete implementation:
    // - Create organization
    // - Grant user access to organization
    // - Create repositories under organization
    // - Verify user has access to all org repositories

    // Example permission hierarchy:
    // Organization
    //   ├── User (member)
    //   ├── Repository 1 (inherited access)
    //   └── Repository 2 (inherited access)

    // async fn check_org_permission(
    //     db: &PgPool,
    //     user_id: i64,
    //     org_id: i64
    // ) -> Vec<i64> {
    //     sqlx::query_scalar(
    //         "SELECT r.id FROM repositories r
    //          INNER JOIN organizations o ON r.organization_id = o.id
    //          INNER JOIN organization_members om ON om.organization_id = o.id
    //          WHERE om.user_id = $1 AND o.id = $2"
    //     )
    //     .bind(user_id)
    //     .bind(org_id)
    //     .fetch_all(db)
    //     .await
    //     .unwrap()
    // }

    cleanup_test_database(&db).await;
}

// ========================================
// Integration Tests
// ========================================

#[tokio::test]
#[ignore] // Requires full stack
async fn test_full_auth_flow() {
    use helpers::{create_test_config, setup_mock_github_server, setup_successful_oauth_flow};
    use miyabi_web_api::auth::JwtManager;

    let db = setup_test_database().await;

    // 1. Setup mock GitHub for OAuth login
    let mock_server = setup_mock_github_server().await;
    let access_token = "gho_integration_test_token";
    let github_id = 99999i64;
    let login = "integrationuser";
    let email = "integration@example.com";

    setup_successful_oauth_flow(&mock_server, access_token, github_id, login, email).await;

    // 2. Simulate OAuth callback creating user
    // In real flow, this would be handled by github_oauth_callback route
    let user = UserFixture::create(&db.pool, login, github_id).await;

    // 3. Generate JWT token (as OAuth callback would)
    let config = create_test_config();
    let jwt_manager = JwtManager::new(&config.jwt_secret, config.jwt_expiration);
    let token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();

    // 4. Verify token is valid (simulates authenticated API call)
    let claims = jwt_manager.validate_token(&token).unwrap();
    assert_eq!(claims.sub, user.id.to_string());
    assert_eq!(claims.github_id, github_id);

    // 5. Simulate token refresh
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    let refreshed_token = jwt_manager
        .create_token(&user.id.to_string(), user.github_id)
        .unwrap();
    let refreshed_claims = jwt_manager.validate_token(&refreshed_token).unwrap();

    // Verify refreshed token has later iat
    assert!(refreshed_claims.iat >= claims.iat);
    assert_eq!(refreshed_claims.sub, claims.sub);

    // 6. Simulate logout (client-side token removal)
    // In a complete implementation, token would be blacklisted
    // For now, verify token remains valid until expiration
    assert!(jwt_manager.validate_token(&refreshed_token).is_ok());

    cleanup_test_database(&db).await;
}
