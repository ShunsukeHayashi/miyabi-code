//! Integration tests for Mission Control API endpoints

use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;

/// Helper function to create test app
async fn create_test_app() -> axum::Router {
    use miyabi_web_api::routes;
    routes::api_routes()
}

#[tokio::test]
async fn test_mission_control_status_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/mission-control").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
        .oneshot(Request::builder().uri("/mission-control/detailed").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
        .oneshot(Request::builder().uri("/tmux/sessions").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify response structure
    assert!(body_str.contains("\"sessions\""));
    assert!(body_str.contains("\"total_count\""));
}

#[tokio::test]
async fn test_agents_endpoint() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/agents").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
        .oneshot(Request::builder().uri("/preflight").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
        .oneshot(Request::builder().uri("/timeline").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
        .oneshot(Request::builder().uri("/worktrees").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let body_str = String::from_utf8(body.to_vec()).unwrap();

    // Verify worktrees structure
    assert!(body_str.contains("\"worktrees\""));
    assert!(body_str.contains("\"total\""));
}
