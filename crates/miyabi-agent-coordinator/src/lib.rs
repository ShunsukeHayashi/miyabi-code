//! Miyabi Coordinator Agent
//!
//! Task decomposition, DAG construction, and parallel execution orchestration.
//!
//! # Components
//!
//! - **CoordinatorAgent**: Breaks down Issues into executable Tasks
//! - **CoordinatorAgentWithLLM**: LLM-enhanced task decomposition
//! - **ParallelExecutor**: Manages parallel task execution
//!
//! # Features
//!
//! ## Basic Task Decomposition
//!
//! ```rust,ignore
//! use miyabi_agent_coordinator::CoordinatorAgent;
//! use miyabi_types::{AgentConfig, Issue};
//!
//! # async fn example() {
//! let config = AgentConfig { /* config fields */ };
//! let coordinator = CoordinatorAgent::new(config);
//!
//! let issue = Issue { /* issue fields */ };
//! let decomposition = coordinator.decompose_issue(&issue).await;
//!
//! println!("Created {} tasks", decomposition.tasks.len());
//! # }
//! ```
//!
//! ## Workflow DSL Integration (with `workflow_dsl` feature)
//!
//! Execute workflows defined with `miyabi-workflow` DSL:
//!
//! ```rust,ignore
//! use miyabi_agent_coordinator::CoordinatorAgent;
//! use miyabi_workflow::{WorkflowBuilder, Condition};
//! use miyabi_types::agent::AgentType;
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let coordinator = CoordinatorAgent::new(config);
//!
//! // Define workflow with conditional branching
//! let workflow = WorkflowBuilder::new("deployment-pipeline")
//!     .step("analyze", AgentType::IssueAgent)
//!     .then("test", AgentType::CodeGenAgent)
//!     .branch_on("quality-gate", vec![
//!         ("high", Condition::FieldGreaterThan {
//!             field: "quality_score".into(),
//!             value: 0.9
//!         }, "deploy"),
//!         ("low", Condition::Always, "review"),
//!     ])
//!     .step("deploy", AgentType::DeploymentAgent)
//!     .step("review", AgentType::ReviewAgent);
//!
//! // Execute with state tracking
//! let execution_state = coordinator
//!     .execute_workflow(&workflow, Some("./data/workflow-state"))
//!     .await?;
//!
//! println!("Workflow status: {:?}", execution_state.status);
//! # Ok(())
//! # }
//! ```
//!
//! ### Conditional Branching
//!
//! The CoordinatorAgent supports conditional workflow execution:
//!
//! - **`.branch(name, pass_step, fail_step)`** - Simple pass/fail branching
//! - **`.branch_on(name, branches)`** - Custom conditions with multiple paths
//!
//! Conditions are evaluated against step results, and only the chosen branch
//! is executed. Alternative paths are automatically skipped.

pub mod coordinator;
pub mod coordinator_with_llm;
pub mod parallel;

pub use coordinator::CoordinatorAgent;
pub use coordinator_with_llm::CoordinatorAgentWithLLM;
pub use parallel::ParallelExecutor;

// Re-export TaskDecomposition from miyabi-types for convenience
pub use miyabi_types::task::TaskDecomposition;
