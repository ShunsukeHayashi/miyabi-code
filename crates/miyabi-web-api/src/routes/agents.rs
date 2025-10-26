use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct AgentStatus {
    pub agent_type: String,
    pub status: String,
    pub current_task: Option<String>,
}

#[derive(Serialize)]
pub struct AgentsListResponse {
    pub agents: Vec<AgentStatus>,
}

pub async fn list_agents() -> Json<AgentsListResponse> {
    Json(AgentsListResponse {
        agents: vec![
            AgentStatus {
                agent_type: "CoordinatorAgent".to_string(),
                status: "Idle".to_string(),
                current_task: None,
            },
            AgentStatus {
                agent_type: "CodeGenAgent".to_string(),
                status: "Running".to_string(),
                current_task: Some("Task T1-3".to_string()),
            },
        ],
    })
}

async fn get_agent_status(Path(agent_type): Path<String>) -> Json<AgentStatus> {
    Json(AgentStatus {
        agent_type,
        status: "Idle".to_string(),
        current_task: None,
    })
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
