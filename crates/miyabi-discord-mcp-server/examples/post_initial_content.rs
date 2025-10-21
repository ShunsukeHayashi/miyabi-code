//! Example: Post initial content to Miyabi channels
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example post_initial_content -- \
//!   --guild-id 1199878847466836059 \
//!   --progress-channel-id 1199878848968405057
//! ```

use clap::Parser;
use std::collections::HashMap;
use std::env;
use twilight_http::Client;
use twilight_model::channel::message::embed::{Embed, EmbedAuthor, EmbedFooter};
use twilight_model::id::{
    marker::{ChannelMarker, GuildMarker},
    Id,
};
use twilight_model::util::Timestamp;

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

async fn post_embed(
    client: &Client,
    channel_id: Id<ChannelMarker>,
    embed: Embed,
) -> Result<(), Box<dyn std::error::Error>> {
    client.create_message(channel_id).embeds(&[embed])?.await?;
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
        "\n📝 **フェーズ 4/4**: 初期コンテンツ投稿中...",
    )
    .await?;

    // Get all channels
    let channels = client.guild_channels(guild_id).await?.model().await?;
    let mut channel_map: HashMap<String, Id<ChannelMarker>> = HashMap::new();

    for channel in channels {
        if let Some(name) = &channel.name {
            channel_map.insert(name.clone(), channel.id);
        }
    }

    // 1. Post to #welcome
    if let Some(&welcome_id) = channel_map.get("welcome") {
        println!("\n📝 Posting to #welcome...");

        let embed = Embed {
            author: None,
            color: Some(0x5865F2),
            description: Some(
                "こんにちは！Miyabiちゃんだよ！\n\n\
                このコミュニティでは、Miyabiユーザー同士が学び合い、成長できる場所だよ！\n\n\
                **まずは以下をチェックしてね**:\n\
                📜 <#rules> - コミュニティルール\n\
                💬 <#general> - 一般チャット\n\
                🙋 <#introductions> - 自己紹介\n\n\
                質問があれば <#help-general> でお気軽にどうぞ！\n\n\
                みんなで楽しいコミュニティを作っていこうね！✨"
                    .to_string(),
            ),
            fields: vec![],
            footer: Some(EmbedFooter {
                icon_url: None,
                proxy_icon_url: None,
                text: "Miyabiちゃん".to_string(),
            }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("👋 ようこそ、Miyabi Community へ！".to_string()),
            url: None,
            video: None,
        };

        post_embed(&client, welcome_id, embed).await?;
        println!("  ✅ Welcome message posted");
    }

    // 2. Post to #rules
    if let Some(&rules_id) = channel_map.get("rules") {
        println!("\n📝 Posting to #rules...");

        let embed = Embed {
            author: None,
            color: Some(0xED4245),
            description: Some(
                "**基本ルール**:\n\n\
                1️⃣ **相互尊重**: 全てのメンバーを尊重し、親切に接しましょう\n\
                2️⃣ **建設的な議論**: 批判ではなく、建設的なフィードバックを\n\
                3️⃣ **スパム禁止**: スパム、広告、無関係な投稿は禁止です\n\
                4️⃣ **適切なチャンネル使用**: 各チャンネルの目的に沿った投稿を\n\
                5️⃣ **個人情報保護**: 個人情報の共有は控えましょう\n\n\
                **違反時の対応**:\n\
                - 1回目: 警告\n\
                - 2回目: 一時的なミュート\n\
                - 3回目: サーバーからのキック\n\
                - 重大な違反: 即座にBAN\n\n\
                質問や報告は <#mod-chat> へ（モデレーターのみ閲覧可能）"
                    .to_string(),
            ),
            fields: vec![],
            footer: Some(EmbedFooter {
                icon_url: None,
                proxy_icon_url: None,
                text: "最終更新: 2025-10-18".to_string(),
            }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("📜 Miyabi Community ルール".to_string()),
            url: None,
            video: None,
        };

        post_embed(&client, rules_id, embed).await?;
        println!("  ✅ Rules posted");
    }

    // 3. Post to #announcements
    if let Some(&announcements_id) = channel_map.get("announcements") {
        println!("\n📝 Posting to #announcements...");

        let embed = Embed {
            author: None,
            color: Some(0x57F287),
            description: Some(
                "**Miyabi Community サーバーがオープンしました！**\n\n\
                このサーバーでは以下のことができます:\n\n\
                🔧 **Coding Agents**: 7つのコーディングAgent（しきるん、つくるん等）の使い方を学ぶ\n\
                💼 **Business Agents**: ビジネス戦略からマーケティングまで、14のAgentを活用\n\
                🆘 **Support**: ヘルプ・トラブルシューティング\n\
                🎨 **Showcase**: プロジェクトやユースケースを共有\n\
                🛠️ **Development**: バグレポート・フィーチャーリクエスト\n\n\
                **次のステップ**:\n\
                1. <#introductions> で自己紹介\n\
                2. <#general> で雑談\n\
                3. 各Agentチャンネルで使い方を学ぶ\n\n\
                Let's build amazing things together! 🚀".to_string()
            ),
            fields: vec![],
            footer: Some(EmbedFooter {
                icon_url: None,
                proxy_icon_url: None,
                text: "Miyabiちゃん - 2025-10-18".to_string(),
            }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("🎉 Miyabi Community サーバーオープン！".to_string()),
            url: None,
            video: None,
        };

        post_embed(&client, announcements_id, embed).await?;
        println!("  ✅ Announcement posted");
    }

    post_progress(
        &client,
        progress_channel,
        "✅ 初期コンテンツ投稿完了！\n  - #welcome: ウェルカムメッセージ\n  - #rules: コミュニティルール\n  - #announcements: オープン告知",
    )
    .await?;

    // 4. Post to each Coding Agent channel
    post_progress(
        &client,
        progress_channel,
        "\n📝 各Agentチャンネルへの説明投稿中...",
    )
    .await?;

    let agent_channels = vec![
        ("しきるん-coordinator", "🎯 CoordinatorAgent", "タスクを自動分解・並列実行するよ！\n\nIssueを受け取って、複数のタスクに分解してWorktreeで並列実行できるんだ。\n\n**使い方**: Issue番号を指定するだけ！"),
        ("つくるん-codegen", "✍️ CodeGenAgent", "AIでコードを自動生成するよ！\n\nClaude Sonnet 4を使って、Rust/TypeScriptのコードを生成できるんだ。\n\n**特徴**: テスト付き、型安全、ドキュメント完備"),
        ("めだまん-review", "🔍 ReviewAgent", "コードの品質をチェックするよ！\n\n静的解析・セキュリティスキャン・品質スコアリング（100点満点）を実施するんだ。\n\n**判定**: 80点以上でGood！"),
        ("はこぶん-deployment", "🚀 DeploymentAgent", "デプロイを自動化するよ！\n\nFirebase/Vercel/AWSへの自動デプロイ、ヘルスチェック、ロールバック準備を行うんだ。"),
        ("つなぐん-pr-agent", "🔗 PRAgent", "Pull Requestを自動作成するよ！\n\nConventional Commits準拠のPRを自動生成、Draft PR作成もできるんだ。"),
        ("みつけるん-issue-agent", "🏷️ IssueAgent", "Issueを自動分析・ラベリングするよ！\n\nAI推論で57ラベル体系から適切なラベルを自動付与するんだ。"),
    ];

    let mut posted = 0;
    for (channel_name, agent_title, description) in agent_channels {
        if let Some(&channel_id) = channel_map.get(channel_name) {
            let embed = Embed {
                author: None,
                color: Some(0x5865F2),
                description: Some(description.to_string()),
                fields: vec![],
                footer: Some(EmbedFooter {
                    icon_url: None,
                    proxy_icon_url: None,
                    text: "Miyabiちゃん".to_string(),
                }),
                image: None,
                kind: "rich".to_string(),
                provider: None,
                thumbnail: None,
                timestamp: None,
                title: Some(agent_title.to_string()),
                url: None,
                video: None,
            };

            post_embed(&client, channel_id, embed).await?;
            posted += 1;
            println!("  ✅ Posted to #{}", channel_name);
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
    }

    post_progress(
        &client,
        progress_channel,
        &format!("✅ Agentチャンネル説明投稿完了！ ({}/6個)", posted),
    )
    .await?;

    post_progress(
        &client,
        progress_channel,
        "\n🎊🎊🎊 **全セットアップ完了！** 🎊🎊🎊\n\n\
         ✅ **完了項目**:\n\
         - カテゴリ: 8個\n\
         - チャンネル: 34個\n\
         - ロール: 7個\n\
         - 初期コンテンツ: 9投稿\n\n\
         🎉 Miyabiちゃん: Miyabi Communityの準備が整ったよ！\n\
         みんなでワクワクするコミュニティを作っていこうね！✨",
    )
    .await?;

    println!("\n🎉 Miyabiちゃん: 初期コンテンツ投稿が完了したよ！");

    Ok(())
}
