use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use miyabi_worktree::{PoolConfig, TaskStatus, WorktreePool, WorktreeTask};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};

/// Agent type classification
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum AgentType {
    Coding,
    Business,
}

/// Agent metrics
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentMetrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub task_completion_rate: f64,
    pub average_task_duration: f64,
}

/// Agent config
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub max_concurrent_tasks: u32,
    pub timeout_seconds: u32,
    pub retry_attempts: u32,
    pub enable_logging: bool,
}

/// Agent tasks
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentTasks {
    pub active: u32,
    pub completed: u32,
}

/// Agent data matching frontend expectations
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub layer: u32,
    pub status: String,
    pub uptime: u64,
    pub tasks: AgentTasks,
    pub metrics: AgentMetrics,
    pub config: AgentConfig,
}

/// Enhanced agent metadata (internal use)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentMetadata {
    pub name: String,
    #[serde(rename = "type")]
    pub agent_type: AgentType,
    pub status: String,
    pub capabilities: Vec<String>,
    pub current_task: Option<String>,
    /// TODO: integrate with tmux collector to get real pane mappings
    pub tmux_pane: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct AgentsListResponse {
    pub agents: Vec<Agent>,
}

/// List all available agents with metadata
pub async fn list_agents() -> Json<AgentsListResponse> {
    let agents = get_agents();
    Json(AgentsListResponse { agents })
}

/// Helper to create default metrics
fn default_metrics() -> AgentMetrics {
    AgentMetrics {
        cpu_usage: 0.0,
        memory_usage: 0.0,
        task_completion_rate: 100.0,
        average_task_duration: 0.0,
    }
}

/// Helper to create default config
fn default_config() -> AgentConfig {
    AgentConfig {
        max_concurrent_tasks: 5,
        timeout_seconds: 300,
        retry_attempts: 3,
        enable_logging: true,
    }
}

/// Helper to create default tasks
fn default_tasks() -> AgentTasks {
    AgentTasks {
        active: 0,
        completed: 0,
    }
}

/// Get all agents with full data matching frontend expectations
///
/// Layer mapping:
/// - Layer 3: Coordinators (CoordinatorAgent)
/// - Layer 4: Workers (all other Coding agents + Business agents)
fn get_agents() -> Vec<Agent> {
    vec![
        // Coding Agents (7)
        Agent {
            id: "coordinator-agent".to_string(),
            name: "CoordinatorAgent".to_string(),
            layer: 3, // Coordinator layer
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "codegen-agent".to_string(),
            name: "CodeGenAgent".to_string(),
            layer: 4, // Worker layer
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "review-agent".to_string(),
            name: "ReviewAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "issue-agent".to_string(),
            name: "IssueAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "pr-agent".to_string(),
            name: "PRAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "deployment-agent".to_string(),
            name: "DeploymentAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "refresher-agent".to_string(),
            name: "RefresherAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        // Business Agents (14)
        Agent {
            id: "ai-entrepreneur-agent".to_string(),
            name: "AIEntrepreneurAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "product-concept-agent".to_string(),
            name: "ProductConceptAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "product-design-agent".to_string(),
            name: "ProductDesignAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "funnel-design-agent".to_string(),
            name: "FunnelDesignAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "persona-agent".to_string(),
            name: "PersonaAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "self-analysis-agent".to_string(),
            name: "SelfAnalysisAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "market-research-agent".to_string(),
            name: "MarketResearchAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "marketing-agent".to_string(),
            name: "MarketingAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "content-creation-agent".to_string(),
            name: "ContentCreationAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "sns-strategy-agent".to_string(),
            name: "SNSStrategyAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "youtube-agent".to_string(),
            name: "YouTubeAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "sales-agent".to_string(),
            name: "SalesAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "crm-agent".to_string(),
            name: "CRMAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
        Agent {
            id: "analytics-agent".to_string(),
            name: "AnalyticsAgent".to_string(),
            layer: 4,
            status: "idle".to_string(),
            uptime: 0,
            tasks: default_tasks(),
            metrics: default_metrics(),
            config: default_config(),
        },
    ]
}

/// Get status for a specific agent by name
async fn get_agent_status(Path(agent_name): Path<String>) -> Json<Option<Agent>> {
    let agents = get_agents();
    let agent = agents
        .into_iter()
        .find(|a| a.name == agent_name || a.id == agent_name);
    Json(agent)
}

#[derive(Deserialize)]
pub struct ExecuteAgentRequest {
    pub issue_number: Option<u32>,
    pub task_id: Option<String>,
}

#[derive(Serialize)]
pub struct ExecuteAgentResponse {
    pub success: bool,
    pub message: String,
}

pub async fn execute_agent(
    Path(agent_type): Path<String>,
    Json(_payload): Json<ExecuteAgentRequest>,
) -> Json<ExecuteAgentResponse> {
    Json(ExecuteAgentResponse {
        success: true,
        message: format!("Started {} execution", agent_type),
    })
}

// ============================================================================
// Parallel Execution API (#1174)
// ============================================================================

/// Shared state for parallel execution
pub struct ParallelExecutionState {
    pub pool: Option<Arc<WorktreePool>>,
    pub active_executions: RwLock<Vec<ParallelExecutionStatus>>,
}

impl ParallelExecutionState {
    pub fn new() -> Self {
        let pool = match WorktreePool::new(
            PoolConfig {
                max_concurrency: 3,
                timeout_seconds: 1800,
                fail_fast: false,
                auto_cleanup: true,
            },
            None,
        ) {
            Ok(p) => Some(Arc::new(p)),
            Err(e) => {
                error!("Failed to initialize WorktreePool: {}", e);
                None
            }
        };

        Self {
            pool,
            active_executions: RwLock::new(Vec::new()),
        }
    }
}

impl Default for ParallelExecutionState {
    fn default() -> Self {
        Self::new()
    }
}

/// Request for parallel agent execution
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelExecuteRequest {
    /// List of issues to process in parallel
    pub issues: Vec<ParallelIssueTask>,
    /// Maximum concurrency (default: 3)
    pub max_concurrency: Option<usize>,
    /// Whether to fail fast on first error
    pub fail_fast: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelIssueTask {
    pub issue_number: u64,
    pub agent_type: String,
    pub description: Option<String>,
}

/// Response for parallel execution
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelExecuteResponse {
    pub execution_id: String,
    pub status: String,
    pub tasks_queued: usize,
    pub message: String,
}

/// Status of a parallel execution
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelExecutionStatus {
    pub execution_id: String,
    pub status: String,
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub failed_tasks: usize,
    pub results: Vec<ParallelTaskResult>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelTaskResult {
    pub issue_number: u64,
    pub agent_type: String,
    pub status: String,
    pub duration_ms: u64,
    pub error: Option<String>,
}

/// Execute multiple agents in parallel using worktrees
pub async fn execute_parallel(
    State(state): State<Arc<ParallelExecutionState>>,
    Json(request): Json<ParallelExecuteRequest>,
) -> Json<ParallelExecuteResponse> {
    let execution_id = uuid::Uuid::new_v4().to_string();
    let task_count = request.issues.len();

    info!(
        "Starting parallel execution {} with {} tasks",
        execution_id, task_count
    );

    // Check if pool is available
    let pool = match state.pool.clone() {
        Some(p) => p,
        None => {
            return Json(ParallelExecuteResponse {
                execution_id,
                status: "error".to_string(),
                tasks_queued: 0,
                message: "WorktreePool not initialized".to_string(),
            });
        }
    };

    // Convert request to WorktreeTasks
    let tasks: Vec<WorktreeTask> = request
        .issues
        .iter()
        .map(|issue| WorktreeTask {
            issue_number: issue.issue_number,
            description: issue
                .description
                .clone()
                .unwrap_or_else(|| format!("Issue #{}", issue.issue_number)),
            agent_type: Some(issue.agent_type.clone()),
            metadata: None,
        })
        .collect();

    // Create initial status
    let status = ParallelExecutionStatus {
        execution_id: execution_id.clone(),
        status: "running".to_string(),
        total_tasks: task_count,
        completed_tasks: 0,
        failed_tasks: 0,
        results: Vec::new(),
    };

    // Store status
    {
        let mut executions = state.active_executions.write().await;
        executions.push(status);
    }

    // Spawn background task for execution
    let state_clone = state.clone();
    let execution_id_clone = execution_id.clone();
    tokio::spawn(async move {
        let result = pool
            .execute_parallel(tasks, |worktree_info, task| async move {
                info!(
                    "Executing task for issue #{} in worktree {}",
                    task.issue_number, worktree_info.path.display()
                );
                // For now, just return success
                // TODO: Actually execute the agent via Claude Code or similar
                Ok(serde_json::json!({
                    "issue_number": task.issue_number,
                    "worktree_path": worktree_info.path.to_string_lossy(),
                    "agent_type": task.agent_type,
                }))
            })
            .await;

        // Update status with results
        let mut executions = state_clone.active_executions.write().await;
        if let Some(status) = executions
            .iter_mut()
            .find(|s| s.execution_id == execution_id_clone)
        {
            status.status = "completed".to_string();
            status.completed_tasks = result
                .results
                .iter()
                .filter(|r| r.status == TaskStatus::Success)
                .count();
            status.failed_tasks = result
                .results
                .iter()
                .filter(|r| r.status == TaskStatus::Failed)
                .count();
            status.results = result
                .results
                .iter()
                .map(|r| ParallelTaskResult {
                    issue_number: r.issue_number,
                    agent_type: "unknown".to_string(), // TODO: preserve from request
                    status: format!("{:?}", r.status),
                    duration_ms: r.duration_ms,
                    error: r.error.clone(),
                })
                .collect();
        }

        info!(
            "Parallel execution {} completed: {} success, {} failed",
            execution_id_clone,
            result
                .results
                .iter()
                .filter(|r| r.status == TaskStatus::Success)
                .count(),
            result
                .results
                .iter()
                .filter(|r| r.status == TaskStatus::Failed)
                .count()
        );
    });

    Json(ParallelExecuteResponse {
        execution_id,
        status: "started".to_string(),
        tasks_queued: task_count,
        message: format!("Parallel execution started with {} tasks", task_count),
    })
}

/// Get status of a parallel execution
pub async fn get_execution_status(
    State(state): State<Arc<ParallelExecutionState>>,
    Path(execution_id): Path<String>,
) -> Json<Option<ParallelExecutionStatus>> {
    let executions = state.active_executions.read().await;
    let status = executions
        .iter()
        .find(|s| s.execution_id == execution_id)
        .cloned();
    Json(status)
}

/// List all active/recent parallel executions
pub async fn list_executions(
    State(state): State<Arc<ParallelExecutionState>>,
) -> Json<Vec<ParallelExecutionStatus>> {
    let executions = state.active_executions.read().await;
    Json(executions.clone())
}

// ============================================================================
// Worker/Coordinator Status API (Phase 2.2)
// ============================================================================

/// Worker status response
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerStatusResponse {
    pub workers: Vec<Agent>,
    pub total_count: usize,
    pub active_count: usize,
    pub idle_count: usize,
}

/// Coordinator status response
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoordinatorStatusResponse {
    pub coordinators: Vec<Agent>,
    pub total_count: usize,
    pub active_count: usize,
}

/// System overview response
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemOverviewResponse {
    pub total_agents: usize,
    pub workers: WorkerSummary,
    pub coordinators: CoordinatorSummary,
    pub coding_agents: AgentCategorySummary,
    pub business_agents: AgentCategorySummary,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerSummary {
    pub total: usize,
    pub active: usize,
    pub idle: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoordinatorSummary {
    pub total: usize,
    pub active: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentCategorySummary {
    pub total: usize,
    pub active: usize,
    pub names: Vec<String>,
}

/// Get all workers (Layer 4 agents)
pub async fn list_workers() -> Json<WorkerStatusResponse> {
    let agents = get_agents();
    let workers: Vec<Agent> = agents.into_iter().filter(|a| a.layer == 4).collect();

    let total_count = workers.len();
    let active_count = workers
        .iter()
        .filter(|w| w.status == "running" || w.status == "busy")
        .count();
    let idle_count = total_count - active_count;

    Json(WorkerStatusResponse {
        workers,
        total_count,
        active_count,
        idle_count,
    })
}

/// Get all coordinators (Layer 3 agents)
pub async fn list_coordinators() -> Json<CoordinatorStatusResponse> {
    let agents = get_agents();
    let coordinators: Vec<Agent> = agents.into_iter().filter(|a| a.layer == 3).collect();

    let total_count = coordinators.len();
    let active_count = coordinators
        .iter()
        .filter(|c| c.status == "running" || c.status == "busy")
        .count();

    Json(CoordinatorStatusResponse {
        coordinators,
        total_count,
        active_count,
    })
}

/// Get system overview
pub async fn get_system_overview() -> Json<SystemOverviewResponse> {
    let agents = get_agents();

    let workers: Vec<&Agent> = agents.iter().filter(|a| a.layer == 4).collect();
    let coordinators: Vec<&Agent> = agents.iter().filter(|a| a.layer == 3).collect();

    // Coding agents (7): Coordinator, CodeGen, Review, Issue, PR, Deployment, Refresher
    let coding_names = [
        "CoordinatorAgent",
        "CodeGenAgent",
        "ReviewAgent",
        "IssueAgent",
        "PRAgent",
        "DeploymentAgent",
        "RefresherAgent",
    ];
    let coding_agents: Vec<&Agent> = agents
        .iter()
        .filter(|a| coding_names.contains(&a.name.as_str()))
        .collect();

    // Business agents (14): Everything else
    let business_agents: Vec<&Agent> = agents
        .iter()
        .filter(|a| !coding_names.contains(&a.name.as_str()))
        .collect();

    let workers_active = workers
        .iter()
        .filter(|w| w.status == "running" || w.status == "busy")
        .count();
    let coordinators_active = coordinators
        .iter()
        .filter(|c| c.status == "running" || c.status == "busy")
        .count();
    let coding_active = coding_agents
        .iter()
        .filter(|a| a.status == "running" || a.status == "busy")
        .count();
    let business_active = business_agents
        .iter()
        .filter(|a| a.status == "running" || a.status == "busy")
        .count();

    Json(SystemOverviewResponse {
        total_agents: agents.len(),
        workers: WorkerSummary {
            total: workers.len(),
            active: workers_active,
            idle: workers.len() - workers_active,
        },
        coordinators: CoordinatorSummary {
            total: coordinators.len(),
            active: coordinators_active,
        },
        coding_agents: AgentCategorySummary {
            total: coding_agents.len(),
            active: coding_active,
            names: coding_agents.iter().map(|a| a.name.clone()).collect(),
        },
        business_agents: AgentCategorySummary {
            total: business_agents.len(),
            active: business_active,
            names: business_agents.iter().map(|a| a.name.clone()).collect(),
        },
    })
}

/// Create routes without state (for backward compatibility)
pub fn routes() -> Router {
    routes_with_state(Arc::new(ParallelExecutionState::new()))
}

/// Create routes with shared state for parallel execution
pub fn routes_with_state(state: Arc<ParallelExecutionState>) -> Router {
    Router::new()
        .route("/", get(list_agents))
        .route("/overview", get(get_system_overview))
        .route("/workers", get(list_workers))
        .route("/coordinators", get(list_coordinators))
        .route("/execute-parallel", post(execute_parallel))
        .route("/executions", get(list_executions))
        .route("/executions/{execution_id}", get(get_execution_status))
        .route("/{agent_type}", get(get_agent_status))
        .route("/{agent_type}/execute", post(execute_agent))
        .with_state(state)
}
