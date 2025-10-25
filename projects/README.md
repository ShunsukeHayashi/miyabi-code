# Miyabi Projects - プロジェクト一覧

**最終更新**: 2025-10-25
**管理方式**: モノレポ（Cargo Workspace + 独立プロジェクト）

---

## 📁 プロジェクト構造

```
projects/
├── README.md              # このファイル（全体インデックス）
├── historical-ai/        # 🔥 歴史偉人AIアバター
├── line-bot/             # 💬 LINE Bot統合
├── shinyu/               # 🔮 統合占いアプリ
└── miyabi-core/          # ⚙️ フレームワーク本体
```

---

## 🚀 プロジェクト一覧

### 1. Historical AI - 歴史偉人AIアバター

**ステータス**: ✅ MVP完成（Wave 1-3完了）
**優先度**: P0-Critical
**技術スタック**: Rust + Next.js + OpenAI GPT-4o

#### 概要
織田信長、坂本龍馬、徳川家康の3人の歴史偉人をAIアバター化し、経営戦略相談や歴史教育に活用できる対話サービス。

#### 主要機能
- RAGベース歴史知識検索（Wikipedia統合）
- キャラクター性再現プロンプト
- WebチャットUI（レスポンシブ）
- OpenAI GPT-4o統合

#### リンク
- [プロジェクトREADME](historical-ai/README.md)
- [親Issue #532](https://github.com/customer-cloud/miyabi-private/issues/532)
- [ビジネスプラン](historical-ai/docs/business-plan/historical-ai-business-model.md)

#### 収益予測
- **Year 1 Revenue**: $268,862
- **ARR Run-Rate**: $511,416
- **Break-Even**: Month 10-11

---

### 2. LINE Bot - 自然言語処理ボット

**ステータス**: 📅 計画中（Issue分割完了）
**優先度**: P0-Critical
**技術スタック**: Rust + LINE Messaging API + GPT-4

#### 概要
LINEメッセージからGitHub Issueを自動作成し、Agentが自動実装・PR作成する統合ボット。

#### 主要機能
- LINE Webhook受信
- GPT-4自然言語処理
- GitHub Issue自動生成
- Agent自動実行
- プッシュ通知（進捗・完了）

#### リンク
- [プロジェクトREADME](line-bot/README.md)
- [親Issue #431](https://github.com/customer-cloud/miyabi-private/issues/431)
- [サブIssue #538-540](https://github.com/customer-cloud/miyabi-private/issues?q=is%3Aissue+line-bot)

#### ビジネスインパクト
- **コンバージョン率**: 50% → 70% (+40%)
- **Year 1利益**: -¥0.47M → **¥1.65M** (黒字転換)

---

### 3. Shinyu - 統合占いアプリ

**ステータス**: 📅 計画中
**優先度**: P1-High
**技術スタック**: 未定

#### 概要
タロット、易経、西洋占星術を統合し、AIが総合的に分析・アドバイスを提供する占いプラットフォーム。

#### 主要機能（想定）
- タロット占い（78枚）
- AI解釈（GPT-4）
- 易経占い（64卦）
- 相性診断

#### リンク
- [プロジェクトREADME](shinyu/README.md)
- [Issue #531](https://github.com/customer-cloud/miyabi-private/issues/531)

---

### 4. Miyabi Core - フレームワーク本体

**ステータス**: ✅ 運用中
**バージョン**: v0.1.1
**技術スタック**: Rust 2021 Edition

#### 概要
完全自律型AI開発オペレーションプラットフォーム。21個のAgentを駆動し、Issue→実装→PR→デプロイを完全自動化。

#### 主要機能
- 21 Agents（Coding 7個 + Business 14個）
- Git Worktree並列実行
- GitHub as OS
- LLM抽象化層（Claude, OpenAI, Groq, Ollama）

#### リンク
- [プロジェクトREADME](miyabi-core/README.md)
- [クイックスタート](../.claude/QUICK_START.md)
- [エージェント仕様](../.claude/agents/)

---

## 📊 プロジェクト比較表

| プロジェクト | ステータス | 優先度 | 技術スタック | 収益性 |
|------------|----------|--------|-------------|--------|
| **Historical AI** | ✅ MVP完成 | P0 | Rust + Next.js + GPT-4o | $268K/Year 1 |
| **LINE Bot** | 📅 計画中 | P0 | Rust + LINE API + GPT-4 | ¥1.65M利益 |
| **Shinyu** | 📅 計画中 | P1 | 未定 | 未定 |
| **Miyabi Core** | ✅ 運用中 | - | Rust 2021 | - |

---

## 🔄 依存関係

```
Miyabi Core (基盤)
  ↓
  ├── Historical AI (派生プロジェクト)
  ├── LINE Bot (派生プロジェクト)
  └── Shinyu (派生プロジェクト)
```

全プロジェクトは`Miyabi Core`のCargo Workspace cratesを基盤として動作します。

---

## 🚀 開発方針

### モノレポ管理
- **Cargo Workspace**: Rust cratesは`crates/`配下で共有
- **独立プロジェクト**: プロジェクトごとに`projects/`配下で管理
- **Issue管理**: GitHub Issuesで一元管理、Label付け

### Issue体系
```
Epic Issue (親)
  ├── Milestone (マイルストーン)
  ├── SubIssue 1 (子タスク)
  ├── SubIssue 2
  └── SubIssue 3
```

### Agent駆動開発
```bash
# 単一Issue実行
miyabi agent run coordinator --issue 532

# 並列実行（Worktreeベース）
miyabi agent run coordinator --issues 532,431,531 --concurrency 3
```

---

## 📚 ドキュメント

### グローバルドキュメント
- [CLAUDE.md](../CLAUDE.md) - Claude Code統合設定
- [README.md](../README.md) - プロジェクトルートREADME
- [CONTRIBUTING.md](../CONTRIBUTING.md) - コントリビューションガイド

### プロジェクト別ドキュメント
- 各プロジェクトの`README.md`
- `docs/`配下の設計書・ビジネスプラン

---

## 🤝 コントリビューション

新しいプロジェクトを追加する場合：

1. `projects/`配下に新ディレクトリ作成
2. README.md作成（このテンプレートに従う）
3. Epic Issue作成（GitHub Issues）
4. このファイル（`projects/README.md`）に追加

---

🤖 Generated with Miyabi Framework
Last Updated: 2025-10-25
