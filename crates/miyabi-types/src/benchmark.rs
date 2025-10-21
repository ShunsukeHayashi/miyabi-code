//! Benchmark type definitions for SWE-bench Pro evaluation
//!
//! This module provides types for evaluating Miyabi against world-standard benchmarks.
//! Primary focus: SWE-bench Pro (ScaleAI)
//!
//! # Example
//!
//! ```rust
//! use miyabi_types::benchmark::{SWEBenchInstance, PatchOutput};
//!
//! let instance = SWEBenchInstance {
//!     instance_id: "django__django-12345".to_string(),
//!     repo: "django/django".to_string(),
//!     base_commit: "abc123...".to_string(),
//!     problem_statement: "Fix authentication bug...".to_string(),
//!     patch: "diff --git a/...".to_string(),
//!     test_patch: "diff --git a/tests/...".to_string(),
//!     fail_to_pass: vec!["tests.auth.test_login".to_string()],
//!     pass_to_pass: vec!["tests.auth.test_logout".to_string()],
//!     repo_language: Some("python".to_string()),
//!     requirements: Some("Django>=3.0".to_string()),
//! };
//! ```

use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

/// Custom deserializer for fail_to_pass and pass_to_pass fields
///
/// These fields can be either:
/// 1. A JSON array: `["test1", "test2"]`
/// 2. A JSON string containing an escaped array: `"[\"test1\", \"test2\"]"`
///
/// This deserializer handles both cases.
fn deserialize_string_or_vec<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    use serde_json::Value;

    let value = Value::deserialize(deserializer)?;

    match value {
        // Case 1: Already an array
        Value::Array(arr) => {
            arr.into_iter()
                .map(|v| match v {
                    Value::String(s) => Ok(s),
                    _ => Err(D::Error::custom("Expected string in array")),
                })
                .collect()
        }
        // Case 2: String containing a JSON array
        Value::String(s) => {
            // Try to parse the string as JSON
            match serde_json::from_str::<Vec<String>>(&s) {
                Ok(vec) => Ok(vec),
                Err(_) => {
                    // If parsing fails, treat as a single-element array
                    Ok(vec![s])
                }
            }
        }
        _ => Err(D::Error::custom("Expected array or string")),
    }
}

/// SWE-bench Pro instance
///
/// Represents a single software engineering task from the SWE-bench Pro dataset.
/// Contains all information needed to evaluate an agent's ability to fix real-world bugs.
///
/// # Fields
///
/// - `instance_id`: Unique identifier (format: `<repo>__<issue>-<number>`)
/// - `repo`: Repository name (e.g., `django/django`)
/// - `base_commit`: 40-character commit hash to checkout
/// - `problem_statement`: Issue description (natural language)
/// - `patch`: Gold patch (ground truth, unified diff format)
/// - `test_patch`: Test patch to apply for evaluation
/// - `fail_to_pass`: Tests that should pass after fix
/// - `pass_to_pass`: Tests that should continue to pass
/// - `repo_language`: Programming language (python/go/javascript/typescript)
/// - `requirements`: Package requirements (e.g., `Django>=3.0`)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SWEBenchInstance {
    /// Unique instance identifier (変更禁止)
    ///
    /// Format: `<repo>__<issue>-<number>`
    /// Example: `django__django-12345`
    pub instance_id: String,

    /// Repository name
    ///
    /// Example: `django/django`
    pub repo: String,

    /// Base commit hash (40 characters)
    ///
    /// The commit to checkout before applying the fix.
    /// Must be a full 40-character SHA-1 hash.
    #[serde(rename = "base_commit")]
    pub base_commit: String,

    /// Problem statement (Issue description)
    ///
    /// Natural language description of the bug or feature request.
    /// This is the input to the agent.
    #[serde(rename = "problem_statement")]
    pub problem_statement: String,

    /// Gold patch (ground truth, unified diff format)
    ///
    /// The correct solution patch, used for reference or scoring.
    /// Format: unified diff (`git diff --unified=3`)
    pub patch: String,

    /// Test patch to apply for evaluation
    ///
    /// Additional test cases to verify the fix.
    #[serde(rename = "test_patch")]
    pub test_patch: String,

    /// Tests that should pass after fix
    ///
    /// List of test identifiers that were failing before the fix
    /// and should pass after the fix is applied.
    /// Example: `["tests.auth.test_login", "tests.auth.test_logout"]`
    #[serde(rename = "fail_to_pass", deserialize_with = "deserialize_string_or_vec")]
    pub fail_to_pass: Vec<String>,

    /// Tests that should continue to pass
    ///
    /// List of test identifiers that were passing before the fix
    /// and should continue to pass after the fix is applied.
    /// Used to detect regressions.
    #[serde(rename = "pass_to_pass", deserialize_with = "deserialize_string_or_vec")]
    pub pass_to_pass: Vec<String>,

    /// Programming language
    ///
    /// One of: `python`, `go`, `javascript`, `typescript`
    #[serde(rename = "repo_language")]
    pub repo_language: Option<String>,

    /// Package requirements
    ///
    /// Example: `Django>=3.0,<4.0`
    pub requirements: Option<String>,
}

impl SWEBenchInstance {
    /// Checks if this instance is for a Python repository
    pub fn is_python(&self) -> bool {
        self.repo_language.as_deref() == Some("python")
    }

    /// Checks if this instance is for a Go repository
    pub fn is_go(&self) -> bool {
        self.repo_language.as_deref() == Some("go")
    }

    /// Checks if this instance is for a JavaScript/TypeScript repository
    pub fn is_javascript(&self) -> bool {
        matches!(
            self.repo_language.as_deref(),
            Some("javascript") | Some("typescript")
        )
    }

    /// Returns the short repository name (without owner)
    ///
    /// Example: `django/django` -> `django`
    pub fn repo_short_name(&self) -> &str {
        self.repo.split('/').next_back().unwrap_or(&self.repo)
    }

    /// Returns the repository owner
    ///
    /// Example: `django/django` -> `django`
    pub fn repo_owner(&self) -> &str {
        self.repo.split('/').next().unwrap_or(&self.repo)
    }
}

/// Patch output for evaluation
///
/// Format required by the official SWE-bench Pro evaluation script.
///
/// # Example
///
/// ```rust
/// use miyabi_types::benchmark::PatchOutput;
///
/// let patch = PatchOutput {
///     instance_id: "django__django-12345".to_string(),
///     model_patch: "diff --git a/django/auth.py b/django/auth.py\n...".to_string(),
///     model_name_or_path: "miyabi-v1.0.0".to_string(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PatchOutput {
    /// Instance identifier (must match SWEBenchInstance::instance_id)
    pub instance_id: String,

    /// Generated patch in unified diff format
    ///
    /// Format: `git diff --unified=3 <base_commit> HEAD`
    /// Must follow the official unified diff format.
    pub model_patch: String,

    /// Model name or path
    ///
    /// Example: `miyabi-v1.0.0`
    pub model_name_or_path: String,
}

/// Evaluation result for a single instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationResult {
    /// Instance identifier
    pub instance_id: String,

    /// Whether the instance was resolved (both fail-to-pass and pass-to-pass successful)
    pub resolved: bool,

    /// Number of fail-to-pass tests that passed
    pub fail_to_pass_count: usize,

    /// Total number of fail-to-pass tests
    pub fail_to_pass_total: usize,

    /// Number of pass-to-pass tests that passed
    pub pass_to_pass_count: usize,

    /// Total number of pass-to-pass tests
    pub pass_to_pass_total: usize,

    /// Error message (if any)
    pub error: Option<String>,

    /// Execution time (seconds)
    pub execution_time: f64,
}

impl EvaluationResult {
    /// Creates a successful evaluation result
    pub fn success(
        instance_id: String,
        fail_to_pass_count: usize,
        fail_to_pass_total: usize,
        pass_to_pass_count: usize,
        pass_to_pass_total: usize,
        execution_time: f64,
    ) -> Self {
        let resolved = fail_to_pass_count == fail_to_pass_total
            && pass_to_pass_count == pass_to_pass_total;

        Self {
            instance_id,
            resolved,
            fail_to_pass_count,
            fail_to_pass_total,
            pass_to_pass_count,
            pass_to_pass_total,
            error: None,
            execution_time,
        }
    }

    /// Creates a failed evaluation result
    pub fn failure(instance_id: String, error: String, execution_time: f64) -> Self {
        Self {
            instance_id,
            resolved: false,
            fail_to_pass_count: 0,
            fail_to_pass_total: 0,
            pass_to_pass_count: 0,
            pass_to_pass_total: 0,
            error: Some(error),
            execution_time,
        }
    }

    /// Returns the resolve rate (0.0 to 1.0)
    pub fn resolve_rate(&self) -> f64 {
        if self.resolved {
            1.0
        } else {
            0.0
        }
    }
}

/// Summary statistics for a benchmark evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkSummary {
    /// Model name
    pub model: String,

    /// Dataset name
    pub dataset: String,

    /// Dataset split (e.g., "test")
    pub split: String,

    /// Total number of instances
    pub total_instances: usize,

    /// Number of resolved instances
    pub resolved_count: usize,

    /// Resolve rate (0.0 to 1.0)
    pub resolve_rate: f64,

    /// Total fail-to-pass tests passed
    pub fail_to_pass_total: usize,

    /// Total pass-to-pass tests passed
    pub pass_to_pass_total: usize,

    /// Number of errors
    pub errors: usize,

    /// Average execution time per instance (seconds)
    pub avg_execution_time: f64,

    /// Breakdown by language
    pub by_language: HashMap<String, LanguageStats>,

    /// Breakdown by repository
    pub by_repository: HashMap<String, RepositoryStats>,
}

impl BenchmarkSummary {
    /// Creates a new benchmark summary from evaluation results
    pub fn from_results(
        model: String,
        dataset: String,
        split: String,
        results: &[EvaluationResult],
        instances: &[SWEBenchInstance],
    ) -> Self {
        let total_instances = results.len();
        let resolved_count = results.iter().filter(|r| r.resolved).count();
        let resolve_rate = resolved_count as f64 / total_instances as f64;

        let fail_to_pass_total = results.iter().map(|r| r.fail_to_pass_count).sum();
        let pass_to_pass_total = results.iter().map(|r| r.pass_to_pass_count).sum();
        let errors = results.iter().filter(|r| r.error.is_some()).count();

        let avg_execution_time = results.iter().map(|r| r.execution_time).sum::<f64>()
            / total_instances as f64;

        // Group by language
        let mut by_language: HashMap<String, LanguageStats> = HashMap::new();
        for (instance, result) in instances.iter().zip(results.iter()) {
            let lang = instance
                .repo_language
                .as_deref()
                .unwrap_or("unknown")
                .to_string();
            let stats = by_language.entry(lang).or_insert(LanguageStats {
                total: 0,
                resolved: 0,
                resolve_rate: 0.0,
            });
            stats.total += 1;
            if result.resolved {
                stats.resolved += 1;
            }
            stats.resolve_rate = stats.resolved as f64 / stats.total as f64;
        }

        // Group by repository
        let mut by_repository: HashMap<String, RepositoryStats> = HashMap::new();
        for (instance, result) in instances.iter().zip(results.iter()) {
            let repo = instance.repo.clone();
            let stats = by_repository.entry(repo).or_insert(RepositoryStats {
                total: 0,
                resolved: 0,
                resolve_rate: 0.0,
            });
            stats.total += 1;
            if result.resolved {
                stats.resolved += 1;
            }
            stats.resolve_rate = stats.resolved as f64 / stats.total as f64;
        }

        Self {
            model,
            dataset,
            split,
            total_instances,
            resolved_count,
            resolve_rate,
            fail_to_pass_total,
            pass_to_pass_total,
            errors,
            avg_execution_time,
            by_language,
            by_repository,
        }
    }
}

/// Statistics for a specific language
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageStats {
    /// Total instances for this language
    pub total: usize,

    /// Resolved instances for this language
    pub resolved: usize,

    /// Resolve rate for this language
    pub resolve_rate: f64,
}

/// Statistics for a specific repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryStats {
    /// Total instances for this repository
    pub total: usize,

    /// Resolved instances for this repository
    pub resolved: usize,

    /// Resolve rate for this repository
    pub resolve_rate: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_swebench_instance_language_checks() {
        let mut instance = SWEBenchInstance {
            instance_id: "test__test-123".to_string(),
            repo: "test/test".to_string(),
            base_commit: "abc123".to_string(),
            problem_statement: "Fix bug".to_string(),
            patch: "diff".to_string(),
            test_patch: "test diff".to_string(),
            fail_to_pass: vec![],
            pass_to_pass: vec![],
            repo_language: Some("python".to_string()),
            requirements: None,
        };

        assert!(instance.is_python());
        assert!(!instance.is_go());
        assert!(!instance.is_javascript());

        instance.repo_language = Some("go".to_string());
        assert!(!instance.is_python());
        assert!(instance.is_go());
        assert!(!instance.is_javascript());

        instance.repo_language = Some("javascript".to_string());
        assert!(!instance.is_python());
        assert!(!instance.is_go());
        assert!(instance.is_javascript());
    }

    #[test]
    fn test_repo_names() {
        let instance = SWEBenchInstance {
            instance_id: "django__django-12345".to_string(),
            repo: "django/django".to_string(),
            base_commit: "abc123".to_string(),
            problem_statement: "Fix bug".to_string(),
            patch: "diff".to_string(),
            test_patch: "test diff".to_string(),
            fail_to_pass: vec![],
            pass_to_pass: vec![],
            repo_language: Some("python".to_string()),
            requirements: None,
        };

        assert_eq!(instance.repo_owner(), "django");
        assert_eq!(instance.repo_short_name(), "django");
    }

    #[test]
    fn test_evaluation_result_success() {
        let result = EvaluationResult::success(
            "test-123".to_string(),
            5,
            5,
            10,
            10,
            120.5,
        );

        assert!(result.resolved);
        assert_eq!(result.resolve_rate(), 1.0);
        assert_eq!(result.execution_time, 120.5);
        assert!(result.error.is_none());
    }

    #[test]
    fn test_evaluation_result_failure() {
        let result = EvaluationResult::failure(
            "test-456".to_string(),
            "Timeout".to_string(),
            300.0,
        );

        assert!(!result.resolved);
        assert_eq!(result.resolve_rate(), 0.0);
        assert_eq!(result.error, Some("Timeout".to_string()));
    }
}
