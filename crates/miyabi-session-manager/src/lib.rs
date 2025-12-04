//! Miyabi Session Manager
//!
//! Claude Code セッション管理システム - Agent間の引き継ぎを実現
//!
//! ## Features
//!
//! - **セッション管理**: Claude Code --headless セッションのライフサイクル管理
//! - **Agent間引き継ぎ**: セッションを別のAgentに引き継ぐhandoff機能
//! - **セッション系譜**: 親子関係のトラッキングとlineage取得
//! - **永続化**: セッション情報のJSON永続化
//! - **並列実行**: DashMapによる並行アクセス対応
//!
//! ## Example
//!
//! ```rust,no_run
//! use miyabi_session_manager::{SessionManager, SessionContext, Phase};
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let mut manager = SessionManager::new(".ai/sessions").await?;
//!
//!     // CodeGenAgentセッションを起動
//!     let context = SessionContext {
//!         issue_number: Some(270),
//!         current_phase: Phase::CodeGeneration,
//!         worktree_path: Some(".worktrees/issue-270".into()),
//!         previous_results: vec![],
//!     };
//!
//!     let session_id = manager
//!         .spawn_agent_session("CodeGenAgent", "Code generation", context)
//!         .await?;
//!
//!     // ReviewAgentに引き継ぎ
//!     let review_context = SessionContext {
//!         issue_number: Some(270),
//!         current_phase: Phase::Review,
//!         worktree_path: Some(".worktrees/issue-270".into()),
//!         previous_results: vec![],
//!     };
//!
//!     let review_session_id = manager
//!         .handoff(session_id, "ReviewAgent", review_context)
//!         .await?;
//!
//!     println!("Review session: {}", review_session_id);
//!     Ok(())
//! }
//! ```

mod checkpoint;
mod error;
mod message;
mod queue;
mod session;
mod storage;

pub use checkpoint::{Checkpoint, CheckpointManager};
pub use error::{Result, SessionError};
pub use message::{
    CommandMessage, CustomMessage, ErrorMessage, LogMessage, Message, MessageBuilder, MessageType, Priority,
    ResultMessage, StatusUpdateMessage,
};
pub use queue::{GlobalQueueStats, MessageQueue, QueueStats};
pub use session::{AgentResult, ManagedSession, Phase, SessionContext, SessionStatus};
pub use storage::SessionStorage;

use dashmap::DashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// Claude Code セッション管理システム
pub struct SessionManager {
    /// アクティブなセッション一覧（並行アクセス対応）
    sessions: Arc<DashMap<Uuid, ManagedSession>>,

    /// セッション永続化ストレージ
    storage: SessionStorage,

    /// セッションログディレクトリ
    log_dir: PathBuf,

    /// メッセージキューシステム
    message_queue: Option<Arc<MessageQueue>>,
}

impl SessionManager {
    /// 新しいSessionManagerを作成
    ///
    /// # Arguments
    ///
    /// * `storage_dir` - セッション情報の永続化ディレクトリ（例: `.ai/sessions`）
    pub async fn new<P: AsRef<Path>>(storage_dir: P) -> Result<Self> {
        let storage_path = storage_dir.as_ref().to_path_buf();
        tokio::fs::create_dir_all(&storage_path).await?;

        let log_dir = storage_path.join("logs");
        tokio::fs::create_dir_all(&log_dir).await?;

        let storage = SessionStorage::new(storage_path.join("sessions.json")).await?;

        Ok(Self { sessions: Arc::new(DashMap::new()), storage, log_dir, message_queue: None })
    }

    /// メッセージキューを有効化（オプション機能）
    ///
    /// # Arguments
    ///
    /// * `enable` - `true`でメッセージキュー機能を有効化
    ///
    /// # Example
    ///
    /// ```rust,no_run
    /// # use miyabi_session_manager::SessionManager;
    /// # #[tokio::main]
    /// # async fn main() -> anyhow::Result<()> {
    /// let mut manager = SessionManager::new(".ai/sessions")
    ///     .await?
    ///     .with_message_queue(true)
    ///     .await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn with_message_queue(mut self, enable: bool) -> Result<Self> {
        if enable {
            let queue_dir = self.log_dir.parent().unwrap().join("queues");
            let message_queue = MessageQueue::new(&queue_dir).await?;
            self.message_queue = Some(Arc::new(message_queue));
            info!("✅ Message queue enabled at {:?}", queue_dir);
        }
        Ok(self)
    }

    /// メッセージをセッションに送信
    ///
    /// # Arguments
    ///
    /// * `message` - 送信するメッセージ
    ///
    /// # Returns
    ///
    /// メッセージキューが無効な場合は`SessionError::InvalidState`
    pub async fn send_message(&self, message: Message) -> Result<()> {
        let queue = self.message_queue.as_ref().ok_or_else(|| {
            SessionError::InvalidState("Message queue is not enabled. Call with_message_queue(true).".to_string())
        })?;

        queue.enqueue(message).await
    }

    /// セッションの次のメッセージを取得
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    ///
    /// # Returns
    ///
    /// 優先度順で次のメッセージ、またはNone
    pub async fn receive_message(&self, session_id: Uuid) -> Result<Option<Message>> {
        let queue = self
            .message_queue
            .as_ref()
            .ok_or_else(|| SessionError::InvalidState("Message queue is not enabled.".to_string()))?;

        queue.dequeue(session_id).await
    }

    /// セッションのメッセージキューをピーク（取り出さずに確認）
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    ///
    /// # Returns
    ///
    /// 次のメッセージ、またはNone
    pub async fn peek_message(&self, session_id: Uuid) -> Option<Message> {
        self.message_queue.as_ref()?.peek(session_id).await
    }

    /// セッションの全メッセージを取得
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    pub async fn list_messages(&self, session_id: Uuid) -> Vec<Message> {
        if let Some(queue) = &self.message_queue {
            queue.list_messages(session_id).await
        } else {
            vec![]
        }
    }

    /// セッションのキューサイズを取得
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    pub async fn queue_size(&self, session_id: Uuid) -> usize {
        if let Some(queue) = &self.message_queue {
            queue.len(session_id).await
        } else {
            0
        }
    }

    /// 特定タイプのメッセージをフィルタ
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    /// * `type_name` - メッセージタイプ名（例: "command", "error"）
    pub async fn filter_messages_by_type(&self, session_id: Uuid, type_name: &str) -> Vec<Message> {
        if let Some(queue) = &self.message_queue {
            queue.filter_by_type(session_id, type_name).await
        } else {
            vec![]
        }
    }

    /// 優先度でメッセージをフィルタ
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    /// * `min_priority` - 最小優先度
    pub async fn filter_messages_by_priority(&self, session_id: Uuid, min_priority: Priority) -> Vec<Message> {
        if let Some(queue) = &self.message_queue {
            queue.filter_by_priority(session_id, min_priority).await
        } else {
            vec![]
        }
    }

    /// キュー統計を取得
    ///
    /// # Arguments
    ///
    /// * `session_id` - セッションID
    pub async fn get_queue_stats(&self, session_id: Uuid) -> Option<QueueStats> {
        if let Some(queue) = &self.message_queue {
            queue.get_stats(session_id).await
        } else {
            None
        }
    }

    /// グローバルキュー統計を取得
    pub async fn get_global_queue_stats(&self) -> Option<GlobalQueueStats> {
        if let Some(queue) = &self.message_queue {
            Some(queue.get_global_stats().await)
        } else {
            None
        }
    }

    /// 期限切れメッセージをクリーンアップ
    pub async fn cleanup_expired_messages(&self) -> Result<usize> {
        if let Some(queue) = &self.message_queue {
            queue.cleanup_expired().await
        } else {
            Ok(0)
        }
    }

    /// 新しいセッションを作成してAgentを起動
    ///
    /// # Arguments
    ///
    /// * `agent_name` - 起動するAgent名（例: "CodeGenAgent"）
    /// * `purpose` - セッションの目的
    /// * `context` - セッションコンテキスト（Issue番号、Phase等）
    ///
    /// # Returns
    ///
    /// 新しいセッションのUUID
    pub async fn spawn_agent_session(&self, agent_name: &str, purpose: &str, context: SessionContext) -> Result<Uuid> {
        let session_id = Uuid::new_v4();

        info!("🚀 Spawning session {} for {} ({})", session_id, agent_name, purpose);

        // セッションログファイル
        let log_file = self.log_dir.join(format!("{}.log", session_id));
        let log_file_handle = std::fs::File::create(&log_file)?;

        // Claude Code --headless でAgentを起動
        let child = Command::new("claude")
            .args([
                "code",
                "--headless",
                "--execute-command",
                &format!("/agent-run --agent {}", agent_name),
            ])
            .stdout(Stdio::from(log_file_handle.try_clone()?))
            .stderr(Stdio::from(log_file_handle))
            .spawn()?;

        let session = ManagedSession::new(session_id, agent_name, purpose, context, Some(child));

        // セッションを登録
        self.sessions.insert(session_id, session.clone());

        // 永続化
        self.storage.save(&session).await?;

        debug!("✅ Session {} spawned successfully", session_id);

        Ok(session_id)
    }

    /// セッションを別のAgentに引き継ぐ
    ///
    /// # Arguments
    ///
    /// * `from_session_id` - 現在のセッションID
    /// * `to_agent` - 引き継ぎ先Agent名
    /// * `updated_context` - 更新されたコンテキスト
    ///
    /// # Returns
    ///
    /// 新しいセッションのUUID
    pub async fn handoff(
        &self,
        from_session_id: Uuid,
        to_agent: &str,
        updated_context: SessionContext,
    ) -> Result<Uuid> {
        info!("🔄 Handing off session {} to {}", from_session_id, to_agent);

        // 現在のセッションを取得
        let mut parent_session = self
            .sessions
            .get_mut(&from_session_id)
            .ok_or_else(|| SessionError::NotFound(from_session_id))?;

        // 親セッションを一時停止
        parent_session.status = SessionStatus::HandedOff;
        parent_session.handoff_to = Some(to_agent.to_string());

        // 永続化
        self.storage.save(&parent_session).await?;

        drop(parent_session); // ロック解放

        // 新しいセッションを作成
        let new_session_id = self
            .spawn_agent_session(to_agent, &format!("Handoff from session {}", from_session_id), updated_context)
            .await?;

        // 親子関係を記録
        if let Some(mut new_session) = self.sessions.get_mut(&new_session_id) {
            new_session.parent_session = Some(from_session_id);
            self.storage.save(&new_session).await?;
        }

        if let Some(mut parent) = self.sessions.get_mut(&from_session_id) {
            parent.child_sessions.push(new_session_id);
            self.storage.save(&parent).await?;
        }

        info!("✅ Handoff complete: {} → {}", from_session_id, new_session_id);

        Ok(new_session_id)
    }

    /// セッションを取得
    pub fn get_session(&self, session_id: Uuid) -> Result<ManagedSession> {
        self.sessions
            .get(&session_id)
            .map(|entry| entry.clone())
            .ok_or_else(|| SessionError::NotFound(session_id))
    }

    /// セッション履歴を取得（親→子の系譜）
    ///
    /// # Arguments
    ///
    /// * `session_id` - 系譜を取得するセッションID
    ///
    /// # Returns
    ///
    /// 親から子への順序でソートされたセッションリスト
    pub fn get_session_lineage(&self, session_id: Uuid) -> Vec<ManagedSession> {
        let mut lineage = vec![];
        let mut current_id = session_id;

        // 親方向に遡る
        while let Some(session) = self.sessions.get(&current_id) {
            lineage.push(session.clone());

            if let Some(parent_id) = session.parent_session {
                current_id = parent_id;
            } else {
                break;
            }
        }

        // 親→子の順に逆転
        lineage.reverse();
        lineage
    }

    /// 全てのアクティブなセッションを取得
    pub fn list_active_sessions(&self) -> Vec<ManagedSession> {
        self.sessions
            .iter()
            .filter(|entry| entry.value().status == SessionStatus::Active)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// セッションを完了としてマーク
    pub async fn complete_session(&self, session_id: Uuid) -> Result<()> {
        let mut session = self
            .sessions
            .get_mut(&session_id)
            .ok_or_else(|| SessionError::NotFound(session_id))?;

        session.status = SessionStatus::Completed;
        self.storage.save(&session).await?;

        info!("✅ Session {} marked as completed", session_id);
        Ok(())
    }

    /// セッションを失敗としてマーク
    pub async fn fail_session(&self, session_id: Uuid, error: String) -> Result<()> {
        let mut session = self
            .sessions
            .get_mut(&session_id)
            .ok_or_else(|| SessionError::NotFound(session_id))?;

        session.status = SessionStatus::Failed;
        session.error_message = Some(error.clone());
        self.storage.save(&session).await?;

        warn!("❌ Session {} failed: {}", session_id, error);
        Ok(())
    }

    /// セッション数の統計を取得
    pub fn get_stats(&self) -> SessionStats {
        let mut stats = SessionStats::default();

        for entry in self.sessions.iter() {
            match entry.value().status {
                SessionStatus::Active => stats.active += 1,
                SessionStatus::HandedOff => stats.handed_off += 1,
                SessionStatus::Completed => stats.completed += 1,
                SessionStatus::Failed => stats.failed += 1,
            }
        }

        stats.total = self.sessions.len();
        stats
    }
}

/// セッション統計
#[derive(Debug, Clone, Default)]
pub struct SessionStats {
    pub total: usize,
    pub active: usize,
    pub handed_off: usize,
    pub completed: usize,
    pub failed: usize,
}
