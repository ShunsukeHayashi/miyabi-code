use crate::discord::DiscordClient;
use crate::error::Result;
use crate::models::*;

impl DiscordClient {
    /// メッセージを送信
    pub async fn send_message(&self, request: SendMessageRequest) -> Result<SendMessageResponse> {
        tracing::info!("Sending message to channel: {}", request.channel_id);

        // TODO: 実装
        // let message = self.http.create_message(channel_id)?
        //     .content(&request.content)?
        //     .await?
        //     .model()
        //     .await?;

        todo!("Implement send_message")
    }

    /// Embedメッセージを送信
    pub async fn send_embed(&self, request: SendEmbedRequest) -> Result<SendMessageResponse> {
        tracing::info!("Sending embed message to channel: {}", request.channel_id);

        // TODO: 実装
        todo!("Implement send_embed")
    }

    /// メッセージをピン留め
    pub async fn pin_message(&self, request: PinMessageRequest) -> Result<()> {
        tracing::info!("Pinning message {} in channel {}", request.message_id, request.channel_id);

        // TODO: 実装
        // self.http.pin_message(channel_id, message_id).await?

        todo!("Implement pin_message")
    }

    /// メンバーをキック
    pub async fn kick_member(&self, request: KickMemberRequest) -> Result<()> {
        tracing::info!("Kicking member {} from guild {}", request.user_id, request.guild_id);

        // TODO: 実装
        // self.http.remove_guild_member(guild_id, user_id).await?

        todo!("Implement kick_member")
    }

    /// メンバーをBAN
    pub async fn ban_member(&self, request: BanMemberRequest) -> Result<()> {
        tracing::info!("Banning member {} from guild {}", request.user_id, request.guild_id);

        // TODO: 実装
        // self.http.create_ban(guild_id, user_id)?
        //     .delete_message_days(request.delete_message_days.unwrap_or(0))?
        //     .reason(&request.reason.unwrap_or_default())?
        //     .await?

        todo!("Implement ban_member")
    }

    /// メンバーをタイムアウト
    pub async fn timeout_member(&self, request: TimeoutMemberRequest) -> Result<()> {
        tracing::info!("Timing out member {} in guild {} for {} seconds",
            request.user_id, request.guild_id, request.duration_seconds);

        // TODO: 実装
        todo!("Implement timeout_member")
    }
}
