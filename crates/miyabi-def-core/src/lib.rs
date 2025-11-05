//! Miyabi Definition System - Core
//!
//! This crate provides the core functionality for loading and accessing
//! Miyabi definition files (entities, relations, labels, workflows, agents).
//!
//! # Architecture
//!
//! The miyabi_def system is the **machine-readable source of truth** for the entire Miyabi project.
//! It provides structured, template-based definitions using Jinja2 + YAML format.
//!
//! Location: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`
//!
//! # Usage
//!
//! ```rust,no_run
//! use miyabi_def_core::MiyabiDef;
//!
//! # fn main() -> anyhow::Result<()> {
//! // Load definitions from default location
//! let def = MiyabiDef::load_default()?;
//!
//! // Access entities
//! let entities = def.entities();
//! println!("Loaded {} entities", entities.len());
//!
//! // Access labels
//! let labels = def.labels();
//! println!("Loaded {} labels", labels.len());
//! # Ok(())
//! # }
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

mod error;
mod loader;
mod types;

pub use error::{Error, Result};
pub use loader::MiyabiDefLoader;
pub use types::{AgentDef, EntityDef, LabelDef, RelationDef, WorkflowDef};

/// Main entry point for accessing Miyabi definitions
///
/// This struct provides access to all definition types:
/// - Entities (14 core entities: E1-E14)
/// - Relations (39 relations: R1-R39)
/// - Labels (57 labels across 11 categories)
/// - Workflows (5 core workflows: W1-W5)
/// - Agents (21 agents: 7 coding, 14 business)
#[derive(Debug, Clone)]
pub struct MiyabiDef {
    entities: HashMap<String, EntityDef>,
    relations: HashMap<String, RelationDef>,
    labels: HashMap<String, LabelDef>,
    workflows: HashMap<String, WorkflowDef>,
    agents: HashMap<String, AgentDef>,
    metadata: Metadata,
}

/// Metadata about the loaded definitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata {
    pub project_name: String,
    pub project_full_name: String,
    pub version: String,
    pub generated_at: String,
    pub format_version: String,
}

impl MiyabiDef {
    /// Load definitions from the default location
    ///
    /// Default location: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/generated/`
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Definition files cannot be found
    /// - YAML parsing fails
    /// - Required definitions are missing
    pub fn load_default() -> Result<Self> {
        let default_path = Self::default_miyabi_def_path()?;
        Self::load(&default_path)
    }

    /// Load definitions from a custom path
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the miyabi_def directory (containing `generated/` subdirectory)
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Path does not exist
    /// - Definition files cannot be found
    /// - YAML parsing fails
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self> {
        let loader = MiyabiDefLoader::new(path.as_ref())?;
        loader.load_all()
    }

    /// Get the default miyabi_def path
    ///
    /// This assumes the standard Miyabi project structure:
    /// - If `MIYABI_DEF_PATH` environment variable is set, use it
    /// - Otherwise, use `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`
    fn default_miyabi_def_path() -> Result<PathBuf> {
        if let Ok(path) = std::env::var("MIYABI_DEF_PATH") {
            return Ok(PathBuf::from(path));
        }

        // Default path
        let default = PathBuf::from("/Users/shunsuke/Dev/miyabi-private/miyabi_def");
        if default.exists() {
            Ok(default)
        } else {
            Err(Error::PathNotFound(default))
        }
    }

    /// Get all entity definitions
    pub fn entities(&self) -> &HashMap<String, EntityDef> {
        &self.entities
    }

    /// Get a specific entity by ID (e.g., "E1", "E2")
    pub fn entity(&self, id: &str) -> Option<&EntityDef> {
        self.entities.get(id)
    }

    /// Get all relation definitions
    pub fn relations(&self) -> &HashMap<String, RelationDef> {
        &self.relations
    }

    /// Get a specific relation by ID (e.g., "R1", "R2")
    pub fn relation(&self, id: &str) -> Option<&RelationDef> {
        self.relations.get(id)
    }

    /// Get all label definitions
    pub fn labels(&self) -> &HashMap<String, LabelDef> {
        &self.labels
    }

    /// Get a specific label by name (e.g., "state:pending", "P0-Critical")
    pub fn label(&self, name: &str) -> Option<&LabelDef> {
        self.labels.get(name)
    }

    /// Get all workflow definitions
    pub fn workflows(&self) -> &HashMap<String, WorkflowDef> {
        &self.workflows
    }

    /// Get a specific workflow by ID (e.g., "W1", "W2")
    pub fn workflow(&self, id: &str) -> Option<&WorkflowDef> {
        self.workflows.get(id)
    }

    /// Get all agent definitions
    pub fn agents(&self) -> &HashMap<String, AgentDef> {
        &self.agents
    }

    /// Get a specific agent by name (e.g., "CoordinatorAgent", "CodeGenAgent")
    pub fn agent(&self, name: &str) -> Option<&AgentDef> {
        self.agents.get(name)
    }

    /// Get metadata about the definitions
    pub fn metadata(&self) -> &Metadata {
        &self.metadata
    }

    /// Create a new MiyabiDef instance (used by loader)
    pub(crate) fn new(
        entities: HashMap<String, EntityDef>,
        relations: HashMap<String, RelationDef>,
        labels: HashMap<String, LabelDef>,
        workflows: HashMap<String, WorkflowDef>,
        agents: HashMap<String, AgentDef>,
        metadata: Metadata,
    ) -> Self {
        Self {
            entities,
            relations,
            labels,
            workflows,
            agents,
            metadata,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_path() {
        let path = MiyabiDef::default_miyabi_def_path();
        assert!(path.is_ok());
    }

    #[test]
    #[ignore] // Only run when miyabi_def is available
    fn test_load_default() {
        let result = MiyabiDef::load_default();
        match result {
            Ok(def) => {
                println!("Loaded {} entities", def.entities().len());
                println!("Loaded {} relations", def.relations().len());
                println!("Loaded {} labels", def.labels().len());
                println!("Loaded {} workflows", def.workflows().len());
                println!("Loaded {} agents", def.agents().len());
            }
            Err(e) => {
                eprintln!("Failed to load: {}", e);
            }
        }
    }
}
