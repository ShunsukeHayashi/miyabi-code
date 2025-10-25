//! Dependency graph builder

use crate::{
    models::{CrateCategory, CrateNode, Dependency, MiyabiGraph},
    Result,
};
use cargo_metadata::{Metadata, Node};
use std::collections::HashMap;

/// Builder for creating a MiyabiGraph from Cargo metadata
pub struct GraphBuilder {
    loc_cache: HashMap<String, usize>,
}

impl GraphBuilder {
    /// Create a new graph builder
    pub fn new() -> Self {
        Self {
            loc_cache: HashMap::new(),
        }
    }

    /// Build a dependency graph from Cargo metadata
    pub fn build(&mut self, metadata: &Metadata) -> Result<MiyabiGraph> {
        let mut graph = MiyabiGraph::new();

        // Step 1: Create nodes for all workspace members
        for package_id in &metadata.workspace_members {
            if let Some(package) = metadata.packages.iter().find(|p| &p.id == package_id) {
                let name = package.name.clone();
                let category = CrateCategory::from_crate_name(&name);

                // Count LOC (or use cached value)
                let loc = self.count_or_cache_loc(package, metadata)?;

                let node = CrateNode::new(name, loc, category);
                graph.add_node(node);
            }
        }

        // Step 2: Create dependency edges
        if let Some(resolve) = &metadata.resolve {
            for node in &resolve.nodes {
                self.add_dependencies_for_node(&mut graph, node, metadata)?;
            }
        }

        Ok(graph)
    }

    /// Add dependencies for a single node
    fn add_dependencies_for_node(
        &self,
        graph: &mut MiyabiGraph,
        node: &Node,
        metadata: &Metadata,
    ) -> Result<()> {
        if let Some(package) = metadata.packages.iter().find(|p| p.id == node.id) {
            let source_name = package.name.clone();

            // Only process workspace members as sources
            if !metadata.workspace_members.contains(&package.id) {
                return Ok(());
            }

            for dep in &node.deps {
                if let Some(dep_package) = metadata.packages.iter().find(|p| p.id == dep.pkg) {
                    let target_name = dep_package.name.clone();

                    // Only create edges between workspace members
                    if metadata.workspace_members.contains(&dep_package.id) {
                        // Find the dependency kind from package dependencies
                        let kind = package
                            .dependencies
                            .iter()
                            .find(|d| d.name == target_name)
                            .map(|d| super::cargo_parser::CargoParser::convert_dep_kind(d.kind))
                            .unwrap_or(crate::models::DependencyKind::Runtime);

                        graph.add_link(Dependency::new(source_name.clone(), target_name, kind));
                    }
                }
            }
        }

        Ok(())
    }

    /// Count LOC or retrieve from cache
    fn count_or_cache_loc(
        &mut self,
        package: &cargo_metadata::Package,
        _metadata: &Metadata,
    ) -> Result<usize> {
        if let Some(&loc) = self.loc_cache.get(&package.name) {
            return Ok(loc);
        }

        let loc = Self::count_lines_of_code(package)?;
        self.loc_cache.insert(package.name.clone(), loc);

        Ok(loc)
    }

    /// Count lines of code for a package
    fn count_lines_of_code(package: &cargo_metadata::Package) -> Result<usize> {
        let mut total_loc = 0;

        let src_dir = package.manifest_path.parent().unwrap().join("src");
        if src_dir.exists() {
            total_loc += Self::count_loc_in_dir(src_dir.as_std_path())?;
        }

        Ok(total_loc.max(1)) // Minimum 1 LOC to avoid zero-size nodes
    }

    /// Recursively count LOC in a directory
    fn count_loc_in_dir(dir: &std::path::Path) -> Result<usize> {
        let mut total = 0;

        if dir.is_dir() {
            for entry in std::fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();

                if path.is_dir() {
                    total += Self::count_loc_in_dir(&path)?;
                } else if path.extension().and_then(|s| s.to_str()) == Some("rs") {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        total += content
                            .lines()
                            .filter(|line| {
                                let trimmed = line.trim();
                                !trimmed.is_empty()
                                    && !trimmed.starts_with("//")
                                    && !trimmed.starts_with("/*")
                            })
                            .count();
                    }
                }
            }
        }

        Ok(total)
    }
}

impl Default for GraphBuilder {
    fn default() -> Self {
        Self::new()
    }
}
