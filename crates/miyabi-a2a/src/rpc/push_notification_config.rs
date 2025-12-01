//! Push notification configuration management.
//!
//! This module provides RPC methods for managing webhook configurations:
//! - `tasks/pushNotificationConfig/set` - Register/update webhook URL
//! - `tasks/pushNotificationConfig/get` - Retrieve webhook configuration
//! - `tasks/pushNotificationConfig/delete` - Remove webhook configuration

use crate::error::{A2AError, A2AResult};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Push notification configuration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PushNotificationConfig {
    /// Client identifier (unique per client)
    pub client_id: String,

    /// Webhook URL to send notifications to
    pub webhook_url: String,

    /// Optional Bearer token for authentication
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bearer_token: Option<String>,

    /// Optional webhook secret for HMAC-SHA256 signature generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub webhook_secret: Option<String>,

    /// Optional timeout for HTTP requests (in seconds)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout_seconds: Option<u64>,

    /// Timestamp of when this config was created/updated (ISO 8601)
    pub updated_at: String,
}

impl PushNotificationConfig {
    /// Create a new push notification configuration
    pub fn new(client_id: impl Into<String>, webhook_url: impl Into<String>) -> Self {
        Self {
            client_id: client_id.into(),
            webhook_url: webhook_url.into(),
            bearer_token: None,
            webhook_secret: None,
            timeout_seconds: Some(30), // Default 30 seconds
            updated_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Set Bearer token for authentication
    pub fn with_bearer_token(mut self, token: impl Into<String>) -> Self {
        self.bearer_token = Some(token.into());
        self
    }

    /// Set webhook secret for HMAC-SHA256 signature generation
    pub fn with_webhook_secret(mut self, secret: impl Into<String>) -> Self {
        self.webhook_secret = Some(secret.into());
        self
    }

    /// Set custom timeout
    pub fn with_timeout(mut self, seconds: u64) -> Self {
        self.timeout_seconds = Some(seconds);
        self
    }

    /// Validate the webhook URL format
    pub fn validate_url(&self) -> A2AResult<()> {
        let url = self.webhook_url.as_str();

        // Check if URL starts with http:// or https://
        if !url.starts_with("http://") && !url.starts_with("https://") {
            return Err(A2AError::InvalidRequest(format!(
                "Webhook URL must start with http:// or https://, got: {}",
                url
            )));
        }

        // Try to parse as URL
        match url::Url::parse(url) {
            Ok(parsed_url) => {
                // Check if URL has a host
                if parsed_url.host_str().is_none() {
                    return Err(A2AError::InvalidRequest(format!("Webhook URL must have a valid host: {}", url)));
                }
                Ok(())
            }
            Err(e) => Err(A2AError::InvalidRequest(format!("Invalid webhook URL: {}", e))),
        }
    }
}

/// Storage backend for push notification configurations
#[async_trait]
pub trait ConfigStorage: Send + Sync {
    /// Store or update a push notification configuration
    async fn set_config(&self, config: PushNotificationConfig) -> A2AResult<()>;

    /// Retrieve a push notification configuration by client ID
    async fn get_config(&self, client_id: &str) -> A2AResult<PushNotificationConfig>;

    /// Delete a push notification configuration by client ID
    async fn delete_config(&self, client_id: &str) -> A2AResult<()>;

    /// List all configurations (for admin/debugging)
    async fn list_configs(&self) -> A2AResult<Vec<PushNotificationConfig>>;
}

/// In-memory storage backend for push notification configurations
#[derive(Clone)]
pub struct MemoryConfigStorage {
    configs: Arc<RwLock<HashMap<String, PushNotificationConfig>>>,
}

impl MemoryConfigStorage {
    /// Create a new in-memory config storage
    pub fn new() -> Self {
        Self { configs: Arc::new(RwLock::new(HashMap::new())) }
    }
}

impl Default for MemoryConfigStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ConfigStorage for MemoryConfigStorage {
    async fn set_config(&self, mut config: PushNotificationConfig) -> A2AResult<()> {
        // Validate URL before storing
        config.validate_url()?;

        // Update timestamp
        config.updated_at = chrono::Utc::now().to_rfc3339();

        let mut configs = self
            .configs
            .write()
            .map_err(|e| A2AError::InternalError(format!("Lock poisoned: {}", e)))?;

        configs.insert(config.client_id.clone(), config);
        Ok(())
    }

    async fn get_config(&self, client_id: &str) -> A2AResult<PushNotificationConfig> {
        let configs = self
            .configs
            .read()
            .map_err(|e| A2AError::InternalError(format!("Lock poisoned: {}", e)))?;

        configs
            .get(client_id)
            .cloned()
            .ok_or_else(|| A2AError::InvalidRequest(format!("No config found for client: {}", client_id)))
    }

    async fn delete_config(&self, client_id: &str) -> A2AResult<()> {
        let mut configs = self
            .configs
            .write()
            .map_err(|e| A2AError::InternalError(format!("Lock poisoned: {}", e)))?;

        configs
            .remove(client_id)
            .ok_or_else(|| A2AError::InvalidRequest(format!("No config found for client: {}", client_id)))?;

        Ok(())
    }

    async fn list_configs(&self) -> A2AResult<Vec<PushNotificationConfig>> {
        let configs = self
            .configs
            .read()
            .map_err(|e| A2AError::InternalError(format!("Lock poisoned: {}", e)))?;

        Ok(configs.values().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_push_notification_config_creation() {
        let config = PushNotificationConfig::new("client-1", "https://example.com/webhook")
            .with_bearer_token("secret_token")
            .with_timeout(60);

        assert_eq!(config.client_id, "client-1");
        assert_eq!(config.webhook_url, "https://example.com/webhook");
        assert_eq!(config.bearer_token, Some("secret_token".to_string()));
        assert_eq!(config.timeout_seconds, Some(60));
        assert!(!config.updated_at.is_empty());
    }

    #[test]
    fn test_validate_url_valid_https() {
        let config = PushNotificationConfig::new("client-1", "https://example.com/webhook");
        assert!(config.validate_url().is_ok());
    }

    #[test]
    fn test_validate_url_valid_http() {
        let config = PushNotificationConfig::new("client-1", "http://localhost:8080/webhook");
        assert!(config.validate_url().is_ok());
    }

    #[test]
    fn test_validate_url_invalid_scheme() {
        let config = PushNotificationConfig::new("client-1", "ftp://example.com/webhook");
        assert!(config.validate_url().is_err());
    }

    #[test]
    fn test_validate_url_no_scheme() {
        let config = PushNotificationConfig::new("client-1", "example.com/webhook");
        assert!(config.validate_url().is_err());
    }

    #[test]
    fn test_validate_url_invalid_format() {
        let config = PushNotificationConfig::new("client-1", "not a url");
        assert!(config.validate_url().is_err());
    }

    #[tokio::test]
    async fn test_memory_storage_set_and_get() {
        let storage = MemoryConfigStorage::new();
        let config = PushNotificationConfig::new("client-1", "https://example.com/webhook");

        storage.set_config(config.clone()).await.unwrap();

        let retrieved = storage.get_config("client-1").await.unwrap();
        assert_eq!(retrieved.client_id, "client-1");
        assert_eq!(retrieved.webhook_url, "https://example.com/webhook");
    }

    #[tokio::test]
    async fn test_memory_storage_update() {
        let storage = MemoryConfigStorage::new();

        // Set initial config
        let config1 = PushNotificationConfig::new("client-1", "https://example.com/webhook1");
        storage.set_config(config1).await.unwrap();

        // Update with new URL
        let config2 = PushNotificationConfig::new("client-1", "https://example.com/webhook2");
        storage.set_config(config2).await.unwrap();

        // Verify updated
        let retrieved = storage.get_config("client-1").await.unwrap();
        assert_eq!(retrieved.webhook_url, "https://example.com/webhook2");
    }

    #[tokio::test]
    async fn test_memory_storage_delete() {
        let storage = MemoryConfigStorage::new();
        let config = PushNotificationConfig::new("client-1", "https://example.com/webhook");

        storage.set_config(config).await.unwrap();
        storage.delete_config("client-1").await.unwrap();

        // Should fail to get after deletion
        let result = storage.get_config("client-1").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_memory_storage_get_nonexistent() {
        let storage = MemoryConfigStorage::new();
        let result = storage.get_config("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_memory_storage_delete_nonexistent() {
        let storage = MemoryConfigStorage::new();
        let result = storage.delete_config("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_memory_storage_list() {
        let storage = MemoryConfigStorage::new();

        // Add multiple configs
        let config1 = PushNotificationConfig::new("client-1", "https://example.com/webhook1");
        let config2 = PushNotificationConfig::new("client-2", "https://example.com/webhook2");
        let config3 = PushNotificationConfig::new("client-3", "https://example.com/webhook3");

        storage.set_config(config1).await.unwrap();
        storage.set_config(config2).await.unwrap();
        storage.set_config(config3).await.unwrap();

        // List all
        let all_configs = storage.list_configs().await.unwrap();
        assert_eq!(all_configs.len(), 3);
    }

    #[tokio::test]
    async fn test_memory_storage_validates_url() {
        let storage = MemoryConfigStorage::new();

        // Try to set config with invalid URL (no http/https scheme)
        let config = PushNotificationConfig::new("client-1", "invalid url");
        let result = storage.set_config(config).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            A2AError::InvalidRequest(msg) => {
                assert!(msg.contains("Webhook URL must start with"));
            }
            _ => panic!("Expected InvalidRequest error"),
        }
    }
}
