# Lint Context Index

## Available Files

1. **LINT_CONTEXT.md** - Main lint context (grouped by severity)
2. **LINT_BY_FILE.md** - Diagnostics grouped by file
3. **clippy-diagnostics.json** - Raw JSON data

## How to Use

### For AI Agents

When modifying code, check relevant files in this directory:

```bash
# Check if file has lint issues
grep "filename.rs" .ai/context/lint/LINT_BY_FILE.md
```

### For Humans

```bash
# View summary
cat .ai/context/lint/LINT_CONTEXT.md | head -50

# View specific file issues
grep -A 10 "your-file.rs" .ai/context/lint/LINT_BY_FILE.md
```

## Auto-Update

Run this script to update context:

```bash
./scripts/export-lint-context.sh
```

Or add to git pre-commit hook.

