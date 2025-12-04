//! PostgreSQL Connection Pool Configuration
//!
//! Production-ready connection pool with environment-based configuration,
//! health checks, and automatic connection lifecycle management.

use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;
use crate::error::{AppError, Result};

/// PostgreSQL connection pool configuration
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    /// PostgreSQL connection URL
    pub url: String,

    /// Maximum number of connections in the pool
    pub max_connections: u32,

    /// Minimum number of idle connections to maintain
    pub min_connections: u32,

    /// Timeout for establishing a new connection
    pub connect_timeout: Duration,

    /// Timeout for acquiring a connection from the pool
    pub acquire_timeout: Duration,

    /// Maximum idle time before connection is closed
    pub idle_timeout: Option<Duration>,

    /// Maximum lifetime of a connection
    pub max_lifetime: Option<Duration>,

    /// Test connections before returning them from the pool
    pub test_before_acquire: bool,
}

impl DatabaseConfig {
    /// Create a new database configuration from environment variables
    pub fn from_env() -> Result<Self> {
        let url = std::env::var("DATABASE_URL")
            .map_err(|_| AppError::Config("DATABASE_URL must be set".to_string()))?;

        Ok(Self {
            url,
            max_connections: Self::parse_env("DB_MAX_CONNECTIONS", 20)?,
            min_connections: Self::parse_env("DB_MIN_CONNECTIONS", 5)?,
            connect_timeout: Duration::from_secs(Self::parse_env("DB_CONNECT_TIMEOUT", 10)?),
            acquire_timeout: Duration::from_secs(Self::parse_env("DB_ACQUIRE_TIMEOUT", 5)?),
            idle_timeout: Some(Duration::from_secs(Self::parse_env("DB_IDLE_TIMEOUT", 600)?)),
            max_lifetime: Some(Duration::from_secs(Self::parse_env("DB_MAX_LIFETIME", 1800)?)),
            test_before_acquire: Self::parse_env("DB_TEST_BEFORE_ACQUIRE", 1)? == 1,
        })
    }

    /// Parse environment variable with default fallback
    fn parse_env<T: std::str::FromStr>(key: &str, default: T) -> Result<T> {
        std::env::var(key)
            .ok()
            .and_then(|v| v.parse().ok())
            .map(Ok)
            .unwrap_or(Ok(default))
    }

    /// Validate configuration values
    pub fn validate(&self) -> Result<()> {
        if self.max_connections == 0 {
            return Err(AppError::Config("max_connections must be > 0".to_string()));
        }

        if self.min_connections > self.max_connections {
            return Err(AppError::Config(
                "min_connections cannot exceed max_connections".to_string()
            ));
        }

        if self.url.is_empty() {
            return Err(AppError::Config("database URL cannot be empty".to_string()));
        }

        Ok(())
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "postgresql://localhost:5432/miyabi".to_string(),
            max_connections: 20,
            min_connections: 5,
            connect_timeout: Duration::from_secs(10),
            acquire_timeout: Duration::from_secs(5),
            idle_timeout: Some(Duration::from_secs(600)),
            max_lifetime: Some(Duration::from_secs(1800)),
            test_before_acquire: true,
        }
    }
}

/// Create a PostgreSQL connection pool with optimized settings
///
/// # Arguments
///
/// * `config` - Database configuration
///
/// # Returns
///
/// A configured connection pool ready for use
///
/// # Errors
///
/// Returns error if connection fails or configuration is invalid
///
/// # Example
///
/// ```no_run
/// use miyabi_web_api::database::pool::{DatabaseConfig, create_pool};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let config = DatabaseConfig::from_env()?;
///     let pool = create_pool(config).await?;
///
///     // Use the pool
///     let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
///         .fetch_one(&pool)
///         .await?;
///
///     println!("User count: {}", row.0);
///     Ok(())
/// }
/// ```
pub async fn create_pool(config: DatabaseConfig) -> Result<PgPool> {
    // Validate configuration
    config.validate()?;

    tracing::info!(
        max_connections = config.max_connections,
        min_connections = config.min_connections,
        "Creating PostgreSQL connection pool"
    );

    let pool = PgPoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(config.acquire_timeout)
        .idle_timeout(config.idle_timeout)
        .max_lifetime(config.max_lifetime)
        
        .test_before_acquire(config.test_before_acquire)
        .connect(&config.url)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to create database pool");
            AppError::Database(e)
        })?;

    tracing::info!("Database connection pool created successfully");

    // Test the pool with a simple query
    test_pool_health(&pool).await?;

    Ok(pool)
}

/// Test pool health with a simple query
async fn test_pool_health(pool: &PgPool) -> Result<()> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Pool health check failed");
            AppError::Database(e)
        })?;

    tracing::info!("Pool health check passed");
    Ok(())
}

/// Get current pool statistics
///
/// # Example
///
/// ```no_run
/// use miyabi_web_api::database::pool::{DatabaseConfig, create_pool, get_pool_stats};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let config = DatabaseConfig::from_env()?;
///     let pool = create_pool(config).await?;
///
///     let stats = get_pool_stats(&pool);
///     println!("Pool stats: {:?}", stats);
///     Ok(())
/// }
/// ```
pub fn get_pool_stats(pool: &PgPool) -> PoolStats {
    PoolStats {
        size: pool.size(),
        idle: pool.num_idle(),
    }
}

/// Pool statistics
#[derive(Debug, Clone)]
pub struct PoolStats {
    /// Total number of connections (active + idle)
    pub size: u32,

    /// Number of idle connections
    pub idle: usize,
}

impl PoolStats {
    /// Get number of active connections
    pub fn active(&self) -> u32 {
        self.size.saturating_sub(self.idle as u32)
    }

    /// Check if pool is healthy (not exhausted)
    pub fn is_healthy(&self, max_connections: u32) -> bool {
        let utilization = (self.size as f64 / max_connections as f64) * 100.0;
        utilization < 90.0 // Alert if > 90% utilized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_config_default() {
        let config = DatabaseConfig::default();
        assert_eq!(config.max_connections, 20);
        assert_eq!(config.min_connections, 5);
        assert!(config.test_before_acquire);
    }

    #[test]
    fn test_config_validation() {
        let mut config = DatabaseConfig::default();

        // Valid config
        assert!(config.validate().is_ok());

        // Invalid: max_connections = 0
        config.max_connections = 0;
        assert!(config.validate().is_err());

        // Invalid: min > max
        config.max_connections = 10;
        config.min_connections = 20;
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_pool_stats() {
        let stats = PoolStats {
            size: 20,
            idle: 5,
        };

        assert_eq!(stats.active(), 15);
        assert!(stats.is_healthy(20)); // 100% utilization = unhealthy

        let stats_high = PoolStats {
            size: 19,
            idle: 0,
        };
        assert!(!stats_high.is_healthy(20)); // 95% utilization = unhealthy
    }

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_create_pool() {
        dotenvy::dotenv().ok();

        let config = DatabaseConfig::from_env().unwrap();
        let result = create_pool(config).await;

        assert!(result.is_ok());

        let pool = result.unwrap();
        let stats = get_pool_stats(&pool);
        assert!(stats.size > 0);
    }
}
