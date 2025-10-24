//! Knowledge graph type definitions for Potpie integration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Node in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    /// Unique identifier
    pub id: String,
    /// Node type (e.g., "function", "class", "module")
    pub node_type: String,
    /// Node name
    pub name: String,
    /// File path
    pub file_path: Option<String>,
    /// Line number range
    pub line_range: Option<(usize, usize)>,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Edge in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    /// Source node ID
    pub from_id: String,
    /// Target node ID
    pub to_id: String,
    /// Edge type (e.g., "calls", "imports", "extends")
    pub edge_type: String,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Code graph structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeGraph {
    /// All nodes in the graph
    pub nodes: Vec<GraphNode>,
    /// All edges in the graph
    pub edges: Vec<GraphEdge>,
    /// Graph metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

impl CodeGraph {
    /// Create empty code graph
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            edges: Vec::new(),
            metadata: HashMap::new(),
        }
    }

    /// Find node by ID
    pub fn find_node(&self, id: &str) -> Option<&GraphNode> {
        self.nodes.iter().find(|n| n.id == id)
    }

    /// Find edges from a node
    pub fn edges_from(&self, node_id: &str) -> Vec<&GraphEdge> {
        self.edges.iter().filter(|e| e.from_id == node_id).collect()
    }

    /// Find edges to a node
    pub fn edges_to(&self, node_id: &str) -> Vec<&GraphEdge> {
        self.edges.iter().filter(|e| e.to_id == node_id).collect()
    }
}

impl Default for CodeGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// File structure information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStructure {
    /// File path
    pub path: String,
    /// File type (e.g., "rust", "typescript", "python")
    pub file_type: String,
    /// Modules in the file
    pub modules: Vec<ModuleInfo>,
    /// Functions in the file
    pub functions: Vec<FunctionInfo>,
    /// Classes in the file
    pub classes: Vec<ClassInfo>,
    /// Imports/dependencies
    pub dependencies: Vec<String>,
}

/// Module information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleInfo {
    /// Module name
    pub name: String,
    /// Line number range
    pub line_range: (usize, usize),
    /// Is public?
    pub is_public: bool,
}

/// Function information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    /// Function name
    pub name: String,
    /// Line number range
    pub line_range: (usize, usize),
    /// Is public?
    pub is_public: bool,
    /// Is async?
    pub is_async: bool,
    /// Parameters
    pub parameters: Vec<String>,
    /// Return type
    pub return_type: Option<String>,
}

/// Class information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassInfo {
    /// Class name
    pub name: String,
    /// Line number range
    pub line_range: (usize, usize),
    /// Is public?
    pub is_public: bool,
    /// Methods
    pub methods: Vec<FunctionInfo>,
    /// Fields
    pub fields: Vec<String>,
}

/// AST node information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstNode {
    /// Node type (e.g., "function_declaration", "variable_declaration")
    pub node_type: String,
    /// Node name (if applicable)
    pub name: Option<String>,
    /// Line number range
    pub line_range: (usize, usize),
    /// Child nodes
    pub children: Vec<AstNode>,
    /// Additional properties
    pub properties: HashMap<String, serde_json::Value>,
}

/// Change detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeDetection {
    /// Changed files
    pub changed_files: Vec<String>,
    /// Affected nodes in the knowledge graph
    pub affected_nodes: Vec<String>,
    /// Impact analysis
    pub impact_analysis: ImpactAnalysis,
}

/// Impact analysis of changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAnalysis {
    /// Directly affected functions/classes
    pub direct_impact: Vec<String>,
    /// Indirectly affected (through dependencies)
    pub indirect_impact: Vec<String>,
    /// Tests that should be run
    pub affected_tests: Vec<String>,
    /// Risk level (0-10)
    pub risk_level: u8,
}

/// Dependency information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInfo {
    /// Package/module name
    pub name: String,
    /// Dependency type (e.g., "direct", "dev", "transitive")
    pub dependency_type: String,
    /// Version (if applicable)
    pub version: Option<String>,
    /// Where it's used
    pub used_in: Vec<String>,
}

/// Semantic search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSearchResult {
    /// Node ID
    pub node_id: String,
    /// Node name
    pub node_name: String,
    /// File path
    pub file_path: String,
    /// Relevance score (0.0-1.0)
    pub score: f64,
    /// Code snippet
    pub snippet: Option<String>,
    /// Explanation why it matches
    pub explanation: Option<String>,
}

/// Git diff analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffAnalysis {
    /// Added lines count
    pub added_lines: usize,
    /// Removed lines count
    pub removed_lines: usize,
    /// Modified files
    pub modified_files: Vec<String>,
    /// Affected functions/classes
    pub affected_symbols: Vec<String>,
    /// Complexity change estimate
    pub complexity_delta: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_graph_new() {
        let graph = CodeGraph::new();
        assert!(graph.nodes.is_empty());
        assert!(graph.edges.is_empty());
        assert!(graph.metadata.is_empty());
    }

    #[test]
    fn test_code_graph_find_node() {
        let mut graph = CodeGraph::new();
        graph.nodes.push(GraphNode {
            id: "node1".to_string(),
            node_type: "function".to_string(),
            name: "test_fn".to_string(),
            file_path: Some("test.rs".to_string()),
            line_range: Some((10, 20)),
            metadata: HashMap::new(),
        });

        assert!(graph.find_node("node1").is_some());
        assert!(graph.find_node("node2").is_none());
    }

    #[test]
    fn test_code_graph_edges() {
        let mut graph = CodeGraph::new();
        graph.edges.push(GraphEdge {
            from_id: "node1".to_string(),
            to_id: "node2".to_string(),
            edge_type: "calls".to_string(),
            metadata: HashMap::new(),
        });

        let edges_from = graph.edges_from("node1");
        assert_eq!(edges_from.len(), 1);

        let edges_to = graph.edges_to("node2");
        assert_eq!(edges_to.len(), 1);
    }
}
