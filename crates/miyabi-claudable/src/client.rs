//! Claudable HTTP API client

use crate::error::{ClaudableError, Result};
use crate::types::{GenerateRequest, GenerateResponse};
use reqwest::Client;
use std::time::Duration;
use tracing::{debug, info, warn};

/// Claudable API client
#[derive(Debug, Clone)]
pub struct ClaudableClient {
    /// API base URL
    api_url: String,

    /// HTTP client
    http_client: Client,

    /// Optional API key for authentication
    api_key: Option<String>,
}

impl ClaudableClient {
    /// Create a new Claudable client
    ///
    /// # Arguments
    ///
    /// * `api_url` - Base URL of the Claudable API (e.g., "http://localhost:8080")
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_claudable::client::ClaudableClient;
    ///
    /// let client = ClaudableClient::new("http://localhost:8080").unwrap();
    /// ```
    pub fn new(api_url: impl Into<String>) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(180)) // 3 minutes
            .build()
            .map_err(ClaudableError::from)?;

        Ok(Self {
            api_url: api_url.into(),
            http_client,
            api_key: std::env::var("CLAUDABLE_API_KEY").ok(),
        })
    }

    /// Create client with custom timeout
    pub fn with_timeout(api_url: impl Into<String>, timeout_secs: u64) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(timeout_secs))
            .build()
            .map_err(ClaudableError::from)?;

        Ok(Self {
            api_url: api_url.into(),
            http_client,
            api_key: std::env::var("CLAUDABLE_API_KEY").ok(),
        })
    }

    /// Generate a Next.js application
    ///
    /// # Arguments
    ///
    /// * `request` - Generation request with description and options
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_claudable::client::ClaudableClient;
    /// use miyabi_claudable::types::GenerateRequest;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = ClaudableClient::new("http://localhost:8080")?;
    /// let request = GenerateRequest::new("Create a dashboard with charts");
    /// let response = client.generate(request).await?;
    /// println!("Generated project: {}", response.project_id);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        info!("Sending generate request to Claudable API");
        debug!("Request: {:?}", request);

        let url = format!("{}/generate", self.api_url);

        let mut req = self.http_client.post(&url).json(&request);

        // Add API key if available
        if let Some(ref key) = self.api_key {
            req = req.header("Authorization", format!("Bearer {}", key));
        }

        let response = req.send().await.map_err(|e| {
            warn!("HTTP request failed: {}", e);
            ClaudableError::from(e)
        })?;

        let status = response.status();

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            warn!("API error {}: {}", status.as_u16(), error_text);
            return Err(ClaudableError::ApiError(status.as_u16(), error_text));
        }

        let generate_response: GenerateResponse = response.json().await.map_err(|e| {
            warn!("Failed to parse response: {}", e);
            ClaudableError::ParseError(e.to_string())
        })?;

        info!("Successfully generated project: {}", generate_response.project_id);
        debug!("Generated {} files", generate_response.files.len());

        Ok(generate_response)
    }

    /// Check if Claudable API is healthy
    ///
    /// # Example
    ///
    /// ```no_run
    /// # use miyabi_claudable::client::ClaudableClient;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = ClaudableClient::new("http://localhost:8080")?;
    /// let is_healthy = client.health_check().await?;
    /// assert!(is_healthy);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn health_check(&self) -> Result<bool> {
        let url = format!("{}/health", self.api_url);
        debug!("Health check: {}", url);

        let response = self.http_client.get(&url).send().await.map_err(ClaudableError::from)?;

        Ok(response.status().is_success())
    }

    /// Get the API base URL
    pub fn api_url(&self) -> &str {
        &self.api_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::GenerateRequest;

    #[test]
    fn test_client_creation() {
        let client = ClaudableClient::new("http://localhost:8080").unwrap();
        assert_eq!(client.api_url(), "http://localhost:8080");
    }

    #[test]
    fn test_client_with_timeout() {
        let client = ClaudableClient::with_timeout("http://localhost:8080", 60).unwrap();
        assert_eq!(client.api_url(), "http://localhost:8080");
    }

    #[tokio::test]
    #[ignore] // Requires Claudable server running
    async fn test_health_check() {
        let client = ClaudableClient::new("http://localhost:8080").unwrap();
        let result = client.health_check().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore] // Requires Claudable server running
    async fn test_generate() {
        let client = ClaudableClient::new("http://localhost:8080").unwrap();
        let request = GenerateRequest::new("Create a simple homepage");

        let result = client.generate(request).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert!(!response.project_id.is_empty());
        assert!(!response.files.is_empty());
    }
}
