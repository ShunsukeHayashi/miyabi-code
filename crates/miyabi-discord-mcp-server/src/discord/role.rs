use crate::discord::DiscordClient;
use crate::error::Result;
use crate::models::*;

impl DiscordClient {
    /// ロールを作成
    pub async fn create_role(&self, request: CreateRoleRequest) -> Result<CreateRoleResponse> {
        tracing::info!(
            "Creating role: {} in guild {}",
            request.name,
            request.guild_id
        );

        // TODO: 実装
        // self.http.create_role(guild_id)?
        //     .name(&request.name)?
        //     .color(request.color.unwrap_or(0))?
        //     .hoist(request.hoist.unwrap_or(false))?
        //     .permissions(Permissions::from_bits(request.permissions.unwrap_or(0)).unwrap())?
        //     .mentionable(request.mentionable.unwrap_or(false))?
        //     .await?

        todo!("Implement create_role")
    }

    /// ロールを割り当て
    pub async fn assign_role(&self, request: AssignRoleRequest) -> Result<()> {
        tracing::info!(
            "Assigning role {} to user {} in guild {}",
            request.role_id,
            request.user_id,
            request.guild_id
        );

        // TODO: 実装
        // self.http.add_guild_member_role(guild_id, user_id, role_id).await?

        todo!("Implement assign_role")
    }
}
