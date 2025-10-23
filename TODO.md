# TODO リスト

**作成日**: 2025-10-23
**詳細**: [BACKLOG_DRY_RUN_IMPROVEMENTS.md](BACKLOG_DRY_RUN_IMPROVEMENTS.md)

---

## 🔴 Sprint 1: 基盤改善（1-2日）

### High Priority

- [ ] **TODO-1**: Plans.mdファイル名改善
  - 実装: `Plans-{issue_number}.md`形式
  - 場所: `crates/miyabi-agents/src/coordinator_with_llm.rs`
  - 工数: 0.5h

- [ ] **TODO-2**: Worktree削除プロトコル標準化
  - 実装: 安全な削除手順（削除前のディレクトリ移動）
  - 場所: `crates/miyabi-worktree/src/manager.rs`
  - 工数: 1h

- [ ] **TODO-3**: Bashエラーリカバリー
  - 実装: エラー時の自動ディレクトリリセット
  - 場所: CLIレベル
  - 工数: 2h

**Sprint 1 合計**: 3.5h

---

## 🟢 Sprint 2: 並列実行本番化（2-3日）

### Medium Priority

- [ ] **TODO-4**: 並列実行の本番テスト
  - 実行: `miyabi parallel --issues 449,450,451 --concurrency 2`
  - 検証: パフォーマンス、競合、エラーハンドリング
  - 工数: 3h

- [ ] **TODO-5**: Worktree統計ダッシュボード
  - 実装: `miyabi status --worktrees`コマンド
  - 場所: `crates/miyabi-cli/src/commands/status.rs`
  - 工数: 2h

- [ ] **TODO-6**: Agent実行ログ構造化
  - 実装: `.ai/logs/agent-execution-{timestamp}.json`
  - 場所: `crates/miyabi-agents/src/hooks.rs`
  - 工数: 1.5h

**Sprint 2 合計**: 6.5h

---

## 🔵 Sprint 3: 品質向上（3-5日）

### Low Priority

- [ ] **TODO-7**: CI/CD統合テスト追加
  - 実装: `.github/workflows/integration-test.yml`
  - 工数: 2h

- [ ] **TODO-8**: Worktree自動クリーンアップ
  - 実装: `miyabi worktree prune --older-than 7d`
  - 場所: `crates/miyabi-cli/src/commands/worktree.rs`
  - 工数: 1.5h

- [ ] **TODO-9**: Plans.md履歴管理
  - 実装: `.ai/plans/{issue-number}/Plans-{timestamp}.md`
  - 工数: 1h

**Sprint 3 合計**: 4.5h

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

**Sprint 1**: 0/3 完了
**Sprint 2**: 0/3 完了
**Sprint 3**: 0/3 完了
**Unit Tests**: 0/2 完了

**全体進捗**: 0/11 (0%)

---

## 🚀 次のアクション

**今すぐ開始できるタスク**:
1. TODO-1: Plans.mdファイル名改善（0.5h）
2. TODO-2: Worktree削除プロトコル（1h）

**推奨実行順序**: Sprint 1 → Sprint 2 → Sprint 3

---

**最終更新**: 2025-10-23
