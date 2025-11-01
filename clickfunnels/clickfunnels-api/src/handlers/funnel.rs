//! Funnel API Handlers
//!
//! This module implements HTTP handlers for Funnel CRUD operations.

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};
use clickfunnels_core::Funnel;
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::funnel::{
        CreateFunnelRequest, FunnelResponse, FunnelStatsResponse, ListFunnelsQuery,
        PaginatedFunnelsResponse, UpdateFunnelRequest,
    },
    error::{ApiError, ApiResult},
};

/// Create a new funnel
///
/// POST /api/v1/funnels
pub async fn create_funnel(
    Json(req): Json<CreateFunnelRequest>,
) -> ApiResult<(StatusCode, Json<FunnelResponse>)> {
    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // TODO: Get user_id from authentication context
    let user_id = Uuid::new_v4(); // Mock user_id

    // Check slug uniqueness
    // TODO: Validate slug is unique in database

    // Create funnel entity
    let mut funnel = Funnel::new(user_id, req.name.clone(), req.slug.clone());

    funnel.description = req.description;
    funnel.funnel_type = req.funnel_type;
    funnel.custom_domain = req.custom_domain;

    // TODO: Save to database
    tracing::info!("Created funnel: {}", funnel.id);

    let response = FunnelResponse::from(funnel);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get funnel by ID
///
/// GET /api/v1/funnels/:id
pub async fn get_funnel(Path(funnel_id): Path<Uuid>) -> ApiResult<Json<FunnelResponse>> {
    // TODO: Fetch from database
    let user_id = Uuid::new_v4();
    let funnel = Funnel::new(
        user_id,
        "Mock Funnel".to_string(),
        format!("funnel-{}", funnel_id),
    );

    tracing::info!("Fetched funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(funnel)))
}

/// Update funnel by ID
///
/// PUT /api/v1/funnels/:id
pub async fn update_funnel(
    Path(funnel_id): Path<Uuid>,
    Json(req): Json<UpdateFunnelRequest>,
) -> ApiResult<Json<FunnelResponse>> {
    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // TODO: Fetch funnel from database
    let user_id = Uuid::new_v4();
    let mut funnel = Funnel::new(user_id, "Mock Funnel".to_string(), "mock-funnel".to_string());

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

    // TODO: Save to database
    tracing::info!("Updated funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(funnel)))
}

/// Delete funnel by ID
///
/// DELETE /api/v1/funnels/:id
pub async fn delete_funnel(Path(funnel_id): Path<Uuid>) -> ApiResult<StatusCode> {
    // TODO: Fetch funnel from database and mark as archived
    tracing::info!("Deleted funnel: {}", funnel_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List funnels with pagination and filters
///
/// GET /api/v1/funnels
pub async fn list_funnels(
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

    // TODO: Fetch from database with filters
    let user_id = Uuid::new_v4();
    let mock_funnels = vec![
        Funnel::new(user_id, "Funnel One".to_string(), "funnel-one".to_string()),
        Funnel::new(user_id, "Funnel Two".to_string(), "funnel-two".to_string()),
    ];

    let total = mock_funnels.len() as i64;
    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let funnels: Vec<FunnelResponse> = mock_funnels
        .into_iter()
        .map(FunnelResponse::from)
        .collect();

    tracing::info!(
        "Listed funnels: page={}, page_size={}",
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedFunnelsResponse {
        funnels,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

/// Get funnel statistics
///
/// GET /api/v1/funnels/:id/stats
pub async fn get_funnel_stats(Path(funnel_id): Path<Uuid>) -> ApiResult<Json<FunnelStatsResponse>> {
    // TODO: Fetch funnel and calculate stats from database
    let stats = FunnelStatsResponse {
        funnel_id,
        total_visits: 1250,
        unique_visits: 980,
        total_conversions: 125,
        conversion_rate: 10.0,
        total_revenue: 15000000, // $150,000.00 in cents
        currency: "USD".to_string(),
        pages_count: 5,
    };

    tracing::info!("Fetched funnel stats: {}", funnel_id);

    Ok(Json(stats))
}

/// Publish a funnel
///
/// POST /api/v1/funnels/:id/publish
pub async fn publish_funnel(Path(funnel_id): Path<Uuid>) -> ApiResult<Json<FunnelResponse>> {
    // TODO: Fetch funnel from database
    let user_id = Uuid::new_v4();
    let mut funnel = Funnel::new(user_id, "Mock Funnel".to_string(), "mock-funnel".to_string());

    // Publish the funnel
    funnel.publish();

    // TODO: Save to database
    tracing::info!("Published funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(funnel)))
}

/// Unpublish a funnel
///
/// POST /api/v1/funnels/:id/unpublish
pub async fn unpublish_funnel(Path(funnel_id): Path<Uuid>) -> ApiResult<Json<FunnelResponse>> {
    // TODO: Fetch funnel from database
    let user_id = Uuid::new_v4();
    let mut funnel = Funnel::new(user_id, "Mock Funnel".to_string(), "mock-funnel".to_string());
    funnel.publish(); // Set to published first

    // Unpublish the funnel
    funnel.unpublish();

    // TODO: Save to database
    tracing::info!("Unpublished funnel: {}", funnel_id);

    Ok(Json(FunnelResponse::from(funnel)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use clickfunnels_core::FunnelType;

    #[tokio::test]
    async fn test_create_funnel_validation() {
        let req = CreateFunnelRequest {
            name: "".to_string(), // Invalid: empty name
            description: None,
            funnel_type: FunnelType::Sales,
            slug: "invalid slug!".to_string(), // Invalid: contains space and special char
            custom_domain: None,
        };

        let result = create_funnel(Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_funnel_valid() {
        let req = CreateFunnelRequest {
            name: "My Sales Funnel".to_string(),
            description: Some("A great funnel".to_string()),
            funnel_type: FunnelType::Sales,
            slug: "my-sales-funnel".to_string(),
            custom_domain: Some("sales.example.com".to_string()),
        };

        let result = create_funnel(Json(req)).await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.name, "My Sales Funnel");
    }

    #[tokio::test]
    async fn test_get_funnel() {
        let funnel_id = Uuid::new_v4();
        let result = get_funnel(Path(funnel_id)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_publish_unpublish() {
        let funnel_id = Uuid::new_v4();

        // Test publish
        let result = publish_funnel(Path(funnel_id)).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.published_at.is_some());

        // Test unpublish
        let result = unpublish_funnel(Path(funnel_id)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_funnel_stats() {
        let funnel_id = Uuid::new_v4();
        let result = get_funnel_stats(Path(funnel_id)).await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.funnel_id, funnel_id);
        assert!(stats.total_visits > 0);
    }
}
