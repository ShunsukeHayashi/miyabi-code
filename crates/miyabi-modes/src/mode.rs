use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Adaptive mode definition - inspired by Roo-Code's .roomodes system
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MiyabiMode {
    /// URL-safe identifier (e.g., "codegen", "review")
    pub slug: String,

    /// Display name with emoji (e.g., "🛠️ Code Generator")
    pub name: String,

    /// Character name (e.g., "つくるん")
    pub character: String,

    /// Role definition for LLM prompt (may contain ${VAR} templates)
    #[serde(rename = "roleDefinition")]
    pub role_definition: String,

    /// When to use this mode
    #[serde(rename = "whenToUse")]
    pub when_to_use: String,

    /// Allowed tool groups
    pub groups: Vec<ToolGroup>,

    /// Custom instructions for the mode (may contain ${VAR} templates)
    #[serde(rename = "customInstructions")]
    pub custom_instructions: String,

    /// Source: "miyabi-core" for system modes, "user" for custom
    pub source: String,

    /// Optional file regex restriction
    #[serde(rename = "fileRegex", default, skip_serializing_if = "Option::is_none")]
    pub file_regex: Option<String>,

    /// Optional description (shorter than when_to_use)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Optional custom template arguments (Phase 2.1)
    #[serde(
        rename = "systemPromptArgs",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub system_prompt_args: Option<HashMap<String, String>>,

    /// Optional tool configurations (Phase 2.2)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tools: Vec<crate::tool_config::ToolConfig>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ToolGroup {
    Read,
    Edit,
    Command,
    Git,
    Browser,
    Mcp,
}

impl MiyabiMode {
    /// Check if this mode allows a specific tool group
    pub fn allows_tool(&self, group: &ToolGroup) -> bool {
        self.groups.contains(group)
    }

    /// Check if a file matches the mode's regex restriction
    pub fn matches_file(&self, path: &str) -> Result<bool, regex::Error> {
        match &self.file_regex {
            Some(pattern) => {
                let re = regex::Regex::new(pattern)?;
                Ok(re.is_match(path))
            }
            None => Ok(true), // No restriction means all files allowed
        }
    }

    /// Get short description or truncated when_to_use
    pub fn short_description(&self) -> &str {
        self.description.as_deref().unwrap_or_else(|| {
            if self.when_to_use.len() > 80 {
                &self.when_to_use[..80]
            } else {
                &self.when_to_use
            }
        })
    }

    /// Check if this is a system mode
    pub fn is_system_mode(&self) -> bool {
        self.source == "miyabi-core"
    }

    /// Check if this is a user custom mode
    pub fn is_custom_mode(&self) -> bool {
        self.source == "user"
    }

    /// Render templates in role definition and custom instructions
    pub fn render_templates(
        &self,
        renderer: &crate::template::TemplateRenderer,
    ) -> crate::error::ModeResult<Self> {
        let custom_args = self.system_prompt_args.clone().unwrap_or_default();

        Ok(Self {
            role_definition: renderer.render(&self.role_definition, &custom_args)?,
            custom_instructions: renderer.render(&self.custom_instructions, &custom_args)?,
            ..self.clone()
        })
    }

    /// Get a tool configuration by name
    pub fn get_tool(&self, name: &str) -> Option<&crate::tool_config::ToolConfig> {
        self.tools.iter().find(|t| t.name == name)
    }

    /// Check if a tool is enabled
    pub fn is_tool_enabled(&self, name: &str) -> bool {
        self.get_tool(name).map(|t| t.enabled).unwrap_or(false)
    }

    /// Get all enabled tools
    pub fn enabled_tools(&self) -> Vec<&crate::tool_config::ToolConfig> {
        self.tools.iter().filter(|t| t.enabled).collect()
    }

    /// Validate all tool configurations
    pub fn validate_tools(&self) -> crate::error::ModeResult<()> {
        for tool in &self.tools {
            tool.validate()?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_allows_tool() {
        let mode = MiyabiMode {
            slug: "test".into(),
            name: "Test Mode".into(),
            character: "てすとん".into(),
            role_definition: "Test".into(),
            when_to_use: "Test".into(),
            groups: vec![ToolGroup::Read, ToolGroup::Edit],
            custom_instructions: "Test".into(),
            source: "user".into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
            tools: vec![],
        };

        assert!(mode.allows_tool(&ToolGroup::Read));
        assert!(mode.allows_tool(&ToolGroup::Edit));
        assert!(!mode.allows_tool(&ToolGroup::Command));
    }

    #[test]
    fn test_matches_file() {
        let mode = MiyabiMode {
            slug: "rust".into(),
            name: "Rust Mode".into(),
            character: "さびるん".into(),
            role_definition: "Rust".into(),
            when_to_use: "Rust".into(),
            groups: vec![ToolGroup::Read],
            custom_instructions: "Rust".into(),
            source: "user".into(),
            file_regex: Some(r".*\.rs$".into()),
            description: None,
            system_prompt_args: None,
            tools: vec![],
        };

        assert!(mode.matches_file("main.rs").unwrap());
        assert!(mode.matches_file("src/lib.rs").unwrap());
        assert!(!mode.matches_file("README.md").unwrap());
    }

    #[test]
    fn test_mode_classification() {
        let system_mode = MiyabiMode {
            slug: "codegen".into(),
            name: "CodeGen".into(),
            character: "つくるん".into(),
            role_definition: "".into(),
            when_to_use: "".into(),
            groups: vec![],
            custom_instructions: "".into(),
            source: "miyabi-core".into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
            tools: vec![],
        };

        assert!(system_mode.is_system_mode());
        assert!(!system_mode.is_custom_mode());

        let custom_mode = MiyabiMode {
            source: "user".into(),
            ..system_mode.clone()
        };

        assert!(!custom_mode.is_system_mode());
        assert!(custom_mode.is_custom_mode());
    }

    #[test]
    fn test_render_templates() {
        use crate::template::TemplateRenderer;
        use std::env;

        let mode = MiyabiMode {
            slug: "test".into(),
            name: "Test".into(),
            character: "てすと".into(),
            role_definition: "Working in ${MIYABI_WORK_DIR}".into(),
            when_to_use: "Test".into(),
            groups: vec![],
            custom_instructions: "Current time: ${MIYABI_NOW}".into(),
            source: "user".into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
            tools: vec![],
        };

        let renderer = TemplateRenderer::new(env::current_dir().unwrap());
        let rendered_mode = mode.render_templates(&renderer).unwrap();

        assert!(rendered_mode
            .role_definition
            .contains(&env::current_dir().unwrap().display().to_string()));
        assert!(rendered_mode
            .custom_instructions
            .contains("Current time: 2"));
    }

    #[test]
    fn test_tool_config_integration() {
        use crate::tool_config::ToolConfig;
        use serde_json::json;

        let config = json!({"timeout_ms": 30000});
        let tool = ToolConfig::with_config("read", "file_operations", config);

        let mode = MiyabiMode {
            slug: "test".into(),
            name: "Test".into(),
            character: "てすと".into(),
            role_definition: "Test".into(),
            when_to_use: "Test".into(),
            groups: vec![],
            custom_instructions: "Test".into(),
            source: "user".into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
            tools: vec![tool],
        };

        assert!(mode.is_tool_enabled("read"));
        assert!(!mode.is_tool_enabled("write"));
        assert_eq!(mode.enabled_tools().len(), 1);
        assert!(mode.validate_tools().is_ok());
    }
}
