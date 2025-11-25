//! RBAC (Role-Based Access Control) Models
//!
//! Issue: #975 Phase 1.4 - RBAC Implementation
//! Provides Permission, Role, and authorization models.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

/// Permission model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Permission {
    /// Unique permission ID
    pub id: Uuid,
    /// Permission code (e.g., 'repositories.read')
    pub code: String,
    /// Human-readable name
    pub name: String,
    /// Permission description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Permission category
    pub category: String,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Role model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Role {
    /// Unique role ID
    pub id: Uuid,
    /// Role code (e.g., 'org:owner', 'team:lead')
    pub code: String,
    /// Human-readable name
    pub name: String,
    /// Role description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Role scope (organization, team, system)
    pub scope: String,
    /// Whether this is a system-defined role
    pub is_system: bool,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Role with its permissions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RoleWithPermissions {
    /// Role information
    #[serde(flatten)]
    pub role: Role,
    /// Permissions granted by this role
    pub permissions: Vec<Permission>,
}

/// User permission (direct grant)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserPermission {
    /// Unique ID
    pub id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// Permission ID
    pub permission_id: Uuid,
    /// Organization ID (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<Uuid>,
    /// Granted by user ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub granted_by: Option<Uuid>,
    /// Expiration date
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Effective permission (from view)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct EffectivePermission {
    /// User ID
    pub user_id: Uuid,
    /// Organization ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<Uuid>,
    /// Permission code
    pub permission_code: String,
    /// Permission category
    pub category: String,
    /// Source of permission (role, team_role, direct)
    pub source: String,
    /// Role code (if from role)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role_code: Option<String>,
}

/// Permission check result
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PermissionCheckResult {
    /// Whether user has the permission
    pub allowed: bool,
    /// Permission code checked
    pub permission: String,
    /// Source of permission (if allowed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    /// Role that granted the permission (if from role)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
}

/// Grant permission request
#[derive(Debug, Deserialize, ToSchema)]
pub struct GrantPermissionRequest {
    /// User ID to grant permission to
    pub user_id: Uuid,
    /// Permission code to grant
    pub permission_code: String,
    /// Organization ID scope (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<Uuid>,
    /// Expiration date (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
}

/// Revoke permission request
#[derive(Debug, Deserialize, ToSchema)]
pub struct RevokePermissionRequest {
    /// User ID to revoke permission from
    pub user_id: Uuid,
    /// Permission code to revoke
    pub permission_code: String,
    /// Organization ID scope (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<Uuid>,
}

/// Permission category enumeration
#[derive(Debug, Clone, Copy, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PermissionCategory {
    /// Repository permissions
    Repositories,
    /// Agent permissions
    Agents,
    /// Workflow permissions
    Workflows,
    /// Task permissions
    Tasks,
    /// Organization permissions
    Organization,
    /// Team permissions
    Teams,
}

impl std::fmt::Display for PermissionCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionCategory::Repositories => write!(f, "repositories"),
            PermissionCategory::Agents => write!(f, "agents"),
            PermissionCategory::Workflows => write!(f, "workflows"),
            PermissionCategory::Tasks => write!(f, "tasks"),
            PermissionCategory::Organization => write!(f, "organization"),
            PermissionCategory::Teams => write!(f, "teams"),
        }
    }
}

/// Role scope enumeration
#[derive(Debug, Clone, Copy, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RoleScope {
    /// Organization-level role
    Organization,
    /// Team-level role
    Team,
    /// System-wide role
    System,
}

impl std::fmt::Display for RoleScope {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RoleScope::Organization => write!(f, "organization"),
            RoleScope::Team => write!(f, "team"),
            RoleScope::System => write!(f, "system"),
        }
    }
}

/// Predefined permission codes
pub mod permissions {
    // Repositories
    pub const REPOSITORIES_READ: &str = "repositories.read";
    pub const REPOSITORIES_WRITE: &str = "repositories.write";
    pub const REPOSITORIES_DELETE: &str = "repositories.delete";
    pub const REPOSITORIES_MANAGE: &str = "repositories.manage";

    // Agents
    pub const AGENTS_READ: &str = "agents.read";
    pub const AGENTS_EXECUTE: &str = "agents.execute";
    pub const AGENTS_STOP: &str = "agents.stop";
    pub const AGENTS_MANAGE: &str = "agents.manage";

    // Workflows
    pub const WORKFLOWS_READ: &str = "workflows.read";
    pub const WORKFLOWS_CREATE: &str = "workflows.create";
    pub const WORKFLOWS_UPDATE: &str = "workflows.update";
    pub const WORKFLOWS_DELETE: &str = "workflows.delete";
    pub const WORKFLOWS_EXECUTE: &str = "workflows.execute";

    // Tasks
    pub const TASKS_READ: &str = "tasks.read";
    pub const TASKS_CREATE: &str = "tasks.create";
    pub const TASKS_UPDATE: &str = "tasks.update";
    pub const TASKS_DELETE: &str = "tasks.delete";
    pub const TASKS_ASSIGN: &str = "tasks.assign";

    // Organization
    pub const ORGANIZATION_READ: &str = "organization.read";
    pub const ORGANIZATION_UPDATE: &str = "organization.update";
    pub const ORGANIZATION_DELETE: &str = "organization.delete";
    pub const ORGANIZATION_MEMBERS_READ: &str = "organization.members.read";
    pub const ORGANIZATION_MEMBERS_MANAGE: &str = "organization.members.manage";

    // Teams
    pub const TEAMS_READ: &str = "teams.read";
    pub const TEAMS_CREATE: &str = "teams.create";
    pub const TEAMS_UPDATE: &str = "teams.update";
    pub const TEAMS_DELETE: &str = "teams.delete";
}

/// Predefined role codes
pub mod roles {
    // Organization roles
    pub const ORG_OWNER: &str = "org:owner";
    pub const ORG_ADMIN: &str = "org:admin";
    pub const ORG_MEMBER: &str = "org:member";
    pub const ORG_VIEWER: &str = "org:viewer";

    // Team roles
    pub const TEAM_LEAD: &str = "team:lead";
    pub const TEAM_MEMBER: &str = "team:member";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_category_display() {
        assert_eq!(PermissionCategory::Repositories.to_string(), "repositories");
        assert_eq!(PermissionCategory::Agents.to_string(), "agents");
    }

    #[test]
    fn test_role_scope_display() {
        assert_eq!(RoleScope::Organization.to_string(), "organization");
        assert_eq!(RoleScope::Team.to_string(), "team");
    }

    #[test]
    fn test_predefined_permissions() {
        assert_eq!(permissions::REPOSITORIES_READ, "repositories.read");
        assert_eq!(permissions::AGENTS_EXECUTE, "agents.execute");
    }

    #[test]
    fn test_predefined_roles() {
        assert_eq!(roles::ORG_OWNER, "org:owner");
        assert_eq!(roles::TEAM_LEAD, "team:lead");
    }
}
