use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
pub struct Deployment {
    pub id: String,
    pub version: String,
    pub environment: String,
    pub status: String,
    pub deployment_type: String,
    pub pr_number: Option<u32>,
    pub commit_sha: String,
    pub deployed_by: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub duration_seconds: Option<u32>,
    pub health_check_status: String,
    pub rollback_available: bool,
}

#[derive(Serialize)]
pub struct DeploymentsListResponse {
    pub deployments: Vec<Deployment>,
    pub total: usize,
}

pub async fn list_deployments() -> Json<DeploymentsListResponse> {
    // Mock data - In production, this comes from DeploymentAgent
    let deployments = vec![
        Deployment {
            id: "deploy-001".to_string(),
            version: "v2.1.5".to_string(),
            environment: "production".to_string(),
            status: "success".to_string(),
            deployment_type: "Firebase Hosting".to_string(),
            pr_number: Some(145),
            commit_sha: "d5c4630".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-20T15:30:00Z".to_string(),
            completed_at: Some("2025-01-20T15:35:42Z".to_string()),
            duration_seconds: Some(342),
            health_check_status: "healthy".to_string(),
            rollback_available: true,
        },
        Deployment {
            id: "deploy-002".to_string(),
            version: "v2.1.4".to_string(),
            environment: "staging".to_string(),
            status: "success".to_string(),
            deployment_type: "Cloud Run".to_string(),
            pr_number: Some(143),
            commit_sha: "1fb75a0".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-19T10:15:00Z".to_string(),
            completed_at: Some("2025-01-19T10:18:23Z".to_string()),
            duration_seconds: Some(203),
            health_check_status: "healthy".to_string(),
            rollback_available: true,
        },
        Deployment {
            id: "deploy-003".to_string(),
            version: "v2.1.3".to_string(),
            environment: "production".to_string(),
            status: "rolled_back".to_string(),
            deployment_type: "Firebase Hosting".to_string(),
            pr_number: Some(140),
            commit_sha: "b4582e0".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-18T14:00:00Z".to_string(),
            completed_at: Some("2025-01-18T14:10:15Z".to_string()),
            duration_seconds: Some(615),
            health_check_status: "degraded".to_string(),
            rollback_available: false,
        },
        Deployment {
            id: "deploy-004".to_string(),
            version: "v2.1.2".to_string(),
            environment: "development".to_string(),
            status: "in_progress".to_string(),
            deployment_type: "Docker Compose".to_string(),
            pr_number: Some(138),
            commit_sha: "12d085d".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-20T16:00:00Z".to_string(),
            completed_at: None,
            duration_seconds: None,
            health_check_status: "checking".to_string(),
            rollback_available: false,
        },
        Deployment {
            id: "deploy-005".to_string(),
            version: "v2.1.1".to_string(),
            environment: "staging".to_string(),
            status: "failed".to_string(),
            deployment_type: "Cloud Run".to_string(),
            pr_number: Some(135),
            commit_sha: "62de9d2".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-17T09:30:00Z".to_string(),
            completed_at: Some("2025-01-17T09:33:45Z".to_string()),
            duration_seconds: Some(225),
            health_check_status: "failed".to_string(),
            rollback_available: true,
        },
        Deployment {
            id: "deploy-006".to_string(),
            version: "v2.1.0".to_string(),
            environment: "production".to_string(),
            status: "success".to_string(),
            deployment_type: "Firebase Hosting".to_string(),
            pr_number: Some(130),
            commit_sha: "a1b2c3d".to_string(),
            deployed_by: "DeploymentAgent".to_string(),
            started_at: "2025-01-15T12:00:00Z".to_string(),
            completed_at: Some("2025-01-15T12:06:30Z".to_string()),
            duration_seconds: Some(390),
            health_check_status: "healthy".to_string(),
            rollback_available: true,
        },
    ];

    Json(DeploymentsListResponse {
        total: deployments.len(),
        deployments,
    })
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_deployments))
}
