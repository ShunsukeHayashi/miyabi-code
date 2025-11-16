//! 並列実行制御モジュール - Worktree並列実行管理
//!
//! 複数のWorktreeを並列で実行し、リソース管理を行います。

use std::sync::Arc;
use tokio::sync::Semaphore;

/// 並列実行制御
pub struct ConcurrencyController {
    /// 最大並列数
    max_concurrency: usize,
    /// セマフォ（リソース管理）
    semaphore: Arc<Semaphore>,
}

impl ConcurrencyController {
    /// 新しい並列実行制御を作成
    pub fn new(max_concurrency: usize) -> Self {
        Self {
            max_concurrency,
            semaphore: Arc::new(Semaphore::new(max_concurrency)),
        }
    }

    /// 最大並列数を取得
    pub fn max_concurrency(&self) -> usize {
        self.max_concurrency
    }

    /// 利用可能なスロット数を取得
    pub fn available_permits(&self) -> usize {
        self.semaphore.available_permits()
    }

    /// 実行許可を取得（非同期）
    pub async fn acquire(&self) -> tokio::sync::SemaphorePermit<'_> {
        self.semaphore.acquire().await.expect("Semaphore closed unexpectedly")
    }

    /// 複数の実行許可を取得（非同期）
    pub async fn acquire_many(&self, n: usize) -> tokio::sync::SemaphorePermit<'_> {
        self.semaphore
            .acquire_many(n as u32)
            .await
            .expect("Semaphore closed unexpectedly")
    }
}

impl Default for ConcurrencyController {
    fn default() -> Self {
        Self::new(3) // デフォルトは3並列
    }
}

/// 実行スロット（RAII）
pub struct ExecutionSlot {
    _permit: tokio::sync::SemaphorePermit<'static>,
}

/// 並列実行統計
#[derive(Debug, Clone, Default)]
pub struct ConcurrencyStats {
    /// 現在実行中の数
    pub active: usize,
    /// 待機中の数
    pub waiting: usize,
    /// 完了した数
    pub completed: usize,
    /// 失敗した数
    pub failed: usize,
}

impl ConcurrencyStats {
    /// 新しい統計を作成
    pub fn new() -> Self {
        Self::default()
    }

    /// 実行開始
    pub fn start(&mut self) {
        self.active += 1;
    }

    /// 実行完了
    pub fn complete(&mut self) {
        self.active = self.active.saturating_sub(1);
        self.completed += 1;
    }

    /// 実行失敗
    pub fn fail(&mut self) {
        self.active = self.active.saturating_sub(1);
        self.failed += 1;
    }

    /// 待機追加
    pub fn add_waiting(&mut self) {
        self.waiting += 1;
    }

    /// 待機解除
    pub fn remove_waiting(&mut self) {
        self.waiting = self.waiting.saturating_sub(1);
    }

    /// 成功率を計算（パーセント）
    pub fn success_rate(&self) -> f64 {
        let total = self.completed + self.failed;
        if total == 0 {
            0.0
        } else {
            (self.completed as f64 / total as f64) * 100.0
        }
    }

    /// 総実行数
    pub fn total_executed(&self) -> usize {
        self.completed + self.failed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_concurrency_controller_creation() {
        let controller = ConcurrencyController::new(5);
        assert_eq!(controller.max_concurrency(), 5);
        assert_eq!(controller.available_permits(), 5);
    }

    #[test]
    fn test_concurrency_controller_default() {
        let controller = ConcurrencyController::default();
        assert_eq!(controller.max_concurrency(), 3);
    }

    #[tokio::test]
    async fn test_acquire_permit() {
        let controller = ConcurrencyController::new(2);
        let _permit1 = controller.acquire().await;
        assert_eq!(controller.available_permits(), 1);
        let _permit2 = controller.acquire().await;
        assert_eq!(controller.available_permits(), 0);
    }

    #[test]
    fn test_concurrency_stats() {
        let mut stats = ConcurrencyStats::new();
        stats.start();
        assert_eq!(stats.active, 1);

        stats.complete();
        assert_eq!(stats.active, 0);
        assert_eq!(stats.completed, 1);

        stats.start();
        stats.fail();
        assert_eq!(stats.failed, 1);

        assert_eq!(stats.success_rate(), 50.0);
        assert_eq!(stats.total_executed(), 2);
    }

    #[test]
    fn test_concurrency_stats_waiting() {
        let mut stats = ConcurrencyStats::new();
        stats.add_waiting();
        assert_eq!(stats.waiting, 1);

        stats.remove_waiting();
        assert_eq!(stats.waiting, 0);
    }
}
