//! Page Entity - Core domain model for ClickFunnels landing pages
//!
//! This module defines the Page entity representing individual pages within a funnel
//! with WYSIWYG content, SEO optimization, and conversion tracking.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Page type/purpose
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PageType {
    /// Landing/Squeeze page for lead capture
    Landing,
    /// Sales page for product presentation
    Sales,
    /// Order/Checkout page
    Checkout,
    /// Upsell page
    Upsell,
    /// Downsell page
    Downsell,
    /// Thank you/Confirmation page
    ThankYou,
    /// Webinar registration page
    Webinar,
    /// Membership login page
    Membership,
    /// Custom page type
    Custom,
}

impl Default for PageType {
    fn default() -> Self {
        Self::Landing
    }
}

/// Page status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PageStatus {
    /// Draft page (not published)
    Draft,
    /// Published and active
    Published,
    /// Archived (inactive)
    Archived,
}

impl Default for PageStatus {
    fn default() -> Self {
        Self::Draft
    }
}

/// Page Entity
///
/// Represents a single page within a funnel with WYSIWYG content,
/// conversion tracking, and A/B testing support.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    /// Unique page identifier
    pub id: Uuid,

    /// Funnel ID this page belongs to
    pub funnel_id: Uuid,

    /// User ID who owns this page
    pub user_id: Uuid,

    /// Page name (internal)
    pub name: String,

    /// Page title (displayed in browser)
    pub title: String,

    /// Page slug (URL path)
    pub slug: String,

    /// Page type
    pub page_type: PageType,

    /// Page status
    pub status: PageStatus,

    /// Page order/sequence in funnel
    pub order_index: i32,

    /// HTML content (from WYSIWYG editor like GrapeJS)
    pub html_content: String,

    /// CSS styles
    pub css_content: String,

    /// JavaScript code
    pub js_content: Option<String>,

    /// Page settings (JSON) - colors, fonts, layout config
    #[serde(default)]
    pub settings: serde_json::Value,

    /// SEO metadata
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,

    /// Open Graph metadata for social sharing
    pub og_title: Option<String>,
    pub og_description: Option<String>,
    pub og_image: Option<String>,

    /// Analytics
    pub total_visits: i64,
    pub unique_visits: i64,
    pub total_conversions: i64,
    pub conversion_rate: f64,

    /// A/B Testing
    pub is_ab_test_variant: bool,
    pub ab_test_group_id: Option<Uuid>,
    pub ab_test_weight: Option<i32>,

    /// Custom CSS/JS injection
    pub custom_head_code: Option<String>,
    pub custom_footer_code: Option<String>,

    /// Page preview URL
    pub preview_url: Option<String>,

    /// Published URL
    pub published_url: Option<String>,

    /// Published at timestamp
    pub published_at: Option<DateTime<Utc>>,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

impl Page {
    /// Create a new Page with default values
    pub fn new(funnel_id: Uuid, user_id: Uuid, name: String, slug: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            funnel_id,
            user_id,
            name: name.clone(),
            title: name,
            slug,
            page_type: PageType::default(),
            status: PageStatus::default(),
            order_index: 0,
            html_content: String::new(),
            css_content: String::new(),
            js_content: None,
            settings: serde_json::json!({}),
            seo_title: None,
            seo_description: None,
            seo_keywords: None,
            og_title: None,
            og_description: None,
            og_image: None,
            total_visits: 0,
            unique_visits: 0,
            total_conversions: 0,
            conversion_rate: 0.0,
            is_ab_test_variant: false,
            ab_test_group_id: None,
            ab_test_weight: None,
            custom_head_code: None,
            custom_footer_code: None,
            preview_url: None,
            published_url: None,
            published_at: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Check if page is published
    pub fn is_published(&self) -> bool {
        self.status == PageStatus::Published
    }

    /// Check if page is draft
    pub fn is_draft(&self) -> bool {
        self.status == PageStatus::Draft
    }

    /// Publish the page
    pub fn publish(&mut self, published_url: String) {
        self.status = PageStatus::Published;
        self.published_url = Some(published_url);
        self.published_at = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    /// Unpublish (revert to draft)
    pub fn unpublish(&mut self) {
        self.status = PageStatus::Draft;
        self.updated_at = Utc::now();
    }

    /// Archive the page
    pub fn archive(&mut self) {
        self.status = PageStatus::Archived;
        self.updated_at = Utc::now();
    }

    /// Update HTML content
    pub fn update_html_content(&mut self, html: String) {
        self.html_content = html;
        self.updated_at = Utc::now();
    }

    /// Update CSS content
    pub fn update_css_content(&mut self, css: String) {
        self.css_content = css;
        self.updated_at = Utc::now();
    }

    /// Update JavaScript content
    pub fn update_js_content(&mut self, js: String) {
        self.js_content = Some(js);
        self.updated_at = Utc::now();
    }

    /// Record a visit
    pub fn record_visit(&mut self, is_unique: bool) {
        self.total_visits += 1;
        if is_unique {
            self.unique_visits += 1;
        }
        self.updated_at = Utc::now();
    }

    /// Record a conversion
    pub fn record_conversion(&mut self) {
        self.total_conversions += 1;
        self.update_conversion_rate();
        self.updated_at = Utc::now();
    }

    /// Update conversion rate
    fn update_conversion_rate(&mut self) {
        if self.total_visits > 0 {
            self.conversion_rate =
                (self.total_conversions as f64 / self.total_visits as f64) * 100.0;
        } else {
            self.conversion_rate = 0.0;
        }
    }

    /// Set SEO metadata
    pub fn set_seo_metadata(
        &mut self,
        title: String,
        description: String,
        keywords: Option<String>,
    ) {
        self.seo_title = Some(title);
        self.seo_description = Some(description);
        self.seo_keywords = keywords;
        self.updated_at = Utc::now();
    }

    /// Set Open Graph metadata
    pub fn set_og_metadata(&mut self, title: String, description: String, image: Option<String>) {
        self.og_title = Some(title);
        self.og_description = Some(description);
        self.og_image = image;
        self.updated_at = Utc::now();
    }

    /// Enable A/B testing
    pub fn enable_ab_testing(&mut self, group_id: Uuid, weight: i32) {
        self.is_ab_test_variant = true;
        self.ab_test_group_id = Some(group_id);
        self.ab_test_weight = Some(weight);
        self.updated_at = Utc::now();
    }

    /// Disable A/B testing
    pub fn disable_ab_testing(&mut self) {
        self.is_ab_test_variant = false;
        self.ab_test_group_id = None;
        self.ab_test_weight = None;
        self.updated_at = Utc::now();
    }

    /// Update page settings
    pub fn update_settings(&mut self, settings: serde_json::Value) {
        self.settings = settings;
        self.updated_at = Utc::now();
    }

    /// Set custom head code
    pub fn set_custom_head_code(&mut self, code: String) {
        self.custom_head_code = Some(code);
        self.updated_at = Utc::now();
    }

    /// Set custom footer code
    pub fn set_custom_footer_code(&mut self, code: String) {
        self.custom_footer_code = Some(code);
        self.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_page() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let page = Page::new(
            funnel_id,
            user_id,
            "Landing Page".to_string(),
            "landing".to_string(),
        );

        assert_eq!(page.funnel_id, funnel_id);
        assert_eq!(page.user_id, user_id);
        assert_eq!(page.name, "Landing Page");
        assert_eq!(page.slug, "landing");
        assert_eq!(page.status, PageStatus::Draft);
        assert_eq!(page.page_type, PageType::Landing);
        assert_eq!(page.total_visits, 0);
    }

    #[test]
    fn test_publish_unpublish() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        assert!(page.is_draft());
        assert!(!page.is_published());

        page.publish("https://example.com/test".to_string());
        assert!(page.is_published());
        assert_eq!(
            page.published_url,
            Some("https://example.com/test".to_string())
        );

        page.unpublish();
        assert!(page.is_draft());
    }

    #[test]
    fn test_update_content() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        page.update_html_content("<h1>Hello World</h1>".to_string());
        assert_eq!(page.html_content, "<h1>Hello World</h1>");

        page.update_css_content("body { margin: 0; }".to_string());
        assert_eq!(page.css_content, "body { margin: 0; }");

        page.update_js_content("console.log('test');".to_string());
        assert_eq!(page.js_content, Some("console.log('test');".to_string()));
    }

    #[test]
    fn test_conversion_tracking() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        // Record 200 visits (150 unique)
        for i in 0..200 {
            page.record_visit(i < 150);
        }
        assert_eq!(page.total_visits, 200);
        assert_eq!(page.unique_visits, 150);

        // Record 40 conversions (20% conversion rate)
        for _ in 0..40 {
            page.record_conversion();
        }
        assert_eq!(page.total_conversions, 40);
        assert_eq!(page.conversion_rate, 20.0);
    }

    #[test]
    fn test_seo_metadata() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        page.set_seo_metadata(
            "SEO Title".to_string(),
            "SEO Description".to_string(),
            Some("keyword1,keyword2".to_string()),
        );

        assert_eq!(page.seo_title, Some("SEO Title".to_string()));
        assert_eq!(page.seo_description, Some("SEO Description".to_string()));
        assert_eq!(page.seo_keywords, Some("keyword1,keyword2".to_string()));
    }

    #[test]
    fn test_ab_testing() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        assert!(!page.is_ab_test_variant);

        let group_id = Uuid::new_v4();
        page.enable_ab_testing(group_id, 50);
        assert!(page.is_ab_test_variant);
        assert_eq!(page.ab_test_group_id, Some(group_id));
        assert_eq!(page.ab_test_weight, Some(50));

        page.disable_ab_testing();
        assert!(!page.is_ab_test_variant);
        assert!(page.ab_test_group_id.is_none());
    }

    #[test]
    fn test_custom_code_injection() {
        let funnel_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let mut page = Page::new(
            funnel_id,
            user_id,
            "Test Page".to_string(),
            "test".to_string(),
        );

        page.set_custom_head_code("<script>console.log('head');</script>".to_string());
        page.set_custom_footer_code("<script>console.log('footer');</script>".to_string());

        assert!(page.custom_head_code.is_some());
        assert!(page.custom_footer_code.is_some());
    }
}
