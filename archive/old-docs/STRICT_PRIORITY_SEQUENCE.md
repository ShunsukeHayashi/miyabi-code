# Miyabi DevOPS 厳格優先順位シーケンス

**判断の余地なし。例外なし。必ずこの順序で実行。**

---

## 絶対優先順位 (Absolute Priority Sequence)

```
┌─────────────────────────────────────────────────┐
│  STEP 1: 承認済みPRマージ                        │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 2: CIエラー修正                            │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 3: P0 (Critical) Issue対応                │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 4: レビュー待ちPRのレビュー実施             │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 5: P1 (High) Issue対応                    │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 6: P2 (Medium) Issue対応                  │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 7: P3 (Low) Issue対応                     │
│  ↓ なければ次へ                                  │
├─────────────────────────────────────────────────┤
│  STEP 8: 技術的負債解消                          │
└─────────────────────────────────────────────────┘
```

---

## 実行ルール（例外なし）

### RULE 1: 上位ステップが存在する限り、下位ステップに進んではならない

```
❌ 禁止: P1 Issueがあるのに、P2 Issueに着手
❌ 禁止: 承認済みPRがあるのに、新規Issue作業開始
❌ 禁止: CIが壊れているのに、新機能開発
```

### RULE 2: 各ステップは完了するまで次に進まない

```
❌ 禁止: PRマージを途中で中断して別作業
❌ 禁止: P0対応中に「後で戻る」と言って別作業
```

### RULE 3: 並列作業は同一優先度内のみ許可

```
✅ 許可: P2 Issue #100 と P2 Issue #101 を並列実行
❌ 禁止: P1 Issue #50 と P2 Issue #100 を並列実行
```

---

## 各ステップの判定基準

### STEP 1: 承認済みPRマージ

**判定コマンド:**
```bash
gh pr list --state open --search "review:approved" --json number | jq length
```

**判定:**
- 結果 > 0 → **このステップを実行**
- 結果 = 0 → 次のステップへ

**実行:**
```bash
gh pr list --state open --search "review:approved" --json number --jq '.[].number' | while read pr; do
    gh pr merge $pr --merge
done
git checkout main && git pull origin main
```

---

### STEP 2: CIエラー修正

**判定コマンド:**
```bash
gh run list --status failure --limit 1 --json databaseId | jq length
```

**判定:**
- 結果 > 0 → **このステップを実行**
- 結果 = 0 → 次のステップへ

**実行:**
1. 失敗したワークフロー特定
2. エラー原因調査
3. 修正コミット
4. CI再実行確認

---

### STEP 3: P0 (Critical) Issue対応

**判定コマンド:**
```bash
gh issue list --state open --label "priority/critical" --json number | jq length
```

**判定:**
- 結果 > 0 → **このステップを実行**
- 結果 = 0 → 次のステップへ

**実行:**
```bash
issue=$(gh issue list --state open --label "priority/critical" --json number --jq '.[0].number')
mwork-start $issue
```

---

### STEP 4: レビュー待ちPRのレビュー

**判定コマンド:**
```bash
gh pr list --state open --search "review:required" --json number | jq length
```

**判定:**
- 結果 > 0 → **このステップを実行**
- 結果 = 0 → 次のステップへ

**実行:**
1. PRコードレビュー
2. コメント or 承認

---

### STEP 5: P1 (High) Issue対応

**判定コマンド:**
```bash
gh issue list --state open --label "priority/high" --json number | jq length
```

**判定:**
- 結果 > 0 → **このステップを実行**
- 結果 = 0 → 次のステップへ

---

### STEP 6: P2 (Medium) Issue対応

**判定コマンド:**
```bash
gh issue list --state open --label "priority/medium" --json number | jq length
```

---

### STEP 7: P3 (Low) Issue対応

**判定コマンド:**
```bash
gh issue list --state open --label "priority/low" --json number | jq length
```

---

### STEP 8: 技術的負債解消

**判定:**
- 上記すべてが0の場合のみ実行可能

---

## 自動判定スクリプト

```bash
#!/bin/bash
# miyabi-priority-check.sh
# 次に実行すべきタスクを自動判定

set -e

echo "🔍 Miyabi DevOPS 優先順位チェック"
echo "=================================="

# STEP 1: 承認済みPR
approved_prs=$(gh pr list --state open --search "review:approved" --json number | jq length)
if [ "$approved_prs" -gt 0 ]; then
    echo "🔴 STEP 1: 承認済みPRマージ ($approved_prs件)"
    echo "コマンド: mwork-merge-all-approved"
    exit 1
fi

# STEP 2: CIエラー
ci_failures=$(gh run list --status failure --limit 1 --json databaseId 2>/dev/null | jq length || echo 0)
if [ "$ci_failures" -gt 0 ]; then
    echo "🔴 STEP 2: CIエラー修正"
    echo "コマンド: gh run list --status failure"
    exit 2
fi

# STEP 3: P0 Critical
p0_issues=$(gh issue list --state open --label "priority/critical" --json number | jq length)
if [ "$p0_issues" -gt 0 ]; then
    echo "🔴 STEP 3: P0 Critical Issue ($p0_issues件)"
    gh issue list --state open --label "priority/critical"
    exit 3
fi

# STEP 4: レビュー待ちPR
review_required=$(gh pr list --state open --search "review:required" --json number 2>/dev/null | jq length || echo 0)
if [ "$review_required" -gt 0 ]; then
    echo "🟡 STEP 4: レビュー待ちPR ($review_required件)"
    gh pr list --state open --search "review:required"
    exit 4
fi

# STEP 5: P1 High
p1_issues=$(gh issue list --state open --label "priority/high" --json number | jq length)
if [ "$p1_issues" -gt 0 ]; then
    echo "🟡 STEP 5: P1 High Issue ($p1_issues件)"
    gh issue list --state open --label "priority/high"
    exit 5
fi

# STEP 6: P2 Medium
p2_issues=$(gh issue list --state open --label "priority/medium" --json number | jq length)
if [ "$p2_issues" -gt 0 ]; then
    echo "🟢 STEP 6: P2 Medium Issue ($p2_issues件)"
    gh issue list --state open --label "priority/medium"
    exit 6
fi

# STEP 7: P3 Low
p3_issues=$(gh issue list --state open --label "priority/low" --json number | jq length)
if [ "$p3_issues" -gt 0 ]; then
    echo "🟢 STEP 7: P3 Low Issue ($p3_issues件)"
    gh issue list --state open --label "priority/low"
    exit 7
fi

# STEP 8: 技術的負債
echo "✅ STEP 8: 技術的負債解消フェーズ"
echo "すべての優先タスクが完了しています"
exit 0
```

---

## 強制チェックコマンド

### 作業開始前の必須チェック

```bash
# このコマンドがOKを返さない限り、新規作業を開始してはならない
miyabi-priority-check
```

### 返り値の意味

| Exit Code | 意味 | 次のアクション |
|-----------|------|---------------|
| 0 | 全優先タスク完了 | 技術的負債解消可能 |
| 1 | 承認済みPRあり | PRマージ実行 |
| 2 | CIエラーあり | CI修正 |
| 3 | P0 Issueあり | P0対応 |
| 4 | レビュー待ちPRあり | レビュー実施 |
| 5 | P1 Issueあり | P1対応 |
| 6 | P2 Issueあり | P2対応 |
| 7 | P3 Issueあり | P3対応 |

---

## Hook による強制

### Pre-Worktree-Create Hook

Worktree作成前に優先順位チェックを強制:

```bash
# .claude/hooks.json に追加
{
  "PreToolCall": [
    {
      "description": "優先順位チェック強制",
      "enabled": true,
      "matcher": {
        "tool_name": "Bash",
        "tool_input": "git worktree add"
      },
      "command": "bash",
      "args": [
        "-c",
        "~/Dev/01-miyabi/_core/miyabi-private/scripts/miyabi-priority-check.sh || (echo '❌ 優先タスクが残っています。先に完了してください。' && exit 1)"
      ]
    }
  ]
}
```

---

## 違反時の対応

### 違反パターン

1. **優先順位スキップ**: P1があるのにP2に着手
2. **未マージPR放置**: 承認済みPRを放置して新規作業
3. **CI無視**: CIが壊れたまま開発継続

### 対応

- **自動検出**: Hook/CIで検出
- **作業ブロック**: 違反状態では新規作業不可
- **強制修正**: 優先タスク完了まで進行禁止

---

## まとめ

```
判断するな。シーケンスに従え。
上から順に実行。飛ばすな。
完了するまで次に進むな。
```

**これがMiyabi DevOPSの絶対ルールである。**
