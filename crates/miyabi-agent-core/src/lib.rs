//! Core traits and utilities for Miyabi agents
//!
//! This crate provides the foundational `BaseAgent` trait that all agents implement,
//! along with common utilities for agent orchestration and lifecycle management.

pub mod base;
pub mod hooks;
pub mod orchestration;

pub use base::BaseAgent;
pub use hooks::{AgentHook, HookedAgent};
pub use orchestration::{OrchestrationEngine, Orchestrated};
