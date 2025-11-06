# Miyabi 実行計画 (Execution Plan)

**作成日**: 2025-11-06
**計画期間**: 2025-11-06 ～ 2026-02-28 (16週間)
**優先方針**: P0/P1 High優先、並列実行可能なタスクを最大化

---

## 🎯 Executive Summary

### 今週の最優先タスク (Week 1: 2025-11-06 ～ 2025-11-12)

| Priority | Issue | Title | Agent | Estimated |
|----------|-------|-------|-------|-----------|
| 🔥 P0 | - | 環境整備・基盤確認 | Manual | 1日 |
| ⚠️ P1 | #612 | KAMUI 4D Epic - Phase 1開始 | Coordinator | 3日 |
| ⚠️ P1 | #615 | Worktree状態管理強化 | CodeGen | 2日 |
| ⚠️ P1 | #635 | Desktop App初期化 | CodeGen | 2日 |

**週目標**: 基盤確認 + 2大Epic着手 (KAMUI + Desktop)

---

## 📅 16週間ロードマップ

### Week 1-2: Foundation & Quick Wins (2025-11-06 ～ 2025-11-19)

**テーマ**: 基盤整備と最優先機能の着手

#### Week 1 (11/06-11/12)

**Phase 0: 環境確認・準備 (Day 1)**
```bash
# 必須チェック項目
☐ Rust toolchain最新化 (cargo --version)
☐ GitHub CLI認証確認 (gh auth status)
☐ Docker/Docker Compose動作確認
☐ PlantUML動作確認
☐ VOICEVOX Engine起動確認
☐ 全crateビルド確認 (cargo build --all)
☐ テストスイート実行 (cargo test --all)
```

**Phase 1: KAMUI Epic #612 着手 (Day 1-3)**
- **Issue**: #612 Epic: KAMUI 4D設計パターン統合
- **Agent**: CoordinatorAgent
- **タスク**:
  - [ ] KAMUI 4D vs Miyabi比較分析レビュー
  - [ ] Sub-Issue #615-621のタスク詳細確認
  - [ ] Worktree状態管理設計書作成
  - [ ] データモデル設計 (メタデータ永続化)

**Phase 2: Worktree Management #615 (Day 2-4)**
- **Issue**: #615 feat: Worktree状態管理の強化
- **Agent**: CodeGenAgent
- **タスク**:
  - [ ] `miyabi-worktree` crateリファクタリング
  - [ ] Worktreeメタデータ構造体定義
  - [ ] リアルタイム追跡機能実装
  - [ ] クリーンアップ自動化実装
  - [ ] 単体テスト作成

**Phase 3: Desktop App Init #635 (Day 3-5)**
- **Issue**: #635 feat(desktop): Initialize Miyabi Desktop App
- **Agent**: CodeGenAgent
- **タスク**:
  - [ ] Tauri + React + TypeScript プロジェクト初期化
  - [ ] ディレクトリ構造設計
  - [ ] 基本レイアウト実装
  - [ ] Rust backend skeleton
  - [ ] 開発環境セットアップドキュメント

#### Week 2 (11/13-11/19)

**継続タスク + 新規着手**

**KAMUI Epic継続**:
- [ ] #616 TUI版Worktree状態表示実装 (3日)
- [ ] #617 Git履歴グラフ描画機能 (2日)

**Desktop App拡張**:
- [ ] #670 Tmux統合基礎実装 (3日)

**Web UI並行作業**:
- [ ] #416 miyabi-agents リファクタリング開始 (2日)

**目標**: Week 2終了時点で基盤機能が動作し、3つのEpicが進行中

---

### Week 3-4: Core Features Implementation (2025-11-20 ～ 2025-12-03)

**テーマ**: コア機能の本格実装

#### 並列実行可能タスク (3チーム体制)

**Team A (KAMUI 4D)**:
- #618 Agent実行状態リアルタイム表示 (Week 3)
- #619 miyabi-kamui-bridge crate作成 (Week 4)
- #620 KAMUI 4D APIエンドポイント拡張 (Week 4)

**Team B (Desktop App)**:
- #679 Worktrees view実装 (Week 3)
- #680 Agents catalog実装 (Week 3)
- #682 History timeline (Week 4)

**Team C (Web UI)**:
- #416 Refactoring完了 (Week 3)
- #417 Business Agents実装開始 (Week 4)
- #434 Vector Space Universe interactivity (Week 4)

**Milestone進捗目標**:
- M39 KAMUI: 50% complete
- M38 Desktop: 40% complete
- M35 Web UI: 30% complete

---

### Week 5-8: Major Features & Integration (2025-12-04 ～ 2026-01-07)

**テーマ**: 主要機能統合とベンチマーク準備

#### Week 5-6: Integration Phase

**KAMUI完成へ**:
- #621 Web Dashboard 3D可視化 (Week 5-6)
- #624 TUI Phase 2実装 (Week 6)
- KAMUI Epic #612 完了

**Desktop MVP達成**:
- #683 Settings panel (Week 5)
- #684 Realtime events + notifications (Week 6)
- Desktop App MVP #635 基本完了

**Benchmark準備開始**:
- #398 SWE-bench Pro環境構築 (Week 5)
- #399 データセット統合 (Week 6)

#### Week 7-8: Web UI & Benchmark

**Web UI完成へ**:
- #417 13 Business Agents完了 (Week 7)
- #430 モバイル対応 (Week 7-8)
- #424 統合テスト (Week 8)

**Benchmark本格化**:
- #400 Miyabi評価ラッパー実装 (Week 7-8)
- #401 パイロット評価10インスタンス (Week 8)

**Milestone目標**:
- M39 KAMUI: ✅ 100% Complete
- M38 Desktop: ✅ 90% Complete
- M35 Web UI: 70% complete
- M33 Benchmark: 30% complete

---

### Week 9-12: Performance & Benchmarking (2026-01-08 ～ 2026-02-04)

**テーマ**: パフォーマンス最適化とベンチマーク評価

#### Week 9-10: Optimization

**Web UI最終調整**:
- #466 ベンチマークスイート構築
- #467-469 性能最適化 (型定義、async、メモリ)
- M35 Web UI Complete ✅

**LINE Bot準備**:
- #363 画像素材準備
- #365 Stripe決済統合開始

#### Week 11-12: Full-scale Benchmarking

**SWE-bench Pro評価**:
- #402 🔥 P0: フルスケール評価731インスタンス (Week 11-12)
- #403 結果分析とリーダーボード提出

**AgentBench評価**:
- #404 AgentBench 8環境評価 (Week 11)
- #405 HAL評価 (Week 12)

**Milestone目標**:
- M35 Web UI: ✅ 100% Complete
- M36 LINE Bot: 50% complete
- M33 Benchmark: 70% complete

---

### Week 13-16: Final Delivery (2026-02-05 ～ 2026-02-28)

**テーマ**: 最終リリース準備と完成

#### Week 13-14: LINE Bot & Infrastructure

**LINE Bot完成**:
- #366 Performance最適化
- #372 A/B Testing実装
- M36 LINE Bot Release ✅

**Infrastructure完了**:
- #558-559 SDK統合
- #774 Lark sync完了
- #745-751 Operations改善
- M41 Core Infrastructure ✅

#### Week 15-16: Benchmark完了 & Historical AI

**Benchmark最終**:
- #406 Galileo評価
- #407 統合分析レポート
- M33 Benchmark Evaluation ✅

**Historical AI (余裕あれば)**:
- #532-537 RAG + Character AI
- M40 Historical AI: 60% complete

---

## 🎯 優先順位マトリクス

### 即時着手 (今週)

| Priority | Issue | Why Critical | Dependencies |
|----------|-------|--------------|--------------|
| P0 | 環境確認 | 全ての基盤 | None |
| P1 | #612 | 全体アーキテクチャ | None |
| P1 | #615 | #612の基盤 | #612設計 |
| P1 | #635 | 新機能の核 | None |

### 短期 (Week 2-4)

| Priority | Issue | Why Important | Dependencies |
|----------|-------|---------------|--------------|
| P1 | #616-618 | KAMUI機能完成 | #615 |
| P1 | #679-680 | Desktop MVP | #635 |
| P1 | #416 | コード品質 | None |

### 中期 (Week 5-12)

| Priority | Issue | Why Important | Dependencies |
|----------|-------|---------------|--------------|
| P0 | #402 | ベンチマーク評価 | #398-401 |
| P1 | #400 | 評価基盤 | #399 |
| P2 | #417 | ビジネス機能 | #416 |

### 長期 (Week 13-16)

| Priority | Issue | Why Important | Dependencies |
|----------|-------|---------------|--------------|
| P1 | #403-407 | ベンチマーク完了 | #402 |
| P2 | #363-372 | LINE Bot | #365 |
| P3 | #532-537 | サイドプロジェクト | None |

---

## 🔄 並列実行戦略

### 3チーム並列実行モデル

**前提**: tmuxマルチペイン または Git Worktree並列実行

#### Team編成

**Team A: KAMUI 4D (高優先)**
- Agent: CoordinatorAgent + CodeGenAgent
- Focus: #612 Epic全体
- Timeline: Week 1-6 (完了目標)

**Team B: Desktop App (高優先)**
- Agent: CodeGenAgent
- Focus: #635 + sub-issues
- Timeline: Week 1-8 (MVP目標)

**Team C: Web UI (中優先)**
- Agent: CodeGenAgent + ReviewAgent
- Focus: M35全体
- Timeline: Week 1-10 (完了目標)

**Team D: Benchmark (段階的)**
- Agent: DeploymentAgent + ReviewAgent
- Focus: M33全体
- Timeline: Week 5-16 (評価・分析)

#### 並列実行例 (Week 1)

```bash
# tmux session: miyabi-execution

# Pane 1: Team A - KAMUI Epic
cd /Users/shunsuke/Dev/miyabi-private
git worktree add .worktrees/issue-612-kamui-epic
cd .worktrees/issue-612-kamui-epic
# CoordinatorAgent作業

# Pane 2: Team B - Desktop Init
cd /Users/shunsuke/Dev/miyabi-private
git worktree add .worktrees/issue-635-desktop-init
cd .worktrees/issue-635-desktop-init
# CodeGenAgent作業

# Pane 3: Team C - Web UI Refactoring
cd /Users/shunsuke/Dev/miyabi-private
git worktree add .worktrees/issue-416-refactoring
cd .worktrees/issue-416-refactoring
# CodeGenAgent作業

# Pane 4: Monitor
cd /Users/shunsuke/Dev/miyabi-private
miyabi status --watch
```

---

## 📊 Success Metrics (KPI)

### 週次KPI

**Week 1-4 目標**:
- [ ] KAMUI Epic #612: Sub-issue 4個完了
- [ ] Desktop App #635: 初期化完了、基本UI動作
- [ ] Web UI #416: Refactoring完了
- [ ] 並列実行3チーム体制確立

**Week 5-8 目標**:
- [ ] KAMUI Epic #612: 100% Complete
- [ ] Desktop App MVP: 90% Complete
- [ ] Web UI M35: 70% Complete
- [ ] Benchmark環境: 構築完了

**Week 9-12 目標**:
- [ ] Web UI M35: 100% Complete
- [ ] Benchmark SWE-bench: フルスケール評価完了
- [ ] LINE Bot: 50% Complete

**Week 13-16 目標**:
- [ ] LINE Bot M36: 100% Complete
- [ ] Infrastructure M41: 100% Complete
- [ ] Benchmark M33: 100% Complete
- [ ] 全マイルストーン完了

### 最終目標 (2026-02-28)

- ✅ 8個中7個のMilestone完了
- ✅ 64個のIssue中60個以上完了
- ✅ SWE-bench Pro評価結果公開
- ✅ Desktop App MVP リリース
- ✅ Web UI完全版リリース

---

## 🚨 リスク管理

### 高リスク項目

1. **#402 (P0): SWE-bench Pro 731インスタンス評価**
   - **リスク**: 時間・リソース不足
   - **対策**: Week 5から段階的準備、#401パイロットで確認
   - **Buffer**: 2週間の余裕を確保

2. **KAMUI Epic #612: 9個のSub-issue**
   - **リスク**: 複雑度高く遅延可能性
   - **対策**: Week 1-2で基盤確立、Week 3-6で集中実装
   - **Buffer**: Week 7-8予備週

3. **並列実行の複雑性**
   - **リスク**: チーム間調整コスト
   - **対策**: tmux + Worktree完全分離、Daily sync
   - **Buffer**: 週1回の統合テスト

### 中リスク項目

4. **Desktop App #635: 新技術スタック (Tauri)**
   - **対策**: Week 1で環境確認、公式ドキュメント参照

5. **13 Business Agents実装 (#417)**
   - **対策**: テンプレート化、並列実装

---

## 🎬 Day 1 アクションプラン

### 2025-11-06 (今日)

**Morning (09:00-12:00)**

```bash
# 1. 環境確認 (30分)
cargo --version
gh auth status
docker --version
plantuml -version

# 2. 全体ビルド確認 (30分)
cargo build --all
cargo test --all

# 3. KAMUI Epic分析 (60分)
gh issue view 612
gh issue view 615
# KAMUI 4D vs Miyabi比較分析ドキュメント読解

# 4. 設計ドキュメント作成開始 (60分)
# Worktreeメタデータ設計書ドラフト
```

**Afternoon (13:00-18:00)**

```bash
# 5. Worktree管理コード調査 (90分)
cd crates/miyabi-worktree
cargo doc --open
# 既存コードリーディング

# 6. #615 Issue着手準備 (60分)
git worktree add .worktrees/issue-615-worktree-mgmt
cd .worktrees/issue-615-worktree-mgmt
git checkout -b feature/issue-615-worktree-state-management

# 7. Desktop App調査 (60分)
# Tauri公式ドキュメント確認
# プロジェクト構造設計

# 8. Day 1レポート作成 (30分)
# 進捗報告、明日の予定
```

---

## 📝 進捗報告フォーマット

### 週次レポート

```markdown
# Week X Progress Report

## Completed
- [ ] Issue #XXX: Title (Agent: XXX)
- [ ] Issue #XXX: Title (Agent: XXX)

## In Progress
- [ ] Issue #XXX: Title (50% complete)

## Blocked
- [ ] Issue #XXX: Reason

## Next Week Plan
- [ ] Issue #XXX: Target completion
- [ ] Issue #XXX: Start

## Metrics
- Issues Closed: X
- PRs Merged: X
- Code Coverage: X%
```

---

## 🔗 関連ドキュメント

- **Issue分析**: `.ai/analysis/issue-review-2025-11-06.md`
- **更新サマリー**: `.ai/reports/issue-update-summary-2025-11-06.md`
- **Diagrams**: `.ai/diagrams/`
- **Master Restructuring Plan**: `.ai/plans/MASTER_RESTRUCTURING_PLAN.md`

---

**作成者**: Claude (Miyabi AI System)
**バージョン**: 1.0
**最終更新**: 2025-11-06

**Status**: ✅ Ready for Execution
