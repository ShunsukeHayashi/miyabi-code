//! WorkflowBuilder - Fluent API for defining agent workflows

use crate::condition::{Condition, ConditionalBranch};
use crate::error::{Result, WorkflowError};
use miyabi_types::{
    agent::AgentType,
    task::{Task, TaskType},
    workflow::{Edge, DAG},
};
use std::collections::HashSet;

/// Builder for constructing agent workflows
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

/// Type of workflow step
#[derive(Clone, Debug, PartialEq)]
pub enum StepType {
    /// Sequential step (default)
    Sequential,
    /// Parallel step (executes concurrently with siblings)
    Parallel,
    /// Conditional branch with multiple possible paths
    Conditional { branches: Vec<ConditionalBranch> },
}

impl WorkflowBuilder {
    /// Create a new workflow with the given name
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            steps: Vec::new(),
            current_step: None,
        }
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

    /// Add a simple conditional branch (pass/fail pattern)
    ///
    /// Creates a branch step with two paths: one for success, one for failure.
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let workflow = WorkflowBuilder::new("ci-cd")
    ///     .step("test", AgentType::ReviewAgent)
    ///     .branch("decision", "deploy", "rollback")
    ///     .step("deploy", AgentType::DeploymentAgent)
    ///     .step("rollback", AgentType::CodeGenAgent);
    /// ```
    pub fn branch(mut self, name: &str, pass_step: &str, fail_step: &str) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let dependencies = self
            .current_step
            .as_ref()
            .map(|id| vec![id.clone()])
            .unwrap_or_default();

        let branches = vec![
            ConditionalBranch::new(
                "pass",
                Condition::FieldEquals {
                    field: "success".to_string(),
                    value: serde_json::Value::Bool(true),
                },
                pass_step,
            ),
            ConditionalBranch::new("fail", Condition::Always, fail_step),
        ];

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: AgentType::CoordinatorAgent,
            dependencies,
            step_type: StepType::Conditional { branches },
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add a conditional branch with custom conditions
    ///
    /// Allows specifying multiple branches with different conditions.
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::{WorkflowBuilder, Condition};
    /// use miyabi_types::agent::AgentType;
    /// use serde_json::json;
    ///
    /// let workflow = WorkflowBuilder::new("quality-check")
    ///     .step("analyze", AgentType::ReviewAgent)
    ///     .branch_on("route", vec![
    ///         ("high", Condition::FieldGreaterThan {
    ///             field: "quality".to_string(),
    ///             value: 0.9,
    ///         }, "fast-deploy"),
    ///         ("medium", Condition::FieldGreaterThan {
    ///             field: "quality".to_string(),
    ///             value: 0.7,
    ///         }, "manual-review"),
    ///         ("low", Condition::Always, "reject"),
    ///     ]);
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
            .map(|(branch_name, condition, next_step)| {
                ConditionalBranch::new(branch_name, condition, next_step)
            })
            .collect();

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: AgentType::CoordinatorAgent,
            dependencies,
            step_type: StepType::Conditional {
                branches: conditional_branches,
            },
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
            let dependencies = parent_id
                .as_ref()
                .map(|id| vec![id.clone()])
                .unwrap_or_default();

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
                metadata: None,
                severity: None,
                impact: None,
            };
            nodes.push(task);

            // Add edges based on step type
            match &step.step_type {
                StepType::Conditional { branches } => {
                    // For conditional steps, add edges to all possible branch targets
                    for branch in branches {
                        edges.push(Edge {
                            from: step.id.clone(),
                            to: branch.next_step.clone(),
                        });
                    }
                }
                StepType::Sequential | StepType::Parallel => {
                    // Normal dependency edges
                    for dep in &step.dependencies {
                        edges.push(Edge {
                            from: dep.clone(),
                            to: step.id.clone(),
                        });
                    }
                }
            }
        }

        let levels = self.compute_levels(&nodes, &edges)?;

        Ok(DAG {
            nodes,
            edges,
            levels,
        })
    }

    fn compute_levels(&self, nodes: &[Task], edges: &[Edge]) -> Result<Vec<Vec<String>>> {
        let mut levels: Vec<Vec<String>> = Vec::new();
        let mut remaining: HashSet<String> = nodes.iter().map(|n| n.id.clone()).collect();

        while !remaining.is_empty() {
            let mut current_level = Vec::new();

            for node_id in &remaining {
                let has_unresolved_deps = edges
                    .iter()
                    .any(|e| e.to == *node_id && remaining.contains(&e.from));

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
            .parallel(vec![
                ("task1", AgentType::CodeGenAgent),
                ("task2", AgentType::ReviewAgent),
            ]);

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
            .parallel(vec![
                ("test", AgentType::ReviewAgent),
                ("lint", AgentType::CodeGenAgent),
            ]);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 4);
        assert!(dag.levels.len() >= 2);
    }

    #[test]
    fn test_conditional_branch_simple() {
        let workflow = WorkflowBuilder::new("ci-cd")
            .step("test", AgentType::ReviewAgent)
            .branch("decision", "deploy", "rollback")
            .step("deploy", AgentType::DeploymentAgent)
            .step("rollback", AgentType::CodeGenAgent);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 4);

        // Find the decision step
        let decision_step = dag.nodes.iter().find(|n| n.title == "decision").unwrap();

        // Check that decision step has edges to both deploy and rollback
        let edges_from_decision: Vec<_> = dag
            .edges
            .iter()
            .filter(|e| e.from == decision_step.id)
            .collect();

        assert_eq!(edges_from_decision.len(), 2);

        // Verify targets
        let targets: Vec<&String> = edges_from_decision.iter().map(|e| &e.to).collect();
        assert!(targets.iter().any(|t| *t == "deploy"));
        assert!(targets.iter().any(|t| *t == "rollback"));
    }

    #[test]
    fn test_conditional_branch_on() {
        use crate::condition::Condition;

        let workflow = WorkflowBuilder::new("quality-check")
            .step("analyze", AgentType::ReviewAgent)
            .branch_on(
                "route",
                vec![
                    (
                        "high",
                        Condition::FieldGreaterThan {
                            field: "quality".to_string(),
                            value: 0.9,
                        },
                        "fast-deploy",
                    ),
                    (
                        "medium",
                        Condition::FieldGreaterThan {
                            field: "quality".to_string(),
                            value: 0.7,
                        },
                        "manual-review",
                    ),
                    ("low", Condition::Always, "reject"),
                ],
            )
            .step("fast-deploy", AgentType::DeploymentAgent)
            .step("manual-review", AgentType::ReviewAgent)
            .step("reject", AgentType::CodeGenAgent);

        let dag = workflow.build_dag().unwrap();
        assert_eq!(dag.nodes.len(), 5);

        // Find the route step
        let route_step = dag.nodes.iter().find(|n| n.title == "route").unwrap();

        // Check that route step has edges to all three targets
        let edges_from_route: Vec<_> = dag
            .edges
            .iter()
            .filter(|e| e.from == route_step.id)
            .collect();

        assert_eq!(edges_from_route.len(), 3);
    }

    #[test]
    fn test_step_type_conditional() {
        use crate::condition::{Condition, ConditionalBranch};

        let branches = vec![
            ConditionalBranch::new(
                "pass",
                Condition::FieldEquals {
                    field: "success".to_string(),
                    value: serde_json::Value::Bool(true),
                },
                "deploy",
            ),
            ConditionalBranch::new("fail", Condition::Always, "rollback"),
        ];

        let step_type = StepType::Conditional {
            branches: branches.clone(),
        };

        match step_type {
            StepType::Conditional { branches: b } => {
                assert_eq!(b.len(), 2);
                assert_eq!(b[0].name, "pass");
                assert_eq!(b[1].name, "fail");
            }
            _ => panic!("Expected Conditional step type"),
        }
    }

    #[test]
    fn test_conditional_workflow_integration() {
        let workflow = WorkflowBuilder::new("full-pipeline")
            .step("build", AgentType::CodeGenAgent)
            .then("test", AgentType::ReviewAgent)
            .branch("deploy-decision", "production", "staging")
            .step("production", AgentType::DeploymentAgent)
            .step("staging", AgentType::DeploymentAgent);

        let dag = workflow.build_dag().unwrap();

        // Verify structure
        assert_eq!(dag.nodes.len(), 5);

        // Verify edge structure
        assert!(dag
            .edges
            .iter()
            .any(|e| e.from == "step-0" && e.to == "step-1")); // build -> test
        assert!(dag.edges.iter().any(|e| e.from == "step-2")); // decision has outgoing edges

        // The decision step should have 2 outgoing edges
        let decision_edges: Vec<_> = dag.edges.iter().filter(|e| e.from == "step-2").collect();
        assert_eq!(decision_edges.len(), 2);
    }
}
