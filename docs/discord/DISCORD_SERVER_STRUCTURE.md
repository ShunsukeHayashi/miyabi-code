# Miyabi Discord サーバー構造設計

**Version**: 1.0.0
**作成日**: 2025-10-18
**担当**: Claude Code
**関連Issue**: #213

---

## 📋 目次

1. [サーバー概要](#サーバー概要)
2. [チャンネルカテゴリとチャンネル一覧](#チャンネルカテゴリとチャンネル一覧)
3. [ロール（役割）設計](#ロール役割設計)
4. [権限マトリクス](#権限マトリクス)
5. [初期設定チェックリスト](#初期設定チェックリスト)

---

## サーバー概要

**サーバー名**: Miyabi Community

**サーバー説明**:
```
Miyabi - 一つのコマンドで全てが完結する自律型開発フレームワーク

完全自律型AI開発オペレーションプラットフォーム。
Issue作成からコード実装、PR作成、デプロイまでを完全自動化。

🦀 Rust 2021 Edition
🤖 21個のAgent（Coding 7個 + Business 14個）
🌟 キャラクター名システム（しきるん、つくるん等）
```

**サーバーアイコン**: Miyabiロゴ（未定の場合は、Rustのギアアイコン）

**認証レベル**: Medium（メール認証必須）

**コンテンツフィルター**: High（全メンバーに適用）

---

## チャンネルカテゴリとチャンネル一覧

### 📢 WELCOME & RULES

**目的**: 新規メンバーのオンボーディングとルール周知

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#welcome` | テキスト | 新規メンバー歓迎、自己紹介 | 全員閲覧、`@New Member`以上投稿可 |
| `#rules` | テキスト | コミュニティルール（読み取り専用） | 全員閲覧、`@Moderator`以上投稿可 |
| `#faq` | フォーラム | よくある質問と回答 | 全員閲覧、`@Member`以上投稿可 |
| `#announcements` | テキスト | 公式アナウンス（読み取り専用） | 全員閲覧、`@Admin`のみ投稿可 |

**設定**:
- `#welcome`: メンバー参加時に自動で表示
- `#rules`: ピン留め推奨
- `#announcements`: 通知ON推奨

---

### 💬 GENERAL

**目的**: 一般的な雑談とコミュニティ交流

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#general` | テキスト | 一般的な雑談 | 全員 |
| `#introductions` | テキスト | 自己紹介専用 | 全員 |
| `#off-topic` | テキスト | オフトピック雑談 | 全員 |
| `#links-resources` | テキスト | 有用なリンク・リソース共有 | 全員 |

---

### 🔧 CODING AGENTS

**目的**: Coding Agent（7個）に関する議論とサポート

| チャンネル名 | 種別 | 説明 | 対応Agent | 権限 |
|------------|------|------|-----------|------|
| `#しきるん-coordinator` | テキスト | CoordinatorAgentの使い方、タスク分解 | CoordinatorAgent | 全員 |
| `#つくるん-codegen` | テキスト | CodeGenAgentの使い方、コード生成 | CodeGenAgent | 全員 |
| `#めだまん-review` | テキスト | ReviewAgentの使い方、品質レビュー | ReviewAgent | 全員 |
| `#はこぶん-deployment` | テキスト | DeploymentAgentの使い方、デプロイ | DeploymentAgent | 全員 |
| `#つなぐん-pr-agent` | テキスト | PRAgentの使い方、PR作成 | PRAgent | 全員 |
| `#みつけるん-issue-agent` | テキスト | IssueAgentの使い方、ラベリング | IssueAgent | 全員 |
| `#worktree-parallel` | テキスト | Worktree並列実行の議論 | 全Agent | 全員 |

**特記事項**:
- チャンネル名にキャラクター名を使用（親しみやすさ向上）
- 各チャンネルのトピックにAgent仕様ドキュメントのリンクを記載

---

### 💼 BUSINESS AGENTS

**目的**: Business Agent（14個）に関する議論とサポート

#### サブカテゴリ: 戦略・企画系（6個）

| チャンネル名 | 種別 | 説明 | 対応Agent | 権限 |
|------------|------|------|-----------|------|
| `#あきんどさん-entrepreneur` | テキスト | AIEntrepreneurAgentの使い方 | AIEntrepreneurAgent | 全員 |
| `#コンセプト-product-concept` | テキスト | ProductConceptAgentの使い方 | ProductConceptAgent | 全員 |
| `#せっけい-product-design` | テキスト | ProductDesignAgentの使い方 | ProductDesignAgent | 全員 |
| `#みちすじ-funnel-design` | テキスト | FunnelDesignAgentの使い方 | FunnelDesignAgent | 全員 |
| `#ペルソナ-persona` | テキスト | PersonaAgentの使い方 | PersonaAgent | 全員 |
| `#じぶん-self-analysis` | テキスト | SelfAnalysisAgentの使い方 | SelfAnalysisAgent | 全員 |

#### サブカテゴリ: マーケティング系（5個）

| チャンネル名 | 種別 | 説明 | 対応Agent | 権限 |
|------------|------|------|-----------|------|
| `#しらべるん-market-research` | テキスト | MarketResearchAgentの使い方 | MarketResearchAgent | 全員 |
| `#ひろめるん-marketing` | テキスト | MarketingAgentの使い方 | MarketingAgent | 全員 |
| `#かくちゃん-content-creation` | テキスト | ContentCreationAgentの使い方 | ContentCreationAgent | 全員 |
| `#sns-strategy` | テキスト | SNSStrategyAgentの使い方 | SNSStrategyAgent | 全員 |
| `#youtube-strategy` | テキスト | YouTubeAgentの使い方 | YouTubeAgent | 全員 |

#### サブカテゴリ: 営業・顧客管理系（3個）

| チャンネル名 | 種別 | 説明 | 対応Agent | 権限 |
|------------|------|------|-----------|------|
| `#うるん-sales` | テキスト | SalesAgentの使い方 | SalesAgent | 全員 |
| `#まもるん-crm` | テキスト | CRMAgentの使い方 | CRMAgent | 全員 |
| `#かぞえるん-analytics` | テキスト | AnalyticsAgentの使い方 | AnalyticsAgent | 全員 |

**特記事項**:
- 14個のBusiness Agentを3つのサブカテゴリに分類
- チャンネル数が多いため、初期は統合チャンネルから開始し、需要に応じて分割も検討

**代替案（簡易版）**:
初期段階では以下の統合チャンネルから開始：
- `#business-agents-strategy` - 戦略・企画系（6個）統合
- `#business-agents-marketing` - マーケティング系（5個）統合
- `#business-agents-sales-crm` - 営業・顧客管理系（3個）統合

---

### 🆘 SUPPORT

**目的**: ヘルプとトラブルシューティング

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#help-general` | テキスト | 一般的な質問・ヘルプ | 全員 |
| `#help-installation` | テキスト | インストール・セットアップ | 全員 |
| `#help-troubleshooting` | フォーラム | トラブルシューティング専用 | 全員 |
| `#help-worktree` | テキスト | Worktree関連のヘルプ | 全員 |

**設定**:
- `#help-troubleshooting`: フォーラム形式で、解決済みタグを活用
- 平均応答時間の目標: 24時間以内

---

### 🎨 SHOWCASE

**目的**: ユースケース共有とプロジェクト紹介

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#showcase-projects` | テキスト | プロジェクト紹介 | 全員 |
| `#showcase-use-cases` | フォーラム | ユースケース共有 | `@Member`以上 |
| `#showcase-tips` | テキスト | Tips・ベストプラクティス | `@Active Member`以上 |
| `#showcase-videos` | テキスト | デモ動画・チュートリアル | 全員 |

**設定**:
- `#showcase-projects`: リアクション推奨（👍、❤️、🔥）
- 月次の「今月のベストショーケース」投票

---

### 🛠️ DEVELOPMENT

**目的**: バグレポート、フィーチャーリクエスト、コントリビューション

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#bug-reports` | フォーラム | バグレポート | 全員 |
| `#feature-requests` | フォーラム | フィーチャーリクエスト | `@Member`以上 |
| `#contributions` | テキスト | コントリビューション議論 | `@Contributor`以上 |
| `#pull-requests` | テキスト | PR議論 | `@Contributor`以上 |
| `#roadmap` | テキスト | ロードマップ議論 | 全員閲覧、`@Core Contributor`以上投稿 |

**設定**:
- `#bug-reports`: フォーラム形式、テンプレート設定
- `#feature-requests`: 投票機能活用
- GitHub連携bot導入（将来）

---

### 🎉 COMMUNITY

**目的**: イベント、お知らせ、コミュニティ運営

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `#events` | テキスト | イベント告知・参加 | 全員閲覧、`@Moderator`以上投稿 |
| `#feedback` | テキスト | コミュニティフィードバック | 全員 |
| `#mod-chat` | テキスト | モデレーター議論（非公開） | `@Moderator`以上 |

---

### 🔊 VOICE CHANNELS

**ボイスチャンネルカテゴリ**

| チャンネル名 | 種別 | 説明 | 権限 |
|------------|------|------|------|
| `🎤 General Voice` | ボイス | 一般的な音声会話 | 全員 |
| `🎤 Coding Session` | ボイス | コーディングセッション | 全員 |
| `🎤 Business Strategy` | ボイス | ビジネス戦略ミーティング | 全員 |
| `🎤 Office Hours` | ボイス | オフィスアワー（定期イベント） | 全員 |

---

## ロール（役割）設計

### 🎭 ロール一覧

| ロール名 | 色 | 権限レベル | 説明 |
|---------|-----|-----------|------|
| `@Admin` | 🔴 Red | 最高 | サーバー管理者 |
| `@Moderator` | 🟠 Orange | 高 | モデレーター |
| `@Core Contributor` | 🟣 Purple | 中高 | コアコントリビューター（GitHub上でactive） |
| `@Contributor` | 🔵 Blue | 中 | コントリビューター（1回以上のPR） |
| `@Active Member` | 🟢 Green | 中低 | アクティブメンバー（月10回以上発言） |
| `@Member` | ⚪ White | 低 | 一般メンバー（自己紹介済み） |
| `@New Member` | 🟡 Yellow | 最低 | 新規メンバー（未自己紹介） |

### 🎯 ロール付与基準

#### `@Admin`
- **対象**: サーバー所有者、プロジェクトオーナー
- **人数**: 1〜2人
- **付与方法**: 手動
- **権限**: すべての権限

#### `@Moderator`
- **対象**: 信頼できるコミュニティメンバー、運営チーム
- **人数**: 3〜5人
- **付与方法**: 手動（Admin指名）
- **権限**: メッセージ削除、タイムアウト、ニックネーム変更

#### `@Core Contributor`
- **対象**: GitHubで10回以上のPR、またはメジャー機能実装
- **人数**: 制限なし
- **付与方法**: 手動（実績確認後）
- **権限**: 特定チャンネルへの投稿権限

#### `@Contributor`
- **対象**: GitHubで1回以上のPR
- **人数**: 制限なし
- **付与方法**: 手動（GitHub連携）
- **権限**: コントリビューションチャンネルへのアクセス

#### `@Active Member`
- **対象**: 月10回以上の発言、またはコミュニティ貢献
- **人数**: 制限なし
- **付与方法**: 自動（bot）または手動
- **権限**: 特定チャンネルへの投稿権限

#### `@Member`
- **対象**: `#introductions`で自己紹介した人
- **人数**: 制限なし
- **付与方法**: 自動（bot）または手動
- **権限**: 基本的な投稿権限

#### `@New Member`
- **対象**: 新規参加者（未自己紹介）
- **人数**: 制限なし
- **付与方法**: 自動（Discord標準機能）
- **権限**: 閲覧のみ、`#welcome`と`#introductions`のみ投稿可

---

## 権限マトリクス

### 📊 権限一覧表

| 権限 | `@Admin` | `@Moderator` | `@Core Contributor` | `@Contributor` | `@Active Member` | `@Member` | `@New Member` |
|------|----------|--------------|---------------------|----------------|------------------|-----------|---------------|
| サーバー設定変更 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ロール管理 | ✅ | ⚠️（一部） | ❌ | ❌ | ❌ | ❌ | ❌ |
| チャンネル管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| メンバーキック | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| メンバータイムアウト | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| メッセージ削除（全チャンネル） | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ピン留めメッセージ管理 | ✅ | ✅ | ⚠️（一部） | ❌ | ❌ | ❌ | ❌ |
| アナウンス投稿 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `#roadmap` 投稿 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `#showcase-tips` 投稿 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `#contributions` 投稿 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 一般チャンネル投稿 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️（制限） |
| ボイスチャンネル参加 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️（一部） |
| 画面共有 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

**凡例**:
- ✅: 許可
- ❌: 不許可
- ⚠️: 条件付き許可

---

## 初期設定チェックリスト

### ✅ サーバー基本設定

- [ ] サーバー名: "Miyabi Community"
- [ ] サーバーアイコン設定
- [ ] サーバー説明設定
- [ ] 認証レベル: Medium（メール認証必須）
- [ ] コンテンツフィルター: High
- [ ] システムメッセージチャンネル: `#welcome`

### ✅ カテゴリとチャンネル作成

- [ ] **📢 WELCOME & RULES** カテゴリ作成
  - [ ] `#welcome` チャンネル作成
  - [ ] `#rules` チャンネル作成
  - [ ] `#faq` フォーラムチャンネル作成
  - [ ] `#announcements` チャンネル作成
- [ ] **💬 GENERAL** カテゴリ作成
  - [ ] `#general` チャンネル作成
  - [ ] `#introductions` チャンネル作成
  - [ ] `#off-topic` チャンネル作成
  - [ ] `#links-resources` チャンネル作成
- [ ] **🔧 CODING AGENTS** カテゴリ作成（簡易版：統合チャンネル）
  - [ ] `#coding-agents-general` チャンネル作成（初期）
  - [ ] 需要に応じて個別チャンネル分割
- [ ] **💼 BUSINESS AGENTS** カテゴリ作成（簡易版：統合チャンネル）
  - [ ] `#business-agents-strategy` チャンネル作成（初期）
  - [ ] `#business-agents-marketing` チャンネル作成（初期）
  - [ ] `#business-agents-sales-crm` チャンネル作成（初期）
- [ ] **🆘 SUPPORT** カテゴリ作成
  - [ ] `#help-general` チャンネル作成
  - [ ] `#help-installation` チャンネル作成
  - [ ] `#help-troubleshooting` フォーラムチャンネル作成
  - [ ] `#help-worktree` チャンネル作成
- [ ] **🎨 SHOWCASE** カテゴリ作成
  - [ ] `#showcase-projects` チャンネル作成
  - [ ] `#showcase-use-cases` フォーラムチャンネル作成
  - [ ] `#showcase-tips` チャンネル作成
  - [ ] `#showcase-videos` チャンネル作成
- [ ] **🛠️ DEVELOPMENT** カテゴリ作成
  - [ ] `#bug-reports` フォーラムチャンネル作成
  - [ ] `#feature-requests` フォーラムチャンネル作成
  - [ ] `#contributions` チャンネル作成
  - [ ] `#pull-requests` チャンネル作成
  - [ ] `#roadmap` チャンネル作成
- [ ] **🎉 COMMUNITY** カテゴリ作成
  - [ ] `#events` チャンネル作成
  - [ ] `#feedback` チャンネル作成
  - [ ] `#mod-chat` チャンネル作成（Moderator専用）
- [ ] **🔊 VOICE CHANNELS** カテゴリ作成
  - [ ] `🎤 General Voice` ボイスチャンネル作成
  - [ ] `🎤 Coding Session` ボイスチャンネル作成
  - [ ] `🎤 Business Strategy` ボイスチャンネル作成
  - [ ] `🎤 Office Hours` ボイスチャンネル作成

### ✅ ロール作成

- [ ] `@Admin` ロール作成（色: 🔴 Red）
- [ ] `@Moderator` ロール作成（色: 🟠 Orange）
- [ ] `@Core Contributor` ロール作成（色: 🟣 Purple）
- [ ] `@Contributor` ロール作成（色: 🔵 Blue）
- [ ] `@Active Member` ロール作成（色: 🟢 Green）
- [ ] `@Member` ロール作成（色: ⚪ White）
- [ ] `@New Member` ロール作成（色: 🟡 Yellow）

### ✅ 権限設定

- [ ] 各ロールに適切な権限を付与（権限マトリクスに従う）
- [ ] 各チャンネルに権限オーバーライドを設定
- [ ] `#rules` を読み取り専用に設定
- [ ] `#announcements` を読み取り専用に設定
- [ ] `#mod-chat` をModeratorのみアクセス可能に設定

### ✅ Discord標準機能設定

- [ ] AutoMod有効化（スパム・不適切語句フィルター）
- [ ] ウェルカムスクリーン設定
- [ ] サーバーテンプレート作成（バックアップ）
- [ ] 監査ログ確認設定

### ✅ 初期コンテンツ作成

- [ ] `#rules` にコミュニティルール投稿（Phase 3で作成）
- [ ] `#faq` に初期FAQ投稿
- [ ] `#announcements` にローンチ告知投稿
- [ ] 各Agent関連チャンネルにAgent仕様ドキュメントリンク投稿

---

**Phase 2完了条件**:
- すべてのカテゴリとチャンネルが作成済み
- すべてのロールが作成済み
- 権限マトリクスに従った権限設定完了
- 初期設定チェックリストの全項目完了

**次のPhase**: Phase 3 - コミュニティガイドライン作成

---

**構造設計者**: Claude Code
**最終更新**: 2025-10-18
