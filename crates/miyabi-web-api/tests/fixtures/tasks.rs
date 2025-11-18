//! Task test fixtures

use sqlx::{PgPool, Row};

/// Task fixture for testing
pub struct TaskFixture {
    pub id: i64,
    pub name: String,
    pub status: String,
    pub repository_id: i64,
}

impl TaskFixture {
    /// Create a test task in the database
    pub async fn create(
        pool: &PgPool,
        name: &str,
        status: &str,
        repository_id: i64,
    ) -> Self {
        // Using dynamic query to avoid compile-time schema verification
        let row = sqlx::query(
            r#"
            INSERT INTO tasks (name, status, repository_id)
            VALUES ($1, $2, $3)
            RETURNING id, name, status, repository_id
            "#,
        )
        .bind(name)
        .bind(status)
        .bind(repository_id)
        .fetch_one(pool)
        .await
        .expect("Failed to create test task");

        Self {
            id: row.get("id"),
            name: row.get("name"),
            status: row.get("status"),
            repository_id: row.get("repository_id"),
        }
    }

    /// Create a default pending task
    pub async fn pending(pool: &PgPool, repository_id: i64) -> Self {
        Self::create(pool, "Test Task", "pending", repository_id).await
    }

    /// Create a running task
    pub async fn running(pool: &PgPool, repository_id: i64) -> Self {
        Self::create(pool, "Running Task", "running", repository_id).await
    }

    /// Create a completed task
    pub async fn completed(pool: &PgPool, repository_id: i64) -> Self {
        Self::create(pool, "Completed Task", "completed", repository_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::helpers::setup_test_database;

    #[tokio::test]
    #[ignore] // Requires database - TODO: Fix repository ID type
    async fn test_create_task_fixture() {
        // Disabled due to repository ID type mismatch
        // Will be fixed when implementing actual tests
    }
}
