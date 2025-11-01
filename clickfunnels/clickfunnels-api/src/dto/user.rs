//! User API DTOs (Data Transfer Objects)
//!
//! This module defines request and response types for User API endpoints.

use chrono::{DateTime, Utc};
use clickfunnels_core::{SubscriptionTier, UserStatus};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Create User Request
#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,

    #[validate(length(min = 1, max = 100, message = "Full name must be 1-100 characters"))]
    pub full_name: String,

    #[validate(length(max = 100))]
    pub company_name: Option<String>,
}

/// Update User Request
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100))]
    pub full_name: Option<String>,

    #[validate(length(max = 100))]
    pub company_name: Option<String>,

    pub subscription_tier: Option<SubscriptionTier>,
}

/// User Response
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
    pub company_name: Option<String>,
    pub subscription_tier: SubscriptionTier,
    pub status: UserStatus,
    pub email_verified: bool,
    pub funnels_count: i32,
    pub pages_count: i32,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<clickfunnels_core::User> for UserResponse {
    fn from(user: clickfunnels_core::User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            company_name: user.company_name,
            subscription_tier: user.subscription_tier,
            status: user.status,
            email_verified: user.email_verified,
            funnels_count: user.funnels_count,
            pages_count: user.pages_count,
            last_login_at: user.last_login_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

/// List Users Query Parameters
#[derive(Debug, Deserialize)]
pub struct ListUsersQuery {
    #[serde(default = "default_page")]
    pub page: i32,

    #[serde(default = "default_page_size")]
    pub page_size: i32,

    pub status: Option<UserStatus>,
    pub subscription_tier: Option<SubscriptionTier>,
}

fn default_page() -> i32 {
    1
}

fn default_page_size() -> i32 {
    20
}

/// Paginated Users Response
#[derive(Debug, Serialize)]
pub struct PaginatedUsersResponse {
    pub users: Vec<UserResponse>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}
