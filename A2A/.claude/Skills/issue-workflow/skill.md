# Issue Workflow Skill

GitHub Issueの完全なワークフローを自動化します。

## Overview

Issue作成から実装、レビュー、マージ、デプロイまでの完全なワークフローを管理します。

## Usage

```
/skill issue-workflow
```

## Workflow Stages

### Stage 1: Issue Creation (見付郎)

```bash
# Issue作成
gh issue create \
  --title "feat: ${FEATURE_DESCRIPTION}" \
  --body "${ISSUE_BODY}" \
  --label "enhancement"

# 指揮郎に報告
a2a_completed "見付郎" "Issue #XXX 作成完了"

# 楓に実装依頼
a2a_relay "見付郎" "楓" "実装依頼" "Issue #XXX"
```

### Stage 2: Implementation (楓)

```bash
# ブランチ作成
git checkout -b feature/issue-XXX

# 実装後、コミット
git add .
git commit -m "feat(scope): implement XXX

Resolves #XXX"

# 指揮郎に報告
a2a_completed "楓" "Issue #XXX 実装完了"

# 桜にレビュー依頼
a2a_relay "楓" "桜" "レビュー依頼" "feature/issue-XXX"
```

### Stage 3: Review (桜)

```bash
# コードレビュー実行
cargo clippy
cargo test
npm run lint

# レビュー結果
if [ $REVIEW_OK ]; then
  a2a_completed "桜" "レビュー完了 - LGTM"
  a2a_relay "桜" "椿" "承認" "PR作成可"
else
  a2a_error "桜" "レビュー失敗"
  a2a_relay "桜" "楓" "修正依頼" "指摘事項..."
fi
```

### Stage 4: PR & Merge (椿)

```bash
# PR作成
gh pr create \
  --title "feat: ${FEATURE_DESCRIPTION}" \
  --body "Resolves #XXX" \
  --base main

# マージ
gh pr merge --squash

# 指揮郎に報告
a2a_completed "椿" "PR #YYY マージ完了"

# 牡丹にデプロイ依頼
a2a_relay "椿" "牡丹" "デプロイ依頼" "main更新"
```

### Stage 5: Deploy (牡丹)

```bash
# デプロイ実行
npm run deploy

# ヘルスチェック
curl -s https://app.example.com/health

# 結果報告
if [ $DEPLOY_OK ]; then
  a2a_completed "牡丹" "デプロイ成功"
else
  a2a_error "牡丹" "デプロイ失敗 - ロールバック中"
fi
```

## Monitoring Progress

```bash
# 全エージェントの状態確認
for pane in %18 %19 %20 %21 %22 %23; do
  echo "=== Pane $pane ==="
  tmux capture-pane -t $pane -p | tail -3
done
```

## Rollback Procedure

問題発生時のロールバック:

```bash
# デプロイロールバック
npm run rollback

# PRリバート
gh pr create --title "revert: PR #YYY" --body "Reverts #YYY"

# 指揮郎に緊急報告
a2a_error "牡丹" "緊急ロールバック実行"
```
