//! Integration tests for WebSocket event flow

use miyabi_web_api::{create_app, AppConfig};
use serde_json::json;
use std::time::Duration;
use tokio::time::sleep;

/// Test WebSocket connection and event broadcasting
#[tokio::test]
#[ignore] // Requires running database
async fn test_websocket_event_flow() {
    // Create test config
    let config = AppConfig {
        server_address: "127.0.0.1:0".to_string(),
        database_url: std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/miyabi_test".to_string()),
        jwt_secret: "test-secret-key".to_string(),
        github_client_id: "test-client-id".to_string(),
        github_client_secret: "test-client-secret".to_string(),
        github_callback_url: "http://localhost:8080/api/v1/auth/github/callback".to_string(),
        frontend_url: "http://localhost:3000".to_string(),
        jwt_expiration: 3600,
        refresh_expiration: 604800,
        environment: "test".to_string(),
    };

    // Create application
    let app = create_app(config)
        .await
        .expect("Failed to create application");

    // Start server in background
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("Failed to bind listener");
    let addr = listener.local_addr().expect("Failed to get local address");

    tokio::spawn(async move {
        axum::serve(listener, app)
            .await
            .expect("Server failed");
    });

    // Wait for server to start
    sleep(Duration::from_millis(100)).await;

    // Test WebSocket connection (without auth - dev mode)
    let ws_url = format!("ws://{}/api/v1/ws?events=true", addr);

    match tokio_tungstenite::connect_async(&ws_url).await {
        Ok((mut ws_stream, _)) => {
            println!("✅ WebSocket connected successfully");

            // Test receiving messages (timeout after 1 second)
            let timeout = tokio::time::timeout(
                Duration::from_secs(1),
                async {
                    use futures::StreamExt;
                    if let Some(Ok(msg)) = ws_stream.next().await {
                        println!("Received message: {:?}", msg);
                    }
                }
            );

            match timeout.await {
                Ok(_) => println!("✅ Received WebSocket message"),
                Err(_) => println!("ℹ️ No messages received (expected for empty event stream)"),
            }

            // Close connection
            use futures::SinkExt;
            let _ = ws_stream.close(None).await;
        }
        Err(e) => {
            panic!("❌ WebSocket connection failed: {}", e);
        }
    }
}

/// Test WebSocket authentication with JWT token
#[tokio::test]
#[ignore] // Requires running database
async fn test_websocket_authentication() {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        exp: i64,
        iat: i64,
        github_id: i64,
    }

    // Create test config
    let config = AppConfig {
        server_address: "127.0.0.1:0".to_string(),
        database_url: std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/miyabi_test".to_string()),
        jwt_secret: "test-secret-key".to_string(),
        github_client_id: "test-client-id".to_string(),
        github_client_secret: "test-client-secret".to_string(),
        github_callback_url: "http://localhost:8080/api/v1/auth/github/callback".to_string(),
        frontend_url: "http://localhost:3000".to_string(),
        jwt_expiration: 3600,
        refresh_expiration: 604800,
        environment: "test".to_string(),
    };

    // Create application
    let app = create_app(config.clone())
        .await
        .expect("Failed to create application");

    // Start server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("Failed to bind listener");
    let addr = listener.local_addr().expect("Failed to get local address");

    tokio::spawn(async move {
        axum::serve(listener, app)
            .await
            .expect("Server failed");
    });

    sleep(Duration::from_millis(100)).await;

    // Create valid JWT token
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: "123e4567-e89b-12d3-a456-426614174000".to_string(),
        exp: now + 3600,
        iat: now,
        github_id: 12345,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .expect("Failed to create token");

    // Test with valid token
    let ws_url = format!("ws://{}/api/v1/ws?events=true&token={}", addr, token);

    match tokio_tungstenite::connect_async(&ws_url).await {
        Ok((mut ws_stream, _)) => {
            println!("✅ WebSocket authenticated successfully");
            use futures::SinkExt;
            let _ = ws_stream.close(None).await;
        }
        Err(e) => {
            panic!("❌ WebSocket authentication failed: {}", e);
        }
    }

    // Test with invalid token
    let invalid_ws_url = format!("ws://{}/api/v1/ws?events=true&token=invalid", addr);

    match tokio_tungstenite::connect_async(&invalid_ws_url).await {
        Ok(_) => {
            panic!("❌ WebSocket should have rejected invalid token");
        }
        Err(_) => {
            println!("✅ Invalid token correctly rejected");
        }
    }
}

/// Test event serialization
#[test]
fn test_agent_event_serialization() {
    use chrono::Utc;
    use serde_json;
    use uuid::Uuid;

    // Test execution_started event
    let event = json!({
        "type": "execution_started",
        "execution_id": Uuid::new_v4().to_string(),
        "repository_id": Uuid::new_v4().to_string(),
        "issue_number": 123,
        "agent_type": "coordinator",
        "timestamp": Utc::now().to_rfc3339(),
    });

    let serialized = serde_json::to_string(&event).expect("Failed to serialize");
    println!("✅ Event serialized: {}", serialized);

    // Test execution_progress event
    let progress_event = json!({
        "type": "execution_progress",
        "execution_id": Uuid::new_v4().to_string(),
        "progress": 50,
        "message": "Processing...",
        "timestamp": Utc::now().to_rfc3339(),
    });

    let progress_serialized = serde_json::to_string(&progress_event).expect("Failed to serialize");
    println!("✅ Progress event serialized: {}", progress_serialized);

    // Test execution_completed event
    let completed_event = json!({
        "type": "execution_completed",
        "execution_id": Uuid::new_v4().to_string(),
        "quality_score": 95,
        "pr_number": 456,
        "timestamp": Utc::now().to_rfc3339(),
    });

    let completed_serialized = serde_json::to_string(&completed_event).expect("Failed to serialize");
    println!("✅ Completed event serialized: {}", completed_serialized);

    // Test execution_failed event
    let failed_event = json!({
        "type": "execution_failed",
        "execution_id": Uuid::new_v4().to_string(),
        "error": "Compilation failed",
        "timestamp": Utc::now().to_rfc3339(),
    });

    let failed_serialized = serde_json::to_string(&failed_event).expect("Failed to serialize");
    println!("✅ Failed event serialized: {}", failed_serialized);
}
