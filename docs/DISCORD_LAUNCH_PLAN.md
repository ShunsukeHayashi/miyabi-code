# Miyabi Discord ローンチ計画

**Version**: 1.0.0
**作成日**: 2025-10-18
**担当**: Claude Code
**関連Issue**: #213

---

## 📋 目次

1. [ローンチ概要](#ローンチ概要)
2. [ローンチスケジュール](#ローンチスケジュール)
3. [告知戦略](#告知戦略)
4. [初期メンバー獲得施策](#初期メンバー獲得施策)
5. [ローンチイベント](#ローンチイベント)
6. [初期コンテンツ準備](#初期コンテンツ準備)
7. [リスク管理](#リスク管理)

---

## ローンチ概要

### 🎯 ローンチ目標

#### プライマリーゴール
**「ローンチ後1ヶ月で100人のアクティブメンバーを獲得する」**

#### セカンダリーゴール
1. Miyabiの認知度向上
2. 質の高いコミュニティ文化の確立
3. 初期コントリビューターの発掘

### ローンチ形式

**段階的ローンチ（3段階）**:
1. **Pre-Launch（準備期間）**: 2週間 - 内部テスト、コンテンツ準備
2. **Soft Launch（ソフトローンチ）**: 1週間 - 限定的な招待制（50人目標）
3. **Official Launch（正式ローンチ）**: 1日 - 一般公開、大規模告知

---

## ローンチスケジュール

### 📅 全体タイムライン（4週間）

```
Week 1-2: Pre-Launch（準備期間）
Week 3: Soft Launch（ソフトローンチ）
Week 4 Day 1: Official Launch（正式ローンチ）
Week 4 Day 2-7: Post-Launch（フォローアップ）
```

---

### Week 1-2: Pre-Launch（準備期間）

**期間**: 2週間
**ゴール**: サーバー準備、コンテンツ作成、内部テスト

#### チェックリスト

**Week 1**:

- [ ] **Discordサーバー設定**
  - [ ] カテゴリ・チャンネル作成（Phase 2設計に従う）
  - [ ] ロール作成・権限設定
  - [ ] AutoMod設定
  - [ ] Bot導入（MEE6, Dyno等）

- [ ] **初期コンテンツ作成**
  - [ ] `#rules` にルール投稿
  - [ ] `#faq` に初期FAQ投稿（15項目）
  - [ ] 各Agentチャンネルにドキュメントリンク投稿
  - [ ] `#links-resources` にリソースリンク投稿

- [ ] **運営体制構築**
  - [ ] モデレーター候補者選定（2〜3人）
  - [ ] モデレーターへの打診・合意
  - [ ] モデレーターオンボーディング開始

**Week 2**:

- [ ] **内部テスト**
  - [ ] テストメンバー招待（5〜10人）
  - [ ] 全チャンネルの動作確認
  - [ ] Bot機能のテスト
  - [ ] モデレーション権限のテスト

- [ ] **コンテンツ充実**
  - [ ] `#showcase-projects` にサンプル投稿
  - [ ] `#showcase-tips` に初期Tips投稿（5件）
  - [ ] ウェルカムメッセージのテンプレート作成

- [ ] **告知素材準備**
  - [ ] ローンチ告知テキスト作成
  - [ ] サーバーバナー画像作成
  - [ ] SNS投稿用画像作成
  - [ ] プレスリリース作成（任意）

---

### Week 3: Soft Launch（ソフトローンチ）

**期間**: 1週間
**ゴール**: 限定的な招待制で50人獲得、フィードバック収集

#### 招待対象

1. **既存のMiyabiユーザー**（GitHub Stargazers、Contributors）
2. **Rust/AI開発コミュニティのアクティブメンバー**
3. **技術ブロガー、インフルエンサー**（フィードバック収集目的）

#### チェックリスト

- [ ] **Day 1-2: 限定招待**
  - [ ] GitHub Discussionsで招待告知
  - [ ] 既存ユーザーに招待リンク送付（DM、Email）
  - [ ] 招待専用リンク作成（期限付き）

- [ ] **Day 3-5: フィードバック収集**
  - [ ] `#feedback` チャンネルでフィードバック収集
  - [ ] 改善点の洗い出し
  - [ ] 緊急度の高い修正実施

- [ ] **Day 6-7: 最終調整**
  - [ ] フィードバックに基づく修正
  - [ ] FAQ更新
  - [ ] ローンチイベント準備

---

### Week 4 Day 1: Official Launch（正式ローンチ）

**期間**: 1日
**ゴール**: 一般公開、大規模告知、ローンチイベント実施

#### ローンチ当日スケジュール

| 時間 | アクション | 担当 |
|------|-----------|------|
| **09:00** | 招待リンクを一般公開に変更 | Admin |
| **10:00** | GitHub READMEにDiscordリンク追加 | Admin |
| **10:30** | Twitter/X投稿（告知第1弾） | Admin/Moderator |
| **12:00** | Reddit投稿（r/rust, r/programming） | Moderator |
| **14:00** | Hacker News投稿 | Moderator |
| **18:00** | **ローンチイベント開始**（音声チャット） | 全員 |
| **19:30** | ローンチイベント終了 | 全員 |
| **20:00** | Twitter/X投稿（告知第2弾、イベント報告） | Admin |

#### ローンチイベント内容

**形式**: Discord音声チャット（`🎤 General Voice`）

**アジェンダ**（90分）:
1. **オープニング**（10分）
   - プロジェクトオーナーからの挨拶
   - Miyabiビジョンの共有
   - コミュニティのゴール説明

2. **Miyabiデモ**（20分）
   - ライブコーディングセッション
   - Agent実行のデモ
   - Worktree並列実行の実演

3. **Q&Aセッション**（30分）
   - 参加者からの質問に回答
   - 技術的な質問
   - ビジネス系Agentの質問

4. **コミュニティ紹介**（10分）
   - チャンネル構造の説明
   - ルール・ガイドラインの説明
   - モデレーター紹介

5. **ネットワーキング**（20分）
   - 自由な交流タイム
   - プロジェクト共有
   - コラボレーション機会の探索

---

### Week 4 Day 2-7: Post-Launch（フォローアップ）

**期間**: 6日間
**ゴール**: エンゲージメント維持、フィードバック対応

#### チェックリスト

- [ ] **Day 2-3: 初期対応**
  - [ ] 新規メンバーへの個別歓迎
  - [ ] 質問への迅速な回答
  - [ ] 技術的問題の解決

- [ ] **Day 4-5: コンテンツ投稿**
  - [ ] 週次Tips投稿（`#showcase-tips`）
  - [ ] ユースケース共有の促進
  - [ ] アクティブメンバーへのリアクション

- [ ] **Day 6-7: 振り返り**
  - [ ] ローンチ統計の集計
  - [ ] フィードバックの整理
  - [ ] 改善計画の策定

---

## 告知戦略

### 📢 チャネル別告知計画

#### 1. GitHub

**メインリポジトリ（Miyabi）**:

- [ ] **README更新**
  ```markdown
  ## 💬 Join Our Community

  [![Discord](https://img.shields.io/discord/YOUR_SERVER_ID?label=Discord&logo=discord)](https://discord.gg/YOUR_INVITE_LINK)

  Join our Discord server to:
  - Get help and support
  - Share your projects
  - Discuss feature ideas
  - Connect with other Miyabi users
  ```

- [ ] **Discussions投稿**
  - カテゴリ: Announcements
  - タイトル: "🎉 Miyabi Discord Community is now live!"
  - 内容: ローンチ告知、招待リンク、コミュニティの価値提案

- [ ] **Release Notes**
  - 次回リリース時にDiscordリンクを含める

---

#### 2. Twitter/X

**投稿計画**:

**投稿1（ローンチ当日 10:30）**:
```
🎉 Miyabi Discord Community がオープンしました！

Miyabiユーザー同士が学び合い、成長できる場所です。

✨ 21個のAgent活用法
🦀 Rust実装のベストプラクティス
💼 ビジネス戦略の議論

今すぐ参加👇
[招待リンク]

#Miyabi #Rust #AIEngineering #Discord
```

**投稿2（ローンチ当日 20:00）**:
```
本日のMiyabiローンチイベントにご参加いただきありがとうございました！🎉

参加者数: [N]人
質問数: [N]件
デモセッション: [N]件

コミュニティはこれからも成長します。ぜひご参加ください👇
[招待リンク]

#Miyabi #RustLang #CommunityLaunch
```

**投稿3（ローンチ翌日）**:
```
Miyabi Discordのハイライト✨

🔧 Coding Agents: 7個のAgentで開発自動化
💼 Business Agents: 14個のAgentでビジネス成長
🌟 キャラクター名: しきるん、つくるん等

初心者も歓迎！今すぐ参加👇
[招待リンク]

#Miyabi #OpenSource #DeveloperTools
```

---

#### 3. Reddit

**投稿先**:
- [r/rust](https://reddit.com/r/rust)
- [r/programming](https://reddit.com/r/programming)
- [r/opensource](https://reddit.com/r/opensource)

**投稿テンプレート**（r/rust向け）:
```
Title: [ANN] Miyabi Discord Community - Autonomous AI-Driven Development Platform

Body:
Hi r/rust!

I'm excited to announce the launch of the Miyabi Discord Community!

**What is Miyabi?**
Miyabi is an autonomous AI-driven development platform built with Rust 2021 Edition.
It automates everything from Issue creation to code implementation, PR creation, and deployment.

**Key Features:**
- 🦀 Rust 2021 Edition implementation
- 🤖 21 Agents (7 Coding + 14 Business)
- 🌟 Character naming system (e.g., "Shikirrun" = CoordinatorAgent)
- 🔀 Git Worktree-based parallel execution

**What's in the Discord Community?**
- Technical support & troubleshooting
- Use case sharing
- Agent best practices
- Direct feedback to the dev team

**Join us here:** [招待リンク]
**GitHub:** https://github.com/ShunsukeHayashi/Miyabi

Looking forward to seeing you there!
```

---

#### 4. Hacker News

**投稿タイトル**:
```
Show HN: Miyabi – Autonomous AI-Driven Development Platform (Rust)
```

**投稿内容**:
```
Hi HN,

I've been working on Miyabi, an autonomous AI-driven development platform, and today we're launching our Discord community.

Miyabi automates the entire development workflow:
- Issue analysis → Task decomposition → Code generation → Review → Deployment

Built with Rust 2021 Edition for performance and safety.

The Discord community is a place for users to share projects, get support, and discuss feature ideas.

Discord: [招待リンク]
GitHub: https://github.com/ShunsukeHayashi/Miyabi

Happy to answer any questions!
```

---

#### 5. 技術ブログ（任意）

**ブログ記事タイトル例**:
- "Miyabi Discord Community をローンチしました"
- "AI駆動開発の新しいコミュニティ"

**公開先**:
- 個人ブログ
- Qiita
- Zenn
- dev.to

---

## 初期メンバー獲得施策

### 🎁 アーリーアクセス特典

**対象**: Soft Launch期間中に参加したメンバー

**特典内容**:
1. **限定ロール**: `@Early Adopter` ロール（特別な色、アイコン）
2. **優先サポート**: 質問への優先回答
3. **ベータ機能へのアクセス**: 新機能の先行テスト権
4. **限定イベント**: アーリーアクセスメンバー限定ミーティング

---

### 🎉 ローンチキャンペーン

**期間**: ローンチ後1週間

**施策1: リファラルプログラム**
- 友人を招待すると、紹介者・被紹介者双方に `@Active Member` ロール即付与
- 5人以上招待で `@Community Champion` ロール付与

**施策2: コンテンツコンテスト**
- テーマ: "Miyabiで作った最高のプロジェクト"
- 期間: ローンチ後1ヶ月
- 賞品: `@Featured Creator` ロール、GitHub Sponsorsでの支援（任意）

**施策3: 初投稿キャンペーン**
- 初めて `#showcase-projects` に投稿したメンバーに特別リアクション
- 初週に投稿した上位3名に `@Top Contributor` ロール付与

---

### 🤝 インフルエンサー連携

**ターゲット**:
- Rust系YouTuber（例: Jon Gjengset, No Boilerplate）
- 技術系Twitterアカウント（フォロワー10k+）
- 技術ブロガー

**連携方法**:
1. **DM/Email**: プロジェクト紹介、コミュニティ招待
2. **スポンサーシップ**: 動画/記事でのMiyabi紹介依頼
3. **ゲスト出演**: Discord音声イベントへの招待

---

## ローンチイベント

### 🎤 オープニングイベント詳細

**日時**: Official Launch当日 18:00〜19:30（90分）

**場所**: Discord音声チャンネル（`🎤 General Voice`）

**想定参加者**: 30〜50人

---

### アジェンダ詳細

#### 1. オープニング（10分）

**担当**: プロジェクトオーナー（Admin）

**内容**:
- 挨拶
- Miyabiビジョンの共有
  - 「AI駆動開発の民主化」
  - 「誰でも使える自律型開発プラットフォーム」
- コミュニティのゴール
  - 学び合い、成長できる場所
  - Miyabiの継続的改善

**スライド**: 5枚程度（準備推奨）

---

#### 2. Miyabiデモ（20分）

**担当**: プロジェクトオーナー or リードコントリビューター

**デモ内容**:

**Part 1: 基本的なAgent実行（10分）**
```bash
# Issue作成
gh issue create --title "Add user authentication" --body "..."

# CoordinatorAgentでタスク分解
miyabi agent run coordinator --issue 123

# CodeGenAgentでコード生成
miyabi agent run codegen --task 456

# ReviewAgentで品質レビュー
miyabi agent run review --pr 789
```

**Part 2: Worktree並列実行（10分）**
```bash
# 3つのIssueを同時処理
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

**画面共有**: VSCode + Terminal

---

#### 3. Q&Aセッション（30分）

**進行**: モデレーター

**想定質問**:
- Miyabiの技術スタック
- Rust移行の理由
- Business Agentの活用法
- Worktree並列実行の仕組み
- ロードマップ
- コントリビューション方法

**回答準備**: FAQ事前確認、回答例作成

---

#### 4. コミュニティ紹介（10分）

**担当**: Lead Moderator

**内容**:
- チャンネル構造の説明
- ルール・ガイドラインの簡単な説明
- モデレーター紹介
- ヘルプの受け方

---

#### 5. ネットワーキング（20分）

**形式**: 自由な交流タイム

**進行**:
- 参加者自己紹介（希望者のみ）
- プロジェクト共有
- コラボレーション機会の探索

---

## 初期コンテンツ準備

### 📝 必須コンテンツリスト

#### 1. `#rules` チャンネル

- [ ] ウェルカムメッセージ
- [ ] 基本ルール（10項目）
- [ ] 行動規範
- [ ] 報告方法
- [ ] モデレーションポリシー

**ソース**: [DISCORD_COMMUNITY_GUIDELINES.md](./DISCORD_COMMUNITY_GUIDELINES.md)

---

#### 2. `#faq` フォーラムチャンネル

- [ ] Q1〜Q15の初期FAQ投稿（各スレッド）
- [ ] カテゴリ分け（初心者向け、技術、Business Agent、トラブルシューティング、コミュニティ）

**ソース**: [DISCORD_COMMUNITY_GUIDELINES.md](./DISCORD_COMMUNITY_GUIDELINES.md)

---

#### 3. `#links-resources` チャンネル

**投稿内容**:
```
## 📚 公式リソース

**GitHub Repository**:
https://github.com/ShunsukeHayashi/Miyabi

**ドキュメント**:
- Quick Start: [リンク]
- Entity-Relation Model: [リンク]
- Label System Guide: [リンク]
- Worktree Protocol: [リンク]

**NPMパッケージ**:
- CLI: https://www.npmjs.com/package/miyabi
- SDK: https://www.npmjs.com/package/miyabi-agent-sdk

---

## 🦀 Rust学習リソース

- The Rust Book (日本語): https://doc.rust-jp.rs/book-ja/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- Rustlings: https://github.com/rust-lang/rustlings

---

## 🤖 AI開発リソース

- Anthropic Claude: https://claude.ai/
- OpenAI GPT-OSS-20B: [リンク]
- vLLM: https://github.com/vllm-project/vllm
```

---

#### 4. `#showcase-tips` チャンネル

**初期Tips投稿（5件）**:

**Tip 1: しきるん（CoordinatorAgent）の効果的な使い方**
```
しきるん（CoordinatorAgent）は、Issueを複数のTaskに分解してくれます。

効果的な使い方：
1. Issueに詳細な情報を記載
2. 期待する成果物を明記
3. 技術的制約があれば記載

例：
Issue #123
タイトル: "Add user authentication"
本文:
- JWT方式で実装
- /login, /logout, /refresh エンドポイント
- テストカバレッジ80%以上

しきるんが自動で5個のTaskに分解してくれます！

#Tips #CoordinatorAgent
```

**Tip 2〜5**: 他のAgentの使い方、Worktree並列実行、Business Agent活用等

---

#### 5. 各Agentチャンネル

**投稿テンプレート**（各チャンネルに投稿）:
```
# [Agent名]へようこそ！

このチャンネルは、[Agent名]（[英語名]）に関する議論・質問のためのチャンネルです。

**[Agent名]とは？**
[簡潔な説明]

**主な機能**:
- [機能1]
- [機能2]
- [機能3]

**詳細ドキュメント**:
[Agent仕様ドキュメントのリンク]

**使い方のヒント**:
[簡単なTips]

質問・議論は自由にどうぞ！
```

---

## リスク管理

### ⚠️ 想定リスクと対策

#### リスク1: ローンチ当日のサーバーダウン

**発生確率**: 低

**影響度**: 高

**対策**:
- **事前**: Discord Boostでサーバー強化（任意）
- **事中**: 問題発生時はTwitterで状況共有
- **事後**: 振り返りミーティング、改善策策定

---

#### リスク2: 想定よりも参加者が少ない

**発生確率**: 中

**影響度**: 中

**対策**:
- **事前**: 告知を1週間前倒し
- **事中**: リファラルプログラムの強化
- **事後**: 告知チャネルの追加（Qiita, Zenn等）

---

#### リスク3: 想定よりも参加者が多すぎる

**発生確率**: 低

**影響度**: 中

**対策**:
- **事前**: モデレーター数を増やす（4〜5人）
- **事中**: チャンネルのスローモード設定
- **事後**: 追加モデレーターの採用

---

#### リスク4: ローンチイベント中のトラブル（荒らし等）

**発生確率**: 低

**影響度**: 高

**対策**:
- **事前**: AutoMod設定強化、招待リンクの認証レベル上げ
- **事中**: 即座にタイムアウト/BAN、イベント一時中断
- **事後**: 問題ユーザーのBAN、ポリシー見直し

---

**Phase 5完了条件**:
- ローンチスケジュール策定完了（4週間）
- 告知戦略策定完了（5チャネル）
- 初期メンバー獲得施策策定完了
- ローンチイベント計画策定完了
- 初期コンテンツ準備チェックリスト作成完了
- リスク管理計画策定完了

**次のPhase**: Phase 6 - 成長戦略立案

---

**ローンチ計画策定者**: Claude Code
**最終更新**: 2025-10-18
