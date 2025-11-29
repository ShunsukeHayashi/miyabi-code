//! Database operations for miyabi-auth

use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{error::AuthError, models::{User, UserInfo, Project}};

pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn connect(url: &str) -> Result<Self, AuthError> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(url)
            .await?;
        Ok(Self { pool })
    }
    
    pub async fn upsert_user(&self, info: &UserInfo) -> Result<User, AuthError> {
        let user = sqlx::query_as::<_, User>(r#"
            INSERT INTO users (id, email, name, avatar_url, provider, provider_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (provider, provider_id) 
            DO UPDATE SET email = $2, name = $3, avatar_url = $4, updated_at = NOW()
            RETURNING *
        "#)
            .bind(Uuid::new_v4())
            .bind(&info.email)
            .bind(&info.name)
            .bind(&info.avatar_url)
            .bind(&info.provider)
            .bind(&info.provider_id)
            .fetch_one(&self.pool)
            .await?;
        Ok(user)
    }
    
    pub async fn get_user_by_id(&self, id: &str) -> Result<User, AuthError> {
        let uuid = Uuid::parse_str(id)
            .map_err(|_| AuthError::UserNotFound(id.to_string()))?;
        
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(uuid)
            .fetch_optional(&self.pool)
            .await?
            .ok_or_else(|| AuthError::UserNotFound(id.to_string()))
    }
    
    pub async fn create_project(&self, user_id: Uuid, name: &str, repo_url: Option<&str>, is_private: bool) -> Result<Project, AuthError> {
        let project = sqlx::query_as::<_, Project>(r#"
            INSERT INTO projects (id, user_id, name, repo_url, is_private, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
        "#)
            .bind(Uuid::new_v4())
            .bind(user_id)
            .bind(name)
            .bind(repo_url)
            .bind(is_private)
            .fetch_one(&self.pool)
            .await?;
        Ok(project)
    }
    
    pub async fn list_user_projects(&self, user_id: Uuid) -> Result<Vec<Project>, AuthError> {
        let projects = sqlx::query_as::<_, Project>(
            "SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC"
        )
            .bind(user_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(projects)
    }
}
