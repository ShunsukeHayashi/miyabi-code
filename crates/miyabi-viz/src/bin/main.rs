//! Miyabi Visualization CLI

use anyhow::Result;
use clap::{Parser, Subcommand};
use miyabi_viz::{exporter::JsonExporter, MiyabiAnalyzer};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "miyabi-viz")]
#[command(about = "Miyabi Molecular Visualization System", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate visualization data
    Generate {
        /// Output file path
        #[arg(short, long, default_value = "structure.json")]
        output: PathBuf,

        /// Workspace root directory
        #[arg(short, long, default_value = ".")]
        workspace: PathBuf,

        /// Quick mode (skip Git history analysis)
        #[arg(short, long)]
        quick: bool,

        /// Detect and report circular dependencies
        #[arg(long)]
        check_cycles: bool,

        /// Find "God Crates" with too many dependencies
        #[arg(long, default_value = "15")]
        god_crate_threshold: usize,
    },

    /// Analyze codebase and print statistics
    Analyze {
        /// Workspace root directory
        #[arg(short, long, default_value = ".")]
        workspace: PathBuf,

        /// Quick mode (skip Git history analysis)
        #[arg(short, long)]
        quick: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Generate {
            output,
            workspace,
            quick,
            check_cycles,
            god_crate_threshold,
        } => {
            println!("🧬 Analyzing Miyabi workspace...");
            println!("   Root: {}", workspace.display());

            let analyzer = MiyabiAnalyzer::new(&workspace)?;

            let graph = if quick {
                println!("   Mode: Quick (skipping Git history)");
                analyzer.analyze_quick()?
            } else {
                println!("   Mode: Full (including Git history)");
                analyzer.analyze()?
            };

            println!("✅ Analysis complete!");
            println!("   Crates: {}", graph.nodes.len());
            println!("   Dependencies: {}", graph.links.len());

            // Check for issues
            if check_cycles {
                let cycles = graph.detect_cycles();
                if !cycles.is_empty() {
                    println!("\n⚠️  Circular dependencies detected:");
                    for (i, cycle) in cycles.iter().enumerate() {
                        println!("   Cycle {}: {}", i + 1, cycle.join(" → "));
                    }
                }
            }

            let god_crates = graph.find_god_crates(god_crate_threshold);
            if !god_crates.is_empty() {
                println!("\n⚠️  God Crates detected (>{} deps):", god_crate_threshold);
                for crate_node in god_crates {
                    println!(
                        "   {} ({} dependencies)",
                        crate_node.id, crate_node.dependencies_count
                    );
                }
            }

            let unstable_hubs = graph.find_unstable_hubs(70.0, 5);
            if !unstable_hubs.is_empty() {
                println!("\n⚠️  Unstable Hubs detected (high B-factor + many dependents):");
                for crate_node in unstable_hubs {
                    println!(
                        "   {} (B-factor: {:.1}, {} dependents)",
                        crate_node.id, crate_node.bfactor, crate_node.dependents_count
                    );
                }
            }

            // Export to JSON
            println!("\n💾 Exporting to {}...", output.display());
            JsonExporter::export_to_file(&graph, &output)?;

            println!("✅ Export complete!");
            println!("\n📊 Open in browser:");
            println!("   1. Start server: miyabi viz serve");
            println!("   2. Or upload to: https://vasturiano.github.io/3d-force-graph/");
        }

        Commands::Analyze { workspace, quick } => {
            println!("🔍 Analyzing Miyabi workspace...");

            let analyzer = MiyabiAnalyzer::new(&workspace)?;

            let graph = if quick {
                analyzer.analyze_quick()?
            } else {
                analyzer.analyze()?
            };

            // Print statistics
            println!("\n📊 Statistics:");
            println!("   Total crates: {}", graph.nodes.len());
            println!("   Total dependencies: {}", graph.links.len());

            // Category breakdown
            println!("\n📦 By category:");
            let mut categories = std::collections::HashMap::new();
            for node in &graph.nodes {
                *categories.entry(format!("{:?}", node.category)).or_insert(0) += 1;
            }
            for (category, count) in categories {
                println!("   {}: {}", category, count);
            }

            // Top 5 largest crates
            println!("\n📈 Top 5 largest crates (by LOC):");
            let mut sorted_nodes = graph.nodes.clone();
            sorted_nodes.sort_by(|a, b| b.loc.cmp(&a.loc));
            for node in sorted_nodes.iter().take(5) {
                println!("   {} ({} LOC)", node.id, node.loc);
            }

            // Top 5 most volatile crates
            if !quick {
                println!("\n🔥 Top 5 most volatile crates (by B-factor):");
                sorted_nodes.sort_by(|a, b| b.bfactor.partial_cmp(&a.bfactor).unwrap());
                for node in sorted_nodes.iter().take(5) {
                    println!("   {} (B-factor: {:.1})", node.id, node.bfactor);
                }
            }

            // Most depended-upon crates
            println!("\n🌟 Top 5 most depended-upon crates:");
            sorted_nodes.sort_by(|a, b| b.dependents_count.cmp(&a.dependents_count));
            for node in sorted_nodes.iter().take(5) {
                println!("   {} ({} dependents)", node.id, node.dependents_count);
            }
        }
    }

    Ok(())
}
