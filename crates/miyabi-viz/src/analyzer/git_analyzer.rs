//! Git history analyzer for B-factor calculation

use crate::Result;
use chrono::{Duration, Utc};
use git2::{Repository, Time};
use std::collections::HashMap;
use std::path::Path;

/// Analyzer for Git history to calculate code volatility (B-factors)
pub struct GitAnalyzer {
    repo: Repository,
}

impl GitAnalyzer {
    /// Create a new Git analyzer
    pub fn new<P: AsRef<Path>>(workspace_root: P) -> Result<Self> {
        let repo = Repository::discover(workspace_root)?;
        Ok(Self { repo })
    }

    /// Calculate B-factors for all crates
    /// B-factor = (commits_last_30days / total_commits) * 100
    /// Range: 0.0 (stable) to 100.0 (highly volatile)
    pub fn calculate_bfactors(&self) -> Result<HashMap<String, f32>> {
        let mut bfactors: HashMap<String, f32> = HashMap::new();
        let mut total_commits: HashMap<String, usize> = HashMap::new();
        let mut recent_commits: HashMap<String, usize> = HashMap::new();

        let now = Utc::now();
        let thirty_days_ago = now - Duration::days(30);

        // Walk through all commits in the default branch
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push_head()?;

        for oid in revwalk {
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;

            // Skip merge commits for simplicity
            if commit.parent_count() > 1 {
                continue;
            }

            let commit_time = Time::new(commit.time().seconds(), 0);
            let commit_datetime =
                chrono::DateTime::from_timestamp(commit_time.seconds(), 0).unwrap();

            // Get the tree for this commit
            let tree = commit.tree()?;

            // If this is not the first commit, compare with parent
            if let Ok(parent) = commit.parent(0) {
                let parent_tree = parent.tree()?;
                let diff = self
                    .repo
                    .diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?;

                // Analyze changed files
                diff.foreach(
                    &mut |delta, _progress| {
                        if let Some(path) = delta.new_file().path() {
                            if let Some(crate_name) = Self::extract_crate_name(path) {
                                // Count total commits
                                *total_commits.entry(crate_name.clone()).or_insert(0) += 1;

                                // Count recent commits (last 30 days)
                                if commit_datetime >= thirty_days_ago {
                                    *recent_commits.entry(crate_name).or_insert(0) += 1;
                                }
                            }
                        }
                        true
                    },
                    None,
                    None,
                    None,
                )?;
            }
        }

        // Calculate B-factors
        for (crate_name, &total) in &total_commits {
            let recent = recent_commits.get(crate_name).copied().unwrap_or(0);

            let bfactor = if total > 0 {
                (recent as f32 / total as f32) * 100.0
            } else {
                50.0 // Default for crates with no commits
            };

            bfactors.insert(crate_name.clone(), bfactor);
        }

        Ok(bfactors)
    }

    /// Extract crate name from a file path
    /// Example: "crates/miyabi-core/src/lib.rs" → "miyabi-core"
    fn extract_crate_name(path: &Path) -> Option<String> {
        let components: Vec<_> = path.components().collect();

        // Look for "crates/miyabi-xxx" pattern
        for i in 0..components.len().saturating_sub(1) {
            if let Some(part) = components[i].as_os_str().to_str() {
                if part == "crates" {
                    if let Some(crate_name) = components.get(i + 1) {
                        if let Some(name_str) = crate_name.as_os_str().to_str() {
                            if name_str.starts_with("miyabi-") {
                                return Some(name_str.to_string());
                            }
                        }
                    }
                }
            }
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_crate_name() {
        let path = Path::new("crates/miyabi-core/src/lib.rs");
        assert_eq!(
            GitAnalyzer::extract_crate_name(path),
            Some("miyabi-core".to_string())
        );

        let path = Path::new("crates/miyabi-agent-coordinator/src/main.rs");
        assert_eq!(
            GitAnalyzer::extract_crate_name(path),
            Some("miyabi-agent-coordinator".to_string())
        );

        let path = Path::new("README.md");
        assert_eq!(GitAnalyzer::extract_crate_name(path), None);
    }
}
