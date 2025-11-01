//! Page API DTOs (Data Transfer Objects)
//!
//! This module defines request and response types for Page API endpoints.

use chrono::{DateTime, Utc};
use clickfunnels_core::{PageStatus, PageType};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Create Page Request
#[derive(Debug, Deserialize, Validate)]
pub struct CreatePageRequest {
    pub funnel_id: Uuid,

    #[validate(length(min = 1, max = 200, message = "Name must be 1-200 characters"))]
    pub name: String,

    #[validate(length(min = 1, max = 200, message = "Title must be 1-200 characters"))]
    pub title: String,

    #[validate(length(min = 1, max = 100, message = "Slug must be 1-100 characters"))]
    #[validate(regex(path = "SLUG_REGEX", message = "Slug must be URL-friendly"))]
    pub slug: String,

    pub page_type: PageType,

    #[serde(default)]
    pub order_index: i32,
}

lazy_static::lazy_static! {
    static ref SLUG_REGEX: regex::Regex = regex::Regex::new(r"^[a-z0-9-]+$").unwrap();
}

/// Update Page Request
#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePageRequest {
    #[validate(length(min = 1, max = 200))]
    pub name: Option<String>,

    #[validate(length(min = 1, max = 200))]
    pub title: Option<String>,

    pub page_type: Option<PageType>,
    pub status: Option<PageStatus>,
    pub order_index: Option<i32>,

    pub html_content: Option<String>,
    pub css_content: Option<String>,
    pub js_content: Option<String>,

    pub settings: Option<serde_json::Value>,

    // SEO fields
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,

    // Open Graph fields
    pub og_title: Option<String>,
    pub og_description: Option<String>,
    pub og_image: Option<String>,

    // A/B Testing
    pub is_ab_test_variant: Option<bool>,
    pub ab_test_group_id: Option<Uuid>,
    pub ab_test_weight: Option<i32>,

    // Custom code
    pub custom_head_code: Option<String>,
    pub custom_footer_code: Option<String>,
}

/// Page Response
#[derive(Debug, Serialize)]
pub struct PageResponse {
    pub id: Uuid,
    pub funnel_id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub title: String,
    pub slug: String,
    pub page_type: PageType,
    pub status: PageStatus,
    pub order_index: i32,
    pub total_visits: i64,
    pub unique_visits: i64,
    pub total_conversions: i64,
    pub conversion_rate: f64,
    pub is_ab_test_variant: bool,
    pub published_url: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<clickfunnels_core::Page> for PageResponse {
    fn from(page: clickfunnels_core::Page) -> Self {
        Self {
            id: page.id,
            funnel_id: page.funnel_id,
            user_id: page.user_id,
            name: page.name,
            title: page.title,
            slug: page.slug,
            page_type: page.page_type,
            status: page.status,
            order_index: page.order_index,
            total_visits: page.total_visits,
            unique_visits: page.unique_visits,
            total_conversions: page.total_conversions,
            conversion_rate: page.conversion_rate,
            is_ab_test_variant: page.is_ab_test_variant,
            published_url: page.published_url,
            published_at: page.published_at,
            created_at: page.created_at,
            updated_at: page.updated_at,
        }
    }
}

/// Detailed Page Response (includes content)
#[derive(Debug, Serialize)]
pub struct DetailedPageResponse {
    #[serde(flatten)]
    pub page: PageResponse,
    pub html_content: String,
    pub css_content: String,
    pub js_content: Option<String>,
    pub settings: serde_json::Value,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,
    pub og_title: Option<String>,
    pub og_description: Option<String>,
    pub og_image: Option<String>,
}

/// List Pages Query Parameters
#[derive(Debug, Deserialize)]
pub struct ListPagesQuery {
    #[serde(default = "default_page")]
    pub page: i32,

    #[serde(default = "default_page_size")]
    pub page_size: i32,

    pub funnel_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub status: Option<PageStatus>,
    pub page_type: Option<PageType>,
}

fn default_page() -> i32 {
    1
}

fn default_page_size() -> i32 {
    20
}

/// Paginated Pages Response
#[derive(Debug, Serialize)]
pub struct PaginatedPagesResponse {
    pub pages: Vec<PageResponse>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}

/// Page Statistics Response
#[derive(Debug, Serialize)]
pub struct PageStatsResponse {
    pub page_id: Uuid,
    pub total_visits: i64,
    pub unique_visits: i64,
    pub total_conversions: i64,
    pub conversion_rate: f64,
    pub average_time_on_page: Option<f64>, // seconds
    pub bounce_rate: Option<f64>,          // percentage
}

/// Update Page Content Request
#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePageContentRequest {
    pub html_content: String,
    pub css_content: String,
    pub js_content: Option<String>,
}
