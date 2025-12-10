//! Workflow state management and persistence

use crate::error::Result;
use crate::workflow::{ExecutionStatus, WorkflowResult};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Workflow execution state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowState {
    pub workflow_id: String,
    pub execution_id: String,
    pub status: ExecutionStatus,
    pub current_node: Option<String>,
    pub completed_nodes: Vec<String>,
    pub node_outputs: HashMap<String, serde_json::Value>,
    pub variables: HashMap<String, serde_json::Value>,
    pub checkpoint_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl WorkflowState {
    /// Create a new workflow state
    pub fn new(workflow_id: &str, execution_id: &str) -> Self {
        let now = chrono::Utc::now();
        Self {
            workflow_id: workflow_id.to_string(),
            execution_id: execution_id.to_string(),
            status: ExecutionStatus::Pending,
            current_node: None,
            completed_nodes: Vec::new(),
            node_outputs: HashMap::new(),
            variables: HashMap::new(),
            checkpoint_id: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Mark node as completed
    pub fn complete_node(&mut self, node_id: &str, output: serde_json::Value) {
        self.completed_nodes.push(node_id.to_string());
        self.node_outputs.insert(node_id.to_string(), output);
        self.current_node = None;
        self.updated_at = chrono::Utc::now();
    }

    /// Set current executing node
    pub fn set_current_node(&mut self, node_id: &str) {
        self.current_node = Some(node_id.to_string());
        self.updated_at = chrono::Utc::now();
    }

    /// Update status
    pub fn set_status(&mut self, status: ExecutionStatus) {
        self.status = status;
        self.updated_at = chrono::Utc::now();
    }

    /// Check if node is completed
    pub fn is_node_completed(&self, node_id: &str) -> bool {
        self.completed_nodes.contains(&node_id.to_string())
    }

    /// Get node output
    pub fn get_node_output(&self, node_id: &str) -> Option<&serde_json::Value> {
        self.node_outputs.get(node_id)
    }
}

/// Checkpoint for state persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateCheckpoint {
    pub id: String,
    pub state: WorkflowState,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub metadata: HashMap<String, String>,
}

/// Workflow state store
pub struct WorkflowStateStore {
    states: DashMap<String, WorkflowState>,
    checkpoints: DashMap<String, StateCheckpoint>,
    history: DashMap<String, Vec<WorkflowResult>>,
}

impl WorkflowStateStore {
    /// Create a new state store
    pub async fn new() -> Result<Self> {
        Ok(Self {
            states: DashMap::new(),
            checkpoints: DashMap::new(),
            history: DashMap::new(),
        })
    }

    /// Save workflow state
    pub fn save_state(&self, state: WorkflowState) {
        self.states.insert(state.execution_id.clone(), state);
    }

    /// Get workflow state
    pub fn get_state(&self, execution_id: &str) -> Option<WorkflowState> {
        self.states.get(execution_id).map(|s| s.value().clone())
    }

    /// Remove workflow state
    pub fn remove_state(&self, execution_id: &str) -> Option<WorkflowState> {
        self.states.remove(execution_id).map(|(_, s)| s)
    }

    /// Create a checkpoint
    pub fn create_checkpoint(&self, state: &WorkflowState) -> String {
        let checkpoint_id = uuid::Uuid::new_v4().to_string();

        let checkpoint = StateCheckpoint {
            id: checkpoint_id.clone(),
            state: state.clone(),
            created_at: chrono::Utc::now(),
            metadata: HashMap::new(),
        };

        self.checkpoints.insert(checkpoint_id.clone(), checkpoint);

        // Update state with checkpoint reference
        if let Some(mut entry) = self.states.get_mut(&state.execution_id) {
            entry.checkpoint_id = Some(checkpoint_id.clone());
        }

        checkpoint_id
    }

    /// Restore from checkpoint
    pub fn restore_checkpoint(&self, checkpoint_id: &str) -> Option<WorkflowState> {
        self.checkpoints
            .get(checkpoint_id)
            .map(|c| c.value().state.clone())
    }

    /// List checkpoints for an execution
    pub fn list_checkpoints(&self, execution_id: &str) -> Vec<StateCheckpoint> {
        self.checkpoints
            .iter()
            .filter(|c| c.value().state.execution_id == execution_id)
            .map(|c| c.value().clone())
            .collect()
    }

    /// Save execution result to history
    pub fn save_to_history(&self, result: WorkflowResult) {
        let workflow_id = result.workflow_id.clone();
        self.history
            .entry(workflow_id)
            .or_insert_with(Vec::new)
            .push(result);
    }

    /// Get execution history for a workflow
    pub fn get_history(&self, workflow_id: &str) -> Vec<WorkflowResult> {
        self.history
            .get(workflow_id)
            .map(|h| h.value().clone())
            .unwrap_or_default()
    }

    /// Get recent executions across all workflows
    pub fn get_recent_executions(&self, limit: usize) -> Vec<WorkflowResult> {
        let mut all_results: Vec<WorkflowResult> = self
            .history
            .iter()
            .flat_map(|h| h.value().clone())
            .collect();

        all_results.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        all_results.truncate(limit);

        all_results
    }

    /// Clear all state
    pub fn clear(&self) {
        self.states.clear();
        self.checkpoints.clear();
    }

    /// Get statistics
    pub fn stats(&self) -> StateStoreStats {
        StateStoreStats {
            active_states: self.states.len(),
            checkpoints: self.checkpoints.len(),
            workflows_with_history: self.history.len(),
            total_executions: self.history.iter().map(|h| h.value().len()).sum(),
        }
    }
}

/// State store statistics
#[derive(Debug, Clone)]
pub struct StateStoreStats {
    pub active_states: usize,
    pub checkpoints: usize,
    pub workflows_with_history: usize,
    pub total_executions: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workflow_state() {
        let mut state = WorkflowState::new("workflow-1", "exec-1");

        assert_eq!(state.status, ExecutionStatus::Pending);
        assert!(state.completed_nodes.is_empty());

        state.set_current_node("node-1");
        assert_eq!(state.current_node, Some("node-1".to_string()));

        state.complete_node("node-1", serde_json::json!({"result": "success"}));
        assert!(state.is_node_completed("node-1"));
        assert!(state.current_node.is_none());
    }

    #[tokio::test]
    async fn test_state_store() {
        let store = WorkflowStateStore::new().await.unwrap();

        let state = WorkflowState::new("workflow-1", "exec-1");
        store.save_state(state.clone());

        let retrieved = store.get_state("exec-1");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().workflow_id, "workflow-1");
    }

    #[tokio::test]
    async fn test_checkpointing() {
        let store = WorkflowStateStore::new().await.unwrap();

        let mut state = WorkflowState::new("workflow-1", "exec-1");
        state.complete_node("node-1", serde_json::json!({"value": 42}));
        store.save_state(state.clone());

        let checkpoint_id = store.create_checkpoint(&state);

        // Modify state
        state.complete_node("node-2", serde_json::json!({"value": 84}));
        store.save_state(state);

        // Restore from checkpoint
        let restored = store.restore_checkpoint(&checkpoint_id);
        assert!(restored.is_some());

        let restored_state = restored.unwrap();
        assert!(restored_state.is_node_completed("node-1"));
        assert!(!restored_state.is_node_completed("node-2"));
    }
}
