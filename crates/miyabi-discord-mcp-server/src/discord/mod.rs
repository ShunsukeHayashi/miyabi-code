/// Channel operations (create, update, delete)
pub mod channel;
/// Discord client implementation
pub mod client;
/// Guild/server operations
pub mod guild;
/// Message operations (send, edit, delete, pin)
pub mod message;
/// Role management operations
pub mod role;

pub use client::DiscordClient;
