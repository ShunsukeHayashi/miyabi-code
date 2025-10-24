//! Rules context for agents
//!
//! This module provides integration between agents and .miyabirules files,
//! allowing agents to access project-specific custom rules and preferences.

use miyabi_core::rules::{MiyabiRules, RulesLoader};
use std::path::PathBuf;
use std::sync::Arc;

/// Rules context that can be shared across agents
#[derive(Debug, Clone)]
pub struct RulesContext {
    /// Loaded rules (optional - may not exist in project)
    rules: Option<Arc<MiyabiRules>>,

    /// Root directory where .miyabirules was loaded from
    root_dir: PathBuf,
}

impl RulesContext {
    /// Create a new RulesContext by loading .miyabirules from the project root
    ///
    /// # Arguments
    ///
    /// * `root_dir` - Project root directory to search for .miyabirules
    ///
    /// # Returns
    ///
    /// Returns a RulesContext with loaded rules if found, or empty context if not found.
    pub fn new(root_dir: PathBuf) -> Self {
        let loader = RulesLoader::new(root_dir.clone());
        let rules = loader.load().ok().flatten().map(Arc::new);

        if rules.is_some() {
            tracing::info!("Loaded .miyabirules from {}", root_dir.display());
        } else {
            tracing::debug!("No .miyabirules found in {}", root_dir.display());
        }

        Self { rules, root_dir }
    }

    /// Check if rules are loaded
    pub fn has_rules(&self) -> bool {
        self.rules.is_some()
    }

    /// Get the root directory where rules were loaded from
    pub fn root_dir(&self) -> &std::path::Path {
        &self.root_dir
    }

    /// Get the loaded rules
    pub fn rules(&self) -> Option<&MiyabiRules> {
        self.rules.as_ref().map(|arc| arc.as_ref())
    }

    /// Get agent-specific preference value
    ///
    /// # Arguments
    ///
    /// * `agent_type` - Agent type name (e.g., "codegen", "review")
    /// * `key` - Preference key to retrieve
    ///
    /// # Returns
    ///
    /// Returns the preference value as JSON, or None if not found
    pub fn get_agent_preference(&self, agent_type: &str, key: &str) -> Option<&serde_json::Value> {
        self.rules
            .as_ref()?
            .get_agent_preferences(agent_type)?
            .custom
            .get(key)
    }

    /// Get agent-specific style preference
    pub fn get_style(&self, agent_type: &str) -> Option<&str> {
        self.rules
            .as_ref()?
            .get_agent_preferences(agent_type)?
            .style
            .as_deref()
    }

    /// Get agent-specific error handling preference
    pub fn get_error_handling(&self, agent_type: &str) -> Option<&str> {
        self.rules
            .as_ref()?
            .get_agent_preferences(agent_type)?
            .error_handling
            .as_deref()
    }

    /// Get agent-specific minimum quality score
    pub fn get_min_score(&self, agent_type: &str) -> Option<u8> {
        self.rules
            .as_ref()?
            .get_agent_preferences(agent_type)?
            .min_score
    }

    /// Get agent-specific clippy strict mode
    pub fn get_clippy_strict(&self, agent_type: &str) -> Option<bool> {
        self.rules
            .as_ref()?
            .get_agent_preferences(agent_type)?
            .clippy_strict
    }

    /// Format agent preferences as a string for injection into prompts
    ///
    /// # Arguments
    ///
    /// * `agent_type` - Agent type name (e.g., "codegen", "review")
    ///
    /// # Returns
    ///
    /// Returns a formatted string with all preferences, suitable for prompt injection
    pub fn format_preferences_for_prompt(&self, agent_type: &str) -> String {
        let Some(rules) = &self.rules else {
            return String::new();
        };

        let Some(prefs) = rules.get_agent_preferences(agent_type) else {
            return String::new();
        };

        let mut output = vec![format!(
            "## Project-specific preferences for {}",
            agent_type
        )];

        if let Some(style) = &prefs.style {
            output.push(format!("- **Style**: {}", style));
        }

        if let Some(error_handling) = &prefs.error_handling {
            output.push(format!("- **Error Handling**: {}", error_handling));
        }

        if let Some(min_score) = prefs.min_score {
            output.push(format!("- **Minimum Quality Score**: {}", min_score));
        }

        if let Some(clippy_strict) = prefs.clippy_strict {
            output.push(format!("- **Clippy Strict Mode**: {}", clippy_strict));
        }

        // Add custom preferences
        for (key, value) in &prefs.custom {
            output.push(format!("- **{}**: {}", key, value));
        }

        output.join("\n")
    }

    /// Format applicable rules for a specific file as a string for prompt injection
    ///
    /// # Arguments
    ///
    /// * `file_path` - Path to the file being processed
    ///
    /// # Returns
    ///
    /// Returns a formatted string with applicable rules
    pub fn format_rules_for_file(&self, file_path: &std::path::Path) -> String {
        let Some(rules) = &self.rules else {
            return String::new();
        };

        let applicable_rules = rules.rules_for_file(file_path);

        if applicable_rules.is_empty() {
            return String::new();
        }

        let mut output = vec![format!("## Coding rules for {}", file_path.display())];

        for rule in applicable_rules {
            output.push(format!(
                "- **{}** ({}): {}",
                rule.name, rule.severity, rule.suggestion
            ));
        }

        output.join("\n")
    }
}

impl Default for RulesContext {
    fn default() -> Self {
        Self::new(std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    
    use std::fs;
    use tempfile::TempDir;

    fn create_test_rules_file(dir: &std::path::Path) {
        let rules_yaml = r#"
version: 1
rules:
  - name: "Use async-trait"
    pattern: "trait"
    suggestion: "Add #[async_trait]"
    file_extensions: ["rs"]
    severity: "warning"
    enabled: true
agent_preferences:
  codegen:
    style: "idiomatic"
    error_handling: "thiserror"
  review:
    min_score: 85
    clippy_strict: true
"#;
        fs::write(dir.join(".miyabirules"), rules_yaml).unwrap();
    }

    #[test]
    fn test_rules_context_new() {
        let temp_dir = TempDir::new().unwrap();
        create_test_rules_file(temp_dir.path());

        let context = RulesContext::new(temp_dir.path().to_path_buf());
        assert!(context.has_rules());
    }

    #[test]
    fn test_rules_context_no_file() {
        let temp_dir = TempDir::new().unwrap();
        let context = RulesContext::new(temp_dir.path().to_path_buf());
        assert!(!context.has_rules());
    }

    #[test]
    fn test_get_agent_preferences() {
        let temp_dir = TempDir::new().unwrap();
        create_test_rules_file(temp_dir.path());

        let context = RulesContext::new(temp_dir.path().to_path_buf());

        assert_eq!(context.get_style("codegen"), Some("idiomatic"));
        assert_eq!(context.get_error_handling("codegen"), Some("thiserror"));
        assert_eq!(context.get_min_score("review"), Some(85));
        assert_eq!(context.get_clippy_strict("review"), Some(true));
    }

    #[test]
    fn test_format_preferences_for_prompt() {
        let temp_dir = TempDir::new().unwrap();
        create_test_rules_file(temp_dir.path());

        let context = RulesContext::new(temp_dir.path().to_path_buf());
        let prompt = context.format_preferences_for_prompt("codegen");

        assert!(prompt.contains("Project-specific preferences for codegen"));
        assert!(prompt.contains("Style"));
        assert!(prompt.contains("idiomatic"));
        assert!(prompt.contains("Error Handling"));
        assert!(prompt.contains("thiserror"));
    }

    #[test]
    fn test_format_rules_for_file() {
        let temp_dir = TempDir::new().unwrap();
        create_test_rules_file(temp_dir.path());

        let context = RulesContext::new(temp_dir.path().to_path_buf());
        let rules = context.format_rules_for_file(std::path::Path::new("main.rs"));

        assert!(rules.contains("Coding rules for main.rs"));
        assert!(rules.contains("Use async-trait"));
        assert!(rules.contains("warning"));
    }
}
