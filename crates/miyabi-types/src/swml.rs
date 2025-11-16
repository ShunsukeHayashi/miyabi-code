//! SWML (Shunsuke's World Model Logic) Type Definitions
//!
//! This module defines the core types for the SWML framework:
//! - Intent Space (I): User's desired outcome
//! - World Space (W): Current system state
//! - Result Space (R): Execution outcome with quality metrics
//!
//! Based on the academic paper:
//! "Shunsuke's World Model Logic: A Mathematical Foundation for Autonomous Development Systems"

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

// Re-export types that are used across SWML
use crate::error::MiyabiError;

//
// ═══════════════════════════════════════════════════════════════════════════
// Intent Space (I)
// ═══════════════════════════════════════════════════════════════════════════
//

/// Intent represents the user's desired outcome
///
/// # Mathematical Definition
/// I ∈ I (Intent Space)
///
/// # Components
/// - description: Natural language goal
/// - constraints: Technical/business constraints
/// - priority: Urgency level
/// - metadata: Context information
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Intent {
    /// Natural language description of the goal
    pub description: String,

    /// Technical and business constraints
    pub constraints: Vec<Constraint>,

    /// Priority level (affects resource allocation)
    pub priority: Priority,

    /// Additional metadata (issue number, timestamps, etc.)
    pub metadata: IntentMetadata,
}

impl Intent {
    /// Create Intent from a GitHub issue number
    pub fn from_issue(issue_number: u64) -> Self {
        Self {
            description: format!("Resolve GitHub issue #{}", issue_number),
            constraints: Vec::new(),
            priority: Priority::Medium,
            metadata: IntentMetadata {
                issue_number: Some(issue_number),
                created_at: chrono::Utc::now(),
                tags: Vec::new(),
                context: HashMap::new(),
            },
        }
    }

    /// Create Intent from a natural language description
    pub fn from_description(description: impl Into<String>) -> Self {
        Self {
            description: description.into(),
            constraints: Vec::new(),
            priority: Priority::Medium,
            metadata: IntentMetadata {
                issue_number: None,
                created_at: chrono::Utc::now(),
                tags: Vec::new(),
                context: HashMap::new(),
            },
        }
    }

    /// Add a constraint to this Intent
    pub fn with_constraint(mut self, constraint: Constraint) -> Self {
        self.constraints.push(constraint);
        self
    }

    /// Set the priority level
    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }

    /// Add a tag for categorization
    pub fn with_tag(mut self, tag: impl Into<String>) -> Self {
        self.metadata.tags.push(tag.into());
        self
    }

    /// Validate the Intent
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if self.description.trim().is_empty() {
            return Err(MiyabiError::Validation("Intent description cannot be empty".to_string()));
        }

        // Validate constraints
        for constraint in &self.constraints {
            constraint.validate()?;
        }

        Ok(())
    }
}

/// Constraint on the Intent execution
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Constraint {
    /// Time constraint (max duration in seconds)
    TimeLimit(u64),

    /// Memory constraint (max memory in MB)
    MemoryLimit(usize),

    /// Cost constraint (max cost in USD)
    CostLimit(f64),

    /// Required dependencies
    RequiredDependencies(Vec<String>),

    /// Forbidden dependencies
    ForbiddenDependencies(Vec<String>),

    /// Must use specific technology
    TechnologyRequirement(String),

    /// Custom constraint
    Custom {
        name: String,
        description: String,
        value: serde_json::Value,
    },
}

impl Constraint {
    /// Validate the constraint
    pub fn validate(&self) -> Result<(), MiyabiError> {
        match self {
            Constraint::TimeLimit(seconds) => {
                if *seconds == 0 {
                    return Err(MiyabiError::Validation(
                        "TimeLimit must be greater than 0".to_string(),
                    ));
                }
            },
            Constraint::MemoryLimit(mb) => {
                if *mb == 0 {
                    return Err(MiyabiError::Validation(
                        "MemoryLimit must be greater than 0".to_string(),
                    ));
                }
            },
            Constraint::CostLimit(usd) => {
                if *usd <= 0.0 {
                    return Err(MiyabiError::Validation("CostLimit must be positive".to_string()));
                }
            },
            _ => {},
        }
        Ok(())
    }
}

/// Priority level for Intent
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum Priority {
    /// P0: Critical - Drop everything
    Critical = 0,
    /// P1: High - ASAP
    High = 1,
    /// P2: Medium - Normal priority
    #[default]
    Medium = 2,
    /// P3: Low - When possible
    Low = 3,
}

/// Metadata associated with an Intent
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IntentMetadata {
    /// Associated GitHub issue number
    pub issue_number: Option<u64>,

    /// When the Intent was created
    pub created_at: chrono::DateTime<chrono::Utc>,

    /// Tags for categorization
    pub tags: Vec<String>,

    /// Additional context (flexible key-value store)
    pub context: HashMap<String, serde_json::Value>,
}

//
// ═══════════════════════════════════════════════════════════════════════════
// World Space (W)
// ═══════════════════════════════════════════════════════════════════════════
//

/// World represents the current state of the system
///
/// # Mathematical Definition
/// W ∈ W (World Space)
///
/// # Components
/// - state: Current codebase and repository state
/// - context: Execution context (git history, issues, PRs)
/// - resources: Available computational resources
/// - constraints: System-level constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct World {
    /// Current system state (codebase, files, dependencies)
    pub state: WorldState,

    /// Execution context (git, issues, knowledge)
    pub context: WorldContext,

    /// Available resources (CPU, memory, API quotas)
    pub resources: Resources,

    /// System-level constraints
    pub constraints: Vec<WorldConstraint>,
}

impl World {
    /// Get the current World state from the filesystem
    pub fn current() -> Result<Self, MiyabiError> {
        Ok(Self {
            state: WorldState::discover()?,
            context: WorldContext::load()?,
            resources: Resources::detect()?,
            constraints: Vec::new(),
        })
    }

    /// Validate the World state
    pub fn validate(&self) -> Result<(), MiyabiError> {
        self.state.validate()?;
        self.context.validate()?;
        self.resources.validate()?;

        for constraint in &self.constraints {
            constraint.validate()?;
        }

        Ok(())
    }

    /// Incorporate new information into the World (θ₆: Learning)
    pub fn incorporate(&mut self, knowledge: Knowledge) {
        // Update state with new knowledge
        self.context.knowledge.extend(knowledge.facts);
        self.state.last_updated = chrono::Utc::now();
    }
}

/// World state - represents the current codebase and environment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldState {
    /// Root directory of the project
    pub project_root: PathBuf,

    /// List of all files in the project
    pub files: Vec<FileInfo>,

    /// Dependencies (from Cargo.toml, package.json, etc.)
    pub dependencies: Vec<Dependency>,

    /// Last time this state was updated
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

impl WorldState {
    /// Discover the current state from filesystem
    pub fn discover() -> Result<Self, MiyabiError> {
        let project_root = std::env::current_dir()?;

        Ok(Self {
            project_root,
            files: Vec::new(),        // Will be populated by filesystem scan
            dependencies: Vec::new(), // Will be populated by parsing manifests
            last_updated: chrono::Utc::now(),
        })
    }

    /// Validate the state
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if !self.project_root.exists() {
            return Err(MiyabiError::Validation(format!(
                "Project root does not exist: {:?}",
                self.project_root
            )));
        }

        Ok(())
    }
}

/// Information about a file in the World
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: PathBuf,
    pub size_bytes: u64,
    pub last_modified: chrono::DateTime<chrono::Utc>,
    pub content_hash: Option<String>,
}

/// Dependency in the World
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
    pub name: String,
    pub version: String,
    pub kind: DependencyKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DependencyKind {
    Cargo,
    Npm,
    Other(String),
}

/// World context - execution environment and history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldContext {
    /// Git repository information
    pub git: GitContext,

    /// GitHub issues and PRs
    pub github: GitHubContext,

    /// Knowledge base (learned information)
    pub knowledge: Vec<Fact>,
}

impl WorldContext {
    /// Load context from the current environment
    pub fn load() -> Result<Self, MiyabiError> {
        Ok(Self {
            git: GitContext::discover()?,
            github: GitHubContext::empty(),
            knowledge: Vec::new(),
        })
    }

    /// Validate the context
    pub fn validate(&self) -> Result<(), MiyabiError> {
        self.git.validate()?;
        Ok(())
    }
}

/// Git context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitContext {
    pub current_branch: String,
    pub main_branch: String,
    pub uncommitted_changes: bool,
    pub recent_commits: Vec<String>,
}

impl GitContext {
    /// Discover git information from the current repository
    pub fn discover() -> Result<Self, MiyabiError> {
        // This would use the git2 crate in practice
        Ok(Self {
            current_branch: "main".to_string(),
            main_branch: "main".to_string(),
            uncommitted_changes: false,
            recent_commits: Vec::new(),
        })
    }

    /// Validate git context
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if self.current_branch.is_empty() {
            return Err(MiyabiError::Validation("Git branch name cannot be empty".to_string()));
        }
        Ok(())
    }
}

/// GitHub context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubContext {
    pub open_issues: Vec<u64>,
    pub open_prs: Vec<u64>,
}

impl GitHubContext {
    pub fn empty() -> Self {
        Self {
            open_issues: Vec::new(),
            open_prs: Vec::new(),
        }
    }
}

/// A fact in the knowledge base
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fact {
    pub statement: String,
    pub confidence: f64, // 0.0 to 1.0
    pub source: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Knowledge update from θ₆ (Learning phase)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Knowledge {
    pub facts: Vec<Fact>,
}

/// Available computational resources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resources {
    /// Available CPU cores
    pub cpu_cores: usize,

    /// Available memory in MB
    pub memory_mb: usize,

    /// API quota limits
    pub api_quotas: HashMap<String, ApiQuota>,
}

impl Resources {
    /// Detect available resources from the system
    pub fn detect() -> Result<Self, MiyabiError> {
        Ok(Self {
            cpu_cores: num_cpus::get(),
            memory_mb: 8192, // Placeholder - would use sysinfo crate
            api_quotas: HashMap::new(),
        })
    }

    /// Validate resources
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if self.cpu_cores == 0 {
            return Err(MiyabiError::Validation("CPU cores cannot be zero".to_string()));
        }

        if self.memory_mb == 0 {
            return Err(MiyabiError::Validation("Memory cannot be zero".to_string()));
        }

        Ok(())
    }
}

/// API quota information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiQuota {
    pub limit: u64,
    pub used: u64,
    pub reset_at: chrono::DateTime<chrono::Utc>,
}

/// World-level constraint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorldConstraint {
    /// Maximum concurrent worktrees
    MaxWorktrees(usize),

    /// Maximum file size to process
    MaxFileSize(u64),

    /// Allowed file patterns (glob)
    AllowedFilePatterns(Vec<String>),

    /// Custom constraint
    Custom {
        name: String,
        value: serde_json::Value,
    },
}

impl WorldConstraint {
    pub fn validate(&self) -> Result<(), MiyabiError> {
        match self {
            WorldConstraint::MaxWorktrees(n) => {
                if *n == 0 {
                    return Err(MiyabiError::Validation(
                        "MaxWorktrees must be greater than 0".to_string(),
                    ));
                }
            },
            WorldConstraint::MaxFileSize(bytes) => {
                if *bytes == 0 {
                    return Err(MiyabiError::Validation(
                        "MaxFileSize must be greater than 0".to_string(),
                    ));
                }
            },
            _ => {},
        }
        Ok(())
    }
}

//
// ═══════════════════════════════════════════════════════════════════════════
// Result Space (R)
// ═══════════════════════════════════════════════════════════════════════════
//

/// Result represents the outcome of Ω function execution
///
/// # Mathematical Definition
/// R ∈ R (Result Space)
///
/// # Components
/// - output: Generated artifacts (code, files, PRs)
/// - quality: Q(R) score ∈ [0, 1]
/// - metadata: Execution metadata (time, iterations, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SWMLResult {
    /// Generated output (files, PRs, etc.)
    pub output: Output,

    /// Quality score: Q(R) ∈ [0, 1]
    /// Target: Q* = 0.80 (Safety Axiom)
    pub quality: f64,

    /// Execution metadata
    pub metadata: ResultMetadata,
}

impl SWMLResult {
    /// Create a new Result
    pub fn new(output: Output, quality: f64) -> Self {
        Self {
            output,
            quality,
            metadata: ResultMetadata {
                execution_time_ms: 0,
                iteration_count: 1,
                phase_times: HashMap::new(),
                converged: quality >= 0.80,
            },
        }
    }

    /// Check if quality meets the Safety Axiom threshold
    pub fn meets_quality_threshold(&self) -> bool {
        self.quality >= 0.80 // Q* = 0.80
    }

    /// Validate the result
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if !(0.0..=1.0).contains(&self.quality) {
            return Err(MiyabiError::Validation(format!(
                "Quality must be in range [0, 1], got {}",
                self.quality
            )));
        }

        self.output.validate()?;

        Ok(())
    }
}

/// Output artifacts produced by Ω
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Output {
    /// Files created or modified
    pub files: Vec<FileChange>,

    /// Pull request information
    pub pull_request: Option<PullRequestInfo>,

    /// Test results
    pub test_results: Option<TestResults>,
}

impl Output {
    pub fn empty() -> Self {
        Self {
            files: Vec::new(),
            pull_request: None,
            test_results: None,
        }
    }

    pub fn validate(&self) -> Result<(), MiyabiError> {
        // Validate all file changes
        for file in &self.files {
            file.validate()?;
        }

        Ok(())
    }
}

/// Information about a file change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: PathBuf,
    pub kind: FileChangeKind,
    pub lines_added: usize,
    pub lines_removed: usize,
}

impl FileChange {
    pub fn validate(&self) -> Result<(), MiyabiError> {
        if self.path.to_str().is_none() {
            return Err(MiyabiError::Validation("File path must be valid UTF-8".to_string()));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileChangeKind {
    Created,
    Modified,
    Deleted,
}

/// Pull request information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestInfo {
    pub number: u64,
    pub title: String,
    pub branch: String,
    pub merged: bool,
}

/// Test execution results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResults {
    pub total: usize,
    pub passed: usize,
    pub failed: usize,
    pub skipped: usize,
}

impl TestResults {
    /// Calculate test pass rate (0.0 to 1.0)
    pub fn pass_rate(&self) -> f64 {
        if self.total == 0 {
            return 0.0;
        }
        self.passed as f64 / self.total as f64
    }
}

/// Metadata about the execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultMetadata {
    /// Total execution time in milliseconds
    pub execution_time_ms: u64,

    /// Number of iterations until convergence
    pub iteration_count: usize,

    /// Time spent in each phase (θ₁-θ₆)
    pub phase_times: HashMap<String, u64>,

    /// Whether quality converged to Q*
    pub converged: bool,
}

//
// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════
//

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intent_creation() {
        let intent = Intent::from_description("Implement authentication");
        assert_eq!(intent.description, "Implement authentication");
        assert_eq!(intent.priority, Priority::Medium);
    }

    #[test]
    fn test_intent_with_constraints() {
        let intent = Intent::from_issue(123)
            .with_constraint(Constraint::TimeLimit(3600))
            .with_priority(Priority::High);

        assert_eq!(intent.constraints.len(), 1);
        assert_eq!(intent.priority, Priority::High);
    }

    #[test]
    fn test_intent_validation() {
        let valid_intent = Intent::from_description("Valid description");
        assert!(valid_intent.validate().is_ok());

        let invalid_intent = Intent::from_description("");
        assert!(invalid_intent.validate().is_err());
    }

    #[test]
    fn test_constraint_validation() {
        let valid = Constraint::TimeLimit(3600);
        assert!(valid.validate().is_ok());

        let invalid = Constraint::TimeLimit(0);
        assert!(invalid.validate().is_err());
    }

    #[test]
    fn test_result_quality_threshold() {
        let good_result = SWMLResult::new(Output::empty(), 0.85);
        assert!(good_result.meets_quality_threshold());

        let bad_result = SWMLResult::new(Output::empty(), 0.75);
        assert!(!bad_result.meets_quality_threshold());
    }

    #[test]
    fn test_result_validation() {
        let valid = SWMLResult::new(Output::empty(), 0.85);
        assert!(valid.validate().is_ok());

        let invalid = SWMLResult::new(Output::empty(), 1.5);
        assert!(invalid.validate().is_err());
    }

    #[test]
    fn test_test_results_pass_rate() {
        let results = TestResults {
            total: 100,
            passed: 95,
            failed: 5,
            skipped: 0,
        };

        assert_eq!(results.pass_rate(), 0.95);
    }

    #[test]
    fn test_priority_ordering() {
        assert!(Priority::Critical < Priority::High);
        assert!(Priority::High < Priority::Medium);
        assert!(Priority::Medium < Priority::Low);
    }
}
