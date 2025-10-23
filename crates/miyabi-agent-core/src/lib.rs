//! Core traits and utilities for Miyabi agents
//!
//! This crate provides the foundational `BaseAgent` trait that all agents implement,
//! along with common utilities for agent orchestration and lifecycle management.

pub mod base;
pub mod hooks;
pub mod orchestration;
pub mod rules_context;

pub use base::BaseAgent;
pub use hooks::{AgentHook, AuditLogHook, EnvironmentCheckHook, HookedAgent, MetricsHook};
pub use orchestration::{Orchestrated, OrchestrationEngine};
pub use rules_context::RulesContext;
