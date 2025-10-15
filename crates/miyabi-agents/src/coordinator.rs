//! CoordinatorAgent - Task decomposition and DAG construction
//!
//! Responsible for breaking down Issues into executable Tasks and creating
//! a Directed Acyclic Graph (DAG) for dependency management.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::{Task, TaskDecomposition, TaskType};
use miyabi_types::workflow::{Edge, DAG};
use miyabi_types::{AgentConfig, AgentResult, Issue};
use serde_json::json;
use std::collections::HashMap;

pub struct CoordinatorAgent {
    config: AgentConfig,
}

impl CoordinatorAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Decompose an Issue into Tasks
    pub async fn decompose_issue(&self, issue: &Issue) -> Result<TaskDecomposition> {
        tracing::info!("Decomposing issue #{}: {}", issue.number, issue.title);

        // Analyze issue to determine task breakdown
        let tasks = self.analyze_and_create_tasks(issue).await?;

        // Build DAG from task dependencies
        let dag = self.build_dag(&tasks)?;

        // Validate DAG (no cycles)
        let has_cycles = dag.has_cycles();
        if has_cycles {
            return Err(MiyabiError::Validation(
                "Task DAG contains cycles - cannot execute".to_string(),
            ));
        }

        // Calculate total estimated duration
        let estimated_total_duration = tasks
            .iter()
            .filter_map(|t| t.estimated_duration)
            .sum();

        // Generate recommendations
        let recommendations = self.generate_recommendations(&tasks, &dag);

        Ok(TaskDecomposition {
            original_issue: issue.clone(),
            tasks,
            dag,
            estimated_total_duration,
            has_cycles,
            recommendations,
        })
    }

    /// Analyze issue and create tasks based on type and labels
    async fn analyze_and_create_tasks(&self, issue: &Issue) -> Result<Vec<Task>> {
        let mut tasks = Vec::new();

        // Determine task type from issue labels
        let task_type = self.infer_task_type(issue);

        // Basic task decomposition strategy
        // In a real implementation, this would use LLM or more sophisticated analysis

        // 1. Analysis task (always first)
        tasks.push(Task {
            id: format!("task-{}-analysis", issue.number),
            title: format!("Analyze requirements for #{}", issue.number),
            description: "Analyze issue requirements and create detailed specification".to_string(),
            task_type: TaskType::Docs,
            priority: 0,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::IssueAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                json!(issue.number),
            )])),
        });

        // 2. Implementation task
        tasks.push(Task {
            id: format!("task-{}-impl", issue.number),
            title: format!("Implement solution for #{}", issue.number),
            description: issue.body.clone(),
            task_type,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![format!("task-{}-analysis", issue.number)],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                json!(issue.number),
            )])),
        });

        // 3. Testing task
        tasks.push(Task {
            id: format!("task-{}-test", issue.number),
            title: format!("Add tests for #{}", issue.number),
            description: "Create comprehensive test coverage".to_string(),
            task_type: TaskType::Test,
            priority: 2,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![format!("task-{}-impl", issue.number)],
            estimated_duration: Some(15),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                json!(issue.number),
            )])),
        });

        // 4. Review task
        tasks.push(Task {
            id: format!("task-{}-review", issue.number),
            title: format!("Review code quality for #{}", issue.number),
            description: "Run quality checks and code review".to_string(),
            task_type: TaskType::Refactor,
            priority: 3,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::ReviewAgent),
            dependencies: vec![format!("task-{}-test", issue.number)],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                json!(issue.number),
            )])),
        });

        Ok(tasks)
    }

    /// Build DAG from tasks
    fn build_dag(&self, tasks: &[Task]) -> Result<DAG> {
        let mut edges = Vec::new();
        let mut task_map: HashMap<String, &Task> = HashMap::new();

        // Build task ID map
        for task in tasks {
            task_map.insert(task.id.clone(), task);
        }

        // Build edges from dependencies
        for task in tasks {
            for dep_id in &task.dependencies {
                if !task_map.contains_key(dep_id) {
                    return Err(MiyabiError::Validation(format!(
                        "Task {} depends on non-existent task {}",
                        task.id, dep_id
                    )));
                }
                edges.push(Edge {
                    from: dep_id.clone(),
                    to: task.id.clone(),
                });
            }
        }

        // Topological sort to create levels
        let levels = self.topological_sort(tasks, &edges)?;

        Ok(DAG {
            nodes: tasks.to_vec(),
            edges,
            levels,
        })
    }

    /// Topological sort to determine execution levels
    fn topological_sort(&self, tasks: &[Task], edges: &[Edge]) -> Result<Vec<Vec<String>>> {
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut graph: HashMap<String, Vec<String>> = HashMap::new();

        // Initialize
        for task in tasks {
            in_degree.insert(task.id.clone(), 0);
            graph.insert(task.id.clone(), Vec::new());
        }

        // Build graph and in-degrees
        for edge in edges {
            graph.get_mut(&edge.from).unwrap().push(edge.to.clone());
            *in_degree.get_mut(&edge.to).unwrap() += 1;
        }

        // Find nodes with no dependencies (level 0)
        let mut levels: Vec<Vec<String>> = Vec::new();
        let mut queue: Vec<String> = in_degree
            .iter()
            .filter(|(_, &deg)| deg == 0)
            .map(|(id, _)| id.clone())
            .collect();

        queue.sort(); // Deterministic ordering

        while !queue.is_empty() {
            levels.push(queue.clone());

            let mut next_queue = Vec::new();
            for node in &queue {
                if let Some(neighbors) = graph.get(node) {
                    for neighbor in neighbors {
                        let deg = in_degree.get_mut(neighbor).unwrap();
                        *deg -= 1;
                        if *deg == 0 {
                            next_queue.push(neighbor.clone());
                        }
                    }
                }
            }

            next_queue.sort(); // Deterministic ordering
            queue = next_queue;
        }

        Ok(levels)
    }

    /// Infer task type from issue labels
    fn infer_task_type(&self, issue: &Issue) -> TaskType {
        for label in &issue.labels {
            if label.contains("bug") || label.contains("type:bug") {
                return TaskType::Bug;
            }
            if label.contains("feature") || label.contains("type:feature") {
                return TaskType::Feature;
            }
            if label.contains("refactor") || label.contains("type:refactor") {
                return TaskType::Refactor;
            }
            if label.contains("docs") || label.contains("type:docs") {
                return TaskType::Docs;
            }
            if label.contains("test") || label.contains("type:test") {
                return TaskType::Test;
            }
            if label.contains("deployment") || label.contains("type:deployment") {
                return TaskType::Deployment;
            }
        }

        // Default to Feature
        TaskType::Feature
    }

    /// Generate recommendations based on task analysis
    fn generate_recommendations(&self, tasks: &[Task], dag: &DAG) -> Vec<String> {
        let mut recommendations = Vec::new();

        // Check for long critical path
        let critical_path = dag.critical_path();
        if critical_path.len() > 5 {
            recommendations.push(format!(
                "Critical path has {} tasks - consider parallelizing more work",
                critical_path.len()
            ));
        }

        // Check for missing tests
        let has_test_task = tasks.iter().any(|t| t.task_type == TaskType::Test);
        if !has_test_task {
            recommendations.push("Consider adding test coverage".to_string());
        }

        // Check for missing docs
        let has_docs_task = tasks.iter().any(|t| t.task_type == TaskType::Docs);
        if !has_docs_task {
            recommendations.push("Consider adding documentation".to_string());
        }

        recommendations
    }
}

#[async_trait]
impl BaseAgent for CoordinatorAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CoordinatorAgent
    }

    async fn execute(&self, task: &miyabi_types::Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        // Extract issue from task metadata
        let issue_number = task
            .metadata
            .as_ref()
            .and_then(|m| m.get("issue_number"))
            .and_then(|v| v.as_u64())
            .ok_or_else(|| {
                MiyabiError::Validation("Task metadata missing issue_number".to_string())
            })?;

        // In real implementation, would fetch issue from GitHub
        // For now, create a dummy issue
        let issue = Issue {
            number: issue_number,
            title: task.title.clone(),
            body: task.description.clone(),
            state: miyabi_types::issue::IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/example/repo/issues/{}", issue_number),
        };

        // Decompose issue into tasks
        let decomposition = self.decompose_issue(&issue).await?;

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::CoordinatorAgent,
            duration_ms,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: None,
            timestamp: end_time,
        };

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::to_value(decomposition)?),
            error: None,
            metrics: Some(metrics),
            escalation: None,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "test-token".to_string(),
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    fn create_test_issue() -> Issue {
        Issue {
            number: 123,
            title: "Implement new feature".to_string(),
            body: "Feature description".to_string(),
            state: miyabi_types::issue::IssueStateGithub::Open,
            labels: vec!["type:feature".to_string()],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/123".to_string(),
        }
    }

    #[tokio::test]
    async fn test_coordinator_agent_creation() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::CoordinatorAgent);
    }

    #[tokio::test]
    async fn test_decompose_issue() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);
        let issue = create_test_issue();

        let result = agent.decompose_issue(&issue).await;
        assert!(result.is_ok());

        let decomposition = result.unwrap();
        assert_eq!(decomposition.tasks.len(), 4); // analysis, impl, test, review
        assert!(!decomposition.has_cycles);
        assert!(decomposition.estimated_total_duration > 0);
    }

    #[tokio::test]
    async fn test_dag_construction() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);
        let issue = create_test_issue();

        let decomposition = agent.decompose_issue(&issue).await.unwrap();
        let dag = &decomposition.dag;

        // Should have 4 levels: analysis -> impl -> test -> review
        assert_eq!(dag.levels.len(), 4);
        assert_eq!(dag.nodes.len(), 4);
        assert_eq!(dag.edges.len(), 3);
    }

    #[tokio::test]
    async fn test_task_type_inference() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        let mut issue = create_test_issue();
        issue.labels = vec!["type:bug".to_string()];
        assert_eq!(agent.infer_task_type(&issue), TaskType::Bug);

        issue.labels = vec!["type:feature".to_string()];
        assert_eq!(agent.infer_task_type(&issue), TaskType::Feature);

        issue.labels = vec![];
        assert_eq!(agent.infer_task_type(&issue), TaskType::Feature); // default
    }
}
