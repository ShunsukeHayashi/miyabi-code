//! Analytics Integration Module
//!
//! Provides analytics tracking capabilities through:
//! - Google Analytics 4 (GA4)
//! - Mixpanel (future)
//! - Segment (future)

pub mod ga4;
pub mod types;

pub use types::{
    AnalyticsProvider, AnalyticsConfig, AnalyticsEvent,
    EventParameter, AnalyticsResult, AnalyticsError,
};

use async_trait::async_trait;

/// Analytics Client trait
#[async_trait]
pub trait AnalyticsClient: Send + Sync {
    /// Track an event
    async fn track_event(&self, event: &AnalyticsEvent) -> AnalyticsResult<()>;

    /// Track a page view
    async fn track_page_view(&self, page_path: &str, page_title: &str) -> AnalyticsResult<()>;

    /// Track a conversion
    async fn track_conversion(
        &self,
        conversion_name: &str,
        value: Option<f64>,
        currency: Option<&str>,
    ) -> AnalyticsResult<()>;

    /// Get provider name
    fn provider_name(&self) -> &str;
}

/// Create an analytics client based on the provider type
pub fn create_analytics_client(config: AnalyticsConfig) -> AnalyticsResult<Box<dyn AnalyticsClient>> {
    match config.provider {
        AnalyticsProvider::GoogleAnalytics4 => {
            let client = ga4::GA4Client::new(
                config.measurement_id,
                config.api_secret.ok_or_else(|| {
                    AnalyticsError::ConfigError("GA4 requires API secret".to_string())
                })?,
            )?;
            Ok(Box::new(client))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_ga4_client() {
        let config = AnalyticsConfig {
            provider: AnalyticsProvider::GoogleAnalytics4,
            measurement_id: "G-XXXXXXXXXX".to_string(),
            api_secret: Some("secret123".to_string()),
        };

        let result = create_analytics_client(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_create_ga4_client_missing_api_secret() {
        let config = AnalyticsConfig {
            provider: AnalyticsProvider::GoogleAnalytics4,
            measurement_id: "G-XXXXXXXXXX".to_string(),
            api_secret: None,
        };

        let result = create_analytics_client(config);
        assert!(result.is_err());
    }
}
