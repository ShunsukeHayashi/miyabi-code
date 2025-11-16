//! Project-specific rules support (.miyabirules)
//!
//! This module provides support for loading and applying custom rules from `.miyabirules` files,
//! similar to Cline's `.clinerules` functionality.

use crate::error::{ErrorCode, UnifiedError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

/// Error types for rules operations
#[derive(Error, Debug)]
pub enum RulesError {
    /// File not found
    #[error("Rules file not found: {0}")]
    FileNotFound(PathBuf),

    /// Parse error
    #[error("Failed to parse rules file: {0}")]
    ParseError(String),

    /// Validation error
    #[error("Validation error: {0}")]
    ValidationError(String),

    /// I/O error
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),
}

impl RulesError {
    /// Get error code for programmatic handling
    ///
    /// # Returns
    ///
    /// A static string identifier for this error type, useful for:
    /// - Programmatic error handling
    /// - Documentation references
    /// - Metrics/monitoring
    /// - Internationalization
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_core::rules::RulesError;
    /// use std::path::PathBuf;
    ///
    /// let error = RulesError::FileNotFound(PathBuf::from("/tmp/test"));
    /// assert_eq!(error.code(), "RULES_FILE_NOT_FOUND");
    /// ```
    pub fn code(&self) -> &'static str {
        match self {
            Self::FileNotFound(_) => "RULES_FILE_NOT_FOUND",
            Self::ParseError(_) => "RULES_PARSE_ERROR",
            Self::ValidationError(_) => "RULES_VALIDATION_ERROR",
            Self::IoError(_) => "RULES_IO_ERROR",
        }
    }

    /// Get user-friendly error message
    ///
    /// Returns a simplified, actionable message suitable for end users.
    pub fn user_message(&self) -> String {
        match self {
            Self::FileNotFound(path) => {
                format!("Could not find rules file: {}", path.display())
            },
            Self::ParseError(msg) => {
                format!("Rules file format is invalid: {}", msg)
            },
            Self::ValidationError(msg) => {
                format!("Rules configuration error: {}", msg)
            },
            Self::IoError(_) => "Unable to read rules file. Check file permissions.".to_string(),
        }
    }
}

// Implement the UnifiedError trait for RulesError
impl UnifiedError for RulesError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::FileNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::ParseError(_) => ErrorCode::PARSE_ERROR,
            Self::ValidationError(_) => ErrorCode::VALIDATION_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
        }
    }

    fn user_message(&self) -> String {
        // Reuse the existing user_message implementation
        RulesError::user_message(self)
    }

    fn context(&self) -> Option<&dyn std::any::Any> {
        None
    }
}

pub type Result<T> = std::result::Result<T, RulesError>;

/// A single rule with pattern matching and suggestion
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Rule {
    /// Rule name
    pub name: String,

    /// Pattern to match (regex)
    #[serde(default)]
    pub pattern: Option<String>,

    /// Suggestion message
    pub suggestion: String,

    /// File extension filters (e.g., ["rs", "toml"])
    #[serde(default)]
    pub file_extensions: Vec<String>,

    /// Severity: "info", "warning", "error"
    #[serde(default = "default_severity")]
    pub severity: String,

    /// Whether this rule is enabled
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_severity() -> String {
    "info".to_string()
}

fn default_enabled() -> bool {
    true
}

impl Rule {
    /// Check if this rule applies to a given file extension
    pub fn applies_to_file(&self, file_path: &Path) -> bool {
        if self.file_extensions.is_empty() {
            return true; // Applies to all files
        }

        if let Some(ext) = file_path.extension() {
            let ext_str = ext.to_string_lossy().to_string();
            self.file_extensions.iter().any(|e| e == &ext_str)
        } else {
            false
        }
    }

    /// Check if this rule matches a given line of code
    pub fn matches(&self, line: &str) -> bool {
        if let Some(pattern) = &self.pattern {
            // Simple substring match for now (can be upgraded to regex)
            line.contains(pattern)
        } else {
            false
        }
    }
}

/// Agent-specific preferences
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct AgentPreferences {
    /// Code style preference
    #[serde(default)]
    pub style: Option<String>,

    /// Error handling strategy
    #[serde(default)]
    pub error_handling: Option<String>,

    /// Minimum quality score
    #[serde(default)]
    pub min_score: Option<u8>,

    /// Enable strict Clippy checks
    #[serde(default)]
    pub clippy_strict: Option<bool>,

    /// Custom agent-specific settings
    #[serde(flatten)]
    pub custom: HashMap<String, serde_json::Value>,
}

/// Root configuration structure for .miyabirules
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MiyabiRules {
    /// Version of the rules format
    #[serde(default = "default_version")]
    pub version: u32,

    /// List of rules
    #[serde(default)]
    pub rules: Vec<Rule>,

    /// Agent preferences by agent type
    #[serde(default)]
    pub agent_preferences: HashMap<String, AgentPreferences>,

    /// Global settings
    #[serde(default)]
    pub settings: HashMap<String, serde_json::Value>,
}

fn default_version() -> u32 {
    1
}

impl Default for MiyabiRules {
    fn default() -> Self {
        Self {
            version: 1,
            rules: Vec::new(),
            agent_preferences: HashMap::new(),
            settings: HashMap::new(),
        }
    }
}

impl MiyabiRules {
    /// Create a new empty rules configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Validate the rules configuration
    pub fn validate(&self) -> Result<()> {
        // Check version
        if self.version != 1 {
            return Err(RulesError::ValidationError(format!(
                "Unsupported version: {}. Only version 1 is supported.",
                self.version
            )));
        }

        // Validate rules
        for rule in &self.rules {
            if rule.name.is_empty() {
                return Err(RulesError::ValidationError("Rule name cannot be empty".to_string()));
            }

            if rule.suggestion.is_empty() {
                return Err(RulesError::ValidationError(format!(
                    "Rule '{}' must have a suggestion",
                    rule.name
                )));
            }

            // Validate severity
            match rule.severity.as_str() {
                "info" | "warning" | "error" => {},
                _ => {
                    return Err(RulesError::ValidationError(format!(
                        "Invalid severity '{}' for rule '{}'. Must be: info, warning, or error",
                        rule.severity, rule.name
                    )))
                },
            }
        }

        Ok(())
    }

    /// Get rules that apply to a specific file
    pub fn rules_for_file(&self, file_path: &Path) -> Vec<&Rule> {
        self.rules
            .iter()
            .filter(|r| r.enabled && r.applies_to_file(file_path))
            .collect()
    }

    /// Get agent preferences for a specific agent type
    pub fn get_agent_preferences(&self, agent_type: &str) -> Option<&AgentPreferences> {
        self.agent_preferences.get(agent_type)
    }

    /// Get a global setting value
    pub fn get_setting(&self, key: &str) -> Option<&serde_json::Value> {
        self.settings.get(key)
    }
}

/// Rules loader for loading .miyabirules files
pub struct RulesLoader {
    /// Root directory to search for .miyabirules
    root_dir: PathBuf,
}

impl RulesLoader {
    /// Create a new RulesLoader
    ///
    /// # Arguments
    ///
    /// * `root_dir` - Root directory to search for .miyabirules
    pub fn new(root_dir: PathBuf) -> Self {
        Self { root_dir }
    }

    /// Find .miyabirules file in the directory hierarchy
    ///
    /// Searches upward from the current directory to find .miyabirules
    pub fn find_rules_file(&self) -> Option<PathBuf> {
        let mut current = self.root_dir.clone();

        loop {
            let rules_path = current.join(".miyabirules");
            if rules_path.exists() {
                return Some(rules_path);
            }

            let rules_yaml = current.join(".miyabirules.yaml");
            if rules_yaml.exists() {
                return Some(rules_yaml);
            }

            let rules_yml = current.join(".miyabirules.yml");
            if rules_yml.exists() {
                return Some(rules_yml);
            }

            // Move up one directory
            if !current.pop() {
                break;
            }
        }

        None
    }

    /// Load rules from .miyabirules file
    ///
    /// # Returns
    ///
    /// Returns `Ok(Some(rules))` if file found and valid,
    /// `Ok(None)` if file not found,
    /// `Err` if file found but invalid
    pub fn load(&self) -> Result<Option<MiyabiRules>> {
        let rules_path = match self.find_rules_file() {
            Some(path) => path,
            None => return Ok(None),
        };

        let content = fs::read_to_string(&rules_path)?;

        let rules: MiyabiRules = serde_yaml::from_str(&content).map_err(|e| {
            RulesError::ParseError(format!("Failed to parse {}: {}", rules_path.display(), e))
        })?;

        // Validate rules
        rules.validate()?;

        Ok(Some(rules))
    }

    /// Load rules or return default if not found
    pub fn load_or_default(&self) -> Result<MiyabiRules> {
        self.load().map(|opt| opt.unwrap_or_default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_rules() -> MiyabiRules {
        MiyabiRules {
            version: 1,
            rules: vec![
                Rule {
                    name: "Use async-trait".to_string(),
                    pattern: Some("trait.*\\{".to_string()),
                    suggestion: "Add #[async_trait] for async methods".to_string(),
                    file_extensions: vec!["rs".to_string()],
                    severity: "warning".to_string(),
                    enabled: true,
                },
                Rule {
                    name: "Prefer Result over Option".to_string(),
                    pattern: Some("fn.*-> Option<".to_string()),
                    suggestion: "Use Result for better error context".to_string(),
                    file_extensions: vec!["rs".to_string()],
                    severity: "info".to_string(),
                    enabled: true,
                },
            ],
            agent_preferences: {
                let mut prefs = HashMap::new();
                prefs.insert(
                    "codegen".to_string(),
                    AgentPreferences {
                        style: Some("idiomatic".to_string()),
                        error_handling: Some("thiserror".to_string()),
                        ..Default::default()
                    },
                );
                prefs.insert(
                    "review".to_string(),
                    AgentPreferences {
                        min_score: Some(85),
                        clippy_strict: Some(true),
                        ..Default::default()
                    },
                );
                prefs
            },
            settings: HashMap::new(),
        }
    }

    #[test]
    fn test_rule_creation() {
        let rule = Rule {
            name: "Test rule".to_string(),
            pattern: Some("test".to_string()),
            suggestion: "Test suggestion".to_string(),
            file_extensions: vec!["rs".to_string()],
            severity: "info".to_string(),
            enabled: true,
        };

        assert_eq!(rule.name, "Test rule");
        assert_eq!(rule.severity, "info");
        assert!(rule.enabled);
    }

    #[test]
    fn test_rule_applies_to_file() {
        let rule = Rule {
            name: "Rust rule".to_string(),
            pattern: None,
            suggestion: "Test".to_string(),
            file_extensions: vec!["rs".to_string()],
            severity: "info".to_string(),
            enabled: true,
        };

        assert!(rule.applies_to_file(Path::new("main.rs")));
        assert!(!rule.applies_to_file(Path::new("main.py")));
    }

    #[test]
    fn test_rule_matches() {
        let rule = Rule {
            name: "Test".to_string(),
            pattern: Some("async".to_string()),
            suggestion: "Test".to_string(),
            file_extensions: vec![],
            severity: "info".to_string(),
            enabled: true,
        };

        assert!(rule.matches("async fn test() {}"));
        assert!(!rule.matches("fn test() {}"));
    }

    #[test]
    fn test_rules_validation() {
        let rules = create_test_rules();
        assert!(rules.validate().is_ok());
    }

    #[test]
    fn test_rules_validation_invalid_severity() {
        let mut rules = create_test_rules();
        rules.rules[0].severity = "invalid".to_string();
        assert!(rules.validate().is_err());
    }

    #[test]
    fn test_rules_for_file() {
        let rules = create_test_rules();
        let rs_rules = rules.rules_for_file(Path::new("main.rs"));
        assert_eq!(rs_rules.len(), 2);

        let py_rules = rules.rules_for_file(Path::new("main.py"));
        assert_eq!(py_rules.len(), 0);
    }

    #[test]
    fn test_get_agent_preferences() {
        let rules = create_test_rules();

        let codegen_prefs = rules.get_agent_preferences("codegen").unwrap();
        assert_eq!(codegen_prefs.style.as_deref(), Some("idiomatic"));

        let review_prefs = rules.get_agent_preferences("review").unwrap();
        assert_eq!(review_prefs.min_score, Some(85));

        assert!(rules.get_agent_preferences("nonexistent").is_none());
    }

    #[test]
    fn test_rules_loader_find() {
        let temp_dir = TempDir::new().unwrap();
        let sub_dir = temp_dir.path().join("sub");
        fs::create_dir(&sub_dir).unwrap();

        // Create .miyabirules in parent
        let rules_path = temp_dir.path().join(".miyabirules");
        fs::write(&rules_path, "version: 1\nrules: []").unwrap();

        // Search from subdirectory
        let loader = RulesLoader::new(sub_dir.clone());
        let found = loader.find_rules_file();
        assert!(found.is_some());
        assert_eq!(found.unwrap(), rules_path);
    }

    #[test]
    fn test_rules_loader_load() {
        let temp_dir = TempDir::new().unwrap();
        let rules_yaml = r#"
version: 1
rules:
  - name: "Test rule"
    pattern: "test"
    suggestion: "Test suggestion"
    file_extensions: ["rs"]
    severity: "info"
    enabled: true
agent_preferences:
  codegen:
    style: "idiomatic"
"#;

        fs::write(temp_dir.path().join(".miyabirules"), rules_yaml).unwrap();

        let loader = RulesLoader::new(temp_dir.path().to_path_buf());
        let rules = loader.load().unwrap();
        assert!(rules.is_some());

        let rules = rules.unwrap();
        assert_eq!(rules.version, 1);
        assert_eq!(rules.rules.len(), 1);
        assert_eq!(rules.rules[0].name, "Test rule");
    }

    #[test]
    fn test_rules_loader_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let loader = RulesLoader::new(temp_dir.path().to_path_buf());
        let rules = loader.load().unwrap();
        assert!(rules.is_none());
    }

    #[test]
    fn test_rules_loader_default() {
        let temp_dir = TempDir::new().unwrap();
        let loader = RulesLoader::new(temp_dir.path().to_path_buf());
        let rules = loader.load_or_default().unwrap();
        assert_eq!(rules.version, 1);
        assert_eq!(rules.rules.len(), 0);
    }
}
