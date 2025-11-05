use axum::Router;

pub mod agents;
pub mod auth;
pub mod codegen;
pub mod dashboard;
pub mod deployments;
pub mod health;
pub mod issues;
pub mod logs;
pub mod mission_control;
pub mod preflight;
pub mod prs;
pub mod repositories;
pub mod tasks;
pub mod telegram;
pub mod timeline;
pub mod tmux;
pub mod websocket;
pub mod workflows;
pub mod worktrees;

pub fn api_routes() -> Router {
    Router::new()
        .nest("/agents", agents::routes())
        .nest("/codegen", codegen::routes())
        .nest("/deployments", deployments::routes())
        .nest("/issues", issues::routes())
        .nest("/logs", logs::routes())
        .nest("/mission-control", mission_control::routes())
        .nest("/preflight", preflight::routes())
        .nest("/prs", prs::routes())
        .nest("/tasks", tasks::routes())
        .nest("/timeline", timeline::routes())
        .nest("/tmux", tmux::routes())
        .nest("/worktrees", worktrees::routes())
}
