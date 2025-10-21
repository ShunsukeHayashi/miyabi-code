//! API route handlers

use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};

/// Agent data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: u32,
    pub name: String,
    pub role: String,
    pub category: AgentCategory,
    pub status: AgentStatus,
    pub tasks: u32,
    pub color: AgentColor,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentCategory {
    Coding,
    Business,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Active,
    Working,
    Idle,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentColor {
    Leader,
    Executor,
    Analyst,
    Support,
}

/// System status structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub status: String,
    pub active_agents: u32,
    pub total_agents: u32,
    pub active_tasks: u32,
    pub queued_tasks: u32,
    pub task_throughput: f64,
    pub avg_completion_time: f64,
}

/// Health check endpoint
pub async fn health_check() -> (StatusCode, &'static str) {
    (StatusCode::OK, "OK")
}

/// Get all agents endpoint
pub async fn get_agents() -> Json<Vec<Agent>> {
    // Fetch real data from GitHub API
    match crate::http::fetch_real_agents().await {
        Ok(agents) => Json(agents),
        Err(e) => {
            tracing::error!("Failed to fetch real agents: {}", e);
            // Return empty array on error
            Json(vec![])
        }
    }
}

/// Get system status endpoint
pub async fn get_system_status() -> Json<SystemStatus> {
    // Fetch real system status from GitHub API
    match crate::http::fetch_real_system_status().await {
        Ok(status) => Json(status),
        Err(e) => {
            tracing::error!("Failed to fetch real system status: {}", e);
            // Return default status on error
            Json(SystemStatus {
                status: "error".to_string(),
                active_agents: 0,
                total_agents: 21,
                active_tasks: 0,
                queued_tasks: 0,
                task_throughput: 0.0,
                avg_completion_time: 0.0,
            })
        }
    }
}
