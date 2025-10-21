# Miyabi Project - Issue一覧

このファイルはGit Workflow Hooksがローカルで参照するIssue一覧です。
GitHub APIに依存せず、ローカルでIssue状況を管理できます。

## 📋 使い方

1. 新しいIssueを追加する場合は、以下の形式で追記
2. Issueが完了したら、`[ ]`を`[x]`に変更
3. コミット＆プッシュして状態を保存

---

## 🔥 P0 (Critical) - 最優先

（現在P0はありません）

## 🚀 P1 (High) - 高優先度

（現在P1はありません）

## 📌 P2 (Medium) - 中優先度

（現在P2はありません）

## 📝 P3 (Low) - 低優先度

（現在P3はありません）

---

## ✅ 完了済み (Completed)

- [x] #202: Harden Domain Models (2025-10-21完了 - Priority bug fix + 5 validation methods)
- [x] #277: テストカバレッジ向上 (2025-10-21完了 - 4 crate修正 53テスト通過)
- [x] #276: A2A Webhook Authentication実装 (2025-10-21完了 - HMAC-SHA256署名 + 9テスト)
- [x] #275: Rust移行チェックリスト完了 (2025-10-21完了 - 26ファイル100%完了)
- [x] #274: push notification config管理 (2025-10-21完了 - push_notification_config.rs確認)
- [x] #273: Discord MCP Server統合 (2025-10-21完了 - TEST_RESULTS.md確認)
- [x] #272: Issue Queue System実装 (2025-10-21完了 - commit 2edf7c7で実装済み確認)
- [x] #271: progress emission for agents実装 (2025-10-21完了 - commit 15ba317で実装済み確認)
- [x] #270: tasks/resubscribe RPC method実装 (2025-10-21完了 - commit ae54425で実装済み確認)
- [x] #269: Git Workflow Hooks統合 (2025-10-21完了)
- [x] #268: Prepackaged Binary System実装 (2025-10-21完了)

---

## 📊 統計情報

**最終更新**: 2025-10-21

| 優先度 | オープン | 完了 |
|--------|---------|------|
| P0     | 0       | 2    |
| P1     | 0       | 2    |
| P2     | 0       | 3    |
| P3     | 0       | 2    |
| **合計** | **0** | **11** |

---

## 🔄 更新方法

### Issue追加
```markdown
- [ ] #番号: Issue タイトル
```

### Issue完了
```markdown
- [x] #番号: Issue タイトル (YYYY-MM-DD完了)
```

### 優先度変更
Issueを別の優先度セクションに移動

---

**管理者**: Claude Code + Water Spider
**リポジトリ**: ShunsukeHayashi/miyabi-private
