# TODO リスト

**作成日**: 2025-10-23
**詳細**: [BACKLOG_DRY_RUN_IMPROVEMENTS.md](BACKLOG_DRY_RUN_IMPROVEMENTS.md)

---

## 🔴 Sprint 1: 基盤改善（1-2日） ✅ 完了

### High Priority

- [x] **TODO-1**: Plans.mdファイル名改善
  - 実装: `Plans-{issue_number}.md`形式
  - 場所: `crates/miyabi-agents/src/coordinator_with_llm.rs`
  - 工数: 0.5h
  - コミット: 80de595

- [x] **TODO-2**: Worktree削除プロトコル標準化
  - 実装: 安全な削除手順（削除前のディレクトリ移動）
  - 場所: `crates/miyabi-worktree/src/manager.rs`
  - 工数: 1h
  - コミット: e849109

- [x] **TODO-3**: Bashエラーリカバリー
  - 実装: エラー時の自動ディレクトリリセット
  - 場所: CLIレベル
  - 工数: 2h
  - コミット: 55c4687

**Sprint 1 合計**: 3.5h (完了)

---

## 🟢 Sprint 2: 並列実行本番化（2-3日） ✅ 完了

### Medium Priority

- [x] **TODO-4**: 並列実行の本番テスト
  - 実行: `miyabi parallel --issues 449,450,451 --concurrency 2`
  - 検証: パフォーマンス、競合、エラーハンドリング
  - 工数: 3h
  - コミット: (並列実行確認完了)

- [x] **TODO-5**: Worktree統計ダッシュボード
  - 実装: `miyabi status --worktrees`コマンド
  - 場所: `crates/miyabi-cli/src/commands/status.rs`
  - 工数: 2h
  - コミット: 97384d8

- [x] **TODO-6**: Agent実行ログ構造化
  - 実装: `.ai/logs/agent-execution-{timestamp}.json`
  - 場所: `crates/miyabi-agents/src/hooks.rs`
  - 工数: 1.5h
  - コミット: 82d64f4

**Sprint 2 合計**: 6.5h (完了)

---

## 🔵 Sprint 3: 品質向上（3-5日） ✅ 完了

### Low Priority

- [x] **TODO-7**: CI/CD統合テスト追加
  - 実装: `.github/workflows/integration-test.yml`
  - 工数: 2h
  - コミット: 87e8ea4

- [x] **TODO-8**: Worktree自動クリーンアップ
  - 実装: `miyabi worktree prune --older-than 7d`
  - 場所: `crates/miyabi-cli/src/commands/worktree.rs`
  - 工数: 1.5h
  - コミット: 0ff6a7c

- [x] **TODO-9**: Plans.md履歴管理
  - 実装: `.ai/plans/{issue-number}/Plans-{timestamp}.md`
  - 工数: 1h
  - コミット: 9a1ab97

**Sprint 3 合計**: 4.5h (完了)

---

## 📊 既存Issueタスク

### Pending Issues（優先順位順）

1. [ ] **Issue #449**: cargo clippy CI統合（P1-High）
2. [ ] **Issue #450**: セキュリティスキャン自動化（P2-Medium）
3. [ ] **Issue #451**: miyabi-agents Unit Tests 85%（P1-High） - 工数: 4h
4. [ ] **Issue #452**: miyabi-types Unit Tests 90%（P1-High） - 工数: 4h

**Unit Tests 合計**: 8h

---

## ✅ 完了済み

- [x] Issue #448: CI/CD基本パイプライン構築（rust.yml実装済み）
- [x] Issue #453: Miyabi統合テスト実施完了（2025-10-23）
  - Phase 1-6: 全て完了
  - 品質スコア: 95/100点

---

## 📈 進捗トラッキング

**Sprint 1**: 3/3 完了 ✅
**Sprint 2**: 3/3 完了 ✅
**Sprint 3**: 3/3 完了 ✅
**Unit Tests**: 0/2 完了

**全体進捗**: 9/11 (82%)

---

## 🚀 次のアクション

**全Sprintが完了しました！🎉**

**次の推奨タスク**:
1. Issue #451: miyabi-agents Unit Tests 85%（P1-High） - 工数: 4h
2. Issue #449: cargo clippy CI統合（P1-High）
3. Issue #452: miyabi-types Unit Tests 90%（P1-High） - 工数: 4h
4. Issue #450: セキュリティスキャン自動化（P2-Medium）

---

**最終更新**: 2025-10-23
