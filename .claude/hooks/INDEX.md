# Claude Code Hooks - Index

**Version**: v4.0.0
**Last Updated**: 2025-11-09

---

## 📋 Quick Reference

### Active Hooks

| Hook | Version | Trigger | Purpose | Status |
|------|---------|---------|---------|--------|
| **Git Ops Validator** | 1.0.0 | PreToolUse(Bash) | Validate Git operations | ✅ Active |
| **Agent Worktree (Pre)** | 3.0.0 | PreToolUse(Task) | Create worktree for Sub-Agent | ✅ Active |
| **Agent Worktree (Post)** | 3.0.0 | PostToolUse(Task) | Cleanup worktree after Sub-Agent | ✅ Active |
| **Notification** | 2.0.0 | Multiple | VOICEVOX narration | ✅ Active |
| **Auto Format** | 1.0.0 | PreToolUse(Write) | Auto-format code | ✅ Active |
| **Validate Rust** | 1.0.0 | PostToolUse(Write) | Validate Rust code | ✅ Active |
| **Validate TypeScript** | 1.0.0 | PostToolUse(Write) | Validate TypeScript code | ✅ Active |

---

## 🗂️ Hook Files

### Git Operations
- `git-ops-validator.sh` - Main validation script
- `git-ops.json` - Configuration

### Agent Orchestration
- `agent-worktree-pre.sh` - Pre-hook for Task tool
- `agent-worktree-post.sh` - Post-hook for Task tool
- `worktree-manager.sh` - Core worktree functions

### Notifications
- `notification.sh` - VOICEVOX integration
- `agent-event.sh` - Agent event notifications
- `agent-complete.sh` - Agent completion notifications

### Code Quality
- `auto-format.sh` - Auto-formatting
- `validate-rust.sh` - Rust validation
- `validate-typescript.sh` - TypeScript validation

### Session Management
- `session-keepalive.sh` - Keep session alive
- `session-continue.sh` - Continue session
- `log-commands.sh` - Command logging

### Utilities
- `worktree-prompt.sh` - Interactive worktree prompt
- `autocompact-manager.sh` - Autocompact management

---

## 🎯 Hook Trigger Points

### PreToolUse Hooks
| Tool | Hook | Purpose |
|------|------|---------|
| **Bash** | git-ops-validator.sh | Validate git commands |
| **Task** | agent-worktree-pre.sh | Create worktree for Sub-Agent |
| **Write** | auto-format.sh | Auto-format before writing |

### PostToolUse Hooks
| Tool | Hook | Purpose |
|------|------|---------|
| **Task** | agent-worktree-post.sh | Cleanup worktree after Sub-Agent |
| **Write** | validate-rust.sh | Validate Rust files |
| **Write** | validate-typescript.sh | Validate TypeScript files |

### Custom Event Hooks
| Event | Hook | Purpose |
|-------|------|---------|
| agent-start | notification.sh | Narrate agent start |
| agent-complete | agent-complete.sh | Narrate agent completion |
| worktree-create | notification.sh | Narrate worktree creation |
| worktree-cleanup | notification.sh | Narrate worktree cleanup |

---

## 🔧 Configuration Files

| File | Purpose | Format |
|------|---------|--------|
| `git-ops.json` | Git Ops validator config | JSON |
| `.agent-context.json` | Agent context (runtime) | JSON |
| `.worktree-state.json` | Worktree state (runtime) | JSON |

---

## 📚 Documentation

### Main Documentation
- `README.md` - Complete hooks documentation
- `INDEX.md` - This file (quick reference)

### Related Documentation
- `manifest.md` - Git Ops rules (project root)
- `.github/WORKFLOW_RULES.md` - Workflow rules
- `.claude/Skills/git-workflow/` - Git automation

---

## 🚀 Quick Start

### Enable Git Ops Validation
```bash
# Already enabled by default
# Configuration in: .claude/hooks/git-ops.json
```

### Test Git Ops Hook
```bash
# This should show validation
git commit -m "test commit"

# This should fail validation (no Conventional Commits format)
git commit -m "added feature"

# This should pass validation
git commit -m "feat(test): test commit

Closes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### View Validation Logs
```bash
cat .ai/logs/git-ops-$(date +%Y-%m-%d).log
```

---

## 🎓 Best Practices

### Git Operations
1. Always follow Conventional Commits format
2. Include Issue reference (Closes #123)
3. Add mandatory footer
4. Use descriptive branch names
5. Never force push to main

### Worktree Operations
1. Let hooks manage worktrees automatically
2. Don't manually create worktrees in orchestrator session
3. Check `.agent-context.json` for current worktree state
4. Review worktree logs: `.ai/logs/agent-worktrees-YYYY-MM-DD.log`

### Code Quality
1. Let auto-format handle formatting
2. Fix validation errors before committing
3. Run validation manually: `cargo clippy`, `cargo fmt --check`

---

## 🐛 Troubleshooting

### Git Ops Hook Not Working
```bash
# Check if hook is enabled
cat .claude/hooks/git-ops.json | jq '.enabled'

# Check if script is executable
ls -l .claude/hooks/git-ops-validator.sh

# Make executable if needed
chmod +x .claude/hooks/git-ops-validator.sh
```

### Validation Always Failing
```bash
# Check validation logs
tail -50 .ai/logs/git-ops-$(date +%Y-%m-%d).log

# Test validation manually
.claude/hooks/git-ops-validator.sh <<< "git commit -m 'test'"
```

### Worktree Issues
```bash
# List all worktrees
git worktree list

# Check agent context
cat .agent-context.json 2>/dev/null || echo "No active agent context"

# Remove stale worktrees
git worktree prune
```

---

## 📊 Hook Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 15 |
| Active Hooks | 7 |
| Scripts | 15 files |
| Config Files | 1 |
| Lines of Code | ~3500 |
| Coverage | Git, Agents, Quality, Session |

---

## 🔄 Version History

### v4.0.0 (2025-11-09)
- ✨ NEW: Git Ops Validator hook
- 📝 Integration with manifest.md
- 🔒 Enhanced safety protocols
- 📊 Comprehensive logging

### v3.0.0 (2025-10-31)
- ✨ NEW: Orchestrator Pattern
- 🔄 Automatic worktree management
- 🎯 Sub-Agent isolation
- 📝 Agent context tracking

### v2.0.0 (2025-10-15)
- ✨ VOICEVOX integration
- 🔔 Real-time notifications
- 📊 Event tracking

### v1.0.0 (2025-10-01)
- 🎉 Initial release
- 📝 Basic hooks
- 🔧 Code quality validation

---

**For detailed documentation, see: [README.md](.claude/hooks/README.md)**
