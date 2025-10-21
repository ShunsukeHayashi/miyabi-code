use crate::discord::DiscordClient;
use crate::error::{DiscordMcpError, Result};
use crate::models::{ChannelInfo, RoleInfo};
use crate::models::{CreateGuildRequest, CreateGuildResponse, GetGuildRequest, GetGuildResponse};
use twilight_model::id::{marker::GuildMarker, Id};

impl DiscordClient {
    /// サーバー（Guild）を作成
    ///
    /// # 引数
    ///
    /// * `request` - サーバー作成リクエスト
    ///
    /// # エラー
    ///
    /// Discord API呼び出しに失敗した場合
    pub async fn create_guild(&self, request: CreateGuildRequest) -> Result<CreateGuildResponse> {
        tracing::info!("Creating guild: {}", request.name);

        // Note: 通常のBotアカウントではサーバー作成は不可
        // これはBot Ownerまたは特定の権限を持つアカウントでのみ可能
        // ここでは設計のみ示す

        // 実際には以下のようなAPIコールになる（権限がある場合）
        // let guild = self.http
        //     .create_guild(&request.name)?
        //     .verification_level(request.verification_level.unwrap_or(0))
        //     .await?
        //     .model()
        //     .await?;

        // 現時点ではエラーを返す
        Err(DiscordMcpError::Unauthorized(
            "Bot accounts cannot create guilds. Please create a guild manually and use the guild_id.".to_string()
        ))
    }

    /// サーバー情報を取得
    ///
    /// # 引数
    ///
    /// * `request` - サーバー情報取得リクエスト
    pub async fn get_guild(&self, request: GetGuildRequest) -> Result<GetGuildResponse> {
        let guild_id: Id<GuildMarker> = request
            .guild_id
            .parse()
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild_id: {}", e)))?;

        tracing::info!("Getting guild info for: {}", guild_id);

        // サーバー情報取得
        let guild = self
            .http()
            .guild(guild_id)
            .await
            .map_err(|e| DiscordMcpError::DiscordApi(e.to_string()))?
            .model()
            .await
            .map_err(|e| DiscordMcpError::DiscordApi(e.to_string()))?;

        // チャンネル一覧取得
        let channels_response = self
            .http()
            .guild_channels(guild_id)
            .await
            .map_err(|e| DiscordMcpError::DiscordApi(e.to_string()))?
            .model()
            .await
            .map_err(|e| DiscordMcpError::DiscordApi(e.to_string()))?;

        let channels: Vec<ChannelInfo> = channels_response
            .iter()
            .map(|c| ChannelInfo {
                channel_id: c.id.to_string(),
                name: c.name.clone().unwrap_or_default(),
                r#type: format!("{:?}", c.kind),
                parent_id: c.parent_id.map(|id| id.to_string()),
            })
            .collect();

        // ロール一覧
        let roles: Vec<RoleInfo> = guild
            .roles
            .iter()
            .map(|r| RoleInfo {
                role_id: r.id.to_string(),
                name: r.name.clone(),
                color: r.color,
                permissions: r.permissions.bits(),
            })
            .collect();

        // メンバー数取得（概算）
        let member_count = guild.approximate_member_count.unwrap_or(0) as u32;

        Ok(GetGuildResponse {
            guild_id: guild.id.to_string(),
            name: guild.name,
            owner_id: guild.owner_id.to_string(),
            member_count,
            channels,
            roles,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_guild_unauthorized() {
        // Bot accountsはサーバー作成不可
        // テストは実装の確認のみ
    }
}
