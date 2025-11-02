//! Funnel Repository - Database operations for Funnel entity

use crate::{DatabaseError, Result};
use clickfunnels_core::entities::{Funnel, FunnelStatus, FunnelType};
use sqlx::{PgPool, Row};
use uuid::Uuid;

/// Funnel repository for CRUD operations
#[derive(Clone)]
pub struct FunnelRepository {
    pool: PgPool,
}

impl FunnelRepository {
    /// Create a new FunnelRepository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new funnel
    pub async fn create(&self, funnel: &Funnel) -> Result<Funnel> {
        let funnel_type_str = format!("{:?}", funnel.funnel_type);
        let status_str = format!("{:?}", funnel.status);

        let row = sqlx::query(
            r#"
            INSERT INTO funnels (
                id, user_id, name, description, funnel_type, status, slug, custom_domain,
                pages_count, total_visits, total_conversions, conversion_rate, total_revenue,
                currency, ga_tracking_id, fb_pixel_id, smtp_integration_id, payment_integration_id,
                settings, seo_metadata, published_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *
            "#,
        )
        .bind(funnel.id)
        .bind(funnel.user_id)
        .bind(&funnel.name)
        .bind(&funnel.description)
        .bind(&funnel_type_str)
        .bind(&status_str)
        .bind(&funnel.slug)
        .bind(&funnel.custom_domain)
        .bind(funnel.pages_count)
        .bind(funnel.total_visits)
        .bind(funnel.total_conversions)
        .bind(funnel.conversion_rate)
        .bind(funnel.total_revenue)
        .bind(&funnel.currency)
        .bind(&funnel.ga_tracking_id)
        .bind(&funnel.fb_pixel_id)
        .bind(funnel.smtp_integration_id)
        .bind(funnel.payment_integration_id)
        .bind(&funnel.settings)
        .bind(&funnel.seo_metadata)
        .bind(funnel.published_at)
        .bind(funnel.created_at)
        .bind(funnel.updated_at)
        .fetch_one(&self.pool)
        .await?;

        Self::row_to_funnel(&row)
    }

    /// Find funnel by ID
    pub async fn find_by_id(&self, id: Uuid) -> Result<Funnel> {
        let row = sqlx::query("SELECT * FROM funnels WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => {
                    DatabaseError::not_found("Funnel", "id", id.to_string())
                }
                _ => DatabaseError::from(e),
            })?;

        Self::row_to_funnel(&row)
    }

    /// Find funnels by user ID
    pub async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<Funnel>> {
        let rows = sqlx::query("SELECT * FROM funnels WHERE user_id = $1 ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_funnel).collect()
    }

    /// List all funnels with pagination
    pub async fn list(&self, page: i64, page_size: i64) -> Result<Vec<Funnel>> {
        let offset = (page - 1) * page_size;

        let rows = sqlx::query("SELECT * FROM funnels ORDER BY created_at DESC LIMIT $1 OFFSET $2")
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_funnel).collect()
    }

    /// List funnels for a specific user with pagination
    pub async fn list_by_user(
        &self,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Funnel>> {
        let offset = (page - 1) * page_size;

        let rows = sqlx::query(
            "SELECT * FROM funnels WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(user_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        rows.iter().map(Self::row_to_funnel).collect()
    }

    /// Count total funnels
    pub async fn count(&self) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM funnels")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get("count"))
    }

    /// Count funnels for a specific user
    pub async fn count_by_user(&self, user_id: Uuid) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM funnels WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get("count"))
    }

    /// Update funnel
    pub async fn update(&self, funnel: &Funnel) -> Result<Funnel> {
        let funnel_type_str = format!("{:?}", funnel.funnel_type);
        let status_str = format!("{:?}", funnel.status);

        let row = sqlx::query(
            r#"
            UPDATE funnels SET
                name = $2, description = $3, funnel_type = $4, status = $5, slug = $6,
                custom_domain = $7, pages_count = $8, total_visits = $9, total_conversions = $10,
                conversion_rate = $11, total_revenue = $12, currency = $13, ga_tracking_id = $14,
                fb_pixel_id = $15, smtp_integration_id = $16, payment_integration_id = $17,
                settings = $18, seo_metadata = $19, published_at = $20, updated_at = $21
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(funnel.id)
        .bind(&funnel.name)
        .bind(&funnel.description)
        .bind(&funnel_type_str)
        .bind(&status_str)
        .bind(&funnel.slug)
        .bind(&funnel.custom_domain)
        .bind(funnel.pages_count)
        .bind(funnel.total_visits)
        .bind(funnel.total_conversions)
        .bind(funnel.conversion_rate)
        .bind(funnel.total_revenue)
        .bind(&funnel.currency)
        .bind(&funnel.ga_tracking_id)
        .bind(&funnel.fb_pixel_id)
        .bind(funnel.smtp_integration_id)
        .bind(funnel.payment_integration_id)
        .bind(&funnel.settings)
        .bind(&funnel.seo_metadata)
        .bind(funnel.published_at)
        .bind(funnel.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                DatabaseError::not_found("Funnel", "id", funnel.id.to_string())
            }
            _ => DatabaseError::from(e),
        })?;

        Self::row_to_funnel(&row)
    }

    /// Delete funnel by ID
    pub async fn delete(&self, id: Uuid) -> Result<()> {
        let result = sqlx::query("DELETE FROM funnels WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(DatabaseError::not_found("Funnel", "id", id.to_string()));
        }

        Ok(())
    }

    /// Convert database row to Funnel entity
    fn row_to_funnel(row: &sqlx::postgres::PgRow) -> Result<Funnel> {
        let funnel_type_str: String = row.get("funnel_type");
        let funnel_type = match funnel_type_str.as_str() {
            "LeadGeneration" => FunnelType::LeadGeneration,
            "Sales" => FunnelType::Sales,
            "Webinar" => FunnelType::Webinar,
            "Application" => FunnelType::Application,
            "Membership" => FunnelType::Membership,
            "Custom" => FunnelType::Custom,
            _ => FunnelType::LeadGeneration,
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "Draft" => FunnelStatus::Draft,
            "Published" => FunnelStatus::Published,
            "Archived" => FunnelStatus::Archived,
            _ => FunnelStatus::Draft,
        };

        Ok(Funnel {
            id: row.get("id"),
            user_id: row.get("user_id"),
            name: row.get("name"),
            description: row.get("description"),
            funnel_type,
            status,
            slug: row.get("slug"),
            custom_domain: row.get("custom_domain"),
            pages_count: row.get("pages_count"),
            total_visits: row.get("total_visits"),
            total_conversions: row.get("total_conversions"),
            conversion_rate: row.get("conversion_rate"),
            total_revenue: row.get("total_revenue"),
            currency: row.get("currency"),
            ga_tracking_id: row.get("ga_tracking_id"),
            fb_pixel_id: row.get("fb_pixel_id"),
            smtp_integration_id: row.get("smtp_integration_id"),
            payment_integration_id: row.get("payment_integration_id"),
            settings: row.get("settings"),
            seo_metadata: row.get("seo_metadata"),
            published_at: row.get("published_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
