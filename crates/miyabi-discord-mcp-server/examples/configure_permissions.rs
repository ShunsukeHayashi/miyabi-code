//! Example: Configure channel permissions for Miyabi Community
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example configure_permissions -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::collections::HashMap;
use std::env;
use twilight_http::Client;
use twilight_model::channel::ChannelType;
use twilight_model::guild::Permissions;
use twilight_model::id::{
    marker::{ChannelMarker, GuildMarker, RoleMarker},
    Id,
};

#[derive(Parser)]
struct Args {
    /// Discord Guild ID
    #[arg(long)]
    guild_id: String,

    /// Progress channel ID
    #[arg(long)]
    progress_channel_id: String,

    /// Bot Token
    #[arg(long)]
    token: Option<String>,
}

async fn post_progress(
    client: &Client,
    channel_id: Id<ChannelMarker>,
    message: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    client.create_message(channel_id).content(message)?.await?;
    println!("📤 投稿: {}", message);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let token = args
        .token
        .or_else(|| env::var("DISCORD_BOT_TOKEN").ok())
        .expect("DISCORD_BOT_TOKEN not found");

    let guild_id: Id<GuildMarker> = args.guild_id.parse()?;
    let progress_channel: Id<ChannelMarker> = args.progress_channel_id.parse()?;

    let client = Client::new(token);

    post_progress(
        &client,
        progress_channel,
        "\n🔒 **権限設定開始**: 読み取り専用チャンネル設定中...",
    )
    .await?;

    // Get all channels
    let channels = client.guild_channels(guild_id).await?.model().await?;
    let mut channel_map: HashMap<String, Id<ChannelMarker>> = HashMap::new();

    for channel in &channels {
        if let Some(name) = &channel.name {
            channel_map.insert(name.clone(), channel.id);
        }
    }

    // Get all roles
    let roles = client.roles(guild_id).await?.model().await?;
    let mut role_map: HashMap<String, Id<RoleMarker>> = HashMap::new();

    for role in &roles {
        role_map.insert(role.name.clone(), role.id);
    }

    // Get @everyone role (same as guild_id)
    let everyone_role_id: Id<RoleMarker> = Id::new(guild_id.get());

    // Configure read-only channels
    let read_only_channels = vec!["rules", "announcements"];

    println!("\n🔒 Configuring read-only channels...");

    for channel_name in read_only_channels {
        if let Some(&channel_id) = channel_map.get(channel_name) {
            println!("  Setting permissions for #{}", channel_name);

            // @everyone: VIEW_CHANNEL + READ_MESSAGE_HISTORY (no SEND_MESSAGES)
            client
                .update_channel_permission(channel_id, &everyone_role_id)
                .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
                .allow(Permissions::VIEW_CHANNEL | Permissions::READ_MESSAGE_HISTORY)
                .deny(Permissions::SEND_MESSAGES | Permissions::ADD_REACTIONS)
                .await?;

            // Moderator: Full permissions
            if let Some(&moderator_role_id) = role_map.get("Moderator") {
                client
                    .update_channel_permission(channel_id, &moderator_role_id)
                    .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
                    .allow(
                        Permissions::VIEW_CHANNEL
                            | Permissions::SEND_MESSAGES
                            | Permissions::READ_MESSAGE_HISTORY
                            | Permissions::MANAGE_MESSAGES,
                    )
                    .await?;
            }

            // Admin: Full permissions
            if let Some(&admin_role_id) = role_map.get("Admin") {
                client
                    .update_channel_permission(channel_id, &admin_role_id)
                    .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
                    .allow(Permissions::all())
                    .await?;
            }

            println!("    ✅ {} configured as read-only", channel_name);
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        } else {
            println!("    ⚠️ Channel not found: {}", channel_name);
        }
    }

    post_progress(
        &client,
        progress_channel,
        "  ✅ 読み取り専用チャンネル設定完了: #rules, #announcements",
    )
    .await?;

    // Configure moderator-only channel
    println!("\n🔒 Configuring moderator-only channel...");

    if let Some(&mod_chat_id) = channel_map.get("mod-chat") {
        println!("  Setting permissions for #mod-chat");

        // @everyone: Deny VIEW_CHANNEL
        client
            .update_channel_permission(mod_chat_id, &everyone_role_id)
            .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
            .deny(Permissions::VIEW_CHANNEL)
            .await?;

        // Moderator: Full access
        if let Some(&moderator_role_id) = role_map.get("Moderator") {
            client
                .update_channel_permission(mod_chat_id, &moderator_role_id)
                .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
                .allow(
                    Permissions::VIEW_CHANNEL
                        | Permissions::SEND_MESSAGES
                        | Permissions::READ_MESSAGE_HISTORY
                        | Permissions::MANAGE_MESSAGES,
                )
                .await?;
        }

        // Admin: Full access
        if let Some(&admin_role_id) = role_map.get("Admin") {
            client
                .update_channel_permission(mod_chat_id, &admin_role_id)
                .kind(twilight_model::channel::permission_overwrite::PermissionOverwriteType::Role)
                .allow(Permissions::all())
                .await?;
        }

        println!("    ✅ mod-chat configured as moderator-only");
    } else {
        println!("    ⚠️ Channel not found: mod-chat");
    }

    post_progress(
        &client,
        progress_channel,
        "  ✅ モデレーター専用チャンネル設定完了: #mod-chat",
    )
    .await?;

    post_progress(
        &client,
        progress_channel,
        "\n🎊🎊🎊 **全権限設定完了！** 🎊🎊🎊\n\n\
         ✅ **設定完了**:\n\
         - 読み取り専用: #rules, #announcements\n\
         - モデレーター専用: #mod-chat\n\n\
         🎉 Miyabiちゃん: 権限設定が完了したよ！\n\
         これでMiyabi Communityは完全に準備完了！✨",
    )
    .await?;

    println!("\n🎉 Miyabiちゃん: 権限設定が完了したよ！");

    Ok(())
}
