//! Mock GitHub API server implementation

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, patch, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};

/// Mock issue response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockIssueResponse {
    pub number: u64,
    pub title: String,
    pub body: String,
    pub state: String,
    pub labels: Vec<MockLabel>,
}

/// Mock label
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockLabel {
    pub name: String,
}

/// Mock PR response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockPRResponse {
    pub number: u64,
    pub title: String,
    pub body: String,
    pub head: String,
    pub base: String,
    pub state: String,
}

/// Mock comment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockComment {
    pub id: u64,
    pub body: String,
}

/// Internal state for mock GitHub server
#[derive(Debug, Clone, Default)]
struct MockState {
    issues: HashMap<u64, MockIssueResponse>,
    prs: HashMap<u64, MockPRResponse>,
    comments: HashMap<u64, Vec<MockComment>>,
    next_id: u64,
}

/// Mock GitHub API server
#[derive(Debug, Clone)]
pub struct MockGitHub {
    address: String,
    state: Arc<RwLock<MockState>>,
}

impl MockGitHub {
    /// Start a new mock GitHub server
    pub async fn start() -> crate::E2EResult<Self> {
        Self::builder().build().await
    }

    /// Create a builder for customization
    pub fn builder() -> MockGitHubBuilder {
        MockGitHubBuilder::default()
    }

    /// Get the base URL of the mock server
    pub fn base_url(&self) -> &str {
        &self.address
    }

    /// Add a mock issue
    pub async fn add_issue(&self, issue: MockIssueResponse) {
        let mut state = self.state.write().await;
        state.issues.insert(issue.number, issue);
    }

    /// Add a mock PR
    pub async fn add_pr(&self, pr: MockPRResponse) {
        let mut state = self.state.write().await;
        state.prs.insert(pr.number, pr);
    }

    /// Get all issues
    pub async fn get_issues(&self) -> Vec<MockIssueResponse> {
        let state = self.state.read().await;
        state.issues.values().cloned().collect()
    }

    /// Get all PRs
    pub async fn get_prs(&self) -> Vec<MockPRResponse> {
        let state = self.state.read().await;
        state.prs.values().cloned().collect()
    }

    /// Reset all state
    pub async fn reset(&self) {
        let mut state = self.state.write().await;
        *state = MockState::default();
    }
}

/// Builder for mock GitHub server
#[derive(Default)]
pub struct MockGitHubBuilder {
    port: Option<u16>,
}

impl MockGitHubBuilder {
    /// Set custom port (0 for random)
    pub fn with_port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    /// Build and start the mock server
    pub async fn build(self) -> crate::E2EResult<MockGitHub> {
        let state = Arc::new(RwLock::new(MockState::default()));

        let app = Router::new()
            .route("/repos/:owner/:repo/issues", get(list_issues))
            .route("/repos/:owner/:repo/issues", post(create_issue))
            .route("/repos/:owner/:repo/issues/:number", get(get_issue))
            .route("/repos/:owner/:repo/issues/:number", patch(update_issue))
            .route("/repos/:owner/:repo/issues/:number/comments", post(create_comment))
            .route("/repos/:owner/:repo/issues/:number/comments", get(list_comments))
            .route("/repos/:owner/:repo/issues/:number/labels", post(add_labels))
            .route("/repos/:owner/:repo/pulls", post(create_pr))
            .route("/repos/:owner/:repo/pulls/:number", get(get_pr))
            .with_state(state.clone());

        let port = self.port.unwrap_or(0);
        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await?;
        let address = format!("http://{}", listener.local_addr()?);

        info!("Starting mock GitHub server at {}", address);

        // Spawn server in background
        tokio::spawn(async move {
            axum::serve(listener, app).await.expect("Failed to serve mock GitHub");
        });

        Ok(MockGitHub { address, state })
    }
}

// Route handlers
async fn list_issues(State(state): State<Arc<RwLock<MockState>>>) -> Json<Vec<MockIssueResponse>> {
    debug!("GET /issues");
    let state = state.read().await;
    Json(state.issues.values().cloned().collect())
}

#[derive(Deserialize)]
struct CreateIssueRequest {
    title: String,
    body: String,
}

async fn create_issue(
    State(state): State<Arc<RwLock<MockState>>>,
    Json(payload): Json<CreateIssueRequest>,
) -> (StatusCode, Json<MockIssueResponse>) {
    debug!("POST /issues: {}", payload.title);
    let mut state = state.write().await;
    let number = state.next_id;
    state.next_id += 1;

    let issue = MockIssueResponse {
        number,
        title: payload.title,
        body: payload.body,
        state: "open".to_string(),
        labels: vec![],
    };

    state.issues.insert(number, issue.clone());
    (StatusCode::CREATED, Json(issue))
}

async fn get_issue(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
) -> Result<Json<MockIssueResponse>, StatusCode> {
    debug!("GET /issues/{}", number);
    let state = state.read().await;
    state
        .issues
        .get(&number)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

#[derive(Deserialize)]
struct UpdateIssueRequest {
    title: Option<String>,
    body: Option<String>,
    state: Option<String>,
}

async fn update_issue(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
    Json(payload): Json<UpdateIssueRequest>,
) -> Result<Json<MockIssueResponse>, StatusCode> {
    debug!("PATCH /issues/{}", number);
    let mut state = state.write().await;

    let issue = state.issues.get_mut(&number).ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = payload.title {
        issue.title = title;
    }
    if let Some(body) = payload.body {
        issue.body = body;
    }
    if let Some(issue_state) = payload.state {
        issue.state = issue_state;
    }

    Ok(Json(issue.clone()))
}

#[derive(Deserialize)]
struct CreateCommentRequest {
    body: String,
}

async fn create_comment(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
    Json(payload): Json<CreateCommentRequest>,
) -> (StatusCode, Json<MockComment>) {
    debug!("POST /issues/{}/comments", number);
    let mut state = state.write().await;

    let comment_id = state.next_id;
    state.next_id += 1;

    let comment = MockComment { id: comment_id, body: payload.body };

    state.comments.entry(number).or_default().push(comment.clone());

    (StatusCode::CREATED, Json(comment))
}

async fn list_comments(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
) -> Json<Vec<MockComment>> {
    debug!("GET /issues/{}/comments", number);
    let state = state.read().await;
    Json(state.comments.get(&number).cloned().unwrap_or_default())
}

#[derive(Deserialize)]
struct AddLabelsRequest {
    labels: Vec<String>,
}

async fn add_labels(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
    Json(payload): Json<AddLabelsRequest>,
) -> Result<Json<Vec<MockLabel>>, StatusCode> {
    debug!("POST /issues/{}/labels", number);
    let mut state = state.write().await;

    let issue = state.issues.get_mut(&number).ok_or(StatusCode::NOT_FOUND)?;

    for label in payload.labels {
        if !issue.labels.iter().any(|l| l.name == label) {
            issue.labels.push(MockLabel { name: label });
        }
    }

    Ok(Json(issue.labels.clone()))
}

#[derive(Deserialize)]
struct CreatePRRequest {
    title: String,
    body: String,
    head: String,
    base: String,
}

async fn create_pr(
    State(state): State<Arc<RwLock<MockState>>>,
    Json(payload): Json<CreatePRRequest>,
) -> (StatusCode, Json<MockPRResponse>) {
    debug!("POST /pulls: {}", payload.title);
    let mut state = state.write().await;
    let number = state.next_id;
    state.next_id += 1;

    let pr = MockPRResponse {
        number,
        title: payload.title,
        body: payload.body,
        head: payload.head,
        base: payload.base,
        state: "open".to_string(),
    };

    state.prs.insert(number, pr.clone());
    (StatusCode::CREATED, Json(pr))
}

async fn get_pr(
    State(state): State<Arc<RwLock<MockState>>>,
    Path((_owner, _repo, number)): Path<(String, String, u64)>,
) -> Result<Json<MockPRResponse>, StatusCode> {
    debug!("GET /pulls/{}", number);
    let state = state.read().await;
    state.prs.get(&number).cloned().map(Json).ok_or(StatusCode::NOT_FOUND)
}
