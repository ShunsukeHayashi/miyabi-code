//! Retry logic with exponential backoff
//!
//! Provides utilities for retrying transient failures with exponential backoff.
//! Useful for network operations, external API calls, and transient errors.

use miyabi_types::error::{MiyabiError, Result};
use std::future::Future;
use std::time::Duration;

/// Configuration for retry behavior
#[derive(Debug, Clone)]
pub struct RetryConfig {
    /// Maximum number of retry attempts (excluding the first attempt)
    pub max_attempts: u32,
    /// Initial delay before first retry (milliseconds)
    pub initial_delay_ms: u64,
    /// Maximum delay between retries (milliseconds)
    pub max_delay_ms: u64,
    /// Backoff multiplier (typically 2.0 for exponential backoff)
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self { max_attempts: 3, initial_delay_ms: 100, max_delay_ms: 30000, backoff_multiplier: 2.0 }
    }
}

impl RetryConfig {
    /// Create a new retry configuration
    pub fn new(max_attempts: u32, initial_delay_ms: u64, max_delay_ms: u64) -> Self {
        Self { max_attempts, initial_delay_ms, max_delay_ms, backoff_multiplier: 2.0 }
    }

    /// Create aggressive retry config (5 attempts, 50ms initial, 10s max)
    pub fn aggressive() -> Self {
        Self { max_attempts: 5, initial_delay_ms: 50, max_delay_ms: 10000, backoff_multiplier: 2.0 }
    }

    /// Create conservative retry config (2 attempts, 500ms initial, 60s max)
    pub fn conservative() -> Self {
        Self { max_attempts: 2, initial_delay_ms: 500, max_delay_ms: 60000, backoff_multiplier: 2.0 }
    }

    /// Calculate delay for a given attempt number (0-indexed)
    pub fn calculate_delay(&self, attempt: u32) -> Duration {
        let delay_ms = (self.initial_delay_ms as f64 * self.backoff_multiplier.powi(attempt as i32))
            .min(self.max_delay_ms as f64) as u64;
        Duration::from_millis(delay_ms)
    }
}

/// Retry a future with exponential backoff
///
/// # Arguments
/// * `config` - Retry configuration
/// * `operation` - Async operation to retry (must be Fn, not FnOnce)
///
/// # Returns
/// * `Ok(T)` - Operation succeeded
/// * `Err(MiyabiError)` - All retry attempts failed
///
/// # Example
/// ```ignore
/// let result = retry_with_backoff(
///     RetryConfig::default(),
///     || async { fetch_data().await }
/// ).await?;
/// ```
pub async fn retry_with_backoff<F, Fut, T>(config: RetryConfig, operation: F) -> Result<T>
where
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T>>,
{
    let mut last_error = None;

    for attempt in 0..=config.max_attempts {
        tracing::debug!("Retry attempt {}/{} (including initial attempt)", attempt + 1, config.max_attempts + 1);

        match operation().await {
            Ok(result) => {
                if attempt > 0 {
                    tracing::info!("Operation succeeded after {} retries", attempt);
                }
                return Ok(result);
            }
            Err(error) => {
                // Check if error is retryable
                if !is_retryable(&error) {
                    tracing::debug!("Error is not retryable, failing immediately");
                    return Err(error);
                }

                last_error = Some(error);

                // Don't sleep after the last attempt
                if attempt < config.max_attempts {
                    let delay = config.calculate_delay(attempt);
                    tracing::debug!("Retry attempt {} failed, waiting {:?} before retry", attempt + 1, delay);
                    tokio::time::sleep(delay).await;
                }
            }
        }
    }

    // All attempts failed
    let error = last_error.unwrap_or_else(|| MiyabiError::Unknown("No error captured".to_string()));
    tracing::error!("All {} retry attempts failed: {}", config.max_attempts + 1, error);
    Err(error)
}

/// Determine if an error is retryable (transient)
///
/// Retryable errors include:
/// - Timeout errors
/// - HTTP connection errors (via error message patterns)
/// - GitHub rate limit errors (via error message patterns)
/// - IO errors with specific kinds (ConnectionRefused, TimedOut, etc.)
///
/// Non-retryable errors include:
/// - Validation errors (permanent)
/// - Agent errors (require code changes)
/// - Escalation errors (require human intervention)
/// - Configuration errors (permanent)
pub fn is_retryable(error: &MiyabiError) -> bool {
    match error {
        // Always retryable
        MiyabiError::Timeout(_) => true,

        // HTTP errors - check message for transient patterns
        MiyabiError::Http(msg) => {
            msg.to_lowercase().contains("timeout")
                || msg.to_lowercase().contains("connection")
                || msg.to_lowercase().contains("temporarily")
        }

        // GitHub errors - check for rate limiting
        MiyabiError::GitHub(msg) => {
            msg.to_lowercase().contains("rate limit")
                || msg.to_lowercase().contains("retry")
                || msg.to_lowercase().contains("temporarily unavailable")
        }

        // IO errors - some kinds are retryable
        MiyabiError::Io(io_error) => matches!(
            io_error.kind(),
            std::io::ErrorKind::ConnectionRefused
                | std::io::ErrorKind::ConnectionReset
                | std::io::ErrorKind::ConnectionAborted
                | std::io::ErrorKind::TimedOut
                | std::io::ErrorKind::Interrupted
                | std::io::ErrorKind::WouldBlock
        ),

        // Git errors - check message for lock conflicts
        MiyabiError::Git(msg) => msg.to_lowercase().contains("lock") || msg.to_lowercase().contains("unable to create"),

        // Never retryable
        MiyabiError::Agent(_) => false,
        MiyabiError::Escalation(_) => false,
        MiyabiError::CircularDependency(_) => false,
        MiyabiError::Auth(_) => false, // Authentication errors are permanent
        MiyabiError::Config(_) => false,
        MiyabiError::Validation(_) => false,
        MiyabiError::Json(_) => false,
        MiyabiError::ToolError(_) => false,        // Tool errors are permanent
        MiyabiError::PermissionDenied(_) => false, // Permission errors are permanent
        MiyabiError::Unknown(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_retry_config_default() {
        let config = RetryConfig::default();
        assert_eq!(config.max_attempts, 3);
        assert_eq!(config.initial_delay_ms, 100);
        assert_eq!(config.max_delay_ms, 30000);
        assert_eq!(config.backoff_multiplier, 2.0);
    }

    #[tokio::test]
    async fn test_retry_config_aggressive() {
        let config = RetryConfig::aggressive();
        assert_eq!(config.max_attempts, 5);
        assert_eq!(config.initial_delay_ms, 50);
    }

    #[tokio::test]
    async fn test_retry_config_conservative() {
        let config = RetryConfig::conservative();
        assert_eq!(config.max_attempts, 2);
        assert_eq!(config.initial_delay_ms, 500);
    }

    #[tokio::test]
    async fn test_calculate_delay_exponential() {
        let config = RetryConfig::new(3, 100, 10000);

        assert_eq!(config.calculate_delay(0), Duration::from_millis(100)); // 100 * 2^0
        assert_eq!(config.calculate_delay(1), Duration::from_millis(200)); // 100 * 2^1
        assert_eq!(config.calculate_delay(2), Duration::from_millis(400)); // 100 * 2^2
        assert_eq!(config.calculate_delay(3), Duration::from_millis(800)); // 100 * 2^3
    }

    #[tokio::test]
    async fn test_calculate_delay_capped_at_max() {
        let config = RetryConfig::new(10, 1000, 5000);

        // Should cap at max_delay_ms
        assert_eq!(config.calculate_delay(10), Duration::from_millis(5000));
        assert_eq!(config.calculate_delay(20), Duration::from_millis(5000));
    }

    #[tokio::test]
    async fn test_retry_succeeds_immediately() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let attempt_count_clone = Arc::clone(&attempt_count);

        let config = RetryConfig::new(3, 10, 1000);

        let result = retry_with_backoff(config, || {
            let count = Arc::clone(&attempt_count_clone);
            async move {
                count.fetch_add(1, Ordering::SeqCst);
                Ok::<String, MiyabiError>("success".to_string())
            }
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
        assert_eq!(attempt_count.load(Ordering::SeqCst), 1); // Only one attempt
    }

    #[tokio::test]
    async fn test_retry_succeeds_after_failures() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let attempt_count_clone = Arc::clone(&attempt_count);

        let config = RetryConfig::new(3, 10, 1000);

        let result = retry_with_backoff(config, || {
            let count = Arc::clone(&attempt_count_clone);
            async move {
                let current = count.fetch_add(1, Ordering::SeqCst);
                if current < 2 {
                    // Fail first 2 attempts
                    Err(MiyabiError::Timeout(1000))
                } else {
                    Ok::<String, MiyabiError>("success".to_string())
                }
            }
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
        assert_eq!(attempt_count.load(Ordering::SeqCst), 3); // 3 attempts (2 failures + 1 success)
    }

    #[tokio::test]
    async fn test_retry_fails_all_attempts() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let attempt_count_clone = Arc::clone(&attempt_count);

        let config = RetryConfig::new(2, 10, 1000); // max_attempts=2 means 3 total attempts

        let result = retry_with_backoff(config, || {
            let count = Arc::clone(&attempt_count_clone);
            async move {
                count.fetch_add(1, Ordering::SeqCst);
                Err::<String, MiyabiError>(MiyabiError::Timeout(1000))
            }
        })
        .await;

        assert!(result.is_err());
        assert_eq!(attempt_count.load(Ordering::SeqCst), 3); // 1 initial + 2 retries
    }

    #[tokio::test]
    async fn test_retry_non_retryable_error_fails_immediately() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let attempt_count_clone = Arc::clone(&attempt_count);

        let config = RetryConfig::new(3, 10, 1000);

        let result = retry_with_backoff(config, || {
            let count = Arc::clone(&attempt_count_clone);
            async move {
                count.fetch_add(1, Ordering::SeqCst);
                Err::<String, MiyabiError>(MiyabiError::Validation("Invalid input".to_string()))
            }
        })
        .await;

        assert!(result.is_err());
        assert_eq!(attempt_count.load(Ordering::SeqCst), 1); // Only one attempt, no retries
    }

    #[test]
    fn test_is_retryable_timeout() {
        assert!(is_retryable(&MiyabiError::Timeout(1000)));
    }

    #[test]
    fn test_is_retryable_http_timeout() {
        assert!(is_retryable(&MiyabiError::Http("Connection timeout".to_string())));
        assert!(is_retryable(&MiyabiError::Http("Temporarily unavailable".to_string())));
    }

    #[test]
    fn test_is_retryable_github_rate_limit() {
        assert!(is_retryable(&MiyabiError::GitHub("Rate limit exceeded".to_string())));
        assert!(is_retryable(&MiyabiError::GitHub("API rate limit exceeded, retry after 60s".to_string())));
    }

    #[test]
    fn test_is_retryable_io_connection_errors() {
        assert!(is_retryable(&MiyabiError::Io(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            "refused"
        ))));
        assert!(is_retryable(&MiyabiError::Io(std::io::Error::new(std::io::ErrorKind::TimedOut, "timeout"))));
        assert!(is_retryable(&MiyabiError::Io(std::io::Error::new(std::io::ErrorKind::Interrupted, "interrupted"))));
    }

    #[test]
    fn test_is_retryable_io_not_retryable() {
        assert!(!is_retryable(&MiyabiError::Io(std::io::Error::new(std::io::ErrorKind::NotFound, "not found"))));
        assert!(!is_retryable(&MiyabiError::Io(std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied"))));
    }

    #[test]
    fn test_is_retryable_git_lock_conflicts() {
        assert!(is_retryable(&MiyabiError::Git("Unable to create lock file".to_string())));
        assert!(is_retryable(&MiyabiError::Git("Lock already exists".to_string())));
    }

    #[test]
    fn test_is_not_retryable_validation() {
        assert!(!is_retryable(&MiyabiError::Validation("Invalid input".to_string())));
    }

    #[test]
    fn test_is_not_retryable_config() {
        assert!(!is_retryable(&MiyabiError::Config("Missing token".to_string())));
    }

    #[test]
    fn test_is_not_retryable_json() {
        let json_error = serde_json::from_str::<serde_json::Value>("invalid").unwrap_err();
        assert!(!is_retryable(&MiyabiError::Json(json_error)));
    }
}
