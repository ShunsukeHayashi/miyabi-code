# LINE Bot統合プロジェクト

**作成日**: 2025-10-25
**ステータス**: 計画中（サブIssue分割完了）
**優先度**: P0-Critical

---

## 🎯 プロジェクト概要

LINE Messaging APIを統合し、自然言語でGitHub Issueを自動作成できるLINE Botを実装する。

### 主要機能
1. **LINE Webhook受信** - メッセージイベント処理
2. **GPT-4自然言語処理** - ユーザーメッセージ解析
3. **GitHub Issue自動作成** - 構造化Issue生成
4. **Agent自動実行** - Coordinator/CodeGen連携
5. **プッシュ通知** - 進捗・完了通知

---

## 📊 ビジネスインパクト

| 指標 | Web UI only | Web UI + LINE Bot | 改善率 |
|------|-------------|-------------------|--------|
| コンバージョン率 | 50% | 70% | +40% |
| 売上（Year 1） | ¥8.25M | ¥11.55M | +40% |
| 利益 | -¥0.47M (赤字) | **¥1.65M (黒字)** | 黒転 |

**70%コンバージョン率達成により黒字化**

---

## 🏗️ アーキテクチャ

### 技術スタック
- **言語**: Rust 2021 Edition
- **フレームワーク**: Axum 0.7
- **LLM**: OpenAI GPT-4o
- **LINE**: Messaging API
- **GitHub**: Octokit REST API

### データフロー
```
LINE User → Webhook → GPT-4解析 → Issue作成 → Agent実行 → PR作成 → 通知
```

---

## 📋 Issue構造

### 親Issue
- **#431**: LINE Bot統合 - Full Release

### サブIssue
- **#538**: LINE Messaging API基盤構築
- **#539**: GPT-4自然言語処理 & GitHub Issue自動生成
- **#540**: リッチ機能実装（Flex Message + Push通知）

---

## 🚀 実装ステータス

### 📅 計画中
- [ ] LINE Developers設定
- [ ] Webhook実装（Rust）
- [ ] GPT-4プロンプト設計
- [ ] GitHub Issue自動作成
- [ ] Flex Message実装
- [ ] プッシュ通知実装
- [ ] リッチメニュー設計

### 期限
- **Week 17-18**: 基盤構築 + GPT-4統合
- **Week 18**: リッチ機能 + Full Release

---

## 💻 ローカル開発

### 環境変数
```bash
export LINE_CHANNEL_ACCESS_TOKEN=xxx
export LINE_CHANNEL_SECRET=xxx
export OPENAI_API_KEY=sk-xxx
export GITHUB_TOKEN=ghp_xxx
```

### 開発サーバー起動
```bash
cd ../../crates/miyabi-line-bot  # (未作成)
cargo run
# → http://localhost:3000/line/webhook
```

---

## 📚 関連ドキュメント

- [親Issue #431](https://github.com/customer-cloud/miyabi-private/issues/431)
- [サブIssue #538-540](https://github.com/customer-cloud/miyabi-private/issues?q=is%3Aissue+line-bot)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)

---

🤖 Generated with Miyabi Framework
