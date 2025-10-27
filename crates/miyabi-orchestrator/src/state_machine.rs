//! State Machine for Autonomous Workflow Execution
//!
//! This module implements the state machine that controls the 9-phase
//! autonomous workflow execution from Issue creation to PR merge.

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// The 9 phases of the autonomous workflow
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Phase {
    /// Phase 1: Issue Creation & Analysis (2-3 min)
    IssueAnalysis,

    /// Phase 2: Task Decomposition & DAG Creation (3-5 min)
    TaskDecomposition,

    /// Phase 3: Worktree Creation & Agent Assignment (30 sec)
    WorktreeCreation,

    /// Phase 4: Claude Code Execution (8-10 min per task)
    CodeGeneration,

    /// Phase 5: Parallel Task Execution (15-20 min for 5 parallel tasks)
    ParallelExecution,

    /// Phase 6: Quality Checks (2-3 min)
    QualityCheck,

    /// Phase 7: PR Creation (1 min)
    PRCreation,

    /// Phase 8: Code Review (3-5 min)
    CodeReview,

    /// Phase 9: Auto-Merge & Deployment (2-3 min)
    AutoMerge,
}

impl Phase {
    /// Get the next phase in the workflow
    pub fn next(&self) -> Option<Phase> {
        match self {
            Phase::IssueAnalysis => Some(Phase::TaskDecomposition),
            Phase::TaskDecomposition => Some(Phase::WorktreeCreation),
            Phase::WorktreeCreation => Some(Phase::CodeGeneration),
            Phase::CodeGeneration => Some(Phase::ParallelExecution),
            Phase::ParallelExecution => Some(Phase::QualityCheck),
            Phase::QualityCheck => Some(Phase::PRCreation),
            Phase::PRCreation => Some(Phase::CodeReview),
            Phase::CodeReview => Some(Phase::AutoMerge),
            Phase::AutoMerge => None, // Final phase
        }
    }

    /// Check if this is the final phase
    pub fn is_final(&self) -> bool {
        matches!(self, Phase::AutoMerge)
    }

    /// Get estimated duration for this phase in minutes
    pub fn estimated_duration_minutes(&self) -> u32 {
        match self {
            Phase::IssueAnalysis => 3,
            Phase::TaskDecomposition => 5,
            Phase::WorktreeCreation => 1,
            Phase::CodeGeneration => 10,
            Phase::ParallelExecution => 20,
            Phase::QualityCheck => 3,
            Phase::PRCreation => 1,
            Phase::CodeReview => 5,
            Phase::AutoMerge => 3,
        }
    }

    /// Get all phases in order
    pub fn all() -> Vec<Phase> {
        vec![
            Phase::IssueAnalysis,
            Phase::TaskDecomposition,
            Phase::WorktreeCreation,
            Phase::CodeGeneration,
            Phase::ParallelExecution,
            Phase::QualityCheck,
            Phase::PRCreation,
            Phase::CodeReview,
            Phase::AutoMerge,
        ]
    }
}

impl fmt::Display for Phase {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Phase::IssueAnalysis => write!(f, "Issue Analysis"),
            Phase::TaskDecomposition => write!(f, "Task Decomposition"),
            Phase::WorktreeCreation => write!(f, "Worktree Creation"),
            Phase::CodeGeneration => write!(f, "Code Generation"),
            Phase::ParallelExecution => write!(f, "Parallel Execution"),
            Phase::QualityCheck => write!(f, "Quality Check"),
            Phase::PRCreation => write!(f, "PR Creation"),
            Phase::CodeReview => write!(f, "Code Review"),
            Phase::AutoMerge => write!(f, "Auto-Merge"),
        }
    }
}

/// State of an execution session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionState {
    /// Unique execution ID
    pub execution_id: Uuid,

    /// Current phase
    pub current_phase: Phase,

    /// Issue number being processed
    pub issue_number: u64,

    /// Execution start time
    pub started_at: DateTime<Utc>,

    /// Last update time
    pub updated_at: DateTime<Utc>,

    /// Phase-specific metadata
    pub metadata: serde_json::Value,

    /// Whether execution is stuck
    pub is_stuck: bool,

    /// Whether execution has timed out
    pub has_timed_out: bool,

    /// Whether execution is completed
    pub is_completed: bool,
}

impl ExecutionState {
    /// Create a new execution state
    pub fn new(issue_number: u64) -> Self {
        Self {
            execution_id: Uuid::new_v4(),
            current_phase: Phase::IssueAnalysis,
            issue_number,
            started_at: Utc::now(),
            updated_at: Utc::now(),
            metadata: serde_json::json!({}),
            is_stuck: false,
            has_timed_out: false,
            is_completed: false,
        }
    }

    /// Check if execution is taking too long
    pub fn exceeded_timeout(&self) -> bool {
        let elapsed = Utc::now() - self.started_at;
        // Total workflow timeout: 60 minutes
        elapsed.num_minutes() > 60
    }

    /// Check if execution is stuck (no update in 10 minutes)
    pub fn check_is_stuck(&self) -> bool {
        let since_update = Utc::now() - self.updated_at;
        since_update.num_minutes() > 10
    }
}

/// State machine for workflow execution
pub struct StateMachine {
    /// Current execution state
    state: ExecutionState,
}

impl StateMachine {
    /// Create a new state machine
    pub fn new(issue_number: u64) -> Self {
        info!("🚀 Starting new execution for Issue #{}", issue_number);
        Self {
            state: ExecutionState::new(issue_number),
        }
    }

    /// Create from existing state
    pub fn from_state(state: ExecutionState) -> Self {
        Self { state }
    }

    /// Get current phase
    pub fn current_phase(&self) -> Phase {
        self.state.current_phase
    }

    /// Get execution ID
    pub fn execution_id(&self) -> Uuid {
        self.state.execution_id
    }

    /// Get current state
    pub fn state(&self) -> &ExecutionState {
        &self.state
    }

    /// Transition to next phase
    pub fn transition_to_next(&mut self) -> Result<Phase> {
        let current = self.state.current_phase;

        if let Some(next_phase) = current.next() {
            self.transition_to(next_phase)?;
            Ok(next_phase)
        } else {
            Err(anyhow!("Already at final phase: {:?}", current))
        }
    }

    /// Transition to specific phase
    pub fn transition_to(&mut self, to: Phase) -> Result<()> {
        let from = self.state.current_phase;

        // Validate transition
        if !self.is_valid_transition(&from, &to) {
            return Err(anyhow!(
                "Invalid state transition: {} -> {}",
                from,
                to
            ));
        }

        info!(
            "📍 State transition for Issue #{}: {} -> {}",
            self.state.issue_number, from, to
        );

        // Update state
        self.state.current_phase = to;
        self.state.updated_at = Utc::now();

        // Check if completed
        if to.is_final() {
            self.state.is_completed = true;
            info!(
                "✅ Execution completed for Issue #{} in {} minutes",
                self.state.issue_number,
                (self.state.updated_at - self.state.started_at).num_minutes()
            );
        }

        debug!(
            "State updated: execution_id={}, phase={:?}",
            self.state.execution_id, to
        );

        Ok(())
    }

    /// Check if transition is valid
    fn is_valid_transition(&self, from: &Phase, to: &Phase) -> bool {
        // Can always transition to the same phase (retry)
        if from == to {
            return true;
        }

        // Can transition to next phase
        if let Some(next) = from.next() {
            if next == *to {
                return true;
            }
        }

        // Can skip to CodeReview from QualityCheck if quality is high
        if matches!(from, Phase::QualityCheck) && matches!(to, Phase::CodeReview) {
            return true;
        }

        // Can go back to CodeGeneration from QualityCheck (retry)
        if matches!(from, Phase::QualityCheck) && matches!(to, Phase::CodeGeneration) {
            return true;
        }

        false
    }

    /// Update metadata
    pub fn update_metadata(&mut self, metadata: serde_json::Value) {
        self.state.metadata = metadata;
        self.state.updated_at = Utc::now();
    }

    /// Mark as stuck
    pub fn mark_stuck(&mut self) {
        warn!(
            "⚠️  Execution {} marked as stuck",
            self.state.execution_id
        );
        self.state.is_stuck = true;
        self.state.updated_at = Utc::now();
    }

    /// Mark as timed out
    pub fn mark_timed_out(&mut self) {
        warn!(
            "⏰ Execution {} timed out",
            self.state.execution_id
        );
        self.state.has_timed_out = true;
        self.state.updated_at = Utc::now();
    }

    /// Get progress percentage (0-100)
    pub fn progress_percentage(&self) -> u8 {
        let phases = Phase::all();
        let current_index = phases
            .iter()
            .position(|p| p == &self.state.current_phase)
            .unwrap_or(0);

        ((current_index as f64 / phases.len() as f64) * 100.0) as u8
    }

    /// Get estimated time remaining in minutes
    pub fn estimated_time_remaining_minutes(&self) -> u32 {
        let current = self.state.current_phase;
        let mut remaining = 0;

        let mut found = false;
        for phase in Phase::all() {
            if phase == current {
                found = true;
            }
            if found {
                remaining += phase.estimated_duration_minutes();
            }
        }

        remaining
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phase_progression() {
        assert_eq!(
            Phase::IssueAnalysis.next(),
            Some(Phase::TaskDecomposition)
        );
        assert_eq!(
            Phase::TaskDecomposition.next(),
            Some(Phase::WorktreeCreation)
        );
        assert_eq!(Phase::AutoMerge.next(), None);
    }

    #[test]
    fn test_phase_is_final() {
        assert!(!Phase::IssueAnalysis.is_final());
        assert!(!Phase::CodeReview.is_final());
        assert!(Phase::AutoMerge.is_final());
    }

    #[test]
    fn test_state_machine_creation() {
        let sm = StateMachine::new(123);
        assert_eq!(sm.current_phase(), Phase::IssueAnalysis);
        assert_eq!(sm.state().issue_number, 123);
        assert!(!sm.state().is_completed);
    }

    #[test]
    fn test_state_machine_transition() {
        let mut sm = StateMachine::new(123);

        // Valid transition
        assert!(sm.transition_to(Phase::TaskDecomposition).is_ok());
        assert_eq!(sm.current_phase(), Phase::TaskDecomposition);

        // Invalid transition (skip phases)
        assert!(sm.transition_to(Phase::CodeReview).is_err());
    }

    #[test]
    fn test_transition_to_next() {
        let mut sm = StateMachine::new(123);

        let next = sm.transition_to_next().unwrap();
        assert_eq!(next, Phase::TaskDecomposition);
        assert_eq!(sm.current_phase(), Phase::TaskDecomposition);
    }

    #[test]
    fn test_progress_percentage() {
        let mut sm = StateMachine::new(123);

        assert_eq!(sm.progress_percentage(), 0); // IssueAnalysis = 0/9

        // Progress to QualityCheck properly
        sm.transition_to(Phase::TaskDecomposition).unwrap();
        sm.transition_to(Phase::WorktreeCreation).unwrap();
        sm.transition_to(Phase::CodeGeneration).unwrap();
        sm.transition_to(Phase::ParallelExecution).unwrap();
        sm.transition_to(Phase::QualityCheck).unwrap();

        assert!(sm.progress_percentage() > 50); // QualityCheck = 5/9
    }

    #[test]
    fn test_completion() {
        let mut sm = StateMachine::new(123);

        // Progress through all phases
        while let Ok(_) = sm.transition_to_next() {}

        assert_eq!(sm.current_phase(), Phase::AutoMerge);
        assert!(sm.state().is_completed);
    }

    #[test]
    fn test_retry_same_phase() {
        let mut sm = StateMachine::new(123);

        // Can retry same phase
        assert!(sm.transition_to(Phase::IssueAnalysis).is_ok());
        assert_eq!(sm.current_phase(), Phase::IssueAnalysis);
    }

    #[test]
    fn test_quality_check_to_code_gen_retry() {
        let mut sm = StateMachine::new(123);

        // Progress to QualityCheck properly
        sm.transition_to(Phase::TaskDecomposition).unwrap();
        sm.transition_to(Phase::WorktreeCreation).unwrap();
        sm.transition_to(Phase::CodeGeneration).unwrap();
        sm.transition_to(Phase::ParallelExecution).unwrap();
        sm.transition_to(Phase::QualityCheck).unwrap();

        // Can go back to CodeGeneration for retry
        assert!(sm.transition_to(Phase::CodeGeneration).is_ok());
        assert_eq!(sm.current_phase(), Phase::CodeGeneration);
    }

    #[test]
    fn test_estimated_time_remaining() {
        let mut sm = StateMachine::new(123);

        let initial_time = sm.estimated_time_remaining_minutes();
        assert!(initial_time > 40); // Should be around 51 minutes

        // Progress to AutoMerge properly
        while let Ok(_) = sm.transition_to_next() {}

        let final_time = sm.estimated_time_remaining_minutes();
        assert_eq!(final_time, 3); // Only AutoMerge remaining
    }
}
