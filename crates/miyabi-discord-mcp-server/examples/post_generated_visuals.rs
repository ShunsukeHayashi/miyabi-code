//! Example: Post generated visual URLs to Discord
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example post_generated_visuals -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::env;
use twilight_http::Client;
use twilight_model::channel::message::embed::{Embed, EmbedFooter};
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let token = args
        .token
        .or_else(|| env::var("DISCORD_BOT_TOKEN").ok())
        .expect("DISCORD_BOT_TOKEN not found");

    let _guild_id: Id<GuildMarker> = args.guild_id.parse()?;
    let progress_channel: Id<ChannelMarker> = args.progress_channel_id.parse()?;

    let client = Client::new(token);

    // Miyabiちゃん
    let miyabi_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756329257dc50b8a6bfcf215f3519acc5e3548ac81570c1_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T025854Z&X-Tos-Expires=86400&X-Tos-Signature=064cc3ad4853a06523b2a7f277fb925adb029c7f41085d8e7886548b7ecfb40e&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOQ%3D%3D";

    // Agent Characters
    let agent_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756336731dc50b8a6bfcf215f3519acc5e3548ac8dd3ecc_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T025912Z&X-Tos-Expires=86400&X-Tos-Signature=26ebc37df6c8d80f6b628626fae68a0cc03285c3734ce66c505aeb67818c39eb&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOQ%3D%3D";

    // Banner
    let banner_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756354902dc50b8a6bfcf215f3519acc5e3548ac8c94d1a_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T025920Z&X-Tos-Expires=86400&X-Tos-Signature=c98a5c5347c7ede538be1ff3142386110a96d242666248b8be0e5714069b5547&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8xNg%3D%3D";

    println!("\n🎨 Posting generated visuals to Discord...");

    // Post summary message
    let summary_embed = Embed {
        author: None,
        color: Some(0x9B59B6), // Purple
        description: Some(
            "🎉 **Miyabi Community ビジュアルアセット生成完了！**\n\n\
             ARK API (seedream-4-0) を使用して、3種類の画像を生成しました。\n\n\
             **生成アセット**:\n\
             1. 🌸 Miyabiちゃん（メインマスコット）\n\
             2. 🤖 Agentキャラクター（6体）\n\
             3. 🎨 コミュニティバナー\n\n\
             **次のステップ**:\n\
             1. 画像をダウンロード\n\
             2. Discordサーバー設定でアップロード\n\
             3. サーバーアイコン・バナーとして設定"
                .to_string(),
        ),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "Miyabiちゃん - powered by ARK API".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("🎨 ビジュアルアセット生成レポート".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[summary_embed])?
        .await?;
    println!("  ✅ Summary posted");

    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Post Miyabiちゃん
    let miyabi_message = format!(
        "🌸 **Miyabiちゃん（メインマスコット）**\n\
         サーバーアイコン用のキャラクター画像です。\n\n\
         📥 画像URL:\n{}",
        miyabi_url
    );
    client
        .create_message(progress_channel)
        .content(&miyabi_message)?
        .await?;
    println!("  ✅ Miyabiちゃん URL posted");

    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Post Agent Characters
    let agent_message = format!(
        "🤖 **Agentキャラクター**\n\
         6体のAgentマスコット（しきるん、つくるん、めだまん、はこぶん、つなぐん、みつけるん）\n\n\
         📥 画像URL:\n{}",
        agent_url
    );
    client
        .create_message(progress_channel)
        .content(&agent_message)?
        .await?;
    println!("  ✅ Agent characters URL posted");

    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Post Banner
    let banner_message = format!(
        "🎨 **コミュニティバナー**\n\
         サーバーヘッダー用のバナー画像（1920x1080）\n\n\
         📥 画像URL:\n{}",
        banner_url
    );
    client
        .create_message(progress_channel)
        .content(&banner_message)?
        .await?;
    println!("  ✅ Banner URL posted");

    println!("\n🎊 Miyabiちゃん: ビジュアルアセットの投稿が完了したよ！");
    println!("   画像をダウンロードして、Discordサーバー設定でアップロードしてね！✨");

    Ok(())
}
