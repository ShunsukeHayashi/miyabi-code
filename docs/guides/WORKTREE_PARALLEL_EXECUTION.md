# Git Worktree並列実行ガイド

**担当**: 開発者B
**日付**: 2025-10-22
**Issue**: #381 - ドキュメント更新

---

## 概要

MiyabiはGit Worktreeを使った並列実行アーキテクチャを採用しています。
複数の開発者が同時に異なるIssueに取り組むことができます。

## なぜWorktreeを使うのか？

### 従来の問題

```bash
# 従来のブランチ切り替え（問題あり）
git checkout main
git checkout -b feature/issue-270
# 作業中...

# 別の作業をしたい！でも前の作業が途中...
git stash  # 一時退避（めんどう！）
git checkout -b feature/issue-271
```

### Miyabiの解決策

```bash
# Worktreeで独立した作業部屋を作る
git worktree add .worktrees/issue-270 -b feature/issue-270
git worktree add .worktrees/issue-271 -b feature/issue-271

# 2つの作業が完全に独立！
cd .worktrees/issue-270  # Issue #270の作業
cd .worktrees/issue-271  # Issue #271の作業
```

## 実際の使い方

### 1. Worktree作成

```bash
# 開発者A: Issue #380を担当
git worktree add .worktrees/dev-a-issue-380 -b feature/dev-a-issue-380

# 開発者B: Issue #381を担当
git worktree add .worktrees/dev-b-issue-381 -b feature/dev-b-issue-381
```

### 2. 並列作業

**ターミナル1（開発者A）**:
```bash
cd .worktrees/dev-a-issue-380
# API実装
vim docs/API_DEMO_IMPLEMENTATION.md
git add .
git commit -m "feat(api): implement REST API endpoints"
```

**ターミナル2（開発者B）**:
```bash
cd .worktrees/dev-b-issue-381
# ドキュメント更新
vim docs/WORKTREE_PARALLEL_EXECUTION.md
git add .
git commit -m "docs: add Worktree parallel execution guide"
```

### 3. Worktree確認

```bash
# すべてのWorktreeを表示
git worktree list

# 出力例:
# /path/to/miyabi-private                    35e9c22 [main]
# /path/to/.worktrees/dev-a-issue-380        35e9c22 [feature/dev-a-issue-380]
# /path/to/.worktrees/dev-b-issue-381        35e9c22 [feature/dev-b-issue-381]
```

### 4. mainにマージ

```bash
# 開発者Aの作業をマージ
git checkout main
git merge feature/dev-a-issue-380

# 開発者Bの作業をマージ
git merge feature/dev-b-issue-381

# 不要なWorktreeを削除
git worktree remove .worktrees/dev-a-issue-380
git worktree remove .worktrees/dev-b-issue-381
```

## Worktreeのメリット

### ✅ 並列実行の真の実現
- 各IssueがWorktreeで独立
- コンフリクトの最小化

### ✅ 簡単なロールバック
- Worktree単位で破棄可能
- `git worktree remove`で即座に削除

### ✅ デバッグが容易
- 各Worktreeで独立したログ
- 問題のあるWorktreeだけを調査

### ✅ スケーラビリティ
- Worktree数に制限なし
- 10個でも20個でもOK

## Miyabi Agent統合

```bash
# CoordinatorAgentで自動Worktree作成
miyabi agent run coordinator --issues 380,381 --concurrency 2

# 内部で起こること:
# 1. Issue #380用のWorktreeを作成
# 2. Issue #381用のWorktreeを作成
# 3. 各WorktreeでClaude Codeを実行
# 4. コード生成・テスト・レビューを自動化
# 5. 完了後にmainブランチにマージ
```

## ディレクトリ構造

```
miyabi-private/
├── .git/                  # Gitリポジトリ
├── .worktrees/            # Worktree用ディレクトリ
│   ├── dev-a-issue-380/   # 開発者Aの作業部屋
│   │   ├── docs/
│   │   ├── src/
│   │   └── ...
│   └── dev-b-issue-381/   # 開発者Bの作業部屋
│       ├── docs/
│       ├── src/
│       └── ...
├── docs/                  # メインの作業部屋
├── src/
└── ...
```

## トラブルシューティング

### Worktreeが残ったままの場合

```bash
# すべてのWorktreeを確認
git worktree list

# 不要なWorktreeを削除
git worktree remove .worktrees/issue-380

# すべてのstaleなWorktreeをクリーンアップ
git worktree prune
```

### 並列実行数の調整

```bash
# 低スペックマシン: concurrency=1
miyabi agent run coordinator --issues 380 --concurrency 1

# 高スペックマシン: concurrency=5
miyabi agent run coordinator --issues 380,381,382,383,384 --concurrency 5
```

## まとめ

Git Worktreeを使うことで、複数の開発者が同時に異なるIssueに取り組むことができます。
Miyabiはこのアーキテクチャを最大限に活用し、並列実行の真の実現を目指しています。

---

**詳細**: [docs/WORKTREE_PROTOCOL.md](../WORKTREE_PROTOCOL.md)

**開発者B** より
