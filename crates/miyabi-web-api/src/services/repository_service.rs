//! Repository Service
//!
//! Manages GitHub repository connections and operations
//! Issue: #983 Phase 2.1 - Service Layer Refactoring

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Repository model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Repository {
    pub id: Uuid,
    pub user_id: Uuid,
    pub organization_id: Option<Uuid>,
    pub github_id: i64,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub url: String,
    pub default_branch: String,
    pub is_private: bool,
    pub is_active: bool,
    pub last_synced_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create/connect a repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRepositoryRequest {
    pub github_id: i64,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub url: String,
    pub default_branch: String,
    pub is_private: bool,
    pub organization_id: Option<Uuid>,
}

/// Repository filter for listing
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RepositoryFilter {
    pub organization_id: Option<Uuid>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

/// Repository statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryStats {
    pub total_tasks: i64,
    pub open_issues: i64,
    pub open_prs: i64,
    pub last_activity: Option<DateTime<Utc>>,
}

/// Repository Service for managing repository connections
#[derive(Clone)]
pub struct RepositoryService {
    db: PgPool,
}

impl RepositoryService {
    /// Create a new RepositoryService
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Connect a new repository
    pub async fn create(
        &self,
        user_id: Uuid,
        req: CreateRepositoryRequest,
    ) -> Result<Repository, sqlx::Error> {
        let repo = sqlx::query_as::<_, Repository>(
            r#"
            INSERT INTO repositories (
                user_id, organization_id, github_id, name, full_name,
                description, url, default_branch, is_private, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(req.organization_id)
        .bind(req.github_id)
        .bind(&req.name)
        .bind(&req.full_name)
        .bind(&req.description)
        .bind(&req.url)
        .bind(&req.default_branch)
        .bind(req.is_private)
        .fetch_one(&self.db)
        .await?;

        Ok(repo)
    }

    /// Get a repository by ID
    pub async fn get(
        &self,
        user_id: Uuid,
        repo_id: Uuid,
    ) -> Result<Option<Repository>, sqlx::Error> {
        let repo = sqlx::query_as::<_, Repository>(
            "SELECT * FROM repositories WHERE id = $1 AND user_id = $2",
        )
        .bind(repo_id)
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(repo)
    }

    /// Get a repository by GitHub ID
    pub async fn get_by_github_id(
        &self,
        user_id: Uuid,
        github_id: i64,
    ) -> Result<Option<Repository>, sqlx::Error> {
        let repo = sqlx::query_as::<_, Repository>(
            "SELECT * FROM repositories WHERE github_id = $1 AND user_id = $2",
        )
        .bind(github_id)
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(repo)
    }

    /// List repositories with filtering
    pub async fn list(
        &self,
        user_id: Uuid,
        filter: RepositoryFilter,
    ) -> Result<Vec<Repository>, sqlx::Error> {
        let page = filter.page.unwrap_or(1).max(1);
        let limit = filter.limit.unwrap_or(20).min(100);
        let offset = (page - 1) * limit;

        let repos = sqlx::query_as::<_, Repository>(
            r#"
            SELECT * FROM repositories
            WHERE user_id = $1
              AND ($2::uuid IS NULL OR organization_id = $2)
              AND ($3::boolean IS NULL OR is_active = $3)
              AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR full_name ILIKE '%' || $4 || '%')
            ORDER BY updated_at DESC
            LIMIT $5 OFFSET $6
            "#,
        )
        .bind(user_id)
        .bind(filter.organization_id)
        .bind(filter.is_active)
        .bind(filter.search)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await?;

        Ok(repos)
    }

    /// Count repositories matching filter
    pub async fn count(&self, user_id: Uuid, filter: RepositoryFilter) -> Result<i64, sqlx::Error> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM repositories
            WHERE user_id = $1
              AND ($2::uuid IS NULL OR organization_id = $2)
              AND ($3::boolean IS NULL OR is_active = $3)
              AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR full_name ILIKE '%' || $4 || '%')
            "#,
        )
        .bind(user_id)
        .bind(filter.organization_id)
        .bind(filter.is_active)
        .bind(filter.search)
        .fetch_one(&self.db)
        .await?;

        Ok(count)
    }

    /// Update repository sync timestamp
    pub async fn update_sync_time(&self, repo_id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE repositories
            SET last_synced_at = NOW(), updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(repo_id)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    /// Deactivate a repository
    pub async fn deactivate(&self, user_id: Uuid, repo_id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE repositories
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(repo_id)
        .bind(user_id)
        .execute(&self.db)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Delete a repository
    pub async fn delete(&self, user_id: Uuid, repo_id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM repositories WHERE id = $1 AND user_id = $2")
            .bind(repo_id)
            .bind(user_id)
            .execute(&self.db)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Get repository statistics
    pub async fn get_stats(&self, repo_id: Uuid) -> Result<RepositoryStats, sqlx::Error> {
        // Query task count for this repository
        let task_count =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tasks WHERE repository_id = $1")
                .bind(repo_id)
                .fetch_one(&self.db)
                .await
                .unwrap_or(0);

        // Get last activity
        let last_activity = sqlx::query_scalar::<_, DateTime<Utc>>(
            "SELECT MAX(updated_at) FROM tasks WHERE repository_id = $1",
        )
        .bind(repo_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(RepositoryStats {
            total_tasks: task_count,
            open_issues: 0, // TODO: Query from GitHub or cache
            open_prs: 0,    // TODO: Query from GitHub or cache
            last_activity,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_repository_filter_default() {
        let filter = RepositoryFilter::default();
        assert!(filter.organization_id.is_none());
        assert!(filter.is_active.is_none());
        assert!(filter.search.is_none());
    }
}
