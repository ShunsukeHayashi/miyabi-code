//! Configuration for feedback loop orchestration

use serde::{Deserialize, Serialize};

/// Configuration for infinite feedback loop execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopConfig {
    /// Maximum number of iterations (None = infinite)
    pub max_iterations: Option<usize>,

    /// Convergence threshold (variance % for last N iterations)
    pub convergence_threshold: f64,

    /// Minimum iterations before checking convergence
    pub min_iterations_before_convergence: usize,

    /// Enable automatic goal refinement based on feedback
    pub auto_refinement_enabled: bool,

    /// Timeout for each iteration in milliseconds
    pub timeout_ms: u64,

    /// Maximum retry attempts on failure
    pub max_retries: usize,

    /// Delay between iterations in milliseconds
    pub iteration_delay_ms: u64,
}

impl Default for LoopConfig {
    fn default() -> Self {
        Self {
            max_iterations: Some(10),
            convergence_threshold: 5.0,
            min_iterations_before_convergence: 3,
            auto_refinement_enabled: true,
            timeout_ms: 300_000, // 5 minutes
            max_retries: 3,
            iteration_delay_ms: 1000, // 1 second
        }
    }
}

impl LoopConfig {
    /// Create a new configuration with custom values
    pub fn new(max_iterations: Option<usize>, convergence_threshold: f64, auto_refinement_enabled: bool) -> Self {
        Self { max_iterations, convergence_threshold, auto_refinement_enabled, ..Default::default() }
    }

    /// Create an infinite loop configuration (no max_iterations)
    pub fn infinite() -> Self {
        Self { max_iterations: None, ..Default::default() }
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.convergence_threshold < 0.0 {
            return Err("convergence_threshold must be non-negative".to_string());
        }

        if self.min_iterations_before_convergence == 0 {
            return Err("min_iterations_before_convergence must be at least 1".to_string());
        }

        if self.timeout_ms == 0 {
            return Err("timeout_ms must be greater than 0".to_string());
        }

        if self.max_retries == 0 {
            return Err("max_retries must be at least 1".to_string());
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LoopConfig::default();
        assert_eq!(config.max_iterations, Some(10));
        assert_eq!(config.convergence_threshold, 5.0);
        assert!(config.auto_refinement_enabled);
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_infinite_config() {
        let config = LoopConfig::infinite();
        assert_eq!(config.max_iterations, None);
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_custom_config() {
        let config = LoopConfig::new(Some(5), 3.0, false);
        assert_eq!(config.max_iterations, Some(5));
        assert_eq!(config.convergence_threshold, 3.0);
        assert!(!config.auto_refinement_enabled);
    }

    #[test]
    fn test_validate_negative_threshold() {
        let config = LoopConfig { convergence_threshold: -1.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_validate_zero_min_iterations() {
        let config = LoopConfig { min_iterations_before_convergence: 0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_validate_zero_timeout() {
        let config = LoopConfig { timeout_ms: 0, ..Default::default() };
        assert!(config.validate().is_err());
    }
}
