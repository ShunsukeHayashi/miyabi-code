//! RPC module for A2A Protocol
//!
//! This module provides RPC handlers and configuration for agent-to-agent communication.

// Push notification modules (Issue #274, #276, #277)
pub mod push_notification;
pub mod ssrf;
pub mod push_notification_config;

// RPC handlers for gRPC integration (Phase 3)
pub mod handlers;

// Re-export push notification config types
pub use push_notification_config::{ConfigStorage, MemoryConfigStorage, PushNotificationConfig};

// Re-export push notification delivery types
pub use push_notification::{
    generate_webhook_signature, send_push_notification, PushNotificationPayload, WebhookConfig,
};

// Re-export RPC handlers
pub use handlers::{
    A2ARpcHandler, AgentCardRpcHandler, GetAuthenticatedExtendedCardParams, GetAuthenticatedExtendedCardResponse,
    MessageSendParams, MessageSendResponse, TaskStorage, TasksCancelParams, TasksCancelResponse, TasksGetParams,
    TasksGetResponse, TasksListParams, TasksListResponse,
};
