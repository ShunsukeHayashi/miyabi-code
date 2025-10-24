use axum::{routing::get, Router, Json};
use serde::Serialize;

#[derive(Serialize)]
pub struct PullRequest {
    pub number: u32,
    pub title: String,
    pub state: String,
    pub author: String,
    pub created_at: String,
    pub updated_at: String,
    pub merged_at: Option<String>,
    pub head_branch: String,
    pub base_branch: String,
    pub draft: bool,
    pub mergeable: bool,
    pub commits: u32,
    pub additions: u32,
    pub deletions: u32,
    pub changed_files: u32,
}

#[derive(Serialize)]
pub struct PRsListResponse {
    pub prs: Vec<PullRequest>,
    pub total: u32,
}

async fn list_prs() -> Json<PRsListResponse> {
    Json(PRsListResponse {
        total: 4,
        prs: vec![
            PullRequest {
                number: 145,
                title: "feat(phase-13): complete Phase 13.7-13.8 streaming and CI/CD".to_string(),
                state: "merged".to_string(),
                author: "PRAgent".to_string(),
                created_at: "2025-01-20T10:15:00Z".to_string(),
                updated_at: "2025-01-20T16:30:00Z".to_string(),
                merged_at: Some("2025-01-20T16:30:00Z".to_string()),
                head_branch: "feat/issue-490-phase13-completion".to_string(),
                base_branch: "main".to_string(),
                draft: false,
                mergeable: true,
                commits: 12,
                additions: 1247,
                deletions: 89,
                changed_files: 23,
            },
            PullRequest {
                number: 132,
                title: "fix(miyabi-core): eliminate memory leak in logger.rs using OnceCell".to_string(),
                state: "merged".to_string(),
                author: "CodeGenAgent".to_string(),
                created_at: "2025-01-06T08:20:00Z".to_string(),
                updated_at: "2025-01-06T09:45:00Z".to_string(),
                merged_at: Some("2025-01-06T09:45:00Z".to_string()),
                head_branch: "fix/issue-355-memory-leak".to_string(),
                base_branch: "main".to_string(),
                draft: false,
                mergeable: true,
                commits: 3,
                additions: 45,
                deletions: 12,
                changed_files: 2,
            },
            PullRequest {
                number: 128,
                title: "feat(line-bot): implement LINE Messaging API integration MVP".to_string(),
                state: "merged".to_string(),
                author: "CodeGenAgent".to_string(),
                created_at: "2025-01-18T14:10:00Z".to_string(),
                updated_at: "2025-01-18T17:00:00Z".to_string(),
                merged_at: Some("2025-01-18T17:00:00Z".to_string()),
                head_branch: "feat/issue-431-line-integration".to_string(),
                base_branch: "main".to_string(),
                draft: false,
                mergeable: true,
                commits: 8,
                additions: 523,
                deletions: 34,
                changed_files: 11,
            },
            PullRequest {
                number: 98,
                title: "feat(coordinator): implement DAG decomposition for Issue #270".to_string(),
                state: "open".to_string(),
                author: "CoordinatorAgent".to_string(),
                created_at: "2025-01-15T11:00:00Z".to_string(),
                updated_at: "2025-01-19T15:20:00Z".to_string(),
                merged_at: None,
                head_branch: "feat/issue-270-dag-decomposition".to_string(),
                base_branch: "main".to_string(),
                draft: true,
                mergeable: true,
                commits: 15,
                additions: 892,
                deletions: 156,
                changed_files: 18,
            },
        ],
    })
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_prs))
}
