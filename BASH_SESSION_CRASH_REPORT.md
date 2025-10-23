# 🚨 Bash Session Crash Report

**発生日時**: 2025-10-23
**セッション**: Miyabi統合テスト（Phase 6後）
**重要度**: P1-High

---

## 📋 問題の概要

**症状**: 全てのBashコマンドが"Error"を返す
**影響範囲**:
- ✅ Read/Write/Edit: 正常動作
- ❌ Bash: 全コマンド失敗
- ❌ gh: 実行不可
- ❌ git: 実行不可
- ❌ miyabi: 実行不可

---

## 🔍 根本原因分析

### 直接の原因
**Worktree削除時のディレクトリエラー** (Phase 6)

```bash
# 実行コマンド
git worktree remove .worktrees/issue-453

# エラーメッセージ
fatal: Unable to read current working directory: No such file or directory
```

### エラー発生シーケンス

1. **Phase 6開始**: Worktree issue-453内でコマンド実行中
2. **Worktree削除試行**: `git worktree remove .worktrees/issue-453`
3. **ディレクトリ削除**: Bashセッションがいるディレクトリが削除された
4. **Current Working Directory喪失**: Bashが現在ディレクトリを参照できなくなる
5. **連鎖的失敗**: 以降の全Bashコマンドが失敗

### 技術的詳細

**問題のメカニズム**:
- Bashツールは内部で`current working directory`を保持
- Worktree削除により、そのディレクトリが物理的に消失
- Bashが`getcwd()`を実行できなくなる
- 全てのコマンド実行前に`getcwd()`が失敗し、"Error"を返す

---

## 📊 影響範囲

### ✅ 影響を受けなかった機能
- Read tool: ファイルパス指定なので正常動作
- Write tool: 絶対パスで動作するため問題なし
- TodoWrite tool: ファイルシステム非依存
- Glob tool: パターンマッチングのみ

### ❌ 影響を受けた機能
- Bash tool: 全コマンド実行不可
  - `gh` コマンド
  - `git` コマンド
  - `miyabi` コマンド
  - `cd` コマンド
  - 全てのシェルコマンド

---

## 🔧 再現手順

```bash
# 1. Worktree作成
git worktree add .worktrees/test-453 -b test-branch

# 2. Worktree内に移動（Bashセッション）
cd .worktrees/test-453

# 3. Worktreeを削除（別ターミナルまたは同一セッション）
git worktree remove .worktrees/test-453

# 4. 任意のBashコマンド実行
pwd  # Error
ls   # Error
git status  # Error
```

---

## 💡 解決策

### 即時対応（回避策）

**方法1: セッション再起動**
- Claude Codeセッションを再起動
- Bashツールの状態がリセットされる

**方法2: 削除前のディレクトリ移動**
```bash
# Worktree削除前に必ず実行
cd /Users/shunsuke/Dev/miyabi-private

# その後に削除
git worktree remove .worktrees/issue-453
```

### 恒久対策（実装推奨）

#### 対策1: Worktree削除プロトコル標準化
**実装場所**: `crates/miyabi-worktree/src/manager.rs`

```rust
pub async fn safe_remove_worktree(&self, worktree_path: &Path) -> Result<()> {
    // 1. 現在のディレクトリを確認
    let current_dir = std::env::current_dir()?;

    // 2. 削除対象のWorktree内にいるか確認
    if current_dir.starts_with(worktree_path) {
        // 3. メインディレクトリへ移動
        std::env::set_current_dir(&self.base_path)?;
        tracing::warn!("Moved from worktree to main directory before removal");
    }

    // 4. Worktree削除実行
    let output = Command::new("git")
        .args(&["worktree", "remove", worktree_path.to_str().unwrap()])
        .current_dir(&self.base_path)  // 明示的にベースディレクトリを指定
        .output()
        .await?;

    if !output.status.success() {
        return Err(MiyabiError::Unknown(
            String::from_utf8_lossy(&output.stderr).to_string()
        ));
    }

    // 5. Prune
    Command::new("git")
        .args(&["worktree", "prune"])
        .current_dir(&self.base_path)
        .output()
        .await?;

    Ok(())
}
```

#### 対策2: エラー時のディレクトリリカバリー
**実装場所**: Bashツール実行前のチェック（Claude Code側）

```typescript
// 疑似コード
async function executeBash(command: string): Promise<string> {
    try {
        // 1. Current directory健全性チェック
        const cwdCheck = await exec("pwd");
        if (!cwdCheck) {
            // 2. ディレクトリ復旧
            await exec(`cd ${projectRoot}`);
        }

        // 3. コマンド実行
        return await exec(command);
    } catch (error) {
        // 4. エラー時のフォールバック
        await exec(`cd ${projectRoot}`);
        throw error;
    }
}
```

#### 対策3: Worktree削除前の警告
**実装場所**: `miyabi worktree remove`コマンド

```rust
pub async fn remove(&self, issue_number: u64) -> Result<()> {
    let worktree_path = self.get_worktree_path(issue_number);

    // 警告表示
    eprintln!("⚠️  Removing worktree: {}", worktree_path.display());
    eprintln!("⚠️  Ensure you are not in this directory!");

    // 確認プロンプト（オプション）
    if !self.config.force {
        eprint!("Continue? [y/N]: ");
        // ユーザー入力待ち
    }

    self.safe_remove_worktree(&worktree_path).await
}
```

---

## 🧪 テストケース

### 正常系テスト
```bash
# TC-1: メインディレクトリからの削除
cd /Users/shunsuke/Dev/miyabi-private
git worktree remove .worktrees/test
# Expected: Success

# TC-2: safe_remove_worktree使用
miyabi worktree remove 453
# Expected: 自動的にディレクトリ移動後削除
```

### 異常系テスト
```bash
# TC-3: Worktree内からの削除（エラー再現）
cd .worktrees/test
git worktree remove .worktrees/test
# Expected: Error detection + Recovery

# TC-4: 存在しないWorktree削除
miyabi worktree remove 999
# Expected: Graceful error message
```

---

## 📈 予防措置

### コーディング規約追加

**ルール1**: Worktree削除前の必須チェック
```rust
// ❌ Bad
Command::new("git").args(&["worktree", "remove", path]);

// ✅ Good
worktree_manager.safe_remove_worktree(path).await?;
```

**ルール2**: Bashコマンド実行前のディレクトリ確認
```bash
# ❌ Bad
git worktree remove .worktrees/issue-453

# ✅ Good
cd /path/to/main/dir
git worktree remove .worktrees/issue-453
```

### ドキュメント更新

1. **WORKTREE_PROTOCOL.md**: Phase 4に削除手順追加
2. **TROUBLESHOOTING.md**: このエラーケース追加
3. **BACKLOG**: TODO-2として既に記載済み

---

## 🔗 関連情報

**関連TODO**: TODO-2 (Worktree削除プロトコル標準化)
**関連Issue**: #453 (Phase 6エラー)
**関連ドキュメント**:
- BACKLOG_DRY_RUN_IMPROVEMENTS.md
- docs/WORKTREE_PROTOCOL.md

---

## 📝 教訓

### 学んだこと
1. **ディレクトリライフサイクル管理の重要性**: 削除前の位置確認必須
2. **Bashセッション状態の脆弱性**: Current directory喪失で全機能停止
3. **エラーの連鎖**: 1つのエラーが全システムに波及

### 今後の改善
1. ✅ safe_remove_worktree実装（TODO-2）
2. ✅ エラーリカバリー機能追加（TODO-3）
3. ✅ ユーザー警告メッセージ追加

---

## 🚀 推奨アクション

**即座に実行**:
1. Claude Codeセッション再起動（Bash復旧）
2. TODO-2実装開始（Worktree削除プロトコル）

**短期（1-2日）**:
3. safe_remove_worktree実装
4. エラーリカバリー機能追加
5. テストケース作成

**中期（1週間）**:
6. ドキュメント更新
7. CI/CDテスト追加

---

**報告者**: Claude Code
**作成日**: 2025-10-23
**重要度**: P1-High
**ステータス**: 調査完了、対策提案済み
