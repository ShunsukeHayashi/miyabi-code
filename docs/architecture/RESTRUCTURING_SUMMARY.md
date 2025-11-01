# Miyabi Restructuring Summary - Visual Overview

**Date**: 2025-11-01
**Related**: [RESTRUCTURING_PLAN.md](RESTRUCTURING_PLAN.md)

---

## 🎯 The Top Concept: SWML's Ω Function

```
Ω: I × W → R
Ω = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁

┌─────────────────────────────────────────────────────────────┐
│                    SWML Ω Function                          │
│                                                             │
│  Input (I,W) ──> [θ₁] ──> [θ₂] ──> [θ₃] ──> [θ₄] ──> [θ₅] ──> [θ₆] ──> Result (R,Q)  │
│                   │        │        │        │        │        │                      │
│                   Understanding  Generation  Allocation  Execution  Integration  Learning │
└─────────────────────────────────────────────────────────────┘
```

**This is the fundamental organizing principle for the entire project.**

---

## 📊 Current vs. Proposed Structure

### Current Structure (Problematic)

```
miyabi-private/
├── 📄 36 config files at root (CLAUDE.md, README.md, Cargo.toml, etc.)
├── 📁 30 directories at root (crates, docs, tools, etc.)
│
├── crates/ (48 crates, flat structure)
│   ├── miyabi-agent-business
│   ├── miyabi-agent-codegen
│   ├── miyabi-agent-coordinator
│   ├── miyabi-agent-core
│   ├── ... (44 more, no clear grouping)
│
├── docs/ (20+ files)
├── miyabi_def/ (SWML paper - isolated!)
├── .claude/ (13 context files)
├── tools/
├── scripts/
├── deployment/
└── ... (20+ more top-level dirs)

TOTAL ROOT ITEMS: 66+
```

**Problems**:
1. ❌ No reflection of SWML Ω function structure
2. ❌ SWML paper isolated in `miyabi_def/`
3. ❌ 66+ items at root - cognitive overload
4. ❌ Flat crate structure - no hierarchy
5. ❌ Missing 4/6 Ω phase implementations (θ₁, θ₂, θ₃, θ₆)
6. ❌ Documentation scattered across 5 locations

---

### Proposed Structure (Aligned with SWML)

```
miyabi-private/
│
├── 📐 theory/                          # SWML Mathematical Foundation
│   ├── swml-paper/                     # ← miyabi_def/ moved here
│   │   ├── SWML_PAPER.tex
│   │   ├── SWML_PAPER.pdf
│   │   └── benchmarks/
│   └── definitions/                    # Formal YAML definitions
│
├── 🦀 implementation/                  # SWML Implementation in Rust
│   │
│   ├── omega/                          # ★ Ω Function (θ₁-θ₆)
│   │   │
│   │   ├── theta1-understanding/       # θ₁: Intent → Abstract
│   │   │   ├── miyabi-agent-core
│   │   │   ├── miyabi-llm
│   │   │   └── miyabi-step-back        # ★ NEW: 26-step A-Z processor
│   │   │
│   │   ├── theta2-generation/          # θ₂: Abstract → Code
│   │   │   ├── miyabi-agent-codegen
│   │   │   └── miyabi-self-discover    # ★ NEW: SELF-DISCOVER integration
│   │   │
│   │   ├── theta3-allocation/          # θ₃: Code → DAG Tasks
│   │   │   ├── miyabi-orchestrator
│   │   │   └── miyabi-dag              # ★ NEW: Dedicated DAG builder
│   │   │
│   │   ├── theta4-execution/           # θ₄: Tasks → Results
│   │   │   ├── miyabi-worktree
│   │   │   ├── miyabi-pty-manager
│   │   │   └── miyabi-session-manager
│   │   │
│   │   ├── theta5-integration/         # θ₅: Results → PR
│   │   │   ├── miyabi-github
│   │   │   └── miyabi-agent-pr         # ★ NEW: Dedicated PR agent
│   │   │
│   │   ├── theta6-learning/            # θ₆: PR → World Update
│   │   │   ├── miyabi-knowledge
│   │   │   ├── miyabi-persistence
│   │   │   └── miyabi-feedback-loop    # ★ NEW: Explicit feedback
│   │   │
│   │   └── miyabi-agent-swml           # Main SWML orchestrator
│   │
│   ├── core/                           # Core Infrastructure
│   │   ├── miyabi-core
│   │   ├── miyabi-types
│   │   └── miyabi-convergence          # ★ NEW: Convergence tracking
│   │
│   ├── agents/                         # All Agents (21 total)
│   │   ├── coding/                     # 7 Coding Agents
│   │   └── business/                   # 14 Business Agents
│   │
│   ├── infrastructure/                 # Integrations
│   │   ├── github/, mcp/, messaging/, ai/
│   │
│   ├── interfaces/                     # User Interfaces
│   │   ├── cli/, desktop/, web/, tui/
│   │
│   └── quality/                        # Quality Assurance
│       ├── miyabi-metrics              # ★ NEW: Quality metrics (paper definition)
│       ├── miyabi-benchmark
│       └── miyabi-e2e-tests
│
├── 📚 documentation/                   # All Docs Consolidated
│   ├── architecture/                   # ← docs/ moved here
│   │   ├── ENTITY_RELATION_MODEL.md
│   │   ├── OMEGA_FUNCTION_MAPPING.md   # ★ NEW: Code-to-theory mapping
│   │   └── CONVERGENCE_VALIDATION.md   # ★ NEW: Empirical validation
│   ├── guides/                         # ← root MD files moved here
│   ├── api/
│   └── claude/                         # ← .claude/ moved here
│
├── 🚀 deployment/                      # Deployment & Ops
├── 💼 business/                        # Business & Legal
├── 🔧 tools/                           # Dev Tools
├── 📊 data/                            # Data & Logs
├── 🧪 research/                        # Research & Experiments
│
├── 📦 config/                          # ★ All Config Consolidated
│   ├── Cargo.toml
│   ├── rust-toolchain.toml
│   └── ... (30+ files moved here)
│
├── README.md
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md                           # Updated control doc

TOTAL ROOT ITEMS: 15 (was 66+, 77% reduction!)
```

---

## 🎯 Key Improvements

### 1. Theory-Implementation Alignment ✅

| Component | Before | After |
|-----------|--------|-------|
| SWML Paper | Isolated in `miyabi_def/` | Integrated in `/theory/swml-paper/` |
| Ω Phases | No explicit directories | 6 dedicated θ₁-θ₆ directories |
| Code-to-theory map | None | `/documentation/architecture/OMEGA_FUNCTION_MAPPING.md` |
| Missing implementations | 4/6 phases incomplete | 7 new crates to complete all phases |

### 2. Complexity Reduction ✅

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Root items | 66 | 15 | **77% reduction** |
| Top-level dirs | 30 | 10 | **66% reduction** |
| Config files at root | 36 | 5 | **86% reduction** |
| Crate organization | Flat (1 level) | Hierarchical (3-4 levels) | **Clear hierarchy** |

### 3. Discoverability ✅

**Before**:
- "Where is PR creation code?" → Search across 5+ crates
- "How is convergence tracked?" → No code exists
- "What is θ₃ phase doing?" → No clear mapping

**After**:
- "PR creation" → `/implementation/omega/theta5-integration/miyabi-agent-pr/`
- "Convergence tracking" → `/implementation/core/miyabi-convergence/`
- "θ₃ phase" → `/implementation/omega/theta3-allocation/` (Allocation: Code→DAG)

---

## 🆕 New Crates (7 Total)

| Crate | Location | Purpose | Status |
|-------|----------|---------|--------|
| `miyabi-step-back` | `theta1-understanding/` | 26-step A-Z processor | ❌ Missing |
| `miyabi-self-discover` | `theta2-generation/` | SELF-DISCOVER integration | ❌ Missing |
| `miyabi-dag` | `theta3-allocation/` | DAG task graph builder | ❌ Missing |
| `miyabi-agent-pr` | `theta5-integration/` | Dedicated PR agent | ❌ Missing |
| `miyabi-feedback-loop` | `theta6-learning/` | Explicit feedback loop | ❌ Missing |
| `miyabi-convergence` | `core/` | Convergence tracking (Theorem 7.2/7.3) | ❌ Missing |
| `miyabi-metrics` | `quality/` | Quality metrics (paper definition) | ❌ Missing |

**Current SWML Implementation Coverage**: 2/10 (20%) → **After: 10/10 (100%)**

---

## 🗺️ Ω Function Code Mapping

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SWML Ω Function                                 │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │   θ₁    │  Understanding: Intent (I) + World (W) → Abstract
    │  26-step│
    └─────────┘  Code: /implementation/omega/theta1-understanding/
         │        - miyabi-agent-core
         │        - miyabi-llm
         │        - miyabi-step-back (NEW)
         ▼
    ┌─────────┐
    │   θ₂    │  Generation: Abstract → Code
    │ DISCOVER│
    └─────────┘  Code: /implementation/omega/theta2-generation/
         │        - miyabi-agent-codegen
         │        - miyabi-self-discover (NEW)
         ▼
    ┌─────────┐
    │   θ₃    │  Allocation: Code → DAG Tasks
    │   DAG   │
    └─────────┘  Code: /implementation/omega/theta3-allocation/
         │        - miyabi-orchestrator
         │        - miyabi-dag (NEW)
         ▼
    ┌─────────┐
    │   θ₄    │  Execution: Tasks → Results
    │ Worktree│
    └─────────┘  Code: /implementation/omega/theta4-execution/
         │        - miyabi-worktree
         │        - miyabi-pty-manager
         │        - miyabi-session-manager
         ▼
    ┌─────────┐
    │   θ₅    │  Integration: Results → Pull Request
    │   PR    │
    └─────────┘  Code: /implementation/omega/theta5-integration/
         │        - miyabi-github
         │        - miyabi-agent-pr (NEW)
         ▼
    ┌─────────┐
    │   θ₆    │  Learning: PR → World Update (W')
    │ Feedback│
    └─────────┘  Code: /implementation/omega/theta6-learning/
         │        - miyabi-knowledge
         │        - miyabi-persistence
         │        - miyabi-feedback-loop (NEW)
         ▼
    ┌─────────┐
    │ Quality │  Q(R) ≥ 0.80?  If yes: Done. If no: Iterate (n+1)
    │  Check  │
    └─────────┘  Code: /implementation/core/miyabi-convergence/ (NEW)
         │               /implementation/quality/miyabi-metrics/ (NEW)
         │
    [Convergence: (1-α)^n with α=0.20]
```

---

## 📅 Migration Timeline

### Week 1: Preparation
- ✅ Restructuring plan created
- ⬜ Review & approval
- ⬜ Migration scripts
- ⬜ Backup (git tag `pre-restructuring`)

### Week 2: Theory & Docs
- ⬜ Move `miyabi_def/` → `theory/swml-paper/`
- ⬜ Move `docs/` → `documentation/`
- ⬜ Consolidate root MD files

### Week 3-4: Core Implementation
- ⬜ Create `/implementation/omega/theta{1-6}-*/` structure
- ⬜ Move existing crates to appropriate phases
- ⬜ Create 7 new crates

### Week 5: Agents & Infrastructure
- ⬜ Organize `/implementation/agents/` (coding + business)
- ⬜ Organize `/implementation/infrastructure/`

### Week 6: Interfaces & Quality
- ⬜ Organize `/implementation/interfaces/`
- ⬜ Organize `/implementation/quality/`

### Week 7: Other Directories
- ⬜ Move deployment, business, tools, data, config

### Week 8: Validation
- ⬜ Update imports, Cargo.toml, CI/CD
- ⬜ Full test suite
- ⬜ Documentation update
- ⬜ Migration guide

---

## ✅ Success Criteria

**Structural**:
- ✅ Root items: 66 → 15 (77% reduction)
- ✅ Every Ω phase (θ₁-θ₆) has dedicated directory
- ✅ All 7 new crates created
- ✅ Configuration consolidated to `/config/`

**Functional**:
- ✅ All builds pass (`cargo build --workspace`)
- ✅ All tests pass (`cargo test --workspace`)
- ✅ CI/CD pipelines working

**Theoretical**:
- ✅ 100% code-to-theory mapping documented
- ✅ SWML implementation coverage: 20% → 100%
- ✅ Convergence validation reproducible

**Developer Experience**:
- ✅ New contributors navigate in < 5 min
- ✅ Find feature in < 30 sec
- ✅ Clear location for new components

---

## 🎓 Learn More

- **Full Plan**: [RESTRUCTURING_PLAN.md](RESTRUCTURING_PLAN.md)
- **SWML Paper**: `/theory/swml-paper/SWML_PAPER.pdf` (after migration)
- **Current**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/SWML_PAPER.pdf`
- **Implementation Plan**: `/implementation/omega/miyabi-agent-swml/IMPLEMENTATION_PLAN.md`

---

**Status**: 🟡 Awaiting Approval
**Version**: 1.0.0
**Date**: 2025-11-01
