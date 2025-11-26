//! Documentation generation utilities
//!
//! Provides utilities for generating documentation:
//! - Rustdoc generation via `cargo doc`
//! - README.md generation with code examples
//! - Code snippet extraction and formatting
//! - Documentation validation

use miyabi_types::error::{MiyabiError, Result};
use std::path::{Path, PathBuf};
use std::process::Stdio;

/// Configuration for documentation generation
#[derive(Debug, Clone)]
pub struct DocumentationConfig {
    /// Path to the project root
    pub project_root: PathBuf,
    /// Generate documentation for private items
    pub document_private_items: bool,
    /// Open documentation in browser after generation
    pub open_browser: bool,
    /// Include dependencies documentation
    pub no_deps: bool,
}

impl Default for DocumentationConfig {
    fn default() -> Self {
        Self {
            project_root: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            document_private_items: false,
            open_browser: false,
            no_deps: true,
        }
    }
}

impl DocumentationConfig {
    /// Create a new configuration with project root
    pub fn new(project_root: impl Into<PathBuf>) -> Self {
        Self {
            project_root: project_root.into(),
            ..Default::default()
        }
    }

    /// Enable documentation for private items
    pub fn with_private_items(mut self) -> Self {
        self.document_private_items = true;
        self
    }

    /// Open documentation in browser after generation
    pub fn with_browser(mut self) -> Self {
        self.open_browser = true;
        self
    }

    /// Include dependencies documentation
    pub fn with_deps(mut self) -> Self {
        self.no_deps = false;
        self
    }
}

/// Result of documentation generation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentationResult {
    /// Path to generated documentation
    pub doc_path: String,
    /// Number of items documented
    pub items_documented: u32,
    /// Warnings generated during documentation
    pub warnings: Vec<String>,
    /// Whether documentation was successful
    pub success: bool,
}

/// Generate Rustdoc documentation
///
/// Runs `cargo doc` with the provided configuration
///
/// # Arguments
/// * `config` - Documentation configuration
///
/// # Returns
/// * `Ok(DocumentationResult)` - Documentation generated successfully
/// * `Err(MiyabiError)` - Failed to generate documentation
pub async fn generate_rustdoc(config: &DocumentationConfig) -> Result<DocumentationResult> {
    tracing::info!("Generating Rustdoc at {:?}", config.project_root);

    let mut cmd = tokio::process::Command::new("cargo");
    cmd.arg("doc")
        .current_dir(&config.project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Add flags based on config
    if config.document_private_items {
        cmd.arg("--document-private-items");
    }

    if config.open_browser {
        cmd.arg("--open");
    }

    if config.no_deps {
        cmd.arg("--no-deps");
    }

    // Execute command
    let output = cmd.output().await.map_err(|e| {
        MiyabiError::Io(std::io::Error::new(
            e.kind(),
            format!("Failed to execute cargo doc: {}", e),
        ))
    })?;

    let _stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // Parse warnings from stderr
    let warnings: Vec<String> = stderr
        .lines()
        .filter(|line| line.contains("warning:"))
        .map(|s| s.to_string())
        .collect();

    // Determine doc path (usually target/doc)
    let doc_path = config.project_root.join("target").join("doc");

    let success = output.status.success();

    if !success {
        return Err(MiyabiError::Unknown(format!(
            "cargo doc failed: {}",
            stderr
        )));
    }

    tracing::info!("Documentation generated successfully at {:?}", doc_path);

    Ok(DocumentationResult {
        doc_path: doc_path.to_string_lossy().to_string(),
        items_documented: 0, // cargo doc doesn't provide this
        warnings,
        success,
    })
}

/// README template structure
#[derive(Debug, Clone)]
pub struct ReadmeTemplate {
    /// Project name
    pub project_name: String,
    /// Project description
    pub description: String,
    /// Installation instructions
    pub installation: Option<String>,
    /// Usage examples
    pub usage_examples: Vec<CodeExample>,
    /// API documentation link
    pub api_docs_link: Option<String>,
    /// License information
    pub license: Option<String>,
}

/// Code example for README
#[derive(Debug, Clone)]
pub struct CodeExample {
    /// Example title
    pub title: String,
    /// Example description
    pub description: Option<String>,
    /// Code snippet (Rust code)
    pub code: String,
    /// Language for syntax highlighting (default: "rust")
    pub language: String,
}

impl CodeExample {
    /// Create a new code example
    pub fn new(title: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            description: None,
            code: code.into(),
            language: "rust".to_string(),
        }
    }

    /// Add description to the example
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Set language for syntax highlighting
    pub fn with_language(mut self, language: impl Into<String>) -> Self {
        self.language = language.into();
        self
    }
}

/// Generate README.md content from template
///
/// # Arguments
/// * `template` - README template
///
/// # Returns
/// * Generated README content as String
pub fn generate_readme(template: &ReadmeTemplate) -> String {
    let mut content = String::new();

    // Title
    content.push_str(&format!("# {}\n\n", template.project_name));

    // Description
    content.push_str(&format!("{}\n\n", template.description));

    // Installation
    if let Some(ref installation) = template.installation {
        content.push_str("## Installation\n\n");
        content.push_str(installation);
        content.push_str("\n\n");
    }

    // Usage examples
    if !template.usage_examples.is_empty() {
        content.push_str("## Usage\n\n");

        for example in &template.usage_examples {
            content.push_str(&format!("### {}\n\n", example.title));

            if let Some(ref description) = example.description {
                content.push_str(description);
                content.push_str("\n\n");
            }

            content.push_str(&format!("```{}\n", example.language));
            content.push_str(&example.code);
            content.push_str("\n```\n\n");
        }
    }

    // API docs link
    if let Some(ref api_docs) = template.api_docs_link {
        content.push_str("## API Documentation\n\n");
        content.push_str(&format!(
            "For detailed API documentation, see [{}]({})\n\n",
            api_docs, api_docs
        ));
    }

    // License
    if let Some(ref license) = template.license {
        content.push_str("## License\n\n");
        content.push_str(license);
        content.push('\n');
    }

    content
}

/// Extract code examples from Rust source files
///
/// Searches for `/// # Example` or `/// # Examples` sections in Rustdoc comments
///
/// # Arguments
/// * `file_path` - Path to Rust source file
///
/// # Returns
/// * `Ok(Vec<String>)` - Extracted code examples
/// * `Err(MiyabiError)` - Failed to read file
pub async fn extract_code_examples(file_path: &Path) -> Result<Vec<String>> {
    let content = tokio::fs::read_to_string(file_path).await?;

    let mut examples = Vec::new();
    let mut in_example = false;
    let mut current_example = String::new();

    for line in content.lines() {
        let trimmed = line.trim();

        // Check for example start
        if trimmed.contains("# Example") || trimmed.contains("# Examples") {
            in_example = true;
            current_example.clear();
            continue;
        }

        // Check for example end (next section or empty doc comment)
        if in_example {
            if trimmed.starts_with("/// #") || trimmed == "///" || !trimmed.starts_with("///") {
                if !current_example.trim().is_empty() {
                    examples.push(current_example.trim().to_string());
                    current_example.clear();
                }
                in_example = false;
            } else if let Some(code) = trimmed.strip_prefix("///") {
                current_example.push_str(code.trim_start());
                current_example.push('\n');
            }
        }
    }

    // Add last example if any
    if !current_example.trim().is_empty() {
        examples.push(current_example.trim().to_string());
    }

    Ok(examples)
}

/// Validate that documentation exists for public items
///
/// Checks if a Rust source file has documentation comments for public items
///
/// # Arguments
/// * `file_path` - Path to Rust source file
///
/// # Returns
/// * `Ok(ValidationResult)` - Validation result
/// * `Err(MiyabiError)` - Failed to read file
pub async fn validate_documentation(file_path: &Path) -> Result<ValidationResult> {
    let content = tokio::fs::read_to_string(file_path).await?;

    let mut total_public_items = 0;
    let mut documented_items = 0;
    let mut missing_docs = Vec::new();

    let lines: Vec<&str> = content.lines().collect();

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Check for public items
        if trimmed.starts_with("pub fn ")
            || trimmed.starts_with("pub struct ")
            || trimmed.starts_with("pub enum ")
            || trimmed.starts_with("pub trait ")
            || trimmed.starts_with("pub type ")
        {
            total_public_items += 1;

            // Check if previous line has doc comment
            let has_doc = if i > 0 {
                let prev_line = lines[i - 1].trim();
                prev_line.starts_with("///") || prev_line.starts_with("//!")
            } else {
                false
            };

            if has_doc {
                documented_items += 1;
            } else {
                // Extract item name
                let item_name = extract_item_name(trimmed);
                missing_docs.push(format!("{}:{} - {}", file_path.display(), i + 1, item_name));
            }
        }
    }

    let coverage_percent = if total_public_items > 0 {
        (documented_items as f32 / total_public_items as f32) * 100.0
    } else {
        100.0
    };

    Ok(ValidationResult {
        total_public_items,
        documented_items,
        missing_docs,
        coverage_percent,
    })
}

/// Extract item name from a public declaration line
fn extract_item_name(line: &str) -> String {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        // Extract name and remove trailing characters like ( or <
        let name = parts[2];
        name.split(['(', '<', '{'])
            .next()
            .unwrap_or(name)
            .to_string()
    } else {
        line.to_string()
    }
}

/// Result of documentation validation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ValidationResult {
    /// Total number of public items
    pub total_public_items: usize,
    /// Number of documented items
    pub documented_items: usize,
    /// List of items missing documentation
    pub missing_docs: Vec<String>,
    /// Documentation coverage percentage
    pub coverage_percent: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_documentation_config_default() {
        let config = DocumentationConfig::default();
        assert!(!config.document_private_items);
        assert!(!config.open_browser);
        assert!(config.no_deps);
    }

    #[tokio::test]
    async fn test_documentation_config_builder() {
        let config = DocumentationConfig::new("/tmp/test")
            .with_private_items()
            .with_browser()
            .with_deps();

        assert_eq!(config.project_root, PathBuf::from("/tmp/test"));
        assert!(config.document_private_items);
        assert!(config.open_browser);
        assert!(!config.no_deps);
    }

    #[tokio::test]
    async fn test_code_example_creation() {
        let example = CodeExample::new("Basic Usage", "fn main() { println!(\"Hello\"); }")
            .with_description("A simple example")
            .with_language("rust");

        assert_eq!(example.title, "Basic Usage");
        assert_eq!(example.description, Some("A simple example".to_string()));
        assert_eq!(example.language, "rust");
        assert!(example.code.contains("println!"));
    }

    #[tokio::test]
    async fn test_generate_readme_basic() {
        let template = ReadmeTemplate {
            project_name: "Test Project".to_string(),
            description: "A test project for documentation".to_string(),
            installation: Some("cargo install test-project".to_string()),
            usage_examples: vec![],
            api_docs_link: None,
            license: Some("MIT".to_string()),
        };

        let readme = generate_readme(&template);

        assert!(readme.contains("# Test Project"));
        assert!(readme.contains("A test project for documentation"));
        assert!(readme.contains("## Installation"));
        assert!(readme.contains("cargo install test-project"));
        assert!(readme.contains("## License"));
        assert!(readme.contains("MIT"));
    }

    #[tokio::test]
    async fn test_generate_readme_with_examples() {
        let example =
            CodeExample::new("Basic Usage", "fn main() {}").with_description("Simple example");

        let template = ReadmeTemplate {
            project_name: "Example".to_string(),
            description: "Description".to_string(),
            installation: None,
            usage_examples: vec![example],
            api_docs_link: Some("https://docs.rs/example".to_string()),
            license: None,
        };

        let readme = generate_readme(&template);

        assert!(readme.contains("## Usage"));
        assert!(readme.contains("### Basic Usage"));
        assert!(readme.contains("Simple example"));
        assert!(readme.contains("```rust"));
        assert!(readme.contains("fn main() {}"));
        assert!(readme.contains("## API Documentation"));
        assert!(readme.contains("https://docs.rs/example"));
    }

    #[tokio::test]
    async fn test_extract_item_name() {
        assert_eq!(extract_item_name("pub fn test_function()"), "test_function");
        assert_eq!(extract_item_name("pub struct MyStruct"), "MyStruct");
        assert_eq!(extract_item_name("pub enum Status"), "Status");
    }

    #[test]
    fn test_documentation_result_serialization() {
        let result = DocumentationResult {
            doc_path: "/path/to/doc".to_string(),
            items_documented: 42,
            warnings: vec!["warning 1".to_string()],
            success: true,
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["doc_path"], "/path/to/doc");
        assert_eq!(json["items_documented"], 42);
        assert_eq!(json["success"], true);

        let deserialized: DocumentationResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.doc_path, "/path/to/doc");
        assert_eq!(deserialized.items_documented, 42);
    }

    #[test]
    fn test_validation_result_coverage_calculation() {
        let result = ValidationResult {
            total_public_items: 10,
            documented_items: 8,
            missing_docs: vec!["item1".to_string(), "item2".to_string()],
            coverage_percent: 80.0,
        };

        assert_eq!(result.coverage_percent, 80.0);
        assert_eq!(result.missing_docs.len(), 2);
    }
}
