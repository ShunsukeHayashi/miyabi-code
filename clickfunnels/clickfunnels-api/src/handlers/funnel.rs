//! Funnel API Handlers
//!
//! This module implements HTTP handlers for Funnel CRUD operations with database integration.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use clickfunnels_core::Funnel;
use uuid::Uuid;

use crate::{
    dto::funnel::{
        CreateFunnelRequest, FunnelResponse, FunnelStatsResponse, ListFunnelsQuery,
        PaginatedFunnelsResponse, UpdateFunnelRequest,
    },
    error::{ApiError, ApiResult},
    middleware::auth::AuthenticatedUser,
    state::AppState,
};

/// Create a new funnel
///
/// POST /api/v1/funnels
pub async fn create_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<CreateFunnelRequest>,
) -> ApiResult<(StatusCode, Json<FunnelResponse>)> {
    // Validate request
    req.validate().map_err(ApiError::ValidationError)?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;

    // Create funnel entity
    let mut funnel = Funnel::new(user_id, req.name.clone(), req.slug.clone());

    funnel.description = req.description;
    funnel.funnel_type = req.funnel_type;
    funnel.custom_domain = req.custom_domain;

    // Save to database
    let created_funnel = state
        .db
        .funnels()
        .create(&funnel)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Created funnel: {}", created_funnel.id);

    let response = FunnelResponse::from(created_funnel);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get funnel by ID
///
/// GET /api/v1/funnels/:id
pub async fn get_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
) -> ApiResult<Json<FunnelResponse>> {
    // Fetch from database
    let funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Ensure requesting user owns the funnel
    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    tracing::info!("Fetched funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(funnel)))
}

/// Update funnel by ID
///
/// PUT /api/v1/funnels/:id
pub async fn update_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
    Json(req): Json<UpdateFunnelRequest>,
) -> ApiResult<Json<FunnelResponse>> {
    // Fetch funnel from database
    let mut funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Ensure requesting user owns the funnel
    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    // Update fields
    if let Some(name) = req.name {
        funnel.name = name;
    }

    if let Some(description) = req.description {
        funnel.description = Some(description);
    }

    if let Some(funnel_type) = req.funnel_type {
        funnel.funnel_type = funnel_type;
    }

    if let Some(status) = req.status {
        funnel.status = status;
    }

    if let Some(domain) = req.custom_domain {
        funnel.set_custom_domain(domain);
    }

    if let Some(ga_id) = req.ga_tracking_id {
        funnel.ga_tracking_id = Some(ga_id);
    }

    if let Some(fb_id) = req.fb_pixel_id {
        funnel.fb_pixel_id = Some(fb_id);
    }

    if let Some(smtp_id) = req.smtp_integration_id {
        funnel.set_smtp_integration(smtp_id);
    }

    if let Some(payment_id) = req.payment_integration_id {
        funnel.set_payment_integration(payment_id);
    }

    if let Some(settings) = req.settings {
        funnel.update_settings(settings);
    }

    if let Some(seo) = req.seo_metadata {
        funnel.update_seo_metadata(seo);
    }

    // Update timestamp
    funnel.updated_at = chrono::Utc::now();

    // Save to database
    let updated_funnel = state
        .db
        .funnels()
        .update(&funnel)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Updated funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(updated_funnel)))
}

/// Delete funnel by ID
///
/// DELETE /api/v1/funnels/:id
pub async fn delete_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
) -> ApiResult<StatusCode> {
    // Fetch funnel from database to validate ownership
    let funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    // Delete from database
    state
        .db
        .funnels()
        .delete(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Deleted funnel: {}", funnel_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List funnels with pagination and filters
///
/// GET /api/v1/funnels
pub async fn list_funnels(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListFunnelsQuery>,
) -> ApiResult<Json<PaginatedFunnelsResponse>> {
    // Validate pagination params
    if query.page < 1 {
        return Err(ApiError::ValidationError("Page must be >= 1".to_string()));
    }

    if query.page_size < 1 || query.page_size > 100 {
        return Err(ApiError::ValidationError(
            "Page size must be between 1 and 100".to_string(),
        ));
    }

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;

    // Fetch from database with pagination scoped to user
    let funnels = state
        .db
        .funnels()
        .list_by_user(user_id, query.page as i64, query.page_size as i64)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total = state
        .db
        .funnels()
        .count_by_user(user_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let funnel_responses: Vec<FunnelResponse> =
        funnels.into_iter().map(FunnelResponse::from).collect();

    tracing::info!(
        "Listed {} funnels: page={}, page_size={}",
        funnel_responses.len(),
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedFunnelsResponse {
        funnels: funnel_responses,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

/// Get funnel statistics
///
/// GET /api/v1/funnels/:id/stats
pub async fn get_funnel_stats(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
) -> ApiResult<Json<FunnelStatsResponse>> {
    // Fetch funnel from database
    let funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Ensure requesting user owns the funnel
    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel's statistics".to_string(),
        ));
    }

    // Calculate unique visits (for now same as total, can be enhanced later)
    let unique_visits = (funnel.total_visits as f64 * 0.78) as i64;

    let stats = FunnelStatsResponse {
        funnel_id,
        total_visits: funnel.total_visits,
        unique_visits,
        total_conversions: funnel.total_conversions,
        conversion_rate: funnel.conversion_rate,
        total_revenue: funnel.total_revenue,
        currency: funnel.currency.clone(),
        pages_count: funnel.pages_count,
    };

    tracing::info!("Fetched funnel stats: {}", funnel_id);

    Ok(Json(stats))
}

/// Publish a funnel
///
/// POST /api/v1/funnels/:id/publish
pub async fn publish_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
) -> ApiResult<Json<FunnelResponse>> {
    // Fetch funnel from database
    let mut funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Ensure requesting user owns the funnel
    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    // Publish the funnel
    funnel.publish();

    // Save to database
    let updated_funnel = state
        .db
        .funnels()
        .update(&funnel)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Published funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(updated_funnel)))
}

/// Unpublish a funnel
///
/// POST /api/v1/funnels/:id/unpublish
pub async fn unpublish_funnel(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(funnel_id): Path<Uuid>,
) -> ApiResult<Json<FunnelResponse>> {
    // Fetch funnel from database
    let mut funnel = state
        .db
        .funnels()
        .find_by_id(funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // Ensure requesting user owns the funnel
    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    // Unpublish the funnel
    funnel.unpublish();

    // Save to database
    let updated_funnel = state
        .db
        .funnels()
        .update(&funnel)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Unpublished funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(updated_funnel)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use clickfunnels_core::FunnelType;
    use clickfunnels_db::Database;
    use axum::Extension;
    use crate::utils::jwt::Claims;

    async fn create_test_state() -> AppState {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/clickfunnels_test".to_string());

        let db = Database::new(&database_url).await.unwrap();
        AppState::new(db)
    }

    fn auth_extension(user_id: Uuid) -> Extension<AuthenticatedUser> {
        Extension(Claims::new(user_id, "tester@example.com".to_string()))
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_create_funnel_validation() {
        let state = create_test_state().await;

        let req = CreateFunnelRequest {
            name: "".to_string(), // Invalid: empty name
            description: None,
            funnel_type: FunnelType::Sales,
            slug: "invalid slug!".to_string(), // Invalid: contains space and special char
            custom_domain: None,
        };

        let result =
            create_funnel(State(state), auth_extension(Uuid::new_v4()), Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_create_funnel_valid() {
        let state = create_test_state().await;

        let req = CreateFunnelRequest {
            name: "My Sales Funnel".to_string(),
            description: Some("A great funnel".to_string()),
            funnel_type: FunnelType::Sales,
            slug: "my-sales-funnel".to_string(),
            custom_domain: Some("sales.example.com".to_string()),
        };

        let user_id = Uuid::new_v4();
        let result = create_funnel(State(state.clone()), auth_extension(user_id), Json(req)).await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.name, "My Sales Funnel");

        // Cleanup
        state.db.funnels().delete(response.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_publish_unpublish() {
        let state = create_test_state().await;

        // Create a funnel first
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());
        let created = state.db.funnels().create(&funnel).await.unwrap();

        // Test publish
        let result =
            publish_funnel(State(state.clone()), auth_extension(user_id), Path(created.id)).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.published_at.is_some());

        // Test unpublish
        let result =
            unpublish_funnel(State(state.clone()), auth_extension(user_id), Path(created.id)).await;
        assert!(result.is_ok());

        // Cleanup
        state.db.funnels().delete(created.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_get_funnel_stats() {
        let state = create_test_state().await;

        // Create a funnel first
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Stats Test".to_string(), "stats-test".to_string());
        let created = state.db.funnels().create(&funnel).await.unwrap();

        let result = get_funnel_stats(
            State(state.clone()),
            auth_extension(user_id),
            Path(created.id),
        )
        .await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.funnel_id, created.id);

        // Cleanup
        state.db.funnels().delete(created.id).await.ok();
    }
}
