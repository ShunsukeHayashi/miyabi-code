// ws/backpressure.rs
// バックプレッシャー（背圧）対策 - メッセージキューイング & 優先度管理

use super::message::WSMessage;
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{warn, debug, instrument};
use crate::error::ApiError;

/// メッセージキューイング & バックプレッシャー管理
pub struct BackpressureManager {
    /// 実行 ID → メッセージキュー
    queues: Arc<DashMap<String, mpsc::Sender<WSMessage>>>,

    /// キューサイズ設定
    config: BackpressureConfig,
}

/// バックプレッシャー設定
#[derive(Clone, Debug)]
pub struct BackpressureConfig {
    /// キューの最大メッセージ数
    pub max_queue_size: usize,

    /// キューが満杯時の動作
    pub overflow_strategy: OverflowStrategy,

    /// 統計情報
    pub stats: Arc<BackpressureStats>,
}

#[derive(Clone, Debug)]
pub struct BackpressureStats {
    pub total_dropped: Arc<std::sync::atomic::AtomicU64>,
    pub total_queued: Arc<std::sync::atomic::AtomicU64>,
    pub peak_queue_size: Arc<std::sync::atomic::AtomicUsize>,
}

/// キューがいっぱいときの動作
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum OverflowStrategy {
    /// 最も優先度の低いメッセージを破棄
    DropLowest,

    /// 最も古いメッセージを破棄（FIFO）
    DropOldest,

    /// 新規メッセージを拒否
    RejectNewest,
}

impl Default for BackpressureConfig {
    fn default() -> Self {
        Self {
            max_queue_size: 1000,
            overflow_strategy: OverflowStrategy::DropLowest,
            stats: Arc::new(BackpressureStats {
                total_dropped: Arc::new(std::sync::atomic::AtomicU64::new(0)),
                total_queued: Arc::new(std::sync::atomic::AtomicU64::new(0)),
                peak_queue_size: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            }),
        }
    }
}

impl BackpressureManager {
    /// 新しいマネージャーを作成
    pub fn new(config: BackpressureConfig) -> Self {
        Self {
            queues: Arc::new(DashMap::new()),
            config,
        }
    }

    /// メッセージをキューに追加
    #[instrument(skip(self), fields(execution_id = %execution_id, message_type = %message.message_type()))]
    pub async fn enqueue(
        &self,
        execution_id: &str,
        message: WSMessage,
    ) -> Result<(), ApiError> {
        // キューを取得または作成
        let queue = match self.queues.get(execution_id) {
            Some(q) => q.value().clone(),
            None => {
                let (tx, mut rx) = mpsc::channel(self.config.max_queue_size);

                tokio::spawn(async move {
                    while rx.recv().await.is_some() {
                        // Drop messages when no consumer is attached yet to keep the channel alive
                    }
                });

                self.queues.insert(execution_id.to_string(), tx.clone());
                tx
            }
        };

        // メッセージ送信を試みる
        match queue.try_send(message.clone()) {
            Ok(_) => {
                // キューイング成功
                self.config.stats.total_queued.fetch_add(
                    1,
                    std::sync::atomic::Ordering::Relaxed,
                );
                Ok(())
            }
            Err(mpsc::error::TrySendError::Full(_)) => {
                // キューが満杯 → オーバーフロー戦略を適用
                self.handle_overflow(execution_id, message).await
            }
            Err(mpsc::error::TrySendError::Closed(_)) => {
                // チャネルが閉じられた（購読者がいない）
                warn!("queue_closed: {}", execution_id);
                self.queues.remove(execution_id);
                Err(ApiError::Server("Queue is closed".to_string()))
            }
        }
    }

    /// オーバーフロー時の処理
    async fn handle_overflow(
        &self,
        execution_id: &str,
        new_message: WSMessage,
    ) -> Result<(), ApiError> {
        match self.config.overflow_strategy {
            OverflowStrategy::DropLowest => {
                // 最も優先度の低いメッセージを破棄して、新規メッセージをキューイング
                warn!("dropping_lowest_priority_message: {}", execution_id);
                self.config.stats.total_dropped.fetch_add(
                    1,
                    std::sync::atomic::Ordering::Relaxed,
                );

                // キューを再作成（最も古いメッセージが削除される）
                if let Some((_, _queue)) = self.queues.remove(execution_id) {
                    let (tx, _) = mpsc::channel(self.config.max_queue_size);
                    self.queues.insert(execution_id.to_string(), tx.clone());

                    // 新規メッセージを送信
                    tx.try_send(new_message)
                        .map_err(|_| ApiError::Server("Failed to queue message".to_string()))
                } else {
                    Err(ApiError::Server("Queue not found".to_string()))
                }
            }

            OverflowStrategy::DropOldest => {
                // 最も古いメッセージを破棄
                warn!("dropping_oldest_message: {}", execution_id);
                self.config.stats.total_dropped.fetch_add(
                    1,
                    std::sync::atomic::Ordering::Relaxed,
                );

                // キュー再作成で効果的に FIFO 削除を実現
                if let Some((_, _queue)) = self.queues.remove(execution_id) {
                    let (tx, _) = mpsc::channel(self.config.max_queue_size);
                    self.queues.insert(execution_id.to_string(), tx.clone());

                    tx.try_send(new_message)
                        .map_err(|_| ApiError::Server("Failed to queue message".to_string()))
                } else {
                    Err(ApiError::Server("Queue not found".to_string()))
                }
            }

            OverflowStrategy::RejectNewest => {
                // 新規メッセージを拒否
                warn!("rejecting_new_message: {}", execution_id);
                self.config.stats.total_dropped.fetch_add(
                    1,
                    std::sync::atomic::Ordering::Relaxed,
                );
                Err(ApiError::Server("Queue is full".to_string()))
            }
        }
    }

    /// キューサイズを取得
    pub fn get_queue_size(&self, execution_id: &str) -> usize {
        match self.queues.get(execution_id) {
            Some(queue) => self.config.max_queue_size - queue.capacity(),
            None => 0,
        }
    }

    /// 統計情報を取得
    pub fn get_stats(&self) -> (u64, u64) {
        let dropped = self.config.stats.total_dropped.load(std::sync::atomic::Ordering::Relaxed);
        let queued = self.config.stats.total_queued.load(std::sync::atomic::Ordering::Relaxed);
        (queued, dropped)
    }

    /// 全キューをリセット
    pub fn reset_all(&self) {
        self.queues.clear();
        self.config.stats.total_dropped.store(0, std::sync::atomic::Ordering::Relaxed);
        self.config.stats.total_queued.store(0, std::sync::atomic::Ordering::Relaxed);
        debug!("all_queues_reset");
    }

    /// キューのヘルスチェック
    pub fn health_check(&self) -> HealthStatus {
        let mut max_queue = 0;
        let mut total_queues = 0;

        for entry in self.queues.iter() {
            total_queues += 1;
            let size = self.config.max_queue_size - entry.value().capacity();
            max_queue = max_queue.max(size);
        }

        let utilization = if self.config.max_queue_size > 0 {
            (max_queue * 100) / self.config.max_queue_size
        } else {
            0
        };

        HealthStatus {
            active_queues: total_queues,
            max_queue_utilization: utilization,
            is_healthy: utilization < 80,
        }
    }
}

/// ヘルスチェック結果
#[derive(Debug, Clone)]
pub struct HealthStatus {
    /// アクティブなキュー数
    pub active_queues: usize,
    /// 最大キュー使用率（%）
    pub max_queue_utilization: usize,
    /// ヘルシーかどうか（80% 未満）
    pub is_healthy: bool,
}

/// 優先度ベースのメッセージキュー実装
/// より精密なバックプレッシャー制御が必要な場合
pub struct PriorityQueue {
    high_priority: Arc<DashMap<String, Vec<WSMessage>>>,
    normal_priority: Arc<DashMap<String, Vec<WSMessage>>>,
    low_priority: Arc<DashMap<String, Vec<WSMessage>>>,
    max_size: usize,
}

impl PriorityQueue {
    pub fn new(max_size: usize) -> Self {
        Self {
            high_priority: Arc::new(DashMap::new()),
            normal_priority: Arc::new(DashMap::new()),
            low_priority: Arc::new(DashMap::new()),
            max_size,
        }
    }

    /// 優先度付きキューイング
    pub fn enqueue(&self, execution_id: &str, message: WSMessage) -> Result<(), ApiError> {
        let priority = message.priority();

        let queue = if priority >= 75 {
            &self.high_priority
        } else if priority >= 50 {
            &self.normal_priority
        } else {
            &self.low_priority
        };

        match queue.get_mut(execution_id) {
            Some(mut messages) => {
                if messages.len() < self.max_size {
                    messages.push(message);
                    Ok(())
                } else {
                    Err(ApiError::Server("Queue full".to_string()))
                }
            }
            None => {
                queue.insert(execution_id.to_string(), vec![message]);
                Ok(())
            }
        }
    }

    /// 優先度順にメッセージを取得
    pub fn dequeue(&self, execution_id: &str) -> Option<WSMessage> {
        // 優先度順に取得
        if let Some(mut messages) = self.high_priority.get_mut(execution_id) {
            if !messages.is_empty() {
                return Some(messages.remove(0));
            }
        }

        if let Some(mut messages) = self.normal_priority.get_mut(execution_id) {
            if !messages.is_empty() {
                return Some(messages.remove(0));
            }
        }

        if let Some(mut messages) = self.low_priority.get_mut(execution_id) {
            if !messages.is_empty() {
                return Some(messages.remove(0));
            }
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_backpressure_overflow() {
        let config = BackpressureConfig {
            max_queue_size: 100,
            overflow_strategy: OverflowStrategy::DropLowest,
            ..Default::default()
        };

        let manager = BackpressureManager::new(config);

        let msg = WSMessage::AgentProgress {
            executionId: "exec-test".to_string(),
            progress: 50,
            message: None,
            step: None,
        };

        let result = manager.enqueue("exec-test", msg).await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_priority_queue() {
        let queue = PriorityQueue::new(100);

        let high_priority = WSMessage::Auth {
            token: "token".to_string(),
        };

        let low_priority = WSMessage::AgentLog {
            executionId: "exec".to_string(),
            level: super::super::message::LogLevel::Debug,
            message: "log".to_string(),
            timestamp: "2025-10-29T12:00:00Z".to_string(),
        };

        assert!(queue.enqueue("exec", high_priority).is_ok());
        assert!(queue.enqueue("exec", low_priority).is_ok());
    }
}
