//! Workflow Automation Engine
//!
//! Graph-based workflow execution for complex creative pipelines.
//!
//! # Features
//!
//! - Visual workflow builder (DAG-based)
//! - Multiple node types (input, AI processing, transformation, output)
//! - Conditional branching and parallel execution
//! - Real-time collaborative workflow editing
//! - State persistence and resumption
//!
//! # Example
//!
//! ```ignore
//! use miyabi_creative_framework::workflow::*;
//!
//! let workflow = WorkflowBuilder::new("content-pipeline")
//!     .input("prompt", InputType::Text)
//!     .ai_process("generate", "claude-3-5-sonnet", ProcessConfig::default())
//!     .transform("optimize", TransformType::Custom("optimize_content".into()))
//!     .branch("quality-check", vec![
//!         ("pass", Condition::FieldGreaterThan("score", 0.8), "output"),
//!         ("fail", Condition::Always, "regenerate"),
//!     ])
//!     .output("result")
//!     .build()?;
//! ```

mod builder;
mod execution;
mod state;

pub use builder::WorkflowBuilder;
pub use execution::{ExecutionContext, WorkflowExecution};
pub use state::{WorkflowState, WorkflowStateStore};

use crate::error::{Result, WorkflowError};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Workflow node definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    /// Unique node identifier
    pub id: String,
    /// Node type
    pub node_type: NodeType,
    /// Node configuration
    pub config: NodeConfig,
    /// Input ports
    pub inputs: Vec<WorkflowPort>,
    /// Output ports
    pub outputs: Vec<WorkflowPort>,
    /// Visual position (for UI)
    pub position: Position,
    /// Node metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Types of workflow nodes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    /// Data input node
    Input,
    /// AI model processing
    AiProcessing,
    /// Data transformation
    Transformation,
    /// Collaboration point
    Collaboration,
    /// Data output
    Output,
    /// Conditional branch
    Conditional,
    /// Parallel split
    ParallelSplit,
    /// Parallel join
    ParallelJoin,
    /// Custom plugin node
    Plugin,
}

/// Node configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Model ID for AI nodes
    pub model_id: Option<String>,
    /// Transform type for transformation nodes
    pub transform_type: Option<TransformType>,
    /// Conditional branches
    pub branches: Option<Vec<ConditionalBranch>>,
    /// Plugin ID for plugin nodes
    pub plugin_id: Option<String>,
    /// Custom parameters
    pub parameters: HashMap<String, serde_json::Value>,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            model_id: None,
            transform_type: None,
            branches: None,
            plugin_id: None,
            parameters: HashMap::new(),
        }
    }
}

/// Transform types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransformType {
    /// JSON transformation
    JsonTransform,
    /// Text processing
    TextProcess,
    /// Data filtering
    Filter,
    /// Data mapping
    Map,
    /// Aggregation
    Aggregate,
    /// Custom transformation
    Custom(String),
}

/// Conditional branch definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConditionalBranch {
    pub name: String,
    pub condition: Condition,
    pub target_node: String,
}

/// Condition types for branching
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Condition {
    /// Always true
    Always,
    /// Field equals value
    FieldEquals { field: String, value: serde_json::Value },
    /// Field greater than value
    FieldGreaterThan { field: String, value: f64 },
    /// Field less than value
    FieldLessThan { field: String, value: f64 },
    /// Field contains string
    FieldContains { field: String, value: String },
    /// Boolean field is true
    FieldIsTrue { field: String },
    /// Logical AND
    And(Vec<Condition>),
    /// Logical OR
    Or(Vec<Condition>),
    /// Logical NOT
    Not(Box<Condition>),
}

impl Condition {
    /// Evaluate condition against data
    pub fn evaluate(&self, data: &serde_json::Value) -> bool {
        match self {
            Condition::Always => true,
            Condition::FieldEquals { field, value } => {
                data.get(field).map(|v| v == value).unwrap_or(false)
            }
            Condition::FieldGreaterThan { field, value } => {
                data.get(field)
                    .and_then(|v| v.as_f64())
                    .map(|v| v > *value)
                    .unwrap_or(false)
            }
            Condition::FieldLessThan { field, value } => {
                data.get(field)
                    .and_then(|v| v.as_f64())
                    .map(|v| v < *value)
                    .unwrap_or(false)
            }
            Condition::FieldContains { field, value } => {
                data.get(field)
                    .and_then(|v| v.as_str())
                    .map(|v| v.contains(value))
                    .unwrap_or(false)
            }
            Condition::FieldIsTrue { field } => {
                data.get(field)
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false)
            }
            Condition::And(conditions) => conditions.iter().all(|c| c.evaluate(data)),
            Condition::Or(conditions) => conditions.iter().any(|c| c.evaluate(data)),
            Condition::Not(condition) => !condition.evaluate(data),
        }
    }
}

/// Workflow port for node connections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowPort {
    pub id: String,
    pub name: String,
    pub data_type: DataType,
    pub required: bool,
}

/// Data types for ports
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DataType {
    Text,
    Number,
    Boolean,
    Json,
    Image,
    Audio,
    Video,
    Binary,
    Any,
}

/// Visual position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0 }
    }
}

/// Workflow edge connecting nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub source_port: String,
    pub target_port: String,
    pub conditions: Option<Vec<EdgeCondition>>,
}

/// Condition on edge traversal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdgeCondition {
    pub condition: Condition,
    pub transform: Option<String>,
}

/// Workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub variables: Vec<WorkflowVariable>,
    pub triggers: Vec<WorkflowTrigger>,
    pub collaboration_settings: Option<CollaborationSettings>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Workflow variable
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowVariable {
    pub name: String,
    pub data_type: DataType,
    pub default_value: Option<serde_json::Value>,
    pub description: Option<String>,
}

/// Workflow trigger
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTrigger {
    pub id: String,
    pub trigger_type: TriggerType,
    pub config: HashMap<String, serde_json::Value>,
}

/// Trigger types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TriggerType {
    Manual,
    Webhook,
    Schedule,
    Event,
    Api,
}

/// Collaboration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationSettings {
    pub enabled: bool,
    pub max_participants: u32,
    pub allow_live_editing: bool,
    pub sync_interval_ms: u64,
}

impl Default for CollaborationSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            max_participants: 10,
            allow_live_editing: true,
            sync_interval_ms: 100,
        }
    }
}

/// Workflow execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowResult {
    pub workflow_id: String,
    pub execution_id: String,
    pub status: ExecutionStatus,
    pub outputs: HashMap<String, serde_json::Value>,
    pub node_results: Vec<NodeResult>,
    pub metrics: ExecutionMetrics,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Node execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResult {
    pub node_id: String,
    pub status: ExecutionStatus,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub duration_ms: u64,
}

/// Execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
    Paused,
}

/// Execution metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ExecutionMetrics {
    pub total_duration_ms: u64,
    pub nodes_executed: u32,
    pub nodes_failed: u32,
    pub ai_tokens_used: u64,
    pub ai_cost_usd: f64,
}

/// Workflow Automation Engine
pub struct WorkflowAutomationEngine {
    workflows: DashMap<String, WorkflowDefinition>,
    executions: DashMap<String, Arc<RwLock<WorkflowExecution>>>,
    state_store: Arc<WorkflowStateStore>,
}

impl WorkflowAutomationEngine {
    /// Create a new workflow engine
    pub async fn new() -> Result<Self> {
        let state_store = Arc::new(WorkflowStateStore::new().await?);

        Ok(Self {
            workflows: DashMap::new(),
            executions: DashMap::new(),
            state_store,
        })
    }

    /// Create a new workflow
    pub fn create_workflow(&self, definition: WorkflowDefinition) -> Result<String> {
        self.validate_workflow(&definition)?;

        let workflow_id = definition.id.clone();
        self.workflows.insert(workflow_id.clone(), definition);

        tracing::info!(workflow_id = %workflow_id, "Workflow created");

        Ok(workflow_id)
    }

    /// Get a workflow by ID
    pub fn get_workflow(&self, workflow_id: &str) -> Option<WorkflowDefinition> {
        self.workflows.get(workflow_id).map(|w| w.value().clone())
    }

    /// List all workflows
    pub fn list_workflows(&self) -> Vec<WorkflowDefinition> {
        self.workflows.iter().map(|r| r.value().clone()).collect()
    }

    /// Execute a workflow
    pub async fn execute(
        &self,
        definition: WorkflowDefinition,
        inputs: Option<HashMap<String, serde_json::Value>>,
    ) -> Result<WorkflowResult> {
        let workflow_id = definition.id.clone();
        let execution_id = uuid::Uuid::new_v4().to_string();

        // Create execution context
        let context = ExecutionContext {
            workflow_id: workflow_id.clone(),
            execution_id: execution_id.clone(),
            inputs: inputs.unwrap_or_default(),
            variables: HashMap::new(),
        };

        // Create and run execution
        let execution = WorkflowExecution::new(definition, context).await?;
        let execution_arc = Arc::new(RwLock::new(execution));

        self.executions
            .insert(execution_id.clone(), execution_arc.clone());

        // Execute the workflow
        let result = {
            let mut exec = execution_arc.write().await;
            exec.run().await?
        };

        tracing::info!(
            workflow_id = %workflow_id,
            execution_id = %execution_id,
            status = ?result.status,
            "Workflow execution completed"
        );

        Ok(result)
    }

    /// Get execution status
    pub async fn get_execution_status(
        &self,
        execution_id: &str,
    ) -> Option<ExecutionStatus> {
        self.executions.get(execution_id).map(|e| {
            let exec = e.blocking_read();
            exec.status()
        })
    }

    /// Cancel an execution
    pub async fn cancel_execution(&self, execution_id: &str) -> Result<()> {
        let execution = self
            .executions
            .get(execution_id)
            .ok_or_else(|| WorkflowError::NotFound(execution_id.to_string()))?;

        let mut exec = execution.write().await;
        exec.cancel().await
    }

    /// Validate workflow definition
    fn validate_workflow(&self, definition: &WorkflowDefinition) -> Result<()> {
        if definition.nodes.is_empty() {
            return Err(WorkflowError::InvalidDefinition("Workflow has no nodes".to_string()).into());
        }

        // Check for cycles
        self.check_cycles(definition)?;

        // Validate node connections
        self.validate_connections(definition)?;

        Ok(())
    }

    fn check_cycles(&self, definition: &WorkflowDefinition) -> Result<()> {
        // Simple cycle detection using DFS
        let mut visited = HashMap::new();
        let mut rec_stack = HashMap::new();

        let adj_list: HashMap<&str, Vec<&str>> = {
            let mut adj = HashMap::new();
            for edge in &definition.edges {
                adj.entry(edge.source.as_str())
                    .or_insert_with(Vec::new)
                    .push(edge.target.as_str());
            }
            adj
        };

        for node in &definition.nodes {
            if self.has_cycle_dfs(&node.id, &adj_list, &mut visited, &mut rec_stack) {
                return Err(WorkflowError::CircularDependency.into());
            }
        }

        Ok(())
    }

    fn has_cycle_dfs<'a>(
        &self,
        node: &'a str,
        adj_list: &HashMap<&'a str, Vec<&'a str>>,
        visited: &mut HashMap<&'a str, bool>,
        rec_stack: &mut HashMap<&'a str, bool>,
    ) -> bool {
        if rec_stack.get(node).copied().unwrap_or(false) {
            return true;
        }

        if visited.get(node).copied().unwrap_or(false) {
            return false;
        }

        visited.insert(node, true);
        rec_stack.insert(node, true);

        if let Some(neighbors) = adj_list.get(node) {
            for neighbor in neighbors {
                if self.has_cycle_dfs(neighbor, adj_list, visited, rec_stack) {
                    return true;
                }
            }
        }

        rec_stack.insert(node, false);
        false
    }

    fn validate_connections(&self, definition: &WorkflowDefinition) -> Result<()> {
        let node_ids: std::collections::HashSet<_> =
            definition.nodes.iter().map(|n| n.id.as_str()).collect();

        for edge in &definition.edges {
            if !node_ids.contains(edge.source.as_str()) {
                return Err(WorkflowError::InvalidEdge {
                    from: edge.source.clone(),
                    to: edge.target.clone(),
                }
                .into());
            }
            if !node_ids.contains(edge.target.as_str()) {
                return Err(WorkflowError::InvalidEdge {
                    from: edge.source.clone(),
                    to: edge.target.clone(),
                }
                .into());
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_condition_evaluation() {
        let data = serde_json::json!({
            "score": 0.85,
            "status": "complete",
            "approved": true
        });

        assert!(Condition::Always.evaluate(&data));

        assert!(Condition::FieldEquals {
            field: "status".to_string(),
            value: serde_json::json!("complete")
        }
        .evaluate(&data));

        assert!(Condition::FieldGreaterThan {
            field: "score".to_string(),
            value: 0.8
        }
        .evaluate(&data));

        assert!(Condition::FieldIsTrue {
            field: "approved".to_string()
        }
        .evaluate(&data));

        assert!(Condition::And(vec![
            Condition::FieldGreaterThan {
                field: "score".to_string(),
                value: 0.5
            },
            Condition::FieldIsTrue {
                field: "approved".to_string()
            }
        ])
        .evaluate(&data));
    }

    #[tokio::test]
    async fn test_engine_creation() {
        let engine = WorkflowAutomationEngine::new().await;
        assert!(engine.is_ok());
    }
}
