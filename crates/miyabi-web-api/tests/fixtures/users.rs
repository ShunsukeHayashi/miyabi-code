//! User test fixtures

use sqlx::{PgPool, Row};

/// User fixture for testing
pub struct UserFixture {
    pub id: i64,
    pub github_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

impl UserFixture {
    /// Create a test user in the database
    pub async fn create(pool: &PgPool, username: &str, github_id: i64) -> Self {
        // Using dynamic query to avoid compile-time schema verification
        let row = sqlx::query(
            r#"
            INSERT INTO users (github_id, username, email, avatar_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, github_id, username, email, avatar_url
            "#,
        )
        .bind(github_id)
        .bind(username)
        .bind(None::<String>)
        .bind(None::<String>)
        .fetch_one(pool)
        .await
        .expect("Failed to create test user");

        Self {
            id: row.get("id"),
            github_id: row.get("github_id"),
            username: row.get("username"),
            email: row.get("email"),
            avatar_url: row.get("avatar_url"),
        }
    }

    /// Create a default test user
    pub async fn default(pool: &PgPool) -> Self {
        Self::create(pool, "testuser", 12345).await
    }

    /// Create an admin user
    pub async fn admin(pool: &PgPool) -> Self {
        Self::create(pool, "admin", 99999).await
    }
}

#[derive(sqlx::FromRow)]
struct UserRecord {
    id: i64,
    github_id: i64,
    username: String,
    email: Option<String>,
    avatar_url: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::helpers::setup_test_database;

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_create_user_fixture() {
        let db = setup_test_database().await;
        let user = UserFixture::default(&db.pool).await;
        assert_eq!(user.username, "testuser");
        assert_eq!(user.github_id, 12345);
    }
}
