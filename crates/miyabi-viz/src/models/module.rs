//! Module-level node and dependency models (Phase 2)

use serde::{Deserialize, Serialize};

/// A node representing a Rust module within a crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleNode {
    /// Unique identifier within crate (e.g., "rules_context", "github::api")
    pub id: String,

    /// Parent crate this module belongs to
    pub crate_id: String,

    /// Full module path (e.g., "miyabi_agent_core::rules_context")
    pub full_path: String,

    /// Lines of code in this module
    pub loc: usize,

    /// Cyclomatic complexity (average across functions)
    pub complexity: f32,

    /// Test coverage percentage (0.0 - 1.0)
    pub coverage: f32,

    /// Number of public items (functions, structs, enums, traits)
    pub public_items_count: usize,

    /// Whether this is a public module (pub mod)
    pub is_public: bool,

    /// File path relative to crate root
    pub file_path: String,

    /// Number of dependencies on other modules (outgoing edges)
    pub dependencies_count: usize,

    /// Number of modules depending on this one (incoming edges)
    pub dependents_count: usize,
}

impl ModuleNode {
    /// Create a new module node
    pub fn new(
        id: String,
        crate_id: String,
        full_path: String,
        file_path: String,
        is_public: bool,
    ) -> Self {
        Self {
            id,
            crate_id,
            full_path,
            file_path,
            is_public,
            loc: 0,
            complexity: 1.0,
            coverage: 0.0,
            public_items_count: 0,
            dependencies_count: 0,
            dependents_count: 0,
        }
    }

    /// Get node size value for 3d-force-graph (smaller scale than crates)
    pub fn visual_size(&self) -> f32 {
        ((self.loc as f32) / 100.0).log10().max(0.5)
    }

    /// Get color based on module visibility and complexity
    pub fn color(&self) -> &'static str {
        if !self.is_public {
            // Private modules: Gray
            "#9E9E9E"
        } else if self.complexity > 15.0 {
            // High complexity public modules: Red
            "#F44336"
        } else if self.complexity > 10.0 {
            // Medium complexity public modules: Orange
            "#FF9800"
        } else {
            // Low complexity public modules: Green
            "#4CAF50"
        }
    }

    /// Check if this is a "God Module" (too large/complex)
    pub fn is_god_module(&self) -> bool {
        self.loc > 1000 || self.complexity > 20.0
    }
}

/// A dependency edge between two modules within the same crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleDependency {
    /// Source module (depends on target)
    pub source: String,

    /// Target module (depended upon by source)
    pub target: String,

    /// Strength of dependency (number of use statements)
    pub strength: usize,

    /// Whether this crosses a major module boundary (parent module differs)
    pub is_cross_boundary: bool,
}

impl ModuleDependency {
    /// Create a new module dependency
    pub fn new(source: String, target: String, strength: usize) -> Self {
        // Detect cross-boundary by checking if modules share parent
        let is_cross_boundary = !Self::share_parent(&source, &target);

        Self {
            source,
            target,
            strength,
            is_cross_boundary,
        }
    }

    /// Check if two modules share the same parent module
    fn share_parent(module_a: &str, module_b: &str) -> bool {
        let parts_a: Vec<&str> = module_a.split("::").collect();
        let parts_b: Vec<&str> = module_b.split("::").collect();

        if parts_a.len() <= 1 || parts_b.len() <= 1 {
            return false;
        }

        // Compare all parts except the last one
        parts_a[..parts_a.len() - 1] == parts_b[..parts_b.len() - 1]
    }

    /// Get color for visualization
    pub fn color(&self) -> &'static str {
        if self.is_cross_boundary {
            // Cross-boundary dependencies: Orange (potentially risky)
            "#FF9800"
        } else {
            // Internal dependencies: Blue
            "#2196F3"
        }
    }

    /// Get line width for visualization
    pub fn width(&self) -> f32 {
        // Thickness proportional to dependency strength
        (self.strength as f32).min(10.0) * 0.5
    }

    /// Get line style (solid for strong, dashed for weak)
    pub fn is_dashed(&self) -> bool {
        self.strength <= 5
    }
}

/// Module-level dependency graph for a single crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleGraph {
    /// Parent crate ID
    pub crate_id: String,

    /// All modules in this crate
    pub nodes: Vec<ModuleNode>,

    /// All dependencies between modules
    pub links: Vec<ModuleDependency>,
}

impl ModuleGraph {
    /// Create a new empty module graph
    pub fn new(crate_id: String) -> Self {
        Self {
            crate_id,
            nodes: Vec::new(),
            links: Vec::new(),
        }
    }

    /// Add a module node to the graph
    pub fn add_node(&mut self, node: ModuleNode) {
        self.nodes.push(node);
    }

    /// Add a module dependency to the graph
    pub fn add_link(&mut self, dep: ModuleDependency) {
        self.links.push(dep);
    }

    /// Update dependency counts for all modules
    pub fn update_dependency_counts(&mut self) {
        use std::collections::HashMap;

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

    /// Find "God Modules" - modules that are too large or complex
    pub fn find_god_modules(&self) -> Vec<&ModuleNode> {
        self.nodes
            .iter()
            .filter(|node| node.is_god_module())
            .collect()
    }

    /// Find modules with high complexity but low coverage
    pub fn find_risky_modules(&self) -> Vec<&ModuleNode> {
        self.nodes
            .iter()
            .filter(|node| node.complexity > 10.0 && node.coverage < 0.5)
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
            loc: usize,
            complexity: f32,
            is_public: bool,
        }

        #[derive(Serialize)]
        struct ForceGraphLink {
            source: String,
            target: String,
            strength: usize,
            color: String,
            width: f32,
            dashed: bool,
        }

        #[derive(Serialize)]
        struct ForceGraphData {
            crate_id: String,
            nodes: Vec<ForceGraphNode>,
            links: Vec<ForceGraphLink>,
        }

        let nodes = self
            .nodes
            .iter()
            .map(|n| ForceGraphNode {
                id: n.id.clone(),
                val: n.visual_size(),
                color: n.color().to_string(),
                opacity: n.coverage,
                group: if n.is_public { "Public".to_string() } else { "Private".to_string() },
                loc: n.loc,
                complexity: n.complexity,
                is_public: n.is_public,
            })
            .collect();

        let links = self
            .links
            .iter()
            .map(|l| ForceGraphLink {
                source: l.source.clone(),
                target: l.target.clone(),
                strength: l.strength,
                color: l.color().to_string(),
                width: l.width(),
                dashed: l.is_dashed(),
            })
            .collect();

        let data = ForceGraphData {
            crate_id: self.crate_id.clone(),
            nodes,
            links,
        };

        Ok(serde_json::to_string_pretty(&data)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_dependency_share_parent() {
        // Same parent module: foo::bar
        assert!(ModuleDependency::share_parent(
            "foo::bar::baz",
            "foo::bar::qux"
        ));

        // Same parent module: foo (siblings)
        assert!(ModuleDependency::share_parent(
            "foo::bar",
            "foo::baz"
        ));

        // Different parents: None vs None (top-level modules)
        assert!(!ModuleDependency::share_parent("foo", "bar"));

        // Different parents: foo vs bar
        assert!(!ModuleDependency::share_parent(
            "foo::baz",
            "bar::qux"
        ));
    }

    #[test]
    fn test_god_module_detection() {
        let mut node = ModuleNode::new(
            "large_module".to_string(),
            "test_crate".to_string(),
            "test_crate::large_module".to_string(),
            "src/large_module.rs".to_string(),
            true,
        );
        node.loc = 1500;
        node.complexity = 25.0;

        assert!(node.is_god_module());
    }

    #[test]
    fn test_module_graph_update_counts() {
        let mut graph = ModuleGraph::new("test_crate".to_string());

        graph.add_node(ModuleNode::new(
            "a".to_string(),
            "test_crate".to_string(),
            "test_crate::a".to_string(),
            "src/a.rs".to_string(),
            true,
        ));
        graph.add_node(ModuleNode::new(
            "b".to_string(),
            "test_crate".to_string(),
            "test_crate::b".to_string(),
            "src/b.rs".to_string(),
            true,
        ));

        graph.add_link(ModuleDependency::new("a".to_string(), "b".to_string(), 3));

        graph.update_dependency_counts();

        assert_eq!(graph.nodes[0].dependencies_count, 1);
        assert_eq!(graph.nodes[0].dependents_count, 0);
        assert_eq!(graph.nodes[1].dependencies_count, 0);
        assert_eq!(graph.nodes[1].dependents_count, 1);
    }
}
