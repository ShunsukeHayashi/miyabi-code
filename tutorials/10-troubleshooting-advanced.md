# Tutorial 10: Troubleshooting and Advanced Topics - Mastering Miyabi's Edge Cases

**Estimated Time**: 90 minutes
**Difficulty**: ⭐⭐⭐⭐⭐ Expert
**Prerequisites**: Completed Tutorials 1-9, Deep understanding of Miyabi architecture, Debugging proficiency

## Learning Objectives

By the end of this tutorial, you will:
- Debug complex Agent execution failures
- Resolve Worktree conflicts and corruption
- Optimize performance bottlenecks
- Handle API rate limiting gracefully
- Recover from catastrophic failures
- Implement custom Agent behaviors
- Extend Miyabi with plugins
- Master advanced GitHub workflow patterns
- Contribute to Miyabi development

## Prerequisites

Before starting, ensure you have:
- **Completed All Previous Tutorials**: Comprehensive Miyabi knowledge
- **Rust Debugging Skills**: Experience with `rust-gdb`, `lldb`, or `rust-analyzer`
- **Systems Debugging**: Understanding of `strace`, `lsof`, process monitoring
- **Git Internals**: Deep knowledge of Git worktrees, refs, and objects
- **Production Experience**: Real-world debugging scenarios

## Introduction

"When autonomous systems fail, understanding the failure is more valuable than the success."

Miyabi's autonomous Agents handle 95% of workflows flawlessly. But what about the other 5%? When CoordinatorAgent hangs, when Worktrees become corrupted, when GitHub API rate limits are hit, when an Agent generates infinite loops—these are the moments that test your mastery.

This tutorial covers the toughest challenges you'll face with Miyabi: debugging obscure failures, recovering from edge cases, and extending the system beyond its original design. By the end, you'll be equipped to handle any Miyabi issue and contribute advanced features.

## Debugging Agent Execution Failures

### Scenario 1: CoordinatorAgent Hangs Indefinitely

**Symptom**: `miyabi agent run coordinator --issue 500` hangs and never completes.

**Investigation**:

```bash
# Step 1: Check if Agent is actually running
ps aux | grep miyabi

# Step 2: Attach debugger to process
lldb -p <PID>
# Or for Rust-specific debugging:
rust-gdb -p <PID>

# Step 3: Get stack trace
(lldb) bt all
# Look for deadlocks or infinite loops

# Step 4: Check file descriptors
lsof -p <PID>
# Look for stuck file reads or network connections

# Step 5: Enable debug logging
RUST_LOG=debug miyabi agent run coordinator --issue 500

# Step 6: Profile the execution
cargo flamegraph --bin miyabi-cli -- agent run coordinator --issue 500
```

**Common Causes**:

1. **Deadlock in async runtime**:
```rust
// Bad: Nested blocking calls
async fn process() {
    let result = tokio::task::block_in_place(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            // This will deadlock!
        })
    });
}

// Good: Proper async/await
async fn process() {
    let result = async_operation().await;
}
```

2. **Infinite loop in task decomposition**:
```rust
// Check logs for repeated task creation
// Look for cyclic dependencies: T1 depends on T2, T2 depends on T1

// Fix: Add cycle detection
fn has_cycle(tasks: &[Task]) -> bool {
    let mut visited = HashSet::new();
    let mut stack = HashSet::new();

    for task in tasks {
        if detect_cycle(task, &mut visited, &mut stack, tasks) {
            return true;
        }
    }
    false
}
```

3. **GitHub API timeout**:
```rust
// Add timeout to all GitHub API calls
use tokio::time::timeout;
use std::time::Duration;

let result = timeout(
    Duration::from_secs(30),
    github_client.get_issue(issue_number)
).await;

match result {
    Ok(Ok(issue)) => { /* Success */ },
    Ok(Err(e)) => { /* API error */ },
    Err(_) => { /* Timeout */ },
}
```

**Resolution**:

```bash
# Kill hung process
pkill -9 miyabi

# Clear stale state
rm -rf .ai/state/coordinator-*.json

# Retry with debug logging
RUST_LOG=debug,miyabi_agents=trace miyabi agent run coordinator --issue 500 2>&1 | tee debug.log

# Analyze debug log
grep -i "error\|panic\|timeout\|deadlock" debug.log
```

### Scenario 2: CodeGenAgent Generates Invalid Code

**Symptom**: CodeGenAgent generates code that doesn't compile.

**Investigation**:

```bash
# Step 1: Check generated code
cd .worktrees/issue-500
cat crates/miyabi-core/src/generated.rs

# Step 2: Try to compile
cargo build 2>&1 | tee build.log

# Step 3: Check Agent's prompt
cat .agent-context.json | jq '.promptPath'
cat .claude/agents/prompts/coding/codegen-agent-prompt.md

# Step 4: Review LLM response
cat .ai/logs/$(date +%Y-%m-%d)_codegen_issue-500.md
```

**Common Causes**:

1. **Incomplete prompt context**:
```rust
// Bad: Missing type information
let prompt = format!("Generate a function named {}", function_name);

// Good: Include full context
let prompt = format!(
    "Generate a Rust function named {} that:\n\
     - Takes parameters: {}\n\
     - Returns: {}\n\
     - Uses these imports: {}\n\
     - Follows these patterns: {}",
    function_name,
    parameters,
    return_type,
    imports,
    patterns
);
```

2. **LLM hallucination**:
```rust
// Validate generated code before committing
use syn::parse_file;

fn validate_rust_code(code: &str) -> Result<(), String> {
    match parse_file(code) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Invalid Rust syntax: {}", e)),
    }
}

// If validation fails, regenerate with stricter prompt
```

3. **Missing dependencies**:
```rust
// Extract imports from generated code
fn extract_imports(code: &str) -> Vec<String> {
    code.lines()
        .filter(|line| line.trim().starts_with("use "))
        .map(|line| line.to_string())
        .collect()
}

// Add missing dependencies to Cargo.toml
fn ensure_dependencies(imports: &[String]) -> Result<()> {
    for import in imports {
        if let Some(crate_name) = extract_crate_name(import) {
            ensure_crate_in_cargo_toml(&crate_name)?;
        }
    }
    Ok(())
}
```

**Resolution**:

```bash
# Regenerate with more context
miyabi agent run codegen --issue 500 --retry --context-boost

# Or manually fix and commit
cd .worktrees/issue-500
# Fix the code
cargo build --all
cargo test --all
git add .
git commit -m "fix: correct generated code for issue #500"
```

### Scenario 3: ReviewAgent Gives Incorrect Scores

**Symptom**: ReviewAgent scores high-quality code as 50/100 or vice versa.

**Investigation**:

```bash
# Check ReviewAgent's analysis
cat .ai/logs/$(date +%Y-%m-%d)_review_issue-500.md

# Check scoring criteria
cat .claude/agents/specs/coding/review-agent.md

# Compare with manual review
git diff main...worktree/issue-500
```

**Common Causes**:

1. **Outdated scoring criteria**:
```rust
// Update scoring weights in config
pub struct ReviewConfig {
    pub code_quality_weight: f32,    // 40%
    pub test_coverage_weight: f32,   // 30%
    pub documentation_weight: f32,   // 20%
    pub maintainability_weight: f32, // 10%
}
```

2. **Missing test coverage data**:
```bash
# Generate coverage report first
cargo tarpaulin --out Json > coverage.json

# Pass to ReviewAgent
miyabi agent run review --issue 500 --coverage coverage.json
```

3. **False positive in complexity analysis**:
```rust
// Adjust cyclomatic complexity thresholds
pub const MAX_COMPLEXITY: usize = 10;  // Lower = stricter
pub const WARNING_COMPLEXITY: usize = 6;
```

**Resolution**:

```bash
# Manually override score
miyabi agent run review --issue 500 --manual-score 90

# Or retrain ReviewAgent with better examples
miyabi agent train review --examples .ai/training/review-examples.json
```

## Resolving Worktree Issues

### Scenario 4: Worktree Corruption

**Symptom**: Git operations fail with "corrupt worktree" errors.

**Investigation**:

```bash
# Check worktree list
git worktree list

# Check worktree integrity
cd .worktrees/issue-500
git fsck

# Check for dangling references
git show-ref
```

**Common Causes**:

1. **Interrupted git operation**:
```bash
# Check for lock files
find .worktrees/issue-500/.git -name "*.lock"

# Remove stale locks
find .worktrees/issue-500/.git -name "*.lock" -delete
```

2. **Disk space exhaustion**:
```bash
# Check disk space
df -h .worktrees

# Clean up old worktrees
miyabi worktree cleanup --older-than 7d
```

3. **Concurrent git operations**:
```rust
// Use file-based locking for git operations
use fs2::FileExt;

async fn git_operation_with_lock(worktree_path: &Path) -> Result<()> {
    let lock_file = worktree_path.join(".git/miyabi.lock");
    let file = File::create(&lock_file)?;
    file.lock_exclusive()?;

    // Perform git operation
    let result = perform_git_op().await;

    file.unlock()?;
    result
}
```

**Resolution**:

```bash
# Option 1: Repair worktree
cd .worktrees/issue-500
git fsck --full
git reflog expire --expire=now --all
git gc --prune=now

# Option 2: Recreate worktree
miyabi worktree remove issue-500
miyabi worktree create issue-500

# Option 3: Nuclear option - clean all worktrees
git worktree prune
rm -rf .worktrees
miyabi worktree init
```

### Scenario 5: Worktree Branch Conflicts

**Symptom**: Multiple worktrees point to the same branch, causing conflicts.

**Investigation**:

```bash
# List all worktrees
git worktree list

# Check for duplicate branches
git worktree list | awk '{print $3}' | sort | uniq -d

# Find which worktrees use the same branch
git worktree list | grep "feature/issue-500"
```

**Resolution**:

```bash
# Remove duplicate worktrees
git worktree remove .worktrees/issue-500-duplicate

# Ensure unique branch names
# Update WorktreeManager to include timestamp
let branch_name = format!("feature/issue-{}-{}", issue_number, timestamp);
```

## Handling API Rate Limiting

### Scenario 6: GitHub API Rate Limit Exceeded

**Symptom**: `API rate limit exceeded for user` errors.

**Investigation**:

```bash
# Check current rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Output:
# {
#   "rate": {
#     "limit": 5000,
#     "remaining": 0,
#     "reset": 1730000000
#   }
# }
```

**Resolution**:

```rust
// Implement exponential backoff
use tokio::time::{sleep, Duration};

async fn github_request_with_retry<T>(
    request: impl Fn() -> Result<T, GitHubError>
) -> Result<T, GitHubError> {
    let mut retry_count = 0;
    const MAX_RETRIES: u32 = 5;

    loop {
        match request() {
            Ok(result) => return Ok(result),
            Err(GitHubError::RateLimitExceeded { reset_at }) => {
                if retry_count >= MAX_RETRIES {
                    return Err(GitHubError::RateLimitExceeded { reset_at });
                }

                let wait_time = reset_at.signed_duration_since(Utc::now());
                println!("Rate limit hit. Waiting {}s", wait_time.num_seconds());
                sleep(Duration::from_secs(wait_time.num_seconds() as u64)).await;

                retry_count += 1;
            },
            Err(e) => return Err(e),
        }
    }
}
```

**Optimization**:

```rust
// Use GraphQL for efficient queries
use octocrab::graphql;

// Bad: 10 REST API calls
for issue_number in issues {
    let issue = octocrab.issues("owner", "repo").get(issue_number).await?;
}

// Good: 1 GraphQL query
let query = r#"
    query($numbers: [Int!]!) {
        repository(owner: "owner", name: "repo") {
            issues(numbers: $numbers) {
                number
                title
                body
                labels { name }
            }
        }
    }
"#;
let issues: Vec<Issue> = octocrab.graphql(query).await?;
```

### Scenario 7: Anthropic API Quota Exceeded

**Symptom**: `Insufficient funds` or `Rate limit exceeded` from Anthropic API.

**Resolution**:

```rust
// Implement fallback to cheaper models
async fn llm_call_with_fallback(prompt: &str) -> Result<String, LLMError> {
    // Try primary model (claude-sonnet-4)
    match call_anthropic("claude-sonnet-4", prompt).await {
        Ok(response) => return Ok(response),
        Err(LLMError::QuotaExceeded) => {
            // Fallback to cheaper model (claude-haiku)
            call_anthropic("claude-haiku", prompt).await
        },
        Err(e) => Err(e),
    }
}

// Or use local LLM as fallback
async fn llm_call_with_local_fallback(prompt: &str) -> Result<String> {
    match call_anthropic("claude-sonnet-4", prompt).await {
        Ok(response) => Ok(response),
        Err(LLMError::QuotaExceeded) => {
            // Fallback to local Ollama
            call_ollama("llama3:70b", prompt).await
        },
        Err(e) => Err(e),
    }
}
```

## Performance Optimization

### Scenario 8: Slow Agent Execution

**Symptom**: CoordinatorAgent takes >5 minutes to process an Issue.

**Profiling**:

```bash
# Profile with flamegraph
cargo install flamegraph
cargo flamegraph --bin miyabi-cli -- agent run coordinator --issue 500

# Open flamegraph.svg to identify bottlenecks

# Profile with perf (Linux)
perf record -g target/release/miyabi-cli agent run coordinator --issue 500
perf report

# Profile with Instruments (macOS)
instruments -t "Time Profiler" target/release/miyabi-cli agent run coordinator --issue 500
```

**Common Bottlenecks**:

1. **Synchronous GitHub API calls**:
```rust
// Bad: Sequential API calls (10s total)
for issue_number in issues {
    let issue = github.get_issue(issue_number).await?;
}

// Good: Parallel API calls with tokio::spawn (1s total)
let handles: Vec<_> = issues.iter().map(|&issue_number| {
    let github = github.clone();
    tokio::spawn(async move {
        github.get_issue(issue_number).await
    })
}).collect();

let issues = futures::future::join_all(handles).await;
```

2. **Unoptimized regex**:
```rust
// Bad: Regex compilation in hot loop
for line in lines {
    let re = Regex::new(r"pattern").unwrap(); // Compiled every iteration!
    if re.is_match(line) { /* ... */ }
}

// Good: Compile once, reuse
lazy_static! {
    static ref RE: Regex = Regex::new(r"pattern").unwrap();
}
for line in lines {
    if RE.is_match(line) { /* ... */ }
}
```

3. **Excessive JSON serialization**:
```rust
// Bad: Serialize to JSON, then deserialize (slow)
let json = serde_json::to_string(&task)?;
let task: Task = serde_json::from_str(&json)?;

// Good: Clone directly
let task = task.clone();
```

4. **Large prompt context**:
```rust
// Truncate large file contents
fn truncate_file_content(content: &str, max_lines: usize) -> String {
    content.lines()
        .take(max_lines)
        .collect::<Vec<_>>()
        .join("\n")
}

// Use only relevant code sections
fn extract_relevant_context(issue: &Issue, files: &[File]) -> String {
    // Use AST parsing to extract only relevant functions/structs
}
```

**Resolution**:

```bash
# Enable caching
export MIYABI_CACHE_ENABLED=true
export MIYABI_CACHE_TTL=3600

# Use faster LLM model for simple tasks
export MIYABI_FAST_MODEL="claude-haiku"

# Reduce context size
export MIYABI_MAX_CONTEXT_LINES=500

# Enable parallel execution
miyabi agent run coordinator --issue 500 --parallel
```

## Advanced Agent Customization

### Creating a Custom Agent

Let's create a `SecurityAgent` that scans code for vulnerabilities.

**Step 1: Define Agent Spec**:

`.claude/agents/specs/coding/security-agent.md`:

```markdown
# SecurityAgent Specification

## Role
Automated security vulnerability scanning and remediation.

## Capabilities
- Static analysis with cargo-audit
- SAST with Semgrep
- Secret detection with detect-secrets
- CVE database lookup

## Execution
- Triggered by: `security` label or `trigger:security-scan`
- Input: Issue #, codebase files
- Output: Security report, CVSS scores, remediation suggestions

## Integration
- Blocks PR merge if CVSS > 7.0
- Creates security Issues for each finding
- Updates SECURITY.md
```

**Step 2: Implement Agent**:

`crates/miyabi-agents/src/security.rs`:

```rust
use async_trait::async_trait;
use miyabi_types::{Task, AgentResult, MiyabiError};
use crate::BaseAgent;

pub struct SecurityAgent {
    config: SecurityConfig,
}

#[async_trait]
impl BaseAgent for SecurityAgent {
    async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError> {
        let mut findings = Vec::new();

        // Run cargo-audit
        findings.extend(self.run_cargo_audit().await?);

        // Run Semgrep
        findings.extend(self.run_semgrep().await?);

        // Detect secrets
        findings.extend(self.detect_secrets().await?);

        // Generate report
        let report = self.generate_report(&findings);

        // Create security Issues
        for finding in &findings {
            if finding.severity >= CVSS::High {
                self.create_security_issue(finding).await?;
            }
        }

        Ok(AgentResult::success(report))
    }
}

impl SecurityAgent {
    async fn run_cargo_audit(&self) -> Result<Vec<Finding>> {
        let output = Command::new("cargo")
            .args(["audit", "--json"])
            .output()
            .await?;

        let audit_report: AuditReport = serde_json::from_slice(&output.stdout)?;

        audit_report.vulnerabilities
            .into_iter()
            .map(|v| Finding {
                title: v.advisory.title,
                severity: v.advisory.cvss_score.into(),
                description: v.advisory.description,
                remediation: format!("Update {} to {}", v.package, v.patched_versions),
            })
            .collect()
    }

    async fn run_semgrep(&self) -> Result<Vec<Finding>> {
        // Semgrep static analysis
        // ...
    }

    async fn detect_secrets(&self) -> Result<Vec<Finding>> {
        // Secret detection
        // ...
    }
}
```

**Step 3: Register Agent**:

`crates/miyabi-agents/src/lib.rs`:

```rust
pub mod security;

pub use security::SecurityAgent;
```

**Step 4: Add to CLI**:

`crates/miyabi-cli/src/main.rs`:

```rust
match agent_type {
    AgentType::Coordinator => CoordinatorAgent::new(config).execute(&task).await?,
    AgentType::CodeGen => CodeGenAgent::new(config).execute(&task).await?,
    AgentType::Security => SecurityAgent::new(config).execute(&task).await?,
    // ...
}
```

**Step 5: Test**:

```bash
# Create security test Issue
gh issue create --title "Security scan needed" --label "security"

# Run SecurityAgent
miyabi agent run security --issue 600

# Verify findings
cat .ai/logs/$(date +%Y-%m-%d)_security_issue-600.md
```

## Contributing to Miyabi

### Setting Up Development Environment

```bash
# Fork and clone
git clone https://github.com/YourUsername/Miyabi.git
cd Miyabi

# Create development branch
git checkout -b feature/my-feature

# Install development tools
cargo install cargo-edit cargo-outdated cargo-audit cargo-watch

# Run tests in watch mode
cargo watch -x test
```

### Contribution Workflow

```bash
# 1. Create Issue for feature/bug
gh issue create --title "Add SecurityAgent" --body "..."

# 2. Implement changes
# ... code ...

# 3. Run tests
cargo test --all
cargo clippy --all-targets -- -D warnings
cargo fmt --all -- --check

# 4. Commit with Conventional Commits
git add .
git commit -m "feat(agents): add SecurityAgent for vulnerability scanning

Implements automated security scanning with:
- cargo-audit integration
- Semgrep SAST
- Secret detection

Closes #600"

# 5. Push and create PR
git push origin feature/my-feature
gh pr create --title "feat(agents): add SecurityAgent" --body "Closes #600"

# 6. Address review comments
# ... make changes ...
git add .
git commit -m "fix: address review comments"
git push origin feature/my-feature

# 7. Squash and merge (done by maintainer)
```

### Code Style Guidelines

```rust
// Always document public APIs
/// Executes the Agent for the given Task.
///
/// # Arguments
/// * `task` - The Task to execute
///
/// # Returns
/// * `Ok(AgentResult)` - Successful execution
/// * `Err(MiyabiError)` - Execution failed
///
/// # Examples
/// ```
/// let agent = SecurityAgent::new(config);
/// let result = agent.execute(&task).await?;
/// ```
pub async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError> {
    // Implementation
}

// Use meaningful variable names
let issue_number = 500; // Good
let n = 500; // Bad

// Prefer explicit error handling over unwrap
let issue = github.get_issue(issue_number).await?; // Good
let issue = github.get_issue(issue_number).await.unwrap(); // Bad

// Use early returns for error cases
if task.status != TaskStatus::Pending {
    return Err(MiyabiError::InvalidTaskStatus);
}
```

## Success Checklist

- [ ] Debugged at least one complex Agent failure
- [ ] Resolved Worktree corruption issue
- [ ] Implemented rate limit handling
- [ ] Profiled and optimized Agent performance
- [ ] Created a custom Agent
- [ ] Contributed a PR to Miyabi
- [ ] Set up production monitoring
- [ ] Documented edge cases and solutions

## Final Thoughts

Congratulations! You've completed all 10 Miyabi tutorials. You've journeyed from a beginner installing Miyabi to an expert debugging complex failures and extending the system.

Remember:
- **Autonomous systems are complex** - Failures will happen
- **Debugging is a skill** - Practice makes perfect
- **Documentation helps everyone** - Share your learnings
- **Community is key** - Join discussions, contribute code

You're now equipped to:
- Run Miyabi in production
- Debug any issue that arises
- Extend Miyabi with custom Agents
- Contribute to the open-source project

## Next Steps

1. **Join the Community**:
   - Discord: [discord.gg/miyabi](https://discord.gg/miyabi)
   - GitHub Discussions: [github.com/ShunsukeHayashi/Miyabi/discussions](https://github.com/ShunsukeHayashi/Miyabi/discussions)

2. **Contribute**:
   - Fix bugs: [Good First Issues](https://github.com/ShunsukeHayashi/Miyabi/labels/good-first-issue)
   - Add features: [Help Wanted](https://github.com/ShunsukeHayashi/Miyabi/labels/help-wanted)
   - Improve docs: [Documentation Issues](https://github.com/ShunsukeHayashi/Miyabi/labels/documentation)

3. **Share Your Experience**:
   - Write blog posts about Miyabi
   - Create video tutorials
   - Present at meetups/conferences

## Additional Resources

- **Rust Debugging**: [rust-lang.github.io/book/ch09-00-error-handling.html](https://rust-lang.github.io/book/ch09-00-error-handling.html)
- **Git Worktree Internals**: [git-scm.com/docs/git-worktree](https://git-scm.com/docs/git-worktree)
- **Performance Profiling**: [nnethercote.github.io/perf-book](https://nnethercote.github.io/perf-book/)
- **Async Rust**: [rust-lang.github.io/async-book](https://rust-lang.github.io/async-book/)

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)

**Tutorial Series Complete!** 🎉

You've mastered Miyabi from installation to production deployment to advanced troubleshooting. Welcome to the Miyabi expert community!
