# Backend Unit Testing Strategy - Issue #1026

**Version**: 1.0
**Date**: 2025-11-18
**Owner**: MAJIN
**Target Coverage**: 85%
**Estimated Effort**: 8-12 hours

---

## 📋 Executive Summary

This document outlines the comprehensive testing strategy for achieving 85% code coverage across the `miyabi-web-api` backend crate. The strategy covers 70+ unit and integration tests across 4 primary modules.

**Key Objectives**:
- ✅ Achieve 85% code coverage (target: ~2,500 lines covered)
- ✅ Implement 70+ unit and integration tests
- ✅ Setup automated coverage reporting
- ✅ Integrate with CI/CD pipeline
- ✅ Establish testing best practices

---

## 🎯 Testing Scope

### Coverage Analysis

**Current State**:
```
crates/miyabi-web-api/
├── src/
│   ├── routes/          (~800 lines) - 0% coverage ❌
│   ├── services/        (~600 lines) - 0% coverage ❌
│   ├── middleware/      (~400 lines) - 0% coverage ❌
│   ├── models/          (~500 lines) - 0% coverage ❌
│   └── utils/           (~300 lines) - 0% coverage ❌
└── tests/
    └── integration/     (3 tests) ✅
```

**Target State**:
```
Total Lines: ~2,600
Target Coverage: 85% = ~2,210 lines
Tests Required: ~70+ tests
```

---

## 📦 Test Module Breakdown

### Module 1: Authentication Tests (~15-20 tests)

**File**: `tests/unit/auth_tests.rs`
**Coverage Target**: 90% (critical security module)
**Lines to Cover**: ~400 lines

#### Test Cases:

##### 1.1 GitHub OAuth Flow (5 tests)
```rust
#[tokio::test]
async fn test_github_oauth_initiate_success() {
    // Test: Valid redirect URL
    // Verify: Correct GitHub OAuth URL generated
    // Verify: State parameter includes redirect path
}

#[tokio::test]
async fn test_github_oauth_initiate_default_redirect() {
    // Test: No redirect parameter provided
    // Verify: Defaults to "/dashboard"
}

#[tokio::test]
async fn test_github_oauth_callback_success() {
    // Test: Valid authorization code
    // Verify: JWT tokens generated correctly
    // Verify: User data stored in database
}

#[tokio::test]
async fn test_github_oauth_callback_invalid_code() {
    // Test: Invalid/expired authorization code
    // Verify: Returns 401 Unauthorized
    // Verify: No tokens generated
}

#[tokio::test]
async fn test_github_oauth_callback_state_mismatch() {
    // Test: State parameter doesn't match
    // Verify: Returns 400 Bad Request
    // Verify: CSRF protection working
}
```

##### 1.2 JWT Token Management (6 tests)
```rust
#[tokio::test]
async fn test_generate_jwt_tokens_success() {
    // Test: Valid user data
    // Verify: Access token valid for 1 hour
    // Verify: Refresh token valid for 7 days
}

#[tokio::test]
async fn test_verify_jwt_token_valid() {
    // Test: Valid unexpired token
    // Verify: Token claims extracted correctly
    // Verify: User ID matches
}

#[tokio::test]
async fn test_verify_jwt_token_expired() {
    // Test: Expired token
    // Verify: Returns TokenExpired error
}

#[tokio::test]
async fn test_verify_jwt_token_invalid_signature() {
    // Test: Token with tampered signature
    // Verify: Returns InvalidToken error
}

#[tokio::test]
async fn test_refresh_token_success() {
    // Test: Valid refresh token
    // Verify: New access token generated
    // Verify: Refresh token rotated
}

#[tokio::test]
async fn test_refresh_token_invalid() {
    // Test: Invalid/expired refresh token
    // Verify: Returns 401 Unauthorized
    // Verify: No new tokens generated
}
```

##### 1.3 User Session Management (4 tests)
```rust
#[tokio::test]
async fn test_create_user_session() {
    // Test: New user login
    // Verify: Session created in database
    // Verify: Session ID in response
}

#[tokio::test]
async fn test_get_current_user_success() {
    // Test: Valid JWT token
    // Verify: User data retrieved
    // Verify: Sensitive data filtered
}

#[tokio::test]
async fn test_logout_success() {
    // Test: Valid session
    // Verify: Session invalidated
    // Verify: Tokens revoked
}

#[tokio::test]
async fn test_logout_already_logged_out() {
    // Test: Invalid/expired session
    // Verify: Returns 401 Unauthorized
}
```

##### 1.4 Permission Checks (4 tests)
```rust
#[tokio::test]
async fn test_admin_permission_check_success() {
    // Test: User with admin role
    // Verify: Access granted
}

#[tokio::test]
async fn test_admin_permission_check_denied() {
    // Test: User without admin role
    // Verify: Returns 403 Forbidden
}

#[tokio::test]
async fn test_user_owns_resource_success() {
    // Test: User accessing own resource
    // Verify: Access granted
}

#[tokio::test]
async fn test_user_owns_resource_denied() {
    // Test: User accessing another user's resource
    // Verify: Returns 403 Forbidden
}
```

---

### Module 2: Task Service Tests (~25-30 tests)

**File**: `tests/unit/task_service_tests.rs`
**Coverage Target**: 85%
**Lines to Cover**: ~600 lines

#### Test Cases:

##### 2.1 Task CRUD Operations (8 tests)
```rust
#[tokio::test]
async fn test_create_task_success() {
    // Test: Valid task creation
    // Verify: Task saved to database
    // Verify: Correct owner assigned
}

#[tokio::test]
async fn test_create_task_validation_failure() {
    // Test: Invalid task data (empty title, etc.)
    // Verify: Returns 400 Bad Request
    // Verify: Validation errors in response
}

#[tokio::test]
async fn test_get_task_by_id_success() {
    // Test: Existing task ID
    // Verify: Task data returned
    // Verify: Related data included (agent, dependencies)
}

#[tokio::test]
async fn test_get_task_by_id_not_found() {
    // Test: Non-existent task ID
    // Verify: Returns 404 Not Found
}

#[tokio::test]
async fn test_update_task_success() {
    // Test: Valid update data
    // Verify: Task updated in database
    // Verify: Updated_at timestamp changed
}

#[tokio::test]
async fn test_update_task_not_found() {
    // Test: Non-existent task ID
    // Verify: Returns 404 Not Found
}

#[tokio::test]
async fn test_delete_task_success() {
    // Test: Existing task
    // Verify: Task marked as deleted (soft delete)
    // Verify: Dependencies updated
}

#[tokio::test]
async fn test_delete_task_cascade_dependencies() {
    // Test: Task with dependent tasks
    // Verify: Dependent tasks handled correctly
    // Verify: DAG integrity maintained
}
```

##### 2.2 Task Query and Filtering (6 tests)
```rust
#[tokio::test]
async fn test_list_tasks_all() {
    // Test: No filters
    // Verify: All user's tasks returned
    // Verify: Pagination works
}

#[tokio::test]
async fn test_list_tasks_by_status() {
    // Test: Status filter (pending, running, completed, failed)
    // Verify: Only matching tasks returned
}

#[tokio::test]
async fn test_list_tasks_by_agent() {
    // Test: Agent filter
    // Verify: Only tasks for specific agent returned
}

#[tokio::test]
async fn test_list_tasks_by_priority() {
    // Test: Priority filter (P0, P1, P2)
    // Verify: Correct priority ordering
}

#[tokio::test]
async fn test_list_tasks_pagination() {
    // Test: Page size and offset
    // Verify: Correct page returned
    // Verify: Total count accurate
}

#[tokio::test]
async fn test_search_tasks_by_title() {
    // Test: Text search in title
    // Verify: Fuzzy matching works
    // Verify: Results ranked by relevance
}
```

##### 2.3 Task Dependencies (DAG) (6 tests)
```rust
#[tokio::test]
async fn test_add_task_dependency_success() {
    // Test: Valid dependency relationship
    // Verify: Edge added to DAG
    // Verify: No cycle created
}

#[tokio::test]
async fn test_add_task_dependency_cycle_detection() {
    // Test: Dependency would create cycle
    // Verify: Returns 400 Bad Request
    // Verify: DAG integrity maintained
}

#[tokio::test]
async fn test_remove_task_dependency() {
    // Test: Remove existing dependency
    // Verify: Edge removed from DAG
    // Verify: Task status recalculated
}

#[tokio::test]
async fn test_get_task_dependencies() {
    // Test: Task with multiple dependencies
    // Verify: All upstream dependencies returned
    // Verify: Correct depth traversal
}

#[tokio::test]
async fn test_get_task_dependents() {
    // Test: Task with multiple dependents
    // Verify: All downstream tasks returned
}

#[tokio::test]
async fn test_calculate_task_priority_from_dag() {
    // Test: Task position in DAG
    // Verify: Priority calculated from critical path
    // Verify: Blocked tasks have lower priority
}
```

##### 2.4 Task Execution State (5 tests)
```rust
#[tokio::test]
async fn test_start_task_execution_success() {
    // Test: Ready task (no blocked dependencies)
    // Verify: Status changed to 'running'
    // Verify: Started_at timestamp set
}

#[tokio::test]
async fn test_start_task_execution_blocked() {
    // Test: Task with incomplete dependencies
    // Verify: Returns 409 Conflict
    // Verify: Status unchanged
}

#[tokio::test]
async fn test_complete_task_success() {
    // Test: Running task
    // Verify: Status changed to 'completed'
    // Verify: Completed_at timestamp set
    // Verify: Dependent tasks unblocked
}

#[tokio::test]
async fn test_fail_task_with_retry() {
    // Test: Task failure with retry policy
    // Verify: Status changed to 'failed'
    // Verify: Retry scheduled if retries remaining
}

#[tokio::test]
async fn test_cancel_task_execution() {
    // Test: Running task cancellation
    // Verify: Status changed to 'cancelled'
    // Verify: Agent notified
}
```

---

### Module 3: Agent Management Tests (~15 tests)

**File**: `tests/unit/agent_tests.rs`
**Coverage Target**: 80%
**Lines to Cover**: ~400 lines

#### Test Cases:

##### 3.1 Agent Registration (4 tests)
```rust
#[tokio::test]
async fn test_register_agent_success() {
    // Test: New agent registration
    // Verify: Agent created in database
    // Verify: Capabilities stored correctly
}

#[tokio::test]
async fn test_register_agent_duplicate_name() {
    // Test: Agent name already exists
    // Verify: Returns 409 Conflict
}

#[tokio::test]
async fn test_update_agent_capabilities() {
    // Test: Update agent skills/tools
    // Verify: Capabilities updated
    // Verify: Version incremented
}

#[tokio::test]
async fn test_deregister_agent() {
    // Test: Remove agent
    // Verify: Agent marked inactive
    // Verify: Running tasks handled
}
```

##### 3.2 Agent Assignment (5 tests)
```rust
#[tokio::test]
async fn test_assign_task_to_agent_success() {
    // Test: Agent has required capabilities
    // Verify: Task assigned
    // Verify: Agent workload updated
}

#[tokio::test]
async fn test_assign_task_agent_at_capacity() {
    // Test: Agent at max concurrent tasks
    // Verify: Returns 503 Service Unavailable
    // Verify: Task queued for later
}

#[tokio::test]
async fn test_auto_assign_task_to_best_agent() {
    // Test: Multiple capable agents available
    // Verify: Agent with lowest workload selected
    // Verify: Capability match prioritized
}

#[tokio::test]
async fn test_reassign_task_to_different_agent() {
    // Test: Task reassignment (agent failure)
    // Verify: Previous assignment cleared
    // Verify: New agent assigned
}

#[tokio::test]
async fn test_unassign_task_from_agent() {
    // Test: Remove task assignment
    // Verify: Task status reset
    // Verify: Agent workload decremented
}
```

##### 3.3 Agent Health and Monitoring (6 tests)
```rust
#[tokio::test]
async fn test_agent_heartbeat_success() {
    // Test: Active agent sends heartbeat
    // Verify: Last_seen updated
    // Verify: Status remains 'active'
}

#[tokio::test]
async fn test_agent_heartbeat_timeout() {
    // Test: No heartbeat received for 60s
    // Verify: Agent marked 'inactive'
    // Verify: Assigned tasks reassigned
}

#[tokio::test]
async fn test_get_agent_metrics() {
    // Test: Request agent statistics
    // Verify: Task count, success rate, avg duration returned
}

#[tokio::test]
async fn test_get_agent_workload() {
    // Test: Query current agent load
    // Verify: Running tasks count
    // Verify: Queue size
}

#[tokio::test]
async fn test_agent_failure_handling() {
    // Test: Agent reports failure/crash
    // Verify: Agent marked 'failed'
    // Verify: Tasks reassigned to other agents
}

#[tokio::test]
async fn test_list_agents_by_status() {
    // Test: Filter agents by active/inactive/failed
    // Verify: Correct agents returned
}
```

---

### Module 4: Integration Tests (~20 tests)

**File**: `tests/integration/api_integration_tests.rs`
**Coverage Target**: 80%
**Lines to Cover**: ~500 lines

#### Test Cases:

##### 4.1 End-to-End Workflows (8 tests)
```rust
#[tokio::test]
async fn test_e2e_user_auth_and_task_creation() {
    // 1. GitHub OAuth login
    // 2. Create task with JWT token
    // 3. Verify task in database
    // 4. Logout
}

#[tokio::test]
async fn test_e2e_task_execution_pipeline() {
    // 1. Create task with dependencies
    // 2. Assign to agent
    // 3. Start execution (auto-blocks if dependencies)
    // 4. Complete dependencies
    // 5. Execute main task
    // 6. Verify completion
}

#[tokio::test]
async fn test_e2e_multi_agent_coordination() {
    // 1. Register 3 agents
    // 2. Create 10 tasks
    // 3. Auto-assign to agents
    // 4. Execute in parallel
    // 5. Verify all complete
}

#[tokio::test]
async fn test_e2e_dag_dependency_resolution() {
    // 1. Create complex DAG (10 tasks, multiple levels)
    // 2. Execute leaf tasks first
    // 3. Verify cascading execution
    // 4. Verify all tasks complete in correct order
}

#[tokio::test]
async fn test_e2e_task_failure_and_retry() {
    // 1. Create task with retry policy
    // 2. Fail task execution
    // 3. Verify retry scheduled
    // 4. Succeed on retry
}

#[tokio::test]
async fn test_e2e_websocket_task_updates() {
    // 1. Connect WebSocket
    // 2. Create task
    // 3. Verify WebSocket receives task.created event
    // 4. Start task
    // 5. Verify WebSocket receives task.started event
    // 6. Complete task
    // 7. Verify WebSocket receives task.completed event
}

#[tokio::test]
async fn test_e2e_permission_enforcement() {
    // 1. Create user A and user B
    // 2. User A creates task
    // 3. User B attempts to modify task
    // 4. Verify 403 Forbidden
}

#[tokio::test]
async fn test_e2e_pagination_and_filtering() {
    // 1. Create 100 tasks
    // 2. Query with pagination (page_size=10)
    // 3. Verify 10 results per page
    // 4. Filter by status
    // 5. Verify correct filtering
}
```

##### 4.2 Error Handling and Edge Cases (6 tests)
```rust
#[tokio::test]
async fn test_concurrent_task_updates_race_condition() {
    // Test: Two agents update same task simultaneously
    // Verify: Optimistic locking prevents data loss
    // Verify: One update succeeds, one fails with 409
}

#[tokio::test]
async fn test_database_connection_pool_exhaustion() {
    // Test: Create 100 concurrent requests
    // Verify: Connection pool handles load
    // Verify: No connection leaks
}

#[tokio::test]
async fn test_large_payload_handling() {
    // Test: Task with 1MB description
    // Verify: Request accepted or rejected gracefully
    // Verify: No server crash
}

#[tokio::test]
async fn test_invalid_json_payload() {
    // Test: Malformed JSON in request
    // Verify: Returns 400 Bad Request
    // Verify: Clear error message
}

#[tokio::test]
async fn test_missing_required_fields() {
    // Test: Create task without title
    // Verify: Returns 400 Bad Request
    // Verify: Validation errors listed
}

#[tokio::test]
async fn test_sql_injection_prevention() {
    // Test: Task title with SQL injection attempt
    // Verify: Query parameterized correctly
    // Verify: No SQL execution
}
```

##### 4.3 Performance and Load Tests (6 tests)
```rust
#[tokio::test]
async fn test_api_response_time_p95() {
    // Test: 100 requests to /tasks endpoint
    // Verify: P95 latency < 100ms
}

#[tokio::test]
async fn test_concurrent_task_creation_throughput() {
    // Test: 50 concurrent task creation requests
    // Verify: All succeed
    // Verify: Total time < 5s
}

#[tokio::test]
async fn test_task_list_query_performance() {
    // Test: Query 1000 tasks with pagination
    // Verify: Query time < 50ms
}

#[tokio::test]
async fn test_websocket_connection_scaling() {
    // Test: 100 concurrent WebSocket connections
    // Verify: All connected
    // Verify: Message broadcast < 100ms
}

#[tokio::test]
async fn test_database_query_optimization() {
    // Test: Complex DAG query (100 nodes)
    // Verify: N+1 queries avoided
    // Verify: Single query with joins
}

#[tokio::test]
async fn test_cache_hit_rate() {
    // Test: Query same task 100 times
    // Verify: Redis cache hit rate > 95%
    // Verify: Database queries < 5
}
```

---

## 🏗️ Test Infrastructure Setup

### 1. Test Database Configuration

**File**: `tests/common/mod.rs`

```rust
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;

pub async fn setup_test_database() -> PgPool {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/miyabi_test".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    pool
}

pub async fn cleanup_test_database(pool: &PgPool) {
    sqlx::query("TRUNCATE TABLE tasks, agents, users, sessions CASCADE")
        .execute(pool)
        .await
        .expect("Failed to clean up test database");
}
```

### 2. Test Fixtures

**File**: `tests/fixtures/mod.rs`

```rust
use miyabi_web_api::models::{User, Task, Agent};
use chrono::Utc;

pub struct TestFixtures;

impl TestFixtures {
    pub fn create_test_user() -> User {
        User {
            id: "test_user_1".to_string(),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    pub fn create_test_task(owner_id: &str) -> Task {
        Task {
            id: "task_1".to_string(),
            title: "Test Task".to_string(),
            description: Some("Test description".to_string()),
            status: "pending".to_string(),
            priority: "P1".to_string(),
            owner_id: owner_id.to_string(),
            agent_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            started_at: None,
            completed_at: None,
        }
    }

    pub fn create_test_agent() -> Agent {
        Agent {
            id: "agent_1".to_string(),
            name: "Test Agent".to_string(),
            capabilities: vec!["coding".to_string(), "testing".to_string()],
            status: "active".to_string(),
            max_concurrent_tasks: 5,
            current_task_count: 0,
            created_at: Utc::now(),
            last_seen: Utc::now(),
        }
    }
}
```

### 3. Mock Services

**File**: `tests/mocks/mod.rs`

```rust
use async_trait::async_trait;
use miyabi_web_api::services::{GitHubService, LLMService};

pub struct MockGitHubService {
    pub mock_access_token: String,
    pub mock_user_data: serde_json::Value,
}

#[async_trait]
impl GitHubService for MockGitHubService {
    async fn exchange_code_for_token(&self, _code: &str) -> Result<String, Error> {
        Ok(self.mock_access_token.clone())
    }

    async fn get_user_data(&self, _token: &str) -> Result<serde_json::Value, Error> {
        Ok(self.mock_user_data.clone())
    }
}

pub struct MockLLMService {
    pub mock_response: String,
}

#[async_trait]
impl LLMService for MockLLMService {
    async fn generate(&self, _prompt: &str) -> Result<String, Error> {
        Ok(self.mock_response.clone())
    }
}
```

### 4. Test Helpers

**File**: `tests/helpers/mod.rs`

```rust
use axum::http::{Request, StatusCode};
use tower::ServiceExt;

pub async fn make_request<B>(
    app: Router,
    method: Method,
    uri: &str,
    body: B,
    auth_token: Option<&str>,
) -> Response
where
    B: Into<Body>,
{
    let mut request = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json");

    if let Some(token) = auth_token {
        request = request.header("authorization", format!("Bearer {}", token));
    }

    let request = request.body(body.into()).unwrap();

    app.oneshot(request).await.unwrap()
}

pub fn assert_status_code(response: &Response, expected: StatusCode) {
    assert_eq!(response.status(), expected, "Unexpected status code");
}

pub async fn extract_json<T>(response: Response) -> T
where
    T: serde::de::DeserializeOwned,
{
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    serde_json::from_slice(&body).unwrap()
}
```

---

## 📊 Coverage Tooling

### Option 1: cargo-tarpaulin (Recommended)

**Installation**:
```bash
cargo install cargo-tarpaulin
```

**Configuration**: `.tarpaulin.toml`
```toml
[report]
out = ["Html", "Lcov", "Json"]
output-dir = "coverage"

[run]
exclude = [
    "tests/*",
    "*/tests/*",
    "*/mocks/*",
    "*/fixtures/*"
]

[coverage]
engine = "llvm"
```

**Usage**:
```bash
# Run coverage
cargo tarpaulin --workspace --out Html --out Lcov --out Json

# View HTML report
open coverage/index.html

# Check coverage threshold
cargo tarpaulin --fail-under 85
```

### Option 2: cargo-llvm-cov

**Installation**:
```bash
rustup component add llvm-tools-preview
cargo install cargo-llvm-cov
```

**Usage**:
```bash
# Run coverage
cargo llvm-cov --html --open

# Generate LCOV format for CI
cargo llvm-cov --lcov --output-path lcov.info
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test-coverage.yml`

```yaml
name: Test Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  RUST_BACKTRACE: 1
  DATABASE_URL: postgres://postgres:postgres@localhost/miyabi_test

jobs:
  test-coverage:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: miyabi_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          profile: minimal
          toolchain: stable
          override: true

      - name: Install tarpaulin
        run: cargo install cargo-tarpaulin

      - name: Run migrations
        run: |
          cd crates/miyabi-web-api
          sqlx migrate run

      - name: Run tests with coverage
        run: |
          cargo tarpaulin \
            --workspace \
            --out Lcov \
            --out Json \
            --out Html \
            --fail-under 85 \
            --timeout 300

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./lcov.info
          fail_ci_if_error: true

      - name: Archive coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📈 Implementation Timeline

### Phase 1: Infrastructure Setup (2 hours)

**Tasks**:
- [ ] Create test database configuration
- [ ] Setup test fixtures and mocks
- [ ] Configure coverage tooling (tarpaulin)
- [ ] Create test helpers and utilities
- [ ] Setup GitHub Actions workflow

**Deliverables**:
- `tests/common/mod.rs` - Database setup
- `tests/fixtures/mod.rs` - Test data
- `tests/mocks/mod.rs` - Mock services
- `tests/helpers/mod.rs` - Test utilities
- `.tarpaulin.toml` - Coverage config
- `.github/workflows/test-coverage.yml` - CI workflow

---

### Phase 2: Authentication Tests (2 hours)

**Tasks**:
- [ ] Implement GitHub OAuth flow tests (5 tests)
- [ ] Implement JWT token management tests (6 tests)
- [ ] Implement user session tests (4 tests)
- [ ] Implement permission check tests (4 tests)

**Coverage Target**: 90% of `routes/auth.rs`

---

### Phase 3: Task Service Tests (3 hours)

**Tasks**:
- [ ] Implement CRUD operation tests (8 tests)
- [ ] Implement query and filtering tests (6 tests)
- [ ] Implement DAG dependency tests (6 tests)
- [ ] Implement execution state tests (5 tests)

**Coverage Target**: 85% of `services/task_service.rs`

---

### Phase 4: Agent Management Tests (2 hours)

**Tasks**:
- [ ] Implement agent registration tests (4 tests)
- [ ] Implement agent assignment tests (5 tests)
- [ ] Implement health monitoring tests (6 tests)

**Coverage Target**: 80% of `services/agent_service.rs`

---

### Phase 5: Integration Tests (2 hours)

**Tasks**:
- [ ] Implement end-to-end workflow tests (8 tests)
- [ ] Implement error handling tests (6 tests)
- [ ] Implement performance tests (6 tests)

**Coverage Target**: 80% of integration paths

---

### Phase 6: Coverage Validation & CI (1 hour)

**Tasks**:
- [ ] Run full test suite locally
- [ ] Verify 85% coverage achieved
- [ ] Fix any coverage gaps
- [ ] Test CI/CD workflow
- [ ] Generate final coverage report

**Deliverable**: Coverage report showing ≥85%

---

## ✅ Success Criteria

### Quantitative Metrics

- ✅ **Total Tests**: ≥70 tests implemented
- ✅ **Code Coverage**: ≥85% (target: ~2,210 lines)
- ✅ **Test Execution Time**: <60 seconds for full suite
- ✅ **CI/CD Integration**: All tests pass on every PR
- ✅ **Coverage Regression**: CI fails if coverage drops below 85%

### Qualitative Metrics

- ✅ **Test Quality**: Each test has clear purpose and assertions
- ✅ **Test Isolation**: Tests don't interfere with each other
- ✅ **Test Reliability**: No flaky tests (100% pass rate)
- ✅ **Documentation**: Each test has descriptive comments
- ✅ **Maintainability**: Tests are easy to update when code changes

---

## 📚 Best Practices

### 1. Test Naming Convention

```rust
#[tokio::test]
async fn test_<module>_<action>_<expected_result>() {
    // Example: test_auth_login_success
    // Example: test_task_create_validation_failure
}
```

### 2. Arrange-Act-Assert Pattern

```rust
#[tokio::test]
async fn test_example() {
    // ARRANGE: Setup test data
    let pool = setup_test_database().await;
    let user = TestFixtures::create_test_user();

    // ACT: Execute the code under test
    let result = create_user(&pool, user).await;

    // ASSERT: Verify the outcome
    assert!(result.is_ok());
    assert_eq!(result.unwrap().email, "test@example.com");

    // CLEANUP
    cleanup_test_database(&pool).await;
}
```

### 3. Use Test Helpers

```rust
// ❌ DON'T: Duplicate setup code
#[tokio::test]
async fn test_1() {
    let pool = PgPoolOptions::new().connect("...").await.unwrap();
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();
    // ... test code
}

// ✅ DO: Use shared helpers
#[tokio::test]
async fn test_1() {
    let pool = setup_test_database().await;
    // ... test code
    cleanup_test_database(&pool).await;
}
```

### 4. Isolate Tests

```rust
// ✅ DO: Each test creates its own data
#[tokio::test]
async fn test_1() {
    let pool = setup_test_database().await;
    let user = TestFixtures::create_test_user();
    // Test uses only this user
    cleanup_test_database(&pool).await;
}

// ❌ DON'T: Tests share mutable state
static mut SHARED_USER: Option<User> = None; // Avoid!
```

### 5. Mock External Dependencies

```rust
// ✅ DO: Mock GitHub API calls
let mock_github = MockGitHubService {
    mock_access_token: "test_token".to_string(),
    mock_user_data: json!({"id": 123, "login": "test"}),
};

// ❌ DON'T: Make real API calls in tests
let token = github_api.exchange_code("real_code").await; // Flaky!
```

---

## 🎯 Next Steps

1. **Review and Approval**: Review this strategy document
2. **Infrastructure Setup**: Create test infrastructure (Phase 1)
3. **Incremental Implementation**: Implement tests module by module (Phases 2-5)
4. **Coverage Validation**: Verify 85% coverage achieved (Phase 6)
5. **CI Integration**: Deploy GitHub Actions workflow
6. **Documentation**: Update README with testing instructions

**Estimated Total Effort**: 10-12 hours

---

## 📝 Appendix

### A. Test Database Schema

**Required Tables**:
- `users` - User accounts
- `sessions` - User sessions
- `tasks` - Task records
- `task_dependencies` - DAG edges
- `agents` - Agent registrations
- `agent_assignments` - Task assignments

### B. Environment Variables

```bash
# Test environment
TEST_DATABASE_URL=postgres://localhost/miyabi_test
TEST_REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=test_client_id
GITHUB_CLIENT_SECRET=test_client_secret
JWT_SECRET=test_jwt_secret
```

### C. Coverage Exclusions

**Excluded from coverage**:
- Test code itself (`tests/*`)
- Mock implementations (`*/mocks/*`)
- Test fixtures (`*/fixtures/*`)
- Generated code (if any)

### D. References

- [Rust Testing Best Practices](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [cargo-tarpaulin Documentation](https://github.com/xd009642/tarpaulin)
- [Axum Testing Guide](https://github.com/tokio-rs/axum/tree/main/examples/testing)
- [SQLx Testing Examples](https://github.com/launchbadge/sqlx/tree/main/tests)

---

**Document End**
