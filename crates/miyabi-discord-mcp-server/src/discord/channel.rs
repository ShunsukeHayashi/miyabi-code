use crate::discord::DiscordClient;
use crate::error::{DiscordMcpError, Result};
use crate::models::*;
use std::str::FromStr;
use twilight_model::channel::ChannelType;
use twilight_model::guild::Permissions;
use twilight_model::id::{marker::{ChannelMarker, GuildMarker, RoleMarker, UserMarker}, Id};
use twilight_model::http::permission_overwrite::{PermissionOverwrite, PermissionOverwriteType};

impl DiscordClient {
    /// カテゴリを作成
    pub async fn create_category(&self, request: CreateCategoryRequest) -> Result<CreateCategoryResponse> {
        tracing::info!("Creating category: {} in guild {}", request.name, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;

        let mut builder = self.http().create_guild_channel(guild_id, &request.name)
            .kind(ChannelType::GuildCategory);

        if let Some(position) = request.position {
            builder = builder.position(position as u64);
        }

        let channel = builder.await?.model().await?;

        Ok(CreateCategoryResponse {
            channel_id: channel.id.to_string(),
            name: channel.name.unwrap_or_default(),
            r#type: "category".to_string(),
        })
    }

    /// テキストチャンネルを作成
    pub async fn create_text_channel(&self, request: CreateTextChannelRequest) -> Result<CreateTextChannelResponse> {
        tracing::info!("Creating text channel: {} in guild {}", request.name, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;

        let mut builder = self.http().create_guild_channel(guild_id, &request.name)
            .kind(ChannelType::GuildText);

        if let Some(parent_id) = &request.parent_id {
            let parent_id = Id::<ChannelMarker>::from_str(parent_id)
                .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid parent ID: {}", e)))?;
            builder = builder.parent_id(parent_id);
        }

        if let Some(topic) = &request.topic {
            builder = builder.topic(topic);
        }

        if let Some(nsfw) = request.nsfw {
            builder = builder.nsfw(nsfw);
        }

        if let Some(rate_limit) = request.rate_limit_per_user {
            builder = builder.rate_limit_per_user(rate_limit as u16);
        }

        // NOTE: permission_overwrites は単純な変換が難しいため、簡易実装ではスキップするか、
        // 必要なら map して PermissionOverwrite を作成する

        let channel = builder.await?.model().await?;

        Ok(CreateTextChannelResponse {
            channel_id: channel.id.to_string(),
            name: channel.name.unwrap_or_default(),
            r#type: "text".to_string(),
            parent_id: request.parent_id,
        })
    }

    /// 音声チャンネルを作成
    pub async fn create_voice_channel(&self, request: CreateVoiceChannelRequest) -> Result<CreateVoiceChannelResponse> {
        tracing::info!("Creating voice channel: {} in guild {}", request.name, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;

        let mut builder = self.http().create_guild_channel(guild_id, &request.name)
            .kind(ChannelType::GuildVoice);

        if let Some(parent_id) = &request.parent_id {
            let parent_id = Id::<ChannelMarker>::from_str(parent_id)
                .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid parent ID: {}", e)))?;
            builder = builder.parent_id(parent_id);
        }

        if let Some(bitrate) = request.bitrate {
            builder = builder.bitrate(bitrate);
        }

        if let Some(user_limit) = request.user_limit {
            builder = builder.user_limit(user_limit as u16);
        }

        let channel = builder.await?.model().await?;

        Ok(CreateVoiceChannelResponse {
            channel_id: channel.id.to_string(),
            name: channel.name.unwrap_or_default(),
            r#type: "voice".to_string(),
            parent_id: request.parent_id,
        })
    }

    /// フォーラムチャンネルを作成
    pub async fn create_forum_channel(&self, request: CreateForumChannelRequest) -> Result<CreateForumChannelResponse> {
        tracing::info!("Creating forum channel: {} in guild {}", request.name, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;

        let mut builder = self.http().create_guild_channel(guild_id, &request.name)
            .kind(ChannelType::GuildForum);

        if let Some(parent_id) = &request.parent_id {
            let parent_id = Id::<ChannelMarker>::from_str(parent_id)
                .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid parent ID: {}", e)))?;
            builder = builder.parent_id(parent_id);
        }

        if let Some(topic) = &request.topic {
            builder = builder.topic(topic);
        }

        // default_reaction_emoji は Twilight のバージョンによって扱いが異なる場合があるため、
        // 必要に応じて実装を追加する

        let channel = builder.await?.model().await?;

        Ok(CreateForumChannelResponse {
            channel_id: channel.id.to_string(),
            name: channel.name.unwrap_or_default(),
            r#type: "forum".to_string(),
            parent_id: request.parent_id,
        })
    }

    /// チャンネル権限を更新
    pub async fn update_channel_permissions(&self, request: UpdateChannelPermissionsRequest) -> Result<()> {
        tracing::info!("Updating permissions for channel: {}", request.channel_id);

        let channel_id = Id::<ChannelMarker>::from_str(&request.channel_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid channel ID: {}", e)))?;

        for overwrite in request.overwrites {
            let allow = Permissions::from_bits_truncate(overwrite.allow);
            let deny = Permissions::from_bits_truncate(overwrite.deny);

            // role or member
            if overwrite.r#type == "role" {
                 let role_id = Id::<RoleMarker>::from_str(&overwrite.id)
                    .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid role ID: {}", e)))?;

                 let permission_overwrite = PermissionOverwrite {
                     id: role_id.cast(),
                     kind: PermissionOverwriteType::Role,
                     allow: Some(allow),
                     deny: Some(deny),
                 };

                 self.http().update_channel_permission(channel_id, &permission_overwrite)
                    .await?;
            } else if overwrite.r#type == "member" {
                 let user_id = Id::<UserMarker>::from_str(&overwrite.id)
                    .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid user ID: {}", e)))?;

                 let permission_overwrite = PermissionOverwrite {
                     id: user_id.cast(),
                     kind: PermissionOverwriteType::Member,
                     allow: Some(allow),
                     deny: Some(deny),
                 };

                 self.http().update_channel_permission(channel_id, &permission_overwrite)
                    .await?;
            } else {
                return Err(DiscordMcpError::InvalidParams(format!("Invalid permission overwrite type: {}", overwrite.r#type)));
            }
        }

        Ok(())
    }
}
