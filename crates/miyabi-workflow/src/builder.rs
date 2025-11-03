//! Workflow Builder - Mastra-style fluent API for DAG construction
//!
//! Provides a user-friendly builder pattern for creating complex task workflows
//! with `.step()`, `.then()`, `.branch()`, and `.parallel()` methods.

use miyabi_types::{
    agent::AgentType,
    task::{Task, TaskType},
    workflow::{Edge, DAG},
};
use std::collections::HashMap;

/// Workflow builder for constructing task DAGs
pub struct WorkflowBuilder {
    /// Workflow name
    name: String,
    /// List of workflow steps
    steps: Vec<Step>,
    /// Current step ID (for chaining)
    current_step: Option<String>,
}

/// A single step in the workflow
#[derive(Clone, Debug)]
pub struct Step {
    /// Unique step identifier
    pub id: String,
    /// Step name
    pub name: String,
    /// Agent type to execute this step
    pub agent_type: AgentType,
    /// Dependencies (step IDs this step depends on)
    pub dependencies: Vec<String>,
    /// Step type (sequential, parallel, conditional)
    pub step_type: StepType,
}

/// Step execution type
#[derive(Clone, Debug)]
pub enum StepType {
    /// Sequential execution (default)
    Sequential,
    /// Parallel execution
    Parallel,
    /// Conditional execution
    Conditional { condition: String },
}

impl WorkflowBuilder {
    /// Create a new workflow builder
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    ///
    /// let workflow = WorkflowBuilder::new("issue-resolution");
    /// ```
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            steps: Vec::new(),
            current_step: None,
        }
    }

    /// Add a new step to the workflow
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let workflow = WorkflowBuilder::new("example")
    ///     .step("analyze", AgentType::IssueAgent);
    /// ```
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

    /// Add a sequential step that depends on the current step
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let workflow = WorkflowBuilder::new("example")
    ///     .step("analyze", AgentType::IssueAgent)
    ///     .then("implement", AgentType::CodeGenAgent);
    /// ```
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

    /// Add a conditional branch
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let workflow = WorkflowBuilder::new("example")
    ///     .step("analyze", AgentType::IssueAgent)
    ///     .branch("critical-path", "if priority > 5".to_string());
    /// ```
    pub fn branch(mut self, name: &str, condition: String) -> Self {
        let step_id = format!("step-{}", self.steps.len());
        let dependencies = self
            .current_step
            .as_ref()
            .map(|id| vec![id.clone()])
            .unwrap_or_default();

        let step = Step {
            id: step_id.clone(),
            name: name.to_string(),
            agent_type: AgentType::CoordinatorAgent, // Coordinator evaluates conditions
            dependencies,
            step_type: StepType::Conditional { condition },
        };

        self.steps.push(step);
        self.current_step = Some(step_id);
        self
    }

    /// Add multiple parallel steps
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let workflow = WorkflowBuilder::new("example")
    ///     .step("analyze", AgentType::IssueAgent)
    ///     .parallel(vec![
    ///         ("test", AgentType::ReviewAgent),
    ///         ("lint", AgentType::CodeGenAgent),
    ///     ]);
    /// ```
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

        // No single current step after parallel execution
        self.current_step = None;
        self
    }

    /// Build the DAG from the workflow steps
    ///
    /// Performs topological sort and validates the graph.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The workflow contains circular dependencies
    /// - The graph is invalid
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::WorkflowBuilder;
    /// use miyabi_types::agent::AgentType;
    ///
    /// let dag = WorkflowBuilder::new("example")
    ///     .step("analyze", AgentType::IssueAgent)
    ///     .then("implement", AgentType::CodeGenAgent)
    ///     .build_dag()
    ///     .unwrap();
    ///
    /// assert_eq!(dag.nodes.len(), 2);
    /// ```
    pub fn build_dag(self) -> Result<DAG, anyhow::Error> {
        // Convert steps to Task nodes
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

            // Create edges from dependencies
            for dep in &step.dependencies {
                edges.push(Edge {
                    from: dep.clone(),
                    to: step.id.clone(),
                });
            }
        }

        // Compute topological levels
        let levels = self.compute_levels(&nodes, &edges)?;

        let dag = DAG {
            nodes,
            edges,
            levels,
        };

        // Validate the DAG
        dag.validate()
            .map_err(|e| anyhow::anyhow!("DAG validation failed: {}", e))?;

        Ok(dag)
    }

    /// Compute topological levels for parallel execution
    ///
    /// Uses Kahn's algorithm to perform topological sort and group
    /// tasks into levels where tasks at the same level can execute in parallel.
    fn compute_levels(
        &self,
        nodes: &[Task],
        edges: &[Edge],
    ) -> Result<Vec<Vec<String>>, anyhow::Error> {
        use std::collections::VecDeque;

        // Build dependency maps
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut adj_list: HashMap<String, Vec<String>> = HashMap::new();

        // Initialize all nodes with in-degree 0
        for node in nodes {
            in_degree.insert(node.id.clone(), 0);
            adj_list.insert(node.id.clone(), Vec::new());
        }

        // Build adjacency list and compute in-degrees
        for edge in edges {
            *in_degree.get_mut(&edge.to).unwrap() += 1;
            adj_list.get_mut(&edge.from).unwrap().push(edge.to.clone());
        }

        // Kahn's algorithm: process nodes level by level
        let mut levels: Vec<Vec<String>> = Vec::new();
        let mut queue: VecDeque<String> = VecDeque::new();

        // Start with nodes that have no dependencies (in-degree 0)
        for (node_id, &degree) in &in_degree {
            if degree == 0 {
                queue.push_back(node_id.clone());
            }
        }

        let mut processed = 0;

        while !queue.is_empty() {
            let level_size = queue.len();
            let mut current_level = Vec::new();

            for _ in 0..level_size {
                if let Some(node_id) = queue.pop_front() {
                    current_level.push(node_id.clone());
                    processed += 1;

                    // Reduce in-degree of neighbors
                    if let Some(neighbors) = adj_list.get(&node_id) {
                        for neighbor in neighbors {
                            let degree = in_degree.get_mut(neighbor).unwrap();
                            *degree -= 1;
                            if *degree == 0 {
                                queue.push_back(neighbor.clone());
                            }
                        }
                    }
                }
            }

            if !current_level.is_empty() {
                levels.push(current_level);
            }
        }

        // Check for cycles
        if processed != nodes.len() {
            return Err(anyhow::anyhow!(
                "Circular dependency detected: processed {} of {} nodes",
                processed,
                nodes.len()
            ));
        }

        Ok(levels)
    }

    /// Get workflow name
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Get workflow steps
    pub fn steps(&self) -> &[Step] {
        &self.steps
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workflow_builder_creation() {
        let builder = WorkflowBuilder::new("test-workflow");
        assert_eq!(builder.name(), "test-workflow");
        assert_eq!(builder.steps().len(), 0);
    }

    #[test]
    fn test_single_step() {
        let builder = WorkflowBuilder::new("single").step("analyze", AgentType::IssueAgent);

        assert_eq!(builder.steps().len(), 1);
        assert_eq!(builder.steps()[0].name, "analyze");
        assert_eq!(builder.steps()[0].dependencies.len(), 0);
    }

    #[test]
    fn test_sequential_steps() {
        let builder = WorkflowBuilder::new("sequential")
            .step("step1", AgentType::IssueAgent)
            .then("step2", AgentType::CodeGenAgent)
            .then("step3", AgentType::ReviewAgent);

        assert_eq!(builder.steps().len(), 3);
        assert_eq!(builder.steps()[1].dependencies.len(), 1);
        assert_eq!(builder.steps()[2].dependencies.len(), 1);
    }

    #[test]
    fn test_parallel_steps() {
        let builder = WorkflowBuilder::new("parallel")
            .step("start", AgentType::IssueAgent)
            .parallel(vec![
                ("task1", AgentType::CodeGenAgent),
                ("task2", AgentType::ReviewAgent),
                ("task3", AgentType::PRAgent),
            ]);

        assert_eq!(builder.steps().len(), 4);
        // All parallel tasks depend on "start"
        assert_eq!(builder.steps()[1].dependencies[0], "step-0");
        assert_eq!(builder.steps()[2].dependencies[0], "step-0");
        assert_eq!(builder.steps()[3].dependencies[0], "step-0");
    }

    #[test]
    fn test_build_dag_simple() {
        let dag = WorkflowBuilder::new("simple")
            .step("step1", AgentType::IssueAgent)
            .then("step2", AgentType::CodeGenAgent)
            .build_dag()
            .unwrap();

        assert_eq!(dag.nodes.len(), 2);
        assert_eq!(dag.edges.len(), 1);
        assert_eq!(dag.levels.len(), 2);
        assert_eq!(dag.levels[0].len(), 1); // step1
        assert_eq!(dag.levels[1].len(), 1); // step2
    }

    #[test]
    fn test_build_dag_parallel() {
        let dag = WorkflowBuilder::new("parallel")
            .step("start", AgentType::IssueAgent)
            .parallel(vec![
                ("task1", AgentType::CodeGenAgent),
                ("task2", AgentType::ReviewAgent),
            ])
            .build_dag()
            .unwrap();

        assert_eq!(dag.nodes.len(), 3);
        assert_eq!(dag.levels.len(), 2);
        assert_eq!(dag.levels[0].len(), 1); // start
        assert_eq!(dag.levels[1].len(), 2); // task1, task2 in parallel
    }

    #[test]
    fn test_build_dag_complex() {
        let dag = WorkflowBuilder::new("complex")
            .step("analyze", AgentType::IssueAgent)
            .parallel(vec![
                ("implement", AgentType::CodeGenAgent),
                ("document", AgentType::CodeGenAgent),
            ])
            .build_dag()
            .unwrap();

        assert_eq!(dag.nodes.len(), 3);
        assert_eq!(dag.levels.len(), 2);
    }

    #[test]
    fn test_dag_validation_success() {
        let dag = WorkflowBuilder::new("valid")
            .step("step1", AgentType::IssueAgent)
            .then("step2", AgentType::CodeGenAgent)
            .build_dag()
            .unwrap();

        assert!(dag.validate().is_ok());
    }
}
