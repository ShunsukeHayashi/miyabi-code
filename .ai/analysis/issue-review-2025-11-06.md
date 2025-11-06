# Miyabi Open Issues Review - 2025-11-06

**Total Open Issues**: 64
**Milestones**: 4 active

---

## 📊 Current Milestone Distribution

| Milestone | Due Date | Open Issues | Status |
|-----------|----------|-------------|--------|
| Benchmark Evaluation (Q1 2026) | 2026-04-21 | 12 | Planning Phase |
| Week 16: Web UI Complete | 2026-02-11 | 10 | In Progress |
| Week 18: LINE Bot Release | 2026-02-25 | 4 | Planning |
| **No Milestone** | - | **38** | ⚠️ Needs Assignment |

---

## 🎯 Issues Without Milestones (38 issues - PRIORITY)

### High Priority Epic (1)
- #612 Epic: KAMUI 4D設計パターン統合 - Worktree可視化とAgent管理の強化

### Sub-Tasks for KAMUI Epic (7)
- #615 feat: Worktree状態管理の強化 - リアルタイム追跡とクリーンアップ
- #616 feat: TUI版Worktree状態表示の実装 (miyabi status --tui)
- #617 feat: Git履歴グラフ描画機能 - 複数ブランチの統合表示
- #618 feat: Agent実行状態リアルタイム表示 - ライブモニタリングTUI
- #619 feat: miyabi-kamui-bridge crateの作成 - KAMUI 4D連携ブリッジ
- #620 feat: KAMUI 4D APIエンドポイント拡張 - Miyabi統合API
- #621 feat: Web Dashboard 3D可視化 - Three.js統合
- #624 feat: TUI版Worktree状態表示の実装 (Phase 2-1)

### Historical AI Project Epic (6)
- #532 Epic: 歴史上の偉人AIアバター販売プラットフォーム開発
- #533 Task: RAGパイプライン構築（歴史資料→Vector DB）
- #534 Task: 織田信長AIプロンプト設計（キャラクター再現）
- #535 Task: Axum APIサーバー実装（/chat エンドポイント）
- #536 Task: Next.jsチャットUI実装
- #537 Task: ビジネスモデル設計（価格・プラン）

### SDK Integration Tasks (2)
- #558 🏗️ [Week 3-4] Create Rust FFI Bridge using NAPI for SDK Integration
- #559 🤖 [Week 5] Integrate OpenAI Agents SDK for Hybrid Routing

### Planning Spikes (3)
- #609 Spike: Plan Mode & AGENTS.md integration
- #610 Spike: MCP Registry-style integration UX
- #611 Spike: AI control plane & metrics dashboard

### Desktop App Issues (7)
- #635 feat(desktop): Initialize Miyabi Desktop App with Tauri + React + TypeScript
- #670 feat(desktop): Tmux統合による外部コーディングエージェント管理機能の実装
- #679 feat: Worktrees view with details and cleanup actions
- #680 feat: Agents catalog and detail pane
- #682 feat: History timeline and analytics
- #683 feat: Settings panel for integrations and preferences
- #684 feat: Realtime events and native notifications

### Business Agent UI Integration (2)
- #642 [Phase 2.3] ビジネスエージェントUI統合 - カテゴリアイコン統一
- #643 [Phase 2.4] ビジネスエージェントUI統合 - エージェント検索機能

### DAG & Workflow (2)
- #649 [Phase 4] ワークフローDAGリアルタイム更新 - 実装
- #651 [Phase 6] 並列実行プログレスバー - 実装

### ClickFunnels Auto-Implementation (1)
- #669 feat: ClickFunnels Complete Auto-Implementation (SWML Evaluation)

### Desktop Test & Infrastructure (1)
- #708 fix: Resolve test configuration errors in miyabi-desktop

### Operations & CI/CD (4)
- #745 chore: unify LLM error API across agents
- #746 ops: define policy for auto-generated .ai artifacts
- #750 ci: reinstate full health-check pipeline
- #751 ops: refresh workflow roadmap and task ownership

### Lark Integration (1)
- #774 Phase 2: Complete miyabi-lark-sync Integration (60% → 100%)

---

## 📋 Milestone 33: Benchmark Evaluation (12 issues)

### Root Epics (2)
- #396 🎯 SWE-bench Pro評価実装 - 世界標準ベンチマークでのMiyabi性能測定
- #397 🤖 エージェントベンチマーク評価実装 - AgentBench/HAL/Galileoでの包括的評価

### SWE-bench Pro Sub-Issues (6)
- #398 Phase 1: SWE-bench Pro公式評価環境の構築
- #399 Phase 2: データセット統合とMiyabi型定義
- #400 Phase 3: Miyabi評価ラッパーとパッチ生成システム実装
- #401 Phase 4: パイロット評価（10インスタンス）
- #402 Phase 5: フルスケール評価（731インスタンス全評価）
- #403 Phase 6: 結果分析とリーダーボード提出

### AgentBench Sub-Issues (4)
- #404 Phase 1: AgentBench評価（8環境）
- #405 Phase 2: HAL評価（9ベンチマーク + コスト効率）
- #406 Phase 3: Galileo Agent Leaderboard v2評価（エンタープライズ）
- #407 Phase 4: 統合分析とレポート作成

---

## 📋 Milestone 35: Week 16 Web UI Complete (10 issues)

- #416 🔧 refactor: Migrate remaining code from miyabi-agents to specialized crates
- #417 ✨ feat: Implement 13 remaining Business Agents
- #424 【Testing】miyabi-knowledge: 統合テスト実装 - Docker Compose + E2Eテスト
- #430 【Phase 5】モバイル対応 - レスポンシブデザインとPWA化
- #434 feat(dashboard): Add click interaction and task details modal to Vector Space Universe
- #435 feat(dashboard): Add animation enhancements to Vector Space Universe TaskStars
- #466 [P3-005] ベンチマークスイート構築
- #467 [P3-006] 型定義最適化（Box/Rc/Arc）
- #468 [P3-007] async/awaitパターン最適化
- #469 [P3-008] メモリプロファイリング・最適化

---

## 📋 Milestone 36: Week 18 LINE Bot Release (4 issues)

- #363 🖼️ Phase 2: 画像素材準備 - BytePlus Landing Page用画像8種類作成
- #365 💳 Phase 4: Stripe決済統合 - オンライン/オフライン決済フロー実装
- #366 ⚡ Phase 5: パフォーマンス最適化 - Lighthouse 90+達成 & Core Web Vitals改善
- #372 🧪 Phase 6: A/Bテスト実装 - CVR最適化のための3つのテスト

---

## 🎯 Recommended Actions

### 1. Create New Milestones

**Milestone: "Desktop App MVP" (Due: 2026-03-15)**
- All #635-#684 desktop-related issues
- Target: Tauri-based desktop application with Tmux integration

**Milestone: "KAMUI 4D Integration" (Due: 2026-03-01)**
- Epic #612 + all 7 sub-tasks (#615-#621, #624)
- Target: Real-time Worktree visualization and monitoring

**Milestone: "Historical AI Project" (Due: 2026-04-01)**
- Epic #532 + 5 sub-tasks (#533-#537)
- Target: First AI avatar product launch (Nobunaga)

**Milestone: "Core Infrastructure Improvements" (Due: 2026-02-28)**
- SDK integration (#558, #559)
- Operations improvements (#745, #746, #750, #751)
- Lark integration completion (#774)

### 2. Priority Label Corrections

**Issues with Conflicting Priority Labels** (need cleanup):
- #363, #365, #366: Both P1-High + P3-Low (conflicting)
- #372: Both P1-High + P2-Medium (conflicting)

**Recommended Priority Adjustments**:
- #612 (KAMUI Epic): Keep P1-High ✓
- #532 (Historical AI): P2-Medium → P3-Low (Side project)
- #669 (ClickFunnels): P1-High → P2-Medium (Evaluation project)
- #635 (Desktop Init): Add P1-High (Critical new feature)

### 3. Missing State Labels

Many issues lack proper state labels. Recommend adding:
- `🎯 phase:planning` for all spike issues (#609-#611)
- `🏗️ phase:implementation` for ready-to-code issues
- `📥 state:pending` for all unassigned issues

### 4. Agent Assignment

Issues without agent assignments:
- Desktop app issues → 🤖 agent:codegen
- Infrastructure issues → 🤖 agent:deployment
- Documentation issues → 🤖 agent:review

---

## 📈 Summary Statistics

| Category | Count | % of Total |
|----------|-------|------------|
| Without Milestone | 38 | 59% |
| Benchmark Evaluation | 12 | 19% |
| Web UI Complete | 10 | 16% |
| LINE Bot Release | 4 | 6% |
| **Total** | **64** | **100%** |

| Priority | Count | % of Total |
|----------|-------|------------|
| P0-Critical | 1 | 2% |
| P1-High | 15 | 23% |
| P2-Medium | 27 | 42% |
| P3-Low | 12 | 19% |
| No Priority | 9 | 14% |

| Type | Count | % of Total |
|------|-------|------------|
| ✨ feature | 48 | 75% |
| 🐛 bug | 2 | 3% |
| 📚 docs | 3 | 5% |
| 🧪 test | 3 | 5% |
| Other/None | 8 | 13% |

---

**Next Steps**:
1. Create 4 new milestones
2. Assign 38 issues to appropriate milestones
3. Clean up conflicting priority labels
4. Add missing state and agent labels
5. Update issue descriptions with current context
