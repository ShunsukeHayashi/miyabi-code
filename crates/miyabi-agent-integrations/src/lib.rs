//! Miyabi Integration Agents
//!
//! External service integrations: Discord, Potpie, and state synchronization.
//!
//! # Components
//!
//! - **DiscordCommunityAgent**: Discord server automation
//! - **PotpieIntegration**: Potpie AI knowledge graph integration
//! - **RefresherAgent**: State synchronization and refresh
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_integrations::{DiscordCommunityAgent, RefresherAgent};
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//!
//! // Discord integration
//! let discord = DiscordCommunityAgent::new(config.clone());
//! let task = Task::default(); // Your task here
//! let result = discord.execute(&task).await?;
//!
//! println!("Discord action: {}", result.data);
//! # Ok(())
//! # }
//! ```

pub mod discord_community;
pub mod potpie_integration;
pub mod refresher;

pub use discord_community::DiscordCommunityAgent;
pub use potpie_integration::PotpieIntegration;
pub use refresher::RefresherAgent;
