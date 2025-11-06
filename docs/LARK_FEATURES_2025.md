# Lark Features & Pricing Analysis 2025

**調査実施日**: 2025-11-06
**調査担当**: MarketResearchAgent (しらべるん2号)
**調査対象**: Lark Suite - All-in-One Collaboration Platform

---

## 📋 Executive Summary

Larkは、ByteDance開発の統合型コラボレーションプラットフォームで、2025年に向けて**AI統合**と**ノーコード自動化**の大幅な強化を実施しています。特に、**Model Context Protocol (MCP)** 統合と **AnyCross** プラットフォームの全プラン展開により、エンタープライズ市場での競争力を大きく向上させています。

### Key Findings

- ✅ **Lark Open Platform**: MCP統合でAIエージェントとのシームレス連携を実現（Beta）
- ✅ **Lark Base v7.51**: AI搭載、Webhook、Joint Table Analysis等の高度機能追加
- ✅ **Approval Workflow**: ノーコード自動化、モバイル対応、24時間以内の承認処理時間短縮
- ⚠️ **Genesis AI System**: 「Lark Genesis AI System」という統合製品は存在しない（誤解）
- ✅ **Pricing Plans**: 4プラン体制（Starter/Basic/Pro/Enterprise）、Starterプランの無料提供継続

---

## 🚀 1. Lark Open Platform - Latest Features (2025)

### 1.1 Model Context Protocol (MCP) Integration

**リリース状況**: Beta（2025年Q1）

Lark公式が提供するMCPツールは、AIエージェントとLarkプラットフォームの効率的な連携を実現します。

#### 主要機能

| 機能 | 説明 |
|------|------|
| **API Encapsulation** | Feishu/Lark Open Platform APIをMCPツールとしてカプセル化 |
| **AI Assistant Integration** | AIアシスタントが直接APIを呼び出し可能 |
| **Automation Scenarios** | ドキュメント処理、会話管理、カレンダースケジューリング等 |
| **Custom API Support** | ユーザーが特定APIやプリセットを指定可能（`-t`パラメータ） |

#### 技術仕様

```json
{
  "package": "@larksuiteoapi/lark-mcp",
  "github": "https://github.com/larksuite/lark-openapi-mcp",
  "status": "Beta",
  "note": "Features and APIs may change"
}
```

#### SDK Availability

- **Node.js SDK**: `@larksuiteoapi/node-sdk` (v1.5.30+)
  - セマンティック呼び出し: `client.business_domain.resource.method`
- **Python SDK**: `lark-oapi` (Released: 2025-09-19)
- **Go SDK**: Multiple implementations supporting all Open API and Event Callbacks

#### Industry Adoption

- **2025年3月**: OpenAIがMCPを全製品スイートで正式採用
- **Market Position**: MCPはLangChainを超え、OpenAPI/CrewAIに次ぐ主要プロトコルに成長

### 1.2 AnyCross Integration Platform

**リリース日**: 2025年3月1日
**提供範囲**: 全Larkプラン（Starter含む）

#### 概要

AnyCrossは、ノーコード/ローコードでLarkを他システムと統合するための公式APIインテグレーションツールです。

#### 主要機能

- **No-Code Integration**: コーディング不要でAPI統合
- **Workflow Automation**: ワークフローの自動化
- **Data Connectivity**: データ連携の簡素化
- **Enterprise Focus**: エンタープライズアプリケーション統合に最適化

#### 対応サードパーティアプリ

- Asana
- TikTok
- その他多数のビジネスアプリケーション

#### インパクト

AnyCrossの全プラン展開により、小規模チーム（Starterプラン）でも高度な統合ワークフローを利用可能になりました。

---

## 📊 2. Lark Base - New Features (2024-2025)

### 2.1 Version 7.51 - AI Empowerment

**リリース**: 2024年Q4 - 2025年Q1

Lark Baseの最新バージョンでは、AIを活用した自動化機能が大幅に強化されています。

#### AI機能

- **Automated Task Management**: 反復タスクの自動化による効率化
- **Intelligent Data Analysis**: AIによるデータ分析とインサイト生成
- **Predictive Workflows**: 予測的なワークフロー提案

### 2.2 Multidimensional Tables - Core Concept

Lark Baseは「シートベースデータベース」として、構造化されたコンテンツ管理と複数ビューでの表示を実現します。

#### View Types

| View | 用途 | 特徴 |
|------|------|------|
| **Grid View** | データ編集・管理 | 伝統的なスプレッドシートレイアウト |
| **Kanban View** | タスク管理 | 条件別カラム表示 |
| **Gantt View** | プロジェクトタイムライン | ドラッグ可能なプログレスバー |
| **Gallery View** | ビジュアル管理 | 画像・添付ファイルの視覚化 |

#### データ操作機能

- **Grouping**: 選択フィールドによる自動カテゴリ化
- **Filtering**: 複数条件での精密検索
- **Sorting**: 他ビューに影響しないレコード整理
- **Real-time Sync**: 全ビュー間でのリアルタイム同期

### 2.3 Upcoming Features (2025 Roadmap)

Larkは2025年に向けて、以下の高度機能を予定しています：

- ✅ **Webhook Triggers**: 外部システムからのイベント駆動自動化
- ✅ **Joint Table Analysis**: 複数テーブルの結合分析
- ✅ **Complex Workflow Support**: より複雑なワークフローへの対応
- ✅ **Enhanced Dashboard Analytics**: 多次元データ分析の強化

### 2.4 Base Extensions & Customization

#### Developer Ecosystem

- **Awesome BaseScript**: コミュニティが開発した拡張スクリプトライブラリ
  - GitHub: `ConnectAI-E/Awesome-BaseScript`
  - Excel Import
  - Cross-Join (Cartesian Product)
  - Global Search across all tables

#### Use Cases

- Task Management
- CRM
- Recruiting Management
- Content Creation Workflows
- Project Tracking

---

## ⚡ 3. Approval Workflow - Latest Specifications (2025)

### 3.1 Core Capabilities

Lark Approvalは、**ノーコードワークフロー自動化**プラットフォームとして、承認プロセスの大幅な時間短縮を実現しています。

#### Performance Improvement

> 顧客証言: 承認処理時間が「最大1週間 → 数時間」に短縮

### 3.2 Key Features

#### Flexible Workflow Design

| 機能 | 説明 |
|------|------|
| **Multi-Step Approval Flows** | 論理条件付き複数ステップフロー |
| **Deadlines & Reminders** | 期限設定と自動リマインダー |
| **Auto-Escalation** | 自動エスカレーションルール |
| **Role-Based Assignment** | 役割・部門・カスタム条件による割り当て |

#### Mobile-First Approach

- ✅ モバイルから直接承認/却下
- ✅ 新規・緊急リクエストのリアルタイム通知
- ✅ デスクから離れても対応可能

#### Centralized Context

- ✅ リクエスト、ファイル、チームインプットを1箇所に集約
- ✅ システムを離れずに全決定コンテキストを提供
- ✅ データベース自動同期で分析可能

### 3.3 Integration & Compliance

#### Workplace Integration

- **Lark Messenger統合**: アプリ切り替え不要で承認処理
- **Database Sync**: 承認データを自動でデータベース同期
- **Audit Trail**: コメント履歴による明確な監査証跡

#### Compliance & Security

- エラー防止のための意思決定履歴追跡
- 規制産業向けのコンプライアンス対応

### 3.4 Common Use Cases

1. **Invoice & Reimbursement**: 請求書・経費精算の迅速化
2. **Procurement Approval**: 調達承認プロセスの効率化
3. **Content & Marketing Assets**: コンテンツ・マーケティング素材の承認
4. **Travel & Leave Requests**: 出張・休暇申請の処理

### 3.5 Automation Workflow Limits by Plan

| Plan | Workflow Runs/Month | Suitable For |
|------|---------------------|--------------|
| **Starter** | 1,000 | 小規模チーム（基本自動化） |
| **Basic** | 1,000 | 中小規模組織（限定的自動化） |
| **Pro** | 50,000 | 成長企業（高頻度自動化） |
| **Enterprise** | 500,000 | 大企業（エンタープライズスケール） |

---

## 🤖 4. Genesis AI System - Clarification

### 4.1 調査結果

**重要**: 「Lark Genesis AI System」という統合製品は**存在しません**。

調査の結果、以下の独立したエンティティが確認されました：

#### Separate "Lark" Entities

1. **Lark Health**
   - **業種**: ヘルスケアAIコーチング
   - **概要**: AI + 認知行動療法による慢性疾患管理
   - **最新製品**: LarkVantage（GLP-1医薬品コスト管理AI）

2. **Lark (Y Combinator)**
   - **設立**: 2025年
   - **創業者**: Jack Brown, Vijit Dhingra
   - **概要**: AI企業向けネイティブ請求プラットフォーム

3. **Lark Suite**
   - **本調査対象**: コラボレーションプラットフォーム
   - **AI機能**: ナレッジ管理、ワークプレース自動化等

#### Separate "Genesis" Entities

1. **Genesis AI (Robotics)**
   - **資金調達**: $105M（2025年7月）
   - **概要**: ロボット基盤モデル（RFM）プラットフォーム
   - **目標**: 人間レベルのロボティクスインテリジェンス

2. **Genesis: Human Experience in AI Age**
   - **種別**: AI出版物
   - **内容**: 2025年のAIトレンド（生成AI → エージェンティックAI）

### 4.2 Lark Suite のAI機能（実際の統合）

Lark Suiteに統合されているAI機能：

- **AI Translation**: 無制限（全プラン）
- **Enterprise Search**: AI駆動の検索（全プラン）
- **AI Knowledge Bases**: インテリジェントビジネスナレッジ管理
- **Lark Base AI (v7.51)**: 反復タスク自動化
- **Generative AI in Workplace**: ドキュメント生成、AI自動化ツール

---

## 💰 5. Pricing Plans Comparison (2025)

### 5.1 Plan Overview

Larkは**4つの料金プラン**を提供しています：

| Plan | Price | Max Users | Storage | Workflow Runs/Month | Meeting Duration |
|------|-------|-----------|---------|---------------------|------------------|
| **Starter** | **Free** | 20 | 100 GB | 1,000 | Unavailable |
| **Basic** | Contact Sales | 500 | 5 TB | 1,000 | Unavailable |
| **Pro** | **$12/user/month** | 500 | 15 TB | 50,000 | 24 hours |
| **Enterprise** | **Custom** | Unlimited | 15 TB + 30 GB/seat | 500,000 | 24 hours |

### 5.2 Detailed Feature Comparison

#### Starter Plan (Free)

**ターゲット**: 小規模チーム（最大20ユーザー）

##### Included Features

- ✅ 11個の統合アプリ
- ✅ 100 GB ストレージ
- ✅ 1,000 自動化ワークフロー実行/月
- ✅ 無制限 AI翻訳
- ✅ エンタープライズ検索
- ✅ 無制限チャット・完全メッセージ履歴

##### Limitations

- ❌ ビデオ会議機能なし
- ❌ 最大20ユーザー
- ⚠️ 限定的なワークフロー実行回数

**最適用途**: スタートアップ、フリーランサー、小規模プロジェクトチーム

#### Basic Plan

**ターゲット**: 中小規模組織（特定地域限定）

##### Included Features

- ✅ 最大500ユーザー
- ✅ 5 TB ストレージ
- ✅ 1,000 ワークフロー実行/月
- ✅ 250 MB ファイルアップロード上限（Docs）

##### Limitations

- ❌ ビデオ会議機能なし
- ⚠️ 地域制限あり（特定国・地域のみ）
- ⚠️ Starterと同じワークフロー制限

**注意**: BasicプランはStarterからのアップグレードとしては推奨されません（ワークフロー制限が同一のため）。

#### Pro Plan ($12/user/month)

**ターゲット**: 成長企業（最大500ユーザー）

##### Included Features

- ✅ **無制限メッセージ履歴**
- ✅ **15 TB ストレージ**
- ✅ **50,000 ワークフロー実行/月** ← 大幅増
- ✅ **最大500参加者のビデオ通話**
- ✅ **24時間の会議時間**
- ✅ **50 GB ファイルアップロード上限**（Docs）
- ✅ AnyCross統合（2025年3月〜）

**最適用途**: 中規模企業、リモートチーム、活発な自動化ニーズ

#### Enterprise Plan (Custom Pricing)

**ターゲット**: 大企業、規制産業

##### Included Features

- ✅ **無制限シート（ユーザー）**
- ✅ **スーパーグループ（最大50,000メンバー）**
- ✅ **500,000 ワークフロー実行/月**
- ✅ **15 TB + 30 GB/ユーザー ストレージ**
- ✅ **100 GB ファイルアップロード上限**（Docs）
- ✅ **SSO（シングルサインオン）**
- ✅ **Advanced DLP（データ損失防止）**
- ✅ 24時間ビデオ会議（最大500参加者）

##### Security & Compliance

- エンタープライズグレード暗号化
- 権限管理
- セキュア共有リンク
- 完全監査証跡（コンプライアンス対応）

**最適用途**: 大企業、金融機関、医療機関、政府機関

### 5.3 2025 Pricing Updates

#### March 1, 2025 Changes

1. **AnyCross Integration Platform**: 全プランで利用可能に
   - 以前: Pro/Enterprise限定
   - 現在: Starter/Basic/Pro/Enterprise全て

2. **Storage Capacity**: Enterpriseプランで拡張
   - 基本15 TB + ユーザーごと30 GB追加

3. **Workflow Execution Limits**: 全プランで明確化
   - Starter/Basic: 1,000/月
   - Pro: 50,000/月（50倍）
   - Enterprise: 500,000/月（500倍）

### 5.4 Value Analysis

#### Cost per User (Annual)

| Plan | Monthly Cost | Annual Cost | Cost Savings |
|------|--------------|-------------|--------------|
| Starter | $0 | $0 | N/A |
| Pro | $12/user | $144/user | ~15% if annual billing |
| Enterprise | Custom | Custom | Volume discounts available |

#### Competitor Comparison (Pro Plan)

| Platform | Price/User/Month | Storage | Video | Workflow Automation |
|----------|------------------|---------|-------|---------------------|
| **Lark Pro** | **$12** | 15 TB | 500 users, 24h | 50,000/month |
| Slack Plus | $12.50 | Unlimited | Not included | Limited |
| Microsoft Teams | $12.50* | 1 TB/user | Yes | Power Automate extra |
| Google Workspace | $12 | 2 TB/user | Yes | Limited |

*Microsoft 365 Business Standard

**Larkの優位性**: 統合プラットフォーム（IM + Docs + Base + Approval + Video）で$12は競争力が高い。

---

## 📈 6. Market Positioning & Recommendations

### 6.1 Competitive Advantages

1. **All-in-One Platform**
   - メッセージング、ドキュメント、プロジェクト管理、承認ワークフロー、ビデオ会議を1つのプラットフォームに統合

2. **AI-Native Approach**
   - MCP統合でAIエージェントとのシームレス連携
   - Lark Base v7.51でAI自動化を標準装備

3. **Generous Free Tier**
   - Starterプラン（無料）で1,000ワークフロー実行/月
   - 小規模チームでも本格的な自動化が可能

4. **Enterprise-Grade Security**
   - SSO、Advanced DLP、監査証跡
   - 規制産業でも採用可能な水準

### 6.2 Potential Challenges

1. **Geographic Limitations**
   - Basicプランの地域制限
   - ByteDance傘下であることの政治的リスク（一部地域）

2. **Ecosystem Maturity**
   - Slack/Teamsと比較してサードパーティアプリ統合が少ない
   - ただし、AnyCross展開で改善予定

3. **Market Awareness**
   - 北米市場ではSlack/Teamsに認知度で劣る
   - アジア市場（特に中国・日本）での強み

### 6.3 Target Customer Profiles

#### Ideal Customers

- **中規模企業（50-500人）**: Proプランで最大のコストパフォーマンス
- **リモート/ハイブリッドチーム**: 統合ビデオ会議と非同期コラボレーション
- **高度な自動化ニーズ**: Approval + Base + AnyCrossの組み合わせ
- **アジア市場の企業**: 地域特化機能とサポート

#### Not Ideal For

- **極小チーム（5人以下）**: Starterで十分だが、他ツール（Slack Free等）と差別化薄い
- **高度なカスタマイゼーション必要**: エンタープライズプランでも、Microsoft/Googleエコシステムには劣る

### 6.4 Recommendations

#### For Small Teams (< 20 users)

→ **Starter Plan（無料）**
- 1,000ワークフロー実行/月で十分な自動化
- 成長に応じてProへ移行

#### For Growing Companies (20-500 users)

→ **Pro Plan ($12/user/month)**
- 最高のコストパフォーマンス
- 50,000ワークフロー実行で高度な自動化
- 24時間ビデオ会議

#### For Enterprises (500+ users)

→ **Enterprise Plan (Custom)**
- 無制限ユーザー
- 500,000ワークフロー実行
- SSO + Advanced DLP

#### For Developers/AI Teams

→ **Pro Plan + MCP Integration**
- MCP経由でAIエージェント統合
- AnyCrossで外部API接続
- カスタムワークフロー構築

---

## 🎯 7. 2025 Strategic Outlook

### 7.1 Key Trends

1. **AI-Powered Collaboration**: MCP統合で業界標準化
2. **No-Code Movement**: AnyCrossによる民主化
3. **Platform Consolidation**: 複数ツール → 統合プラットフォーム

### 7.2 Lark's Roadmap Focus

- **Webhook & Advanced Automation**: 2025年中に実装予定
- **Joint Table Analysis**: データ分析機能の強化
- **Expanded MCP Capabilities**: Beta → General Availability

### 7.3 Investment Recommendations

#### High Priority

- ✅ **MCP Integration**: AIエージェント開発チーム必須
- ✅ **AnyCross Mastery**: ノーコード自動化の中核
- ✅ **Lark Base Adoption**: プロジェクト管理の統合

#### Medium Priority

- ⚠️ **Developer Ecosystem**: コミュニティ主導の拡張開発
- ⚠️ **Multi-Region Deployment**: 地域制限の解消

---

## 📚 8. References & Resources

### Official Documentation

- **Lark Developer Portal**: https://open.larksuite.com/
- **Lark Open Platform Docs**: https://open.larksuite.com/document/ukTMukTMukTM/uITNz4iM1MjLyUzM
- **Pricing Page**: https://www.larksuite.com/en_us/plans
- **Plan Comparison**: https://www.larksuite.com/hc/en-US/articles/497171699982

### GitHub Repositories

- **Lark OpenAPI MCP**: https://github.com/larksuite/lark-openapi-mcp
- **Lark Node.js SDK**: https://www.npmjs.com/package/@larksuiteoapi/node-sdk
- **Awesome BaseScript**: https://github.com/ConnectAI-E/Awesome-BaseScript

### Product Pages

- **Lark Approval**: https://www.larksuite.com/en_us/product/approval
- **Lark Base**: https://www.larksuite.com/en_us/blog/why-lark-base-ultimate-project-management-tool
- **AnyCross**: https://www.larksuite.com/en_us/product/anycross

### Market Analysis

- **Lark Pricing on G2**: https://www.g2.com/products/lark-lark/pricing
- **TrustRadius Review**: https://www.trustradius.com/products/larksuite/pricing

---

## 🏁 9. Conclusion

Larkは2025年に向けて、**AI統合**（MCP）と**ノーコード自動化**（AnyCross）を軸に、エンタープライズコラボレーションプラットフォームとしての地位を強化しています。

### Key Takeaways

1. ✅ **MCP統合**は、AIエージェント開発チームにとって戦略的選択肢
2. ✅ **AnyCross全プラン展開**で、小規模チームでも高度な統合が可能
3. ✅ **Lark Base v7.51**のAI機能で、プロジェクト管理の生産性向上
4. ✅ **Proプラン ($12/user/month)** は、中規模企業に最適なコストパフォーマンス
5. ⚠️ **Genesis AI System**は存在しない（誤解を解消）

### Next Steps

- [ ] Lark Proプランの試用開始（14日間トライアル）
- [ ] MCP統合のPoC実施（AIエージェントテスト）
- [ ] AnyCrossでの既存ツール統合検証
- [ ] Lark Baseでのプロジェクト管理移行計画

---

**Report Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: MarketResearchAgent (しらべるん2号)
**Status**: Final
