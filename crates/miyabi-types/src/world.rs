//! World types for 5-Worlds Quality Assurance Strategy
//!
//! This module defines types for the 5-Worlds parallel execution strategy,
//! where each code generation task runs in 5 parallel "worlds" with different
//! LLM parameters, and the best result is selected based on evaluation scores.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::path::PathBuf;

/// WorldId represents one of the 5 parallel execution worlds
///
/// Each World runs with different LLM parameters to maximize quality:
/// - Alpha: Conservative (T=0.3) - Stable, predictable code
/// - Beta: Balanced (T=0.7) - Standard quality baseline
/// - Gamma: Creative (T=1.2) - Innovative solutions
/// - Delta: Alternative prompt variant - Different problem framing
/// - Epsilon: Alternative model - Different LLM entirely
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorldId {
    /// Alpha world: Conservative approach (Temperature=0.3)
    Alpha,
    /// Beta world: Balanced approach (Temperature=0.7)
    Beta,
    /// Gamma world: Creative approach (Temperature=1.2)
    Gamma,
    /// Delta world: Alternative prompt variant
    Delta,
    /// Epsilon world: Alternative model
    Epsilon,
}

impl WorldId {
    /// Returns all 5 WorldIds as an array
    pub fn all() -> [WorldId; 5] {
        [
            WorldId::Alpha,
            WorldId::Beta,
            WorldId::Gamma,
            WorldId::Delta,
            WorldId::Epsilon,
        ]
    }

    /// Returns the default temperature for this world
    pub fn default_temperature(&self) -> f64 {
        match self {
            WorldId::Alpha => 0.3,
            WorldId::Beta => 0.7,
            WorldId::Gamma => 1.2,
            WorldId::Delta => 0.7,
            WorldId::Epsilon => 0.7,
        }
    }

    /// Returns a short description of this world's strategy
    pub fn description(&self) -> &'static str {
        match self {
            WorldId::Alpha => "Conservative - Stable, predictable code",
            WorldId::Beta => "Balanced - Standard quality baseline",
            WorldId::Gamma => "Creative - Innovative solutions",
            WorldId::Delta => "Alternative - Different problem framing",
            WorldId::Epsilon => "Alternative - Different LLM model",
        }
    }
}

impl fmt::Display for WorldId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            WorldId::Alpha => write!(f, "Alpha"),
            WorldId::Beta => write!(f, "Beta"),
            WorldId::Gamma => write!(f, "Gamma"),
            WorldId::Delta => write!(f, "Delta"),
            WorldId::Epsilon => write!(f, "Epsilon"),
        }
    }
}

/// Prompt variant for alternative world strategies
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PromptVariant {
    /// Standard prompt format
    Standard,
    /// Alternative prompt variant A (used by Delta world)
    AlternativeA,
    /// Alternative prompt variant B (reserved for future use)
    AlternativeB,
}

/// Configuration for a single World execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldConfig {
    /// The WorldId this config is for
    pub id: WorldId,
    /// LLM model to use (e.g., "gpt-4o", "claude-3-5-sonnet")
    pub model: String,
    /// Temperature parameter for LLM
    pub temperature: f64,
    /// Prompt variant to use
    pub prompt_variant: PromptVariant,
    /// Path to the worktree for this world
    pub worktree_path: PathBuf,
}

impl WorldConfig {
    /// Creates a default WorldConfig for the given WorldId
    pub fn default_for(id: WorldId) -> Self {
        match id {
            WorldId::Alpha => Self {
                id,
                model: "gpt-4o".to_string(),
                temperature: 0.3,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/world-alpha"),
            },
            WorldId::Beta => Self {
                id,
                model: "gpt-4o".to_string(),
                temperature: 0.7,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/world-beta"),
            },
            WorldId::Gamma => Self {
                id,
                model: "gpt-4o".to_string(),
                temperature: 1.2,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/world-gamma"),
            },
            WorldId::Delta => Self {
                id,
                model: "gpt-4o".to_string(),
                temperature: 0.7,
                prompt_variant: PromptVariant::AlternativeA,
                worktree_path: PathBuf::from("worktrees/world-delta"),
            },
            WorldId::Epsilon => Self {
                id,
                model: "claude-3-5-sonnet".to_string(),
                temperature: 0.7,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/world-epsilon"),
            },
        }
    }

    /// Sets the worktree path for a specific issue and task
    pub fn with_issue_task_path(mut self, issue_number: u64, task_name: &str) -> Self {
        self.worktree_path = PathBuf::from(format!(
            "worktrees/world-{}/issue-{}/{}",
            self.id.to_string().to_lowercase(),
            issue_number,
            task_name
        ));
        self
    }
}

/// Evaluation score for a World's execution (100-point scale)
///
/// The total score is broken down into 5 categories:
/// - Compilation Success: 30 points (pass/fail)
/// - Test Pass Rate: 30 points (percentage of tests passed)
/// - Clippy Score: 20 points (based on warning count)
/// - Code Quality: 10 points (readability, maintainability)
/// - Security Score: 10 points (security analysis result)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationScore {
    /// Compilation success (30 points max)
    /// - 30 points if compilation succeeds
    /// - 0 points if compilation fails
    pub compilation_success: f64,

    /// Test pass rate (30 points max)
    /// - 30 points if all tests pass
    /// - Proportional score based on pass rate
    pub test_pass_rate: f64,

    /// Clippy score (20 points max)
    /// - 20 points if 0 warnings
    /// - Reduced based on warning count (max 100 warnings considered)
    pub clippy_score: f64,

    /// Code quality score (10 points max)
    /// - Based on readability, maintainability metrics
    pub code_quality: f64,

    /// Security score (10 points max)
    /// - Based on security analysis (unsafe blocks, secrets, etc.)
    pub security_score: f64,

    /// Total score (100 points max)
    /// Sum of all component scores
    pub total: f64,
}

impl EvaluationScore {
    /// Creates a new EvaluationScore with all components set to 0
    pub fn zero() -> Self {
        Self {
            compilation_success: 0.0,
            test_pass_rate: 0.0,
            clippy_score: 0.0,
            code_quality: 0.0,
            security_score: 0.0,
            total: 0.0,
        }
    }

    /// Calculates the evaluation score from execution metrics
    ///
    /// # Arguments
    /// * `build_success` - Whether compilation succeeded
    /// * `tests_passed` - Number of tests that passed
    /// * `tests_total` - Total number of tests
    /// * `clippy_warnings` - Number of clippy warnings
    /// * `code_quality_score` - Code quality score (0.0-1.0)
    /// * `security_score` - Security score (0.0-1.0)
    pub fn calculate(
        build_success: bool,
        tests_passed: usize,
        tests_total: usize,
        clippy_warnings: usize,
        code_quality_score: f64,
        security_score: f64,
    ) -> Self {
        // Compilation: 30 points (pass/fail)
        let compilation = if build_success { 30.0 } else { 0.0 };

        // Tests: 30 points (proportional to pass rate)
        let tests = if tests_total > 0 {
            (tests_passed as f64 / tests_total as f64) * 30.0
        } else {
            30.0 // No tests = assume pass
        };

        // Clippy: 20 points (deduct based on warnings, max 100 warnings considered)
        let clippy = (1.0 - (clippy_warnings.min(100) as f64 / 100.0)) * 20.0;

        // Code quality: 10 points (0.0-1.0 score * 10)
        let quality = code_quality_score.clamp(0.0, 1.0) * 10.0;

        // Security: 10 points (0.0-1.0 score * 10)
        let security = security_score.clamp(0.0, 1.0) * 10.0;

        let total = compilation + tests + clippy + quality + security;

        Self {
            compilation_success: compilation,
            test_pass_rate: tests,
            clippy_score: clippy,
            code_quality: quality,
            security_score: security,
            total,
        }
    }

    /// Returns true if this score meets the minimum quality threshold (80 points)
    pub fn meets_quality_threshold(&self) -> bool {
        self.total >= 80.0
    }

    /// Returns true if this score is a passing score (60 points)
    pub fn is_passing(&self) -> bool {
        self.total >= 60.0
    }
}

impl Default for EvaluationScore {
    fn default() -> Self {
        Self::zero()
    }
}

impl fmt::Display for EvaluationScore {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Score: {:.1}/100 (Compilation: {:.1}, Tests: {:.1}, Clippy: {:.1}, Quality: {:.1}, Security: {:.1})",
            self.total,
            self.compilation_success,
            self.test_pass_rate,
            self.clippy_score,
            self.code_quality,
            self.security_score
        )
    }
}

/// Result of a World's execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldExecutionResult {
    /// The WorldId that was executed
    pub world_id: WorldId,
    /// Whether the execution was successful
    pub success: bool,
    /// Evaluation score
    pub score: EvaluationScore,
    /// Path to the generated code artifacts
    pub artifacts_path: PathBuf,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Cost of this execution in USD
    pub cost_usd: f64,
    /// Error message if execution failed
    pub error: Option<String>,
}

impl WorldExecutionResult {
    /// Creates a failed result with the given error message
    pub fn failed(world_id: WorldId, error: String) -> Self {
        Self {
            world_id,
            success: false,
            score: EvaluationScore::zero(),
            artifacts_path: PathBuf::new(),
            duration_ms: 0,
            cost_usd: 0.0,
            error: Some(error),
        }
    }

    /// Creates a successful result with the given score and metadata
    pub fn success(
        world_id: WorldId,
        score: EvaluationScore,
        artifacts_path: PathBuf,
        duration_ms: u64,
        cost_usd: f64,
    ) -> Self {
        Self {
            world_id,
            success: true,
            score,
            artifacts_path,
            duration_ms,
            cost_usd,
            error: None,
        }
    }
}

/// Result of executing all 5 worlds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FiveWorldsResult {
    /// Results from all worlds (may include failures)
    pub results: HashMap<WorldId, WorldExecutionResult>,
    /// The winning WorldId (highest score among successful executions)
    pub winner: Option<WorldId>,
    /// Total execution time in milliseconds
    pub total_duration_ms: u64,
    /// Total cost in USD
    pub total_cost_usd: f64,
}

impl FiveWorldsResult {
    /// Creates a new FiveWorldsResult from individual world results
    pub fn from_results(results: HashMap<WorldId, WorldExecutionResult>) -> Self {
        let total_duration_ms = results.values().map(|r| r.duration_ms).sum();
        let total_cost_usd = results.values().map(|r| r.cost_usd).sum();

        // Find winner: highest score among successful executions
        let winner = results
            .iter()
            .filter(|(_, r)| r.success)
            .max_by(|(_, a), (_, b)| {
                a.score
                    .total
                    .partial_cmp(&b.score.total)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|(world_id, _)| *world_id);

        Self {
            results,
            winner,
            total_duration_ms,
            total_cost_usd,
        }
    }

    /// Returns the result for the winning world, if any
    pub fn winner_result(&self) -> Option<&WorldExecutionResult> {
        self.winner.and_then(|w| self.results.get(&w))
    }

    /// Returns the number of successful world executions
    pub fn successful_count(&self) -> usize {
        self.results.values().filter(|r| r.success).count()
    }

    /// Returns the number of failed world executions
    pub fn failed_count(&self) -> usize {
        self.results.values().filter(|r| !r.success).count()
    }

    /// Returns true if at least one world succeeded
    pub fn has_success(&self) -> bool {
        self.successful_count() > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_world_id_all() {
        let all = WorldId::all();
        assert_eq!(all.len(), 5);
        assert_eq!(all[0], WorldId::Alpha);
        assert_eq!(all[4], WorldId::Epsilon);
    }

    #[test]
    fn test_world_id_temperature() {
        assert_eq!(WorldId::Alpha.default_temperature(), 0.3);
        assert_eq!(WorldId::Beta.default_temperature(), 0.7);
        assert_eq!(WorldId::Gamma.default_temperature(), 1.2);
    }

    #[test]
    fn test_world_config_default() {
        let config = WorldConfig::default_for(WorldId::Alpha);
        assert_eq!(config.id, WorldId::Alpha);
        assert_eq!(config.model, "gpt-4o");
        assert_eq!(config.temperature, 0.3);
    }

    #[test]
    fn test_world_config_epsilon_uses_claude() {
        let config = WorldConfig::default_for(WorldId::Epsilon);
        assert_eq!(config.model, "claude-3-5-sonnet");
    }

    #[test]
    fn test_evaluation_score_calculate_perfect() {
        let score = EvaluationScore::calculate(
            true, // build success
            10,   // tests passed
            10,   // tests total
            0,    // clippy warnings
            1.0,  // code quality
            1.0,  // security
        );

        assert_eq!(score.compilation_success, 30.0);
        assert_eq!(score.test_pass_rate, 30.0);
        assert_eq!(score.clippy_score, 20.0);
        assert_eq!(score.code_quality, 10.0);
        assert_eq!(score.security_score, 10.0);
        assert_eq!(score.total, 100.0);
        assert!(score.meets_quality_threshold());
    }

    #[test]
    fn test_evaluation_score_calculate_partial() {
        let score = EvaluationScore::calculate(
            true, // build success
            7,    // tests passed
            10,   // tests total
            10,   // clippy warnings
            0.8,  // code quality
            0.9,  // security
        );

        assert_eq!(score.compilation_success, 30.0);
        assert_eq!(score.test_pass_rate, 21.0); // 7/10 * 30
        assert_eq!(score.clippy_score, 18.0); // (1 - 10/100) * 20
        assert_eq!(score.code_quality, 8.0); // 0.8 * 10
        assert_eq!(score.security_score, 9.0); // 0.9 * 10
        assert_eq!(score.total, 86.0);
        assert!(score.meets_quality_threshold());
    }

    #[test]
    fn test_evaluation_score_build_failure() {
        let score = EvaluationScore::calculate(
            false, // build failure
            10, 10, 0, 1.0, 1.0,
        );

        assert_eq!(score.compilation_success, 0.0);
        assert_eq!(score.total, 70.0); // Everything except compilation
        assert!(!score.meets_quality_threshold()); // < 80
        assert!(score.is_passing()); // >= 60
    }

    #[test]
    fn test_five_worlds_result_winner_selection() {
        let mut results = HashMap::new();

        results.insert(
            WorldId::Alpha,
            WorldExecutionResult::success(
                WorldId::Alpha,
                EvaluationScore::calculate(true, 8, 10, 5, 0.8, 0.9),
                PathBuf::from("/tmp/alpha"),
                1000,
                0.5,
            ),
        );

        results.insert(
            WorldId::Beta,
            WorldExecutionResult::success(
                WorldId::Beta,
                EvaluationScore::calculate(true, 10, 10, 0, 1.0, 1.0),
                PathBuf::from("/tmp/beta"),
                1200,
                0.6,
            ),
        );

        results.insert(
            WorldId::Gamma,
            WorldExecutionResult::failed(WorldId::Gamma, "Compilation failed".to_string()),
        );

        let five_worlds = FiveWorldsResult::from_results(results);

        assert_eq!(five_worlds.winner, Some(WorldId::Beta)); // Highest score
        assert_eq!(five_worlds.successful_count(), 2);
        assert_eq!(five_worlds.failed_count(), 1);
        assert!(five_worlds.has_success());

        let winner_result = five_worlds.winner_result().unwrap();
        assert_eq!(winner_result.score.total, 100.0);
    }

    #[test]
    fn test_world_config_with_issue_task_path() {
        let config =
            WorldConfig::default_for(WorldId::Alpha).with_issue_task_path(270, "implement_feature");

        assert_eq!(
            config.worktree_path,
            PathBuf::from("worktrees/world-alpha/issue-270/implement_feature")
        );
    }
}
