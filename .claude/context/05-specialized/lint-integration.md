# Lint Integration Context

**Purpose**: Make VSCode Problems panel warnings visible to AI agents
**Last Updated**: 2025-11-11

---

## 🎯 Overview

This context module ensures AI agents are aware of current lint warnings when modifying code.

---

## 📊 Current Lint Status

### Auto-Generated Context

The following files contain current lint diagnostics:

```
.ai/context/lint/
├── LINT_CONTEXT.md           # Main context (grouped by severity)
├── LINT_BY_FILE.md            # Grouped by file
├── clippy-diagnostics.json    # Raw JSON data
└── INDEX.md                   # Guide for using this data
```

### How to Access

**Before modifying any file**:

```bash
# Check if file has lint issues
grep "crates/your-crate/src/your-file.rs" .ai/context/lint/LINT_BY_FILE.md
```

**View all critical errors**:

```bash
# See Tier 1 errors only
cat .ai/context/lint/LINT_CONTEXT.md | grep -A 5 "## Errors"
```

**View file-specific issues**:

```bash
# Check specific file
grep -A 10 "miyabi-core/src/config.rs" .ai/context/lint/LINT_BY_FILE.md
```

---

## 🤖 AI Agent Instructions

### Phase 1: Before Code Modification

```
1. Read .ai/context/lint/LINT_CONTEXT.md
2. Check if files you're about to modify have issues
3. Plan to fix existing issues while making changes
```

### Phase 2: During Code Modification

```
1. Address Tier 1 (errors) immediately
2. Fix Tier 2 (warnings) if easy
3. Document why Tier 3 (style) issues are allowed
```

### Phase 3: After Code Modification

```
1. Run: ./scripts/export-lint-context.sh
2. Verify your changes didn't introduce new issues
3. Report: "Fixed X errors, Y warnings remain"
```

---

## 🔄 Update Workflow

### Manual Update

```bash
# Generate latest lint context
./scripts/export-lint-context.sh
```

### Automatic Update (Recommended)

**Option 1: Pre-commit Hook**

```bash
# Add to .git/hooks/pre-commit
./scripts/export-lint-context.sh
git add .ai/context/lint/
```

**Option 2: VSCode Task**

```json
// In .vscode/tasks.json
{
  "label": "Export Lint Context",
  "type": "shell",
  "command": "${workspaceFolder}/scripts/export-lint-context.sh"
}
```

Run: `Cmd+Shift+P` → "Tasks: Run Task" → "Export Lint Context"

**Option 3: Watch Mode** (Future)

```bash
# Continuously monitor and update (not implemented yet)
./scripts/watch-lint-context.sh
```

---

## 📝 File Formats

### LINT_CONTEXT.md Format

```markdown
# Lint Context for AI

## Summary
- Total Errors: 2
- Total Warnings: 15

## Errors (Tier 1 - Critical)

### `clippy::await_holding_lock`
- **File**: crates/miyabi-agent/src/task.rs:142:5
- **Message**: holding a MutexGuard across await point
- **Suggestion**: consider using a separate scope

## Warnings (Tier 2 - Important)

### `clippy::unwrap_used`
- **File**: crates/miyabi-core/src/config.rs:67:20
- **Message**: used unwrap() on Result value
```

### clippy-diagnostics.json Format

```json
[
  {
    "file": "crates/miyabi-core/src/config.rs",
    "line": 67,
    "column": 20,
    "level": "warning",
    "message": "used unwrap() on Result value",
    "code": "clippy::unwrap_used",
    "suggestion": "use ? or unwrap_or_default()"
  }
]
```

---

## 🎯 Use Cases

### Use Case 1: AI Fixes Existing Issues

```
User: "Refactor miyabi-core config loading"

AI:
1. Reads .ai/context/lint/LINT_BY_FILE.md
2. Finds: "miyabi-core/src/config.rs has 3 warnings"
3. Plans: "I'll refactor AND fix those 3 warnings"
4. Executes: Refactor + lint fixes
5. Updates: Runs export-lint-context.sh
6. Reports: "Refactored config, fixed 3 lint warnings"
```

### Use Case 2: AI Prevents New Issues

```
User: "Add new feature to task executor"

AI:
1. Reads current lint context
2. Sees: "task.rs has await_holding_lock warning"
3. Plans: "I'll avoid this pattern in new code"
4. Implements: Feature with proper async handling
5. Result: No new lint issues introduced
```

### Use Case 3: AI Prioritizes Fixes

```
User: "Fix some issues in the codebase"

AI:
1. Reads LINT_CONTEXT.md
2. Sees: "2 Tier 1 errors, 15 Tier 2 warnings"
3. Prioritizes: Fix 2 critical errors first
4. Executes: Fixes errors, then some warnings
5. Reports: "Fixed 2 critical errors, 8 warnings remain"
```

---

## 🔍 Troubleshooting

### Context Not Generated

```bash
# Check if script is executable
ls -la scripts/export-lint-context.sh

# Make executable if needed
chmod +x scripts/export-lint-context.sh

# Run manually
./scripts/export-lint-context.sh
```

### Context Outdated

```bash
# Force regeneration
rm -rf .ai/context/lint/*
./scripts/export-lint-context.sh
```

### JSON Parsing Errors

```bash
# Check if jq is installed
which jq || brew install jq

# Verify Clippy output is valid
cargo clippy --message-format=json 2>&1 | jq empty
```

---

## 📚 Integration with Claude Code

### Method 1: Explicit Context Loading

```
User: "Fix issues in miyabi-core"

AI: Let me check the lint context first.
[Reads .ai/context/lint/LINT_CONTEXT.md]

I see 3 issues in miyabi-core:
1. unwrap_used at config.rs:67
2. expect_used at logger.rs:23
3. type_complexity at types.rs:45

I'll fix these while working on your request.
```

### Method 2: Auto-Context (via .claude/context/)

This file itself serves as auto-loaded context, instructing AI to:
1. Check lint context before code changes
2. Fix existing issues opportunistically
3. Prevent introducing new issues

### Method 3: Skill Integration

```bash
# Use rust-development Skill with lint awareness
Skill: rust-development
Task: Implement feature X
Pre-condition: Check lint context
Post-condition: Export updated lint context
```

---

## 🎓 Best Practices

### For AI Agents

1. **Always check lint context** before modifying files
2. **Fix Tier 1 issues** immediately (they block compilation)
3. **Fix Tier 2 issues** opportunistically (if touching that code)
4. **Document Tier 3 allowances** (if intentionally complex)
5. **Update lint context** after changes
6. **Report** what was fixed

### For Humans

1. **Regenerate context** before major refactors
2. **Review AI changes** with lint context in mind
3. **Add context to PR descriptions** (fixed X lints)
4. **Keep context fresh** (run script regularly)

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Real-time context updates (watch mode)
- [ ] Integration with VSCode extension
- [ ] Severity-based task prioritization
- [ ] Historical lint trend tracking
- [ ] AI-suggested fix generation
- [ ] Auto-fix for safe patterns

### Possible Integrations

- GitHub Actions (export context on CI)
- Pre-commit hooks (auto-update)
- MCP server (lint context as resource)
- Claude Code skill (lint-aware development)

---

## 📊 Metrics & Monitoring

### Track Lint Health

```bash
# Count issues over time
echo "$(date): $(jq length .ai/context/lint/clippy-diagnostics.json)" \
  >> .ai/metrics/lint-count.log

# View trend
tail -20 .ai/metrics/lint-count.log
```

### Success Criteria

- **Tier 1 errors**: Always 0
- **Tier 2 warnings**: Decreasing over time
- **Tier 3 info**: Stable or allowed

---

**Maintained by**: Miyabi Team
**Integration**: Claude Code, Codex X, rust-analyzer
**Status**: ✅ Active
