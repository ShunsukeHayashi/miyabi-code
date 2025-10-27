# Phase 4: CodeGen Execution & 5-Worlds Parallel Implementation

**Status**: ✅ Implemented
**Version**: 1.0.0
**Date**: 2025-10-27

---

## Overview

Phase 4 implements **ClaudeCodeExecutor**, which executes `claude code --headless` commands across 5 parallel worlds using the **5-Worlds Quality Assurance Strategy** for high-confidence code generation.

### Key Features

1. **5-Worlds Parallel Execution**: Runs the same task in 5 isolated worktrees simultaneously
2. **Headless Claude Code**: Automated execution without human interaction
3. **Confidence Scoring**: Aggregates results with 80% success threshold
4. **Timeout Management**: 10-minute timeout per task with graceful failure handling
5. **Result Aggregation**: Collects and evaluates outputs from all worlds

---

## Architecture

```
HeadlessOrchestrator (Phase 1-3)
  ↓
ClaudeCodeExecutor (Phase 4) ← NEW
  ├── SessionManager (Session lifecycle management)
  ├── Launcher (claude code --headless spawning)
  └── FiveWorldsExecutor (Parallel coordination)
  ↓
5x Parallel Worktrees (issue-270-w0 to issue-270-w4)
  ↓
Result Aggregation & Confidence Scoring
```

---

## Implementation Details

### 1. ClaudeCodeExecutor

**File**: `crates/miyabi-orchestrator/src/claude_code_executor.rs`

#### Configuration

```rust
pub struct ExecutorConfig {
    /// Timeout for each task (seconds)
    pub timeout_secs: u64,              // Default: 600 (10 minutes)

    /// Number of parallel worlds
    pub num_worlds: usize,              // Default: 5

    /// Success threshold (0.0 - 1.0)
    pub success_threshold: f64,         // Default: 0.8 (80%)

    /// Base directory for logs
    pub log_dir: PathBuf,               // Default: .ai/logs/executor
}
```

#### Key Methods

##### `execute_agent_run()`

Executes `/agent-run --issue <number>` across 5 parallel worlds.

```rust
pub async fn execute_agent_run(
    &mut self,
    issue_number: u32,
    base_worktree_path: PathBuf,
) -> Result<ExecutionResult>
```

**Workflow**:
1. Creates 5 worktrees: `{base}-w0` to `{base}-w4`
2. Spawns `claude code --headless --execute-command "/agent-run --issue X"` in each
3. Monitors execution with 10-minute timeout per world
4. Collects results from all worlds
5. Calculates confidence score: `successful_worlds / total_worlds`
6. Returns success if confidence ≥ 80%

##### `get_stats()`

Returns session statistics.

```rust
pub async fn get_stats(&self) -> HashMap<SessionStatus, usize>
```

---

### 2. HeadlessOrchestrator Integration

**File**: `crates/miyabi-orchestrator/src/headless.rs`

#### Changes

1. **Added field**: `claude_code_executor: Option<ClaudeCodeExecutor>`
2. **Updated signature**: `handle_issue_created(&mut self, ...)` (now requires `&mut self`)
3. **New method**: `run_phase_4_codegen_execution()`

#### Phase 4 Execution Flow

```rust
// In handle_issue_created(), after Phase 3:
if self.claude_code_executor.is_some() && !worktrees.is_empty() {
    let execution_result = self
        .run_phase_4_codegen_execution(issue, &worktrees, &mut state_machine)
        .await?;

    info!("✅ Phase 4 complete: {}% confidence ({}/{} worlds succeeded)",
          (execution_result.confidence * 100.0).round(),
          execution_result.successful_worlds,
          execution_result.total_worlds);
}
```

#### run_phase_4_codegen_execution()

```rust
async fn run_phase_4_codegen_execution(
    &mut self,
    issue: &Issue,
    worktrees: &[WorktreeInfo],
    state_machine: &mut StateMachine,
) -> Result<ExecutionResult>
```

**Key Logic**:
- Uses first worktree as base
- Spawns 5-Worlds execution via `ClaudeCodeExecutor`
- Transitions state machine to `Phase::CodeGenGeneration`
- Sends escalation notification if confidence < 80%

---

## Execution Result Structure

```rust
pub struct ExecutionResult {
    /// Overall success flag
    pub success: bool,

    /// Confidence score (0.0 - 1.0)
    pub confidence: f64,

    /// Number of successful worlds
    pub successful_worlds: usize,

    /// Total number of worlds
    pub total_worlds: usize,

    /// Aggregated message
    pub message: String,

    /// Individual world results
    pub world_results: Vec<WorldResult>,
}

pub struct WorldResult {
    /// World ID (0-4)
    pub world_id: usize,

    /// Success flag
    pub success: bool,

    /// Message from the world
    pub message: String,

    /// Session ID
    pub session_id: String,
}
```

---

## Example Usage

### Standalone Usage

```rust
use miyabi_orchestrator::claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig};
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let executor = ClaudeCodeExecutor::new(ExecutorConfig::default());

    // Execute agent run with 5-Worlds parallel execution
    let result = executor.execute_agent_run(
        270, // Issue number
        PathBuf::from(".worktrees/issue-270"),
    ).await?;

    println!("Success: {}", result.success);
    println!("Confidence: {}%", result.confidence * 100.0);

    for world_result in &result.world_results {
        println!("World {}: {}", world_result.world_id,
                 if world_result.success { "✅" } else { "❌" });
    }

    Ok(())
}
```

### Integrated Usage (HeadlessOrchestrator)

```rust
use miyabi_orchestrator::headless::{HeadlessOrchestrator, HeadlessOrchestratorConfig};
use miyabi_types::Issue;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: false, // ClaudeCodeExecutor enabled only if dry_run=false
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = Issue {
        number: 270,
        title: "Implement authentication".to_string(),
        body: "Add JWT-based authentication".to_string(),
        // ...
    };

    // Phases 1-4 execute automatically
    let result = orchestrator.handle_issue_created(&issue).await?;

    println!("Final phase: {:?}", result.final_phase);
    println!("Success: {}", result.success);

    Ok(())
}
```

---

## Testing

### Integration Tests

**File**: `crates/miyabi-orchestrator/tests/phase4_integration.rs`

#### Test Coverage

1. **`test_phase4_executor_initialization`**: Verifies executor initialization
2. **`test_phase4_config_validation`**: Tests various config scenarios
3. **`test_phase4_confidence_calculation`**: Validates confidence scoring logic
4. **`test_phase4_execution_result_validation`**: Tests result structure
5. **`test_phase4_timeout_configuration`**: Verifies timeout handling
6. **`test_phase4_threshold_validation`**: Tests success thresholds

#### Running Tests

```bash
# Run all Phase 4 tests
cargo test --package miyabi-orchestrator --test phase4_integration

# Run specific test
cargo test --package miyabi-orchestrator --test phase4_integration test_phase4_confidence_calculation

# Run with ignored tests (requires claude code CLI)
cargo test --package miyabi-orchestrator --test phase4_integration -- --ignored
```

**Results**: ✅ 8 passed, 2 ignored

---

## Confidence Scoring Algorithm

### Formula

```
confidence = successful_worlds / total_worlds
```

### Thresholds

| Confidence | Outcome | Action |
|------------|---------|--------|
| ≥ 80% | ✅ Success | Continue to Phase 5 |
| < 80% | ❌ Failure | Escalate to human review |

### Examples

```rust
// Scenario 1: 5/5 worlds succeed → 100% confidence ✅
let confidence = 5.0 / 5.0; // 1.0

// Scenario 2: 4/5 worlds succeed → 80% confidence ✅
let confidence = 4.0 / 5.0; // 0.8

// Scenario 3: 3/5 worlds succeed → 60% confidence ❌
let confidence = 3.0 / 5.0; // 0.6 (below threshold)

// Scenario 4: 2/5 worlds succeed → 40% confidence ❌
let confidence = 2.0 / 5.0; // 0.4 (escalate to human)
```

---

## Execution Timeouts

### Configuration

```rust
pub struct ExecutorConfig {
    pub timeout_secs: u64, // Default: 600 (10 minutes)
}
```

### Behavior

- Each world has a 10-minute timeout
- If a world times out, it's marked as failed
- Timeout doesn't block other worlds (parallel execution)
- Total max time: 10 minutes (all worlds run concurrently)

### Timeout Handling

```rust
// In SessionManager
pub async fn wait_for_completion(&self, session_id: &str) -> Result<SessionStatus> {
    let timeout = Duration::from_secs(self.config.timeout_secs);
    let start = Instant::now();

    loop {
        if start.elapsed() > timeout {
            // Kill the process
            let mut sessions = self.sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                let _ = session.child.kill().await;
                session.status = SessionStatus::TimedOut;
            }
            return Err(SchedulerError::Timeout(self.config.timeout_secs));
        }

        // Check status every 1 second
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}
```

---

## Log Structure

```
.ai/logs/executor/
├── sessions/
│   ├── {session-id-1}/
│   │   ├── output.log
│   │   └── result.json
│   ├── {session-id-2}/
│   │   ├── output.log
│   │   └── result.json
│   └── ...
└── worktrees/
    └── (managed by FiveWorldsExecutor)
```

### Log Files

1. **output.log**: Complete stdout/stderr from `claude code --headless`
2. **result.json**: Parsed execution result with success status

---

## Error Handling

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `WorktreeNotFound` | Worktree doesn't exist | Return error, don't execute |
| `SpawnFailed` | `claude` CLI not found | Return error, log message |
| `Timeout` | World exceeds 10min limit | Mark world as failed, continue |
| `SessionNotFound` | Invalid session ID | Return error |
| `InvalidConfig` | Bad configuration | Return error at startup |

### Escalation

When confidence < 80%:
1. Log warning
2. Send Discord/Slack notification
3. Create GitHub Issue comment
4. Stop autonomous workflow
5. Wait for human review

---

## Performance Characteristics

### Time Complexity

- **Best case**: 10 minutes (all worlds complete in parallel)
- **Worst case**: 10 minutes (timeout triggers for all worlds)
- **Average case**: ~8 minutes (some worlds finish early)

### Speedup

Compared to sequential execution:
- **Sequential**: 5 worlds × 10min = 50 minutes
- **Parallel**: 1 × 10min = 10 minutes
- **Speedup**: **5x faster**

### Resource Usage

- **CPU**: 5 concurrent `claude code` processes
- **Memory**: ~5GB (1GB per world)
- **Disk**: Minimal (logs only)
- **Network**: API calls to Anthropic/OpenAI

---

## Future Improvements

### Planned Enhancements

1. **Dynamic World Scaling**: Adjust number of worlds based on complexity
   ```rust
   // Low complexity: 3 worlds
   // Medium complexity: 5 worlds
   // High complexity: 7 worlds
   ```

2. **Early Termination**: Stop execution when threshold is reached
   ```rust
   // If 4/5 worlds succeed early, stop 5th world
   if confidence >= threshold && remaining_worlds > 0 {
       cancel_remaining_worlds();
   }
   ```

3. **Voting Strategies**: Implement weighted voting based on world performance
   ```rust
   pub enum VotingStrategy {
       Majority,        // Current: 80% threshold
       Weighted,        // Weight by execution time
       ConsensusFirst,  // First world to reach consensus wins
   }
   ```

4. **Result Merging**: Combine best parts from multiple worlds
   ```rust
   // Select best files from each world
   let merged_result = merge_world_results(&world_results);
   ```

---

## Related Documentation

- [Issue #570](https://github.com/customer-cloud/miyabi-private/issues/570) - Phase 4 Implementation Epic
- [5-Worlds Quality Assurance Strategy](./FIVE_WORLDS_QA.md)
- [HeadlessOrchestrator Guide](./HEADLESS_ORCHESTRATOR.md)
- [SessionManager Documentation](./SESSION_MANAGER.md)

---

**Implementation completed**: 2025-10-27
**Tests passing**: ✅ 8/8 (2 ignored)
**Next Phase**: Phase 5 - Review & Quality Assurance
