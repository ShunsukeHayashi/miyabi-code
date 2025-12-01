//! Base agent trait and implementation
//!
//! このモジュールは、全Agentの基底traitを定義します。
//! BaseAgentを実装すると、自動的にOrchestrated traitも実装され、
//! リトライ・メトリクス・ライフサイクル管理が利用可能になります。

use async_trait::async_trait;
use miyabi_types::error::Result;
use miyabi_types::{AgentResult, AgentType, MiyabiError, Task};

/// 全Agentが実装すべき基底trait
#[async_trait]
pub trait BaseAgent: Send + Sync {
    /// Agent種別を返す
    fn agent_type(&self) -> AgentType;

    /// タスクを実行（コア処理）
    async fn execute(&self, task: &Task) -> Result<AgentResult>;

    /// タスクを実行（基本的なライフサイクル管理付き）
    ///
    /// 注: より高度なリトライ・メトリクス機能が必要な場合は、
    /// OrchestrationEngineを使用してください。
    async fn run(&self, task: &Task) -> Result<AgentResult> {
        tracing::info!("Agent {:?} starting task: {}", self.agent_type(), task.id);
        let result = self.execute(task).await?;
        tracing::info!("Agent {:?} completed task: {}", self.agent_type(), task.id);
        Ok(result)
    }
}

/// BaseAgentを実装した全Agentに対して、自動的にOrchestrated traitを実装
///
/// これにより、既存のAgentコードを変更することなく、
/// OrchestrationEngineでオーケストレーション機能が利用可能になります。
#[async_trait]
impl<T: BaseAgent> super::orchestration::Orchestrated for T {
    async fn execute_internal(&self, task: &Task) -> Result<AgentResult> {
        self.execute(task).await
    }

    async fn pre_execute(&self, task: &Task) -> std::result::Result<(), MiyabiError> {
        tracing::debug!(
            agent_type = ?self.agent_type(),
            task_id = %task.id,
            "Agent事前処理開始"
        );
        Ok(())
    }

    async fn post_execute(&self, task: &Task, result: &AgentResult) -> std::result::Result<(), MiyabiError> {
        tracing::debug!(
            agent_type = ?self.agent_type(),
            task_id = %task.id,
            result_status = ?result.status,
            "Agent事後処理完了"
        );
        Ok(())
    }

    async fn fallback(&self, task: &Task, error: &MiyabiError) -> Option<AgentResult> {
        tracing::warn!(
            agent_type = ?self.agent_type(),
            task_id = %task.id,
            error = %error,
            "フォールバック処理は実装されていません"
        );
        None
    }
}
