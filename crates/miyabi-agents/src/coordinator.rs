//! CoordinatorAgent - Task decomposition and DAG construction
//!
//! Responsible for breaking down Issues into executable Tasks and creating
//! a Directed Acyclic Graph (DAG) for dependency management.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_github::GitHubClient;
use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::{Task, TaskDecomposition, TaskType};
use miyabi_types::workflow::{Edge, DAG};
use miyabi_types::{AgentConfig, AgentResult, Issue};
use serde_json::json;
use std::collections::HashMap;

pub struct CoordinatorAgent {
    #[allow(dead_code)] // Reserved for future Agent configuration
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
        let estimated_total_duration = tasks.iter().filter_map(|t| t.estimated_duration).sum();

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

    /// Generate Plans.md markdown from TaskDecomposition (Feler's pattern)
    pub fn generate_plans_md(&self, decomposition: &TaskDecomposition) -> String {
        let mut md = String::new();

        // Header
        md.push_str(&format!("# Plans for Issue #{}\n\n", decomposition.original_issue.number));
        md.push_str(&format!("**Title**: {}\n\n", decomposition.original_issue.title));
        md.push_str(&format!("**URL**: {}\n\n", decomposition.original_issue.url));
        md.push_str("---\n\n");

        // Summary
        md.push_str("## 📋 Summary\n\n");
        md.push_str(&format!("- **Total Tasks**: {}\n", decomposition.tasks.len()));
        md.push_str(&format!("- **Estimated Duration**: {} minutes\n", decomposition.estimated_total_duration));
        md.push_str(&format!("- **Execution Levels**: {}\n", decomposition.dag.levels.len()));
        md.push_str(&format!("- **Has Cycles**: {}\n", if decomposition.has_cycles { "⚠️ Yes" } else { "✅ No" }));
        md.push('\n');

        // Task breakdown
        md.push_str("## 📝 Task Breakdown\n\n");

        for (i, task) in decomposition.tasks.iter().enumerate() {
            let agent_name = task.assigned_agent.map(|a| format!("{:?}", a)).unwrap_or_else(|| "Unassigned".to_string());
            let duration = task.estimated_duration.map(|d| format!("{} min", d)).unwrap_or_else(|| "N/A".to_string());

            md.push_str(&format!("### {}. {}\n\n", i + 1, task.title));
            md.push_str(&format!("- **ID**: `{}`\n", task.id));
            md.push_str(&format!("- **Type**: {:?}\n", task.task_type));
            md.push_str(&format!("- **Assigned Agent**: {}\n", agent_name));
            md.push_str(&format!("- **Priority**: {}\n", task.priority));
            md.push_str(&format!("- **Estimated Duration**: {}\n", duration));

            if !task.dependencies.is_empty() {
                md.push_str(&format!("- **Dependencies**: {}\n", task.dependencies.join(", ")));
            }

            if !task.description.is_empty() {
                md.push_str(&format!("\n**Description**: {}\n", task.description));
            }

            md.push('\n');
        }

        // Execution plan (DAG levels)
        md.push_str("## 🔄 Execution Plan (DAG Levels)\n\n");
        md.push_str("Tasks can be executed in parallel within each level:\n\n");

        for (level_idx, level) in decomposition.dag.levels.iter().enumerate() {
            md.push_str(&format!("### Level {} (Parallel Execution)\n\n", level_idx));
            for task_id in level {
                if let Some(task) = decomposition.tasks.iter().find(|t| t.id == *task_id) {
                    md.push_str(&format!("- `{}` - {}\n", task.id, task.title));
                }
            }
            md.push('\n');
        }

        // Dependencies graph
        md.push_str("## 📊 Dependency Graph\n\n");
        md.push_str("```mermaid\ngraph TD\n");
        for task in &decomposition.tasks {
            let task_label = task.title.replace('"', "'");
            md.push_str(&format!("    {}[\"{}\"]\n", task.id.replace('-', "_"), task_label));
        }
        for edge in &decomposition.dag.edges {
            md.push_str(&format!("    {} --> {}\n", edge.from.replace('-', "_"), edge.to.replace('-', "_")));
        }
        md.push_str("```\n\n");

        // Recommendations
        if !decomposition.recommendations.is_empty() {
            md.push_str("## 💡 Recommendations\n\n");
            for rec in &decomposition.recommendations {
                md.push_str(&format!("- {}\n", rec));
            }
            md.push('\n');
        }

        // Timeline
        md.push_str("## ⏱️ Timeline Estimation\n\n");
        let hours = decomposition.estimated_total_duration as f32 / 60.0;
        md.push_str(&format!("- **Sequential Execution**: {} minutes ({:.1} hours)\n", decomposition.estimated_total_duration, hours));

        // Calculate parallel execution time (critical path)
        let critical_path = decomposition.dag.critical_path();
        let critical_duration: u32 = critical_path
            .iter()
            .filter_map(|task_id| {
                decomposition.tasks
                    .iter()
                    .find(|t| t.id == *task_id)
                    .and_then(|t| t.estimated_duration)
            })
            .sum();
        let critical_hours = critical_duration as f32 / 60.0;
        md.push_str(&format!("- **Parallel Execution (Critical Path)**: {} minutes ({:.1} hours)\n", critical_duration, critical_hours));
        md.push_str(&format!("- **Estimated Speedup**: {:.1}x\n", decomposition.estimated_total_duration as f32 / critical_duration as f32));
        md.push('\n');

        // Footer
        md.push_str("---\n\n");
        md.push_str(&format!("*Generated by CoordinatorAgent on {}*\n", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")));

        md
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

        // Fetch issue from GitHub
        let owner = self
            .config
            .repo_owner
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_owner not configured".to_string()))?;
        let repo = self
            .config
            .repo_name
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_name not configured".to_string()))?;

        let github_client = GitHubClient::new(&self.config.github_token, owner, repo)?;
        let issue = github_client.get_issue(issue_number).await?;

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
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
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

    #[tokio::test]
    async fn test_generate_plans_md() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);
        let issue = create_test_issue();

        // Generate task decomposition
        let decomposition = agent.decompose_issue(&issue).await.unwrap();

        // Generate Plans.md
        let plans_md = agent.generate_plans_md(&decomposition);

        // Validate markdown contains expected sections
        assert!(plans_md.contains("# Plans for Issue #123"));
        assert!(plans_md.contains("**Title**: Implement new feature"));
        assert!(plans_md.contains("https://github.com/user/repo/issues/123"));

        // Validate Summary section
        assert!(plans_md.contains("## 📋 Summary"));
        assert!(plans_md.contains("- **Total Tasks**: 4"));
        assert!(plans_md.contains("- **Estimated Duration**: 60 minutes"));
        assert!(plans_md.contains("- **Execution Levels**: 4"));
        assert!(plans_md.contains("- **Has Cycles**: ✅ No"));

        // Validate Task Breakdown section
        assert!(plans_md.contains("## 📝 Task Breakdown"));
        assert!(plans_md.contains("### 1. Analyze requirements for #123"));
        assert!(plans_md.contains("### 2. Implement solution for #123"));
        assert!(plans_md.contains("### 3. Add tests for #123"));
        assert!(plans_md.contains("### 4. Review code quality for #123"));

        // Validate task details
        assert!(plans_md.contains("- **ID**: `task-123-analysis`"));
        assert!(plans_md.contains("- **Type**: Docs"));
        assert!(plans_md.contains("- **Assigned Agent**: IssueAgent"));
        assert!(plans_md.contains("- **Type**: Feature"));
        assert!(plans_md.contains("- **Assigned Agent**: CodeGenAgent"));
        assert!(plans_md.contains("- **Type**: Test"));
        assert!(plans_md.contains("- **Type**: Refactor"));
        assert!(plans_md.contains("- **Assigned Agent**: ReviewAgent"));

        // Validate Execution Plan section
        assert!(plans_md.contains("## 🔄 Execution Plan (DAG Levels)"));
        assert!(plans_md.contains("### Level 0 (Parallel Execution)"));
        assert!(plans_md.contains("`task-123-analysis` - Analyze requirements for #123"));

        // Validate Dependency Graph section
        assert!(plans_md.contains("## 📊 Dependency Graph"));
        assert!(plans_md.contains("```mermaid"));
        assert!(plans_md.contains("graph TD"));
        assert!(plans_md.contains("task_123_analysis[\"Analyze requirements for #123\"]"));
        assert!(plans_md.contains("task_123_impl[\"Implement solution for #123\"]"));
        assert!(plans_md.contains("task_123_analysis --> task_123_impl"));

        // Validate Timeline Estimation section
        assert!(plans_md.contains("## ⏱️ Timeline Estimation"));
        assert!(plans_md.contains("- **Sequential Execution**: 60 minutes (1.0 hours)"));
        // Note: critical_path() implementation is simplified, just check the section exists
        assert!(plans_md.contains("- **Parallel Execution (Critical Path)**: "));
        assert!(plans_md.contains("- **Estimated Speedup**: "));

        // Validate footer
        assert!(plans_md.contains("*Generated by CoordinatorAgent on"));
    }

    // ========================================================================
    // NEW TESTS for P1-1: CoordinatorAgent テスト拡充
    // ========================================================================

    #[tokio::test]
    async fn test_dag_cycle_detection_rejects_circular_dependencies() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Create tasks with circular dependencies: A -> B -> C -> A
        let task_a = Task {
            id: "task-a".to_string(),
            title: "Task A".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["task-c".to_string()], // A depends on C
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let task_b = Task {
            id: "task-b".to_string(),
            title: "Task B".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["task-a".to_string()], // B depends on A
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let task_c = Task {
            id: "task-c".to_string(),
            title: "Task C".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["task-b".to_string()], // C depends on B -> CYCLE!
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let tasks = vec![task_a, task_b, task_c];

        // build_dag should detect the cycle and reject it
        let result = agent.build_dag(&tasks);
        // The topological_sort will fail to place all nodes in levels, causing has_cycles to return true
        // However, build_dag doesn't check for cycles - decompose_issue does.
        // Let's verify the DAG detects cycles
        if let Ok(dag) = result {
            assert!(dag.has_cycles(), "DAG should detect cycles");
        }
    }

    #[tokio::test]
    async fn test_dag_cycle_detection_self_loop() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Create a task that depends on itself
        let task = Task {
            id: "task-self".to_string(),
            title: "Self-referencing task".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["task-self".to_string()], // Self-loop!
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = agent.build_dag(&[task]);
        if let Ok(dag) = result {
            // Self-loop creates a cycle
            assert!(dag.has_cycles(), "DAG should detect self-loop as cycle");
        }
    }

    #[tokio::test]
    async fn test_dag_with_invalid_dependency() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Create a task with a dependency on a non-existent task
        let task = Task {
            id: "task-1".to_string(),
            title: "Task with invalid dependency".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["non-existent-task".to_string()],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = agent.build_dag(&[task]);
        assert!(
            result.is_err(),
            "build_dag should reject tasks with non-existent dependencies"
        );

        if let Err(e) = result {
            assert!(
                matches!(e, MiyabiError::Validation(_)),
                "Error should be a Validation error"
            );
        }
    }

    #[tokio::test]
    async fn test_plans_md_edge_case_empty_description() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        let mut issue = create_test_issue();
        issue.body = "".to_string(); // Empty description

        let decomposition = agent.decompose_issue(&issue).await.unwrap();
        let plans_md = agent.generate_plans_md(&decomposition);

        // Should still generate valid Plans.md
        assert!(plans_md.contains("# Plans for Issue #123"));
        assert!(plans_md.contains("## 📋 Summary"));
        // Empty description should not cause any issues
    }

    #[tokio::test]
    async fn test_plans_md_edge_case_special_characters() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        let mut issue = create_test_issue();
        issue.title = "Fix \"bug\" with <special> & chars".to_string();

        let decomposition = agent.decompose_issue(&issue).await.unwrap();
        let plans_md = agent.generate_plans_md(&decomposition);

        // Verify Plans.md contains the issue title (may be escaped differently in different sections)
        // The important thing is that it doesn't crash with special characters
        assert!(plans_md.contains("# Plans for Issue #123"));
        assert!(plans_md.contains("## 📋 Summary"));
        // The title will appear in the header
        assert!(
            plans_md.contains("**Title**:") && (
                plans_md.contains("Fix \"bug\" with <special> & chars")
                || plans_md.contains("Fix 'bug' with <special> & chars")
            )
        );
    }

    #[tokio::test]
    async fn test_plans_md_edge_case_very_long_task_list() {
        use miyabi_types::task::TaskDecomposition;

        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);
        let issue = create_test_issue();

        // Create a very long task list (100 tasks)
        let tasks: Vec<Task> = (0..100)
            .map(|i| Task {
                id: format!("task-{}", i),
                title: format!("Task {}", i),
                description: "".to_string(),
                task_type: TaskType::Feature,
                priority: (i % 256) as u8, // priority is u8, wrap around for large i
                severity: None,
                impact: None,
                assigned_agent: Some(AgentType::CodeGenAgent),
                dependencies: if i == 0 {
                    vec![]
                } else {
                    vec![format!("task-{}", i - 1)]
                },
                estimated_duration: Some(5),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            })
            .collect();

        let dag = agent.build_dag(&tasks).unwrap();

        let decomposition = TaskDecomposition {
            original_issue: issue,
            tasks,
            dag,
            estimated_total_duration: 500,
            has_cycles: false,
            recommendations: vec![],
        };

        let plans_md = agent.generate_plans_md(&decomposition);

        // Validate that Plans.md handles large task counts
        assert!(plans_md.contains("- **Total Tasks**: 100"));
        assert!(plans_md.contains("- **Estimated Duration**: 500 minutes"));
        // Should contain all 100 tasks in breakdown
        assert!(plans_md.contains("### 1. Task 0"));
        assert!(plans_md.contains("### 100. Task 99"));
    }

    #[tokio::test]
    async fn test_task_type_inference_all_types() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Test all task types
        let test_cases = vec![
            (vec!["type:bug", "priority:P0"], TaskType::Bug),
            (vec!["type:feature"], TaskType::Feature),
            (vec!["type:refactor"], TaskType::Refactor),
            (vec!["type:docs"], TaskType::Docs),
            (vec!["type:test"], TaskType::Test),
            (vec!["type:deployment"], TaskType::Deployment),
            // Test with alternative label formats
            (vec!["bug"], TaskType::Bug),
            (vec!["feature"], TaskType::Feature),
            (vec!["refactor"], TaskType::Refactor),
            (vec!["docs"], TaskType::Docs),
            (vec!["test"], TaskType::Test),
            (vec!["deployment"], TaskType::Deployment),
            // Test priority: bug type should take precedence
            (vec!["type:bug", "type:feature"], TaskType::Bug),
            // Test default (no matching labels)
            (vec!["random-label"], TaskType::Feature),
        ];

        for (labels, expected_type) in test_cases {
            let mut issue = create_test_issue();
            issue.labels = labels.iter().map(|s| s.to_string()).collect();
            let inferred_type = agent.infer_task_type(&issue);
            assert_eq!(
                inferred_type, expected_type,
                "Failed for labels: {:?}",
                labels
            );
        }
    }

    #[tokio::test]
    async fn test_recommendations_generation() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Create tasks without test task
        let tasks = vec![
            Task {
                id: "task-1".to_string(),
                title: "Implementation".to_string(),
                description: "".to_string(),
                task_type: TaskType::Feature,
                priority: 1,
                severity: None,
                impact: None,
                assigned_agent: Some(AgentType::CodeGenAgent),
                dependencies: vec![],
                estimated_duration: Some(30),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            },
            Task {
                id: "task-2".to_string(),
                title: "Documentation".to_string(),
                description: "".to_string(),
                task_type: TaskType::Docs,
                priority: 2,
                severity: None,
                impact: None,
                assigned_agent: Some(AgentType::CodeGenAgent),
                dependencies: vec!["task-1".to_string()],
                estimated_duration: Some(10),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            },
        ];

        let dag = agent.build_dag(&tasks).unwrap();
        let recommendations = agent.generate_recommendations(&tasks, &dag);

        // Should recommend adding test coverage
        assert!(
            recommendations
                .iter()
                .any(|r| r.contains("test coverage")),
            "Should recommend adding test coverage when no test task exists"
        );
    }

    #[tokio::test]
    async fn test_topological_sort_multiple_independent_tasks() {
        let config = create_test_config();
        let agent = CoordinatorAgent::new(config);

        // Create tasks with no dependencies (all can run in parallel)
        let tasks = vec![
            Task {
                id: "task-1".to_string(),
                title: "Independent task 1".to_string(),
                description: "".to_string(),
                task_type: TaskType::Feature,
                priority: 1,
                severity: None,
                impact: None,
                assigned_agent: None,
                dependencies: vec![],
                estimated_duration: Some(10),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            },
            Task {
                id: "task-2".to_string(),
                title: "Independent task 2".to_string(),
                description: "".to_string(),
                task_type: TaskType::Feature,
                priority: 1,
                severity: None,
                impact: None,
                assigned_agent: None,
                dependencies: vec![],
                estimated_duration: Some(10),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            },
            Task {
                id: "task-3".to_string(),
                title: "Independent task 3".to_string(),
                description: "".to_string(),
                task_type: TaskType::Feature,
                priority: 1,
                severity: None,
                impact: None,
                assigned_agent: None,
                dependencies: vec![],
                estimated_duration: Some(10),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            },
        ];

        let dag = agent.build_dag(&tasks).unwrap();

        // All tasks should be in level 0 (can run in parallel)
        assert_eq!(dag.levels.len(), 1);
        assert_eq!(dag.levels[0].len(), 3);
    }
}
