//! RPC module for A2A Protocol
//!
//! This module provides RPC handlers and configuration for agent-to-agent communication.

// Push notification modules (Issue #274, #276, #277)
pub mod push_notification_config;
pub mod push_notification;

// Re-export push notification config types
pub use push_notification_config::{
    ConfigStorage, MemoryConfigStorage, PushNotificationConfig,
};

// Re-export push notification delivery types
pub use push_notification::{
    generate_webhook_signature, send_push_notification,
    PushNotificationPayload, WebhookConfig,
};

// Note: handlers.rs is a work in progress and not yet exported
// It depends on types that need to be properly defined or imported from miyabi-types
