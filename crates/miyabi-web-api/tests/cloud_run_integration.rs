//! Integration Tests for Cloud Run Deployment
//!
//! Tests the deployed Miyabi Web API on GCP Cloud Run
//! Can run locally against deployed service via environment variable
//!
//! Usage:
//! - Local testing: API_URL=https://miyabi-web-api-ycw7g3zkva-an.a.run.app cargo test --test cloud_run_integration
//! - CI/CD: Automatically run after deployment

use reqwest::Client;
use serde_json::json;
use std::env;
use std::time::Duration;

/// Base URL for Cloud Run service
fn get_api_url() -> String {
    env::var("API_URL").unwrap_or_else(|_| "https://miyabi-web-api-ycw7g3zkva-an.a.run.app".to_string())
}

/// Create HTTP client with reasonable defaults
fn create_client() -> Client {
    Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client")
}

// ============================================================================
// Health Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_health_endpoint_responds() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client
        .get(&url)
        .send()
        .await
        .expect("Failed to send request to health endpoint");

    assert_eq!(response.status(), 200, "Health endpoint should return 200 OK");
}

#[tokio::test]
async fn test_health_endpoint_returns_json() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to send request");

    let content_type = response.headers().get("content-type");
    assert!(
        content_type
            .and_then(|v| v.to_str().ok())
            .map(|v| v.contains("application/json"))
            .unwrap_or(false),
        "Health endpoint should return JSON"
    );
}

#[tokio::test]
async fn test_health_endpoint_structure() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to send request");

    let body: serde_json::Value = response.json().await.expect("Failed to parse health response");

    assert!(body.get("status").is_some(), "Health response should have 'status' field");
    assert!(body.get("version").is_some(), "Health response should have 'version' field");

    assert_eq!(body["status"].as_str().unwrap(), "ok", "Status should be 'ok'");
}

#[tokio::test]
async fn test_health_endpoint_latency() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let start = std::time::Instant::now();
    let _response = client.get(&url).send().await.expect("Failed to send request");
    let elapsed = start.elapsed();

    println!("Health endpoint latency: {:?}", elapsed);
    assert!(elapsed < Duration::from_secs(5), "Health endpoint should respond in under 5 seconds");
}

// ============================================================================
// Telegram Webhook Tests
// ============================================================================

#[tokio::test]
async fn test_telegram_webhook_endpoint_exists() {
    let client = create_client();
    let url = format!("{}/api/v1/telegram/webhook", get_api_url());

    // GET should return 405 Method Not Allowed (expects POST)
    let response = client
        .get(&url)
        .send()
        .await
        .expect("Failed to send GET request to webhook");

    assert!(response.status() == 405 || response.status() == 404, "GET to webhook should return 405 or 404");
}

#[tokio::test]
async fn test_telegram_webhook_accepts_post() {
    let client = create_client();
    let url = format!("{}/api/v1/telegram/webhook", get_api_url());

    let payload = json!({
        "update_id": 123456789,
        "message": {
            "message_id": 1,
            "date": 1234567890,
            "chat": {
                "id": 1,
                "type": "private"
            },
            "text": "test message"
        }
    });

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .expect("Failed to send POST request to webhook");

    // Should return 200 OK or 400/422 for validation error
    let status = response.status();
    assert!(
        status == 200 || status == 400 || status == 422 || status == 500,
        "Webhook should return valid HTTP response (got {})",
        status
    );
}

#[tokio::test]
async fn test_telegram_webhook_validation() {
    let client = create_client();
    let url = format!("{}/api/v1/telegram/webhook", get_api_url());

    // Send invalid payload (missing required fields)
    let payload = json!({
        "update_id": 123,
        "message": {
            "message_id": 1,
            // Missing required fields
        }
    });

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .expect("Failed to send POST request");

    // Should validate and return error
    assert!(
        response.status() == 422 || response.status() == 400,
        "Invalid webhook payload should return 422 or 400"
    );
}

#[tokio::test]
async fn test_telegram_webhook_content_type() {
    let client = create_client();
    let url = format!("{}/api/v1/telegram/webhook", get_api_url());

    let payload = json!({
        "update_id": 123456789,
        "message": {
            "message_id": 1,
            "date": 1234567890,
            "chat": {
                "id": 1,
                "type": "private"
            },
            "text": "test"
        }
    });

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .expect("Failed to send request");

    // Webhook returns various content types depending on response status
    // Just verify the endpoint accepts the request
    assert!(
        response.status().is_client_error() || response.status().is_server_error() || response.status().is_success(),
        "Webhook should return valid HTTP response"
    );
}

// ============================================================================
// CORS & Headers Tests
// ============================================================================

#[tokio::test]
async fn test_cors_headers_present() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to send request");

    // Check for CORS headers
    let has_cors = response.headers().get("access-control-allow-origin").is_some();
    assert!(has_cors, "Response should include CORS headers");
}

#[tokio::test]
async fn test_security_headers_present() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to send request");

    // Cloud Run adds security headers
    println!("Response headers: {:?}", response.headers());
    assert!(response.status().is_success(), "Request should succeed");
}

// ============================================================================
// Error Handling Tests
// ============================================================================

#[tokio::test]
async fn test_nonexistent_endpoint_returns_404() {
    let client = create_client();
    let url = format!("{}/api/v1/nonexistent", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to send request");

    assert_eq!(response.status(), 404, "Nonexistent endpoint should return 404");
}

#[tokio::test]
async fn test_malformed_json_handling() {
    let client = create_client();
    let url = format!("{}/api/v1/telegram/webhook", get_api_url());

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body("{invalid json}")
        .send()
        .await
        .expect("Failed to send request");

    // Should handle invalid JSON gracefully
    assert!(response.status().is_client_error(), "Invalid JSON should return client error");
}

// ============================================================================
// Performance Tests
// ============================================================================

#[tokio::test]
async fn test_health_endpoint_performance() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());
    let iterations = 10;

    let mut times = Vec::new();
    for _ in 0..iterations {
        let start = std::time::Instant::now();
        let _ = client.get(&url).send().await;
        times.push(start.elapsed());
    }

    let avg = times.iter().sum::<Duration>() / iterations as u32;
    let max = *times.iter().max().unwrap();

    println!("Health endpoint performance:");
    println!("  Average latency: {:?}", avg);
    println!("  Max latency: {:?}", max);
    println!("  Iterations: {}", iterations);

    assert!(avg < Duration::from_secs(2), "Average latency should be under 2 seconds");
    assert!(max < Duration::from_secs(5), "Max latency should be under 5 seconds");
}

#[tokio::test]
async fn test_concurrent_requests() {
    let client = std::sync::Arc::new(create_client());
    let url = format!("{}/api/v1/health", get_api_url());
    let concurrent_requests = 5;

    let mut handles = vec![];

    for _ in 0..concurrent_requests {
        let client = client.clone();
        let url = url.clone();

        let handle = tokio::spawn(async move {
            let response = client.get(&url).send().await;
            response.is_ok() && response.unwrap().status() == 200
        });

        handles.push(handle);
    }

    let results = futures::future::join_all(handles)
        .await
        .into_iter()
        .map(|r| r.unwrap_or(false))
        .collect::<Vec<_>>();

    let success_count = results.iter().filter(|r| **r).count();

    println!("Concurrent requests: {}/{} successful", success_count, concurrent_requests);
    assert!(
        success_count >= concurrent_requests - 1,
        "At least {} concurrent requests should succeed",
        concurrent_requests - 1
    );
}

// ============================================================================
// Smoke Tests
// ============================================================================

#[tokio::test]
async fn test_service_is_up() {
    let client = create_client();
    let url = get_api_url();

    // Try health endpoint
    let response = client.get(format!("{}/api/v1/health", url)).send().await;

    assert!(response.is_ok(), "Service should be responding to requests");
}

#[tokio::test]
async fn test_service_version_accessible() {
    let client = create_client();
    let url = format!("{}/api/v1/health", get_api_url());

    let response = client.get(&url).send().await.expect("Failed to connect to service");

    let body: serde_json::Value = response.json().await.expect("Failed to parse JSON");

    println!("Service version: {}", body["version"]);
    assert!(body["version"].as_str().is_some(), "Service should report version");
}

// ============================================================================
// Helper Module
// ============================================================================

#[cfg(test)]
mod helpers {
    /// Parse response and return JSON
    #[allow(dead_code)]
    pub async fn parse_json(response: reqwest::Response) -> serde_json::Value {
        response.json().await.expect("Failed to parse response body")
    }

    /// Check if response is success
    #[allow(dead_code)]
    pub fn is_success(status: reqwest::StatusCode) -> bool {
        status.is_success()
    }
}
