# Issue Master Log - 18 Codex並列実行環境構築

**Issue ID**: TBD (GitHub Issue作成後に更新)
**Status**: 🟡 In Progress
**Priority**: P0
**Created**: 2025-11-11
**Owner**: Master Orchestrator (Local PC)
**Assignees**: Miyabi Team

---

## 📊 Summary

OpenAI Codex CLI を使用した200並列実行環境の構築。Phase 1として18並列（MUGEN 12 + MAJIN 6）を実装。

---

## 🎯 Goal

**Short-term Goal (Phase 1)**:
- MUGEN 12 Codex + MAJIN 6 Codex = 18並列実行環境構築
- ローカルPCからSSH経由でリモート制御
- VS Code統合環境構築
- テストタスク実行・検証

**Long-term Goal (Phase 2/3)**:
- Phase 2: 100 Codex並列（追加EC2 3台）
- Phase 3: 200 Codex並列（追加EC2 5台）

---

## 📋 Requirements

### Functional Requirements

**FR-1: リモート実行環境**
- ✅ MUGEN/MAJINへSSH接続可能
- ✅ OpenAI Codex CLIインストール
- ✅ tmuxセッション管理

**FR-2: オーケストレーション**
- ✅ マスターオーケストレーター（ローカルPC）
- ✅ サブオーケストレーター（MUGEN/MAJIN各1）
- ✅ 18 Codexインスタンス並列起動

**FR-3: VS Code統合**
- ✅ Remote-SSH接続
- ✅ 設定同期（Linter, Hooks, Problems）
- ✅ Multi-root workspace

**FR-4: モニタリング**
- ✅ リアルタイムステータス監視
- ✅ CPU/Memory使用率表示
- ✅ ログ収集・保存

### Non-Functional Requirements

**NFR-1: パフォーマンス**
- 並列効率: 85-90%以上
- タスク処理時間: 単一実行比15-16倍の高速化

**NFR-2: 信頼性**
- エラー率: < 5%
- 自動復旧機能（tmuxセッション再起動）

**NFR-3: 可用性**
- MUGEN/MAJIN稼働率: > 99%
- 24/7運用可能

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│   ローカルPC (MacBook Pro)                   │
│   ┌─────────────────────────────┐            │
│   │ Master Orchestrator         │            │
│   │ - 全体制御                   │            │
│   │ - VS Code統合               │            │
│   │ - モニタリング               │            │
│   └──────────┬──────────────────┘            │
│              │ SSH × 2                       │
└──────────────┼───────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼─────┐  ┌─────▼──────┐
│ MUGEN      │  │ MAJIN      │
│ (16 vCPU)  │  │ (8 vCPU)   │
│            │  │            │
│ Sub Orch.  │  │ Sub Orch.  │
│ tmux       │  │ tmux       │
│            │  │            │
│ ┌────────┐ │  │ ┌────────┐ │
│ │Codex-1 │ │  │ │Codex-1 │ │
│ │Codex-2 │ │  │ │Codex-2 │ │
│ │  ...   │ │  │ │  ...   │ │
│ │Codex-12│ │  │ │Codex-6 │ │
│ │Monitor │ │  │ │Monitor │ │
│ └────────┘ │  │ └────────┘ │
└────────────┘  └────────────┘
```

---

## 📅 Timeline

### Phase 1: 18 Codex並列環境（2-3日）

**Day 1 (2025-11-11)**: ✅
- [x] 要件定義・分析
- [x] リソース計算・実現可能性評価
- [x] 実装プランドキュメント作成
- [x] セットアップスクリプト作成
  - [x] `setup-phase1-18-codex.sh`
  - [x] `sub-orchestrator-mugen.sh`
  - [x] `sub-orchestrator-majin.sh`
  - [x] `master-orchestrator.sh`
  - [x] `monitor-18-codex.sh`
- [x] VS Code接続ガイド作成

**Day 2 (2025-11-12)**: ⏳
- [ ] MUGEN/MAJINセットアップ実行
  - [ ] Codex CLIインストール
  - [ ] API Key設定
  - [ ] VS Code設定同期
- [ ] サブオーケストレーター配置
- [ ] テストタスク18個生成

**Day 3 (2025-11-13)**: ⏳
- [ ] 18 Codex並列実行テスト
- [ ] パフォーマンス測定
- [ ] エラーハンドリング確認
- [ ] ドキュメント最終化

### Phase 2: 100 Codex並列環境（Week 2）

**2025-11-18 ~ 2025-11-22**: 計画
- [ ] Phase 1効果測定レビュー
- [ ] 追加EC2インスタンス3台起動
- [ ] 100 Codex環境構築
- [ ] 負荷分散テスト

### Phase 3: 200 Codex並列環境（Week 3-4）

**2025-11-25 ~ 2025-12-06**: 計画
- [ ] Phase 2効果測定レビュー
- [ ] 追加EC2インスタンス2台起動
- [ ] 200 Codex環境構築
- [ ] 最終パフォーマンステスト

---

## 📂 Deliverables

### ドキュメント
- ✅ `.ai/plans/codex-200-parallel-execution.md` - 全体実装プラン
- ✅ `docs/VSCODE_REMOTE_CONNECTION_GUIDE.md` - VS Code接続ガイド
- ✅ `.ai/logs/issue-master-log.md` - このファイル
- ⏳ PlantUMLアーキテクチャ図

### スクリプト
- ✅ `scripts/setup-phase1-18-codex.sh` - Phase 1セットアップ
- ✅ `scripts/sub-orchestrator-mugen.sh` - MUGEN用サブオーケストレーター
- ✅ `scripts/sub-orchestrator-majin.sh` - MAJIN用サブオーケストレーター
- ✅ `scripts/master-orchestrator.sh` - マスターオーケストレーター
- ✅ `scripts/monitor-18-codex.sh` - リアルタイム監視

### テストタスク
- ⏳ `tasks/codex-test/test-task-{1..18}.md` - 18個のテストタスク

---

## 🔍 Testing Strategy

### Unit Test（個別Codex検証）
- [ ] Codex起動確認（18個全て）
- [ ] タスク実行確認（18個全て）
- [ ] ログ出力確認

### Integration Test（統合検証）
- [ ] マスターオーケストレーター起動
- [ ] サブオーケストレーター連携
- [ ] SSH接続安定性

### Performance Test（性能検証）
- [ ] 18並列実行時のCPU使用率
- [ ] メモリ使用率測定
- [ ] タスク完了時間測定

### Load Test（負荷テスト）
- [ ] 長時間稼働テスト（8時間）
- [ ] エラー回復テスト

---

## 📊 Metrics & KPIs

### Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **並列数** | 18 | 0 | ⏳ 未実装 |
| **並列効率** | > 85% | TBD | ⏳ 測定待ち |
| **CPU使用率 (MUGEN)** | 70-80% | TBD | ⏳ 測定待ち |
| **CPU使用率 (MAJIN)** | 75-85% | TBD | ⏳ 測定待ち |
| **エラー率** | < 5% | TBD | ⏳ 測定待ち |
| **タスク処理速度** | 15-16倍 | TBD | ⏳ 測定待ち |

### Cost Metrics

| Item | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| **追加インスタンス** | 0 | 3 | 5 |
| **月額コスト** | $0 | $2,203 | $3,672 |
| **並列数** | 18 | 100 | 200 |

---

## 🚨 Risks & Mitigation

### Risk 1: リソース不足
**Likelihood**: Medium
**Impact**: High
**Mitigation**: 段階的スケールアップ（Phase 1 → 2 → 3）

### Risk 2: Codex API制限
**Likelihood**: Low
**Impact**: High
**Mitigation**: API Key複数準備、Rate Limit監視

### Risk 3: SSH接続不安定
**Likelihood**: Low
**Impact**: Medium
**Mitigation**: 自動再接続機能、Keep-Alive設定

### Risk 4: コスト超過
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Phase毎に効果測定・判断、Auto Start/Stop検討

---

## 📝 Notes & Decisions

### 2025-11-11

**Decision 1: Option 2（段階的スケールアップ）選択**
- Reason: 即座に18並列開始可能、効果測定後にスケール判断
- Owner: User

**Decision 2: Phase 1実装を即座に開始**
- Reason: 無料、低リスク、検証目的で最適
- Owner: User

**Decision 3: tmuxベースのオーケストレーション採用**
- Reason: 既存Miyabiインフラとの統合性、シンプルな実装
- Owner: Technical Team

---

## 🔗 Related Issues & PRs

- Issue #TBD: Phase 1 - 18 Codex並列環境構築
- PR #TBD: スクリプト追加（setup-phase1-18-codex.sh等）
- Issue #TBD: Phase 2 - 100 Codex並列環境構築（Future）
- Issue #TBD: Phase 3 - 200 Codex並列環境構築（Future）

---

## 📞 Contact & Support

**Primary Contact**: Miyabi Team
**Email**: [TBD]
**Slack Channel**: #miyabi-codex-parallel

---

## 🔄 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-11 | 初版作成 - Phase 1計画 | Claude Code |
| 2025-11-11 | 要件定義・アーキテクチャ設計完了 | Claude Code |
| 2025-11-11 | スクリプト作成完了 | Claude Code |
| 2025-11-11 | VS Code接続ガイド作成 | Claude Code |

---

**Status**: 🟡 In Progress - Phase 1 Implementation
**Next Action**: MUGEN/MAJINセットアップ実行
**ETA**: 2025-11-13 (Phase 1完了)
