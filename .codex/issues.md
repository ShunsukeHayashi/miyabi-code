# Miyabi Project - Issue一覧

このファイルはGit Workflow Hooksがローカルで参照するIssue一覧です。
GitHub APIに依存せず、ローカルでIssue状況を管理できます。

## 📋 使い方

1. 新しいIssueを追加する場合は、以下の形式で追記
2. Issueが完了したら、`[ ]`を`[x]`に変更
3. コミット＆プッシュして状態を保存

---

## 🔥 P0 (Critical) - 最優先

- [ ] #344: 🔴 デモ動画作成（YouTube "3分でわかるMiyabi"）⚠️ Phase 1完了（AI）→ Phase 2-4人間実行待ち

## 🚀 P1 (High) - 高優先度

- [ ] #382: 📄 [Sub-Issue #361] Phase 7: メンテナンス計画
- [ ] #381: 📄 [Sub-Issue #361] Phase 6: A/Bテスト実装
- [ ] #366: ⚡ Phase 5: パフォーマンス最適化 - Lighthouse 90+達成
- [ ] #365: 💳 Phase 4: Stripe決済統合
- [ ] #363: 🖼️ Phase 2: 画像素材準備 - BytePlus Landing Page用画像8種類作成
- [ ] #361: 📄 BytePlus Video API Bootcamp - Landing Page デプロイとメンテナンス計画
- [ ] #360: 🪟🍎 macOS + Windows Platform Support

## 📌 P2 (Medium) - 中優先度

- [ ] #372: 🧪 Phase 6: A/Bテスト実装 - CVR最適化のための3つのテスト
- [ ] #369: [Review] スティーブ・ジョブズ風プレゼンテーション最終レビュー
- [ ] #368: [Design] LP・セールスマテリアルのUI/UXレビュー
- [ ] #286: [A2A] Phase 3.4: Write gRPC integration tests

## 📝 P3 (Low) - 低優先度

- [ ] #359: 🟢 Split miyabi-core into focused infrastructure crates
- [ ] #277: [A2A] Phase 2.10: Write webhook integration tests
- [ ] #274: [A2A] Phase 2.7: Implement tasks/pushNotificationConfig/* methods

---

## ✅ 完了済み (Completed)

- [x] #364: 📊 Phase 3: トラッキング設定 - GA4/Facebook Pixel/LinkedIn統合 (2025-10-22完了 - 3プラットフォーム統合 + イベントトラッキング + 設定ドキュメント)
- [x] #362: 🚀 Phase 1: GitHub Pages デプロイ - BytePlus Landing Page公開 (2025-10-22完了 - Landing Page確認 + デプロイステータスドキュメント作成)
- [x] #395: 最終統合: 全Partマージと品質チェック (2025-10-22完了 - 完全版150ページ + README + 品質保証)
- [x] #394: Part 6-7: 収益化・まとめ（15ページ） (2025-10-22完了 - 4収益化パターン + ROI試算 + まとめ)
- [x] #393: Part 5: ハンズオン（20ページ） (2025-10-22完了 - 5演習 + トラブルシューティング)
- [x] #392: Part 4: 実装15パターン（60ページ） (2025-10-22完了 - 基本5 + 応用5 + 実践5パターン)
- [x] #391: Part 3: BytePlus API概要（25ページ） (2025-10-22完了 - API仕様 + 5言語SDK + 統合例)
- [x] #390: Part 2: 市場動向（20ページ） (2025-10-22完了 - TAM/SAM/SOM + 21社競合分析)
- [x] #367: BytePlus セミナースライド150ページ作成 (2025-10-22完了 - 全7 Part完成)
- [x] #356: Refactor miyabi-agents God Crate (2025-10-22完了 - 6 crates, 30 files, 36 tests passing)
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

**最終更新**: 2025-10-22

| 優先度 | オープン | 完了 |
|--------|---------|------|
| P0     | 1       | 3    |
| P1     | 7       | 11   |
| P2     | 4       | 3    |
| P3     | 3       | 2    |
| **合計** | **15** | **21** |

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

**管理者**: Codex + Water Spider
**リポジトリ**: ShunsukeHayashi/miyabi-private
