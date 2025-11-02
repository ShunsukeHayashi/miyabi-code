# Codex PR Review Instructions

## Task: Review and Approve All Open Pull Requests

### Context
- Repository: miyabi-private
- Current open PRs: 19 件
- Goal: レビュー実施後、承認可能なPRを承認、問題があるPRには改善提案を提示

### Review Criteria
1. **Code Quality**
   - Rust best practices (2021 Edition)
   - Error handling (Result, Option)
   - Tests coverage
   - Documentation
   - Clippy warnings

2. **Architecture**
   - Cargo workspace整合性
   - Entity-Relation Model準拠 (12 Entities, 27 Relations)
   - Worktree isolation原則
   - MCP統合考慮

3. **Label System**
   - 53 Label体系準拠
   - Priority/Status/Type適切性

4. **CI/CD**
   - GitHub Actions成功
   - Tests passing
   - Build successful

### Action for Each PR
1. PRの詳細を取得 (`gh pr view <number>`)
2. 変更内容をレビュー (`gh pr diff <number>`)
3. CI状態確認 (`gh pr checks <number>`)
4. 以下のいずれかを実行:
   - **承認**: `gh pr review <number> --approve --body "LGTM - [理由]"`
   - **変更要求**: `gh pr review <number> --request-changes --body "[具体的な改善点]"`
   - **コメント**: `gh pr review <number> --comment --body "[質問・提案]"`

### Priority Order
1. Dependabot PRs (625, 626, etc.) - 自動依存関係更新
2. Feature PRs with high priority labels
3. Bug fix PRs
4. Documentation PRs
5. Other PRs

### Output Format
各PRについて以下をMarkdownで出力:

```markdown
## PR #<number>: <title>

**Branch**: <branch>
**Status**: <CI status>
**Review Decision**: [APPROVE / REQUEST_CHANGES / COMMENT]

### Summary
<変更内容の要約>

### Review Notes
- ✅ <承認ポイント>
- ⚠️ <改善提案>
- ❌ <問題点>

### Action Taken
<実行したコマンド>
```

### 開始コマンド
```bash
# PR一覧取得
gh pr list --state open --json number,title,headRefName,state,isDraft,mergeable

# 各PRを順次レビュー (例: PR #634から開始)
for pr in 634 633 631 630 626 625 623 622 607 604 603 602 527 518 517 516 514 502 491; do
  echo "=== Reviewing PR #$pr ==="
  gh pr view $pr
  gh pr diff $pr | head -200  # 最初の200行
  gh pr checks $pr
  # レビュー実施...
done
```

## Important Notes
- Draft PRは承認しない (review commentのみ)
- Test失敗PRは承認しない
- Breaking changesは慎重にレビュー
- Security関連は特に注意深くレビュー

