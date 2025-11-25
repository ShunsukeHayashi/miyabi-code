//! Organization and Team models
//!
//! Multi-tenant organization structure with teams and RBAC
//! Issue: #970 Phase 1.3

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

// ============================================================================
// Organization Models
// ============================================================================

/// Organization member role
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema, sqlx::Type)]
#[sqlx(type_name = "org_member_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum OrgMemberRole {
    /// Full control over organization
    Owner,
    /// Can manage members and settings
    Admin,
    /// Standard member with read/write access
    Member,
    /// Read-only access
    Viewer,
}

impl std::fmt::Display for OrgMemberRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrgMemberRole::Owner => write!(f, "owner"),
            OrgMemberRole::Admin => write!(f, "admin"),
            OrgMemberRole::Member => write!(f, "member"),
            OrgMemberRole::Viewer => write!(f, "viewer"),
        }
    }
}

impl OrgMemberRole {
    /// Check if role can manage members
    pub fn can_manage_members(&self) -> bool {
        matches!(self, OrgMemberRole::Owner | OrgMemberRole::Admin)
    }

    /// Check if role can manage settings
    pub fn can_manage_settings(&self) -> bool {
        matches!(self, OrgMemberRole::Owner | OrgMemberRole::Admin)
    }

    /// Check if role can create repositories
    pub fn can_create_repositories(&self) -> bool {
        matches!(
            self,
            OrgMemberRole::Owner | OrgMemberRole::Admin | OrgMemberRole::Member
        )
    }

    /// Check if role can delete organization
    pub fn can_delete_organization(&self) -> bool {
        matches!(self, OrgMemberRole::Owner)
    }
}

/// Organization model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Organization {
    /// Unique organization ID
    pub id: Uuid,
    /// Organization name (display name)
    pub name: String,
    /// URL-safe slug
    pub slug: String,
    /// Organization description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Avatar/logo URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    /// Linked GitHub organization ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub github_org_id: Option<i64>,
    /// GitHub organization login name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub github_org_login: Option<String>,
    /// Organization settings (JSON)
    #[serde(default)]
    pub settings: serde_json::Value,
    /// Billing plan
    pub plan: String,
    /// Maximum members allowed
    pub max_members: i32,
    /// Maximum repositories allowed
    pub max_repositories: i32,
    /// Whether organization is active
    pub is_active: bool,
    /// Owner user ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_id: Option<Uuid>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Organization member model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct OrganizationMember {
    /// Unique membership ID
    pub id: Uuid,
    /// Organization ID
    pub organization_id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// Member role
    pub role: OrgMemberRole,
    /// Membership status
    pub status: String,
    /// Invited by user ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invited_by: Option<Uuid>,
    /// Invitation acceptance timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_at: Option<DateTime<Utc>>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Organization member with user details (joined query result)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct OrganizationMemberWithUser {
    /// Membership ID
    pub id: Uuid,
    /// Organization ID
    pub organization_id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// Member role
    pub role: OrgMemberRole,
    /// Membership status
    pub status: String,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    // User fields
    /// User email
    pub email: String,
    /// User name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// User avatar URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

// ============================================================================
// Team Models
// ============================================================================

/// Team member role
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema, sqlx::Type)]
#[sqlx(type_name = "team_member_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TeamMemberRole {
    /// Team lead with management permissions
    Lead,
    /// Standard team member
    Member,
}

impl std::fmt::Display for TeamMemberRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TeamMemberRole::Lead => write!(f, "lead"),
            TeamMemberRole::Member => write!(f, "member"),
        }
    }
}

/// Team model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Team {
    /// Unique team ID
    pub id: Uuid,
    /// Organization ID
    pub organization_id: Uuid,
    /// Team name
    pub name: String,
    /// Team slug (unique within org)
    pub slug: String,
    /// Team description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Team settings (JSON)
    #[serde(default)]
    pub settings: serde_json::Value,
    /// Whether team is visible to all org members
    pub is_visible: bool,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Team member model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct TeamMember {
    /// Unique membership ID
    pub id: Uuid,
    /// Team ID
    pub team_id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// Role within team
    pub role: TeamMemberRole,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

/// Create organization request
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateOrganizationRequest {
    /// Organization name
    pub name: String,
    /// Organization slug (optional, auto-generated if not provided)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    /// Organization description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// GitHub organization login to link
    #[serde(skip_serializing_if = "Option::is_none")]
    pub github_org_login: Option<String>,
}

/// Update organization request
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateOrganizationRequest {
    /// Organization name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Organization description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Avatar URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    /// Settings (JSON)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings: Option<serde_json::Value>,
}

/// Invite member request
#[derive(Debug, Deserialize, ToSchema)]
pub struct InviteMemberRequest {
    /// User email or GitHub username
    pub identifier: String,
    /// Role to assign
    #[serde(default)]
    pub role: Option<OrgMemberRole>,
}

/// Update member role request
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateMemberRoleRequest {
    /// New role
    pub role: OrgMemberRole,
}

/// Create team request
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateTeamRequest {
    /// Team name
    pub name: String,
    /// Team slug (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    /// Team description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Whether team is visible
    #[serde(default = "default_true")]
    pub is_visible: bool,
}

fn default_true() -> bool {
    true
}

/// Update team request
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateTeamRequest {
    /// Team name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Team description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Whether team is visible
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_visible: Option<bool>,
    /// Team settings
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings: Option<serde_json::Value>,
}

/// Add team member request
#[derive(Debug, Deserialize, ToSchema)]
pub struct AddTeamMemberRequest {
    /// User ID to add
    pub user_id: Uuid,
    /// Role in team
    #[serde(default)]
    pub role: Option<TeamMemberRole>,
}

// ============================================================================
// Summary/View Models
// ============================================================================

/// Organization summary (from view)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct OrganizationSummary {
    /// Organization ID
    pub id: Uuid,
    /// Organization name
    pub name: String,
    /// Organization slug
    pub slug: String,
    /// Billing plan
    pub plan: String,
    /// Whether active
    pub is_active: bool,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Number of active members
    pub member_count: i64,
    /// Number of teams
    pub team_count: i64,
    /// Number of repositories
    pub repository_count: i64,
}

/// User's organization membership (from view)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserOrganization {
    /// User ID
    pub user_id: Uuid,
    /// Organization ID
    pub organization_id: Uuid,
    /// Organization name
    pub organization_name: String,
    /// Organization slug
    pub organization_slug: String,
    /// Organization avatar URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    /// User's role in organization
    pub role: OrgMemberRole,
    /// Membership status
    pub status: String,
    /// When user joined
    pub joined_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_org_member_role_permissions() {
        assert!(OrgMemberRole::Owner.can_manage_members());
        assert!(OrgMemberRole::Admin.can_manage_members());
        assert!(!OrgMemberRole::Member.can_manage_members());
        assert!(!OrgMemberRole::Viewer.can_manage_members());

        assert!(OrgMemberRole::Owner.can_delete_organization());
        assert!(!OrgMemberRole::Admin.can_delete_organization());
    }

    #[test]
    fn test_role_display() {
        assert_eq!(OrgMemberRole::Owner.to_string(), "owner");
        assert_eq!(TeamMemberRole::Lead.to_string(), "lead");
    }
}
