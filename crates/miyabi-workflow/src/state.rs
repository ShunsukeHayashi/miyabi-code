//! Workflow state management

use crate::error::{Result, WorkflowError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Step execution context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepContext {
    /// Workflow ID
    pub workflow_id: String,

    /// Current step ID
    pub current_step: String,

    /// Outputs from previous steps
    pub outputs: HashMap<String, StepOutput>,

    /// Metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

impl StepContext {
    /// Create a new step context
    pub fn new(workflow_id: impl Into<String>) -> Self {
        Self {
            workflow_id: workflow_id.into(),
            current_step: String::new(),
            outputs: HashMap::new(),
            metadata: HashMap::new(),
        }
    }

    /// Set output for a step
    pub fn set_output(&mut self, step_id: impl Into<String>, output: StepOutput) {
        self.outputs.insert(step_id.into(), output);
    }

    /// Get output from a previous step
    pub fn get_output(&self, step_id: &str) -> Option<&StepOutput> {
        self.outputs.get(step_id)
    }

    /// Set metadata
    pub fn set_metadata(&mut self, key: impl Into<String>, value: serde_json::Value) {
        self.metadata.insert(key.into(), value);
    }

    /// Get metadata
    pub fn get_metadata(&self, key: &str) -> Option<&serde_json::Value> {
        self.metadata.get(key)
    }

    /// Get typed metadata value
    pub fn get<T: serde::de::DeserializeOwned>(&self, key: &str) -> Result<T> {
        self.metadata
            .get(key)
            .ok_or_else(|| WorkflowError::Other(format!("Metadata key '{}' not found", key)))
            .and_then(|v| {
                serde_json::from_value(v.clone()).map_err(|e| {
                    WorkflowError::Other(format!("Failed to deserialize metadata: {}", e))
                })
            })
    }
}

/// Output from a workflow step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepOutput {
    /// Success status
    pub success: bool,

    /// Output data
    pub data: serde_json::Value,

    /// Error message if failed
    pub error: Option<String>,

    /// Execution time in milliseconds
    pub duration_ms: u64,
}

impl StepOutput {
    /// Create a successful output
    pub fn success(data: impl Serialize) -> Result<Self> {
        Ok(Self {
            success: true,
            data: serde_json::to_value(data)?,
            error: None,
            duration_ms: 0,
        })
    }

    /// Create a failed output
    pub fn failure(error: impl Into<String>) -> Self {
        Self {
            success: false,
            data: serde_json::Value::Null,
            error: Some(error.into()),
            duration_ms: 0,
        }
    }

    /// Set execution duration
    pub fn with_duration(mut self, duration_ms: u64) -> Self {
        self.duration_ms = duration_ms;
        self
    }
}

/// Final workflow output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowOutput {
    /// Workflow ID
    pub workflow_id: String,

    /// Success status
    pub success: bool,

    /// Step outputs
    pub steps: HashMap<String, StepOutput>,

    /// Total execution time
    pub total_duration_ms: u64,
}

impl WorkflowOutput {
    /// Create from step context
    pub fn from_context(ctx: StepContext, duration_ms: u64) -> Self {
        let success = ctx.outputs.values().all(|o| o.success);

        Self {
            workflow_id: ctx.workflow_id,
            success,
            steps: ctx.outputs,
            total_duration_ms: duration_ms,
        }
    }
}

/// State store for workflow persistence
pub struct StateStore {
    db: sled::Db,
}

impl StateStore {
    /// Create a new state store
    pub fn new() -> Result<Self> {
        let path = Self::default_path();
        std::fs::create_dir_all(&path)?;
        let db = sled::open(path)?;
        Ok(Self { db })
    }

    /// Create state store with custom path
    pub fn with_path(path: impl Into<PathBuf>) -> Result<Self> {
        let path = path.into();
        std::fs::create_dir_all(&path)?;
        let db = sled::open(path)?;
        Ok(Self { db })
    }

    /// Get default storage path
    fn default_path() -> PathBuf {
        PathBuf::from("./data/workflow-state")
    }

    /// Save step output
    pub fn save_step(&self, workflow_id: &str, step_id: &str, output: &StepOutput) -> Result<()> {
        let key = format!("{}:{}", workflow_id, step_id);
        let value = serde_json::to_vec(output)?;
        self.db.insert(key.as_bytes(), value)?;
        self.db.flush()?;
        Ok(())
    }

    /// Load step output
    pub fn load_step(&self, workflow_id: &str, step_id: &str) -> Result<Option<StepOutput>> {
        let key = format!("{}:{}", workflow_id, step_id);
        if let Some(value) = self.db.get(key.as_bytes())? {
            Ok(Some(serde_json::from_slice(&value)?))
        } else {
            Ok(None)
        }
    }

    /// Save workflow context
    pub fn save_context(&self, ctx: &StepContext) -> Result<()> {
        let key = format!("{}:context", ctx.workflow_id);
        let value = serde_json::to_vec(ctx)?;
        self.db.insert(key.as_bytes(), value)?;
        self.db.flush()?;
        Ok(())
    }

    /// Load workflow context
    pub fn load_context(&self, workflow_id: &str) -> Result<Option<StepContext>> {
        let key = format!("{}:context", workflow_id);
        if let Some(value) = self.db.get(key.as_bytes())? {
            Ok(Some(serde_json::from_slice(&value)?))
        } else {
            Ok(None)
        }
    }

    /// Clear workflow state
    pub fn clear_workflow(&self, workflow_id: &str) -> Result<()> {
        let prefix = format!("{}:", workflow_id);
        for item in self.db.scan_prefix(prefix.as_bytes()) {
            let (key, _) = item?;
            self.db.remove(key)?;
        }
        self.db.flush()?;
        Ok(())
    }
}

impl Default for StateStore {
    fn default() -> Self {
        Self::new().expect("Failed to create default state store")
    }
}

// ============================================================================
// Workflow State Persistence - Issue #717
// ============================================================================

/// Workflow execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorkflowStatus {
    /// Workflow is currently running
    Running,
    /// Workflow is paused (waiting for resume)
    Paused,
    /// Workflow completed successfully
    Completed,
    /// Workflow failed with errors
    Failed,
}

/// Execution state for a workflow instance
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExecutionState {
    /// Unique workflow identifier
    pub workflow_id: String,
    /// Session identifier for this execution
    pub session_id: String,
    /// Current step being executed (if any)
    pub current_step: Option<String>,
    /// List of completed step IDs
    pub completed_steps: Vec<String>,
    /// List of failed step IDs
    pub failed_steps: Vec<String>,
    /// Step results (step_id -> JSON value)
    pub step_results: HashMap<String, serde_json::Value>,
    /// Current workflow status
    pub status: WorkflowStatus,
    /// Creation timestamp (Unix epoch seconds)
    pub created_at: u64,
    /// Last update timestamp (Unix epoch seconds)
    pub updated_at: u64,
}

impl ExecutionState {
    /// Create a new ExecutionState with generated IDs
    pub fn new(workflow_name: &str) -> Self {
        let now = chrono::Utc::now().timestamp() as u64;
        let workflow_id = format!("{}-{}", workflow_name, uuid::Uuid::new_v4());
        let session_id = format!("session-{}", now);

        Self {
            workflow_id,
            session_id,
            current_step: None,
            completed_steps: Vec::new(),
            failed_steps: Vec::new(),
            step_results: HashMap::new(),
            status: WorkflowStatus::Running,
            created_at: now,
            updated_at: now,
        }
    }

    /// Mark a step as completed with optional result
    pub fn complete_step(&mut self, step_id: String, result: Option<serde_json::Value>) {
        self.completed_steps.push(step_id.clone());
        if let Some(value) = result {
            self.step_results.insert(step_id, value);
        }
        self.updated_at = chrono::Utc::now().timestamp() as u64;
    }

    /// Mark a step as failed
    pub fn fail_step(&mut self, step_id: String) {
        self.failed_steps.push(step_id);
        self.status = WorkflowStatus::Failed;
        self.updated_at = chrono::Utc::now().timestamp() as u64;
    }

    /// Set current step
    pub fn set_current_step(&mut self, step_id: Option<String>) {
        self.current_step = step_id;
        self.updated_at = chrono::Utc::now().timestamp() as u64;
    }
}

/// Workflow state manager with sled backend (for suspend/resume)
pub struct WorkflowState {
    db: sled::Db,
}

impl WorkflowState {
    /// Create a new WorkflowState with sled backend
    pub fn new(path: impl Into<PathBuf>) -> Result<Self> {
        let path = path.into();
        std::fs::create_dir_all(&path)?;
        let db = sled::open(path)?;
        Ok(Self { db })
    }

    /// Save workflow execution state
    pub fn save(&self, state: &ExecutionState) -> Result<()> {
        let key = format!("workflow:{}", state.workflow_id);
        let value = serde_json::to_vec(state)?;
        self.db.insert(key.as_bytes(), value)?;
        self.db.flush()?;
        Ok(())
    }

    /// Load workflow execution state by ID
    pub fn load(&self, workflow_id: &str) -> Result<Option<ExecutionState>> {
        let key = format!("workflow:{}", workflow_id);
        if let Some(value) = self.db.get(key.as_bytes())? {
            Ok(Some(serde_json::from_slice(&value)?))
        } else {
            Ok(None)
        }
    }

    /// Delete workflow execution state
    pub fn delete(&self, workflow_id: &str) -> Result<()> {
        let key = format!("workflow:{}", workflow_id);
        self.db.remove(key.as_bytes())?;
        self.db.flush()?;
        Ok(())
    }

    /// List all active workflows (Running or Paused)
    pub fn list_active(&self) -> Result<Vec<ExecutionState>> {
        let mut states = Vec::new();
        for item in self.db.scan_prefix(b"workflow:") {
            let (_, value) = item?;
            let state: ExecutionState = serde_json::from_slice(&value)?;
            if matches!(
                state.status,
                WorkflowStatus::Running | WorkflowStatus::Paused
            ) {
                states.push(state);
            }
        }
        Ok(states)
    }

    /// List all workflows regardless of status
    pub fn list_all(&self) -> Result<Vec<ExecutionState>> {
        let mut states = Vec::new();
        for item in self.db.scan_prefix(b"workflow:") {
            let (_, value) = item?;
            let state: ExecutionState = serde_json::from_slice(&value)?;
            states.push(state);
        }
        Ok(states)
    }

    /// Update workflow status
    pub fn update_status(&self, workflow_id: &str, status: WorkflowStatus) -> Result<()> {
        let mut state = self
            .load(workflow_id)?
            .ok_or_else(|| WorkflowError::Other(format!("Workflow {} not found", workflow_id)))?;
        state.status = status;
        state.updated_at = chrono::Utc::now().timestamp() as u64;
        self.save(&state)
    }
}

#[cfg(test)]
mod persistence_tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_workflow_state() -> (WorkflowState, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let state = WorkflowState::new(temp_dir.path()).unwrap();
        (state, temp_dir)
    }

    #[test]
    fn test_execution_state_new() {
        let state = ExecutionState::new("test-workflow");
        assert!(state.workflow_id.starts_with("test-workflow-"));
        assert!(state.session_id.starts_with("session-"));
        assert_eq!(state.status, WorkflowStatus::Running);
        assert!(state.completed_steps.is_empty());
        assert!(state.failed_steps.is_empty());
    }

    #[test]
    fn test_save_and_load() {
        let (db, _temp) = create_test_workflow_state();
        let state = ExecutionState::new("test-wf");
        let workflow_id = state.workflow_id.clone();

        db.save(&state).unwrap();

        let loaded = db.load(&workflow_id).unwrap().unwrap();
        assert_eq!(loaded.workflow_id, workflow_id);
        assert_eq!(loaded.status, WorkflowStatus::Running);
    }

    #[test]
    fn test_load_nonexistent() {
        let (db, _temp) = create_test_workflow_state();
        let result = db.load("nonexistent").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_delete() {
        let (db, _temp) = create_test_workflow_state();
        let state = ExecutionState::new("test-wf");
        let workflow_id = state.workflow_id.clone();

        db.save(&state).unwrap();
        assert!(db.load(&workflow_id).unwrap().is_some());

        db.delete(&workflow_id).unwrap();
        assert!(db.load(&workflow_id).unwrap().is_none());
    }

    #[test]
    fn test_list_active() {
        let (db, _temp) = create_test_workflow_state();

        let mut state1 = ExecutionState::new("wf-1");
        state1.status = WorkflowStatus::Running;
        db.save(&state1).unwrap();

        let mut state2 = ExecutionState::new("wf-2");
        state2.status = WorkflowStatus::Paused;
        db.save(&state2).unwrap();

        let mut state3 = ExecutionState::new("wf-3");
        state3.status = WorkflowStatus::Completed;
        db.save(&state3).unwrap();

        let active = db.list_active().unwrap();
        assert_eq!(active.len(), 2);
        assert!(active
            .iter()
            .all(|s| matches!(s.status, WorkflowStatus::Running | WorkflowStatus::Paused)));
    }

    #[test]
    fn test_update_status() {
        let (db, _temp) = create_test_workflow_state();
        let state = ExecutionState::new("test-wf");
        let workflow_id = state.workflow_id.clone();

        db.save(&state).unwrap();
        db.update_status(&workflow_id, WorkflowStatus::Paused)
            .unwrap();

        let loaded = db.load(&workflow_id).unwrap().unwrap();
        assert_eq!(loaded.status, WorkflowStatus::Paused);
    }

    #[test]
    fn test_complete_step() {
        let mut state = ExecutionState::new("test-wf");
        let result = serde_json::json!({"output": "success"});

        state.complete_step("step-1".to_string(), Some(result.clone()));

        assert_eq!(state.completed_steps.len(), 1);
        assert_eq!(state.completed_steps[0], "step-1");
        assert_eq!(state.step_results.get("step-1").unwrap(), &result);
    }

    #[test]
    fn test_fail_step() {
        let mut state = ExecutionState::new("test-wf");
        state.fail_step("step-1".to_string());

        assert_eq!(state.failed_steps.len(), 1);
        assert_eq!(state.failed_steps[0], "step-1");
        assert_eq!(state.status, WorkflowStatus::Failed);
    }

    #[test]
    fn test_state_persistence_across_reopen() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();

        // Save state in first session
        {
            let db = WorkflowState::new(&path).unwrap();
            let state = ExecutionState::new("persistent-wf");
            let workflow_id = state.workflow_id.clone();
            db.save(&state).unwrap();
            assert!(db.load(&workflow_id).unwrap().is_some());
        }

        // Reopen database and verify state persists
        {
            let db = WorkflowState::new(&path).unwrap();
            let all = db.list_all().unwrap();
            assert_eq!(all.len(), 1);
            assert!(all[0].workflow_id.starts_with("persistent-wf-"));
        }
    }
}
