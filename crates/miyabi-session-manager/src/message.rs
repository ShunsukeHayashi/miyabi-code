//! Message types for session communication

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Message priority levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, Default)]
pub enum Priority {
    /// Low priority - background tasks
    Low = 0,

    /// Normal priority - standard messages
    #[default]
    Normal = 1,

    /// High priority - important updates
    High = 2,

    /// Urgent priority - critical messages (e.g., error notifications)
    Urgent = 3,
}

/// Message type classification
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageType {
    /// Agent execution command
    Command(CommandMessage),

    /// Agent execution result
    Result(ResultMessage),

    /// Status update notification
    StatusUpdate(StatusUpdateMessage),

    /// Error notification
    Error(ErrorMessage),

    /// Log entry
    Log(LogMessage),

    /// Custom user-defined message
    Custom(CustomMessage),
}

/// Command message - instructs agent to perform an action
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CommandMessage {
    /// Command name (e.g., "run_tests", "generate_code")
    pub command: String,

    /// Command arguments
    pub args: Vec<String>,

    /// Additional metadata
    pub metadata: Option<String>,
}

/// Result message - contains execution result
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ResultMessage {
    /// Execution success status
    pub success: bool,

    /// Result data (JSON)
    pub data: String,

    /// Execution duration in milliseconds
    pub duration_ms: u64,
}

/// Status update message
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StatusUpdateMessage {
    /// Old status
    pub from: String,

    /// New status
    pub to: String,

    /// Reason for status change
    pub reason: Option<String>,
}

/// Error notification message
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ErrorMessage {
    /// Error code
    pub code: String,

    /// Error description
    pub message: String,

    /// Stack trace (if available)
    pub stacktrace: Option<String>,
}

/// Log entry message
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LogMessage {
    /// Log level (trace, debug, info, warn, error)
    pub level: String,

    /// Log message content
    pub content: String,

    /// Source component
    pub source: Option<String>,
}

/// Custom user-defined message
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CustomMessage {
    /// Custom message type identifier
    pub type_id: String,

    /// Arbitrary JSON payload
    pub payload: String,
}

/// A message in the queue
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Message {
    /// Unique message ID
    pub id: Uuid,

    /// Target session ID
    pub session_id: Uuid,

    /// Message priority
    pub priority: Priority,

    /// Message type and content
    pub message_type: MessageType,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Expiration timestamp (optional)
    pub expires_at: Option<DateTime<Utc>>,

    /// Number of delivery attempts
    pub delivery_attempts: u32,

    /// Maximum delivery attempts before giving up
    pub max_attempts: u32,
}

impl Message {
    /// Create a new message
    pub fn new(session_id: Uuid, priority: Priority, message_type: MessageType) -> Self {
        Self {
            id: Uuid::new_v4(),
            session_id,
            priority,
            message_type,
            created_at: Utc::now(),
            expires_at: None,
            delivery_attempts: 0,
            max_attempts: 3,
        }
    }

    /// Create a new message with expiration
    pub fn with_expiration(
        session_id: Uuid,
        priority: Priority,
        message_type: MessageType,
        expires_in_seconds: i64,
    ) -> Self {
        let mut msg = Self::new(session_id, priority, message_type);
        msg.expires_at = Some(Utc::now() + chrono::Duration::seconds(expires_in_seconds));
        msg
    }

    /// Check if message has expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() > expires_at
        } else {
            false
        }
    }

    /// Check if message has exceeded max delivery attempts
    pub fn is_exhausted(&self) -> bool {
        self.delivery_attempts >= self.max_attempts
    }

    /// Increment delivery attempt counter
    pub fn increment_attempts(&mut self) {
        self.delivery_attempts += 1;
    }

    /// Get message type as string (for filtering)
    pub fn type_name(&self) -> &str {
        match &self.message_type {
            MessageType::Command(_) => "command",
            MessageType::Result(_) => "result",
            MessageType::StatusUpdate(_) => "status_update",
            MessageType::Error(_) => "error",
            MessageType::Log(_) => "log",
            MessageType::Custom(custom) => &custom.type_id,
        }
    }
}

/// Builder for creating messages fluently
pub struct MessageBuilder {
    session_id: Uuid,
    priority: Priority,
    message_type: Option<MessageType>,
    expires_at: Option<DateTime<Utc>>,
    max_attempts: u32,
}

impl MessageBuilder {
    /// Create a new message builder
    pub fn new(session_id: Uuid) -> Self {
        Self { session_id, priority: Priority::Normal, message_type: None, expires_at: None, max_attempts: 3 }
    }

    /// Set message priority
    pub fn priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }

    /// Set message type
    pub fn message_type(mut self, message_type: MessageType) -> Self {
        self.message_type = Some(message_type);
        self
    }

    /// Set command message
    pub fn command(self, command: String, args: Vec<String>) -> Self {
        self.message_type(MessageType::Command(CommandMessage { command, args, metadata: None }))
    }

    /// Set result message
    pub fn result(self, success: bool, data: String, duration_ms: u64) -> Self {
        self.message_type(MessageType::Result(ResultMessage { success, data, duration_ms }))
    }

    /// Set error message
    pub fn error(self, code: String, message: String) -> Self {
        self.message_type(MessageType::Error(ErrorMessage { code, message, stacktrace: None }))
    }

    /// Set expiration time in seconds
    pub fn expires_in(mut self, seconds: i64) -> Self {
        self.expires_at = Some(Utc::now() + chrono::Duration::seconds(seconds));
        self
    }

    /// Set maximum delivery attempts
    pub fn max_attempts(mut self, max_attempts: u32) -> Self {
        self.max_attempts = max_attempts;
        self
    }

    /// Build the message
    pub fn build(self) -> Result<Message, &'static str> {
        let message_type = self.message_type.ok_or("message_type is required")?;

        Ok(Message {
            id: Uuid::new_v4(),
            session_id: self.session_id,
            priority: self.priority,
            message_type,
            created_at: Utc::now(),
            expires_at: self.expires_at,
            delivery_attempts: 0,
            max_attempts: self.max_attempts,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_priority_ordering() {
        assert!(Priority::Urgent > Priority::High);
        assert!(Priority::High > Priority::Normal);
        assert!(Priority::Normal > Priority::Low);
    }

    #[test]
    fn test_message_creation() {
        let session_id = Uuid::new_v4();
        let msg = Message::new(
            session_id,
            Priority::High,
            MessageType::Command(CommandMessage { command: "test".to_string(), args: vec![], metadata: None }),
        );

        assert_eq!(msg.session_id, session_id);
        assert_eq!(msg.priority, Priority::High);
        assert!(!msg.is_expired());
        assert!(!msg.is_exhausted());
    }

    #[test]
    fn test_message_expiration() {
        let session_id = Uuid::new_v4();
        let msg = Message::with_expiration(
            session_id,
            Priority::Normal,
            MessageType::Log(LogMessage { level: "info".to_string(), content: "test".to_string(), source: None }),
            -1, // expired 1 second ago
        );

        assert!(msg.is_expired());
    }

    #[test]
    fn test_message_exhaustion() {
        let session_id = Uuid::new_v4();
        let mut msg = Message::new(
            session_id,
            Priority::Normal,
            MessageType::Log(LogMessage { level: "info".to_string(), content: "test".to_string(), source: None }),
        );

        msg.max_attempts = 2;
        assert!(!msg.is_exhausted());

        msg.increment_attempts();
        assert!(!msg.is_exhausted());

        msg.increment_attempts();
        assert!(msg.is_exhausted());
    }

    #[test]
    fn test_message_builder() {
        let session_id = Uuid::new_v4();
        let msg = MessageBuilder::new(session_id)
            .priority(Priority::Urgent)
            .command("run_tests".to_string(), vec!["--all".to_string()])
            .expires_in(300)
            .max_attempts(5)
            .build()
            .unwrap();

        assert_eq!(msg.priority, Priority::Urgent);
        assert_eq!(msg.max_attempts, 5);
        assert!(msg.expires_at.is_some());
        assert_eq!(msg.type_name(), "command");
    }
}
