# Tutorial 8: Testing Strategies - Comprehensive Testing for Miyabi Agents

**Estimated Time**: 75 minutes
**Difficulty**: ⭐⭐⭐ Advanced
**Prerequisites**: Completed Tutorials 1-7, Rust testing basics, Understanding of test-driven development

## Learning Objectives

By the end of this tutorial, you will:
- Master unit, integration, and end-to-end testing for Miyabi Agents
- Implement test-driven development (TDD) for Agent implementation
- Create comprehensive test suites with high coverage
- Use property-based testing for robust validation
- Mock external dependencies (GitHub API, LLM calls)
- Test Worktree isolation and parallel execution
- Measure and optimize test performance
- Integrate testing into CI/CD pipelines

## Prerequisites

Before starting, ensure you have:
- **Completed Tutorials 1-7**: Strong foundation in Miyabi architecture
- **Rust Testing Knowledge**: Familiarity with `#[test]`, `assert!`, `#[cfg(test)]`
- **TDD Understanding**: Test-driven development principles
- **Git Proficiency**: Understanding of Git branches and Worktrees
- **Command Line Proficiency**: Comfortable with `cargo test`

## Introduction

"Autonomous Agents must be rigorously tested. Trust, but verify."

In traditional software development, bugs are caught in code review or QA. But with autonomous Agents generating code, reviewing PRs, and even deploying to production, the stakes are higher. A bug in CoordinatorAgent could decompose a task incorrectly. A bug in CodeGenAgent could generate vulnerable code. A bug in DeploymentAgent could break production.

That's why Miyabi implements a comprehensive testing strategy with multiple layers:

1. **Unit Tests** - Test individual functions in isolation
2. **Integration Tests** - Test Agent interactions with GitHub, filesystem, etc.
3. **End-to-End Tests** - Test complete Issue-to-PR workflows
4. **Property-Based Tests** - Test invariants across random inputs
5. **Performance Tests** - Ensure Agents meet SLA requirements

In this tutorial, you'll learn how to write tests for every layer, achieve high test coverage, and integrate testing into your development workflow.

## Testing Architecture Overview

### Test Pyramid

Miyabi follows the test pyramid principle:

```
        /\
       /E2E\         ← Few (10-20 tests) - Slow but comprehensive
      /------\
     / Integ \       ← Moderate (50-100 tests) - Medium speed
    /----------\
   /   Unit     \    ← Many (200-500 tests) - Fast and focused
  /--------------\
```

**Unit Tests** (70%):
- Function-level tests
- No external dependencies
- Fast execution (<1s)
- High coverage (>90%)

**Integration Tests** (20%):
- Agent-to-Agent communication
- External API mocking
- Medium execution (<10s)
- Critical paths covered

**End-to-End Tests** (10%):
- Complete workflows
- Real GitHub repository (test environment)
- Slow execution (<60s)
- Key user scenarios

### Test Organization

```
crates/
├── miyabi-agents/
│   ├── src/
│   │   ├── coordinator.rs       # Implementation
│   │   └── coordinator.rs       # Inline unit tests (#[cfg(test)])
│   └── tests/
│       ├── coordinator_integration_test.rs
│       └── coordinator_e2e_test.rs
├── miyabi-worktree/
│   ├── src/
│   │   └── manager.rs           # Implementation + unit tests
│   └── tests/
│       ├── lifecycle_integration_test.rs
│       └── parallel_execution_test.rs
└── miyabi-github/
    ├── src/
    │   └── client.rs            # Implementation + unit tests
    └── tests/
        └── github_api_integration_test.rs
```

## Unit Testing

Unit tests verify individual functions in isolation.

### Writing Your First Unit Test

Let's write unit tests for a simple utility function:

**Implementation** (`crates/miyabi-core/src/config.rs`):

```rust
use std::env;

pub struct Config {
    pub github_token: String,
    pub github_owner: String,
    pub github_repo: String,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let github_token = env::var("GITHUB_TOKEN")
            .map_err(|_| "GITHUB_TOKEN not set".to_string())?;
        let github_owner = env::var("GITHUB_OWNER")
            .map_err(|_| "GITHUB_OWNER not set".to_string())?;
        let github_repo = env::var("GITHUB_REPO")
            .map_err(|_| "GITHUB_REPO not set".to_string())?;

        Ok(Self {
            github_token,
            github_owner,
            github_repo,
        })
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.github_token.is_empty() {
            return Err("GitHub token is empty".to_string());
        }
        if self.github_owner.is_empty() {
            return Err("GitHub owner is empty".to_string());
        }
        if self.github_repo.is_empty() {
            return Err("GitHub repo is empty".to_string());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_validate_valid_config() {
        let config = Config {
            github_token: "ghp_token".to_string(),
            github_owner: "ShunsukeHayashi".to_string(),
            github_repo: "Miyabi".to_string(),
        };

        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_validate_empty_token() {
        let config = Config {
            github_token: "".to_string(),
            github_owner: "ShunsukeHayashi".to_string(),
            github_repo: "Miyabi".to_string(),
        };

        assert!(config.validate().is_err());
        assert_eq!(
            config.validate().unwrap_err(),
            "GitHub token is empty"
        );
    }

    #[test]
    fn test_validate_empty_owner() {
        let config = Config {
            github_token: "ghp_token".to_string(),
            github_owner: "".to_string(),
            github_repo: "Miyabi".to_string(),
        };

        assert!(config.validate().is_err());
        assert_eq!(
            config.validate().unwrap_err(),
            "GitHub owner is empty"
        );
    }

    #[test]
    fn test_from_env_success() {
        // Set environment variables
        env::set_var("GITHUB_TOKEN", "ghp_test_token");
        env::set_var("GITHUB_OWNER", "TestOwner");
        env::set_var("GITHUB_REPO", "TestRepo");

        let config = Config::from_env().unwrap();
        assert_eq!(config.github_token, "ghp_test_token");
        assert_eq!(config.github_owner, "TestOwner");
        assert_eq!(config.github_repo, "TestRepo");

        // Clean up
        env::remove_var("GITHUB_TOKEN");
        env::remove_var("GITHUB_OWNER");
        env::remove_var("GITHUB_REPO");
    }

    #[test]
    fn test_from_env_missing_token() {
        // Ensure GITHUB_TOKEN is not set
        env::remove_var("GITHUB_TOKEN");

        let result = Config::from_env();
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "GITHUB_TOKEN not set");
    }
}
```

**Run Unit Tests**:

```bash
# Test specific crate
cargo test --package miyabi-core

# Test specific module
cargo test --package miyabi-core config::tests

# Test with output
cargo test --package miyabi-core -- --nocapture

# Expected output:
# running 5 tests
# test config::tests::test_validate_valid_config ... ok
# test config::tests::test_validate_empty_token ... ok
# test config::tests::test_validate_empty_owner ... ok
# test config::tests::test_from_env_success ... ok
# test config::tests::test_from_env_missing_token ... ok
#
# test result: ok. 5 passed; 0 failed; 0 ignored
```

### Unit Test Best Practices

**1. Test One Thing Per Test**

**Bad**:
```rust
#[test]
fn test_config() {
    let config = Config::new();
    assert!(config.validate().is_ok()); // Testing validation
    assert_eq!(config.github_token, "token"); // Testing token
    assert_eq!(config.github_owner, "owner"); // Testing owner
}
```

**Good**:
```rust
#[test]
fn test_config_validate_success() {
    let config = Config::new();
    assert!(config.validate().is_ok());
}

#[test]
fn test_config_github_token() {
    let config = Config::new();
    assert_eq!(config.github_token, "token");
}

#[test]
fn test_config_github_owner() {
    let config = Config::new();
    assert_eq!(config.github_owner, "owner");
}
```

**2. Use Descriptive Test Names**

**Bad**:
```rust
#[test]
fn test1() { /* ... */ }

#[test]
fn test2() { /* ... */ }
```

**Good**:
```rust
#[test]
fn test_validate_empty_token_returns_error() { /* ... */ }

#[test]
fn test_validate_valid_config_returns_ok() { /* ... */ }
```

**3. Arrange-Act-Assert Pattern**

```rust
#[test]
fn test_example() {
    // Arrange: Set up test data
    let config = Config {
        github_token: "".to_string(),
        github_owner: "owner".to_string(),
        github_repo: "repo".to_string(),
    };

    // Act: Execute the function under test
    let result = config.validate();

    // Assert: Verify the outcome
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "GitHub token is empty");
}
```

**4. Test Edge Cases**

```rust
#[test]
fn test_validate_whitespace_token() {
    let config = Config {
        github_token: "   ".to_string(), // Whitespace-only
        github_owner: "owner".to_string(),
        github_repo: "repo".to_string(),
    };
    assert!(config.validate().is_err());
}

#[test]
fn test_validate_very_long_token() {
    let config = Config {
        github_token: "a".repeat(10000), // Extremely long
        github_owner: "owner".to_string(),
        github_repo: "repo".to_string(),
    };
    assert!(config.validate().is_ok());
}

#[test]
fn test_validate_special_characters() {
    let config = Config {
        github_token: "ghp_!@#$%^&*()".to_string(), // Special chars
        github_owner: "owner".to_string(),
        github_repo: "repo".to_string(),
    };
    assert!(config.validate().is_ok());
}
```

## Integration Testing

Integration tests verify interactions between components.

### Testing Agent Execution

**Integration Test** (`crates/miyabi-agents/tests/coordinator_integration_test.rs`):

```rust
use miyabi_agents::CoordinatorAgent;
use miyabi_types::{Task, TaskStatus, Issue};
use miyabi_github::GitHubClient;
use std::sync::Arc;

#[tokio::test]
async fn test_coordinator_decomposes_issue_into_tasks() {
    // Arrange: Create mock GitHub client
    let github_client = Arc::new(create_mock_github_client());

    let coordinator = CoordinatorAgent::new(
        github_client.clone(),
        test_config(),
    );

    let issue = create_test_issue(500, "Add authentication system");

    // Act: Decompose Issue into Tasks
    let tasks = coordinator.decompose_issue(&issue).await.unwrap();

    // Assert: Verify task decomposition
    assert_eq!(tasks.len(), 3);

    assert_eq!(tasks[0].id, "T1");
    assert_eq!(tasks[0].title, "Implement JWT token generation");
    assert_eq!(tasks[0].status, TaskStatus::Pending);

    assert_eq!(tasks[1].id, "T2");
    assert_eq!(tasks[1].title, "Create login endpoint");
    assert!(tasks[1].dependencies.contains(&"T1".to_string()));

    assert_eq!(tasks[2].id, "T3");
    assert_eq!(tasks[2].title, "Add authentication tests");
    assert!(tasks[2].dependencies.contains(&"T1".to_string()));
    assert!(tasks[2].dependencies.contains(&"T2".to_string()));
}

#[tokio::test]
async fn test_coordinator_assigns_agents_to_tasks() {
    let github_client = Arc::new(create_mock_github_client());
    let coordinator = CoordinatorAgent::new(github_client, test_config());

    let issue = create_test_issue(500, "Fix memory leak in Agent");
    let tasks = coordinator.decompose_issue(&issue).await.unwrap();

    // Act: Assign Agents to Tasks
    let assignments = coordinator.assign_agents(&tasks).await.unwrap();

    // Assert: Verify Agent assignments
    assert_eq!(assignments.get("T1").unwrap(), "CodeGenAgent");
    assert_eq!(assignments.get("T2").unwrap(), "ReviewAgent");
}

// Helper functions
fn create_mock_github_client() -> GitHubClient {
    // Mock implementation that doesn't make real API calls
    GitHubClient::new_mock()
}

fn test_config() -> Config {
    Config {
        github_token: "test_token".to_string(),
        github_owner: "TestOwner".to_string(),
        github_repo: "TestRepo".to_string(),
    }
}

fn create_test_issue(number: u64, title: &str) -> Issue {
    Issue {
        number,
        title: title.to_string(),
        body: "Test issue body".to_string(),
        labels: vec!["type:feature".to_string()],
        state: "open".to_string(),
    }
}
```

**Run Integration Tests**:

```bash
# Run all integration tests
cargo test --test coordinator_integration_test

# Run specific test
cargo test --test coordinator_integration_test test_coordinator_decomposes_issue_into_tasks

# Expected output:
# running 2 tests
# test test_coordinator_decomposes_issue_into_tasks ... ok
# test test_coordinator_assigns_agents_to_tasks ... ok
#
# test result: ok. 2 passed; 0 failed; 0 ignored
```

### Mocking External Dependencies

For testing without real API calls, use mocking:

**GitHub Client Mock** (`crates/miyabi-github/src/client.rs`):

```rust
use async_trait::async_trait;
use mockall::*;

#[async_trait]
pub trait GitHubClientTrait: Send + Sync {
    async fn get_issue(&self, issue_number: u64) -> Result<Issue, GitHubError>;
    async fn create_issue(&self, title: &str, body: &str) -> Result<Issue, GitHubError>;
    async fn update_issue(&self, issue_number: u64, labels: Vec<String>) -> Result<(), GitHubError>;
}

// Real implementation
pub struct GitHubClient {
    octocrab: Arc<Octocrab>,
}

#[async_trait]
impl GitHubClientTrait for GitHubClient {
    async fn get_issue(&self, issue_number: u64) -> Result<Issue, GitHubError> {
        // Real GitHub API call
        let issue = self.octocrab
            .issues(&self.owner, &self.repo)
            .get(issue_number)
            .await?;
        Ok(issue.into())
    }

    // ... other methods
}

// Mock implementation for testing
#[cfg(test)]
mock! {
    pub GitHubClient {}

    #[async_trait]
    impl GitHubClientTrait for GitHubClient {
        async fn get_issue(&self, issue_number: u64) -> Result<Issue, GitHubError>;
        async fn create_issue(&self, title: &str, body: &str) -> Result<Issue, GitHubError>;
        async fn update_issue(&self, issue_number: u64, labels: Vec<String>) -> Result<(), GitHubError>;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_issue_with_mock() {
        let mut mock_client = MockGitHubClient::new();

        // Set up expectations
        mock_client
            .expect_get_issue()
            .with(eq(500))
            .times(1)
            .returning(|_| {
                Ok(Issue {
                    number: 500,
                    title: "Test Issue".to_string(),
                    body: "Test body".to_string(),
                    labels: vec![],
                    state: "open".to_string(),
                })
            });

        // Test
        let issue = mock_client.get_issue(500).await.unwrap();
        assert_eq!(issue.number, 500);
        assert_eq!(issue.title, "Test Issue");
    }
}
```

**Add Dependency** (`crates/miyabi-github/Cargo.toml`):

```toml
[dev-dependencies]
mockall = "0.12"
```

## End-to-End Testing

E2E tests verify complete workflows from Issue creation to PR merge.

### E2E Test for Issue-to-PR Workflow

**E2E Test** (`crates/miyabi-cli/tests/e2e_issue_to_pr_test.rs`):

```rust
use std::process::Command;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
#[ignore] // Run with: cargo test --ignored
async fn test_end_to_end_issue_to_pr_workflow() {
    // Arrange: Create test Issue on GitHub
    let issue_number = create_github_issue(
        "E2E Test: Add hello function",
        "Create a simple hello function with tests"
    ).await.unwrap();

    // Act: Run CoordinatorAgent
    let output = Command::new("./target/release/miyabi")
        .arg("agent")
        .arg("run")
        .arg("coordinator")
        .arg("--issue")
        .arg(issue_number.to_string())
        .output()
        .expect("Failed to execute miyabi CLI");

    // Assert: Verify CoordinatorAgent succeeded
    assert!(output.status.success());

    // Wait for Agent execution
    sleep(Duration::from_secs(30)).await;

    // Assert: Verify PR was created
    let pr = get_pr_for_issue(issue_number).await.unwrap();
    assert_eq!(pr.title, format!("feat: Add hello function (#{issue_number})"));
    assert_eq!(pr.state, "open");

    // Assert: Verify PR contains expected changes
    let files = get_pr_files(&pr).await.unwrap();
    assert!(files.iter().any(|f| f.filename.contains("hello.rs")));
    assert!(files.iter().any(|f| f.filename.contains("test_hello.rs")));

    // Assert: Verify tests pass
    let checks = get_pr_checks(&pr).await.unwrap();
    assert!(checks.iter().all(|c| c.status == "success"));

    // Cleanup: Close PR and delete branch
    cleanup_test_pr(pr.number).await.unwrap();
    delete_github_issue(issue_number).await.unwrap();
}

// Helper functions
async fn create_github_issue(title: &str, body: &str) -> Result<u64, Box<dyn std::error::Error>> {
    let octocrab = octocrab::Octocrab::builder()
        .personal_token(std::env::var("GITHUB_TOKEN")?)
        .build()?;

    let issue = octocrab
        .issues("ShunsukeHayashi", "Miyabi")
        .create(title)
        .body(body)
        .labels(vec!["test".to_string(), "automation".to_string()])
        .send()
        .await?;

    Ok(issue.number)
}

async fn get_pr_for_issue(issue_number: u64) -> Result<PullRequest, Box<dyn std::error::Error>> {
    // Implementation to fetch PR linked to Issue
    // ...
}

async fn cleanup_test_pr(pr_number: u64) -> Result<(), Box<dyn std::error::Error>> {
    // Close PR and delete branch
    // ...
}

async fn delete_github_issue(issue_number: u64) -> Result<(), Box<dyn std::error::Error>> {
    // Close and delete test Issue
    // ...
}
```

**Run E2E Tests**:

```bash
# E2E tests are marked with #[ignore] to prevent accidental runs
# Run explicitly:
cargo test --ignored

# Expected output:
# running 1 test
# test test_end_to_end_issue_to_pr_workflow ... ok (30s)
#
# test result: ok. 1 passed; 0 failed; 0 ignored
```

**Note**: E2E tests require:
- Real GitHub repository access
- `GITHUB_TOKEN` environment variable
- Longer execution time (30-60 seconds)

## Property-Based Testing

Property-based tests verify invariants across many random inputs.

### Using `proptest` for Robust Testing

**Add Dependency** (`Cargo.toml`):

```toml
[dev-dependencies]
proptest = "1.0"
```

**Property-Based Test** (`crates/miyabi-types/src/task.rs`):

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // Property: Task serialization is reversible
    proptest! {
        #[test]
        fn test_task_serialization_roundtrip(
            id in "[A-Z][0-9]{1,3}",
            title in "[a-zA-Z ]{10,100}",
            priority in 0u8..4,
        ) {
            // Arrange
            let original_task = Task {
                id: id.clone(),
                title: title.clone(),
                priority: priority.into(),
                status: TaskStatus::Pending,
                dependencies: vec![],
            };

            // Act: Serialize to JSON
            let json = serde_json::to_string(&original_task).unwrap();

            // Act: Deserialize from JSON
            let deserialized_task: Task = serde_json::from_str(&json).unwrap();

            // Assert: Original and deserialized are equal
            assert_eq!(original_task.id, deserialized_task.id);
            assert_eq!(original_task.title, deserialized_task.title);
            assert_eq!(original_task.priority, deserialized_task.priority);
        }
    }

    // Property: Task dependencies are acyclic
    proptest! {
        #[test]
        fn test_task_dependencies_are_acyclic(
            tasks in prop::collection::vec(task_strategy(), 3..10)
        ) {
            // Assert: No cyclic dependencies
            assert!(!has_cycle(&tasks));
        }
    }

    // Helper: Generate random Task
    fn task_strategy() -> impl Strategy<Value = Task> {
        ("[A-Z][0-9]{1,2}", "[a-zA-Z ]{10,50}", 0u8..4)
            .prop_map(|(id, title, priority)| Task {
                id,
                title,
                priority: priority.into(),
                status: TaskStatus::Pending,
                dependencies: vec![],
            })
    }

    fn has_cycle(tasks: &[Task]) -> bool {
        // Cycle detection algorithm
        // ...
    }
}
```

**Run Property-Based Tests**:

```bash
# Run 100 random test cases (default)
cargo test test_task_serialization_roundtrip

# Run 1000 random test cases
PROPTEST_CASES=1000 cargo test test_task_serialization_roundtrip
```

## Testing Worktree Isolation

Worktrees must be properly isolated for parallel Agent execution.

**Worktree Integration Test** (`crates/miyabi-worktree/tests/isolation_test.rs`):

```rust
use miyabi_worktree::WorktreeManager;
use std::fs;
use std::path::PathBuf;

#[tokio::test]
async fn test_worktree_isolation() {
    let manager = WorktreeManager::new();

    // Create two Worktrees for different Issues
    let worktree1 = manager.create_worktree(500).await.unwrap();
    let worktree2 = manager.create_worktree(501).await.unwrap();

    // Write different content to the same file in each Worktree
    let file1 = worktree1.path.join("test.txt");
    let file2 = worktree2.path.join("test.txt");

    fs::write(&file1, "Content from Issue 500").unwrap();
    fs::write(&file2, "Content from Issue 501").unwrap();

    // Assert: Files are isolated
    assert_eq!(fs::read_to_string(&file1).unwrap(), "Content from Issue 500");
    assert_eq!(fs::read_to_string(&file2).unwrap(), "Content from Issue 501");

    // Cleanup
    manager.remove_worktree(worktree1).await.unwrap();
    manager.remove_worktree(worktree2).await.unwrap();
}

#[tokio::test]
async fn test_parallel_worktree_execution() {
    let manager = WorktreeManager::new();

    // Create 10 Worktrees concurrently
    let mut handles = vec![];
    for issue_number in 500..510 {
        let manager_clone = manager.clone();
        handles.push(tokio::spawn(async move {
            manager_clone.create_worktree(issue_number).await
        }));
    }

    // Wait for all Worktrees to be created
    let worktrees: Vec<_> = futures::future::join_all(handles)
        .await
        .into_iter()
        .map(|r| r.unwrap().unwrap())
        .collect();

    // Assert: All 10 Worktrees created successfully
    assert_eq!(worktrees.len(), 10);

    // Assert: All Worktrees have unique paths
    let paths: std::collections::HashSet<_> =
        worktrees.iter().map(|w| &w.path).collect();
    assert_eq!(paths.len(), 10);

    // Cleanup
    for worktree in worktrees {
        manager.remove_worktree(worktree).await.unwrap();
    }
}
```

## Test Coverage Measurement

Measure test coverage to identify untested code.

### Using `tarpaulin` for Coverage

**Install tarpaulin**:

```bash
cargo install cargo-tarpaulin
```

**Generate Coverage Report**:

```bash
# Generate HTML coverage report
cargo tarpaulin --out Html --output-dir ./coverage

# Open report
open coverage/index.html
```

**Coverage Goals**:
- **Overall**: 80%+
- **Critical paths** (CoordinatorAgent, CodeGenAgent): 90%+
- **Utility functions**: 95%+

**Example Coverage Report**:

```
|| Tested/Total Lines:
|| crates/miyabi-agents/src/coordinator.rs: 245/270 (90.74%)
|| crates/miyabi-agents/src/codegen.rs: 312/340 (91.76%)
|| crates/miyabi-worktree/src/manager.rs: 198/210 (94.29%)
||
|| Total: 1850/2100 (88.10%)
```

## Performance Testing

Ensure Agents meet SLA requirements.

**Performance Test** (`crates/miyabi-agents/tests/performance_test.rs`):

```rust
use std::time::Instant;
use miyabi_agents::CoordinatorAgent;

#[tokio::test]
async fn test_coordinator_performance_under_load() {
    let coordinator = CoordinatorAgent::new(test_config());

    // Create 100 test Issues
    let issues: Vec<_> = (0..100)
        .map(|i| create_test_issue(500 + i, "Test Issue"))
        .collect();

    // Measure time to decompose all Issues
    let start = Instant::now();

    for issue in &issues {
        coordinator.decompose_issue(issue).await.unwrap();
    }

    let duration = start.elapsed();

    // Assert: Decomposition completes within SLA
    let avg_time_per_issue = duration.as_millis() / 100;
    assert!(
        avg_time_per_issue < 500,
        "Average decomposition time {avg_time_per_issue}ms exceeds 500ms SLA"
    );

    println!("Average decomposition time: {avg_time_per_issue}ms");
}

#[tokio::test]
async fn test_worktree_creation_performance() {
    let manager = WorktreeManager::new();

    let start = Instant::now();

    // Create 50 Worktrees
    let mut worktrees = vec![];
    for i in 0..50 {
        let worktree = manager.create_worktree(500 + i).await.unwrap();
        worktrees.push(worktree);
    }

    let duration = start.elapsed();

    // Assert: Creation completes within 10 seconds
    assert!(
        duration.as_secs() < 10,
        "Worktree creation took {}s, exceeds 10s SLA",
        duration.as_secs()
    );

    // Cleanup
    for worktree in worktrees {
        manager.remove_worktree(worktree).await.unwrap();
    }
}
```

## Test-Driven Development (TDD) Workflow

Implement features using TDD.

### TDD Cycle: Red-Green-Refactor

**1. Red - Write Failing Test**:

```rust
#[test]
fn test_parse_conventional_commit() {
    let commit_msg = "feat(auth): add JWT authentication";
    let parsed = parse_commit(commit_msg).unwrap();

    assert_eq!(parsed.commit_type, "feat");
    assert_eq!(parsed.scope, Some("auth".to_string()));
    assert_eq!(parsed.description, "add JWT authentication");
}
```

**Run test**:
```bash
cargo test test_parse_conventional_commit
# Fails: function parse_commit doesn't exist
```

**2. Green - Implement Minimal Code**:

```rust
pub struct ParsedCommit {
    pub commit_type: String,
    pub scope: Option<String>,
    pub description: String,
}

pub fn parse_commit(msg: &str) -> Result<ParsedCommit, String> {
    // Regex: type(scope): description
    let re = regex::Regex::new(r"^([a-z]+)(\(([a-z]+)\))?: (.+)$").unwrap();

    let caps = re.captures(msg).ok_or("Invalid commit format")?;

    Ok(ParsedCommit {
        commit_type: caps[1].to_string(),
        scope: caps.get(3).map(|m| m.as_str().to_string()),
        description: caps[4].to_string(),
    })
}
```

**Run test**:
```bash
cargo test test_parse_conventional_commit
# Passes!
```

**3. Refactor - Improve Code**:

```rust
// Add more tests
#[test]
fn test_parse_commit_without_scope() {
    let commit_msg = "docs: update README";
    let parsed = parse_commit(commit_msg).unwrap();

    assert_eq!(parsed.commit_type, "docs");
    assert_eq!(parsed.scope, None);
    assert_eq!(parsed.description, "update README");
}

#[test]
fn test_parse_commit_invalid_format() {
    let commit_msg = "invalid commit message";
    assert!(parse_commit(commit_msg).is_err());
}
```

**Refactor implementation**:
```rust
// Improved error handling, better regex
```

## Continuous Integration Testing

Integrate tests into CI/CD pipeline.

### GitHub Actions Workflow

**`.github/workflows/test.yml`**:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo registry
        uses: actions/cache@v3
        with:
          path: ~/.cargo/registry
          key: ${{ runner.os }}-cargo-registry-${{ hashFiles('**/Cargo.lock') }}

      - name: Run unit tests
        run: cargo test --all --lib

      - name: Run integration tests
        run: cargo test --all --test '*_integration_test'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run end-to-end tests
        run: cargo test --ignored
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate coverage report
        run: |
          cargo install cargo-tarpaulin
          cargo tarpaulin --out Xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./cobertura.xml
          fail_ci_if_error: true

  lint:
    name: Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Run clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Check formatting
        run: cargo fmt --all -- --check
```

## Success Checklist

Before considering yourself a testing master:

- [ ] Written unit tests with >90% coverage for critical functions
- [ ] Created integration tests for Agent interactions
- [ ] Implemented at least one end-to-end test
- [ ] Used property-based testing for complex invariants
- [ ] Mocked external dependencies (GitHub API, LLM)
- [ ] Tested Worktree isolation and parallel execution
- [ ] Measured test coverage with tarpaulin
- [ ] Implemented performance tests with SLA assertions
- [ ] Integrated testing into CI/CD pipeline with GitHub Actions
- [ ] Practiced test-driven development (TDD) for new features

## Next Steps

Congratulations! You've mastered comprehensive testing strategies for Miyabi Agents. Here's what to explore next:

1. **Tutorial 9: CI/CD and Deployment** - Automate testing and deployment
2. **Tutorial 10: Troubleshooting and Advanced Topics** - Debug complex Agent issues
3. **Implement Quality Gates** - Enforce test coverage and quality metrics

## Additional Resources

- **Rust Testing Book**: [doc.rust-lang.org/book/ch11-00-testing.html](https://doc.rust-lang.org/book/ch11-00-testing.html)
- **Property-Based Testing**: [proptest-rs.github.io](https://proptest-rs.github.io/)
- **Mockall Documentation**: [docs.rs/mockall](https://docs.rs/mockall/latest/mockall/)
- **Tarpaulin Coverage**: [github.com/xd009642/tarpaulin](https://github.com/xd009642/tarpaulin)
- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)
