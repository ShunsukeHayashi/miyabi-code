//! DynamoDB Client Configuration
//!
//! AWS DynamoDB client with retry logic, timeouts, and connection pooling.

use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::config::{retry::RetryConfig, timeout::TimeoutConfig, Builder as ConfigBuilder};
use aws_sdk_dynamodb::Client;
use std::time::Duration;
use crate::error::{AppError, Result};

/// DynamoDB client configuration
#[derive(Debug, Clone)]
pub struct DynamoDBConfig {
    /// AWS region
    pub region: String,

    /// Optional endpoint URL (for local testing with DynamoDB Local)
    pub endpoint: Option<String>,

    /// Operation timeout
    pub timeout: Duration,

    /// Maximum retry attempts
    pub max_attempts: u32,

    /// Initial retry delay (exponential backoff)
    pub initial_backoff: Duration,

    /// Maximum retry delay
    pub max_backoff: Duration,
}

impl DynamoDBConfig {
    /// Create a new DynamoDB configuration from environment variables
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            region: std::env::var("AWS_REGION")
                .unwrap_or_else(|_| "ap-northeast-1".to_string()),
            endpoint: std::env::var("DYNAMODB_ENDPOINT").ok(),
            timeout: Duration::from_secs(
                std::env::var("DYNAMODB_TIMEOUT")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(5)
            ),
            max_attempts: std::env::var("DYNAMODB_MAX_ATTEMPTS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3),
            initial_backoff: Duration::from_millis(
                std::env::var("DYNAMODB_INITIAL_BACKOFF_MS")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(100)
            ),
            max_backoff: Duration::from_secs(
                std::env::var("DYNAMODB_MAX_BACKOFF_SEC")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(20)
            ),
        })
    }

    /// Create configuration for local testing (DynamoDB Local)
    pub fn local(port: u16) -> Self {
        Self {
            region: "local".to_string(),
            endpoint: Some(format!("http://localhost:{}", port)),
            timeout: Duration::from_secs(5),
            max_attempts: 3,
            initial_backoff: Duration::from_millis(100),
            max_backoff: Duration::from_secs(20),
        }
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        if self.region.is_empty() {
            return Err(AppError::Configuration("AWS region cannot be empty".to_string()));
        }

        if self.max_attempts == 0 {
            return Err(AppError::Configuration("max_attempts must be > 0".to_string()));
        }

        Ok(())
    }
}

impl Default for DynamoDBConfig {
    fn default() -> Self {
        Self {
            region: "ap-northeast-1".to_string(),
            endpoint: None,
            timeout: Duration::from_secs(5),
            max_attempts: 3,
            initial_backoff: Duration::from_millis(100),
            max_backoff: Duration::from_secs(20),
        }
    }
}

/// Create a DynamoDB client with optimized settings
///
/// # Arguments
///
/// * `config` - DynamoDB configuration
///
/// # Returns
///
/// A configured DynamoDB client
///
/// # Errors
///
/// Returns error if configuration is invalid
///
/// # Example
///
/// ```no_run
/// use miyabi_web_api::database::dynamodb::{DynamoDBConfig, create_dynamodb_client};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let config = DynamoDBConfig::from_env()?;
///     let client = create_dynamodb_client(config).await?;
///
///     // Use the client
///     let result = client
///         .list_tables()
///         .send()
///         .await?;
///
///     println!("Tables: {:?}", result.table_names());
///     Ok(())
/// }
/// ```
pub async fn create_dynamodb_client(config: DynamoDBConfig) -> Result<Client> {
    // Validate configuration
    config.validate()?;

    tracing::info!(
        region = %config.region,
        endpoint = ?config.endpoint,
        "Creating DynamoDB client"
    );

    // Region provider
    let region_provider = RegionProviderChain::first_try(aws_sdk_dynamodb::config::Region::new(config.region.clone()))
        .or_default_provider()
        .or_else("ap-northeast-1");

    // Load AWS configuration
    let mut aws_config_loader = aws_config::defaults(BehaviorVersion::latest())
        .region(region_provider);

    // Override endpoint for local testing
    if let Some(endpoint) = config.endpoint.clone() {
        aws_config_loader = aws_config_loader.endpoint_url(endpoint);
    }

    let aws_config = aws_config_loader.load().await;

    // Build DynamoDB-specific config
    let dynamodb_config = ConfigBuilder::from(&aws_config)
        .timeout_config(
            TimeoutConfig::builder()
                .operation_timeout(config.timeout)
                .operation_attempt_timeout(config.timeout)
                .build(),
        )
        .retry_config(
            RetryConfig::standard()
                .with_max_attempts(config.max_attempts)
                .with_initial_backoff(config.initial_backoff)
                .with_max_backoff(config.max_backoff),
        )
        .build();

    let client = Client::from_conf(dynamodb_config);

    tracing::info!("DynamoDB client created successfully");

    // Test the client
    test_client_health(&client).await?;

    Ok(client)
}

/// Test client health by listing tables
async fn test_client_health(client: &Client) -> Result<()> {
    client
        .list_tables()
        .limit(1)
        .send()
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "DynamoDB health check failed");
            AppError::Configuration(format!("DynamoDB connection failed: {}", e))
        })?;

    tracing::info!("DynamoDB health check passed");
    Ok(())
}

/// DynamoDB table names used in Miyabi
pub mod tables {
    /// High-frequency event logging
    pub const EVENTS: &str = "MiyabiEvents";

    /// Real-time agent state management
    pub const AGENT_STATE: &str = "MiyabiAgentState";

    /// WebSocket message queue
    pub const WEBSOCKET_MESSAGES: &str = "MiyabiWebSocketMessages";
}

/// Helper functions for DynamoDB operations
pub mod helpers {
    use aws_sdk_dynamodb::types::AttributeValue;
    use std::collections::HashMap;

    /// Convert a Rust value to DynamoDB AttributeValue::S (String)
    pub fn to_s<T: ToString>(value: T) -> AttributeValue {
        AttributeValue::S(value.to_string())
    }

    /// Convert a number to DynamoDB AttributeValue::N (Number)
    pub fn to_n<T: ToString>(value: T) -> AttributeValue {
        AttributeValue::N(value.to_string())
    }

    /// Convert a boolean to DynamoDB AttributeValue::Bool
    pub fn to_bool(value: bool) -> AttributeValue {
        AttributeValue::Bool(value)
    }

    /// Create a map attribute
    pub fn to_m(map: HashMap<String, AttributeValue>) -> AttributeValue {
        AttributeValue::M(map)
    }

    /// Extract string value from AttributeValue
    pub fn from_s(attr: &AttributeValue) -> Option<&str> {
        if let AttributeValue::S(s) = attr {
            Some(s.as_str())
        } else {
            None
        }
    }

    /// Extract number value from AttributeValue
    pub fn from_n<T: std::str::FromStr>(attr: &AttributeValue) -> Option<T> {
        if let AttributeValue::N(n) = attr {
            n.parse().ok()
        } else {
            None
        }
    }

    /// Extract boolean value from AttributeValue
    pub fn from_bool(attr: &AttributeValue) -> Option<bool> {
        if let AttributeValue::Bool(b) = attr {
            Some(*b)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dynamodb_config_default() {
        let config = DynamoDBConfig::default();
        assert_eq!(config.region, "ap-northeast-1");
        assert_eq!(config.max_attempts, 3);
        assert!(config.endpoint.is_none());
    }

    #[test]
    fn test_config_local() {
        let config = DynamoDBConfig::local(8000);
        assert_eq!(config.endpoint, Some("http://localhost:8000".to_string()));
        assert_eq!(config.region, "local");
    }

    #[test]
    fn test_config_validation() {
        let mut config = DynamoDBConfig::default();

        // Valid config
        assert!(config.validate().is_ok());

        // Invalid: empty region
        config.region = "".to_string();
        assert!(config.validate().is_err());

        // Invalid: max_attempts = 0
        config.region = "ap-northeast-1".to_string();
        config.max_attempts = 0;
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_helpers() {
        use helpers::*;

        let s = to_s("test");
        assert_eq!(from_s(&s), Some("test"));

        let n = to_n(123);
        assert_eq!(from_n::<i32>(&n), Some(123));

        let b = to_bool(true);
        assert_eq!(from_bool(&b), Some(true));
    }

    #[tokio::test]
    #[ignore] // Requires AWS credentials or DynamoDB Local
    async fn test_create_client() {
        dotenvy::dotenv().ok();

        let config = DynamoDBConfig::from_env().unwrap();
        let result = create_dynamodb_client(config).await;

        // Should either succeed or fail with proper error message
        match result {
            Ok(client) => {
                // Try listing tables
                let tables = client.list_tables().send().await;
                assert!(tables.is_ok());
            }
            Err(e) => {
                // Expected if no AWS credentials or DynamoDB Local not running
                eprintln!("Client creation failed (expected): {:?}", e);
            }
        }
    }
}
