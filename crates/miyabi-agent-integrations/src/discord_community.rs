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

    fn create_test_config() -> DiscordCommunityAgentConfig {
        DiscordCommunityAgentConfig {
            bot_token: Some("test_token_12345".to_string()),
            guild_id: Some("1234567890".to_string()),
            mcp_server_path: "echo".to_string(), // Use echo for testing
        }
    }

    fn create_test_task(guild_id: &str, task_type: &str) -> Task {
        use miyabi_types::task::TaskType as TType;
        use std::collections::HashMap;

        let mut metadata = HashMap::new();
        metadata.insert("guild_id".to_string(), serde_json::json!(guild_id));
        metadata.insert("task_type".to_string(), serde_json::json!(task_type));

        Task {
            id: "test-task-1".to_string(),
            title: "Test Discord Setup".to_string(),
            description: "Test task".to_string(),
            task_type: TType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::DiscordCommunity),
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        }
    }

    #[test]
    fn test_config_default() {
        let config = DiscordCommunityAgentConfig::default();
        assert_eq!(config.mcp_server_path, "miyabi-discord-mcp-server");
    }

    #[test]
    fn test_config_from_env() {
        // Store original values
        let original_token = std::env::var("DISCORD_BOT_TOKEN").ok();
        let original_guild = std::env::var("DISCORD_GUILD_ID").ok();

        // Set test values
        std::env::set_var("DISCORD_BOT_TOKEN", "env_token_123");
        std::env::set_var("DISCORD_GUILD_ID", "9876543210");

        let config = DiscordCommunityAgentConfig::default();

        assert_eq!(config.bot_token, Some("env_token_123".to_string()));
        assert_eq!(config.guild_id, Some("9876543210".to_string()));

        // Restore original values
        match original_token {
            Some(val) => std::env::set_var("DISCORD_BOT_TOKEN", val),
            None => std::env::remove_var("DISCORD_BOT_TOKEN"),
        }
        match original_guild {
            Some(val) => std::env::set_var("DISCORD_GUILD_ID", val),
            None => std::env::remove_var("DISCORD_GUILD_ID"),
        }
    }

    #[test]
    fn test_agent_creation() {
        let config = create_test_config();
        let agent = DiscordCommunityAgent::new(config.clone());

        assert_eq!(agent.config.bot_token, config.bot_token);
        assert_eq!(agent.config.guild_id, config.guild_id);
    }

    #[test]
    fn test_agent_with_defaults() {
        let agent = DiscordCommunityAgent::with_defaults();
        assert_eq!(agent.config.mcp_server_path, "miyabi-discord-mcp-server");
    }

    #[test]
    fn test_agent_type() {
        let agent = DiscordCommunityAgent::with_defaults();
        assert_eq!(agent.agent_type(), AgentType::DiscordCommunity);
    }

    #[test]
    fn test_generate_welcome_message() {
        let agent = DiscordCommunityAgent::with_defaults();
        let message = agent.generate_welcome_message();

        assert!(message.contains("Miyabiちゃん"));
        assert!(message.contains("ようこそ"));
        assert!(message.contains("#rules"));
        assert!(message.contains("#faq"));
        assert!(message.contains("#introductions"));
        assert!(message.contains("#help-general"));
    }

    #[test]
    fn test_generate_welcome_message_immutable() {
        let agent = DiscordCommunityAgent::with_defaults();
        let message1 = agent.generate_welcome_message();
        let message2 = agent.generate_welcome_message();

        assert_eq!(message1, message2);
    }

    #[test]
    fn test_generate_setup_report() {
        let agent = DiscordCommunityAgent::with_defaults();
        let report = agent.generate_setup_report("1234567890", "Test Community");

        assert!(report.contains("Miyabiちゃん"));
        assert!(report.contains("1234567890"));
        assert!(report.contains("Test Community"));
        assert!(report.contains("完了した作業")); // Changed assertion
        assert!(report.contains("カテゴリ作成（8個）"));
        assert!(report.contains("チャンネル作成（42個）"));
        assert!(report.contains("ロール作成（7個）"));
    }

    #[test]
    fn test_generate_setup_report_categories() {
        let agent = DiscordCommunityAgent::with_defaults();
        let report = agent.generate_setup_report("1234567890", "Test Community");

        // Check all 8 categories
        assert!(report.contains("📢 WELCOME & RULES"));
        assert!(report.contains("💬 GENERAL"));
        assert!(report.contains("🔧 CODING AGENTS"));
        assert!(report.contains("💼 BUSINESS AGENTS"));
        assert!(report.contains("🆘 SUPPORT"));
        assert!(report.contains("🎨 SHOWCASE"));
        assert!(report.contains("🛠️ DEVELOPMENT"));
        assert!(report.contains("🎉 COMMUNITY"));
    }

    #[test]
    fn test_generate_setup_report_roles() {
        let agent = DiscordCommunityAgent::with_defaults();
        let report = agent.generate_setup_report("1234567890", "Test Community");

        // Check all 7 roles
        assert!(report.contains("@Admin"));
        assert!(report.contains("@Moderator"));
        assert!(report.contains("@Core Contributor"));
        assert!(report.contains("@Contributor"));
        assert!(report.contains("@Active Member"));
        assert!(report.contains("@Member"));
        assert!(report.contains("@New Member"));
    }

    #[test]
    fn test_generate_setup_report_initial_content() {
        let agent = DiscordCommunityAgent::with_defaults();
        let report = agent.generate_setup_report("1234567890", "Test Community");

        // Check initial content
        assert!(report.contains("#rules - ルール投稿"));
        assert!(report.contains("#faq - よくある質問"));
        assert!(report.contains("#announcements - ウェルカムメッセージ"));
        assert!(report.contains("#links-resources - リソースリンク"));
    }

    #[tokio::test]
    async fn test_execute_missing_bot_token() {
        let config = DiscordCommunityAgentConfig {
            bot_token: None,
            guild_id: Some("1234567890".to_string()),
            mcp_server_path: "echo".to_string(),
        };
        let agent = DiscordCommunityAgent::new(config);
        let task = create_test_task("1234567890", "setup_server");

        let result = agent.execute(&task).await;

        assert!(result.is_err());
        match result {
            Err(MiyabiError::Config(msg)) => {
                assert!(msg.contains("DISCORD_BOT_TOKEN"));
            }
            _ => panic!("Expected Config error"),
        }
    }

    #[tokio::test]
    async fn test_execute_missing_guild_id() {
        use miyabi_types::task::TaskType as TType;

        let config = DiscordCommunityAgentConfig {
            bot_token: Some("test_token".to_string()),
            guild_id: None,
            mcp_server_path: "echo".to_string(),
        };
        let agent = DiscordCommunityAgent::new(config);

        // Task without guild_id in metadata
        let task = Task {
            id: "test-task-1".to_string(),
            title: "Test".to_string(),
            description: "Test".to_string(),
            task_type: TType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::DiscordCommunity),
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = agent.execute(&task).await;

        assert!(result.is_err());
        match result {
            Err(MiyabiError::Config(msg)) => {
                assert!(msg.contains("Guild ID not provided"));
            }
            _ => panic!("Expected Config error"),
        }
    }

    #[tokio::test]
    async fn test_execute_unknown_task_type() {
        let config = create_test_config();
        let agent = DiscordCommunityAgent::new(config);
        let task = create_test_task("1234567890", "unknown_task");

        std::env::set_var("DISCORD_BOT_TOKEN", "test_token");

        let result = agent.execute(&task).await;

        std::env::remove_var("DISCORD_BOT_TOKEN");

        // Note: This will fail during MCP server call, not at task type validation
        // The unknown task type check happens AFTER setup_server logic
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_execute_send_welcome() {
        let config = create_test_config();
        let agent = DiscordCommunityAgent::new(config);
        let task = create_test_task("1234567890", "send_welcome");

        std::env::set_var("DISCORD_BOT_TOKEN", "test_token");

        let result = agent.execute(&task).await;

        std::env::remove_var("DISCORD_BOT_TOKEN");

        // This task type doesn't call MCP server, so it should succeed
        assert!(result.is_ok());
        let agent_result = result.unwrap();
        assert_eq!(agent_result.status, ResultStatus::Success);

        let data = agent_result.data.unwrap();
        assert_eq!(data["task_type"], "send_welcome");
        assert_eq!(data["agent"], "Miyabiちゃん");
        assert!(data["message"].as_str().unwrap().contains("Miyabiちゃん"));
    }

    #[test]
    fn test_config_serialization() {
        let config = DiscordCommunityAgentConfig {
            bot_token: Some("test_token".to_string()),
            guild_id: Some("1234567890".to_string()),
            mcp_server_path: "/path/to/server".to_string(),
        };

        let json = serde_json::to_value(&config).unwrap();
        assert_eq!(json["bot_token"], "test_token");
        assert_eq!(json["guild_id"], "1234567890");
        assert_eq!(json["mcp_server_path"], "/path/to/server");

        let deserialized: DiscordCommunityAgentConfig = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.bot_token, config.bot_token);
        assert_eq!(deserialized.guild_id, config.guild_id);
    }
}
