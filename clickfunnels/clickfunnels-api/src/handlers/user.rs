//! User API Handlers
//!
//! This module implements HTTP handlers for User CRUD operations with database integration.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use clickfunnels_core::User;
use uuid::Uuid;

use crate::{
    dto::user::{
        CreateUserRequest, ListUsersQuery, PaginatedUsersResponse, UpdateUserRequest, UserResponse,
    },
    error::{ApiError, ApiResult},
    state::AppState,
    utils::password::hash_password,
};

/// Create a new user
///
/// POST /api/v1/users
pub async fn create_user(
    State(state): State<AppState>,
    Json(req): Json<CreateUserRequest>,
) -> ApiResult<(StatusCode, Json<UserResponse>)> {
    // Validate request
    req.validate().map_err(ApiError::ValidationError)?;

    // Hash password using bcrypt
    let password_hash = hash_password(&req.password)
        .map_err(|e| ApiError::InternalError(format!("Failed to hash password: {}", e)))?;

    // Create user entity
    let mut user = User::new(req.email.clone(), password_hash, req.full_name.clone());

    if let Some(company) = req.company_name {
        user.company_name = Some(company);
    }

    // Save to database
    let created_user = state
        .db
        .users()
        .create(&user)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Created user: {}", created_user.id);

    let response = UserResponse::from(created_user);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get user by ID
///
/// GET /api/v1/users/:id
pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> ApiResult<Json<UserResponse>> {
    // Fetch from database
    let user = state
        .db
        .users()
        .find_by_id(user_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Fetched user: {}", user_id);

    Ok(Json(UserResponse::from(user)))
}

/// Update user by ID
///
/// PUT /api/v1/users/:id
pub async fn update_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> ApiResult<Json<UserResponse>> {
    // Validate request
    req.validate().map_err(ApiError::ValidationError)?;

    // Fetch user from database
    let mut user = state
        .db
        .users()
        .find_by_id(user_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Update fields
    if let Some(full_name) = req.full_name {
        user.full_name = full_name;
    }

    if let Some(company_name) = req.company_name {
        user.company_name = Some(company_name);
    }

    if let Some(tier) = req.subscription_tier {
        user.upgrade_subscription(tier);
    }

    // Update timestamp
    user.updated_at = chrono::Utc::now();

    // Save to database
    let updated_user = state
        .db
        .users()
        .update(&user)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Updated user: {}", user_id);

    Ok(Json(UserResponse::from(updated_user)))
}

/// Delete user by ID (soft delete)
///
/// DELETE /api/v1/users/:id
pub async fn delete_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> ApiResult<StatusCode> {
    // Delete from database
    state
        .db
        .users()
        .delete(user_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Deleted user: {}", user_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List users with pagination and filters
///
/// GET /api/v1/users
pub async fn list_users(
    State(state): State<AppState>,
    Query(query): Query<ListUsersQuery>,
) -> ApiResult<Json<PaginatedUsersResponse>> {
    // Validate pagination params
    if query.page < 1 {
        return Err(ApiError::ValidationError("Page must be >= 1".to_string()));
    }

    if query.page_size < 1 || query.page_size > 100 {
        return Err(ApiError::ValidationError(
            "Page size must be between 1 and 100".to_string(),
        ));
    }

    // Fetch from database with pagination
    let users = state
        .db
        .users()
        .list(query.page as i64, query.page_size as i64)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total = state
        .db
        .users()
        .count()
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let user_responses: Vec<UserResponse> = users.into_iter().map(UserResponse::from).collect();

    tracing::info!(
        "Listed {} users: page={}, page_size={}",
        user_responses.len(),
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedUsersResponse {
        users: user_responses,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use clickfunnels_db::Database;

    async fn create_test_state() -> AppState {
        // For tests, use environment variable or default to test database
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/clickfunnels_test".to_string());

        let db = Database::new(&database_url).await.unwrap();
        AppState::new(db)
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_create_user_validation() {
        let state = create_test_state().await;

        let req = CreateUserRequest {
            email: "invalid-email".to_string(), // Invalid email
            password: "short".to_string(),      // Too short
            full_name: "Test User".to_string(),
            company_name: None,
        };

        let result = create_user(State(state), Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_create_user_valid() {
        let state = create_test_state().await;

        let req = CreateUserRequest {
            email: "test@example.com".to_string(),
            password: "securepassword123".to_string(),
            full_name: "Test User".to_string(),
            company_name: Some("Test Company".to_string()),
        };

        let result = create_user(State(state), Json(req)).await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.email, "test@example.com");
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_get_user() {
        let state = create_test_state().await;

        // First create a user
        let user = User::new(
            "gettest@example.com".to_string(),
            "hash".to_string(),
            "Get Test".to_string(),
        );
        let created = state.db.users().create(&user).await.unwrap();

        // Then fetch it
        let result = get_user(State(state.clone()), Path(created.id)).await;
        assert!(result.is_ok());

        // Cleanup
        state.db.users().delete(created.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_list_users_pagination_validation() {
        let state = create_test_state().await;

        let query = ListUsersQuery {
            page: 0, // Invalid: page must be >= 1
            page_size: 20,
            status: None,
            subscription_tier: None,
        };

        let result = list_users(State(state), Query(query)).await;
        assert!(result.is_err());
    }
}
