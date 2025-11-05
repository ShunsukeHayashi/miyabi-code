//! Core traits and utilities for Miyabi agents
//!
//! This crate provides the foundational `BaseAgent` trait that all agents implement,
//! along with common utilities for agent orchestration and lifecycle management.

pub mod auto_index_hook;
pub mod base;
pub mod hooks;
pub mod observable;
pub mod orchestration;
pub mod prompt_enhancement;
// TODO: Re-enable after miyabi_core::rules is implemented
// pub mod rules_context;

pub use auto_index_hook::AutoIndexHook;
pub use base::BaseAgent;
pub use hooks::{AgentHook, AuditLogHook, EnvironmentCheckHook, HookedAgent, MetricsHook};
pub use observable::{LogEntry, LogLevel, ObservableAgent, ProgressObserver, ProgressUpdate};
pub use orchestration::{Orchestrated, OrchestrationEngine};
pub use prompt_enhancement::{AgentPromptEnhancer, PromptEnhancementConfig, PromptTemplate};
// pub use rules_context::RulesContext;
