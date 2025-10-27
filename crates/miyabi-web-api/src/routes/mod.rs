use axum::Router;

pub mod agents;
pub mod auth;
pub mod codegen;
pub mod dashboard;
pub mod deployments;
pub mod health;
pub mod issues;
pub mod logs;
pub mod prs;
pub mod repositories;
pub mod tasks;
pub mod telegram;
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
        .nest("/prs", prs::routes())
        .nest("/tasks", tasks::routes())
        .nest("/worktrees", worktrees::routes())
}
