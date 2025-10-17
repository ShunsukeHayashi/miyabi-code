# ReviewAgent (Codex Playbook)

Guide for executing the Rust ReviewAgent flow: static analysis, security scan, test verification, and quality scoring.

## Role & Outcomes
- Run lint/type/security checks using Rust tooling.
- Produce a quality report mirroring `miyabi-agents::review` expectations (score + findings).
- Recommend next actions or escalate if quality gates fail.

## Prerequisites
1. Environment bootstrap (workspace root):
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
2. Ensure `cargo-audit` is installed (`cargo install cargo-audit` if missing).
3. Fetch latest plan/PR branch or worktree ready for review.

## Execution Steps

> Quick start: `cargo run --bin miyabi -- agent review --issue <ISSUE_NUMBER>` executes the agent with metrics/environment hooks before running the checks below.
1. **Scope Review**
   ```bash
   git status --short
   git diff main...HEAD --stat
   ```
   - Identify touched crates/files to target additional tests if needed.

2. **Static Analysis**
   ```bash
   cargo fmt --all --check
   cargo clippy --all-targets --all-features --message-format=json -- -D warnings \
     | tee .review/clippy.json
   ```
   - Use `jq` to count warnings/errors if needed.

3. **Compilation Check**
   ```bash
   cargo check --all-targets --message-format=json | tee .review/check.json
   ```
   - Any compilation error triggers immediate failure.

4. **Security Audit**
   ```bash
   cargo audit --json > .review/audit.json
   ```
   - Classify vulnerabilities by severity; flag High/Critical for escalation.

5. **Test & Coverage**
   ```bash
   cargo test --all --message-format=json | tee .review/test.json
   cargo llvm-cov --lcov --output-path .review/coverage.lcov  # optional if llvm-cov available
   ```
   - Minimum expectation: relevant package tests executed and pass.

6. **Score Calculation**
   - Suggested rubric aligned with `ReviewAgent` structs:
     - Clippy (20 pts): deduct 5 per warning, 10 per error.
     - Check (20 pts): deduct 10 per compiler error.
     - Tests (20 pts): deduct 5 if tests missing, 10 per failing suite.
     - Security (20 pts): deduct 10 per High vuln, 20 per Critical.
     - Documentation/Changelog (10 pts): verify updates when API changes occur.
     - Overall polish (10 pts): naming, structure, log clarity.
   - Record final score (0–100).

7. **Report Back**
   - Assemble Markdown summary referencing artifacts:
     ```markdown
     ## Review Summary (Score: 85/100)
     - ✅ `cargo fmt --all --check`
     - ✅ `cargo clippy -- -D warnings`
     - ✅ `cargo test --all`
     - ⚠️ `cargo audit`: 1 medium vulnerability (see .review/audit.json)
     - 📊 Coverage: 82% (cargo llvm-cov)

     **Recommendations**
     1. Update changelog with new CLI flag.
     2. Add integration test covering error branch.
     ```
   - Post via:
     ```bash
     gh issue comment <ISSUE_NUMBER> --body-file .review/summary.md
     ```
   - Apply `👀 state:reviewing` label, remove `🏗️ state:implementing`.

## Success Criteria
- All checks succeed or surfaced with actionable recommendations.
- Review comment includes score, commands executed, and gating failures.
- Security issues with severity High+ trigger escalation.
- Artifacts stored under `.review/` for traceability.

## Escalation
- Any `cargo clippy`/`cargo check` failure ➜ block merge, tag TechLead.
- `cargo audit` High/Critical ➜ escalate to Security + reroute issue labels.
- Missing tests for new code ➜ request changes and flag Guardian if unaddressed.
