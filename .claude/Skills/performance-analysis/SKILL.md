---
name: Performance Analysis and Optimization
description: Comprehensive performance profiling, benchmarking, and optimization for Rust applications including CPU profiling, memory analysis, and async performance. Use when investigating slow performance, high memory usage, or optimizing critical paths.
allowed-tools: Bash, Read, Grep, Glob
---

# Performance Analysis and Optimization

Complete performance analysis toolkit for identifying bottlenecks and optimizing Rust applications.

## When to Use

- User reports "this is slow"
- User asks "why is memory usage so high?"
- User wants to "optimize this function"
- Profiling production performance
- Before/after optimization comparison
- Finding CPU/memory hot spots
- Async runtime performance issues

## Performance Analysis Workflow

### Step 1: Establish Baseline

```bash
# Run benchmarks to establish baseline
cargo bench --bench my_benchmark

# Save results
cargo bench --bench my_benchmark > baseline.txt

# Check binary size
ls -lh target/release/my-binary

# Check memory usage
/usr/bin/time -v cargo run --release
```

### Step 2: Identify Performance Goals

| Metric | Goal | Measurement |
|--------|------|-------------|
| **Latency** | p50 < 10ms, p99 < 100ms | Benchmark, profiling |
| **Throughput** | 1000 req/sec | Load testing |
| **Memory** | < 100MB RSS | `/usr/bin/time -v` |
| **CPU** | < 50% utilization | `htop`, flamegraph |
| **Startup time** | < 1 second | `time cargo run` |

## Profiling Tools

### 1. Flamegraph (CPU Profiling)

**Installation**:
```bash
cargo install flamegraph
```

**Usage**:
```bash
# Generate flamegraph
cargo flamegraph --bin my-binary -- args

# Profile specific test
cargo flamegraph --test integration_test

# Profile with release optimizations
cargo flamegraph --release --bin my-binary

# Open flamegraph.svg in browser
open flamegraph.svg  # macOS
xdg-open flamegraph.svg  # Linux
```

**Reading Flamegraphs**:
- **X-axis**: Alphabetical ordering (not time!)
- **Y-axis**: Call stack depth
- **Width**: Time spent in function (wider = more time)
- **Colors**: Random (no meaning)

**What to look for**:
- Wide plateaus = Hot spots
- Deep stacks = Excessive recursion
- Repeated patterns = Inefficient loops

### 2. Criterion (Benchmarking)

**Setup**:
```toml
# Cargo.toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

**Benchmark Code**:
```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use my_project::*;

fn benchmark_function(c: &mut Criterion) {
    // Simple benchmark
    c.bench_function("my_function", |b| {
        b.iter(|| my_function(black_box(42)))
    });

    // Benchmark with multiple inputs
    let mut group = c.benchmark_group("parse");
    for size in [10, 100, 1000, 10000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            let data = generate_data(size);
            b.iter(|| parse(black_box(&data)));
        });
    }
    group.finish();
}

criterion_group!(benches, benchmark_function);
criterion_main!(benches);
```

**Run Benchmarks**:
```bash
# Run all benchmarks
cargo bench

# Run specific benchmark
cargo bench --bench my_benchmark

# Compare with baseline
cargo bench --bench my_benchmark --save-baseline before
# Make changes
cargo bench --bench my_benchmark --baseline before

# Generate HTML report
open target/criterion/report/index.html
```

### 3. perf (Linux Only)

**Installation**:
```bash
# Ubuntu/Debian
sudo apt install linux-tools-common linux-tools-generic

# Arch
sudo pacman -S perf
```

**Usage**:
```bash
# Record performance data
cargo build --release
perf record --call-graph=dwarf ./target/release/my-binary

# View report
perf report

# Generate flamegraph from perf data
perf script | stackcollapse-perf.pl | flamegraph.pl > perf-flamegraph.svg
```

### 4. valgrind (Memory Profiling)

**Installation**:
```bash
# Ubuntu/Debian
sudo apt install valgrind

# macOS (limited support)
brew install valgrind
```

**Usage**:
```bash
# Check for memory leaks
cargo build
valgrind --leak-check=full --show-leak-kinds=all ./target/debug/my-binary

# Memory profiling with massif
valgrind --tool=massif ./target/debug/my-binary

# Visualize massif output
ms_print massif.out.12345

# Or use massif-visualizer (GUI)
massif-visualizer massif.out.12345
```

### 5. heaptrack (Memory Profiling - Linux)

**Installation**:
```bash
# Ubuntu/Debian
sudo apt install heaptrack heaptrack-gui

# Arch
sudo pacman -S heaptrack
```

**Usage**:
```bash
# Record heap allocations
cargo build --release
heaptrack ./target/release/my-binary

# Analyze with GUI
heaptrack_gui heaptrack.my-binary.*.gz
```

### 6. cargo-bloat (Binary Size Analysis)

**Installation**:
```bash
cargo install cargo-bloat
```

**Usage**:
```bash
# Analyze binary size
cargo bloat --release

# Show crates
cargo bloat --release --crates

# Show functions sorted by size
cargo bloat --release -n 20

# Compare with debug build
cargo bloat --release && cargo bloat
```

### 7. tokio-console (Async Runtime Profiling)

**Setup**:
```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full", "tracing"] }
console-subscriber = "0.2"

# Enable tracing
```

**Code**:
```rust
#[tokio::main]
async fn main() {
    // Initialize console subscriber
    console_subscriber::init();

    // Your async code
    run_app().await;
}
```

**Usage**:
```bash
# Install tokio-console
cargo install tokio-console

# Run your app
cargo run

# In another terminal, run console
tokio-console
```

## Optimization Strategies

### 1. Algorithm Optimization

**Replace O(n²) with O(n log n)**:
```rust
// ❌ Slow: O(n²)
fn find_duplicates_slow(items: &[i32]) -> Vec<i32> {
    let mut duplicates = Vec::new();
    for i in 0..items.len() {
        for j in (i + 1)..items.len() {
            if items[i] == items[j] {
                duplicates.push(items[i]);
            }
        }
    }
    duplicates
}

// ✅ Fast: O(n)
use std::collections::HashSet;

fn find_duplicates_fast(items: &[i32]) -> Vec<i32> {
    let mut seen = HashSet::new();
    let mut duplicates = Vec::new();

    for &item in items {
        if !seen.insert(item) {
            duplicates.push(item);
        }
    }
    duplicates
}
```

### 2. Avoid Unnecessary Allocations

```rust
// ❌ Allocates new String
fn process_slow(s: &str) -> String {
    s.to_uppercase()
}

// ✅ Works with reference
fn process_fast(s: &str) -> bool {
    s.chars().all(|c| c.is_uppercase())
}

// ❌ Allocates Vec for every call
fn sum_slow(items: &[i32]) -> i32 {
    items.to_vec().iter().sum()
}

// ✅ No allocation
fn sum_fast(items: &[i32]) -> i32 {
    items.iter().sum()
}
```

### 3. Use `Cow` for Conditional Clones

```rust
use std::borrow::Cow;

fn process(input: &str) -> Cow<str> {
    if input.contains("expensive") {
        // Only clone if needed
        Cow::Owned(input.replace("expensive", "cheap"))
    } else {
        // No clone
        Cow::Borrowed(input)
    }
}
```

### 4. Preallocate Capacity

```rust
// ❌ Reallocates multiple times
fn build_vec_slow(n: usize) -> Vec<i32> {
    let mut v = Vec::new();
    for i in 0..n {
        v.push(i as i32);
    }
    v
}

// ✅ Single allocation
fn build_vec_fast(n: usize) -> Vec<i32> {
    let mut v = Vec::with_capacity(n);
    for i in 0..n {
        v.push(i as i32);
    }
    v
}

// ✅ Even better: use iterator
fn build_vec_best(n: usize) -> Vec<i32> {
    (0..n as i32).collect()
}
```

### 5. Use Inline Strategically

```rust
// Hot path functions
#[inline(always)]
fn critical_function(x: i32) -> i32 {
    x * 2 + 1
}

// Small functions called frequently
#[inline]
fn small_function(x: i32) -> i32 {
    x + 1
}

// Don't inline large functions
// #[inline] // ❌ Don't do this
fn large_function() {
    // ... many lines of code
}
```

### 6. Optimize String Operations

```rust
// ❌ Slow: Many allocations
fn build_string_slow(parts: &[&str]) -> String {
    let mut s = String::new();
    for part in parts {
        s.push_str(part);
        s.push_str(", ");
    }
    s
}

// ✅ Fast: Preallocate
fn build_string_fast(parts: &[&str]) -> String {
    let capacity = parts.iter().map(|s| s.len() + 2).sum();
    let mut s = String::with_capacity(capacity);
    for part in parts {
        s.push_str(part);
        s.push_str(", ");
    }
    s
}

// ✅ Even better: Use join
fn build_string_best(parts: &[&str]) -> String {
    parts.join(", ")
}
```

### 7. Use Parallel Iterators (rayon)

```rust
use rayon::prelude::*;

// ❌ Sequential
fn process_sequential(items: &[i32]) -> Vec<i32> {
    items.iter().map(|&x| expensive_computation(x)).collect()
}

// ✅ Parallel
fn process_parallel(items: &[i32]) -> Vec<i32> {
    items.par_iter().map(|&x| expensive_computation(x)).collect()
}
```

### 8. Avoid Cloning When Possible

```rust
// ❌ Unnecessary clone
fn process_clone(items: Vec<String>) -> Vec<String> {
    items.clone().into_iter().filter(|s| s.len() > 5).collect()
}

// ✅ Use reference
fn process_ref(items: &[String]) -> Vec<String> {
    items.iter().filter(|s| s.len() > 5).cloned().collect()
}

// ✅ Consume original
fn process_consume(items: Vec<String>) -> Vec<String> {
    items.into_iter().filter(|s| s.len() > 5).collect()
}
```

## Async Performance Optimization

### 1. Use tokio::spawn for CPU-bound Work

```rust
// ❌ Blocks async executor
async fn cpu_bound_bad() -> Result<Vec<u8>> {
    // CPU-intensive work blocks other tasks
    expensive_computation()
}

// ✅ Offload to thread pool
async fn cpu_bound_good() -> Result<Vec<u8>> {
    tokio::task::spawn_blocking(|| {
        expensive_computation()
    }).await?
}
```

### 2. Batch Async Operations

```rust
// ❌ Sequential async calls
async fn fetch_all_slow(ids: &[u64]) -> Vec<Result<Data>> {
    let mut results = Vec::new();
    for &id in ids {
        results.push(fetch_data(id).await);
    }
    results
}

// ✅ Concurrent async calls
async fn fetch_all_fast(ids: &[u64]) -> Vec<Result<Data>> {
    let futures: Vec<_> = ids.iter().map(|&id| fetch_data(id)).collect();
    futures::future::join_all(futures).await
}
```

### 3. Use BufferedStream for Rate Limiting

```rust
use futures::stream::{self, StreamExt};

async fn process_with_limit(items: Vec<Item>) {
    stream::iter(items)
        .map(|item| async move {
            process(item).await
        })
        .buffer_unordered(10)  // Process 10 concurrently
        .for_each(|result| async {
            handle_result(result);
        })
        .await;
}
```

## Performance Testing

### Load Testing

```rust
// Load test example
#[cfg(test)]
mod load_tests {
    use super::*;
    use std::time::{Duration, Instant};

    #[tokio::test]
    async fn load_test_endpoint() {
        let start = Instant::now();
        let tasks: Vec<_> = (0..1000)
            .map(|i| {
                tokio::spawn(async move {
                    let response = make_request(i).await;
                    assert!(response.is_ok());
                })
            })
            .collect();

        futures::future::join_all(tasks).await;

        let duration = start.elapsed();
        let rps = 1000.0 / duration.as_secs_f64();

        println!("Duration: {:?}", duration);
        println!("Requests/sec: {:.2}", rps);

        assert!(rps > 100.0, "Performance below threshold");
    }
}
```

## Optimization Checklist

Before optimizing, verify:

- [ ] **Profiled**: Used flamegraph/perf to identify hot spots
- [ ] **Benchmarked**: Established baseline with criterion
- [ ] **Measured**: Quantified the performance problem
- [ ] **Targeted**: Focusing on actual bottleneck (not premature optimization)
- [ ] **Tested**: Tests pass after optimization
- [ ] **Verified**: Re-benchmarked to confirm improvement

## Common Performance Pitfalls

| Pitfall | Impact | Solution |
|---------|--------|----------|
| Debug builds in production | 10-100x slower | Use `--release` |
| Unnecessary clones | High memory, slow | Use references or `Cow` |
| O(n²) algorithms | Exponential slowdown | Use HashMap/HashSet |
| Blocking in async | Stalls executor | Use `spawn_blocking` |
| No capacity preallocaton | Multiple reallocations | Use `with_capacity()` |
| String concatenation in loops | O(n²) allocations | Use `format!()` or join |
| Regex compilation in hot path | Unnecessary overhead | Compile once, use `lazy_static` |

## Compiler Optimizations

### Profile-Guided Optimization (PGO)

```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1

# For PGO
[profile.pgo]
inherits = "release"
```

```bash
# Step 1: Build instrumented binary
RUSTFLAGS="-Cprofile-generate=/tmp/pgo-data" cargo build --release

# Step 2: Run with representative workload
./target/release/my-binary --benchmark

# Step 3: Build optimized binary
llvm-profdata merge -o /tmp/pgo-data/merged.profdata /tmp/pgo-data
RUSTFLAGS="-Cprofile-use=/tmp/pgo-data/merged.profdata" cargo build --release
```

### Link-Time Optimization (LTO)

```toml
[profile.release]
lto = "fat"  # Full LTO
# lto = "thin"  # Faster, less optimization
codegen-units = 1  # Better optimization, slower compile
```

## Performance Best Practices

1. **Measure before optimizing**: "Premature optimization is the root of all evil"
2. **Profile to find hot spots**: Don't guess where the slowdown is
3. **Optimize algorithms first**: O(n²) → O(n log n) beats micro-optimizations
4. **Avoid allocations in hot paths**: Reuse buffers, use `&str` instead of `String`
5. **Use appropriate data structures**: HashMap for lookups, Vec for sequential access
6. **Leverage parallelism**: Use rayon for CPU-bound work
7. **Cache expensive computations**: Memoization for repeated calculations
8. **Batch operations**: Reduce syscalls and network requests

## Related Files

- **Benchmarks**: `benches/*.rs`
- **Cargo Profile**: `Cargo.toml` [profile.release]
- **Performance Tests**: `tests/performance_tests.rs`

## Related Skills

- **Debugging & Troubleshooting**: For performance bug diagnosis
- **Rust Development**: For running benchmarks
