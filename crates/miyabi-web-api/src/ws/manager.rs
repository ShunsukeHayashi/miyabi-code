// ws/manager.rs
// WebSocket マネージャー - Redis Pub/Sub 統合版

use super::message::WSMessage;
use crate::error::ApiError;
use dashmap::DashMap;
use redis::aio::ConnectionManager;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, info, instrument, warn};

/// WebSocket コネクション管理
pub struct WebSocketManager {
    /// 実行 ID → ブロードキャストチャネル
    /// ローカルクライアント向けの高速配信
    channels: Arc<DashMap<String, broadcast::Sender<WSMessage>>>,

    /// Redis Pub/Sub マネージャ
    /// マルチインスタンス対応（複数サーバー間での配信）
    redis: ConnectionManager,
}

impl WebSocketManager {
    /// 新しいマネージャーを作成
    pub async fn new(redis_url: &str) -> Result<Self, ApiError> {
        let client = redis::Client::open(redis_url)
            .map_err(|e| ApiError::Configuration(format!("Redis connection error: {}", e)))?;

        let redis = ConnectionManager::new(client)
            .await
            .map_err(|e| ApiError::Configuration(format!("Redis pool error: {}", e)))?;

        Ok(Self {
            channels: Arc::new(DashMap::new()),
            redis,
        })
    }

    /// 実行 ID のチャネルを取得（なければ作成）
    fn get_or_create_channel(&self, execution_id: &str) -> broadcast::Sender<WSMessage> {
        match self.channels.get(execution_id) {
            Some(sender) => sender.clone(),
            None => {
                // バウンド付きブロードキャストチャネル（バッファサイズ: 100）
                let (tx, _) = broadcast::channel(100);
                self.channels.insert(execution_id.to_string(), tx.clone());
                tx
            }
        }
    }

    /// メッセージをブロードキャスト（ローカル + Redis）
    #[instrument(skip(self), fields(execution_id = %execution_id, message_type = %message.message_type()))]
    pub async fn broadcast_message(
        &self,
        execution_id: &str,
        message: &WSMessage,
    ) -> Result<(), ApiError> {
        // 1. ローカルメモリのクライアントに送信
        let channel = self.get_or_create_channel(execution_id);
        if let Err(_e) = channel.send(message.clone()) {
            warn!("local_broadcast_error: no subscribers");
        }

        // 2. Redis 経由で他のサーバーのクライアントに送信
        let json = message
            .to_text()
            .map_err(|e| ApiError::Server(format!("Serialization error: {}", e)))?;

        let key = format!("execution:{}:events", execution_id);
        let mut conn = self.redis.clone();

        // Pub/Sub でブロードキャスト
        match redis::cmd("PUBLISH")
            .arg(&key)
            .arg(&json)
            .query_async::<i32>(&mut conn)
            .await
        {
            Ok(subscribers) => {
                debug!("published to {} subscribers", subscribers);
            }
            Err(e) => {
                warn!("redis_publish_error: {}", e);
                // Redis エラーは非致命的（ローカルクライアントは配信済み）
            }
        }

        Ok(())
    }

    /// 複数メッセージをバッチブロードキャスト
    pub async fn broadcast_batch(
        &self,
        execution_id: &str,
        messages: Vec<WSMessage>,
    ) -> Result<(), ApiError> {
        for message in messages {
            self.broadcast_message(execution_id, &message).await?;
        }
        Ok(())
    }

    /// 実行 ID の購読者数を取得
    pub fn get_subscriber_count(&self, execution_id: &str) -> usize {
        match self.channels.get(execution_id) {
            Some(sender) => sender.receiver_count(),
            None => 0,
        }
    }

    /// チャネルをクリーンアップ（使用終了時）
    pub fn cleanup_channel(&self, execution_id: &str) {
        self.channels.remove(execution_id);
        debug!("channel_cleaned_up: {}", execution_id);
    }

    /// すべての実行 ID をリスト
    pub fn list_active_executions(&self) -> Vec<String> {
        self.channels
            .iter()
            .map(|entry| entry.key().clone())
            .collect()
    }

    /// 非アクティブなチャネルをクリーンアップ
    /// 購読者がいないチャネルを削除してメモリを解放
    pub fn cleanup_inactive_channels(&self) -> usize {
        let mut removed = 0;
        self.channels.retain(|_, sender| {
            if sender.receiver_count() == 0 {
                removed += 1;
                false
            } else {
                true
            }
        });

        if removed > 0 {
            info!("cleaned_up {} inactive channels", removed);
        }

        removed
    }
}

/// WebSocket コネクションハンドラー
pub struct WebSocketConnection {
    /// 実行 ID（購読中のイベントストリーム）
    pub execution_id: String,

    /// ブロードキャストチャネルの受信側
    pub receiver: broadcast::Receiver<WSMessage>,
}

impl WebSocketConnection {
    /// 新しいコネクションを作成
    pub fn new(execution_id: String, receiver: broadcast::Receiver<WSMessage>) -> Self {
        Self {
            execution_id,
            receiver,
        }
    }

    /// メッセージを受信（非同期）
    pub async fn receive(&mut self) -> Option<WSMessage> {
        match self.receiver.recv().await {
            Ok(message) => Some(message),
            Err(broadcast::error::RecvError::Closed) => None,
            Err(broadcast::error::RecvError::Lagged(_)) => {
                // バッファオーバーフロー（メッセージ喪失）
                warn!("websocket_receiver_lagged: {}", self.execution_id);
                None
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Redis が必要
    async fn test_websocket_manager() {
        let manager = WebSocketManager::new("redis://localhost")
            .await
            .expect("Failed to create manager");

        let msg = WSMessage::AgentStarted {
            executionId: "exec-test".to_string(),
            agentType: "CodeGen".to_string(),
            repositoryId: "repo-test".to_string(),
            issueNumber: 1,
            startedAt: "2025-10-29T12:00:00Z".to_string(),
        };

        manager
            .broadcast_message("exec-test", &msg)
            .await
            .expect("Failed to broadcast");

        assert_eq!(manager.get_subscriber_count("exec-test"), 0);
    }
}
