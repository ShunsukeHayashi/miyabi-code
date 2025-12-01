//! Error handling policies for Miyabi system
//!
//! This module provides advanced error handling strategies:
//! - Circuit Breaker pattern for preventing cascading failures
//! - Fallback strategies for graceful degradation
//! - Integration with existing retry logic

use miyabi_types::error::MiyabiError;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::{info, warn};

/// Fallback strategy when world execution fails
#[derive(Debug, Clone)]
pub enum FallbackStrategy {
    /// Accept partial success (e.g., 1 out of 5 worlds succeeded)
    AcceptPartialSuccess {
        /// Minimum number of successful worlds required
        min_successful_worlds: usize,
    },
    /// Retry with lower temperature
    RetryWithLowerTemperature {
        /// Amount to reduce temperature by
        temperature_reduction: f64,
    },
    /// Switch to a different LLM model
    SwitchModel {
        /// Fallback model name
        fallback_model: String,
    },
    /// Wait for human intervention
    WaitForHumanIntervention {
        /// Timeout before giving up
        timeout: Duration,
    },
    /// Skip the task entirely
    SkipTask,
}

impl Default for FallbackStrategy {
    fn default() -> Self {
        Self::AcceptPartialSuccess { min_successful_worlds: 1 }
    }
}

impl FallbackStrategy {
    /// Creates a partial success strategy with default threshold (1/5)
    pub fn partial_success() -> Self {
        Self::AcceptPartialSuccess { min_successful_worlds: 1 }
    }

    /// Creates a temperature reduction strategy (reduce by 0.2)
    pub fn lower_temperature() -> Self {
        Self::RetryWithLowerTemperature { temperature_reduction: 0.2 }
    }

    /// Creates a model switch strategy (switch to Claude)
    pub fn switch_to_claude() -> Self {
        Self::SwitchModel { fallback_model: "claude-3-5-sonnet".to_string() }
    }

    /// Creates a human intervention strategy (24 hour timeout)
    pub fn wait_for_human() -> Self {
        Self::WaitForHumanIntervention { timeout: Duration::from_secs(24 * 60 * 60) }
    }
}

/// State of the circuit breaker
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CircuitState {
    /// Circuit is closed - requests flow normally
    Closed,
    /// Circuit is open - requests are blocked
    Open,
    /// Circuit is half-open - testing if service recovered
    HalfOpen,
}

/// Circuit breaker for preventing cascading failures
///
/// The circuit breaker pattern prevents repeated attempts to execute
/// operations that are likely to fail, allowing the system to recover.
///
/// # State Transitions
///
/// ```text
/// Closed ──(N failures)──> Open ──(timeout)──> HalfOpen
///   ^                                             |
///   └──────────(M successes)──────────────────────┘
/// ```
///
/// # Example
///
/// ```
/// use miyabi_core::error_policy::CircuitBreaker;
/// use std::time::Duration;
///
/// #[tokio::main]
/// async fn main() {
///     let breaker = CircuitBreaker::new(5, 2, Duration::from_secs(60));
///
///     // Try to execute operation
///     let result = breaker.call(|| async {
///         // Your fallible operation here
///         Ok::<_, std::io::Error>(())
///     }).await;
/// }
/// ```
pub struct CircuitBreaker {
    /// Number of consecutive failures before opening circuit
    failure_threshold: usize,
    /// Number of consecutive successes before closing circuit
    success_threshold: usize,
    /// Duration to wait before transitioning from Open to HalfOpen
    timeout: Duration,
    /// Current circuit state
    state: Arc<Mutex<CircuitState>>,
    /// Count of consecutive failures
    consecutive_failures: Arc<Mutex<usize>>,
    /// Count of consecutive successes
    consecutive_successes: Arc<Mutex<usize>>,
    /// Time when circuit was opened
    opened_at: Arc<Mutex<Option<Instant>>>,
}

impl CircuitBreaker {
    /// Creates a new CircuitBreaker
    ///
    /// # Arguments
    /// * `failure_threshold` - Number of consecutive failures before opening (default: 5)
    /// * `success_threshold` - Number of consecutive successes before closing (default: 2)
    /// * `timeout` - Duration before transitioning to HalfOpen (default: 60s)
    pub fn new(failure_threshold: usize, success_threshold: usize, timeout: Duration) -> Self {
        Self {
            failure_threshold,
            success_threshold,
            timeout,
            state: Arc::new(Mutex::new(CircuitState::Closed)),
            consecutive_failures: Arc::new(Mutex::new(0)),
            consecutive_successes: Arc::new(Mutex::new(0)),
            opened_at: Arc::new(Mutex::new(None)),
        }
    }

    /// Creates a CircuitBreaker with default settings
    /// - Failure threshold: 5
    /// - Success threshold: 2
    /// - Timeout: 60 seconds
    pub fn default_config() -> Self {
        Self::new(5, 2, Duration::from_secs(60))
    }

    /// Executes the given operation through the circuit breaker
    ///
    /// # Returns
    /// - Ok(T) if operation succeeds
    /// - Err(MiyabiError::CircuitOpen) if circuit is open
    /// - Err(e) if operation fails
    pub async fn call<F, T, E>(&self, operation: F) -> Result<T, MiyabiError>
    where
        F: FnOnce() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
        E: std::error::Error + Send + Sync + 'static,
    {
        // Check if we should attempt reset
        if self.should_attempt_reset().await {
            *self.state.lock().await = CircuitState::HalfOpen;
            info!("Circuit breaker transitioned to HalfOpen");
        }

        let current_state = *self.state.lock().await;

        match current_state {
            CircuitState::Open => {
                warn!("Circuit breaker is open - blocking request");
                Err(MiyabiError::Unknown("Circuit breaker is open".to_string()))
            }
            CircuitState::Closed | CircuitState::HalfOpen => match operation().await {
                Ok(result) => {
                    self.on_success().await;
                    Ok(result)
                }
                Err(e) => {
                    self.on_failure().await;
                    Err(MiyabiError::Unknown(e.to_string()))
                }
            },
        }
    }

    /// Records a successful operation
    async fn on_success(&self) {
        let mut successes = self.consecutive_successes.lock().await;
        *successes += 1;
        *self.consecutive_failures.lock().await = 0;

        if *successes >= self.success_threshold {
            let mut state = self.state.lock().await;
            if *state != CircuitState::Closed {
                *state = CircuitState::Closed;
                *self.opened_at.lock().await = None;
                info!("Circuit breaker closed after {} consecutive successes", successes);
            }
            *successes = 0;
        }
    }

    /// Records a failed operation
    async fn on_failure(&self) {
        let mut failures = self.consecutive_failures.lock().await;
        *failures += 1;
        *self.consecutive_successes.lock().await = 0;

        if *failures >= self.failure_threshold {
            let mut state = self.state.lock().await;
            if *state == CircuitState::Closed {
                *state = CircuitState::Open;
                *self.opened_at.lock().await = Some(Instant::now());
                warn!("Circuit breaker opened after {} consecutive failures", failures);
            }
        }
    }

    /// Checks if circuit should attempt reset (Open -> HalfOpen)
    async fn should_attempt_reset(&self) -> bool {
        let state = *self.state.lock().await;
        if state != CircuitState::Open {
            return false;
        }

        let opened_at = self.opened_at.lock().await;
        if let Some(opened_time) = *opened_at {
            opened_time.elapsed() >= self.timeout
        } else {
            false
        }
    }

    /// Gets the current circuit state
    pub async fn state(&self) -> CircuitState {
        *self.state.lock().await
    }

    /// Gets the number of consecutive failures
    pub async fn consecutive_failures(&self) -> usize {
        *self.consecutive_failures.lock().await
    }

    /// Gets the number of consecutive successes
    pub async fn consecutive_successes(&self) -> usize {
        *self.consecutive_successes.lock().await
    }

    /// Resets the circuit breaker to closed state
    pub async fn reset(&self) {
        *self.state.lock().await = CircuitState::Closed;
        *self.consecutive_failures.lock().await = 0;
        *self.consecutive_successes.lock().await = 0;
        *self.opened_at.lock().await = None;
        info!("Circuit breaker manually reset to Closed");
    }
}

impl Default for CircuitBreaker {
    fn default() -> Self {
        Self::default_config()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_circuit_breaker_opens_after_failures() {
        let breaker = CircuitBreaker::new(3, 2, Duration::from_millis(100));

        // Should be closed initially
        assert_eq!(breaker.state().await, CircuitState::Closed);

        // Simulate 3 failures
        for _ in 0..3 {
            let result = breaker
                .call(|| Box::pin(async { Result::<(), std::io::Error>::Err(std::io::Error::other("test error")) }))
                .await;
            assert!(result.is_err());
        }

        // Circuit should be open
        assert_eq!(breaker.state().await, CircuitState::Open);
        assert_eq!(breaker.consecutive_failures().await, 3);
    }

    #[tokio::test]
    async fn test_circuit_breaker_blocks_when_open() {
        let breaker = CircuitBreaker::new(2, 2, Duration::from_secs(60));

        // Open the circuit
        for _ in 0..2 {
            let _ = breaker
                .call(|| Box::pin(async { Result::<(), std::io::Error>::Err(std::io::Error::other("error")) }))
                .await;
        }

        assert_eq!(breaker.state().await, CircuitState::Open);

        // Next call should be blocked
        let result = breaker.call(|| Box::pin(async { Ok::<(), std::io::Error>(()) })).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_circuit_breaker_transitions_to_half_open() {
        let breaker = CircuitBreaker::new(2, 2, Duration::from_millis(50));

        // Open the circuit
        for _ in 0..2 {
            let _ = breaker
                .call(|| Box::pin(async { Result::<(), std::io::Error>::Err(std::io::Error::other("error")) }))
                .await;
        }

        assert_eq!(breaker.state().await, CircuitState::Open);

        // Wait for timeout
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Next call should transition to HalfOpen
        let result = breaker.call(|| Box::pin(async { Ok::<(), std::io::Error>(()) })).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_circuit_breaker_closes_after_successes() {
        let breaker = CircuitBreaker::new(2, 2, Duration::from_millis(50));

        // Open the circuit
        for _ in 0..2 {
            let _ = breaker
                .call(|| Box::pin(async { Result::<(), std::io::Error>::Err(std::io::Error::other("error")) }))
                .await;
        }

        assert_eq!(breaker.state().await, CircuitState::Open);

        // Wait for timeout
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Execute 2 successful operations
        for _ in 0..2 {
            let result = breaker.call(|| Box::pin(async { Ok::<(), std::io::Error>(()) })).await;
            assert!(result.is_ok());
        }

        // Circuit should be closed again
        assert_eq!(breaker.state().await, CircuitState::Closed);
    }

    #[tokio::test]
    async fn test_circuit_breaker_reset() {
        let breaker = CircuitBreaker::new(2, 2, Duration::from_secs(60));

        // Open the circuit
        for _ in 0..2 {
            let _ = breaker
                .call(|| Box::pin(async { Result::<(), std::io::Error>::Err(std::io::Error::other("error")) }))
                .await;
        }

        assert_eq!(breaker.state().await, CircuitState::Open);

        // Manually reset
        breaker.reset().await;

        // Should be closed now
        assert_eq!(breaker.state().await, CircuitState::Closed);
        assert_eq!(breaker.consecutive_failures().await, 0);
    }

    #[test]
    fn test_fallback_strategy_defaults() {
        let partial = FallbackStrategy::partial_success();
        match partial {
            FallbackStrategy::AcceptPartialSuccess { min_successful_worlds } => {
                assert_eq!(min_successful_worlds, 1);
            }
            _ => panic!("Wrong fallback type"),
        }

        let lower_temp = FallbackStrategy::lower_temperature();
        match lower_temp {
            FallbackStrategy::RetryWithLowerTemperature { temperature_reduction } => {
                assert_eq!(temperature_reduction, 0.2);
            }
            _ => panic!("Wrong fallback type"),
        }

        let switch = FallbackStrategy::switch_to_claude();
        match switch {
            FallbackStrategy::SwitchModel { fallback_model } => {
                assert_eq!(fallback_model, "claude-3-5-sonnet");
            }
            _ => panic!("Wrong fallback type"),
        }
    }
}
