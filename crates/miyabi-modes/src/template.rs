//! Template variable rendering system for Miyabi modes
//!
//! Inspired by Kimi CLI's template system, this module provides
//! dynamic variable substitution for mode roleDefinitions.
//!
//! Supported variables:
//! - `${MIYABI_NOW}`: Current timestamp (RFC3339)
//! - `${MIYABI_WORK_DIR}`: Current working directory
//! - `${MIYABI_WORK_DIR_LS}`: Output of `ls -la` (cached)
//! - `${MIYABI_AGENTS_MD}`: Content of AGENTS.md file (cached)
//! - Custom variables from `systemPromptArgs`

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, RwLock};

use chrono::Utc;
use tracing::{debug, warn};

use crate::error::{ModeError, ModeResult};

/// Template renderer with caching for expensive operations
#[derive(Clone)]
pub struct TemplateRenderer {
    work_dir: PathBuf,
    cache: Arc<RwLock<HashMap<String, String>>>,
}

impl TemplateRenderer {
    /// Create a new template renderer for the given working directory
    pub fn new(work_dir: PathBuf) -> Self {
        Self {
            work_dir,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Render a template string with variable substitution
    ///
    /// # Arguments
    /// * `template` - Template string containing ${VAR} placeholders
    /// * `custom_args` - Custom variables from systemPromptArgs
    ///
    /// # Example
    /// ```no_run
    /// use std::path::PathBuf;
    /// use std::collections::HashMap;
    /// use miyabi_modes::TemplateRenderer;
    ///
    /// let renderer = TemplateRenderer::new(PathBuf::from("."));
    /// let template = "Working in ${MIYABI_WORK_DIR} at ${MIYABI_NOW}";
    /// let result = renderer.render(template, &HashMap::new()).unwrap();
    /// ```
    pub fn render(
        &self,
        template: &str,
        custom_args: &HashMap<String, String>,
    ) -> ModeResult<String> {
        let mut rendered = template.to_string();

        // Replace built-in variables
        rendered = self.replace_builtin_vars(&rendered)?;

        // Replace custom variables from systemPromptArgs
        for (key, value) in custom_args {
            let placeholder = format!("${{{}}}", key);
            rendered = rendered.replace(&placeholder, value);
        }

        Ok(rendered)
    }

    /// Replace built-in template variables
    fn replace_builtin_vars(&self, template: &str) -> ModeResult<String> {
        let now = Utc::now().to_rfc3339();
        let work_dir = self.work_dir.display().to_string();
        let work_dir_ls = self.get_work_dir_ls()?;
        let agents_md = self.get_agents_md()?;

        Ok(template
            .replace("${MIYABI_NOW}", &now)
            .replace("${MIYABI_WORK_DIR}", &work_dir)
            .replace("${MIYABI_WORK_DIR_LS}", &work_dir_ls)
            .replace("${MIYABI_AGENTS_MD}", &agents_md))
    }

    /// Get `ls -la` output with caching
    fn get_work_dir_ls(&self) -> ModeResult<String> {
        const CACHE_KEY: &str = "work_dir_ls";

        // Check cache first
        {
            let cache = self.cache.read().unwrap();
            if let Some(cached) = cache.get(CACHE_KEY) {
                debug!("Using cached ls output");
                return Ok(cached.clone());
            }
        }

        // Execute ls -la
        debug!("Executing ls -la in {:?}", self.work_dir);
        let output = Command::new("ls")
            .arg("-la")
            .current_dir(&self.work_dir)
            .output()
            .map_err(|e| ModeError::InvalidDefinition(format!("Failed to execute ls: {}", e)))?;

        if !output.status.success() {
            warn!("ls command failed with status: {}", output.status);
            return Ok(String::from("(ls command failed)"));
        }

        let ls_output = String::from_utf8_lossy(&output.stdout).to_string();

        // Cache the result
        {
            let mut cache = self.cache.write().unwrap();
            cache.insert(CACHE_KEY.to_string(), ls_output.clone());
        }

        Ok(ls_output)
    }

    /// Get AGENTS.md content with caching
    fn get_agents_md(&self) -> ModeResult<String> {
        const CACHE_KEY: &str = "agents_md";

        // Check cache first
        {
            let cache = self.cache.read().unwrap();
            if let Some(cached) = cache.get(CACHE_KEY) {
                debug!("Using cached AGENTS.md");
                return Ok(cached.clone());
            }
        }

        // Try to read AGENTS.md
        let agents_md_path = self.work_dir.join("AGENTS.md");
        let content = if agents_md_path.exists() {
            debug!("Reading AGENTS.md from {:?}", agents_md_path);
            fs::read_to_string(&agents_md_path).unwrap_or_else(|e| {
                warn!("Failed to read AGENTS.md: {}", e);
                String::from("(Failed to read AGENTS.md)")
            })
        } else {
            debug!("AGENTS.md not found");
            String::from("(No AGENTS.md found in project root)")
        };

        // Cache the result
        {
            let mut cache = self.cache.write().unwrap();
            cache.insert(CACHE_KEY.to_string(), content.clone());
        }

        Ok(content)
    }

    /// Clear the cache (useful for testing or when files change)
    pub fn clear_cache(&self) {
        let mut cache = self.cache.write().unwrap();
        cache.clear();
        debug!("Template cache cleared");
    }

    /// Get the working directory
    pub fn work_dir(&self) -> &Path {
        &self.work_dir
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use tempfile::TempDir;

    #[test]
    fn test_render_now_variable() {
        let renderer = TemplateRenderer::new(env::current_dir().unwrap());
        let template = "Current time: ${MIYABI_NOW}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("Current time: 2"));
        assert!(result.contains("T"));
        assert!(result.contains("Z") || result.contains("+"));
    }

    #[test]
    fn test_render_work_dir_variable() {
        let work_dir = env::current_dir().unwrap();
        let renderer = TemplateRenderer::new(work_dir.clone());
        let template = "Working in: ${MIYABI_WORK_DIR}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("Working in:"));
        assert!(result.contains(&work_dir.display().to_string()));
    }

    #[test]
    fn test_render_ls_output() {
        let temp_dir = TempDir::new().unwrap();
        fs::write(temp_dir.path().join("test.txt"), "content").unwrap();

        let renderer = TemplateRenderer::new(temp_dir.path().to_path_buf());
        let template = "Files:\n${MIYABI_WORK_DIR_LS}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("Files:"));
        assert!(result.contains("test.txt"));
    }

    #[test]
    fn test_render_agents_md() {
        let temp_dir = TempDir::new().unwrap();
        let agents_content = "# Miyabi Agents\n\nThis is a test.";
        fs::write(temp_dir.path().join("AGENTS.md"), agents_content).unwrap();

        let renderer = TemplateRenderer::new(temp_dir.path().to_path_buf());
        let template = "Documentation:\n${MIYABI_AGENTS_MD}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("Documentation:"));
        assert!(result.contains("# Miyabi Agents"));
        assert!(result.contains("This is a test."));
    }

    #[test]
    fn test_render_custom_variables() {
        let renderer = TemplateRenderer::new(env::current_dir().unwrap());
        let template = "Role: ${ROLE_NAME}, Max: ${MAX_TOKENS}";

        let mut custom_args = HashMap::new();
        custom_args.insert("ROLE_NAME".to_string(), "CodeGen".to_string());
        custom_args.insert("MAX_TOKENS".to_string(), "32000".to_string());

        let result = renderer.render(template, &custom_args).unwrap();

        assert_eq!(result, "Role: CodeGen, Max: 32000");
    }

    #[test]
    fn test_cache_ls_output() {
        let temp_dir = TempDir::new().unwrap();
        let renderer = TemplateRenderer::new(temp_dir.path().to_path_buf());

        // First call - populates cache
        let result1 = renderer.get_work_dir_ls().unwrap();

        // Second call - should use cache
        let result2 = renderer.get_work_dir_ls().unwrap();

        assert_eq!(result1, result2);
    }

    #[test]
    fn test_clear_cache() {
        let temp_dir = TempDir::new().unwrap();
        let renderer = TemplateRenderer::new(temp_dir.path().to_path_buf());

        // Populate cache
        let _result1 = renderer.get_work_dir_ls().unwrap();

        // Clear cache
        renderer.clear_cache();

        // Cache should be empty
        let cache = renderer.cache.read().unwrap();
        assert_eq!(cache.len(), 0);
    }

    #[test]
    fn test_missing_agents_md() {
        let temp_dir = TempDir::new().unwrap();
        let renderer = TemplateRenderer::new(temp_dir.path().to_path_buf());
        let template = "${MIYABI_AGENTS_MD}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("No AGENTS.md found"));
    }

    #[test]
    fn test_multiple_variables() {
        let renderer = TemplateRenderer::new(env::current_dir().unwrap());
        let template = "Time: ${MIYABI_NOW}, Dir: ${MIYABI_WORK_DIR}";
        let result = renderer.render(template, &HashMap::new()).unwrap();

        assert!(result.contains("Time: 2"));
        assert!(result.contains("Dir:"));
    }
}
