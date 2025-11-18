use axum::{routing::get, Router};
use serde::{Deserialize, Serialize};

pub mod status;

pub fn routes() -> Router {
    Router::new()
        .route("/status", get(status::get_infrastructure_status))
        .route("/database", get(status::get_database_status))
        .route("/deployment", get(status::get_deployment_status))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InfrastructureStatus {
    pub ecr_repositories: Vec<EcrRepository>,
    pub docker_containers: Vec<DockerContainer>,
    pub services: Vec<Service>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EcrRepository {
    pub name: String,
    pub image_count: usize,
    pub latest_digest: Option<String>,
    pub latest_tag: Option<String>,
    pub size_mb: f64,
    pub pushed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DockerContainer {
    pub name: String,
    pub status: String,
    pub health: String,
    pub ports: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Service {
    pub name: String,
    pub status: String,
    pub url: Option<String>,
    pub port: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStatus {
    pub connected: bool,
    pub database_name: String,
    pub tables: Vec<TableInfo>,
    pub total_tables: usize,
    pub connection_pool: PoolInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub owner: String,
    pub row_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PoolInfo {
    pub active_connections: u32,
    pub idle_connections: u32,
    pub max_connections: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentStatus {
    pub pipeline_name: String,
    pub current_stage: String,
    pub stages: Vec<DeploymentStage>,
    pub last_deployment: Option<LastDeployment>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentStage {
    pub name: String,
    pub status: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub duration_seconds: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LastDeployment {
    pub version: String,
    pub deployed_at: String,
    pub deployed_by: String,
    pub status: String,
}
