use axum::Router;

mod agents;
mod codegen;
mod deployments;
mod issues;
mod logs;
mod prs;
mod tasks;
mod worktrees;

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
