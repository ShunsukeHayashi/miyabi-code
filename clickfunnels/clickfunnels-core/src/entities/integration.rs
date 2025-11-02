//! Integration Entity - Core domain model for third-party integrations
//!
//! This module defines the Integration entity for managing connections
//! to external services like email providers, payment gateways, and analytics.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Integration type/category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IntegrationType {
    /// Email service providers (SendGrid, Mailgun, AWS SES)
    EmailSmtp,
    /// Payment gateways (Stripe, PayPal, Square)
    PaymentGateway,
    /// Analytics platforms (Google Analytics, Mixpanel)
    Analytics,
    /// CRM systems (Salesforce, HubSpot)
    Crm,
    /// Marketing automation (ActiveCampaign, MailChimp)
    MarketingAutomation,
    /// Webinar platforms (Zoom, GoToWebinar)
    Webinar,
    /// SMS providers (Twilio, Plivo)
    Sms,
    /// Custom webhook integration
    Webhook,
    /// Custom integration
    Custom,
}

/// Integration status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IntegrationStatus {
    /// Active and working
    Active,
    /// Inactive (paused)
    Inactive,
    /// Failed/Error state
    Error,
    /// Testing/Validation in progress
    Testing,
}

impl Default for IntegrationStatus {
    fn default() -> Self {
        Self::Inactive
    }
}

/// Specific provider names
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Provider {
    // Email SMTP
    SendGrid,
    Mailgun,
    AwsSes,
    Postmark,

    // Payment Gateways
    Stripe,
    PayPal,
    Square,
    Braintree,

    // Analytics
    GoogleAnalytics,
    Mixpanel,
    Segment,

    // CRM
    Salesforce,
    HubSpot,
    Pipedrive,

    // Marketing Automation
    ActiveCampaign,
    MailChimp,
    ConvertKit,

    // Webinar
    Zoom,
    GoToWebinar,

    // SMS
    Twilio,
    Plivo,

    // Custom
    Custom(String),
}

/// Integration Entity
///
/// Represents a third-party integration with configuration, credentials,
/// and usage tracking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Integration {
    /// Unique integration identifier
    pub id: Uuid,

    /// User ID who owns this integration
    pub user_id: Uuid,

    /// Integration name (user-defined)
    pub name: String,

    /// Integration type
    pub integration_type: IntegrationType,

    /// Specific provider
    pub provider: Provider,

    /// Integration status
    pub status: IntegrationStatus,

    /// API key or access token (encrypted)
    #[serde(skip_serializing)]
    pub api_key: Option<String>,

    /// API secret (encrypted)
    #[serde(skip_serializing)]
    pub api_secret: Option<String>,

    /// OAuth access token (encrypted)
    #[serde(skip_serializing)]
    pub oauth_access_token: Option<String>,

    /// OAuth refresh token (encrypted)
    #[serde(skip_serializing)]
    pub oauth_refresh_token: Option<String>,

    /// OAuth token expiry
    pub oauth_expires_at: Option<DateTime<Utc>>,

    /// Integration configuration (JSON)
    /// - Webhook URL
    /// - API endpoint
    /// - Custom fields mapping
    #[serde(default)]
    pub config: serde_json::Value,

    /// Integration settings (JSON)
    #[serde(default)]
    pub settings: serde_json::Value,

    /// Number of successful API calls
    pub success_count: i64,

    /// Number of failed API calls
    pub error_count: i64,

    /// Last successful API call timestamp
    pub last_success_at: Option<DateTime<Utc>>,

    /// Last error timestamp
    pub last_error_at: Option<DateTime<Utc>>,

    /// Last error message
    pub last_error_message: Option<String>,

    /// Health check status
    pub is_healthy: bool,

    /// Last health check timestamp
    pub last_health_check_at: Option<DateTime<Utc>>,

    /// Rate limit info (requests per hour)
    pub rate_limit: Option<i32>,

    /// Current rate limit usage
    pub rate_limit_used: i32,

    /// Rate limit reset timestamp
    pub rate_limit_reset_at: Option<DateTime<Utc>>,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

impl Integration {
    /// Create a new Integration with default values
    pub fn new(
        user_id: Uuid,
        name: String,
        integration_type: IntegrationType,
        provider: Provider,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            user_id,
            name,
            integration_type,
            provider,
            status: IntegrationStatus::default(),
            api_key: None,
            api_secret: None,
            oauth_access_token: None,
            oauth_refresh_token: None,
            oauth_expires_at: None,
            config: serde_json::json!({}),
            settings: serde_json::json!({}),
            success_count: 0,
            error_count: 0,
            last_success_at: None,
            last_error_at: None,
            last_error_message: None,
            is_healthy: false,
            last_health_check_at: None,
            rate_limit: None,
            rate_limit_used: 0,
            rate_limit_reset_at: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Check if integration is active
    pub fn is_active(&self) -> bool {
        self.status == IntegrationStatus::Active
    }

    /// Activate the integration
    pub fn activate(&mut self) {
        self.status = IntegrationStatus::Active;
        self.updated_at = Utc::now();
    }

    /// Deactivate the integration
    pub fn deactivate(&mut self) {
        self.status = IntegrationStatus::Inactive;
        self.updated_at = Utc::now();
    }

    /// Set API credentials
    pub fn set_api_credentials(&mut self, api_key: String, api_secret: Option<String>) {
        self.api_key = Some(api_key);
        self.api_secret = api_secret;
        self.updated_at = Utc::now();
    }

    /// Set OAuth tokens
    pub fn set_oauth_tokens(
        &mut self,
        access_token: String,
        refresh_token: Option<String>,
        expires_in_seconds: Option<i64>,
    ) {
        self.oauth_access_token = Some(access_token);
        self.oauth_refresh_token = refresh_token;

        if let Some(expires_in) = expires_in_seconds {
            self.oauth_expires_at = Some(Utc::now() + chrono::Duration::seconds(expires_in));
        }

        self.updated_at = Utc::now();
    }

    /// Check if OAuth token is expired
    pub fn is_oauth_token_expired(&self) -> bool {
        if let Some(expires_at) = self.oauth_expires_at {
            expires_at <= Utc::now()
        } else {
            false
        }
    }

    /// Record successful API call
    pub fn record_success(&mut self) {
        self.success_count += 1;
        self.last_success_at = Some(Utc::now());
        self.is_healthy = true;
        self.updated_at = Utc::now();
    }

    /// Record failed API call
    pub fn record_error(&mut self, error_message: String) {
        self.error_count += 1;
        self.last_error_at = Some(Utc::now());
        self.last_error_message = Some(error_message);
        self.status = IntegrationStatus::Error;
        self.is_healthy = false;
        self.updated_at = Utc::now();
    }

    /// Update health check status
    pub fn update_health_check(&mut self, is_healthy: bool) {
        self.is_healthy = is_healthy;
        self.last_health_check_at = Some(Utc::now());

        if !is_healthy {
            self.status = IntegrationStatus::Error;
        }

        self.updated_at = Utc::now();
    }

    /// Set rate limit
    pub fn set_rate_limit(&mut self, limit: i32, reset_in_seconds: i64) {
        self.rate_limit = Some(limit);
        self.rate_limit_reset_at = Some(Utc::now() + chrono::Duration::seconds(reset_in_seconds));
        self.updated_at = Utc::now();
    }

    /// Increment rate limit usage
    pub fn increment_rate_limit_usage(&mut self) {
        self.rate_limit_used += 1;
        self.updated_at = Utc::now();
    }

    /// Check if rate limit is exceeded
    pub fn is_rate_limit_exceeded(&self) -> bool {
        if let Some(limit) = self.rate_limit {
            self.rate_limit_used >= limit
        } else {
            false
        }
    }

    /// Reset rate limit usage
    pub fn reset_rate_limit_usage(&mut self) {
        self.rate_limit_used = 0;
        self.rate_limit_reset_at = None;
        self.updated_at = Utc::now();
    }

    /// Update configuration
    pub fn update_config(&mut self, config: serde_json::Value) {
        self.config = config;
        self.updated_at = Utc::now();
    }

    /// Update settings
    pub fn update_settings(&mut self, settings: serde_json::Value) {
        self.settings = settings;
        self.updated_at = Utc::now();
    }

    /// Get success rate (percentage)
    pub fn success_rate(&self) -> f64 {
        let total = self.success_count + self.error_count;
        if total > 0 {
            (self.success_count as f64 / total as f64) * 100.0
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_integration() {
        let user_id = Uuid::new_v4();
        let integration = Integration::new(
            user_id,
            "SendGrid Integration".to_string(),
            IntegrationType::EmailSmtp,
            Provider::SendGrid,
        );

        assert_eq!(integration.user_id, user_id);
        assert_eq!(integration.name, "SendGrid Integration");
        assert_eq!(integration.integration_type, IntegrationType::EmailSmtp);
        assert_eq!(integration.provider, Provider::SendGrid);
        assert_eq!(integration.status, IntegrationStatus::Inactive);
        assert_eq!(integration.success_count, 0);
        assert_eq!(integration.error_count, 0);
    }

    #[test]
    fn test_activate_deactivate() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::PaymentGateway,
            Provider::Stripe,
        );

        assert!(!integration.is_active());

        integration.activate();
        assert!(integration.is_active());

        integration.deactivate();
        assert!(!integration.is_active());
    }

    #[test]
    fn test_api_credentials() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::EmailSmtp,
            Provider::SendGrid,
        );

        integration.set_api_credentials(
            "api_key_123".to_string(),
            Some("api_secret_456".to_string()),
        );
        assert_eq!(integration.api_key, Some("api_key_123".to_string()));
        assert_eq!(integration.api_secret, Some("api_secret_456".to_string()));
    }

    #[test]
    fn test_oauth_tokens() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::Analytics,
            Provider::GoogleAnalytics,
        );

        integration.set_oauth_tokens(
            "access_token_abc".to_string(),
            Some("refresh_token_xyz".to_string()),
            Some(3600), // 1 hour
        );

        assert_eq!(
            integration.oauth_access_token,
            Some("access_token_abc".to_string())
        );
        assert!(!integration.is_oauth_token_expired());
    }

    #[test]
    fn test_success_error_tracking() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::PaymentGateway,
            Provider::Stripe,
        );

        // Record 90 successful calls
        for _ in 0..90 {
            integration.record_success();
        }
        assert_eq!(integration.success_count, 90);
        assert!(integration.is_healthy);

        // Record 10 errors
        for i in 0..10 {
            integration.record_error(format!("Error {}", i));
        }
        assert_eq!(integration.error_count, 10);
        assert!(!integration.is_healthy);
        assert_eq!(integration.status, IntegrationStatus::Error);

        // Success rate should be 90%
        assert_eq!(integration.success_rate(), 90.0);
    }

    #[test]
    fn test_rate_limiting() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::EmailSmtp,
            Provider::SendGrid,
        );

        // Set rate limit: 100 requests per hour
        integration.set_rate_limit(100, 3600);
        assert_eq!(integration.rate_limit, Some(100));
        assert!(!integration.is_rate_limit_exceeded());

        // Use 99 requests
        for _ in 0..99 {
            integration.increment_rate_limit_usage();
        }
        assert!(!integration.is_rate_limit_exceeded());

        // 100th request should hit the limit
        integration.increment_rate_limit_usage();
        assert!(integration.is_rate_limit_exceeded());

        // Reset should allow new requests
        integration.reset_rate_limit_usage();
        assert!(!integration.is_rate_limit_exceeded());
        assert_eq!(integration.rate_limit_used, 0);
    }

    #[test]
    fn test_health_check() {
        let user_id = Uuid::new_v4();
        let mut integration = Integration::new(
            user_id,
            "Test Integration".to_string(),
            IntegrationType::Analytics,
            Provider::GoogleAnalytics,
        );

        assert!(!integration.is_healthy);

        integration.update_health_check(true);
        assert!(integration.is_healthy);
        assert!(integration.last_health_check_at.is_some());

        integration.update_health_check(false);
        assert!(!integration.is_healthy);
        assert_eq!(integration.status, IntegrationStatus::Error);
    }
}
