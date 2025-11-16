//! Integration tests for miyabi-webhook
//!
//! These tests verify the complete webhook signature flow including
//! edge cases, security properties, and cross-language compatibility.

use chrono::Utc;
use miyabi_webhook::{WebhookError, WebhookSigner};

/// Test complete webhook flow: sign -> verify
#[test]
fn test_complete_webhook_flow() {
    let secret = "integration-test-secret";
    let signer = WebhookSigner::new(secret);

    let payload = br#"{"event":"task.created","task_id":123,"agent":"CodeGenAgent"}"#;
    let timestamp = Utc::now().timestamp();

    // Server: Generate signature
    let signature = signer.sign(payload, timestamp);
    println!("Generated signature: {}", signature);

    // Client: Verify signature
    let result = signer.verify(payload, timestamp, &signature);
    assert!(result.is_ok());
    assert!(result.unwrap());
}

/// Test signature uniqueness across different payloads
#[test]
fn test_signature_uniqueness() {
    let signer = WebhookSigner::new("test-secret");
    let timestamp = Utc::now().timestamp();

    let payloads = vec![
        br#"{"event":"task.created"}"#.as_slice(),
        br#"{"event":"task.updated"}"#.as_slice(),
        br#"{"event":"task.completed"}"#.as_slice(),
    ];

    let mut signatures = Vec::new();
    for payload in &payloads {
        let sig = signer.sign(payload, timestamp);
        signatures.push(sig);
    }

    // All signatures should be unique
    for i in 0..signatures.len() {
        for j in (i + 1)..signatures.len() {
            assert_ne!(
                signatures[i], signatures[j],
                "Signatures should be unique for different payloads"
            );
        }
    }
}

/// Test timestamp window enforcement
#[test]
fn test_timestamp_window_enforcement() {
    let signer = WebhookSigner::with_tolerance("secret", 60); // 1-minute window
    let payload = b"test payload";

    // Current timestamp - should pass
    let now = Utc::now().timestamp();
    let signature = signer.sign(payload, now);
    assert!(signer.verify(payload, now, &signature).is_ok());

    // 30 seconds ago - should pass (within 1-minute window)
    let recent = now - 30;
    let signature = signer.sign(payload, recent);
    assert!(signer.verify(payload, recent, &signature).is_ok());

    // 2 minutes ago - should fail (outside 1-minute window)
    let old = now - 120;
    let signature = signer.sign(payload, old);
    let result = signer.verify(payload, old, &signature);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), WebhookError::TimestampOutOfRange(_, _)));
}

/// Test malicious signature modification detection
#[test]
fn test_signature_tampering_detection() {
    let signer = WebhookSigner::new("secret");
    let payload = b"original payload";
    let timestamp = Utc::now().timestamp();

    let valid_signature = signer.sign(payload, timestamp);

    // Tamper with signature (flip one bit)
    let mut tampered = valid_signature.clone();
    let bytes = unsafe { tampered.as_bytes_mut() };
    if let Some(b) = bytes.get_mut(10) {
        *b ^= 0x01; // Flip one bit
    }

    let result = signer.verify(payload, timestamp, &tampered);
    assert!(result.is_err());
}

/// Test payload tampering detection
#[test]
fn test_payload_tampering_detection() {
    let signer = WebhookSigner::new("secret");
    let original_payload = br#"{"amount":100}"#;
    let tampered_payload = br#"{"amount":999}"#; // Attacker changes amount
    let timestamp = Utc::now().timestamp();

    let signature = signer.sign(original_payload, timestamp);

    // Try to verify tampered payload with original signature
    let result = signer.verify(tampered_payload, timestamp, &signature);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), WebhookError::VerificationFailed));
}

/// Test empty payload handling
#[test]
fn test_empty_payload() {
    let signer = WebhookSigner::new("secret");
    let payload = b"";
    let timestamp = Utc::now().timestamp();

    let signature = signer.sign(payload, timestamp);
    let result = signer.verify(payload, timestamp, &signature);

    assert!(result.is_ok());
    assert!(result.unwrap());
}

/// Test large payload handling (10MB)
#[test]
fn test_large_payload() {
    let signer = WebhookSigner::new("secret");
    let payload = vec![b'x'; 10 * 1024 * 1024]; // 10MB
    let timestamp = Utc::now().timestamp();

    let signature = signer.sign(&payload, timestamp);
    let result = signer.verify(&payload, timestamp, &signature);

    assert!(result.is_ok());
    assert!(result.unwrap());
}

/// Test signature format validation
#[test]
fn test_signature_format_validation() {
    let signer = WebhookSigner::new("secret");
    let payload = b"test";
    let timestamp = Utc::now().timestamp();

    // Missing "sha256=" prefix
    let result = signer.verify(payload, timestamp, "abcd1234");
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), WebhookError::InvalidFormat(_)));

    // Invalid hex characters
    let result = signer.verify(payload, timestamp, "sha256=ZZZZ");
    assert!(result.is_err());

    // Too short
    let result = signer.verify(payload, timestamp, "sha256=abc");
    assert!(result.is_err());
}

/// Test concurrent signature generation and verification
#[test]
fn test_concurrent_operations() {
    use std::sync::Arc;
    use std::thread;

    let signer = Arc::new(WebhookSigner::new("concurrent-secret"));
    let timestamp = Utc::now().timestamp();

    let handles: Vec<_> = (0..10)
        .map(|i| {
            let signer = Arc::clone(&signer);
            thread::spawn(move || {
                let payload = format!("payload-{}", i);
                let signature = signer.sign(payload.as_bytes(), timestamp);
                let result = signer.verify(payload.as_bytes(), timestamp, &signature);
                assert!(result.is_ok());
                assert!(result.unwrap());
            })
        })
        .collect();

    for handle in handles {
        handle.join().unwrap();
    }
}

/// Test cross-language compatibility (Python/Node.js format)
#[test]
fn test_cross_language_signature_format() {
    let signer = WebhookSigner::new("test-secret");
    let payload = br#"{"test":"data"}"#;
    let timestamp = Utc::now().timestamp(); // Use current timestamp

    let signature = signer.sign(payload, timestamp);

    // Signature should be in format: sha256=<64_hex_chars>
    assert!(signature.starts_with("sha256="));
    assert_eq!(signature.len(), 7 + 64); // "sha256=" + 64 hex characters

    // Verification should work
    assert!(signer.verify(payload, timestamp, &signature).unwrap());
}
