//! CLI command implementations

pub mod agent;
// TODO: Fix API compatibility issues with AgentConfigManager
// pub mod agent_config;
// pub mod agent_manage;
pub mod cleanup;
pub mod infinity;
pub mod init;
pub mod install;
pub mod knowledge;
pub mod r#loop;
pub mod mode;
pub mod parallel;
pub mod setup;
pub mod status;
pub mod worktree;

pub use agent::AgentCommand;
pub use cleanup::CleanupCommand;
pub use infinity::InfinityCommand;
pub use init::InitCommand;
pub use install::InstallCommand;
pub use knowledge::KnowledgeCommand;
pub use mode::ModeCommand;
pub use parallel::ParallelCommand;
pub use r#loop::LoopCommand;
pub use setup::SetupCommand;
pub use status::StatusCommand;
pub use worktree::{WorktreeCommand, WorktreeSubcommand};
