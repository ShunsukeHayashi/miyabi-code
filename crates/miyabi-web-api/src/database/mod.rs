//! Database Layer
//!
//! Comprehensive database module supporting both PostgreSQL and DynamoDB.
//!
//! ## Features
//!
//! - **PostgreSQL**: ACID-compliant relational database with connection pooling
//! - **DynamoDB**: High-throughput NoSQL database for events and real-time data
//! - **Connection Pooling**: Optimized pool management with health checks
//! - **Environment Configuration**: Flexible configuration via environment variables
//!
//! ## Quick Start
//!
//! ### PostgreSQL
//!
//! ```no_run
//! use miyabi_web_api::database::pool::{DatabaseConfig, create_pool};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Load from environment variables
//!     let config = DatabaseConfig::from_env()?;
//!     let pool = create_pool(config).await?;
//!
//!     // Query the database
//!     let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
//!         .fetch_one(&pool)
//!         .await?;
//!
//!     println!("User count: {}", row.0);
//!     Ok(())
//! }
//! ```
//!
//! ### DynamoDB
//!
//! ```no_run
//! use miyabi_web_api::database::dynamodb::{DynamoDBConfig, create_dynamodb_client, tables};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = DynamoDBConfig::from_env()?;
//!     let client = create_dynamodb_client(config).await?;
//!
//!     // List tables
//!     let result = client.list_tables().send().await?;
//!     println!("Tables: {:?}", result.table_names());
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Environment Variables
//!
//! ### PostgreSQL
//!
//! ```bash
//! DATABASE_URL=postgresql://user:password@localhost:5432/miyabi
//! DB_MAX_CONNECTIONS=20
//! DB_MIN_CONNECTIONS=5
//! DB_CONNECT_TIMEOUT=10
//! DB_ACQUIRE_TIMEOUT=5
//! DB_IDLE_TIMEOUT=600
//! DB_MAX_LIFETIME=1800
//! DB_TEST_BEFORE_ACQUIRE=1
//! ```
//!
//! ### DynamoDB
//!
//! ```bash
//! AWS_REGION=ap-northeast-1
//! DYNAMODB_TIMEOUT=5
//! DYNAMODB_MAX_ATTEMPTS=3
//! DYNAMODB_INITIAL_BACKOFF_MS=100
//! DYNAMODB_MAX_BACKOFF_SEC=20
//! # Optional: for local testing
//! # DYNAMODB_ENDPOINT=http://localhost:8000
//! ```

pub mod pool;
pub mod dynamodb;

// Re-export commonly used types
pub use pool::{DatabaseConfig, create_pool, get_pool_stats, PoolStats};
pub use dynamodb::{DynamoDBConfig, create_dynamodb_client, tables, helpers};

use crate::error::Result;
use sqlx::PgPool;
use aws_sdk_dynamodb::Client as DynamoDBClient;

/// Complete database context with both PostgreSQL and DynamoDB
#[derive(Clone)]
pub struct DatabaseContext {
    /// PostgreSQL connection pool
    pub pg_pool: PgPool,

    /// DynamoDB client
    pub dynamodb_client: DynamoDBClient,
}

impl DatabaseContext {
    /// Create a new database context with both PostgreSQL and DynamoDB
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_web_api::database::DatabaseContext;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let ctx = DatabaseContext::from_env().await?;
    ///
    ///     // Use PostgreSQL
    ///     let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
    ///         .fetch_one(&ctx.pg_pool)
    ///         .await?;
    ///
    ///     // Use DynamoDB
    ///     let tables = ctx.dynamodb_client.list_tables().send().await?;
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn from_env() -> Result<Self> {
        let pg_config = DatabaseConfig::from_env()?;
        let dynamodb_config = DynamoDBConfig::from_env()?;

        Self::new(pg_config, dynamodb_config).await
    }

    /// Create a new database context with custom configurations
    pub async fn new(
        pg_config: DatabaseConfig,
        dynamodb_config: DynamoDBConfig,
    ) -> Result<Self> {
        tracing::info!("Initializing database context");

        let pg_pool = create_pool(pg_config).await?;
        let dynamodb_client = create_dynamodb_client(dynamodb_config).await?;

        tracing::info!("Database context initialized successfully");

        Ok(Self {
            pg_pool,
            dynamodb_client,
        })
    }

    /// Get a reference to the PostgreSQL pool
    pub fn pg(&self) -> &PgPool {
        &self.pg_pool
    }

    /// Get a reference to the DynamoDB client
    pub fn dynamodb(&self) -> &DynamoDBClient {
        &self.dynamodb_client
    }

    /// Check health of both databases
    pub async fn health_check(&self) -> Result<HealthStatus> {
        let pg_healthy = sqlx::query("SELECT 1")
            .execute(&self.pg_pool)
            .await
            .is_ok();

        let dynamodb_healthy = self.dynamodb_client
            .list_tables()
            .limit(1)
            .send()
            .await
            .is_ok();

        Ok(HealthStatus {
            postgresql: pg_healthy,
            dynamodb: dynamodb_healthy,
        })
    }
}

/// Health status of database connections
#[derive(Debug, Clone)]
pub struct HealthStatus {
    /// PostgreSQL health
    pub postgresql: bool,

    /// DynamoDB health
    pub dynamodb: bool,
}

impl HealthStatus {
    /// Check if all databases are healthy
    pub fn is_healthy(&self) -> bool {
        self.postgresql && self.dynamodb
    }

    /// Get a human-readable status message
    pub fn message(&self) -> String {
        match (self.postgresql, self.dynamodb) {
            (true, true) => "All databases healthy".to_string(),
            (true, false) => "PostgreSQL healthy, DynamoDB unhealthy".to_string(),
            (false, true) => "PostgreSQL unhealthy, DynamoDB healthy".to_string(),
            (false, false) => "All databases unhealthy".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status() {
        let status = HealthStatus {
            postgresql: true,
            dynamodb: true,
        };
        assert!(status.is_healthy());
        assert_eq!(status.message(), "All databases healthy");

        let status = HealthStatus {
            postgresql: true,
            dynamodb: false,
        };
        assert!(!status.is_healthy());
        assert!(status.message().contains("DynamoDB unhealthy"));
    }

    #[tokio::test]
    #[ignore] // Requires databases
    async fn test_database_context() {
        dotenvy::dotenv().ok();

        let result = DatabaseContext::from_env().await;

        if let Ok(ctx) = result {
            let health = ctx.health_check().await.unwrap();
            println!("Health: {:?}", health);
        }
    }
}
