---
name: Git Workflow with Conventional Commits
description: Automated Git workflow including staging, committing with Conventional Commits format, PR creation, and merging. Use when committing changes, creating PRs, or managing Git branches.
allowed-tools: Bash, Read, Grep, Glob
---

# Git Workflow with Conventional Commits

Complete Git workflow automation following Conventional Commits specification and Miyabi's PR guidelines.

## When to Use

- User requests "commit these changes"
- User asks to "create a PR"
- User wants to "merge this branch"
- After completing feature implementation
- When following up on code review feedback

## Conventional Commits Format

Miyabi uses the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commits and PRs.

### Commit Message Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth2 login support` |
| `fix` | Bug fix | `fix(api): resolve null pointer in user endpoint` |
| `docs` | Documentation only | `docs(readme): update installation instructions` |
| `style` | Code style/formatting | `style(lint): fix clippy warnings` |
| `refactor` | Code refactoring | `refactor(parser): simplify token matching logic` |
| `perf` | Performance improvement | `perf(db): add index to users table` |
| `test` | Test addition/modification | `test(unit): add tests for auth service` |
| `chore` | Build/tooling changes | `chore(deps): update tokio to 1.35` |
| `ci` | CI/CD changes | `ci(workflow): add clippy check to CI` |
| `build` | Build system changes | `build(cargo): update Cargo.lock` |
| `revert` | Revert previous commit | `revert: revert feat(auth): OAuth2 support` |

### Scope (Optional)

Scope indicates the area of change:
- `auth` - Authentication/authorization
- `api` - API endpoints
- `db` - Database
- `ui` - User interface
- `cli` - Command-line interface
- `agent` - Agent system
- `worktree` - Worktree management
- `deps` - Dependencies

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 50 characters

### Body (Optional)

- Explain **why** the change was made (not **what** changed)
- Wrap at 72 characters
- Separate from subject with blank line

### Footer (Optional)

- `BREAKING CHANGE:` - Breaking changes
- `Closes #123` - Close related Issues
- `Co-Authored-By:` - Multiple authors

### Miyabi-Specific Footer

All commits include:

```
🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Workflow Steps

### Step 1: Check Git Status

```bash
# Check current status
git status

# Check which files have changes
git diff --name-status
```

**Analysis**:
- Identify modified files
- Categorize changes by type (feat/fix/docs/etc.)
- Determine appropriate scope

### Step 2: Review Changes

```bash
# View detailed changes
git diff

# View staged changes
git diff --staged
```

**Guidelines**:
- Don't commit files with secrets (`.env`, `credentials.json`)
- Verify changes match intended modifications
- Check for unintended changes (formatting, imports)

### Step 3: Stage Changes

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage all changes (use with caution)
git add .

# Stage only tracked files
git add -u
```

**Best Practices**:
- Stage related changes together
- Separate unrelated changes into different commits
- Don't stage generated files (unless necessary)

### Step 4: Create Commit Message

**Format**: Based on changes analysis

**Example 1: New Feature**
```bash
git commit -m "$(cat <<'EOF'
feat(agent): add CodeGenAgent with Rust support

Implement CodeGenAgent for AI-driven code generation:
- Add BaseAgent trait implementation
- Support for Rust, TypeScript, and Python
- Automatic test generation
- Integration with Claude Sonnet 4

Closes #270

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Example 2: Bug Fix**
```bash
git commit -m "$(cat <<'EOF'
fix(worktree): resolve merge conflict in parallel execution

Fixed race condition when multiple worktrees merge simultaneously.
Added Semaphore-based concurrency control with WorktreePool.

Closes #271

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Example 3: Documentation**
```bash
git commit -m "$(cat <<'EOF'
docs(skills): add 4 new Codex Skills

Add comprehensive Skills for:
- Rust Development Workflow
- Agent Execution with Worktree
- Issue Analysis with Label Inference
- Entity-Relation Based Documentation

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 5: Push Changes

```bash
# Push to current branch
git push

# Push and set upstream (first push)
git push -u origin feature/issue-270-codegen-agent

# Force push (use with extreme caution)
git push --force-with-lease
```

**Important**:
- Never force push to `main` or `master`
- Use `--force-with-lease` instead of `--force`
- Ensure you're on the correct branch

### Step 6: Create Pull Request

**Using GitHub CLI (`gh`)**:

```bash
gh pr create --title "feat(agent): Issue #270 - Add CodeGenAgent" --body "$(cat <<'EOF'
## Summary

Implements CodeGenAgent for AI-driven code generation with Rust support.

## Changes

- ✅ Add `crates/miyabi-agents/src/codegen.rs`
- ✅ Implement BaseAgent trait
- ✅ Add unit tests (85% coverage)
- ✅ Add integration tests
- ✅ Update documentation

## Test Plan

- [x] Unit tests pass (`cargo test`)
- [x] Integration tests pass
- [x] Clippy warnings resolved (`cargo clippy`)
- [x] Format check passed (`cargo fmt --check`)
- [x] Documentation builds (`cargo doc`)

## Related Issues

Closes #270

## Quality Report

- **Score**: 85/100 ✅
- **Coverage**: 85%
- **Clippy Warnings**: 0
- **Security Issues**: 0

🤖 Generated with [Codex](https://claude.com/claude-code)
EOF
)" --draft
```

**PR Title Format**:
```
<type>(<scope>): Issue #<number> - <brief description>
```

**PR Body Sections**:
1. **Summary** - High-level overview
2. **Changes** - Bullet list of changes
3. **Test Plan** - Checklist of testing done
4. **Related Issues** - Links to Issues (use `Closes #123`)
5. **Quality Report** - ReviewAgent results (if available)

### Step 7: Handle Pre-commit Hooks

If pre-commit hooks modify files:

```bash
# Check what changed
git status

# Review hook changes
git diff

# If changes look good, amend commit
git add .
git commit --amend --no-edit

# Push amended commit
git push --force-with-lease
```

**Important**:
- Only amend your own commits (check authorship)
- Don't amend commits that are already pushed and reviewed
- Use `--no-edit` to keep the same commit message

## Branch Naming Convention

### Format
```
<type>/<issue-number>-<brief-description>
```

### Examples
- `feature/270-codegen-agent`
- `fix/271-worktree-race-condition`
- `docs/272-update-skills`
- `refactor/273-cleanup-types`

### Types
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Maintenance tasks

## Merge Strategies

### 1. Squash and Merge (Recommended)

**When to use**: Most PRs with multiple commits

```bash
gh pr merge --squash --delete-branch
```

**Benefits**:
- Clean main branch history
- Single commit per feature
- Easier to revert if needed

### 2. Merge Commit

**When to use**: Large features with logical commit grouping

```bash
gh pr merge --merge --delete-branch
```

**Benefits**:
- Preserves commit history
- Shows progression of feature development

### 3. Rebase and Merge

**When to use**: Single-commit PRs

```bash
gh pr merge --rebase --delete-branch
```

**Benefits**:
- Linear history
- No merge commits

## Worktree-Specific Git Workflow

When working in Worktrees (parallel execution):

### 1. Create Worktree with Branch

```bash
git worktree add .worktrees/issue-270 -b feature/270-codegen-agent
```

### 2. Work in Worktree

```bash
cd .worktrees/issue-270

# Make changes
# ...

# Commit changes
git add .
git commit -m "feat(agent): add CodeGenAgent implementation"
```

### 3. Push Worktree Branch

```bash
# Push from within worktree
git push -u origin feature/270-codegen-agent
```

### 4. Merge Back to Main

**Option A: Create PR (Recommended)**
```bash
gh pr create --title "feat(agent): Issue #270 - Add CodeGenAgent" --draft
```

**Option B: Direct Merge (Use with caution)**
```bash
# Switch to main branch
cd ../../  # Back to main repo
git checkout main

# Merge worktree branch
git merge feature/270-codegen-agent

# Push to remote
git push
```

### 5. Cleanup Worktree

```bash
# Remove worktree
git worktree remove .worktrees/issue-270

# Delete remote branch (if merged)
git push origin --delete feature/270-codegen-agent

# Delete local branch
git branch -d feature/270-codegen-agent
```

## Common Issues and Solutions

### Issue: Merge Conflicts

```bash
# Check conflict status
git status

# View conflicts
git diff

# Resolve conflicts in editor
# Then mark as resolved:
git add <resolved-files>

# Continue merge/rebase
git merge --continue
# or
git rebase --continue
```

### Issue: Accidentally Committed to Wrong Branch

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Re-commit
git add .
git commit -m "Your message"
```

### Issue: Need to Change Last Commit Message

```bash
# Amend commit message
git commit --amend

# Update editor with new message, then:
git push --force-with-lease
```

### Issue: Committed Secrets

```bash
# Remove file from last commit
git rm --cached path/to/secret-file
git commit --amend --no-edit

# Force push (if already pushed)
git push --force-with-lease

# For older commits, use git-filter-repo or contact Guardian
```

## Pre-commit Checklist

Before committing, verify:

- [ ] All tests pass (`cargo test`)
- [ ] No clippy warnings (`cargo clippy`)
- [ ] Code is formatted (`cargo fmt`)
- [ ] No secrets committed
- [ ] Commit message follows Conventional Commits
- [ ] Changes match Issue requirements
- [ ] Documentation updated (if needed)

## PR Review Checklist

Before requesting review:

- [ ] PR title follows convention
- [ ] PR description is complete
- [ ] All CI checks pass
- [ ] No merge conflicts
- [ ] Reviewers assigned
- [ ] Labels applied (type, priority)
- [ ] Linked to Issue (Closes #XXX)

## Related Files

- **Git Configuration**: `.gitignore`, `.gitattributes`
- **PR Agent Spec**: `.codex/agents/specs/coding/pr-agent.md`
- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md`
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md`

## Related Skills

- **Agent Execution**: For creating branches via Worktrees
- **Rust Development**: For pre-commit testing
- **Issue Analysis**: For determining commit type/scope
