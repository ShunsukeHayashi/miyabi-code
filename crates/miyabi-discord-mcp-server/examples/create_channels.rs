//! Example: Create channels in Miyabi categories
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example create_channels -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::env;
use twilight_http::Client;
use twilight_model::channel::ChannelType;
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

    // Get all categories (we just created them)
    let channels = client.guild_channels(guild_id).await?.model().await?;

    // Find category IDs
    let mut categories = std::collections::HashMap::new();
    for channel in channels {
        if channel.kind == ChannelType::GuildCategory {
            if let Some(name) = &channel.name {
                categories.insert(name.clone(), channel.id);
            }
        }
    }

    post_progress(&client, progress_channel, "\n📺 **フェーズ 2/3**: チャンネル作成中...").await?;

    // Define channels for each category
    let channel_definitions = vec![
        // WELCOME & RULES
        (
            "📢 WELCOME & RULES",
            vec![
                ("welcome", ChannelType::GuildText),
                ("rules", ChannelType::GuildText),
                ("faq", ChannelType::GuildForum),
                ("announcements", ChannelType::GuildText),
            ],
        ),
        // GENERAL
        (
            "💬 GENERAL",
            vec![
                ("general", ChannelType::GuildText),
                ("introductions", ChannelType::GuildText),
                ("off-topic", ChannelType::GuildText),
                ("links-resources", ChannelType::GuildText),
            ],
        ),
        // CODING AGENTS
        (
            "🔧 CODING AGENTS",
            vec![
                ("しきるん-coordinator", ChannelType::GuildText),
                ("つくるん-codegen", ChannelType::GuildText),
                ("めだまん-review", ChannelType::GuildText),
                ("はこぶん-deployment", ChannelType::GuildText),
                ("つなぐん-pr-agent", ChannelType::GuildText),
                ("みつけるん-issue-agent", ChannelType::GuildText),
                ("worktree-parallel", ChannelType::GuildText),
            ],
        ),
        // BUSINESS AGENTS (simplified)
        (
            "💼 BUSINESS AGENTS",
            vec![
                ("business-agents-strategy", ChannelType::GuildText),
                ("business-agents-marketing", ChannelType::GuildText),
                ("business-agents-sales-crm", ChannelType::GuildText),
            ],
        ),
        // SUPPORT
        (
            "🆘 SUPPORT",
            vec![
                ("help-general", ChannelType::GuildText),
                ("help-installation", ChannelType::GuildText),
                ("help-troubleshooting", ChannelType::GuildForum),
                ("help-worktree", ChannelType::GuildText),
            ],
        ),
        // SHOWCASE
        (
            "🎨 SHOWCASE",
            vec![
                ("showcase-projects", ChannelType::GuildText),
                ("showcase-use-cases", ChannelType::GuildForum),
                ("showcase-tips", ChannelType::GuildText),
                ("showcase-videos", ChannelType::GuildText),
            ],
        ),
        // DEVELOPMENT
        (
            "🛠️ DEVELOPMENT",
            vec![
                ("bug-reports", ChannelType::GuildForum),
                ("feature-requests", ChannelType::GuildForum),
                ("contributions", ChannelType::GuildText),
                ("pull-requests", ChannelType::GuildText),
                ("roadmap", ChannelType::GuildText),
            ],
        ),
        // COMMUNITY
        (
            "🎉 COMMUNITY",
            vec![
                ("events", ChannelType::GuildText),
                ("feedback", ChannelType::GuildText),
                ("mod-chat", ChannelType::GuildText),
            ],
        ),
    ];

    let mut total_created = 0;
    let total_channels: usize = channel_definitions.iter().map(|(_, ch)| ch.len()).sum();

    for (category_name, channels_in_category) in channel_definitions {
        if let Some(&parent_id) = categories.get(category_name) {
            println!("\n📂 Creating channels in category: {}", category_name);

            for (channel_name, channel_type) in channels_in_category {
                println!("  Creating channel: {}", channel_name);

                match client
                    .create_guild_channel(guild_id, channel_name)
                    .kind(channel_type)
                    .parent_id(parent_id)
                    .await
                {
                    Ok(response) => {
                        let channel = response.model().await?;
                        println!("    ✅ Created: {} (ID: {})", channel_name, channel.id);
                        total_created += 1;

                        if total_created % 5 == 0 {
                            post_progress(
                                &client,
                                progress_channel,
                                &format!("  ✅ {}/{} チャンネル作成完了", total_created, total_channels),
                            )
                            .await?;
                        }
                    }
                    Err(e) => {
                        println!("    ⚠️ Failed to create {}: {}", channel_name, e);
                    }
                }

                // Rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
            }
        } else {
            println!("⚠️ Category not found: {}", category_name);
        }
    }

    post_progress(
        &client,
        progress_channel,
        &format!("✅ チャンネル作成完了！ ({}/{}個)", total_created, total_channels),
    )
    .await?;

    post_progress(
        &client,
        progress_channel,
        "\n🎊 **Miyabiちゃん**: チャンネルセットアップが完了したよ！\n\
         次はロールを作成するね！",
    )
    .await?;

    println!("\n🎉 Miyabiちゃん: チャンネルセットアップが完了したよ！");

    Ok(())
}
