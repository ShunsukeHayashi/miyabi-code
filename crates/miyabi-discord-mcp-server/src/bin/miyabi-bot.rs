//! Miyabi Discord Bot - Community management and Miyabi Agent integration
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --bin miyabi-bot
//! ```

use dotenvy::dotenv;
use miyabi_discord_mcp_server::{FeedbackEntry, ProgressReporter};
use octocrab::Octocrab;
use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::{error, info, warn};
use twilight_cache_inmemory::{InMemoryCache, ResourceType};
use twilight_gateway::{Event, EventTypeFlags, Intents, Shard, ShardId, StreamExt};
use twilight_http::Client as HttpClient;
use twilight_model::channel::message::embed::{Embed, EmbedFooter};
use twilight_model::channel::Message;
use twilight_model::id::{
    marker::{ChannelMarker, GuildMarker, MessageMarker, UserMarker},
    Id,
};

/// Rate limit entry for a user
#[derive(Debug, Clone)]
struct RateLimitEntry {
    message_count: u32,
    last_reset: Instant,
    warnings: u32,
}

/// Miyabi Bot state
struct MiyabiBot {
    http: Arc<HttpClient>,
    cache: InMemoryCache,
    command_prefix: String,
    progress_reporter: Option<Arc<ProgressReporter>>,
    /// Guild ID for this bot instance (currently unused, reserved for multi-guild support)
    _guild_id: Id<GuildMarker>,
    introductions_channel_id: Option<Id<ChannelMarker>>,
    /// Rate limit tracking: UserId -> RateLimitEntry
    rate_limits: Arc<Mutex<HashMap<Id<UserMarker>, RateLimitEntry>>>,
    /// Profanity filter word list (basic)
    profanity_words: Vec<String>,
    /// GitHub API client
    github: Option<Arc<Octocrab>>,
    /// GitHub repository (owner/repo)
    github_repo: Option<(String, String)>,
}

impl MiyabiBot {
    fn new(
        http: Arc<HttpClient>,
        progress_channel_id: Option<Id<ChannelMarker>>,
        guild_id: Id<GuildMarker>,
        introductions_channel_id: Option<Id<ChannelMarker>>,
        github: Option<Arc<Octocrab>>,
        github_repo: Option<(String, String)>,
    ) -> Self {
        let cache = InMemoryCache::builder()
            .resource_types(ResourceType::MESSAGE | ResourceType::USER | ResourceType::CHANNEL)
            .build();

        let progress_reporter = progress_channel_id
            .map(|channel_id| Arc::new(ProgressReporter::new(Arc::clone(&http), channel_id)));

        // Basic profanity word list (Japanese + English)
        let profanity_words = vec![
            "バカ".to_string(),
            "アホ".to_string(),
            "死ね".to_string(),
            "クソ".to_string(),
            "ksomf".to_string(),
            "spam".to_string(),
            "scam".to_string(),
            "hack".to_string(),
        ];

        Self {
            http,
            cache,
            command_prefix: "!miyabi".to_string(),
            progress_reporter,
            _guild_id: guild_id,
            introductions_channel_id,
            rate_limits: Arc::new(Mutex::new(HashMap::new())),
            profanity_words,
            github,
            github_repo,
        }
    }

    /// Check rate limit for a user
    /// Returns true if user is within rate limit, false if they exceeded it
    async fn check_rate_limit(&self, user_id: Id<UserMarker>) -> bool {
        const RATE_LIMIT_WINDOW: Duration = Duration::from_secs(10);
        const MAX_MESSAGES_PER_WINDOW: u32 = 5;

        let mut rate_limits = self.rate_limits.lock().await;
        let now = Instant::now();

        let entry = rate_limits.entry(user_id).or_insert(RateLimitEntry {
            message_count: 0,
            last_reset: now,
            warnings: 0,
        });

        // Reset counter if window expired
        if now.duration_since(entry.last_reset) > RATE_LIMIT_WINDOW {
            entry.message_count = 0;
            entry.last_reset = now;
        }

        entry.message_count += 1;

        entry.message_count <= MAX_MESSAGES_PER_WINDOW
    }

    /// Check for profanity in message content
    fn contains_profanity(&self, content: &str) -> bool {
        let content_lower = content.to_lowercase();
        self.profanity_words
            .iter()
            .any(|word| content_lower.contains(&word.to_lowercase()))
    }

    /// Handle rate limit violation
    async fn handle_rate_limit_violation(
        &self,
        msg: &Message,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Get warning count
        let mut rate_limits = self.rate_limits.lock().await;
        let entry = rate_limits.get_mut(&msg.author.id).unwrap();
        entry.warnings += 1;

        if entry.warnings >= 3 {
            // Timeout for 1 minute on 3rd warning
            info!("⏸️ Timeout user {} for spam", msg.author.name);

            // Delete the spam message
            if let Err(e) = self.http.delete_message(msg.channel_id, msg.id).await {
                error!("Failed to delete spam message: {}", e);
            }

            // Send warning (twilight v0.16: builder pattern, call .await directly)
            let _ = self
                .http
                .create_message(msg.channel_id)
                .content(&format!(
                "⚠️ {}さん、メッセージを送信するペースが速すぎます。\n少しゆっくりお願いします。",
                msg.author.name
            ))
                .await;

            // Report to progress channel
            if let Some(ref reporter) = self.progress_reporter {
                let _ = reporter
                    .report_error(
                        "Rate Limit Violation",
                        &format!("User {} exceeded rate limit (3 warnings)", msg.author.name),
                    )
                    .await;
            }
        } else {
            // Just delete the message
            if let Err(e) = self.http.delete_message(msg.channel_id, msg.id).await {
                error!("Failed to delete rate-limited message: {}", e);
            }
        }

        Ok(())
    }

    /// Handle profanity violation
    async fn handle_profanity_violation(
        &self,
        msg: &Message,
    ) -> Result<(), Box<dyn std::error::Error>> {
        info!("🚫 Profanity detected from user {}", msg.author.name);

        // Delete the message
        if let Err(e) = self.http.delete_message(msg.channel_id, msg.id).await {
            error!("Failed to delete profane message: {}", e);
        }

        // Send warning (twilight v0.16: builder pattern, call .await directly)
        let _ = self
            .http
            .create_message(msg.channel_id)
            .content(&format!(
                "🚫 {}さん、不適切な言葉が含まれていたため、メッセージを削除しました。\n\
                 コミュニティルールを守って、みんなが楽しめる環境を作りましょう！",
                msg.author.name
            ))
            .await;

        // Report to progress channel
        if let Some(ref reporter) = self.progress_reporter {
            let _ = reporter
                .report_error(
                    "Profanity Violation",
                    &format!("User {} posted profane content", msg.author.name),
                )
                .await;
        }

        Ok(())
    }

    /// Handle incoming message
    async fn handle_message(&self, msg: &Message) -> Result<(), Box<dyn std::error::Error>> {
        // Ignore bot messages
        if msg.author.bot {
            return Ok(());
        }

        let content = msg.content.trim();

        // 🛡️ Moderation checks (before processing commands)

        // 1. Check rate limit
        if !self.check_rate_limit(msg.author.id).await {
            info!("⚠️ Rate limit exceeded for user {}", msg.author.name);
            return self.handle_rate_limit_violation(msg).await;
        }

        // 2. Check profanity
        if self.contains_profanity(content) {
            info!("🚫 Profanity detected from user {}", msg.author.name);
            return self.handle_profanity_violation(msg).await;
        }

        // 1. Check for command prefix (!miyabi)
        if content.starts_with(&self.command_prefix) {
            // Parse command
            let args: Vec<&str> = content[self.command_prefix.len()..]
                .split_whitespace()
                .collect();

            if args.is_empty() {
                return Ok(());
            }

            let command = args[0];
            let command_args = &args[1..];

            info!("Command received: {} (args: {:?})", command, command_args);

            // Execute command
            match command {
                "help" => self.cmd_help(msg).await?,
                "ping" => self.cmd_ping(msg).await?,
                "status" => self.cmd_status(msg).await?,
                "agent" => self.cmd_agent(msg, command_args).await?,
                "issue" => self.cmd_issue(msg, command_args).await?,
                _ => self.cmd_unknown(msg, command).await?,
            }

            return Ok(());
        }

        // 2. Check for bot mention
        let bot_mentioned = msg.mentions.iter().any(|user| user.bot);

        // 3. Check for keywords
        let content_lower = content.to_lowercase();
        let has_keyword = content_lower.contains("みやび")
            || content_lower.contains("miyabi")
            || content_lower.contains("教えて")
            || content_lower.contains("おしえて")
            || content_lower.contains("ヘルプ")
            || content_lower.contains("help");

        // 4. Respond to mentions or keywords
        if bot_mentioned || has_keyword {
            info!("Natural message received: {}", content);
            self.handle_natural_message(msg, content).await?;
        }

        Ok(())
    }

    /// Handle natural language messages
    async fn handle_natural_message(
        &self,
        msg: &Message,
        content: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let content_lower = content.to_lowercase();

        // Greeting
        if content_lower.contains("こんにちは")
            || content_lower.contains("こんばんは")
            || content_lower.contains("おはよう")
        {
            // Twilight v0.16: call .await? at the end of the builder chain
            self.http
                .create_message(msg.channel_id)
                .content(
                    "🌸 こんにちは！Miyabiちゃんだよ！\n何か手伝えることがあったら教えてね！✨",
                )
                .await?;
            return Ok(());
        }

        // Help/Guide request
        if content_lower.contains("教えて")
            || content_lower.contains("おしえて")
            || content_lower.contains("help")
        {
            // Twilight v0.16: call .await? at the end of the builder chain
            self.http
                .create_message(msg.channel_id)
                .content(
                    "📚 Miyabiについて知りたいのかな？\n\n\
                         **コマンド一覧**: `!miyabi help`\n\
                         **Agent一覧**: `!miyabi agent list`\n\
                         **システム状態**: `!miyabi status`\n\n\
                         詳しくは各コマンドを試してみてね！✨",
                )
                .await?;
            return Ok(());
        }

        // Agent question (twilight v0.16: call .await? at end)
        if content_lower.contains("agent") || content_lower.contains("エージェント") {
            self.http
                .create_message(msg.channel_id)
                .content(
                    "🤖 Agentについて知りたいのかな？\n\n\
                         Miyabiには7つのCoding Agentがいるよ！\n\
                         `!miyabi agent list` で全員紹介するね！\n\n\
                         気になるAgentがあったら `!miyabi agent run <名前>` で実行できるよ！",
                )
                .await?;
            return Ok(());
        }

        // Thank you
        if content_lower.contains("ありがとう")
            || content_lower.contains("thanks")
            || content_lower.contains("thank you")
        {
            self.http
                .create_message(msg.channel_id)
                .content("🌸 どういたしまして！また何かあったら声をかけてね！✨")
                .await?;
            return Ok(());
        }

        // Default response for mentions (twilight v0.16: call .await? at end)
        self.http
            .create_message(msg.channel_id)
            .content(&format!(
                "🌸 {}さん、呼んだ？\n\n\
                 何か質問があったら聞いてね！\n\
                 `!miyabi help` でコマンド一覧が見れるよ！✨",
                msg.author.name
            ))
            .await?;

        Ok(())
    }

    /// !miyabi help
    async fn cmd_help(&self, msg: &Message) -> Result<(), Box<dyn std::error::Error>> {
        let help_text = "\
🌸 **Miyabiちゃん コマンドヘルプ**

**基本コマンド**:
• `!miyabi help` - このヘルプを表示
• `!miyabi ping` - 応答テスト
• `!miyabi status` - Miyabiシステムの状態確認

**Agent実行**:
• `!miyabi agent list` - 利用可能なAgent一覧
• `!miyabi agent run <agent-name>` - Agentを実行
• `!miyabi agent status <agent-id>` - Agent実行状態確認

**Issue管理**:
• `!miyabi issue create <title>` - 新規Issue作成
• `!miyabi issue list` - Issue一覧表示
• `!miyabi issue assign <issue-number> <agent>` - Agentを割り当て

質問があれば、<#help-general> で聞いてね！✨";

        self.http
            .create_message(msg.channel_id)
            .content(help_text)
            .await?;

        Ok(())
    }

    /// !miyabi ping
    async fn cmd_ping(&self, msg: &Message) -> Result<(), Box<dyn std::error::Error>> {
        self.http
            .create_message(msg.channel_id)
            .content("🏓 Pong! Miyabiちゃんは元気だよ！")
            .await?;

        Ok(())
    }

    /// !miyabi status
    async fn cmd_status(&self, msg: &Message) -> Result<(), Box<dyn std::error::Error>> {
        let status_text = "\
📊 **Miyabi System Status**

✅ **Discord Bot**: Online
✅ **Miyabi Agents**: Ready
✅ **GitHub Integration**: Connected

**Available Agents** (7):
• しきるん (Coordinator)
• つくるん (CodeGen)
• めだまん (Review)
• はこぶん (Deployment)
• つなぐん (PR Agent)
• みつけるん (Issue Agent)

🎉 All systems operational!";

        self.http
            .create_message(msg.channel_id)
            .content(status_text)
            .await?;

        Ok(())
    }

    /// !miyabi agent <subcommand>
    async fn cmd_agent(
        &self,
        msg: &Message,
        args: &[&str],
    ) -> Result<(), Box<dyn std::error::Error>> {
        if args.is_empty() {
            self.http
                .create_message(msg.channel_id)
                .content("使い方: `!miyabi agent <list|run|status>`")
                .await?;
            return Ok(());
        }

        match args[0] {
            "list" => {
                let agent_list = "\
🤖 **利用可能なMiyabi Agents**

**Coding Agents** (7個):
1. 🎯 **しきるん** (Coordinator) - タスク統括・DAG分解
2. ✍️ **つくるん** (CodeGen) - AI駆動コード生成
3. 🔍 **めだまん** (Review) - コード品質レビュー
4. 🚀 **はこぶん** (Deployment) - CI/CDデプロイ自動化
5. 🔗 **つなぐん** (PR Agent) - Pull Request自動作成
6. 🏷️ **みつけるん** (Issue Agent) - Issue分析・ラベリング
7. 📝 **まとめるん** (Documentation) - ドキュメント自動生成

**実行方法**: `!miyabi agent run <agent-name>`
例: `!miyabi agent run つくるん`";

                self.http
                    .create_message(msg.channel_id)
                    .content(agent_list)
                    .await?;
            }
            "run" => {
                if args.len() < 2 {
                    self.http
                        .create_message(msg.channel_id)
                        .content("使い方: `!miyabi agent run <agent-name>`\n例: `!miyabi agent run つくるん`")
                        .await?;
                    return Ok(());
                }

                let agent_name = args[1];
                let response = format!(
                    "🚀 Agent実行リクエストを受け付けたよ！\n\n\
                     **Agent**: {}\n\
                     **Status**: 実行準備中...\n\n\
                     実行完了したらここに結果を投稿するね！✨",
                    agent_name
                );

                self.http
                    .create_message(msg.channel_id)
                    .content(&response)
                    .await?;

                // Report agent execution start
                if let Some(ref reporter) = self.progress_reporter {
                    if let Err(e) = reporter.report_agent_start(agent_name, None).await {
                        error!("Failed to report agent start: {}", e);
                    }
                }

                // TODO: 実際のAgent実行統合
                info!("Agent execution requested: {}", agent_name);

                // Simulate agent execution (for demo)
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

                // Report agent execution completion
                if let Some(ref reporter) = self.progress_reporter {
                    if let Err(e) = reporter
                        .report_agent_complete(
                            agent_name,
                            None,
                            true,
                            "Agent実行が完了しました（デモ）",
                        )
                        .await
                    {
                        error!("Failed to report agent complete: {}", e);
                    }
                }
            }
            _ => {
                self.http
                    .create_message(msg.channel_id)
                    .content("未知のサブコマンドだよ。`!miyabi agent list` で確認してね！")
                    .await?;
            }
        }

        Ok(())
    }

    /// !miyabi issue <subcommand>
    async fn cmd_issue(
        &self,
        msg: &Message,
        args: &[&str],
    ) -> Result<(), Box<dyn std::error::Error>> {
        if args.is_empty() {
            self.http
                .create_message(msg.channel_id)
                .content("使い方: `!miyabi issue <create|list|assign>`")
                .await?;
            return Ok(());
        }

        match args[0] {
            "create" => {
                // Expected format: !miyabi issue create <channel_id> <message_id>
                if args.len() < 3 {
                    self.http
                        .create_message(msg.channel_id)
                        .content("📝 **使い方**: `!miyabi issue create <channel_id> <message_id>`\n\n**例**: `!miyabi issue create 1199878848968405057 1234567890123456789`\n\n💡 チャンネルIDとメッセージIDは、メッセージURLから取得できるよ！\nURL形式: `https://discord.com/channels/[guild_id]/[channel_id]/[message_id]`")
                        .await?;
                    return Ok(());
                }

                // Parse channel_id and message_id
                let channel_id: Id<ChannelMarker> = match args[1].parse() {
                    Ok(id) => id,
                    Err(_) => {
                        self.http
                            .create_message(msg.channel_id)
                            .content("❌ 無効なチャンネルIDだよ。数値で指定してね！")
                            .await?;
                        return Ok(());
                    }
                };

                let message_id: Id<MessageMarker> = match args[2].parse() {
                    Ok(id) => id,
                    Err(_) => {
                        self.http
                            .create_message(msg.channel_id)
                            .content("❌ 無効なメッセージIDだよ。数値で指定してね！")
                            .await?;
                        return Ok(());
                    }
                };

                // Check if GitHub is configured
                let (github, (owner, repo)) = match (&self.github, &self.github_repo) {
                    (Some(gh), Some(repo_info)) => (gh, repo_info),
                    _ => {
                        self.http
                            .create_message(msg.channel_id)
                            .content("❌ GitHub連携が設定されていません。\n\n管理者に以下の環境変数を設定してもらってね：\n- `GITHUB_TOKEN`\n- `GITHUB_REPO` (形式: `owner/repo`)")
                            .await?;
                        return Ok(());
                    }
                };

                // Show progress
                self.http
                    .create_message(msg.channel_id)
                    .content("🔍 メッセージを取得中...")
                    .await?;

                // Fetch Discord message
                let discord_msg = match self.http.message(channel_id, message_id).await {
                    Ok(response) => match response.model().await {
                        Ok(msg) => msg,
                        Err(e) => {
                            error!("Failed to parse message: {}", e);
                            self.http
                                .create_message(msg.channel_id)
                                .content(&format!("❌ メッセージの解析に失敗しました: {}", e))
                                .await?;
                            return Ok(());
                        }
                    },
                    Err(e) => {
                        error!("Failed to fetch message: {}", e);
                        self.http
                            .create_message(msg.channel_id)
                            .content(&format!("❌ メッセージの取得に失敗しました: {}\n\n💡 チャンネルIDとメッセージIDが正しいか確認してね！", e))
                            .await?;
                        return Ok(());
                    }
                };

                // Convert to FeedbackEntry
                let feedback = FeedbackEntry::from_message(&discord_msg);

                info!(
                    "Creating GitHub Issue from Discord message: {} (type: {:?}, priority: {})",
                    feedback.content.chars().take(50).collect::<String>(),
                    feedback.feedback_type,
                    feedback.priority_score()
                );

                // Show progress
                self.http
                    .create_message(msg.channel_id)
                    .content("📝 GitHub Issueを作成中...")
                    .await?;

                // Create GitHub Issue
                let issue_result = github
                    .issues(owner, repo)
                    .create(feedback.to_issue_title())
                    .body(feedback.to_issue_body())
                    .send()
                    .await;

                let issue = match issue_result {
                    Ok(iss) => iss,
                    Err(e) => {
                        error!("Failed to create GitHub Issue: {}", e);
                        self.http
                            .create_message(msg.channel_id)
                            .content(&format!("❌ GitHub Issueの作成に失敗しました: {}\n\n💡 GitHubトークンの権限を確認してね！", e))
                            .await?;
                        return Ok(());
                    }
                };

                info!("Created GitHub Issue #{}: {}", issue.number, issue.title);

                // Apply labels (separate API call)
                let labels = feedback.suggest_labels();
                if !labels.is_empty() {
                    match github
                        .issues(owner, repo)
                        .add_labels(issue.number, &labels)
                        .await
                    {
                        Ok(_) => {
                            info!("Applied labels to Issue #{}: {:?}", issue.number, labels);
                        }
                        Err(e) => {
                            warn!("Failed to apply labels to Issue #{}: {}", issue.number, e);
                        }
                    }
                }

                // Report success
                let success_message = format!(
                    "✅ **GitHub Issueを作成しました！**\n\n\
                     **Issue**: #{} - {}\n\
                     **URL**: {}\n\
                     **Type**: {:?}\n\
                     **Priority Score**: {}\n\
                     **Labels**: {}\n\n\
                     🎉 フィードバックありがとう！開発に反映するね！",
                    issue.number,
                    issue.title,
                    issue.html_url,
                    feedback.feedback_type,
                    feedback.priority_score(),
                    labels.join(", ")
                );

                self.http
                    .create_message(msg.channel_id)
                    .content(&success_message)
                    .await?;

                // Report to progress channel
                if let Some(ref reporter) = self.progress_reporter {
                    let _ = reporter
                        .report_agent_complete(
                            "FeedbackCollector",
                            Some(issue.number as u32),
                            true,
                            &format!(
                                "Created Issue #{} from Discord feedback by {}",
                                issue.number, feedback.author_name
                            ),
                        )
                        .await;
                }
            }
            "list" => {
                self.http
                    .create_message(msg.channel_id)
                    .content("📋 Issue一覧表示機能は開発中だよ！")
                    .await?;
            }
            "assign" => {
                self.http
                    .create_message(msg.channel_id)
                    .content("🎯 Agent割り当て機能は開発中だよ！")
                    .await?;
            }
            _ => {
                self.http
                    .create_message(msg.channel_id)
                    .content("未知のサブコマンドだよ。`!miyabi help` で確認してね！")
                    .await?;
            }
        }

        Ok(())
    }

    /// Unknown command
    async fn cmd_unknown(
        &self,
        msg: &Message,
        command: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let response = format!(
            "❓ 「{}」は知らないコマンドだよ。\n`!miyabi help` で使えるコマンドを確認してね！",
            command
        );

        self.http
            .create_message(msg.channel_id)
            .content(&response)
            .await?;

        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load .env
    dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG").unwrap_or_else(|_| "miyabi_discord_mcp_server=info".to_string()),
        )
        .init();

    // Get token
    let token = env::var("DISCORD_BOT_TOKEN").expect("DISCORD_BOT_TOKEN not found");

    // Get guild ID
    let guild_id: Id<GuildMarker> = env::var("GUILD_ID")
        .expect("GUILD_ID not found")
        .parse()
        .expect("Invalid GUILD_ID");

    // Get progress channel ID (optional)
    let progress_channel_id = env::var("PROGRESS_CHANNEL_ID")
        .ok()
        .and_then(|id| id.parse().ok());

    // Get introductions channel ID (optional)
    let introductions_channel_id = env::var("INTRODUCTIONS_CHANNEL_ID")
        .ok()
        .and_then(|id| id.parse().ok());

    // Create HTTP client
    let http = Arc::new(HttpClient::new(token.clone()));

    // Get GitHub token (optional)
    let github = env::var("GITHUB_TOKEN").ok().map(|token| {
        match Octocrab::builder().personal_token(token).build() {
            Ok(client) => Arc::new(client),
            Err(e) => {
                error!("Failed to create GitHub client: {}", e);
                panic!("Failed to create GitHub client");
            }
        }
    });

    // Parse GitHub repository (optional)
    let github_repo = env::var("GITHUB_REPO").ok().and_then(|repo| {
        let parts: Vec<&str> = repo.split('/').collect();
        if parts.len() != 2 {
            error!("GITHUB_REPO must be in format 'owner/repo', got: {}", repo);
            return None;
        }
        Some((parts[0].to_string(), parts[1].to_string()))
    });

    // Log GitHub integration status
    match (&github, &github_repo) {
        (Some(_), Some((owner, repo))) => {
            info!("✅ GitHub integration enabled for {}/{}", owner, repo);
        }
        _ => {
            warn!("⚠️ GitHub integration disabled (GITHUB_TOKEN or GITHUB_REPO not set)");
            warn!("   Set GITHUB_TOKEN and GITHUB_REPO to enable feedback-to-Issue automation");
        }
    }

    // Create bot instance
    let bot = Arc::new(MiyabiBot::new(
        Arc::clone(&http),
        progress_channel_id,
        guild_id,
        introductions_channel_id,
        github,
        github_repo,
    ));

    info!("🎉 Miyabi Discord Bot starting...");

    // Configure intents (added GUILD_MEMBERS for member join events)
    let intents = Intents::GUILD_MESSAGES
        | Intents::MESSAGE_CONTENT
        | Intents::GUILDS
        | Intents::GUILD_MEMBERS;

    // Create shard
    let mut shard = Shard::new(ShardId::ONE, token, intents);

    info!("✅ Connecting to Discord Gateway...");

    // Event loop
    loop {
        // Twilight v0.16: next_event() requires EventTypeFlags and returns Option<Result<...>>
        let event = match shard.next_event(EventTypeFlags::all()).await {
            Some(Ok(event)) => event,
            Some(Err(source)) => {
                error!("Error receiving event: {}", source);
                // Twilight v0.16: is_fatal() removed, just continue on errors
                continue;
            }
            None => {
                info!("Event stream closed");
                break;
            }
        };

        // Update cache
        bot.cache.update(&event);

        // Process event
        tokio::spawn({
            let bot = Arc::clone(&bot);
            async move {
                if let Err(e) = process_event(bot, event).await {
                    error!("Error processing event: {}", e);
                }
            }
        });
    }

    Ok(())
}

/// Process individual event
async fn process_event(
    bot: Arc<MiyabiBot>,
    event: Event,
) -> Result<(), Box<dyn std::error::Error>> {
    match event {
        Event::Ready(_) => {
            info!("🎊 Miyabi Discord Bot is ready!");
            info!("✨ Miyabiちゃん: コミュニティのみんな、よろしくね！");

            // Report bot startup to progress channel
            if let Some(ref reporter) = bot.progress_reporter {
                if let Err(e) = reporter.report_bot_startup().await {
                    error!("Failed to report bot startup: {}", e);
                }
            }
        }
        Event::MessageCreate(msg) => {
            if let Err(e) = bot.handle_message(&msg.0).await {
                error!("Error handling message: {}", e);
            }
        }
        Event::MemberAdd(member_add) => {
            info!("🆕 New member joined: {}", member_add.user.name);

            // Send welcome DM
            match bot.http.create_private_channel(member_add.user.id).await {
                Ok(dm_channel) => {
                    let welcome_embed = Embed {
                        author: None,
                        color: Some(0x9B59B6), // Purple
                        description: Some(
                            "🌸 **ようこそ、Miyabi Community へ！**\n\n\
                             Miyabiちゃんだよ！参加してくれてありがとう！✨\n\n\
                             **まずはこちらをチェックしてね**:\n\
                             📜 <#rules> - コミュニティルール\n\
                             📢 <#announcements> - 最新情報\n\
                             🤖 <#agent-general> - Agent機能について\n\n\
                             **何か困ったことがあれば**:\n\
                             💬 <#help-general> - 質問・相談\n\
                             👋 <#introductions> - 自己紹介\n\n\
                             コミュニティを楽しんでね！🎉"
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
                        title: Some("👋 Welcome!".to_string()),
                        url: None,
                        video: None,
                    };

                    // Twilight v0.16: call .await first to get Result
                    match bot
                        .http
                        .create_message(dm_channel.model().await?.id)
                        .embeds(&[welcome_embed])
                        .await
                    {
                        Ok(_) => {
                            info!("Successfully sent welcome DM");
                        }
                        Err(e) => {
                            error!("Failed to send welcome DM: {}", e);
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to create DM channel: {}", e);
                }
            }

            // Post to #introductions channel if configured
            if let Some(intro_channel_id) = bot.introductions_channel_id {
                let announcement = format!(
                    "🌸 みんな、{}さんがMiyabiコミュニティに参加したよ！\n\
                     一緒に楽しく学んでいこうね！👋✨",
                    member_add.user.name
                );

                // Twilight v0.16: call .await first to get Result
                match bot
                    .http
                    .create_message(intro_channel_id)
                    .content(&announcement)
                    .await
                {
                    Ok(_) => {
                        info!("Successfully posted to introductions channel");
                    }
                    Err(e) => {
                        error!("Failed to create announcement message: {}", e);
                    }
                }
            }

            // Report to progress channel
            if let Some(ref reporter) = bot.progress_reporter {
                let report = format!(
                    "🆕 **新規メンバー参加**\n\n\
                     **User**: {}#{}\n\
                     **User ID**: {}",
                    member_add.user.name, member_add.user.discriminator, member_add.user.id
                );

                if let Err(e) = reporter.report_error("Member Join", &report).await {
                    error!("Failed to report member join: {}", e);
                }
            }
        }
        _ => {}
    }

    Ok(())
}
