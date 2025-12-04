//! Core traits and utilities for Miyabi agents
//!
//! This crate provides the foundational `BaseAgent` trait that all agents implement,
//! along with common utilities for agent orchestration and lifecycle management.

pub mod a2a_integration;
pub mod auto_index_hook;
pub mod base;
pub mod config;
pub mod hooks;
pub mod metrics;
pub mod observable;
pub mod orchestration;
pub mod persistence;
pub mod prompt_enhancement;
pub mod sandbox;
pub mod checkpoint;
pub mod subagent;
pub mod tmux_integration;
pub mod mcp_server;
pub mod checkpoint_storage;
// TODO: Re-enable after miyabi_core::rules is implemented
// pub mod rules_context;

pub use a2a_integration::{
    A2AAgentCard, A2AArtifact, A2AEnabled, A2AGatewayClient, A2AIntegrationError, A2ATask, A2ATaskResult,
    AgentCapability, AgentCardBuilder, NativeTool, NativeToolResult,
};
// Re-export core tool types for convenience
pub use auto_index_hook::AutoIndexHook;
pub use base::BaseAgent;
pub use config::{
    load_agents_config, load_config, load_core_config, load_credentials_config, load_runtime_config, AgentsConfig,
    AllConfig, ConfigLoader, CredentialsConfig, MiyabiConfig, RuntimeConfig,
};
pub use hooks::{AgentHook, AuditLogHook, EnvironmentCheckHook, HookedAgent, MetricsHook};
pub use metrics::{AgentCounters, CloudWatchMetricsHook, MetricsConfig, MetricsRegistry, MetricsSummary};
pub use miyabi_core::tools::{ToolRegistry, ToolResult as CoreToolResult};
pub use miyabi_core::ExecutionMode;
pub use observable::{LogEntry, LogLevel, ObservableAgent, ProgressObserver, ProgressUpdate};
pub use orchestration::{Orchestrated, OrchestrationEngine};
pub use persistence::{BusinessAnalytics, ExecutionMetadata, ExecutionStatus, PersistableAgent, PersistableResult};
pub use sandbox::{SandboxConfig, SandboxManager, SandboxContext, PermissionLevel, NetworkPolicy, FilesystemPolicy, ResourceLimits, AuditEntry};
pub use prompt_enhancement::{AgentPromptEnhancer, PromptEnhancementConfig, PromptTemplate};
// pub use rules_context::RulesContext;
pub mod miyabi_adapter;
pub use miyabi_adapter::{
    MiyabiAgentType, MiyabiAgentConfig, MiyabiAgentAdapter, 
    AgentCategory, SandboxSettings, CheckpointSettings,
    RunningAgent, AgentStatus, AdapterError
};
pub mod mcp_claude_code;
pub use mcp_claude_code::{ClaudeCodeMcpServer, ServerCapabilities};
pub mod benchmark;
pub use benchmark::{BenchmarkResult, ProductionTestSuite, TestSummary, ParallelExecutionTest, HealthCheck, HealthStatus, SystemHealthReport};
