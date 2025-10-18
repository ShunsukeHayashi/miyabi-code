//! Miyabi Discord MCP Server
//!
//! Discord API を JSON-RPC 2.0 インターフェースでラップし、
//! Miyabiから簡単にDiscordサーバーを操作できるようにします。
//!
//! # 主要機能
//!
//! - サーバー管理（情報取得）
//! - チャンネル管理（カテゴリ、テキスト、音声、フォーラム）
//! - ロール管理（作成、割り当て）
//! - メッセージ管理（送信、Embed、ピン留め）
//! - モデレーション（キック、BAN、タイムアウト）
//!
//! # 使用例
//!
//! ```no_run
//! use miyabi_discord_mcp_server::discord::DiscordClient;
//! use miyabi_discord_mcp_server::models::GetGuildRequest;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = DiscordClient::new("YOUR_BOT_TOKEN".to_string());
//!
//!     let guild_info = client.get_guild(GetGuildRequest {
//!         guild_id: "1234567890".to_string(),
//!     }).await?;
//!
//!     println!("Guild: {}", guild_info.name);
//!     Ok(())
//! }
//! ```

pub mod discord;
pub mod error;
pub mod feedback;
pub mod models;
pub mod progress_reporter;
pub mod rpc;

pub use discord::DiscordClient;
pub use error::{DiscordMcpError, Result};
pub use feedback::{FeedbackEntry, FeedbackReactions, FeedbackType};
pub use progress_reporter::ProgressReporter;
