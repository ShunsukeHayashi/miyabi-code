use crate::discord::DiscordClient;
use crate::error::{DiscordMcpError, Result};
use crate::models::*;
use std::str::FromStr;
use std::time::{SystemTime, Duration};
use twilight_model::id::{marker::{ChannelMarker, GuildMarker, MessageMarker, UserMarker}, Id};
use twilight_model::channel::message::{Embed as TwilightEmbed};
use twilight_model::channel::message::embed::{EmbedField as TwilightEmbedField, EmbedFooter as TwilightEmbedFooter};
use twilight_model::util::Timestamp;
use twilight_http::request::AuditLogReason;

impl DiscordClient {
    /// メッセージを送信
    pub async fn send_message(&self, request: SendMessageRequest) -> Result<SendMessageResponse> {
        tracing::info!("Sending message to channel: {}", request.channel_id);

        let channel_id = Id::<ChannelMarker>::from_str(&request.channel_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid channel ID: {}", e)))?;

        let message = self.http().create_message(channel_id)
            .content(&request.content)
            .await?
            .model()
            .await?;

        Ok(SendMessageResponse {
            message_id: message.id.to_string(),
            channel_id: message.channel_id.to_string(),
            content: message.content,
            timestamp: format!("{}", message.timestamp.as_micros()),
        })
    }

    /// Embedメッセージを送信
    pub async fn send_embed(&self, request: SendEmbedRequest) -> Result<SendMessageResponse> {
        tracing::info!("Sending embed message to channel: {}", request.channel_id);

        let channel_id = Id::<ChannelMarker>::from_str(&request.channel_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid channel ID: {}", e)))?;

        let embeds: Vec<TwilightEmbed> = request.embeds.into_iter().map(|e| {
            TwilightEmbed {
                author: None,
                color: e.color,
                description: e.description,
                fields: e.fields.unwrap_or_default().into_iter().map(|f| TwilightEmbedField {
                    inline: f.inline.unwrap_or(false),
                    name: f.name,
                    value: f.value,
                }).collect(),
                footer: e.footer.map(|f| TwilightEmbedFooter {
                    icon_url: f.icon_url,
                    proxy_icon_url: None,
                    text: f.text,
                }),
                image: None,
                kind: "rich".to_string(),
                provider: None,
                thumbnail: None,
                timestamp: None,
                title: e.title,
                url: None,
                video: None,
            }
        }).collect();

        let message = self.http().create_message(channel_id)
            .embeds(&embeds)
            .await?
            .model()
            .await?;

        Ok(SendMessageResponse {
            message_id: message.id.to_string(),
            channel_id: message.channel_id.to_string(),
            content: message.content,
            timestamp: format!("{}", message.timestamp.as_micros()),
        })
    }

    /// メッセージをピン留め
    pub async fn pin_message(&self, request: PinMessageRequest) -> Result<()> {
        tracing::info!("Pinning message {} in channel {}", request.message_id, request.channel_id);

        let channel_id = Id::<ChannelMarker>::from_str(&request.channel_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid channel ID: {}", e)))?;
        let message_id = Id::<MessageMarker>::from_str(&request.message_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid message ID: {}", e)))?;

        self.http().create_pin(channel_id, message_id).await?;

        Ok(())
    }

    /// メンバーをキック
    pub async fn kick_member(&self, request: KickMemberRequest) -> Result<()> {
        tracing::info!("Kicking member {} from guild {}", request.user_id, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;
        let user_id = Id::<UserMarker>::from_str(&request.user_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid user ID: {}", e)))?;

        let mut builder = self.http().remove_guild_member(guild_id, user_id);

        if let Some(reason) = &request.reason {
            builder = builder.reason(reason);
        }

        builder.await?;

        Ok(())
    }

    /// メンバーをBAN
    pub async fn ban_member(&self, request: BanMemberRequest) -> Result<()> {
        tracing::info!("Banning member {} from guild {}", request.user_id, request.guild_id);

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;
        let user_id = Id::<UserMarker>::from_str(&request.user_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid user ID: {}", e)))?;

        let mut builder = self.http().create_ban(guild_id, user_id);

        if let Some(reason) = &request.reason {
            builder = builder.reason(reason);
        }

        if let Some(seconds) = request.delete_message_days {
             // delete_message_seconds in newer twilight, but old versions might use delete_message_days
             // Assuming days for now as per struct, convert to seconds if usage dictates.
             // Twilight method is `delete_message_seconds`.
             // 1 day = 86400 seconds
             builder = builder.delete_message_seconds(seconds as u32 * 86400);
        }

        builder.await?;

        Ok(())
    }

    /// メンバーをタイムアウト
    pub async fn timeout_member(&self, request: TimeoutMemberRequest) -> Result<()> {
        tracing::info!(
            "Timing out member {} in guild {} for {} seconds",
            request.user_id,
            request.guild_id,
            request.duration_seconds
        );

        let guild_id = Id::<GuildMarker>::from_str(&request.guild_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid guild ID: {}", e)))?;
        let user_id = Id::<UserMarker>::from_str(&request.user_id)
            .map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid user ID: {}", e)))?;

        let duration = Duration::from_secs(request.duration_seconds);
        let valid_until = SystemTime::now() + duration;

        let timestamp = Timestamp::from_micros(
             valid_until.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_micros() as i64
        ).map_err(|e| DiscordMcpError::InvalidParams(format!("Invalid timestamp: {}", e)))?;

        let mut builder = self.http().update_guild_member(guild_id, user_id)
            .communication_disabled_until(Some(timestamp));

        if let Some(reason) = &request.reason {
            builder = builder.reason(reason);
        }

        builder.await?;

        Ok(())
    }
}
