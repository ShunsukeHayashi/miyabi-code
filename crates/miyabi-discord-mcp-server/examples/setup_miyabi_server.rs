//! Example: Setup Miyabi Community Server Structure
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example setup_miyabi_server -- \
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

    /// Progress channel ID (where to post updates)
    #[arg(long)]
    progress_channel_id: String,

    /// Bot Token (defaults to DISCORD_BOT_TOKEN env var)
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

    // Initial progress post
    post_progress(
        &client,
        progress_channel,
        "🎉 Miyabiちゃん: Miyabi Community サーバーセットアップを開始するよ！",
    )
    .await?;

    post_progress(
        &client,
        progress_channel,
        "📋 **セットアップ内容**:\n\
         - カテゴリ: 8個\n\
         - チャンネル: 42個\n\
         - ロール: 7個",
    )
    .await?;

    // Step 1: Create categories
    post_progress(
        &client,
        progress_channel,
        "\n📂 **フェーズ 1/3**: カテゴリ作成中...",
    )
    .await?;

    let categories = [
        "📢 WELCOME & RULES",
        "💬 GENERAL",
        "🔧 CODING AGENTS",
        "💼 BUSINESS AGENTS",
        "🆘 SUPPORT",
        "🎨 SHOWCASE",
        "🛠️ DEVELOPMENT",
        "🎉 COMMUNITY",
    ];

    for (i, category_name) in categories.iter().enumerate() {
        println!("Creating category: {}", category_name);

        match client
            .create_guild_channel(guild_id, category_name)?
            .kind(ChannelType::GuildCategory)
            .await
        {
            Ok(response) => {
                let channel = response.model().await?;
                println!(
                    "✅ Created category: {} (ID: {})",
                    category_name, channel.id
                );

                if (i + 1) % 3 == 0 {
                    post_progress(
                        &client,
                        progress_channel,
                        &format!("  ✅ {}/{} カテゴリ作成完了", i + 1, categories.len()),
                    )
                    .await?;
                }
            }
            Err(e) => {
                println!("⚠️ Failed to create category {}: {}", category_name, e);
                post_progress(
                    &client,
                    progress_channel,
                    &format!("⚠️ カテゴリ作成エラー: {} - {}", category_name, e),
                )
                .await?;
            }
        }

        // Rate limiting
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    post_progress(
        &client,
        progress_channel,
        &format!(
            "✅ カテゴリ作成完了！ ({}/{}個)",
            categories.len(),
            categories.len()
        ),
    )
    .await?;

    // Summary
    post_progress(
        &client,
        progress_channel,
        "\n🎊 **セットアップ完了！**\n\
         次のステップ:\n\
         1. 各カテゴリ内にチャンネルを作成\n\
         2. ロールを作成・設定\n\
         3. 権限を設定\n\
         4. 初期コンテンツを投稿",
    )
    .await?;

    println!("\n🎉 Miyabiちゃん: カテゴリセットアップが完了したよ！");

    Ok(())
}
