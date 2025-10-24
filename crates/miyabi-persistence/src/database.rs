//! Database connection and initialization
//!
//! This module provides SQLite database initialization and connection pooling.

use crate::schema::SCHEMA_SQL;
use miyabi_types::error::MiyabiError;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::Path;
use std::str::FromStr;
use tracing::{debug, info};

/// Database connection manager
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    /// Opens a database connection
    ///
    /// # Arguments
    /// * `database_url` - SQLite database URL (e.g., "sqlite:miyabi.db" or ":memory:")
    ///
    /// # Returns
    /// Database instance with initialized schema
    pub async fn open(database_url: &str) -> Result<Self, MiyabiError> {
        info!(database_url = database_url, "Opening database connection");

        let options = SqliteConnectOptions::from_str(database_url)
            .map_err(|e| MiyabiError::Unknown(format!("Invalid database URL: {}", e)))?
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to connect to database: {}", e)))?;

        let db = Self { pool };
        db.initialize_schema().await?;

        Ok(db)
    }

    /// Opens an in-memory database (for testing)
    pub async fn in_memory() -> Result<Self, MiyabiError> {
        Self::open("sqlite::memory:").await
    }

    /// Opens a file-based database
    pub async fn from_file(path: &Path) -> Result<Self, MiyabiError> {
        let url = format!("sqlite:{}", path.display());
        Self::open(&url).await
    }

    /// Initializes the database schema
    async fn initialize_schema(&self) -> Result<(), MiyabiError> {
        debug!("Initializing database schema");

        sqlx::query(SCHEMA_SQL)
            .execute(&self.pool)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to initialize schema: {}", e)))?;

        info!("Database schema initialized successfully");
        Ok(())
    }

    /// Gets the connection pool
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    /// Closes the database connection
    pub async fn close(self) {
        self.pool.close().await;
        info!("Database connection closed");
    }

    /// Runs database migrations (currently no-op, schema is in SCHEMA_SQL)
    pub async fn migrate(&self) -> Result<(), MiyabiError> {
        // Future: Add sqlx migrations here
        Ok(())
    }

    /// Checks if database is healthy
    pub async fn health_check(&self) -> Result<bool, MiyabiError> {
        sqlx::query("SELECT 1")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Health check failed: {}", e)))?;

        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::Row;

    #[tokio::test]
    async fn test_database_open_in_memory() {
        let db = Database::in_memory().await;
        assert!(db.is_ok(), "Should open in-memory database");
    }

    #[tokio::test]
    async fn test_database_schema_initialization() {
        let db = Database::in_memory().await.unwrap();

        // Verify tables exist
        let result = sqlx::query("SELECT name FROM sqlite_master WHERE type='table'")
            .fetch_all(db.pool())
            .await;

        assert!(result.is_ok());
        let tables = result.unwrap();
        assert!(tables.len() >= 5, "Should have at least 5 tables");

        // Verify specific tables
        let table_names: Vec<String> = tables
            .iter()
            .map(|row| row.get::<String, _>("name"))
            .collect();

        assert!(table_names.contains(&"execution_runs".to_string()));
        assert!(table_names.contains(&"checkpoints".to_string()));
        assert!(table_names.contains(&"worktrees".to_string()));
    }

    #[tokio::test]
    async fn test_database_health_check() {
        let db = Database::in_memory().await.unwrap();
        let health = db.health_check().await;
        assert!(health.is_ok());
        assert_eq!(health.unwrap(), true);
    }

    #[tokio::test]
    async fn test_database_from_file() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");

        let db = Database::from_file(&db_path).await;
        assert!(db.is_ok(), "Should create file-based database");

        // Verify file was created
        assert!(db_path.exists(), "Database file should exist");
    }

    #[tokio::test]
    async fn test_database_close() {
        let db = Database::in_memory().await.unwrap();
        db.close().await;
        // Should not panic
    }
}
