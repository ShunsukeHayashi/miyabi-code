# CoordinatorAgent (Codex Playbook)

Translate the Claude CoordinatorAgent workflow into the Rust-first Miyabi stack. Use this when Codex needs to orchestrate task decomposition, DAG generation, and worktree provisioning.

## Role & Outcomes
- Fetch issue context, perform structured decomposition, and emit a `TaskDecomposition`.
- Validate the DAG (no cycles), estimate duration, and assign downstream agents.
- Prime `miyabi-worktree` for parallel execution when applicable.

## Prerequisites
1. Workspace root: `/Users/a003/dev/miyabi-private`.
2. Load environment + GitHub token:
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
3. Ensure toolchain ready:
   ```bash
   cargo fmt --all --check
   cargo clippy --all-targets --all-features -- -D warnings
   cargo test --all
   ```
   (Warn if lint/tests fail—Coordinator should not proceed without a clean baseline.)

## Execution Steps
1. **Issue Intake**
   ```bash
   gh issue view <ISSUE_NUMBER> --json title,body,labels,assignees,url,state
   ```
   - Note labels and dependencies (`depends on #xxx`) to seed metadata.

2. **Run CoordinatorAgent**
   ```bash
   cargo run --bin miyabi -- agent coordinator --issue <ISSUE_NUMBER>
   ```
   - This invokes `miyabi-agents::CoordinatorAgent`.
   - Capture stdout/stderr to `.ai/logs/$(date +%F).md` (append the command + summary).

3. **Inspect Output**
   - The CLI prints status and serialized data; redirect to JSON:
     ```bash
     cargo run --bin miyabi -- agent coordinator --issue <ISSUE_NUMBER> \
       --json > .worktrees/issue-<ISSUE_NUMBER>-plan.json
     ```
   - Validate:
     - `dag.has_cycles == false`
     - `tasks` count >= 3 (analysis, implementation, review/test)
     - Each task has `assigned_agent`.

4. **Worktree Preparation (optional)**
   - For parallel execution across issues:
     ```bash
     cargo run --bin miyabi -- parallel --issues <ID1>,<ID2> --concurrency 3
     ```
   - Verify worktrees via `git worktree list`.

5. **Post Results**
   - Comment summarized plan to the issue:
     ```bash
     gh issue comment <ISSUE_NUMBER> --body-file .worktrees/issue-<ISSUE_NUMBER>-plan.json
     ```
   - Apply state labels:
     ```bash
     gh issue edit <ISSUE_NUMBER> --add-label "🔍 state:analyzing"
     ```

## Success Criteria
- Coordinator command finishes without error.
- DAG contains no cycles and dependencies match issue references.
- Tasks include analysis, implementation, tests, and review at minimum.
- Issue updated with plan + `state:analyzing`.

## Escalation
- Cycle detected: escalate to TechLead with error output.
- Missing essential data (empty tasks or failing command): revert labels to `📥 state:pending` and notify `@Guardian`.
- Authentication or Git issues: halt, notify DevOps.
