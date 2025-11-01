# .claude Directory & CLAUDE.md Context Reorganization Plan

**Date**: 2025-11-01
**Version**: 1.0.0
**Status**: Proposal

---

## Executive Summary

The `.claude/` directory and `CLAUDE.md` control document have accumulated significant redundancy and organizational issues:

**Current State**:
- 173 MD files across `.claude/`
- 357 lines in `CLAUDE.md` (root)
- Duplicate information across 4+ locations
- Inconsistent structure and outdated references
- No clear hierarchy or discovery path

**Proposed State**:
- Consolidate to ~100 essential files (42% reduction)
- Update `CLAUDE.md` to reference new SWML-based structure
- Clear 3-tier hierarchy: Essential → Reference → Archive
- Single source of truth for each concept

---

## 🔍 Issues Identified

### 1. Duplication & Redundancy

| Content | Locations | Issue |
|---------|-----------|-------|
| **Agent system** | `.claude/agents.md`, `.claude/context/agents.md`, `.claude/agents/README.md`, `AGENTS.md` (root) | 4 places with overlapping content |
| **Quick Start** | `.claude/QUICK_START.md`, `.claude/README.md`, `README.md` (root), `QUICKSTART-JA.md` (root) | 4 different quick start guides |
| **Core Rules** | `.claude/context/core-rules.md`, `CLAUDE.md`, `.claude/README.md` | Rules repeated in 3 places |
| **Agent specs** | `.claude/agents/specs/`, individual agent READMEs | Duplicate information |
| **Label system** | `.claude/context/labels.md`, `.claude/LABEL_USAGE_GUIDE.md`, `docs/LABEL_SYSTEM_GUIDE.md` | 3 label documents |
| **Codex patterns** | `.claude/CODEX_DESIGN_PATTERNS.md`, `.claude/CODEX_PATTERN_APPLICATION_PLAN.md`, `.claude/PATTERN3_CHECKLIST.md` | 3 overlapping Codex docs |

**Impact**: Users don't know which version is authoritative.

### 2. Structural Issues

**Problem**: Flat structure with unclear categorization

```
.claude/
├── 20 MD files at root (mixed purposes)
├── agents/ (nested structure, good)
├── commands/ (slash commands, good)
├── context/ (13 modules, good)
├── Skills/ (17 skills, good)
├── hooks/ (16 hooks, good)
├── mcp-servers/ (7 servers, good)
├── prompts/ (2 files)
├── templates/ (1 file)
├── docs/ (4 AI CLI docs)
├── test-results/ (3 test reports)
├── archive/ (1 old file)
└── scripts/ (2 scripts)
```

**Issues**:
- 20 root-level MD files with mixed purposes
- `docs/` directory duplicates root docs
- Test results mixed with core content
- No clear "deprecated" vs "active" distinction

### 3. CLAUDE.md Issues

**Problems**:
1. **Outdated references**: Points to old structure (pre-SWML)
2. **Too comprehensive**: 357 lines trying to cover everything
3. **No SWML alignment**: Doesn't mention SWML theoretical framework
4. **Duplicate content**: Repeats information from `.claude/context/`
5. **Unclear priority**: Everything seems equally important

### 4. Missing Documentation

**No docs for**:
- SWML implementation mapping (theory → code)
- Ω function phase breakdown (θ₁-θ₆)
- Convergence tracking usage
- Quality metrics implementation
- New SWML-specific crates

### 5. Obsolete Content

**Candidates for archiving**:
- `.claude/RUST_MIGRATION_CHECKLIST.md` - Migration complete
- `.claude/RUST_MIGRATION_SUMMARY.md` - Migration complete
- `.claude/NEXT_PHASE_PLANNING.md` - Superseded by restructuring plan
- `.claude/CODEX_SESSION_README.md` - Outdated Codex reference
- `.claude/TEST_INSTRUCTIONS_FOR_CODEX.md` - Legacy testing
- `.claude/TEST_INSTRUCTIONS_FOR_GEMINI.md` - Legacy testing
- `.claude/test-results/` - Old test reports

---

## 🏗️ Proposed Reorganization

### New .claude/ Structure

```
.claude/
│
├── 📚 CORE (Essential - Always Load)
│   ├── README.md                       # Quick orientation
│   ├── INDEX.md                        # Master navigation (keep current)
│   └── QUICK_START.md                  # Fast onboarding
│
├── 🎯 context/ (Context Modules - JIT Load)
│   ├── INDEX.md                        # Context index
│   ├── core-rules.md                   # MCP First, Benchmark Protocol
│   ├── swml-framework.md               # ★ NEW: SWML Ω function overview
│   ├── omega-phases.md                 # ★ NEW: θ₁-θ₆ implementation guide
│   ├── architecture.md                 # System architecture
│   ├── agents.md                       # Agent system (consolidated)
│   ├── entity-relation.md              # Entity-Relation model
│   ├── labels.md                       # Label system
│   ├── worktree.md                     # Git worktree
│   ├── rust.md                         # Rust development
│   ├── development.md                  # Dev practices
│   ├── protocols.md                    # Task protocols
│   ├── external-deps.md                # External integrations
│   └── typescript.md                   # TypeScript (legacy)
│
├── 🤖 agents/ (Agent System)
│   ├── README.md                       # Agent overview (consolidated)
│   ├── AGENT_CHARACTERS.md             # Agent personalities
│   ├── WORKFLOW_INDEX.md               # Workflow patterns
│   ├── specs/                          # Agent specifications
│   │   ├── coding/                     # 7 coding agents
│   │   ├── business/                   # 14 business agents
│   │   └── lark/                       # Lark framework
│   ├── prompts/                        # Execution prompts
│   │   ├── coding/
│   │   ├── business/
│   │   └── lark/
│   └── examples/                       # Usage examples
│
├── ⚡ commands/ (Slash Commands)
│   ├── INDEX.md                        # Command index
│   ├── agent-run.md
│   ├── create-issue.md
│   ├── verify.md
│   ├── session-end.md
│   └── ... (25 commands)
│
├── 🛠️ Skills/ (Claude Code Skills)
│   ├── README.md                       # Skills overview
│   ├── agent-execution/
│   ├── rust-development/
│   ├── debugging-troubleshooting/
│   └── ... (17 skills)
│
├── 🪝 hooks/ (Event Hooks)
│   ├── README.md                       # Hooks guide
│   ├── agent-complete.sh
│   ├── session-start.sh
│   └── ... (16 hooks)
│
├── 🔌 mcp-servers/ (MCP Integrations)
│   ├── discord-integration.js
│   ├── github-enhanced.cjs
│   └── ... (7 servers)
│
├── 📖 guides/ (Reference Guides - Consolidated)
│   ├── MCP_INTEGRATION_PROTOCOL.md     # MCP integration
│   ├── BENCHMARK_IMPLEMENTATION.md     # Benchmark guide (renamed)
│   ├── HOOKS_IMPLEMENTATION.md         # Hook system (renamed)
│   ├── LABEL_USAGE.md                  # Label guide (renamed)
│   ├── SWML_CONVERGENCE.md             # ★ NEW: Convergence tracking
│   ├── SWML_QUALITY_METRICS.md         # ★ NEW: Quality metrics
│   └── TROUBLESHOOTING.md              # Common issues
│
├── 🧪 workflows/ (Development Workflows - New)
│   ├── task-management.md              # Task protocols
│   ├── worktree-execution.md           # Worktree patterns
│   ├── agent-execution.md              # Agent workflows
│   └── reporting-protocol.md           # Reporting standards
│
├── ⚙️ config/ (Configuration)
│   ├── settings.json
│   ├── settings.example.json
│   ├── settings.local.json
│   ├── mcp-config.json
│   ├── mcp.json
│   ├── ai-cli-versions.json
│   ├── agent-name-mapping.json
│   └── triggers.json
│
├── 📦 scripts/ (Utility Scripts)
│   ├── check-ai-cli-versions.sh
│   ├── health-check.sh
│   └── ... (utility scripts)
│
└── 📁 archive/ (Obsolete/Historical)
    ├── RUST_MIGRATION_CHECKLIST.md
    ├── RUST_MIGRATION_SUMMARY.md
    ├── NEXT_PHASE_PLANNING.md
    ├── CODEX_SESSION_README.md
    ├── TEST_INSTRUCTIONS_FOR_CODEX.md
    ├── TEST_INSTRUCTIONS_FOR_GEMINI.md
    ├── CODEX_DESIGN_PATTERNS.md        # Archive if no longer used
    ├── CODEX_PATTERN_APPLICATION_PLAN.md
    ├── PATTERN3_CHECKLIST.md
    ├── test-results/                   # Old test reports
    ├── docs/                           # Old AI CLI docs
    └── old-docs/                       # Already archived
```

**Changes**:
- **20 root MD files → 3 core files** (85% reduction)
- New `guides/` directory consolidates reference docs
- New `workflows/` directory for development patterns
- New `archive/` for obsolete content
- New SWML-specific context modules and guides

### Updated context/ Structure

**New Files**:
1. **swml-framework.md** (NEW):
   - SWML Ω function overview
   - Six-phase decomposition summary
   - Links to theory and implementation
   - Quick reference for θ₁-θ₆

2. **omega-phases.md** (NEW):
   - Detailed θ₁-θ₆ implementation guide
   - Code locations for each phase
   - How to add new phase components
   - Convergence tracking integration

**Updated Files**:
- **agents.md**: Consolidate `.claude/agents.md` + `.claude/agents/README.md`
- **core-rules.md**: Add SWML framework reference
- **architecture.md**: Update with SWML structure

---

## 📝 Updated CLAUDE.md Structure

### New CLAUDE.md (Simplified to ~200 lines)

```markdown
# Miyabi - Project Control Document

**Version**: 4.0.0 (SWML-Aligned)
**Date**: 2025-11-01

## 🎯 Top Concept: SWML Ω Function

Miyabi implements **SWML (Shunsuke's World Model Logic)**, a formal mathematical framework for autonomous development with convergence guarantees.

Ω: I × W → R
Ω = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁

**Theory**: `/theory/swml-paper/SWML_PAPER.pdf`
**Implementation**: `/implementation/omega/` (θ₁-θ₆ phases)
**Context**: `.claude/context/swml-framework.md`

---

## 🚀 Quick Start

**First time?**
1. Read: `.claude/QUICK_START.md`
2. Run: `cargo build --release`
3. Execute: `miyabi work-on <issue-number>`

**Full Documentation**: `.claude/INDEX.md`

---

## ⭐ Critical Rules

1. **SWML First**: All implementations must map to Ω function phases
2. **MCP First**: Check MCP availability before starting tasks
3. **Skill Delegation**: Use Skills/Sub-Agents, never implement directly
4. **Context7**: Always use Context7 for external library docs

**Details**: `.claude/context/core-rules.md`

---

## 📁 Project Structure (SWML-Aligned)

```
miyabi-private/
├── theory/                    # SWML mathematical foundation
├── implementation/            # Rust implementation
│   ├── omega/                 # Ω function (θ₁-θ₆)
│   ├── core/                  # Core infrastructure
│   ├── agents/                # 21 agents
│   ├── infrastructure/        # Integrations
│   ├── interfaces/            # CLI/Desktop/Web
│   └── quality/               # Metrics & testing
├── documentation/             # All docs
├── deployment/                # Ops & CI/CD
├── config/                    # Configuration
└── CLAUDE.md                  # This file
```

**Full Structure**: `RESTRUCTURING_PLAN.md`

---

## 🤖 Agent System

**21 Agents Total**:
- **Coding** (7): Coordinator, CodeGen, Review, Issue, PR, Deploy, Refresher
- **Business** (14): AIEntrepreneur, ProductConcept, Marketing, Sales, CRM, etc.

**Execution**: Use `/agent-run` or `agent-execution` Skill

**Details**: `.claude/agents/README.md`, `.claude/context/agents.md`

---

## ⚡ Commands & Skills

**Slash Commands**: 25+ available in `.claude/commands/`
**Skills**: 17 available in `.claude/Skills/`
**MCP Servers**: 7 available in `.claude/mcp-servers/`

**Index**: `.claude/INDEX.md`

---

## 📚 Context Modules (JIT Loading)

**Essential** (⭐⭐⭐⭐⭐):
- `.claude/context/core-rules.md` - Critical rules
- `.claude/context/swml-framework.md` - SWML overview (NEW)
- `.claude/context/omega-phases.md` - θ₁-θ₆ guide (NEW)

**High Priority** (⭐⭐⭐⭐):
- `.claude/context/architecture.md` - System design
- `.claude/context/agents.md` - Agent details
- `.claude/context/rust.md` - Rust development

**Full List**: `.claude/context/INDEX.md`

---

## 🔗 Key References

- **SWML Paper**: `/theory/swml-paper/SWML_PAPER.pdf`
- **Implementation Plan**: `/implementation/omega/miyabi-agent-swml/IMPLEMENTATION_PLAN.md`
- **Restructuring**: `RESTRUCTURING_PLAN.md`
- **Troubleshooting**: `.claude/guides/TROUBLESHOOTING.md`

---

## 🎮 Quick Commands

```bash
# Build & Run
cargo build --release
miyabi --help

# Development
miyabi work-on <issue>
miyabi parallel --issues 1,2,3
miyabi status --watch

# SWML-specific
miyabi convergence-status
miyabi quality-report
```

---

## 📝 Notes for Claude Code

1. **SWML Alignment**: All code must map to Ω function phases (θ₁-θ₆)
2. **Context Loading**: Load `.claude/context/` modules on-demand (JIT)
3. **Skill Usage**: Always delegate to Skills/Sub-Agents
4. **Quality Metrics**: Target Q(R) ≥ 0.80 (Safety Axiom)
5. **Convergence**: Monitor iterations, target 4-5 iterations average

---

**Maintained by**: Miyabi Team
**Status**: ✅ Active
**Last Updated**: 2025-11-01
```

**Key Changes**:
- Reduced from 357 → ~200 lines (44% reduction)
- SWML framework as top concept
- Clear reference to new structure
- Links to detailed docs in `.claude/`
- Removed duplicate content

---

## 🔄 Migration Steps

### Phase 1: Preparation (Day 1)

**Tasks**:
1. ✅ Create this reorganization plan
2. ⬜ Review and approval
3. ⬜ Backup current `.claude/` (git tag `.claude-pre-reorg`)
4. ⬜ Create new directory structure
5. ⬜ Write new SWML context modules

### Phase 2: Move & Consolidate (Day 2-3)

**Tasks**:
1. ⬜ Create new directories: `guides/`, `workflows/`, `archive/`
2. ⬜ Move files to new locations:
   - Root MD files → `guides/` or `archive/`
   - `prompts/` content → `workflows/`
   - `templates/` content → `workflows/`
   - `docs/` → `archive/` (if obsolete)
   - `test-results/` → `archive/`

3. ⬜ Consolidate duplicates:
   - Merge `.claude/agents.md` + `.claude/agents/README.md`
   - Merge label docs into single source
   - Merge Codex pattern docs (or archive)

4. ⬜ Create new files:
   - `.claude/context/swml-framework.md`
   - `.claude/context/omega-phases.md`
   - `.claude/guides/SWML_CONVERGENCE.md`
   - `.claude/guides/SWML_QUALITY_METRICS.md`

### Phase 3: Update References (Day 4)

**Tasks**:
1. ⬜ Update all internal links in `.claude/` files
2. ⬜ Update `.claude/INDEX.md` with new structure
3. ⬜ Update `.claude/context/INDEX.md`
4. ⬜ Update command files with new paths
5. ⬜ Update Skills with new references

### Phase 4: Update CLAUDE.md (Day 5)

**Tasks**:
1. ⬜ Rewrite `CLAUDE.md` with new structure
2. ⬜ Add SWML framework as top concept
3. ⬜ Remove duplicate content
4. ⬜ Update all links to `.claude/`
5. ⬜ Reduce to ~200 lines

### Phase 5: Validation (Day 6)

**Tasks**:
1. ⬜ Validate all links (automated checker)
2. ⬜ Test slash commands still work
3. ⬜ Test Skills still load correctly
4. ⬜ Test MCP servers still connect
5. ⬜ Review with team

### Phase 6: Documentation (Day 7)

**Tasks**:
1. ⬜ Create migration guide for contributors
2. ⬜ Update main `README.md` if needed
3. ⬜ Update `CONTRIBUTING.md` with new structure
4. ⬜ Add deprecation notices to archived files

---

## 📊 Expected Impact

### File Count

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Root MD files | 20 | 3 | -85% |
| Total MD files | 173 | ~100 | -42% |
| Context modules | 13 | 15 | +15% (2 new SWML modules) |
| Guides | Scattered | 7 | Consolidated |
| Archive | 1 | ~30 | Moved obsolete content |

### CLAUDE.md

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Line count | 357 | ~200 | -44% |
| Duplicate content | High | None | -100% |
| SWML references | 0 | Prominent | ✅ |
| Clarity | Medium | High | ✅ |

### Developer Experience

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Time to find doc | 2-5 min | <1 min | 60-80% faster |
| Onboarding time | 2-3 hours | 30-60 min | 50-75% faster |
| Doc maintenance | High | Low | Easier |
| Duplicate detection | Manual | None | Automated |

---

## ✅ Success Criteria

**Structural**:
- ✅ Root `.claude/` MD files: 20 → 3 (85% reduction)
- ✅ Total MD files: 173 → ~100 (42% reduction)
- ✅ New SWML context modules created (2 files)
- ✅ Obsolete content archived (~30 files)
- ✅ Clear 3-tier hierarchy (Core → Reference → Archive)

**Content**:
- ✅ Zero duplication across docs
- ✅ Single source of truth for each concept
- ✅ SWML framework prominently featured
- ✅ All Ω phases (θ₁-θ₆) documented

**Functional**:
- ✅ All internal links valid
- ✅ All slash commands work
- ✅ All Skills load correctly
- ✅ All MCP servers connect

**Developer Experience**:
- ✅ New contributors onboard in <1 hour
- ✅ Find any doc in <1 minute
- ✅ Understand SWML structure immediately
- ✅ Know where to add new content

---

## 🚨 Risks & Mitigation

### Risk 1: Breaking Links

**Risk**: Mov files breaks internal/external links.

**Mitigation**:
1. Use automated link checker before/after
2. Create redirect map (old → new paths)
3. Add deprecation notices with redirect links
4. Keep old files temporarily with redirect pointers

### Risk 2: Lost Content

**Risk**: Accidentally delete important information during consolidation.

**Mitigation**:
1. Git tag before starting (`.claude-pre-reorg`)
2. Review all archived files before moving
3. Create consolidation plan for each duplicate
4. Keep archive accessible for 3 months

### Risk 3: Confusion During Transition

**Risk**: Contributors confused by changing structure.

**Mitigation**:
1. Create clear migration guide
2. Announce changes in main README
3. Add "MOVED" notices to old locations
4. Update all dependent docs immediately

---

## 📝 Next Steps

1. **Review this plan** - Approve proposed structure
2. **Create SWML modules** - Write new context files
3. **Execute migration** - Follow 7-day plan
4. **Update CLAUDE.md** - Implement new version
5. **Validate & test** - Ensure everything works
6. **Document migration** - Help contributors adapt

---

**Prepared by**: Claude Code (Miyabi AI Assistant)
**Status**: Awaiting Approval
**Version**: 1.0.0
**Date**: 2025-11-01
