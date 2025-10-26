use axum::Router;

pub mod health;
pub mod auth;
pub mod repositories;
pub mod workflows;
pub mod dashboard;
pub mod websocket;
pub mod agents;
pub mod codegen;
pub mod deployments;
pub mod issues;
pub mod logs;
pub mod prs;
pub mod tasks;
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
