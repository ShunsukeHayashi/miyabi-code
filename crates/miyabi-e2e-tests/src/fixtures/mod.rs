//! Test fixtures and sample data

use miyabi_types::{
    agent::{ImpactLevel, Severity},
    issue::{Issue, IssueStateGithub},
    task::{Task, TaskType},
    AgentType,
};

/// Test fixtures provider
#[derive(Debug, Clone)]
pub struct Fixtures {
    sample_data: SampleData,
}

impl Fixtures {
    /// Create new fixtures
    pub fn new() -> Self {
        Self {
            sample_data: SampleData::new(),
        }
    }

    /// Get sample data
    pub fn sample_data(&self) -> &SampleData {
        &self.sample_data
    }

    /// Get a sample issue
    pub fn sample_issue(&self) -> Issue {
        self.sample_data.simple_feature_issue()
    }

    /// Get a sample bug issue
    pub fn sample_bug_issue(&self) -> Issue {
        self.sample_data.bug_issue()
    }

    /// Get a sample task
    pub fn sample_task(&self) -> Task {
        self.sample_data.simple_task()
    }
}

impl Default for Fixtures {
    fn default() -> Self {
        Self::new()
    }
}

/// Sample test data
#[derive(Debug, Clone)]
pub struct SampleData;

impl SampleData {
    pub fn new() -> Self {
        Self
    }

    /// Simple feature issue
    pub fn simple_feature_issue(&self) -> Issue {
        Issue {
            number: 1000,
            title: "Add user authentication".to_string(),
            body: "Implement OAuth2 authentication for users. This feature should support Google and GitHub OAuth providers.".to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/test/repo/issues/1000".to_string(),
        }
    }

    /// Bug issue
    pub fn bug_issue(&self) -> Issue {
        Issue {
            number: 1001,
            title: "Fix memory leak in worker pool".to_string(),
            body: "The worker pool has a memory leak that causes increased memory usage over time. This affects production stability.".to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/test/repo/issues/1001".to_string(),
        }
    }

    /// Complex feature with dependencies
    pub fn complex_feature_issue(&self) -> Issue {
        Issue {
            number: 1002,
            title: "Implement distributed task queue".to_string(),
            body: r#"Design and implement a distributed task queue system.

## Requirements
- Redis-based queue backend
- Worker pool management
- Dead letter queue handling
- Monitoring and metrics

## Dependencies
- Issue #1000 (authentication)
- Issue #999 (database refactor)

Estimated: 2 weeks"#.to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/test/repo/issues/1002".to_string(),
        }
    }

    /// High priority issue
    pub fn high_priority_issue(&self) -> Issue {
        Issue {
            number: 1003,
            title: "URGENT: Fix production API outage".to_string(),
            body: "API endpoints returning 500 errors. Database connection pool exhausted. Immediate fix required.".to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/test/repo/issues/1003".to_string(),
        }
    }

    /// Documentation issue
    pub fn documentation_issue(&self) -> Issue {
        Issue {
            number: 1004,
            title: "Update API documentation".to_string(),
            body: "Update API documentation to reflect recent changes in authentication endpoints.".to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/test/repo/issues/1004".to_string(),
        }
    }

    /// Simple task
    pub fn simple_task(&self) -> Task {
        Task {
            id: "task-test-001".to_string(),
            title: "Implement authentication module".to_string(),
            description: "Create OAuth2 authentication module with provider support".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(120),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    /// Task with dependencies
    pub fn task_with_deps(&self) -> Task {
        Task {
            id: "task-test-002".to_string(),
            title: "Add authentication tests".to_string(),
            description: "Write comprehensive tests for authentication module".to_string(),
            task_type: TaskType::Test,
            priority: 2,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec!["task-test-001".to_string()],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    /// Bug fix task
    pub fn bug_fix_task(&self) -> Task {
        Task {
            id: "task-test-003".to_string(),
            title: "Fix memory leak in worker pool".to_string(),
            description: "Investigate and fix memory leak causing high memory usage".to_string(),
            task_type: TaskType::Bug,
            priority: 0,
            severity: Some(Severity::Critical),
            impact: Some(ImpactLevel::High),
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(180),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    /// Refactor task
    pub fn refactor_task(&self) -> Task {
        Task {
            id: "task-test-004".to_string(),
            title: "Refactor database layer".to_string(),
            description: "Refactor database layer for better maintainability and performance".to_string(),
            task_type: TaskType::Refactor,
            priority: 2,
            severity: None,
            impact: Some(ImpactLevel::Medium),
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(240),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    /// Documentation task
    pub fn documentation_task(&self) -> Task {
        Task {
            id: "task-test-005".to_string(),
            title: "Update API documentation".to_string(),
            description: "Update API docs to reflect authentication changes".to_string(),
            task_type: TaskType::Docs,
            priority: 3,
            severity: None,
            impact: Some(ImpactLevel::Low),
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec!["task-test-001".to_string()],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }
}

impl Default for SampleData {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fixtures_creation() {
        let fixtures = Fixtures::new();
        let issue = fixtures.sample_issue();
        assert_eq!(issue.number, 1000);
    }

    #[test]
    fn test_sample_data() {
        let data = SampleData::new();

        // Test all issue types
        assert_eq!(data.simple_feature_issue().number, 1000);
        assert_eq!(data.bug_issue().number, 1001);
        assert_eq!(data.complex_feature_issue().number, 1002);
        assert_eq!(data.high_priority_issue().number, 1003);
        assert_eq!(data.documentation_issue().number, 1004);

        // Test all task types
        assert_eq!(data.simple_task().id, "task-test-001");
        assert_eq!(data.task_with_deps().id, "task-test-002");
        assert_eq!(data.bug_fix_task().id, "task-test-003");
        assert_eq!(data.refactor_task().id, "task-test-004");
        assert_eq!(data.documentation_task().id, "task-test-005");
    }
}
