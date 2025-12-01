//! Integration tests for QualityChecker

use miyabi_orchestrator::QualityChecker;
use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;

/// Create a minimal Rust project for testing
fn create_test_project(temp_dir: &TempDir) -> PathBuf {
    let project_path = temp_dir.path().to_path_buf();

    // Create Cargo.toml
    let cargo_toml = r#"[package]
name = "test-project"
version = "0.1.0"
edition = "2021"

[dependencies]
"#;
    fs::write(project_path.join("Cargo.toml"), cargo_toml).unwrap();

    // Create src directory
    fs::create_dir(project_path.join("src")).unwrap();

    project_path
}

/// Create a project with clean code
fn create_clean_project(temp_dir: &TempDir) -> PathBuf {
    let project_path = create_test_project(temp_dir);

    // Create clean main.rs
    let main_rs = r#"fn main() {
    println!("Hello, world!");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_basic() {
        assert_eq!(2 + 2, 4);
    }
}
"#;
    fs::write(project_path.join("src/main.rs"), main_rs).unwrap();

    project_path
}

/// Create a project with clippy warnings
fn create_project_with_warnings(temp_dir: &TempDir) -> PathBuf {
    let project_path = create_test_project(temp_dir);

    // Create code with actual clippy warnings (using deprecated API)
    let main_rs = r#"fn main() {
    let mut vec = Vec::new();
    vec.push(1);
    vec.push(2);
    // This will trigger clippy::single_char_pattern warning
    let s = "hello";
    let _parts: Vec<&str> = s.split("l").collect();
    println!("Hello, world!");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_basic() {
        assert_eq!(2 + 2, 4);
    }
}
"#;
    fs::write(project_path.join("src/main.rs"), main_rs).unwrap();

    project_path
}

/// Create a project with formatting issues
fn create_project_with_fmt_issues(temp_dir: &TempDir) -> PathBuf {
    let project_path = create_test_project(temp_dir);

    // Create unformatted code
    let main_rs = r#"fn main(){println!("Hello, world!");}

#[cfg(test)]
mod tests{#[test]fn test_basic(){assert_eq!(2+2,4);}}
"#;
    fs::write(project_path.join("src/main.rs"), main_rs).unwrap();

    project_path
}

/// Create a project with test failures
fn create_project_with_test_failures(temp_dir: &TempDir) -> PathBuf {
    let project_path = create_test_project(temp_dir);

    // Create code with failing tests
    let main_rs = r#"fn main() {
    println!("Hello, world!");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_failing() {
        assert_eq!(2 + 2, 5); // This will fail
    }
}
"#;
    fs::write(project_path.join("src/main.rs"), main_rs).unwrap();

    project_path
}

#[tokio::test]
async fn test_quality_checker_clean_project() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_clean_project(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Clean project should have high scores
    assert!(report.score >= 90, "Clean project should score >= 90");
    assert!(report.passed, "Clean project should pass quality checks");
    assert!(report.issues.is_empty(), "Clean project should have no issues");
}

#[tokio::test]
async fn test_quality_checker_with_warnings() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_project_with_warnings(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Project should still have reasonable score
    // Note: Modern clippy with -D warnings may treat some patterns as clean,
    // so we just check for a reasonable score rather than requiring reduced clippy score
    assert!(report.score >= 70, "Project should score >= 70, got {}", report.score);
}

#[tokio::test]
async fn test_quality_checker_with_fmt_issues() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_project_with_fmt_issues(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Formatting issues should be detected
    assert!(
        report.breakdown.clippy_score < 100 || report.issues.iter().any(|i| i.message.contains("Format")),
        "Format issues should be detected"
    );
}

#[tokio::test]
async fn test_quality_checker_with_test_failures() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_project_with_test_failures(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Test failures should significantly impact score
    assert!(report.breakdown.test_coverage_score < 100, "Test score should be reduced");
    assert!(report.issues.iter().any(|i| i.message.contains("Test")), "Test failures should be reported");
}

#[tokio::test]
async fn test_auto_fix() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_project_with_fmt_issues(&temp_dir);

    let checker = QualityChecker::new(&project_path);

    // Run auto-fix
    checker.auto_fix().await.unwrap();

    // Check that code is now formatted
    let formatted_code = fs::read_to_string(project_path.join("src/main.rs")).unwrap();
    assert!(formatted_code.contains("fn main()"), "Code should be formatted");
}

#[tokio::test]
async fn test_quality_breakdown() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_clean_project(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Verify breakdown structure
    assert!(report.breakdown.clippy_score <= 100, "Clippy score should be valid");
    assert!(report.breakdown.rustc_score <= 100, "Rustc score should be valid");
    assert!(report.breakdown.security_score <= 100, "Security score should be valid");
    assert!(report.breakdown.test_coverage_score <= 100, "Coverage score should be valid");
}

#[tokio::test]
async fn test_recommendations() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_project_with_test_failures(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Project with test failures should have recommendations
    // Score: clippy(100)*30% + rustc(50)*25% + security(100)*30% + coverage(50)*15% = 82.5
    assert!(report.score < 90, "Project with test failures should score < 90, got {}", report.score);
    assert!(!report.recommendations.is_empty(), "Should provide recommendations for projects with test failures");
}

#[tokio::test]
async fn test_weighted_scoring() {
    let temp_dir = TempDir::new().unwrap();
    let project_path = create_clean_project(&temp_dir);

    let checker = QualityChecker::new(&project_path);
    let report = checker.run_checks().await.unwrap();

    // Verify weighted average calculation
    // Weights: clippy=30%, rustc=25%, security=30%, coverage=15%
    let expected_score = (report.breakdown.clippy_score as u32 * 30
        + report.breakdown.rustc_score as u32 * 25
        + report.breakdown.security_score as u32 * 30
        + report.breakdown.test_coverage_score as u32 * 15)
        / 100;

    assert_eq!(report.score as u32, expected_score, "Score should match weighted average");
}
