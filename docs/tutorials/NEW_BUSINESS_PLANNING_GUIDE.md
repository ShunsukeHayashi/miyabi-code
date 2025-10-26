# 新規事業立案ガイド - Business Agents統合活用

## 概要

Miyabi Business Agentsを使用して、包括的な新規事業プランを自動生成するためのガイドです。
6つの戦略・企画系Business Agentsを統合的に活用し、創業者から実行可能な事業戦略まで一貫したプランを作成します。

## Business Agents統合フロー

### Phase 1: 戦略・企画系Business Agents (6個) - ✅ 完了

#### 1. SelfAnalysisAgent (自己分析・事業戦略立案)
**役割**: 創業者の強み・弱み・機会・脅威（SWOT）分析
**出力**: SWOT分析、スキル評価、キャリア整合性、リスク許容度、戦略的推奨事項

#### 2. AIEntrepreneurAgent (8フェーズビジネスプラン生成)
**役割**: スタートアップの包括的なビジネスプラン生成
**出力**: 8フェーズ実行計画、市場分析、財務予測、資金調達戦略、リスク分析

#### 3. ProductConceptAgent (MVP設計・プロダクト戦略立案)
**役割**: MVP設計、プロダクト・マーケット・フィット、リーンスタートアップ手法
**出力**: バリュープロポジション、ビジネスモデルキャンバス、MVP機能、成功指標

#### 4. ProductDesignAgent (プロダクト設計・技術仕様立案)
**役割**: ユーザーエクスペリエンス、システム設計、技術スタック選択
**出力**: プロダクトアーキテクチャ、UX設計、技術仕様、開発ロードマップ

#### 5. FunnelDesignAgent (ファネル設計・コンバージョン最適化)
**役割**: 顧客獲得からリテンションまでの全ステージ分析
**出力**: AARRRメトリクス、カスタマージャーニー、コンバージョン最適化戦略

#### 6. PersonaAgent (ペルソナ・顧客セグメント分析)
**役割**: ターゲット顧客の詳細なペルソナ作成
**出力**: プライマリ・セカンダリペルソナ、顧客セグメント、行動パターン、ニーズ分析

## 新規事業立案実行手順

### Step 1: 自己分析の実施
```bash
# SelfAnalysisAgent実行
miyabi agent run self-analysis --issue=<issue-id>
```

**入力情報**:
- 創業者の背景・経験
- 現在の職業・スキル
- 事業目標・ビジョン

**期待される出力**:
- SWOT分析結果
- スキル評価とギャップ分析
- キャリア整合性評価
- リスク許容度分析
- 戦略的推奨事項

### Step 2: 包括的ビジネスプラン生成
```bash
# AIEntrepreneurAgent実行
miyabi agent run ai-entrepreneur --issue=<issue-id>
```

**入力情報**:
- 事業アイデア
- ターゲット市場
- 創業者背景
- 予算・タイムライン

**期待される出力**:
- 8フェーズ実行計画
- 市場分析（TAM/SAM/SOM）
- 財務予測（3年間）
- 資金調達戦略
- リスク分析と対策

### Step 3: プロダクトコンセプト定義
```bash
# ProductConceptAgent実行
miyabi agent run product-concept --issue=<issue-id>
```

**入力情報**:
- ビジネスアイデア
- ターゲット市場
- 問題解決アプローチ

**期待される出力**:
- バリュープロポジション
- ビジネスモデルキャンバス
- MVP機能定義
- 成功指標設定
- ゴー・トゥ・マーケット戦略

### Step 4: プロダクト設計・技術仕様
```bash
# ProductDesignAgent実行
miyabi agent run product-design --issue=<issue-id>
```

**入力情報**:
- プロダクトコンセプト
- ターゲットユーザー
- 技術要件

**期待される出力**:
- プロダクトアーキテクチャ
- UX設計（ユーザーフロー、ワイヤーフレーム）
- 技術仕様（API設計、データベーススキーマ）
- 開発ロードマップ
- コンテンツ戦略

### Step 5: マーケティングファネル設計
```bash
# FunnelDesignAgent実行
miyabi agent run funnel-design --issue=<issue-id>
```

**入力情報**:
- プロダクト仕様
- ターゲット市場
- ビジネスモデル

**期待される出力**:
- AARRRメトリクス
- カスタマージャーニー
- コンバージョン最適化戦略
- リテンション戦略
- 収益最適化戦略

### Step 6: 顧客ペルソナ・セグメント分析
```bash
# PersonaAgent実行
miyabi agent run persona --issue=<issue-id>
```

**入力情報**:
- プロダクト仕様
- ターゲット市場
- 競合分析

**期待される出力**:
- プライマリ・セカンダリペルソナ
- 顧客セグメント分析
- 行動パターン分析
- ニーズ分析
- マーケティング戦略

## 統合実行例

### 完全自動実行
```bash
# 全6つのBusiness Agentsを順次実行
miyabi agent run business-planning --issue=<issue-id> --agents=all
```

### 段階的実行
```bash
# 戦略フェーズ
miyabi agent run business-planning --issue=<issue-id> --phase=strategy

# プロダクトフェーズ
miyabi agent run business-planning --issue=<issue-id> --phase=product

# マーケティングフェーズ
miyabi agent run business-planning --issue=<issue-id> --phase=marketing
```

## 出力統合

### 統合レポート生成
各Business Agentの出力を統合し、包括的な事業プランレポートを生成：

1. **エグゼクティブサマリー**
2. **自己分析結果**
3. **8フェーズビジネスプラン**
4. **プロダクト戦略**
5. **技術仕様**
6. **マーケティング戦略**
7. **顧客分析**
8. **実行計画**

### 品質保証
- 各Agentの出力検証
- 整合性チェック
- 完全性確認
- 品質スコアリング

## 次のステップ

### Phase 2: マーケティング・コンテンツ系Business Agents (5個) - 🔄 実装予定
- MarketResearchAgent: 市場調査・競合分析
- MarketingAgent: マーケティング戦略・キャンペーン企画
- ContentCreationAgent: コンテンツ制作・ブログ記事生成
- SNSStrategyAgent: SNS戦略・ソーシャルメディア運用
- YouTubeAgent: YouTube戦略・動画コンテンツ企画

### Phase 3: 営業・顧客管理系Business Agents (3個) - 🔄 実装予定
- SalesAgent: 営業戦略・リード獲得
- CRMAgent: 顧客関係管理・カスタマーサクセス
- AnalyticsAgent: データ分析・KPI管理

## 技術仕様

### 実行環境
- **LLM**: GPT-OSS-20B (Mac mini LAN/Tailscale/Groq fallback)
- **言語**: Rust 2021 Edition
- **フレームワーク**: Miyabi Agent Framework
- **出力形式**: JSON + Markdownレポート

### パフォーマンス
- **実行時間**: 各Agent 2-5分
- **品質スコア**: 85-95点
- **成功率**: 95%以上
- **並列実行**: 対応予定

## まとめ

Miyabi Business Agentsを使用することで、創業者は包括的で実行可能な事業プランを効率的に作成できます。
6つの戦略・企画系Business Agentsが完了したことで、新規事業立案の基盤が整いました。

次のマーケティング・コンテンツ系、営業・顧客管理系Business Agentsの実装により、
事業の全ライフサイクルをカバーする完全自律型ビジネスプラットフォームが完成します。
