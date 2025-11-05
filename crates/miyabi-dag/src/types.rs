//! Core types for DAG construction

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};

/// Unique identifier for a task in the DAG
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(String);

impl TaskId {
    /// Create a new TaskId from a string
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    /// Get the inner string value
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Generate a TaskId from a file path
    pub fn from_path(path: &Path) -> Self {
        Self::new(path.to_string_lossy().into_owned())
    }
}

impl std::fmt::Display for TaskId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<String> for TaskId {
    fn from(s: String) -> Self {
        Self::new(s)
    }
}

impl From<&str> for TaskId {
    fn from(s: &str) -> Self {
        Self::new(s)
    }
}

/// Module path in the codebase (e.g., "crate::module::submodule")
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModulePath(String);

impl ModulePath {
    /// Create a new ModulePath from a string
    pub fn new(path: impl Into<String>) -> Self {
        Self(path.into())
    }

    /// Get the inner string value
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Parse module path from a file path
    pub fn from_file_path(path: &Path, root: &Path) -> Option<Self> {
        path.strip_prefix(root)
            .ok()
            .and_then(|p| p.to_str())
            .map(|s| {
                let module_path = s
                    .trim_end_matches(".rs")
                    .replace(['/', '\\'], "::");
                Self::new(module_path)
            })
    }
}

impl std::fmt::Display for ModulePath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<String> for ModulePath {
    fn from(s: String) -> Self {
        Self::new(s)
    }
}

impl From<&str> for ModulePath {
    fn from(s: &str) -> Self {
        Self::new(s)
    }
}

/// A single code file with its content and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeFile {
    /// File path relative to project root
    pub path: PathBuf,
    /// File content
    pub content: String,
    /// Module path derived from file path
    pub module_path: ModulePath,
    /// Import statements found in this file
    pub imports: Vec<ModulePath>,
}

impl CodeFile {
    /// Create a new CodeFile
    pub fn new(
        path: PathBuf,
        content: String,
        module_path: ModulePath,
        imports: Vec<ModulePath>,
    ) -> Self {
        Self {
            path,
            content,
            module_path,
            imports,
        }
    }

    /// Parse imports from Rust source code
    pub fn parse_imports(content: &str) -> Vec<ModulePath> {
        let mut imports = Vec::new();
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("use ") || trimmed.starts_with("extern crate ") {
                // Extract module path from use statement
                // Example: "use crate::module::Type;" -> "crate::module"
                if let Some(path_str) = Self::extract_module_from_use(trimmed) {
                    imports.push(ModulePath::new(path_str));
                }
            }
        }
        imports
    }

    fn extract_module_from_use(line: &str) -> Option<String> {
        // Simple parsing: extract text between "use" and ";"
        // Remove "use " prefix
        let line = line.strip_prefix("use ")?.trim();
        // Remove trailing ";"
        let line = line.strip_suffix(';').unwrap_or(line).trim();
        // Remove "as" aliases
        let line = if let Some(pos) = line.find(" as ") {
            &line[..pos]
        } else {
            line
        };
        // Remove braces and wildcards
        let line = line.split('{').next()?.trim();
        let line = line.strip_suffix("::*").unwrap_or(line);
        // Remove trailing `::`
        let line = line.strip_suffix("::").unwrap_or(line);

        Some(line.to_string())
    }

    /// Get the TaskId for this file
    pub fn task_id(&self) -> TaskId {
        TaskId::from_path(&self.path)
    }
}

/// Collection of generated code files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedCode {
    /// List of code files
    pub files: Vec<CodeFile>,
    /// Project root path
    pub root: PathBuf,
}

impl GeneratedCode {
    /// Create a new GeneratedCode instance
    pub fn new(files: Vec<CodeFile>, root: PathBuf) -> Self {
        Self { files, root }
    }

    /// Create from a list of files
    pub fn from_files(files: Vec<CodeFile>) -> Self {
        Self {
            files,
            root: PathBuf::from("."),
        }
    }

    /// Get all unique module paths
    pub fn all_modules(&self) -> HashSet<ModulePath> {
        self.files
            .iter()
            .map(|f| f.module_path.clone())
            .collect()
    }

    /// Get all TaskIds
    pub fn all_task_ids(&self) -> Vec<TaskId> {
        self.files.iter().map(|f| f.task_id()).collect()
    }

    /// Find a file by its module path
    pub fn find_by_module(&self, module: &ModulePath) -> Option<&CodeFile> {
        self.files.iter().find(|f| &f.module_path == module)
    }

    /// Find a file by its task ID
    pub fn find_by_task_id(&self, task_id: &TaskId) -> Option<&CodeFile> {
        self.files.iter().find(|f| f.task_id() == *task_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_id_creation() {
        let id = TaskId::new("test-task");
        assert_eq!(id.as_str(), "test-task");
    }

    #[test]
    fn test_module_path_creation() {
        let path = ModulePath::new("crate::module::submodule");
        assert_eq!(path.as_str(), "crate::module::submodule");
    }

    #[test]
    fn test_parse_imports() {
        let content = r#"
            use std::collections::HashMap;
            use crate::module::Type;
            use super::parent;
        "#;
        let imports = CodeFile::parse_imports(content);
        assert_eq!(imports.len(), 3);
        assert_eq!(imports[0].as_str(), "std::collections::HashMap");
        assert_eq!(imports[1].as_str(), "crate::module::Type");
        assert_eq!(imports[2].as_str(), "super::parent");
    }

    #[test]
    fn test_parse_imports_with_braces() {
        let content = "use std::collections::{HashMap, HashSet};";
        let imports = CodeFile::parse_imports(content);
        assert_eq!(imports.len(), 1);
        assert_eq!(imports[0].as_str(), "std::collections");
    }

    #[test]
    fn test_parse_imports_with_wildcard() {
        let content = "use crate::prelude::*;";
        let imports = CodeFile::parse_imports(content);
        assert_eq!(imports.len(), 1);
        assert_eq!(imports[0].as_str(), "crate::prelude");
    }

    #[test]
    fn test_generated_code_all_modules() {
        let files = vec![
            CodeFile::new(
                PathBuf::from("src/a.rs"),
                String::new(),
                ModulePath::new("crate::a"),
                vec![],
            ),
            CodeFile::new(
                PathBuf::from("src/b.rs"),
                String::new(),
                ModulePath::new("crate::b"),
                vec![],
            ),
        ];
        let code = GeneratedCode::from_files(files);
        let modules = code.all_modules();
        assert_eq!(modules.len(), 2);
        assert!(modules.contains(&ModulePath::new("crate::a")));
        assert!(modules.contains(&ModulePath::new("crate::b")));
    }
}
