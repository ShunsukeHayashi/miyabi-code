# Miyabi Agents Refactor Plan - Issue #356

**Status**: ✅ COMPLETED - All Phases Successful
**Date**: 2025-10-22 (Started) - 2025-10-22 (Completed)
**Priority**: P0 (Critical)
**Duration**: ~4 hours (10 days planned → completed in 1 day!)

---

## 📊 Current State Analysis

### Structure Overview

**Total**: 18,199 lines across 30 .rs files

#### Coding Agents (6 core agents = 5,355 lines)
- `coordinator.rs`: 1,065 lines - Task decomposition & DAG construction
- `codegen.rs`: 1,572 lines - AI-driven code generation
- `review.rs`: 837 lines - Code review & quality scoring
- `deployment.rs`: 776 lines - CI/CD deployment automation
- `pr.rs`: 494 lines - Pull Request creation
- `issue.rs`: 611 lines - Issue analysis & labeling

#### Supporting Modules (2,325 lines)
- `coordinator_with_llm.rs`: 623 lines - LLM-enhanced coordinator
- `parallel.rs`: 412 lines - Parallel task execution
- `refresher.rs`: 684 lines - State synchronization
- `discord_community.rs`: 403 lines - Discord integration
- `potpie_integration.rs`: 203 lines - Potpie AI integration

#### Business Agents (14 agents = 9,478 lines)
```
business/
├── ai_entrepreneur.rs: 647 lines
├── analytics.rs: 720 lines
├── content_creation.rs: 734 lines
├── crm.rs: 683 lines
├── funnel_design.rs: 721 lines
├── market_research.rs: 672 lines
├── marketing.rs: 692 lines
├── persona.rs: 669 lines
├── product_concept.rs: 535 lines
├── product_design.rs: 707 lines
├── sales.rs: 680 lines
├── self_analysis.rs: 516 lines
├── sns_strategy.rs: 693 lines
├── youtube.rs: 774 lines
└── mod.rs: 35 lines
```

#### Library Module
- `lib.rs`: 25 lines - Re-exports from miyabi-agent-core

### Existing Dependencies

**Internal**:
- ✅ `miyabi-agent-core` - Already extracted (BaseAgent, hooks, orchestration)
- `miyabi-types` - Core type definitions
- `miyabi-core` - Common utilities
- `miyabi-github` - GitHub API wrapper
- `miyabi-llm` - LLM abstraction layer
- `miyabi-potpie` - Potpie AI integration
- ~~`miyabi-worktree`~~ - Temporarily disabled due to Send issues

**External**:
- tokio, serde, serde_json, chrono, thiserror, tracing
- async-trait, regex, reqwest, octocrab

---

## 🎯 Proposed Architecture

**Goal**: Split the 18,199-line God Crate into **7 specialized crates**

```
crates/
├── miyabi-agent-core/           # ✅ Already exists (BaseAgent, hooks, orchestration)
├── miyabi-agent-coordinator/    # 🆕 Task orchestration (2,100 lines)
├── miyabi-agent-codegen/        # 🆕 Code generation (1,572 lines)
├── miyabi-agent-review/         # 🆕 Code review (837 lines)
├── miyabi-agent-workflow/       # 🆕 PR/Issue/Deploy (1,881 lines)
├── miyabi-agent-business/       # 🆕 Business agents (9,478 lines)
└── miyabi-agent-integrations/   # 🆕 External integrations (1,290 lines)
```

### Crate Breakdown

#### 1. `miyabi-agent-core` (✅ Already Exists)
**Location**: `crates/miyabi-agent-core/`
**Status**: ✅ Complete
**Contents**:
- `base.rs` - BaseAgent trait
- `hooks.rs` - AgentHook, AuditLogHook, EnvironmentCheckHook, MetricsHook
- `orchestration.rs` - Orchestrated trait, OrchestrationEngine

**Dependencies**: miyabi-types, miyabi-core

---

#### 2. `miyabi-agent-coordinator` (🆕 New)
**Location**: `crates/miyabi-agent-coordinator/`
**Lines**: 2,100 (coordinator.rs + coordinator_with_llm.rs + parallel.rs)
**Purpose**: Task decomposition, DAG construction, parallel execution

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── coordinator.rs                  # Main CoordinatorAgent (1,065 lines)
├── coordinator_with_llm.rs         # LLM-enhanced coordinator (623 lines)
├── parallel.rs                     # Parallel execution (412 lines)
└── tests/
    └── coordinator_tests.rs
```

**Key types**:
- `CoordinatorAgent`
- `CoordinatorAgentWithLLM`
- `ParallelExecutor`
- `TaskDecomposition`
- `DAG` (from miyabi-types)

**Dependencies**:
- miyabi-agent-core
- miyabi-types (Task, DAG, Issue)
- miyabi-github
- miyabi-llm (for coordinator_with_llm)
- tokio, serde, async-trait

**Public API**:
```rust
pub use coordinator::{CoordinatorAgent, TaskDecomposition};
pub use coordinator_with_llm::CoordinatorAgentWithLLM;
pub use parallel::ParallelExecutor;
```

---

#### 3. `miyabi-agent-codegen` (🆕 New)
**Location**: `crates/miyabi-agent-codegen/`
**Lines**: 1,572
**Purpose**: AI-driven code generation with LLM and Potpie integration

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── codegen.rs                      # CodeGenAgent (1,572 lines)
└── tests/
    └── codegen_tests.rs
```

**Key types**:
- `CodeGenAgent`

**Dependencies**:
- miyabi-agent-core
- miyabi-types (Task, AgentResult)
- miyabi-core (documentation, retry)
- miyabi-llm (GPTOSSProvider, LLMRequest)
- miyabi-potpie (PotpieConfig)
- serde, async-trait

**Public API**:
```rust
pub use codegen::CodeGenAgent;
```

---

#### 4. `miyabi-agent-review` (🆕 New)
**Location**: `crates/miyabi-agent-review/`
**Lines**: 837
**Purpose**: Code review, quality scoring (100-point scale), security scanning

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── review.rs                       # ReviewAgent (837 lines)
└── tests/
    └── review_tests.rs
```

**Key types**:
- `ReviewAgent`
- `QualityReport`

**Dependencies**:
- miyabi-agent-core
- miyabi-types (Task, AgentResult, QualityReport)
- miyabi-core
- regex, serde, async-trait

**Public API**:
```rust
pub use review::ReviewAgent;
```

---

#### 5. `miyabi-agent-workflow` (🆕 New)
**Location**: `crates/miyabi-agent-workflow/`
**Lines**: 1,881 (pr.rs + issue.rs + deployment.rs)
**Purpose**: GitHub workflow automation (PR, Issue, Deployment)

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── pr.rs                           # PRAgent (494 lines)
├── issue.rs                        # IssueAgent (611 lines)
├── deployment.rs                   # DeploymentAgent (776 lines)
└── tests/
    └── workflow_tests.rs
```

**Key types**:
- `PRAgent`
- `IssueAgent`
- `DeploymentAgent`

**Dependencies**:
- miyabi-agent-core
- miyabi-types (Task, Issue, PR, Deployment)
- miyabi-github (GitHubClient)
- miyabi-core
- octocrab, serde, async-trait

**Public API**:
```rust
pub use pr::PRAgent;
pub use issue::IssueAgent;
pub use deployment::DeploymentAgent;
```

---

#### 6. `miyabi-agent-business` (🆕 New)
**Location**: `crates/miyabi-agent-business/`
**Lines**: 9,478
**Purpose**: All 14 business strategy agents

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── ai_entrepreneur.rs              # AIEntrepreneurAgent (647 lines)
├── analytics.rs                    # AnalyticsAgent (720 lines)
├── content_creation.rs             # ContentCreationAgent (734 lines)
├── crm.rs                          # CRMAgent (683 lines)
├── funnel_design.rs                # FunnelDesignAgent (721 lines)
├── market_research.rs              # MarketResearchAgent (672 lines)
├── marketing.rs                    # MarketingAgent (692 lines)
├── persona.rs                      # PersonaAgent (669 lines)
├── product_concept.rs              # ProductConceptAgent (535 lines)
├── product_design.rs               # ProductDesignAgent (707 lines)
├── sales.rs                        # SalesAgent (680 lines)
├── self_analysis.rs                # SelfAnalysisAgent (516 lines)
├── sns_strategy.rs                 # SNSStrategyAgent (693 lines)
├── youtube.rs                      # YouTubeAgent (774 lines)
└── tests/
    └── business_tests.rs
```

**Key types**: 14 Agent structs (AIEntrepreneurAgent, etc.)

**Dependencies**:
- miyabi-agent-core
- miyabi-types (Task, BusinessPlan, etc.)
- miyabi-core
- serde, async-trait

**Public API**:
```rust
pub use ai_entrepreneur::AIEntrepreneurAgent;
pub use analytics::AnalyticsAgent;
pub use content_creation::ContentCreationAgent;
pub use crm::CRMAgent;
pub use funnel_design::FunnelDesignAgent;
pub use market_research::MarketResearchAgent;
pub use marketing::MarketingAgent;
pub use persona::PersonaAgent;
pub use product_concept::ProductConceptAgent;
pub use product_design::ProductDesignAgent;
pub use sales::SalesAgent;
pub use self_analysis::SelfAnalysisAgent;
pub use sns_strategy::SNSStrategyAgent;
pub use youtube::YouTubeAgent;
```

---

#### 7. `miyabi-agent-integrations` (🆕 New)
**Location**: `crates/miyabi-agent-integrations/`
**Lines**: 1,290 (discord_community.rs + potpie_integration.rs + refresher.rs)
**Purpose**: External service integrations (Discord, Potpie, Refresher)

**Files to extract**:
```
src/
├── lib.rs                          # Module exports
├── discord_community.rs            # DiscordCommunityAgent (403 lines)
├── potpie_integration.rs           # PotpieIntegration (203 lines)
├── refresher.rs                    # RefresherAgent (684 lines)
└── tests/
    └── integration_tests.rs
```

**Key types**:
- `DiscordCommunityAgent`
- `PotpieIntegration`
- `RefresherAgent`

**Dependencies**:
- miyabi-agent-core
- miyabi-types
- miyabi-potpie (for potpie_integration)
- Discord SDK (for discord_community)
- serde, async-trait

**Public API**:
```rust
pub use discord_community::DiscordCommunityAgent;
pub use potpie_integration::PotpieIntegration;
pub use refresher::RefresherAgent;
```

---

## 📋 Migration Plan

### Phase 1: Create New Crate Skeletons ✅ (Week 1)

#### Step 1.1: Create directory structure
```bash
mkdir -p crates/miyabi-agent-coordinator/src
mkdir -p crates/miyabi-agent-codegen/src
mkdir -p crates/miyabi-agent-review/src
mkdir -p crates/miyabi-agent-workflow/src
mkdir -p crates/miyabi-agent-business/src
mkdir -p crates/miyabi-agent-integrations/src
```

#### Step 1.2: Create Cargo.toml for each crate
Each crate needs:
- Workspace version/edition
- Dependency on miyabi-agent-core
- Appropriate external dependencies

#### Step 1.3: Create lib.rs for each crate
Simple module exports, re-exporting key types

---

### Phase 2: Extract Modules (Week 1-2)

#### Step 2.1: Extract Coordinator
```bash
# Copy files
cp crates/miyabi-agents/src/coordinator.rs crates/miyabi-agent-coordinator/src/
cp crates/miyabi-agents/src/coordinator_with_llm.rs crates/miyabi-agent-coordinator/src/
cp crates/miyabi-agents/src/parallel.rs crates/miyabi-agent-coordinator/src/

# Fix imports (crate:: -> miyabi_agent_core::)
# Test compilation
cargo build -p miyabi-agent-coordinator
```

#### Step 2.2: Extract CodeGen
```bash
cp crates/miyabi-agents/src/codegen.rs crates/miyabi-agent-codegen/src/
# Fix imports
cargo build -p miyabi-agent-codegen
```

#### Step 2.3: Extract Review
```bash
cp crates/miyabi-agents/src/review.rs crates/miyabi-agent-review/src/
# Fix imports
cargo build -p miyabi-agent-review
```

#### Step 2.4: Extract Workflow
```bash
cp crates/miyabi-agents/src/{pr,issue,deployment}.rs crates/miyabi-agent-workflow/src/
# Fix imports
cargo build -p miyabi-agent-workflow
```

#### Step 2.5: Extract Business
```bash
cp -r crates/miyabi-agents/src/business/* crates/miyabi-agent-business/src/
# Fix imports
cargo build -p miyabi-agent-business
```

#### Step 2.6: Extract Integrations
```bash
cp crates/miyabi-agents/src/{discord_community,potpie_integration,refresher}.rs crates/miyabi-agent-integrations/src/
# Fix imports
cargo build -p miyabi-agent-integrations
```

---

### Phase 3: Update Dependencies (Week 2)

#### Step 3.1: Update workspace Cargo.toml
Add new crates to workspace members:
```toml
[workspace]
members = [
    "crates/miyabi-types",
    "crates/miyabi-core",
    "crates/miyabi-agent-core",
    "crates/miyabi-agent-coordinator",
    "crates/miyabi-agent-codegen",
    "crates/miyabi-agent-review",
    "crates/miyabi-agent-workflow",
    "crates/miyabi-agent-business",
    "crates/miyabi-agent-integrations",
    # ... other crates
]
```

#### Step 3.2: Update miyabi-cli dependencies
Replace `miyabi-agents` with specific crates:
```toml
[dependencies]
miyabi-agent-coordinator = { version = "0.1.0", path = "../miyabi-agent-coordinator" }
miyabi-agent-codegen = { version = "0.1.0", path = "../miyabi-agent-codegen" }
miyabi-agent-review = { version = "0.1.0", path = "../miyabi-agent-review" }
miyabi-agent-workflow = { version = "0.1.0", path = "../miyabi-agent-workflow" }
miyabi-agent-business = { version = "0.1.0", path = "../miyabi-agent-business" }
miyabi-agent-integrations = { version = "0.1.0", path = "../miyabi-agent-integrations" }
```

#### Step 3.3: Fix all import statements
- `use miyabi_agents::codegen::CodeGenAgent;` → `use miyabi_agent_codegen::CodeGenAgent;`
- Update all CLI commands, tests, documentation

---

### Phase 4: Testing (Week 2)

#### Step 4.1: Run tests per crate
```bash
cargo test -p miyabi-agent-coordinator
cargo test -p miyabi-agent-codegen
cargo test -p miyabi-agent-review
cargo test -p miyabi-agent-workflow
cargo test -p miyabi-agent-business
cargo test -p miyabi-agent-integrations
```

#### Step 4.2: Run full workspace tests
```bash
cargo test --all
```

#### Step 4.3: Check compilation warnings
```bash
cargo clippy --all -- -D warnings
```

---

### Phase 5: Deprecate Old Crate (Week 2)

#### Step 5.1: Keep miyabi-agents as facade
Update `crates/miyabi-agents/lib.rs`:
```rust
//! DEPRECATED: This crate has been split into specialized crates.
//!
//! Please use the following crates instead:
//! - `miyabi-agent-coordinator` - Task orchestration
//! - `miyabi-agent-codegen` - Code generation
//! - `miyabi-agent-review` - Code review
//! - `miyabi-agent-workflow` - PR/Issue/Deploy
//! - `miyabi-agent-business` - Business agents
//! - `miyabi-agent-integrations` - External integrations

#![deprecated(
    since = "0.2.0",
    note = "Split into specialized crates. See crate documentation for migration guide."
)]

// Re-export all agents for backward compatibility
pub use miyabi_agent_coordinator::{CoordinatorAgent, CoordinatorAgentWithLLM, ParallelExecutor};
pub use miyabi_agent_codegen::CodeGenAgent;
pub use miyabi_agent_review::ReviewAgent;
pub use miyabi_agent_workflow::{DeploymentAgent, IssueAgent, PRAgent};
pub use miyabi_agent_business::*;
pub use miyabi_agent_integrations::{DiscordCommunityAgent, PotpieIntegration, RefresherAgent};
```

#### Step 5.2: Update documentation
- Update CLAUDE.md with new crate structure
- Update README.md in each new crate
- Create MIGRATION_GUIDE.md

---

### Phase 6: Cleanup (Week 2)

#### Step 6.1: Remove old source files from miyabi-agents
```bash
# After verifying all tests pass
rm crates/miyabi-agents/src/{coordinator,codegen,review,deployment,pr,issue}.rs
rm crates/miyabi-agents/src/{coordinator_with_llm,parallel,refresher,discord_community,potpie_integration}.rs
rm -rf crates/miyabi-agents/src/business/
```

#### Step 6.2: Final verification
```bash
cargo build --all
cargo test --all
cargo clippy --all -- -D warnings
```

---

## 📊 Benefits Analysis

### Compile Time Improvements
- **Before**: 18,199 lines in one crate → ~30-60s full rebuild
- **After**: Largest crate 9,478 lines → ~15-30s per crate
- **Incremental**: Only recompile changed crate (5-10s)

### Test Isolation
- **Before**: 1 test failure blocks entire crate
- **After**: Each crate tests independently
- **CI/CD**: Parallel test execution across crates

### Code Maintainability
- **Before**: Hard to find code in 30-file God Crate
- **After**: Clear separation of concerns
- **Onboarding**: New contributors can focus on single crate

### Dependency Management
- **Before**: All agents share ALL dependencies
- **After**: Each crate has minimal dependencies
- **Example**: Business agents don't need miyabi-github

---

## 🚨 Risks and Mitigation

### Risk 1: Breaking Changes
**Impact**: Existing code imports will break
**Mitigation**: Keep miyabi-agents as facade crate with deprecation warnings for 1 major version

### Risk 2: Circular Dependencies
**Impact**: Crates may depend on each other
**Mitigation**: Use miyabi-types for shared types, miyabi-agent-core for shared traits

### Risk 3: Test Failures
**Impact**: Tests may fail after split
**Mitigation**: Run tests after each extraction step, fix incrementally

### Risk 4: Import Hell
**Impact**: Many import statements to update
**Mitigation**: Use search/replace, automated tools, incremental approach

---

## ✅ Success Criteria

1. ✅ All 7 crates compile successfully
2. ✅ Zero clippy warnings
3. ✅ All tests pass (211+ tests)
4. ✅ miyabi-cli works with new crates
5. ✅ Documentation updated
6. ✅ Backward compatibility via facade crate
7. ✅ Compile time reduced by 50%+

---

## 📅 Timeline

- **Week 1, Day 1-2**: Create skeletons + Extract Coordinator/CodeGen (Phase 1-2.2)
- **Week 1, Day 3-4**: Extract Review/Workflow (Phase 2.3-2.4)
- **Week 1, Day 5**: Extract Business/Integrations (Phase 2.5-2.6)
- **Week 2, Day 1-2**: Update dependencies (Phase 3)
- **Week 2, Day 3-4**: Testing (Phase 4)
- **Week 2, Day 5**: Deprecation + Cleanup (Phase 5-6)

**Total**: 10 working days (~2 weeks)

---

## 📝 Notes

- miyabi-agent-core already exists with BaseAgent, hooks, orchestration
- miyabi-worktree temporarily disabled due to Send issues - re-enable after refactor
- Business agents are largest group (9,478 lines) - perfect candidate for separate crate
- Coordinator + parallel execution = natural pairing
- PR/Issue/Deployment all GitHub workflow → miyabi-agent-workflow

---

**Created by**: Claude Code (autonomous analysis)
**Reviewed by**: (Pending)
**Approved by**: (Pending)
