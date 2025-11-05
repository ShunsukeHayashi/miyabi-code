//! YAML loader for Miyabi definitions

use crate::error::{Error, Result};
use crate::types::{AgentDef, EntityDef, LabelDef, RelationDef, WorkflowDef};
use crate::{Metadata, MiyabiDef};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// YAML loader for Miyabi definitions
pub struct MiyabiDefLoader {
    #[allow(dead_code)] // Reserved for future use (loading from variables/)
    base_path: PathBuf,
    generated_path: PathBuf,
}

impl MiyabiDefLoader {
    /// Create a new loader
    ///
    /// # Arguments
    ///
    /// * `base_path` - Path to the miyabi_def directory
    pub fn new(base_path: &Path) -> Result<Self> {
        let base_path = dunce::canonicalize(base_path)?;
        let generated_path = base_path.join("generated");

        if !generated_path.exists() {
            return Err(Error::PathNotFound(generated_path));
        }

        Ok(Self {
            base_path,
            generated_path,
        })
    }

    /// Load all definitions
    pub fn load_all(&self) -> Result<MiyabiDef> {
        // Load metadata first
        let metadata = self.load_metadata()?;

        // Load all definition types
        let entities = self.load_entities()?;
        let relations = self.load_relations()?;
        let labels = self.load_labels()?;
        let workflows = self.load_workflows()?;
        let agents = self.load_agents()?;

        Ok(MiyabiDef::new(
            entities, relations, labels, workflows, agents, metadata,
        ))
    }

    /// Load metadata from any YAML file (they all have metadata)
    fn load_metadata(&self) -> Result<Metadata> {
        let entities_path = self.generated_path.join("entities.yaml");
        let content =
            fs::read_to_string(&entities_path).map_err(|_| Error::FileNotFound(entities_path))?;

        // Parse as generic YAML first to extract metadata
        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let metadata = yaml
            .get("metadata")
            .ok_or_else(|| Error::MissingField("metadata".to_string()))?;

        Ok(serde_yaml::from_value(metadata.clone())?)
    }

    /// Load entity definitions
    fn load_entities(&self) -> Result<HashMap<String, EntityDef>> {
        let path = self.generated_path.join("entities.yaml");
        let content = fs::read_to_string(&path).map_err(|_| Error::FileNotFound(path.clone()))?;

        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let definitions = yaml
            .get("entities")
            .and_then(|e| e.get("definitions"))
            .ok_or_else(|| Error::MissingField("entities.definitions".to_string()))?;

        // Convert to HashMap
        if let serde_yaml::Value::Mapping(map) = definitions {
            let mut result = HashMap::new();
            for (key, value) in map {
                if let serde_yaml::Value::String(key_str) = key {
                    match serde_yaml::from_value::<EntityDef>(value.clone()) {
                        Ok(entity) => {
                            result.insert(key_str.clone(), entity);
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to parse entity {}: {}", key_str, e);
                        }
                    }
                }
            }
            Ok(result)
        } else {
            Err(Error::InvalidFormat(
                "entities.definitions is not a mapping".to_string(),
            ))
        }
    }

    /// Load relation definitions
    fn load_relations(&self) -> Result<HashMap<String, RelationDef>> {
        let path = self.generated_path.join("relations.yaml");
        let content = fs::read_to_string(&path).map_err(|_| Error::FileNotFound(path.clone()))?;

        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let definitions = yaml
            .get("relations")
            .and_then(|r| r.get("definitions"))
            .ok_or_else(|| Error::MissingField("relations.definitions".to_string()))?;

        if let serde_yaml::Value::Mapping(map) = definitions {
            let mut result = HashMap::new();
            for (key, value) in map {
                if let serde_yaml::Value::String(key_str) = key {
                    match serde_yaml::from_value::<RelationDef>(value.clone()) {
                        Ok(relation) => {
                            result.insert(key_str.clone(), relation);
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to parse relation {}: {}", key_str, e);
                        }
                    }
                }
            }
            Ok(result)
        } else {
            Err(Error::InvalidFormat(
                "relations.definitions is not a mapping".to_string(),
            ))
        }
    }

    /// Load label definitions
    fn load_labels(&self) -> Result<HashMap<String, LabelDef>> {
        let path = self.generated_path.join("labels.yaml");
        let content = fs::read_to_string(&path).map_err(|_| Error::FileNotFound(path.clone()))?;

        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let categories = yaml
            .get("labels")
            .and_then(|l| l.get("categories"))
            .ok_or_else(|| Error::MissingField("labels.categories".to_string()))?;

        let mut result = HashMap::new();

        // Iterate through categories
        if let serde_yaml::Value::Mapping(cat_map) = categories {
            for (_cat_name, cat_value) in cat_map {
                if let Some(serde_yaml::Value::Sequence(labels)) = cat_value.get("labels") {
                    for label_value in labels {
                        match serde_yaml::from_value::<LabelDef>(label_value.clone()) {
                            Ok(label) => {
                                result.insert(label.name.clone(), label);
                            }
                            Err(e) => {
                                eprintln!("Warning: Failed to parse label: {}", e);
                            }
                        }
                    }
                }
            }
        }

        Ok(result)
    }

    /// Load workflow definitions
    fn load_workflows(&self) -> Result<HashMap<String, WorkflowDef>> {
        let path = self.generated_path.join("workflows.yaml");
        let content = fs::read_to_string(&path).map_err(|_| Error::FileNotFound(path.clone()))?;

        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let definitions = yaml
            .get("workflows")
            .and_then(|w| w.get("definitions"))
            .ok_or_else(|| Error::MissingField("workflows.definitions".to_string()))?;

        if let serde_yaml::Value::Mapping(map) = definitions {
            let mut result = HashMap::new();
            for (key, value) in map {
                if let serde_yaml::Value::String(key_str) = key {
                    match serde_yaml::from_value::<WorkflowDef>(value.clone()) {
                        Ok(workflow) => {
                            result.insert(key_str.clone(), workflow);
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to parse workflow {}: {}", key_str, e);
                        }
                    }
                }
            }
            Ok(result)
        } else {
            Err(Error::InvalidFormat(
                "workflows.definitions is not a mapping".to_string(),
            ))
        }
    }

    /// Load agent definitions
    fn load_agents(&self) -> Result<HashMap<String, AgentDef>> {
        let path = self.generated_path.join("agents.yaml");
        let content = fs::read_to_string(&path).map_err(|_| Error::FileNotFound(path.clone()))?;

        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let definitions = yaml
            .get("agents")
            .and_then(|a| a.get("definitions"))
            .ok_or_else(|| Error::MissingField("agents.definitions".to_string()))?;

        if let serde_yaml::Value::Mapping(map) = definitions {
            let mut result = HashMap::new();
            for (key, value) in map {
                if let serde_yaml::Value::String(key_str) = key {
                    match serde_yaml::from_value::<AgentDef>(value.clone()) {
                        Ok(agent) => {
                            result.insert(key_str.clone(), agent);
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to parse agent {}: {}", key_str, e);
                        }
                    }
                }
            }
            Ok(result)
        } else {
            Err(Error::InvalidFormat(
                "agents.definitions is not a mapping".to_string(),
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Only run when miyabi_def is available
    fn test_load_entities() {
        let base_path = PathBuf::from("/Users/shunsuke/Dev/miyabi-private/miyabi_def");
        let loader = MiyabiDefLoader::new(&base_path).unwrap();
        let entities = loader.load_entities().unwrap();
        println!("Loaded {} entities", entities.len());
        assert!(!entities.is_empty());
    }

    #[test]
    #[ignore]
    fn test_load_all() {
        let base_path = PathBuf::from("/Users/shunsuke/Dev/miyabi-private/miyabi_def");
        let loader = MiyabiDefLoader::new(&base_path).unwrap();
        let def = loader.load_all().unwrap();

        println!("Entities: {}", def.entities().len());
        println!("Relations: {}", def.relations().len());
        println!("Labels: {}", def.labels().len());
        println!("Workflows: {}", def.workflows().len());
        println!("Agents: {}", def.agents().len());
    }
}
