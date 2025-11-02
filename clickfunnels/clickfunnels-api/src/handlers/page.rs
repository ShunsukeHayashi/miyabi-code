//! Page API Handlers
//!
//! This module implements HTTP handlers for Page CRUD operations with database integration.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use clickfunnels_core::Page;
use uuid::Uuid;

use crate::{
    dto::page::{
        CreatePageRequest, DetailedPageResponse, ListPagesQuery, PageResponse, PageStatsResponse,
        PaginatedPagesResponse, UpdatePageContentRequest, UpdatePageRequest,
    },
    error::{ApiError, ApiResult},
    middleware::auth::AuthenticatedUser,
    state::AppState,
};

/// Create a new page
///
/// POST /api/v1/pages
pub async fn create_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<CreatePageRequest>,
) -> ApiResult<(StatusCode, Json<PageResponse>)> {
    // Validate request
    req.validate().map_err(ApiError::ValidationError)?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;

    // Ensure the funnel belongs to the authenticated user
    let funnel = state
        .db
        .funnels()
        .find_by_id(req.funnel_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    if funnel.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this funnel".to_string(),
        ));
    }

    // Create page entity
    let mut page = Page::new(req.funnel_id, user_id, req.name.clone(), req.slug.clone());
    page.title = req.title;
    page.page_type = req.page_type;
    page.order_index = req.order_index;

    // Save to database
    let created_page = state
        .db
        .pages()
        .create(&page)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Created page: {} in funnel: {}", created_page.id, created_page.funnel_id);

    let response = PageResponse::from(created_page);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get page by ID
///
/// GET /api/v1/pages/:id
pub async fn get_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<Json<DetailedPageResponse>> {
    // Fetch from database
    let page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    tracing::info!("Fetched page: {}", page_id);

    let detailed = DetailedPageResponse {
        page: PageResponse::from(page.clone()),
        html_content: page.html_content,
        css_content: page.css_content,
        js_content: page.js_content,
        settings: page.settings,
        seo_title: page.seo_title,
        seo_description: page.seo_description,
        seo_keywords: page.seo_keywords,
        og_title: page.og_title,
        og_description: page.og_description,
        og_image: page.og_image,
    };

    Ok(Json(detailed))
}

/// Update page by ID
///
/// PUT /api/v1/pages/:id
pub async fn update_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
    Json(req): Json<UpdatePageRequest>,
) -> ApiResult<Json<PageResponse>> {
    // Fetch page from database
    let mut page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Update fields
    if let Some(name) = req.name {
        page.name = name;
    }

    if let Some(title) = req.title {
        page.title = title;
    }

    if let Some(page_type) = req.page_type {
        page.page_type = page_type;
    }

    if let Some(status) = req.status {
        page.status = status;
    }

    if let Some(order) = req.order_index {
        page.order_index = order;
    }

    if let Some(html) = req.html_content {
        page.update_html_content(html);
    }

    if let Some(css) = req.css_content {
        page.update_css_content(css);
    }

    if let Some(js) = req.js_content {
        page.update_js_content(js);
    }

    if let Some(settings) = req.settings {
        page.update_settings(settings);
    }

    // Update SEO metadata
    if req.seo_title.is_some() || req.seo_description.is_some() || req.seo_keywords.is_some() {
        if let (Some(title), Some(desc)) = (req.seo_title, req.seo_description) {
            page.set_seo_metadata(title, desc, req.seo_keywords);
        }
    }

    // Update Open Graph metadata
    if req.og_title.is_some() || req.og_description.is_some() {
        if let (Some(title), Some(desc)) = (req.og_title, req.og_description) {
            page.set_og_metadata(title, desc, req.og_image);
        }
    }

    // Update A/B testing
    if let Some(is_ab_test) = req.is_ab_test_variant {
        if is_ab_test {
            if let (Some(group_id), Some(weight)) = (req.ab_test_group_id, req.ab_test_weight) {
                page.enable_ab_testing(group_id, weight);
            }
        } else {
            page.disable_ab_testing();
        }
    }

    // Update custom code
    if let Some(head_code) = req.custom_head_code {
        page.set_custom_head_code(head_code);
    }

    if let Some(footer_code) = req.custom_footer_code {
        page.set_custom_footer_code(footer_code);
    }

    // Update timestamp
    page.updated_at = chrono::Utc::now();

    // Save to database
    let updated_page = state
        .db
        .pages()
        .update(&page)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Updated page: {}", page_id);

    Ok(Json(PageResponse::from(updated_page)))
}

/// Delete page by ID
///
/// DELETE /api/v1/pages/:id
pub async fn delete_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<StatusCode> {
    // Fetch page to validate ownership
    let page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Delete from database
    state
        .db
        .pages()
        .delete(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Deleted page: {}", page_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List pages with pagination and filters
///
/// GET /api/v1/pages
pub async fn list_pages(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListPagesQuery>,
) -> ApiResult<Json<PaginatedPagesResponse>> {
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
    let pages = state
        .db
        .pages()
        .list_by_user(user_id, query.page as i64, query.page_size as i64)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total = state
        .db
        .pages()
        .count_by_user(user_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let page_responses: Vec<PageResponse> = pages.into_iter().map(PageResponse::from).collect();

    tracing::info!(
        "Listed {} pages: page={}, page_size={}",
        page_responses.len(),
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedPagesResponse {
        pages: page_responses,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

/// Get page statistics
///
/// GET /api/v1/pages/:id/stats
pub async fn get_page_stats(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<Json<PageStatsResponse>> {
    // Fetch page from database
    let page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    let stats = PageStatsResponse {
        page_id,
        total_visits: page.total_visits,
        unique_visits: page.unique_visits,
        total_conversions: page.total_conversions,
        conversion_rate: page.conversion_rate,
        // TODO: Implement these analytics fields in Page entity
        average_time_on_page: None,
        bounce_rate: None,
    };

    tracing::info!("Fetched page stats: {}", page_id);

    Ok(Json(stats))
}

/// Update page content (HTML/CSS/JS)
///
/// PUT /api/v1/pages/:id/content
pub async fn update_page_content(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
    Json(req): Json<UpdatePageContentRequest>,
) -> ApiResult<Json<PageResponse>> {
    // Fetch page from database
    let mut page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Update content
    page.update_html_content(req.html_content);
    page.update_css_content(req.css_content);

    if let Some(js) = req.js_content {
        page.update_js_content(js);
    }

    // Update timestamp
    page.updated_at = chrono::Utc::now();

    // Save to database
    let updated_page = state
        .db
        .pages()
        .update(&page)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Updated page content: {}", page_id);

    Ok(Json(PageResponse::from(updated_page)))
}

/// Publish a page
///
/// POST /api/v1/pages/:id/publish
pub async fn publish_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<Json<PageResponse>> {
    // Fetch page from database
    let mut page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Generate published URL
    let published_url = format!("https://example.com/p/{}", page_id);

    // Publish the page
    page.publish(published_url);

    // Save to database
    let updated_page = state
        .db
        .pages()
        .update(&page)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Published page: {}", page_id);

    Ok(Json(PageResponse::from(updated_page)))
}

/// Unpublish a page
///
/// POST /api/v1/pages/:id/unpublish
pub async fn unpublish_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<Json<PageResponse>> {
    // Fetch page from database
    let mut page = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if page.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Unpublish the page
    page.unpublish();

    // Save to database
    let updated_page = state
        .db
        .pages()
        .update(&page)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Unpublished page: {}", page_id);

    Ok(Json(PageResponse::from(updated_page)))
}

/// Duplicate a page
///
/// POST /api/v1/pages/:id/duplicate
pub async fn duplicate_page(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(page_id): Path<Uuid>,
) -> ApiResult<(StatusCode, Json<PageResponse>)> {
    // Fetch original page from database
    let original = state
        .db
        .pages()
        .find_by_id(page_id)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let user_id = user
        .user_id()
        .map_err(|_| ApiError::Unauthorized("Invalid user id in token".to_string()))?;
    if original.user_id != user_id {
        return Err(ApiError::Forbidden(
            "You do not have access to this page".to_string(),
        ));
    }

    // Create duplicate
    let mut duplicate = Page::new(
        original.funnel_id,
        original.user_id,
        format!("{} (Copy)", original.name),
        format!("{}-copy", original.slug),
    );

    // Copy content and settings
    duplicate.title = format!("{} (Copy)", original.title);
    duplicate.page_type = original.page_type;
    duplicate.html_content = original.html_content;
    duplicate.css_content = original.css_content;
    duplicate.js_content = original.js_content;
    duplicate.settings = original.settings;
    duplicate.seo_title = original.seo_title;
    duplicate.seo_description = original.seo_description;
    duplicate.seo_keywords = original.seo_keywords;
    duplicate.og_title = original.og_title;
    duplicate.og_description = original.og_description;
    duplicate.og_image = original.og_image;

    // Save to database
    let created_duplicate = state
        .db
        .pages()
        .create(&duplicate)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    tracing::info!("Duplicated page: {} -> {}", page_id, created_duplicate.id);

    Ok((StatusCode::CREATED, Json(PageResponse::from(created_duplicate))))
}

#[cfg(test)]
mod tests {
    use super::*;
    use clickfunnels_core::{Funnel, PageType};
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
    async fn test_create_page_validation() {
        let state = create_test_state().await;

        let req = CreatePageRequest {
            funnel_id: Uuid::new_v4(),
            name: "".to_string(), // Invalid: empty name
            title: "Test".to_string(),
            slug: "invalid slug!".to_string(), // Invalid: contains space and special char
            page_type: PageType::Landing,
            order_index: 0,
        };

        let result = create_page(State(state), auth_extension(Uuid::new_v4()), Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_create_page_valid() {
        let state = create_test_state().await;

        // First create a funnel
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());
        let created_funnel = state.db.funnels().create(&funnel).await.unwrap();

        let req = CreatePageRequest {
            funnel_id: created_funnel.id,
            name: "Landing Page".to_string(),
            title: "Welcome to My Funnel".to_string(),
            slug: "landing-page".to_string(),
            page_type: PageType::Landing,
            order_index: 0,
        };

        let result = create_page(
            State(state.clone()),
            auth_extension(user_id),
            Json(req),
        )
        .await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.name, "Landing Page");

        // Cleanup
        state.db.pages().delete(response.id).await.ok();
        state.db.funnels().delete(created_funnel.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_publish_unpublish() {
        let state = create_test_state().await;

        // Create test funnel and page
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());
        let created_funnel = state.db.funnels().create(&funnel).await.unwrap();

        let page = Page::new(
            created_funnel.id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );
        let created = state.db.pages().create(&page).await.unwrap();

        // Test publish
        let result = publish_page(
            State(state.clone()),
            auth_extension(user_id),
            Path(created.id),
        )
        .await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.published_at.is_some());

        // Test unpublish
        let result = unpublish_page(
            State(state.clone()),
            auth_extension(user_id),
            Path(created.id),
        )
        .await;
        assert!(result.is_ok());

        // Cleanup
        state.db.pages().delete(created.id).await.ok();
        state.db.funnels().delete(created_funnel.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_duplicate_page() {
        let state = create_test_state().await;

        // Create test funnel and page
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());
        let created_funnel = state.db.funnels().create(&funnel).await.unwrap();

        let page = Page::new(
            created_funnel.id,
            user_id,
            "Original Page".to_string(),
            "original".to_string(),
        );
        let created = state.db.pages().create(&page).await.unwrap();

        let result = duplicate_page(
            State(state.clone()),
            auth_extension(user_id),
            Path(created.id),
        )
        .await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);

        // Cleanup
        state.db.pages().delete(created.id).await.ok();
        state.db.pages().delete(response.id).await.ok();
        state.db.funnels().delete(created_funnel.id).await.ok();
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_get_page_stats() {
        let state = create_test_state().await;

        // Create test funnel and page
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());
        let created_funnel = state.db.funnels().create(&funnel).await.unwrap();

        let page = Page::new(
            created_funnel.id,
            user_id,
            "Stats Test".to_string(),
            "stats-test".to_string(),
        );
        let created = state.db.pages().create(&page).await.unwrap();

        let result = get_page_stats(
            State(state.clone()),
            auth_extension(user_id),
            Path(created.id),
        )
        .await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.page_id, created.id);

        // Cleanup
        state.db.pages().delete(created.id).await.ok();
        state.db.funnels().delete(created_funnel.id).await.ok();
    }
}
