use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
pub struct Worktree {
    pub id: String,
    pub path: String,
    pub branch: String,
    pub status: String,
    pub issue_number: Option<u32>,
    pub agent_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct WorktreesListResponse {
    pub worktrees: Vec<Worktree>,
    pub total: usize,
}

pub async fn list_worktrees() -> Json<WorktreesListResponse> {
    // Mock data - In production, this comes from miyabi-worktree crate
    let worktrees = vec![
        Worktree {
            id: "wt-001".to_string(),
            path: "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-490".to_string(),
            branch: "feat/issue-490-phase13-completion".to_string(),
            status: "Active".to_string(),
            issue_number: Some(490),
            agent_type: Some("CoordinatorAgent".to_string()),
            created_at: "2025-01-15T10:30:00Z".to_string(),
            updated_at: "2025-01-20T14:22:00Z".to_string(),
        },
        Worktree {
            id: "wt-002".to_string(),
            path: "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-431".to_string(),
            branch: "feat/line-bot-integration".to_string(),
            status: "Completed".to_string(),
            issue_number: Some(431),
            agent_type: Some("CodeGenAgent".to_string()),
            created_at: "2025-01-12T08:15:00Z".to_string(),
            updated_at: "2025-01-18T16:45:00Z".to_string(),
        },
        Worktree {
            id: "wt-003".to_string(),
            path: "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-355".to_string(),
            branch: "fix/memory-leak-logger".to_string(),
            status: "Idle".to_string(),
            issue_number: Some(355),
            agent_type: Some("ReviewAgent".to_string()),
            created_at: "2025-01-10T14:20:00Z".to_string(),
            updated_at: "2025-01-19T11:30:00Z".to_string(),
        },
        Worktree {
            id: "wt-004".to_string(),
            path: "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-270".to_string(),
            branch: "feat/implement-feature-x".to_string(),
            status: "Active".to_string(),
            issue_number: Some(270),
            agent_type: Some("PRAgent".to_string()),
            created_at: "2025-01-08T09:00:00Z".to_string(),
            updated_at: "2025-01-20T15:10:00Z".to_string(),
        },
        Worktree {
            id: "wt-005".to_string(),
            path: "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-164".to_string(),
            branch: "feat/windows-support".to_string(),
            status: "Error".to_string(),
            issue_number: Some(164),
            agent_type: Some("DeploymentAgent".to_string()),
            created_at: "2025-01-05T13:45:00Z".to_string(),
            updated_at: "2025-01-20T10:20:00Z".to_string(),
        },
    ];

    Json(WorktreesListResponse {
        total: worktrees.len(),
        worktrees,
    })
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_worktrees))
}
