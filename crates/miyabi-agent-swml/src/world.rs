//! SWML World Model - Phase 2 Implementation
//!
//! This module extends the base World type from miyabi-types with:
//! - Real-time filesystem scanning
//! - GitHub context integration
//! - Knowledge accumulation
//! - Learning mechanisms for θ₆ phase

use crate::spaces::{Dependency, DependencyKind, Fact, FileInfo, GitContext, GitHubContext, World};
use chrono::Utc;
use miyabi_types::MiyabiError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Extended World with Phase 2 capabilities
pub struct WorldManager {
    /// Current world state
    world: World,

    /// Configuration for world scanning
    config: WorldConfig,
}

/// Configuration for World scanning and management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldConfig {
    /// Maximum file size to scan (bytes)
    pub max_file_size: u64,

    /// File patterns to include
    pub include_patterns: Vec<String>,

    /// File patterns to exclude
    pub exclude_patterns: Vec<String>,

    /// Maximum depth for directory scanning
    pub max_depth: usize,

    /// Enable git integration
    pub enable_git: bool,

    /// Enable GitHub API integration
    pub enable_github: bool,
}

impl Default for WorldConfig {
    fn default() -> Self {
        Self {
            max_file_size: 10 * 1024 * 1024, // 10 MB
            include_patterns: vec![
                "*.rs".to_string(),
                "*.toml".to_string(),
                "*.md".to_string(),
                "*.json".to_string(),
                "*.yaml".to_string(),
                "*.yml".to_string(),
            ],
            exclude_patterns: vec![
                "target/**".to_string(),
                "node_modules/**".to_string(),
                ".git/**".to_string(),
                "*.lock".to_string(),
                ".worktrees/**".to_string(),
            ],
            max_depth: 10,
            enable_git: true,
            enable_github: true,
        }
    }
}

impl WorldManager {
    /// Create a new WorldManager with default configuration
    pub fn new() -> Result<Self, MiyabiError> {
        Self::with_config(WorldConfig::default())
    }

    /// Create a new WorldManager with custom configuration
    pub fn with_config(config: WorldConfig) -> Result<Self, MiyabiError> {
        let world = World::current()?;

        Ok(Self { world, config })
    }

    /// Get a reference to the current World
    pub fn world(&self) -> &World {
        &self.world
    }

    /// Get a mutable reference to the current World
    pub fn world_mut(&mut self) -> &mut World {
        &mut self.world
    }

    /// Refresh the entire World state
    pub async fn refresh(&mut self) -> Result<(), MiyabiError> {
        // Scan filesystem
        self.scan_filesystem().await?;

        // Update git context
        if self.config.enable_git {
            self.refresh_git_context().await?;
        }

        // Update GitHub context
        if self.config.enable_github {
            self.refresh_github_context().await?;
        }

        // Update timestamp
        self.world.state.last_updated = Utc::now();

        Ok(())
    }

    /// Scan the filesystem and update WorldState
    async fn scan_filesystem(&mut self) -> Result<(), MiyabiError> {
        let project_root = &self.world.state.project_root;

        let mut files = Vec::new();
        let mut dependencies = Vec::new();

        // Scan files
        for entry in WalkDir::new(project_root)
            .max_depth(self.config.max_depth)
            .into_iter()
            .filter_entry(|e| !self.should_exclude(e.path()))
        {
            let entry = entry.map_err(|e| {
                MiyabiError::Io(std::io::Error::other(format!(
                    "Failed to read directory entry: {}",
                    e
                )))
            })?;

            if entry.file_type().is_file() {
                if let Ok(file_info) = self.create_file_info(entry.path()).await {
                    files.push(file_info);
                }
            }
        }

        // Scan dependencies from Cargo.toml
        if let Ok(cargo_deps) = self.scan_cargo_dependencies(project_root).await {
            dependencies.extend(cargo_deps);
        }

        // Update world state
        self.world.state.files = files;
        self.world.state.dependencies = dependencies;

        Ok(())
    }

    /// Check if a path should be excluded from scanning
    fn should_exclude(&self, path: &Path) -> bool {
        let path_str = path.to_string_lossy();

        for pattern in &self.config.exclude_patterns {
            if glob_match(&path_str, pattern) {
                return true;
            }
        }

        false
    }

    /// Create FileInfo for a path
    async fn create_file_info(&self, path: &Path) -> Result<FileInfo, MiyabiError> {
        let metadata = fs::metadata(path)?;

        // Skip files that are too large
        if metadata.len() > self.config.max_file_size {
            return Err(MiyabiError::Validation(format!(
                "File too large: {:?} ({} bytes)",
                path,
                metadata.len()
            )));
        }

        let last_modified = metadata.modified().map_err(MiyabiError::Io)?.into();

        // Compute content hash for change detection
        let content_hash = if path
            .extension()
            .is_some_and(|ext| ext == "rs" || ext == "toml")
        {
            Some(self.compute_file_hash(path)?)
        } else {
            None
        };

        Ok(FileInfo {
            path: path.to_path_buf(),
            size_bytes: metadata.len(),
            last_modified,
            content_hash,
        })
    }

    /// Compute SHA-256 hash of file content
    fn compute_file_hash(&self, path: &Path) -> Result<String, MiyabiError> {
        use sha2::{Digest, Sha256};

        let content = fs::read(path)?;
        let mut hasher = Sha256::new();
        hasher.update(&content);
        let hash = hasher.finalize();

        Ok(format!("{:x}", hash))
    }

    /// Scan Cargo.toml for dependencies
    async fn scan_cargo_dependencies(
        &self,
        project_root: &Path,
    ) -> Result<Vec<Dependency>, MiyabiError> {
        let cargo_toml = project_root.join("Cargo.toml");

        if !cargo_toml.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&cargo_toml)?;
        let toml: toml::Value = toml::from_str(&content)
            .map_err(|e| MiyabiError::Validation(format!("Failed to parse Cargo.toml: {}", e)))?;

        let mut dependencies = Vec::new();

        // Parse dependencies section
        if let Some(deps) = toml.get("dependencies").and_then(|v| v.as_table()) {
            for (name, value) in deps {
                let version = match value {
                    toml::Value::String(v) => v.clone(),
                    toml::Value::Table(t) => t
                        .get("version")
                        .and_then(|v| v.as_str())
                        .unwrap_or("*")
                        .to_string(),
                    _ => "*".to_string(),
                };

                dependencies.push(Dependency {
                    name: name.clone(),
                    version,
                    kind: DependencyKind::Cargo,
                });
            }
        }

        Ok(dependencies)
    }

    /// Refresh Git context from repository
    async fn refresh_git_context(&mut self) -> Result<(), MiyabiError> {
        // Use git2 crate to get real git information
        let repo = git2::Repository::discover(&self.world.state.project_root)
            .map_err(|e| MiyabiError::Git(format!("Failed to open git repository: {}", e)))?;

        // Get current branch
        let head = repo
            .head()
            .map_err(|e| MiyabiError::Git(format!("Failed to get HEAD: {}", e)))?;

        let current_branch = head.shorthand().unwrap_or("unknown").to_string();

        // Check for uncommitted changes
        let statuses = repo
            .statuses(None)
            .map_err(|e| MiyabiError::Git(format!("Failed to get status: {}", e)))?;

        let uncommitted_changes = !statuses.is_empty();

        // Get recent commits (last 10)
        let mut revwalk = repo
            .revwalk()
            .map_err(|e| MiyabiError::Git(format!("Failed to create revwalk: {}", e)))?;

        revwalk
            .push_head()
            .map_err(|e| MiyabiError::Git(format!("Failed to push HEAD: {}", e)))?;

        let mut recent_commits = Vec::new();
        for oid in revwalk.take(10).flatten() {
            if let Ok(commit) = repo.find_commit(oid) {
                let summary = commit.summary().unwrap_or("").to_string();
                recent_commits.push(format!("{}: {}", &oid.to_string()[..7], summary));
            }
        }

        self.world.context.git = GitContext {
            current_branch,
            main_branch: "main".to_string(), // TODO: Auto-detect from remote
            uncommitted_changes,
            recent_commits,
        };

        Ok(())
    }

    /// Refresh GitHub context using GitHub API
    async fn refresh_github_context(&mut self) -> Result<(), MiyabiError> {
        // This would use the GitHub API in a real implementation
        // For now, return empty context
        self.world.context.github = GitHubContext::empty();

        Ok(())
    }

    /// Add knowledge to the World (θ₆: Learning phase)
    pub fn learn(&mut self, statement: String, confidence: f64, source: String) {
        let fact = Fact {
            statement,
            confidence: confidence.clamp(0.0, 1.0),
            source,
            timestamp: Utc::now(),
        };

        self.world.context.knowledge.push(fact);
    }

    /// Query knowledge base
    pub fn query_knowledge(&self, query: &str) -> Vec<&Fact> {
        self.world
            .context
            .knowledge
            .iter()
            .filter(|fact| fact.statement.contains(query))
            .collect()
    }

    /// Get statistics about the current World
    pub fn statistics(&self) -> WorldStatistics {
        let total_files = self.world.state.files.len();
        let total_size_bytes: u64 = self.world.state.files.iter().map(|f| f.size_bytes).sum();

        let file_types = self.count_file_types();

        WorldStatistics {
            total_files,
            total_size_bytes,
            total_dependencies: self.world.state.dependencies.len(),
            total_knowledge_facts: self.world.context.knowledge.len(),
            file_types,
            last_updated: self.world.state.last_updated,
        }
    }

    /// Count files by type
    fn count_file_types(&self) -> HashMap<String, usize> {
        let mut counts = HashMap::new();

        for file in &self.world.state.files {
            let ext = file
                .path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("unknown")
                .to_string();

            *counts.entry(ext).or_insert(0) += 1;
        }

        counts
    }
}

impl Default for WorldManager {
    fn default() -> Self {
        Self::new().expect("Failed to create default WorldManager")
    }
}

/// Statistics about the World
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldStatistics {
    pub total_files: usize,
    pub total_size_bytes: u64,
    pub total_dependencies: usize,
    pub total_knowledge_facts: usize,
    pub file_types: HashMap<String, usize>,
    pub last_updated: chrono::DateTime<Utc>,
}

/// Simple glob pattern matching
fn glob_match(path: &str, pattern: &str) -> bool {
    // Simple implementation - would use the `glob` crate in production
    if pattern.contains("**") {
        let prefix = pattern.split("**").next().unwrap_or("");
        path.contains(prefix)
    } else if let Some(suffix) = pattern.strip_prefix('*') {
        path.ends_with(suffix)
    } else if let Some(prefix) = pattern.strip_suffix('*') {
        path.starts_with(prefix)
    } else {
        path.contains(pattern)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_world_config_default() {
        let config = WorldConfig::default();
        assert_eq!(config.max_file_size, 10 * 1024 * 1024);
        assert!(config.enable_git);
        assert!(config.enable_github);
    }

    #[test]
    fn test_glob_match() {
        assert!(glob_match("target/debug/foo", "target/**"));
        assert!(glob_match("foo.rs", "*.rs"));
        assert!(glob_match("foo.rs", "foo*"));
        assert!(!glob_match("foo.toml", "*.rs"));
    }

    #[tokio::test]
    async fn test_world_manager_creation() {
        let manager = WorldManager::new();
        assert!(manager.is_ok());
    }

    #[tokio::test]
    async fn test_learn_and_query() {
        let mut manager = WorldManager::new().unwrap();

        manager.learn(
            "Error handling uses Result<T, E> pattern".to_string(),
            0.95,
            "code_analysis".to_string(),
        );

        let results = manager.query_knowledge("Error handling");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].confidence, 0.95);
    }
}
