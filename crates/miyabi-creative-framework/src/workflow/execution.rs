//! Workflow execution engine

use crate::error::{Result, WorkflowError};
use crate::workflow::{
    Condition, ExecutionMetrics, ExecutionStatus, NodeResult, NodeType,
    WorkflowDefinition, WorkflowResult,
};
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Execution context for a workflow run
#[derive(Debug, Clone)]
pub struct ExecutionContext {
    pub workflow_id: String,
    pub execution_id: String,
    pub inputs: HashMap<String, serde_json::Value>,
    pub variables: HashMap<String, serde_json::Value>,
}

/// Workflow execution instance
pub struct WorkflowExecution {
    definition: WorkflowDefinition,
    context: ExecutionContext,
    status: ExecutionStatus,
    node_outputs: HashMap<String, serde_json::Value>,
    node_results: Vec<NodeResult>,
    metrics: ExecutionMetrics,
    started_at: chrono::DateTime<chrono::Utc>,
    completed_at: Option<chrono::DateTime<chrono::Utc>>,
    cancelled: Arc<RwLock<bool>>,
}

impl WorkflowExecution {
    /// Create a new workflow execution
    pub async fn new(
        definition: WorkflowDefinition,
        context: ExecutionContext,
    ) -> Result<Self> {
        Ok(Self {
            definition,
            context,
            status: ExecutionStatus::Pending,
            node_outputs: HashMap::new(),
            node_results: Vec::new(),
            metrics: ExecutionMetrics::default(),
            started_at: chrono::Utc::now(),
            completed_at: None,
            cancelled: Arc::new(RwLock::new(false)),
        })
    }

    /// Run the workflow
    pub async fn run(&mut self) -> Result<WorkflowResult> {
        self.status = ExecutionStatus::Running;
        let start_time = std::time::Instant::now();

        // Build execution order (topological sort)
        let execution_order = self.build_execution_order()?;

        // Execute nodes in order
        for node_id in execution_order {
            // Check for cancellation
            if *self.cancelled.read().await {
                self.status = ExecutionStatus::Cancelled;
                break;
            }

            let result = self.execute_node(&node_id).await;

            match result {
                Ok(node_result) => {
                    if node_result.status == ExecutionStatus::Failed {
                        self.status = ExecutionStatus::Failed;
                        self.node_results.push(node_result);
                        break;
                    }
                    self.node_results.push(node_result);
                    self.metrics.nodes_executed += 1;
                }
                Err(e) => {
                    self.status = ExecutionStatus::Failed;
                    self.node_results.push(NodeResult {
                        node_id: node_id.clone(),
                        status: ExecutionStatus::Failed,
                        output: None,
                        error: Some(e.to_string()),
                        duration_ms: 0,
                    });
                    self.metrics.nodes_failed += 1;
                    break;
                }
            }
        }

        if self.status == ExecutionStatus::Running {
            self.status = ExecutionStatus::Completed;
        }

        self.completed_at = Some(chrono::Utc::now());
        self.metrics.total_duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(self.build_result())
    }

    /// Cancel the execution
    pub async fn cancel(&mut self) -> Result<()> {
        *self.cancelled.write().await = true;
        self.status = ExecutionStatus::Cancelled;
        self.completed_at = Some(chrono::Utc::now());
        Ok(())
    }

    /// Get current status
    pub fn status(&self) -> ExecutionStatus {
        self.status.clone()
    }

    /// Execute a single node
    async fn execute_node(&mut self, node_id: &str) -> Result<NodeResult> {
        let node = self
            .definition
            .nodes
            .iter()
            .find(|n| n.id == node_id)
            .ok_or_else(|| WorkflowError::NotFound(node_id.to_string()))?
            .clone();

        let start_time = std::time::Instant::now();

        // Gather inputs from connected nodes
        let inputs = self.gather_node_inputs(&node.id);

        // Execute based on node type
        let output = match node.node_type {
            NodeType::Input => {
                // Input nodes just pass through the context inputs
                self.context
                    .inputs
                    .get(&node.id.replace("input-", ""))
                    .cloned()
                    .unwrap_or(serde_json::Value::Null)
            }
            NodeType::Output => {
                // Output nodes collect their inputs
                inputs
            }
            NodeType::AiProcessing => {
                // Simulate AI processing
                self.execute_ai_node(&node.config, inputs).await?
            }
            NodeType::Transformation => {
                // Execute transformation
                self.execute_transform_node(&node.config, inputs).await?
            }
            NodeType::Conditional => {
                // Evaluate conditions and determine path
                self.execute_conditional_node(&node.config, inputs).await?
            }
            NodeType::ParallelSplit => {
                // Split input to all outputs
                inputs
            }
            NodeType::ParallelJoin => {
                // Join all inputs into array
                inputs
            }
            NodeType::Plugin => {
                // Execute plugin
                self.execute_plugin_node(&node.config, inputs).await?
            }
            NodeType::Collaboration => {
                // Collaboration nodes pass through
                inputs
            }
        };

        let duration_ms = start_time.elapsed().as_millis() as u64;

        // Store output for downstream nodes
        self.node_outputs.insert(node_id.to_string(), output.clone());

        Ok(NodeResult {
            node_id: node_id.to_string(),
            status: ExecutionStatus::Completed,
            output: Some(output),
            error: None,
            duration_ms,
        })
    }

    /// Gather inputs from upstream nodes
    fn gather_node_inputs(&self, node_id: &str) -> serde_json::Value {
        let incoming_edges: Vec<_> = self
            .definition
            .edges
            .iter()
            .filter(|e| e.target == node_id)
            .collect();

        if incoming_edges.is_empty() {
            return serde_json::Value::Null;
        }

        if incoming_edges.len() == 1 {
            self.node_outputs
                .get(&incoming_edges[0].source)
                .cloned()
                .unwrap_or(serde_json::Value::Null)
        } else {
            // Multiple inputs - combine into object
            let mut combined = serde_json::Map::new();
            for edge in incoming_edges {
                if let Some(output) = self.node_outputs.get(&edge.source) {
                    combined.insert(edge.source_port.clone(), output.clone());
                }
            }
            serde_json::Value::Object(combined)
        }
    }

    /// Execute AI processing node
    async fn execute_ai_node(
        &mut self,
        config: &crate::workflow::NodeConfig,
        inputs: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let model_id = config.model_id.as_ref().map(|s| s.as_str()).unwrap_or("default");

        // In a real implementation, this would call the AI model
        // For now, simulate with a placeholder response
        let response = serde_json::json!({
            "model": model_id,
            "input": inputs,
            "generated": "AI generated content would appear here",
            "tokens_used": 150
        });

        // Update metrics
        self.metrics.ai_tokens_used += 150;
        self.metrics.ai_cost_usd += 0.001;

        Ok(response)
    }

    /// Execute transformation node
    async fn execute_transform_node(
        &self,
        config: &crate::workflow::NodeConfig,
        inputs: serde_json::Value,
    ) -> Result<serde_json::Value> {
        use crate::workflow::TransformType;

        let transform_type = config
            .transform_type
            .as_ref()
            .unwrap_or(&TransformType::JsonTransform);

        match transform_type {
            TransformType::JsonTransform => {
                // Apply JSON transformation from parameters
                Ok(inputs)
            }
            TransformType::TextProcess => {
                // Text processing
                if let Some(text) = inputs.as_str() {
                    Ok(serde_json::json!({
                        "processed": text.trim(),
                        "length": text.len()
                    }))
                } else {
                    Ok(inputs)
                }
            }
            TransformType::Filter => {
                // Filter implementation
                Ok(inputs)
            }
            TransformType::Map => {
                // Map implementation
                Ok(inputs)
            }
            TransformType::Aggregate => {
                // Aggregation
                Ok(inputs)
            }
            TransformType::Custom(name) => {
                // Custom transform
                Ok(serde_json::json!({
                    "transform": name,
                    "input": inputs,
                    "output": "custom transformed"
                }))
            }
        }
    }

    /// Execute conditional node
    async fn execute_conditional_node(
        &self,
        config: &crate::workflow::NodeConfig,
        inputs: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let branches = config.branches.as_ref().ok_or_else(|| {
            WorkflowError::InvalidDefinition("Conditional node has no branches".to_string())
        })?;

        for branch in branches {
            if branch.condition.evaluate(&inputs) {
                return Ok(serde_json::json!({
                    "branch": branch.name,
                    "target": branch.target_node,
                    "data": inputs
                }));
            }
        }

        // Default to first branch if no condition matches
        if let Some(default_branch) = branches.first() {
            Ok(serde_json::json!({
                "branch": default_branch.name,
                "target": default_branch.target_node,
                "data": inputs
            }))
        } else {
            Err(WorkflowError::InvalidDefinition(
                "No branch matched and no default".to_string(),
            )
            .into())
        }
    }

    /// Execute plugin node
    async fn execute_plugin_node(
        &self,
        config: &crate::workflow::NodeConfig,
        inputs: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let plugin_id = config.plugin_id.as_ref().map(|s| s.as_str()).unwrap_or("unknown");

        // In a real implementation, this would call the plugin framework
        Ok(serde_json::json!({
            "plugin": plugin_id,
            "input": inputs,
            "output": "plugin output"
        }))
    }

    /// Build topological sort of nodes
    fn build_execution_order(&self) -> Result<Vec<String>> {
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut adj_list: HashMap<String, Vec<String>> = HashMap::new();

        // Initialize
        for node in &self.definition.nodes {
            in_degree.insert(node.id.clone(), 0);
            adj_list.insert(node.id.clone(), Vec::new());
        }

        // Build adjacency list and calculate in-degrees
        for edge in &self.definition.edges {
            if let Some(neighbors) = adj_list.get_mut(&edge.source) {
                neighbors.push(edge.target.clone());
            }
            if let Some(degree) = in_degree.get_mut(&edge.target) {
                *degree += 1;
            }
        }

        // Kahn's algorithm
        let mut queue: VecDeque<String> = VecDeque::new();
        let mut result: Vec<String> = Vec::new();

        for (node_id, degree) in &in_degree {
            if *degree == 0 {
                queue.push_back(node_id.clone());
            }
        }

        while let Some(node_id) = queue.pop_front() {
            result.push(node_id.clone());

            if let Some(neighbors) = adj_list.get(&node_id) {
                for neighbor in neighbors {
                    if let Some(degree) = in_degree.get_mut(neighbor) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push_back(neighbor.clone());
                        }
                    }
                }
            }
        }

        if result.len() != self.definition.nodes.len() {
            return Err(WorkflowError::CircularDependency.into());
        }

        Ok(result)
    }

    /// Build final result
    fn build_result(&self) -> WorkflowResult {
        // Collect outputs from output nodes
        let outputs: HashMap<String, serde_json::Value> = self
            .definition
            .nodes
            .iter()
            .filter(|n| n.node_type == NodeType::Output)
            .filter_map(|n| {
                self.node_outputs
                    .get(&n.id)
                    .map(|v| (n.id.clone(), v.clone()))
            })
            .collect();

        WorkflowResult {
            workflow_id: self.context.workflow_id.clone(),
            execution_id: self.context.execution_id.clone(),
            status: self.status.clone(),
            outputs,
            node_results: self.node_results.clone(),
            metrics: self.metrics.clone(),
            started_at: self.started_at,
            completed_at: self.completed_at,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::workflow::{
        DataType, NodeConfig, Position, WorkflowEdge, WorkflowNode, WorkflowPort,
    };

    fn create_simple_workflow() -> WorkflowDefinition {
        WorkflowDefinition {
            id: "test-workflow".to_string(),
            name: "Test Workflow".to_string(),
            description: "A test workflow".to_string(),
            version: "1.0.0".to_string(),
            nodes: vec![
                WorkflowNode {
                    id: "input-1".to_string(),
                    node_type: NodeType::Input,
                    config: NodeConfig::default(),
                    inputs: vec![],
                    outputs: vec![WorkflowPort {
                        id: "output".to_string(),
                        name: "Output".to_string(),
                        data_type: DataType::Text,
                        required: true,
                    }],
                    position: Position::default(),
                    metadata: HashMap::new(),
                },
                WorkflowNode {
                    id: "output-1".to_string(),
                    node_type: NodeType::Output,
                    config: NodeConfig::default(),
                    inputs: vec![WorkflowPort {
                        id: "input".to_string(),
                        name: "Input".to_string(),
                        data_type: DataType::Any,
                        required: true,
                    }],
                    outputs: vec![],
                    position: Position::default(),
                    metadata: HashMap::new(),
                },
            ],
            edges: vec![WorkflowEdge {
                id: "edge-1".to_string(),
                source: "input-1".to_string(),
                target: "output-1".to_string(),
                source_port: "output".to_string(),
                target_port: "input".to_string(),
                conditions: None,
            }],
            variables: vec![],
            triggers: vec![],
            collaboration_settings: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        }
    }

    #[tokio::test]
    async fn test_workflow_execution() {
        let definition = create_simple_workflow();

        let context = ExecutionContext {
            workflow_id: definition.id.clone(),
            execution_id: "test-exec-1".to_string(),
            inputs: {
                let mut inputs = HashMap::new();
                inputs.insert("1".to_string(), serde_json::json!("test input"));
                inputs
            },
            variables: HashMap::new(),
        };

        let mut execution = WorkflowExecution::new(definition, context).await.unwrap();
        let result = execution.run().await.unwrap();

        assert_eq!(result.status, ExecutionStatus::Completed);
        assert_eq!(result.node_results.len(), 2);
    }

    #[tokio::test]
    async fn test_execution_order() {
        let definition = create_simple_workflow();

        let context = ExecutionContext {
            workflow_id: definition.id.clone(),
            execution_id: "test-exec-2".to_string(),
            inputs: HashMap::new(),
            variables: HashMap::new(),
        };

        let execution = WorkflowExecution::new(definition, context).await.unwrap();
        let order = execution.build_execution_order().unwrap();

        assert_eq!(order.len(), 2);
        assert_eq!(order[0], "input-1");
        assert_eq!(order[1], "output-1");
    }
}
