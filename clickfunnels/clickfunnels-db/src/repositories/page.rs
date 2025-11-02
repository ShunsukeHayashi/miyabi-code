//! Page Repository - Database operations for Page entity

use crate::{DatabaseError, Result};
use clickfunnels_core::entities::{Page, PageStatus, PageType};
use sqlx::{PgPool, Row};
use uuid::Uuid;

/// Page repository for CRUD operations
#[derive(Clone)]
pub struct PageRepository {
    pool: PgPool,
}

impl PageRepository {
    /// Create a new PageRepository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new page
    pub async fn create(&self, page: &Page) -> Result<Page> {
        let page_type_str = format!("{:?}", page.page_type);
        let status_str = format!("{:?}", page.status);

        let row = sqlx::query(
            r#"
            INSERT INTO pages (
                id, funnel_id, user_id, name, title, slug, page_type, status, order_index,
                html_content, css_content, js_content, settings, seo_title, seo_description,
                seo_keywords, og_title, og_description, og_image, total_visits, unique_visits,
                total_conversions, conversion_rate, is_ab_test_variant, ab_test_group_id,
                ab_test_weight, custom_head_code, custom_footer_code, preview_url, published_url,
                published_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
            RETURNING *
            "#,
        )
        .bind(page.id)
        .bind(page.funnel_id)
        .bind(page.user_id)
        .bind(&page.name)
        .bind(&page.title)
        .bind(&page.slug)
        .bind(&page_type_str)
        .bind(&status_str)
        .bind(page.order_index)
        .bind(&page.html_content)
        .bind(&page.css_content)
        .bind(&page.js_content)
        .bind(&page.settings)
        .bind(&page.seo_title)
        .bind(&page.seo_description)
        .bind(&page.seo_keywords)
        .bind(&page.og_title)
        .bind(&page.og_description)
        .bind(&page.og_image)
        .bind(page.total_visits)
        .bind(page.unique_visits)
        .bind(page.total_conversions)
        .bind(page.conversion_rate)
        .bind(page.is_ab_test_variant)
        .bind(page.ab_test_group_id)
        .bind(page.ab_test_weight)
        .bind(&page.custom_head_code)
        .bind(&page.custom_footer_code)
        .bind(&page.preview_url)
        .bind(&page.published_url)
        .bind(page.published_at)
        .bind(page.created_at)
        .bind(page.updated_at)
        .fetch_one(&self.pool)
        .await?;

        Self::row_to_page(&row)
    }

    /// Find page by ID
    pub async fn find_by_id(&self, id: Uuid) -> Result<Page> {
        let row = sqlx::query("SELECT * FROM pages WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DatabaseError::not_found("Page", "id", id.to_string()),
                _ => DatabaseError::from(e),
            })?;

        Self::row_to_page(&row)
    }

    /// Find pages by funnel ID
    pub async fn find_by_funnel_id(&self, funnel_id: Uuid) -> Result<Vec<Page>> {
        let rows = sqlx::query("SELECT * FROM pages WHERE funnel_id = $1 ORDER BY order_index ASC")
            .bind(funnel_id)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_page).collect()
    }

    /// Find pages by user ID
    pub async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<Page>> {
        let rows = sqlx::query("SELECT * FROM pages WHERE user_id = $1 ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_page).collect()
    }

    /// List all pages with pagination
    pub async fn list(&self, page: i64, page_size: i64) -> Result<Vec<Page>> {
        let offset = (page - 1) * page_size;

        let rows = sqlx::query("SELECT * FROM pages ORDER BY created_at DESC LIMIT $1 OFFSET $2")
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        rows.iter().map(Self::row_to_page).collect()
    }

    /// List pages for a specific user with pagination
    pub async fn list_by_user(
        &self,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Page>> {
        let offset = (page - 1) * page_size;

        let rows = sqlx::query(
            "SELECT * FROM pages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(user_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        rows.iter().map(Self::row_to_page).collect()
    }

    /// Count total pages
    pub async fn count(&self) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM pages")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get("count"))
    }

    /// Count pages for a specific user
    pub async fn count_by_user(&self, user_id: Uuid) -> Result<i64> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM pages WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get("count"))
    }

    /// Update page
    pub async fn update(&self, page: &Page) -> Result<Page> {
        let page_type_str = format!("{:?}", page.page_type);
        let status_str = format!("{:?}", page.status);

        let row = sqlx::query(
            r#"
            UPDATE pages SET
                name = $2, title = $3, slug = $4, page_type = $5, status = $6, order_index = $7,
                html_content = $8, css_content = $9, js_content = $10, settings = $11,
                seo_title = $12, seo_description = $13, seo_keywords = $14, og_title = $15,
                og_description = $16, og_image = $17, total_visits = $18, unique_visits = $19,
                total_conversions = $20, conversion_rate = $21, is_ab_test_variant = $22,
                ab_test_group_id = $23, ab_test_weight = $24, custom_head_code = $25,
                custom_footer_code = $26, preview_url = $27, published_url = $28,
                published_at = $29, updated_at = $30
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(page.id)
        .bind(&page.name)
        .bind(&page.title)
        .bind(&page.slug)
        .bind(&page_type_str)
        .bind(&status_str)
        .bind(page.order_index)
        .bind(&page.html_content)
        .bind(&page.css_content)
        .bind(&page.js_content)
        .bind(&page.settings)
        .bind(&page.seo_title)
        .bind(&page.seo_description)
        .bind(&page.seo_keywords)
        .bind(&page.og_title)
        .bind(&page.og_description)
        .bind(&page.og_image)
        .bind(page.total_visits)
        .bind(page.unique_visits)
        .bind(page.total_conversions)
        .bind(page.conversion_rate)
        .bind(page.is_ab_test_variant)
        .bind(page.ab_test_group_id)
        .bind(page.ab_test_weight)
        .bind(&page.custom_head_code)
        .bind(&page.custom_footer_code)
        .bind(&page.preview_url)
        .bind(&page.published_url)
        .bind(page.published_at)
        .bind(page.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => DatabaseError::not_found("Page", "id", page.id.to_string()),
            _ => DatabaseError::from(e),
        })?;

        Self::row_to_page(&row)
    }

    /// Delete page by ID
    pub async fn delete(&self, id: Uuid) -> Result<()> {
        let result = sqlx::query("DELETE FROM pages WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(DatabaseError::not_found("Page", "id", id.to_string()));
        }

        Ok(())
    }

    /// Convert database row to Page entity
    fn row_to_page(row: &sqlx::postgres::PgRow) -> Result<Page> {
        let page_type_str: String = row.get("page_type");
        let page_type = match page_type_str.as_str() {
            "Landing" => PageType::Landing,
            "Sales" => PageType::Sales,
            "Checkout" => PageType::Checkout,
            "Upsell" => PageType::Upsell,
            "Downsell" => PageType::Downsell,
            "ThankYou" => PageType::ThankYou,
            "Webinar" => PageType::Webinar,
            "Membership" => PageType::Membership,
            "Custom" => PageType::Custom,
            _ => PageType::Landing,
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "Draft" => PageStatus::Draft,
            "Published" => PageStatus::Published,
            "Archived" => PageStatus::Archived,
            _ => PageStatus::Draft,
        };

        Ok(Page {
            id: row.get("id"),
            funnel_id: row.get("funnel_id"),
            user_id: row.get("user_id"),
            name: row.get("name"),
            title: row.get("title"),
            slug: row.get("slug"),
            page_type,
            status,
            order_index: row.get("order_index"),
            html_content: row.get("html_content"),
            css_content: row.get("css_content"),
            js_content: row.get("js_content"),
            settings: row.get("settings"),
            seo_title: row.get("seo_title"),
            seo_description: row.get("seo_description"),
            seo_keywords: row.get("seo_keywords"),
            og_title: row.get("og_title"),
            og_description: row.get("og_description"),
            og_image: row.get("og_image"),
            total_visits: row.get("total_visits"),
            unique_visits: row.get("unique_visits"),
            total_conversions: row.get("total_conversions"),
            conversion_rate: row.get("conversion_rate"),
            is_ab_test_variant: row.get("is_ab_test_variant"),
            ab_test_group_id: row.get("ab_test_group_id"),
            ab_test_weight: row.get("ab_test_weight"),
            custom_head_code: row.get("custom_head_code"),
            custom_footer_code: row.get("custom_footer_code"),
            preview_url: row.get("preview_url"),
            published_url: row.get("published_url"),
            published_at: row.get("published_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
