//! Dataset loading and filtering for SWE-bench Pro
//!
//! This module provides functionality to load and filter the SWE-bench Pro dataset.

use anyhow::{Context, Result};
use miyabi_types::benchmark::SWEBenchInstance;
use std::fs;
use std::path::Path;

/// SWE-bench Pro dataset
///
/// Provides loading and filtering capabilities for the SWE-bench Pro test split.
///
/// # Example
///
/// ```rust,no_run
/// use miyabi_benchmark::dataset::SWEBenchDataset;
///
/// # fn example() -> anyhow::Result<()> {
/// let dataset = SWEBenchDataset::load_from_json("swebench_pro_test.json")?;
/// println!("Total: {} instances", dataset.len());
///
/// let python_only = dataset.filter_by_language("python");
/// println!("Python: {} instances", python_only.len());
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone)]
pub struct SWEBenchDataset {
    instances: Vec<SWEBenchInstance>,
}

impl SWEBenchDataset {
    /// Loads dataset from JSON file
    ///
    /// # Arguments
    ///
    /// * `path` - Path to JSON file (e.g., `swebench_pro_test.json`)
    ///
    /// # Returns
    ///
    /// `Result<SWEBenchDataset>` - Loaded dataset or error
    pub fn load_from_json<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = fs::read_to_string(path.as_ref())
            .context("Failed to read dataset file")?;

        let instances: Vec<SWEBenchInstance> = serde_json::from_str(&content)
            .context("Failed to parse JSON dataset")?;

        Ok(Self { instances })
    }

    /// Returns the number of instances
    pub fn len(&self) -> usize {
        self.instances.len()
    }

    /// Checks if the dataset is empty
    pub fn is_empty(&self) -> bool {
        self.instances.is_empty()
    }

    /// Returns all instances
    pub fn instances(&self) -> &[SWEBenchInstance] {
        &self.instances
    }

    /// Gets a specific instance by index
    pub fn get(&self, index: usize) -> Option<&SWEBenchInstance> {
        self.instances.get(index)
    }

    /// Filters instances by instance IDs
    pub fn filter_by_ids(&self, ids: &[String]) -> Self {
        let filtered: Vec<SWEBenchInstance> = self
            .instances
            .iter()
            .filter(|inst| ids.contains(&inst.instance_id))
            .cloned()
            .collect();

        Self { instances: filtered }
    }

    /// Filters instances by programming language
    pub fn filter_by_language(&self, lang: &str) -> Self {
        let filtered: Vec<SWEBenchInstance> = self
            .instances
            .iter()
            .filter(|inst| inst.repo_language.as_deref() == Some(lang))
            .cloned()
            .collect();

        Self { instances: filtered }
    }

    /// Filters instances by repository
    pub fn filter_by_repo(&self, repo: &str) -> Self {
        let filtered: Vec<SWEBenchInstance> = self
            .instances
            .iter()
            .filter(|inst| inst.repo == repo)
            .cloned()
            .collect();

        Self { instances: filtered }
    }

    /// Returns a sample of n instances
    pub fn sample(&self, n: usize) -> Self {
        let sampled: Vec<SWEBenchInstance> = self
            .instances
            .iter()
            .take(n)
            .cloned()
            .collect();

        Self { instances: sampled }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::benchmark::SWEBenchInstance;
    use tempfile::NamedTempFile;
    use std::io::Write;

    fn create_test_instance(id: &str, repo: &str, lang: Option<&str>) -> SWEBenchInstance {
        SWEBenchInstance {
            instance_id: id.to_string(),
            repo: repo.to_string(),
            base_commit: "abc123".to_string(),
            problem_statement: "Test".to_string(),
            patch: "diff".to_string(),
            test_patch: "test diff".to_string(),
            fail_to_pass: vec![],
            pass_to_pass: vec![],
            repo_language: lang.map(|s| s.to_string()),
            requirements: None,
        }
    }

    #[test]
    fn test_dataset_load_from_json() {
        let instances = vec![
            create_test_instance("test1", "repo1/proj1", Some("python")),
            create_test_instance("test2", "repo2/proj2", Some("go")),
        ];

        let json = serde_json::to_string(&instances).unwrap();

        let mut temp_file = NamedTempFile::new().unwrap();
        temp_file.write_all(json.as_bytes()).unwrap();
        temp_file.flush().unwrap();

        let dataset = SWEBenchDataset::load_from_json(temp_file.path()).unwrap();
        assert_eq!(dataset.len(), 2);
    }

    #[test]
    fn test_filter_by_language() {
        let instances = vec![
            create_test_instance("test1", "repo1/proj1", Some("python")),
            create_test_instance("test2", "repo2/proj2", Some("go")),
            create_test_instance("test3", "repo3/proj3", Some("python")),
        ];

        let dataset = SWEBenchDataset { instances };

        let python_only = dataset.filter_by_language("python");
        assert_eq!(python_only.len(), 2);

        let go_only = dataset.filter_by_language("go");
        assert_eq!(go_only.len(), 1);
    }

    #[test]
    fn test_sample() {
        let instances = vec![
            create_test_instance("test1", "repo1/proj1", Some("python")),
            create_test_instance("test2", "repo2/proj2", Some("go")),
            create_test_instance("test3", "repo3/proj3", Some("python")),
        ];

        let dataset = SWEBenchDataset { instances };

        let sample = dataset.sample(2);
        assert_eq!(sample.len(), 2);
    }
}
