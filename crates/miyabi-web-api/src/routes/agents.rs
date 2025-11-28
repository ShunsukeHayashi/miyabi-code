use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

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

pub fn routes() -> Router {
    Router::new()
        .route("/", get(list_agents))
        .route("/overview", get(get_system_overview))
        .route("/workers", get(list_workers))
        .route("/coordinators", get(list_coordinators))
        .route("/{agent_type}", get(get_agent_status))
        .route("/{agent_type}/execute", post(execute_agent))
}
