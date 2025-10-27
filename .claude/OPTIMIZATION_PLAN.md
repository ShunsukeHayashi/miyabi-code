# .claude Directory Optimization Plan

**Date**: 2025-10-27
**Current Status**: 31 directories, 104 files
**Goal**: Streamline structure, reduce duplication, improve navigation

---

## 📊 Current Structure Analysis

### Identified Issues

1. **Duplicate Content** 🔴
   - `agents.md` in root duplicates `.claude/context/agents.md`
   - `issues.md` in root (appears unused)
   - Multiple README files with overlapping content

2. **Inconsistent Organization** 🟡
   - Root-level docs mixed with categorized subdirectories
   - Some guides in root, others in subdirectories
   - No clear hierarchy for different document types

3. **Outdated/Legacy Content** 🟡
   - `typescript.md` (legacy, Rust migration complete)
   - Multiple TEST_INSTRUCTIONS files (Codex, Gemini)
   - Old migration checklists (RUST_MIGRATION_*)

4. **MCP Server Clutter** 🟡
   - 7 MCP server files in `.claude/mcp-servers/`
   - Mixed JS/CJS files
   - Could be moved to dedicated directory

5. **Missing Index** 🔴
   - No top-level index of all resources
   - Hard to find specific guides
   - No categorization by purpose

---

## 🎯 Optimization Strategy

### Phase 1: Archive Legacy Content

Move outdated content to `.claude/archive/`:

```
.claude/archive/
├── legacy-typescript/
│   └── typescript.md
├── migration/
│   ├── RUST_MIGRATION_CHECKLIST.md
│   └── RUST_MIGRATION_SUMMARY.md
├── testing/
│   ├── TEST_INSTRUCTIONS_FOR_CODEX.md
│   └── TEST_INSTRUCTIONS_FOR_GEMINI.md
└── old-docs/
    └── CODEX_SESSION_README.md
```

### Phase 2: Consolidate Documentation

**Root Level** (Keep only essentials):
- `README.md` - Main entry point
- `QUICK_START.md` - Getting started
- `INDEX.md` - **NEW** - Master index of all resources

**Move to `docs/`**:
- `BENCHMARK_IMPLEMENTATION_CHECKLIST.md` → `docs/benchmarks/`
- `CODEX_DESIGN_PATTERNS.md` → `docs/codex/`
- `CODEX_PATTERN_APPLICATION_PLAN.md` → `docs/codex/`
- `HOOKS_IMPLEMENTATION_GUIDE.md` → `docs/hooks/`
- `LABEL_USAGE_GUIDE.md` → `docs/labels/`
- `MCP_INTEGRATION_PROTOCOL.md` → `docs/mcp/`
- `NEXT_PHASE_PLANNING.md` → `docs/planning/`
- `TROUBLESHOOTING.md` → `docs/troubleshooting/`

**Move to `docs/ai-cli/`**:
- `.claude/docs/AI_CLI_*.md` → `docs/ai-cli/`

### Phase 3: Reorganize Structure

**Proposed New Structure**:

```
.claude/
├── README.md                          # Main entry point
├── QUICK_START.md                     # Quick start guide
├── INDEX.md                           # NEW: Master index
│
├── agents/                            # Agent specifications
│   ├── README.md
│   ├── AGENT_CHARACTERS.md
│   ├── WORKFLOW_INDEX.md
│   ├── specs/                         # Agent specs by category
│   │   ├── business/
│   │   ├── coding/
│   │   └── lark/
│   └── prompts/                       # Agent prompt templates
│
├── commands/                          # Slash commands
│   ├── INDEX.md
│   ├── *.md                           # Command documentation
│   └── *.sh                           # Executable scripts
│
├── context/                           # Core context modules
│   ├── INDEX.md
│   └── *.md                           # Context files
│
├── docs/                              # Documentation by topic
│   ├── ai-cli/                        # AI CLI integration
│   ├── benchmarks/                    # Benchmark guides
│   ├── codex/                         # Codex X documentation
│   ├── hooks/                         # Hook implementation
│   ├── labels/                        # Label system
│   ├── mcp/                           # MCP integration
│   ├── planning/                      # Planning docs
│   └── troubleshooting/               # Troubleshooting guides
│
├── hooks/                             # Hook scripts
│   ├── README.md
│   └── *.sh
│
├── mcp-servers/                       # MCP server implementations
│   ├── README.md
│   └── *.{js,cjs}
│
├── prompts/                           # Prompt templates
│   └── *.md
│
├── scripts/                           # Utility scripts
│   └── *.sh
│
├── settings/                          # Configuration files
│   ├── settings.json
│   ├── settings.example.json
│   ├── mcp-config.json
│   └── mcp.json
│
├── Skills/                            # Claude Code skills
│   └── */
│
├── templates/                         # Document templates
│   └── *.md
│
├── test-results/                      # Test reports
│   └── *.md
│
└── archive/                           # Legacy content
    ├── legacy-typescript/
    ├── migration/
    ├── testing/
    └── old-docs/
```

### Phase 4: Create Master Index

**NEW FILE: `.claude/INDEX.md`**

Categorized index with:
- Quick links to all major resources
- Purpose-based organization
- Search-friendly structure

### Phase 5: Remove Duplicates

1. **Delete duplicate `agents.md`** from root
2. **Consolidate README files** where appropriate
3. **Remove obsolete files**:
   - `issues.md` (if unused)
   - Broken symlinks
   - Empty placeholder files

---

## 📋 Implementation Checklist

### Phase 1: Archive (Priority: Low)
- [ ] Create `.claude/archive/` directory
- [ ] Move `typescript.md` to `archive/legacy-typescript/`
- [ ] Move `RUST_MIGRATION_*.md` to `archive/migration/`
- [ ] Move `TEST_INSTRUCTIONS_*.md` to `archive/testing/`
- [ ] Move `CODEX_SESSION_README.md` to `archive/old-docs/`

### Phase 2: Consolidate Docs (Priority: High)
- [ ] Create `.claude/docs/` subdirectories
- [ ] Move root-level docs to appropriate subdirectories
- [ ] Update internal links
- [ ] Update README references

### Phase 3: Reorganize (Priority: Medium)
- [ ] Create new directory structure
- [ ] Move files to new locations
- [ ] Update all references
- [ ] Test all slash commands still work

### Phase 4: Create Index (Priority: High)
- [ ] Create `.claude/INDEX.md`
- [ ] Categorize all resources
- [ ] Add descriptions and purposes
- [ ] Link to all major guides

### Phase 5: Cleanup (Priority: Medium)
- [ ] Remove duplicate `agents.md`
- [ ] Remove `issues.md` if unused
- [ ] Clean up broken links
- [ ] Update all README files

---

## 🎯 Expected Benefits

### Navigation
- ✅ Clear hierarchy
- ✅ Easy to find specific guides
- ✅ Reduced cognitive load

### Maintenance
- ✅ No duplicate content
- ✅ Clear ownership of each file
- ✅ Easier to update

### Onboarding
- ✅ New users can quickly orient
- ✅ Master index provides overview
- ✅ Logical categorization

### Size
- ✅ ~20 fewer root-level files
- ✅ Legacy content archived
- ✅ Cleaner git history

---

## 🚀 Quick Win: Immediate Actions

**Can be done right now** (5 minutes):

1. Create `.claude/INDEX.md` master index
2. Move duplicate `agents.md` → `agents.md.old`
3. Create `.claude/docs/` directory structure
4. Update main `.claude/README.md` with new structure

**Medium effort** (30 minutes):

5. Move all root-level guides to `docs/` subdirectories
6. Update internal links
7. Create archive directory
8. Move legacy content

**Long term** (2 hours):

9. Fully reorganize structure
10. Test all commands
11. Update all documentation references
12. Create comprehensive INDEX.md

---

## 📊 Metrics

### Current
- **Total files**: 104
- **Root-level docs**: ~20
- **Directories**: 31
- **Duplicates**: 3-5 files

### Target
- **Total files**: ~100 (archive doesn't count)
- **Root-level docs**: 3 (README, QUICK_START, INDEX)
- **Directories**: 15-20 (consolidated)
- **Duplicates**: 0

---

## 🔄 Migration Safety

### Backup Strategy
1. Create git branch: `optimize-claude-directory`
2. Commit after each phase
3. Tag important milestones
4. Keep archive for 2-3 months

### Rollback Plan
If issues arise:
```bash
git checkout main
# Or restore from archive
cp -r .claude/archive/* .claude/
```

### Testing Checklist
After each phase:
- [ ] All slash commands work
- [ ] Skills load correctly
- [ ] MCP servers accessible
- [ ] Hooks execute properly
- [ ] Context files loadable

---

## 📝 Next Steps

1. **Review this plan** with team/user
2. **Create git branch** for changes
3. **Start with Phase 1** (archive)
4. **Execute Phase 2** (consolidate)
5. **Test thoroughly** after each phase
6. **Merge to main** when complete

---

**Author**: Claude Code (Sonnet 4.5)
**Status**: ✅ Ready for Review
**Estimated Time**: 30-120 minutes (depending on thoroughness)
