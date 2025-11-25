//! RBAC (Role-Based Access Control) Service
//!
//! Issue: #975 Phase 1.4 - RBAC Implementation
//! Provides authorization checking and permission management.

use crate::models::rbac::{
    EffectivePermission, Permission, PermissionCheckResult, Role, RoleWithPermissions,
    UserPermission,
};
use crate::error::{AppError, Result};
use sqlx::PgPool;
use uuid::Uuid;

/// RBAC Service for authorization management
#[derive(Clone)]
pub struct RbacService {
    db: PgPool,
}

impl RbacService {
    /// Create a new RBAC service
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Check if user has a specific permission in an organization
    pub async fn check_permission(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
        permission_code: &str,
    ) -> Result<PermissionCheckResult> {
        // Check using the has_permission function
        let result: Option<(bool,)> = sqlx::query_as(
            "SELECT has_permission($1, $2, $3)"
        )
        .bind(user_id)
        .bind(organization_id)
        .bind(permission_code)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        let allowed = result.map(|(b,)| b).unwrap_or(false);

        // If allowed, get the source
        let source_info = if allowed {
            let eff: Option<EffectivePermission> = sqlx::query_as(
                r#"
                SELECT user_id, organization_id, permission_code, category, source, role_code
                FROM user_effective_permissions
                WHERE user_id = $1
                  AND organization_id = $2
                  AND permission_code = $3
                LIMIT 1
                "#
            )
            .bind(user_id)
            .bind(organization_id)
            .bind(permission_code)
            .fetch_optional(&self.db)
            .await
            .map_err(AppError::Database)?;

            eff.map(|e| (e.source, e.role_code))
        } else {
            None
        };

        Ok(PermissionCheckResult {
            allowed,
            permission: permission_code.to_string(),
            source: source_info.as_ref().map(|(s, _)| s.clone()),
            role: source_info.and_then(|(_, r)| r),
        })
    }

    /// Check if user has any of the specified permissions
    pub async fn check_any_permission(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
        permission_codes: &[&str],
    ) -> Result<bool> {
        for code in permission_codes {
            let result = self.check_permission(user_id, organization_id, code).await?;
            if result.allowed {
                return Ok(true);
            }
        }
        Ok(false)
    }

    /// Check if user has all of the specified permissions
    pub async fn check_all_permissions(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
        permission_codes: &[&str],
    ) -> Result<bool> {
        for code in permission_codes {
            let result = self.check_permission(user_id, organization_id, code).await?;
            if !result.allowed {
                return Ok(false);
            }
        }
        Ok(true)
    }

    /// Get all effective permissions for a user in an organization
    pub async fn get_user_permissions(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
    ) -> Result<Vec<EffectivePermission>> {
        let permissions: Vec<EffectivePermission> = sqlx::query_as(
            r#"
            SELECT user_id, organization_id, permission_code, category, source, role_code
            FROM user_effective_permissions
            WHERE user_id = $1
              AND organization_id = $2
            ORDER BY category, permission_code
            "#
        )
        .bind(user_id)
        .bind(organization_id)
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(permissions)
    }

    /// Get user's role in an organization
    pub async fn get_user_org_role(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
    ) -> Result<Option<String>> {
        let role: Option<(String,)> = sqlx::query_as(
            r#"
            SELECT role::text
            FROM organization_members
            WHERE user_id = $1
              AND organization_id = $2
              AND status = 'active'
            "#
        )
        .bind(user_id)
        .bind(organization_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(role.map(|(r,)| format!("org:{}", r)))
    }

    /// List all available permissions
    pub async fn list_permissions(&self) -> Result<Vec<Permission>> {
        let permissions: Vec<Permission> = sqlx::query_as(
            r#"
            SELECT id, code, name, description, category, created_at
            FROM permissions
            ORDER BY category, code
            "#
        )
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(permissions)
    }

    /// List all available roles
    pub async fn list_roles(&self) -> Result<Vec<Role>> {
        let roles: Vec<Role> = sqlx::query_as(
            r#"
            SELECT id, code, name, description, scope, is_system, created_at
            FROM roles
            ORDER BY scope, code
            "#
        )
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(roles)
    }

    /// Get role with its permissions
    pub async fn get_role_with_permissions(&self, role_code: &str) -> Result<Option<RoleWithPermissions>> {
        // Get the role
        let role: Option<Role> = sqlx::query_as(
            r#"
            SELECT id, code, name, description, scope, is_system, created_at
            FROM roles
            WHERE code = $1
            "#
        )
        .bind(role_code)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        let Some(role) = role else {
            return Ok(None);
        };

        // Get permissions for this role
        let permissions: Vec<Permission> = sqlx::query_as(
            r#"
            SELECT p.id, p.code, p.name, p.description, p.category, p.created_at
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.code = $1
            ORDER BY p.category, p.code
            "#
        )
        .bind(role_code)
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(Some(RoleWithPermissions { role, permissions }))
    }

    /// Grant a direct permission to a user
    pub async fn grant_permission(
        &self,
        user_id: Uuid,
        permission_code: &str,
        organization_id: Option<Uuid>,
        granted_by: Uuid,
        expires_at: Option<chrono::DateTime<chrono::Utc>>,
    ) -> Result<UserPermission> {
        // Get permission ID from code
        let permission: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM permissions WHERE code = $1"
        )
        .bind(permission_code)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        let Some((permission_id,)) = permission else {
            return Err(AppError::NotFound(format!("Permission not found: {}", permission_code)));
        };

        // Insert the user permission
        let user_permission: UserPermission = sqlx::query_as(
            r#"
            INSERT INTO user_permissions (user_id, permission_id, organization_id, granted_by, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, permission_id, organization_id) DO UPDATE
            SET granted_by = $4, expires_at = $5, created_at = NOW()
            RETURNING id, user_id, permission_id, organization_id, granted_by, expires_at, created_at
            "#
        )
        .bind(user_id)
        .bind(permission_id)
        .bind(organization_id)
        .bind(granted_by)
        .bind(expires_at)
        .fetch_one(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(user_permission)
    }

    /// Revoke a direct permission from a user
    pub async fn revoke_permission(
        &self,
        user_id: Uuid,
        permission_code: &str,
        organization_id: Option<Uuid>,
    ) -> Result<bool> {
        // Get permission ID from code
        let permission: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM permissions WHERE code = $1"
        )
        .bind(permission_code)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        let Some((permission_id,)) = permission else {
            return Err(AppError::NotFound(format!("Permission not found: {}", permission_code)));
        };

        // Delete the user permission
        let result = sqlx::query(
            r#"
            DELETE FROM user_permissions
            WHERE user_id = $1
              AND permission_id = $2
              AND (organization_id = $3 OR ($3 IS NULL AND organization_id IS NULL))
            "#
        )
        .bind(user_id)
        .bind(permission_id)
        .bind(organization_id)
        .execute(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(result.rows_affected() > 0)
    }

    /// Check if user is organization owner
    pub async fn is_org_owner(&self, user_id: Uuid, organization_id: Uuid) -> Result<bool> {
        let result: Option<(i64,)> = sqlx::query_as(
            r#"
            SELECT 1
            FROM organization_members
            WHERE user_id = $1
              AND organization_id = $2
              AND role = 'owner'
              AND status = 'active'
            "#
        )
        .bind(user_id)
        .bind(organization_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(result.is_some())
    }

    /// Check if user is organization admin (owner or admin)
    pub async fn is_org_admin(&self, user_id: Uuid, organization_id: Uuid) -> Result<bool> {
        let result: Option<(i64,)> = sqlx::query_as(
            r#"
            SELECT 1
            FROM organization_members
            WHERE user_id = $1
              AND organization_id = $2
              AND role IN ('owner', 'admin')
              AND status = 'active'
            "#
        )
        .bind(user_id)
        .bind(organization_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(result.is_some())
    }

    /// Check if user is team lead
    pub async fn is_team_lead(&self, user_id: Uuid, team_id: Uuid) -> Result<bool> {
        let result: Option<(i64,)> = sqlx::query_as(
            r#"
            SELECT 1
            FROM team_members
            WHERE user_id = $1
              AND team_id = $2
              AND role = 'lead'
            "#
        )
        .bind(user_id)
        .bind(team_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(result.is_some())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rbac_service_creation() {
        // This would require a database connection for actual testing
        // Here we just verify the structure compiles
    }
}
