# Miyabi Agents Refactoring - Migration Analysis

**Date**: 2025-10-22
**Issue**: #416
**Phase**: 1 - Migration Mapping

## Current State

### miyabi-agents (18,478 lines total)

**Large Agent Files** (>20,000 lines):
1. `codegen.rs` - 58,925 lines → `miyabi-agent-codegen`
2. `coordinator.rs` - 38,202 lines → `miyabi-agent-coordinator`
3. `review.rs` - 27,672 lines → `miyabi-agent-review`
4. `deployment.rs` - 25,398 lines → **NEW**: `miyabi-agent-deployment`
5. `hooks.rs` - 23,590 lines → Keep in `miyabi-agents` (infrastructure)
6. `refresher.rs` - 22,631 lines → **NEW**: `miyabi-agent-refresher`
7. `coordinator_with_llm.rs` - 21,334 lines → `miyabi-agent-coordinator`
8. `issue.rs` - 20,217 lines → **NEW**: `miyabi-agent-issue`

**Medium Agent Files** (10,000-20,000 lines):
9. `pr.rs` - 16,360 lines → **NEW**: `miyabi-agent-pr`
10. `parallel.rs` - 13,885 lines → `miyabi-agent-workflow`
11. `discord_community.rs` - 12,662 lines → `miyabi-agent-integrations`
12. `orchestration.rs` - 12,165 lines → `miyabi-agent-workflow`

**Small Files** (<10,000 lines):
13. `potpie_integration.rs` - 6,546 lines → `miyabi-agent-integrations`
14. `lib.rs` - 3,338 lines → Facade pattern (keep)
15. `base.rs` - 2,635 lines → `miyabi-agent-core`

### Existing Agent Crates

**Already Implemented**:
- ✅ `miyabi-agent-coordinator` - 4 files
- ✅ `miyabi-agent-codegen` - 2 files
- ✅ `miyabi-agent-review` - 2 files
- ✅ `miyabi-agent-workflow` - exists
- ✅ `miyabi-agent-business` - exists
- ✅ `miyabi-agent-integrations` - exists
- ✅ `miyabi-agent-core` - exists

**Need to Create**:
- ❌ `miyabi-agent-deployment`
- ❌ `miyabi-agent-issue`
- ❌ `miyabi-agent-pr`
- ❌ `miyabi-agent-refresher`

## Migration Plan

### Phase 1.1: Existing Crates (Week 1)

**Priority 1**: Move to existing crates
1. `codegen.rs` → `miyabi-agent-codegen/src/codegen.rs`
2. `coordinator.rs` + `coordinator_with_llm.rs` → `miyabi-agent-coordinator/`
3. `review.rs` → `miyabi-agent-review/src/review.rs`
4. `parallel.rs` + `orchestration.rs` → `miyabi-agent-workflow/`
5. `discord_community.rs` + `potpie_integration.rs` → `miyabi-agent-integrations/`
6. `base.rs` → `miyabi-agent-core/src/base.rs`

### Phase 1.2: New Crates (Week 2)

**Priority 2**: Create new crates
1. Create `miyabi-agent-deployment` crate
   - Move `deployment.rs`
2. Create `miyabi-agent-issue` crate
   - Move `issue.rs`
3. Create `miyabi-agent-pr` crate
   - Move `pr.rs`
4. Create `miyabi-agent-refresher` crate
   - Move `refresher.rs`

### Phase 1.3: Cleanup (Week 3)

**Priority 3**: Final cleanup
1. Update `miyabi-agents/src/lib.rs` to re-export from specialized crates
2. Move tests to respective crates
3. Update Cargo.toml dependencies
4. Delete migrated files from `miyabi-agents`

## Test Migration Strategy

### Current Tests
- `miyabi-agents/tests/`: 110 tests
- Need to migrate to respective crates

### Test Distribution
- `agent_integration.rs` → multiple crates
- `agent_orchestration_e2e.rs` → `miyabi-agent-workflow`

## Type Migration

### Move to miyabi-types
- AgentConfig
- AgentResult
- AgentMetrics
- Error types (if not already there)

## Success Metrics

- [x] All 197+ library tests pass ✅
- [x] Build time **3 minutes** (62.5% faster than 8 minute goal) ✅
- [x] Zero circular dependencies ✅
- [ ] Zero compiler warnings (13 warnings in miyabi-knowledge, 2 in miyabi-a2a)
- [x] `miyabi-agents` now serves as facade pattern (safe to keep for backward compatibility) ✅

## Phase 1.3 Completion Status

**Date**: 2025-10-22
**Status**: ✅ **COMPLETE**

### Achievements

1. **Migration Already Complete**: All agent files already migrated to specialized crates
2. **No Duplicate Files**: miyabi-agents/src/ only contains hooks.rs, lib.rs, and business/ directory
3. **Workspace Compilation**: `cargo check --workspace` succeeds with warnings only
4. **Test Fixes**: Fixed 2 test files with incorrect import paths
5. **Build Performance**: Release build completes in **3 minutes** (62.5% faster than goal)

### Test Results

- **Library Tests**: 197 passed
- **miyabi-knowledge**: 35 passed, 3 failed (require Qdrant server - expected)
- **Build Time**: 3m 00s (goal: <8 minutes)

### Commits

- `d1acda6`: test: fix imports after agent crate migration to specialized crates

### Current Crate Structure

```
crates/
├── miyabi-agents/              # Facade pattern (deprecated, re-exports)
│   ├── src/hooks.rs           # Lifecycle hooks (23,590 lines)
│   ├── src/lib.rs             # Re-exports from specialized crates (3,338 lines)
│   └── src/business/          # Business agents (15 files)
│
├── miyabi-agent-core/          # BaseAgent trait, hooks system
├── miyabi-agent-coordinator/   # Task orchestration, DAG
├── miyabi-agent-codegen/       # Code generation
├── miyabi-agent-review/        # Quality scoring
├── miyabi-agent-workflow/      # PR, Issue, Deploy agents
├── miyabi-agent-business/      # 14 business agents
└── miyabi-agent-integrations/  # Discord, Potpie, Refresher
```

## Risk Mitigation

1. **Incremental Migration**: Move one agent at a time
2. **Test After Each Move**: Run full test suite
3. **Keep Git History**: Use `git mv` when possible
4. **Backward Compatibility**: Maintain re-exports during transition
