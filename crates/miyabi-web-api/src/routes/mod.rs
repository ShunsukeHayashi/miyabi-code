use axum::Router;

pub mod activity;
pub mod agents;
pub mod approval;
pub mod auth;
pub mod codegen;
pub mod dashboard;
pub mod database;
pub mod deployments;
pub mod health;
pub mod infrastructure;
pub mod issues;
pub mod logs;
pub mod logs_stream;
pub mod mcp;
pub mod mission_control;
pub mod preflight;
pub mod prs;
pub mod repositories;
pub mod system;
pub mod tasks;
pub mod telegram;
pub mod timeline;
pub mod tmux;
pub mod websocket;
pub mod workflows;
pub mod worktrees;

pub fn api_routes() -> Router {
    Router::new()
        .nest("/activity", activity::routes())
        .nest("/agents", agents::routes())
        .nest("/codegen", codegen::routes())
        .nest("/database", database::routes())
        .nest("/deployments", deployments::routes())
        .nest("/infrastructure", infrastructure::routes())
        .nest("/issues", issues::routes())
        .nest("/logs", logs::routes())
        .nest("/mission-control", mission_control::routes())
        .nest("/preflight", preflight::routes())
        .nest("/prs", prs::routes())
        .nest("/system", system::routes())
        .nest("/tasks", tasks::routes())
        .nest("/timeline", timeline::routes())
        .nest("/tmux", tmux::routes())
        .nest("/worktrees", worktrees::routes())
}
