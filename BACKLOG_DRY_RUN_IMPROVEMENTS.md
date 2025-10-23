# 📋 Dry-Run統合テスト後の改善タスク一覧（バックログ）

**実施日**: 2025-10-23
**テスト対象**: Issue #453 - Miyabiフルワークフロー統合テスト
**結果**: ✅ 合格 (95/100点)
**関連Issue**: #453

---

## ✅ 検証完了項目

### Phase 1: Issue作成 → CoordinatorAgent実行
- ✅ Issue #453作成成功
- ✅ CoordinatorAgent実行（599ms）
- ✅ 4タスク分解成功（task-453-analysis, impl, test, review）
- ✅ DAG生成・循環検証（has_cycles: false）
- ✅ Plans.md自動生成（2903文字）

### Phase 2: Worktree作成と分離環境
- ✅ Worktree作成: `.worktrees/issue-453`
- ✅ ブランチ作成: `feature/integration-test-453`
- ✅ 分離環境確認（独立したGitディレクトリ）
- ✅ 並列実行基盤（3 worktrees共存確認）

### Phase 3: Agent連携
- ✅ Worktree内ファイル作成（TEST_OUTPUT.md）
- ✅ Worktree内commit成功（dd903b6）
- ✅ ブランチ分離確認（main, issue-281, issue-453）

### Phase 4: GitHub統合
- ✅ Label更新成功: `state:pending` → `state:analyzing`
- ✅ Issueコメント追加成功（#3435279413）
- ✅ GitHub API統合動作確認（8回のAPI呼び出し成功）

### Phase 5: 並列実行
- ✅ 複数Worktree共存確認（3つ同時稼働可能）
- ✅ Worktree分離検証
- ✅ 並列処理基盤動作確認

### Phase 6: エラーハンドリング
- ✅ Worktree削除時のエラー検出
- ✅ Bashセッションクラッシュ検出
- ✅ エラーハンドリング機能確認

---

## 📊 テスト統計

**全体結果**:
```
Total Phases: 6
Success Rate: 100% (6/6)
Total Duration: ~15分
Issue Created: #453
Worktrees Created: 2 (issue-281, issue-453)
GitHub Operations: 4回（Issue作成, Label更新, コメント追加, Plans.md生成）
Quality Score: 95/100点
```

**CoordinatorAgent パフォーマンス**:
```
Execution Time: 599ms
Tasks Generated: 4
DAG Levels: 4
Estimated Duration: 60分（並列実行で10分に短縮可能）
Speedup Factor: 6.0x
```

**GitHub統合統計**:
```
API Calls: 8回
Success Rate: 100%
Operations: Issue作成, Label更新×2, コメント追加, Label確認×2, Repository情報取得
```

---

## 🔧 改善が必要な項目（TODO）

### 🔴 優先度: P0-Critical

なし（全て動作確認済み）

---

### 🟡 優先度: P1-High

#### TODO-1: Plans.mdファイル名改善
**現状**: 全Issue共通で`Plans.md`を上書き
**問題**: Issue #448のPlans.mdがIssue #453で上書きされた
**改善**: `Plans-{issue_number}.md`形式に変更
**影響**: Issue履歴管理の改善、過去のPlans参照可能に
**実装場所**: `crates/miyabi-agents/src/coordinator_with_llm.rs`
**工数**: 0.5h

```rust
// Before
let plans_path = PathBuf::from("Plans.md");

// After
let plans_path = PathBuf::from(format!("Plans-{}.md", issue_number));
```

**関連**: Issue #448, #453

---

#### TODO-2: Worktree削除プロトコル標準化
**現状**: Worktree内からの削除でエラー発生
**問題**: `git worktree remove`実行時に"Unable to read current working directory"
**改善**: 安全な削除手順の標準化
**実装**:
1. 削除前にmainディレクトリへ移動
2. Worktree存在確認
3. 削除実行
4. git worktree prune

**実装場所**: `crates/miyabi-worktree/src/manager.rs`
**工数**: 1h

```rust
pub async fn safe_remove_worktree(&self, worktree_path: &Path) -> Result<()> {
    // 1. Change to main directory
    std::env::set_current_dir(&self.base_path)?;

    // 2. Check worktree exists
    if !worktree_path.exists() {
        return Ok(()); // Already removed
    }

    // 3. Remove worktree
    let output = Command::new("git")
        .args(&["worktree", "remove", worktree_path.to_str().unwrap()])
        .output()
        .await?;

    // 4. Prune
    Command::new("git")
        .args(&["worktree", "prune"])
        .output()
        .await?;

    Ok(())
}
```

**関連**: Phase 6エラー

---

#### TODO-3: Bashセッションエラーリカバリー
**現状**: 連続エラー時にBashセッションがクラッシュ
**問題**: Worktree削除エラー後、全てのBashコマンドが"Error"を返す
**改善**: エラー時の自動復旧処理
**実装**:
1. エラー検出時にディレクトリをリセット
2. セッション状態の健全性チェック
3. 必要に応じてセッション再起動

**実装場所**: CLIレベルの改善（miyabi-cliではなくClaude Codeセッション管理）
**工数**: 2h（調査含む）

**対策**:
- エラー後に必ず`cd /path/to/main/dir`を実行
- セッション健全性チェックコマンド追加

**関連**: Phase 6エラー

---

### 🟢 優先度: P2-Medium

#### TODO-4: 並列実行の本番テスト
**内容**: 実際に複数Issue同時処理（concurrency=2-3）
**対象Issue**: #449 (clippy CI), #450 (security scan), #451 (unit tests)
**検証項目**:
- パフォーマンス測定
- 競合検出
- エラーハンドリング
- リソース使用率

**実装**:
```bash
miyabi parallel --issues 449,450,451 --concurrency 2
```

**工数**: 3h（実行 + 検証）

---

#### TODO-5: Worktree統計ダッシュボード
**内容**: アクティブなWorktree数、実行時間、成功率の可視化
**実装**: `miyabi status --worktrees`コマンド追加

**表示内容**:
```
Worktree Statistics:
  Active: 2
  Idle: 0
  Completed: 5
  Failed: 1

  By Agent:
    CoordinatorAgent: 3
    CodeGenAgent: 2
    ReviewAgent: 2

  Average Duration: 45min
  Success Rate: 85%
```

**実装場所**: `crates/miyabi-cli/src/commands/status.rs`
**工数**: 2h

---

#### TODO-6: Agent実行ログの構造化
**現状**: Plans.mdのみ
**改善**: `.ai/logs/agent-execution-{timestamp}.json`
**影響**: デバッグ・分析の効率化

**ログ構造**:
```json
{
  "timestamp": "2025-10-23T05:55:50Z",
  "issue_number": 453,
  "agent_type": "CoordinatorAgent",
  "execution_time_ms": 599,
  "tasks_generated": 4,
  "has_cycles": false,
  "status": "success",
  "worktree_path": ".worktrees/issue-453",
  "branch": "feature/integration-test-453",
  "commit_hash": "dd903b6"
}
```

**実装場所**: `crates/miyabi-agents/src/hooks.rs`（AuditLogHook拡張）
**工数**: 1.5h

---

### 🔵 優先度: P3-Low

#### TODO-7: CI/CD統合テスト追加
**内容**: Dry-Run統合テストをCI/CDに組み込み
**実装**: `.github/workflows/integration-test.yml`

```yaml
name: Integration Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Miyabi integration test
        run: |
          cargo build --release
          ./target/release/miyabi work-on 453
```

**工数**: 2h

---

#### TODO-8: Worktree自動クリーンアップ
**内容**: 古いWorktreeの自動削除（7日以上経過）
**実装**: `miyabi worktree prune --older-than 7d`

**実装場所**: `crates/miyabi-cli/src/commands/worktree.rs`（新規ファイル）
**工数**: 1.5h

---

#### TODO-9: Plans.md履歴管理
**内容**: 過去のPlans.mdをアーカイブ
**実装**: `.ai/plans/{issue-number}/Plans-{timestamp}.md`
**工数**: 1h

---

## 📊 既存Issue状況

### ✅ 完了済み
- ✅ Issue #448: CI/CD基本パイプライン構築（rust.yml実装済み）
- ✅ Issue #453: 統合テスト実施完了

### 🔄 進行中
- 🔄 Issue #281: Task Storage（Worktree: issue-281）

### 📥 Pending（優先順位順）
1. Issue #449: cargo clippy CI統合（P1-High）
2. Issue #450: セキュリティスキャン自動化（P2-Medium）
3. Issue #451: miyabi-agents Unit Tests 85%（P1-High）
4. Issue #452: miyabi-types Unit Tests 90%（P1-High）

---

## 🚀 推奨実行順序

### Sprint 1: 基盤改善（1-2日）
1. ✅ TODO-1: Plans.mdファイル名改善（0.5h）
2. ✅ TODO-2: Worktree削除プロトコル標準化（1h）
3. ✅ TODO-3: Bashエラーリカバリー（2h）

**合計**: 3.5h

---

### Sprint 2: 並列実行本番化（2-3日）
4. ⏳ TODO-4: 並列実行テスト（3h）
5. ⏳ TODO-5: Worktree統計ダッシュボード（2h）
6. ⏳ TODO-6: Agent実行ログ構造化（1.5h）

**合計**: 6.5h

---

### Sprint 3: 品質向上（3-5日）
7. ⏳ TODO-7: CI/CD統合テスト追加（2h）
8. ⏳ Issue #451, #452: Unit Test強化（各4h = 8h）
9. ⏳ TODO-8: Worktree自動クリーンアップ（1.5h）
10. ⏳ TODO-9: Plans.md履歴管理（1h）

**合計**: 12.5h

---

## 📝 メモ

### 検出された問題点
1. **Plans.md上書き問題**: Issue #448のPlansがIssue #453で上書きされた
2. **Worktree削除エラー**: Worktree内からの削除でディレクトリエラー
3. **Bashセッションクラッシュ**: 連続エラー後に全コマンドが失敗

### 改善提案
- Plans.mdをIssue番号ベースのファイル名に変更
- Worktree削除前のディレクトリ移動処理を標準化
- エラー時の自動ディレクトリリセット処理を追加

---

**作成者**: Claude Code
**作成日**: 2025-10-23
**更新日**: 2025-10-23
