//! Core Domain Entities for ClickFunnels
//!
//! This module contains all core domain models for the ClickFunnels system:
//! - User: User accounts with authentication and subscriptions
//! - Funnel: Marketing funnels with conversion tracking
//! - Page: Landing pages with WYSIWYG content and SEO
//! - Integration: Third-party integrations (email, payment, analytics)

pub mod user;
pub mod funnel;
pub mod page;
pub mod integration;

// Re-export entities for convenient access
pub use user::{User, UserStatus, SubscriptionTier};
pub use funnel::{Funnel, FunnelStatus, FunnelType};
pub use page::{Page, PageStatus, PageType};
pub use integration::{Integration, IntegrationStatus, IntegrationType, Provider};
