# Miyabi Desktop Implementation Tasks - GitHub Issues

**Created**: 2025-10-31
**Total Issues**: 16
**Phases**: 6
**Timeline**: 8 weeks

---

## 📋 Issues Overview

### Phase 1: Real-time Log Streaming (Week 1) - 🔴 Critical Priority

**Goal**: Fix the most critical UX issue - real-time log display

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#636](https://github.com/customer-cloud/miyabi-private/issues/636) | [Phase 1.1] リアルタイムログストリーミング - 手動テスト実行 | 🔥 P0-Critical | 🧪 type:test, 🏗️ phase:implementation | 1 day |
| [#637](https://github.com/customer-cloud/miyabi-private/issues/637) | [Phase 1.2] リアルタイムログストリーミング - バグ修正 | 🔥 P0-Critical | 🐛 type:bug, 🏗️ phase:implementation | 2-3 days |
| [#638](https://github.com/customer-cloud/miyabi-private/issues/638) | [Phase 1.3] リアルタイムログストリーミング - E2Eテスト追加 | ⚠️ P1-High | 🧪 type:test, 🏗️ phase:implementation | 2 days |
| [#639](https://github.com/customer-cloud/miyabi-private/issues/639) | [Phase 1.4] リアルタイムログストリーミング - パフォーマンス最適化 | ⚠️ P1-High | ✨ type:feature, 🏗️ phase:implementation | 1 day |

**Total**: 6-7 days

**Success Criteria**:
- ✅ Logs display in real-time (line by line)
- ✅ Auto-scroll works
- ✅ Debug logs visible in Chrome Console
- ✅ Performance: <100ms latency per log line
- ✅ E2E tests passing

---

### Phase 2: Business Agent UI Integration (Week 2-3) - 🟡 High Priority

**Goal**: Display all 21 agents (7 Coding + 14 Business) in the UI

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#640](https://github.com/customer-cloud/miyabi-private/issues/640) | [Phase 2.1] ビジネスエージェントUI統合 - カテゴリフィルターUI実装 | ⚠️ P1-High | ✨ type:feature, 🏗️ phase:implementation | 3 days |
| [#641](https://github.com/customer-cloud/miyabi-private/issues/641) | [Phase 2.2] ビジネスエージェントUI統合 - 14個のビジネスエージェントカード表示 | ⚠️ P1-High | ✨ type:feature, 🏗️ phase:implementation | 2 days |
| [#642](https://github.com/customer-cloud/miyabi-private/issues/642) | [Phase 2.3] ビジネスエージェントUI統合 - カテゴリアイコン統一 | 📊 P2-Medium | ✨ type:feature, 🏗️ phase:implementation | 1 day |
| [#643](https://github.com/customer-cloud/miyabi-private/issues/643) | [Phase 2.4] ビジネスエージェントUI統合 - エージェント検索機能 | 📊 P2-Medium | ✨ type:feature, 🏗️ phase:implementation | 2 days |
| [#644](https://github.com/customer-cloud/miyabi-private/issues/644) | [Phase 2.5] ビジネスエージェントUI統合 - 実行フロー検証 | ⚠️ P1-High | 🧪 type:test, 🏗️ phase:implementation | 3 days |

**Total**: 11 days

**Success Criteria**:
- ✅ All 21 agents visible in UI
- ✅ Category filter (Coding, Strategy, Marketing, Sales)
- ✅ Search by agent name/character
- ✅ All agent types executable via backend

---

### Phase 3: Initial Setup Wizard (Week 4) - 🟡 High Priority

**Goal**: Reduce initial setup complexity with guided wizard

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#645](https://github.com/customer-cloud/miyabi-private/issues/645) | [Phase 3.1] 初期セットアップウィザード - ウェルカム画面実装 | ⚠️ P1-High | ✨ type:feature, 🏗️ phase:implementation | 2 days |
| [#646](https://github.com/customer-cloud/miyabi-private/issues/646) | [Phase 3.2] 初期セットアップウィザード - GitHub Token設定 | ⚠️ P1-High | ✨ type:feature, 🏗️ phase:implementation | 2 days |
| [#647](https://github.com/customer-cloud/miyabi-private/issues/647) | [Phase 3.3] 初期セットアップウィザード - リポジトリ選択 | 📊 P2-Medium | ✨ type:feature, 🏗️ phase:implementation | 1 day |
| [#648](https://github.com/customer-cloud/miyabi-private/issues/648) | [Phase 3.4] 初期セットアップウィザード - 完了画面とストレージ | 📊 P2-Medium | ✨ type:feature, 🏗️ phase:implementation | 1 day |

**Total**: 6 days

**Success Criteria**:
- ✅ Welcome screen on first launch
- ✅ GitHub Token validation
- ✅ Repository selection from user's repos
- ✅ Settings persisted in LocalStorage

---

### Phase 4: Workflow DAG Real-time Updates (Week 5-6) - 🟢 Low Priority

**Goal**: Visualize agent execution flow in real-time DAG

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#649](https://github.com/customer-cloud/miyabi-private/issues/649) | [Phase 4] ワークフローDAGリアルタイム更新 - 実装 | 📝 P3-Low | ✨ type:feature, 🏗️ phase:implementation | 5-6 days |

**Total**: 5-6 days

**Success Criteria**:
- ✅ Zustand state management
- ✅ Real-time node updates
- ✅ Auto-layout with dagre
- ✅ Status visualization (pending/running/completed/failed)

---

### Phase 5: Error Handling Improvements (Week 7) - 🟡 Medium Priority

**Goal**: User-friendly error messages and recovery actions

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#650](https://github.com/customer-cloud/miyabi-private/issues/650) | [Phase 5] エラーハンドリング改善 - 実装 | 📊 P2-Medium | ✨ type:feature, 🏗️ phase:implementation | 2 days |

**Total**: 2 days

**Success Criteria**:
- ✅ 10+ error message definitions
- ✅ Error modal with recovery actions
- ✅ Retry functionality
- ✅ Severity-based styling (error/warning/info)

---

### Phase 6: Parallel Execution Progress Bar (Week 8) - 🟢 Low Priority

**Goal**: Visualize parallel agent execution progress

| Issue # | Title | Priority | Labels | Estimate |
|---------|-------|----------|--------|----------|
| [#651](https://github.com/customer-cloud/miyabi-private/issues/651) | [Phase 6] 並列実行プログレスバー - 実装 | 📝 P3-Low | ✨ type:feature, 🏗️ phase:implementation | 2 days |

**Total**: 2 days

**Success Criteria**:
- ✅ Progress bar showing completed/running/failed tasks
- ✅ Individual task status list
- ✅ Real-time updates
- ✅ Accurate counters

---

## 📊 Summary Statistics

### By Phase
- **Phase 1**: 4 tasks (6-7 days)
- **Phase 2**: 5 tasks (11 days)
- **Phase 3**: 4 tasks (6 days)
- **Phase 4**: 1 task (5-6 days)
- **Phase 5**: 1 task (2 days)
- **Phase 6**: 1 task (2 days)

### By Priority
- 🔥 **P0-Critical**: 2 tasks (Phase 1.1, 1.2)
- ⚠️ **P1-High**: 6 tasks (Phase 1.3, 1.4, 2.1, 2.2, 2.5, 3.1, 3.2)
- 📊 **P2-Medium**: 5 tasks (Phase 2.3, 2.4, 3.3, 3.4, 5)
- 📝 **P3-Low**: 3 tasks (Phase 4, 6)

### By Type
- ✨ **Feature**: 12 tasks
- 🧪 **Test**: 3 tasks
- 🐛 **Bug**: 1 task

### Total Timeline
- **Estimated**: 32-35 days
- **Calendar**: 8 weeks (allowing for buffer and iterations)

---

## 🎯 Recommended Execution Order

### Week 1: Phase 1 (CRITICAL)
1. #636 → #637 → #638 → #639
2. **Why first**: Real-time logs are the most critical UX issue
3. **Blocker removal**: Enables testing of all other features

### Week 2-3: Phase 2 (HIGH)
1. #640 → #641 → #642 → #643 → #644
2. **Why second**: Exposes all 21 agents to users
3. **Business value**: Enables business agent usage

### Week 4: Phase 3 (HIGH)
1. #645 → #646 → #647 → #648
2. **Why third**: Improves first-time user experience
3. **Onboarding**: Reduces setup friction

### Week 5-6: Phase 4 (LOW)
1. #649
2. **Why fourth**: Nice-to-have visualization
3. **Optional**: Can be deferred if timeline tight

### Week 7: Phase 5 (MEDIUM)
1. #650
2. **Why fifth**: Improves error UX
3. **Polish**: Better user experience

### Week 8: Phase 6 (LOW)
1. #651
2. **Why last**: Parallel execution is advanced feature
3. **Optional**: Can be deferred if timeline tight

---

## 🔗 Related Documents

- **Implementation Plan**: `docs/IMPLEMENTATION_PLAN.md`
- **UX Story**: `docs/UX_STORY_AND_USER_JOURNEY.md`
- **Test Guide**: `docs/TEST_RESULTS_PHASE1.md`

---

## 📝 Notes

- All Issues use emoji-prefixed labels (e.g., `🧪 type:test`, `🔥 priority:P0-Critical`)
- Each Issue contains detailed implementation code examples
- Success criteria defined for each task
- Estimated times are approximate and may vary

---

**Created with**: 🤖 Claude Code
**Repository**: customer-cloud/miyabi-private
**Project**: Miyabi Desktop App

---

**Version**: 1.0.0
**Last Updated**: 2025-10-31
