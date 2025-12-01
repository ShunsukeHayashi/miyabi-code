//! Agent test fixtures

use sqlx::{PgPool, Row};

/// Agent fixture for testing
pub struct AgentFixture {
    #[allow(dead_code)]
    pub id: i64,
    pub agent_type: String,
    pub status: String,
}

impl AgentFixture {
    /// Create a test agent in the database
    pub async fn create(pool: &PgPool, agent_type: &str, status: &str) -> Self {
        // Using dynamic query to avoid compile-time schema verification
        let row = sqlx::query(
            r#"
            INSERT INTO agents (agent_type, status)
            VALUES ($1, $2)
            RETURNING id, agent_type, status
            "#,
        )
        .bind(agent_type)
        .bind(status)
        .fetch_one(pool)
        .await
        .expect("Failed to create test agent");

        Self { id: row.get("id"), agent_type: row.get("agent_type"), status: row.get("status") }
    }

    /// Create a default CodeGen agent
    pub async fn code_gen(pool: &PgPool) -> Self {
        Self::create(pool, "CodeGen", "available").await
    }

    /// Create a Review agent
    #[allow(dead_code)]
    pub async fn review(pool: &PgPool) -> Self {
        Self::create(pool, "Review", "available").await
    }

    /// Create a Deployment agent
    #[allow(dead_code)]
    pub async fn deployment(pool: &PgPool) -> Self {
        Self::create(pool, "Deployment", "available").await
    }

    /// Create a busy agent
    #[allow(dead_code)]
    pub async fn busy(pool: &PgPool, agent_type: &str) -> Self {
        Self::create(pool, agent_type, "busy").await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::helpers::setup_test_database;

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_create_agent_fixture() {
        let db = setup_test_database().await;
        let agent = AgentFixture::code_gen(&db.pool).await;
        assert_eq!(agent.agent_type, "CodeGen");
        assert_eq!(agent.status, "available");
    }
}
