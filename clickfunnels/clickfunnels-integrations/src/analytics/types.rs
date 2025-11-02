//! Analytics Types and Configuration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Analytics provider types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AnalyticsProvider {
    GoogleAnalytics4,
    // Future: Mixpanel, Segment
}

/// Analytics configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsConfig {
    pub provider: AnalyticsProvider,
    pub measurement_id: String,
    pub api_secret: Option<String>,
}

/// Event parameter value
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EventParameter {
    String(String),
    Number(f64),
    Boolean(bool),
}

/// Analytics event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub name: String,
    pub parameters: HashMap<String, EventParameter>,
    pub user_id: Option<String>,
    pub client_id: Option<String>,
    pub timestamp_micros: Option<i64>,
}

impl AnalyticsEvent {
    pub fn new(name: String) -> Self {
        Self {
            name,
            parameters: HashMap::new(),
            user_id: None,
            client_id: None,
            timestamp_micros: None,
        }
    }

    pub fn with_parameter(mut self, key: String, value: EventParameter) -> Self {
        self.parameters.insert(key, value);
        self
    }

    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn with_client_id(mut self, client_id: String) -> Self {
        self.client_id = Some(client_id);
        self
    }
}

/// Analytics error types
#[derive(Error, Debug)]
pub enum AnalyticsError {
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Invalid event: {0}")]
    InvalidEvent(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type AnalyticsResult<T> = Result<T, AnalyticsError>;

impl From<reqwest::Error> for AnalyticsError {
    fn from(err: reqwest::Error) -> Self {
        AnalyticsError::NetworkError(err.to_string())
    }
}

impl From<serde_json::Error> for AnalyticsError {
    fn from(err: serde_json::Error) -> Self {
        AnalyticsError::ApiError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analytics_event_new() {
        let event = AnalyticsEvent::new("page_view".to_string());
        assert_eq!(event.name, "page_view");
        assert!(event.parameters.is_empty());
    }

    #[test]
    fn test_analytics_event_with_parameter() {
        let event = AnalyticsEvent::new("purchase".to_string())
            .with_parameter("value".to_string(), EventParameter::Number(99.99))
            .with_parameter(
                "currency".to_string(),
                EventParameter::String("USD".to_string()),
            );

        assert_eq!(event.parameters.len(), 2);
    }

    #[test]
    fn test_analytics_event_with_user_id() {
        let event = AnalyticsEvent::new("login".to_string()).with_user_id("user123".to_string());

        assert_eq!(event.user_id, Some("user123".to_string()));
    }

    #[test]
    fn test_event_parameter_types() {
        let string_param = EventParameter::String("test".to_string());
        let number_param = EventParameter::Number(42.0);
        let bool_param = EventParameter::Boolean(true);

        match string_param {
            EventParameter::String(s) => assert_eq!(s, "test"),
            _ => panic!("Expected String variant"),
        }

        match number_param {
            EventParameter::Number(n) => assert_eq!(n, 42.0),
            _ => panic!("Expected Number variant"),
        }

        match bool_param {
            EventParameter::Boolean(b) => assert!(b),
            _ => panic!("Expected Boolean variant"),
        }
    }
}
