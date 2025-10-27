//! Miyabi dependency graph model

use super::{CrateNode, Dependency};
use petgraph::algo::tarjan_scc;
use petgraph::graph::{DiGraph, NodeIndex};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The complete Miyabi workspace dependency graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiyabiGraph {
    /// All crate nodes in the workspace
    pub nodes: Vec<CrateNode>,

    /// All dependencies between crates
    pub links: Vec<Dependency>,
}

impl MiyabiGraph {
    /// Create a new empty graph
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            links: Vec::new(),
        }
    }

    /// Add a crate node to the graph
    pub fn add_node(&mut self, node: CrateNode) {
        self.nodes.push(node);
    }

    /// Add a dependency edge to the graph
    pub fn add_link(&mut self, dep: Dependency) {
        self.links.push(dep);
    }

    /// Update dependency counts for all nodes
    pub fn update_dependency_counts(&mut self) {
        let mut deps_count: HashMap<String, usize> = HashMap::new();
        let mut dependents_count: HashMap<String, usize> = HashMap::new();

        for link in &self.links {
            *deps_count.entry(link.source.clone()).or_insert(0) += 1;
            *dependents_count.entry(link.target.clone()).or_insert(0) += 1;
        }

        for node in &mut self.nodes {
            node.dependencies_count = deps_count.get(&node.id).copied().unwrap_or(0);
            node.dependents_count = dependents_count.get(&node.id).copied().unwrap_or(0);
        }
    }

    /// Detect circular dependencies using Tarjan's strongly connected components algorithm
    pub fn detect_cycles(&self) -> Vec<Vec<String>> {
        let mut graph = DiGraph::new();
        let mut node_indices: HashMap<String, NodeIndex> = HashMap::new();

        // Build petgraph from our graph
        for node in &self.nodes {
            let idx = graph.add_node(node.id.clone());
            node_indices.insert(node.id.clone(), idx);
        }

        for link in &self.links {
            if let (Some(&source_idx), Some(&target_idx)) = (
                node_indices.get(&link.source),
                node_indices.get(&link.target),
            ) {
                graph.add_edge(source_idx, target_idx, ());
            }
        }

        // Find strongly connected components
        let sccs = tarjan_scc(&graph);

        // Filter to only cycles (SCC with size > 1)
        sccs.into_iter()
            .filter(|scc| scc.len() > 1)
            .map(|scc| {
                scc.into_iter()
                    .map(|idx| graph[idx].clone())
                    .collect::<Vec<_>>()
            })
            .collect()
    }

    /// Find "God Crates" - crates with too many dependencies
    pub fn find_god_crates(&self, threshold: usize) -> Vec<&CrateNode> {
        self.nodes
            .iter()
            .filter(|node| node.dependencies_count > threshold)
            .collect()
    }

    /// Find "Unstable Hubs" - highly-depended-upon crates with high B-factor
    pub fn find_unstable_hubs(
        &self,
        bfactor_threshold: f32,
        dependents_threshold: usize,
    ) -> Vec<&CrateNode> {
        self.nodes
            .iter()
            .filter(|node| {
                node.bfactor > bfactor_threshold && node.dependents_count > dependents_threshold
            })
            .collect()
    }

    /// Convert to JSON format compatible with 3d-force-graph
    pub fn to_json(&self) -> crate::Result<String> {
        #[derive(Serialize)]
        struct ForceGraphNode {
            id: String,
            val: f32,
            color: String,
            opacity: f32,
            group: String,
        }

        #[derive(Serialize)]
        struct ForceGraphLink {
            source: String,
            target: String,
            #[serde(rename = "type")]
            type_: String,
            color: String,
            width: f32,
        }

        #[derive(Serialize)]
        struct ForceGraphData {
            nodes: Vec<ForceGraphNode>,
            links: Vec<ForceGraphLink>,
        }

        let nodes = self
            .nodes
            .iter()
            .map(|n| ForceGraphNode {
                id: n.id.clone(),
                val: n.visual_size(),
                color: n.bfactor_color(),
                opacity: n.occupancy,
                group: format!("{:?}", n.category),
            })
            .collect();

        let links = self
            .links
            .iter()
            .map(|l| ForceGraphLink {
                source: l.source.clone(),
                target: l.target.clone(),
                type_: format!("{:?}", l.kind),
                color: l.kind.color().to_string(),
                width: l.kind.width(),
            })
            .collect();

        let data = ForceGraphData { nodes, links };

        Ok(serde_json::to_string_pretty(&data)?)
    }
}

impl Default for MiyabiGraph {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{CrateCategory, DependencyKind};

    #[test]
    fn test_detect_cycles() {
        let mut graph = MiyabiGraph::new();

        graph.add_node(CrateNode::new("A".to_string(), 1000, CrateCategory::Core));
        graph.add_node(CrateNode::new("B".to_string(), 2000, CrateCategory::Agent));
        graph.add_node(CrateNode::new(
            "C".to_string(),
            3000,
            CrateCategory::Integration,
        ));

        // Create a cycle: A → B → C → A
        graph.add_link(Dependency::new(
            "A".to_string(),
            "B".to_string(),
            DependencyKind::Runtime,
        ));
        graph.add_link(Dependency::new(
            "B".to_string(),
            "C".to_string(),
            DependencyKind::Runtime,
        ));
        graph.add_link(Dependency::new(
            "C".to_string(),
            "A".to_string(),
            DependencyKind::Runtime,
        ));

        let cycles = graph.detect_cycles();
        assert_eq!(cycles.len(), 1);
        assert_eq!(cycles[0].len(), 3);
    }

    #[test]
    fn test_find_god_crates() {
        let mut graph = MiyabiGraph::new();

        let mut node = CrateNode::new("A".to_string(), 1000, CrateCategory::Core);
        node.dependencies_count = 20;
        graph.add_node(node);

        let mut node = CrateNode::new("B".to_string(), 2000, CrateCategory::Agent);
        node.dependencies_count = 5;
        graph.add_node(node);

        let god_crates = graph.find_god_crates(15);
        assert_eq!(god_crates.len(), 1);
        assert_eq!(god_crates[0].id, "A");
    }
}
