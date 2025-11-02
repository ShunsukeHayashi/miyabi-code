//! Funnel Entity - Core domain model for ClickFunnels marketing funnels
//!
//! This module defines the Funnel entity representing a complete sales funnel
//! with pages, integrations, and conversion tracking.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Funnel status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FunnelStatus {
    /// Draft funnel (not published)
    Draft,
    /// Published and active
    Published,
    /// Archived (inactive but preserved)
    Archived,
}

impl Default for FunnelStatus {
    fn default() -> Self {
        Self::Draft
    }
}

/// Funnel type based on goal
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FunnelType {
    /// Lead generation funnel
    LeadGeneration,
    /// Product sales funnel
    Sales,
    /// Webinar registration funnel
    Webinar,
    /// Application/Survey funnel
    Application,
    /// Membership site funnel
    Membership,
    /// Custom funnel type
    Custom,
}

impl Default for FunnelType {
    fn default() -> Self {
        Self::LeadGeneration
    }
}

/// Funnel Entity
///
/// Represents a marketing funnel with multiple pages, conversion tracking,
/// and integration settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Funnel {
    /// Unique funnel identifier
    pub id: Uuid,

    /// User ID who owns this funnel
    pub user_id: Uuid,

    /// Funnel name
    pub name: String,

    /// Funnel description
    pub description: Option<String>,

    /// Funnel type
    pub funnel_type: FunnelType,

    /// Funnel status
    pub status: FunnelStatus,

    /// Funnel slug (for URL generation)
    pub slug: String,

    /// Custom domain (optional)
    pub custom_domain: Option<String>,

    /// Number of pages in this funnel
    pub pages_count: i32,

    /// Total visits across all pages
    pub total_visits: i64,

    /// Total conversions (leads/sales)
    pub total_conversions: i64,

    /// Conversion rate (percentage)
    pub conversion_rate: f64,

    /// Total revenue generated (in cents)
    pub total_revenue: i64,

    /// Currency code (ISO 4217)
    pub currency: String,

    /// Google Analytics tracking ID
    pub ga_tracking_id: Option<String>,

    /// Facebook Pixel ID
    pub fb_pixel_id: Option<String>,

    /// SMTP integration ID for email notifications
    pub smtp_integration_id: Option<Uuid>,

    /// Payment gateway integration ID
    pub payment_integration_id: Option<Uuid>,

    /// Funnel settings (JSON)
    #[serde(default)]
    pub settings: serde_json::Value,

    /// SEO metadata (JSON)
    #[serde(default)]
    pub seo_metadata: serde_json::Value,

    /// Published at timestamp
    pub published_at: Option<DateTime<Utc>>,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

impl Funnel {
    /// Create a new Funnel with default values
    pub fn new(user_id: Uuid, name: String, slug: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            user_id,
            name,
            description: None,
            funnel_type: FunnelType::default(),
            status: FunnelStatus::default(),
            slug,
            custom_domain: None,
            pages_count: 0,
            total_visits: 0,
            total_conversions: 0,
            conversion_rate: 0.0,
            total_revenue: 0,
            currency: "USD".to_string(),
            ga_tracking_id: None,
            fb_pixel_id: None,
            smtp_integration_id: None,
            payment_integration_id: None,
            settings: serde_json::json!({}),
            seo_metadata: serde_json::json!({}),
            published_at: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Check if funnel is published
    pub fn is_published(&self) -> bool {
        self.status == FunnelStatus::Published
    }

    /// Check if funnel is draft
    pub fn is_draft(&self) -> bool {
        self.status == FunnelStatus::Draft
    }

    /// Publish the funnel
    pub fn publish(&mut self) {
        self.status = FunnelStatus::Published;
        self.published_at = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    /// Unpublish (revert to draft)
    pub fn unpublish(&mut self) {
        self.status = FunnelStatus::Draft;
        self.updated_at = Utc::now();
    }

    /// Archive the funnel
    pub fn archive(&mut self) {
        self.status = FunnelStatus::Archived;
        self.updated_at = Utc::now();
    }

    /// Increment pages count
    pub fn increment_pages_count(&mut self) {
        self.pages_count += 1;
        self.updated_at = Utc::now();
    }

    /// Decrement pages count
    pub fn decrement_pages_count(&mut self) {
        if self.pages_count > 0 {
            self.pages_count -= 1;
            self.updated_at = Utc::now();
        }
    }

    /// Record a visit
    pub fn record_visit(&mut self) {
        self.total_visits += 1;
        self.updated_at = Utc::now();
    }

    /// Record a conversion
    pub fn record_conversion(&mut self) {
        self.total_conversions += 1;
        self.update_conversion_rate();
        self.updated_at = Utc::now();
    }

    /// Record revenue (amount in cents)
    pub fn record_revenue(&mut self, amount: i64) {
        self.total_revenue += amount;
        self.updated_at = Utc::now();
    }

    /// Update conversion rate based on visits and conversions
    fn update_conversion_rate(&mut self) {
        if self.total_visits > 0 {
            self.conversion_rate =
                (self.total_conversions as f64 / self.total_visits as f64) * 100.0;
        } else {
            self.conversion_rate = 0.0;
        }
    }

    /// Set custom domain
    pub fn set_custom_domain(&mut self, domain: String) {
        self.custom_domain = Some(domain);
        self.updated_at = Utc::now();
    }

    /// Remove custom domain
    pub fn remove_custom_domain(&mut self) {
        self.custom_domain = None;
        self.updated_at = Utc::now();
    }

    /// Set SMTP integration
    pub fn set_smtp_integration(&mut self, integration_id: Uuid) {
        self.smtp_integration_id = Some(integration_id);
        self.updated_at = Utc::now();
    }

    /// Set payment integration
    pub fn set_payment_integration(&mut self, integration_id: Uuid) {
        self.payment_integration_id = Some(integration_id);
        self.updated_at = Utc::now();
    }

    /// Update settings
    pub fn update_settings(&mut self, settings: serde_json::Value) {
        self.settings = settings;
        self.updated_at = Utc::now();
    }

    /// Update SEO metadata
    pub fn update_seo_metadata(&mut self, metadata: serde_json::Value) {
        self.seo_metadata = metadata;
        self.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_funnel() {
        let user_id = Uuid::new_v4();
        let funnel = Funnel::new(
            user_id,
            "My Sales Funnel".to_string(),
            "my-sales-funnel".to_string(),
        );

        assert_eq!(funnel.user_id, user_id);
        assert_eq!(funnel.name, "My Sales Funnel");
        assert_eq!(funnel.slug, "my-sales-funnel");
        assert_eq!(funnel.status, FunnelStatus::Draft);
        assert_eq!(funnel.funnel_type, FunnelType::LeadGeneration);
        assert_eq!(funnel.pages_count, 0);
        assert_eq!(funnel.total_visits, 0);
        assert_eq!(funnel.total_conversions, 0);
    }

    #[test]
    fn test_publish_unpublish() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        assert!(funnel.is_draft());
        assert!(!funnel.is_published());

        funnel.publish();
        assert!(funnel.is_published());
        assert!(!funnel.is_draft());
        assert!(funnel.published_at.is_some());

        funnel.unpublish();
        assert!(funnel.is_draft());
        assert!(!funnel.is_published());
    }

    #[test]
    fn test_archive() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        funnel.archive();
        assert_eq!(funnel.status, FunnelStatus::Archived);
    }

    #[test]
    fn test_pages_count() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        assert_eq!(funnel.pages_count, 0);

        funnel.increment_pages_count();
        assert_eq!(funnel.pages_count, 1);

        funnel.increment_pages_count();
        assert_eq!(funnel.pages_count, 2);

        funnel.decrement_pages_count();
        assert_eq!(funnel.pages_count, 1);
    }

    #[test]
    fn test_conversion_tracking() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        // Record 100 visits
        for _ in 0..100 {
            funnel.record_visit();
        }
        assert_eq!(funnel.total_visits, 100);

        // Record 25 conversions (25% conversion rate)
        for _ in 0..25 {
            funnel.record_conversion();
        }
        assert_eq!(funnel.total_conversions, 25);
        assert_eq!(funnel.conversion_rate, 25.0);
    }

    #[test]
    fn test_revenue_tracking() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        // Record $99.99 (9999 cents)
        funnel.record_revenue(9999);
        assert_eq!(funnel.total_revenue, 9999);

        // Record another $50.00 (5000 cents)
        funnel.record_revenue(5000);
        assert_eq!(funnel.total_revenue, 14999); // Total: $149.99
    }

    #[test]
    fn test_custom_domain() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        assert!(funnel.custom_domain.is_none());

        funnel.set_custom_domain("sales.example.com".to_string());
        assert_eq!(funnel.custom_domain, Some("sales.example.com".to_string()));

        funnel.remove_custom_domain();
        assert!(funnel.custom_domain.is_none());
    }

    #[test]
    fn test_integrations() {
        let user_id = Uuid::new_v4();
        let mut funnel = Funnel::new(user_id, "Test Funnel".to_string(), "test".to_string());

        let smtp_id = Uuid::new_v4();
        let payment_id = Uuid::new_v4();

        funnel.set_smtp_integration(smtp_id);
        assert_eq!(funnel.smtp_integration_id, Some(smtp_id));

        funnel.set_payment_integration(payment_id);
        assert_eq!(funnel.payment_integration_id, Some(payment_id));
    }
}
