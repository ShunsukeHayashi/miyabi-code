# miyabi-benchmark

**World-standard benchmark evaluation framework for the Miyabi AI development platform.**

[![Crates.io](https://img.shields.io/crates/v/miyabi-benchmark.svg)](https://crates.io/crates/miyabi-benchmark)
[![Documentation](https://docs.rs/miyabi-benchmark/badge.svg)](https://docs.rs/miyabi-benchmark)
[![License](https://img.shields.io/crates/l/miyabi-benchmark.svg)](../../LICENSE)

## 📋 Overview

`miyabi-benchmark` provides a comprehensive evaluation framework for benchmarking Miyabi's autonomous development capabilities against world-standard datasets. It supports parallel evaluation, detailed reporting, and integration with the Miyabi worktree system for isolated execution.

**Supported Benchmarks**:
- 🏆 **SWE-bench Pro** (ScaleAI) - 731 software engineering task instances
- 🤖 **AgentBench** (THUDM) - 8 agent capability environments
- 📊 **HAL** (Princeton) - Cost-efficient holistic evaluation across 9 benchmarks
- 🌟 **Galileo Agent Leaderboard v2** - Enterprise-grade evaluation for 5 industries

**Key Capabilities**:
- 📦 **Dataset Management**: Load, filter, and manage benchmark datasets
- ⚙️ **Parallel Evaluation**: Concurrent instance processing with configurable concurrency
- 🔐 **Isolated Execution**: Git worktree-based sandboxing for each evaluation
- ⏱️ **Timeout Management**: Configurable timeout per instance (default: 30 min)
- 📈 **Statistical Reporting**: Success rate, duration, and performance metrics
- 🎯 **Patch Generation**: Unified diff format for submission to official leaderboards

## 🚀 Features

### SWE-bench Pro Support
- **Dataset Loading**: Load from JSON (HuggingFace format)
- **Language Filtering**: Filter by Python, JavaScript, TypeScript, Go, Rust, etc.
- **Repository Filtering**: Focus on specific repos (e.g., `django/django`)
- **Patch Generation**: Generate unified diffs for official evaluation
- **Test Validation**: Run test suites to verify fixes

### Evaluation Pipeline
1. **Setup**: Create isolated worktree for each instance
2. **Execution**: Run CoordinatorAgent to generate fix
3. **Patch**: Generate unified diff patch
4. **Validation**: Run tests to verify correctness
5. **Reporting**: Collect metrics and generate report

### Performance Tracking
- **Success Rate**: Percentage of correctly fixed instances
- **Timing**: Min, max, average, and total duration
- **Failure Analysis**: Error categorization and debugging info
- **Comparison**: Benchmark against state-of-the-art agents

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-benchmark = "0.1.0"
```

Or install the CLI tool:

```bash
cargo install miyabi-benchmark --features cli
```

## 🔧 Usage

### As a Library

```rust
use miyabi_benchmark::{
    dataset::SWEBenchDataset,
    evaluator::SWEBenchProEvaluator,
    reporter::EvaluationReporter,
};
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // 1. Load dataset
    let dataset = SWEBenchDataset::load_from_json("swebench_pro_test.json")?;
    println!("Loaded {} instances", dataset.len());

    // 2. Filter by language (optional)
    let python_instances = dataset.filter_by_language("python");
    println!("Python instances: {}", python_instances.len());

    // 3. Create evaluator
    let evaluator = SWEBenchProEvaluator::new()?;

    // 4. Run evaluation (parallel)
    let results = evaluator.evaluate_all(&python_instances).await?;

    // 5. Generate report
    let reporter = EvaluationReporter::new();
    let report = reporter.generate_report(&results);

    println!("Success rate: {:.2}%", report.success_rate * 100.0);
    println!("Total duration: {:.2}s", report.total_duration_secs);

    // 6. Save results
    reporter.save_to_json(&results, "evaluation_results.json")?;

    Ok(())
}
```

### As a CLI Tool

```bash
# Download SWE-bench Pro dataset
miyabi-benchmark download-dataset --benchmark swe-bench-pro

# Run evaluation on all instances
miyabi-benchmark evaluate --dataset swebench_pro_test.json --output results.json

# Run with custom config
miyabi-benchmark evaluate \
  --dataset swebench_pro_test.json \
  --output results.json \
  --concurrency 10 \
  --timeout 3600 \
  --model miyabi-v1.0.0

# Filter by language
miyabi-benchmark evaluate \
  --dataset swebench_pro_test.json \
  --language python \
  --output python_results.json

# Filter by repository
miyabi-benchmark evaluate \
  --dataset swebench_pro_test.json \
  --repo django/django \
  --output django_results.json

# Generate report from existing results
miyabi-benchmark report \
  --input results.json \
  --output report.html \
  --format html
```

## 📊 Benchmark Details

### SWE-bench Pro (ScaleAI)

**Dataset**: 731 software engineering task instances from popular open-source projects

**Format**:
```json
{
  "instance_id": "django__django-12345",
  "repo": "django/django",
  "version": "3.2",
  "problem_statement": "Fix bug in QuerySet.filter()...",
  "hints_text": "Check the SQL generation logic...",
  "test_patch": "diff --git a/tests/...",
  "patch": "diff --git a/django/db/..."
}
```

**Evaluation Metrics**:
- **Accuracy**: Percentage of correctly fixed instances
- **Pass@1**: Success rate on first attempt
- **Avg. Duration**: Average time per instance
- **Token Efficiency**: Tokens used per successful fix

### AgentBench (THUDM)

**Dataset**: 8 environments covering diverse agent capabilities

**Environments**:
1. **OS Interaction**: Shell commands, file operations
2. **Database Queries**: SQL generation and execution
3. **Knowledge Graph**: Entity/relation reasoning
4. **Digital Card Game**: Multi-step planning
5. **Lateral Thinking**: Creative problem-solving
6. **House-Holding**: Common-sense reasoning
7. **Web Shopping**: Web interaction and decision-making
8. **Web Browsing**: Information retrieval

### HAL (Princeton)

**Dataset**: Cost-efficient holistic evaluation across 9 benchmarks

**Benchmarks**:
- MMLU, GSM8K, HumanEval, MATH, DROP, HellaSwag, ARC, TruthfulQA, BigBench-Hard

**Focus**: Optimize for cost-per-token while maintaining accuracy

### Galileo Agent Leaderboard v2

**Dataset**: Enterprise-grade evaluation for 5 industries

**Industries**:
- Finance, Healthcare, Legal, E-commerce, Manufacturing

**Metrics**: Accuracy, Latency, Cost, Safety, Compliance

## 🏗️ Architecture

```
┌──────────────────────────┐
│  SWEBenchDataset         │ → Load & Filter
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  SWEBenchProEvaluator    │ → Parallel Eval
│  - Concurrency: 5        │
│  - Timeout: 30 min       │
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  WorktreeManager         │ → Isolated Execution
│  - Per-instance sandbox  │
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  CoordinatorAgent        │ → Generate Fix
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  Patch Generation        │ → Unified Diff
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  Test Validation         │ → Run Tests
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│  EvaluationReporter      │ → Generate Report
└──────────────────────────┘
```

## 📈 Example Results

```json
{
  "model": "miyabi-v1.0.0",
  "benchmark": "swe-bench-pro",
  "total_instances": 731,
  "successful": 584,
  "failed": 147,
  "success_rate": 0.799,
  "avg_duration_secs": 245.3,
  "total_duration_secs": 179353.0,
  "metrics": {
    "pass@1": 0.799,
    "avg_tokens_per_fix": 12500,
    "cost_per_fix_usd": 0.05
  }
}
```

## 🧪 Testing

```bash
# Run all tests
cargo test --package miyabi-benchmark

# Run evaluator tests
cargo test --package miyabi-benchmark evaluator

# Run dataset tests
cargo test --package miyabi-benchmark dataset

# Integration tests (requires dataset)
cargo test --package miyabi-benchmark --test integration -- --ignored
```

## 🔗 Dependencies

- **Core**: `miyabi-types`, `miyabi-core`, `miyabi-agents`, `miyabi-worktree`
- **Runtime**: `tokio`, `async-trait`
- **Serialization**: `serde`, `serde_json`
- **HTTP**: `reqwest` (for HuggingFace API)
- **CLI**: `clap`, `indicatif` (optional, feature-gated)
- **Utilities**: `anyhow`, `thiserror`, `chrono`, `tracing`

## 📚 Related Crates

- [`miyabi-agents`](../miyabi-agents) - Agent implementations for evaluation
- [`miyabi-worktree`](../miyabi-worktree) - Isolated execution environment
- [`miyabi-types`](../miyabi-types) - Shared type definitions
- [`miyabi-core`](../miyabi-core) - Core utilities

## 🎯 Official Leaderboards

Submit your results to official leaderboards:

- **SWE-bench Pro**: https://www.swebench.com/leaderboard
- **AgentBench**: https://llmbench.ai/agentbench
- **HAL**: https://hal-leaderboard.com/
- **Galileo**: https://www.galileo-leaderboard.com/

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

## 🔖 Version History

- **v0.1.0** (2025-10-25): Initial release
  - SWE-bench Pro dataset loading and evaluation
  - Parallel evaluation with configurable concurrency
  - Worktree-based isolated execution
  - Detailed reporting and statistics
  - AgentBench, HAL, Galileo support (planned)

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
