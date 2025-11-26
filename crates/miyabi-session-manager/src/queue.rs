//! Message queue implementation for session communication

use crate::message::{Message, Priority};
use crate::{Result, SessionError};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::BinaryHeap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};
use uuid::Uuid;

/// Priority queue wrapper for messages
#[derive(Debug, Clone, PartialEq, Eq)]
struct PriorityMessage(Message);

impl PartialOrd for PriorityMessage {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for PriorityMessage {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Higher priority comes first
        self.0
            .priority
            .cmp(&other.0.priority)
            .then_with(|| other.0.created_at.cmp(&self.0.created_at)) // Earlier messages first
    }
}

/// Session-specific message queue
#[derive(Debug)]
struct SessionQueue {
    /// Session ID
    #[allow(dead_code)]
    session_id: Uuid,

    /// Priority queue of messages
    messages: BinaryHeap<PriorityMessage>,

    /// Total messages enqueued
    total_enqueued: usize,

    /// Total messages dequeued
    total_dequeued: usize,
}

impl SessionQueue {
    fn new(session_id: Uuid) -> Self {
        Self {
            session_id,
            messages: BinaryHeap::new(),
            total_enqueued: 0,
            total_dequeued: 0,
        }
    }

    fn enqueue(&mut self, message: Message) {
        self.messages.push(PriorityMessage(message));
        self.total_enqueued += 1;
    }

    fn dequeue(&mut self) -> Option<Message> {
        self.messages.pop().map(|pm| {
            self.total_dequeued += 1;
            pm.0
        })
    }

    fn peek(&self) -> Option<&Message> {
        self.messages.peek().map(|pm| &pm.0)
    }

    fn len(&self) -> usize {
        self.messages.len()
    }

    #[allow(dead_code)]
    fn is_empty(&self) -> bool {
        self.messages.is_empty()
    }

    fn clear(&mut self) {
        self.messages.clear();
    }

    /// Remove expired messages
    fn remove_expired(&mut self) -> usize {
        let mut valid_messages = Vec::new();
        let mut expired_count = 0;

        while let Some(PriorityMessage(msg)) = self.messages.pop() {
            if msg.is_expired() {
                expired_count += 1;
                debug!("Removing expired message: {}", msg.id);
            } else {
                valid_messages.push(PriorityMessage(msg));
            }
        }

        for msg in valid_messages {
            self.messages.push(msg);
        }

        expired_count
    }
}

/// Message queue manager
pub struct MessageQueue {
    /// Queues per session (thread-safe)
    queues: Arc<DashMap<Uuid, Arc<RwLock<SessionQueue>>>>,

    /// Storage path for queue persistence
    storage_path: PathBuf,
}

impl MessageQueue {
    /// Create a new message queue manager
    pub async fn new<P: AsRef<Path>>(storage_dir: P) -> Result<Self> {
        let storage_path = storage_dir.as_ref().to_path_buf();
        tokio::fs::create_dir_all(&storage_path).await?;

        let queue_file = storage_path.join("message_queues.json");

        let queues = if queue_file.exists() {
            Self::load_from_file(&queue_file).await?
        } else {
            Arc::new(DashMap::new())
        };

        Ok(Self {
            queues,
            storage_path,
        })
    }

    /// Enqueue a message for a session
    pub async fn enqueue(&self, message: Message) -> Result<()> {
        let session_id = message.session_id;

        // Get or create session queue
        let queue = self
            .queues
            .entry(session_id)
            .or_insert_with(|| Arc::new(RwLock::new(SessionQueue::new(session_id))))
            .clone();

        let mut queue_guard = queue.write().await;
        queue_guard.enqueue(message.clone());

        info!(
            "Enqueued message {} for session {} (priority: {:?})",
            message.id, session_id, message.priority
        );

        drop(queue_guard);
        self.persist().await?;

        Ok(())
    }

    /// Enqueue multiple messages
    pub async fn enqueue_batch(&self, messages: Vec<Message>) -> Result<()> {
        for message in messages {
            self.enqueue(message).await?;
        }
        Ok(())
    }

    /// Dequeue the highest priority message for a session
    pub async fn dequeue(&self, session_id: Uuid) -> Result<Option<Message>> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let mut queue_guard = queue.write().await;

            // Remove expired messages first
            let expired = queue_guard.remove_expired();
            if expired > 0 {
                info!(
                    "Removed {} expired messages from session {}",
                    expired, session_id
                );
            }

            if let Some(mut message) = queue_guard.dequeue() {
                message.increment_attempts();

                info!(
                    "Dequeued message {} for session {} (attempt {}/{})",
                    message.id, session_id, message.delivery_attempts, message.max_attempts
                );

                drop(queue_guard);
                self.persist().await?;

                return Ok(Some(message));
            }
        }

        Ok(None)
    }

    /// Peek at the highest priority message without removing it
    pub async fn peek(&self, session_id: Uuid) -> Option<Message> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;
            queue_guard.peek().cloned()
        } else {
            None
        }
    }

    /// Get all messages for a session (returns a copy)
    pub async fn list_messages(&self, session_id: Uuid) -> Vec<Message> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;
            queue_guard.messages.iter().map(|pm| pm.0.clone()).collect()
        } else {
            vec![]
        }
    }

    /// Get message count for a session
    pub async fn len(&self, session_id: Uuid) -> usize {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;
            queue_guard.len()
        } else {
            0
        }
    }

    /// Check if session queue is empty
    pub async fn is_empty(&self, session_id: Uuid) -> bool {
        self.len(session_id).await == 0
    }

    /// Clear all messages for a session
    pub async fn clear_session(&self, session_id: Uuid) -> Result<()> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let mut queue_guard = queue.write().await;
            queue_guard.clear();

            info!("Cleared all messages for session {}", session_id);
            drop(queue_guard);
            self.persist().await?;
        }

        Ok(())
    }

    /// Remove a session's queue entirely
    pub async fn remove_session(&self, session_id: Uuid) -> Result<()> {
        self.queues.remove(&session_id);
        info!("Removed queue for session {}", session_id);
        self.persist().await?;
        Ok(())
    }

    /// Filter messages by type
    pub async fn filter_by_type(&self, session_id: Uuid, type_name: &str) -> Vec<Message> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;
            queue_guard
                .messages
                .iter()
                .map(|pm| &pm.0)
                .filter(|msg| msg.type_name() == type_name)
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// Filter messages by minimum priority
    pub async fn filter_by_priority(
        &self,
        session_id: Uuid,
        min_priority: Priority,
    ) -> Vec<Message> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;
            queue_guard
                .messages
                .iter()
                .map(|pm| &pm.0)
                .filter(|msg| msg.priority >= min_priority)
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// Clean up expired messages across all sessions
    pub async fn cleanup_expired(&self) -> Result<usize> {
        let mut total_removed = 0;

        for entry in self.queues.iter() {
            let queue = entry.value().clone();
            let mut queue_guard = queue.write().await;
            total_removed += queue_guard.remove_expired();
        }

        if total_removed > 0 {
            info!("Cleaned up {} expired messages", total_removed);
            self.persist().await?;
        }

        Ok(total_removed)
    }

    /// Get statistics for a session queue
    pub async fn get_stats(&self, session_id: Uuid) -> Option<QueueStats> {
        if let Some(queue_ref) = self.queues.get(&session_id) {
            let queue = queue_ref.clone();
            let queue_guard = queue.read().await;

            let mut priority_counts = [0usize; 4];
            for pm in queue_guard.messages.iter() {
                let idx = pm.0.priority as usize;
                priority_counts[idx] += 1;
            }

            Some(QueueStats {
                session_id,
                current_size: queue_guard.len(),
                total_enqueued: queue_guard.total_enqueued,
                total_dequeued: queue_guard.total_dequeued,
                low_priority: priority_counts[0],
                normal_priority: priority_counts[1],
                high_priority: priority_counts[2],
                urgent_priority: priority_counts[3],
            })
        } else {
            None
        }
    }

    /// Get global statistics across all queues
    pub async fn get_global_stats(&self) -> GlobalQueueStats {
        let mut stats = GlobalQueueStats::default();

        for entry in self.queues.iter() {
            let queue = entry.value().clone();
            let queue_guard = queue.read().await;

            stats.total_sessions += 1;
            stats.total_messages += queue_guard.len();
            stats.total_enqueued += queue_guard.total_enqueued;
            stats.total_dequeued += queue_guard.total_dequeued;

            for pm in queue_guard.messages.iter() {
                match pm.0.priority {
                    Priority::Low => stats.low_priority += 1,
                    Priority::Normal => stats.normal_priority += 1,
                    Priority::High => stats.high_priority += 1,
                    Priority::Urgent => stats.urgent_priority += 1,
                }
            }
        }

        stats
    }

    /// Persist queues to disk
    async fn persist(&self) -> Result<()> {
        let queue_file = self.storage_path.join("message_queues.json");
        let serialized = self.serialize_queues().await?;

        tokio::fs::write(&queue_file, serialized).await?;
        debug!("Persisted message queues to {:?}", queue_file);

        Ok(())
    }

    /// Serialize all queues to JSON
    async fn serialize_queues(&self) -> Result<String> {
        #[derive(Serialize)]
        struct QueueData {
            session_id: Uuid,
            messages: Vec<Message>,
            total_enqueued: usize,
            total_dequeued: usize,
        }

        let mut all_queues = Vec::new();

        for entry in self.queues.iter() {
            let session_id = *entry.key();
            let queue = entry.value().clone();
            let queue_guard = queue.read().await;

            all_queues.push(QueueData {
                session_id,
                messages: queue_guard.messages.iter().map(|pm| pm.0.clone()).collect(),
                total_enqueued: queue_guard.total_enqueued,
                total_dequeued: queue_guard.total_dequeued,
            });
        }

        serde_json::to_string_pretty(&all_queues)
            .map_err(|e| SessionError::StorageError(e.to_string()))
    }

    /// Load queues from file
    async fn load_from_file(path: &Path) -> Result<Arc<DashMap<Uuid, Arc<RwLock<SessionQueue>>>>> {
        #[derive(Deserialize)]
        struct QueueData {
            session_id: Uuid,
            messages: Vec<Message>,
            total_enqueued: usize,
            total_dequeued: usize,
        }

        let content = tokio::fs::read_to_string(path).await?;
        let queue_data: Vec<QueueData> = serde_json::from_str(&content)
            .map_err(|e| SessionError::StorageError(e.to_string()))?;

        let queues = Arc::new(DashMap::new());

        for data in queue_data {
            let mut session_queue = SessionQueue::new(data.session_id);
            session_queue.total_enqueued = data.total_enqueued;
            session_queue.total_dequeued = data.total_dequeued;

            for message in data.messages {
                session_queue.messages.push(PriorityMessage(message));
            }

            queues.insert(data.session_id, Arc::new(RwLock::new(session_queue)));
        }

        info!("Loaded {} session queues from {:?}", queues.len(), path);

        Ok(queues)
    }
}

/// Queue statistics for a single session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueStats {
    /// Session ID
    pub session_id: Uuid,

    /// Current queue size
    pub current_size: usize,

    /// Total messages enqueued
    pub total_enqueued: usize,

    /// Total messages dequeued
    pub total_dequeued: usize,

    /// Low priority message count
    pub low_priority: usize,

    /// Normal priority message count
    pub normal_priority: usize,

    /// High priority message count
    pub high_priority: usize,

    /// Urgent priority message count
    pub urgent_priority: usize,
}

/// Global queue statistics across all sessions
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GlobalQueueStats {
    /// Total number of sessions with queues
    pub total_sessions: usize,

    /// Total messages across all queues
    pub total_messages: usize,

    /// Total enqueued (lifetime)
    pub total_enqueued: usize,

    /// Total dequeued (lifetime)
    pub total_dequeued: usize,

    /// Low priority count
    pub low_priority: usize,

    /// Normal priority count
    pub normal_priority: usize,

    /// High priority count
    pub high_priority: usize,

    /// Urgent priority count
    pub urgent_priority: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::message::{LogMessage, MessageBuilder, MessageType};
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_enqueue_dequeue() {
        let temp_dir = tempdir().unwrap();
        let queue = MessageQueue::new(temp_dir.path()).await.unwrap();

        let session_id = Uuid::new_v4();
        let msg = MessageBuilder::new(session_id)
            .priority(Priority::Normal)
            .message_type(MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: "test".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        queue.enqueue(msg.clone()).await.unwrap();
        assert_eq!(queue.len(session_id).await, 1);

        let dequeued = queue.dequeue(session_id).await.unwrap();
        assert!(dequeued.is_some());
        assert_eq!(dequeued.unwrap().id, msg.id);
        assert_eq!(queue.len(session_id).await, 0);
    }

    #[tokio::test]
    async fn test_priority_ordering() {
        let temp_dir = tempdir().unwrap();
        let queue = MessageQueue::new(temp_dir.path()).await.unwrap();

        let session_id = Uuid::new_v4();

        // Enqueue in random order
        let low = MessageBuilder::new(session_id)
            .priority(Priority::Low)
            .message_type(MessageType::Log(LogMessage {
                level: "debug".to_string(),
                content: "low".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        let urgent = MessageBuilder::new(session_id)
            .priority(Priority::Urgent)
            .message_type(MessageType::Log(LogMessage {
                level: "error".to_string(),
                content: "urgent".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        let normal = MessageBuilder::new(session_id)
            .priority(Priority::Normal)
            .message_type(MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: "normal".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        queue.enqueue(low.clone()).await.unwrap();
        queue.enqueue(urgent.clone()).await.unwrap();
        queue.enqueue(normal.clone()).await.unwrap();

        // Should dequeue in priority order: Urgent -> Normal -> Low
        let msg1 = queue.dequeue(session_id).await.unwrap().unwrap();
        assert_eq!(msg1.id, urgent.id);

        let msg2 = queue.dequeue(session_id).await.unwrap().unwrap();
        assert_eq!(msg2.id, normal.id);

        let msg3 = queue.dequeue(session_id).await.unwrap().unwrap();
        assert_eq!(msg3.id, low.id);
    }

    #[tokio::test]
    async fn test_filter_by_priority() {
        let temp_dir = tempdir().unwrap();
        let queue = MessageQueue::new(temp_dir.path()).await.unwrap();

        let session_id = Uuid::new_v4();

        for priority in [
            Priority::Low,
            Priority::Normal,
            Priority::High,
            Priority::Urgent,
        ] {
            let msg = MessageBuilder::new(session_id)
                .priority(priority)
                .message_type(MessageType::Log(LogMessage {
                    level: "info".to_string(),
                    content: format!("{:?}", priority),
                    source: None,
                }))
                .build()
                .unwrap();

            queue.enqueue(msg).await.unwrap();
        }

        let high_and_above = queue.filter_by_priority(session_id, Priority::High).await;
        assert_eq!(high_and_above.len(), 2); // High + Urgent
    }

    #[tokio::test]
    async fn test_persistence() {
        let temp_dir = tempdir().unwrap();
        let session_id = Uuid::new_v4();

        {
            let queue = MessageQueue::new(temp_dir.path()).await.unwrap();

            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Log(LogMessage {
                    level: "info".to_string(),
                    content: "test".to_string(),
                    source: None,
                }))
                .build()
                .unwrap();

            queue.enqueue(msg).await.unwrap();
        }

        // Load from persisted file
        let queue2 = MessageQueue::new(temp_dir.path()).await.unwrap();
        assert_eq!(queue2.len(session_id).await, 1);
    }

    #[tokio::test]
    async fn test_cleanup_expired() {
        let temp_dir = tempdir().unwrap();
        let queue = MessageQueue::new(temp_dir.path()).await.unwrap();

        let session_id = Uuid::new_v4();

        // Add expired message
        let expired = Message::with_expiration(
            session_id,
            Priority::Normal,
            MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: "expired".to_string(),
                source: None,
            }),
            -1, // expired 1 second ago
        );

        queue.enqueue(expired).await.unwrap();
        assert_eq!(queue.len(session_id).await, 1);

        // Cleanup
        let removed = queue.cleanup_expired().await.unwrap();
        assert_eq!(removed, 1);
        assert_eq!(queue.len(session_id).await, 0);
    }
}
