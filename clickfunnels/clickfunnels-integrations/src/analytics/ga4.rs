//! Google Analytics 4 (GA4) Implementation
//!
//! Uses GA4 Measurement Protocol for server-side event tracking.

use super::types::*;
use super::AnalyticsClient;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

const GA4_API_URL: &str = "https://www.google-analytics.com/mp/collect";
const GA4_DEBUG_URL: &str = "https://www.google-analytics.com/debug/mp/collect";

pub struct GA4Client {
    measurement_id: String,
    api_secret: String,
    client: Client,
    debug_mode: bool,
}

impl GA4Client {
    pub fn new(measurement_id: String, api_secret: String) -> AnalyticsResult<Self> {
        if measurement_id.is_empty() {
            return Err(AnalyticsError::ConfigError("Measurement ID cannot be empty".to_string()));
        }
        if api_secret.is_empty() {
            return Err(AnalyticsError::ConfigError("API secret cannot be empty".to_string()));
        }

        Ok(Self {
            measurement_id,
            api_secret,
            client: Client::new(),
            debug_mode: false,
        })
    }

    pub fn with_debug(mut self, debug: bool) -> Self {
        self.debug_mode = debug;
        self
    }

    fn get_api_url(&self) -> &str {
        if self.debug_mode {
            GA4_DEBUG_URL
        } else {
            GA4_API_URL
        }
    }

    fn build_event_payload(&self, event: &AnalyticsEvent) -> serde_json::Value {
        let client_id = event.client_id.as_deref().unwrap_or("anonymous");

        let mut event_params: std::collections::HashMap<String, serde_json::Value> = event
            .parameters
            .iter()
            .map(|(k, v)| {
                let value = match v {
                    EventParameter::String(s) => json!(s),
                    EventParameter::Number(n) => json!(n),
                    EventParameter::Boolean(b) => json!(b),
                };
                (k.clone(), value)
            })
            .collect();

        // Add timestamp if provided
        if let Some(ts) = event.timestamp_micros {
            event_params.insert("timestamp_micros".to_string(), json!(ts));
        }

        let mut payload = json!({
            "client_id": client_id,
            "events": [{
                "name": event.name,
                "params": event_params,
            }],
        });

        // Add user_id if provided
        if let Some(user_id) = &event.user_id {
            payload["user_id"] = json!(user_id);
        }

        payload
    }
}

#[async_trait]
impl AnalyticsClient for GA4Client {
    async fn track_event(&self, event: &AnalyticsEvent) -> AnalyticsResult<()> {
        let payload = self.build_event_payload(event);

        let url = format!(
            "{}?measurement_id={}&api_secret={}",
            self.get_api_url(),
            self.measurement_id,
            self.api_secret
        );

        let response = self
            .client
            .post(&url)
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            if self.debug_mode {
                let debug_response: serde_json::Value = response.json().await?;
                tracing::debug!("GA4 debug response: {:?}", debug_response);
            }

            tracing::info!("Event tracked in GA4: name={}", event.name);
            Ok(())
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());

            Err(AnalyticsError::ApiError(format!(
                "GA4 API error ({}): {}",
                status, error_text
            )))
        }
    }

    async fn track_page_view(&self, page_path: &str, page_title: &str) -> AnalyticsResult<()> {
        let event = AnalyticsEvent::new("page_view".to_string())
            .with_parameter("page_path".to_string(), EventParameter::String(page_path.to_string()))
            .with_parameter("page_title".to_string(), EventParameter::String(page_title.to_string()));

        self.track_event(&event).await
    }

    async fn track_conversion(
        &self,
        conversion_name: &str,
        value: Option<f64>,
        currency: Option<&str>,
    ) -> AnalyticsResult<()> {
        let mut event = AnalyticsEvent::new(conversion_name.to_string());

        if let Some(val) = value {
            event = event.with_parameter("value".to_string(), EventParameter::Number(val));
        }

        if let Some(curr) = currency {
            event = event.with_parameter("currency".to_string(), EventParameter::String(curr.to_string()));
        }

        self.track_event(&event).await
    }

    fn provider_name(&self) -> &str {
        "Google Analytics 4"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ga4_client_new() {
        let client = GA4Client::new(
            "G-XXXXXXXXXX".to_string(),
            "secret123".to_string(),
        );
        assert!(client.is_ok());
    }

    #[test]
    fn test_ga4_client_empty_measurement_id() {
        let client = GA4Client::new(
            "".to_string(),
            "secret123".to_string(),
        );
        assert!(client.is_err());
    }

    #[test]
    fn test_ga4_client_empty_api_secret() {
        let client = GA4Client::new(
            "G-XXXXXXXXXX".to_string(),
            "".to_string(),
        );
        assert!(client.is_err());
    }

    #[test]
    fn test_ga4_client_debug_mode() {
        let client = GA4Client::new(
            "G-XXXXXXXXXX".to_string(),
            "secret123".to_string(),
        )
        .unwrap()
        .with_debug(true);

        assert!(client.debug_mode);
        assert_eq!(client.get_api_url(), GA4_DEBUG_URL);
    }

    #[test]
    fn test_build_event_payload() {
        let client = GA4Client::new(
            "G-XXXXXXXXXX".to_string(),
            "secret123".to_string(),
        ).unwrap();

        let event = AnalyticsEvent::new("purchase".to_string())
            .with_parameter("value".to_string(), EventParameter::Number(99.99))
            .with_parameter("currency".to_string(), EventParameter::String("USD".to_string()))
            .with_client_id("client123".to_string());

        let payload = client.build_event_payload(&event);

        assert_eq!(payload["client_id"], "client123");
        assert_eq!(payload["events"][0]["name"], "purchase");
        assert!(payload["events"][0]["params"]["value"].is_number());
        assert!(payload["events"][0]["params"]["currency"].is_string());
    }
}
