# 🔍 Root Directory Structure Review

**Date**: 2025-11-01
**Status**: 🔴 CRITICAL - Requires Immediate Cleanup

## 📊 Current State

### Summary Statistics
- **Total Items**: 115+ files and directories at root level
- **Hidden Directories**: 17 (`.xxx`)
- **Configuration Files**: 37
- **Documentation Files**: 33 (`.md`)
- **Scripts**: 13 (`.sh`)
- **Main Directories**: 32

### 🔴 Critical Issues

#### 1. **Excessive Root Clutter** (Severity: HIGH)
- **Problem**: 115+ items in root makes navigation difficult
- **Impact**: Poor developer experience, hard to find files
- **Recommendation**: Move to organized subdirectories

#### 2. **Duplicate AI Tool Configs** (Severity: MEDIUM)
```
./.claude/          ← Primary (should be canonical)
./.codex/           ← Duplicate of .claude
./.cursor/          ← Duplicate of .claude
./.claude-plugin/   ← Separate (marketplace distribution)
```
**Recommendation**: Consolidate or use symlinks

#### 3. **Multiple Worktree Directories** (Severity: LOW)
```
./.worktrees/       ← Production
./.worktrees-e2e/   ← E2E testing
./.worktrees-test/  ← Unit testing
```
**Status**: Acceptable for separation of concerns

#### 4. **Too Many Documentation Files** (Severity: HIGH)
- **33 `.md` files** in root (should be 5-8 max)
- **Critical docs**: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`
- **Should move to `docs/`**: All `*_REPORT.md`, `*_GUIDE.md`, `*_CHECKLIST.md`

#### 5. **Scattered Scripts** (Severity: MEDIUM)
- **13 `.sh` files** in root
- **Should move to `scripts/`**: All tutorial launch scripts, setup scripts

#### 6. **Legacy/Unused Directories** (Severity: MEDIUM)
```
./Youtube/          ← Should be docs/youtube or examples/youtube
./ISSUES/           ← Unclear purpose (GitHub Issues are online)
./miyabi_def/       ← Legacy? Needs verification
./tutorials/        ← Should be examples/ or docs/tutorials/
```

---

## 📋 Proposed Structure

### ✅ Ideal Root Structure (20-25 items max)

```
miyabi-private/
│
├── 🔧 Core Configuration (8 files)
│   ├── Cargo.toml              # Rust workspace
│   ├── Cargo.lock              # Dependency lock
│   ├── rust-toolchain.toml     # Rust version
│   ├── .miyabi.yml             # Miyabi config
│   ├── package.json            # Node.js (dashboard/web)
│   ├── pnpm-workspace.yaml     # PNPM workspace
│   ├── docker-compose.yml      # Docker orchestration
│   └── vercel.json             # Vercel deployment
│
├── 📚 Essential Documentation (5 files)
│   ├── README.md               # Project overview
│   ├── CLAUDE.md               # Claude Code context
│   ├── CHANGELOG.md            # Version history
│   ├── CONTRIBUTING.md         # Contribution guide
│   └── SECURITY.md             # Security policy
│
├── 🔐 Environment Files (3 files)
│   ├── .env.example            # Example environment
│   ├── .gitignore              # Git ignore rules
│   └── .dockerignore           # Docker ignore rules
│
├── 🤖 AI Tool Integration (4 directories)
│   ├── .claude/                # Claude Code (canonical)
│   ├── .github/                # GitHub Actions
│   ├── .vscode/                # VS Code settings
│   └── .config/                # Tool configs (nextest, etc.)
│
├── 🦀 Rust Source (1 directory)
│   └── crates/                 # Cargo workspace crates (15+)
│
├── 🎨 Frontend (3 directories)
│   ├── miyabi-dashboard/       # React dashboard
│   ├── miyabi-web/             # Landing page
│   └── miyabi-desktop/         # Tauri desktop app
│
├── 📖 Documentation (1 directory)
│   └── docs/                   # Comprehensive documentation
│       ├── guides/             # Guides (MCP, API, etc.)
│       ├── reports/            # Reports (deployment, monitoring, etc.)
│       ├── checklists/         # Checklists (release, deployment)
│       ├── architecture/       # Architecture docs
│       └── papers/             # Research papers (SWML)
│
├── 🔧 Development Tools (4 directories)
│   ├── scripts/                # All shell scripts
│   ├── tools/                  # Development tools
│   ├── benchmarks/             # Performance benchmarks
│   └── examples/               # Code examples & tutorials
│
├── 🚀 Deployment & Infrastructure (3 directories)
│   ├── deployment/             # Deployment configs
│   ├── docker/                 # Dockerfiles
│   └── mcp-servers/            # MCP server implementations
│
├── 💾 Data & Logs (3 directories)
│   ├── .ai/                    # AI execution data
│   ├── logs/                   # Application logs
│   └── reports/                # Execution reports
│
├── 🧪 Testing (2 directories)
│   ├── tests/                  # Integration tests
│   └── .worktrees/             # Git worktrees (auto-managed)
│
└── 🗄️ Other (as needed)
    ├── assets/                 # Static assets
    ├── data/                   # Data files
    ├── database/               # Database schemas
    ├── integrations/           # External integrations
    └── legal/                  # Legal documents
```

**Total**: ~25 top-level items (vs current 115+)

---

## 🎯 Action Plan

### Phase 1: Documentation Cleanup (Priority: HIGH)

**Move to `docs/`**:
```bash
mkdir -p docs/{guides,reports,checklists,architecture}

# Reports
mv *_REPORT.md docs/reports/
mv *_COMPLETE.md docs/reports/
mv SESSION_SUMMARY.md docs/reports/

# Guides
mv *_GUIDE.md docs/guides/
mv *_SETUP.md docs/guides/
mv QUICKSTART-JA.md docs/guides/

# Checklists
mv *_CHECKLIST.md docs/checklists/
mv MIGRATION_v0.1.1.md docs/checklists/

# Architecture & Planning
mv RESTRUCTURING_*.md docs/architecture/
mv NEXT_PHASE_PLANNING.md docs/architecture/
mv Plans.md docs/architecture/
mv CODEX_INTEGRATION_PROGRESS.md docs/architecture/

# Keep in root
# - README.md
# - CLAUDE.md
# - CHANGELOG.md
# - CONTRIBUTING.md
# - SECURITY.md
# - PERFORMANCE.md (maybe)
# - TODO.md (maybe)
```

### Phase 2: Scripts Consolidation (Priority: MEDIUM)

```bash
# Move to scripts/
mv *.sh scripts/
mv miyabi-*.sh scripts/

# Exception: Keep miyabi.sh in root as entry point (or create symlink)
ln -s scripts/miyabi.sh ./miyabi.sh
```

### Phase 3: AI Tool Config Consolidation (Priority: MEDIUM)

**Option A: Symlinks** (Recommended)
```bash
# Make .claude canonical
rm -rf .codex .cursor
ln -s .claude .codex
ln -s .claude .cursor
```

**Option B: Keep Separate** (if tools diverge)
```bash
# Document in README.md that .claude is primary
# .codex and .cursor are for tool-specific overrides
```

### Phase 4: Directory Reorganization (Priority: LOW)

```bash
# Move tutorials to examples
mv tutorials/ examples/tutorials/

# Verify and possibly remove
# - ISSUES/ (if unused)
# - miyabi_def/ (if legacy)
# - Youtube/ (move to docs/youtube or examples/youtube)
```

### Phase 5: Environment Files Cleanup (Priority: LOW)

```bash
# Keep only
# - .env.example
# Remove or move to docs/examples/
# - .env.backup
# - .env.fanza.template
# - .env.telegram.example
# - .miyabi.yml.backup
# - .miyabi.yml.example
# - .miyabirules.example
# - .miyabirules.simple
```

---

## 📊 Before & After Comparison

| Category | Before | After | Reduction |
|----------|--------|-------|-----------|
| **Total Items** | 115+ | ~25 | **78% ↓** |
| **Documentation** | 33 | 5 | **85% ↓** |
| **Scripts** | 13 | 1-2 | **85% ↓** |
| **Config Files** | 37 | 12 | **68% ↓** |
| **Hidden Dirs** | 17 | 6-8 | **53% ↓** |

---

## 🚨 Risk Assessment

### Low Risk (Safe to Execute)
- ✅ Moving `.md` files to `docs/`
- ✅ Moving `.sh` scripts to `scripts/`
- ✅ Removing backup files (`.backup`, `.example` duplicates)

### Medium Risk (Needs Testing)
- ⚠️ Symlinking `.codex` → `.claude`
- ⚠️ Moving tutorials
- ⚠️ Consolidating env examples

### High Risk (Requires Careful Review)
- 🔴 Removing `ISSUES/`, `miyabi_def/`, `Youtube/`
- 🔴 Changing `.worktrees*` structure

---

## 🎯 Recommended Execution Order

1. **Week 1**: Documentation cleanup (Phase 1)
   - Low risk, high impact
   - Immediate improvement to navigation

2. **Week 2**: Scripts consolidation (Phase 2)
   - Low risk
   - Cleaner root directory

3. **Week 3**: AI tool config (Phase 3)
   - Test carefully with each tool
   - Verify Claude Code, Codex, Cursor all work

4. **Week 4**: Directory reorganization (Phase 4)
   - Review each directory before moving
   - Update references in documentation

5. **Week 5**: Environment files cleanup (Phase 5)
   - Low priority
   - Can be done incrementally

---

## 📝 Notes

### Files to Keep in Root (Final State)

**Configuration** (8-10):
- `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`
- `.miyabi.yml`
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- `docker-compose.yml`, `vercel.json`
- `cloudbuild.yaml` (GCP)

**Documentation** (5):
- `README.md`, `CLAUDE.md`, `CHANGELOG.md`
- `CONTRIBUTING.md`, `SECURITY.md`

**Environment** (3):
- `.env.example`, `.gitignore`, `.dockerignore`

**Other** (5):
- `Dockerfile`, `LICENSE`, `NOTICE`, `CODEOWNERS`
- `TODO.md` (optional)

**Total**: ~20-25 items ✅

---

## 🔗 Related Documents

- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) - Current structure reference
- [RESTRUCTURING_PLAN.md](./RESTRUCTURING_PLAN.md) - Previous restructuring plans
- [CLAUDE.md](./CLAUDE.md) - Project control document

---

**Review Status**: ⏳ Pending Approval
**Estimated Cleanup Time**: 4-5 weeks (incremental)
**Priority**: HIGH (improves developer experience significantly)

