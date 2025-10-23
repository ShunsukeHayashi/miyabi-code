# Agent Execution Context

## Issue Information

**Issue Number**: #472
**Issue Title**: [P4-003] チュートリアル10個作成
**Issue URL**: https://github.com/customer-cloud/miyabi-private/issues/472
**Labels**: 📥 state:pending, ⚠️ priority:P1-High, 📚 type:docs

## Task Information

**Task ID**: tutorial-01
**Task Title**: Getting Started チュートリアル
**Task Type**: docs
**Priority**: P1-High
**Estimated Duration**: 120 minutes

**Description**:
Miyabiの基本的なセットアップとインストール手順を解説するチュートリアルを作成する。

**Dependencies**: なし（Level 0タスク）

## Agent Information

**Agent Type**: CodeGenAgent
**Agent Status**: executing
**Prompt Path**: `.claude/agents/prompts/coding/codegen-agent-prompt.md`

## Worktree Information

**Worktree Path**: `.worktrees/tutorial-01`
**Branch**: `tutorial-01-getting-started`
**Session ID**: `tutorial-01-session`
**Created At**: 2025-10-24T00:00:00Z

## Execution Instructions

### 1. 作成するファイル

`docs/tutorials/01-getting-started.md`

### 2. チュートリアルの構成

- **セクション1: はじめに** - Miyabiの概要と特徴
- **セクション2: 前提条件** - 必要な環境（Rust 1.82+, Git, GitHub CLI等）
- **セクション3: インストール** - Cargo経由でのインストール手順
- **セクション4: 初期設定** - miyabi init コマンドの使い方
- **セクション5: 動作確認** - miyabi status コマンドで確認
- **セクション6: 次のステップ** - 他のチュートリアルへの導線

### 3. 品質基準

- [ ] 全セクションが完結している
- [ ] コマンド例が実行可能
- [ ] スクリーンショットまたはコード例が含まれる
- [ ] 初心者でも理解できる説明
- [ ] 他のチュートリアルへのリンク

### 4. 完了条件

- `docs/tutorials/01-getting-started.md` が作成されている
- 全セクションが記述されている
- コード例が動作確認済み
- Git commitが完了している

## Related Files

- `CLAUDE.md` - プロジェクト全体のコンテキスト
- `README.md` - 既存のREADME（参考）
- `.claude/QUICK_START.md` - 既存のクイックスタートガイド（参考）

---

**Water Spider Orchestrator** による自動生成
**Execution Date**: 2025-10-24
