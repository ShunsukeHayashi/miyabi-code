//! Funnel API DTOs (Data Transfer Objects)
//!
//! This module defines request and response types for Funnel API endpoints.

use chrono::{DateTime, Utc};
use clickfunnels_core::{FunnelStatus, FunnelType};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

lazy_static::lazy_static! {
    static ref SLUG_REGEX: regex::Regex = regex::Regex::new(r"^[a-z0-9-]+$").unwrap();
}

/// Create Funnel Request
#[derive(Debug, Deserialize)]
pub struct CreateFunnelRequest {
    pub name: String,
    pub description: Option<String>,
    pub funnel_type: FunnelType,
    pub slug: String,
    pub custom_domain: Option<String>,
}

impl CreateFunnelRequest {
    /// Validate the request manually
    pub fn validate(&self) -> Result<(), String> {
        if self.name.is_empty() || self.name.len() > 200 {
            return Err("Name must be 1-200 characters".to_string());
        }

        if let Some(ref desc) = self.description {
            if desc.len() > 1000 {
                return Err("Description must be max 1000 characters".to_string());
            }
        }

        if self.slug.is_empty() || self.slug.len() > 100 {
            return Err("Slug must be 1-100 characters".to_string());
        }

        if !SLUG_REGEX.is_match(&self.slug) {
            return Err("Slug must be URL-friendly (lowercase, hyphens, numbers only)".to_string());
        }

        if let Some(ref domain) = self.custom_domain {
            if domain.len() > 253 {
                return Err("Domain must be max 253 characters".to_string());
            }
        }

        Ok(())
    }
}

/// Update Funnel Request
#[derive(Debug, Deserialize)]
pub struct UpdateFunnelRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub funnel_type: Option<FunnelType>,
    pub status: Option<FunnelStatus>,
    pub custom_domain: Option<String>,
    pub ga_tracking_id: Option<String>,
    pub fb_pixel_id: Option<String>,
    pub smtp_integration_id: Option<Uuid>,
    pub payment_integration_id: Option<Uuid>,
    pub settings: Option<serde_json::Value>,
    pub seo_metadata: Option<serde_json::Value>,
}

impl UpdateFunnelRequest {
    /// Validate the request manually
    pub fn validate(&self) -> Result<(), String> {
        if let Some(ref name) = self.name {
            if name.is_empty() || name.len() > 200 {
                return Err("Name must be 1-200 characters".to_string());
            }
        }

        if let Some(ref desc) = self.description {
            if desc.len() > 1000 {
                return Err("Description must be max 1000 characters".to_string());
            }
        }

        if let Some(ref domain) = self.custom_domain {
            if domain.len() > 253 {
                return Err("Domain must be max 253 characters".to_string());
            }
        }

        Ok(())
    }
}

/// Funnel Response
#[derive(Debug, Serialize)]
pub struct FunnelResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub funnel_type: FunnelType,
    pub status: FunnelStatus,
    pub slug: String,
    pub custom_domain: Option<String>,
    pub pages_count: i32,
    pub total_visits: i64,
    pub total_conversions: i64,
    pub conversion_rate: f64,
    pub total_revenue: i64,
    pub currency: String,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<clickfunnels_core::Funnel> for FunnelResponse {
    fn from(funnel: clickfunnels_core::Funnel) -> Self {
        Self {
            id: funnel.id,
            user_id: funnel.user_id,
            name: funnel.name,
            description: funnel.description,
            funnel_type: funnel.funnel_type,
            status: funnel.status,
            slug: funnel.slug,
            custom_domain: funnel.custom_domain,
            pages_count: funnel.pages_count,
            total_visits: funnel.total_visits,
            total_conversions: funnel.total_conversions,
            conversion_rate: funnel.conversion_rate,
            total_revenue: funnel.total_revenue,
            currency: funnel.currency,
            published_at: funnel.published_at,
            created_at: funnel.created_at,
            updated_at: funnel.updated_at,
        }
    }
}

/// List Funnels Query Parameters
#[derive(Debug, Deserialize)]
pub struct ListFunnelsQuery {
    #[serde(default = "default_page")]
    pub page: i32,

    #[serde(default = "default_page_size")]
    pub page_size: i32,

    pub user_id: Option<Uuid>,
    pub status: Option<FunnelStatus>,
    pub funnel_type: Option<FunnelType>,
}

fn default_page() -> i32 {
    1
}

fn default_page_size() -> i32 {
    20
}

/// Paginated Funnels Response
#[derive(Debug, Serialize)]
pub struct PaginatedFunnelsResponse {
    pub funnels: Vec<FunnelResponse>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}

/// Funnel Statistics Response
#[derive(Debug, Serialize)]
pub struct FunnelStatsResponse {
    pub funnel_id: Uuid,
    pub total_visits: i64,
    pub unique_visits: i64,
    pub total_conversions: i64,
    pub conversion_rate: f64,
    pub total_revenue: i64,
    pub currency: String,
    pub pages_count: i32,
}
