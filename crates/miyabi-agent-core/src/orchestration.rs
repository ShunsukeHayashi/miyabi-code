//! 共通オーケストレーション層 - 全Agentの統一ライフサイクル管理
//!
//! このモジュールは、全Agentが共有する以下の機能を提供します:
//! - ライフサイクル管理 (start, execute, complete)
//! - メトリクス計測 (実行時間、成功/失敗率)
//! - リトライロジック (指数バックオフ)
//! - フォールバック戦略 (エラー時の代替処理)

use async_trait::async_trait;
use miyabi_types::{AgentResult, MiyabiError, Task};
use std::time::{Duration, Instant};
use tracing::{debug, error, info, warn};

/// オーケストレーション設定
#[derive(Debug, Clone)]
pub struct OrchestrationConfig {
    /// 最大リトライ回数
    pub max_retries: usize,
    /// 初期バックオフ時間（ミリ秒）
    pub initial_backoff_ms: u64,
    /// バックオフ乗数
    pub backoff_multiplier: f64,
    /// 最大バックオフ時間（ミリ秒）
    pub max_backoff_ms: u64,
    /// タイムアウト（秒）
    pub timeout_seconds: u64,
}

impl Default for OrchestrationConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_backoff_ms: 100,
            backoff_multiplier: 2.0,
            max_backoff_ms: 10_000,
            timeout_seconds: 300, // 5分
        }
    }
}

/// Agent実行メトリクス
#[derive(Debug, Clone)]
pub struct ExecutionMetrics {
    /// 実行開始時刻
    pub start_time: Instant,
    /// 実行終了時刻
    pub end_time: Option<Instant>,
    /// 実行時間（ミリ秒）
    pub duration_ms: Option<u64>,
    /// リトライ回数
    pub retry_count: usize,
    /// 成功フラグ
    pub success: bool,
    /// エラーメッセージ
    pub error_message: Option<String>,
}

impl ExecutionMetrics {
    /// 新しいメトリクスを作成
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            end_time: None,
            duration_ms: None,
            retry_count: 0,
            success: false,
            error_message: None,
        }
    }

    /// 実行完了を記録
    pub fn complete(&mut self, success: bool, error: Option<&MiyabiError>) {
        let end = Instant::now();
        self.end_time = Some(end);
        self.duration_ms = Some(end.duration_since(self.start_time).as_millis() as u64);
        self.success = success;
        self.error_message = error.map(|e| e.to_string());
    }
}

impl Default for ExecutionMetrics {
    fn default() -> Self {
        Self::new()
    }
}

/// オーケストレーション可能なAgent
#[async_trait]
pub trait Orchestrated: Send + Sync {
    /// Agent固有の実行ロジック
    async fn execute_internal(&self, task: &Task) -> Result<AgentResult, MiyabiError>;

    /// タスク実行前の準備処理（オプション）
    async fn pre_execute(&self, _task: &Task) -> Result<(), MiyabiError> {
        Ok(())
    }

    /// タスク実行後の後処理（オプション）
    async fn post_execute(&self, _task: &Task, _result: &AgentResult) -> Result<(), MiyabiError> {
        Ok(())
    }

    /// エラー時のフォールバック処理（オプション）
    async fn fallback(&self, _task: &Task, _error: &MiyabiError) -> Option<AgentResult> {
        None
    }
}

/// オーケストレーション実行エンジン
pub struct OrchestrationEngine {
    /// Orchestration configuration (retry, backoff, timeout)
    config: OrchestrationConfig,
}

impl OrchestrationEngine {
    /// 新しいエンジンを作成
    pub fn new(config: OrchestrationConfig) -> Self {
        Self { config }
    }
}

impl Default for OrchestrationEngine {
    fn default() -> Self {
        Self::new(OrchestrationConfig::default())
    }
}

impl OrchestrationEngine {
    /// タスクを実行（リトライ・メトリクス計測付き）
    pub async fn execute<A: Orchestrated>(&self, agent: &A, task: &Task) -> Result<AgentResult, MiyabiError> {
        let mut metrics = ExecutionMetrics::new();

        info!(
            task_id = %task.id,
            "オーケストレーション開始: タスク \"{}\"",
            task.description
        );

        // Pre-execute hook
        if let Err(e) = agent.pre_execute(task).await {
            error!(task_id = %task.id, error = %e, "事前処理失敗");
            metrics.complete(false, Some(&e));
            return Err(e);
        }

        // メイン実行（リトライ付き）
        let result = self.execute_with_retry(agent, task, &mut metrics).await;

        match &result {
            Ok(agent_result) => {
                info!(
                    task_id = %task.id,
                    duration_ms = metrics.duration_ms,
                    retry_count = metrics.retry_count,
                    "タスク実行成功"
                );

                // Post-execute hook
                if let Err(e) = agent.post_execute(task, agent_result).await {
                    warn!(task_id = %task.id, error = %e, "事後処理失敗（タスクは成功）");
                }

                metrics.complete(true, None);
            }
            Err(e) => {
                error!(
                    task_id = %task.id,
                    error = %e,
                    retry_count = metrics.retry_count,
                    "タスク実行失敗"
                );

                // フォールバック試行
                if let Some(fallback_result) = agent.fallback(task, e).await {
                    warn!(task_id = %task.id, "フォールバック成功");
                    metrics.complete(true, None);
                    return Ok(fallback_result);
                }

                metrics.complete(false, Some(e));
            }
        }

        result
    }

    /// リトライ付き実行
    async fn execute_with_retry<A: Orchestrated>(
        &self,
        agent: &A,
        task: &Task,
        metrics: &mut ExecutionMetrics,
    ) -> Result<AgentResult, MiyabiError> {
        let mut last_error = None;

        for attempt in 0..=self.config.max_retries {
            if attempt > 0 {
                metrics.retry_count = attempt;
                let backoff_ms = self.calculate_backoff(attempt);
                debug!(
                    task_id = %task.id,
                    attempt = attempt,
                    backoff_ms = backoff_ms,
                    "リトライ実行中"
                );
                tokio::time::sleep(Duration::from_millis(backoff_ms)).await;
            }

            match agent.execute_internal(task).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    warn!(
                        task_id = %task.id,
                        attempt = attempt,
                        error = %e,
                        "実行失敗"
                    );
                    last_error = Some(e);
                }
            }
        }

        Err(last_error.unwrap_or_else(|| MiyabiError::Unknown("全リトライ失敗（詳細不明）".to_string())))
    }

    /// 指数バックオフ時間を計算
    fn calculate_backoff(&self, attempt: usize) -> u64 {
        let backoff = (self.config.initial_backoff_ms as f64) * self.config.backoff_multiplier.powi(attempt as i32);
        backoff.min(self.config.max_backoff_ms as f64) as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::{agent::ResultStatus, task::TaskType, AgentType};

    struct TestAgent {
        fail_count: std::sync::Arc<std::sync::Mutex<usize>>,
    }

    #[async_trait]
    impl Orchestrated for TestAgent {
        async fn execute_internal(&self, _task: &Task) -> Result<AgentResult, MiyabiError> {
            let mut count = self.fail_count.lock().unwrap();
            if *count > 0 {
                *count -= 1;
                return Err(MiyabiError::Unknown("テスト失敗".to_string()));
            }
            Ok(AgentResult {
                status: ResultStatus::Success,
                data: Some(serde_json::json!({"status": "ok"})),
                error: None,
                metrics: None,
                escalation: None,
            })
        }
    }

    #[tokio::test]
    async fn test_orchestration_success() {
        let agent = TestAgent { fail_count: std::sync::Arc::new(std::sync::Mutex::new(0)) };

        let engine = OrchestrationEngine::default();
        let task = Task {
            id: "test-1".to_string(),
            title: "テストタスク".to_string(),
            description: "テストタスク説明".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = engine.execute(&agent, &task).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_orchestration_retry_success() {
        let agent = TestAgent {
            fail_count: std::sync::Arc::new(std::sync::Mutex::new(2)), // 2回失敗後成功
        };

        let config = OrchestrationConfig {
            max_retries: 3,
            initial_backoff_ms: 10,
            backoff_multiplier: 2.0,
            max_backoff_ms: 1000,
            timeout_seconds: 60,
        };

        let engine = OrchestrationEngine::new(config);
        let task = Task {
            id: "test-2".to_string(),
            title: "リトライテスト".to_string(),
            description: "リトライテスト説明".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = engine.execute(&agent, &task).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_orchestration_all_retries_fail() {
        let agent = TestAgent {
            fail_count: std::sync::Arc::new(std::sync::Mutex::new(10)), // 常に失敗
        };

        let config = OrchestrationConfig {
            max_retries: 2,
            initial_backoff_ms: 10,
            backoff_multiplier: 2.0,
            max_backoff_ms: 1000,
            timeout_seconds: 60,
        };

        let engine = OrchestrationEngine::new(config);
        let task = Task {
            id: "test-3".to_string(),
            title: "全失敗テスト".to_string(),
            description: "全失敗テスト説明".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = engine.execute(&agent, &task).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_backoff_calculation() {
        let config = OrchestrationConfig {
            max_retries: 5,
            initial_backoff_ms: 100,
            backoff_multiplier: 2.0,
            max_backoff_ms: 5000,
            timeout_seconds: 60,
        };

        let engine = OrchestrationEngine::new(config);

        assert_eq!(engine.calculate_backoff(0), 100);
        assert_eq!(engine.calculate_backoff(1), 200);
        assert_eq!(engine.calculate_backoff(2), 400);
        assert_eq!(engine.calculate_backoff(3), 800);
        assert_eq!(engine.calculate_backoff(4), 1600);
        assert_eq!(engine.calculate_backoff(5), 3200);
        assert_eq!(engine.calculate_backoff(10), 5000); // max_backoff_ms制限
    }
}
