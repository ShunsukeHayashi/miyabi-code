# Business Agents ユーザーガイド

## 概要

Miyabi Business Agentsは、スタートアップのライフサイクル全体をカバーする14個のAIエージェントです。戦略企画から営業・顧客管理まで、包括的なビジネス自動化を提供します。

## エージェント一覧

### 戦略・企画系（6個）

#### 1. AIEntrepreneurAgent（AI起業家エージェント）
**役割**: 8フェーズビジネスプラン生成
**機能**:
- TAM/SAM/SOM分析
- 収益モデル設計
- 資金調達戦略
- 競合分析
- リスク評価

**使用例**:
```bash
miyabi agent run ai-entrepreneur --issue=123
# または
miyabi agent run entrepreneur --issue=123
```

#### 2. ProductConceptAgent（プロダクトコンセプトエージェント）
**役割**: MVP設計・プロダクト戦略
**機能**:
- MVP機能定義
- 価値提案設計
- 差別化戦略
- 成功指標設定
- プロダクトロードマップ

**使用例**:
```bash
miyabi agent run product-concept --issue=123
# または
miyabi agent run concept --issue=123
```

#### 3. ProductDesignAgent（プロダクトデザインエージェント）
**役割**: 包括的プロダクト設計・技術仕様
**機能**:
- フロントエンド・バックエンド設計
- 技術スタック選定
- アーキテクチャ設計
- 開発ロードマップ
- 技術的実現可能性評価

**使用例**:
```bash
miyabi agent run product-design --issue=123
# または
miyabi agent run design --issue=123
```

#### 4. FunnelDesignAgent（ファネルデザインエージェント）
**役割**: AARRRメトリクス・コンバージョン最適化
**機能**:
- AARRRメトリクス設計
- 顧客獲得チャネル
- コンバージョン最適化
- リテンション戦略
- 収益化戦略

**使用例**:
```bash
miyabi agent run funnel-design --issue=123
# または
miyabi agent run funnel --issue=123
```

#### 5. PersonaAgent（ペルソナエージェント）
**役割**: 顧客ペルソナ・セグメント分析
**機能**:
- 顧客ペルソナ作成
- セグメンテーション
- 行動パターン分析
- ニーズ・ペインポイント
- カスタマージャーニー

**使用例**:
```bash
miyabi agent run persona --issue=123
```

#### 6. SelfAnalysisAgent（自己分析エージェント）
**役割**: 自己分析・ビジネス戦略策定
**機能**:
- SWOT分析
- スキル評価
- リスク許容度
- ビジネス戦略推奨
- 強み・弱み分析

**使用例**:
```bash
miyabi agent run self-analysis --issue=123
# または
miyabi agent run analysis --issue=123
```

### マーケティング系（5個）

#### 7. MarketResearchAgent（市場調査エージェント）
**役割**: 市場調査・競合分析
**機能**:
- 市場規模分析
- 競合分析
- トレンド分析
- 市場機会特定
- 参入障壁評価

**使用例**:
```bash
miyabi agent run market-research --issue=123
# または
miyabi agent run research --issue=123
```

#### 8. MarketingAgent（マーケティングエージェント）
**役割**: マーケティング戦略・キャンペーン企画
**機能**:
- ブランド戦略
- キャンペーン企画
- チャネル戦略
- メッセージング
- 予算配分

**使用例**:
```bash
miyabi agent run marketing --issue=123
```

#### 9. ContentCreationAgent（コンテンツ制作エージェント）
**役割**: コンテンツ制作・ブログ記事生成
**機能**:
- コンテンツカレンダー
- ブログ記事企画
- SEO戦略
- ソーシャルメディアコンテンツ
- コンテンツ配信戦略

**使用例**:
```bash
miyabi agent run content-creation --issue=123
# または
miyabi agent run content --issue=123
```

#### 10. SNSStrategyAgent（SNS戦略エージェント）
**役割**: SNS戦略・ソーシャルメディア運用
**機能**:
- プラットフォーム戦略
- コミュニティ管理
- インフルエンサーマーケティング
- SNS広告戦略
- エンゲージメント向上

**使用例**:
```bash
miyabi agent run sns-strategy --issue=123
# または
miyabi agent run sns --issue=123
```

#### 11. YouTubeAgent（YouTubeエージェント）
**役割**: YouTube戦略・動画コンテンツ企画
**機能**:
- チャンネル戦略
- 動画コンテンツ企画
- SEO最適化
- 収益化戦略
- サブスクライバー獲得

**使用例**:
```bash
miyabi agent run youtube --issue=123
```

### 営業・顧客管理系（3個）

#### 12. SalesAgent（営業エージェント）
**役割**: 営業戦略・セールスプロセス最適化
**機能**:
- セールスプロセス設計
- リードジェネレーション
- クロージング戦略
- 営業KPI管理
- 営業チーム構築

**使用例**:
```bash
miyabi agent run sales --issue=123
```

#### 13. CRMAgent（CRMエージェント）
**役割**: CRM戦略・顧客関係管理最適化
**機能**:
- 顧客セグメンテーション
- カスタマージャーニー
- リテンション戦略
- アップセル戦略
- 顧客満足度向上

**使用例**:
```bash
miyabi agent run crm --issue=123
```

#### 14. AnalyticsAgent（アナリティクスエージェント）
**役割**: データ分析・ビジネスインテリジェンス
**機能**:
- KPIフレームワーク
- ダッシュボード設計
- 予測分析
- レポート自動化
- データドリブン意思決定

**使用例**:
```bash
miyabi agent run analytics --issue=123
```

## 使用方法

### 1. 基本的な使用方法

```bash
# エージェント実行
miyabi agent run <agent-type> --issue=<issue-number>

# 例: AI起業家エージェントでIssue #123を処理
miyabi agent run ai-entrepreneur --issue=123
```

### 2. ワークフロー例

#### 新規事業立ち上げワークフロー

```bash
# 1. 自己分析
miyabi agent run self-analysis --issue=100

# 2. 市場調査
miyabi agent run market-research --issue=101

# 3. プロダクトコンセプト設計
miyabi agent run product-concept --issue=102

# 4. ビジネスプラン生成
miyabi agent run ai-entrepreneur --issue=103

# 5. マーケティング戦略
miyabi agent run marketing --issue=104

# 6. 営業戦略
miyabi agent run sales --issue=105
```

#### 既存事業の最適化ワークフロー

```bash
# 1. 顧客ペルソナ分析
miyabi agent run persona --issue=200

# 2. ファネル分析
miyabi agent run funnel-design --issue=201

# 3. コンテンツ戦略
miyabi agent run content-creation --issue=202

# 4. SNS戦略
miyabi agent run sns-strategy --issue=203

# 5. アナリティクス設定
miyabi agent run analytics --issue=204
```

### 3. 並列実行

複数のエージェントを並列実行することで、効率的な事業計画を立てることができます。

```bash
# 戦略企画を並列実行
miyabi agent run self-analysis --issue=100 &
miyabi agent run market-research --issue=101 &
miyabi agent run persona --issue=102 &
wait

# マーケティング戦略を並列実行
miyabi agent run marketing --issue=103 &
miyabi agent run content-creation --issue=104 &
miyabi agent run sns-strategy --issue=105 &
wait
```

## 出力形式

各エージェントは以下の形式で結果を出力します：

```json
{
  "status": "success",
  "metrics": {
    "duration_ms": 1500,
    "quality_score": 94
  },
  "data": {
    "summary": "Generated comprehensive business plan with 8 phases",
    "strategy": { /* 詳細な戦略データ */ }
  }
}
```

## 環境設定

### 必要な環境変数

```bash
# GitHub認証
export GITHUB_TOKEN=ghp_xxx

# LLM API（オプション）
export GROQ_API_KEY=sk-xxx
export ANTHROPIC_API_KEY=sk-xxx

# デバイス識別子（オプション）
export DEVICE_IDENTIFIER=MacBook
```

### 設定ファイル（.miyabi.yml）

```yaml
device_identifier: "MacBook"
github_token: "ghp_xxx"
repo_owner: "your-username"
repo_name: "your-repo"
use_task_tool: false
use_worktree: true
worktree_base_path: ".worktrees"
log_directory: "./logs"
report_directory: "./reports"
```

## トラブルシューティング

### よくある問題

#### 1. GitHub認証エラー
```bash
Error: GitHub token not found
```
**解決方法**:
```bash
# 環境変数で設定
export GITHUB_TOKEN=ghp_xxx

# または gh CLIで認証
gh auth login
```

#### 2. LLM APIエラー
```bash
Error: LLM execution failed
```
**解決方法**:
- APIキーが正しく設定されているか確認
- ネットワーク接続を確認
- レート制限に達していないか確認

#### 3. エージェントタイプエラー
```bash
Error: Invalid agent type
```
**解決方法**:
- サポートされているエージェントタイプを確認
- 短縮形・完全形の両方を試す

### ログ確認

```bash
# ログディレクトリを確認
ls -la logs/

# 最新のログを確認
tail -f logs/miyabi.log
```

## ベストプラクティス

### 1. Issue管理
- 各エージェント実行前にGitHub Issueを作成
- Issueには明確なタイトルと説明を記載
- 関連するラベルを付与

### 2. ワークフロー設計
- 依存関係を考慮した順序で実行
- 並列実行可能なタスクは同時に実行
- 結果を次のステップに活用

### 3. 品質管理
- 生成された戦略の品質スコアを確認
- 必要に応じて複数回実行
- 結果をレビューして改善

### 4. セキュリティ
- APIキーは環境変数で管理
- 機密情報はIssueに含めない
- 定期的にトークンを更新

## サポート

### ドキュメント
- [Entity-Relationモデル](docs/ENTITY_RELATION_MODEL.md)
- [テンプレート統合インデックス](docs/TEMPLATE_MASTER_INDEX.md)
- [ラベル体系ガイド](docs/LABEL_SYSTEM_GUIDE.md)

### コミュニティ
- [GitHub Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)
- [Discussions](https://github.com/ShunsukeHayashi/Miyabi/discussions)

### 更新情報
- [CHANGELOG.md](CHANGELOG.md)
- [Release Notes](https://github.com/ShunsukeHayashi/Miyabi/releases)

---

**Miyabi Business Agents** - スタートアップのライフサイクル全体をカバーする包括的なビジネス自動化プラットフォーム


