//! Miyabi Scheduler - Session management for headless Claude Code execution
//!
//! This crate provides:
//! - **SessionManager**: Manage multiple headless Claude Code sessions
//! - **Launcher**: Spawn Claude Code processes with proper I/O redirection
//! - **Parser**: Parse execution results and error logs
//! - **Scheduler**: DAG-based dependency resolution and parallel execution
//! - **LoadBalancer**: Intelligent task distribution across machines
//! - **ResultAggregator**: Collect and aggregate multiple session results
//! - **PRCreator**: Create pull requests from aggregated results
//! - **MilestoneUpdater**: Update GitHub Milestones with progress
//!
//! # Example
//!
//! ```no_run
//! use miyabi_scheduler::session::{SessionManager, SessionConfig};
//! use std::path::PathBuf;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create session manager
//!     let mut manager = SessionManager::new(SessionConfig::default());
//!
//!     // Spawn headless session
//!     let session_id = manager.spawn_headless(
//!         "/agent-run --issue 270".to_string(),
//!         PathBuf::from(".worktrees/issue-270"),
//!     ).await?;
//!
//!     // Wait for completion
//!     manager.wait_for_completion(&session_id).await?;
//!
//!     // Collect result
//!     let result = manager.collect_result(&session_id).await?;
//!     println!("Result: success={}, message={}", result.success, result.message);
//!
//!     Ok(())
//! }
//! ```

pub mod aggregator;
pub mod claude_code_executor;
pub mod dag;
pub mod decision;
pub mod dynamic_scaling;
pub mod error;
pub mod feedback;
pub mod five_worlds_executor;
pub mod headless;
pub mod hooks;
pub mod launcher;
pub mod load_balancer;
pub mod milestone_updater;
pub mod notification;
pub mod parser;
pub mod pr_creator;
pub mod quality_checker;
pub mod remote;
pub mod scheduler;
pub mod session;
pub mod skills_bridge;
pub mod ssh;
pub mod state_machine;

// Re-export key types
pub use aggregator::{AggregatedResult, ResultAggregator};
pub use claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig, WorldResult};
pub use dag::{DAGOperations, TaskId};
pub use decision::{Decision, DecisionEngine, DecisionThresholds};
pub use dynamic_scaling::{DynamicScaler, DynamicScalerConfig, ResourceMonitor, ResourceStats};
pub use error::{Result, SchedulerError};
pub use five_worlds_executor::{
    ExecutionStatus, ExecutorStatistics, FiveWorldsExecutor, FiveWorldsExecutorConfig,
    WorldExecutionStatus,
};
pub use headless::{ExecutionResult, HeadlessOrchestrator, HeadlessOrchestratorConfig};
pub use load_balancer::{LoadBalancer, LoadBalancerStats};
pub use milestone_updater::{Milestone, MilestoneConfig, MilestoneState, MilestoneUpdater};
pub use notification::{Notification, NotificationService, NotificationType};
pub use parser::AgentResult;
pub use pr_creator::{PRConfig, PRCreator, PullRequest};
pub use quality_checker::QualityChecker;
pub use remote::RemoteExecutor;
pub use scheduler::{Scheduler, SchedulerStats};
pub use session::{SessionConfig, SessionId, SessionManager, SessionStatus};
pub use skills_bridge::{
    ErrorSeverity, OrchestratorEvent, OrchestratorTrigger, SkillExecutor, SkillRequest,
    SkillResult, SkillsBridge,
};
pub use ssh::{Machine, MachineStatus, SshConfig};
pub use state_machine::{ExecutionState, Phase, StateMachine};
