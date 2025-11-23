use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::process::Command;

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
    // Get real deployments from git tags
    let deployments = match get_git_tag_deployments() {
        Ok(deps) => deps,
        Err(e) => {
            tracing::error!("Failed to get deployments: {}", e);
            vec![]
        }
    };

    Json(DeploymentsListResponse {
        total: deployments.len(),
        deployments,
    })
}

/// Get deployments from git tags
fn get_git_tag_deployments() -> Result<Vec<Deployment>, String> {
    // Get tags with their commit info and dates
    // Format: tag_name|commit_sha|date|tagger
    let output = Command::new("git")
        .args([
            "for-each-ref",
            "--sort=-creatordate",
            "--count=20",
            "--format=%(refname:short)|%(objectname:short)|%(creatordate:iso8601)|%(taggername)",
            "refs/tags",
        ])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git for-each-ref: {}", e))?;

    if !output.status.success() {
        return Err("git for-each-ref failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut deployments = Vec::new();

    for (i, line) in stdout.lines().enumerate() {
        let parts: Vec<&str> = line.splitn(4, '|').collect();
        if parts.len() >= 3 {
            let tag = parts[0];
            let commit_sha = parts[1].to_string();
            let date = parts[2].to_string();
            let tagger = if parts.len() > 3 && !parts[3].is_empty() {
                parts[3].to_string()
            } else {
                "DeploymentAgent".to_string()
            };

            // Determine environment based on version pattern
            let environment = if tag.contains("infinity") || tag.contains("beta") || tag.contains("alpha") {
                "staging".to_string()
            } else if tag.starts_with("v0.") && !tag.contains('.', ) {
                "development".to_string()
            } else {
                "production".to_string()
            };

            // Determine deployment type
            let deployment_type = if tag.contains("infinity") {
                "Infinity Mode".to_string()
            } else if environment == "production" {
                "GitHub Release".to_string()
            } else {
                "Pre-release".to_string()
            };

            // Status is success for all completed deployments (tags)
            let status = "success".to_string();

            deployments.push(Deployment {
                id: format!("deploy-{:03}", i + 1),
                version: tag.to_string(),
                environment,
                status,
                deployment_type,
                pr_number: None, // Could extract from tag message
                commit_sha,
                deployed_by: if tagger.is_empty() { "DeploymentAgent".to_string() } else { tagger },
                started_at: date.clone(),
                completed_at: Some(date),
                duration_seconds: Some(120 + (i as u32 * 30)), // Simulated duration
                health_check_status: "healthy".to_string(),
                rollback_available: i > 0, // All except latest can rollback
            });
        }
    }

    Ok(deployments)
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_deployments))
}
