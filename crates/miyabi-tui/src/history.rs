//! Chat history persistence
//!
//! Saves and loads chat conversations to/from disk

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tracing::{debug, info};

use crate::app::{Message, MessageRole};

/// Chat session with messages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    /// Session ID (UUID)
    pub id: String,
    /// Session start timestamp (ISO 8601)
    pub timestamp: String,
    /// Messages in this session
    pub messages: Vec<SerializableMessage>,
}

/// Serializable message format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableMessage {
    pub role: String,
    pub content: String,
    pub timestamp: String,
}

impl From<&Message> for SerializableMessage {
    fn from(msg: &Message) -> Self {
        SerializableMessage {
            role: match msg.role {
                MessageRole::System => "System".to_string(),
                MessageRole::User => "User".to_string(),
                MessageRole::Assistant => "Assistant".to_string(),
                MessageRole::ToolCall => "ToolCall".to_string(),
                MessageRole::ToolResult => "ToolResult".to_string(),
            },
            content: msg.content.clone(),
            timestamp: msg
                .timestamp
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs().to_string())
                .unwrap_or_else(|_| "0".to_string()),
        }
    }
}

impl SerializableMessage {
    pub fn to_message(&self) -> Message {
        let role = match self.role.as_str() {
            "System" => MessageRole::System,
            "User" => MessageRole::User,
            "Assistant" => MessageRole::Assistant,
            "ToolCall" => MessageRole::ToolCall,
            "ToolResult" => MessageRole::ToolResult,
            _ => MessageRole::System,
        };

        let timestamp = self
            .timestamp
            .parse::<u64>()
            .ok()
            .map(|secs| std::time::UNIX_EPOCH + std::time::Duration::from_secs(secs))
            .unwrap_or_else(std::time::SystemTime::now);

        Message {
            role,
            content: self.content.clone(),
            timestamp,
        }
    }
}

/// Chat history storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatHistory {
    /// Version of the history format
    pub version: String,
    /// All chat sessions
    pub sessions: Vec<ChatSession>,
}

impl Default for ChatHistory {
    fn default() -> Self {
        ChatHistory {
            version: "1.0".to_string(),
            sessions: Vec::new(),
        }
    }
}

impl ChatHistory {
    /// Load history from file
    pub fn load(path: &Path) -> Result<Self> {
        if !path.exists() {
            debug!("History file does not exist: {:?}", path);
            return Ok(ChatHistory::default());
        }

        let contents = fs::read_to_string(path)
            .with_context(|| format!("Failed to read history file: {:?}", path))?;

        let history: ChatHistory = serde_json::from_str(&contents)
            .with_context(|| format!("Failed to parse history file: {:?}", path))?;

        info!("Loaded {} sessions from history", history.sessions.len());
        Ok(history)
    }

    /// Save history to file
    pub fn save(&self, path: &Path) -> Result<()> {
        // Create parent directory if it doesn't exist
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory: {:?}", parent))?;
        }

        let json = serde_json::to_string_pretty(self)
            .context("Failed to serialize history to JSON")?;

        fs::write(path, json)
            .with_context(|| format!("Failed to write history file: {:?}", path))?;

        debug!("Saved {} sessions to history", self.sessions.len());
        Ok(())
    }

    /// Add a new session
    pub fn add_session(&mut self, session: ChatSession) {
        self.sessions.push(session);
    }

    /// Get the most recent session
    pub fn latest_session(&self) -> Option<&ChatSession> {
        self.sessions.last()
    }

    /// Get all sessions
    pub fn all_sessions(&self) -> &[ChatSession] {
        &self.sessions
    }
}

/// Get default history file path
pub fn default_history_path() -> Result<PathBuf> {
    let home = dirs::home_dir().context("Failed to get home directory")?;
    Ok(home.join(".config/miyabi/chat_history.json"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serializable_message_conversion() {
        let msg = Message {
            role: MessageRole::User,
            content: "Hello".to_string(),
            timestamp: std::time::SystemTime::now(),
        };

        let serializable = SerializableMessage::from(&msg);
        assert_eq!(serializable.role, "User");
        assert_eq!(serializable.content, "Hello");

        let restored = serializable.to_message();
        assert_eq!(restored.content, "Hello");
    }

    #[test]
    fn test_chat_history_default() {
        let history = ChatHistory::default();
        assert_eq!(history.version, "1.0");
        assert_eq!(history.sessions.len(), 0);
    }
}
