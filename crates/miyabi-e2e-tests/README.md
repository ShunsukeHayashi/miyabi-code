# Miyabi E2E Test Framework

Comprehensive end-to-end testing framework for Miyabi autonomous development platform.

## Features

- **Test Harness**: Automated setup and teardown of test infrastructure
- **Mock GitHub API**: HTTP server simulating GitHub API endpoints
- **Test Fixtures**: Pre-built sample data for issues, tasks, and agents
- **Helper Utilities**: Common operations for file management, git, and assertions

## Quick Start

### Basic Usage

```rust
use miyabi_e2e_tests::{TestHarness, create_test_file, assert_file_exists};

#[tokio::test]
async fn test_my_workflow() {
    // Create test harness
    let harness = TestHarness::new().await;

    // Initialize git repository
    harness.init_git_repo().await.unwrap();
    harness.create_initial_commit().await.unwrap();

    // Get test fixtures
    let issue = harness.fixtures().sample_issue();

    // Run your test...

    // Cleanup
    harness.cleanup().await;
}
```

### With Mock GitHub

```rust
use miyabi_e2e_tests::TestHarness;

#[tokio::test]
async fn test_with_mock_github() {
    // Create harness with mock GitHub server
    let harness = TestHarness::builder()
        .with_mock_github()
        .build()
        .await;

    // Access mock GitHub
    let mock = harness.mock_github().unwrap();

    // Add test issue
    let issue = miyabi_e2e_tests::mocks::MockIssueResponse {
        number: 123,
        title: "Test Issue".to_string(),
        body: "Test body".to_string(),
        state: "open".to_string(),
        labels: vec![],
    };
    mock.add_issue(issue).await;

    // Verify
    let issues = mock.get_issues().await;
    assert_eq!(issues.len(), 1);

    harness.cleanup().await;
}
```

## Components

### Test Harness

The `TestHarness` provides:

- **Temporary Directory**: Isolated test environment
- **Mock GitHub Server**: Optional HTTP server for API simulation
- **Agent Configuration**: Pre-configured for testing
- **Git Repository Setup**: Initialize and configure git repos

#### Builder Pattern

```rust
let harness = TestHarness::builder()
    .with_mock_github()                    // Enable mock GitHub
    .with_temp_prefix("my-test-")          // Custom temp directory prefix
    .build()
    .await;
```

### Mock GitHub API

Simulates GitHub API endpoints:

- `GET/POST /repos/:owner/:repo/issues` - List/create issues
- `GET/PATCH /repos/:owner/:repo/issues/:number` - Get/update issue
- `POST /repos/:owner/:repo/issues/:number/comments` - Add comments
- `POST /repos/:owner/:repo/issues/:number/labels` - Add labels
- `POST /repos/:owner/:repo/pulls` - Create PR
- `GET /repos/:owner/:repo/pulls/:number` - Get PR

#### Example

```rust
let mock = MockGitHub::start().await.unwrap();

// Add test data
mock.add_issue(MockIssueResponse {
    number: 100,
    title: "Feature request".to_string(),
    body: "Add new feature".to_string(),
    state: "open".to_string(),
    labels: vec![],
}).await;

// Access base URL for HTTP clients
println!("Mock server: {}", mock.base_url());

// Reset state
mock.reset().await;
```

### Test Fixtures

Pre-built test data:

#### Issues

```rust
let fixtures = Fixtures::new();

// Simple feature issue
let issue = fixtures.sample_issue();

// Bug issue
let bug = fixtures.sample_bug_issue();

// Complex feature with dependencies
let complex = fixtures.sample_data().complex_feature_issue();

// High priority issue
let urgent = fixtures.sample_data().high_priority_issue();

// Documentation issue
let docs = fixtures.sample_data().documentation_issue();
```

#### Tasks

```rust
let fixtures = Fixtures::new();

// Simple task
let task = fixtures.sample_task();

// Task with dependencies
let dependent = fixtures.sample_data().task_with_deps();

// Bug fix task
let bugfix = fixtures.sample_data().bug_fix_task();

// Refactor task
let refactor = fixtures.sample_data().refactor_task();

// Documentation task
let docs = fixtures.sample_data().documentation_task();
```

### Helper Utilities

#### File Operations

```rust
use miyabi_e2e_tests::{create_test_file, assert_file_exists, assert_file_contains};

// Create file
let path = create_test_file(&dir, "test.txt", "content").await?;

// Assert file exists
assert_file_exists(&path);

// Assert file contains content
assert_file_contains(&path, "content").await?;
```

#### Git Operations

```rust
use miyabi_e2e_tests::{
    create_test_commit,
    helpers::{get_current_branch, create_branch, checkout_branch}
};

// Create commit
create_test_commit(&repo_path, "feat: add feature").await?;

// Get current branch
let branch = get_current_branch(&repo_path).await?;

// Create branch
create_branch(&repo_path, "feature/new").await?;

// Checkout branch
checkout_branch(&repo_path, "main").await?;
```

#### Async Utilities

```rust
use miyabi_e2e_tests::helpers::wait_for_condition;
use std::time::Duration;

// Wait for condition
wait_for_condition(
    || some_condition_is_true(),
    Duration::from_secs(10),    // timeout
    Duration::from_millis(100), // check interval
).await?;
```

## Running Tests

### Run all E2E tests

```bash
cargo test --package miyabi-e2e-tests
```

### Run specific test

```bash
cargo test --package miyabi-e2e-tests --test full_agent_workflow
```

### Run with output

```bash
cargo test --package miyabi-e2e-tests -- --nocapture
```

### Run ignored tests

```bash
cargo test --package miyabi-e2e-tests -- --ignored
```

## Example Tests

See `tests/full_agent_workflow.rs` for comprehensive examples:

1. **Issue → Plans Workflow**: Complete workflow from issue analysis to Plans.md generation
2. **Worktree Workflow**: Git worktree operations with file creation and commits
3. **Mock GitHub API**: Demonstrates mock server usage with issues and PRs

## Best Practices

### 1. Use Serial Execution for Git Tests

```rust
use serial_test::serial;

#[tokio::test]
#[serial]  // Prevents parallel execution
async fn test_with_git() {
    // Git operations...
}
```

### 2. Always Cleanup

```rust
#[tokio::test]
async fn test_example() {
    let harness = TestHarness::new().await;

    // Test logic...

    // Cleanup at end
    harness.cleanup().await;
}
```

### 3. Use Test Fixtures

```rust
// Don't manually create test data
let issue = Issue { /* ... */ };  // ❌

// Use fixtures instead
let issue = harness.fixtures().sample_issue();  // ✅
```

### 4. Leverage Mock GitHub for Integration Tests

```rust
// Don't use real GitHub API in tests
let client = octocrab::instance();  // ❌

// Use mock GitHub
let harness = TestHarness::builder()
    .with_mock_github()
    .build()
    .await;
let mock = harness.mock_github().unwrap();  // ✅
```

### 5. Use Descriptive Test Names

```rust
// Bad
#[tokio::test]
async fn test_1() { /* ... */ }  // ❌

// Good
#[tokio::test]
async fn test_e2e_issue_to_plans_workflow() { /* ... */ }  // ✅
```

## Architecture

```
miyabi-e2e-tests/
├── src/
│   ├── lib.rs           # Main library entry point
│   ├── harness/         # Test harness implementation
│   │   └── mod.rs
│   ├── mocks/           # Mock servers
│   │   ├── mod.rs
│   │   └── github.rs    # Mock GitHub API
│   ├── fixtures/        # Test fixtures
│   │   └── mod.rs
│   └── helpers/         # Helper utilities
│       └── mod.rs
└── tests/
    └── full_agent_workflow.rs  # Example E2E tests
```

## Dependencies

- **axum**: HTTP server for mock GitHub API
- **tokio**: Async runtime with test utilities
- **tempfile**: Temporary directory management
- **serial_test**: Sequential test execution
- **tracing**: Logging and diagnostics

## CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run E2E Tests
  run: cargo test --package miyabi-e2e-tests
  env:
    RUST_LOG: info
```

## Troubleshooting

### Tests Fail Due to Git Configuration

Ensure git is configured:

```rust
harness.init_git_repo().await?;  // Automatically configures git
```

### Mock GitHub Port Conflict

Use random port (default):

```rust
let mock = MockGitHub::builder().build().await?;  // Random port
```

Or specify custom port:

```rust
let mock = MockGitHub::builder()
    .with_port(8080)
    .build()
    .await?;
```

### TempDir Cleanup Issues

The test harness automatically cleans up when dropped. If manual cleanup is needed:

```rust
harness.cleanup().await;
```

## Contributing

When adding new E2E tests:

1. Use the test harness for consistent setup
2. Leverage fixtures for test data
3. Add helper utilities for common operations
4. Document test purpose and usage
5. Use `#[serial]` for tests that modify global state

## License

Apache-2.0
