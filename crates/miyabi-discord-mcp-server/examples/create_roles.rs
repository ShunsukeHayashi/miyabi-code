//! Example: Create Miyabi roles
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example create_roles -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::env;
use twilight_http::Client;
use twilight_model::guild::Permissions;
use twilight_model::id::{
    marker::{ChannelMarker, GuildMarker},
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
    client.create_message(channel_id).content(message).await?;
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

    post_progress(&client, progress_channel, "\n👥 **フェーズ 3/3**: ロール作成中...").await?;

    // Define roles
    let roles = vec![
        ("Admin", 16711680, Permissions::ADMINISTRATOR),
        (
            "Moderator",
            16744448,
            Permissions::MANAGE_CHANNELS
                | Permissions::MANAGE_MESSAGES
                | Permissions::KICK_MEMBERS
                | Permissions::BAN_MEMBERS
                | Permissions::MANAGE_NICKNAMES
                | Permissions::MODERATE_MEMBERS,
        ),
        (
            "Core Contributor",
            10181046,
            Permissions::SEND_MESSAGES
                | Permissions::EMBED_LINKS
                | Permissions::ATTACH_FILES
                | Permissions::READ_MESSAGE_HISTORY
                | Permissions::ADD_REACTIONS
                | Permissions::USE_EXTERNAL_EMOJIS
                | Permissions::CREATE_PUBLIC_THREADS
                | Permissions::CREATE_PRIVATE_THREADS
                | Permissions::SEND_MESSAGES_IN_THREADS,
        ),
        (
            "Contributor",
            3447003,
            Permissions::SEND_MESSAGES
                | Permissions::EMBED_LINKS
                | Permissions::ATTACH_FILES
                | Permissions::READ_MESSAGE_HISTORY
                | Permissions::ADD_REACTIONS
                | Permissions::CREATE_PUBLIC_THREADS
                | Permissions::SEND_MESSAGES_IN_THREADS,
        ),
        (
            "Active Member",
            3066993,
            Permissions::SEND_MESSAGES
                | Permissions::EMBED_LINKS
                | Permissions::READ_MESSAGE_HISTORY
                | Permissions::ADD_REACTIONS,
        ),
        (
            "Member",
            16777215,
            Permissions::SEND_MESSAGES
                | Permissions::READ_MESSAGE_HISTORY
                | Permissions::ADD_REACTIONS,
        ),
        (
            "New Member",
            16776960,
            Permissions::SEND_MESSAGES | Permissions::READ_MESSAGE_HISTORY,
        ),
    ];

    let mut created = 0;
    for (role_name, color, permissions) in roles {
        println!("Creating role: {}", role_name);

        match client
            .create_role(guild_id)
            .color(color)
            .permissions(permissions)
            .name(role_name)
            .await
        {
            Ok(response) => {
                let role = response.model().await?;
                println!("  ✅ Created role: {} (ID: {})", role_name, role.id);
                created += 1;

                if created % 3 == 0 {
                    post_progress(
                        &client,
                        progress_channel,
                        &format!("  ✅ {}/7 ロール作成完了", created),
                    )
                    .await?;
                }
            },
            Err(e) => {
                println!("  ⚠️ Failed to create role {}: {}", role_name, e);
                post_progress(
                    &client,
                    progress_channel,
                    &format!("⚠️ ロール作成エラー: {} - {}", role_name, e),
                )
                .await?;
            },
        }

        // Rate limiting
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    post_progress(&client, progress_channel, &format!("✅ ロール作成完了！ ({}/7個)", created))
        .await?;

    post_progress(
        &client,
        progress_channel,
        "\n🎊🎊🎊 **Miyabi Community サーバーセットアップ完了！** 🎊🎊🎊\n\n\
         ✅ **作成完了**:\n\
         - カテゴリ: 8個\n\
         - チャンネル: 34個\n\
         - ロール: 7個\n\n\
         🎉 Miyabiちゃん: みんなで素敵なコミュニティを作っていこうね！✨",
    )
    .await?;

    println!("\n🎉 Miyabiちゃん: ロールセットアップが完了したよ！");
    println!("\n🎊 Miyabi Community サーバーセットアップ完了！");

    Ok(())
}
