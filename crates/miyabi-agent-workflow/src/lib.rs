//! Miyabi Workflow Agents
//!
//! GitHub workflow automation: PR creation, Issue analysis, and Deployment.
//!
//! # Components
//!
//! - **PRAgent**: Creates Pull Requests with Conventional Commits
//! - **IssueAgent**: Analyzes Issues and assigns Labels
//! - **DeploymentAgent**: Automates CI/CD deployments
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_workflow::{PRAgent, IssueAgent, DeploymentAgent};
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//!
//! // Create PR
//! let pr_agent = PRAgent::new(config.clone());
//! let task = Task::default(); // Your task here
//! let result = pr_agent.execute(&task).await?;
//!
//! println!("Created PR: {}", result.data);
//! # Ok(())
//! # }
//! ```

pub mod pr;
pub mod issue;
pub mod deployment;

pub use pr::PRAgent;
pub use issue::IssueAgent;
pub use deployment::DeploymentAgent;
