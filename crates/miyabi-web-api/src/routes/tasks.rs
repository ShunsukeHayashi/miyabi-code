use axum::{routing::get, Router, Json};
use serde::Serialize;

#[derive(Serialize)]
pub struct Task {
    pub id: String,
    pub title: String,
}

async fn list_tasks() -> Json<Vec<Task>> {
    Json(vec![])
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_tasks))
}
