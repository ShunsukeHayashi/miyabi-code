# miyabi-agent-issue

[![Crates.io](https://img.shields.io/crates/v/miyabi-agent-issue.svg)](https://crates.io/crates/miyabi-agent-issue)
[![Documentation](https://docs.rs/miyabi-agent-issue/badge.svg)](https://docs.rs/miyabi-agent-issue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Status**: Stable | **Category**: Agent

IssueAgent (みつけるん) - W1: Issue Triage & Label Management Agent. Analyzes GitHub Issues to infer appropriate labels, estimate complexity, and provide implementation guidance.

## 📋 Overview

IssueAgent is the first agent in the Miyabi workflow (W1), responsible for:

- 🏷️ **Automated Label Inference**: Analyzes issue content and assigns appropriate labels from Miyabi's 57-label system
- 📊 **Complexity Estimation**: Evaluates task complexity (Trivial, Simple, Medium, Complex, Very Complex)
- 📝 **Implementation Guidance**: Suggests architecture patterns and task decomposition
- 🔍 **Content Analysis**: Extracts key information, identifies dependencies, and detects technical requirements

This agent implements the **Issue Triage** workflow defined in [組織設計原則57ラベル体系](../../docs/LABEL_SYSTEM_GUIDE.md).

## 🚀 Features

### Label System Integration (57 Labels)

- **11 Categories**: `kind/`, `priority/`, `status/`, `area/`, `complexity/`, `effort/`, `impact/`, `risk/`, `workflow/`, `epic/`, `meta/`
- **Smart Inference**: Analyzes title, body, and context to suggest appropriate labels
- **Hierarchical Label Management**: Supports parent-child label relationships
- **Label Validation**: Ensures labels conform to Miyabi's taxonomy

### Complexity Analysis

- **5-Level Scale**: Trivial (P4), Simple (P3), Medium (P2), Complex (P1), Very Complex (P0)
- **Effort Estimation**: Hours, days, or weeks based on complexity
- **Risk Assessment**: Identifies potential blockers and dependencies
- **Impact Scoring**: Evaluates feature importance and user impact

### Implementation Guidance

- **Architecture Suggestions**: Recommends crates, modules, and design patterns
- **Task Decomposition**: Breaks down complex issues into subtasks
- **Dependency Detection**: Identifies prerequisite issues and external dependencies
- **Test Strategy**: Suggests testing approach based on issue type

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-agent-issue = "0.1.0"
miyabi-agent-core = "0.1.0"
miyabi-types = "0.1.0"
```

Or use `cargo add`:

```bash
cargo add miyabi-agent-issue
```

## 🔧 Usage

### As a Library

```rust
use miyabi_agent_issue::{IssueAgent, ComplexityLevel, IssueAnalysis};
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize IssueAgent
    let config = AgentConfig::default();
    let agent = IssueAgent::new(config);

    // Create task from GitHub Issue
    let task = Task {
        id: "270".to_string(),
        title: "Implement user authentication".to_string(),
        body: Some("Add JWT-based authentication with refresh tokens".to_string()),
        labels: vec![],
        ..Default::default()
    };

    // Execute analysis
    let result = agent.execute(&task).await?;
    let analysis: IssueAnalysis = serde_json::from_str(&result.data)?;

    // Access analysis results
    println!("Complexity: {:?}", analysis.complexity);
    println!("Suggested labels: {:?}", analysis.suggested_labels);
    println!("Effort estimate: {}", analysis.effort_estimate);

    Ok(())
}
```

### With Miyabi CLI

```bash
# Analyze a single issue
miyabi agent issue --issue 270

# Batch analysis
miyabi agent issue --issues 270,271,272

# With custom GitHub repository
miyabi agent issue --issue 270 --repo owner/repo
```

### IssueAnalysis Output

```rust
pub struct IssueAnalysis {
    /// Complexity level (Trivial to Very Complex)
    pub complexity: ComplexityLevel,

    /// Suggested labels from 57-label system
    pub suggested_labels: Vec<String>,

    /// Effort estimate (e.g., "2-4 hours", "1-2 days")
    pub effort_estimate: String,

    /// Implementation guidance
    pub guidance: Vec<String>,

    /// Detected dependencies
    pub dependencies: Vec<String>,

    /// Risk factors
    pub risks: Vec<String>,

    /// Suggested task decomposition
    pub subtasks: Option<Vec<String>>,
}
```

## 🏗️ Architecture

```
miyabi-agent-issue
├── agent.rs         # IssueAgent implementation (BaseAgent trait)
├── analysis.rs      # IssueAnalysis types and complexity logic
└── lib.rs           # Public API

Dependencies:
├── miyabi-agent-core  # BaseAgent trait
├── miyabi-types       # Task, AgentConfig, Result types
├── miyabi-core        # Utilities
├── serde/serde_json   # Serialization
├── tokio              # Async runtime
└── chrono             # Date/time handling
```

## 🧪 Testing

### Run Tests

```bash
# All tests
cargo test -p miyabi-agent-issue

# Integration tests only
cargo test -p miyabi-agent-issue --test '*'

# With output
cargo test -p miyabi-agent-issue -- --nocapture
```

### Test Coverage

```bash
cargo tarpaulin --package miyabi-agent-issue
```

### Example Test

```rust
#[tokio::test]
async fn test_issue_analysis_complexity() {
    let config = AgentConfig::default();
    let agent = IssueAgent::new(config);

    let task = Task {
        id: "test-270".to_string(),
        title: "Add simple logging".to_string(),
        body: Some("Use tracing crate for logging".to_string()),
        ..Default::default()
    };

    let result = agent.execute(&task).await.unwrap();
    let analysis: IssueAnalysis = serde_json::from_str(&result.data).unwrap();

    assert_eq!(analysis.complexity, ComplexityLevel::Simple);
    assert!(analysis.suggested_labels.contains(&"kind/enhancement".to_string()));
}
```

## 🔗 Dependencies

### Core Dependencies

- **miyabi-agent-core** - BaseAgent trait and shared agent utilities
- **miyabi-types** - Common types (Task, AgentConfig, Result)
- **miyabi-core** - Core utilities and error handling

### External Dependencies

- **tokio** (v1.42) - Async runtime
- **serde** (v1.0) - Serialization framework
- **serde_json** (v1.0) - JSON support
- **chrono** (v0.4) - Date/time handling
- **async-trait** (v0.1) - Async trait support
- **tracing** (v0.1) - Structured logging

## 📚 Related Crates

### Workflow Integration

- **miyabi-agent-coordinator** - W0: Orchestrates IssueAgent and other agents
- **miyabi-agent-codegen** - W2: Code generation (receives IssueAgent output)
- **miyabi-agent-review** - W4: Code review
- **miyabi-agent-pr** - W3: Pull request creation

### Infrastructure

- **miyabi-github** - GitHub API integration
- **miyabi-worktree** - Git worktree management
- **miyabi-cli** - Command-line interface

## 📖 Documentation

- **Label System**: [LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md) - 57-label taxonomy
- **Agent Specs**: [.claude/agents/specs/coding/issue-agent.md](../../.claude/agents/specs/coding/issue-agent.md)
- **Entity-Relation Model**: [ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)
- **Workflow**: [agents.md](../../.claude/context/agents.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔖 Version History

- **v0.1.0** (2025-11-06) - Initial release
  - 57-label system integration
  - Complexity analysis (5 levels)
  - Implementation guidance generation
  - GitHub Issue integration
