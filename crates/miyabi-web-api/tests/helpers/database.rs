//! Database test helpers
//!
//! Provides utilities for setting up and tearing down test databases.

use miyabi_web_api::config::DatabasePoolConfig;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;

/// Test database wrapper
pub struct TestDatabase {
    pub pool: PgPool,
    #[allow(dead_code)]
    pub database_name: String,
}

impl TestDatabase {
    /// Create a new test database
    pub async fn new() -> Self {
        let database_url = std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://localhost/miyabi_test".to_string());

        // Use optimized test pool configuration
        let pool_config = DatabasePoolConfig::test();

        let mut pool_options = PgPoolOptions::new()
            .max_connections(pool_config.max_connections)
            .min_connections(pool_config.min_connections)
            .acquire_timeout(pool_config.acquire_timeout)
            .test_before_acquire(pool_config.test_before_acquire);

        if let Some(idle_timeout) = pool_config.idle_timeout {
            pool_options = pool_options.idle_timeout(idle_timeout);
        }

        if let Some(max_lifetime) = pool_config.max_lifetime {
            pool_options = pool_options.max_lifetime(max_lifetime);
        }

        let pool = pool_options
            .connect(&database_url)
            .await
            .expect("Failed to connect to test database");

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        Self {
            pool,
            database_name: "miyabi_test".to_string(),
        }
    }

    /// Clean all tables for a fresh test
    pub async fn clean(&self) {
        // Delete in reverse dependency order
        sqlx::query("TRUNCATE TABLE task_dependencies CASCADE")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("TRUNCATE TABLE tasks CASCADE")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("TRUNCATE TABLE agent_executions CASCADE")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("TRUNCATE TABLE agents CASCADE")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("TRUNCATE TABLE repositories CASCADE")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("TRUNCATE TABLE users CASCADE")
            .execute(&self.pool)
            .await
            .ok();
    }

    /// Get a reference to the pool
    #[allow(dead_code)]
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Get an Arc-wrapped pool for use in app state
    #[allow(dead_code)]
    pub fn pool_arc(&self) -> Arc<PgPool> {
        Arc::new(self.pool.clone())
    }
}

impl Drop for TestDatabase {
    fn drop(&mut self) {
        // Pool will be closed automatically
    }
}

/// Setup a test database and return the pool
pub async fn setup_test_database() -> TestDatabase {
    TestDatabase::new().await
}

/// Cleanup test database
pub async fn cleanup_test_database(db: &TestDatabase) {
    db.clean().await;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_database_setup() {
        let db = setup_test_database().await;
        assert!(db.pool.acquire().await.is_ok());
        cleanup_test_database(&db).await;
    }
}
