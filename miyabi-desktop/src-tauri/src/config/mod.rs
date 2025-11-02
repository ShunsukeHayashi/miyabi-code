//! Configuration module
//!
//! Handles loading and parsing of configuration files.

pub mod agents;
pub mod app;

pub use agents::{AgentConfig, AgentsConfig};
pub use app::{
    clear_config, get_github_repository, get_github_token, save_github_repository,
    save_github_token, AppConfig,
};
