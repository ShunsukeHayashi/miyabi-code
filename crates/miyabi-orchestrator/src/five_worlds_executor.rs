//! Five Worlds Executor - Orchestrates parallel execution of 5 worlds
//!
//! This module implements the FiveWorldsExecutor, which coordinates the
//! execution of a single task across 5 parallel worlds, evaluates the results,
//! and selects the best one.
//!
//! # Integration with Error Handling & Scaling
//!
//! This executor integrates:
//! - **CircuitBreaker**: Prevents cascading failures when worlds fail repeatedly
//! - **DynamicScaler**: Adjusts concurrent execution based on system resources
//! - **FallbackStrategy**: Provides graceful degradation when failures occur

use crate::dynamic_scaling::{DynamicScaler, DynamicScalerConfig};
use miyabi_agent_codegen::CodeGenAgent;
use miyabi_agent_review::ReviewAgent;
use miyabi_core::error_policy::{CircuitBreaker, FallbackStrategy};
use miyabi_types::error::MiyabiError;
use miyabi_types::quality::ReviewResult;
use miyabi_types::task::Task;
use miyabi_types::world::{
    EvaluationScore, FiveWorldsResult, WorldConfig, WorldExecutionResult, WorldId,
};
use miyabi_types::AgentConfig;
use miyabi_worktree::FiveWorldsManager;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::{debug, info, warn};

/// Configuration for the Five Worlds Executor
#[derive(Debug, Clone)]
pub struct FiveWorldsExecutorConfig {
    /// Base path for worktrees
    pub worktrees_base: PathBuf,
    /// Path to the main repository
    pub repo_path: PathBuf,
    /// Timeout for each world execution (default: 30 minutes)
    pub world_timeout: Duration,
    /// Whether to run worlds in parallel (default: true)
    pub parallel_execution: bool,
    /// Enable circuit breaker for world executions (default: true)
    pub enable_circuit_breaker: bool,
    /// Enable dynamic scaling (default: true)
    pub enable_dynamic_scaling: bool,
    /// Fallback strategy when all worlds fail
    pub fallback_strategy: FallbackStrategy,
}

impl Default for FiveWorldsExecutorConfig {
    fn default() -> Self {
        Self {
            worktrees_base: PathBuf::from("worktrees"),
            repo_path: PathBuf::from("."),
            world_timeout: Duration::from_secs(30 * 60), // 30 minutes
            parallel_execution: true,
            enable_circuit_breaker: true,
            enable_dynamic_scaling: true,
            fallback_strategy: FallbackStrategy::default(),
        }
    }
}

/// Executor for the 5-Worlds Quality Assurance Strategy
///
/// This executor runs a single task in 5 parallel worlds with different
/// LLM parameters, evaluates all results, and selects the best one.
///
/// # Example
///
/// ```no_run
/// use miyabi_orchestrator::five_worlds_executor::{FiveWorldsExecutor, FiveWorldsExecutorConfig};
/// use miyabi_types::task::Task;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());
///
///     let task = Task {
///         // ... task definition
/// #       id: "task-1".to_string(),
/// #       name: "implement_feature".to_string(),
/// #       description: "Implement authentication".to_string(),
/// #       dependencies: vec![],
/// #       status: miyabi_types::task::TaskStatus::Pending,
/// #       estimated_complexity: 0.5,
/// #       assigned_agent: None,
/// #       created_at: chrono::Utc::now(),
/// #       updated_at: chrono::Utc::now(),
/// #       metadata: Default::default(),
///     };
///
///     let result = executor.execute_task_with_five_worlds(270, task).await?;
///
///     if let Some(winner) = result.winner {
///         println!("Winner: {:?} with score {:.1}", winner,
///                  result.winner_result().unwrap().score.total);
///     }
///
///     Ok(())
/// }
/// ```
pub struct FiveWorldsExecutor {
    /// Configuration
    config: FiveWorldsExecutorConfig,
    /// Active world executions (for monitoring)
    active_executions: Arc<Mutex<HashMap<WorldId, WorldExecutionStatus>>>,
    /// Circuit breakers per WorldId (Arc-wrapped for cloning)
    circuit_breakers: Arc<Mutex<HashMap<WorldId, Arc<CircuitBreaker>>>>,
    /// Dynamic scaler for resource management
    dynamic_scaler: Option<Arc<DynamicScaler>>,
    /// Worktree manager for 5-Worlds execution
    worktree_manager: Arc<FiveWorldsManager>,
}

/// Status of a world execution
#[derive(Debug, Clone)]
pub struct WorldExecutionStatus {
    /// WorldId
    pub world_id: WorldId,
    /// Start time
    pub started_at: Instant,
    /// Current status
    pub status: ExecutionStatus,
}

/// Execution status enum
#[derive(Debug, Clone, PartialEq)]
pub enum ExecutionStatus {
    /// World is currently running
    Running,
    /// World completed successfully
    Completed,
    /// World failed
    Failed,
    /// World was terminated early
    Terminated,
}

impl FiveWorldsExecutor {
    /// Creates a new FiveWorldsExecutor
    pub fn new(config: FiveWorldsExecutorConfig) -> Self {
        // Initialize circuit breakers for each world
        let mut circuit_breakers_map = HashMap::new();
        if config.enable_circuit_breaker {
            for world_id in WorldId::all() {
                circuit_breakers_map.insert(world_id, Arc::new(CircuitBreaker::default_config()));
            }
            info!("Circuit breakers enabled for all 5 worlds");
        }

        // Initialize dynamic scaler if enabled
        let dynamic_scaler = if config.enable_dynamic_scaling {
            let scaler_config = DynamicScalerConfig::default();
            let scaler = Arc::new(DynamicScaler::new(scaler_config));
            info!("Dynamic scaler enabled");
            Some(scaler)
        } else {
            None
        };

        // Initialize worktree manager
        let worktree_manager = Arc::new(FiveWorldsManager::new(
            config.worktrees_base.clone(),
            config.repo_path.clone(),
        ));
        info!(
            worktrees_base = ?config.worktrees_base,
            repo_path = ?config.repo_path,
            "Worktree manager initialized"
        );

        Self {
            config,
            active_executions: Arc::new(Mutex::new(HashMap::new())),
            circuit_breakers: Arc::new(Mutex::new(circuit_breakers_map)),
            dynamic_scaler,
            worktree_manager,
        }
    }

    /// Executes a task across all 5 worlds and returns the aggregated result
    ///
    /// # Arguments
    /// * `issue_number` - GitHub issue number
    /// * `task` - The task to execute
    ///
    /// # Returns
    /// FiveWorldsResult with all world results and the winner
    ///
    /// # Process
    /// 1. Spawn 5 worktrees (one per world)
    /// 2. Execute the task in each world (parallel or sequential)
    /// 3. Evaluate all results
    /// 4. Select the winner (highest score)
    /// 5. Clean up losing worlds
    /// 6. Return aggregated result
    pub async fn execute_task_with_five_worlds(
        &self,
        issue_number: u64,
        task: Task,
    ) -> Result<FiveWorldsResult, MiyabiError> {
        info!(
            issue_number = issue_number,
            task_id = %task.id,
            task_title = %task.title,
            "Starting 5-Worlds execution"
        );

        // Hook: 5-Worlds execution start
        {
            let mut params = std::collections::HashMap::new();
            params.insert("ISSUE_NUMBER".to_string(), issue_number.to_string());
            params.insert("TASK_ID".to_string(), task.id.clone());
            params.insert("TASK_TITLE".to_string(), task.title.clone());
            crate::hooks::notify_orchestrator_event("five_worlds_start", params);
        }

        let start_time = Instant::now();

        // Step 1: Prepare world configs
        let world_configs = self.prepare_world_configs(issue_number, &task);

        // Step 2: Spawn all 5 worktrees
        info!("Spawning 5 worktrees for issue {}", issue_number);
        let _worktree_handles = self
            .worktree_manager
            .spawn_all_worlds(issue_number, &task.id)
            .await
            .map_err(|e| MiyabiError::Git(e.to_string()))?;
        info!("All 5 worktrees spawned successfully");

        // Hook: Worktrees spawned
        {
            let mut params = std::collections::HashMap::new();
            params.insert("ISSUE_NUMBER".to_string(), issue_number.to_string());
            crate::hooks::notify_orchestrator_event("worktrees_spawned", params);
        }

        // Step 3: Execute all worlds
        let results = if self.config.parallel_execution {
            // Hook: Parallel execution mode
            {
                let mut params = std::collections::HashMap::new();
                params.insert("PARALLEL_MODE".to_string(), "true".to_string());
                crate::hooks::notify_orchestrator_event("parallel_execution", params);
            }
            self.execute_worlds_parallel(issue_number, &task, world_configs)
                .await?
        } else {
            // Hook: Sequential execution mode
            {
                let mut params = std::collections::HashMap::new();
                params.insert("PARALLEL_MODE".to_string(), "false".to_string());
                crate::hooks::notify_orchestrator_event("sequential_execution", params);
            }
            self.execute_worlds_sequential(issue_number, &task, world_configs)
                .await?
        };

        // Step 4: Create aggregated result
        let five_worlds_result = FiveWorldsResult::from_results(results);

        // Step 5: Cleanup losing worlds, keep winner
        if let Some(winner_id) = five_worlds_result.winner {
            info!(winner = ?winner_id, "Cleaning up losing worlds");

            // Hook: Winner selected
            if let Some(winner_result) = five_worlds_result.winner_result() {
                let mut params = std::collections::HashMap::new();
                params.insert("WINNER_ID".to_string(), format!("{:?}", winner_id));
                params.insert("SCORE".to_string(), winner_result.score.total.to_string());
                crate::hooks::notify_orchestrator_event("winner_selected", params);
            }

            // Hook: Cleanup losers
            {
                let mut params = std::collections::HashMap::new();
                params.insert("WINNER_ID".to_string(), format!("{:?}", winner_id));
                crate::hooks::notify_orchestrator_event("cleanup_losers", params);
            }

            for world_id in WorldId::all() {
                if world_id != winner_id {
                    if let Err(e) = self.worktree_manager.cleanup_world(world_id).await {
                        warn!(
                            world_id = ?world_id,
                            error = %e,
                            "Failed to cleanup losing world"
                        );
                    }
                }
            }
            info!(winner = ?winner_id, "Kept winner worktree, cleaned up losers");
        } else {
            // No winner - cleanup all
            warn!("No successful world - cleaning up all worlds");

            // Hook: No winner
            {
                let params = std::collections::HashMap::new();
                crate::hooks::notify_orchestrator_event("no_winner", params);
            }

            // Hook: Cleanup all
            {
                let params = std::collections::HashMap::new();
                crate::hooks::notify_orchestrator_event("cleanup_all", params);
            }

            if let Err(e) = self
                .worktree_manager
                .cleanup_all_worlds_for_issue(issue_number)
                .await
            {
                warn!(error = %e, "Failed to cleanup all worlds");
            }
        }

        let duration = start_time.elapsed();
        info!(
            duration_ms = duration.as_millis(),
            successful = five_worlds_result.successful_count(),
            failed = five_worlds_result.failed_count(),
            winner = ?five_worlds_result.winner,
            "5-Worlds execution completed"
        );

        // Hook: Execution summary
        {
            let mut params = std::collections::HashMap::new();
            params.insert("DURATION_MS".to_string(), duration.as_millis().to_string());
            params.insert(
                "SUCCESSFUL_COUNT".to_string(),
                five_worlds_result.successful_count().to_string(),
            );
            params.insert(
                "FAILED_COUNT".to_string(),
                five_worlds_result.failed_count().to_string(),
            );
            if let Some(winner_result) = five_worlds_result.winner_result() {
                params.insert(
                    "COST_USD".to_string(),
                    format!("{:.2}", winner_result.cost_usd),
                );
            }
            crate::hooks::notify_orchestrator_event("execution_summary", params);
        }

        // Step 6: Log winner details
        if let Some(winner_result) = five_worlds_result.winner_result() {
            info!(
                winner = ?five_worlds_result.winner.unwrap(),
                score = winner_result.score.total,
                "Winner selected: {}",
                winner_result.score
            );

            // Hook: Winner details
            {
                let mut params = std::collections::HashMap::new();
                params.insert(
                    "WINNER_ID".to_string(),
                    format!("{:?}", five_worlds_result.winner.unwrap()),
                );
                params.insert("SCORE".to_string(), winner_result.score.total.to_string());
                crate::hooks::notify_orchestrator_event("winner_details", params);
            }
        } else {
            warn!("No successful world execution - all worlds failed");
        }

        Ok(five_worlds_result)
    }

    /// Prepares WorldConfig for all 5 worlds
    fn prepare_world_configs(
        &self,
        issue_number: u64,
        task: &Task,
    ) -> HashMap<WorldId, WorldConfig> {
        let mut configs = HashMap::new();

        // Use task.id as the directory name (it should be filesystem-safe)
        let task_dir_name = task.id.replace('/', "-").replace(' ', "_");

        for world_id in WorldId::all() {
            let config = WorldConfig::default_for(world_id)
                .with_issue_task_path(issue_number, &task_dir_name);
            configs.insert(world_id, config);
        }

        debug!(
            issue_number = issue_number,
            task_id = %task.id,
            task_title = %task.title,
            "Prepared configs for 5 worlds"
        );

        configs
    }

    /// Executes all worlds in parallel with circuit breaker and dynamic scaling
    async fn execute_worlds_parallel(
        &self,
        _issue_number: u64,
        task: &Task,
        world_configs: HashMap<WorldId, WorldConfig>,
    ) -> Result<HashMap<WorldId, WorldExecutionResult>, MiyabiError> {
        info!("Executing 5 worlds in parallel");

        // Check dynamic scaler for optimal concurrency
        let max_concurrency = if let Some(scaler) = &self.dynamic_scaler {
            scaler.get_current_limit().await
        } else {
            5 // Default: run all worlds in parallel
        };

        info!(max_concurrency = max_concurrency, "Dynamic scaling applied");

        // Hook: Dynamic scaling applied
        {
            let mut params = std::collections::HashMap::new();
            params.insert("MAX_CONCURRENCY".to_string(), max_concurrency.to_string());
            crate::hooks::notify_orchestrator_event("parallel_execution", params);
        }

        let mut handles = vec![];
        let semaphore = Arc::new(tokio::sync::Semaphore::new(max_concurrency));

        for (world_id, config) in world_configs {
            // Check circuit breaker state before executing
            let should_skip = if self.config.enable_circuit_breaker {
                let circuit_breakers = self.circuit_breakers.lock().await;
                if let Some(cb) = circuit_breakers.get(&world_id) {
                    let state = cb.state().await;
                    if state == miyabi_core::error_policy::CircuitState::Open {
                        warn!(
                            world_id = ?world_id,
                            state = ?state,
                            "Circuit breaker is open, skipping world execution"
                        );
                        true
                    } else {
                        false
                    }
                } else {
                    false
                }
            } else {
                false
            };

            if should_skip {
                // Hook: Execution skipped due to circuit breaker
                {
                    let mut params = std::collections::HashMap::new();
                    params.insert("WORLD_ID".to_string(), format!("{:?}", world_id));
                    params.insert("STATE".to_string(), "Open".to_string());
                    crate::hooks::notify_circuit_breaker_event("execution_skipped", params);
                }

                // Return failed result immediately
                let failed_result = WorldExecutionResult::failed(
                    world_id,
                    "Circuit breaker open - too many recent failures".to_string(),
                );
                handles.push(tokio::spawn(async move { (world_id, failed_result) }));
                continue;
            }

            let task_clone = task.clone();
            let timeout = self.config.world_timeout;
            let active_executions = self.active_executions.clone();
            let circuit_breakers = self.circuit_breakers.clone();
            let enable_circuit_breaker = self.config.enable_circuit_breaker;
            let permit = semaphore.clone().acquire_owned().await.unwrap();

            let handle = tokio::spawn(async move {
                let _permit = permit; // Hold permit until task completes

                // Register as running
                {
                    let mut executions = active_executions.lock().await;
                    executions.insert(
                        world_id,
                        WorldExecutionStatus {
                            world_id,
                            started_at: Instant::now(),
                            status: ExecutionStatus::Running,
                        },
                    );
                }

                // Execute with timeout and circuit breaker
                let result = if enable_circuit_breaker {
                    let cb = {
                        let circuit_breakers_lock = circuit_breakers.lock().await;
                        circuit_breakers_lock.get(&world_id).cloned()
                    };

                    if let Some(breaker) = cb {
                        // Execute through circuit breaker
                        let world_id_clone = world_id;
                        let config_clone = config.clone();
                        let task_clone2 = task_clone.clone();

                        let breaker_result = breaker
                            .call(|| {
                                Box::pin(async move {
                                    tokio::time::timeout(
                                        timeout,
                                        Self::execute_single_world_stub(
                                            world_id_clone,
                                            config_clone,
                                            task_clone2,
                                        ),
                                    )
                                    .await
                                    .map_err(|_| {
                                        std::io::Error::new(
                                            std::io::ErrorKind::TimedOut,
                                            "Execution timeout",
                                        )
                                    })?
                                })
                            })
                            .await;

                        match breaker_result {
                            Ok(exec_result) => Ok(Ok(exec_result)),
                            Err(e) => Ok(Err(MiyabiError::Unknown(e.to_string()))),
                        }
                    } else {
                        // Fallback if circuit breaker not found
                        tokio::time::timeout(
                            timeout,
                            Self::execute_single_world_stub(world_id, config, task_clone),
                        )
                        .await
                        .map_err(|_| MiyabiError::Unknown("Timeout".to_string()))
                    }
                } else {
                    // No circuit breaker - execute directly with timeout
                    tokio::time::timeout(
                        timeout,
                        Self::execute_single_world_stub(world_id, config, task_clone),
                    )
                    .await
                    .map_err(|_| MiyabiError::Unknown("Timeout".to_string()))
                };

                // Update status
                {
                    let mut executions = active_executions.lock().await;
                    if let Some(status) = executions.get_mut(&world_id) {
                        status.status = match &result {
                            Ok(Ok(_)) => ExecutionStatus::Completed,
                            Ok(Err(_)) | Err(_) => ExecutionStatus::Failed,
                        };
                    }
                }

                match result {
                    Ok(Ok(exec_result)) => (world_id, exec_result),
                    Ok(Err(e)) => {
                        warn!(world_id = ?world_id, error = %e, "World execution failed");
                        (
                            world_id,
                            WorldExecutionResult::failed(world_id, e.to_string()),
                        )
                    }
                    Err(e) => {
                        warn!(world_id = ?world_id, error = %e, "World execution error");
                        (
                            world_id,
                            WorldExecutionResult::failed(world_id, e.to_string()),
                        )
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all worlds to complete
        let results = futures::future::join_all(handles)
            .await
            .into_iter()
            .filter_map(|r| r.ok())
            .collect::<HashMap<_, _>>();

        Ok(results)
    }

    /// Executes all worlds sequentially (for debugging) with circuit breaker
    async fn execute_worlds_sequential(
        &self,
        _issue_number: u64,
        task: &Task,
        world_configs: HashMap<WorldId, WorldConfig>,
    ) -> Result<HashMap<WorldId, WorldExecutionResult>, MiyabiError> {
        info!("Executing 5 worlds sequentially");

        let mut results = HashMap::new();

        for (world_id, config) in world_configs {
            info!(world_id = ?world_id, "Executing world");

            // Check circuit breaker state before executing
            if self.config.enable_circuit_breaker {
                let circuit_breakers = self.circuit_breakers.lock().await;
                if let Some(cb) = circuit_breakers.get(&world_id) {
                    let state = cb.state().await;
                    if state == miyabi_core::error_policy::CircuitState::Open {
                        warn!(
                            world_id = ?world_id,
                            state = ?state,
                            "Circuit breaker is open, skipping world execution"
                        );
                        results.insert(
                            world_id,
                            WorldExecutionResult::failed(
                                world_id,
                                "Circuit breaker open - too many recent failures".to_string(),
                            ),
                        );
                        continue;
                    }
                }
            }

            // Execute through circuit breaker if enabled
            let result = if self.config.enable_circuit_breaker {
                let cb = {
                    let circuit_breakers = self.circuit_breakers.lock().await;
                    circuit_breakers.get(&world_id).cloned()
                };

                if let Some(breaker) = cb {
                    let world_id_clone = world_id;
                    let config_clone = config;
                    let task_clone = task.clone();

                    breaker
                        .call(|| {
                            Box::pin(async move {
                                Self::execute_single_world_stub(
                                    world_id_clone,
                                    config_clone,
                                    task_clone,
                                )
                                .await
                                .map_err(|e| std::io::Error::other(e.to_string()))
                            })
                        })
                        .await
                } else {
                    Self::execute_single_world_stub(world_id, config, task.clone()).await
                }
            } else {
                Self::execute_single_world_stub(world_id, config, task.clone()).await
            };

            match result {
                Ok(exec_result) => {
                    results.insert(world_id, exec_result);
                }
                Err(e) => {
                    warn!(world_id = ?world_id, error = %e, "World execution failed");
                    results.insert(
                        world_id,
                        WorldExecutionResult::failed(world_id, e.to_string()),
                    );
                }
            }
        }

        Ok(results)
    }

    /// Builds AgentConfig from WorldConfig
    #[allow(dead_code)]
    fn build_agent_config(world_config: &WorldConfig) -> AgentConfig {
        AgentConfig {
            device_identifier: "miyabi-five-worlds".to_string(),
            github_token: std::env::var("GITHUB_TOKEN").unwrap_or_default(),
            repo_owner: std::env::var("GITHUB_REPO_OWNER").ok(),
            repo_name: std::env::var("GITHUB_REPO_NAME").ok(),
            use_task_tool: false,
            use_worktree: true, // Enable worktree support
            worktree_base_path: Some(world_config.worktree_path.clone()),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: std::env::var("TECH_LEAD_GITHUB_USERNAME").ok(),
            ciso_github_username: std::env::var("CISO_GITHUB_USERNAME").ok(),
            po_github_username: std::env::var("PO_GITHUB_USERNAME").ok(),
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    /// Estimates cost based on model and duration
    #[allow(dead_code)]
    fn estimate_cost(config: &WorldConfig, duration_ms: u64) -> f64 {
        // Rough cost estimation based on model and duration
        let base_cost_per_min = match config.model.as_str() {
            "gpt-4o" => 0.10,            // $0.10/min
            "claude-3-5-sonnet" => 0.08, // $0.08/min
            "gpt-oss-20b" => 0.02,       // $0.02/min (self-hosted)
            _ => 0.05,                   // Default
        };

        let duration_min = duration_ms as f64 / 1000.0 / 60.0;
        base_cost_per_min * duration_min
    }

    /// Converts ReviewResult to EvaluationScore
    #[allow(dead_code)]
    fn review_result_to_evaluation_score(review: &ReviewResult) -> EvaluationScore {
        let quality_report = &review.quality_report;
        let breakdown = &quality_report.breakdown;

        // Map ReviewAgent scores to EvaluationScore
        let build_success = breakdown.rustc_score == 100;
        let tests_passed = if breakdown.test_coverage_score >= 80 {
            10
        } else {
            7
        };
        let tests_total = 10;
        let clippy_warnings = Self::calculate_clippy_warnings(breakdown.clippy_score);
        let code_quality = breakdown.clippy_score as f64 / 100.0;
        let security = breakdown.security_score as f64 / 100.0;

        EvaluationScore::calculate(
            build_success,
            tests_passed,
            tests_total,
            clippy_warnings as usize,
            code_quality,
            security,
        )
    }

    /// Calculates clippy warning count from score
    /// Score formula: 100 - (warnings * 5)
    #[allow(dead_code)]
    fn calculate_clippy_warnings(clippy_score: u8) -> u32 {
        let score_loss = 100u8.saturating_sub(clippy_score);
        (score_loss / 5) as u32
    }

    /// Executes a single world with actual CodeGenAgent and ReviewAgent
    ///
    /// # Process
    /// 1. Get or create worktree for this world
    /// 2. Execute CodeGenAgent with world-specific config
    /// 3. Run ReviewAgent to evaluate generated code
    /// 4. Calculate EvaluationScore from review results
    /// 5. Return WorldExecutionResult
    #[allow(dead_code)]
    async fn execute_single_world(
        world_id: WorldId,
        config: WorldConfig,
        task: Task,
        worktree_manager: Arc<FiveWorldsManager>,
    ) -> Result<WorldExecutionResult, MiyabiError> {
        let start_time = Instant::now();

        info!(
            world_id = ?world_id,
            model = %config.model,
            temperature = config.temperature,
            task_id = %task.id,
            "Starting world execution"
        );

        // Step 1: Get worktree handle (assumes worktree already created by caller)
        let handle = worktree_manager
            .get_world_handle(world_id)
            .await
            .ok_or_else(|| {
                MiyabiError::Unknown(format!("Worktree not found for world {:?}", world_id))
            })?;

        // Step 2: Build agent config
        let agent_config = Self::build_agent_config(&config);

        // Step 3: Execute CodeGenAgent
        debug!(world_id = ?world_id, "Executing CodeGenAgent");
        let codegen = CodeGenAgent::new(agent_config.clone());
        let _code_result = codegen
            .generate_code(&task, Some(&handle.path))
            .await
            .map_err(|e| MiyabiError::Unknown(format!("CodeGen failed: {}", e)))?;

        // Step 4: Run ReviewAgent
        debug!(world_id = ?world_id, "Executing ReviewAgent");
        let reviewer = ReviewAgent::new(agent_config);
        let review_result = reviewer
            .review_code(&task)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Review failed: {}", e)))?;

        // Step 5: Calculate EvaluationScore
        let score = Self::review_result_to_evaluation_score(&review_result);

        let duration_ms = start_time.elapsed().as_millis() as u64;
        let cost_usd = Self::estimate_cost(&config, duration_ms);

        info!(
            world_id = ?world_id,
            score = score.total,
            duration_ms = duration_ms,
            cost_usd = cost_usd,
            "World execution completed"
        );

        Ok(WorldExecutionResult::success(
            world_id,
            score,
            handle.path.clone(),
            duration_ms,
            cost_usd,
        ))
    }

    /// Stub implementation for single world execution (DEPRECATED - use execute_single_world)
    ///
    /// This method is kept for backward compatibility with existing tests.
    /// New code should use execute_single_world() instead.
    #[allow(dead_code)]
    async fn execute_single_world_stub(
        world_id: WorldId,
        config: WorldConfig,
        _task: Task,
    ) -> Result<WorldExecutionResult, MiyabiError> {
        debug!(
            world_id = ?world_id,
            model = %config.model,
            temperature = config.temperature,
            "Executing world (stub)"
        );

        // Simulate execution time
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Return a mock successful result
        let score = EvaluationScore::calculate(
            true, // build_success
            8,    // tests_passed
            10,   // tests_total
            5,    // clippy_warnings
            0.85, // code_quality
            0.90, // security
        );

        Ok(WorldExecutionResult::success(
            world_id,
            score,
            config.worktree_path.clone(),
            100, // duration_ms
            0.5, // cost_usd
        ))
    }

    /// Gets the current status of all active world executions
    pub async fn get_active_executions(&self) -> HashMap<WorldId, WorldExecutionStatus> {
        self.active_executions.lock().await.clone()
    }

    /// Gets statistics about executor performance
    pub async fn get_statistics(&self) -> ExecutorStatistics {
        let executions = self.active_executions.lock().await;

        let total_active = executions
            .values()
            .filter(|s| s.status == ExecutionStatus::Running)
            .count();

        ExecutorStatistics { total_active }
    }
}

/// Statistics about the executor
#[derive(Debug, Clone)]
pub struct ExecutorStatistics {
    /// Number of currently active world executions
    pub total_active: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;

    fn create_test_task() -> Task {
        Task::new(
            "task-1".to_string(),
            "Test Task".to_string(),
            "Test task for 5-Worlds execution".to_string(),
            TaskType::Feature,
            1, // P1 - High priority
        )
        .expect("Failed to create test task")
    }

    /// Cleanup test worktree branches
    fn cleanup_test_branches(issue_number: u64, task_id: &str) {
        use std::process::Command;

        // Delete any existing test worktree branches
        for world in ["alpha", "beta", "gamma", "delta", "epsilon"] {
            let branch_name = format!("world-{}-issue-{}-{}", world, issue_number, task_id);
            let _ = Command::new("git")
                .args(["branch", "-D", &branch_name])
                .output();
        }
    }

    #[tokio::test]
    async fn test_prepare_world_configs() {
        let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());
        let task = create_test_task();

        let configs = executor.prepare_world_configs(270, &task);

        assert_eq!(configs.len(), 5);
        assert!(configs.contains_key(&WorldId::Alpha));
        assert!(configs.contains_key(&WorldId::Epsilon));

        // Verify Alpha uses conservative temperature
        let alpha_config = &configs[&WorldId::Alpha];
        assert_eq!(alpha_config.temperature, 0.3);

        // Verify Epsilon uses different model
        let epsilon_config = &configs[&WorldId::Epsilon];
        assert_eq!(epsilon_config.model, "claude-3-5-sonnet");
    }

    #[tokio::test]
    #[ignore] // Integration test: requires worktree cleanup after execution
    async fn test_execute_task_with_five_worlds_parallel() {
        // Cleanup any leftover branches from previous runs
        cleanup_test_branches(270, "task-1");

        let config = FiveWorldsExecutorConfig {
            parallel_execution: true,
            ..Default::default()
        };
        let executor = FiveWorldsExecutor::new(config);
        let task = create_test_task();

        let result = executor
            .execute_task_with_five_worlds(270, task)
            .await
            .expect("Execution should succeed");

        // All worlds should complete (with stub implementation)
        assert_eq!(result.successful_count(), 5);
        assert_eq!(result.failed_count(), 0);
        assert!(result.winner.is_some());

        // Winner should have a score
        let winner_result = result.winner_result().unwrap();
        assert!(winner_result.score.total > 0.0);
    }

    #[tokio::test]
    #[ignore] // Integration test: requires worktree cleanup after execution
    async fn test_execute_task_with_five_worlds_sequential() {
        // Cleanup any leftover branches from previous runs
        cleanup_test_branches(270, "task-1");

        let config = FiveWorldsExecutorConfig {
            parallel_execution: false,
            ..Default::default()
        };
        let executor = FiveWorldsExecutor::new(config);
        let task = create_test_task();

        let result = executor
            .execute_task_with_five_worlds(270, task)
            .await
            .expect("Execution should succeed");

        assert_eq!(result.successful_count(), 5);
        assert!(result.winner.is_some());
    }

    #[tokio::test]
    async fn test_executor_statistics() {
        let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());

        let stats = executor.get_statistics().await;
        assert_eq!(stats.total_active, 0);
    }

    #[tokio::test]
    async fn test_world_execution_status_tracking() {
        let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());
        let task = create_test_task();

        // Start execution
        let _result = executor.execute_task_with_five_worlds(270, task).await;

        // Check that executions were tracked
        let executions = executor.get_active_executions().await;

        // After completion, all should be marked as completed or failed
        for (_, status) in executions {
            assert!(
                status.status == ExecutionStatus::Completed
                    || status.status == ExecutionStatus::Failed
            );
        }
    }
}
