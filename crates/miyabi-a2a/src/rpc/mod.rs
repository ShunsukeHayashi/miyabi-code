//! RPC module for A2A Protocol
//!
//! This module provides RPC handlers and configuration for agent-to-agent communication.

// Push notification modules (Issue #274, #276)
pub mod push_notification_config;

// Re-export push notification config types
pub use push_notification_config::{
    ConfigStorage, MemoryConfigStorage, PushNotificationConfig,
};

// Note: handlers.rs and push_notification.rs are works in progress and not yet exported
// They depend on types that need to be properly defined or imported from miyabi-types
