# RBAC Middleware Usage Guide

**Issue**: #1176 - RBAC Middleware Implementation
**Created**: 2025-11-26
**Status**: Implemented

## Overview

The RBAC (Role-Based Access Control) middleware provides permission-based authorization for API routes using the `has_permission` database function. It integrates seamlessly with the existing authentication middleware and `RbacService`.

## Features

- ✅ Single permission checks
- ✅ Multiple permission checks (ANY/ALL logic)
- ✅ Organization context extraction from paths and query parameters
- ✅ Integration with `has_permission` database function
- ✅ Comprehensive error handling
- ✅ 37+ unit tests with 80%+ coverage

## Basic Usage

### Single Permission Check

```rust
use axum::{routing::get, Router};
use crate::middleware::rbac::require_permission;

let app = Router::new()
    .route("/api/organizations/:org_id/repositories", get(list_repositories))
    .layer(require_permission("repositories.read"));
```

### Multiple Permission Check (ANY)

User needs ANY of the specified permissions:

```rust
use crate::middleware::rbac::require_any_permission;

let app = Router::new()
    .route("/api/organizations/:org_id/settings", get(view_settings))
    .layer(require_any_permission(vec![
        "organization.update".to_string(),
        "organization.admin".to_string(),
    ]));
```

### Multiple Permission Check (ALL)

User needs ALL of the specified permissions:

```rust
use crate::middleware::rbac::require_all_permissions;

let app = Router::new()
    .route("/api/organizations/:org_id/danger-zone", delete(delete_org))
    .layer(require_all_permissions(vec![
        "organization.delete".to_string(),
        "organization.admin".to_string(),
    ]));
```

## Helper Middleware Functions

Pre-configured middleware for common permissions:

### Repository Permissions

```rust
use crate::middleware::rbac::{
    require_repository_read,
    require_repository_write,
    require_repository_delete,
    require_repository_manage,
};

let app = Router::new()
    .route("/api/organizations/:org_id/repositories", get(list_repos))
    .layer(require_repository_read())

    .route("/api/organizations/:org_id/repositories", post(create_repo))
    .layer(require_repository_write())

    .route("/api/organizations/:org_id/repositories/:id", delete(delete_repo))
    .layer(require_repository_delete())

    .route("/api/organizations/:org_id/repositories/:id/settings", put(update_settings))
    .layer(require_repository_manage());
```

### Agent Permissions

```rust
use crate::middleware::rbac::{
    require_agent_read,
    require_agent_execute,
    require_agent_manage,
};

let app = Router::new()
    .route("/api/organizations/:org_id/agents", get(list_agents))
    .layer(require_agent_read())

    .route("/api/organizations/:org_id/agents/:id/execute", post(execute_agent))
    .layer(require_agent_execute())

    .route("/api/organizations/:org_id/agents/:id", put(update_agent))
    .layer(require_agent_manage());
```

### Workflow Permissions

```rust
use crate::middleware::rbac::{
    require_workflow_read,
    require_workflow_create,
    require_workflow_execute,
};

let app = Router::new()
    .route("/api/organizations/:org_id/workflows", get(list_workflows))
    .layer(require_workflow_read())

    .route("/api/organizations/:org_id/workflows", post(create_workflow))
    .layer(require_workflow_create())

    .route("/api/organizations/:org_id/workflows/:id/run", post(run_workflow))
    .layer(require_workflow_execute());
```

### Organization Permissions

```rust
use crate::middleware::rbac::{
    require_organization_member,
    require_organization_admin,
};

let app = Router::new()
    .route("/api/organizations/:org_id", get(get_org_info))
    .layer(require_organization_member())

    .route("/api/organizations/:org_id/members", post(add_member))
    .layer(require_organization_admin());
```

## Organization ID Extraction

The middleware automatically extracts `organization_id` from:

### 1. Path Parameters

```
/api/organizations/{org_id}/repositories
/api/v1/organizations/{org_id}/teams
```

### 2. Query Parameters

```
/api/repositories?organization_id={org_id}
/api/repositories?org_id={org_id}
```

## Middleware Composition

You can compose multiple middleware layers:

```rust
use axum::Router;
use crate::middleware::{auth_middleware, rbac};

let app = Router::new()
    .route("/api/organizations/:org_id/repositories", get(list_repositories))
    // First: authenticate user
    .layer(axum::middleware::from_fn_with_state(
        state.clone(),
        auth_middleware,
    ))
    // Then: check RBAC permission
    .layer(rbac::require_repository_read());
```

## Error Handling

The middleware returns appropriate HTTP status codes:

- **401 Unauthorized**: User not authenticated (missing or invalid JWT token)
- **403 Forbidden**: User authenticated but lacks required permission
- **400 Bad Request**: Missing `organization_id` in path or query

Example error responses:

```json
{
  "error": "Insufficient permissions for this operation",
  "status": 403
}
```

```json
{
  "error": "organization_id not found in request path or query parameters",
  "status": 400
}
```

## Integration with RbacService

The middleware uses `RbacService` which calls the `has_permission` database function:

```sql
SELECT has_permission(user_id, organization_id, 'repositories.read')
```

This function checks:
1. Direct user permissions
2. Role-based permissions (organization roles)
3. Team-based permissions

## RBAC Context

After successful permission check, the middleware adds `RbacContext` to request extensions:

```rust
use axum::Extension;
use crate::middleware::rbac::RbacContext;

async fn my_handler(
    Extension(rbac_ctx): Extension<RbacContext>,
) -> impl IntoResponse {
    println!("User: {}", rbac_ctx.user_id);
    println!("Organization: {}", rbac_ctx.organization_id);
    println!("Permissions checked: {}", rbac_ctx.permissions_checked);

    // Your handler logic
}
```

## Testing

The middleware includes 37+ unit tests covering:

- ✅ Organization ID extraction (8 tests)
- ✅ Permission requirement construction (7 tests)
- ✅ RBAC context operations (3 tests)
- ✅ Helper middleware factories (12 tests)
- ✅ Edge cases and error conditions (5 tests)
- ✅ Integration patterns (2 tests)

Run tests:

```bash
cargo test --package miyabi-web-api middleware::rbac
```

## Performance Considerations

1. **Database Queries**: Each permission check makes 1-2 database queries
   - First: `has_permission` function call
   - Optional: `user_effective_permissions` view query for audit

2. **Caching**: Consider adding permission caching for frequently accessed routes

3. **Middleware Order**: Place RBAC middleware after authentication but before handlers

## Security Best Practices

1. ✅ Always use authentication middleware before RBAC middleware
2. ✅ Use most restrictive permission by default
3. ✅ Use `require_all_permissions` for sensitive operations
4. ✅ Log permission denials for security audit
5. ✅ Regularly review and update permission mappings

## Predefined Permission Codes

Available permissions (defined in `models/rbac.rs`):

### Repositories
- `repositories.read`
- `repositories.write`
- `repositories.delete`
- `repositories.manage`

### Agents
- `agents.read`
- `agents.execute`
- `agents.stop`
- `agents.manage`

### Workflows
- `workflows.read`
- `workflows.create`
- `workflows.update`
- `workflows.delete`
- `workflows.execute`

### Tasks
- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.delete`
- `tasks.assign`

### Organization
- `organization.read`
- `organization.update`
- `organization.delete`
- `organization.members.read`
- `organization.members.manage`

### Teams
- `teams.read`
- `teams.create`
- `teams.update`
- `teams.delete`

## Migration Guide

### From Role-Based Middleware

**Before** (using role-based middleware):
```rust
.layer(axum::middleware::from_fn_with_state(db.clone(), org_admin_middleware))
```

**After** (using permission-based middleware):
```rust
.layer(require_organization_admin())
```

### From Custom Permission Checks

**Before** (manual permission check in handler):
```rust
async fn my_handler(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse> {
    let rbac = RbacService::new(state.db);
    if !rbac.check_permission(auth.user_id, org_id, "repositories.read").await?.allowed {
        return Err(AppError::Authorization("Access denied".to_string()));
    }
    // Handler logic...
}
```

**After** (using middleware):
```rust
async fn my_handler(
    Extension(rbac_ctx): Extension<RbacContext>,
) -> Result<impl IntoResponse> {
    // Permission already checked by middleware
    // Handler logic...
}
```

## Troubleshooting

### "organization_id not found" Error

**Problem**: Middleware can't extract organization ID from request

**Solutions**:
1. Ensure path includes `/organizations/{org_id}/`
2. Add `?organization_id={uuid}` query parameter
3. Verify path parameter name is exactly `org_id` or `organization_id`

### "Not authenticated" Error

**Problem**: RBAC middleware runs before auth middleware

**Solution**: Ensure middleware order is correct:
```rust
.layer(auth_middleware)  // First
.layer(rbac_middleware)  // Second
```

### Permission Always Denied

**Problem**: User lacks permission or permission doesn't exist

**Solutions**:
1. Verify permission exists in `permissions` table
2. Check user has role that includes permission
3. Verify organization membership is active
4. Check `user_effective_permissions` view

## Examples

See the test file for complete examples:
- `crates/miyabi-web-api/src/middleware/rbac_tests.rs`

## Related Documentation

- Database Schema: `migrations/20251125000001_rbac_permissions.sql`
- RbacService: `crates/miyabi-web-api/src/services/rbac_service.rs`
- RBAC Models: `crates/miyabi-web-api/src/models/rbac.rs`
- has_permission Function: Database function in RBAC migration

## Contributing

When adding new permissions:

1. Add permission code to `models/rbac.rs`
2. Add database migration for new permission
3. Create helper middleware function in `rbac.rs`
4. Add tests in `rbac_tests.rs`
5. Update this documentation

## License

Part of Miyabi Web API - See project LICENSE file.
