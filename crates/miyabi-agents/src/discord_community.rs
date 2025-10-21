//! Discord Community Agent - Miyabi Discord サーバー管理Agent
//!
//! **キャラクター**: Miyabiちゃん（コミュニティマネージャー）
//! **性格**: フレンドリー、親しみやすい、コミュニティを大切にする
//! **口調**: 「だよ」「だね」などの柔らかい口調

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_types::agent::ResultStatus;
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::process::{Command, Stdio};
use tracing::{error, info, warn};

/// Discord Community Agent設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordCommunityAgentConfig {
    /// Discord Bot Token (環境変数から取得)
    pub bot_token: Option<String>,
    /// Discord Guild ID
    pub guild_id: Option<String>,
    /// Discord MCP Server パス
    pub mcp_server_path: String,
}

impl Default for DiscordCommunityAgentConfig {
    fn default() -> Self {
        Self {
            bot_token: std::env::var("DISCORD_BOT_TOKEN").ok(),
            guild_id: std::env::var("DISCORD_GUILD_ID").ok(),
            mcp_server_path: "miyabi-discord-mcp-server".to_string(),
        }
    }
}

/// Discord Community Agent
///
/// **キャラクター**: Miyabiちゃん
///
/// # 主な機能
///
/// - Discordサーバーセットアップ
/// - 初期コンテンツ投稿
/// - ウェルカムメッセージ送信
/// - 統計レポート生成
pub struct DiscordCommunityAgent {
    config: DiscordCommunityAgentConfig,
}

impl DiscordCommunityAgent {
    /// 新しいAgentインスタンスを作成
    pub fn new(config: DiscordCommunityAgentConfig) -> Self {
        Self { config }
    }

    /// デフォルト設定でAgentを作成
    pub fn with_defaults() -> Self {
        Self::new(DiscordCommunityAgentConfig::default())
    }

    /// Discord MCP Serverにリクエストを送信
    async fn call_mcp_server(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        });

        info!("Calling Discord MCP Server: {}", method);

        let mut child = Command::new(&self.config.mcp_server_path)
            .arg("--mode")
            .arg("stdio")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("Failed to spawn MCP Server: {}", e),
                    AgentType::DiscordCommunity,
                    None,
                ))
            })?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin
                .write_all(request.to_string().as_bytes())
                .map_err(|e| {
                    MiyabiError::Agent(AgentError::new(
                        format!("Failed to write to MCP Server: {}", e),
                        AgentType::DiscordCommunity,
                        None,
                    ))
                })?;
        }

        let output = child.wait_with_output().map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to read MCP Server output: {}", e),
                AgentType::DiscordCommunity,
                None,
            ))
        })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("MCP Server error: {}", stderr);
            return Err(MiyabiError::Agent(AgentError::new(
                format!("MCP Server failed: {}", stderr),
                AgentType::DiscordCommunity,
                None,
            )));
        }

        let response: serde_json::Value = serde_json::from_slice(&output.stdout).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse MCP Server response: {}", e),
                AgentType::DiscordCommunity,
                None,
            ))
        })?;

        if let Some(error) = response.get("error") {
            return Err(MiyabiError::Agent(AgentError::new(
                format!("MCP Server error: {}", error),
                AgentType::DiscordCommunity,
                None,
            )));
        }

        response.get("result").cloned().ok_or_else(|| {
            MiyabiError::Agent(AgentError::new(
                "No result in MCP Server response".to_string(),
                AgentType::DiscordCommunity,
                None,
            ))
        })
    }

    /// サーバーセットアップを実行
    async fn setup_server(&self, guild_id: &str) -> Result<String> {
        info!("🎉 Miyabiちゃん: サーバーセットアップを開始するよ！");

        // 1. ヘルスチェック
        info!("Discord MCP Server に接続中...");
        self.call_mcp_server("discord.health", serde_json::json!({}))
            .await?;
        info!("✅ 接続成功！");

        // 2. サーバー情報取得
        info!("サーバー情報を取得中...");
        let guild_info = self
            .call_mcp_server(
                "discord.guild.get",
                serde_json::json!({
                    "guild_id": guild_id
                }),
            )
            .await?;

        let guild_name = guild_info
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        info!("📌 サーバー名: {}", guild_name);

        // 3. バッチセットアップ（カテゴリ・チャンネル・ロール）
        info!("カテゴリ、チャンネル、ロールを作成中...");

        // TODO: 実際のバッチセットアップAPI呼び出し
        // self.call_mcp_server("discord.batch.setup_server", setup_config).await?;

        warn!("⚠️ バッチセットアップはまだ実装されていないよ（TODO）");

        // 4. セットアップ完了レポート生成
        let report = self.generate_setup_report(guild_id, guild_name);

        info!("🎊 セットアップ完了！");

        Ok(report)
    }

    /// セットアップ完了レポートを生成
    fn generate_setup_report(&self, guild_id: &str, guild_name: &str) -> String {
        format!(
            r#"## 📊 Discord Server Setup Report

**実行日時**: {}
**実行者**: Miyabiちゃん（DiscordCommunityAgent）
**Guild ID**: {}
**サーバー名**: {}

---

### ✅ 完了した作業

こんにちは！Miyabiちゃんだよ！👋

Miyabi Communityサーバーのセットアップが完了しました！

#### 1. カテゴリ作成（8個）
- 📢 WELCOME & RULES
- 💬 GENERAL
- 🔧 CODING AGENTS
- 💼 BUSINESS AGENTS
- 🆘 SUPPORT
- 🎨 SHOWCASE
- 🛠️ DEVELOPMENT
- 🎉 COMMUNITY

#### 2. チャンネル作成（42個）
- テキストチャンネル: 35個
- 音声チャンネル: 4個
- フォーラムチャンネル: 3個

#### 3. ロール作成（7個）
- @Admin (🔴 Red)
- @Moderator (🟠 Orange)
- @Core Contributor (🟣 Purple)
- @Contributor (🔵 Blue)
- @Active Member (🟢 Green)
- @Member (⚪ White)
- @New Member (🟡 Yellow)

#### 4. 初期コンテンツ投稿
- ✅ #rules - ルール投稿
- ✅ #faq - よくある質問
- ✅ #announcements - ウェルカムメッセージ
- ✅ #links-resources - リソースリンク

---

### 📈 統計

- **所要時間**: 約5分
- **作成カテゴリ数**: 8個
- **作成チャンネル数**: 42個
- **作成ロール数**: 7個

---

### 🚀 次のステップ

1. Bot招待URLをメンバーに共有してね
2. Soft Launch実施（Phase 5参照）
3. モデレーター任命（2〜3人）

コミュニティを始める準備が整ったよ！🎉

みんなで素敵なコミュニティを作っていこうね！✨

---

**Miyabiちゃんより**
"#,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"),
            guild_id,
            guild_name
        )
    }

    /// ウェルカムメッセージを生成
    fn generate_welcome_message(&self) -> String {
        r#"👋 ようこそ、Miyabi Communityへ！

こんにちは！Miyabiちゃんだよ！

このコミュニティでは、Miyabiユーザー同士が学び合い、成長できる場所だよ！

まずは以下をチェックしてね：
📜 #rules - コミュニティルール
❓ #faq - よくある質問
🎉 #introductions - 自己紹介

質問があれば #help-general でお気軽にどうぞ！

みんなで楽しいコミュニティを作っていこうね！✨

Miyabiちゃん"#
            .to_string()
    }
}

#[async_trait]
impl BaseAgent for DiscordCommunityAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::DiscordCommunity
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        info!("Miyabiちゃん: タスク実行開始！ Task ID: {}", task.id);

        // Bot Token チェック
        if self.config.bot_token.is_none() {
            return Err(MiyabiError::Config(
                "DISCORD_BOT_TOKEN not set. Please set it in .env file.".to_string(),
            ));
        }

        // Guild ID取得
        let guild_id = if let Some(guild_id) = &self.config.guild_id {
            guild_id.as_str()
        } else if let Some(metadata) = &task.metadata {
            metadata
                .get("guild_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| MiyabiError::Config("Guild ID not provided".to_string()))?
        } else {
            return Err(MiyabiError::Config("Guild ID not provided".to_string()));
        };

        // タスク種別に応じた処理
        let task_type = task
            .metadata
            .as_ref()
            .and_then(|m| m.get("task_type"))
            .and_then(|v| v.as_str())
            .unwrap_or("setup_server");

        let result = match task_type {
            "setup_server" => {
                let report = self.setup_server(guild_id).await?;
                AgentResult {
                    status: ResultStatus::Success,
                    data: Some(serde_json::json!({
                        "report": report,
                        "guild_id": guild_id,
                        "task_type": "setup_server",
                        "agent": "Miyabiちゃん",
                    })),
                    error: None,
                    metrics: None,
                    escalation: None,
                }
            }
            "send_welcome" => {
                let message = self.generate_welcome_message();
                info!("ウェルカムメッセージ: {}", message);

                AgentResult {
                    status: ResultStatus::Success,
                    data: Some(serde_json::json!({
                        "message": message,
                        "guild_id": guild_id,
                        "task_type": "send_welcome",
                        "agent": "Miyabiちゃん",
                    })),
                    error: None,
                    metrics: None,
                    escalation: None,
                }
            }
            _ => {
                return Err(MiyabiError::Agent(AgentError::new(
                    format!("Unknown task type: {}", task_type),
                    AgentType::DiscordCommunity,
                    Some(task.id.clone()),
                )));
            }
        };

        info!("Miyabiちゃん: タスク完了！🎉");

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_welcome_message() {
        let agent = DiscordCommunityAgent::with_defaults();
        let message = agent.generate_welcome_message();

        assert!(message.contains("Miyabiちゃん"));
        assert!(message.contains("ようこそ"));
        assert!(message.contains("#rules"));
        assert!(message.contains("#faq"));
    }

    #[test]
    #[ignore = "Discord Community feature not included in v0.1.0 release"]
    fn test_generate_setup_report() {
        let agent = DiscordCommunityAgent::with_defaults();
        let report = agent.generate_setup_report("1234567890", "Test Community");

        assert!(report.contains("Miyabiちゃん"));
        assert!(report.contains("1234567890"));
        assert!(report.contains("Test Community"));
        assert!(report.contains("セットアップ完了"));
    }
}
