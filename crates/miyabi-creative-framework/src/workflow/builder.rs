//! Fluent workflow builder

use crate::workflow::{
    CollaborationSettings, Condition, ConditionalBranch, DataType, NodeConfig, NodeType,
    Position, TransformType, TriggerType, WorkflowDefinition, WorkflowEdge, WorkflowNode,
    WorkflowPort, WorkflowTrigger, WorkflowVariable,
};
use std::collections::HashMap;

/// Fluent builder for workflow definitions
pub struct WorkflowBuilder {
    name: String,
    description: String,
    version: String,
    nodes: Vec<WorkflowNode>,
    edges: Vec<WorkflowEdge>,
    variables: Vec<WorkflowVariable>,
    triggers: Vec<WorkflowTrigger>,
    collaboration_settings: Option<CollaborationSettings>,
    current_node: Option<String>,
    next_x: f64,
}

impl WorkflowBuilder {
    /// Create a new workflow builder
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            description: String::new(),
            version: "1.0.0".to_string(),
            nodes: Vec::new(),
            edges: Vec::new(),
            variables: Vec::new(),
            triggers: Vec::new(),
            collaboration_settings: None,
            current_node: None,
            next_x: 100.0,
        }
    }

    /// Set workflow description
    pub fn description(mut self, description: &str) -> Self {
        self.description = description.to_string();
        self
    }

    /// Set workflow version
    pub fn version(mut self, version: &str) -> Self {
        self.version = version.to_string();
        self
    }

    /// Add an input node
    pub fn input(mut self, name: &str, data_type: DataType) -> Self {
        let node_id = format!("input-{}", name);

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::Input,
            config: NodeConfig::default(),
            inputs: vec![],
            outputs: vec![WorkflowPort {
                id: "output".to_string(),
                name: "Output".to_string(),
                data_type,
                required: true,
            }],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add an AI processing node
    pub fn ai_process(mut self, name: &str, model_id: &str) -> Self {
        let node_id = format!("ai-{}", name);

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::AiProcessing,
            config: NodeConfig {
                model_id: Some(model_id.to_string()),
                ..Default::default()
            },
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: vec![WorkflowPort {
                id: "output".to_string(),
                name: "Output".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add a transformation node
    pub fn transform(mut self, name: &str, transform_type: TransformType) -> Self {
        let node_id = format!("transform-{}", name);

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::Transformation,
            config: NodeConfig {
                transform_type: Some(transform_type),
                ..Default::default()
            },
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: vec![WorkflowPort {
                id: "output".to_string(),
                name: "Output".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add a conditional branch node
    pub fn branch(
        mut self,
        name: &str,
        branches: Vec<(&str, Condition, &str)>,
    ) -> Self {
        let node_id = format!("branch-{}", name);

        let conditional_branches: Vec<ConditionalBranch> = branches
            .into_iter()
            .map(|(branch_name, condition, target)| ConditionalBranch {
                name: branch_name.to_string(),
                condition,
                target_node: target.to_string(),
            })
            .collect();

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::Conditional,
            config: NodeConfig {
                branches: Some(conditional_branches),
                ..Default::default()
            },
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: vec![],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add parallel execution nodes
    pub fn parallel(mut self, node_definitions: Vec<(&str, NodeType, NodeConfig)>) -> Self {
        let split_id = format!("parallel-split-{}", self.nodes.len());
        let join_id = format!("parallel-join-{}", self.nodes.len());

        // Create split node
        let split_node = WorkflowNode {
            id: split_id.clone(),
            node_type: NodeType::ParallelSplit,
            config: NodeConfig::default(),
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: node_definitions
                .iter()
                .enumerate()
                .map(|(i, _)| WorkflowPort {
                    id: format!("output-{}", i),
                    name: format!("Output {}", i),
                    data_type: DataType::Any,
                    required: true,
                })
                .collect(),
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&split_id, "output", "input");
        self.nodes.push(split_node);
        self.next_x += 200.0;

        // Create parallel nodes
        let mut parallel_ids = Vec::new();
        for (i, (name, node_type, config)) in node_definitions.into_iter().enumerate() {
            let node_id = format!("parallel-{}-{}", name, i);
            parallel_ids.push(node_id.clone());

            let node = WorkflowNode {
                id: node_id.clone(),
                node_type,
                config,
                inputs: vec![WorkflowPort {
                    id: "input".to_string(),
                    name: "Input".to_string(),
                    data_type: DataType::Any,
                    required: true,
                }],
                outputs: vec![WorkflowPort {
                    id: "output".to_string(),
                    name: "Output".to_string(),
                    data_type: DataType::Any,
                    required: true,
                }],
                position: Position {
                    x: self.next_x,
                    y: 100.0 + (i as f64 * 150.0),
                },
                metadata: HashMap::new(),
            };

            // Connect from split
            self.edges.push(WorkflowEdge {
                id: format!("edge-split-{}", node_id),
                source: split_id.clone(),
                target: node_id.clone(),
                source_port: format!("output-{}", i),
                target_port: "input".to_string(),
                conditions: None,
            });

            self.nodes.push(node);
        }

        self.next_x += 200.0;

        // Create join node
        let join_node = WorkflowNode {
            id: join_id.clone(),
            node_type: NodeType::ParallelJoin,
            config: NodeConfig::default(),
            inputs: parallel_ids
                .iter()
                .enumerate()
                .map(|(i, _)| WorkflowPort {
                    id: format!("input-{}", i),
                    name: format!("Input {}", i),
                    data_type: DataType::Any,
                    required: true,
                })
                .collect(),
            outputs: vec![WorkflowPort {
                id: "output".to_string(),
                name: "Output".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        // Connect parallel nodes to join
        for (i, node_id) in parallel_ids.iter().enumerate() {
            self.edges.push(WorkflowEdge {
                id: format!("edge-{}-join", node_id),
                source: node_id.clone(),
                target: join_id.clone(),
                source_port: "output".to_string(),
                target_port: format!("input-{}", i),
                conditions: None,
            });
        }

        self.nodes.push(join_node);
        self.current_node = Some(join_id);
        self.next_x += 200.0;

        self
    }

    /// Add an output node
    pub fn output(mut self, name: &str) -> Self {
        let node_id = format!("output-{}", name);

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::Output,
            config: NodeConfig::default(),
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: vec![],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add a plugin node
    pub fn plugin(mut self, name: &str, plugin_id: &str) -> Self {
        let node_id = format!("plugin-{}", name);

        let node = WorkflowNode {
            id: node_id.clone(),
            node_type: NodeType::Plugin,
            config: NodeConfig {
                plugin_id: Some(plugin_id.to_string()),
                ..Default::default()
            },
            inputs: vec![WorkflowPort {
                id: "input".to_string(),
                name: "Input".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            outputs: vec![WorkflowPort {
                id: "output".to_string(),
                name: "Output".to_string(),
                data_type: DataType::Any,
                required: true,
            }],
            position: Position { x: self.next_x, y: 100.0 },
            metadata: HashMap::new(),
        };

        self.connect_to_current(&node_id, "output", "input");
        self.nodes.push(node);
        self.current_node = Some(node_id);
        self.next_x += 200.0;

        self
    }

    /// Add a variable
    pub fn variable(
        mut self,
        name: &str,
        data_type: DataType,
        default: Option<serde_json::Value>,
    ) -> Self {
        self.variables.push(WorkflowVariable {
            name: name.to_string(),
            data_type,
            default_value: default,
            description: None,
        });
        self
    }

    /// Add a trigger
    pub fn trigger(mut self, trigger_type: TriggerType) -> Self {
        self.triggers.push(WorkflowTrigger {
            id: format!("trigger-{}", self.triggers.len()),
            trigger_type,
            config: HashMap::new(),
        });
        self
    }

    /// Enable collaboration
    pub fn with_collaboration(mut self, settings: CollaborationSettings) -> Self {
        self.collaboration_settings = Some(settings);
        self
    }

    /// Connect a custom edge
    pub fn connect(
        mut self,
        from: &str,
        to: &str,
        from_port: &str,
        to_port: &str,
    ) -> Self {
        self.edges.push(WorkflowEdge {
            id: format!("edge-{}-{}", from, to),
            source: from.to_string(),
            target: to.to_string(),
            source_port: from_port.to_string(),
            target_port: to_port.to_string(),
            conditions: None,
        });
        self
    }

    /// Build the workflow definition
    pub fn build(self) -> WorkflowDefinition {
        let now = chrono::Utc::now();

        WorkflowDefinition {
            id: uuid::Uuid::new_v4().to_string(),
            name: self.name,
            description: self.description,
            version: self.version,
            nodes: self.nodes,
            edges: self.edges,
            variables: self.variables,
            triggers: self.triggers,
            collaboration_settings: self.collaboration_settings,
            created_at: now,
            updated_at: now,
        }
    }

    // Private helper to connect nodes
    fn connect_to_current(&mut self, target: &str, source_port: &str, target_port: &str) {
        if let Some(ref current) = self.current_node {
            self.edges.push(WorkflowEdge {
                id: format!("edge-{}-{}", current, target),
                source: current.clone(),
                target: target.to_string(),
                source_port: source_port.to_string(),
                target_port: target_port.to_string(),
                conditions: None,
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_workflow() {
        let workflow = WorkflowBuilder::new("test-workflow")
            .description("A test workflow")
            .input("prompt", DataType::Text)
            .ai_process("generate", "claude-3-5-sonnet")
            .output("result")
            .build();

        assert_eq!(workflow.name, "test-workflow");
        assert_eq!(workflow.nodes.len(), 3);
        assert_eq!(workflow.edges.len(), 2);
    }

    #[test]
    fn test_workflow_with_transform() {
        let workflow = WorkflowBuilder::new("transform-workflow")
            .input("data", DataType::Json)
            .transform("process", TransformType::JsonTransform)
            .ai_process("analyze", "gpt-4o")
            .output("analysis")
            .build();

        assert_eq!(workflow.nodes.len(), 4);
        assert_eq!(workflow.edges.len(), 3);
    }

    #[test]
    fn test_workflow_with_variables() {
        let workflow = WorkflowBuilder::new("var-workflow")
            .variable("temperature", DataType::Number, Some(serde_json::json!(0.7)))
            .input("prompt", DataType::Text)
            .output("result")
            .build();

        assert_eq!(workflow.variables.len(), 1);
        assert_eq!(workflow.variables[0].name, "temperature");
    }
}
