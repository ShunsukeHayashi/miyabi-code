//! テレメトリ・監視モジュール - Worktree実行の記録・監視
//!
//! 実行メトリクス、ログ、トレースを管理します。

use std::time::{Duration, Instant};
use tracing::{debug, error, info, warn};

/// Worktree実行イベント
#[derive(Debug, Clone)]
pub enum WorktreeEvent {
    /// 作成開始
    CreateStart {
        worktree_id: String,
        branch_name: String,
    },
    /// 作成完了
    CreateComplete {
        worktree_id: String,
        duration: Duration,
    },
    /// 実行開始
    ExecuteStart {
        worktree_id: String,
        agent_type: String,
    },
    /// 実行完了
    ExecuteComplete {
        worktree_id: String,
        duration: Duration,
        success: bool,
    },
    /// クリーンアップ開始
    CleanupStart { worktree_id: String },
    /// クリーンアップ完了
    CleanupComplete {
        worktree_id: String,
        duration: Duration,
    },
    /// エラー発生
    Error {
        worktree_id: String,
        error_message: String,
    },
}

/// テレメトリコレクター
pub struct TelemetryCollector {
    events: Vec<WorktreeEvent>,
}

impl TelemetryCollector {
    /// 新しいコレクターを作成
    pub fn new() -> Self {
        Self { events: Vec::new() }
    }

    /// イベントを記録
    pub fn record(&mut self, event: WorktreeEvent) {
        // 構造化ログ出力
        match &event {
            WorktreeEvent::CreateStart {
                worktree_id,
                branch_name,
            } => {
                info!(
                    worktree_id = %worktree_id,
                    branch = %branch_name,
                    "Worktree作成開始"
                );
            }
            WorktreeEvent::CreateComplete {
                worktree_id,
                duration,
            } => {
                info!(
                    worktree_id = %worktree_id,
                    duration_ms = duration.as_millis(),
                    "Worktree作成完了"
                );
            }
            WorktreeEvent::ExecuteStart {
                worktree_id,
                agent_type,
            } => {
                info!(
                    worktree_id = %worktree_id,
                    agent = %agent_type,
                    "Agent実行開始"
                );
            }
            WorktreeEvent::ExecuteComplete {
                worktree_id,
                duration,
                success,
            } => {
                if *success {
                    info!(
                        worktree_id = %worktree_id,
                        duration_ms = duration.as_millis(),
                        "Agent実行成功"
                    );
                } else {
                    warn!(
                        worktree_id = %worktree_id,
                        duration_ms = duration.as_millis(),
                        "Agent実行失敗"
                    );
                }
            }
            WorktreeEvent::CleanupStart { worktree_id } => {
                debug!(worktree_id = %worktree_id, "クリーンアップ開始");
            }
            WorktreeEvent::CleanupComplete {
                worktree_id,
                duration,
            } => {
                debug!(
                    worktree_id = %worktree_id,
                    duration_ms = duration.as_millis(),
                    "クリーンアップ完了"
                );
            }
            WorktreeEvent::Error {
                worktree_id,
                error_message,
            } => {
                error!(
                    worktree_id = %worktree_id,
                    error = %error_message,
                    "Worktreeエラー"
                );
            }
        }

        self.events.push(event);
    }

    /// 全イベントを取得
    pub fn events(&self) -> &[WorktreeEvent] {
        &self.events
    }

    /// 統計を生成
    pub fn generate_stats(&self) -> TelemetryStats {
        let mut stats = TelemetryStats::default();

        for event in &self.events {
            match event {
                WorktreeEvent::CreateComplete { .. } => stats.creates += 1,
                WorktreeEvent::ExecuteComplete { success, duration, .. } => {
                    stats.executions += 1;
                    if *success {
                        stats.successful_executions += 1;
                    } else {
                        stats.failed_executions += 1;
                    }
                    stats.total_execution_time += *duration;
                }
                WorktreeEvent::CleanupComplete { .. } => stats.cleanups += 1,
                WorktreeEvent::Error { .. } => stats.errors += 1,
                _ => {}
            }
        }

        stats
    }

    /// レポートを生成（人間可読形式）
    pub fn generate_report(&self) -> String {
        let stats = self.generate_stats();
        format!(
            "📊 Worktree実行レポート\n\
             - 作成: {}回\n\
             - 実行: {}回（成功: {}, 失敗: {}）\n\
             - クリーンアップ: {}回\n\
             - エラー: {}回\n\
             - 平均実行時間: {:.2}秒\n\
             - 成功率: {:.1}%",
            stats.creates,
            stats.executions,
            stats.successful_executions,
            stats.failed_executions,
            stats.cleanups,
            stats.errors,
            stats.average_execution_time().as_secs_f64(),
            stats.success_rate()
        )
    }
}

impl Default for TelemetryCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// テレメトリ統計
#[derive(Debug, Clone, Default)]
pub struct TelemetryStats {
    pub creates: usize,
    pub executions: usize,
    pub successful_executions: usize,
    pub failed_executions: usize,
    pub cleanups: usize,
    pub errors: usize,
    pub total_execution_time: Duration,
}

impl TelemetryStats {
    /// 平均実行時間を計算
    pub fn average_execution_time(&self) -> Duration {
        if self.executions == 0 {
            Duration::ZERO
        } else {
            self.total_execution_time / self.executions as u32
        }
    }

    /// 成功率を計算（パーセント）
    pub fn success_rate(&self) -> f64 {
        if self.executions == 0 {
            0.0
        } else {
            (self.successful_executions as f64 / self.executions as f64) * 100.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telemetry_collector_creation() {
        let collector = TelemetryCollector::new();
        assert_eq!(collector.events().len(), 0);
    }

    #[test]
    fn test_record_event() {
        let mut collector = TelemetryCollector::new();
        collector.record(WorktreeEvent::CreateStart {
            worktree_id: "test-1".to_string(),
            branch_name: "feature/test".to_string(),
        });
        assert_eq!(collector.events().len(), 1);
    }

    #[test]
    fn test_generate_stats() {
        let mut collector = TelemetryCollector::new();

        collector.record(WorktreeEvent::CreateComplete {
            worktree_id: "test-1".to_string(),
            duration: Duration::from_secs(1),
        });

        collector.record(WorktreeEvent::ExecuteComplete {
            worktree_id: "test-1".to_string(),
            duration: Duration::from_secs(2),
            success: true,
        });

        let stats = collector.generate_stats();
        assert_eq!(stats.creates, 1);
        assert_eq!(stats.executions, 1);
        assert_eq!(stats.successful_executions, 1);
        assert_eq!(stats.success_rate(), 100.0);
    }

    #[test]
    fn test_generate_report() {
        let mut collector = TelemetryCollector::new();

        collector.record(WorktreeEvent::CreateComplete {
            worktree_id: "test-1".to_string(),
            duration: Duration::from_secs(1),
        });

        let report = collector.generate_report();
        assert!(report.contains("作成: 1回"));
    }

    #[test]
    fn test_telemetry_stats_average() {
        let stats = TelemetryStats {
            executions: 2,
            total_execution_time: Duration::from_secs(10),
            ..Default::default()
        };

        assert_eq!(stats.average_execution_time(), Duration::from_secs(5));
    }
}
