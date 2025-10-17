# CodeGenAgent (Codex Playbook)

Use this guide when Codex must execute the Rust CodeGenAgent responsibilities: implement features, add tests, and prepare changes for review.

## Role & Outcomes
- Apply the implementation plan from Coordinator tasks.
- Modify the appropriate Rust crate(s) with idiomatic, formatted code.
- Provide accompanying tests, docs, and metrics for downstream agents.

## Prerequisites
1. From the workspace root:
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
2. Baseline check (failures must be resolved before coding):
   ```bash
   cargo fmt --all --check
   cargo clippy --all-targets --all-features -- -D warnings
   cargo test --all
   ```
3. Identify target crate/module via `Task` metadata (e.g., `crates/miyabi-agents/src/...`).

## Execution Steps
1. **Understand Task**
   ```bash
   gh issue view <ISSUE_NUMBER> --json title,body,labels,url
   cat .worktrees/issue-<ISSUE_NUMBER>-plan.json  # If Coordinator produced plan
   ```
   - Confirm acceptance criteria and affected crates.

2. **Implement Feature**
   - Edit files under the relevant crate using `apply_patch` or preferred editor.
   - Guidelines:
     - Follow Rust 2021 edition patterns.
     - Use `Result<T, MiyabiError>` for fallible APIs.
     - Add concise comments only for non-obvious logic.

3. **Formatting & Lint**
   ```bash
   cargo fmt --all
   cargo clippy --all-targets --all-features -- -D warnings
   ```

4. **Testing**
   ```bash
   cargo test --all
   ```
   - If crate-specific tests are heavy, run targeted command first (e.g., `cargo test -p miyabi-agents`), then full suite.

5. **Artifacts & Metrics**
   - Capture lines changed and tests added:
     ```bash
     git diff --stat
     cargo test --all --message-format=json | jq 'select(.profile.test == true)' > .codex/tmp/tests.json
     ```
   - Update issue comment summarizing changes and test results.

6. **State Transition**
   - Move issue label to implementation:
     ```bash
     gh issue edit <ISSUE_NUMBER> --remove-label "🔍 state:analyzing" --add-label "🏗️ state:implementing"
     ```

7. **Log Activity**
   - Append to `.ai/logs/$(date +%F).md` with sections: Intent, Implementation, Verification.

## Success Criteria
- All lint/tests succeed locally.
- Implementation follows existing crate architecture and error handling patterns.
- Issue comment includes summary + verification commands executed.
- `git status` shows only intended changes.

## Escalation
- Architectural uncertainty: ping TechLead with context and proposed approach.
- External dependency or breaking API change required: open sub-issue via `gh issue create` and block the parent.
- Toolchain failures (fmt/clippy/test): stop, record logs, notify Guardian.
