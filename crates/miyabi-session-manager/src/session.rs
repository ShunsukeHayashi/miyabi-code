//! Session data structures

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::process::Child;
use uuid::Uuid;

/// Workflow phase - これはmiyabi-orchestratorのPhaseと同等
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Phase {
    IssueAnalysis,
    TaskDecomposition,
    WorktreeCreation,
    CodeGeneration,
    Review,
    Test,
    PullRequest,
    CICD,
    Merge,
}

/// 管理対象のClaude Codeセッション
#[derive(Debug, Serialize, Deserialize)]
pub struct ManagedSession {
    /// セッションID
    pub id: Uuid,

    /// Agent名（例: "CodeGenAgent"）
    pub agent_name: String,

    /// セッションの目的
    pub purpose: String,

    /// セッションコンテキスト
    pub context: SessionContext,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// セッション状態
    pub status: SessionStatus,

    /// 親セッションID（引き継ぎ元）
    pub parent_session: Option<Uuid>,

    /// 子セッションIDリスト（引き継ぎ先）
    pub child_sessions: Vec<Uuid>,

    /// 引き継ぎ先Agent名
    pub handoff_to: Option<String>,

    /// エラーメッセージ（失敗時）
    pub error_message: Option<String>,

    /// プロセスID（Childは永続化しない）
    #[serde(skip)]
    pub child: Option<Child>,
}

impl ManagedSession {
    /// 新しいセッションを作成
    pub fn new(
        id: Uuid,
        agent_name: &str,
        purpose: &str,
        context: SessionContext,
        child: Option<Child>,
    ) -> Self {
        Self {
            id,
            agent_name: agent_name.to_string(),
            purpose: purpose.to_string(),
            context,
            created_at: Utc::now(),
            status: SessionStatus::Active,
            parent_session: None,
            child_sessions: vec![],
            handoff_to: None,
            error_message: None,
            child,
        }
    }
}

// Childはクローンできないため、手動実装（childはNoneにする）
impl Clone for ManagedSession {
    fn clone(&self) -> Self {
        Self {
            id: self.id,
            agent_name: self.agent_name.clone(),
            purpose: self.purpose.clone(),
            context: self.context.clone(),
            created_at: self.created_at,
            status: self.status,
            parent_session: self.parent_session,
            child_sessions: self.child_sessions.clone(),
            handoff_to: self.handoff_to.clone(),
            error_message: self.error_message.clone(),
            child: None, // Childはクローン不可のためNone
        }
    }
}

/// セッションコンテキスト - Agent実行に必要な情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionContext {
    /// 作業中のIssue番号
    pub issue_number: Option<u64>,

    /// 現在のフェーズ
    pub current_phase: Phase,

    /// Worktreeパス
    pub worktree_path: Option<PathBuf>,

    /// 前回のAgent実行結果
    #[serde(skip)]
    pub previous_results: Vec<AgentResult>,
}

/// Agent実行結果
#[derive(Debug, Clone)]
pub enum AgentResult {
    IssueAnalysis {
        complexity: f64,
        estimated_duration: u64,
    },
    TaskDecomposition {
        tasks: Vec<String>,
    },
    CodeGeneration {
        confidence: f64,
        successful_worlds: usize,
    },
    Review {
        quality_score: f64,
        issues_found: usize,
    },
}

/// セッション状態
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionStatus {
    /// アクティブ（実行中）
    Active,

    /// 引き継ぎ済み
    HandedOff,

    /// 完了
    Completed,

    /// 失敗
    Failed,
}
