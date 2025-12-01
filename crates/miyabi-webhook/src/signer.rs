//! Webhook signature generation and verification

use crate::error::{Result, WebhookError};
use crate::DEFAULT_TIMESTAMP_TOLERANCE_SECS;
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

/// Webhook signature generator and verifier
///
/// Uses HMAC-SHA256 for message authentication with replay protection.
///
/// # Examples
///
/// ```
/// use miyabi_webhook::WebhookSigner;
/// use chrono::Utc;
///
/// let signer = WebhookSigner::new("my-secret");
/// let payload = b"webhook payload";
/// let timestamp = Utc::now().timestamp();
///
/// // Generate signature
/// let signature = signer.sign(payload, timestamp);
///
/// // Verify signature
/// let is_valid = signer.verify(payload, timestamp, &signature).unwrap();
/// assert!(is_valid);
/// ```
pub struct WebhookSigner {
    secret_key: Vec<u8>,
    timestamp_tolerance: i64,
}

impl WebhookSigner {
    /// Create a new signer with the given secret key
    ///
    /// # Arguments
    ///
    /// * `secret` - Shared secret key for HMAC
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_webhook::WebhookSigner;
    ///
    /// let signer = WebhookSigner::new("my-secret-key");
    /// ```
    pub fn new(secret: &str) -> Self {
        Self { secret_key: secret.as_bytes().to_vec(), timestamp_tolerance: DEFAULT_TIMESTAMP_TOLERANCE_SECS }
    }

    /// Create a signer with custom timestamp tolerance
    ///
    /// # Arguments
    ///
    /// * `secret` - Shared secret key
    /// * `tolerance_secs` - Timestamp tolerance in seconds
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_webhook::WebhookSigner;
    ///
    /// // 10-minute tolerance
    /// let signer = WebhookSigner::with_tolerance("secret", 600);
    /// ```
    pub fn with_tolerance(secret: &str, tolerance_secs: i64) -> Self {
        Self { secret_key: secret.as_bytes().to_vec(), timestamp_tolerance: tolerance_secs }
    }

    /// Generate HMAC-SHA256 signature for payload
    ///
    /// The signature is computed as: `HMAC-SHA256(secret, payload || timestamp)`
    ///
    /// # Arguments
    ///
    /// * `payload` - Webhook payload bytes
    /// * `timestamp` - Unix timestamp (seconds)
    ///
    /// # Returns
    ///
    /// Signature in format: `sha256=<hex>`
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_webhook::WebhookSigner;
    /// use chrono::Utc;
    ///
    /// let signer = WebhookSigner::new("secret");
    /// let sig = signer.sign(b"payload", Utc::now().timestamp());
    /// assert!(sig.starts_with("sha256="));
    /// ```
    pub fn sign(&self, payload: &[u8], timestamp: i64) -> String {
        let mut mac = HmacSha256::new_from_slice(&self.secret_key).expect("HMAC can take key of any size");

        // Sign: payload + timestamp
        mac.update(payload);
        mac.update(&timestamp.to_le_bytes());

        let result = mac.finalize();
        format!("sha256={}", hex::encode(result.into_bytes()))
    }

    /// Verify webhook signature
    ///
    /// Performs constant-time comparison and timestamp validation.
    ///
    /// # Arguments
    ///
    /// * `payload` - Webhook payload bytes
    /// * `timestamp` - Unix timestamp from `X-Miyabi-Timestamp` header
    /// * `signature` - Signature from `X-Miyabi-Signature` header
    ///
    /// # Returns
    ///
    /// `Ok(true)` if signature is valid, `Err` otherwise
    ///
    /// # Errors
    ///
    /// - `InvalidFormat`: Signature doesn't match `sha256=<hex>` format
    /// - `TimestampOutOfRange`: Timestamp outside tolerance window (replay attack)
    /// - `VerificationFailed`: Signature doesn't match computed value
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_webhook::WebhookSigner;
    /// use chrono::Utc;
    ///
    /// let signer = WebhookSigner::new("secret");
    /// let payload = b"test";
    /// let timestamp = Utc::now().timestamp();
    /// let signature = signer.sign(payload, timestamp);
    ///
    /// // Valid signature
    /// assert!(signer.verify(payload, timestamp, &signature).unwrap());
    ///
    /// // Invalid signature
    /// assert!(signer.verify(payload, timestamp, "sha256=invalid").is_err());
    /// ```
    pub fn verify(&self, payload: &[u8], timestamp: i64, signature: &str) -> Result<bool> {
        // 1. Check timestamp (replay protection)
        let now = Utc::now().timestamp();
        let age = (now - timestamp).abs();
        if age > self.timestamp_tolerance {
            return Err(WebhookError::TimestampOutOfRange(age, self.timestamp_tolerance));
        }

        // 2. Parse signature format
        let signature = signature
            .strip_prefix("sha256=")
            .ok_or_else(|| WebhookError::InvalidFormat(format!("Expected 'sha256=' prefix, got: {}", signature)))?;

        let expected_bytes = hex::decode(signature)?;

        // 3. Compute expected signature
        let mut mac = HmacSha256::new_from_slice(&self.secret_key).expect("HMAC can take key of any size");
        mac.update(payload);
        mac.update(&timestamp.to_le_bytes());

        let computed = mac.finalize().into_bytes();

        // 4. Constant-time comparison (timing attack resistance)
        if computed.ct_eq(&expected_bytes[..]).into() {
            Ok(true)
        } else {
            Err(WebhookError::VerificationFailed)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sign_payload() {
        let signer = WebhookSigner::new("test-secret");
        let payload = b"webhook payload";
        let timestamp = 1698765432;

        let signature = signer.sign(payload, timestamp);

        assert!(signature.starts_with("sha256="));
        assert_eq!(signature.len(), 7 + 64); // "sha256=" + 64 hex chars
    }

    #[test]
    fn test_verify_valid_signature() {
        let signer = WebhookSigner::new("test-secret");
        let payload = b"test payload";
        let timestamp = Utc::now().timestamp();

        let signature = signer.sign(payload, timestamp);
        let result = signer.verify(payload, timestamp, &signature);

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_verify_invalid_signature() {
        let signer = WebhookSigner::new("test-secret");
        let payload = b"test payload";
        let timestamp = Utc::now().timestamp();

        let result = signer.verify(
            payload,
            timestamp,
            "sha256=0000000000000000000000000000000000000000000000000000000000000000",
        );

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WebhookError::VerificationFailed));
    }

    #[test]
    fn test_replay_attack_prevention() {
        let signer = WebhookSigner::new("test-secret");
        let payload = b"old payload";
        let old_timestamp = Utc::now().timestamp() - 600; // 10 minutes ago

        let signature = signer.sign(payload, old_timestamp);
        let result = signer.verify(payload, old_timestamp, &signature);

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WebhookError::TimestampOutOfRange(_, _)));
    }

    #[test]
    fn test_invalid_signature_format() {
        let signer = WebhookSigner::new("test-secret");
        let payload = b"payload";
        let timestamp = Utc::now().timestamp();

        let result = signer.verify(payload, timestamp, "invalid-format");

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WebhookError::InvalidFormat(_)));
    }

    #[test]
    fn test_custom_tolerance() {
        let signer = WebhookSigner::with_tolerance("secret", 60); // 1 minute
        let payload = b"payload";
        let timestamp = Utc::now().timestamp() - 120; // 2 minutes ago

        let signature = signer.sign(payload, timestamp);
        let result = signer.verify(payload, timestamp, &signature);

        assert!(result.is_err()); // Should fail with 1-minute tolerance
    }

    #[test]
    fn test_different_payloads_different_signatures() {
        let signer = WebhookSigner::new("secret");
        let timestamp = Utc::now().timestamp();

        let sig1 = signer.sign(b"payload1", timestamp);
        let sig2 = signer.sign(b"payload2", timestamp);

        assert_ne!(sig1, sig2);
    }

    #[test]
    fn test_different_timestamps_different_signatures() {
        let signer = WebhookSigner::new("secret");
        let payload = b"payload";

        let sig1 = signer.sign(payload, 1000);
        let sig2 = signer.sign(payload, 2000);

        assert_ne!(sig1, sig2);
    }
}
