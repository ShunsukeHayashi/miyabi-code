# Miyabi 作業優先順フロー

標準化された作業フローと優先順位のガイドです。

---

## 作業開始前チェックリスト

```bash
# 1. 最新コードを取得
git fetch origin
git pull origin main

# 2. 現在のWorktree確認
git worktree list

# 3. アクティブなIssue確認
gh issue list --state open --assignee @me
```

---

## 優先順位レベル

### 🔴 最優先: PRのmainマージ

**新規作業を開始する前に、必ず以下を確認・実行すること:**

```bash
# 1. 承認済みPRの確認
gh pr list --state open --search "review:approved"

# 2. 承認済みPRをマージ
gh pr merge <pr_number> --merge

# 3. mainを最新化
git checkout main
git pull origin main
```

> ⚠️ **原則**: 承認済みPRが存在する場合、新規作業より先にマージを優先

---

### 作業優先順位

| 順位 | タスク | 対応 |
|------|--------|------|
| **1** | 承認済みPRのマージ | 即時実行 |
| **2** | P0 (critical) | 即時対応 |
| **3** | P1 (high-priority) | 24時間以内 |
| **4** | P2 (medium-priority) | 1週間以内 |
| **5** | P3 (low-priority) | 次スプリント |

### Issueラベル対応

| レベル | ラベル | 説明 |
|--------|--------|------|
| **P0** | `critical` | 本番障害、セキュリティ |
| **P1** | `high-priority` | 重要機能のバグ |
| **P2** | `medium-priority` | 通常のバグ・機能改善 |
| **P3** | `low-priority` | Nice to have |

---

## 標準作業フロー

### Phase 1: 準備 (5分)

```bash
# 1-1. Issue確認
gh issue view <issue_number>

# 1-2. Worktree作成 (Miyabi Protocol)
git worktree add .worktrees/issue-<number> -b worktree/issue-<number>

# 1-3. 作業ディレクトリへ移動
cd .worktrees/issue-<number>
```

### Phase 2: 実装 (メイン作業)

```bash
# 2-1. コンテキストファイル確認
cat EXECUTION_CONTEXT.md

# 2-2. コーディング
# ... 実装作業 ...

# 2-3. テスト実行
cargo test --package <対象crate>

# 2-4. Clippy確認
cargo clippy --package <対象crate>
```

### Phase 3: コミット

```bash
# 3-1. 変更確認
git status
git diff

# 3-2. ステージング
git add .

# 3-3. コミット (日本語規約準拠)
git commit -m "feat(scope): 〇〇機能を追加

Closes #<issue_number>"
```

### Phase 4: レビュー準備

```bash
# 4-1. プッシュ
git push -u origin worktree/issue-<number>

# 4-2. PR作成
gh pr create --title "feat(scope): 〇〇機能を追加" --body "
## 概要
...

## 変更内容
...

## テスト
...

Closes #<issue_number>
"
```

### Phase 5: マージ & クリーンアップ

```bash
# 5-1. メインブランチへ戻る
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# 5-2. マージ
git checkout main
git merge worktree/issue-<number>
git push origin main

# 5-3. Worktree削除
git worktree remove .worktrees/issue-<number>
git branch -d worktree/issue-<number>
```

---

## タスクタイプ別フロー

### バグ修正 (fix)

```
1. 問題の再現確認
2. 原因特定
3. 修正実装
4. 回帰テスト追加
5. 動作確認
6. コミット & PR
```

### 新機能 (feat)

```
1. 要件確認
2. 設計検討
3. 実装
4. ユニットテスト追加
5. ドキュメント更新
6. 統合テスト
7. コミット & PR
```

### リファクタリング (refactor)

```
1. 対象コード分析
2. テストカバレッジ確認
3. リファクタリング実施
4. 全テスト実行
5. パフォーマンス確認
6. コミット & PR
```

### ドキュメント (docs)

```
1. 対象範囲確認
2. 内容作成/更新
3. リンク確認
4. プレビュー確認
5. コミット & PR
```

---

## 並列作業ルール

### 最大同時Worktree数

| 環境 | 推奨数 | 最大数 |
|------|--------|--------|
| MacBook (M1 Max) | 3 | 5 |
| EC2 (MUGEN) | 5 | 10 |

### 優先順位に基づく作業順

```
P0 (critical)     → 他作業を中断して即対応
P1 (high)         → 現在の作業完了後に対応
P2 (medium)       → キューに追加
P3 (low)          → スプリント計画で検討
```

---

## 日次ルーティン

### 朝 (作業開始時)

```bash
# 1. コード同期
git fetch --all
git pull origin main

# 2. Issue確認
gh issue list --state open --assignee @me --label "priority/high"

# 3. 本日の作業計画
./scripts/git_work_logger.sh summary
```

### 夜 (作業終了時)

```bash
# 1. 未コミットの確認
git status

# 2. 日次サマリー生成
./scripts/git_work_logger.sh summary

# 3. Worktreeクリーンアップ
git worktree prune
```

---

## エスカレーションルール

### P0発生時

1. 現在の作業をstash
2. mainブランチに戻る
3. P0用Worktree作成
4. 即時対応
5. 完了後、元の作業に戻る

```bash
# 現在の作業を保存
git stash push -m "WIP: 作業中断 - P0対応"

# mainへ戻る
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
git checkout main
git pull

# P0対応
git worktree add .worktrees/issue-<p0_number> -b worktree/issue-<p0_number>
cd .worktrees/issue-<p0_number>
# ... P0対応 ...

# 元の作業に戻る
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.worktrees/issue-<original>
git stash pop
```

---

## コマンドエイリアス

```bash
# .zshrcに追加推奨
alias mwt-create='git worktree add .worktrees/issue-$1 -b worktree/issue-$1'
alias mwt-list='git worktree list'
alias mwt-remove='git worktree remove .worktrees/issue-$1'
alias mwt-prune='git worktree prune'

alias mlog-summary='./scripts/git_work_logger.sh summary'
alias mlog-complete='./scripts/git_work_logger.sh complete'
```

---

## チェックポイント

### コミット前

- [ ] テストが通る
- [ ] Clippyの警告がない
- [ ] コミットメッセージが規約に準拠
- [ ] Issue番号が含まれている

### PR作成前

- [ ] ブランチが最新のmainとマージ済み
- [ ] 全テストが通る
- [ ] ドキュメントが更新されている
- [ ] PR説明が十分

### マージ前

- [ ] レビュー承認済み
- [ ] CIが通っている
- [ ] コンフリクトがない

---

## まとめ

```
準備 → 実装 → テスト → コミット → PR → マージ → クリーンアップ
```

このフローを守ることで、品質の高い効率的な開発が可能になります。
