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

/// Enhanced agent metadata
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
    pub agents: Vec<AgentMetadata>,
}

/// List all available agents with metadata
pub async fn list_agents() -> Json<AgentsListResponse> {
    let agents = get_agent_metadata();
    Json(AgentsListResponse { agents })
}

/// Get comprehensive agent metadata
///
/// This function returns metadata for all 21 Miyabi agents (7 Coding + 14 Business)
/// Data is currently hardcoded based on agent specifications in .claude/agents/specs/
///
/// Future enhancements:
/// - Load from agent spec files dynamically
/// - Integrate with runtime state tracking
/// - Add tmux pane mapping via collector
fn get_agent_metadata() -> Vec<AgentMetadata> {
    vec![
        // Coding Agents (7)
        AgentMetadata {
            name: "CoordinatorAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "task_planning".to_string(),
                "dag_scheduling".to_string(),
                "parallel_execution".to_string(),
                "worktree_management".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "CodeGenAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "code_generation".to_string(),
                "implementation".to_string(),
                "testing".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "ReviewAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "code_review".to_string(),
                "quality_check".to_string(),
                "security_audit".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "IssueAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "issue_creation".to_string(),
                "label_inference".to_string(),
                "task_breakdown".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "PRAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "pull_request_creation".to_string(),
                "description_generation".to_string(),
                "auto_merge".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "DeploymentAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "deployment".to_string(),
                "ci_cd".to_string(),
                "rollback".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "RefresherAgent".to_string(),
            agent_type: AgentType::Coding,
            status: "idle".to_string(),
            capabilities: vec![
                "dependency_updates".to_string(),
                "security_patches".to_string(),
                "version_management".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        // Business Agents (14)
        AgentMetadata {
            name: "AIEntrepreneurAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "business_planning".to_string(),
                "strategy_formulation".to_string(),
                "market_analysis".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "ProductConceptAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "product_ideation".to_string(),
                "concept_development".to_string(),
                "value_proposition".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "ProductDesignAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "product_design".to_string(),
                "ux_design".to_string(),
                "prototype_creation".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "FunnelDesignAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "funnel_design".to_string(),
                "conversion_optimization".to_string(),
                "customer_journey".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "PersonaAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "persona_creation".to_string(),
                "customer_profiling".to_string(),
                "segmentation".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "SelfAnalysisAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "swot_analysis".to_string(),
                "capability_assessment".to_string(),
                "gap_analysis".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "MarketResearchAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "market_research".to_string(),
                "competitor_analysis".to_string(),
                "trend_analysis".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "MarketingAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "marketing_strategy".to_string(),
                "campaign_planning".to_string(),
                "channel_optimization".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "ContentCreationAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "content_creation".to_string(),
                "blog_writing".to_string(),
                "copywriting".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "SNSStrategyAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "social_media_strategy".to_string(),
                "content_calendar".to_string(),
                "engagement_optimization".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "YouTubeAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "youtube_strategy".to_string(),
                "video_planning".to_string(),
                "channel_optimization".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "SalesAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "sales_strategy".to_string(),
                "lead_generation".to_string(),
                "conversion_optimization".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "CRMAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "customer_management".to_string(),
                "relationship_building".to_string(),
                "retention_strategy".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
        AgentMetadata {
            name: "AnalyticsAgent".to_string(),
            agent_type: AgentType::Business,
            status: "idle".to_string(),
            capabilities: vec![
                "data_analysis".to_string(),
                "kpi_tracking".to_string(),
                "reporting".to_string(),
            ],
            current_task: None,
            tmux_pane: None,
        },
    ]
}

/// Get status for a specific agent by name
async fn get_agent_status(Path(agent_name): Path<String>) -> Json<Option<AgentMetadata>> {
    let agents = get_agent_metadata();
    let agent = agents.into_iter().find(|a| a.name == agent_name);
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

pub fn routes() -> Router {
    Router::new()
        .route("/", get(list_agents))
        .route("/:agent_type", get(get_agent_status))
        .route("/:agent_type/execute", post(execute_agent))
}
