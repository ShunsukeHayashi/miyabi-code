//! CLI binary for Miyabi Benchmark
//!
//! This binary provides a command-line interface for running benchmarks.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use miyabi_benchmark::{SWEBenchDataset, SWEBenchProEvaluator};
use std::path::PathBuf;
use tracing::{info, Level};

#[derive(Parser)]
#[command(name = "miyabi-benchmark")]
#[command(about = "Miyabi Benchmark - Evaluation framework", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose logging
    #[arg(short, long, global = true)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Evaluate SWE-bench Pro instances
    Evaluate {
        /// Path to dataset JSON file
        #[arg(short, long)]
        dataset: PathBuf,

        /// Path to output predictions.jsonl file
        #[arg(short, long)]
        output: PathBuf,

        /// Limit number of instances to evaluate
        #[arg(short, long)]
        limit: Option<usize>,

        /// Number of concurrent evaluations
        #[arg(short, long, default_value = "5")]
        concurrency: usize,

        /// Timeout per instance (seconds)
        #[arg(short, long, default_value = "1800")]
        timeout: u64,

        /// Worktree base directory
        #[arg(short, long, default_value = ".worktrees")]
        worktree_base: String,

        /// Model name/version
        #[arg(short, long, default_value = "miyabi-v1.0.0")]
        model_name: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize tracing
    let level = if cli.verbose {
        Level::DEBUG
    } else {
        Level::INFO
    };
    tracing_subscriber::fmt().with_max_level(level).init();

    match cli.command {
        Commands::Evaluate {
            dataset,
            output,
            limit,
            concurrency,
            timeout,
            worktree_base,
            model_name,
        } => {
            info!("Starting SWE-bench Pro evaluation");
            info!("Dataset: {:?}", dataset);
            info!("Output: {:?}", output);
            info!("Limit: {:?}", limit);
            info!("Concurrency: {}", concurrency);

            // Load dataset
            let dataset = SWEBenchDataset::load_from_json(&dataset)
                .context("Failed to load dataset")?;

            info!("Loaded {} instances from dataset", dataset.len());

            // Get instances slice and apply limit if specified
            let instances_slice = dataset.instances();
            let instances_to_evaluate = if let Some(limit) = limit {
                let limited = &instances_slice[..limit.min(instances_slice.len())];
                info!("Limited to {} instances", limited.len());
                limited
            } else {
                instances_slice
            };

            // Create evaluator config
            let config = miyabi_benchmark::evaluator::EvaluatorConfig {
                timeout,
                concurrency,
                worktree_base,
                model_name,
            };

            // Create evaluator
            let evaluator = SWEBenchProEvaluator::with_config(config)
                .context("Failed to create evaluator")?;

            // Run evaluation
            info!("Running evaluation with {} workers", concurrency);
            let results = evaluator
                .evaluate_instances(instances_to_evaluate)
                .await
                .context("Evaluation failed")?;

            info!("Evaluation complete, {} results", results.len());

            // Write predictions to JSONL
            use std::fs::File;
            use std::io::{BufWriter, Write};

            let file = File::create(&output).context("Failed to create output file")?;
            let mut writer = BufWriter::new(file);

            for result in results {
                let json = serde_json::to_string(&result).context("Failed to serialize result")?;
                writeln!(writer, "{}", json).context("Failed to write to output")?;
            }

            writer.flush().context("Failed to flush output")?;

            info!("Predictions written to {:?}", output);
            info!("Evaluation complete!");

            Ok(())
        }
    }
}
