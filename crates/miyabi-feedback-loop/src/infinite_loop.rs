//! Core infinite loop orchestration

use crate::config::LoopConfig;
use crate::error::{LoopError, LoopResult};
use crate::goal_manager::{GoalManager, GoalStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::time::Duration;

/// Result of a single iteration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IterationResult {
    /// Iteration number
    pub iteration: usize,

    /// Quality/success score (0-100)
    pub score: f64,

    /// Feedback generated
    pub feedback: String,

    /// Execution duration in milliseconds
    pub duration_ms: u64,

    /// Whether iteration was successful
    pub success: bool,
}

/// Status of a feedback loop
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LoopStatus {
    /// Loop is initializing
    Initializing,

    /// Loop is running
    Running,

    /// Loop completed successfully (converged)
    Completed,

    /// Loop failed
    Failed,

    /// Loop was cancelled
    Cancelled,

    /// Loop reached max iterations
    MaxIterationsReached,
}

/// Completed feedback loop information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackLoop {
    /// Goal identifier
    pub goal_id: String,

    /// Total iterations executed
    pub iterations: usize,

    /// Final status
    pub status: LoopStatus,

    /// Iteration results
    pub results: Vec<IterationResult>,

    /// Total execution time in milliseconds
    pub total_duration_ms: u64,

    /// Convergence metrics
    pub convergence_metrics: Vec<f64>,
}

/// Infinite loop orchestrator
pub struct InfiniteLoopOrchestrator {
    config: LoopConfig,
    goal_manager: GoalManager,
    active_loops: HashMap<String, LoopStatus>,
}

impl InfiniteLoopOrchestrator {
    /// Create a new orchestrator
    pub fn new(config: LoopConfig) -> Self {
        Self {
            config,
            goal_manager: GoalManager::new(),
            active_loops: HashMap::new(),
        }
    }

    /// Start a feedback loop for a goal
    pub async fn start_loop(&mut self, goal_id: &str) -> LoopResult<FeedbackLoop> {
        // Validate configuration
        self.config
            .validate()
            .map_err(LoopError::ConfigError)?;

        // Create goal if it doesn't exist
        if self.goal_manager.get_goal(goal_id).is_err() {
            self.goal_manager
                .create_goal(goal_id, format!("Goal {}", goal_id));
        }

        // Set goal to active
        self.goal_manager
            .update_status(goal_id, GoalStatus::Active)?;
        self.active_loops
            .insert(goal_id.to_string(), LoopStatus::Running);

        let start_time = std::time::Instant::now();
        let mut iteration = 0;
        let mut results = Vec::new();
        let mut convergence_metrics = Vec::new();
        let mut consecutive_failures = 0;

        tracing::info!(
            "Starting feedback loop for goal: {} (max_iterations: {:?})",
            goal_id,
            self.config.max_iterations
        );

        loop {
            iteration += 1;

            // Check max iterations
            if let Some(max) = self.config.max_iterations {
                if iteration > max {
                    tracing::info!("Max iterations ({}) reached for goal: {}", max, goal_id);
                    self.active_loops
                        .insert(goal_id.to_string(), LoopStatus::MaxIterationsReached);
                    break;
                }
            }

            // Execute iteration with retries
            let result = self
                .execute_iteration_with_retry(goal_id, iteration)
                .await;

            match result {
                Ok(iter_result) => {
                    consecutive_failures = 0;
                    convergence_metrics.push(iter_result.score);
                    results.push(iter_result);

                    // Check convergence
                    if iteration >= self.config.min_iterations_before_convergence {
                        if self.check_convergence(&convergence_metrics) {
                            tracing::info!(
                                "Convergence detected at iteration {} for goal: {}",
                                iteration,
                                goal_id
                            );
                            self.goal_manager
                                .update_status(goal_id, GoalStatus::Completed)?;
                            self.active_loops
                                .insert(goal_id.to_string(), LoopStatus::Completed);
                            break;
                        }
                    }
                }
                Err(e) => {
                    consecutive_failures += 1;
                    tracing::error!(
                        "Iteration {} failed for goal {}: {} (consecutive failures: {})",
                        iteration,
                        goal_id,
                        e,
                        consecutive_failures
                    );

                    if consecutive_failures >= self.config.max_retries {
                        tracing::error!(
                            "Max consecutive failures reached for goal: {}",
                            goal_id
                        );
                        self.goal_manager
                            .update_status(goal_id, GoalStatus::Failed)?;
                        self.active_loops
                            .insert(goal_id.to_string(), LoopStatus::Failed);
                        return Err(e);
                    }
                }
            }

            // Delay before next iteration
            if self.config.iteration_delay_ms > 0 {
                tokio::time::sleep(Duration::from_millis(self.config.iteration_delay_ms)).await;
            }
        }

        let total_duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(FeedbackLoop {
            goal_id: goal_id.to_string(),
            iterations: iteration,
            status: *self
                .active_loops
                .get(goal_id)
                .unwrap_or(&LoopStatus::Completed),
            results,
            total_duration_ms,
            convergence_metrics,
        })
    }

    /// Execute an iteration with retry logic
    async fn execute_iteration_with_retry(
        &mut self,
        goal_id: &str,
        iteration: usize,
    ) -> LoopResult<IterationResult> {
        let mut attempts = 0;

        loop {
            attempts += 1;

            match self.execute_iteration(goal_id, iteration).await {
                Ok(result) => return Ok(result),
                Err(e) if e.is_retryable() && attempts < self.config.max_retries => {
                    tracing::warn!(
                        "Iteration {} attempt {} failed (retryable): {}",
                        iteration,
                        attempts,
                        e
                    );
                    tokio::time::sleep(Duration::from_millis(1000)).await;
                    continue;
                }
                Err(_e) => {
                    return Err(LoopError::MaxRetriesExceeded {
                        iteration,
                        max_retries: self.config.max_retries,
                    })
                }
            }
        }
    }

    /// Execute a single iteration
    async fn execute_iteration(
        &mut self,
        goal_id: &str,
        iteration: usize,
    ) -> LoopResult<IterationResult> {
        let start_time = std::time::Instant::now();

        tracing::info!(
            "Executing iteration {} for goal: {}",
            iteration,
            goal_id
        );

        // Increment goal iteration count
        self.goal_manager.increment_iteration(goal_id)?;

        // Get goal (currently unused, will be used for agent execution)
        let _goal = self.goal_manager.get_goal(goal_id)?;

        // TODO: Execute actual agent logic here
        // For now, simulate execution with a mock score
        let score = 70.0 + (iteration as f64 * 3.0).min(25.0);
        let feedback = format!("Iteration {} feedback", iteration);

        // Auto-refinement if enabled and score is low
        if self.config.auto_refinement_enabled && score < 85.0 {
            self.goal_manager
                .refine_goal(goal_id, &format!("Auto-refinement at iteration {}", iteration))?;
        }

        let duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(IterationResult {
            iteration,
            score,
            feedback,
            duration_ms,
            success: true,
        })
    }

    /// Check if convergence has been achieved
    fn check_convergence(&self, metrics: &[f64]) -> bool {
        if metrics.len() < self.config.min_iterations_before_convergence {
            return false;
        }

        // Calculate variance of last N iterations
        let n = self.config.min_iterations_before_convergence;
        let last_n = &metrics[metrics.len() - n..];

        let mean = last_n.iter().sum::<f64>() / last_n.len() as f64;
        let variance = last_n
            .iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>()
            / last_n.len() as f64;

        tracing::debug!(
            "Convergence check: variance={}, threshold={}",
            variance,
            self.config.convergence_threshold
        );

        variance < self.config.convergence_threshold
    }

    /// Get active loop status
    pub fn get_loop_status(&self, goal_id: &str) -> Option<LoopStatus> {
        self.active_loops.get(goal_id).copied()
    }

    /// Cancel a running loop
    pub fn cancel_loop(&mut self, goal_id: &str) -> LoopResult<()> {
        self.goal_manager
            .update_status(goal_id, GoalStatus::Cancelled)?;
        self.active_loops
            .insert(goal_id.to_string(), LoopStatus::Cancelled);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_start_loop_max_iterations() {
        let config = LoopConfig {
            max_iterations: Some(3),
            convergence_threshold: 1.0,
            ..Default::default()
        };

        let mut orchestrator = InfiniteLoopOrchestrator::new(config);
        let result = orchestrator.start_loop("test-goal").await.unwrap();

        // Note: iteration counter is incremented before execution, so max_iterations=3 results in iteration=4 at break
        assert_eq!(result.results.len(), 3); // 3 actual executions
        assert_eq!(result.status, LoopStatus::MaxIterationsReached);
    }

    #[tokio::test]
    async fn test_start_loop_convergence() {
        let config = LoopConfig {
            max_iterations: Some(10),
            convergence_threshold: 10.0,
            min_iterations_before_convergence: 3,
            iteration_delay_ms: 0,
            ..Default::default()
        };

        let mut orchestrator = InfiniteLoopOrchestrator::new(config);
        let result = orchestrator.start_loop("test-goal").await.unwrap();

        assert!(result.iterations <= 10);
        assert!(result.convergence_metrics.len() >= 3);
    }

    #[test]
    fn test_check_convergence() {
        let config = LoopConfig {
            convergence_threshold: 5.0,
            min_iterations_before_convergence: 3,
            ..Default::default()
        };

        let orchestrator = InfiniteLoopOrchestrator::new(config);

        // Not enough metrics
        assert!(!orchestrator.check_convergence(&[90.0, 91.0]));

        // Low variance (converged)
        assert!(orchestrator.check_convergence(&[90.0, 91.0, 90.5]));

        // High variance (not converged)
        assert!(!orchestrator.check_convergence(&[70.0, 85.0, 95.0]));
    }

    #[tokio::test]
    async fn test_cancel_loop() {
        let config = LoopConfig::default();
        let mut orchestrator = InfiniteLoopOrchestrator::new(config);

        orchestrator
            .goal_manager
            .create_goal("test-goal", "Test");
        orchestrator.cancel_loop("test-goal").unwrap();

        let status = orchestrator.get_loop_status("test-goal").unwrap();
        assert_eq!(status, LoopStatus::Cancelled);
    }
}
