//! JSON exporter for 3d-force-graph format

use crate::{models::MiyabiGraph, Result};
use std::fs::File;
use std::io::Write;
use std::path::Path;

/// Exporter for JSON format compatible with 3d-force-graph
pub struct JsonExporter;

impl JsonExporter {
    /// Export graph to JSON string
    pub fn export_to_string(graph: &MiyabiGraph) -> Result<String> {
        graph.to_json()
    }

    /// Export graph to a JSON file
    pub fn export_to_file<P: AsRef<Path>>(graph: &MiyabiGraph, path: P) -> Result<()> {
        let json = Self::export_to_string(graph)?;
        let mut file = File::create(path)?;
        file.write_all(json.as_bytes())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{CrateCategory, CrateNode, Dependency, DependencyKind};

    #[test]
    fn test_export_to_string() {
        let mut graph = MiyabiGraph::new();

        graph.add_node(CrateNode::new(
            "miyabi-core".to_string(),
            1000,
            CrateCategory::Core,
        ));
        graph.add_node(CrateNode::new(
            "miyabi-types".to_string(),
            500,
            CrateCategory::Core,
        ));
        graph.add_link(Dependency::new(
            "miyabi-core".to_string(),
            "miyabi-types".to_string(),
            DependencyKind::Runtime,
        ));

        let json = JsonExporter::export_to_string(&graph).unwrap();
        assert!(json.contains("miyabi-core"));
        assert!(json.contains("miyabi-types"));
        assert!(json.contains("nodes"));
        assert!(json.contains("links"));
    }
}
