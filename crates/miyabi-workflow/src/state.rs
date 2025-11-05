//! Workflow state management

use crate::error::{Result, WorkflowError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Workflow execution status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkflowStatus {
    /// Workflow is currently running
    Running,
    /// Workflow is paused (waiting for Human-in-the-Loop)
    Paused,
    /// Workflow completed successfully
    Completed,
    /// Workflow failed with error
    Failed,
}

/// Complete workflow execution state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionState {
    /// Unique workflow instance ID
    pub workflow_id: String,

    /// Session ID for this execution
    pub session_id: String,

    /// Current executing step ID
    pub current_step: Option<String>,

    /// List of completed step IDs
    pub completed_steps: Vec<String>,

    /// List of failed step IDs
    pub failed_steps: Vec<String>,

    /// Results from each step
    pub step_results: HashMap<String, serde_json::Value>,

    /// Current workflow status
    pub status: WorkflowStatus,

    /// Creation timestamp (Unix epoch)
    pub created_at: u64,

    /// Last update timestamp (Unix epoch)
    pub updated_at: u64,
}

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
                serde_json::from_value(v.clone())
                    .map_err(|e| WorkflowError::Other(format!("Failed to deserialize metadata: {}", e)))
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

    /// Save execution state
    pub fn save_execution(&self, state: &ExecutionState) -> Result<()> {
        let key = format!("execution:{}", state.workflow_id);
        let value = serde_json::to_vec(state)?;
        self.db.insert(key.as_bytes(), value)?;
        self.db.flush()?;
        Ok(())
    }

    /// Load execution state
    pub fn load_execution(&self, workflow_id: &str) -> Result<Option<ExecutionState>> {
        let key = format!("execution:{}", workflow_id);
        if let Some(value) = self.db.get(key.as_bytes())? {
            Ok(Some(serde_json::from_slice(&value)?))
        } else {
            Ok(None)
        }
    }

    /// Delete execution state
    pub fn delete_execution(&self, workflow_id: &str) -> Result<()> {
        let key = format!("execution:{}", workflow_id);
        self.db.remove(key.as_bytes())?;
        self.db.flush()?;
        Ok(())
    }

    /// List all active workflows (Running or Paused)
    pub fn list_active(&self) -> Result<Vec<ExecutionState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"execution:") {
            let (_, value) = item?;
            let state: ExecutionState = serde_json::from_slice(&value)?;

            if matches!(state.status, WorkflowStatus::Running | WorkflowStatus::Paused) {
                states.push(state);
            }
        }

        Ok(states)
    }

    /// List all workflows by status
    pub fn list_by_status(&self, status: WorkflowStatus) -> Result<Vec<ExecutionState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"execution:") {
            let (_, value) = item?;
            let state: ExecutionState = serde_json::from_slice(&value)?;

            if state.status == status {
                states.push(state);
            }
        }

        Ok(states)
    }
}

impl Default for StateStore {
    fn default() -> Self {
        Self::new().expect("Failed to create default state store")
    }
}
