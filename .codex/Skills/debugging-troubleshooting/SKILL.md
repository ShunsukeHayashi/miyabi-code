---
name: Debugging and Troubleshooting
description: Systematic debugging workflow for Rust compilation errors, test failures, runtime panics, and performance issues. Use when diagnosing errors, investigating failures, or troubleshooting unexpected behavior.
allowed-tools: Bash, Read, Grep, Glob
---

# Debugging and Troubleshooting

Comprehensive debugging workflow for Rust projects with systematic error diagnosis and resolution strategies.

## When to Use

- User reports "this code isn't working"
- User asks "why is this test failing?"
- User wants to "debug this error"
- Compilation errors occur
- Tests fail unexpectedly
- Runtime panics or crashes
- Performance degradation

## Debugging Workflow

### Step 1: Identify Error Type

Classify the error into one of these categories:

| Type | Examples | Initial Action |
|------|----------|---------------|
| **Compilation Error** | Type mismatch, missing trait | Run `cargo check --message-format=json` |
| **Test Failure** | Assertion failed, panic | Run `cargo test -- --nocapture` |
| **Runtime Panic** | unwrap() on None, index out of bounds | Check backtrace with `RUST_BACKTRACE=1` |
| **Logic Error** | Wrong output, unexpected behavior | Add debug prints, use debugger |
| **Performance Issue** | Slow execution, high memory | Profile with `cargo flamegraph` |
| **Integration Error** | API failures, DB connection | Check logs, network traces |

### Step 2: Gather Context

```bash
# Check system information
rustc --version
cargo --version

# Check project structure
ls -la

# View recent changes
git diff HEAD~1

# Check environment variables
env | grep -i rust
env | grep -i cargo
```

## Error Type 1: Compilation Errors

### Strategy: Systematic Type Checking

#### Step 1: Run Cargo Check

```bash
# Standard check
cargo check

# Check with all features
cargo check --all-features

# Check all workspace members
cargo check --workspace

# Get JSON output for parsing
cargo check --message-format=json 2>&1 | tee check_output.json
```

#### Step 2: Analyze Error Messages

**Common Compilation Errors**:

| Error | Cause | Solution |
|-------|-------|----------|
| `cannot find type X` | Missing import or typo | Add `use` statement or fix name |
| `trait bound not satisfied` | Missing trait implementation | Implement trait or add derive |
| `lifetime mismatch` | Conflicting lifetimes | Adjust lifetime annotations |
| `mutable borrow` | Multiple mut borrows | Refactor to use single mut borrow |
| `move occurs` | Value moved out | Use reference or `.clone()` |
| `type mismatch` | Wrong type provided | Cast or convert to expected type |

#### Step 3: Fix Errors Incrementally

```bash
# Fix errors one at a time
# After each fix, re-run:
cargo check

# Use clippy for suggestions
cargo clippy --fix --allow-dirty

# Apply automatic fixes
cargo fix --allow-dirty
```

#### Example: Trait Bound Error

**Error**:
```
error[E0277]: the trait bound `MyStruct: Clone` is not satisfied
  --> src/main.rs:10:5
   |
10 |     let copied = my_struct.clone();
   |                           ^^^^^ the trait `Clone` is not implemented for `MyStruct`
```

**Solution**:
```rust
// Add #[derive(Clone)] to struct
#[derive(Clone)]
struct MyStruct {
    field: String,
}
```

## Error Type 2: Test Failures

### Strategy: Isolate and Reproduce

#### Step 1: Run Failing Test

```bash
# Run specific test
cargo test test_name

# Show output (including println!)
cargo test test_name -- --nocapture

# Show test stdout even on success
cargo test test_name -- --show-output

# Run tests serially (avoid race conditions)
cargo test -- --test-threads=1
```

#### Step 2: Add Debug Output

```rust
#[test]
fn test_example() {
    let result = my_function(input);

    // Add debug output
    eprintln!("Input: {:?}", input);
    eprintln!("Result: {:?}", result);
    eprintln!("Expected: {:?}", expected);

    assert_eq!(result, expected);
}
```

#### Step 3: Use Test Debugging Tools

**Pretty Assertions**:
```rust
// Add to dev-dependencies
pretty_assertions = "1.4"

// Use in tests
use pretty_assertions::assert_eq;

#[test]
fn test_with_diff() {
    let expected = vec![1, 2, 3, 4, 5];
    let actual = vec![1, 2, 3, 4, 6];  // Diff will be shown
    assert_eq!(actual, expected);
}
```

**Snapshot Testing**:
```rust
// Add insta for snapshot tests
insta = "1.34"

use insta::assert_debug_snapshot;

#[test]
fn test_complex_output() {
    let result = complex_function();
    assert_debug_snapshot!(result);
}
```

#### Common Test Failure Patterns

| Failure Pattern | Likely Cause | Solution |
|----------------|--------------|----------|
| Assertion failed | Wrong expected value | Review logic, update expected |
| Panic in test | unwrap()/expect() failed | Add error handling |
| Timeout | Infinite loop or deadlock | Add timeout, check async logic |
| Flaky test | Race condition | Use test serialization or mocks |
| Setup failure | Test precondition not met | Check test setup code |

## Error Type 3: Runtime Panics

### Strategy: Backtrace Analysis

#### Step 1: Get Full Backtrace

```bash
# Enable full backtrace
RUST_BACKTRACE=full cargo run

# Or backtrace=1 for shorter version
RUST_BACKTRACE=1 cargo run

# Run with debug symbols (if release build)
cargo run --release --features=debug-symbols
```

#### Step 2: Analyze Panic Location

**Backtrace Example**:
```
thread 'main' panicked at 'called `Option::unwrap()` on a `None` value', src/main.rs:42:18
stack backtrace:
   0: rust_begin_unwind
   1: core::panicking::panic_fmt
   2: core::panicking::panic
   3: my_project::my_function
             at ./src/main.rs:42
   4: my_project::main
             at ./src/main.rs:10
```

**Identify**:
- Line number: `src/main.rs:42`
- Cause: `Option::unwrap()` on `None`
- Call chain: `main` → `my_function` → `unwrap()`

#### Step 3: Fix Common Panic Sources

**Replace unwrap() with proper error handling**:

```rust
// ❌ Bad: Can panic
let value = option.unwrap();

// ✅ Good: Handle None case
let value = option.expect("Expected value but got None");

// ✅ Better: Use pattern matching
let value = match option {
    Some(v) => v,
    None => {
        eprintln!("Warning: Using default value");
        default_value()
    }
};

// ✅ Best: Propagate error
let value = option.ok_or(MyError::MissingValue)?;
```

**Common Panic Sources**:

| Panic | Cause | Fix |
|-------|-------|-----|
| `unwrap()` on `None` | Option is None | Use `?`, `unwrap_or()`, or match |
| `expect()` failed | Option is None | Same as above |
| `index out of bounds` | Vec/array access beyond length | Use `get()` or check bounds |
| `divide by zero` | Division by zero | Check denominator |
| `send on closed channel` | Channel receiver dropped | Check channel status |

## Error Type 4: Logic Errors

### Strategy: Systematic Investigation

#### Step 1: Add Logging

```rust
use tracing::{info, debug, warn, error};

fn my_function(input: &str) -> Result<String> {
    debug!("Function called with input: {}", input);

    let processed = process(input);
    debug!("Processed result: {:?}", processed);

    if processed.is_empty() {
        warn!("Processed result is empty");
    }

    Ok(processed)
}
```

#### Step 2: Use Debugger

**Using rust-lldb**:
```bash
# Build with debug symbols
cargo build

# Run with debugger
rust-lldb target/debug/my-binary

# Set breakpoint
(lldb) breakpoint set --file main.rs --line 42

# Run
(lldb) run

# When stopped, inspect variables
(lldb) frame variable
(lldb) print my_variable
(lldb) continue
```

**Using VS Code**:

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug",
            "cargo": {
                "args": ["build", "--bin=my-binary"]
            },
            "args": [],
            "cwd": "${workspaceFolder}"
        }
    ]
}
```

#### Step 3: Isolate Problem

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minimal_reproduction() {
        // Minimal test case that reproduces the bug
        let input = "problematic input";
        let result = my_function(input);

        // This should pass but doesn't
        assert!(result.is_ok());
    }
}
```

## Error Type 5: Performance Issues

### Strategy: Profile and Optimize

#### Step 1: Benchmark

```bash
# Install criterion for benchmarking
cargo install cargo-criterion

# Add to Cargo.toml
# [dev-dependencies]
# criterion = "0.5"

# Create benchmark
mkdir -p benches
cat > benches/my_benchmark.rs <<'EOF'
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_project::my_function;

fn benchmark_function(c: &mut Criterion) {
    c.bench_function("my_function", |b| {
        b.iter(|| my_function(black_box("input")))
    });
}

criterion_group!(benches, benchmark_function);
criterion_main!(benches);
EOF

# Run benchmark
cargo bench
```

#### Step 2: Profile

```bash
# Install flamegraph
cargo install flamegraph

# Generate flamegraph
cargo flamegraph --bin my-binary

# Open flamegraph.svg in browser
```

#### Step 3: Identify Bottlenecks

**Common Performance Issues**:

| Issue | Symptom | Solution |
|-------|---------|----------|
| Unnecessary clones | High memory usage | Use references instead of `clone()` |
| N+1 queries | Many small DB queries | Batch queries or use joins |
| Blocking in async | Async functions block | Use `tokio::spawn_blocking()` |
| Inefficient algorithms | O(n²) complexity | Use better data structures (HashMap, BTreeSet) |
| No caching | Repeated computation | Add memoization or caching |

## Error Type 6: Integration Errors

### Strategy: External System Debugging

#### Step 1: Check Dependencies

```bash
# Check if services are running
# Example: Database
nc -zv localhost 5432

# Example: Redis
redis-cli ping

# Check network connectivity
curl -v http://api.example.com/health
```

#### Step 2: Enable Request Logging

```rust
use reqwest::Client;
use tracing::info;

let client = Client::builder()
    .timeout(Duration::from_secs(30))
    .build()?;

let response = client.get("https://api.example.com/data")
    .header("Authorization", format!("Bearer {}", token))
    .send()
    .await?;

info!("Response status: {}", response.status());
info!("Response headers: {:?}", response.headers());

let body = response.text().await?;
info!("Response body: {}", body);
```

#### Step 3: Mock External Services

```rust
#[cfg(test)]
mod tests {
    use mockito::Server;

    #[tokio::test]
    async fn test_with_mock() {
        let mut server = Server::new();
        let mock = server.mock("GET", "/data")
            .with_status(200)
            .with_body(r#"{"result": "ok"}"#)
            .create();

        let result = fetch_data(&server.url()).await;
        assert!(result.is_ok());

        mock.assert();
    }
}
```

## Troubleshooting Checklist

When debugging, systematically check:

- [ ] **Error message**: Read the full error message carefully
- [ ] **Recent changes**: `git diff` - what changed?
- [ ] **Dependencies**: `cargo update` - outdated crates?
- [ ] **Environment**: Correct Rust version, environment variables?
- [ ] **Tests**: Do existing tests pass?
- [ ] **Minimal reproduction**: Can you create a minimal test case?
- [ ] **Documentation**: Check docs for API usage
- [ ] **Issues**: Search GitHub issues for similar problems
- [ ] **Clean build**: `cargo clean && cargo build`
- [ ] **Compiler version**: Try stable/nightly Rust

## Advanced Debugging Tools

### cargo-expand

View macro expansions:
```bash
cargo install cargo-expand
cargo expand my_module::my_function
```

### cargo-asm

View generated assembly:
```bash
cargo install cargo-asm
cargo asm my_project::my_function
```

### valgrind

Check for memory leaks:
```bash
cargo build
valgrind --leak-check=full ./target/debug/my-binary
```

### strace

System call tracing:
```bash
strace -o trace.log ./target/debug/my-binary
```

## Common Rust Gotchas

| Gotcha | Problem | Solution |
|--------|---------|----------|
| Borrow checker errors | Complex borrow patterns | Simplify logic, use interior mutability (`RefCell`, `Mutex`) |
| Lifetime errors | Complex lifetime relationships | Use `'static`, simplify data structures |
| Async runtime not started | Using async without runtime | Add `#[tokio::main]` or start runtime manually |
| Blocking in async | Blocking I/O in async context | Use `spawn_blocking()` |
| Integer overflow (debug) | Arithmetic overflow | Use checked/saturating arithmetic |

## Related Files

- **Test Files**: `crates/*/tests/*.rs`
- **Benchmark Files**: `benches/*.rs`
- **Cargo Configuration**: `.cargo/config.toml`
- **Logging Configuration**: `RUST_LOG` environment variable

## Related Skills

- **Rust Development**: For running tests and builds
- **Performance Analysis**: For profiling (see Phase 8)
- **Security Audit**: For security-related errors (see Phase 9)
