//! Tool configuration system for Miyabi modes
//!
//! Inspired by Kimi CLI's tool specification system, this module provides
//! per-tool configuration capabilities including timeouts, parameters, and
//! permissions.
//!
//! # Example
//!
//! ```yaml
//! tools:
//!   - name: "read"
//!     module: "file_operations"
//!     enabled: true
//!     config:
//!       max_file_size: 10485760
//!       timeout_ms: 30000
//! ```

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// Tool configuration with parameters and settings
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct ToolConfig {
    /// Tool name (e.g., "read", "grep", "bash")
    pub name: String,

    /// Module or category (e.g., "file_operations", "search", "command_execution")
    pub module: String,

    /// Whether this tool is enabled for the mode
    #[serde(default = "default_enabled")]
    pub enabled: bool,

    /// Tool-specific configuration as JSON blob
    #[serde(default)]
    pub config: Value,
}

/// Default enabled state (true)
fn default_enabled() -> bool {
    true
}

impl ToolConfig {
    /// Create a new tool configuration
    pub fn new(name: impl Into<String>, module: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            module: module.into(),
            enabled: true,
            config: Value::Object(serde_json::Map::new()),
        }
    }

    /// Create a tool configuration with custom config
    pub fn with_config(
        name: impl Into<String>,
        module: impl Into<String>,
        config: Value,
    ) -> Self {
        Self {
            name: name.into(),
            module: module.into(),
            enabled: true,
            config,
        }
    }

    /// Disable this tool
    pub fn disabled(mut self) -> Self {
        self.enabled = false;
        self
    }

    /// Get timeout in milliseconds from config
    pub fn timeout_ms(&self) -> Option<u64> {
        self.config
            .get("timeout_ms")
            .and_then(|v| v.as_u64())
    }

    /// Get max file size from config (for file operations)
    pub fn max_file_size(&self) -> Option<u64> {
        self.config
            .get("max_file_size")
            .and_then(|v| v.as_u64())
    }

    /// Get max results from config (for search operations)
    pub fn max_results(&self) -> Option<usize> {
        self.config
            .get("max_results")
            .and_then(|v| v.as_u64())
            .map(|v| v as usize)
    }

    /// Get allowed commands from config (for bash)
    pub fn allowed_commands(&self) -> Option<Vec<String>> {
        self.config
            .get("allowed_commands")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
    }

    /// Get blacklist patterns from config (for bash)
    pub fn blacklist_patterns(&self) -> Option<Vec<String>> {
        self.config
            .get("blacklist_patterns")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
    }

    /// Get a custom config value
    pub fn get_config<T: serde::de::DeserializeOwned>(&self, key: &str) -> Option<T> {
        self.config
            .get(key)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
    }

    /// Validate tool configuration
    pub fn validate(&self) -> crate::error::ModeResult<()> {
        use crate::error::ModeError;

        // Validate name is not empty
        if self.name.is_empty() {
            return Err(ModeError::InvalidDefinition(
                "Tool name cannot be empty".into(),
            ));
        }

        // Validate module is not empty
        if self.module.is_empty() {
            return Err(ModeError::InvalidDefinition(
                "Tool module cannot be empty".into(),
            ));
        }

        // Validate timeout if present
        if let Some(timeout) = self.timeout_ms() {
            if timeout == 0 {
                return Err(ModeError::InvalidDefinition(
                    "Tool timeout_ms must be greater than 0".into(),
                ));
            }
            if timeout > 600_000 {
                // 10 minutes max
                return Err(ModeError::InvalidDefinition(
                    "Tool timeout_ms cannot exceed 600000 (10 minutes)".into(),
                ));
            }
        }

        // Validate max_file_size if present
        if let Some(size) = self.max_file_size() {
            if size == 0 {
                return Err(ModeError::InvalidDefinition(
                    "Tool max_file_size must be greater than 0".into(),
                ));
            }
        }

        // Validate max_results if present
        if let Some(results) = self.max_results() {
            if results == 0 {
                return Err(ModeError::InvalidDefinition(
                    "Tool max_results must be greater than 0".into(),
                ));
            }
        }

        Ok(())
    }
}

/// Collection of tool configurations
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct ToolConfigSet {
    tools: Vec<ToolConfig>,
}

impl ToolConfigSet {
    /// Create a new empty tool config set
    pub fn new() -> Self {
        Self { tools: Vec::new() }
    }

    /// Add a tool configuration
    pub fn add(&mut self, tool: ToolConfig) {
        self.tools.push(tool);
    }

    /// Get a tool by name
    pub fn get(&self, name: &str) -> Option<&ToolConfig> {
        self.tools.iter().find(|t| t.name == name)
    }

    /// Get all enabled tools
    pub fn enabled_tools(&self) -> Vec<&ToolConfig> {
        self.tools.iter().filter(|t| t.enabled).collect()
    }

    /// Get all tools in a module
    pub fn tools_in_module(&self, module: &str) -> Vec<&ToolConfig> {
        self.tools.iter().filter(|t| t.module == module).collect()
    }

    /// Check if a tool is enabled
    pub fn is_enabled(&self, name: &str) -> bool {
        self.get(name).map(|t| t.enabled).unwrap_or(false)
    }

    /// Validate all tool configurations
    pub fn validate_all(&self) -> crate::error::ModeResult<()> {
        for tool in &self.tools {
            tool.validate()?;
        }
        Ok(())
    }

    /// Get total number of tools
    pub fn len(&self) -> usize {
        self.tools.len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.tools.is_empty()
    }

    /// Iterate over all tools
    pub fn iter(&self) -> impl Iterator<Item = &ToolConfig> {
        self.tools.iter()
    }
}

impl From<Vec<ToolConfig>> for ToolConfigSet {
    fn from(tools: Vec<ToolConfig>) -> Self {
        Self { tools }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_tool_config_new() {
        let tool = ToolConfig::new("read", "file_operations");
        assert_eq!(tool.name, "read");
        assert_eq!(tool.module, "file_operations");
        assert!(tool.enabled);
    }

    #[test]
    fn test_tool_config_with_config() {
        let config = json!({
            "timeout_ms": 30000,
            "max_file_size": 10485760
        });
        let tool = ToolConfig::with_config("read", "file_operations", config);
        assert_eq!(tool.timeout_ms(), Some(30000));
        assert_eq!(tool.max_file_size(), Some(10485760));
    }

    #[test]
    fn test_tool_config_disabled() {
        let tool = ToolConfig::new("bash", "command").disabled();
        assert!(!tool.enabled);
    }

    #[test]
    fn test_timeout_extraction() {
        let config = json!({"timeout_ms": 60000});
        let tool = ToolConfig::with_config("grep", "search", config);
        assert_eq!(tool.timeout_ms(), Some(60000));
    }

    #[test]
    fn test_allowed_commands() {
        let config = json!({
            "allowed_commands": ["cargo", "git", "ls"]
        });
        let tool = ToolConfig::with_config("bash", "command", config);
        let commands = tool.allowed_commands().unwrap();
        assert_eq!(commands, vec!["cargo", "git", "ls"]);
    }

    #[test]
    fn test_blacklist_patterns() {
        let config = json!({
            "blacklist_patterns": ["rm -rf", "sudo"]
        });
        let tool = ToolConfig::with_config("bash", "command", config);
        let patterns = tool.blacklist_patterns().unwrap();
        assert_eq!(patterns, vec!["rm -rf", "sudo"]);
    }

    #[test]
    fn test_validate_empty_name() {
        let mut tool = ToolConfig::new("read", "file_operations");
        tool.name = String::new();
        assert!(tool.validate().is_err());
    }

    #[test]
    fn test_validate_empty_module() {
        let mut tool = ToolConfig::new("read", "file_operations");
        tool.module = String::new();
        assert!(tool.validate().is_err());
    }

    #[test]
    fn test_validate_zero_timeout() {
        let config = json!({"timeout_ms": 0});
        let tool = ToolConfig::with_config("read", "file_operations", config);
        assert!(tool.validate().is_err());
    }

    #[test]
    fn test_validate_excessive_timeout() {
        let config = json!({"timeout_ms": 700000}); // > 10 minutes
        let tool = ToolConfig::with_config("read", "file_operations", config);
        assert!(tool.validate().is_err());
    }

    #[test]
    fn test_validate_valid_config() {
        let config = json!({
            "timeout_ms": 30000,
            "max_file_size": 10485760
        });
        let tool = ToolConfig::with_config("read", "file_operations", config);
        assert!(tool.validate().is_ok());
    }

    #[test]
    fn test_tool_config_set() {
        let mut set = ToolConfigSet::new();
        set.add(ToolConfig::new("read", "file_operations"));
        set.add(ToolConfig::new("grep", "search"));

        assert_eq!(set.len(), 2);
        assert!(set.get("read").is_some());
        assert!(set.is_enabled("read"));
    }

    #[test]
    fn test_enabled_tools() {
        let mut set = ToolConfigSet::new();
        set.add(ToolConfig::new("read", "file_operations"));
        set.add(ToolConfig::new("bash", "command").disabled());

        let enabled = set.enabled_tools();
        assert_eq!(enabled.len(), 1);
        assert_eq!(enabled[0].name, "read");
    }

    #[test]
    fn test_tools_in_module() {
        let mut set = ToolConfigSet::new();
        set.add(ToolConfig::new("read", "file_operations"));
        set.add(ToolConfig::new("write", "file_operations"));
        set.add(ToolConfig::new("grep", "search"));

        let file_ops = set.tools_in_module("file_operations");
        assert_eq!(file_ops.len(), 2);
    }

    #[test]
    fn test_yaml_deserialization() {
        let yaml = r#"
name: "read"
module: "file_operations"
enabled: true
config:
  timeout_ms: 30000
  max_file_size: 10485760
"#;
        let tool: ToolConfig = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(tool.name, "read");
        assert_eq!(tool.timeout_ms(), Some(30000));
    }
}
