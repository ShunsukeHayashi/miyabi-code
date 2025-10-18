# Miyabi Discord フィードバック自動化システム

**Version**: 1.0.0
**作成日**: 2025-10-18
**担当**: Claude Code
**関連Issue**: #213

---

## 📋 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [コンポーネント設計](#コンポーネント設計)
4. [フィードバックパイプライン](#フィードバックパイプライン)
5. [実装計画](#実装計画)
6. [運用・監視](#運用監視)

---

## システム概要

### 🎯 目的

**「Discordコミュニティからのフィードバックを自動的に解析し、Miyabiプロダクトに反映する」**

### 主要機能

1. **Discord活動の自動監視**
   - メッセージのリアルタイム解析
   - バグレポート・フィーチャーリクエストの自動検出
   - 感情分析・トピック抽出

2. **フィードバック自動収集**
   - バグレポートの自動Issue化
   - フィーチャーリクエストの自動Issue化
   - よくある質問の自動FAQ化

3. **プロダクトへの自動反映**
   - GitHubへのIssue自動作成
   - IssueAgentによるラベル推論
   - CoordinatorAgentによる優先順位判定

4. **レポーティング**
   - 週次/月次レポート自動生成
   - KPI自動追跡
   - トレンド分析

---

## アーキテクチャ

### 🏗️ システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                   Discord Server                              │
│  - #bug-reports                                              │
│  - #feature-requests                                         │
│  - #help-*                                                   │
│  - #general                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Discord API (Webhooks)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Miyabi Community Bot (Rust)                        │
│  - Message listener                                          │
│  - Event handler                                             │
│  - Rate limiter                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Internal API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Feedback Analysis Engine (Rust + LLM)                │
│  - Message classification                                    │
│  - Sentiment analysis                                        │
│  - Topic extraction                                          │
│  - Duplicate detection                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   GitHub    │ │   Storage   │ │   Reporting │
│  Integration│ │   (SQLite)  │ │   Dashboard │
│             │ │             │ │             │
│ - Issue作成 │ │ - メッセージ │ │ - KPI追跡   │
│ - Label付与 │ │ - 統計情報  │ │ - レポート  │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

### データフロー

```
1. Discordメッセージ投稿
   │
   ▼
2. Botが受信（Webhook or Gateway）
   │
   ▼
3. フィルタリング（対象チャンネル、キーワード等）
   │
   ▼
4. LLM解析（分類、感情、トピック）
   │
   ├─ バグレポート検出
   │  └→ GitHub Issue自動作成（type:bug）
   │
   ├─ フィーチャーリクエスト検出
   │  └→ GitHub Issue自動作成（type:feature）
   │
   ├─ よくある質問検出
   │  └→ FAQ更新候補リストに追加
   │
   └─ 一般的な議論
      └→ トピック統計に記録
```

---

## コンポーネント設計

### 1. Miyabi Community Bot（Rust実装）

**Crate**: `crates/miyabi-discord-bot/`

**責任**:
- Discord APIとの通信
- メッセージ受信・イベント処理
- レート制限管理

**主要機能**:

#### 1.1. Message Listener

```rust
use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::prelude::*;

pub struct MessageListener {
    analysis_engine: Arc<AnalysisEngine>,
}

#[async_trait]
impl EventHandler for MessageListener {
    async fn message(&self, ctx: Context, msg: Message) {
        // フィルタリング
        if !self.should_process(&msg) {
            return;
        }

        // 解析エンジンに送信
        let analysis = self.analysis_engine.analyze(&msg).await;

        // アクション実行
        match analysis.action {
            Action::CreateIssue(issue_data) => {
                self.create_github_issue(issue_data).await;
            }
            Action::UpdateFAQ(faq_candidate) => {
                self.add_faq_candidate(faq_candidate).await;
            }
            Action::RecordTopic(topic) => {
                self.record_topic_stats(topic).await;
            }
            _ => {}
        }
    }
}
```

#### 1.2. Event Handler

**監視対象イベント**:
- `message_create`: 新規メッセージ
- `message_update`: メッセージ編集
- `reaction_add`: リアクション追加（重要度判定）
- `thread_create`: スレッド作成（フォーラムチャンネル）

---

### 2. Feedback Analysis Engine（Rust + LLM）

**Crate**: `crates/miyabi-feedback-analyzer/`

**責任**:
- メッセージ分類
- 感情分析
- トピック抽出
- 重複検出

**主要機能**:

#### 2.1. Message Classification

**分類カテゴリ**:
1. **Bug Report**: バグ報告
2. **Feature Request**: フィーチャーリクエスト
3. **Question**: 質問
4. **Feedback**: 一般的なフィードバック
5. **Discussion**: 議論
6. **Off-Topic**: オフトピック

**分類方法**:
- **ルールベース**（高速、低コスト）:
  - キーワード検出: "bug", "error", "crash", "broken"
  - チャンネル名: `#bug-reports` → Bug Report
- **LLMベース**（高精度、高コスト）:
  - GPT-OSS-20BによるZero-shot分類
  - Claude APIによる分類（フォールバック）

**実装例**:

```rust
use miyabi_llm::GPTOSSProvider;

pub struct MessageClassifier {
    llm: GPTOSSProvider,
}

impl MessageClassifier {
    pub async fn classify(&self, message: &str) -> MessageCategory {
        // Step 1: ルールベース分類
        if let Some(category) = self.rule_based_classify(message) {
            return category;
        }

        // Step 2: LLMベース分類
        let prompt = format!(
            r#"Classify the following Discord message into one of these categories:
- Bug Report
- Feature Request
- Question
- Feedback
- Discussion
- Off-Topic

Message: "{}"

Category:"#,
            message
        );

        let response = self.llm.generate(&LLMRequest {
            prompt,
            temperature: 0.0,
            max_tokens: 10,
            reasoning_effort: ReasoningEffort::Low,
        }).await?;

        self.parse_category(&response.text)
    }
}
```

---

#### 2.2. Sentiment Analysis

**感情スコア**:
- `-1.0` (Very Negative) 〜 `+1.0` (Very Positive)

**用途**:
- 重大なバグの優先順位判定
- コミュニティ満足度トラッキング
- ネガティブなフィードバックのエスカレーション

**実装例**:

```rust
pub async fn analyze_sentiment(&self, message: &str) -> f32 {
    let prompt = format!(
        r#"Analyze the sentiment of the following message.
Provide a score from -1.0 (very negative) to +1.0 (very positive).

Message: "{}"

Score:"#,
        message
    );

    let response = self.llm.generate(&LLMRequest {
        prompt,
        temperature: 0.0,
        max_tokens: 10,
        reasoning_effort: ReasoningEffort::Low,
    }).await?;

    response.text.trim().parse::<f32>().unwrap_or(0.0)
}
```

---

#### 2.3. Topic Extraction

**抽出トピック例**:
- "Worktree parallel execution"
- "Rust compilation error"
- "Business Agent usage"

**用途**:
- トレンド分析
- FAQ自動生成
- ドキュメント改善提案

---

#### 2.4. Duplicate Detection

**目的**: 既存のIssue/FAQと重複するフィードバックを検出

**手法**:
1. **Embedding-based similarity**:
   - OpenAI Embeddings APIで文章ベクトル化
   - コサイン類似度で重複判定（閾値: 0.85以上）

2. **Keyword-based matching**:
   - TF-IDF + Jaccard類似度

---

### 3. GitHub Integration（`miyabi-github` crate拡張）

**追加機能**:

#### 3.1. Automated Issue Creation

**トリガー**:
- `#bug-reports` でのバグレポート検出
- `#feature-requests` でのフィーチャーリクエスト検出

**Issue作成フロー**:
```
1. Discordメッセージ解析
   │
   ▼
2. 重複チェック
   │
   ├─ 重複あり → 既存Issueにコメント追加
   │
   └─ 重複なし
      │
      ▼
3. Issue本文生成（LLM）
   │
   ▼
4. IssueAgentでラベル推論
   │
   ▼
5. GitHub Issue作成
   │
   ▼
6. Discord投稿者にIssue URLを返信
```

**実装例**:

```rust
use octocrab::Octocrab;
use miyabi_agents::IssueAgent;

pub async fn create_issue_from_discord(
    message: &DiscordMessage,
    analysis: &MessageAnalysis,
) -> Result<String, MiyabiError> {
    // 重複チェック
    if let Some(existing_issue) = check_duplicate(&analysis.content).await? {
        comment_on_issue(&existing_issue, message).await?;
        return Ok(format!("Similar issue already exists: #{}", existing_issue));
    }

    // Issue本文生成
    let issue_body = generate_issue_body(message, analysis).await?;

    // IssueAgentでラベル推論
    let labels = IssueAgent::infer_labels(&issue_body).await?;

    // GitHub Issue作成
    let octocrab = Octocrab::builder()
        .personal_token(env::var("GITHUB_TOKEN")?)
        .build()?;

    let issue = octocrab
        .issues("ShunsukeHayashi", "Miyabi")
        .create(analysis.title.clone())
        .body(issue_body)
        .labels(labels)
        .send()
        .await?;

    Ok(format!("Created issue: #{}", issue.number))
}
```

---

### 4. Storage（SQLite）

**データベーススキーマ**:

```sql
-- Discordメッセージログ
CREATE TABLE discord_messages (
    id INTEGER PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    category TEXT,  -- Bug Report, Feature Request, etc.
    sentiment REAL, -- -1.0 to 1.0
    topics TEXT,    -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 自動作成されたIssue
CREATE TABLE auto_created_issues (
    id INTEGER PRIMARY KEY,
    discord_message_id TEXT NOT NULL,
    github_issue_number INTEGER NOT NULL,
    issue_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discord_message_id) REFERENCES discord_messages(message_id)
);

-- FAQ候補
CREATE TABLE faq_candidates (
    id INTEGER PRIMARY KEY,
    question TEXT NOT NULL,
    context TEXT,
    occurrences INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- トピック統計
CREATE TABLE topic_stats (
    id INTEGER PRIMARY KEY,
    topic TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    week TEXT NOT NULL, -- 'YYYY-WW' format
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic, week)
);
```

---

### 5. Reporting Dashboard

**機能**:

#### 5.1. 週次レポート自動生成

**内容**:
- 新規メッセージ数
- カテゴリ別メッセージ分布
- 平均感情スコア
- トップ5トピック
- 自動作成されたIssue数

**出力先**:
- Discord: `#feedback` チャンネルに自動投稿
- Email: Lead Moderator/Adminに送信

**レポート例**:

```
## 📊 週次レポート（2025-W42）

**新規メッセージ**: 342件（前週比 +12%）

**カテゴリ別分布**:
- Bug Report: 23件
- Feature Request: 18件
- Question: 85件
- Feedback: 42件
- Discussion: 174件

**平均感情スコア**: +0.67（ポジティブ）

**トップ5トピック**:
1. Worktree parallel execution (45件)
2. Rust compilation error (23件)
3. Business Agent usage (19件)
4. CodeGenAgent tips (15件)
5. Installation issues (12件)

**自動作成されたIssue**: 8件
- Bug Report: 5件
- Feature Request: 3件

**FAQ候補**: 12件（新規）
```

---

#### 5.2. KPI自動追跡

**追跡指標**:
- MAM（Monthly Active Members）
- 投稿数（月次）
- 質問回答率
- 平均応答時間
- 感情スコア推移

**ダッシュボード**:
- Web UI（将来: React + Rust backend）
- 現時点: CLIツール

---

## フィードバックパイプライン

### 🔄 パイプライン詳細

#### Pipeline 1: Bug Report → GitHub Issue

**トリガー**: `#bug-reports` でのメッセージ投稿

**ステップ**:
1. **メッセージ受信**
   - Bot: Discordメッセージ受信
   - 対象: `#bug-reports` チャンネル

2. **検証**
   - 最小文字数チェック（50文字以上）
   - 必須情報チェック（エラーメッセージ、再現手順）

3. **解析**
   - バグカテゴリ推定（compilation, runtime, UI, etc.）
   - 深刻度推定（Sev.1〜Sev.4）
   - 感情分析

4. **重複チェック**
   - 既存Issue検索（Embedding類似度）
   - 重複率 > 0.85 → 既存Issueにコメント

5. **Issue作成**
   - GitHub Issue作成
   - IssueAgentでラベル推論（`type:bug`, `severity:Sev.X`）
   - Discord投稿者にIssue URLを返信

**自動ラベル例**:
- `🐛 type:bug`
- `🚨 severity:Sev.2-High`
- `🔧 agent:codegen`（該当Agent）
- `📥 state:pending`

---

#### Pipeline 2: Feature Request → GitHub Issue

**トリガー**: `#feature-requests` でのメッセージ投稿

**ステップ**:
1. **メッセージ受信**
   - Bot: Discordメッセージ受信
   - 対象: `#feature-requests` チャンネル

2. **検証**
   - 最小文字数チェック（30文字以上）
   - 重複チェック

3. **解析**
   - フィーチャーカテゴリ推定（新Agent, UI改善, etc.）
   - ビジネス価値推定（High/Medium/Low）
   - コミュニティ需要推定（リアクション数）

4. **優先順位判定**
   - P0: Critical（多数の要望、高ビジネス価値）
   - P1: High
   - P2: Medium
   - P3: Low

5. **Issue作成**
   - GitHub Issue作成
   - ラベル推論（`type:feature`, `priority:PX`）
   - Discord投稿者にIssue URLを返信

---

#### Pipeline 3: FAQ候補抽出

**トリガー**: `#help-*` チャンネルでの質問→回答

**ステップ**:
1. **質問検出**
   - "?"で終わるメッセージ
   - 特定キーワード（"how to", "why", "what is"）

2. **回答検出**
   - 質問の直後の返信
   - リアクション（✅, 👍）が多い回答

3. **FAQ候補登録**
   - データベースに登録
   - 同じ質問が3回以上 → `status: 'approved'`

4. **FAQ更新**
   - 月次で承認済みFAQ候補を `#faq` に投稿
   - ドキュメント更新（DISCORD_COMMUNITY_GUIDELINES.md）

---

## 実装計画

### 🚀 3フェーズ実装

#### Phase 1: 基本機能（1〜2ヶ月）

**目標**: バグレポート/フィーチャーリクエストの自動Issue化

**タスク**:
- [ ] Discord Bot基盤構築（`miyabi-discord-bot` crate）
- [ ] Message Listener実装
- [ ] ルールベース分類実装
- [ ] GitHub Integration実装（Issue作成）
- [ ] SQLiteデータベース構築
- [ ] 基本的な週次レポート生成

**完了基準**:
- `#bug-reports` のメッセージがGitHub Issueに自動変換される
- `#feature-requests` のメッセージがGitHub Issueに自動変換される
- 週次レポートが自動生成される

---

#### Phase 2: 高度な解析（3〜4ヶ月）

**目標**: LLMベース解析、感情分析、重複検出

**タスク**:
- [ ] LLMベース分類実装（GPT-OSS-20B統合）
- [ ] 感情分析実装
- [ ] トピック抽出実装
- [ ] Embedding-based重複検出実装
- [ ] FAQ候補自動抽出
- [ ] KPI自動追跡

**完了基準**:
- LLMによる高精度な分類（精度90%以上）
- 感情スコアが信頼できる（人間評価との一致率80%以上）
- 重複検出が機能する（再現率80%以上）
- FAQ候補が月次で提案される

---

#### Phase 3: ダッシュボード・高度な機能（5〜6ヶ月）

**目標**: Web UI、予測分析、自動対応

**タスク**:
- [ ] Web UIダッシュボード構築（React + Rust backend）
- [ ] リアルタイムKPI表示
- [ ] トレンド予測（時系列分析）
- [ ] 自動応答bot（よくある質問への自動回答）
- [ ] エスカレーション自動化（重大バグのSlack/Email通知）

**完了基準**:
- Web UIダッシュボードが運用開始
- トレンド予測が月次レポートに含まれる
- よくある質問の50%以上が自動回答される

---

## 運用・監視

### 📊 監視項目

#### 1. Bot Health

**指標**:
- Uptime: 99.9%以上
- レスポンス時間: 平均500ms以下
- エラー率: 1%以下

**監視方法**:
- Prometheus + Grafana
- Discord Webhookでアラート通知

---

#### 2. LLM API

**指標**:
- API Call成功率: 99%以上
- 平均レイテンシ: 2秒以下
- コスト: $500/月以下（目標）

**監視方法**:
- LLM API使用量ダッシュボード
- 月次コストレポート

---

#### 3. Issue作成精度

**指標**:
- 適切なIssue率: 90%以上（人間評価）
- 誤検出率: 5%以下
- 重複検出精度: 80%以上

**監視方法**:
- 月次サンプリング評価（50件）
- コミュニティフィードバック

---

### 🔧 運用タスク

#### 日次
- [ ] Bot稼働状態確認
- [ ] エラーログ確認
- [ ] 自動作成されたIssueのレビュー（5分）

#### 週次
- [ ] 週次レポート確認
- [ ] FAQ候補レビュー
- [ ] パフォーマンスチェック

#### 月次
- [ ] LLMコスト確認
- [ ] Issue作成精度評価
- [ ] システム改善提案

---

## セキュリティ・プライバシー

### 🔒 セキュリティ対策

1. **Discord Bot Token管理**
   - 環境変数で管理（`.env`）
   - GitHub Secretsで保存
   - ローテーション（6ヶ月ごと）

2. **LLM API Key管理**
   - 同上

3. **データ保持ポリシー**
   - Discordメッセージ: 6ヶ月保存後削除
   - 統計情報: 無期限保存（個人情報削除）

4. **プライバシー**
   - ユーザーIDはハッシュ化して保存
   - 個人情報（メールアドレス等）は保存しない
   - GDPR準拠（削除リクエスト対応）

---

**システム設計完了！🎉**

**次のステップ**:
1. Phase 1実装開始
2. Discord Bot開発（`crates/miyabi-discord-bot/`）
3. Feedback Analyzer開発（`crates/miyabi-feedback-analyzer/`）

---

**フィードバック自動化システム設計者**: Claude Code
**最終更新**: 2025-10-18
