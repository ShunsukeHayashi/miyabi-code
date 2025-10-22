# AI駆動開発カンファレンス 2025秋 - スライド構成案

**セッションタイトル**: Issue作成からデプロイまで完全自律化 - 21個のAIエージェントが創る次世代開発体験

**登壇者**: 林俊輔 (Hayashi Shunsuke)

**形式**: 30分セッション（プレゼン 28分 + Q&A 2分）

**最終更新**: 2025-10-22

---

## 📊 スライド一覧（全40スライド）

### セクション1: イントロ（3分） - スライド 1-8

#### スライド1: タイトルスライド
**時間**: 30秒
**内容**:
- セッションタイトル: 「Issue作成からデプロイまで完全自律化」
- サブタイトル: 「21個のAIエージェントが創る次世代開発体験」
- 登壇者名: 林俊輔
- イベント名: AI駆動開発カンファレンス 2025秋
- 日付: 2025年10月30-31日

**ビジュアル**:
- シンプルでプロフェッショナルなデザイン
- Miyabiロゴ（中央）
- 21個のエージェントアイコン（背景に薄く配置）

**スピーカーノート**:
> 「皆さん、こんにちは。本日は『Issue作成からデプロイまで完全自律化』というテーマでお話しします。開発チームの全員が『もっと自動化できないか』と考える時代、Miyabiはその答えを21個のAIエージェントで実現しました。」

---

#### スライド2: 自己紹介
**時間**: 30秒
**内容**:
- 名前: 林俊輔 (Hayashi Shunsuke)
- 職業: フリーランスエンジニア（AI開発・自動化）
- 経歴: 10年以上のソフトウェア開発経験
- 専門: Rust, TypeScript, AI統合システム
- GitHub: @ShunsukeHayashi
- プロジェクト: Miyabi開発者

**ビジュアル**:
- 顔写真（プロフェッショナル）
- GitHub contributionsグラフ
- 主要技術スタックアイコン（Rust, TypeScript, React, AWS）

**スピーカーノート**:
> 「私は林俊輔と申します。フリーランスエンジニアとして、AI統合システムの開発を専門にしています。Miyabiは、私が『開発を完全自動化したい』という想いから生まれたプロジェクトです。」

---

#### スライド3: 今日のゴール
**時間**: 20秒
**内容**:
- **学べること**:
  1. AI駆動開発の新しいパラダイム
  2. 21個のエージェントによる完全自律化
  3. 実際の動作（ライブデモ）
  4. ビジネス自動化への応用

**ビジュアル**:
- 4つのゴールをアイコン付きで表示
- チェックリスト形式

**スピーカーノート**:
> 「今日のゴールは4つです。新しいパラダイムの理解、エージェント体系の把握、実際の動作確認、そしてビジネスへの応用可能性です。」

---

#### スライド4: 現在の開発現場の課題
**時間**: 30秒
**内容**:
- **課題1**: コーディングアシスト止まり（Copilot, Cursor）
- **課題2**: Issue→PRの手動作業が残る
- **課題3**: レビュー・デプロイは人間任せ
- **課題4**: ビジネス戦略は完全に人間依存

**ビジュアル**:
- 4つの課題を赤色で強調
- 従来ツールのロゴ（GitHub Copilot, Cursor）
- 矢印で「ここまでしかできない」を示す

**スピーカーノート**:
> 「現在のAI開発ツールは、コーディングアシストに留まっています。Issueの作成、PRの作成、レビュー、デプロイ、そしてビジネス戦略は依然として人間の仕事です。」

---

#### スライド5: Miyabiが解決する問題
**時間**: 30秒
**内容**:
- **解決1**: Issue作成→コード→PR→デプロイまで完全自動
- **解決2**: 品質レビューも自動（100点満点スコアリング）
- **解決3**: 並列実行で高速化（Git Worktree活用）
- **解決4**: ビジネス戦略も自動化（14個のBusiness Agents）

**ビジュアル**:
- 4つの解決策を緑色で強調
- Miyabiロゴ + チェックマーク
- 「従来ツール vs Miyabi」の対比表

**スピーカーノート**:
> 「Miyabiはこれら全てを解決します。Issue作成からデプロイまで完全自動化し、品質レビューもスコアリング、並列実行で高速化、さらにビジネス戦略まで自動化します。」

---

#### スライド6: AI駆動開発の3つのレベル
**時間**: 30秒
**内容**:
- **Level 1**: コーディングアシスト（Copilot, Cursor）← 現在地
- **Level 2**: タスク自動実行（一部自動化ツール）
- **Level 3**: プロセス完全自律化（**Miyabi**）← 目指す場所

**ビジュアル**:
- 3段階のピラミッド図
- Miyabiが最上位に位置
- 各レベルの代表ツールを配置

**スピーカーノート**:
> 「AI駆動開発には3つのレベルがあります。Level 1はコーディングアシスト、Level 2はタスク自動実行、そしてLevel 3がプロセス完全自律化です。Miyabiは Level 3 を実現する初のフレームワークです。」

---

#### スライド7: Miyabiの位置づけ
**時間**: 20秒
**内容**:
- **カテゴリ**: 完全自律型AI開発オペレーションプラットフォーム
- **特徴**: GitHub as OS アーキテクチャ
- **ライセンス**: オープンソース（MIT License）
- **実装**: Rust 2021 Edition

**ビジュアル**:
- ロゴ + 4つの特徴をアイコン付きで表示
- GitHub Stars数（リアルタイム）
- オープンソースバッジ

**スピーカーノート**:
> 「Miyabiは完全自律型のプラットフォームです。GitHub as OS アーキテクチャを採用し、オープンソースで公開しています。Rust実装により高速・安全・並列実行を実現しています。」

---

#### スライド8: セクションサマリー（イントロ）
**時間**: 10秒
**内容**:
- **現状**: コーディングアシスト止まり
- **課題**: プロセス全体の自動化が不十分
- **解決策**: Miyabi = 21個のエージェントによる完全自律化

**ビジュアル**:
- 3行サマリー
- 次のセクションへの矢印

**スピーカーノート**:
> 「では、Miyabiの全体像を見ていきましょう。」

---

### セクション2: Miyabi概要（5分） - スライド 9-18

#### スライド9: セクションタイトル - Miyabi概要
**時間**: 10秒
**内容**:
- 大きなタイトル: 「Miyabi概要」
- サブタイトル: 「21個のAIエージェントが創る自律型開発体験」

**ビジュアル**:
- シンプルなセクション区切りスライド
- 21個のエージェントアイコンを背景に配置

---

#### スライド10: GitHub as OS アーキテクチャ
**時間**: 40秒
**内容**:
- **コンセプト**: GitHubを開発OSとして活用
- **コンポーネント**:
  - Issues: データ永続化層
  - Projects V2: ステートマネジメント
  - Webhooks: イベントバス
  - Actions: 実行エンジン
  - Labels: 状態管理（57ラベル体系）

**ビジュアル**:
- GitHubロゴ + OS風のアーキテクチャ図
- 各コンポーネントを配置した図

**スピーカーノート**:
> 「MiyabiはGitHub as OSアーキテクチャを採用しています。GitHubのIssues、Projects、Webhooks、Actionsを開発OSとして活用し、57個のラベルで状態を管理します。」

---

#### スライド11: 21個のAIエージェント体系
**時間**: 40秒
**内容**:
- **Coding Agents（7個）**: 開発運用・自動化
  - Coordinator, CodeGen, Review, Issue, PR, Deployment, Refresher
- **Business Agents（14個）**: ビジネス戦略・マーケティング・営業
  - AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis, MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube, Sales, CRM, Analytics

**ビジュアル**:
- 21個のエージェントをカテゴリ別に配置
- 各エージェントにアイコン付き
- Coding（左側・緑色） / Business（右側・青色）

**スピーカーノート**:
> 「Miyabiは21個のエージェントで構成されます。Coding Agents 7個が開発を自動化し、Business Agents 14個がビジネス戦略を自動化します。」

---

#### スライド12: Coding Agents詳細
**時間**: 30秒
**内容**:
- **CoordinatorAgent**: タスク統括・DAG分解
- **CodeGenAgent**: AI駆動コード生成（Claude Sonnet 4）
- **ReviewAgent**: 品質レビュー（100点満点スコアリング）
- **IssueAgent**: Issue分析・ラベリング（AI推論）
- **PRAgent**: Pull Request自動作成（Conventional Commits）
- **DeploymentAgent**: CI/CDデプロイ自動化（Firebase/Vercel/AWS）
- **RefresherAgent**: Issue状態監視・自動更新

**ビジュアル**:
- 7個のエージェントをフローチャート風に配置
- Issue → Coordinator → CodeGen → Review → PR → Deployment の流れ

**スピーカーノート**:
> 「Coding Agentsは開発プロセス全体をカバーします。CoordinatorがタスクをDAG分解し、CodeGenがコード生成、Reviewが品質チェック、PRAgentがPR作成、DeploymentAgentがデプロイまで実行します。」

---

#### スライド13: Business Agents詳細
**時間**: 30秒
**内容**:
- **戦略・企画系（6個）**: AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
- **マーケティング系（5個）**: MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
- **営業・顧客管理系（3個）**: Sales, CRM, Analytics

**ビジュアル**:
- 14個のエージェントを3カテゴリに分類
- 各カテゴリを色分け（戦略=紫、マーケ=オレンジ、営業=赤）

**スピーカーノート**:
> 「Business Agentsは14個あり、戦略・企画、マーケティング、営業・顧客管理の3カテゴリに分かれます。AIEntrepreneurAgentは8フェーズでビジネスプラン全体を自動生成します。」

---

#### スライド14: 57ラベル体系
**時間**: 30秒
**内容**:
- **ラベルの役割**: 状態管理・自動化トリガー
- **10カテゴリ（57ラベル）**:
  1. STATE (8個): ライフサイクル管理
  2. AGENT (6個): Agent割り当て
  3. PRIORITY (4個): 優先度管理
  4. TYPE (7個): Issue分類
  5. SEVERITY (4個): 深刻度・エスカレーション
  6. PHASE (5個): プロジェクトフェーズ
  7. SPECIAL (7個): 特殊操作
  8. TRIGGER (4個): 自動化トリガー
  9. QUALITY (4個): 品質スコア
  10. COMMUNITY (4個): コミュニティ

**ビジュアル**:
- 10カテゴリを円形に配置
- 各カテゴリの代表ラベルを表示

**スピーカーノート**:
> 「57個のラベルが状態管理を担います。STATEラベルがライフサイクルを管理し、AGENTラベルがAgent割り当て、TRIGGERラベルが自動化を起動します。」

---

#### スライド15: 状態遷移フロー
**時間**: 30秒
**内容**:
```
📥 pending → 🔍 analyzing → 🏗️ implementing → 👀 reviewing → ✅ done
```
- 各状態でのAgent動作
- 自動遷移条件
- エスカレーション条件

**ビジュアル**:
- フローチャート（左→右）
- 各状態にエージェントアイコンを配置
- 自動遷移の矢印を強調

**スピーカーノート**:
> 「Issueは5つの状態を自動遷移します。pending状態でIssueAgentが分析、analyzing状態でCoordinatorがタスク分解、implementing状態でCodeGenが実装、reviewing状態でReviewが品質チェック、そしてdone状態で完了です。」

---

#### スライド16: Entity-Relation Model
**時間**: 30秒
**内容**:
- **12種類のEntity**: Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree
- **27の関係性**: Issue分解、Agent実行、PR作成、デプロイ等
- **統合管理**: すべてのコンポーネントが統合的に管理

**ビジュアル**:
- Entity-Relation図（簡略版）
- 主要な関係性（R1-R10）を強調

**スピーカーノート**:
> 「Miyabiは12種類のEntityと27の関係性で統合的に管理されています。Issue、Task、Agent、PR、Labelなどが関係性マップで結ばれ、一貫性のある動作を保証します。」

---

#### スライド17: Rust実装のメリット
**時間**: 30秒
**内容**:
- **50%以上の実行時間削減** - Rustの高速実行
- **30%以上のメモリ削減** - ゼロコスト抽象化
- **単一バイナリ配布** - Node.js依存の排除
- **コンパイル時型安全性** - ランタイムエラーの削減

**ビジュアル**:
- Before/After比較グラフ（実行時間、メモリ使用量）
- Rustロゴ + パフォーマンスアイコン

**スピーカーノート**:
> 「TypeScript版から Rust に完全移植しました。実行時間50%削減、メモリ30%削減を実現し、単一バイナリで配布可能です。型安全性によりランタイムエラーも削減されました。」

---

#### スライド18: セクションサマリー（Miyabi概要）
**時間**: 10秒
**内容**:
- **アーキテクチャ**: GitHub as OS
- **エージェント**: 21個（Coding 7 + Business 14）
- **状態管理**: 57ラベル体系
- **実装**: Rust 2021 Edition

**ビジュアル**:
- 4行サマリー
- 次のセクションへの矢印

**スピーカーノート**:
> 「では、実装詳細を見ていきましょう。」

---

### セクション3: 実装詳細（10分） - スライド 19-30

#### スライド19: セクションタイトル - 実装詳細
**時間**: 10秒
**内容**:
- 大きなタイトル: 「実装詳細」
- サブタイトル: 「Rust + Worktree + Error Recovery」

**ビジュアル**:
- シンプルなセクション区切りスライド
- Rustロゴ + Gitロゴ

---

#### スライド20: Cargo Workspace構成
**時間**: 40秒
**内容**:
```
crates/
├── miyabi-types/             # コア型定義
├── miyabi-core/              # 共通ユーティリティ
├── miyabi-cli/               # CLIツール (bin)
├── miyabi-agents/            # Coding Agent実装
├── miyabi-business-agents/   # Business Agent実装
├── miyabi-github/            # GitHub API統合
├── miyabi-worktree/          # Git Worktree管理
├── miyabi-llm/               # LLM抽象化層
├── miyabi-potpie/            # Potpie AI統合
└── miyabi-mcp-server/        # MCP Server
```

**ビジュアル**:
- Cargo Workspace階層図
- 各crateの役割を簡潔に記載

**スピーカーノート**:
> 「Miyabiは10個のcrateで構成されます。miyabi-typesがコア型定義、miyabi-agentsがエージェント実装、miyabi-worktreeがWorktree管理を担います。」

---

#### スライド21: Git Worktree並列実行アーキテクチャ
**時間**: 1分
**内容**:
- **コンセプト**: Issue毎に独立したWorktreeを作成
- **メリット**:
  1. 真の並列実行（コンフリクト最小化）
  2. 独立したディレクトリ（デバッグ容易）
  3. 簡単なロールバック（Worktree破棄）
  4. スケーラビリティ（制限なし）

**ビジュアル**:
```
CoordinatorAgent
        │
    ┌───┼───┐
    │   │   │
    ▼   ▼   ▼
  WT#1 WT#2 WT#3
  I#270 I#271 I#272
    │   │   │
    └───┼───┘
        ▼
   Merge Back
```

**スピーカーノート**:
> 「Git Worktreeを活用して並列実行を実現します。各IssueにWorktreeを作成し、Claude Codeが独立して実行します。コンフリクトが最小化され、デバッグも容易です。」

---

#### スライド22: Worktreeライフサイクル（4 Phase Protocol）
**時間**: 1分
**内容**:
- **Phase 1**: Worktree Creation - `createWorktree()` + コンテキスト生成
- **Phase 2**: Agent Assignment - Task typeベースの自動割り当て
- **Phase 3**: Execution - Claude Code実行 + git commit
- **Phase 4**: Cleanup - `pushWorktree()` + `mergeWorktree()` + `removeWorktree()`

**ビジュアル**:
- 4つのPhaseをフローチャートで表示
- 各Phaseの主要関数を記載

**スピーカーノート**:
> 「Worktreeは4つのPhaseで管理されます。作成、Agent割り当て、実行、そしてクリーンナップです。全てのWorktree操作はこのプロトコルに従います。」

---

#### スライド23: Agent実行コンテキスト
**時間**: 40秒
**内容**:
- **`.agent-context.json`** - 機械可読コンテキスト
  ```json
  {
    "agentType": "CodeGenAgent",
    "task": { /* Task詳細 */ },
    "issue": { /* Issue詳細 */ },
    "promptPath": ".claude/agents/prompts/coding/codegen-agent-prompt.md"
  }
  ```
- **`EXECUTION_CONTEXT.md`** - 人間可読コンテキスト

**ビジュアル**:
- 2つのファイルを並べて表示
- JSON構造のハイライト

**スピーカーノート**:
> 「各Worktreeには実行コンテキストファイルが生成されます。機械可読なJSONと人間可読なMarkdownの2形式で、AgentタイプやTask情報を保持します。」

---

#### スライド24: Error Recovery System
**時間**: 1分
**内容**:
- **機能1**: Automatic Retry - 最大3回、Exponential Backoff（10s → 20s → 40s）
- **機能2**: Manual Cancellation - 実行中・キュー中のタスクを即座にキャンセル
- **機能3**: Real-time Updates - WebSocket経由でリアルタイム通知
- **機能4**: Browser Notifications - デスクトップ通知

**ビジュアル**:
- 4つの機能をアイコン付きで表示
- Retryフローチャート（Exponential Backoff）

**スピーカーノート**:
> 「プロダクションレディなエラーリカバリーシステムを実装しました。自動リトライは最大3回、Exponential Backoffで実行します。手動キャンセルも可能です。」

---

#### スライド25: Error Recovery - API Endpoints
**時間**: 40秒
**内容**:
- **`POST /api/tasks/{task_id}/retry`** - タスクリトライ
  - Request: `{ "reason": "Network timeout" }`
  - Response: `{ "task_id": "123", "status": "submitted", "retry_count": 2 }`
- **`POST /api/tasks/{task_id}/cancel`** - タスクキャンセル
  - Response: `{ "task_id": "456", "status": "cancelled" }`

**ビジュアル**:
- 2つのエンドポイントをコードブロックで表示
- Request/Response例をハイライト

**スピーカーノート**:
> 「エラーリカバリーAPIは2つのエンドポイントを提供します。retryエンドポイントでリトライ、cancelエンドポイントでキャンセルができます。」

---

#### スライド26: Error Recovery - WebSocket Events
**時間**: 40秒
**内容**:
- **TaskRetry Event**:
  ```json
  {
    "type": "taskretry",
    "event": {
      "task_id": "123",
      "retry_count": 2,
      "next_retry_at": "2025-10-22T04:40:00Z"
    }
  }
  ```
- **TaskCancel Event**:
  ```json
  {
    "type": "taskcancel",
    "event": {
      "task_id": "456",
      "reason": "User cancelled"
    }
  }
  ```

**ビジュアル**:
- 2つのイベントをJSON形式で表示
- WebSocketアイコン + リアルタイム強調

**スピーカーノート**:
> 「WebSocketでリアルタイム通知を配信します。TaskRetryイベントとTaskCancelイベントがダッシュボードに即座に反映されます。」

---

#### スライド27: Error Dashboard UI
**時間**: 40秒
**内容**:
- **Critical Errors Section** - 失敗タスク一覧
- **Retry Count Badge** - `Retry 2/3` 表示
- **Next Retry Time Badge** - `Next: 14:30:45` 表示
- **Retry Button** - 即座にリトライ実行
- **Cancel Workflow Button** - 実行中タスクをキャンセル

**ビジュアル**:
- Error Dashboardのスクリーンショット
- Badgeとボタンをハイライト

**スピーカーノート**:
> 「Error Dashboardでは、リトライ回数と次回実行時刻がバッジで表示されます。RetryボタンとCancelボタンで即座に操作可能です。」

---

#### スライド28: LLM統合 - miyabi-llm
**時間**: 40秒
**内容**:
- **統一LLMインターフェース**: Claude, GPT-OSS-20B, Groq, vLLM, Ollama
- **Mac mini統合**: LAN/Tailscale経由でOllama接続
- **Reasoning Effort Levels**: Low/Medium/High
- **柔軟なプロバイダー切り替え**: 環境変数で即座に変更

**ビジュアル**:
- LLMプロバイダーロゴ一覧
- Mac miniアイコン + ネットワーク接続図

**スピーカーノート**:
> 「LLM統合層により、複数のLLMプロバイダーを統一的に扱えます。Mac mini経由でOllamaをローカル実行し、コスト削減と高速化を実現します。」

---

#### スライド29: Potpie AI統合 - 知識グラフ
**時間**: 40秒
**内容**:
- **Neo4j Knowledge Graph**: コード知識グラフ化
- **RAG Engine**: Retrieval-Augmented Generation
- **自動コード解析**: 依存関係・構造をグラフ化
- **コンテキスト最適化**: 関連コードのみを抽出

**ビジュアル**:
- Neo4jグラフ図（サンプル）
- RAGフロー図（Query → Retrieval → Generation）

**スピーカーノート**:
> 「Potpie AI統合により、コードをNeo4j知識グラフ化します。RAGエンジンで関連コードを抽出し、LLMのコンテキストを最適化します。」

---

#### スライド30: セクションサマリー（実装詳細）
**時間**: 20秒
**内容**:
- **Rust実装**: 高速・安全・並列実行
- **Worktree**: Git Worktreeで真の並列実行
- **Error Recovery**: 本番環境対応のエラー処理
- **LLM統合**: 複数プロバイダー対応

**ビジュアル**:
- 4行サマリー
- 次のセクションへの矢印

**スピーカーノート**:
> 「では、実際の動作を見ていきましょう。ライブデモを開始します。」

---

### セクション4: ライブデモ（7分） - スライド 31-35

#### スライド31: セクションタイトル - ライブデモ
**時間**: 10秒
**内容**:
- 大きなタイトル: 「ライブデモ」
- サブタイトル: 「Issue作成からデプロイまで7分で完結」

**ビジュアル**:
- シンプルなセクション区切りスライド
- 「LIVE」アイコン + カウントダウンタイマー

---

#### スライド32: デモシナリオ概要
**時間**: 30秒
**内容**:
1. **Issue作成（30秒）**: "JWT認証の実装"
2. **IssueAgent自動分析（30秒）**: 自動ラベル付与
3. **CoordinatorAgent タスク分解（1分）**: 5つのサブタスク + DAG構築
4. **CodeGenAgent コード生成（2分）**: Rust自動生成
5. **ReviewAgent 品質チェック（1分）**: スコア95/100
6. **PRAgent 自動PR作成（1分）**: Conventional Commits
7. **DeploymentAgent 自動デプロイ（1分）**: Staging環境

**ビジュアル**:
- 7ステップをタイムライン風に表示
- 各ステップの所要時間を強調

**スピーカーノート**:
> 「7つのステップで Issue からデプロイまでを実演します。合計7分で完結する様子をご覧ください。」

---

#### スライド33: ライブデモ実行
**時間**: 5分30秒
**内容**:
- **画面共有開始**
- ターミナル + ブラウザ（GitHub + Dashboard）を同時表示
- 実際のコマンド実行:
  ```bash
  # Issue作成
  gh issue create --title "JWT認証の実装" --body "..."

  # Agent実行
  miyabi agent run coordinator --issue 270
  ```
- リアルタイム進行状況表示
- Dashboard更新をリアルタイムで確認

**ビジュアル**:
- このスライドは画面共有のみ
- ターミナルとブラウザを split view

**スピーカーノート**:
> （デモ実行中のため、ナレーション中心）
> 「今、Issueを作成しました。IssueAgentが自動分析し、ラベルを付与しています。次にCoordinatorAgentがタスクを分解します...」

---

#### スライド34: デモ結果サマリー
**時間**: 40秒
**内容**:
- **Issue #270**: JWT認証の実装
- **タスク数**: 5個（DAG構築済み）
- **生成コード**: `crates/auth/src/jwt.rs` (200行)
- **テストカバレッジ**: 85%
- **品質スコア**: 95/100
- **PR**: #271 自動作成（feat: implement JWT authentication）
- **デプロイ**: Staging環境デプロイ完了

**ビジュアル**:
- 7つの結果を箇条書き
- チェックマーク付き
- GitHub PRスクリーンショット

**スピーカーノート**:
> 「7分で Issue からデプロイまでが完了しました。5つのタスクに分解され、200行のRustコードが生成され、品質スコア95点、そしてPRが自動作成されました。」

---

#### スライド35: セクションサマリー（ライブデモ）
**時間**: 20秒
**内容**:
- **所要時間**: 7分
- **自動化率**: 100%（人間の介入0）
- **品質**: 95/100点
- **結果**: PR作成 + Staging環境デプロイ完了

**ビジュアル**:
- 4行サマリー
- 次のセクションへの矢印

**スピーカーノート**:
> 「では、ビジネスエージェントの可能性について話します。」

---

### セクション5: ビジネスエージェントの可能性（3分） - スライド 36-38

#### スライド36: セクションタイトル - ビジネスエージェントの可能性
**時間**: 10秒
**内容**:
- 大きなタイトル: 「ビジネスエージェントの可能性」
- サブタイトル: 「開発だけでなく、ビジネス戦略も自動化」

**ビジュアル**:
- シンプルなセクション区切りスライド
- ビジネスアイコン（グラフ、マーケティング、営業）

---

#### スライド37: 14個のBusiness Agents
**時間**: 1分30秒
**内容**:
- **戦略・企画系（6個）**:
  - **AIEntrepreneurAgent**: 8フェーズビジネスプラン自動生成
  - **ProductConceptAgent**: USP・収益モデル設計
  - **ProductDesignAgent**: 6ヶ月分のコンテンツ・技術スタック・MVP定義
  - **FunnelDesignAgent**: 認知→購入→LTVまでの顧客導線最適化
  - **PersonaAgent**: 3-5人の詳細ペルソナ + カスタマージャーニー設計
  - **SelfAnalysisAgent**: キャリア・スキル・実績の詳細分析

- **マーケティング系（5個）**:
  - **MarketResearchAgent**: 市場トレンド分析と競合調査（20社以上）
  - **MarketingAgent**: 広告・SEO・SNS等を駆使した集客施策実行計画
  - **ContentCreationAgent**: 動画・記事・教材等の実コンテンツ制作計画
  - **SNSStrategyAgent**: Twitter/Instagram/YouTube等のSNS戦略立案と投稿カレンダー作成
  - **YouTubeAgent**: チャンネルコンセプト設計から投稿計画まで13ワークフロー完備

- **営業・顧客管理系（3個）**:
  - **SalesAgent**: リード→顧客の転換率最大化とセールスプロセス最適化
  - **CRMAgent**: 顧客満足度向上とLTV最大化のための顧客管理体制構築
  - **AnalyticsAgent**: 全データ分析・PDCAサイクル実行・継続的改善

**ビジュアル**:
- 14個のエージェントを3カテゴリに分類
- 各エージェントの主要機能を1行で記載

**スピーカーノート**:
> 「14個のBusiness Agentsがビジネス戦略を自動化します。AIEntrepreneurAgentは8フェーズでビジネスプラン全体を生成し、MarketResearchAgentは20社以上の競合調査を実行します。YouTubeAgentは13ワークフローでチャンネル運営を最適化します。」

---

#### スライド38: ビジネス自動化のユースケース
**時間**: 1分
**内容**:
- **ユースケース1**: スタートアップ起業支援
  - Self Analysis → Market Research → Product Concept → Business Plan → Marketing Strategy
- **ユースケース2**: 既存事業の成長加速
  - Funnel Design → SNS Strategy → Content Creation → CRM → Analytics
- **ユースケース3**: 新規事業立ち上げ
  - Persona → Product Design → Sales Strategy → Deployment

**ビジュアル**:
- 3つのユースケースをフローチャート風に表示
- 各ユースケースで使用するエージェントをハイライト

**スピーカーノート**:
> 「ビジネスエージェントは3つのユースケースで活用できます。スタートアップ起業支援、既存事業の成長加速、新規事業立ち上げです。各ユースケースで最適なエージェントが連携して動作します。」

---

### セクション6: まとめとQ&A（2分） - スライド 39-40

#### スライド39: まとめ
**時間**: 1分
**内容**:
- **今日のポイント**:
  1. **AI駆動開発の新しいパラダイム**: Level 3 = プロセス完全自律化
  2. **21個のエージェント**: Coding 7 + Business 14
  3. **実装技術**: Rust + Worktree + Error Recovery
  4. **ライブデモ**: Issue → コード → PR → デプロイ（7分で完結）
  5. **ビジネス自動化**: 14個のBusiness Agentsで戦略・マーケ・営業を自動化

- **Miyabiの独自性**:
  - GitHub as OS アーキテクチャ
  - 完全自律型オペレーションプラットフォーム
  - オープンソース（MIT License）

**ビジュアル**:
- 5つのポイントをチェックリスト形式で表示
- Miyabiロゴ + 主要技術スタックアイコン

**スピーカーノート**:
> 「まとめです。Miyabiは Level 3 のAI駆動開発を実現する初のプラットフォームです。21個のエージェントが開発からビジネスまで完全自律化し、Rust実装で高速・安全に動作します。」

---

#### スライド40: Q&A + コンタクト情報
**時間**: 1分
**内容**:
- **Q&A**: 「ご質問をどうぞ」

- **リンク**:
  - **GitHub**: https://github.com/ShunsukeHayashi/Miyabi
  - **Documentation**: https://shunsukehayashi.github.io/Miyabi/
  - **NPM**: https://www.npmjs.com/package/miyabi

- **コンタクト**:
  - Email: your-email@example.com
  - Twitter/X: @YourHandle
  - GitHub: @ShunsukeHayashi

**ビジュアル**:
- 大きな「Q&A」タイトル
- リンクとコンタクト情報を箇条書き
- QRコード（GitHub リポジトリへのリンク）

**スピーカーノート**:
> 「ご清聴ありがとうございました。ご質問があればどうぞ。GitHubリポジトリはオープンソースで公開しています。ぜひご覧ください。」

---

## 📝 スピーカーノート総括

### プレゼンテーション全体の流れ

1. **イントロ（3分）**: 課題提示 → Miyabiの解決策 → Level 3の位置づけ
2. **Miyabi概要（5分）**: GitHub as OS → 21エージェント → 57ラベル → Rust実装
3. **実装詳細（10分）**: Worktree並列実行 → Error Recovery → LLM統合
4. **ライブデモ（7分）**: Issue → コード → PR → デプロイ（リアルタイム実演）
5. **ビジネスエージェント（3分）**: 14エージェント → 3ユースケース
6. **まとめ（2分）**: 5つのポイント → Q&A

### プレゼンテーションのキーメッセージ

**メインメッセージ**: 「Miyabiは、Issue作成からデプロイまで完全自律化する初のプラットフォームです」

**サブメッセージ**:
1. 「既存ツール（Copilot, Cursor）はコーディングアシスト止まり。Miyabiはプロセス全体を自動化」
2. 「21個のエージェントが開発とビジネスの両方を自動化」
3. 「Rust実装で50%高速化、本番環境対応のError Recovery」
4. 「7分でIssueからデプロイまで完結（人間の介入0）」

### トークのトーン

- **専門的だが親しみやすく**: 技術詳細は正確に、でも専門用語の説明も入れる
- **熱意を持って**: 「完全自律化」という革新性を強調
- **具体的に**: 抽象論ではなく、実際のコード・画面・数字を見せる
- **対話的に**: デモ中は質問を投げかける（「ここでCoordinatorAgentが動いているのが見えますね？」）

### デモ実行時の注意事項

1. **事前準備**:
   - Backend起動: `cargo run --bin dashboard-server`
   - Frontend起動: `npm run dev`
   - GitHub Issue準備: テンプレート作成
   - ネットワーク確認: WebSocket接続テスト

2. **デモ中の説明**:
   - 各ステップで「今、何が起きているか」をナレーション
   - ターミナル出力を指差しながら説明
   - Dashboardのリアルタイム更新を強調

3. **バックアッププラン**:
   - デモ失敗時: 事前録画ビデオを再生
   - ネットワーク障害時: スライドのスクリーンショットで説明

---

## 🎨 デザインガイドライン

### カラーパレット

- **Primary Color**: #2563eb (青 - Miyabiメインカラー)
- **Secondary Color**: #10b981 (緑 - 成功・完了)
- **Accent Color**: #f59e0b (オレンジ - 警告・注目)
- **Error Color**: #ef4444 (赤 - エラー・失敗)
- **Background**: #ffffff (白 - 背景)
- **Text**: #1f2937 (濃いグレー - 本文)

### フォント

- **タイトル**: Noto Sans JP (Bold, 36-48pt)
- **本文**: Noto Sans JP (Regular, 18-24pt)
- **コード**: Fira Code (Monospace, 16-20pt)

### レイアウト

- **スライドサイズ**: 16:9 (1920x1080)
- **マージン**: 上下左右 80px
- **タイトル位置**: 上部中央
- **本文位置**: 中央（左寄せ）
- **アイコン**: 24x24px または 32x32px

### ビジュアル要素

- **アイコン**: シンプルなラインアイコン（Heroicons, Feather Icons等）
- **図**: Mermaid.js または Excalidraw で作成
- **グラフ**: Chart.js または D3.js で作成
- **スクリーンショット**: 高解像度（Retina対応）、影付き

---

## 📦 必要なアセット

### 画像

1. Miyabiロゴ（PNG, SVG）
2. 21個のエージェントアイコン（各24x24px）
3. GitHub, Rust, TypeScript, React等のロゴ
4. Dashboard スクリーンショット（Error Dashboard, Agents Dashboard）
5. ターミナル実行例スクリーンショット
6. GitHub Issue/PR スクリーンショット

### 動画

1. デモ実行録画（7分、1080p）
2. Worktree並列実行動画（30秒、タイムラプス）
3. Error Recovery動作デモ（1分）

### コードスニペット

1. Rust Agent実装例
2. Worktree作成コマンド
3. API Request/Response例
4. WebSocket Event JSON

---

## ✅ プレゼンテーション準備チェックリスト

### スライド作成（このドキュメント完成後）

- [ ] Keynote / PowerPoint / Google Slides でスライド作成
- [ ] 全40スライドのデザイン統一
- [ ] アニメーション追加（適度に）
- [ ] スピーカーノート転記
- [ ] PDF出力（配布用）

### デモ準備

- [ ] Backend + Frontend 起動確認
- [ ] GitHub Issue テンプレート作成
- [ ] デモ用リポジトリ準備（clean state）
- [ ] ネットワーク接続テスト（WiFi, WebSocket）
- [ ] デモ録画（バックアップ）

### リハーサル

- [ ] 1回目: 全体通し（タイミング確認）
- [ ] 2回目: デモ実行（成功率確認）
- [ ] 3回目: 時間調整（28分以内に収める）

### 機材確認

- [ ] ノートPC（充電済み）
- [ ] HDMIケーブル / USB-Cアダプター
- [ ] マウス / クリッカー
- [ ] 予備バッテリー
- [ ] イヤホン（音声確認用）

---

**スライド構成案 Version**: 1.0.0
**作成日**: 2025-10-22
**作成者**: Claude Code (AI Assistant)
**レビュー**: 林俊輔 (Hayashi Shunsuke)

**次のステップ**: Keynote/PowerPoint でスライド作成開始 🎨
