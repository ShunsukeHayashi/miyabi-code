//! ClickFunnels Database Layer
//!
//! This crate provides PostgreSQL database access using SQLx with connection pooling
//! and repository pattern for CRUD operations.

pub mod error;
pub mod repositories;

use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub use error::{DatabaseError, Result};
pub use repositories::{FunnelRepository, PageRepository, UserRepository};

/// Database connection pool and configuration
///
/// Provides centralized access to PostgreSQL database with connection pooling
/// and repository pattern for all entities.
#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    /// Create a new Database instance from a connection string
    ///
    /// # Arguments
    /// * `database_url` - PostgreSQL connection string (e.g., "postgresql://user:pass@localhost/db")
    ///
    /// # Examples
    /// ```no_run
    /// # use clickfunnels_db::Database;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let db = Database::new("postgresql://localhost/clickfunnels").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .min_connections(5)
            .acquire_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(1800))
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    /// Create a Database instance with custom pool configuration
    ///
    /// # Arguments
    /// * `database_url` - PostgreSQL connection string
    /// * `max_connections` - Maximum number of connections in pool
    /// * `min_connections` - Minimum number of connections to maintain
    pub async fn with_config(
        database_url: &str,
        max_connections: u32,
        min_connections: u32,
    ) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .min_connections(min_connections)
            .acquire_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(1800))
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    /// Get a reference to the underlying connection pool
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Get the User repository
    pub fn users(&self) -> UserRepository {
        UserRepository::new(self.pool.clone())
    }

    /// Get the Funnel repository
    pub fn funnels(&self) -> FunnelRepository {
        FunnelRepository::new(self.pool.clone())
    }

    /// Get the Page repository
    pub fn pages(&self) -> PageRepository {
        PageRepository::new(self.pool.clone())
    }

    /// Close all connections in the pool
    pub async fn close(&self) {
        self.pool.close().await;
    }

    /// Run database migrations
    ///
    /// This should be called during application startup to ensure
    /// the database schema is up-to-date.
    pub async fn run_migrations(&self) -> Result<()> {
        // Note: In production, you would use sqlx::migrate!() macro
        // For now, we'll create tables if they don't exist
        self.create_tables_if_not_exists().await?;
        Ok(())
    }

    /// Create database tables if they don't exist
    ///
    /// This is a simple migration approach. In production, you should use
    /// proper migration tools like sqlx-cli with migration files.
    async fn create_tables_if_not_exists(&self) -> Result<()> {
        // Create users table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                subscription_tier VARCHAR(50) NOT NULL DEFAULT 'Free',
                status VARCHAR(50) NOT NULL DEFAULT 'Active',
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                email_verification_token VARCHAR(255),
                password_reset_token VARCHAR(255),
                password_reset_expires_at TIMESTAMPTZ,
                funnels_count INTEGER NOT NULL DEFAULT 0,
                pages_count INTEGER NOT NULL DEFAULT 0,
                last_login_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create funnels table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS funnels (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                funnel_type VARCHAR(50) NOT NULL DEFAULT 'LeadGeneration',
                status VARCHAR(50) NOT NULL DEFAULT 'Draft',
                slug VARCHAR(255) NOT NULL,
                custom_domain VARCHAR(255),
                pages_count INTEGER NOT NULL DEFAULT 0,
                total_visits BIGINT NOT NULL DEFAULT 0,
                total_conversions BIGINT NOT NULL DEFAULT 0,
                conversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                total_revenue BIGINT NOT NULL DEFAULT 0,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                ga_tracking_id VARCHAR(255),
                fb_pixel_id VARCHAR(255),
                smtp_integration_id UUID,
                payment_integration_id UUID,
                settings JSONB NOT NULL DEFAULT '{}',
                seo_metadata JSONB NOT NULL DEFAULT '{}',
                published_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create pages table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS pages (
                id UUID PRIMARY KEY,
                funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                page_type VARCHAR(50) NOT NULL DEFAULT 'Landing',
                status VARCHAR(50) NOT NULL DEFAULT 'Draft',
                order_index INTEGER NOT NULL DEFAULT 0,
                html_content TEXT NOT NULL DEFAULT '',
                css_content TEXT NOT NULL DEFAULT '',
                js_content TEXT,
                settings JSONB NOT NULL DEFAULT '{}',
                seo_title VARCHAR(255),
                seo_description TEXT,
                seo_keywords TEXT,
                og_title VARCHAR(255),
                og_description TEXT,
                og_image VARCHAR(500),
                total_visits BIGINT NOT NULL DEFAULT 0,
                unique_visits BIGINT NOT NULL DEFAULT 0,
                total_conversions BIGINT NOT NULL DEFAULT 0,
                conversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                is_ab_test_variant BOOLEAN NOT NULL DEFAULT FALSE,
                ab_test_group_id UUID,
                ab_test_weight INTEGER,
                custom_head_code TEXT,
                custom_footer_code TEXT,
                preview_url VARCHAR(500),
                published_url VARCHAR(500),
                published_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes for better query performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON funnels(user_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_funnels_slug ON funnels(slug)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_funnel_id ON pages(funnel_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)")
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Health check - verify database connectivity
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1").execute(&self.pool).await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_database_connection() {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/clickfunnels_test".to_string());

        let db = Database::new(&database_url).await;
        assert!(db.is_ok());

        if let Ok(db) = db {
            assert!(db.health_check().await.is_ok());
            db.close().await;
        }
    }

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_migrations() {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/clickfunnels_test".to_string());

        let db = Database::new(&database_url).await.unwrap();
        let result = db.run_migrations().await;
        assert!(result.is_ok());

        db.close().await;
    }
}
