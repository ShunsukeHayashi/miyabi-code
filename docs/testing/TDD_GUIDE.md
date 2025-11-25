# Miyabi TDD (Test-Driven Development) Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-26
**Status**: Active

---

## Overview

このガイドは、Miyabiプロジェクトにおけるテスト駆動開発（TDD）の包括的なガイドラインを提供します。

### Why TDD?

- **バグの早期発見**: 実装前にテストを書くことで、仕様の曖昧さを早期に発見
- **設計の改善**: テスト可能なコードは自然とモジュラーになる
- **ドキュメント効果**: テストは実行可能な仕様書として機能
- **リファクタリングの安心感**: テストがあることで安全にコード改善が可能
- **開発速度の向上**: 長期的にはデバッグ時間の削減により開発速度が向上

---

## Test Pyramid Strategy

```
                    ╱╲
                   ╱  ╲           E2E Tests (10%)
                  ╱────╲          - Full user workflows
                 ╱      ╲         - Production-like environment
                ╱────────╲
               ╱          ╲       Integration Tests (30%)
              ╱────────────╲      - Component interactions
             ╱              ╲     - External API mocking
            ╱────────────────╲
           ╱                  ╲   Unit Tests (60%)
          ╱────────────────────╲  - Function/method level
                                  - Fast, isolated, deterministic
```

### Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| miyabi-types | 90%+ | P0 |
| miyabi-agents | 85%+ | P0 |
| miyabi-workflow | 85%+ | P0 |
| miyabi-github | 80%+ | P1 |
| miyabi-cli | 70%+ | P2 |
| miyabi-mcp-server | 80%+ | P1 |

---

## Red-Green-Refactor Cycle

### Phase 1: RED (Write a Failing Test)

**Goal**: Define the expected behavior through a test that fails

```rust
// tests/workflow_test.rs

#[cfg(test)]
mod workflow_execution_tests {
    use super::*;

    #[tokio::test]
    async fn test_workflow_executes_steps_in_order() {
        // Arrange
        let workflow = Workflow::builder()
            .add_step("step1", step1_fn)
            .add_step("step2", step2_fn)
            .build();

        // Act
        let result = workflow.execute().await;

        // Assert
        assert!(result.is_ok());
        let execution_log = result.unwrap();
        assert_eq!(execution_log.steps_executed, vec!["step1", "step2"]);
    }

    #[tokio::test]
    async fn test_workflow_stops_on_error() {
        // Arrange
        let workflow = Workflow::builder()
            .add_step("step1", failing_step_fn)
            .add_step("step2", step2_fn)
            .build();

        // Act
        let result = workflow.execute().await;

        // Assert
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(matches!(error, WorkflowError::StepFailed { step: "step1", .. }));
    }
}
```

**Run**:
```bash
cargo test test_workflow_executes_steps_in_order --no-run
cargo test test_workflow_executes_steps_in_order
# Expected: FAILED (test fails because implementation doesn't exist)
```

### Phase 2: GREEN (Make the Test Pass)

**Goal**: Write minimal code to make the test pass

```rust
// src/workflow.rs

pub struct Workflow {
    steps: Vec<WorkflowStep>,
}

impl Workflow {
    pub fn builder() -> WorkflowBuilder {
        WorkflowBuilder::new()
    }

    pub async fn execute(&self) -> Result<ExecutionLog, WorkflowError> {
        let mut log = ExecutionLog::new();

        for step in &self.steps {
            match step.execute().await {
                Ok(_) => {
                    log.steps_executed.push(step.name.clone());
                }
                Err(e) => {
                    return Err(WorkflowError::StepFailed {
                        step: step.name.clone(),
                        cause: e,
                    });
                }
            }
        }

        Ok(log)
    }
}
```

**Run**:
```bash
cargo test test_workflow_executes_steps_in_order
# Expected: PASSED
```

### Phase 3: REFACTOR (Improve the Code)

**Goal**: Improve code quality while keeping tests green

```rust
// src/workflow.rs - Refactored

pub struct Workflow {
    steps: Vec<WorkflowStep>,
    error_handler: Option<Box<dyn ErrorHandler>>,
}

impl Workflow {
    pub async fn execute(&self) -> Result<ExecutionLog, WorkflowError> {
        let mut context = ExecutionContext::new();

        for step in &self.steps {
            self.execute_step(step, &mut context).await?;
        }

        Ok(context.into_log())
    }

    async fn execute_step(
        &self,
        step: &WorkflowStep,
        context: &mut ExecutionContext,
    ) -> Result<(), WorkflowError> {
        tracing::info!(step = %step.name, "Executing step");

        step.execute(context)
            .await
            .map_err(|e| self.handle_step_error(step, e))?;

        context.record_step(&step.name);
        Ok(())
    }

    fn handle_step_error(&self, step: &WorkflowStep, error: StepError) -> WorkflowError {
        if let Some(handler) = &self.error_handler {
            handler.handle(&error);
        }
        WorkflowError::StepFailed {
            step: step.name.clone(),
            cause: error,
        }
    }
}
```

**Run**:
```bash
cargo test --workspace && cargo clippy -- -D warnings && cargo fmt -- --check
# Expected: All tests pass, no warnings, properly formatted
```

---

## Test Categories

### 1. Unit Tests

Location: `src/**/*.rs` (in `#[cfg(test)]` modules)

```rust
// src/parser.rs

pub fn parse_workflow(yaml: &str) -> Result<Workflow, ParseError> {
    // implementation
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_valid_workflow() {
        let yaml = r#"
            name: test-workflow
            steps:
              - name: step1
                action: echo
        "#;

        let result = parse_workflow(yaml);

        assert!(result.is_ok());
        let workflow = result.unwrap();
        assert_eq!(workflow.name, "test-workflow");
        assert_eq!(workflow.steps.len(), 1);
    }

    #[test]
    fn parse_invalid_yaml_returns_error() {
        let yaml = "invalid: [yaml: syntax";

        let result = parse_workflow(yaml);

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ParseError::InvalidYaml(_)));
    }
}
```

### 2. Integration Tests

Location: `tests/*.rs`

```rust
// tests/workflow_integration_test.rs

use miyabi_workflow::{Workflow, WorkflowEngine};
use miyabi_agents::AgentRegistry;

#[tokio::test]
async fn workflow_executes_with_real_agents() {
    // Setup
    let registry = AgentRegistry::default();
    let engine = WorkflowEngine::new(registry);

    let workflow = Workflow::from_yaml(include_str!("fixtures/test_workflow.yaml"))
        .expect("Failed to parse workflow");

    // Execute
    let result = engine.run(workflow).await;

    // Verify
    assert!(result.is_ok());
    let output = result.unwrap();
    assert!(output.completed);
    assert_eq!(output.steps_completed, 3);
}
```

### 3. End-to-End Tests

Location: `tests/e2e/*.rs`

```rust
// tests/e2e/full_workflow_test.rs

use miyabi_test_utils::{TestEnvironment, MockGitHub, MockLark};

#[tokio::test]
async fn complete_issue_to_pr_workflow() {
    // Setup test environment
    let env = TestEnvironment::new()
        .with_mock_github(MockGitHub::default())
        .with_mock_lark(MockLark::default())
        .await;

    // Create an issue
    let issue = env.github.create_issue("Fix bug in parser").await;

    // Trigger workflow
    let result = env.run_workflow("issue-to-pr", &issue).await;

    // Verify
    assert!(result.is_ok());

    // Check PR was created
    let prs = env.github.list_prs().await;
    assert_eq!(prs.len(), 1);
    assert!(prs[0].title.contains("Fix bug in parser"));

    // Check Lark notification was sent
    let messages = env.lark.sent_messages().await;
    assert!(!messages.is_empty());
}
```

---

## Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```rust
#[test]
fn test_with_aaa_pattern() {
    // Arrange - Setup test data and dependencies
    let input = TestInput::new("test_value");
    let expected = ExpectedOutput::new("expected_result");

    // Act - Execute the code under test
    let result = system_under_test(input);

    // Assert - Verify the results
    assert_eq!(result, expected);
}
```

### Pattern 2: Given-When-Then

```rust
#[test]
fn given_valid_user_when_login_then_returns_token() {
    // Given
    let user = User::new("test@example.com", "password123");
    let auth_service = AuthService::new();

    // When
    let result = auth_service.login(&user);

    // Then
    assert!(result.is_ok());
    let token = result.unwrap();
    assert!(!token.is_expired());
}
```

### Pattern 3: Test Fixtures

```rust
struct TestFixture {
    db: TestDatabase,
    github: MockGitHub,
    lark: MockLark,
}

impl TestFixture {
    async fn new() -> Self {
        Self {
            db: TestDatabase::setup().await,
            github: MockGitHub::new(),
            lark: MockLark::new(),
        }
    }

    async fn cleanup(self) {
        self.db.teardown().await;
    }
}

#[tokio::test]
async fn test_with_fixture() {
    let fixture = TestFixture::new().await;

    // Test code here

    fixture.cleanup().await;
}
```

### Pattern 4: Parameterized Tests

```rust
#[test_case("valid_email@example.com", true ; "valid email")]
#[test_case("invalid-email", false ; "invalid email without @")]
#[test_case("@invalid.com", false ; "invalid email without local part")]
#[test_case("a@b.c", true ; "minimal valid email")]
fn test_email_validation(email: &str, expected: bool) {
    assert_eq!(is_valid_email(email), expected);
}
```

### Pattern 5: Property-Based Testing

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn workflow_name_roundtrip(name in "[a-zA-Z][a-zA-Z0-9_-]{0,63}") {
        let workflow = Workflow::new(&name);
        let serialized = workflow.to_yaml();
        let deserialized = Workflow::from_yaml(&serialized).unwrap();
        prop_assert_eq!(workflow.name, deserialized.name);
    }

    #[test]
    fn parser_never_panics(input in ".*") {
        // Should not panic, error is acceptable
        let _ = parse_workflow(&input);
    }
}
```

### Pattern 6: Snapshot Testing

```rust
use insta::assert_snapshot;

#[test]
fn test_workflow_output_format() {
    let workflow = create_test_workflow();
    let output = workflow.to_yaml();

    assert_snapshot!(output);
}

#[test]
fn test_error_message_format() {
    let error = WorkflowError::StepFailed {
        step: "test_step".to_string(),
        cause: StepError::Timeout,
    };

    assert_snapshot!(error.to_string());
}
```

---

## Mocking Strategies

### Using mockall

```rust
use mockall::predicate::*;
use mockall::mock;

mock! {
    pub GitHubClient {
        async fn create_issue(&self, title: &str, body: &str) -> Result<Issue, GitHubError>;
        async fn create_pr(&self, params: CreatePrParams) -> Result<PullRequest, GitHubError>;
    }
}

#[tokio::test]
async fn test_workflow_creates_issue() {
    let mut mock_github = MockGitHubClient::new();

    mock_github
        .expect_create_issue()
        .with(eq("Test Issue"), eq("Issue body"))
        .times(1)
        .returning(|_, _| Ok(Issue::new(1, "Test Issue")));

    let workflow = Workflow::new(mock_github);
    let result = workflow.run().await;

    assert!(result.is_ok());
}
```

### Using Test Doubles

```rust
// Test double implementation
struct TestGitHubClient {
    issues: RefCell<Vec<Issue>>,
    should_fail: bool,
}

impl TestGitHubClient {
    fn new() -> Self {
        Self {
            issues: RefCell::new(vec![]),
            should_fail: false,
        }
    }

    fn with_failure(mut self) -> Self {
        self.should_fail = true;
        self
    }

    fn created_issues(&self) -> Vec<Issue> {
        self.issues.borrow().clone()
    }
}

impl GitHubClient for TestGitHubClient {
    async fn create_issue(&self, title: &str, body: &str) -> Result<Issue, GitHubError> {
        if self.should_fail {
            return Err(GitHubError::ApiError("Test failure".into()));
        }

        let issue = Issue::new(self.issues.borrow().len() + 1, title);
        self.issues.borrow_mut().push(issue.clone());
        Ok(issue)
    }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Cache cargo
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/
            ~/.cargo/git/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Run unit tests
        run: cargo test --workspace --lib

      - name: Run integration tests
        run: cargo test --workspace --test '*'

      - name: Run doc tests
        run: cargo test --workspace --doc

  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          components: clippy, rustfmt

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Run clippy
        run: cargo clippy --workspace --all-targets --all-features -- -D warnings

  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          components: llvm-tools-preview

      - name: Install cargo-llvm-cov
        uses: taiki-e/install-action@cargo-llvm-cov

      - name: Generate coverage
        run: cargo llvm-cov --workspace --lcov --output-path lcov.info

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: lcov.info
          fail_ci_if_error: true
```

---

## Best Practices

### Do

1. **Write tests before implementation**
2. **Keep tests focused and independent**
3. **Use descriptive test names**
4. **Test edge cases and error conditions**
5. **Maintain test code quality**
6. **Run tests frequently during development**
7. **Review test coverage regularly**

### Don't

1. **Don't test implementation details**
2. **Don't create tests that depend on each other**
3. **Don't ignore flaky tests**
4. **Don't skip writing tests for "simple" code**
5. **Don't let test coverage drop**
6. **Don't commit with failing tests**

---

## Metrics and Monitoring

### Coverage Reports

```bash
# Generate HTML coverage report
cargo llvm-cov --workspace --html
open target/llvm-cov/html/index.html

# Generate LCOV format for CI
cargo llvm-cov --workspace --lcov --output-path lcov.info
```

### Test Performance

```bash
# Time test execution
cargo test -- -Z unstable-options --report-time

# Find slow tests
cargo test -- -Z unstable-options --report-time 2>&1 | grep -E "test .+ ... ok \[[0-9]+\.[0-9]+s\]" | sort -t'[' -k2 -rn | head
```

---

## Related Documents

- [Rust Development Guide](../RUST_DEVELOPMENT_GUIDE.md)
- [CI/CD Pipeline](../ci-cd/PIPELINE.md)
- [Code Review Guidelines](../CODE_REVIEW.md)

---

**Maintainer**: Miyabi Core Team
**Last Review**: 2025-11-26
