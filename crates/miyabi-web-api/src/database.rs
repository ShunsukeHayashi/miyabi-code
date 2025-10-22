//! Database connection pool and migrations

use crate::error::{AppError, Result};
use sqlx::{postgres::PgPoolOptions, PgPool};

/// Creates a PostgreSQL connection pool
///
/// # Arguments
///
/// * `database_url` - PostgreSQL connection URL
///
/// # Errors
///
/// Returns error if connection fails
pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
        .map_err(|e| AppError::Database(e))?;

    tracing::info!("Database connection pool created");

    Ok(pool)
}

/// Runs database migrations
///
/// # Arguments
///
/// * `pool` - Database connection pool
///
/// # Errors
///
/// Returns error if migrations fail
pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    // TODO: Implement migrations using sqlx::migrate!() macro
    // For now, we'll create tables manually in the initial release

    tracing::info!("Running database migrations");

    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            github_id BIGINT UNIQUE NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            avatar_url TEXT,
            access_token TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create repositories table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS repositories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            github_repo_id BIGINT UNIQUE NOT NULL,
            owner VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            full_name VARCHAR(511) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create agent_executions table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agent_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
            issue_number INTEGER NOT NULL,
            agent_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            result_summary JSONB,
            quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
            pr_number INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create workflows table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            dag_definition JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create line_messages table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS line_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            line_user_id VARCHAR(255) NOT NULL,
            message_type VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create websocket_connections table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS websocket_connections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            connection_id VARCHAR(255) UNIQUE NOT NULL,
            connected_at TIMESTAMPTZ DEFAULT NOW(),
            last_ping_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_agent_executions_repository_id ON agent_executions(repository_id)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_workflows_repository_id ON workflows(repository_id)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_line_messages_user_id ON line_messages(user_id)")
        .execute(pool)
        .await?;

    tracing::info!("Database migrations completed");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require a running PostgreSQL instance
    // Run with: cargo test --features test-db

    #[tokio::test]
    #[ignore] // Requires database setup
    async fn test_create_pool() {
        let database_url = "postgres://localhost/miyabi_test";
        let result = create_pool(database_url).await;
        assert!(result.is_ok());
    }
}
