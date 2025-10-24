//! GitHub Issues route handlers

use crate::{
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    models::Repository,
    AppState,
};
use axum::{
    extract::{Extension, Path, Query, State},
    Json,
};
use miyabi_github::GitHubClient;
use miyabi_types::issue::{Issue, IssueStateGithub};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// Query parameters for listing issues
#[derive(Debug, Deserialize)]
pub struct ListIssuesQuery {
    /// Filter by state (open, closed, all)
    #[serde(default)]
    pub state: Option<String>,
    /// Filter by labels (comma-separated)
    #[serde(default)]
    pub labels: Option<String>,
    /// Limit number of results
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_limit() -> usize {
    100
}

/// Issue response with repository information
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct IssueWithRepository {
    /// Issue details
    #[serde(flatten)]
    pub issue: Issue,
    /// Repository owner
    pub repository_owner: String,
    /// Repository name
    pub repository_name: String,
}

/// List issues for a repository
///
/// Fetches issues from GitHub for the specified repository
///
/// Query parameters:
/// - state: Filter by state (open, closed, all). Default: open
/// - labels: Comma-separated list of labels to filter by
/// - limit: Maximum number of results. Default: 100
#[utoipa::path(
    get,
    path = "/api/v1/repositories/{repository_id}/issues",
    tag = "issues",
    params(
        ("repository_id" = Uuid, Path, description = "Repository ID")
    ),
    responses(
        (status = 200, description = "List of issues", body = Vec<IssueWithRepository>),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Repository not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_repository_issues(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(repository_id): Path<Uuid>,
    Query(query): Query<ListIssuesQuery>,
) -> Result<Json<Vec<IssueWithRepository>>> {
    // Get repository and verify user access
    let repository = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(repository_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

    // Get user's GitHub token
    let user_token = sqlx::query_scalar::<_, String>(
        r#"
        SELECT access_token
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await?;

    // Create GitHub client
    let gh_client = GitHubClient::new(&user_token, &repository.owner, &repository.name)
        .map_err(|e| AppError::Internal(format!("Failed to create GitHub client: {}", e)))?;

    // Parse state filter - use None to let miyabi-github handle it with octocrab's State enum
    // We validate the string and pass labels that miyabi-github will interpret
    let state_str = match query.state.as_deref() {
        Some("open") | None | Some("") => "open", // Default to open
        Some("closed") => "closed",
        Some("all") => "all",
        Some(s) => {
            return Err(AppError::Validation(format!(
                "Invalid state filter: {}. Use 'open', 'closed', or 'all'",
                s
            )))
        }
    };

    // Parse labels filter
    let labels_filter: Vec<String> = query
        .labels
        .as_ref()
        .map(|l| l.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();

    // Create a custom list_issues call that handles the State enum conversion internally
    // This avoids depending on octocrab version in web-api
    let issues = fetch_github_issues(&gh_client, state_str, labels_filter)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch issues from GitHub: {}", e)))?;

    // Convert to response format
    let issues_with_repo: Vec<IssueWithRepository> = issues
        .into_iter()
        .take(query.limit)
        .map(|issue| IssueWithRepository {
            issue,
            repository_owner: repository.owner.clone(),
            repository_name: repository.name.clone(),
        })
        .collect();

    Ok(Json(issues_with_repo))
}

/// Get single issue details
///
/// Fetches a specific issue from GitHub
#[utoipa::path(
    get,
    path = "/api/v1/repositories/{repository_id}/issues/{issue_number}",
    tag = "issues",
    params(
        ("repository_id" = Uuid, Path, description = "Repository ID"),
        ("issue_number" = u64, Path, description = "Issue number")
    ),
    responses(
        (status = 200, description = "Issue details", body = IssueWithRepository),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Repository or issue not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_repository_issue(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path((repository_id, issue_number)): Path<(Uuid, u64)>,
) -> Result<Json<IssueWithRepository>> {
    // Get repository and verify user access
    let repository = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(repository_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

    // Get user's GitHub token
    let user_token = sqlx::query_scalar::<_, String>(
        r#"
        SELECT access_token
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await?;

    // Create GitHub client
    let gh_client = GitHubClient::new(&user_token, &repository.owner, &repository.name)
        .map_err(|e| AppError::Internal(format!("Failed to create GitHub client: {}", e)))?;

    // Fetch issue from GitHub
    let issue = gh_client
        .get_issue(issue_number)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch issue from GitHub: {}", e)))?;

    Ok(Json(IssueWithRepository {
        issue,
        repository_owner: repository.owner,
        repository_name: repository.name,
    }))
}

/// Helper function to fetch issues from GitHub
///
/// Uses miyabi-github's get_issues_by_state which handles the octocrab State enum internally
async fn fetch_github_issues(
    client: &GitHubClient,
    state_str: &str,
    labels: Vec<String>,
) -> Result<Vec<Issue>> {
    use miyabi_types::error::Result as MiyabiResult;

    // Use list_issues with None state to get all issues, then filter
    // This avoids the octocrab version mismatch issue
    let result: MiyabiResult<Vec<Issue>> = client.list_issues(None, labels).await;

    let mut issues = result.map_err(|e| AppError::Internal(e.to_string()))?;

    // Filter by state if needed
    match state_str {
        "open" => issues.retain(|issue| issue.state == IssueStateGithub::Open),
        "closed" => issues.retain(|issue| issue.state == IssueStateGithub::Closed),
        "all" => {} // No filtering needed
        _ => issues.retain(|issue| issue.state == IssueStateGithub::Open), // Default to open
    }

    Ok(issues)
}
