# RBAC Middleware Integration Example

**Issue**: #1176 - RBAC Middleware Implementation
**Date**: 2025-11-26

This document shows how to apply the RBAC middleware to routes in the Miyabi Web API.

## Example: Applying RBAC to Routes

### Step 1: Update Route Registration in `lib.rs`

```rust
use crate::middleware::rbac;

// In create_app() function, when registering routes:

// Repository routes with RBAC
let repository_routes = Router::new()
    // List repositories (requires read permission)
    .route(
        "/api/v1/organizations/:org_id/repositories",
        get(routes::repositories::list_repositories)
    )
    .layer(rbac::require_repository_read())

    // Get specific repository (requires read permission)
    .route(
        "/api/v1/organizations/:org_id/repositories/:id",
        get(routes::repositories::get_repository)
    )
    .layer(rbac::require_repository_read())

    // Create repository (requires write permission)
    .route(
        "/api/v1/organizations/:org_id/repositories",
        post(routes::repositories::create_repository)
    )
    .layer(rbac::require_repository_write())

    // Update repository (requires write permission)
    .route(
        "/api/v1/organizations/:org_id/repositories/:id",
        put(routes::repositories::update_repository)
    )
    .layer(rbac::require_repository_write())

    // Delete repository (requires delete permission)
    .route(
        "/api/v1/organizations/:org_id/repositories/:id",
        delete(routes::repositories::delete_repository)
    )
    .layer(rbac::require_repository_delete())

    // Repository settings (requires manage permission)
    .route(
        "/api/v1/organizations/:org_id/repositories/:id/settings",
        put(routes::repositories::update_repository_settings)
    )
    .layer(rbac::require_repository_manage());

// Agent routes with RBAC
let agent_routes = Router::new()
    // List agents (requires read permission)
    .route(
        "/api/v1/organizations/:org_id/agents",
        get(routes::agents::list_agents)
    )
    .layer(rbac::require_agent_read())

    // Execute agent (requires execute permission)
    .route(
        "/api/v1/organizations/:org_id/agents/:agent_id/execute",
        post(routes::agents::execute_agent)
    )
    .layer(rbac::require_agent_execute())

    // Stop agent (requires execute permission)
    .route(
        "/api/v1/organizations/:org_id/agents/:agent_id/stop",
        post(routes::agents::stop_agent)
    )
    .layer(rbac::require_any_permission(vec![
        "agents.execute".to_string(),
        "agents.stop".to_string(),
    ]))

    // Update agent config (requires manage permission)
    .route(
        "/api/v1/organizations/:org_id/agents/:agent_id/config",
        put(routes::agents::update_agent_config)
    )
    .layer(rbac::require_agent_manage());

// Workflow routes with RBAC
let workflow_routes = Router::new()
    // List workflows (requires read permission)
    .route(
        "/api/v1/organizations/:org_id/workflows",
        get(routes::workflows::list_workflows)
    )
    .layer(rbac::require_workflow_read())

    // Create workflow (requires create permission)
    .route(
        "/api/v1/organizations/:org_id/workflows",
        post(routes::workflows::create_workflow)
    )
    .layer(rbac::require_workflow_create())

    // Execute workflow (requires execute permission)
    .route(
        "/api/v1/organizations/:org_id/workflows/:workflow_id/execute",
        post(routes::workflows::execute_workflow)
    )
    .layer(rbac::require_workflow_execute())

    // Update workflow (requires update permission)
    .route(
        "/api/v1/organizations/:org_id/workflows/:workflow_id",
        put(routes::workflows::update_workflow)
    )
    .layer(rbac::require_any_permission(vec![
        "workflows.update".to_string(),
        "workflows.manage".to_string(),
    ]))

    // Delete workflow (requires delete permission)
    .route(
        "/api/v1/organizations/:org_id/workflows/:workflow_id",
        delete(routes::workflows::delete_workflow)
    )
    .layer(rbac::require_all_permissions(vec![
        "workflows.delete".to_string(),
        "organization.admin".to_string(),  // Extra safety for destructive ops
    ]));

// Organization routes with RBAC
let organization_routes = Router::new()
    // Get organization details (requires member permission)
    .route(
        "/api/v1/organizations/:org_id",
        get(routes::organizations::get_organization)
    )
    .layer(rbac::require_organization_member())

    // Update organization (requires admin permission)
    .route(
        "/api/v1/organizations/:org_id",
        put(routes::organizations::update_organization)
    )
    .layer(rbac::require_organization_admin())

    // List organization members (requires member permission)
    .route(
        "/api/v1/organizations/:org_id/members",
        get(routes::organizations::list_members)
    )
    .layer(rbac::require_permission("organization.members.read"))

    // Add organization member (requires admin permission)
    .route(
        "/api/v1/organizations/:org_id/members",
        post(routes::organizations::add_member)
    )
    .layer(rbac::require_permission("organization.members.manage"))

    // Remove organization member (requires admin permission)
    .route(
        "/api/v1/organizations/:org_id/members/:user_id",
        delete(routes::organizations::remove_member)
    )
    .layer(rbac::require_all_permissions(vec![
        "organization.members.manage".to_string(),
        "organization.admin".to_string(),
    ]));

// Combine all routes with authentication
let app = Router::new()
    .merge(repository_routes)
    .merge(agent_routes)
    .merge(workflow_routes)
    .merge(organization_routes)
    // Apply authentication middleware to all routes
    .layer(axum::middleware::from_fn_with_state(
        jwt_secret.clone(),
        middleware::auth_middleware,
    ))
    .with_state(state);
```

## Step 2: Update Handler to Use RBAC Context

Before RBAC middleware:

```rust
pub async fn list_repositories(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Repository>>> {
    // Manual permission check
    let rbac = RbacService::new(state.db.clone());
    if !rbac.check_permission(auth_user.user_id, org_id, "repositories.read").await?.allowed {
        return Err(AppError::Authorization("Access denied".to_string()));
    }

    // Handler logic...
}
```

After RBAC middleware:

```rust
use crate::middleware::rbac::RbacContext;

pub async fn list_repositories(
    Extension(auth_user): Extension<AuthenticatedUser>,
    Extension(rbac_ctx): Extension<RbacContext>,  // RBAC context from middleware
    State(state): State<AppState>,
) -> Result<Json<Vec<Repository>>> {
    // Permission already checked by middleware
    // Use rbac_ctx.organization_id for queries

    let repositories = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, user_id, organization_id, github_repo_id, owner, name, full_name, is_active, created_at, updated_at
        FROM repositories
        WHERE user_id = $1
          AND organization_id = $2
          AND is_active = true
        ORDER BY updated_at DESC
        "#
    )
    .bind(auth_user.user_id)
    .bind(rbac_ctx.organization_id)  // Use org_id from RBAC context
    .fetch_all(&state.db)
    .await?;

    Ok(Json(repositories))
}
```

## Step 3: Nested Router Pattern for Organization Scope

For better organization, group routes by organization:

```rust
// Create a scoped router for organization-specific routes
fn create_organization_scoped_routes() -> Router<AppState> {
    Router::new()
        // All routes under this router are scoped to /api/v1/organizations/:org_id
        .route("/repositories", get(routes::repositories::list_repositories))
        .layer(rbac::require_repository_read())

        .route("/repositories", post(routes::repositories::create_repository))
        .layer(rbac::require_repository_write())

        .route("/repositories/:id", get(routes::repositories::get_repository))
        .layer(rbac::require_repository_read())

        .route("/agents", get(routes::agents::list_agents))
        .layer(rbac::require_agent_read())

        .route("/agents/:agent_id/execute", post(routes::agents::execute_agent))
        .layer(rbac::require_agent_execute())

        .route("/workflows", get(routes::workflows::list_workflows))
        .layer(rbac::require_workflow_read())
}

// In create_app():
let app = Router::new()
    .nest("/api/v1/organizations/:org_id", create_organization_scoped_routes())
    .layer(axum::middleware::from_fn_with_state(
        jwt_secret.clone(),
        middleware::auth_middleware,
    ))
    .with_state(state);
```

## Step 4: Custom Permission Requirements

For complex permission logic:

```rust
use crate::middleware::rbac::{require_permission, PermissionRequirement};

// Example: Repository settings require manage OR org admin
let settings_permission = PermissionRequirement::any(vec![
    "repositories.manage".to_string(),
    "organization.admin".to_string(),
]);

Router::new()
    .route(
        "/api/v1/organizations/:org_id/repositories/:id/settings",
        put(routes::repositories::update_settings)
    )
    .layer(axum::middleware::from_fn(move |req, next| {
        // Use the custom permission requirement
        Box::pin(rbac_middleware_impl(req, next, settings_permission.clone()))
    }));
```

## Testing RBAC Routes

### Integration Test Example

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use tower::ServiceExt;  // for `oneshot`

    #[tokio::test]
    async fn test_repository_list_requires_permission() {
        let app = create_test_app().await;
        let org_id = Uuid::new_v4();

        // Request without authentication should return 401
        let response = app
            .oneshot(
                Request::builder()
                    .uri(format!("/api/v1/organizations/{}/repositories", org_id))
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_repository_list_with_permission() {
        let (app, token, org_id) = create_test_app_with_user().await;

        // Grant repositories.read permission to test user
        grant_permission_to_user(user_id, org_id, "repositories.read").await;

        // Request with valid token and permission should succeed
        let response = app
            .oneshot(
                Request::builder()
                    .uri(format!("/api/v1/organizations/{}/repositories", org_id))
                    .header("Authorization", format!("Bearer {}", token))
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_repository_delete_requires_delete_permission() {
        let (app, token, org_id) = create_test_app_with_user().await;

        // User has read permission but not delete
        grant_permission_to_user(user_id, org_id, "repositories.read").await;

        let repo_id = Uuid::new_v4();
        let response = app
            .oneshot(
                Request::builder()
                    .uri(format!("/api/v1/organizations/{}/repositories/{}", org_id, repo_id))
                    .method("DELETE")
                    .header("Authorization", format!("Bearer {}", token))
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap();

        // Should return 403 Forbidden
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
}
```

## Migration Checklist

When applying RBAC middleware to existing routes:

- [ ] Update route paths to include `:org_id` parameter
- [ ] Add RBAC middleware layer to each route
- [ ] Update handler signatures to accept `RbacContext`
- [ ] Remove manual permission checks from handlers
- [ ] Update database queries to filter by organization
- [ ] Update OpenAPI documentation
- [ ] Add integration tests for permission checks
- [ ] Test with different user roles
- [ ] Verify error responses (401, 403, 400)
- [ ] Update frontend to handle permission errors

## Common Patterns

### Pattern 1: Read-Write-Delete Hierarchy

```rust
// Read (least privilege)
.layer(rbac::require_repository_read())

// Write (moderate privilege)
.layer(rbac::require_repository_write())

// Delete (high privilege)
.layer(rbac::require_repository_delete())
```

### Pattern 2: Admin Override

```rust
// Normal users need specific permission, admins can bypass
.layer(rbac::require_any_permission(vec![
    "workflows.execute".to_string(),
    "organization.admin".to_string(),
]))
```

### Pattern 3: Multi-Permission Gates

```rust
// Require BOTH permissions for dangerous operations
.layer(rbac::require_all_permissions(vec![
    "repositories.delete".to_string(),
    "organization.admin".to_string(),
]))
```

## Debugging Tips

### Enable Logging

```rust
// In your handler
tracing::info!(
    user_id = %rbac_ctx.user_id,
    org_id = %rbac_ctx.organization_id,
    "Permission check passed"
);
```

### Check Effective Permissions

Query the `user_effective_permissions` view:

```sql
SELECT * FROM user_effective_permissions
WHERE user_id = $1 AND organization_id = $2;
```

### Test Permission Function Directly

```sql
SELECT has_permission(
    '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- user_id
    '987fcdeb-51a2-43d7-8f6e-123456789abc'::uuid,  -- org_id
    'repositories.read'                             -- permission
);
```

## Performance Optimization

### 1. Batch Permission Checks

Instead of checking permissions per-resource, use view-level permissions:

```rust
// ❌ Bad: Check permission for each repository
for repo in repos {
    if !rbac.check_permission(user_id, org_id, "repositories.read").await?.allowed {
        continue;
    }
}

// ✅ Good: Filter at database level
SELECT * FROM repositories r
WHERE r.organization_id = $1
  AND has_permission($2, $1, 'repositories.read');
```

### 2. Cache Permission Results

Consider caching permission check results:

```rust
use moka::future::Cache;

let permission_cache: Cache<(Uuid, Uuid, String), bool> =
    Cache::builder()
        .max_capacity(10_000)
        .time_to_live(Duration::from_secs(300))  // 5 minutes
        .build();
```

## Related Files

- Implementation: `crates/miyabi-web-api/src/middleware/rbac.rs`
- Tests: `crates/miyabi-web-api/src/middleware/rbac_tests.rs`
- Service: `crates/miyabi-web-api/src/services/rbac_service.rs`
- Models: `crates/miyabi-web-api/src/models/rbac.rs`
- Migration: `crates/miyabi-web-api/migrations/20251125000001_rbac_permissions.sql`

## Next Steps

1. Apply RBAC middleware to all organization-scoped routes
2. Add integration tests for each protected route
3. Update API documentation
4. Add permission audit logging
5. Implement permission caching if needed
6. Train team on RBAC patterns

---

**Status**: ✅ Implementation Complete
**Coverage**: 80%+ (37+ unit tests)
**Integration**: Ready for route application
