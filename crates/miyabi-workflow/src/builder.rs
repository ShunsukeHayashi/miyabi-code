//! WorkflowBuilder - Fluent API for defining agent workflows

use crate::condition::Condition;
use crate::error::{Result, WorkflowError};
use miyabi_types::{
    agent::AgentType,
    task::{Task, TaskType},
    workflow::{Edge, DAG},
};
use std::collections::HashSet;

/// Builder for constructing agent workflows
#[derive(Clone)]
pub struct WorkflowBuilder {
    name: String,
    steps: Vec<Step>,
    current_step: Option<String>,
}

/// A single step in a workflow
#[derive(Clone, Debug)]
pub struct Step {
    pub id: String,
    pub name: String,
    pub agent_type: AgentType,
    pub dependencies: Vec<String>,
    pub step_type: StepType,
}

/// Conditional branch definition
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct ConditionalBranch {
    /// Branch name
    pub name: String,
    /// Condition to evaluate
    pub condition: Condition,
    /// ID of next step if condition is true
    pub next_step: String,
}

/// Type of workflow step
#[derive(Clone, Debug, PartialEq)]
pub enum StepType {
    /// Sequential step (default)
    Sequential,
    /// Parallel step (executes concurrently with siblings)
    Parallel,
    /// Conditional branching with multiple possible paths
    Conditional { branches: Vec<ConditionalBranch> },
}

impl WorkflowBuilder {
    /// Create a new workflow with the given name
    pub fn new(name: &str) -> Self {
        Self { name: name.to_string(), steps: Vec::new(), current_step: None }
    }

    /// Add a step to the workflow (no dependencies)
    pub fn step(mut self, name: &str, agent: AgentType) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: agent,
            dependencies: vec![],
            step_type: StepType::Sequential,
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add a sequential step that depends on the previous step
    pub fn then(mut self, name: &str, agent: AgentType) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let dependencies = self
            .current_step
            .as_ref()
            .map(|id| vec![id.clone()])
            .unwrap_or_default();

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: agent,
            dependencies,
            step_type: StepType::Sequential,
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add a conditional branch with custom conditions
    ///
    /// # Arguments
    /// * `name` - Name of the decision point
    /// * `branches` - Vec of (branch_name, condition, next_step_id) tuples
    ///
    /// # Example
    /// ```ignore
    /// workflow.branch_on("quality-gate", vec![
    ///     ("high", Condition::FieldGreaterThan { field: "score".into(), value: 0.9 }, "deploy"),
    ///     ("low", Condition::Always, "reject"),
    /// ]);
    /// ```
    pub fn branch_on(mut self, name: &str, branches: Vec<(&str, Condition, &str)>) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let dependencies = self
            .current_step
            .as_ref()
            .map(|id| vec![id.clone()])
            .unwrap_or_default();

        let conditional_branches: Vec<ConditionalBranch> = branches
            .into_iter()
            .map(|(branch_name, condition, next)| ConditionalBranch {
                name: branch_name.to_string(),
                condition,
                next_step: next.to_string(),
            })
            .collect();

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: AgentType::CoordinatorAgent,
            dependencies,
            step_type: StepType::Conditional { branches: conditional_branches },
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add a simple pass/fail conditional branch
    ///
    /// This is a convenience method for the common case of branching on success/failure.
    ///
    /// # Arguments
    /// * `name` - Name of the decision point
    /// * `pass_step` - Step ID to execute if condition passes
    /// * `fail_step` - Step ID to execute if condition fails
    ///
    /// # Example
    /// ```ignore
    /// workflow
    ///     .step("test", AgentType::ReviewAgent)
    ///     .branch("deploy-decision", "deploy", "rollback");
    /// ```
    pub fn branch(mut self, name: &str, pass_step: &str, fail_step: &str) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let dependencies = self
            .current_step
            .as_ref()
            .map(|id| vec![id.clone()])
            .unwrap_or_default();

        let conditional_branches = vec![
            ConditionalBranch {
                name: "pass".to_string(),
                condition: Condition::success("success"),
                next_step: pass_step.to_string(),
            },
            ConditionalBranch {
                name: "fail".to_string(),
                condition: Condition::Always,
                next_step: fail_step.to_string(),
            },
        ];

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: AgentType::CoordinatorAgent,
            dependencies,
            step_type: StepType::Conditional { branches: conditional_branches },
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add parallel steps that execute concurrently
    pub fn parallel(mut self, steps: Vec<(&str, AgentType)>) -> Self {
        let parent_id = self.current_step.clone();

        for (name, agent) in steps {
            let step_id = format!("step-{}", self.steps.len());
            let dependencies = parent_id.as_ref().map(|id| vec![id.clone()]).unwrap_or_default();

            let step = Step {
                id: step_id.clone(),
                name: name.to_string(),
                agent_type: agent,
                dependencies,
                step_type: StepType::Parallel,
            };

            self.steps.push(step);
        }

        self.current_step = None;
        self
    }

    /// Build the DAG representation of this workflow
    pub fn build_dag(self) -> Result<DAG> {
        if self.steps.is_empty() {
            return Err(WorkflowError::EmptyWorkflow);
        }

        let mut nodes = Vec::new();
        let mut edges = Vec::new();

        for step in &self.steps {
            // Add metadata for conditional steps
            let metadata = if let StepType::Conditional { branches } = &step.step_type {
                let mut meta = std::collections::HashMap::new();
                meta.insert("is_conditional".to_string(), serde_json::json!(true));
                meta.insert(
                    "conditional_branches".to_string(),
                    serde_json::to_value(branches).unwrap_or(serde_json::Value::Null),
                );
                Some(meta)
            } else {
                None
            };

            let task = Task {
                id: step.id.clone(),
                title: step.name.clone(),
                description: format!("Workflow step: {}", step.name),
                task_type: TaskType::Feature,
                priority: 1,
                assigned_agent: Some(step.agent_type),
                dependencies: step.dependencies.clone(),
                estimated_duration: None,
                status: None,
                start_time: None,
                end_time: None,
                metadata,
                severity: None,
                impact: None,
            };
            nodes.push(task);

            // Add dependency edges (incoming edges to this step)
            for dep in &step.dependencies {
                edges.push(Edge { from: dep.clone(), to: step.id.clone() });
            }

            // Add conditional branch edges (outgoing edges from this step)
            if let StepType::Conditional { branches } = &step.step_type {
                for branch in branches {
                    edges.push(Edge { from: step.id.clone(), to: branch.next_step.clone() });
                }
            }
        }

        let levels = self.compute_levels(&nodes, &edges)?;

        Ok(DAG { nodes, edges, levels })
    }

    fn compute_levels(&self, nodes: &[Task], edges: &[Edge]) -> Result<Vec<Vec<String>>> {
        let mut levels: Vec<Vec<String>> = Vec::new();
        let mut remaining: HashSet<String> = nodes.iter().map(|n| n.id.clone()).collect();

        while !remaining.is_empty() {
            let mut current_level = Vec::new();

            for node_id in &remaining {
                let has_unresolved_deps = edges.iter().any(|e| e.to == *node_id && remaining.contains(&e.from));

                if !has_unresolved_deps {
                    current_level.push(node_id.clone());
                }
            }

            if current_level.is_empty() {
                return Err(WorkflowError::CircularDependency);
            }

            for id in &current_level {
                remaining.remove(id);
            }

            levels.push(current_level);
        }

        Ok(levels)
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn steps(&self) -> &[Step] {
        &self.steps
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::agent::AgentType;

    #[test]
    fn test_empty_workflow() {
        let workflow = WorkflowBuilder::new("empty");
        let result = workflow.build_dag();
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WorkflowError::EmptyWorkflow));
    }

    #[test]
    fn test_single_step() {
        let workflow = WorkflowBuilder::new("single").step("analyze", AgentType::IssueAgent);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 1);
        assert_eq!(dag.edges.len(), 0);
        assert_eq!(dag.levels.len(), 1);
        assert_eq!(dag.levels[0].len(), 1);
    }

    #[test]
    fn test_sequential_workflow() {
        let workflow = WorkflowBuilder::new("sequential")
            .step("analyze", AgentType::IssueAgent)
            .then("implement", AgentType::CodeGenAgent);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 2);
        assert_eq!(dag.edges.len(), 1);
        assert_eq!(dag.levels.len(), 2);
    }

    #[test]
    fn test_parallel_workflow() {
        let workflow = WorkflowBuilder::new("parallel")
            .step("start", AgentType::IssueAgent)
            .parallel(vec![("task1", AgentType::CodeGenAgent), ("task2", AgentType::ReviewAgent)]);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 3);
        assert_eq!(dag.levels.len(), 2);
        assert_eq!(dag.levels[1].len(), 2);
    }

    #[test]
    fn test_complex_workflow() {
        let workflow = WorkflowBuilder::new("complex")
            .step("analyze", AgentType::IssueAgent)
            .then("implement", AgentType::CodeGenAgent)
            .parallel(vec![("test", AgentType::ReviewAgent), ("lint", AgentType::CodeGenAgent)]);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 4);
        assert!(dag.levels.len() >= 2);
    }
}
