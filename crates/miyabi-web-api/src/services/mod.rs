//! Service layer modules
//!
//! This module provides the service layer for the Miyabi Web API.
//! Issue: #983 Phase 2.1 - Service Layer Refactoring
//! Issue: #1173 - Business Agent Persistence Integration

pub mod agent_executor;
pub mod business_agent_service;
pub mod coordinator_service;
pub mod dashboard_service;
pub mod log_streamer;
pub mod rbac_service;
pub mod repository_service;
pub mod task_service;
pub mod worker_service;
pub mod workflow_service;

pub use agent_executor::AgentExecutor;
pub use business_agent_service::{
    AgentTypeSummary, AnalyticsData, BusinessAgentAnalytics, BusinessAgentExecution,
    BusinessAgentService, CompleteExecutionRequest, CreateExecutionRequest,
};
pub use coordinator_service::CoordinatorService;
pub use dashboard_service::{
    DashboardService, DashboardSummary, SystemHealth, TaskStats, WorkerStats,
};
pub use log_streamer::{LogEntry, LogStreamer, LogStreamingManager};
pub use rbac_service::RbacService;
pub use repository_service::{
    CreateRepositoryRequest, Repository, RepositoryFilter, RepositoryService,
};
pub use task_service::TaskService;
pub use worker_service::WorkerService;
pub use workflow_service::{
    StartWorkflowRequest, WorkflowExecution, WorkflowFilter, WorkflowService,
};
