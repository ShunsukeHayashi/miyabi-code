//! User API Handlers
//!
//! This module implements HTTP handlers for User CRUD operations.

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};
use clickfunnels_core::User;
use uuid::Uuid;
// use validator::Validate; // TODO: Re-enable when validator is fixed

use crate::{
    dto::user::{CreateUserRequest, ListUsersQuery, PaginatedUsersResponse, UpdateUserRequest, UserResponse},
    error::{ApiError, ApiResult},
};

/// Create a new user
///
/// POST /api/v1/users
pub async fn create_user(
    Json(req): Json<CreateUserRequest>,
) -> ApiResult<(StatusCode, Json<UserResponse>)> {
    // Validate request
    req.validate()
        .map_err(ApiError::ValidationError)?;

    // TODO: Hash password using bcrypt
    let password_hash = format!("hashed_{}", req.password);

    // Create user entity
    let mut user = User::new(req.email.clone(), password_hash, req.full_name.clone());

    if let Some(company) = req.company_name {
        user.company_name = Some(company);
    }

    // TODO: Save to database
    // For now, return the created user
    tracing::info!("Created user: {}", user.id);

    let response = UserResponse::from(user);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get user by ID
///
/// GET /api/v1/users/:id
pub async fn get_user(Path(user_id): Path<Uuid>) -> ApiResult<Json<UserResponse>> {
    // TODO: Fetch from database
    // For now, return a mock user
    let user = User::new(
        format!("user-{}@example.com", user_id),
        "hashed_password".to_string(),
        "Mock User".to_string(),
    );

    tracing::info!("Fetched user: {}", user_id);

    Ok(Json(UserResponse::from(user)))
}

/// Update user by ID
///
/// PUT /api/v1/users/:id
pub async fn update_user(
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> ApiResult<Json<UserResponse>> {
    // Validate request
    req.validate()
        .map_err(ApiError::ValidationError)?;

    // TODO: Fetch user from database
    let mut user = User::new(
        format!("user-{}@example.com", user_id),
        "hashed_password".to_string(),
        "Mock User".to_string(),
    );

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

    // TODO: Save to database
    tracing::info!("Updated user: {}", user_id);

    Ok(Json(UserResponse::from(user)))
}

/// Delete user by ID (soft delete)
///
/// DELETE /api/v1/users/:id
pub async fn delete_user(Path(user_id): Path<Uuid>) -> ApiResult<StatusCode> {
    // TODO: Fetch user from database and mark as deleted
    // For now, just return success
    tracing::info!("Deleted user: {}", user_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List users with pagination and filters
///
/// GET /api/v1/users
pub async fn list_users(
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

    // TODO: Fetch from database with filters
    // For now, return mock data
    let mock_users = vec![
        User::new(
            "user1@example.com".to_string(),
            "hash1".to_string(),
            "User One".to_string(),
        ),
        User::new(
            "user2@example.com".to_string(),
            "hash2".to_string(),
            "User Two".to_string(),
        ),
    ];

    let total = mock_users.len() as i64;
    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let users: Vec<UserResponse> = mock_users.into_iter().map(UserResponse::from).collect();

    tracing::info!(
        "Listed users: page={}, page_size={}",
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedUsersResponse {
        users,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_user_validation() {
        let req = CreateUserRequest {
            email: "invalid-email".to_string(), // Invalid email
            password: "short".to_string(),      // Too short
            full_name: "Test User".to_string(),
            company_name: None,
        };

        let result = create_user(Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_user_valid() {
        let req = CreateUserRequest {
            email: "test@example.com".to_string(),
            password: "securepassword123".to_string(),
            full_name: "Test User".to_string(),
            company_name: Some("Test Company".to_string()),
        };

        let result = create_user(Json(req)).await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.email, "test@example.com");
    }

    #[tokio::test]
    async fn test_get_user() {
        let user_id = Uuid::new_v4();
        let result = get_user(Path(user_id)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_update_user() {
        let user_id = Uuid::new_v4();
        let req = UpdateUserRequest {
            full_name: Some("Updated Name".to_string()),
            company_name: None,
            subscription_tier: None,
        };

        let result = update_user(Path(user_id), Json(req)).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.full_name, "Updated Name");
    }

    #[tokio::test]
    async fn test_list_users_pagination_validation() {
        let query = ListUsersQuery {
            page: 0, // Invalid: page must be >= 1
            page_size: 20,
            status: None,
            subscription_tier: None,
        };

        let result = list_users(Query(query)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_users_valid() {
        let query = ListUsersQuery {
            page: 1,
            page_size: 20,
            status: None,
            subscription_tier: None,
        };

        let result = list_users(Query(query)).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.page, 1);
        assert_eq!(response.page_size, 20);
    }
}
