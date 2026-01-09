//! Database Layer - PostgreSQL only
//!
//! Simplified database module using PostgreSQL with connection pooling.

pub mod pool;

pub use pool::{DatabaseConfig, create_pool, get_pool_stats, PoolStats};

use crate::error::Result;
use sqlx::PgPool;

/// Database context with PostgreSQL
#[derive(Clone)]
pub struct DatabaseContext {
    pub pg_pool: PgPool,
}

impl DatabaseContext {
    pub async fn from_env() -> Result<Self> {
        let pg_config = DatabaseConfig::from_env()?;
        Self::new(pg_config).await
    }

    pub async fn new(pg_config: DatabaseConfig) -> Result<Self> {
        tracing::info!("Initializing database context");
        let pg_pool = create_pool(pg_config).await?;
        tracing::info!("Database context initialized");
        Ok(Self { pg_pool })
    }

    pub fn pg(&self) -> &PgPool {
        &self.pg_pool
    }

    pub async fn health_check(&self) -> Result<bool> {
        Ok(sqlx::query("SELECT 1").execute(&self.pg_pool).await.is_ok())
    }
}
