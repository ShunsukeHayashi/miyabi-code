# QualityChecker Integration Guide

## Overview

The `QualityChecker` module provides automatic quality assessment for Rust projects, including:

- Parallel execution of `cargo test`, `cargo clippy`, `cargo fmt --check`, `cargo audit`
- Quality score calculation (0-100) with weighted scoring
- Auto-fix capabilities using `cargo clippy --fix` and `cargo fmt`
- Detailed quality reports with recommendations

## Architecture

```
Phase 4-5 (Code Generation Complete)
    ↓
QualityChecker::run_checks()
    ├─ [Parallel Execution]
    │   ├─ cargo test --all
    │   ├─ cargo clippy -- -D warnings
    │   ├─ cargo fmt -- --check
    │   └─ cargo audit
    ↓
Quality Score Calculation
    ↓
Decision Logic:
    ├─ Score ≥ 80  → Phase 7 (Auto-approve)
    ├─ Score 60-79 → Phase 7 (Needs review)
    └─ Score < 60  → Auto-fix → Retry Phase 4
```

## Scoring Algorithm

### Weighted Average
```rust
score = (clippy_score * 30% +
         rustc_score * 25% +
         security_score * 30% +
         test_coverage_score * 15%)
```

### Individual Scores

**Test Score:**
- 100: All tests passing
- 50: Test failures (partial credit for having tests)

**Clippy Score:**
- 100: No warnings
- 85: ≤5 warnings
- 70: ≤10 warnings
- 50: >10 warnings

**Format Score:**
- 100: Properly formatted
- 80: Format issues (minor deduction)

**Security Score:**
- 100: No vulnerabilities or cargo-audit not installed
- 70: ≤2 vulnerabilities
- 40: >2 vulnerabilities

## Usage

### Basic Usage

```rust
use miyabi_orchestrator::QualityChecker;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let checker = QualityChecker::new("/path/to/project");

    // Run quality checks
    let report = checker.run_checks().await?;

    println!("Quality Score: {}/100", report.score);
    println!("Passed: {}", report.passed);

    if !report.issues.is_empty() {
        println!("Issues:");
        for issue in &report.issues {
            println!("  - {}: {}", issue.severity, issue.message);
        }
    }

    if !report.recommendations.is_empty() {
        println!("Recommendations:");
        for rec in &report.recommendations {
            println!("  - {}", rec);
        }
    }

    Ok(())
}
```

### With Auto-Fix

```rust
use miyabi_orchestrator::QualityChecker;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let checker = QualityChecker::new("/path/to/project");

    // Run quality checks
    let mut report = checker.run_checks().await?;

    // If score is low, try auto-fix
    if report.score < 60 {
        println!("Score too low ({}), running auto-fix...", report.score);
        checker.auto_fix().await?;

        // Re-run checks
        report = checker.run_checks().await?;
        println!("New score after auto-fix: {}", report.score);
    }

    Ok(())
}
```

## Integration with Headless Orchestrator

When the `HeadlessOrchestrator` is implemented for Phase 4-9, integrate QualityChecker as follows:

```rust
use miyabi_orchestrator::QualityChecker;
use miyabi_types::workflow::Phase;

impl HeadlessOrchestrator {
    async fn execute_phase_6(&mut self, worktree_path: &Path) -> Result<Phase> {
        info!("🔍 Starting Phase 6: Quality Check");

        let checker = QualityChecker::new(worktree_path);
        let mut report = checker.run_checks().await?;

        // Log results
        info!("Quality Score: {}/100", report.score);
        info!("  Clippy: {}/100", report.breakdown.clippy_score);
        info!("  Tests: {}/100", report.breakdown.rustc_score);
        info!("  Security: {}/100", report.breakdown.security_score);
        info!("  Coverage: {}/100", report.breakdown.test_coverage_score);

        // Decision logic
        if report.score >= 80 {
            info!("✅ Quality check passed (score >= 80), proceeding to Phase 7");
            Ok(Phase::PRCreation)
        } else if report.score >= 60 {
            warn!("⚠️  Quality check passed with review needed (60 <= score < 80)");
            // Store report for manual review
            self.store_quality_report(report)?;
            Ok(Phase::PRCreation)
        } else {
            warn!("❌ Quality check failed (score < 60), attempting auto-fix");

            // Try auto-fix
            checker.auto_fix().await?;

            // Re-run checks
            report = checker.run_checks().await?;

            if report.score >= 60 {
                info!("✅ Auto-fix successful, new score: {}", report.score);
                Ok(Phase::PRCreation)
            } else {
                // Retry code generation
                warn!("❌ Auto-fix insufficient, retrying Phase 4");
                Ok(Phase::CodeGeneration)
            }
        }
    }
}
```

## Quality Report Structure

```rust
pub struct QualityReport {
    pub score: u8,                        // Overall score (0-100)
    pub passed: bool,                     // true if score >= 80
    pub issues: Vec<QualityIssue>,        // Detected issues
    pub recommendations: Vec<String>,      // Improvement recommendations
    pub breakdown: QualityBreakdown,      // Detailed breakdown
}

pub struct QualityBreakdown {
    pub clippy_score: u8,
    pub rustc_score: u8,
    pub security_score: u8,
    pub test_coverage_score: u8,
}

pub struct QualityIssue {
    pub issue_type: QualityIssueType,
    pub severity: QualitySeverity,
    pub message: String,
    pub file: Option<String>,
    pub line: Option<usize>,
    pub column: Option<usize>,
    pub score_impact: u8,
}
```

## Testing

The QualityChecker module includes comprehensive tests:

### Unit Tests
```bash
cargo test --package miyabi-orchestrator --lib quality_checker
```

### Integration Tests
```bash
cargo test --package miyabi-orchestrator --test quality_checker_test
```

Test coverage:
- ✅ Clean project scoring
- ✅ Project with warnings
- ✅ Project with format issues
- ✅ Project with test failures
- ✅ Auto-fix functionality
- ✅ Quality breakdown validation
- ✅ Recommendation generation
- ✅ Weighted scoring calculation

## Performance

- **Typical execution time**: < 3 minutes (parallel execution)
- **Parallelization**: All 4 checks run concurrently using `tokio::join!`
- **Resource usage**: Minimal, delegates to cargo tooling

## Error Handling

The QualityChecker uses `miyabi-orchestrator::error::SchedulerError` for error handling:

```rust
pub enum SchedulerError {
    CommandFailed { command: String, stderr: String },
    Io(std::io::Error),
    // ... other variants
}
```

Errors are propagated up to allow the orchestrator to decide on retry logic.

## Future Enhancements

1. **Detailed Coverage Metrics**: Integrate with `tarpaulin` or `llvm-cov` for actual coverage %
2. **Custom Scoring Weights**: Allow configuration of scoring weights
3. **Incremental Checks**: Only check changed files for faster iteration
4. **Rich Reporting**: Generate HTML reports with detailed breakdowns
5. **GitHub Integration**: Post quality reports as PR comments

## Related Issues

- #571: Phase 6 - Quality Check & Auto-Fix
- #575: Complete Autonomous Workflow (Master Issue)
- #570: Phase 4 - Claude Code Headless Integration

## See Also

- `crates/miyabi-orchestrator/src/quality_checker.rs` - Implementation
- `crates/miyabi-orchestrator/tests/quality_checker_test.rs` - Integration tests
- `crates/miyabi-types/src/quality.rs` - Quality type definitions
