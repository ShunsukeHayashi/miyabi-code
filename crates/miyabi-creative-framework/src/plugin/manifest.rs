//! Plugin manifest definitions

use serde::{Deserialize, Serialize};

/// Plugin manifest defining metadata and capabilities
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PluginManifest {
    /// Unique plugin identifier
    pub id: String,
    /// Human-readable plugin name
    pub name: String,
    /// Semantic version (e.g., "1.0.0")
    pub version: String,
    /// Plugin description
    pub description: String,
    /// Plugin author
    pub author: String,
    /// Plugin category
    pub category: PluginCategory,
    /// Capabilities provided by the plugin
    pub capabilities: Vec<String>,
    /// Plugin dependencies (other plugin IDs)
    pub dependencies: Vec<String>,
    /// Required permissions
    pub permissions: Vec<PluginPermission>,
    /// Entry point (function name or file)
    pub entry: String,
    /// Plugin homepage URL
    pub homepage: Option<String>,
    /// Plugin repository URL
    pub repository: Option<String>,
    /// License identifier (SPDX)
    pub license: Option<String>,
    /// Keywords for discovery
    pub keywords: Vec<String>,
    /// Minimum framework version required
    pub min_framework_version: Option<String>,
    /// Plugin configuration schema
    pub config_schema: Option<serde_json::Value>,
}

/// Plugin categories
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PluginCategory {
    /// AI model integration plugins
    AiModel,
    /// Workflow automation plugins
    Workflow,
    /// Template and preset plugins
    Template,
    /// External service connectors
    Connector,
    /// Content filters and transformers
    Filter,
    /// Analytics and monitoring
    Analytics,
    /// Collaboration tools
    Collaboration,
    /// Other/uncategorized
    #[default]
    Other,
}

/// Plugin permission definition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PluginPermission {
    /// Type of permission
    pub permission_type: PluginPermissionType,
    /// Resource being accessed
    pub resource: String,
    /// Access scope
    pub scope: PluginPermissionScope,
    /// Reason for requesting permission
    pub reason: Option<String>,
}

/// Types of permissions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PluginPermissionType {
    /// API endpoint access
    ApiAccess,
    /// Filesystem access
    FileSystem,
    /// Network access
    Network,
    /// Local storage access
    Storage,
    /// AI model invocation
    AiModels,
    /// User data access
    UserData,
    /// Project data access
    ProjectData,
    /// System configuration
    SystemConfig,
}

/// Permission scope levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PluginPermissionScope {
    /// Read-only access
    Read,
    /// Write access
    Write,
    /// Execute permission
    Execute,
    /// Full administrative access
    Admin,
}

impl PluginManifest {
    /// Create a new plugin manifest builder
    pub fn builder(id: &str) -> PluginManifestBuilder {
        PluginManifestBuilder::new(id)
    }

    /// Validate the manifest
    pub fn validate(&self) -> Result<(), String> {
        if self.id.is_empty() {
            return Err("Plugin ID is required".to_string());
        }
        if self.name.is_empty() {
            return Err("Plugin name is required".to_string());
        }
        if self.version.is_empty() {
            return Err("Plugin version is required".to_string());
        }
        if self.entry.is_empty() {
            return Err("Plugin entry point is required".to_string());
        }
        Ok(())
    }
}

/// Builder for creating plugin manifests
pub struct PluginManifestBuilder {
    manifest: PluginManifest,
}

impl PluginManifestBuilder {
    /// Create a new builder with the given plugin ID
    pub fn new(id: &str) -> Self {
        Self {
            manifest: PluginManifest {
                id: id.to_string(),
                entry: "main".to_string(),
                ..Default::default()
            },
        }
    }

    /// Set the plugin name
    pub fn name(mut self, name: &str) -> Self {
        self.manifest.name = name.to_string();
        self
    }

    /// Set the plugin version
    pub fn version(mut self, version: &str) -> Self {
        self.manifest.version = version.to_string();
        self
    }

    /// Set the plugin description
    pub fn description(mut self, description: &str) -> Self {
        self.manifest.description = description.to_string();
        self
    }

    /// Set the plugin author
    pub fn author(mut self, author: &str) -> Self {
        self.manifest.author = author.to_string();
        self
    }

    /// Set the plugin category
    pub fn category(mut self, category: PluginCategory) -> Self {
        self.manifest.category = category;
        self
    }

    /// Add a capability
    pub fn capability(mut self, capability: &str) -> Self {
        self.manifest.capabilities.push(capability.to_string());
        self
    }

    /// Add capabilities
    pub fn capabilities(mut self, capabilities: Vec<&str>) -> Self {
        self.manifest.capabilities.extend(capabilities.into_iter().map(String::from));
        self
    }

    /// Add a dependency
    pub fn dependency(mut self, plugin_id: &str) -> Self {
        self.manifest.dependencies.push(plugin_id.to_string());
        self
    }

    /// Add a permission
    pub fn permission(
        mut self,
        permission_type: PluginPermissionType,
        resource: &str,
        scope: PluginPermissionScope,
    ) -> Self {
        self.manifest.permissions.push(PluginPermission {
            permission_type,
            resource: resource.to_string(),
            scope,
            reason: None,
        });
        self
    }

    /// Add a permission with reason
    pub fn permission_with_reason(
        mut self,
        permission_type: PluginPermissionType,
        resource: &str,
        scope: PluginPermissionScope,
        reason: &str,
    ) -> Self {
        self.manifest.permissions.push(PluginPermission {
            permission_type,
            resource: resource.to_string(),
            scope,
            reason: Some(reason.to_string()),
        });
        self
    }

    /// Set the entry point
    pub fn entry(mut self, entry: &str) -> Self {
        self.manifest.entry = entry.to_string();
        self
    }

    /// Set the homepage URL
    pub fn homepage(mut self, url: &str) -> Self {
        self.manifest.homepage = Some(url.to_string());
        self
    }

    /// Set the repository URL
    pub fn repository(mut self, url: &str) -> Self {
        self.manifest.repository = Some(url.to_string());
        self
    }

    /// Set the license
    pub fn license(mut self, license: &str) -> Self {
        self.manifest.license = Some(license.to_string());
        self
    }

    /// Add keywords
    pub fn keywords(mut self, keywords: Vec<&str>) -> Self {
        self.manifest.keywords.extend(keywords.into_iter().map(String::from));
        self
    }

    /// Set minimum framework version
    pub fn min_framework_version(mut self, version: &str) -> Self {
        self.manifest.min_framework_version = Some(version.to_string());
        self
    }

    /// Build the manifest
    pub fn build(self) -> Result<PluginManifest, String> {
        self.manifest.validate()?;
        Ok(self.manifest)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_manifest_builder() {
        let manifest = PluginManifest::builder("test-plugin")
            .name("Test Plugin")
            .version("1.0.0")
            .description("A test plugin")
            .author("Test Author")
            .category(PluginCategory::AiModel)
            .capability("text-generation")
            .permission(
                PluginPermissionType::AiModels,
                "claude-3",
                PluginPermissionScope::Execute,
            )
            .entry("main")
            .build();

        assert!(manifest.is_ok());
        let m = manifest.unwrap();
        assert_eq!(m.id, "test-plugin");
        assert_eq!(m.name, "Test Plugin");
        assert_eq!(m.category, PluginCategory::AiModel);
    }

    #[test]
    fn test_manifest_validation() {
        let result = PluginManifest::builder("").build();
        assert!(result.is_err());

        let result = PluginManifest::builder("valid-id")
            .name("")
            .version("1.0.0")
            .build();
        assert!(result.is_err());
    }
}
