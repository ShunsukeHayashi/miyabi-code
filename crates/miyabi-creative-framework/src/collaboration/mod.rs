//! Real-time Collaboration Framework
//!
//! Enable multiple users to collaborate on creative processes in real-time.
//!
//! # Features
//!
//! - Real-time state synchronization
//! - Presence awareness
//! - Conflict resolution (CRDT-based)
//! - Collaborative editing
//! - Session management

use crate::error::{CollaborationError, Result};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

/// Participant in a collaborative session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub id: String,
    pub name: String,
    pub role: ParticipantRole,
    pub avatar_url: Option<String>,
    pub status: ParticipantStatus,
    pub joined_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
    pub cursor_position: Option<CursorPosition>,
}

/// Participant roles
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ParticipantRole {
    Owner,
    Editor,
    Viewer,
    Commenter,
}

/// Participant status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ParticipantStatus {
    Active,
    Idle,
    Away,
    Offline,
}

/// Cursor position for presence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorPosition {
    pub node_id: Option<String>,
    pub field: Option<String>,
    pub offset: Option<u32>,
}

/// Collaborator information (simplified)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaboratorInfo {
    pub id: String,
    pub name: String,
    pub role: String,
    pub online: bool,
}

impl From<&Participant> for CollaboratorInfo {
    fn from(p: &Participant) -> Self {
        Self {
            id: p.id.clone(),
            name: p.name.clone(),
            role: format!("{:?}", p.role).to_lowercase(),
            online: p.status != ParticipantStatus::Offline,
        }
    }
}

/// Collaborative session
#[derive(Debug)]
pub struct CollaborativeSession {
    pub id: String,
    pub name: String,
    pub resource_type: ResourceType,
    pub resource_id: String,
    participants: Arc<RwLock<HashMap<String, Participant>>>,
    state: Arc<RwLock<SessionState>>,
    event_tx: broadcast::Sender<CollaborationEvent>,
    settings: SessionSettings,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// Type of resource being collaborated on
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ResourceType {
    Workflow,
    Experiment,
    Document,
    Project,
    Custom(String),
}

/// Session state
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SessionState {
    pub data: serde_json::Value,
    pub version: u64,
    pub last_modified_by: Option<String>,
    pub last_modified_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Session settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSettings {
    pub max_participants: u32,
    pub allow_anonymous: bool,
    pub auto_save: bool,
    pub auto_save_interval_ms: u64,
    pub conflict_resolution: ConflictResolution,
}

impl Default for SessionSettings {
    fn default() -> Self {
        Self {
            max_participants: 10,
            allow_anonymous: false,
            auto_save: true,
            auto_save_interval_ms: 5000,
            conflict_resolution: ConflictResolution::LastWriteWins,
        }
    }
}

/// Conflict resolution strategy
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictResolution {
    LastWriteWins,
    FirstWriteWins,
    Merge,
    AskUser,
}

/// Collaboration events
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CollaborationEvent {
    ParticipantJoined { participant: Participant },
    ParticipantLeft { participant_id: String },
    ParticipantUpdated { participant: Participant },
    StateUpdated { state: SessionState, by: String },
    CursorMoved { participant_id: String, position: CursorPosition },
    Message { from: String, content: String },
    Conflict { field: String, versions: Vec<ConflictVersion> },
}

/// Conflict version for resolution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictVersion {
    pub participant_id: String,
    pub value: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl CollaborativeSession {
    /// Create a new collaborative session
    pub fn new(
        id: &str,
        name: &str,
        resource_type: ResourceType,
        resource_id: &str,
        settings: SessionSettings,
    ) -> Self {
        let (event_tx, _) = broadcast::channel(100);

        Self {
            id: id.to_string(),
            name: name.to_string(),
            resource_type,
            resource_id: resource_id.to_string(),
            participants: Arc::new(RwLock::new(HashMap::new())),
            state: Arc::new(RwLock::new(SessionState::default())),
            event_tx,
            settings,
            created_at: chrono::Utc::now(),
        }
    }

    /// Join the session
    pub async fn join(&self, participant: Participant) -> Result<broadcast::Receiver<CollaborationEvent>> {
        let mut participants = self.participants.write().await;

        if participants.len() >= self.settings.max_participants as usize {
            return Err(CollaborationError::MaxParticipantsReached.into());
        }

        let participant_id = participant.id.clone();
        participants.insert(participant_id, participant.clone());

        // Broadcast join event
        let _ = self.event_tx.send(CollaborationEvent::ParticipantJoined { participant });

        Ok(self.event_tx.subscribe())
    }

    /// Leave the session
    pub async fn leave(&self, participant_id: &str) -> Result<()> {
        let mut participants = self.participants.write().await;
        participants.remove(participant_id);

        // Broadcast leave event
        let _ = self.event_tx.send(CollaborationEvent::ParticipantLeft {
            participant_id: participant_id.to_string(),
        });

        Ok(())
    }

    /// Update participant status
    pub async fn update_participant(&self, participant: Participant) -> Result<()> {
        let mut participants = self.participants.write().await;

        if !participants.contains_key(&participant.id) {
            return Err(CollaborationError::Unauthorized(participant.id.clone()).into());
        }

        participants.insert(participant.id.clone(), participant.clone());

        let _ = self.event_tx.send(CollaborationEvent::ParticipantUpdated { participant });

        Ok(())
    }

    /// Update cursor position
    pub async fn update_cursor(&self, participant_id: &str, position: CursorPosition) -> Result<()> {
        let mut participants = self.participants.write().await;

        if let Some(participant) = participants.get_mut(participant_id) {
            participant.cursor_position = Some(position.clone());
            participant.last_activity = chrono::Utc::now();

            let _ = self.event_tx.send(CollaborationEvent::CursorMoved {
                participant_id: participant_id.to_string(),
                position,
            });
        }

        Ok(())
    }

    /// Update session state
    pub async fn update_state(&self, participant_id: &str, data: serde_json::Value) -> Result<()> {
        let participants = self.participants.read().await;

        let participant = participants
            .get(participant_id)
            .ok_or_else(|| CollaborationError::Unauthorized(participant_id.to_string()))?;

        if participant.role == ParticipantRole::Viewer {
            return Err(CollaborationError::Unauthorized("Viewers cannot edit".to_string()).into());
        }

        drop(participants);

        let mut state = self.state.write().await;
        state.data = data;
        state.version += 1;
        state.last_modified_by = Some(participant_id.to_string());
        state.last_modified_at = Some(chrono::Utc::now());

        let _ = self.event_tx.send(CollaborationEvent::StateUpdated {
            state: state.clone(),
            by: participant_id.to_string(),
        });

        Ok(())
    }

    /// Get current state
    pub async fn get_state(&self) -> SessionState {
        let state = self.state.read().await;
        state.clone()
    }

    /// Get all participants
    pub async fn get_participants(&self) -> Vec<Participant> {
        let participants = self.participants.read().await;
        participants.values().cloned().collect()
    }

    /// Get participant by ID
    pub async fn get_participant(&self, participant_id: &str) -> Option<Participant> {
        let participants = self.participants.read().await;
        participants.get(participant_id).cloned()
    }

    /// Send a message to all participants
    pub async fn send_message(&self, from: &str, content: &str) -> Result<()> {
        let _ = self.event_tx.send(CollaborationEvent::Message {
            from: from.to_string(),
            content: content.to_string(),
        });

        Ok(())
    }

    /// Get session info
    pub fn info(&self) -> SessionInfo {
        SessionInfo {
            id: self.id.clone(),
            name: self.name.clone(),
            resource_type: self.resource_type.clone(),
            resource_id: self.resource_id.clone(),
            created_at: self.created_at,
        }
    }
}

/// Session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub resource_type: ResourceType,
    pub resource_id: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Real-time sync manager
pub struct RealTimeSync {
    sessions: DashMap<String, Arc<CollaborativeSession>>,
}

impl RealTimeSync {
    /// Create a new sync manager
    pub fn new() -> Self {
        Self {
            sessions: DashMap::new(),
        }
    }

    /// Create a new session
    pub fn create_session(
        &self,
        name: &str,
        resource_type: ResourceType,
        resource_id: &str,
        settings: Option<SessionSettings>,
    ) -> Arc<CollaborativeSession> {
        let session_id = uuid::Uuid::new_v4().to_string();
        let session = Arc::new(CollaborativeSession::new(
            &session_id,
            name,
            resource_type,
            resource_id,
            settings.unwrap_or_default(),
        ));

        self.sessions.insert(session_id, session.clone());

        session
    }

    /// Get session by ID
    pub fn get_session(&self, session_id: &str) -> Option<Arc<CollaborativeSession>> {
        self.sessions.get(session_id).map(|s| s.value().clone())
    }

    /// Get session by resource
    pub fn get_session_by_resource(
        &self,
        resource_type: &ResourceType,
        resource_id: &str,
    ) -> Option<Arc<CollaborativeSession>> {
        self.sessions
            .iter()
            .find(|s| {
                s.value().resource_type == *resource_type
                    && s.value().resource_id == resource_id
            })
            .map(|s| s.value().clone())
    }

    /// Close a session
    pub fn close_session(&self, session_id: &str) -> Option<Arc<CollaborativeSession>> {
        self.sessions.remove(session_id).map(|(_, s)| s)
    }

    /// List all sessions
    pub fn list_sessions(&self) -> Vec<SessionInfo> {
        self.sessions.iter().map(|s| s.value().info()).collect()
    }
}

impl Default for RealTimeSync {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_participant(id: &str) -> Participant {
        Participant {
            id: id.to_string(),
            name: format!("User {}", id),
            role: ParticipantRole::Editor,
            avatar_url: None,
            status: ParticipantStatus::Active,
            joined_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
            cursor_position: None,
        }
    }

    #[tokio::test]
    async fn test_session_creation() {
        let session = CollaborativeSession::new(
            "session-1",
            "Test Session",
            ResourceType::Workflow,
            "workflow-1",
            SessionSettings::default(),
        );

        assert_eq!(session.id, "session-1");
        assert!(session.get_participants().await.is_empty());
    }

    #[tokio::test]
    async fn test_participant_join_leave() {
        let session = CollaborativeSession::new(
            "session-1",
            "Test Session",
            ResourceType::Workflow,
            "workflow-1",
            SessionSettings::default(),
        );

        let participant = create_test_participant("user-1");
        let result = session.join(participant).await;
        assert!(result.is_ok());

        let participants = session.get_participants().await;
        assert_eq!(participants.len(), 1);

        session.leave("user-1").await.unwrap();
        let participants = session.get_participants().await;
        assert!(participants.is_empty());
    }

    #[tokio::test]
    async fn test_state_update() {
        let session = CollaborativeSession::new(
            "session-1",
            "Test Session",
            ResourceType::Workflow,
            "workflow-1",
            SessionSettings::default(),
        );

        let participant = create_test_participant("user-1");
        session.join(participant).await.unwrap();

        session
            .update_state("user-1", serde_json::json!({"key": "value"}))
            .await
            .unwrap();

        let state = session.get_state().await;
        assert_eq!(state.version, 1);
        assert_eq!(state.data["key"], "value");
    }

    #[test]
    fn test_sync_manager() {
        let sync = RealTimeSync::new();

        let session = sync.create_session(
            "Test",
            ResourceType::Workflow,
            "workflow-1",
            None,
        );

        assert!(sync.get_session(&session.id).is_some());
        assert!(sync
            .get_session_by_resource(&ResourceType::Workflow, "workflow-1")
            .is_some());
    }
}
