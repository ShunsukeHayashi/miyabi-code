# Next Phase Planning - Post-SWML Foundation

**Date**: 2025-11-01
**Version**: 2.0.0
**Status**: Active Planning

---

## 📊 Current State Analysis

### ✅ Completed (Session Just Finished)

1. **SWML Framework Foundation**
   - ✅ 29-page academic paper (SWML_PAPER.pdf)
   - ✅ miyabi-agent-swml crate skeleton
   - ✅ 8-week implementation plan
   - ✅ SWML context modules for Claude Code

2. **Project Restructuring Plans**
   - ✅ RESTRUCTURING_PLAN.md (24KB)
   - ✅ RESTRUCTURING_SUMMARY.md (14KB)
   - ✅ CONTEXT_REORGANIZATION_PLAN.md (18KB)

3. **Documentation**
   - ✅ swml-framework.md context module
   - ✅ Issue #662 closed (PR cleanup rules)
   - ✅ Comprehensive commit (a72b9ae)

### 🚧 Current Blockers

#### **Blocker #1: Workspace Dependencies** 🔥 CRITICAL
```
error: `dependency.uuid` was not found in `workspace.dependencies`
```

**Impact**:
- Cannot build miyabi-agent-swml crate
- Blocks SWML Phase 1 implementation
- Affects multiple crates in workspace

**Root Cause**: Missing `uuid` in workspace dependencies (Cargo.toml)

**Fix Required**: Add to root Cargo.toml:
```toml
[workspace.dependencies]
uuid = { version = "1.6", features = ["v4", "serde"] }
```

**Priority**: P0 - Must fix before any SWML implementation

#### **Blocker #2: Real-time Log Streaming Bugs** 🔥 CRITICAL
- **#637** (P0): Phase 1.2 - バグ修正
- **#636** (P0): Phase 1.1 - 手動テスト実行

**Impact**:
- Broken log streaming in production
- Affects developer experience
- Blocks related features (#638, #639)

**Priority**: P0 - User-facing critical functionality

### 📋 Open Issues Summary

| Priority | Count | Issues |
|----------|-------|--------|
| **P0 (Critical)** | 2 | #637, #636 |
| **P1 (High)** | 2 | #639, #638 |
| **P2 (Medium)** | 3 | #650, #643, #642 |
| **P3 (Low)** | 2 | #651, #649 |
| **Untagged** | 1 | #653 |
| **Total** | 10 | |

---

## 🎯 Strategic Options (3 Paths)

### **Path A: Fix Blockers First** ⭐ RECOMMENDED

**Focus**: Clear critical blockers before new work

**Phases**:
1. **Fix workspace dependencies** (30 min)
   - Add uuid to workspace.dependencies
   - Verify all crates compile
   - Test miyabi-agent-swml builds

2. **Fix log streaming bugs** (3-4 hours)
   - Issue #637: Bug fixes
   - Issue #636: Manual testing
   - Verify E2E functionality

3. **Then choose**: SWML implementation OR Context reorganization

**Timeline**: 1 day
**Risk**: Low
**Benefits**:
- Unblocks all future work
- Fixes critical user-facing issues
- Clean slate for SWML work

### **Path B: SWML Implementation** 📐

**Focus**: Begin 8-week SWML implementation immediately

**Week 1 Tasks**:
1. **Phase 1: Space Definitions**
   - Implement `Intent`, `World`, `Result` types
   - Add validation logic
   - Serialization/deserialization

**Blocker**: Cannot start until workspace dependencies fixed

**Timeline**: 1 week (after blocker fix)
**Risk**: Medium (depends on blocker fix)
**Benefits**:
- Progress on core theoretical framework
- Enables θ₁-θ₆ phase implementation

### **Path C: Context Reorganization** 🤖

**Focus**: Execute 7-day context cleanup plan

**Day 1-2 Tasks**:
1. Create new directory structure
2. Move files to new locations
3. Update internal links
4. Archive obsolete content

**Blocker**: None (independent of code)

**Timeline**: 7 days
**Risk**: Low
**Benefits**:
- Cleaner documentation structure
- Better developer onboarding
- Reduced duplication

---

## 📅 Recommended Execution Plan

### **Phase 0: Critical Blockers** (Day 1 - Morning) 🔥

**Tasks**:
1. Fix workspace uuid dependency (30 min)
2. Verify all crates compile (15 min)
3. Test miyabi-agent-swml builds (15 min)

**Total**: 1 hour
**Owner**: Immediate
**Exit Criteria**: `cargo build --workspace` succeeds

### **Phase 1: Log Streaming Fixes** (Day 1 - Afternoon) 🔥

**Tasks**:
1. Analyze #637 bug (30 min)
2. Implement fix for #637 (2 hours)
3. Execute #636 manual tests (1 hour)
4. Verify fixes work (30 min)

**Total**: 4 hours
**Owner**: Immediate
**Exit Criteria**: Issues #636, #637 closed

### **Phase 2: Choose Direction** (Day 2+)

#### **Option 2A: SWML Implementation** (Week 1 of 8)

**Week 1 Tasks** (from IMPLEMENTATION_PLAN.md):
- [ ] Define Intent struct with all fields
- [ ] Define World struct with state management
- [ ] Define Result struct with quality metrics
- [ ] Implement serialization/deserialization
- [ ] Add validation logic
- [ ] Create basic tests

**Deliverable**: `/implementation/core/miyabi-types/` with SWML types

**Timeline**: 5 days (full-time) or 2 weeks (part-time)

#### **Option 2B: Context Reorganization** (Days 1-2 of 7)

**Tasks**:
- [ ] Create new `.claude/` structure (guides/, workflows/, archive/)
- [ ] Move 20 root MD files → 3 core + organized subdirs
- [ ] Create new SWML context modules
- [ ] Update internal links
- [ ] Test Claude Code integration

**Deliverable**: Reorganized `.claude/` with 85% fewer root files

**Timeline**: 2 days (can parallelize with SWML)

---

## 🎯 My Recommendation: Hybrid Approach

### **Week 1 Schedule**

**Monday (Day 1)**:
- Morning: Fix workspace dependencies (1 hour) ✅ CRITICAL
- Afternoon: Fix log streaming bugs #636, #637 (4 hours) ✅ CRITICAL

**Tuesday-Wednesday (Days 2-3)**:
- Context reorganization (Day 1-2 of 7-day plan)
- 85% of restructuring complete
- Parallel work possible

**Thursday-Friday (Days 4-5)**:
- SWML Phase 1 kickoff (Space Definitions)
- Begin implementing Intent, World, Result types
- 40% of Week 1 SWML work complete

**Weekend (Optional)**:
- Continue SWML implementation
- Or: Rest and resume Monday

### **Week 2 Schedule**

**Monday-Tuesday**:
- Complete SWML Phase 1 (Space Definitions)
- All types implemented and tested

**Wednesday-Friday**:
- Begin SWML Phase 2 (Ω Function - θ₁-θ₆)
- Or: Address P1 issues (#638, #639)

---

## 📊 Decision Matrix

| Factor | Fix Blockers | SWML Impl | Context Reorg | Hybrid |
|--------|--------------|-----------|---------------|--------|
| **Urgency** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Impact** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Risk** | ⭐ (Low) | ⭐⭐⭐ (Medium) | ⭐ (Low) | ⭐⭐ (Low-Med) |
| **Dependencies** | None | Blockers | None | Sequential |
| **Timeline** | 1 day | 1 week | 7 days | 1 week |
| **Parallelizable** | ❌ No | ❌ No | ✅ Yes | ⚠️ Partial |

**Winner**: **Hybrid Approach** - Fix blockers → Context + SWML parallel

---

## 🚀 Immediate Next Steps

### **Step 1: Fix Workspace Dependencies** (NOW)

```bash
# Edit root Cargo.toml
# Add under [workspace.dependencies]:
uuid = { version = "1.6", features = ["v4", "serde"] }

# Verify
cargo check --workspace
```

### **Step 2: Create Execution Tracking**

```bash
# Create worktree for blockers
git worktree add .worktrees/fix-blockers main

# Create tracking issue
gh issue create --title "[Meta] Fix Critical Blockers - uuid + Log Streaming" \
  --label "priority:P0-Critical,type:bug" \
  --body "Tracking issue for critical blockers before SWML implementation"
```

### **Step 3: Execute Blocker Fixes**

Follow Phase 0 + Phase 1 plan above

### **Step 4: Proceed to Phase 2**

Choose hybrid approach or single-track based on urgency

---

## 📋 Success Criteria

### **Phase 0 (Workspace Fix)**
- ✅ `cargo build --workspace` succeeds
- ✅ miyabi-agent-swml compiles
- ✅ All existing tests pass

### **Phase 1 (Log Streaming)**
- ✅ Issues #636, #637 closed
- ✅ Real-time log streaming works
- ✅ Manual tests pass

### **Phase 2A (SWML Week 1)**
- ✅ Intent, World, Result types implemented
- ✅ Serialization works
- ✅ Basic validation tests pass

### **Phase 2B (Context Reorg Days 1-2)**
- ✅ New `.claude/` structure created
- ✅ 20 root files → 3 core files
- ✅ All internal links updated

---

## 🔄 Iteration Plan

### **After Week 1**

**Review Progress**:
1. What percentage of SWML Week 1 completed?
2. What percentage of Context reorg completed?
3. Any new blockers emerged?

**Adjust Plan**:
- If ahead: Accelerate SWML Phase 2
- If behind: Focus on single track
- If blocked: Pivot to P1 issues

### **Bi-Weekly Checkpoints**

**Week 2**: SWML Phase 1 complete? → Begin Phase 2
**Week 4**: SWML Phase 2 complete? → Begin Phase 3
**Week 6**: SWML Phase 3 complete? → Begin Phase 4
**Week 8**: SWML complete? → Production testing

---

## 📝 Open Questions

1. **Should we fix all P0 issues before SWML?**
   - Recommendation: Yes (only 2 issues, 4 hours)

2. **Can context reorg happen in parallel with SWML?**
   - Recommendation: Yes (independent work streams)

3. **Should we create tracking meta-issue?**
   - Recommendation: Yes (better visibility)

4. **Who reviews restructuring plans?**
   - Recommendation: Self-review + team review if available

5. **When to submit SWML paper?**
   - Target: After SWML implementation complete (Week 8+)
   - Conferences: ICML 2026 (Feb deadline), NeurIPS 2026 (May deadline)

---

## 🎯 Final Recommendation

**Execute Hybrid Approach**:

1. **Today**: Fix workspace uuid (30 min) + Log bugs (4 hours) = **5 hours**
2. **Tomorrow-Next Day**: Context reorganization (2 days)
3. **Rest of Week**: SWML Phase 1 (3 days)

**By End of Week**:
- ✅ All P0 blockers fixed
- ✅ Context 85% reorganized
- ✅ SWML Phase 1 40-60% complete

**Next Week**:
- Complete SWML Phase 1
- Begin SWML Phase 2 or address P1 issues

---

**Status**: ✅ Ready for Execution
**Owner**: Development Team
**Last Updated**: 2025-11-01
**Next Review**: After Phase 0 complete
