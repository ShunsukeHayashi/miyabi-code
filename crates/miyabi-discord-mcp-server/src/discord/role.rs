use crate::discord::DiscordClient;
use crate::error::{DiscordMcpError, Result};
use crate::models::*;
use std::str::FromStr;
use twilight_model::guild::Permissions;
use twilight_model::id::{marker::{GuildMarker, RoleMarker, UserMarker}, Id};

impl DiscordClient {
    /// ロールを作成
    pub async fn create_role(&self, request: CreateRoleRequest) -> Result<CreateRoleResponse> {
        tracing::info!("Creating role: {} in guild {}", request.name, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;

        let mut builder = self.http().create_role(guild_id)
            .name(&request.name);

        if let Some(color) = request.color {
            builder = builder.color(color);
        }

        if let Some(hoist) = request.hoist {
            builder = builder.hoist(hoist);
        }

        if let Some(permissions) = request.permissions {
            let permissions = Permissions::from_bits(permissions)
                .ok_or_else(|| DiscordMcpError::InvalidParams("Invalid permissions bits".to_string()))?;
            builder = builder.permissions(permissions);
        }

        if let Some(mentionable) = request.mentionable {
            builder = builder.mentionable(mentionable);
        }

        let role = builder.await?.model().await?;

        Ok(CreateRoleResponse {
            role_id: role.id.to_string(),
            name: role.name,
            color: role.color,
            permissions: role.permissions.bits(),
        })
    }

    /// ロールを割り当て
    pub async fn assign_role(&self, request: AssignRoleRequest) -> Result<()> {
        tracing::info!("Assigning role {} to user {} in guild {}", request.role_id, request.user_id, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;
        let user_id = Id::<UserMarker>::from_str(&request.user_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid user ID: {}", e)))?;
        let role_id = Id::<RoleMarker>::from_str(&request.role_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid role ID: {}", e)))?;

        self.http().add_guild_member_role(guild_id, user_id, role_id).await?;

        Ok(())
    }
}
