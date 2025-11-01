//! Page API Handlers
//!
//! This module implements HTTP handlers for Page CRUD operations.

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};
use clickfunnels_core::Page;
use uuid::Uuid;
// use validator::Validate; // TODO: Re-enable when validator is fixed

use crate::{
    dto::page::{
        CreatePageRequest, DetailedPageResponse, ListPagesQuery, PageResponse, PageStatsResponse,
        PaginatedPagesResponse, UpdatePageContentRequest, UpdatePageRequest,
    },
    error::{ApiError, ApiResult},
};

/// Create a new page
///
/// POST /api/v1/pages
pub async fn create_page(
    Json(req): Json<CreatePageRequest>,
) -> ApiResult<(StatusCode, Json<PageResponse>)> {
    // Validate request
    req.validate()
        .map_err(ApiError::ValidationError)?;

    // TODO: Get user_id from authentication context
    let user_id = Uuid::new_v4();

    // TODO: Validate funnel exists and belongs to user

    // Check slug uniqueness within funnel
    // TODO: Validate slug is unique within funnel

    // Create page entity
    let mut page = Page::new(req.funnel_id, user_id, req.name.clone(), req.slug.clone());
    page.title = req.title;
    page.page_type = req.page_type;
    page.order_index = req.order_index;

    // TODO: Save to database
    tracing::info!("Created page: {} in funnel: {}", page.id, page.funnel_id);

    let response = PageResponse::from(page);
    Ok((StatusCode::CREATED, Json(response)))
}

/// Get page by ID
///
/// GET /api/v1/pages/:id
pub async fn get_page(Path(page_id): Path<Uuid>) -> ApiResult<Json<DetailedPageResponse>> {
    // TODO: Fetch from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let page = Page::new(
        funnel_id,
        user_id,
        "Mock Page".to_string(),
        format!("page-{}", page_id),
    );

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
    Path(page_id): Path<Uuid>,
    Json(req): Json<UpdatePageRequest>,
) -> ApiResult<Json<PageResponse>> {
    // Validate request
    // TODO: Fix validator derive macro
    // req.validate()
    //     .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // TODO: Fetch page from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let mut page = Page::new(funnel_id, user_id, "Mock Page".to_string(), "mock-page".to_string());

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

    // TODO: Save to database
    tracing::info!("Updated page: {}", page_id);

    Ok(Json(PageResponse::from(page)))
}

/// Delete page by ID
///
/// DELETE /api/v1/pages/:id
pub async fn delete_page(Path(page_id): Path<Uuid>) -> ApiResult<StatusCode> {
    // TODO: Fetch page from database and mark as archived
    tracing::info!("Deleted page: {}", page_id);

    Ok(StatusCode::NO_CONTENT)
}

/// List pages with pagination and filters
///
/// GET /api/v1/pages
pub async fn list_pages(
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

    // TODO: Fetch from database with filters
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let mock_pages = vec![
        Page::new(
            funnel_id,
            user_id,
            "Landing Page".to_string(),
            "landing".to_string(),
        ),
        Page::new(
            funnel_id,
            user_id,
            "Thank You Page".to_string(),
            "thank-you".to_string(),
        ),
    ];

    let total = mock_pages.len() as i64;
    let total_pages = ((total as f64) / (query.page_size as f64)).ceil() as i32;

    let pages: Vec<PageResponse> = mock_pages.into_iter().map(PageResponse::from).collect();

    tracing::info!(
        "Listed pages: page={}, page_size={}",
        query.page,
        query.page_size
    );

    Ok(Json(PaginatedPagesResponse {
        pages,
        total,
        page: query.page,
        page_size: query.page_size,
        total_pages,
    }))
}

/// Get page statistics
///
/// GET /api/v1/pages/:id/stats
pub async fn get_page_stats(Path(page_id): Path<Uuid>) -> ApiResult<Json<PageStatsResponse>> {
    // TODO: Fetch page and calculate stats from database
    let stats = PageStatsResponse {
        page_id,
        total_visits: 500,
        unique_visits: 380,
        total_conversions: 45,
        conversion_rate: 9.0,
        average_time_on_page: Some(65.5),
        bounce_rate: Some(35.2),
    };

    tracing::info!("Fetched page stats: {}", page_id);

    Ok(Json(stats))
}

/// Update page content (HTML/CSS/JS)
///
/// PUT /api/v1/pages/:id/content
pub async fn update_page_content(
    Path(page_id): Path<Uuid>,
    Json(req): Json<UpdatePageContentRequest>,
) -> ApiResult<Json<PageResponse>> {
    // Validate request
    // TODO: Fix validator derive macro
    // req.validate()
    //     .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // TODO: Fetch page from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let mut page = Page::new(funnel_id, user_id, "Mock Page".to_string(), "mock-page".to_string());

    // Update content
    page.update_html_content(req.html_content);
    page.update_css_content(req.css_content);

    if let Some(js) = req.js_content {
        page.update_js_content(js);
    }

    // TODO: Save to database
    tracing::info!("Updated page content: {}", page_id);

    Ok(Json(PageResponse::from(page)))
}

/// Publish a page
///
/// POST /api/v1/pages/:id/publish
pub async fn publish_page(Path(page_id): Path<Uuid>) -> ApiResult<Json<PageResponse>> {
    // TODO: Fetch page from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let mut page = Page::new(funnel_id, user_id, "Mock Page".to_string(), "mock-page".to_string());

    // Generate published URL
    let published_url = format!("https://example.com/p/{}", page_id);

    // Publish the page
    page.publish(published_url);

    // TODO: Save to database
    tracing::info!("Published page: {}", page_id);

    Ok(Json(PageResponse::from(page)))
}

/// Unpublish a page
///
/// POST /api/v1/pages/:id/unpublish
pub async fn unpublish_page(Path(page_id): Path<Uuid>) -> ApiResult<Json<PageResponse>> {
    // TODO: Fetch page from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let mut page = Page::new(funnel_id, user_id, "Mock Page".to_string(), "mock-page".to_string());

    // Unpublish the page
    page.unpublish();

    // TODO: Save to database
    tracing::info!("Unpublished page: {}", page_id);

    Ok(Json(PageResponse::from(page)))
}

/// Duplicate a page
///
/// POST /api/v1/pages/:id/duplicate
pub async fn duplicate_page(Path(page_id): Path<Uuid>) -> ApiResult<(StatusCode, Json<PageResponse>)> {
    // TODO: Fetch page from database
    let funnel_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let original = Page::new(
        funnel_id,
        user_id,
        "Original Page".to_string(),
        "original".to_string(),
    );

    // Create duplicate
    let mut duplicate = Page::new(
        original.funnel_id,
        original.user_id,
        format!("{} (Copy)", original.name),
        format!("{}-copy", original.slug),
    );

    // Copy content
    duplicate.html_content = original.html_content;
    duplicate.css_content = original.css_content;
    duplicate.js_content = original.js_content;
    duplicate.settings = original.settings;

    // TODO: Save to database
    tracing::info!("Duplicated page: {} -> {}", page_id, duplicate.id);

    Ok((StatusCode::CREATED, Json(PageResponse::from(duplicate))))
}

#[cfg(test)]
mod tests {
    use super::*;
    use clickfunnels_core::PageType;

    #[tokio::test]
    async fn test_create_page_validation() {
        let req = CreatePageRequest {
            funnel_id: Uuid::new_v4(),
            name: "".to_string(), // Invalid: empty name
            title: "Test".to_string(),
            slug: "invalid slug!".to_string(), // Invalid: contains space and special char
            page_type: PageType::Landing,
            order_index: 0,
        };

        let result = create_page(Json(req)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_page_valid() {
        let req = CreatePageRequest {
            funnel_id: Uuid::new_v4(),
            name: "Landing Page".to_string(),
            title: "Welcome to My Funnel".to_string(),
            slug: "landing-page".to_string(),
            page_type: PageType::Landing,
            order_index: 0,
        };

        let result = create_page(Json(req)).await;
        assert!(result.is_ok());

        let (status, response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(response.name, "Landing Page");
    }

    #[tokio::test]
    async fn test_get_page() {
        let page_id = Uuid::new_v4();
        let result = get_page(Path(page_id)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_publish_unpublish() {
        let page_id = Uuid::new_v4();

        // Test publish
        let result = publish_page(Path(page_id)).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.published_at.is_some());

        // Test unpublish
        let result = unpublish_page(Path(page_id)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_duplicate_page() {
        let page_id = Uuid::new_v4();
        let result = duplicate_page(Path(page_id)).await;
        assert!(result.is_ok());

        let (status, _response) = result.unwrap();
        assert_eq!(status, StatusCode::CREATED);
    }

    #[tokio::test]
    async fn test_get_page_stats() {
        let page_id = Uuid::new_v4();
        let result = get_page_stats(Path(page_id)).await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.page_id, page_id);
    }
}
