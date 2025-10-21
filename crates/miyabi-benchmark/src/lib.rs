//! Miyabi Benchmark - Evaluation framework for world-standard benchmarks
//!
//! This crate provides evaluation infrastructure for benchmarking Miyabi against
//! world-standard datasets:
//!
//! - **SWE-bench Pro** (ScaleAI) - Software engineering tasks (731 instances)
//! - **AgentBench** (THUDM) - General agent capabilities (8 environments)
//! - **HAL** (Princeton) - Cost-efficient holistic evaluation (9 benchmarks)
//! - **Galileo Agent Leaderboard v2** - Enterprise-grade evaluation (5 industries)
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_benchmark::dataset::SWEBenchDataset;
//!
//! # async fn example() -> anyhow::Result<()> {
//! // Load dataset
//! let dataset = SWEBenchDataset::load_from_json("swebench_pro_test.json")?;
//! println!("Loaded {} instances", dataset.len());
//!
//! // Filter by language
//! let python_instances = dataset.filter_by_language("python");
//! println!("Python: {} instances", python_instances.len());
//! # Ok(())
//! # }
//! ```

pub mod dataset;
pub mod evaluator;
pub mod reporter;

pub use dataset::SWEBenchDataset;
pub use evaluator::SWEBenchProEvaluator;
pub use reporter::EvaluationReporter;
