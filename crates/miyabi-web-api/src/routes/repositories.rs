//! Repository route handlers

use crate::{
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    models::{CreateRepositoryRequest, Repository},
    AppState,
};
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

/// List user repositories
///
/// Returns all repositories for the authenticated user
#[utoipa::path(
    get,
    path = "/api/v1/repositories",
    tag = "repositories",
    responses(
        (status = 200, description = "List of repositories", body = Vec<Repository>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_repositories(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Repository>>> {
    // Query repositories from database
    let repositories = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE user_id = $1 AND is_active = true
        ORDER BY updated_at DESC
        "#
    )
    .bind(auth_user.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(repositories))
}

/// Get repository by ID
///
/// Returns a single repository
#[utoipa::path(
    get,
    path = "/api/v1/repositories/{id}",
    tag = "repositories",
    params(
        ("id" = Uuid, Path, description = "Repository ID")
    ),
    responses(
        (status = 200, description = "Repository details", body = Repository),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Repository not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_repository(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Repository>> {
    // Query repository from database
    let repository = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE id = $1 AND user_id = $2
        "#
    )
    .bind(id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

    Ok(Json(repository))
}

/// Create repository
///
/// Adds a new repository for the authenticated user
#[utoipa::path(
    post,
    path = "/api/v1/repositories",
    tag = "repositories",
    request_body = CreateRepositoryRequest,
    responses(
        (status = 201, description = "Repository created", body = Repository),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn create_repository(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Json(request): Json<CreateRepositoryRequest>,
) -> Result<(StatusCode, Json<Repository>)> {
    // Parse full_name (format: owner/repo)
    let parts: Vec<&str> = request.full_name.split('/').collect();
    if parts.len() != 2 {
        return Err(AppError::Validation(
            "Invalid repository name format. Expected: owner/repo".to_string(),
        ));
    }

    let owner = parts[0].to_string();
    let name = parts[1].to_string();

    // TODO: Fetch repository from GitHub API to get github_repo_id
    // For now, use a placeholder
    let github_repo_id = 0i64;

    // Check if repository already exists
    let existing = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE user_id = $1 AND full_name = $2
        "#
    )
    .bind(auth_user.user_id)
    .bind(&request.full_name)
    .fetch_optional(&state.db)
    .await?;

    if let Some(repo) = existing {
        // Repository already exists, return it
        return Ok((StatusCode::OK, Json(repo)));
    }

    // Create new repository
    let repository = sqlx::query_as::<_, Repository>(
        r#"
        INSERT INTO repositories (user_id, github_repo_id, owner, name, full_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        "#
    )
    .bind(auth_user.user_id)
    .bind(github_repo_id)
    .bind(owner)
    .bind(name)
    .bind(request.full_name)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(repository)))
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_parse_full_name() {
        let full_name = "owner/repo";
        let parts: Vec<&str> = full_name.split('/').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0], "owner");
        assert_eq!(parts[1], "repo");
    }
}
