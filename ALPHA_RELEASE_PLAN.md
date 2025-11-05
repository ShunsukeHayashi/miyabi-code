# 🚀 Miyabi Alpha Release Plan (v0.2.0)

**Target Date**: 2025-11-12 (Next Tuesday)
**Release Type**: Alpha - Minimum Viable Product

---

## 🎯 Release Objective

**Core Feature**: `miyabi work-on <issue-number>` が動作すること

ユーザーがIssue番号を指定すると：
1. CoordinatorAgentがIssueを読む
2. 適切なAgentを起動してコードを生成
3. PRを自動作成

---

## ✅ Release Requirements (Minimum)

### 必須要件
- [ ] `miyabi work-on <issue>` コマンドが動作する
- [ ] CoordinatorAgentがIssue→PR作成まで完了できる
- [ ] クリティカルなバグがない
- [ ] README + Quick Start ガイドが更新されている

### 非必須（v0.3.0以降）
- ❌ 並列実行（miyabi parallel）
- ❌ Desktop UI
- ❌ Workflow DSL完全版
- ❌ 全テストパス（1-2件の非クリティカルなテスト失敗は許容）

---

## 📅 7-Day Execution Plan

### **Day 1-2: 11/4-11/5 (Mon-Tue)** - Coordinator統合開始

**Priority**: 🔴 Critical

#### Task 1.1: Issue #719 実装開始
- [ ] WorkflowBuilderとCoordinatorAgentの統合実装
- [ ] 基本的なIssue→Agent実行フロー確認
- [ ] 担当: つくるん (tmux %1) + 手動サポート

**Estimated**: 2 days

---

### **Day 3: 11/6 (Wed)** - テスト修正

**Priority**: 🟡 Medium

#### Task 3.1: テスト失敗修正
- [ ] `convergence::tests::test_predict_iterations` 修正
- [ ] その他Critical失敗があれば修正

#### Task 3.2: 動作確認テスト
- [ ] `miyabi work-on 1` で実際にPRが作成されるか確認
- [ ] エラーログ確認、バグ修正

**Estimated**: 1 day

---

### **Day 4-5: 11/7-11/8 (Thu-Fri)** - ドキュメント整備

**Priority**: 🟡 Medium

#### Task 4.1: README更新
```markdown
# Miyabi v0.2.0 Alpha

## Quick Start (3 steps)

1. Install
   ```bash
   cargo install miyabi-cli
   ```

2. Setup
   ```bash
   miyabi setup
   ```

3. Run
   ```bash
   miyabi work-on <issue-number>
   ```

## What Works
- ✅ Single issue processing
- ✅ Auto PR creation
- ⏳ Parallel execution (Coming in v0.3.0)
- ⏳ Desktop UI (Coming in v0.3.0)
```

#### Task 4.2: Quick Start ガイド
- [ ] `docs/QUICK_START_ALPHA.md` 作成
- [ ] 3-5分で試せる手順書
- [ ] トラブルシューティングFAQ

**Estimated**: 2 days

---

### **Day 6-7: 11/9-11/12 (Sat-Tue)** - 最終調整

**Priority**: 🔴 Critical

#### Task 6.1: End-to-End テスト
- [ ] 実際のGitHub Issueで動作確認
- [ ] PR作成まで完了することを確認
- [ ] エッジケース対応（Issue形式が異なる場合など）

#### Task 6.2: バグ修正
- [ ] E2Eテストで見つかったバグを修正
- [ ] クリティカルなエラーのみ対応

#### Task 6.3: Release準備
- [ ] CHANGELOG.md更新
- [ ] バージョン番号更新 (v0.2.0-alpha)
- [ ] Git tag作成
- [ ] crates.io公開

**Estimated**: 3 days

---

## 🚧 Current Blockers

| # | Blocker | Status | Owner | ETA | Progress |
|---|---------|--------|-------|-----|----------|
| 1 | #719 Coordinator統合 | 🟡 In Progress (60%) | つくるん | 11/5 | execute_step() 実装中 |
| 2 | README更新 | 🟢 Draft Complete | Main | 11/7 | README_ALPHA_v0.2.0.md + Quick Start ✅ |
| 3 | テスト失敗 (1件) | 🟢 Low Priority | - | 11/6 | convergence test (非Critical) |
| 4 | 動作確認 | 🔴 Blocked by #719 | - | 11/12 | Waiting for #719 completion |

---

## ✅ Release Checklist

### Code
- [ ] #719 (Coordinator統合) マージ済み
- [ ] Critical テスト失敗なし
- [ ] `miyabi work-on <issue>` が動作確認済み
- [ ] バグ修正完了

### Documentation
- [ ] README.md更新済み
- [ ] QUICK_START_ALPHA.md作成済み
- [ ] CHANGELOG.md更新済み

### Release
- [ ] Version bump (v0.2.0-alpha)
- [ ] Git tag作成 (`git tag v0.2.0-alpha`)
- [ ] crates.io公開 (`cargo publish`)
- [ ] GitHub Release作成

---

## 🎯 Success Criteria

### Minimum (Must Have)
- ✅ `miyabi work-on 123` でPRが作成される
- ✅ コンパイルエラーなし
- ✅ インストール手順がREADMEにある

### Nice to Have (v0.3.0)
- ❌ 全テストパス
- ❌ Desktop UI動作
- ❌ 並列実行動作
- ❌ 詳細ドキュメント

---

## 📊 Daily Progress Tracking

### 11/4 (Mon) - Day 1
- [x] #719 実装開始 ✅
- [x] 現状分析完了 (execute_workflow()既存、execute_step_placeholder()要実装)
- [x] 詳細実装計画作成 (IMPLEMENTATION_PLAN.md)
- [x] README更新計画作成 (README_ALPHA_v0.2.0.md)
- [x] Quick Startガイド作成 (docs/QUICK_START_ALPHA.md)
- [x] Cargo.toml修正 (uuid, miyabi-workflow依存関係追加) ✅
- [ ] execute_step() 実装 (Priority 1) - つくるん redirected
- [ ] 進捗: 70% (Target: 50% - EXCEEDED ✅)

### 11/5 (Tue) - Day 2
- [ ] #719 実装継続
- [ ] 進捗: __%

### 11/6 (Wed) - Day 3
- [ ] テスト修正
- [ ] 動作確認
- [ ] 進捗: __%

### 11/7 (Thu) - Day 4
- [ ] README更新
- [ ] 進捗: __%

### 11/8 (Fri) - Day 5
- [ ] Quick Start作成
- [ ] 進捗: __%

### 11/9 (Sat) - Day 6
- [ ] E2Eテスト
- [ ] 進捗: __%

### 11/10 (Sun) - Day 7
- [ ] バグ修正
- [ ] 進捗: __%

### 11/11 (Mon) - Day 8
- [ ] 最終確認
- [ ] 進捗: __%

### 11/12 (Tue) - Release Day
- [ ] v0.2.0-alpha公開
- [ ] 進捗: 100%

---

## 🚨 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| #719が間に合わない | 🔴 High | 今日から集中実装。手動サポート |
| 新たなバグ発見 | 🟡 Medium | Critical のみ修正。他は Issue化 |
| ドキュメント未完成 | 🟢 Low | 最小限でOK。v0.3.0で拡充 |

---

## 📝 Next Steps (Immediate)

### 今日（11/4）やること

1. **#719実装を加速**
   - [ ] つくるん (tmux %1) に詳細指示
   - [ ] 手動で実装サポート
   - [ ] 今日中に50%完了目標

2. **テスト失敗調査**
   - [ ] `convergence::tests::test_predict_iterations` 原因特定
   - [ ] 修正方針決定

3. **ドキュメント準備**
   - [ ] README草案作成
   - [ ] Quick Start構成案作成

---

**Document Owner**: @shunsuke
**Last Updated**: 2025-11-04
**Status**: 🔴 In Progress

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
