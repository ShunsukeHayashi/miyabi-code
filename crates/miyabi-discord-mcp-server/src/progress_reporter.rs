//! Progress Reporter - Automatic progress reporting to Discord

use std::sync::Arc;
use twilight_http::Client as HttpClient;
use twilight_model::channel::message::embed::{Embed, EmbedFooter};
use twilight_model::id::{marker::ChannelMarker, Id};

/// Progress Reporter for Discord
pub struct ProgressReporter {
    http: Arc<HttpClient>,
    progress_channel_id: Id<ChannelMarker>,
}

impl ProgressReporter {
    pub fn new(http: Arc<HttpClient>, progress_channel_id: Id<ChannelMarker>) -> Self {
        Self { http, progress_channel_id }
    }

    /// Report bot startup
    pub async fn report_bot_startup(&self) -> Result<(), Box<dyn std::error::Error>> {
        let embed = Embed {
            author: None,
            color: Some(0x27AE60), // Green
            description: Some(
                "🎉 **Miyabi Discord Bot が起動しました！**\n\n\
                 ✅ Gateway接続完了\n\
                 ✅ イベント監視開始\n\
                 ✅ コマンド受付準備完了\n\n\
                 **利用可能なコマンド**:\n\
                 • `!miyabi help` - ヘルプ表示\n\
                 • `!miyabi agent list` - Agent一覧\n\
                 • `!miyabi status` - システム状態確認\n\n\
                 🌸 Miyabiちゃん: みんな、よろしくね！"
                    .to_string(),
            ),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "Miyabi Bot v1.0.0".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("🚀 Bot Startup".to_string()),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report bot shutdown
    pub async fn report_bot_shutdown(&self) -> Result<(), Box<dyn std::error::Error>> {
        let embed = Embed {
            author: None,
            color: Some(0xE74C3C), // Red
            description: Some(
                "👋 **Miyabi Discord Bot がシャットダウンします**\n\n\
                 メンテナンス中か、再起動中かもしれないよ。\n\
                 すぐに戻ってくるから待っててね！"
                    .to_string(),
            ),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "Miyabi Bot v1.0.0".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("⏸️ Bot Shutdown".to_string()),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report agent execution start
    pub async fn report_agent_start(
        &self,
        agent_name: &str,
        issue_number: Option<u32>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let issue_info = if let Some(num) = issue_number {
            format!("\n**Issue**: #{}", num)
        } else {
            String::new()
        };

        let embed = Embed {
            author: None,
            color: Some(0x3498DB), // Blue
            description: Some(format!(
                "🚀 **Agent実行開始**\n\n\
                 **Agent**: {}{}\n\
                 **Status**: 実行中...\n\n\
                 完了したら結果を報告するね！✨",
                agent_name, issue_info
            )),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "Agent Execution".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some(format!("🤖 {} 実行開始", agent_name)),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report agent execution completion
    pub async fn report_agent_complete(
        &self,
        agent_name: &str,
        issue_number: Option<u32>,
        success: bool,
        summary: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let (color, status_emoji, status_text) = if success {
            (0x27AE60, "✅", "成功")
        } else {
            (0xE74C3C, "❌", "失敗")
        };

        let issue_info = if let Some(num) = issue_number {
            format!("\n**Issue**: #{}", num)
        } else {
            String::new()
        };

        let embed = Embed {
            author: None,
            color: Some(color),
            description: Some(format!(
                "{} **Agent実行{}**\n\n\
                 **Agent**: {}{}\n\n\
                 **結果**:\n{}",
                status_emoji, status_text, agent_name, issue_info, summary
            )),
            fields: vec![],
            footer: Some(EmbedFooter {
                icon_url: None,
                proxy_icon_url: None,
                text: "Agent Execution Complete".to_string(),
            }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some(format!("🤖 {} 実行完了", agent_name)),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report GitHub issue event
    pub async fn report_github_issue(
        &self,
        action: &str,
        issue_number: u32,
        issue_title: &str,
        issue_url: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let (color, emoji) = match action {
            "opened" => (0x27AE60, "🆕"),
            "closed" => (0x95A5A6, "✅"),
            "reopened" => (0xF39C12, "🔄"),
            _ => (0x3498DB, "📝"),
        };

        let embed = Embed {
            author: None,
            color: Some(color),
            description: Some(format!(
                "{} **Issue {}**\n\n\
                 **#{}**: {}\n\n\
                 [GitHubで見る]({})",
                emoji, action, issue_number, issue_title, issue_url
            )),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "GitHub Integration".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("📋 GitHub Issue Update".to_string()),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report GitHub PR event
    pub async fn report_github_pr(
        &self,
        action: &str,
        pr_number: u32,
        pr_title: &str,
        pr_url: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let (color, emoji) = match action {
            "opened" => (0x9B59B6, "🔗"),
            "closed" => (0x95A5A6, "✅"),
            "merged" => (0x27AE60, "🎉"),
            _ => (0x3498DB, "📝"),
        };

        let embed = Embed {
            author: None,
            color: Some(color),
            description: Some(format!(
                "{} **Pull Request {}**\n\n\
                 **#{}**: {}\n\n\
                 [GitHubで見る]({})",
                emoji, action, pr_number, pr_title, pr_url
            )),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "GitHub Integration".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("🔀 GitHub PR Update".to_string()),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }

    /// Report error
    pub async fn report_error(&self, context: &str, error_message: &str) -> Result<(), Box<dyn std::error::Error>> {
        let embed = Embed {
            author: None,
            color: Some(0xE74C3C), // Red
            description: Some(format!(
                "⚠️ **エラーが発生しました**\n\n\
                 **Context**: {}\n\
                 **Error**: {}\n\n\
                 調査中です...",
                context, error_message
            )),
            fields: vec![],
            footer: Some(EmbedFooter { icon_url: None, proxy_icon_url: None, text: "Error Report".to_string() }),
            image: None,
            kind: "rich".to_string(),
            provider: None,
            thumbnail: None,
            timestamp: None,
            title: Some("❌ Error".to_string()),
            url: None,
            video: None,
        };

        self.http
            .create_message(self.progress_channel_id)
            .embeds(&[embed])
            .await?;

        Ok(())
    }
}
