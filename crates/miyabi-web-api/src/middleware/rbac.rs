//! RBAC Middleware for Permission-Based Access Control
//!
//! Issue: #1176 - RBAC Middleware Implementation
//!
//! This middleware provides permission-based access control using the has_permission
//! database function. It integrates with the existing RbacService to check user
//! permissions for specific operations in organization contexts.

use crate::{
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    services::RbacService,
};
use axum::{
    body::Body,
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

// ============================================================================
// RBAC Context Extensions
// ============================================================================

/// Extension type for RBAC permission context
/// Stores the organization context for permission checks
#[derive(Clone, Debug)]
pub struct RbacContext {
    pub user_id: Uuid,
    pub organization_id: Uuid,
    pub permissions_checked: bool,
}

// ============================================================================
// Permission Requirement Builder
// ============================================================================

/// Permission requirement for a route
/// Supports both single permission and multiple permission checks
#[derive(Clone)]
pub enum PermissionRequirement {
    /// User must have this specific permission
    Single(String),
    /// User must have ANY of these permissions (OR logic)
    Any(Vec<String>),
    /// User must have ALL of these permissions (AND logic)
    All(Vec<String>),
    /// Custom permission check function
    Custom(Arc<dyn Fn(&RbacService, Uuid, Uuid) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<bool>> + Send>> + Send + Sync>),
}

impl std::fmt::Debug for PermissionRequirement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Single(s) => f.debug_tuple("Single").field(s).finish(),
            Self::Any(v) => f.debug_tuple("Any").field(v).finish(),
            Self::All(v) => f.debug_tuple("All").field(v).finish(),
            Self::Custom(_) => f.debug_tuple("Custom").field(&"<closure>").finish(),
        }
    }
}

impl PermissionRequirement {
    /// Create a single permission requirement
    pub fn single(permission: impl Into<String>) -> Self {
        Self::Single(permission.into())
    }

    /// Create an "any of" permission requirement
    pub fn any(permissions: Vec<String>) -> Self {
        Self::Any(permissions)
    }

    /// Create an "all of" permission requirement
    pub fn all(permissions: Vec<String>) -> Self {
        Self::All(permissions)
    }

    /// Check if user satisfies this permission requirement
    pub async fn check(
        &self,
        rbac_service: &RbacService,
        user_id: Uuid,
        organization_id: Uuid,
    ) -> Result<bool> {
        match self {
            Self::Single(permission) => {
                let result = rbac_service
                    .check_permission(user_id, organization_id, permission)
                    .await?;
                Ok(result.allowed)
            }
            Self::Any(permissions) => {
                let permission_refs: Vec<&str> = permissions.iter().map(|s| s.as_str()).collect();
                rbac_service
                    .check_any_permission(user_id, organization_id, &permission_refs)
                    .await
            }
            Self::All(permissions) => {
                let permission_refs: Vec<&str> = permissions.iter().map(|s| s.as_str()).collect();
                rbac_service
                    .check_all_permissions(user_id, organization_id, &permission_refs)
                    .await
            }
            Self::Custom(check_fn) => {
                let future = check_fn(rbac_service, user_id, organization_id);
                future.await
            }
        }
    }
}

// ============================================================================
// RBAC Middleware Factory Functions
// ============================================================================

/// Create a middleware that requires a specific permission
///
/// # Example
/// ```rust
/// use axum::Router;
/// use crate::middleware::rbac::require_permission;
///
/// let app = Router::new()
///     .route("/api/repositories", get(list_repos))
///     .layer(require_permission("repositories.read"));
/// ```
pub fn require_permission(
    permission: impl Into<String>,
) -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    let permission = permission.into();
    axum::middleware::from_fn(move |req: Request, next: Next| {
        let permission = permission.clone();
        Box::pin(async move {
            rbac_middleware_impl(req, next, PermissionRequirement::single(permission)).await
        })
    })
}

/// Create a middleware that requires ANY of the specified permissions
///
/// # Example
/// ```rust
/// let app = Router::new()
///     .route("/api/repositories/:id/settings", get(repo_settings))
///     .layer(require_any_permission(vec![
///         "repositories.manage".to_string(),
///         "organization.admin".to_string()
///     ]));
/// ```
pub fn require_any_permission(
    permissions: Vec<String>,
) -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    axum::middleware::from_fn(move |req: Request, next: Next| {
        let permissions = permissions.clone();
        Box::pin(async move {
            rbac_middleware_impl(req, next, PermissionRequirement::any(permissions)).await
        })
    })
}

/// Create a middleware that requires ALL of the specified permissions
///
/// # Example
/// ```rust
/// let app = Router::new()
///     .route("/api/sensitive-operation", post(sensitive_op))
///     .layer(require_all_permissions(vec![
///         "organization.admin".to_string(),
///         "repositories.delete".to_string()
///     ]));
/// ```
pub fn require_all_permissions(
    permissions: Vec<String>,
) -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    axum::middleware::from_fn(move |req: Request, next: Next| {
        let permissions = permissions.clone();
        Box::pin(async move {
            rbac_middleware_impl(req, next, PermissionRequirement::all(permissions)).await
        })
    })
}

// ============================================================================
// Core RBAC Middleware Implementation
// ============================================================================

/// Core RBAC middleware implementation
///
/// This function:
/// 1. Extracts authenticated user from request extensions
/// 2. Extracts organization_id from path or query parameters
/// 3. Creates RbacService instance
/// 4. Checks permission using has_permission database function
/// 5. Returns 403 Forbidden if permission denied
async fn rbac_middleware_impl(
    mut request: Request,
    next: Next,
    requirement: PermissionRequirement,
) -> Result<Response, Response> {
    // 1. Get authenticated user from extensions
    let auth_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| {
            AppError::Authentication("Not authenticated".to_string()).into_response()
        })?;

    // 2. Extract organization_id from path parameters
    let organization_id = extract_organization_id(&request).map_err(|e| e.into_response())?;

    // 3. Get database pool from request extensions
    let db = request
        .extensions()
        .get::<PgPool>()
        .cloned()
        .ok_or_else(|| {
            AppError::InternalServer("Database pool not available".to_string()).into_response()
        })?;

    // 4. Create RBAC service and check permission
    let rbac_service = RbacService::new(db);
    let has_permission = requirement
        .check(&rbac_service, auth_user.user_id, organization_id)
        .await
        .map_err(|e| e.into_response())?;

    if !has_permission {
        return Err(AppError::Authorization(
            "Insufficient permissions for this operation".to_string(),
        )
        .into_response());
    }

    // 5. Add RBAC context to request extensions
    let rbac_context = RbacContext {
        user_id: auth_user.user_id,
        organization_id,
        permissions_checked: true,
    };
    request.extensions_mut().insert(rbac_context);

    // 6. Continue to next middleware/handler
    Ok(next.run(request).await)
}

/// Extract organization_id from request path or query parameters
///
/// Supports multiple patterns:
/// - Path: /api/organizations/{org_id}/...
/// - Path: /api/v1/organizations/{org_id}/...
/// - Query: ?organization_id={org_id}
fn extract_organization_id(request: &Request) -> Result<Uuid> {
    let uri = request.uri();
    let path = uri.path();

    // Try to extract from path segments
    // Pattern: /api/organizations/{org_id}/...
    let segments: Vec<&str> = path.split('/').collect();

    // Look for "organizations" segment followed by a UUID
    for (i, segment) in segments.iter().enumerate() {
        if *segment == "organizations" && i + 1 < segments.len() {
            if let Ok(org_id) = Uuid::parse_str(segments[i + 1]) {
                return Ok(org_id);
            }
        }
    }

    // Try to extract from query parameters
    if let Some(query) = uri.query() {
        for param in query.split('&') {
            if let Some((key, value)) = param.split_once('=') {
                if key == "organization_id" || key == "org_id" {
                    if let Ok(org_id) = Uuid::parse_str(value) {
                        return Ok(org_id);
                    }
                }
            }
        }
    }

    Err(AppError::Validation(
        "organization_id not found in request path or query parameters".to_string(),
    ))
}

// ============================================================================
// Helper Middleware for Common Permission Patterns
// ============================================================================

/// Middleware factory for repository read permission
pub fn require_repository_read() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("repositories.read")
}

/// Middleware factory for repository write permission
pub fn require_repository_write() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("repositories.write")
}

/// Middleware factory for repository delete permission
pub fn require_repository_delete() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("repositories.delete")
}

/// Middleware factory for repository manage permission
pub fn require_repository_manage() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("repositories.manage")
}

/// Middleware factory for agent read permission
pub fn require_agent_read() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("agents.read")
}

/// Middleware factory for agent execute permission
pub fn require_agent_execute() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("agents.execute")
}

/// Middleware factory for agent manage permission
pub fn require_agent_manage() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("agents.manage")
}

/// Middleware factory for workflow read permission
pub fn require_workflow_read() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("workflows.read")
}

/// Middleware factory for workflow create permission
pub fn require_workflow_create() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("workflows.create")
}

/// Middleware factory for workflow execute permission
pub fn require_workflow_execute() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("workflows.execute")
}

/// Middleware factory for organization admin permission
pub fn require_organization_admin() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_any_permission(vec![
        "organization.update".to_string(),
        "organization.members.manage".to_string(),
    ])
}

/// Middleware factory for organization member read permission
pub fn require_organization_member() -> axum::middleware::FromFnLayer<
    impl Fn(Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone,
    (),
> {
    require_permission("organization.read")
}

// ============================================================================
// Tests
// ============================================================================

// Include comprehensive test module
#[cfg(test)]
#[path = "rbac_tests.rs"]
mod rbac_tests;
