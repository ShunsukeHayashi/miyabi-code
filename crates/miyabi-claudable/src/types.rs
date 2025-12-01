//! Request and response types for Claudable API

use serde::{Deserialize, Serialize};

/// Request to generate a Next.js application
#[derive(Debug, Clone, Serialize)]
pub struct GenerateRequest {
    /// Natural language description of the app to generate
    pub description: String,

    /// Framework to use (default: "nextjs")
    pub framework: String,

    /// AI agent to use (default: "claude-code")
    pub agent: String,

    /// Generation options
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<GenerateOptions>,
}

/// Options for code generation
#[derive(Debug, Clone, Serialize)]
pub struct GenerateOptions {
    /// Use TypeScript (default: true)
    #[serde(default = "default_true")]
    pub typescript: bool,

    /// Use Tailwind CSS (default: true)
    #[serde(default = "default_true")]
    pub tailwind: bool,

    /// Use shadcn/ui components (default: true)
    #[serde(default = "default_true")]
    pub shadcn: bool,

    /// Use Supabase backend (default: false)
    #[serde(default)]
    pub supabase: bool,
}

#[allow(dead_code)]
fn default_true() -> bool {
    true
}

impl Default for GenerateOptions {
    fn default() -> Self {
        Self { typescript: true, tailwind: true, shadcn: true, supabase: false }
    }
}

/// Response from generate endpoint
#[derive(Debug, Clone, Deserialize)]
pub struct GenerateResponse {
    /// Unique project ID
    pub project_id: String,

    /// Generated files
    pub files: Vec<GeneratedFile>,

    /// NPM dependencies to install
    pub dependencies: Vec<String>,

    /// Project structure
    pub structure: ProjectStructure,
}

/// A single generated file
#[derive(Debug, Clone, Deserialize)]
pub struct GeneratedFile {
    /// File path relative to project root
    pub path: String,

    /// File content
    pub content: String,

    /// File type (e.g., "typescript", "css", "json")
    #[serde(rename = "type")]
    pub file_type: String,
}

/// Project directory structure
#[derive(Debug, Clone, Deserialize)]
pub struct ProjectStructure {
    /// Files in app/ directory
    #[serde(default)]
    pub app: Vec<String>,

    /// Files in components/ directory
    #[serde(default)]
    pub components: Vec<String>,

    /// Files in lib/ directory
    #[serde(default)]
    pub lib: Vec<String>,

    /// Files in public/ directory
    #[serde(default)]
    pub public: Vec<String>,
}

impl GenerateRequest {
    /// Create a new generate request with default options
    pub fn new(description: impl Into<String>) -> Self {
        Self {
            description: description.into(),
            framework: "nextjs".to_string(),
            agent: "claude-code".to_string(),
            options: Some(GenerateOptions::default()),
        }
    }

    /// Set the AI agent to use
    pub fn with_agent(mut self, agent: impl Into<String>) -> Self {
        self.agent = agent.into();
        self
    }

    /// Set custom generation options
    pub fn with_options(mut self, options: GenerateOptions) -> Self {
        self.options = Some(options);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_request_new() {
        let request = GenerateRequest::new("Create a dashboard");
        assert_eq!(request.description, "Create a dashboard");
        assert_eq!(request.framework, "nextjs");
        assert_eq!(request.agent, "claude-code");
        assert!(request.options.is_some());
    }

    #[test]
    fn test_generate_request_with_agent() {
        let request = GenerateRequest::new("Create app").with_agent("cursor");
        assert_eq!(request.agent, "cursor");
    }

    #[test]
    fn test_generate_options_default() {
        let options = GenerateOptions::default();
        assert!(options.typescript);
        assert!(options.tailwind);
        assert!(options.shadcn);
        assert!(!options.supabase);
    }

    #[test]
    fn test_request_serialization() {
        let request = GenerateRequest::new("Test app");
        let json = serde_json::to_value(&request).unwrap();
        assert_eq!(json["description"], "Test app");
        assert_eq!(json["framework"], "nextjs");
    }

    #[test]
    fn test_response_deserialization() {
        let json = r#"{
            "project_id": "proj_123",
            "files": [
                {
                    "path": "app/page.tsx",
                    "content": "export default function Page() {}",
                    "type": "typescript"
                }
            ],
            "dependencies": ["next@14.0.0"],
            "structure": {
                "app": ["page.tsx"],
                "components": [],
                "lib": [],
                "public": []
            }
        }"#;

        let response: GenerateResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.project_id, "proj_123");
        assert_eq!(response.files.len(), 1);
        assert_eq!(response.files[0].path, "app/page.tsx");
        assert_eq!(response.dependencies.len(), 1);
    }
}
