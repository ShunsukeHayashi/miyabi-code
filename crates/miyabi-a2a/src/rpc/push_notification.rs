//! Push notification webhook sender.
//!
//! This module implements webhook delivery for push notifications to client servers.
//! It includes retry logic with exponential backoff and authentication support.
//!
//! # Webhook Security
//!
//! Webhooks are secured using HMAC-SHA256 signatures to prevent payload tampering and
//! replay attacks. The signature is included in the `X-Miyabi-Signature` header.
//!
//! ## Signature Generation
//!
//! The signature is computed as:
//! ```text
//! signature = HMAC-SHA256(webhook_secret, timestamp + "." + json_payload)
//! ```
//!
//! Where:
//! - `webhook_secret` is a shared secret between Miyabi and the webhook receiver
//! - `timestamp` is the ISO 8601 timestamp from the payload
//! - `json_payload` is the JSON-serialized payload
//!
//! ## Signature Verification (Client Side)
//!
//! To verify a webhook signature on the receiving end:
//!
//! ### Rust
//! ```rust,no_run
//! use hmac::{Hmac, Mac};
//! use sha2::Sha256;
//!
//! fn verify_webhook_signature(
//!     secret: &str,
//!     signature_hex: &str,
//!     timestamp: &str,
//!     payload_json: &str
//! ) -> bool {
//!     type HmacSha256 = Hmac<Sha256>;
//!     let message = format!("{}.{}", timestamp, payload_json);
//!     let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
//!     mac.update(message.as_bytes());
//!     let result = mac.finalize();
//!     let expected_bytes = result.into_bytes();
//!     let expected_hex = hex::encode(expected_bytes);
//!     expected_hex == signature_hex
//! }
//! ```
//!
//! ### Python
//! ```python
//! import hmac
//! import hashlib
//!
//! def verify_webhook_signature(secret, signature_hex, timestamp, payload_json):
//!     message = f"{timestamp}.{payload_json}"
//!     expected_signature = hmac.new(
//!         secret.encode('utf-8'),
//!         message.encode('utf-8'),
//!         hashlib.sha256
//!     ).hexdigest()
//!     return hmac.compare_digest(expected_signature, signature_hex)
//! ```
//!
//! ### Node.js
//! ```javascript
//! const crypto = require('crypto');
//!
//! function verifyWebhookSignature(secret, signatureHex, timestamp, payloadJson) {
//!     const message = `${timestamp}.${payloadJson}`;
//!     const expectedSignature = crypto
//!         .createHmac('sha256', secret)
//!         .update(message)
//!         .digest('hex');
//!     return crypto.timingSafeEqual(
//!         Buffer.from(expectedSignature),
//!         Buffer.from(signatureHex)
//!     );
//! }
//! ```
//!
//! ## Replay Attack Prevention
//!
//! Clients should reject webhooks with timestamps older than 5 minutes to prevent replay attacks:
//!
//! ```rust,no_run
//! use chrono::{DateTime, Duration, Utc};
//!
//! fn is_timestamp_valid(timestamp_str: &str) -> bool {
//!     let timestamp = DateTime::parse_from_rfc3339(timestamp_str).unwrap();
//!     let now = Utc::now();
//!     let age = now.signed_duration_since(timestamp.with_timezone(&Utc));
//!     age < Duration::minutes(5)
//! }
//! ```

use crate::error::A2AError;
use hmac::{Hmac, Mac};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::time::Duration;
use tracing::{debug, error, warn};

/// Maximum number of retry attempts for webhook delivery
const MAX_RETRIES: u32 = 3;

/// Base delay for exponential backoff (in milliseconds)
const BASE_DELAY_MS: u64 = 100;

/// Push notification payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushNotificationPayload {
    /// Notification event type
    pub event_type: String,

    /// Task ID associated with this notification
    pub task_id: String,

    /// Notification data (JSON object)
    pub data: serde_json::Value,

    /// Timestamp (ISO 8601 format)
    pub timestamp: String,
}

/// Webhook configuration
#[derive(Debug, Clone)]
pub struct WebhookConfig {
    /// Webhook URL to send notifications to
    pub url: String,

    /// Optional Bearer token for authentication
    pub bearer_token: Option<String>,

    /// Optional webhook secret for HMAC-SHA256 signature generation
    pub webhook_secret: Option<String>,

    /// Optional timeout for HTTP requests (in seconds)
    pub timeout_seconds: Option<u64>,
}

impl WebhookConfig {
    /// Create a new webhook configuration
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            bearer_token: None,
            webhook_secret: None,
            timeout_seconds: Some(30), // Default 30 seconds
        }
    }

    /// Set Bearer token for authentication
    pub fn with_bearer_token(mut self, token: impl Into<String>) -> Self {
        self.bearer_token = Some(token.into());
        self
    }

    /// Set webhook secret for HMAC-SHA256 signature generation
    pub fn with_webhook_secret(mut self, secret: impl Into<String>) -> Self {
        self.webhook_secret = Some(secret.into());
        self
    }

    /// Set custom timeout
    pub fn with_timeout(mut self, seconds: u64) -> Self {
        self.timeout_seconds = Some(seconds);
        self
    }
}

/// Generate HMAC-SHA256 signature for webhook payload
///
/// The signature is computed as:
/// ```text
/// HMAC-SHA256(secret, timestamp + "." + json_payload)
/// ```
///
/// # Arguments
///
/// * `secret` - The shared webhook secret
/// * `timestamp` - ISO 8601 timestamp from the payload
/// * `payload_json` - JSON-serialized payload
///
/// # Returns
///
/// Hex-encoded HMAC-SHA256 signature
///
/// # Example
///
/// ```
/// use miyabi_a2a::rpc::push_notification::generate_webhook_signature;
///
/// let secret = "my-webhook-secret";
/// let timestamp = "2025-10-21T12:00:00Z";
/// let payload_json = r#"{"event_type":"test","task_id":"123","data":{},"timestamp":"2025-10-21T12:00:00Z"}"#;
///
/// let signature = generate_webhook_signature(secret, timestamp, payload_json);
/// assert_eq!(signature.len(), 64); // SHA256 produces 64 hex characters
/// ```
pub fn generate_webhook_signature(secret: &str, timestamp: &str, payload_json: &str) -> String {
    type HmacSha256 = Hmac<Sha256>;

    // Construct message: timestamp + "." + json_payload
    let message = format!("{}.{}", timestamp, payload_json);

    // Create HMAC instance
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");

    // Update with message
    mac.update(message.as_bytes());

    // Finalize and convert to hex
    let result = mac.finalize();
    let code_bytes = result.into_bytes();
    hex::encode(code_bytes)
}

/// Send a push notification to a webhook URL with retry logic
///
/// # Arguments
///
/// * `client` - HTTP client for making requests
/// * `config` - Webhook configuration (URL, auth token, timeout)
/// * `payload` - Notification payload to send
///
/// # Returns
///
/// `Ok(())` on successful delivery, `Err(A2AError)` on failure after retries
///
/// # Example
///
/// ```no_run
/// use miyabi_a2a::rpc::push_notification::{send_push_notification, WebhookConfig, PushNotificationPayload};
/// use reqwest::Client;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let client = Client::new();
/// let config = WebhookConfig::new("https://example.com/webhook")
///     .with_bearer_token("secret_token");
///
/// let payload = PushNotificationPayload {
///     event_type: "task.completed".to_string(),
///     task_id: "task-123".to_string(),
///     data: serde_json::json!({"status": "completed"}),
///     timestamp: chrono::Utc::now().to_rfc3339(),
/// };
///
/// send_push_notification(&client, &config, &payload).await?;
/// # Ok(())
/// # }
/// ```
pub async fn send_push_notification(
    client: &Client,
    config: &WebhookConfig,
    payload: &PushNotificationPayload,
) -> Result<(), A2AError> {
    let mut last_error: Option<A2AError> = None;

    for attempt in 0..=MAX_RETRIES {
        debug!(
            attempt = attempt,
            url = %config.url,
            task_id = %payload.task_id,
            "Attempting to send push notification"
        );

        // Serialize payload to JSON for both body and signature generation
        let payload_json = serde_json::to_string(payload)
            .map_err(|e| A2AError::InternalError(format!("Failed to serialize payload: {}", e)))?;

        // Build HTTP request
        let mut request = client
            .post(&config.url)
            .header("Content-Type", "application/json")
            .body(payload_json.clone());

        // Add Bearer token if configured
        if let Some(token) = &config.bearer_token {
            request = request.header("Authorization", format!("Bearer {}", token));
        }

        // Add HMAC-SHA256 signature if webhook_secret is configured
        if let Some(secret) = &config.webhook_secret {
            let signature = generate_webhook_signature(secret, &payload.timestamp, &payload_json);

            request = request.header("X-Miyabi-Signature", signature);

            debug!(
                task_id = %payload.task_id,
                "Added HMAC-SHA256 signature to webhook request"
            );
        }

        // Set timeout if configured
        if let Some(timeout_secs) = config.timeout_seconds {
            request = request.timeout(Duration::from_secs(timeout_secs));
        }

        // Send request
        match request.send().await {
            Ok(response) => {
                if response.status().is_success() {
                    debug!(
                        status = %response.status(),
                        task_id = %payload.task_id,
                        "Push notification sent successfully"
                    );
                    return Ok(());
                } else {
                    let status = response.status();
                    let error_body = response
                        .text()
                        .await
                        .unwrap_or_else(|_| "Could not read response body".to_string());

                    warn!(
                        attempt = attempt,
                        status = %status,
                        error_body = %error_body,
                        "Push notification failed with non-success status"
                    );

                    last_error = Some(A2AError::WebhookDeliveryFailed(format!("HTTP {} - {}", status, error_body)));
                }
            }
            Err(e) => {
                warn!(
                    attempt = attempt,
                    error = %e,
                    "Push notification request failed"
                );

                last_error = Some(A2AError::WebhookDeliveryFailed(format!("Request error: {}", e)));
            }
        }

        // Exponential backoff delay before retry (except on last attempt)
        if attempt < MAX_RETRIES {
            let delay_ms = BASE_DELAY_MS * 2u64.pow(attempt);
            let delay = Duration::from_millis(delay_ms);

            debug!(delay_ms = delay_ms, next_attempt = attempt + 1, "Retrying push notification after delay");

            tokio::time::sleep(delay).await;
        }
    }

    // All retries exhausted
    error!(
        url = %config.url,
        task_id = %payload.task_id,
        "Push notification failed after {} attempts",
        MAX_RETRIES + 1
    );

    Err(last_error.unwrap_or_else(|| A2AError::WebhookDeliveryFailed("Unknown error after retries".to_string())))
}

#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{
        matchers::{header, header_exists, method, path},
        Mock, MockServer, ResponseTemplate,
    };

    #[tokio::test]
    async fn test_send_push_notification_success() {
        // Start mock server
        let mock_server = MockServer::start().await;

        Mock::given(method("POST"))
            .and(path("/webhook"))
            .and(header("Content-Type", "application/json"))
            .respond_with(ResponseTemplate::new(200))
            .expect(1)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()));
        let payload = PushNotificationPayload {
            event_type: "test.event".to_string(),
            task_id: "task-123".to_string(),
            data: serde_json::json!({"foo": "bar"}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_push_notification_with_bearer_token() {
        let mock_server = MockServer::start().await;

        Mock::given(method("POST"))
            .and(path("/webhook"))
            .and(header("Authorization", "Bearer secret_token"))
            .respond_with(ResponseTemplate::new(200))
            .expect(1)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri())).with_bearer_token("secret_token");

        let payload = PushNotificationPayload {
            event_type: "test.event".to_string(),
            task_id: "task-456".to_string(),
            data: serde_json::json!({"status": "completed"}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_push_notification_retry_on_failure() {
        let mock_server = MockServer::start().await;

        // Mock will accept 4 requests total: first 2 fail with 500, 3rd succeeds with 200
        // We use a counter to track which request this is
        use std::sync::atomic::{AtomicU32, Ordering};
        use std::sync::Arc as StdArc;

        let counter = StdArc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        Mock::given(method("POST"))
            .and(path("/webhook"))
            .respond_with(move |_req: &wiremock::Request| {
                let count = counter_clone.fetch_add(1, Ordering::SeqCst);
                if count < 2 {
                    ResponseTemplate::new(500)
                } else {
                    ResponseTemplate::new(200)
                }
            })
            .expect(3) // 2 failures + 1 success
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()));
        let payload = PushNotificationPayload {
            event_type: "test.retry".to_string(),
            task_id: "task-retry".to_string(),
            data: serde_json::json!({}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_push_notification_max_retries_exhausted() {
        let mock_server = MockServer::start().await;

        // All attempts fail
        Mock::given(method("POST"))
            .and(path("/webhook"))
            .respond_with(ResponseTemplate::new(500).set_body_string("Internal Server Error"))
            .expect(4) // Initial attempt + 3 retries
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()));
        let payload = PushNotificationPayload {
            event_type: "test.fail".to_string(),
            task_id: "task-fail".to_string(),
            data: serde_json::json!({}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_err());

        match result.unwrap_err() {
            A2AError::WebhookDeliveryFailed(msg) => {
                assert!(msg.contains("HTTP 500"));
            }
            _ => panic!("Expected WebhookDeliveryFailed error"),
        }
    }

    #[tokio::test]
    async fn test_exponential_backoff_timing() {
        use std::time::Instant;

        let mock_server = MockServer::start().await;

        // All attempts fail
        Mock::given(method("POST"))
            .and(path("/webhook"))
            .respond_with(ResponseTemplate::new(500))
            .expect(4)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()));
        let payload = PushNotificationPayload {
            event_type: "test.timing".to_string(),
            task_id: "task-timing".to_string(),
            data: serde_json::json!({}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let start = Instant::now();
        let _result = send_push_notification(&client, &config, &payload).await;
        let duration = start.elapsed();

        // Expected delays: 100ms (2^0) + 200ms (2^1) + 400ms (2^2) = 700ms minimum
        assert!(
            duration >= Duration::from_millis(700),
            "Expected at least 700ms for exponential backoff, got {:?}",
            duration
        );
    }

    // ===== HMAC Signature Tests =====

    #[test]
    fn test_generate_webhook_signature_deterministic() {
        let secret = "test-secret-key";
        let timestamp = "2025-10-21T12:00:00Z";
        let payload_json = r#"{"event_type":"test","task_id":"123","data":{},"timestamp":"2025-10-21T12:00:00Z"}"#;

        // Generate signature twice with same inputs
        let signature1 = generate_webhook_signature(secret, timestamp, payload_json);
        let signature2 = generate_webhook_signature(secret, timestamp, payload_json);

        // Should be deterministic
        assert_eq!(signature1, signature2);
        assert_eq!(signature1.len(), 64); // SHA256 produces 64 hex characters
    }

    #[test]
    fn test_generate_webhook_signature_different_secrets() {
        let timestamp = "2025-10-21T12:00:00Z";
        let payload_json = r#"{"event_type":"test","task_id":"123","data":{}}"#;

        let signature1 = generate_webhook_signature("secret1", timestamp, payload_json);
        let signature2 = generate_webhook_signature("secret2", timestamp, payload_json);

        // Different secrets should produce different signatures
        assert_ne!(signature1, signature2);
    }

    #[test]
    fn test_generate_webhook_signature_different_timestamps() {
        let secret = "test-secret-key";
        let payload_json = r#"{"event_type":"test","task_id":"123","data":{}}"#;

        let signature1 = generate_webhook_signature(secret, "2025-10-21T12:00:00Z", payload_json);
        let signature2 = generate_webhook_signature(secret, "2025-10-21T13:00:00Z", payload_json);

        // Different timestamps should produce different signatures
        assert_ne!(signature1, signature2);
    }

    #[test]
    fn test_generate_webhook_signature_different_payloads() {
        let secret = "test-secret-key";
        let timestamp = "2025-10-21T12:00:00Z";

        let signature1 = generate_webhook_signature(secret, timestamp, r#"{"task_id":"123"}"#);
        let signature2 = generate_webhook_signature(secret, timestamp, r#"{"task_id":"456"}"#);

        // Different payloads should produce different signatures
        assert_ne!(signature1, signature2);
    }

    #[test]
    fn test_verify_webhook_signature_valid() {
        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        let secret = "test-secret-key";
        let timestamp = "2025-10-21T12:00:00Z";
        let payload_json = r#"{"event_type":"test","task_id":"123","data":{}}"#;

        // Generate signature
        let signature_hex = generate_webhook_signature(secret, timestamp, payload_json);

        // Verify signature (client-side verification simulation)
        type HmacSha256 = Hmac<Sha256>;
        let message = format!("{}.{}", timestamp, payload_json);
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(message.as_bytes());
        let result = mac.finalize();
        let expected_bytes = result.into_bytes();
        let expected_hex = hex::encode(expected_bytes);

        assert_eq!(signature_hex, expected_hex);
    }

    #[test]
    fn test_verify_webhook_signature_invalid_secret() {
        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        let timestamp = "2025-10-21T12:00:00Z";
        let payload_json = r#"{"event_type":"test","task_id":"123","data":{}}"#;

        // Generate signature with one secret
        let signature_hex = generate_webhook_signature("secret1", timestamp, payload_json);

        // Try to verify with different secret
        type HmacSha256 = Hmac<Sha256>;
        let message = format!("{}.{}", timestamp, payload_json);
        let mut mac = HmacSha256::new_from_slice("secret2".as_bytes()).unwrap();
        mac.update(message.as_bytes());
        let result = mac.finalize();
        let expected_bytes = result.into_bytes();
        let expected_hex = hex::encode(expected_bytes);

        assert_ne!(signature_hex, expected_hex);
    }

    #[tokio::test]
    async fn test_send_push_notification_with_webhook_secret() {
        let mock_server = MockServer::start().await;

        // Expect X-Miyabi-Signature header
        Mock::given(method("POST"))
            .and(path("/webhook"))
            .and(header_exists("X-Miyabi-Signature"))
            .respond_with(ResponseTemplate::new(200))
            .expect(1)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri())).with_webhook_secret("my-secret-key");

        let payload = PushNotificationPayload {
            event_type: "test.event".to_string(),
            task_id: "task-789".to_string(),
            data: serde_json::json!({"status": "completed"}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_push_notification_without_webhook_secret() {
        let mock_server = MockServer::start().await;

        // Should NOT have X-Miyabi-Signature header
        Mock::given(method("POST"))
            .and(path("/webhook"))
            .respond_with(ResponseTemplate::new(200))
            .expect(1)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()));
        // No webhook_secret set

        let payload = PushNotificationPayload {
            event_type: "test.event".to_string(),
            task_id: "task-no-secret".to_string(),
            data: serde_json::json!({}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_push_notification_with_both_bearer_and_webhook_secret() {
        let mock_server = MockServer::start().await;

        // Expect both Authorization and X-Miyabi-Signature headers
        Mock::given(method("POST"))
            .and(path("/webhook"))
            .and(header("Authorization", "Bearer secret_token"))
            .and(header_exists("X-Miyabi-Signature"))
            .respond_with(ResponseTemplate::new(200))
            .expect(1)
            .mount(&mock_server)
            .await;

        let client = Client::new();
        let config = WebhookConfig::new(format!("{}/webhook", mock_server.uri()))
            .with_bearer_token("secret_token")
            .with_webhook_secret("webhook-secret");

        let payload = PushNotificationPayload {
            event_type: "test.both".to_string(),
            task_id: "task-both-auth".to_string(),
            data: serde_json::json!({"foo": "bar"}),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let result = send_push_notification(&client, &config, &payload).await;
        assert!(result.is_ok());
    }
}
