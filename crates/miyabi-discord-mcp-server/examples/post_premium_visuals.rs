//! Example: Post premium UI/UX visuals to Discord
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example post_premium_visuals -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::env;
use twilight_http::Client;
use twilight_model::channel::message::embed::{Embed, EmbedField, EmbedFooter};
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

    // Premium URLs
    let miyabi_premium_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756547039b46fb3a97720324a79d26b639097cac0f225ab_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T030234Z&X-Tos-Expires=86400&X-Tos-Signature=6ebb93a44d0cfbf768c986c1d1acaa61174f130f6d5f5cd98e03b237126b7bc2&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOQ%3D%3D";

    let design_system_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756557287b46fb3a97720324a79d26b639097cac033363f_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T030251Z&X-Tos-Expires=86400&X-Tos-Signature=8f92280804cc1e0930776c0a6859dc823410b3a547db32e5dc26a50a43e4529b&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8xNg%3D%3D";

    let premium_banner_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756574807b46fb3a97720324a79d26b639097cac0c99f9f_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T030302Z&X-Tos-Expires=86400&X-Tos-Signature=11590e40a161e4013e1c00db27766af486d73e62022642433e4f3d1085c86b53&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8xNg%3D%3D";

    let agent_icon_set_url = "https://ark-content-generation-v2-ap-southeast-1.tos-ap-southeast-1.volces.com/seedream-4-0/021760756585216b46fb3a97720324a79d26b639097cac0c36211_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20251018%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20251018T030313Z&X-Tos-Expires=86400&X-Tos-Signature=2af3b046caed9c241ce540e26c3d90ec7dfdae94b274f108c9831ab3d4bc6d38&X-Tos-SignedHeaders=host&x-tos-process=image%2Fwatermark%2Cimage_YXNzZXRzL3dhdGVybWFyay5wbmc_eC10b3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOQ%3D%3D";

    println!("\n🎨 Posting Premium UI/UX Visuals to Discord...");

    // 1. Header Embed
    let header_embed = Embed {
        author: None,
        color: Some(0x9B59B6), // Purple
        description: Some(
            "🎊 **Premium UI/UX ビジュアルアセット生成完了！**\n\n\
             UI/UXデザイン原則に基づいた、プロフェッショナルグレードのビジュアルアセットを生成しました。\n\n\
             **Design System**:\n\
             • Primary Color: #9B59B6 (Purple)\n\
             • Secondary Color: #3498DB (Blue)\n\
             • Accent: #E91E63 (Pink)\n\
             • Style: Flat Design 2.0 with subtle gradients\n\
             • Accessibility: WCAG 2.1 AA compliant\n\n\
             **Generated Assets**: 4種類".to_string()
        ),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "Powered by ARK API (seedream-4-0-250828)".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("🎨 Premium UI/UX Visual Assets".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[header_embed])?
        .await?;
    println!("  ✅ Header embed posted");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 2. Miyabiちゃん Premium
    let miyabi_embed = Embed {
        author: None,
        color: Some(0x9B59B6),
        description: Some(format!(
            "**Miyabiちゃん Premium Mascot**\n\n\
             プロフェッショナルなUI/UXマスコットデザイン。\n\n\
             **仕様**:\n\
             • Flat Design 2.0 aesthetic\n\
             • Purple gradient (#9B59B6 → #8E44AD)\n\
             • Scalable: 128x128 to 1024x1024\n\
             • WCAG AA contrast compliant\n\
             • Gender-neutral appeal\n\n\
             **用途**: Discord サーバーアイコン\n\n\
             📥 **画像URL**:\n{}",
            miyabi_premium_url
        )),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "1/4: Miyabiちゃん Premium Mascot".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("🌸 Miyabiちゃん Premium".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[miyabi_embed])?
        .await?;
    println!("  ✅ Miyabiちゃん embed posted");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 3. Design System Guide
    let design_embed = Embed {
        author: None,
        color: Some(0x3498DB),
        description: Some(format!(
            "**Design System Guide**\n\n\
             カラーパレット、タイポグラフィ、UIコンポーネントを含むデザインシステムガイド。\n\n\
             **含まれる要素**:\n\
             • Logo variations\n\
             • Color palette with hex codes\n\
             • Typography hierarchy (H1, H2, Body)\n\
             • Button styles (primary, secondary, ghost)\n\
             • Card components\n\
             • 8pt grid spacing system\n\n\
             **用途**: 今後のデザイン作業のリファレンス\n\n\
             📥 **画像URL**:\n{}",
            design_system_url
        )),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "2/4: Design System Guide".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("📐 Design System Guide".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[design_embed])?
        .await?;
    println!("  ✅ Design System embed posted");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 4. Premium Banner
    let banner_embed = Embed {
        author: None,
        color: Some(0x9B59B6),
        description: Some(format!(
            "**Premium Community Banner**\n\n\
             WCAG AA準拠、プロフェッショナルグレードのサーバーバナー。\n\n\
             **仕様**:\n\
             • Size: 1920x1080 (16:9)\n\
             • Purple-blue gradient background\n\
             • High contrast text (white on gradient)\n\
             • WCAG AA contrast ratio: 4.5:1\n\
             • Modern tech aesthetic\n\
             • Balanced composition (rule of thirds)\n\n\
             **用途**: Discord サーバーバナー\n\n\
             📥 **画像URL**:\n{}",
            premium_banner_url
        )),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "3/4: Premium Community Banner".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("🎨 Premium Banner".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[banner_embed])?
        .await?;
    println!("  ✅ Banner embed posted");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 5. Agent Icon Set
    let agent_embed = Embed {
        author: None,
        color: Some(0xE91E63),
        description: Some(format!(
            "**Agent Icon Set (6 characters)**\n\n\
             統一されたデザインシステムに基づく6つのAgentキャラクター。\n\n\
             **キャラクター**:\n\
             1. しきるん (Coordinator) - Purple\n\
             2. つくるん (CodeGen) - Blue\n\
             3. めだまん (Review) - Green\n\
             4. はこぶん (Deployment) - Orange\n\
             5. つなぐん (PR Agent) - Pink\n\
             6. みつけるん (Issue Agent) - Yellow\n\n\
             **統一デザイン**:\n\
             • Same base proportions (chibi style)\n\
             • Consistent line weight\n\
             • Color-blind friendly palette\n\
             • Distinct at 64x64px\n\n\
             **用途**: チャンネルアイコン（個別に分割して使用）\n\n\
             📥 **画像URL**:\n{}",
            agent_icon_set_url
        )),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "4/4: Agent Icon Set".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("🤖 Agent Icon Set".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[agent_embed])?
        .await?;
    println!("  ✅ Agent Icon Set embed posted");
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 6. Next Steps
    let next_steps_embed = Embed {
        author: None,
        color: Some(0x27AE60), // Green
        description: Some(
            "**次のステップ**:\n\n\
             1. 📥 各画像URLから画像をダウンロード\n\
             2. 🖼️ Miyabiちゃん → サーバーアイコンに設定\n\
             3. 🎨 Banner → サーバーバナーに設定\n\
             4. 📐 Design System Guide → 保存してリファレンスとして活用\n\
             5. 🤖 Agent Icon Set → 個別に分割して各チャンネルアイコンに設定\n\n\
             **設定場所**: サーバー設定 → サーバー概要\n\n\
             🎉 Miyabiちゃん: プレミアムビジュアルで、\n\
             もっと素敵なコミュニティにしていこうね！✨"
                .to_string(),
        ),
        fields: vec![],
        footer: Some(EmbedFooter {
            icon_url: None,
            proxy_icon_url: None,
            text: "Miyabi Community Setup Complete!".to_string(),
        }),
        image: None,
        kind: "rich".to_string(),
        provider: None,
        thumbnail: None,
        timestamp: None,
        title: Some("💡 Next Steps".to_string()),
        url: None,
        video: None,
    };

    client
        .create_message(progress_channel)
        .embeds(&[next_steps_embed])?
        .await?;
    println!("  ✅ Next Steps embed posted");

    println!("\n🎊 Miyabiちゃん: Premium UI/UXビジュアルの投稿が完了したよ！");
    println!("   画像をダウンロードして、Discordサーバーに設定してね！✨");

    Ok(())
}
