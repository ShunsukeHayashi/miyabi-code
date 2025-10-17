# GitHub Issue Creation Instructions (Codex Agents)

Miyabi uses GitHub Issues as the primary coordination surface. Codex agents must follow this playbook to open well-structured issues that comply with the project’s label and dependency standards.

## 1. Prepare the Environment
- Load the workspace defaults so the GitHub CLI inherits the correct token and repository:
  ```bash
  cd /Users/a003/dev/miyabi-private
  export $(grep -v '^#' .env | xargs)
  export GH_TOKEN="$GITHUB_TOKEN"
  ```
- Confirm authentication and repository scope before creating anything:
  ```bash
  gh auth status
  git remote get-url origin   # sanity check: should match $GITHUB_REPOSITORY
  ```
- If authentication fails, stop and request updated credentials. Never proceed with an unauthenticated `gh` session.

## 2. Gather Required Issue Content
Every issue body must contain the following sections (adapted from Claude agent outputs):

```markdown
## Summary
<Short problem / intent statement.>

## Deliverables
- <Key outcome 1>
- <Key outcome 2>

## Dependencies
- Issue 123 (Optional descriptive note)

## Checklist
- [ ] <Task ID> — <Owner> — <Action / success metric>
```

### Checklist Conventions
- Use task IDs such as `T2-implement-types` that match the DAG identifiers.
- Always specify the accountable owner (`devops`, `qa`, `docs`, etc.).
- The action text should be executable and measurable.

## 3. Choose Labels Consistently
Leverage the Miyabi label system (see `.claude/agents/README.md` for the taxonomy). At minimum attach:

- **State**: start with `📥 state:pending`.
- **Priority**: e.g. `📊 priority:P2-Medium` unless the work is urgent or trivial.
- **Agent**: map to the actor responsible (`🤖 agent:coordinator`, `🤖 agent:codegen`, `🤖 agent:review`, `🤖 agent:deployment`, `🤖 agent:issue`, `🤖 agent:pr`).
- **Type**: choose `✨ type:feature`, `🐛 type:bug`, `📚 type:docs`, etc.

Optional: add hierarchy (`🌳 hierarchy:root`, `📂 hierarchy:parent`, etc.) or severity labels when relevant.

Validate a label exists before using it:
```bash
gh label list | grep "📚 type:docs"
```

## 4. Create the Issue
1. Write the body to a temporary file (e.g., `issue.md`).
2. Run the CLI command (replace title, labels, and file path as needed):
   ```bash
   gh issue create \
     --title "Baseline & Guardrails Setup" \
     --body-file issue.md \
     --label "📥 state:pending" \
     --label "📊 priority:P2-Medium" \
     --label "🤖 agent:coordinator" \
     --label "📚 type:docs"
   ```
3. Capture and log the returned URL (store in the run summary or note the issue number for follow-up).
4. Remove temporary files to avoid stale content:
   ```bash
   rm issue.md
   ```

## 5. Post-Creation Checklist
- Verify the issue appears in GitHub with the expected labels, body, and checkboxes.
- Link dependent issues by editing the body if GitHub didn’t auto-link (e.g., `Depends on #201`).
- If part of a project board, add it immediately using `gh project item-add` or the web UI.

## 6. Troubleshooting
- **Missing label error**: run `gh label list`, create the label in the repo UI, or choose the closest existing label.
- **Authentication failure**: confirm `GH_TOKEN` is exported and has `repo` scope.
- **Network or API errors**: retry after `gh auth refresh --hostname github.com`; escalate if persistent.

Following this procedure keeps Codex-issued tickets aligned with Miyabi’s orchestrated workflow and ensures downstream agents (Coordinator, CodeGen, Review, Deployment) can pick them up without manual rewriting.
