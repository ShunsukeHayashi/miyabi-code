# miyabi-core

Core utilities and shared functionality for the Miyabi framework.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/customer-cloud/miyabi-private/actions)
[![Tests](https://img.shields.io/badge/tests-11%20passed-brightgreen.svg)](#testing)
[![Rust Version](https://img.shields.io/badge/rust-1.82+-blue.svg)](https://www.rust-lang.org/)

## Overview

`miyabi-core` provides essential utilities used across the Miyabi framework:

- **Configuration Management**: YAML/TOML/JSON config loading with environment variable support
- **Structured Logging**: Pretty/Compact/JSON log formats with tracing integration
- **Retry Logic**: Exponential backoff with configurable retry policies
- **Documentation Generation**: Rustdoc and README automation
- **Security Audit**: cargo-audit integration
- **Git Utilities**: Repository discovery, branch management, validation
- **Project-Specific Rules**: `.miyabirules` support for custom coding standards

## Features

### 🎯 Project-Specific Rules (.miyabirules)

**Inspired by Cline's `.clinerules`** - Define custom rules and agent preferences for your project.

The `.miyabirules` system allows you to:
- Define pattern-based code suggestions
- Configure agent-specific preferences (CodeGen, Review, Deployment, etc.)
- Enforce project-specific coding standards
- Filter rules by file extension
- Set severity levels (info, warning, error)

**Quick Start**:
```bash
# Copy the example file to your project root
cp .miyabirules.example .miyabirules

# Or start with a simple template
cp .miyabirules.simple .miyabirules
```

**Example `.miyabirules` file**:
```yaml
version: 1

rules:
  - name: "Avoid unwrap"
    pattern: ".unwrap()"
    suggestion: "Use ? operator or expect() with a clear error message"
    file_extensions: ["rs"]
    severity: "warning"
    enabled: true

  - name: "Add documentation"
    pattern: "pub fn"
    suggestion: "Add /// documentation for public functions"
    file_extensions: ["rs"]
    severity: "info"
    enabled: true

agent_preferences:
  codegen:
    style: "idiomatic"
    error_handling: "thiserror"

  review:
    min_score: 80
    clippy_strict: false
```

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-core = { path = "crates/miyabi-core" }
```

## Usage

### Configuration Management

```rust
use miyabi_core::Config;

// Load configuration from YAML/TOML/JSON
let config = Config::load("config.yaml")?;

// Access configuration values
let api_key = config.get_string("api.key")?;
let timeout = config.get_u64("timeout").unwrap_or(30);
```

### Structured Logging

```rust
use miyabi_core::{init_logger, LogFormat, LogLevel};

// Initialize logger with Pretty format
init_logger(LogFormat::Pretty, LogLevel::Info)?;

// Use tracing macros
tracing::info!("Application started");
tracing::warn!("Resource usage high: {}%", usage);
tracing::error!("Failed to connect: {}", error);
```

**Supported Formats**:
- `Pretty` - Human-readable with colors
- `Compact` - Concise single-line output
- `Json` - Structured JSON logs

### Retry Logic

```rust
use miyabi_core::{retry_with_backoff, RetryConfig};
use std::time::Duration;

let config = RetryConfig {
    max_retries: 3,
    initial_delay: Duration::from_millis(100),
    max_delay: Duration::from_secs(5),
    backoff_factor: 2.0,
};

let result = retry_with_backoff(config, || async {
    // Your async operation
    fetch_data_from_api().await
}).await?;
```

### Project Rules (.miyabirules)

```rust
use miyabi_core::{RulesLoader, MiyabiRules};
use std::path::PathBuf;

// Create loader for current directory
let loader = RulesLoader::new(PathBuf::from("."));

// Load rules (returns None if .miyabirules not found)
let rules = loader.load()?;

if let Some(rules) = rules {
    // Get rules for a specific file
    let rs_rules = rules.rules_for_file(Path::new("src/main.rs"));

    for rule in rs_rules {
        if rule.matches(code_line) {
            println!("[{}] {}: {}", rule.severity, rule.name, rule.suggestion);
        }
    }

    // Get agent preferences
    if let Some(codegen_prefs) = rules.get_agent_preferences("codegen") {
        println!("Code style: {:?}", codegen_prefs.style);
        println!("Error handling: {:?}", codegen_prefs.error_handling);
    }
}

// Load or use default if not found
let rules = loader.load_or_default()?;
```

### Git Utilities

```rust
use miyabi_core::{
    find_git_root,
    get_current_branch,
    has_uncommitted_changes,
    is_in_git_repo,
};

// Find Git repository root
let repo_root = find_git_root()?;

// Check if in Git repository
if is_in_git_repo() {
    let branch = get_current_branch()?;
    println!("Current branch: {}", branch);

    if has_uncommitted_changes()? {
        println!("Warning: Uncommitted changes detected");
    }
}
```

### Security Audit

```rust
use miyabi_core::run_cargo_audit;

// Run cargo-audit and get vulnerabilities
let audit_result = run_cargo_audit().await?;

println!("Vulnerabilities found: {}", audit_result.vulnerabilities.len());

for vuln in audit_result.vulnerabilities {
    println!(
        "[{}] {}: {}",
        vuln.severity,
        vuln.package,
        vuln.title
    );
}
```

## .miyabirules File Format

### Schema

```yaml
version: 1  # Required: Schema version (currently only 1 is supported)

rules:      # Optional: Array of custom rules
  - name: "Rule name"              # Required: Human-readable name
    pattern: "regex or substring"  # Optional: Pattern to match
    suggestion: "Suggestion text"  # Required: What to suggest instead
    file_extensions: ["rs", "toml"] # Optional: File types to apply to (empty = all)
    severity: "info"               # Optional: "info", "warning", or "error" (default: "info")
    enabled: true                  # Optional: Whether rule is active (default: true)

agent_preferences:  # Optional: Agent-specific settings
  codegen:          # Agent type (codegen, review, deployment, coordinator)
    style: "idiomatic"           # Code style preference
    error_handling: "thiserror"  # Error handling strategy
    # Custom agent-specific settings can be added

settings:  # Optional: Global settings
  rust_edition: "2021"
  max_line_length: 100
```

### Rule Severity Levels

- **`info`**: Informational suggestions (blue)
- **`warning`**: Important suggestions (yellow)
- **`error`**: Critical issues that should be fixed (red)

### Agent Types

Supported agent types for `agent_preferences`:

- **`codegen`**: Code generation preferences (style, error_handling, async_runtime, test_framework)
- **`review`**: Code review settings (min_score, clippy_strict, require_tests, require_docs)
- **`deployment`**: Deployment configuration (auto_deploy, target, run_tests)
- **`coordinator`**: Task coordination settings (max_tasks, prefer_parallel)

### File Discovery

The `RulesLoader` searches for `.miyabirules` files in the following order:

1. `.miyabirules` (no extension)
2. `.miyabirules.yaml`
3. `.miyabirules.yml`

The search starts from the specified directory and walks **up the directory tree** until a file is found or the root is reached.

### Validation

Rules are validated when loaded:

- ✅ Version must be 1
- ✅ Rule names must be non-empty
- ✅ Suggestions must be non-empty
- ✅ Severity must be one of: `info`, `warning`, `error`

Invalid configurations will return a `RulesError::ValidationError`.

## Testing

```bash
# Run all tests
cargo test -p miyabi-core

# Run with output
cargo test -p miyabi-core -- --nocapture

# Run specific module tests
cargo test -p miyabi-core rules::tests
```

**Test Coverage**:
- ✅ 11 unit tests (rules module)
- ✅ Configuration loading tests
- ✅ Logger initialization tests
- ✅ Retry logic tests
- ✅ Git utility tests

## Examples

### Complete .miyabirules Example

See [`.miyabirules.example`](../../.miyabirules.example) for a comprehensive example with:
- 5 custom rules (async-trait, Result over Option, documentation, thiserror, avoid unwrap)
- Agent preferences for 4 agents (codegen, review, deployment, coordinator)
- Global settings (Rust edition, line length, tabs)

### Simple .miyabirules Example

See [`.miyabirules.simple`](../../.miyabirules.simple) for a minimal starting point with:
- 2 basic rules
- Minimal agent preferences

## API Reference

### Core Modules

- **`config`** - Configuration management
- **`logger`** - Structured logging setup
- **`retry`** - Retry logic with backoff
- **`rules`** - Project-specific rules (.miyabirules)
- **`git`** - Git repository utilities
- **`security`** - Security audit integration
- **`documentation`** - Documentation generation
- **`cache`** - Caching utilities

### Rules API

**Main Types**:
```rust
pub struct Rule {
    pub name: String,
    pub pattern: Option<String>,
    pub suggestion: String,
    pub file_extensions: Vec<String>,
    pub severity: String,
    pub enabled: bool,
}

pub struct AgentPreferences {
    pub style: Option<String>,
    pub error_handling: Option<String>,
    pub min_score: Option<u8>,
    pub clippy_strict: Option<bool>,
    pub custom: HashMap<String, serde_json::Value>,
}

pub struct MiyabiRules {
    pub version: u32,
    pub rules: Vec<Rule>,
    pub agent_preferences: HashMap<String, AgentPreferences>,
    pub settings: HashMap<String, serde_json::Value>,
}

pub struct RulesLoader {
    // Private fields
}
```

**Key Methods**:
```rust
impl Rule {
    pub fn applies_to_file(&self, file_path: &Path) -> bool;
    pub fn matches(&self, line: &str) -> bool;
}

impl MiyabiRules {
    pub fn new() -> Self;
    pub fn validate(&self) -> Result<()>;
    pub fn rules_for_file(&self, file_path: &Path) -> Vec<&Rule>;
    pub fn get_agent_preferences(&self, agent_type: &str) -> Option<&AgentPreferences>;
    pub fn get_setting(&self, key: &str) -> Option<&serde_json::Value>;
}

impl RulesLoader {
    pub fn new(root_dir: PathBuf) -> Self;
    pub fn find_rules_file(&self) -> Option<PathBuf>;
    pub fn load(&self) -> Result<Option<MiyabiRules>>;
    pub fn load_or_default(&self) -> Result<MiyabiRules>;
}
```

**Error Types**:
```rust
pub enum RulesError {
    FileNotFound(PathBuf),
    ParseError(String),
    ValidationError(String),
    IoError(std::io::Error),
}
```

## Contributing

When adding new features to `miyabi-core`:

1. Add comprehensive tests
2. Update this README with usage examples
3. Add Rustdoc comments to all public APIs
4. Run `cargo clippy` and fix all warnings
5. Run `cargo fmt` to format code

## Dependencies

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9"
thiserror = "2.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

## Development

### Building

```bash
# Development build
cargo build -p miyabi-core

# Release build
cargo build -p miyabi-core --release

# Run clippy
cargo clippy -p miyabi-core -- -D warnings

# Format code
cargo fmt
```

### Project Structure

```
crates/miyabi-core/
├── src/
│   ├── cache.rs           # Caching utilities
│   ├── config.rs          # Configuration management
│   ├── documentation.rs   # Documentation generation
│   ├── git.rs             # Git utilities
│   ├── logger.rs          # Structured logging
│   ├── retry.rs           # Retry logic
│   ├── rules.rs           # .miyabirules support (NEW)
│   ├── security.rs        # Security audit
│   └── lib.rs             # Public API
├── Cargo.toml
└── README.md
```

## License

This project is part of the Miyabi framework.

## Related Documentation

- **Miyabi Project**: [../../CLAUDE.md](../../CLAUDE.md)
- **Entity-Relation Model**: [../../docs/ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)
- **Agent Operations**: [../../docs/AGENT_OPERATIONS_MANUAL.md](../../docs/AGENT_OPERATIONS_MANUAL.md)

---

**miyabi-core** - Core utilities for the Miyabi autonomous development framework

🤖 Generated with [Claude Code](https://claude.com/claude-code)
