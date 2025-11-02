//! User Repository - Database operations for User entity

use crate::{DatabaseError, Result};
use clickfunnels_core::entities::{SubscriptionTier, User, UserStatus};
use sqlx::{PgPool, Row};
use uuid::Uuid;

/// User repository for CRUD operations
#[derive(Clone)]
pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    /// Create a new UserRepository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new user
    pub async fn create(&self, user: &User) -> Result<User> {
        let subscription_tier_str = format!("{:?}", user.subscription_tier);
        let status_str = format!("{:?}", user.status);

        let row = sqlx::query(
            r#"
            INSERT INTO users (
                id, email, password_hash, full_name, company_name,
                subscription_tier, status, email_verified, email_verification_token,
                password_reset_token, password_reset_expires_at,
                funnels_count, pages_count, last_login_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.full_name)
        .bind(&user.company_name)
        .bind(&subscription_tier_str)
        .bind(&status_str)
        .bind(user.email_verified)
        .bind(&user.email_verification_token)
        .bind(&user.password_reset_token)
        .bind(user.password_reset_expires_at)
        .bind(user.funnels_count)
        .bind(user.pages_count)
        .bind(user.last_login_at)
        .bind(user.created_at)
        .bind(user.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref db_err) = e {
                if db_err.code().as_deref() == Some("23505") {
                    return DatabaseError::duplicate("User", "email", &user.email);
                }
            }
            DatabaseError::from(e)
        })?;

        Self::row_to_user(&row)
    }

    /// Find user by ID
    pub async fn find_by_id(&self, id: Uuid) -> Result<User> {
        let row = sqlx::query("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DatabaseError::not_found("User", "id", id.to_string()),
                _ => DatabaseError::from(e),
            })?;

        Self::row_to_user(&row)
    }

    /// Find user by email
    pub async fn find_by_email(&self, email: &str) -> Result<User> {
        let row = sqlx::query("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DatabaseError::not_found("User", "email", email),
                _ => DatabaseError::from(e),
            })?;

        Self::row_to_user(&row)
    }

    /// List all users with pagination
    pub async fn list(&self, page: i64, page_size: i64) -> Result<Vec<User>> {
        let offset = (page - 1) * page_size;

        let rows = sqlx::query("SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2")
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_user).collect()
    }

    /// Count total users
    pub async fn count(&self) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM users")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get("count"))
    }

    /// Update user
    pub async fn update(&self, user: &User) -> Result<User> {
        let subscription_tier_str = format!("{:?}", user.subscription_tier);
        let status_str = format!("{:?}", user.status);

        let row = sqlx::query(
            r#"
            UPDATE users SET
                email = $2,
                password_hash = $3,
                full_name = $4,
                company_name = $5,
                subscription_tier = $6,
                status = $7,
                email_verified = $8,
                email_verification_token = $9,
                password_reset_token = $10,
                password_reset_expires_at = $11,
                funnels_count = $12,
                pages_count = $13,
                last_login_at = $14,
                updated_at = $15
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.full_name)
        .bind(&user.company_name)
        .bind(&subscription_tier_str)
        .bind(&status_str)
        .bind(user.email_verified)
        .bind(&user.email_verification_token)
        .bind(&user.password_reset_token)
        .bind(user.password_reset_expires_at)
        .bind(user.funnels_count)
        .bind(user.pages_count)
        .bind(user.last_login_at)
        .bind(user.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => DatabaseError::not_found("User", "id", user.id.to_string()),
            _ => DatabaseError::from(e),
        })?;

        Self::row_to_user(&row)
    }

    /// Delete user by ID
    pub async fn delete(&self, id: Uuid) -> Result<()> {
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(DatabaseError::not_found("User", "id", id.to_string()));
        }

        Ok(())
    }

    /// Convert database row to User entity
    fn row_to_user(row: &sqlx::postgres::PgRow) -> Result<User> {
        let subscription_tier_str: String = row.get("subscription_tier");
        let subscription_tier = match subscription_tier_str.as_str() {
            "Free" => SubscriptionTier::Free,
            "Startup" => SubscriptionTier::Startup,
            "Professional" => SubscriptionTier::Professional,
            "Enterprise" => SubscriptionTier::Enterprise,
            _ => SubscriptionTier::Free,
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "Active" => UserStatus::Active,
            "Suspended" => UserStatus::Suspended,
            "Deleted" => UserStatus::Deleted,
            _ => UserStatus::Active,
        };

        Ok(User {
            id: row.get("id"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            full_name: row.get("full_name"),
            company_name: row.get("company_name"),
            subscription_tier,
            status,
            email_verified: row.get("email_verified"),
            email_verification_token: row.get("email_verification_token"),
            password_reset_token: row.get("password_reset_token"),
            password_reset_expires_at: row.get("password_reset_expires_at"),
            funnels_count: row.get("funnels_count"),
            pages_count: row.get("pages_count"),
            last_login_at: row.get("last_login_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore = "Requires PostgreSQL database"]
    async fn test_user_crud() {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/clickfunnels_test".to_string());

        let pool = PgPool::connect(&database_url).await.unwrap();
        let repo = UserRepository::new(pool.clone());

        // Create
        let user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        let created = repo.create(&user).await.unwrap();
        assert_eq!(created.email, "test@example.com");

        // Find by ID
        let found = repo.find_by_id(created.id).await.unwrap();
        assert_eq!(found.email, "test@example.com");

        // Find by email
        let found_by_email = repo.find_by_email("test@example.com").await.unwrap();
        assert_eq!(found_by_email.id, created.id);

        // Update
        let mut updated_user = found.clone();
        updated_user.full_name = "Updated Name".to_string();
        let updated = repo.update(&updated_user).await.unwrap();
        assert_eq!(updated.full_name, "Updated Name");

        // Delete
        repo.delete(created.id).await.unwrap();

        // Verify deleted
        let result = repo.find_by_id(created.id).await;
        assert!(result.is_err());

        pool.close().await;
    }
}
