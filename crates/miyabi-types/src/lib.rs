//! Miyabi Types - Core type definitions
//!
//! This crate provides all core types for the Miyabi autonomous development platform.
//! It's the Rust equivalent of `packages/coding-agents/types/index.ts`.

pub mod agent;
pub mod error;
pub mod issue;
pub mod quality;
pub mod task;
pub mod workflow;

// Re-export commonly used types
pub use agent::{AgentConfig, AgentMetrics, AgentResult, AgentStatus, AgentType, ImpactLevel};
pub use error::{AgentError, CircularDependencyError, EscalationError, MiyabiError};
pub use issue::{Issue, IssueAnalysis, IssueState, IssueTraceLog};
pub use quality::{QualityIssue, QualityReport};
pub use task::{Task, TaskDecomposition, TaskResult};
pub use workflow::{ExecutionPlan, ExecutionReport, DAG};
