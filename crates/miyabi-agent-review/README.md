# miyabi-agent-review

**Code review, quality scoring (100-point scale), and security scanning agent for the Miyabi framework.**

[![Crates.io](https://img.shields.io/crates/v/miyabi-agent-review.svg)](https://crates.io/crates/miyabi-agent-review)
[![Documentation](https://docs.rs/miyabi-agent-review/badge.svg)](https://docs.rs/miyabi-agent-review)
[![License](https://img.shields.io/crates/l/miyabi-agent-review.svg)](../../LICENSE)

## 📋 Overview

`miyabi-agent-review` (通称: **めだまん**) is an automated code review agent that performs comprehensive quality analysis on Rust codebases. It integrates `cargo clippy`, `cargo check`, `cargo-audit`, and test coverage tools to generate detailed quality reports with actionable recommendations.

**Key Capabilities**:
- 🔍 **Linting Analysis**: Runs `cargo clippy` and scores based on warnings
- 🛠️ **Type Checking**: Runs `cargo check` and detects compilation errors
- 🔒 **Security Scanning**: Uses `cargo-audit` to detect known vulnerabilities
- 📊 **Coverage Analysis**: Calculates test coverage (integrates with `cargo-tarpaulin`)
- 📈 **100-Point Scoring**: Generates overall quality score with detailed breakdown
- ⚠️ **Escalation**: Automatically escalates to Tech Lead if score < 60

## 🚀 Features

- **Automated Quality Scoring**: 100-point scale based on:
  - Clippy warnings (100 - warnings × 5)
  - Type errors (100 - errors × 10)
  - Security vulnerabilities (dynamic scoring based on severity)
  - Test coverage (target: 80%+)
- **Detailed Issue Reporting**: File, line, severity, and message for each issue
- **Recommendations**: Actionable suggestions to improve code quality
- **Escalation Logic**: Automatically escalates low-quality code (< 60 score) to human reviewers
- **JSON Output**: Structured quality reports for CI/CD integration

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-agent-review = "0.1.0"
```

Or install the CLI:

```bash
cargo install miyabi-cli
```

## 🔧 Usage

### As a Library

```rust
use miyabi_agent_review::ReviewAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task, TaskType};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure agent
    let config = AgentConfig {
        device_identifier: "macbook-pro".to_string(),
        github_token: std::env::var("GITHUB_TOKEN")?,
        repo_owner: Some("your-org".to_string()),
        repo_name: Some("your-repo".to_string()),
        ..Default::default()
    };

    // Create agent
    let reviewer = ReviewAgent::new(config);

    // Create task
    let task = Task {
        id: "task-001".to_string(),
        title: "Review PR #123".to_string(),
        description: "Review code quality for feature implementation".to_string(),
        task_type: TaskType::Feature,
        ..Default::default()
    };

    // Execute review
    let result = reviewer.execute(&task).await?;

    // Check quality score
    if let Some(metrics) = result.metrics {
        if let Some(score) = metrics.quality_score {
            println!("Quality Score: {}/100", score);

            if score >= 80 {
                println!("✅ Code approved for merge!");
            } else {
                println!("❌ Code needs improvement");
            }
        }
    }

    Ok(())
}
```

### As a CLI Tool

```bash
# Review current directory
miyabi agent run review --task-id task-001

# Review specific path
cd /path/to/your/project
miyabi agent run review --task-id task-002

# With custom config
miyabi agent run review --task-id task-003 --config config.toml
```

## 📊 Quality Report Structure

```json
{
  "score": 87,
  "passed": true,
  "issues": [
    {
      "issue_type": "Eslint",
      "severity": "Medium",
      "message": "unused variable `foo`",
      "file": "src/main.rs",
      "line": 42,
      "score_impact": 5
    }
  ],
  "recommendations": [
    "Fix clippy warnings to improve code quality",
    "Increase test coverage to at least 80%"
  ],
  "breakdown": {
    "clippy_score": 90,
    "rustc_score": 100,
    "security_score": 100,
    "test_coverage_score": 75
  }
}
```

## 🔒 Security Scanning

The agent integrates `cargo-audit` to detect known security vulnerabilities:

```bash
# Install cargo-audit (required for security scanning)
cargo install cargo-audit

# Review will automatically run security checks
miyabi agent run review --task-id security-check
```

**Security Scoring**:
- **100**: No vulnerabilities detected
- **80**: Low severity vulnerabilities only
- **60**: Medium severity vulnerabilities
- **40**: High severity vulnerabilities
- **0**: Critical vulnerabilities found

## 🧪 Testing

```bash
# Run all tests
cargo test --package miyabi-agent-review

# Run with output
cargo test --package miyabi-agent-review -- --nocapture

# Test specific functionality
cargo test --package miyabi-agent-review test_review_agent_creation
```

## 📈 Scoring Algorithm

### Overall Score Calculation

```
Overall Score = Average(Clippy Score, Rustc Score, Security Score, Coverage Score)
```

### Component Scores

1. **Clippy Score**: `100 - (warnings × 5)` (minimum: 0)
2. **Rustc Score**: `100 - (errors × 10)` (minimum: 0)
3. **Security Score**: Dynamic based on vulnerability severity
4. **Coverage Score**: Based on test coverage percentage (target: 80%+)

### Approval Threshold

- **✅ Approved**: Score ≥ 80
- **⚠️ Needs Work**: Score 60-79
- **❌ Escalated**: Score < 60 (auto-escalates to Tech Lead)

## 🏗️ Architecture

```
ReviewAgent
  ├── run_clippy()           → ClippyResult
  ├── run_rustc_check()      → RustcResult
  ├── run_security_audit()   → SecurityResult
  ├── calculate_coverage()   → CoverageResult
  └── generate_quality_report() → QualityReport
```

## 🔗 Dependencies

- **Core**: `miyabi-agent-core`, `miyabi-types`, `miyabi-core`
- **Runtime**: `tokio`, `async-trait`
- **Serialization**: `serde`, `serde_json`
- **Utilities**: `chrono`, `regex`, `thiserror`, `tracing`

## 📚 Related Crates

- [`miyabi-agent-coordinator`](../miyabi-agent-coordinator) - Task orchestration and DAG planning
- [`miyabi-agent-codegen`](../miyabi-agent-codegen) - AI-powered code generation
- [`miyabi-agent-pr`](../miyabi-agent-pr) - Pull request creation and management
- [`miyabi-types`](../miyabi-types) - Shared type definitions
- [`miyabi-agent-core`](../miyabi-agent-core) - Base agent traits and utilities

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

## 🔖 Version History

- **v0.1.0** (2025-10-25): Initial release
  - Clippy integration
  - Rustc type checking
  - Security scanning (cargo-audit)
  - 100-point quality scoring
  - Escalation logic

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
