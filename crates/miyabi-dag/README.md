# miyabi-dag

**DAG-based task graph construction for Omega System θ₃ Allocation Phase**

[![Crates.io](https://img.shields.io/crates/v/miyabi-dag.svg)](https://crates.io/crates/miyabi-dag)
[![Documentation](https://docs.rs/miyabi-dag/badge.svg)](https://docs.rs/miyabi-dag)
[![License](https://img.shields.io/crates/l/miyabi-dag.svg)](../../LICENSE)

## 📋 Overview

`miyabi-dag` implements the **Allocation Phase (θ₃)** of the Omega System, which transforms generated code into a Directed Acyclic Graph (DAG) of executable tasks for parallel processing.

**Function**: `θ₃: Code → TaskGraph`

**Algorithm**:
1. Analyze dependencies between code files/modules
2. Perform topological sort to determine execution order
3. Group independent tasks for parallel execution
4. Assign resources (worktrees) to tasks

## 🚀 Features

- ✅ **Dependency Analysis**: Identifies file/module dependencies from Rust source code
- ✅ **Topological Sort**: Kahn's algorithm for optimal execution order
- ✅ **Parallelization**: Groups independent tasks for concurrent execution
- ✅ **Circular Dependency Detection**: Validates graph acyclicity
- ✅ **Resource Allocation**: Assigns worktrees to tasks
- ✅ **Performance**: Handles graphs with 200+ nodes efficiently (<3ms)

## 📖 Usage

### Basic Example

```rust
use miyabi_dag::{DAGBuilder, GeneratedCode};
use miyabi_dag::types::{CodeFile, ModulePath};
use std::path::PathBuf;

// Create code files with dependencies
let files = vec![
    CodeFile::new(
        PathBuf::from("src/a.rs"),
        "use crate::b;\n".to_string(),
        ModulePath::new("crate::a"),
        vec![ModulePath::new("crate::b")],
    ),
    CodeFile::new(
        PathBuf::from("src/b.rs"),
        "".to_string(),
        ModulePath::new("crate::b"),
        vec![],
    ),
];

// Build task graph
let code = GeneratedCode::from_files(files);
let builder = DAGBuilder::new(4); // max 4 parallel tasks
let graph = builder.build(&code)?;

println!("Graph has {} levels", graph.level_count());
println!("Max parallelism: {}", graph.max_parallel_tasks());
```

### Advanced Configuration

```rust
use miyabi_dag::builder::DAGBuilderConfig;

let builder = DAGBuilderConfig::new()
    .max_parallelism(8)
    .command_template("cargo test --package {package}")
    .build();

let graph = builder.build(&code)?;
```

## 🏗️ Architecture

### Components

- **DAGBuilder**: Main entry point for graph construction
- **DependencyAnalyzer**: Analyzes code dependencies
- **TopologicalSorter**: Performs topological sort and level grouping
- **TaskGraph**: DAG structure with levels for parallel execution
- **TaskNode**: Individual task with dependencies and command
- **TaskLevel**: Group of tasks that can execute in parallel

### Data Flow

```
GeneratedCode
    ↓
DependencyAnalyzer.analyze()
    ↓
DependencyGraph
    ↓
TopologicalSorter.group_into_levels()
    ↓
Vec<Vec<TaskId>>
    ↓
DAGBuilder.create_task_levels()
    ↓
TaskGraph
```

## 🧪 Testing

Run all tests:

```bash
cargo test --package miyabi-dag
```

Run benchmarks:

```bash
cargo bench --package miyabi-dag --bench bench_dag
```

### Test Coverage

- ✅ Empty graph handling
- ✅ Single task graph
- ✅ Linear dependencies (A → B → C)
- ✅ Parallel tasks (A, B, C with no deps)
- ✅ Diamond pattern (A → B,C → D)
- ✅ Circular dependency detection
- ✅ Large graphs (100+ nodes)
- ✅ End-to-end integration tests

## 📊 Performance

Benchmark results (M1 Mac):

| Graph Size | Build Time | Dependency Analysis | Topological Sort |
|------------|------------|---------------------|------------------|
| 50 nodes   | ~1.8ms     | -                   | -                |
| 100 nodes  | ~2.0ms     | ~168µs              | ~90µs            |
| 200 nodes  | ~2.1ms     | -                   | -                |

**Target Performance** (from Issue #721):
- Average Time: 0.1 min (6 seconds) ✅ **Achieved: <3ms**
- Success Rate: 100% ✅
- Max Graph Size: 200 tasks ✅
- Max Parallelism: 10 concurrent tasks ✅

## 🔗 Integration

### With θ₂ (Generation Phase)

`miyabi-dag` accepts `GeneratedCode` from θ₂:

```rust
// θ₂ produces GeneratedCode
let code: GeneratedCode = theta_2.execute(spec).await?;

// θ₃ transforms to TaskGraph
let graph: TaskGraph = builder.build(&code)?;
```

### With θ₄ (Execution Phase)

`miyabi-dag` produces `TaskGraph` for θ₄:

```rust
// θ₃ produces TaskGraph
let graph: TaskGraph = builder.build(&code)?;

// θ₄ executes tasks in parallel
let results = theta_4.execute(graph).await?;
```

## 📚 API Reference

See [docs.rs/miyabi-dag](https://docs.rs/miyabi-dag) for complete API documentation.

## 🔧 Development

### Build

```bash
cargo build --package miyabi-dag
```

### Lint

```bash
cargo clippy --package miyabi-dag -- -D warnings
```

### Format

```bash
cargo fmt --package miyabi-dag
```

## 📝 License

Licensed under the Apache License, Version 2.0. See [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Part of the [Miyabi](https://github.com/ShunsukeHayashi/Miyabi) autonomous AI development platform.


