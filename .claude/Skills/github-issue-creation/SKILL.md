---
name: GitHub Issue Creation
description: GitHub Issueを自動作成するスキル。タスク分析、Issue形式生成、ラベル付け、優先度設定を行い、GitHub CLIまたはAPIで起票する。コードベース分析から自動的にIssueを生成可能。
allowed-tools: Read, Grep, Glob, Bash, Write
---

# 🎫 GitHub Issue Creation Skill

**Version**: 1.0.0
**Last Updated**: 2026-01-09
**Priority**: ⭐⭐⭐⭐ (P1 Level)
**Purpose**: コードベース分析からGitHub Issueを自動生成・起票

---

## 📋 概要

コードベースのTODO/FIXME/XXXコメント、未実装機能、改善ポイントを分析し、
GitHub Issueとして自動起票するスキル。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| Issue作成依頼 | "create issues", "issueを起票して" |
| タスク計画 | "plan tasks", "タスクをプランニング" |
| TODO分析 | "find TODOs", "TODO一覧" |
| 改善提案 | "suggest improvements" |

---

## 🚀 P1: 実行フロー

### Phase 1: コードベース分析

```bash
# TODO/FIXME/XXXコメント検索
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.rs" crates/

# 未実装関数検索
grep -r "todo!()\|unimplemented!()" --include="*.rs" crates/
```

**分析対象:**
- `TODO:` - 実装予定の機能
- `FIXME:` - 修正が必要な箇所
- `XXX:` - 要注意・問題のある箇所
- `HACK:` - 一時的な対処
- `todo!()` / `unimplemented!()` - Rust未実装マクロ

### Phase 2: Issue形式生成

各発見項目に対して以下を決定:

| 項目 | 決定基準 |
|------|---------|
| **Title** | `type(scope): description` 形式 |
| **Priority** | 影響範囲・緊急度から判定 |
| **Type** | feat/fix/refactor/perf/docs |
| **Labels** | Miyabi 57ラベルシステムから選択 |
| **Estimated** | コード複雑度から推定 |

### Phase 3: Issue起票

#### 方法1: gh CLI（推奨）

```bash
gh issue create \
  --repo "ShunsukeHayashi/miyabi-private" \
  --title "feat(scope): タイトル" \
  --body "## Summary
説明...

## Tasks
- [ ] タスク1
- [ ] タスク2

## References
- \`file.rs:123\`" \
  --label "✨ type:feature" \
  --label "📊 priority:P2-Medium"
```

#### 方法2: GitHub API（gh CLI不可時）

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{
    "title": "feat(scope): タイトル",
    "body": "## Summary\n...",
    "labels": ["type:feature", "priority:P2-Medium"]
  }'
```

#### 方法3: スクリプト生成（オフライン時）

ローカル環境で実行可能なスクリプトを生成:

```bash
# scripts/create-planned-issues.sh を生成
chmod +x scripts/create-planned-issues.sh
./scripts/create-planned-issues.sh
```

---

## 📊 P2: Issue テンプレート

### Feature Issue

```markdown
## Summary
[機能の概要を1-2文で説明]

## Current State
[現在の状態・問題点]

## Tasks
- [ ] タスク1
- [ ] タスク2
- [ ] タスク3

## References
- `path/to/file.rs:line`

## Estimated Duration
X-Y hours

## Priority
P1/P2/P3 - High/Medium/Low
```

### Bug Issue

```markdown
## Summary
[バグの概要]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Expected: ...
4. Actual: ...

## Root Cause
[原因分析]

## Fix Plan
- [ ] 修正タスク

## References
- `path/to/file.rs:line`
```

### Refactor Issue

```markdown
## Summary
[リファクタの目的]

## Current Problems
- 問題1
- 問題2

## Proposed Solution
[提案する解決策]

## Tasks
- [ ] タスク

## Impact
- Affected files: X
- Risk level: Low/Medium/High
```

---

## 🏷️ P3: ラベル選択ガイド

### TYPE（必須・1個）

| キーワード | ラベル |
|-----------|--------|
| 新機能追加 | `✨ type:feature` |
| バグ修正 | `🐛 type:bug` |
| リファクタ | `🔧 type:refactor` |
| パフォーマンス | `⚡ type:performance` |
| ドキュメント | `📚 type:docs` |
| テスト | `🧪 type:test` |
| デプロイ | `🚀 type:deployment` |

### PRIORITY（必須・1個）

| 条件 | ラベル |
|------|--------|
| セキュリティ・本番障害 | `🔥 priority:P0-Critical` |
| 主要機能・重大バグ | `⚠️ priority:P1-High` |
| 通常機能・標準改善 | `📊 priority:P2-Medium` |
| 軽微改善 | `📝 priority:P3-Low` |

### IMPACT（推奨）

| 条件 | ラベル |
|------|--------|
| 全ユーザー影響 | `📊 impact:Critical` |
| 主要機能影響 | `📊 impact:High` |
| 一部機能影響 | `📊 impact:Medium` |
| 軽微影響 | `📊 impact:Low` |

---

## ⚡ P4: 一括Issue作成

### バッチスクリプト構造

```bash
#!/bin/bash
# create-planned-issues.sh

REPO="ShunsukeHayashi/miyabi-private"

# Issue 1
gh issue create --repo "$REPO" \
  --title "..." \
  --body "..." \
  --label "..."

# Issue 2
# ...
```

### 実行方法

```bash
# 1. スクリプトに実行権限付与
chmod +x scripts/create-planned-issues.sh

# 2. gh認証確認
gh auth status

# 3. 実行
./scripts/create-planned-issues.sh
```

---

## 📁 生成ファイル

| ファイル | 用途 |
|---------|------|
| `ISSUES/planned-issues-YYYY-MM-DD.md` | Issue計画ドキュメント |
| `scripts/create-planned-issues.sh` | 一括作成スクリプト |

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| TODO分析 | 全cratesスキャン完了 |
| Issue形式 | テンプレート準拠 |
| ラベル選択 | TYPE+PRIORITY必須 |
| 優先度設定 | 影響度に基づく |
| 見積もり | 時間単位で記載 |
| 起票/スクリプト生成 | 実行可能状態 |

---

## 🔗 関連Skills

- **Issue Analysis**: ラベル推論詳細
- **Git Workflow**: Issue解決後のコミット
- **Agent Execution**: 自動実行

---

## 📝 使用例

### 例1: TODOからIssue作成

```
User: "crates/のTODOからIssueを作成して"

Claude:
1. grep -r "TODO" crates/ でTODO抽出
2. 各TODOを分析・分類
3. Issue形式に変換
4. スクリプト生成 or 直接起票
```

### 例2: 改善提案からIssue

```
User: "コードレビューの改善点をIssueにして"

Claude:
1. 指摘事項を整理
2. 優先度・影響度を判定
3. Issue形式に変換
4. ラベル付与して起票
```

---

*Generated by Miyabi GitHub Issue Creation Skill v1.0.0*
