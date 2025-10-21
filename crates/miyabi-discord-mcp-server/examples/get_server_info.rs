//! Example: Get Discord server information
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example get_server_info -- --guild-id 1199878847466836059
//! ```

use clap::Parser;
use std::env;
use twilight_http::Client;
use twilight_model::id::{marker::GuildMarker, Id};

#[derive(Parser)]
struct Args {
    /// Discord Guild ID
    #[arg(long)]
    guild_id: String,

    /// Bot Token (defaults to DISCORD_BOT_TOKEN env var)
    #[arg(long)]
    token: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let token = args
        .token
        .or_else(|| env::var("DISCORD_BOT_TOKEN").ok())
        .expect("DISCORD_BOT_TOKEN not found");

    println!("🔍 Miyabiちゃん: サーバー情報を取得するよ！");
    println!("Guild ID: {}", args.guild_id);

    let client = Client::new(token);
    let guild_id: Id<GuildMarker> = args.guild_id.parse()?;

    // Get guild info
    println!("\n📊 サーバー情報取得中...");
    let guild = client.guild(guild_id).await?.model().await?;

    println!("\n✅ サーバー情報:");
    println!("  名前: {}", guild.name);
    println!("  Owner ID: {}", guild.owner_id);
    println!("  メンバー数: {:?}", guild.approximate_member_count);

    // Get channels
    let channels = client.guild_channels(guild_id).await?.model().await?;

    println!("\n📺 チャンネル一覧 ({}個):", channels.len());
    for (i, channel) in channels.iter().enumerate() {
        if i < 20 {
            println!(
                "  {}. {} ({:?})",
                i + 1,
                channel.name.as_ref().unwrap_or(&"N/A".to_string()),
                channel.kind
            );
        }
    }
    if channels.len() > 20 {
        println!("  ... 他 {}個のチャンネル", channels.len() - 20);
    }

    // Get roles
    println!("\n👥 ロール一覧 ({}個):", guild.roles.len());
    for (i, role) in guild.roles.iter().enumerate() {
        if i < 15 {
            println!(
                "  {}. {} (権限: {})",
                i + 1,
                role.name,
                role.permissions.bits()
            );
        }
    }
    if guild.roles.len() > 15 {
        println!("  ... 他 {}個のロール", guild.roles.len() - 15);
    }

    println!("\n🎉 Miyabiちゃん: サーバー情報の取得が完了したよ！");
    println!("\n次のステップ:");
    println!("  1. Miyabi仕様のカテゴリ・チャンネルを作成");
    println!("  2. Miyabi仕様のロールを作成");
    println!("  3. 初期コンテンツを投稿");

    Ok(())
}
