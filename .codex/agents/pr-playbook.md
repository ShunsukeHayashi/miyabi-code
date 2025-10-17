# PRAgent (Codex Playbook)

Procedures for generating pull requests that follow Miyabi’s conventions, using the Rust `PRAgent`.

## Role & Outcomes
- Draft a Conventional Commits compliant PR title/body.
- Open a draft PR against `main` (or configured base) with correct labels.
- Attach test results and checklist placeholders.

## Prerequisites
1. Ensure feature branch exists and is pushed:
   ```bash
   git status
   git push --set-upstream origin <feature-branch>
   ```
2. Environment:
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
3. Collect metadata:
   - `branch`: current feature branch.
   - `baseBranch`: typically `main`.
   - `issueNumber`: primary issue to close.

## Execution Steps
1. **Prepare Task Metadata**
   ```bash
   cat <<'EOF' > .codex/tmp/pr-task.json
   {
     "id": "pr-<issue>",
     "title": "Finalize <feature summary>",
     "description": "Summary of implemented changes.",
     "task_type": "Feature",
     "metadata": {
       "issueNumber": <ISSUE_NUMBER>,
       "branch": "<feature-branch>",
       "baseBranch": "main",
       "labels": ["📥 state:pending"]
     }
   }
   EOF
   ```

2. **Execute PRAgent (Rust)**
   ```bash
   cargo run --bin miyabi -- agent pr --issue <ISSUE_NUMBER>
   ```
   - If CLI support is pending, call the agent from a Rust snippet or integration test invoking `PRAgent::create_pull_request`.

3. **Verify PR on GitHub**
   ```bash
   gh pr view --web
   ```
   - Confirm draft status, title format (`prefix(scope): description`), and related issue reference.

4. **Update PR Body (if automation not yet hooked)**
   ```bash
   gh pr edit <PR_NUMBER> --title "feat(cli): add parallel agent runner" \
     --body-file .codex/tmp/pr-body.md
   ```
   - Body template should include sections: 概要, 関連Issue, 変更内容, テスト結果, チェックリスト.

5. **Apply Labels & Reviewers**
   ```bash
   gh pr edit <PR_NUMBER> --add-label "🤖 agent:pr" --add-label "👀 state:reviewing"
   gh pr edit <PR_NUMBER> --add-reviewer <guardian-account>
   ```

6. **Link Issue**
   - Ensure body contains `Closes #<ISSUE_NUMBER>` or use `gh pr comment`.

## Success Criteria
- Draft PR created with Conventional Commits title.
- Body includes overview, changes, tests, and checklist.
- Labels applied and reviewers notified.
- Related issue set to `👀 state:reviewing`.

## Escalation
- Git push or PR creation failures ➜ investigate git remotes/permissions.
- Missing metadata (no branch/issueNumber) ➜ abort and regenerate task data.
- Conflicts or failing status checks ➜ alert TechLead, keep PR in draft until resolved.
