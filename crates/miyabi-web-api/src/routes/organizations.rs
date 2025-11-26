//! Organization API routes
//!
//! CRUD operations for organizations, members, and teams
//! Issue: #970 Phase 1.4 - RBAC Implementation

use crate::{
    error::{AppError, Result},
    middleware::{AuthenticatedUser, OrganizationContext},
    models::{
        AddTeamMemberRequest, CreateOrganizationRequest, CreateTeamRequest, InviteMemberRequest,
        OrgMemberRole, Organization, OrganizationMember, OrganizationMemberWithUser, Team,
        TeamMember, TeamMemberRole, UpdateMemberRoleRequest, UpdateOrganizationRequest,
        UpdateTeamRequest, UserOrganization,
    },
    AppState,
};
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct OrganizationResponse {
    pub organization: Organization,
}

#[derive(Debug, Serialize)]
pub struct OrganizationsListResponse {
    pub organizations: Vec<UserOrganization>,
}

#[derive(Debug, Serialize)]
pub struct MembersListResponse {
    pub members: Vec<OrganizationMemberWithUser>,
}

#[derive(Debug, Serialize)]
pub struct TeamsListResponse {
    pub teams: Vec<Team>,
}

#[derive(Debug, Serialize)]
pub struct TeamResponse {
    pub team: Team,
}

#[derive(Debug, Serialize)]
pub struct TeamMembersListResponse {
    pub members: Vec<TeamMember>,
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

// ============================================================================
// Organization Routes
// ============================================================================

/// Create organization routes
pub fn routes() -> Router<AppState> {
    Router::new()
        // Organization CRUD
        .route("/", get(list_organizations).post(create_organization))
        .route(
            "/:org_id",
            get(get_organization)
                .patch(update_organization)
                .delete(delete_organization),
        )
        // Member management
        .route("/:org_id/members", get(list_members).post(invite_member))
        .route(
            "/:org_id/members/:user_id",
            patch(update_member_role).delete(remove_member),
        )
        // Team management
        .route("/:org_id/teams", get(list_teams).post(create_team))
        .route(
            "/:org_id/teams/:team_id",
            get(get_team).patch(update_team).delete(delete_team),
        )
        // Team member management
        .route(
            "/:org_id/teams/:team_id/members",
            get(list_team_members).post(add_team_member),
        )
        .route(
            "/:org_id/teams/:team_id/members/:user_id",
            delete(remove_team_member),
        )
}

// ============================================================================
// Organization Handlers
// ============================================================================

/// List organizations for current user
async fn list_organizations(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse> {
    let organizations = sqlx::query_as::<_, UserOrganization>(
        r#"
        SELECT user_id, organization_id, organization_name, organization_slug,
               avatar_url, role, status, joined_at
        FROM user_organizations
        WHERE user_id = $1
        ORDER BY organization_name
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(OrganizationsListResponse { organizations }))
}

/// Create a new organization
async fn create_organization(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Json(req): Json<CreateOrganizationRequest>,
) -> Result<impl IntoResponse> {
    // Generate slug if not provided
    let slug = req.slug.unwrap_or_else(|| {
        req.name
            .to_lowercase()
            .replace(' ', "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect()
    });

    // Check slug uniqueness
    let exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = $1)")
            .bind(&slug)
            .fetch_one(&state.db)
            .await
            .map_err(AppError::Database)?;

    if exists {
        return Err(AppError::Validation(format!(
            "Organization slug '{}' is already taken",
            slug
        )));
    }

    // Create organization in transaction
    let mut tx = state.db.begin().await.map_err(AppError::Database)?;

    let org = sqlx::query_as::<_, Organization>(
        r#"
        INSERT INTO organizations (name, slug, description, github_org_login, owner_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(&req.name)
    .bind(&slug)
    .bind(&req.description)
    .bind(&req.github_org_login)
    .bind(auth_user.user_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // Add creator as owner
    sqlx::query(
        r#"
        INSERT INTO organization_members (organization_id, user_id, role, status, accepted_at)
        VALUES ($1, $2, 'owner', 'active', NOW())
        "#,
    )
    .bind(org.id)
    .bind(auth_user.user_id)
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok((
        StatusCode::CREATED,
        Json(OrganizationResponse { organization: org }),
    ))
}

/// Get organization details
async fn get_organization(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<impl IntoResponse> {
    let org = sqlx::query_as::<_, Organization>("SELECT * FROM organizations WHERE id = $1")
        .bind(org_ctx.organization_id)
        .fetch_one(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(OrganizationResponse { organization: org }))
}

/// Update organization (admin+ only)
async fn update_organization(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Json(req): Json<UpdateOrganizationRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_settings() {
        return Err(AppError::Authorization(
            "Only admins can update organization settings".to_string(),
        ));
    }

    let org = sqlx::query_as::<_, Organization>(
        r#"
        UPDATE organizations
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            avatar_url = COALESCE($4, avatar_url),
            settings = COALESCE($5, settings),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(org_ctx.organization_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.avatar_url)
    .bind(&req.settings)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(OrganizationResponse { organization: org }))
}

/// Delete organization (owner only)
async fn delete_organization(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_delete_organization() {
        return Err(AppError::Authorization(
            "Only the owner can delete the organization".to_string(),
        ));
    }

    sqlx::query("DELETE FROM organizations WHERE id = $1")
        .bind(org_ctx.organization_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(MessageResponse {
        message: "Organization deleted".to_string(),
    }))
}

// ============================================================================
// Member Handlers
// ============================================================================

/// List organization members
async fn list_members(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<impl IntoResponse> {
    let members = sqlx::query_as::<_, OrganizationMemberWithUser>(
        r#"
        SELECT om.id, om.organization_id, om.user_id, om.role, om.status, om.created_at,
               u.email, u.name, u.avatar_url
        FROM organization_members om
        JOIN users u ON om.user_id = u.id
        WHERE om.organization_id = $1
        ORDER BY om.role, u.name
        "#,
    )
    .bind(org_ctx.organization_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(MembersListResponse { members }))
}

/// Invite a member to organization (admin+ only)
async fn invite_member(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Json(req): Json<InviteMemberRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can invite members".to_string(),
        ));
    }

    // Find user by email or github username
    let user =
        sqlx::query_as::<_, (Uuid,)>("SELECT id FROM users WHERE email = $1 OR name = $1 LIMIT 1")
            .bind(&req.identifier)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?;

    let user_id = match user {
        Some((id,)) => id,
        None => {
            return Err(AppError::NotFound(format!(
                "User '{}' not found",
                req.identifier
            )));
        }
    };

    // Check if already a member
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2)",
    )
    .bind(org_ctx.organization_id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    if exists {
        return Err(AppError::Validation(
            "User is already a member of this organization".to_string(),
        ));
    }

    let role = req.role.unwrap_or(OrgMemberRole::Member);

    // Cannot invite as owner
    if role == OrgMemberRole::Owner {
        return Err(AppError::Validation(
            "Cannot invite user as owner".to_string(),
        ));
    }

    let member = sqlx::query_as::<_, OrganizationMember>(
        r#"
        INSERT INTO organization_members (organization_id, user_id, role, status, invited_by)
        VALUES ($1, $2, $3, 'invited', $4)
        RETURNING *
        "#,
    )
    .bind(org_ctx.organization_id)
    .bind(user_id)
    .bind(role)
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(member)))
}

/// Update member role (admin+ only)
async fn update_member_role(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, user_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<UpdateMemberRoleRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can update member roles".to_string(),
        ));
    }

    // Cannot change to/from owner role (except by current owner)
    if req.role == OrgMemberRole::Owner && org_ctx.user_role != OrgMemberRole::Owner {
        return Err(AppError::Authorization(
            "Only owner can transfer ownership".to_string(),
        ));
    }

    let member = sqlx::query_as::<_, OrganizationMember>(
        r#"
        UPDATE organization_members
        SET role = $3, updated_at = NOW()
        WHERE organization_id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(org_ctx.organization_id)
    .bind(user_id)
    .bind(req.role)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(member))
}

/// Remove member from organization (admin+ only)
async fn remove_member(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, user_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can remove members".to_string(),
        ));
    }

    // Cannot remove owner
    let target_role = sqlx::query_scalar::<_, OrgMemberRole>(
        "SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2",
    )
    .bind(org_ctx.organization_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?;

    if target_role == Some(OrgMemberRole::Owner) {
        return Err(AppError::Validation(
            "Cannot remove the organization owner".to_string(),
        ));
    }

    sqlx::query("DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2")
        .bind(org_ctx.organization_id)
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(MessageResponse {
        message: "Member removed".to_string(),
    }))
}

// ============================================================================
// Team Handlers
// ============================================================================

/// List teams in organization
async fn list_teams(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
) -> Result<impl IntoResponse> {
    let teams = sqlx::query_as::<_, Team>(
        r#"
        SELECT * FROM teams
        WHERE organization_id = $1
        ORDER BY name
        "#,
    )
    .bind(org_ctx.organization_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(TeamsListResponse { teams }))
}

/// Create a new team (admin+ only)
async fn create_team(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Json(req): Json<CreateTeamRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can create teams".to_string(),
        ));
    }

    // Generate slug if not provided
    let slug = req.slug.unwrap_or_else(|| {
        req.name
            .to_lowercase()
            .replace(' ', "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect()
    });

    // Create team in transaction
    let mut tx = state.db.begin().await.map_err(AppError::Database)?;

    let team = sqlx::query_as::<_, Team>(
        r#"
        INSERT INTO teams (organization_id, name, slug, description, is_visible)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(org_ctx.organization_id)
    .bind(&req.name)
    .bind(&slug)
    .bind(&req.description)
    .bind(req.is_visible)
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    // Add creator as team lead
    sqlx::query(
        r#"
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'lead')
        "#,
    )
    .bind(team.id)
    .bind(auth_user.user_id)
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(TeamResponse { team })))
}

/// Get team details
async fn get_team(
    State(state): State<AppState>,
    Path((org_id, team_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    let team =
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE id = $1 AND organization_id = $2")
            .bind(team_id)
            .bind(org_id)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Team not found".to_string()))?;

    Ok(Json(TeamResponse { team }))
}

/// Update team (admin+ only)
async fn update_team(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, team_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<UpdateTeamRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can update teams".to_string(),
        ));
    }

    let team = sqlx::query_as::<_, Team>(
        r#"
        UPDATE teams
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            is_visible = COALESCE($4, is_visible),
            settings = COALESCE($5, settings),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(team_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(req.is_visible)
    .bind(&req.settings)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(TeamResponse { team }))
}

/// Delete team (admin+ only)
async fn delete_team(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, team_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can delete teams".to_string(),
        ));
    }

    sqlx::query("DELETE FROM teams WHERE id = $1 AND organization_id = $2")
        .bind(team_id)
        .bind(org_ctx.organization_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(MessageResponse {
        message: "Team deleted".to_string(),
    }))
}

// ============================================================================
// Team Member Handlers
// ============================================================================

/// List team members
async fn list_team_members(
    State(state): State<AppState>,
    Path((org_id, team_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    let members = sqlx::query_as::<_, TeamMember>(
        r#"
        SELECT tm.* FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.team_id = $1 AND t.organization_id = $2
        ORDER BY tm.role, tm.created_at
        "#,
    )
    .bind(team_id)
    .bind(org_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(TeamMembersListResponse { members }))
}

/// Add member to team (admin+ only)
async fn add_team_member(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, team_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<AddTeamMemberRequest>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can manage team members".to_string(),
        ));
    }

    // Verify user is an org member
    let is_org_member = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active')",
    )
    .bind(org_ctx.organization_id)
    .bind(req.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    if !is_org_member {
        return Err(AppError::Validation(
            "User must be an organization member to join a team".to_string(),
        ));
    }

    let role = req.role.unwrap_or(TeamMemberRole::Member);

    let member = sqlx::query_as::<_, TeamMember>(
        r#"
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(team_id)
    .bind(req.user_id)
    .bind(role)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(member)))
}

/// Remove member from team (admin+ only)
async fn remove_team_member(
    State(state): State<AppState>,
    Extension(org_ctx): Extension<OrganizationContext>,
    Path((_, team_id, user_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    // Check permission
    if !org_ctx.user_role.can_manage_members() {
        return Err(AppError::Authorization(
            "Only admins can remove team members".to_string(),
        ));
    }

    sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(team_id)
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(MessageResponse {
        message: "Team member removed".to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires AppState initialization"]
    fn test_routes_creation() {
        // Just verify routes can be created
        let _routes: Router<AppState> = routes();
    }
}
