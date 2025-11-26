//! Quality Checker for Rust projects
//!
//! Runs cargo test, clippy, fmt, and audit to assess code quality

use crate::error::{Result, SchedulerError};
use miyabi_types::quality::{
    QualityBreakdown, QualityIssue, QualityIssueType, QualityReport, QualitySeverity,
};
use std::path::Path;
use std::process::Stdio;
use tokio::process::Command;
use tracing::{info, warn};

/// Quality checker for Rust projects
pub struct QualityChecker {
    /// Project root path
    project_path: std::path::PathBuf,
}

impl QualityChecker {
    /// Create a new quality checker
    pub fn new(project_path: impl AsRef<Path>) -> Self {
        Self {
            project_path: project_path.as_ref().to_path_buf(),
        }
    }

    /// Run all quality checks and generate report
    pub async fn run_checks(&self) -> Result<QualityReport> {
        info!("🔍 Running quality checks at {:?}", self.project_path);

        // Run checks in parallel
        let (test_result, clippy_result, fmt_result, audit_result) = tokio::join!(
            self.run_cargo_test(),
            self.run_cargo_clippy(),
            self.run_cargo_fmt_check(),
            self.run_cargo_audit(),
        );

        // Calculate individual scores
        let test_score = Self::calculate_test_score(&test_result);
        let clippy_score = Self::calculate_clippy_score(&clippy_result);
        let fmt_score = Self::calculate_fmt_score(&fmt_result);
        let audit_score = Self::calculate_audit_score(&audit_result);

        info!("   Test score: {}/100", test_score);
        info!("   Clippy score: {}/100", clippy_score);
        info!("   Format score: {}/100", fmt_score);
        info!("   Security score: {}/100", audit_score);

        // Collect issues
        let mut issues = Vec::new();
        if let Err(e) = &test_result {
            issues.push(QualityIssue {
                issue_type: QualityIssueType::Coverage,
                severity: QualitySeverity::High,
                message: format!("Test failures: {}", e),
                file: None,
                line: None,
                column: None,
                score_impact: 100 - test_score,
            });
        }

        if let Err(e) = &clippy_result {
            issues.push(QualityIssue {
                issue_type: QualityIssueType::Eslint,
                severity: QualitySeverity::Medium,
                message: format!("Clippy warnings: {}", e),
                file: None,
                line: None,
                column: None,
                score_impact: 100 - clippy_score,
            });
        }

        if let Err(e) = &fmt_result {
            issues.push(QualityIssue {
                issue_type: QualityIssueType::Eslint,
                severity: QualitySeverity::Low,
                message: format!("Format check failed: {}", e),
                file: None,
                line: None,
                column: None,
                score_impact: 100 - fmt_score,
            });
        }

        if let Err(e) = &audit_result {
            issues.push(QualityIssue {
                issue_type: QualityIssueType::Security,
                severity: QualitySeverity::Critical,
                message: format!("Security audit failed: {}", e),
                file: None,
                line: None,
                column: None,
                score_impact: 100 - audit_score,
            });
        }

        // Create breakdown
        let breakdown = QualityBreakdown {
            clippy_score,
            rustc_score: test_score, // Using test as rustc proxy
            security_score: audit_score,
            test_coverage_score: test_score,
        };

        // Calculate overall score (weighted average)
        let overall_score = Self::calculate_overall_score(&breakdown);

        // Generate recommendations
        let recommendations = Self::generate_recommendations(&breakdown);

        Ok(QualityReport {
            score: overall_score,
            passed: overall_score >= 80,
            issues,
            recommendations,
            breakdown,
        })
    }

    /// Run cargo test
    async fn run_cargo_test(&self) -> Result<String> {
        info!("   Running cargo test...");

        let output = Command::new("cargo")
            .arg("test")
            .arg("--all")
            .arg("--no-fail-fast")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            info!("   ✅ All tests passed");
            Ok(stdout.to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("   ❌ Test failures detected");
            Err(SchedulerError::CommandFailed {
                command: "cargo test".to_string(),
                stderr: stderr.to_string(),
            })
        }
    }

    /// Run cargo clippy
    async fn run_cargo_clippy(&self) -> Result<String> {
        info!("   Running cargo clippy...");

        let output = Command::new("cargo")
            .arg("clippy")
            .arg("--all-targets")
            .arg("--")
            .arg("-D")
            .arg("warnings")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if output.status.success() {
            info!("   ✅ No clippy warnings");
            Ok(String::new())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("   ⚠️  Clippy warnings detected");
            Err(SchedulerError::CommandFailed {
                command: "cargo clippy".to_string(),
                stderr: stderr.to_string(),
            })
        }
    }

    /// Run cargo fmt check
    async fn run_cargo_fmt_check(&self) -> Result<String> {
        info!("   Running cargo fmt --check...");

        let output = Command::new("cargo")
            .arg("fmt")
            .arg("--")
            .arg("--check")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if output.status.success() {
            info!("   ✅ Code is properly formatted");
            Ok(String::new())
        } else {
            warn!("   ⚠️  Format check failed");
            Err(SchedulerError::CommandFailed {
                command: "cargo fmt --check".to_string(),
                stderr: "Format check failed - run cargo fmt to fix".to_string(),
            })
        }
    }

    /// Run cargo audit
    async fn run_cargo_audit(&self) -> Result<String> {
        info!("   Running cargo audit...");

        // Check if cargo-audit is installed
        let check_output = Command::new("cargo")
            .arg("audit")
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await;

        if check_output.is_err() || !check_output.unwrap().success() {
            warn!("   ⚠️  cargo-audit not installed, skipping security audit");
            return Ok("cargo-audit not installed".to_string());
        }

        let output = Command::new("cargo")
            .arg("audit")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if output.status.success() {
            info!("   ✅ No security vulnerabilities detected");
            Ok(String::new())
        } else {
            let stdout = String::from_utf8_lossy(&output.stdout);
            warn!("   ⚠️  Security vulnerabilities detected");
            Err(SchedulerError::CommandFailed {
                command: "cargo audit".to_string(),
                stderr: stdout.to_string(),
            })
        }
    }

    /// Calculate test score from result
    fn calculate_test_score(result: &Result<String>) -> u8 {
        match result {
            Ok(_) => 100,
            Err(_) => 50, // Partial credit for having tests
        }
    }

    /// Calculate clippy score from result
    fn calculate_clippy_score(result: &Result<String>) -> u8 {
        match result {
            Ok(_) => 100,
            Err(e) => {
                let error_str = format!("{:?}", e);
                let warning_count = error_str.matches("warning:").count();
                if warning_count == 0 {
                    100
                } else if warning_count <= 5 {
                    85
                } else if warning_count <= 10 {
                    70
                } else {
                    50
                }
            }
        }
    }

    /// Calculate format score from result
    fn calculate_fmt_score(result: &Result<String>) -> u8 {
        match result {
            Ok(_) => 100,
            Err(_) => 80, // Minor deduction for formatting issues
        }
    }

    /// Calculate audit score from result
    fn calculate_audit_score(result: &Result<String>) -> u8 {
        match result {
            Ok(msg) if msg.contains("not installed") => 100, // No penalty if not installed
            Ok(_) => 100,
            Err(e) => {
                let error_str = format!("{:?}", e);
                let vuln_count = error_str.matches("vulnerability").count();
                if vuln_count == 0 {
                    100
                } else if vuln_count <= 2 {
                    70
                } else {
                    40
                }
            }
        }
    }

    /// Calculate overall score (weighted average)
    fn calculate_overall_score(breakdown: &QualityBreakdown) -> u8 {
        // Weights: clippy=30%, rustc=25%, security=30%, coverage=15%
        let weighted = (breakdown.clippy_score as u32 * 30
            + breakdown.rustc_score as u32 * 25
            + breakdown.security_score as u32 * 30
            + breakdown.test_coverage_score as u32 * 15)
            / 100;
        weighted.min(100) as u8
    }

    /// Generate recommendations based on breakdown
    fn generate_recommendations(breakdown: &QualityBreakdown) -> Vec<String> {
        let mut recommendations = Vec::new();

        if breakdown.clippy_score < 80 {
            recommendations.push("Run 'cargo clippy --fix' to auto-fix linting issues".to_string());
        }

        if breakdown.rustc_score < 80 {
            recommendations.push("Fix failing tests before proceeding".to_string());
        }

        if breakdown.security_score < 80 {
            recommendations
                .push("Address security vulnerabilities with 'cargo update'".to_string());
        }

        if breakdown.test_coverage_score < 80 {
            recommendations.push("Add more test coverage to critical paths".to_string());
        }

        recommendations
    }

    /// Auto-fix quality issues
    pub async fn auto_fix(&self) -> Result<()> {
        info!("🔧 Running auto-fix...");

        // Run cargo clippy --fix
        info!("   Running cargo clippy --fix...");
        let clippy_output = Command::new("cargo")
            .arg("clippy")
            .arg("--fix")
            .arg("--allow-dirty")
            .arg("--allow-staged")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if clippy_output.status.success() {
            info!("   ✅ Clippy auto-fix completed");
        } else {
            warn!("   ⚠️  Clippy auto-fix had issues");
        }

        // Run cargo fmt
        info!("   Running cargo fmt...");
        let fmt_output = Command::new("cargo")
            .arg("fmt")
            .current_dir(&self.project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        if fmt_output.status.success() {
            info!("   ✅ Code formatted");
        } else {
            warn!("   ⚠️  Format failed");
        }

        info!("✅ Auto-fix completed");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_overall_score() {
        let breakdown = QualityBreakdown {
            clippy_score: 100,
            rustc_score: 100,
            security_score: 100,
            test_coverage_score: 100,
        };
        assert_eq!(QualityChecker::calculate_overall_score(&breakdown), 100);

        let breakdown = QualityBreakdown {
            clippy_score: 80,
            rustc_score: 80,
            security_score: 80,
            test_coverage_score: 80,
        };
        assert_eq!(QualityChecker::calculate_overall_score(&breakdown), 80);
    }

    #[test]
    fn test_generate_recommendations() {
        let breakdown = QualityBreakdown {
            clippy_score: 70,
            rustc_score: 70,
            security_score: 70,
            test_coverage_score: 70,
        };
        let recommendations = QualityChecker::generate_recommendations(&breakdown);
        assert_eq!(recommendations.len(), 4);
    }

    #[test]
    fn test_calculate_test_score() {
        assert_eq!(
            QualityChecker::calculate_test_score(&Ok(String::new())),
            100
        );
        assert_eq!(
            QualityChecker::calculate_test_score(&Err(SchedulerError::CommandFailed {
                command: "test".to_string(),
                stderr: "test".to_string()
            })),
            50
        );
    }
}
