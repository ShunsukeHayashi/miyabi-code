use axum::{routing::get, Router, Json};
use serde::Serialize;

#[derive(Serialize)]
pub struct Label {
    pub name: String,
    pub color: String,
}

#[derive(Serialize)]
pub struct Issue {
    pub number: u32,
    pub title: String,
    pub state: String,
    pub labels: Vec<Label>,
    pub assignees: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub body: Option<String>,
}

#[derive(Serialize)]
pub struct IssuesListResponse {
    pub issues: Vec<Issue>,
    pub total: u32,
}

async fn list_issues() -> Json<IssuesListResponse> {
    Json(IssuesListResponse {
        total: 5,
        issues: vec![
            Issue {
                number: 490,
                title: "Phase 13 完全自律実行システム構築".to_string(),
                state: "open".to_string(),
                labels: vec![
                    Label { name: "type:feature".to_string(), color: "0052CC".to_string() },
                    Label { name: "priority:high".to_string(), color: "D93F0B".to_string() },
                    Label { name: "agent:coordinator".to_string(), color: "FF69B4".to_string() },
                    Label { name: "phase:implementation".to_string(), color: "BFD4F2".to_string() },
                ],
                assignees: vec!["CoordinatorAgent".to_string()],
                created_at: "2025-01-15T10:30:00Z".to_string(),
                updated_at: "2025-01-20T14:22:00Z".to_string(),
                body: Some("完全自律実行システムの構築を行います".to_string()),
            },
            Issue {
                number: 431,
                title: "LINE Messaging API integration".to_string(),
                state: "closed".to_string(),
                labels: vec![
                    Label { name: "type:feature".to_string(), color: "0052CC".to_string() },
                    Label { name: "component:core".to_string(), color: "006B75".to_string() },
                    Label { name: "size:M".to_string(), color: "FEF2C0".to_string() },
                ],
                assignees: vec!["CodeGenAgent".to_string()],
                created_at: "2025-01-10T08:15:00Z".to_string(),
                updated_at: "2025-01-18T16:45:00Z".to_string(),
                body: Some("LINE Messaging API統合の実装".to_string()),
            },
            Issue {
                number: 355,
                title: "logger.rs memory leak fix".to_string(),
                state: "closed".to_string(),
                labels: vec![
                    Label { name: "type:bug".to_string(), color: "D73A4A".to_string() },
                    Label { name: "priority:critical".to_string(), color: "B60205".to_string() },
                    Label { name: "component:core".to_string(), color: "006B75".to_string() },
                    Label { name: "size:S".to_string(), color: "BFD4F2".to_string() },
                ],
                assignees: vec!["CodeGenAgent".to_string(), "ReviewAgent".to_string()],
                created_at: "2025-01-05T11:20:00Z".to_string(),
                updated_at: "2025-01-06T09:30:00Z".to_string(),
                body: Some("mem::forget によるメモリリークを OnceCell で修正".to_string()),
            },
            Issue {
                number: 270,
                title: "CoordinatorAgent DAG分解機能実装".to_string(),
                state: "open".to_string(),
                labels: vec![
                    Label { name: "type:feature".to_string(), color: "0052CC".to_string() },
                    Label { name: "agent:coordinator".to_string(), color: "FF69B4".to_string() },
                    Label { name: "difficulty:hard".to_string(), color: "E99695".to_string() },
                    Label { name: "size:L".to_string(), color: "F9C5D4".to_string() },
                ],
                assignees: vec!["CoordinatorAgent".to_string()],
                created_at: "2024-12-20T15:00:00Z".to_string(),
                updated_at: "2025-01-15T12:10:00Z".to_string(),
                body: Some("Issue を Task に分解する DAG 生成機能".to_string()),
            },
            Issue {
                number: 164,
                title: "Windows CI/CD サポート追加".to_string(),
                state: "open".to_string(),
                labels: vec![
                    Label { name: "type:feature".to_string(), color: "0052CC".to_string() },
                    Label { name: "tech:infrastructure".to_string(), color: "326CE5".to_string() },
                    Label { name: "good-first-issue".to_string(), color: "7057FF".to_string() },
                    Label { name: "difficulty:easy".to_string(), color: "7057FF".to_string() },
                ],
                assignees: vec![],
                created_at: "2024-11-28T09:45:00Z".to_string(),
                updated_at: "2024-12-15T14:20:00Z".to_string(),
                body: Some("GitHub Actions で Windows ビルドとテストを実行".to_string()),
            },
        ],
    })
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_issues))
}
