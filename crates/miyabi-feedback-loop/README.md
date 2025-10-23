# miyabi-feedback-loop

Infinite feedback loop orchestration for Miyabi autonomous agents.

## Status: ✅ Stable (v0.1.1)

Rust port of the TypeScript `InfiniteLoopOrchestrator`, providing production-ready feedback loop execution with convergence detection and auto-refinement.

## Features

- **Infinite Loop Execution**: Continuous feedback loop until convergence
- **Convergence Detection**: Automatic goal achievement detection via variance analysis
- **Auto-Refinement**: Dynamic goal adjustment based on feedback
- **Error Handling**: Robust retry logic with exponential backoff
- **Goal Management**: Full CRUD operations for goal lifecycle
- **Status Tracking**: Real-time loop and goal status monitoring
- **Configuration**: Flexible configuration with sensible defaults

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-feedback-loop = "0.1.1"
```

## Usage

### CLI Usage

```bash
# Basic usage with max iterations
miyabi loop start --issues 270,271 --max-iterations 10

# Infinite loop with convergence threshold
miyabi loop start --issues 270 --convergence-threshold 3.0

# Auto-refinement enabled
miyabi loop start --issues 270 --auto-refinement

# Custom timeout and retries
miyabi loop start --issues 270 --timeout-ms 600000 --max-retries 5

# Get loop status
miyabi loop status issue-270

# Cancel running loop
miyabi loop cancel issue-270
```

### Programmatic Usage

```rust
use miyabi_feedback_loop::{InfiniteLoopOrchestrator, LoopConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create configuration
    let config = LoopConfig {
        max_iterations: Some(10),
        convergence_threshold: 5.0,
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: true,
        timeout_ms: 300_000, // 5 minutes
        max_retries: 3,
        iteration_delay_ms: 1000,
    };

    // Create orchestrator
    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    // Start feedback loop
    let result = orchestrator.start_loop("issue-270").await?;

    println!("Goal: {}", result.goal_id);
    println!("Iterations: {}", result.iterations);
    println!("Status: {:?}", result.status);
    println!("Final Score: {:.1}", result.convergence_metrics.last().unwrap_or(&0.0));

    Ok(())
}
```

### Infinite Mode

```rust
use miyabi_feedback_loop::LoopConfig;

// Create infinite loop configuration (no max_iterations)
let config = LoopConfig::infinite();

// Or customize infinite mode
let config = LoopConfig {
    max_iterations: None, // Runs until convergence
    convergence_threshold: 3.0,
    min_iterations_before_convergence: 5,
    auto_refinement_enabled: true,
    ..Default::default()
};
```

### Goal Management

```rust
use miyabi_feedback_loop::{GoalManager, GoalStatus};

let mut manager = GoalManager::new();

// Create goal
let goal = manager.create_goal("feature-123", "Implement new feature");

// Update status
manager.update_status("feature-123", GoalStatus::Active)?;

// Set criteria
manager.set_criterion("feature-123", "coverage", 80.0)?;
manager.set_criterion("feature-123", "quality", 90.0)?;

// Refine goal
manager.refine_goal("feature-123", "Focus on edge cases")?;

// Increment iteration
let iteration = manager.increment_iteration("feature-123")?;

// Get active goals
let active = manager.active_goals();
```

## Architecture

```
miyabi-feedback-loop/
├── src/
│   ├── lib.rs                  # Public API
│   ├── config.rs               # LoopConfig (6 unit tests)
│   ├── error.rs                # LoopError types (3 unit tests)
│   ├── goal_manager.rs         # Goal CRUD (8 unit tests)
│   └── infinite_loop.rs        # Orchestrator (4 unit tests)
└── tests/
    └── integration_test.rs     # Integration tests (10 tests)
```

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_iterations` | `Option<usize>` | `Some(10)` | Maximum iterations (None = infinite) |
| `convergence_threshold` | `f64` | `5.0` | Variance threshold for convergence |
| `min_iterations_before_convergence` | `usize` | `3` | Minimum iterations before checking convergence |
| `auto_refinement_enabled` | `bool` | `true` | Enable automatic goal refinement |
| `timeout_ms` | `u64` | `300000` | Timeout per iteration (5 minutes) |
| `max_retries` | `usize` | `3` | Maximum retry attempts on failure |
| `iteration_delay_ms` | `u64` | `1000` | Delay between iterations (1 second) |

## Test Coverage

- **Total Tests**: 31 (21 unit + 10 integration)
- **Coverage**: 100% of public API
- **Status**: All tests pass ✅

Run tests:
```bash
cargo test --package miyabi-feedback-loop
```

## Migration from TypeScript

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide from the TypeScript implementation.

Key differences:
- Async/await with Tokio runtime (instead of Node.js promises)
- Result-based error handling (instead of try/catch)
- Strong typing with Rust structs (instead of TypeScript interfaces)
- Performance improvements (50%+ faster execution)

## Examples

### Example 1: Basic Feedback Loop

```rust
use miyabi_feedback_loop::{InfiniteLoopOrchestrator, LoopConfig, LoopStatus};

let config = LoopConfig::default();
let mut orchestrator = InfiniteLoopOrchestrator::new(config);

match orchestrator.start_loop("goal-1").await {
    Ok(result) if result.status == LoopStatus::Completed => {
        println!("✅ Goal completed in {} iterations", result.iterations);
    }
    Ok(result) => {
        println!("⏰ Reached max iterations: {}", result.iterations);
    }
    Err(e) => {
        eprintln!("❌ Error: {}", e);
    }
}
```

### Example 2: Multiple Goals

```rust
let config = LoopConfig {
    max_iterations: Some(5),
    ..Default::default()
};

let mut orchestrator = InfiniteLoopOrchestrator::new(config);

for goal_id in &["goal-1", "goal-2", "goal-3"] {
    let result = orchestrator.start_loop(goal_id).await?;
    println!("{}: {} iterations, status: {:?}",
        goal_id, result.iterations, result.status);
}
```

## Related

- **Issue**: #486 (Implementation tracking)
- **TypeScript Implementation**: `packages/coding-agents/feedback-loop/` (legacy)
- **CLI Integration**: `crates/miyabi-cli/src/commands/loop.rs`

## License

Same as parent project (Miyabi).
