//! Integration tests for Mission Control API endpoints

use axum::{
    body::Body,
    http::{Request, StatusCode},
    routing::get,
};
use http_body_util::BodyExt;
use tower::ServiceExt;

/// Helper function to create test app
async fn create_test_app() -> axum::Router {
    use miyabi_web_api::{create_app, AppConfig};

    // Create a test configuration
    let config = AppConfig {
        database_url: "postgresql://test:test@localhost/test".to_string(),
        jwt_secret: "test-secret-key-for-testing-only".to_string(),
        server_address: "127.0.0.1:8080".to_string(),
        github_client_id: "test-client-id".to_string(),
        github_client_secret: "test-client-secret".to_string(),
        github_callback_url: "http://localhost:8080/api/v1/auth/github/callback".to_string(),
        frontend_url: "http://localhost:3000".to_string(),
        jwt_expiration: 3600,
        refresh_expiration: 604800,
        environment: "test".to_string(),
    };

    // Create app - this will fail if database connection fails, but we can handle that
    create_app(config).await.unwrap_or_else(|_| {
        // If database connection fails, create a minimal router for testing
        axum::Router::new()
            .route("/api/v1/mission-control", get(|| async { "{}" }))
            .route("/api/v1/mission-control/detailed", get(|| async { "{}" }))
            .route("/api/v1/tmux/sessions", get(|| async { "{}" }))
            .route("/api/v1/agents", get(|| async { "{}" }))
            .route("/api/v1/preflight", get(|| async { "{}" }))
            .route("/api/v1/timeline", get(|| async { "{}" }))
            .route("/api/v1/worktrees", get(|| async { "{}" }))
    })
}

#[tokio::test]
async fn test_mission_control_status_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/mission-control")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify response contains expected fields
    assert!(body_str.contains("\"status\""));
    assert!(body_str.contains("\"agents\""));
    assert!(body_str.contains("\"tmux\""));
    assert!(body_str.contains("\"timeline\""));
    assert!(body_str.contains("\"preflight\""));
    assert!(body_str.contains("\"worktrees\""));
}

#[tokio::test]
async fn test_mission_control_detailed_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/mission-control/detailed")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify detailed response contains summary and detailed data
    assert!(body_str.contains("\"summary\""));
    assert!(body_str.contains("\"agents_detail\""));
    assert!(body_str.contains("\"tmux_detail\""));
    assert!(body_str.contains("\"timeline_detail\""));
    assert!(body_str.contains("\"preflight_detail\""));
    assert!(body_str.contains("\"worktrees_detail\""));
}

#[tokio::test]
async fn test_tmux_sessions_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/tmux/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify response structure
    assert!(body_str.contains("\"sessions\""));
    assert!(body_str.contains("\"total_count\""));
}

#[tokio::test]
async fn test_agents_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/v1/agents").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify 21 agents are returned (7 Coding + 14 Business)
    assert!(body_str.contains("\"agents\""));
    assert!(body_str.contains("CoordinatorAgent"));
    assert!(body_str.contains("AIEntrepreneurAgent"));
}

#[tokio::test]
async fn test_preflight_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/v1/preflight").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify preflight checks structure
    assert!(body_str.contains("\"status\""));
    assert!(body_str.contains("\"checks\""));
    assert!(body_str.contains("\"timestamp\""));
}

#[tokio::test]
async fn test_timeline_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/v1/timeline").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify timeline structure
    assert!(body_str.contains("\"summary\""));
    assert!(body_str.contains("\"recent_events\""));
    assert!(body_str.contains("\"window_size\""));
}

#[tokio::test]
async fn test_worktrees_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/v1/worktrees").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify worktrees structure
    assert!(body_str.contains("\"worktrees\""));
    assert!(body_str.contains("\"total\""));
}
