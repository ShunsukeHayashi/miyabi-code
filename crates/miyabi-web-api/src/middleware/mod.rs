//! Middleware for authentication and authorization
//!
//! Issue: #970 Phase 1.4 - RBAC Implementation
//! Issue: #1176 - RBAC Middleware with has_permission

// Submodules
pub mod rbac;

use crate::{
    auth::JwtManager,
    error::{AppError, Result},
    models::{OrgMemberRole, TeamMemberRole},
};
use axum::{
    extract::{Path, Request, State},
    http::HeaderMap,
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;
use uuid::Uuid;

// Re-export RBAC types for convenience
pub use rbac::{require_permission, PermissionRequirement, RbacContext};

// Keep legacy export but mark as deprecated
#[allow(deprecated)]
pub use rbac::rbac_check_permission;

// ============================================================================
// Extension Types
// ============================================================================

/// Extension type for authenticated user ID
#[derive(Clone, Debug)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub github_id: i64,
}

/// Extension type for organization context
#[derive(Clone, Debug)]
pub struct OrganizationContext {
    pub organization_id: Uuid,
    pub user_role: OrgMemberRole,
}

/// Extension type for team context
#[derive(Clone, Debug)]
pub struct TeamContext {
    pub team_id: Uuid,
    pub organization_id: Uuid,
    pub user_role: TeamMemberRole,
}

// ============================================================================
// Token Extraction
// ============================================================================

/// Extract JWT token from Authorization header
fn extract_token(headers: &HeaderMap) -> Result<String> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;

    crate::auth::extract_bearer_token(auth_header).map(|s| s.to_string())
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/// Authentication middleware
///
/// Validates JWT token and attaches user info to request extensions
pub async fn auth_middleware(
    State(jwt_secret): State<String>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Extract token from headers
    let token = extract_token(request.headers())?;

    // Validate token
    let jwt_manager = JwtManager::new(&jwt_secret, 3600);
    let claims = jwt_manager.validate_token(&token)?;

    // Parse user ID
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID: {}", e)))?;

    // Attach user info to request
    let auth_user = AuthenticatedUser {
        user_id,
        github_id: claims.github_id,
    };
    request.extensions_mut().insert(auth_user);

    Ok(next.run(request).await)
}

// ============================================================================
// RBAC Middleware
// ============================================================================

/// Organization membership check middleware
///
/// Validates that the user is a member of the specified organization
/// and attaches organization context to request extensions.
///
/// Expects `org_id` path parameter
pub async fn org_member_middleware(
    State(db): State<PgPool>,
    Path(org_id): Path<Uuid>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Get authenticated user from extensions
    let auth_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| AppError::Authentication("Not authenticated".to_string()))?;

    // Check organization membership
    let membership = sqlx::query_as::<_, (OrgMemberRole, String)>(
        r#"
        SELECT role, status
        FROM organization_members
        WHERE organization_id = $1 AND user_id = $2
        "#,
    )
    .bind(org_id)
    .bind(auth_user.user_id)
    .fetch_optional(&db)
    .await
    .map_err(AppError::Database)?;

    match membership {
        Some((role, status)) if status == "active" => {
            // Attach organization context
            let org_ctx = OrganizationContext {
                organization_id: org_id,
                user_role: role,
            };
            request.extensions_mut().insert(org_ctx);
            Ok(next.run(request).await)
        }
        Some((_, status)) => Err(AppError::Authorization(format!(
            "Membership is not active: {}",
            status
        ))),
        None => Err(AppError::Authorization(
            "Not a member of this organization".to_string(),
        )),
    }
}

/// Organization admin check middleware
///
/// Requires user to be an owner or admin of the organization
pub async fn org_admin_middleware(
    State(db): State<PgPool>,
    Path(org_id): Path<Uuid>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Get authenticated user from extensions
    let auth_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| AppError::Authentication("Not authenticated".to_string()))?;

    // Check organization membership with admin role
    let membership = sqlx::query_as::<_, (OrgMemberRole, String)>(
        r#"
        SELECT role, status
        FROM organization_members
        WHERE organization_id = $1 AND user_id = $2
        "#,
    )
    .bind(org_id)
    .bind(auth_user.user_id)
    .fetch_optional(&db)
    .await
    .map_err(AppError::Database)?;

    match membership {
        Some((role, status)) if status == "active" && role.can_manage_members() => {
            let org_ctx = OrganizationContext {
                organization_id: org_id,
                user_role: role,
            };
            request.extensions_mut().insert(org_ctx);
            Ok(next.run(request).await)
        }
        Some((role, _)) => Err(AppError::Authorization(format!(
            "Insufficient permissions: {} cannot manage this organization",
            role
        ))),
        None => Err(AppError::Authorization(
            "Not a member of this organization".to_string(),
        )),
    }
}

/// Organization owner check middleware
///
/// Requires user to be the owner of the organization
pub async fn org_owner_middleware(
    State(db): State<PgPool>,
    Path(org_id): Path<Uuid>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Get authenticated user from extensions
    let auth_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| AppError::Authentication("Not authenticated".to_string()))?;

    // Check if user is owner
    let is_owner = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM organization_members
            WHERE organization_id = $1
              AND user_id = $2
              AND role = 'owner'
              AND status = 'active'
        )
        "#,
    )
    .bind(org_id)
    .bind(auth_user.user_id)
    .fetch_one(&db)
    .await
    .map_err(AppError::Database)?;

    if is_owner {
        let org_ctx = OrganizationContext {
            organization_id: org_id,
            user_role: OrgMemberRole::Owner,
        };
        request.extensions_mut().insert(org_ctx);
        Ok(next.run(request).await)
    } else {
        Err(AppError::Authorization(
            "Only organization owner can perform this action".to_string(),
        ))
    }
}

/// Team membership check middleware
///
/// Validates that the user is a member of the specified team
/// User must also be an org member.
pub async fn team_member_middleware(
    State(db): State<PgPool>,
    Path((org_id, team_id)): Path<(Uuid, Uuid)>,
    mut request: Request,
    next: Next,
) -> Result<Response> {
    // Get authenticated user from extensions
    let auth_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| AppError::Authentication("Not authenticated".to_string()))?;

    // First verify org membership
    let org_membership = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM organization_members
            WHERE organization_id = $1 AND user_id = $2 AND status = 'active'
        )
        "#,
    )
    .bind(org_id)
    .bind(auth_user.user_id)
    .fetch_one(&db)
    .await
    .map_err(AppError::Database)?;

    if !org_membership {
        return Err(AppError::Authorization(
            "Not a member of this organization".to_string(),
        ));
    }

    // Check team membership
    let team_role = sqlx::query_scalar::<_, TeamMemberRole>(
        r#"
        SELECT tm.role
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.team_id = $1
          AND tm.user_id = $2
          AND t.organization_id = $3
        "#,
    )
    .bind(team_id)
    .bind(auth_user.user_id)
    .bind(org_id)
    .fetch_optional(&db)
    .await
    .map_err(AppError::Database)?;

    match team_role {
        Some(role) => {
            let team_ctx = TeamContext {
                team_id,
                organization_id: org_id,
                user_role: role,
            };
            request.extensions_mut().insert(team_ctx);
            Ok(next.run(request).await)
        }
        None => Err(AppError::Authorization(
            "Not a member of this team".to_string(),
        )),
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Check if user has permission to access a repository
pub async fn check_repository_access(
    db: &PgPool,
    user_id: Uuid,
    repository_id: Uuid,
) -> Result<bool> {
    // Check direct ownership or org/team membership
    let has_access = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM repositories r
            WHERE r.id = $1
            AND (
                -- Direct owner
                r.user_id = $2
                -- Or org member with access
                OR EXISTS(
                    SELECT 1 FROM organization_members om
                    WHERE om.organization_id = r.organization_id
                      AND om.user_id = $2
                      AND om.status = 'active'
                )
                -- Or team member with access
                OR EXISTS(
                    SELECT 1 FROM team_members tm
                    WHERE tm.team_id = r.team_id
                      AND tm.user_id = $2
                )
            )
        )
        "#,
    )
    .bind(repository_id)
    .bind(user_id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(has_access)
}

/// Get user's role in an organization
pub async fn get_user_org_role(
    db: &PgPool,
    user_id: Uuid,
    organization_id: Uuid,
) -> Result<Option<OrgMemberRole>> {
    let role = sqlx::query_scalar::<_, OrgMemberRole>(
        r#"
        SELECT role FROM organization_members
        WHERE organization_id = $1 AND user_id = $2 AND status = 'active'
        "#,
    )
    .bind(organization_id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    Ok(role)
}

/// Get all organizations a user belongs to
pub async fn get_user_organizations(
    db: &PgPool,
    user_id: Uuid,
) -> Result<Vec<(Uuid, String, OrgMemberRole)>> {
    let orgs = sqlx::query_as::<_, (Uuid, String, OrgMemberRole)>(
        r#"
        SELECT o.id, o.name, om.role
        FROM organizations o
        JOIN organization_members om ON o.id = om.organization_id
        WHERE om.user_id = $1 AND om.status = 'active' AND o.is_active = true
        ORDER BY o.name
        "#,
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(orgs)
}

// ============================================================================
// Row Level Security (RLS) Context Middleware
// Issue: #1177 - Multi-tenant data isolation
// ============================================================================

/// Database connection with RLS context set
///
/// This middleware sets the PostgreSQL session variable for RLS policies.
/// Must be used after org_member_middleware to have OrganizationContext available.
pub async fn rls_context_middleware(
    State(db): State<PgPool>,
    request: Request,
    next: Next,
) -> Result<Response> {
    // Get organization context from extensions (set by org_member_middleware)
    let org_ctx = request
        .extensions()
        .get::<OrganizationContext>()
        .cloned();

    if let Some(ctx) = org_ctx {
        // Set the RLS context variable for this connection
        // This will be checked by RLS policies on tables
        sqlx::query("SET LOCAL app.current_org_id = $1")
            .bind(ctx.organization_id.to_string())
            .execute(&db)
            .await
            .map_err(|e| {
                tracing::error!("Failed to set RLS context: {}", e);
                AppError::Database(e)
            })?;

        tracing::debug!(
            "RLS context set for organization {}",
            ctx.organization_id
        );
    }

    Ok(next.run(request).await)
}

/// Set RLS context manually for a specific organization
///
/// Use this when you need to set RLS context outside of middleware chain
pub async fn set_rls_context(db: &PgPool, organization_id: Uuid) -> Result<()> {
    sqlx::query("SET LOCAL app.current_org_id = $1")
        .bind(organization_id.to_string())
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to set RLS context: {}", e);
            AppError::Database(e)
        })?;
    Ok(())
}

/// Clear RLS context
pub async fn clear_rls_context(db: &PgPool) -> Result<()> {
    sqlx::query("RESET app.current_org_id")
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to clear RLS context: {}", e);
            AppError::Database(e)
        })?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_authenticated_user_debug() {
        let user = AuthenticatedUser {
            user_id: Uuid::new_v4(),
            github_id: 12345,
        };
        assert!(format!("{:?}", user).contains("AuthenticatedUser"));
    }

    #[test]
    fn test_org_context_debug() {
        let ctx = OrganizationContext {
            organization_id: Uuid::new_v4(),
            user_role: OrgMemberRole::Admin,
        };
        assert!(format!("{:?}", ctx).contains("OrganizationContext"));
    }
}
