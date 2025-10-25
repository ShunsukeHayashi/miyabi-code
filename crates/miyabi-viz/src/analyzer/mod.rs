//! Code analysis modules

mod cargo_parser;
mod git_analyzer;
mod graph_builder;
mod module_analyzer;

pub use cargo_parser::CargoParser;
pub use git_analyzer::GitAnalyzer;
pub use graph_builder::GraphBuilder;
pub use module_analyzer::ModuleAnalyzer;

use crate::{models::MiyabiGraph, Result};
use std::path::Path;

/// Main analyzer that coordinates all analysis tasks
pub struct MiyabiAnalyzer {
    workspace_root: String,
}

impl MiyabiAnalyzer {
    /// Create a new analyzer for the given workspace root
    pub fn new<P: AsRef<Path>>(workspace_root: P) -> Result<Self> {
        let root = workspace_root
            .as_ref()
            .canonicalize()?
            .to_string_lossy()
            .to_string();

        Ok(Self {
            workspace_root: root,
        })
    }

    /// Perform full analysis of the workspace
    pub fn analyze(&self) -> Result<MiyabiGraph> {
        // Step 1: Parse Cargo metadata
        let cargo_parser = CargoParser::new(&self.workspace_root)?;
        let metadata = cargo_parser.parse()?;

        // Step 2: Analyze Git history for B-factors
        let git_analyzer = GitAnalyzer::new(&self.workspace_root)?;
        let bfactors = git_analyzer.calculate_bfactors()?;

        // Step 3: Build dependency graph
        let mut builder = GraphBuilder::new();
        let mut graph = builder.build(&metadata)?;

        // Step 4: Enrich nodes with B-factors
        for node in &mut graph.nodes {
            if let Some(&bfactor) = bfactors.get(&node.id) {
                node.bfactor = bfactor;
            }
        }

        // Step 5: Update dependency counts
        graph.update_dependency_counts();

        Ok(graph)
    }

    /// Quick analysis without Git history (faster)
    pub fn analyze_quick(&self) -> Result<MiyabiGraph> {
        let cargo_parser = CargoParser::new(&self.workspace_root)?;
        let metadata = cargo_parser.parse()?;

        let mut builder = GraphBuilder::new();
        let mut graph = builder.build(&metadata)?;
        graph.update_dependency_counts();

        Ok(graph)
    }
}
