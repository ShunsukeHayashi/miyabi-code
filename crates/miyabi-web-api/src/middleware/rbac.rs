//! RBAC Middleware for Permission-Based Access Control
//!
//! Issue: #1176 - RBAC Middleware Implementation
//!
//! This middleware provides permission-based access control using the has_permission
//! database function. It integrates with the existing RbacService to check user
//! permissions for specific operations in organization contexts.
//!
//! Note: RBAC middleware functions currently pass through all requests.
//! Full permission checking will be implemented in a future phase.

use crate::{
    error::AppError,
    middleware::AuthenticatedUser,
    services::RbacService,
};
use axum::{
    extract::Request,
    middleware::Next,
    response::{IntoResponse, Response},
};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

/// Result type for RBAC operations
type RbacResult<T> = std::result::Result<T, AppError>;

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
    Custom(Arc<dyn Fn(&RbacService, Uuid, Uuid) -> std::pin::Pin<Box<dyn std::future::Future<Output = RbacResult<bool>> + Send>> + Send + Sync>),
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
    ) -> RbacResult<bool> {
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
// Simple Pass-Through Middleware (Phase 1)
// ============================================================================
//
// These middleware functions currently pass through all requests without
// permission checking. Full RBAC enforcement will be added in a future phase.

/// Middleware function that checks a specific permission
/// Currently a no-op pass-through for Phase 1 deployment
pub async fn rbac_check_permission(
    request: Request,
    next: Next,
) -> Response {
    // Phase 1: Pass through without permission checks
    // Full RBAC will be implemented after auth middleware is stable
    next.run(request).await
}

// ============================================================================
// Core RBAC Middleware Implementation (For Future Use)
// ============================================================================

/// Core RBAC middleware implementation
///
/// This function:
/// 1. Extracts authenticated user from request extensions
/// 2. Extracts organization_id from path or query parameters
/// 3. Creates RbacService instance
/// 4. Checks permission using has_permission database function
/// 5. Returns 403 Forbidden if permission denied
#[allow(dead_code)]
async fn rbac_middleware_impl(
    mut request: Request,
    next: Next,
    requirement: PermissionRequirement,
) -> Response {
    // 1. Get authenticated user from extensions
    let auth_user = match request.extensions().get::<AuthenticatedUser>().cloned() {
        Some(user) => user,
        None => {
            return AppError::Authentication("Not authenticated".to_string()).into_response();
        }
    };

    // 2. Extract organization_id from path parameters
    let organization_id = match extract_organization_id(&request) {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    // 3. Get database pool from request extensions
    let db = match request.extensions().get::<PgPool>().cloned() {
        Some(pool) => pool,
        None => {
            return AppError::Internal("Database pool not available".to_string()).into_response();
        }
    };

    // 4. Create RBAC service and check permission
    let rbac_service = RbacService::new(db);
    let has_permission = match requirement
        .check(&rbac_service, auth_user.user_id, organization_id)
        .await
    {
        Ok(allowed) => allowed,
        Err(e) => return e.into_response(),
    };

    if !has_permission {
        return AppError::Authorization(
            "Insufficient permissions for this operation".to_string(),
        )
        .into_response();
    }

    // 5. Add RBAC context to request extensions
    let rbac_context = RbacContext {
        user_id: auth_user.user_id,
        organization_id,
        permissions_checked: true,
    };
    request.extensions_mut().insert(rbac_context);

    // 6. Continue to next middleware/handler
    next.run(request).await
}

/// Extract organization_id from request path or query parameters
///
/// Supports multiple patterns:
/// - Path: /api/organizations/{org_id}/...
/// - Path: /api/v1/organizations/{org_id}/...
/// - Query: ?organization_id={org_id}
fn extract_organization_id(request: &Request) -> RbacResult<Uuid> {
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
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_requirement_single() {
        let req = PermissionRequirement::single("test.read");
        match req {
            PermissionRequirement::Single(p) => assert_eq!(p, "test.read"),
            _ => panic!("Expected Single variant"),
        }
    }

    #[test]
    fn test_permission_requirement_any() {
        let req = PermissionRequirement::any(vec!["test.read".to_string(), "test.write".to_string()]);
        match req {
            PermissionRequirement::Any(p) => {
                assert_eq!(p.len(), 2);
                assert_eq!(p[0], "test.read");
            }
            _ => panic!("Expected Any variant"),
        }
    }

    #[test]
    fn test_permission_requirement_all() {
        let req = PermissionRequirement::all(vec!["test.read".to_string(), "test.write".to_string()]);
        match req {
            PermissionRequirement::All(p) => {
                assert_eq!(p.len(), 2);
            }
            _ => panic!("Expected All variant"),
        }
    }

    #[test]
    fn test_permission_requirement_debug() {
        let single = PermissionRequirement::single("test");
        let debug_str = format!("{:?}", single);
        assert!(debug_str.contains("Single"));
    }
}
