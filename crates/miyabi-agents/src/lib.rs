//! Miyabi Agents - Autonomous AI agents
//!
//! **DEPRECATED**: This crate has been split into specialized crates for better compilation performance and modularity.
//!
//! # Migration Guide
//!
//! This crate now serves as a facade that re-exports from the specialized crates below.
//! For better compilation performance, migrate to using the specialized crates directly:
//!
//! ## New Crate Structure
//!
//! ### `miyabi-agent-coordinator` - Task Orchestration
//! ```toml
//! [dependencies]
//! miyabi-agent-coordinator = "0.1.0"
//! ```
//! - `CoordinatorAgent`: Task decomposition & DAG construction
//! - `CoordinatorAgentWithLLM`: LLM-enhanced coordinator
//! - `ParallelExecutor`: Parallel task execution
//!
//! ### `miyabi-agent-codegen` - Code Generation
//! ```toml
//! [dependencies]
//! miyabi-agent-codegen = "0.1.0"
//! ```
//! - `CodeGenAgent`: AI-driven code generation
//!
//! ### `miyabi-agent-review` - Code Review
//! ```toml
//! [dependencies]
//! miyabi-agent-review = "0.1.0"
//! ```
//! - `ReviewAgent`: Quality scoring & security scanning
//!
//! ### `miyabi-agent-workflow` - GitHub Workflow Automation
//! ```toml
//! [dependencies]
//! miyabi-agent-workflow = "0.1.0"
//! ```
//! - `PRAgent`: Pull Request creation
//! - `IssueAgent`: Issue analysis & labeling
//! - `DeploymentAgent`: CI/CD deployment
//!
//! ### `miyabi-agent-business` - Business Strategy Agents
//! ```toml
//! [dependencies]
//! miyabi-agent-business = "0.1.0"
//! ```
//! - 14 specialized business agents (AIEntrepreneurAgent, etc.)
//!
//! ### `miyabi-agent-integrations` - External Integrations
//! ```toml
//! [dependencies]
//! miyabi-agent-integrations = "0.1.0"
//! ```
//! - `DiscordCommunityAgent`, `PotpieIntegration`, `RefresherAgent`
//!
//! # Benefits of Migration
//!
//! - **50%+ faster compilation**: Each crate compiles independently
//! - **Better IDE performance**: Smaller crates = faster analysis
//! - **Improved modularity**: Only depend on what you need
//! - **Parallel compilation**: Multiple crates build concurrently
//!
//! # Example Migration
//!
//! **Before**:
//! ```rust,no_run
//! use miyabi_agents::CoordinatorAgent;
//! ```
//!
//! **After**:
//! ```rust,no_run
//! use miyabi_agent_coordinator::CoordinatorAgent;
//! ```

#![deprecated(
    since = "0.2.0",
    note = "Split into specialized crates for better performance. Use miyabi-agent-* crates directly."
)]

// Re-export from miyabi-agent-core (already extracted)
pub use miyabi_agent_core::{
    AgentHook, AuditLogHook, BaseAgent, EnvironmentCheckHook, HookedAgent, MetricsHook, Orchestrated,
    OrchestrationEngine,
};

// Local modules
pub mod business;
pub mod config;
pub mod hooks;
pub use hooks::StructuredLogHook;

// Re-export config types
pub use config::{
    AgentConfig, AgentConfigManager, AgentDependencies, AgentInfo, AgentMetadata, AgentType, SkillConfig,
};

// Re-export from specialized agent crates
pub use miyabi_agent_coordinator::{CoordinatorAgent, CoordinatorAgentWithLLM, ParallelExecutor, TaskDecomposition};

pub use miyabi_agent_codegen::CodeGenAgent;

pub use miyabi_agent_review::ReviewAgent;

pub use miyabi_agent_workflow::{DeploymentAgent, IssueAgent, PRAgent};

pub use miyabi_agent_business::{
    AIEntrepreneurAgent, AnalyticsAgent, CRMAgent, ContentCreationAgent, FunnelDesignAgent, MarketResearchAgent,
    MarketingAgent, PersonaAgent, ProductConceptAgent, ProductDesignAgent, SNSStrategyAgent, SalesAgent,
    SelfAnalysisAgent, YouTubeAgent,
};

pub use miyabi_agent_integrations::{DiscordCommunityAgent, PotpieIntegration, RefresherAgent};
