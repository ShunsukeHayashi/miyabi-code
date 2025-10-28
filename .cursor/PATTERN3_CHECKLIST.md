# Pattern 3 Hybrid Orchestration - 実行チェックリスト

**Version**: 2.0.0 (Worktree Edition)
**Last Updated**: 2025-10-27

このチェックリストは、Pattern 3 Hybrid Orchestrationを安全かつ効果的に実行するための必須手順です。

---

## ✅ Phase 0: 事前チェック（起動前）

### 1. 環境確認
- [ ] **Git状態クリーン**: `git status` で未コミット変更なし
- [ ] **正しいブランチ**: 作業ブランチにいることを確認
- [ ] **Worktree空き確認**: `.worktrees/` ディレクトリに不要なWorktreeなし

```bash
git status
git branch
git worktree list
```

### 2. ブランチ構造確認
- [ ] **Main/Baseブランチ確認**: `main`または`develop`からのブランチか確認
- [ ] **既存実装確認**: 同じファイルを編集する可能性を事前調査
- [ ] **Issue/PR確認**: 関連Issue番号を把握

```bash
git log --oneline --graph --all -10
gh issue list --limit 5
```

### 3. Backgroundコマンド検証
- [ ] **Codex X利用可能**: `codex --version` で確認
- [ ] **Claude Code利用可能**: `claude --version` で確認
- [ ] **コマンドオプション確認**: `--project`等の存在確認

```bash
codex --version
claude --version
codex --help | grep -E "(project|sandbox)"
claude --help | grep -E "(project|exec)"
```

### 4. Issue番号取得
- [ ] **Master Issue番号**: Pattern 3で処理するIssue番号を決定
- [ ] **タスク定義明確化**: Main/Codex X/Claude Code Xの役割分担を明確に

```bash
ISSUE_NUMBER=<Issue番号をここに>
echo "Pattern 3 for Issue #$ISSUE_NUMBER"
```

---

## ✅ Phase 1: Worktree作成

### 1. Codex X用Worktree作成
```bash
git worktree add \
  .worktrees/codex-x-issue-$ISSUE_NUMBER \
  -b feat/codex-x-issue-$ISSUE_NUMBER
```

- [ ] **Worktree作成成功**: エラーなく作成完了
- [ ] **ブランチ作成確認**: `git branch` で新ブランチ確認

### 2. Claude Code X用Worktree作成
```bash
git worktree add \
  .worktrees/claude-x-issue-$ISSUE_NUMBER \
  -b feat/claude-x-issue-$ISSUE_NUMBER
```

- [ ] **Worktree作成成功**: エラーなく作成完了
- [ ] **ブランチ作成確認**: `git branch` で新ブランチ確認

### 3. Worktree一覧確認
```bash
git worktree list
```

- [ ] **3つのWorktree**: Main + Codex X + Claude Code X
- [ ] **正しいパス**: `.worktrees/` 配下に作成されている

---

## ✅ Phase 2: Background Session起動

### 1. Codex X起動
```bash
cd .worktrees/codex-x-issue-$ISSUE_NUMBER
nohup codex exec --sandbox workspace-write "<Codex X Task>" > /tmp/codex_exec_log.txt 2>&1 &
CODEX_PID=$!
echo "Codex X PID: $CODEX_PID"
cd ../..
```

- [ ] **起動成功**: PIDが表示される
- [ ] **プロセス確認**: `ps -p $CODEX_PID` で実行中
- [ ] **ログ確認**: `tail /tmp/codex_exec_log.txt` でエラーなし

### 2. Claude Code X起動
```bash
cd .worktrees/claude-x-issue-$ISSUE_NUMBER
nohup claude code "<Claude Code X Task>" > /tmp/claude-code-x-log.txt 2>&1 &
CLAUDE_PID=$!
echo "Claude Code X PID: $CLAUDE_PID"
cd ../..
```

- [ ] **起動成功**: PIDが表示される
- [ ] **プロセス確認**: `ps -p $CLAUDE_PID` で実行中
- [ ] **ログ確認**: `tail /tmp/claude-code-x-log.txt` でエラーなし

### 3. PID記録
```bash
# PIDをファイルに保存（セッション継続用）
echo $CODEX_PID > /tmp/pattern3_codex_pid.txt
echo $CLAUDE_PID > /tmp/pattern3_claude_pid.txt
```

- [ ] **PIDファイル作成**: `/tmp/pattern3_*.txt` に保存

---

## ✅ Phase 3: Main Task実行 + 進捗監視

### 1. Main Task実行
- [ ] **Main Worktreeで作業**: `pwd` で確認（Worktree外）
- [ ] **Background干渉なし**: Mainは独立して作業可能

### 2. 定期的な進捗監視（5-10分毎）
```bash
# Codex X進捗確認
ps -p $CODEX_PID && echo "✅ Codex X running" || echo "⚠️ Codex X finished/failed"

# Claude Code X進捗確認
ps -p $CLAUDE_PID && echo "✅ Claude Code X running" || echo "⚠️ Claude Code X finished/failed"

# ログ確認
echo "=== Codex X Log ==="
tail -20 /tmp/codex_exec_log.txt
echo "=== Claude Code X Log ==="
tail -20 /tmp/claude-code-x-log.txt
```

### 3. タイムアウトチェック
- [ ] **30分経過確認**: 長時間実行の場合、手動kill検討
- [ ] **ハング検出**: ログが更新されない場合、手動確認

```bash
# 30分タイムアウト例
if ps -p $CODEX_PID > /dev/null; then
  echo "⚠️ Codex X still running after 30min - consider manual check"
fi
```

---

## ✅ Phase 4: Background完了確認

### 1. 完了待機
```bash
wait $CODEX_PID
CODEX_STATUS=$?
echo "Codex X exit status: $CODEX_STATUS"

wait $CLAUDE_PID
CLAUDE_STATUS=$?
echo "Claude Code X exit status: $CLAUDE_STATUS"
```

- [ ] **Codex X完了**: exit status 0 = 成功
- [ ] **Claude Code X完了**: exit status 0 = 成功

### 2. 成果物確認
```bash
# Codex X成果物確認
cd .worktrees/codex-x-issue-$ISSUE_NUMBER
git status
git log --oneline -5
cd ../..

# Claude Code X成果物確認
cd .worktrees/claude-x-issue-$ISSUE_NUMBER
git status
git log --oneline -5
cd ../..
```

- [ ] **Codex X変更確認**: `git diff` で内容確認
- [ ] **Claude Code X変更確認**: `git diff` で内容確認

### 3. テスト実行（オプション）
```bash
# Codex X Worktreeでテスト
cd .worktrees/codex-x-issue-$ISSUE_NUMBER
cargo test --package <package> --test <test>
cd ../..
```

- [ ] **Codex Xテストパス**: テスト成功
- [ ] **Claude Code Xビルド成功**: 必要に応じてビルド確認

---

## ✅ Phase 5: 選択的統合

### 1. Codex X統合判定
```bash
if [ $CODEX_STATUS -eq 0 ]; then
  echo "✅ Codex X成功 - マージします"
  git merge --no-ff feat/codex-x-issue-$ISSUE_NUMBER \
    -m "feat(codex-x): <task description>

🤖 Generated with Codex X via Pattern 3

Co-Authored-By: Codex X <codex@openai.com>"

  # Worktree削除
  git worktree remove .worktrees/codex-x-issue-$ISSUE_NUMBER
  git branch -d feat/codex-x-issue-$ISSUE_NUMBER
else
  echo "❌ Codex X失敗 - Worktree保持（手動確認）"
  echo "Worktree: .worktrees/codex-x-issue-$ISSUE_NUMBER"
fi
```

- [ ] **マージ成功/スキップ**: 適切に判定
- [ ] **Worktree削除/保持**: 適切に処理

### 2. Claude Code X統合判定
```bash
if [ $CLAUDE_STATUS -eq 0 ]; then
  echo "✅ Claude Code X成功 - マージします"
  git merge --no-ff feat/claude-x-issue-$ISSUE_NUMBER \
    -m "feat(claude-x): <task description>

🤖 Generated with Claude Code X via Pattern 3

Co-Authored-By: Claude <noreply@anthropic.com>"

  # Worktree削除
  git worktree remove .worktrees/claude-x-issue-$ISSUE_NUMBER
  git branch -d feat/claude-x-issue-$ISSUE_NUMBER
else
  echo "❌ Claude Code X失敗 - Worktree保持（手動確認）"
  echo "Worktree: .worktrees/claude-x-issue-$ISSUE_NUMBER"
fi
```

- [ ] **マージ成功/スキップ**: 適切に判定
- [ ] **Worktree削除/保持**: 適切に処理

### 3. 統合後テスト
```bash
# Main Worktreeで統合テスト
cargo test --all
cargo clippy -- -D warnings
```

- [ ] **統合テストパス**: 全テスト成功
- [ ] **Clippy警告なし**: コード品質確認

---

## ✅ Phase 6: クリーンアップ

### 1. 一時ファイル削除
```bash
rm -f /tmp/pattern3_*.txt
rm -f /tmp/codex_exec_log.txt
rm -f /tmp/claude-code-x-log.txt
```

- [ ] **一時ファイル削除**: 不要ファイル削除

### 2. Worktree最終確認
```bash
git worktree list
```

- [ ] **Mainのみ**: Background Worktreeが削除されている（または意図的に保持）

### 3. Pattern 3レポート作成
```bash
# レポートファイル生成
cat > /tmp/pattern3_final_report_$(date +%Y%m%d).md <<EOF
# Pattern 3 Final Report

**Date**: $(date)
**Issue**: #$ISSUE_NUMBER

## Results
- Main Task: ✅ Completed
- Codex X: $([ $CODEX_STATUS -eq 0 ] && echo "✅ Success" || echo "❌ Failed")
- Claude Code X: $([ $CLAUDE_STATUS -eq 0 ] && echo "✅ Success" || echo "❌ Failed")

## Commits
$(git log --oneline -5)
EOF
```

- [ ] **レポート作成**: `/tmp/pattern3_final_report_*.md` に保存

---

## 🚨 トラブルシューティング

### Worktree作成失敗
```bash
# エラー: fatal: 'xxx' is already checked out at 'yyy'
git worktree prune
git worktree add .worktrees/codex-x-issue-$ISSUE_NUMBER -b feat/codex-x-issue-$ISSUE_NUMBER
```

### Background Session起動失敗
```bash
# コマンドオプション確認
codex --help | grep sandbox
claude --help | grep exec

# 手動起動テスト
codex exec --sandbox workspace-write "echo test"
```

### 長時間実行（ハング）
```bash
# プロセスkill
kill $CODEX_PID
kill $CLAUDE_PID

# Worktree手動確認
cd .worktrees/codex-x-issue-$ISSUE_NUMBER
git status
git diff
```

### マージ競合
```bash
# 手動マージ
git merge feat/codex-x-issue-$ISSUE_NUMBER
# 競合解決
git add .
git commit -m "Merge feat/codex-x-issue-$ISSUE_NUMBER with conflict resolution"
```

---

## 📋 クイックリファレンス

### 必須コマンド
```bash
# Worktree作成
git worktree add .worktrees/<name> -b <branch>

# Background起動
nohup <command> > /tmp/<log>.txt 2>&1 &

# 進捗確認
ps -p $PID
tail -f /tmp/<log>.txt

# 完了待機
wait $PID
echo $?  # exit status

# マージ
git merge --no-ff <branch>

# Worktree削除
git worktree remove .worktrees/<name>
git branch -d <branch>
```

---

**このチェックリストに従うことで、Pattern 3 Hybrid Orchestrationを安全かつ効果的に実行できます。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
