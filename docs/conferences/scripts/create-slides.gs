/**
 * AI駆動開発カンファレンス 2025秋 - Google Slides自動生成スクリプト
 *
 * このスクリプトは、AIDD_2025_SLIDES_STRUCTURE.md の内容を基に、
 * Google Slidesプレゼンテーションを自動生成します。
 *
 * 使用方法:
 * 1. Google Apps Script エディタでこのファイルを開く
 * 2. createPresentation() 関数を実行
 * 3. 生成されたプレゼンテーションのURLがログに表示される
 *
 * Version: 1.0.0
 * Created: 2025-10-22
 * Author: Claude Code (AI Assistant)
 */

// プレゼンテーション設定
const PRESENTATION_CONFIG = {
  title: 'Issue作成からデプロイまで完全自律化 - 21個のAIエージェントが創る次世代開発体験',
  subtitle: 'AI駆動開発カンファレンス 2025秋',
  speaker: '林俊輔 (Hayashi Shunsuke)',
  date: '2025年10月30-31日',

  // カラーパレット
  colors: {
    primary: '#2563eb',   // 青
    secondary: '#10b981', // 緑
    accent: '#f59e0b',    // オレンジ
    error: '#ef4444',     // 赤
    background: '#ffffff', // 白
    text: '#1f2937'       // 濃いグレー
  },

  // レイアウト設定
  layout: {
    width: 720,  // 10インチ (16:9)
    height: 405,
    marginTop: 40,
    marginBottom: 40,
    marginLeft: 60,
    marginRight: 60
  }
};

/**
 * メイン関数: プレゼンテーションを作成
 */
function createPresentation() {
  // 新しいプレゼンテーションを作成
  const presentation = SlidesApp.create(PRESENTATION_CONFIG.title);
  const presentationId = presentation.getId();

  Logger.log('プレゼンテーション作成開始: ' + presentationId);
  Logger.log('URL: https://docs.google.com/presentation/d/' + presentationId);

  // 最初のスライドを削除（デフォルトで作成される空スライド）
  const slides = presentation.getSlides();
  if (slides.length > 0) {
    slides[0].remove();
  }

  // 全40スライドのデータを取得
  const slidesData = getSlidesData();

  // 各スライドを作成
  slidesData.forEach((slideData, index) => {
    Logger.log(`スライド ${index + 1}/40 を作成中: ${slideData.title}`);
    createSlide(presentation, slideData, index + 1);
  });

  Logger.log('プレゼンテーション作成完了: ' + presentationId);
  Logger.log('URL: https://docs.google.com/presentation/d/' + presentationId);

  return presentationId;
}

/**
 * 個別スライドを作成
 * @param {SlidesApp.Presentation} presentation - プレゼンテーションオブジェクト
 * @param {Object} slideData - スライドデータ
 * @param {number} slideNumber - スライド番号
 */
function createSlide(presentation, slideData, slideNumber) {
  // スライドレイアウトを選択
  let slide;

  if (slideData.type === 'title') {
    // タイトルスライド
    slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  } else if (slideData.type === 'section') {
    // セクション区切りスライド
    slide = presentation.appendSlide(SlidesApp.PredefinedLayout.SECTION_HEADER);
  } else {
    // 通常スライド（タイトル + 本文）
    slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  }

  // タイトルを設定
  const shapes = slide.getShapes();
  shapes.forEach(shape => {
    if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
      const textRange = shape.getText();
      const placeholder = shape.getPlaceholderType();

      if (placeholder === SlidesApp.PlaceholderType.TITLE ||
          placeholder === SlidesApp.PlaceholderType.CENTERED_TITLE) {
        textRange.setText(slideData.title);
        textRange.getTextStyle()
          .setBold(true)
          .setFontSize(36)
          .setForegroundColor(PRESENTATION_CONFIG.colors.primary);
      } else if (placeholder === SlidesApp.PlaceholderType.BODY ||
                 placeholder === SlidesApp.PlaceholderType.SUBTITLE) {
        if (slideData.content) {
          textRange.setText(slideData.content);
          textRange.getTextStyle()
            .setFontSize(18)
            .setForegroundColor(PRESENTATION_CONFIG.colors.text);
        }
      }
    }
  });

  // スピーカーノートを追加
  if (slideData.speakerNotes) {
    const notesPage = slide.getNotesPage();
    const notesSpeakerNotesShape = notesPage.getSpeakerNotesShape();
    notesSpeakerNotesShape.getText().setText(slideData.speakerNotes);
  }
}

/**
 * 全40スライドのデータを取得
 * @returns {Array<Object>} スライドデータの配列
 */
function getSlidesData() {
  return [
    // セクション1: イントロ（3分） - スライド 1-8
    {
      type: 'title',
      title: 'Issue作成からデプロイまで完全自律化',
      content: '21個のAIエージェントが創る次世代開発体験\n\n林俊輔 (Hayashi Shunsuke)\nAI駆動開発カンファレンス 2025秋\n2025年10月30-31日',
      speakerNotes: '皆さん、こんにちは。本日は『Issue作成からデプロイまで完全自律化』というテーマでお話しします。開発チームの全員が『もっと自動化できないか』と考える時代、Miyabiはその答えを21個のAIエージェントで実現しました。'
    },
    {
      type: 'normal',
      title: '自己紹介',
      content: '林俊輔 (Hayashi Shunsuke)\n\n• フリーランスエンジニア（AI開発・自動化）\n• 10年以上のソフトウェア開発経験\n• 専門: Rust, TypeScript, AI統合システム\n• GitHub: @ShunsukeHayashi\n• プロジェクト: Miyabi開発者',
      speakerNotes: '私は林俊輔と申します。フリーランスエンジニアとして、AI統合システムの開発を専門にしています。Miyabiは、私が『開発を完全自動化したい』という想いから生まれたプロジェクトです。'
    },
    {
      type: 'normal',
      title: '今日のゴール',
      content: '学べること:\n\n1. AI駆動開発の新しいパラダイム\n2. 21個のエージェントによる完全自律化\n3. 実際の動作（ライブデモ）\n4. ビジネス自動化への応用',
      speakerNotes: '今日のゴールは4つです。新しいパラダイムの理解、エージェント体系の把握、実際の動作確認、そしてビジネスへの応用可能性です。'
    },
    {
      type: 'normal',
      title: '現在の開発現場の課題',
      content: '• 課題1: コーディングアシスト止まり（Copilot, Cursor）\n• 課題2: Issue→PRの手動作業が残る\n• 課題3: レビュー・デプロイは人間任せ\n• 課題4: ビジネス戦略は完全に人間依存',
      speakerNotes: '現在のAI開発ツールは、コーディングアシストに留まっています。Issueの作成、PRの作成、レビュー、デプロイ、そしてビジネス戦略は依然として人間の仕事です。'
    },
    {
      type: 'normal',
      title: 'Miyabiが解決する問題',
      content: '✅ 解決1: Issue作成→コード→PR→デプロイまで完全自動\n✅ 解決2: 品質レビューも自動（100点満点スコアリング）\n✅ 解決3: 並列実行で高速化（Git Worktree活用）\n✅ 解決4: ビジネス戦略も自動化（14個のBusiness Agents）',
      speakerNotes: 'Miyabiはこれら全てを解決します。Issue作成からデプロイまで完全自動化し、品質レビューもスコアリング、並列実行で高速化、さらにビジネス戦略まで自動化します。'
    },
    {
      type: 'normal',
      title: 'AI駆動開発の3つのレベル',
      content: 'Level 1: コーディングアシスト（Copilot, Cursor）← 現在地\n\nLevel 2: タスク自動実行（一部自動化ツール）\n\nLevel 3: プロセス完全自律化（Miyabi）← 目指す場所',
      speakerNotes: 'AI駆動開発には3つのレベルがあります。Level 1はコーディングアシスト、Level 2はタスク自動実行、そしてLevel 3がプロセス完全自律化です。Miyabiは Level 3 を実現する初のフレームワークです。'
    },
    {
      type: 'normal',
      title: 'Miyabiの位置づけ',
      content: '• カテゴリ: 完全自律型AI開発オペレーションプラットフォーム\n• 特徴: GitHub as OS アーキテクチャ\n• ライセンス: オープンソース（MIT License）\n• 実装: Rust 2021 Edition',
      speakerNotes: 'Miyabiは完全自律型のプラットフォームです。GitHub as OS アーキテクチャを採用し、オープンソースで公開しています。Rust実装により高速・安全・並列実行を実現しています。'
    },
    {
      type: 'normal',
      title: 'セクションサマリー',
      content: '• 現状: コーディングアシスト止まり\n• 課題: プロセス全体の自動化が不十分\n• 解決策: Miyabi = 21個のエージェントによる完全自律化',
      speakerNotes: 'では、Miyabiの全体像を見ていきましょう。'
    },

    // セクション2: Miyabi概要（5分） - スライド 9-18
    {
      type: 'section',
      title: 'Miyabi概要',
      content: '21個のAIエージェントが創る自律型開発体験',
      speakerNotes: 'セクション2: Miyabi概要を開始します。'
    },
    {
      type: 'normal',
      title: 'GitHub as OS アーキテクチャ',
      content: 'コンセプト: GitHubを開発OSとして活用\n\nコンポーネント:\n• Issues: データ永続化層\n• Projects V2: ステートマネジメント\n• Webhooks: イベントバス\n• Actions: 実行エンジン\n• Labels: 状態管理（57ラベル体系）',
      speakerNotes: 'MiyabiはGitHub as OSアーキテクチャを採用しています。GitHubのIssues、Projects、Webhooks、Actionsを開発OSとして活用し、57個のラベルで状態を管理します。'
    },
    {
      type: 'normal',
      title: '21個のAIエージェント体系',
      content: 'Coding Agents（7個）: 開発運用・自動化\n• Coordinator, CodeGen, Review, Issue, PR, Deployment, Refresher\n\nBusiness Agents（14個）: ビジネス戦略・マーケティング・営業\n• AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis, MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube, Sales, CRM, Analytics',
      speakerNotes: 'Miyabiは21個のエージェントで構成されます。Coding Agents 7個が開発を自動化し、Business Agents 14個がビジネス戦略を自動化します。'
    },
    {
      type: 'normal',
      title: 'Coding Agents詳細',
      content: '• CoordinatorAgent: タスク統括・DAG分解\n• CodeGenAgent: AI駆動コード生成（Claude Sonnet 4）\n• ReviewAgent: 品質レビュー（100点満点スコアリング）\n• IssueAgent: Issue分析・ラベリング（AI推論）\n• PRAgent: Pull Request自動作成（Conventional Commits）\n• DeploymentAgent: CI/CDデプロイ自動化（Firebase/Vercel/AWS）\n• RefresherAgent: Issue状態監視・自動更新',
      speakerNotes: 'Coding Agentsは開発プロセス全体をカバーします。CoordinatorがタスクをDAG分解し、CodeGenがコード生成、Reviewが品質チェック、PRAgentがPR作成、DeploymentAgentがデプロイまで実行します。'
    },
    {
      type: 'normal',
      title: 'Business Agents詳細',
      content: '戦略・企画系（6個）:\n• AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis\n\nマーケティング系（5個）:\n• MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube\n\n営業・顧客管理系（3個）:\n• Sales, CRM, Analytics',
      speakerNotes: 'Business Agentsは14個あり、戦略・企画、マーケティング、営業・顧客管理の3カテゴリに分かれます。AIEntrepreneurAgentは8フェーズでビジネスプラン全体を自動生成します。'
    },
    {
      type: 'normal',
      title: '57ラベル体系',
      content: 'ラベルの役割: 状態管理・自動化トリガー\n\n10カテゴリ（57ラベル）:\n1. STATE (8個): ライフサイクル管理\n2. AGENT (6個): Agent割り当て\n3. PRIORITY (4個): 優先度管理\n4. TYPE (7個): Issue分類\n5. SEVERITY (4個): 深刻度・エスカレーション\n6. PHASE (5個): プロジェクトフェーズ\n7. SPECIAL (7個): 特殊操作\n8. TRIGGER (4個): 自動化トリガー\n9. QUALITY (4個): 品質スコア\n10. COMMUNITY (4個): コミュニティ',
      speakerNotes: '57個のラベルが状態管理を担います。STATEラベルがライフサイクルを管理し、AGENTラベルがAgent割り当て、TRIGGERラベルが自動化を起動します。'
    },
    {
      type: 'normal',
      title: '状態遷移フロー',
      content: '📥 pending → 🔍 analyzing → 🏗️ implementing → 👀 reviewing → ✅ done\n\n• 各状態でのAgent動作\n• 自動遷移条件\n• エスカレーション条件',
      speakerNotes: 'Issueは5つの状態を自動遷移します。pending状態でIssueAgentが分析、analyzing状態でCoordinatorがタスク分解、implementing状態でCodeGenが実装、reviewing状態でReviewが品質チェック、そしてdone状態で完了です。'
    },
    {
      type: 'normal',
      title: 'Entity-Relation Model',
      content: '12種類のEntity:\n• Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree\n\n27の関係性:\n• Issue分解、Agent実行、PR作成、デプロイ等\n\n統合管理:\n• すべてのコンポーネントが統合的に管理',
      speakerNotes: 'Miyabiは12種類のEntityと27の関係性で統合的に管理されています。Issue、Task、Agent、PR、Labelなどが関係性マップで結ばれ、一貫性のある動作を保証します。'
    },
    {
      type: 'normal',
      title: 'Rust実装のメリット',
      content: '✅ 50%以上の実行時間削減 - Rustの高速実行\n✅ 30%以上のメモリ削減 - ゼロコスト抽象化\n✅ 単一バイナリ配布 - Node.js依存の排除\n✅ コンパイル時型安全性 - ランタイムエラーの削減',
      speakerNotes: 'TypeScript版から Rust に完全移植しました。実行時間50%削減、メモリ30%削減を実現し、単一バイナリで配布可能です。型安全性によりランタイムエラーも削減されました。'
    },
    {
      type: 'normal',
      title: 'セクションサマリー',
      content: '• アーキテクチャ: GitHub as OS\n• エージェント: 21個（Coding 7 + Business 14）\n• 状態管理: 57ラベル体系\n• 実装: Rust 2021 Edition',
      speakerNotes: 'では、実装詳細を見ていきましょう。'
    },

    // セクション3: 実装詳細（10分） - スライド 19-30
    {
      type: 'section',
      title: '実装詳細',
      content: 'Rust + Worktree + Error Recovery',
      speakerNotes: 'セクション3: 実装詳細を開始します。'
    },
    {
      type: 'normal',
      title: 'Cargo Workspace構成',
      content: 'crates/\n├── miyabi-types/             # コア型定義\n├── miyabi-core/              # 共通ユーティリティ\n├── miyabi-cli/               # CLIツール (bin)\n├── miyabi-agents/            # Coding Agent実装\n├── miyabi-business-agents/   # Business Agent実装\n├── miyabi-github/            # GitHub API統合\n├── miyabi-worktree/          # Git Worktree管理\n├── miyabi-llm/               # LLM抽象化層\n├── miyabi-potpie/            # Potpie AI統合\n└── miyabi-mcp-server/        # MCP Server',
      speakerNotes: 'Miyabiは10個のcrateで構成されます。miyabi-typesがコア型定義、miyabi-agentsがエージェント実装、miyabi-worktreeがWorktree管理を担います。'
    },
    {
      type: 'normal',
      title: 'Git Worktree並列実行アーキテクチャ',
      content: 'コンセプト: Issue毎に独立したWorktreeを作成\n\nメリット:\n1. 真の並列実行（コンフリクト最小化）\n2. 独立したディレクトリ（デバッグ容易）\n3. 簡単なロールバック（Worktree破棄）\n4. スケーラビリティ（制限なし）',
      speakerNotes: 'Git Worktreeを活用して並列実行を実現します。各IssueにWorktreeを作成し、Claude Codeが独立して実行します。コンフリクトが最小化され、デバッグも容易です。'
    },
    {
      type: 'normal',
      title: 'Worktreeライフサイクル（4 Phase Protocol）',
      content: 'Phase 1: Worktree Creation\n  createWorktree() + コンテキスト生成\n\nPhase 2: Agent Assignment\n  Task typeベースの自動割り当て\n\nPhase 3: Execution\n  Claude Code実行 + git commit\n\nPhase 4: Cleanup\n  pushWorktree() + mergeWorktree() + removeWorktree()',
      speakerNotes: 'Worktreeは4つのPhaseで管理されます。作成、Agent割り当て、実行、そしてクリーンナップです。全てのWorktree操作はこのプロトコルに従います。'
    },
    {
      type: 'normal',
      title: 'Agent実行コンテキスト',
      content: '.agent-context.json - 機械可読コンテキスト\n{\n  "agentType": "CodeGenAgent",\n  "task": { /* Task詳細 */ },\n  "issue": { /* Issue詳細 */ },\n  "promptPath": ".claude/agents/prompts/coding/codegen-agent-prompt.md"\n}\n\nEXECUTION_CONTEXT.md - 人間可読コンテキスト',
      speakerNotes: '各Worktreeには実行コンテキストファイルが生成されます。機械可読なJSONと人間可読なMarkdownの2形式で、AgentタイプやTask情報を保持します。'
    },
    {
      type: 'normal',
      title: 'Error Recovery System',
      content: '機能1: Automatic Retry\n  最大3回、Exponential Backoff（10s → 20s → 40s）\n\n機能2: Manual Cancellation\n  実行中・キュー中のタスクを即座にキャンセル\n\n機能3: Real-time Updates\n  WebSocket経由でリアルタイム通知\n\n機能4: Browser Notifications\n  デスクトップ通知',
      speakerNotes: 'プロダクションレディなエラーリカバリーシステムを実装しました。自動リトライは最大3回、Exponential Backoffで実行します。手動キャンセルも可能です。'
    },
    {
      type: 'normal',
      title: 'Error Recovery - API Endpoints',
      content: 'POST /api/tasks/{task_id}/retry - タスクリトライ\n  Request: { "reason": "Network timeout" }\n  Response: { "task_id": "123", "status": "submitted", "retry_count": 2 }\n\nPOST /api/tasks/{task_id}/cancel - タスクキャンセル\n  Response: { "task_id": "456", "status": "cancelled" }',
      speakerNotes: 'エラーリカバリーAPIは2つのエンドポイントを提供します。retryエンドポイントでリトライ、cancelエンドポイントでキャンセルができます。'
    },
    {
      type: 'normal',
      title: 'Error Recovery - WebSocket Events',
      content: 'TaskRetry Event:\n{\n  "type": "taskretry",\n  "event": {\n    "task_id": "123",\n    "retry_count": 2,\n    "next_retry_at": "2025-10-22T04:40:00Z"\n  }\n}\n\nTaskCancel Event:\n{\n  "type": "taskcancel",\n  "event": {\n    "task_id": "456",\n    "reason": "User cancelled"\n  }\n}',
      speakerNotes: 'WebSocketでリアルタイム通知を配信します。TaskRetryイベントとTaskCancelイベントがダッシュボードに即座に反映されます。'
    },
    {
      type: 'normal',
      title: 'Error Dashboard UI',
      content: '• Critical Errors Section - 失敗タスク一覧\n• Retry Count Badge - Retry 2/3 表示\n• Next Retry Time Badge - Next: 14:30:45 表示\n• Retry Button - 即座にリトライ実行\n• Cancel Workflow Button - 実行中タスクをキャンセル',
      speakerNotes: 'Error Dashboardでは、リトライ回数と次回実行時刻がバッジで表示されます。RetryボタンとCancelボタンで即座に操作可能です。'
    },
    {
      type: 'normal',
      title: 'LLM統合 - miyabi-llm',
      content: '• 統一LLMインターフェース: Claude, GPT-OSS-20B, Groq, vLLM, Ollama\n• Mac mini統合: LAN/Tailscale経由でOllama接続\n• Reasoning Effort Levels: Low/Medium/High\n• 柔軟なプロバイダー切り替え: 環境変数で即座に変更',
      speakerNotes: 'LLM統合層により、複数のLLMプロバイダーを統一的に扱えます。Mac mini経由でOllamaをローカル実行し、コスト削減と高速化を実現します。'
    },
    {
      type: 'normal',
      title: 'Potpie AI統合 - 知識グラフ',
      content: '• Neo4j Knowledge Graph: コード知識グラフ化\n• RAG Engine: Retrieval-Augmented Generation\n• 自動コード解析: 依存関係・構造をグラフ化\n• コンテキスト最適化: 関連コードのみを抽出',
      speakerNotes: 'Potpie AI統合により、コードをNeo4j知識グラフ化します。RAGエンジンで関連コードを抽出し、LLMのコンテキストを最適化します。'
    },
    {
      type: 'normal',
      title: 'セクションサマリー',
      content: '• Rust実装: 高速・安全・並列実行\n• Worktree: Git Worktreeで真の並列実行\n• Error Recovery: 本番環境対応のエラー処理\n• LLM統合: 複数プロバイダー対応',
      speakerNotes: 'では、実際の動作を見ていきましょう。ライブデモを開始します。'
    },

    // セクション4: ライブデモ（7分） - スライド 31-35
    {
      type: 'section',
      title: 'ライブデモ',
      content: 'Issue作成からデプロイまで7分で完結',
      speakerNotes: 'セクション4: ライブデモを開始します。'
    },
    {
      type: 'normal',
      title: 'デモシナリオ概要',
      content: '1. Issue作成（30秒）: "JWT認証の実装"\n2. IssueAgent自動分析（30秒）: 自動ラベル付与\n3. CoordinatorAgent タスク分解（1分）: 5つのサブタスク + DAG構築\n4. CodeGenAgent コード生成（2分）: Rust自動生成\n5. ReviewAgent 品質チェック（1分）: スコア95/100\n6. PRAgent 自動PR作成（1分）: Conventional Commits\n7. DeploymentAgent 自動デプロイ（1分）: Staging環境',
      speakerNotes: '7つのステップで Issue からデプロイまでを実演します。合計7分で完結する様子をご覧ください。'
    },
    {
      type: 'normal',
      title: 'ライブデモ実行',
      content: '【画面共有】\n\nターミナル + ブラウザ（GitHub + Dashboard）を同時表示\n\nコマンド実行:\n# Issue作成\ngh issue create --title "JWT認証の実装" --body "..."\n\n# Agent実行\nmiyabi agent run coordinator --issue 270',
      speakerNotes: '今、Issueを作成しました。IssueAgentが自動分析し、ラベルを付与しています。次にCoordinatorAgentがタスクを分解します...'
    },
    {
      type: 'normal',
      title: 'デモ結果サマリー',
      content: '✅ Issue #270: JWT認証の実装\n✅ タスク数: 5個（DAG構築済み）\n✅ 生成コード: crates/auth/src/jwt.rs (200行)\n✅ テストカバレッジ: 85%\n✅ 品質スコア: 95/100\n✅ PR: #271 自動作成（feat: implement JWT authentication）\n✅ デプロイ: Staging環境デプロイ完了',
      speakerNotes: '7分で Issue からデプロイまでが完了しました。5つのタスクに分解され、200行のRustコードが生成され、品質スコア95点、そしてPRが自動作成されました。'
    },
    {
      type: 'normal',
      title: 'セクションサマリー',
      content: '• 所要時間: 7分\n• 自動化率: 100%（人間の介入0）\n• 品質: 95/100点\n• 結果: PR作成 + Staging環境デプロイ完了',
      speakerNotes: 'では、ビジネスエージェントの可能性について話します。'
    },

    // セクション5: ビジネスエージェントの可能性（3分） - スライド 36-38
    {
      type: 'section',
      title: 'ビジネスエージェントの可能性',
      content: '開発だけでなく、ビジネス戦略も自動化',
      speakerNotes: 'セクション5: ビジネスエージェントの可能性を開始します。'
    },
    {
      type: 'normal',
      title: '14個のBusiness Agents',
      content: '戦略・企画系（6個）:\n• AIEntrepreneur: 8フェーズビジネスプラン自動生成\n• ProductConcept: USP・収益モデル設計\n• ProductDesign: 6ヶ月分のコンテンツ・技術スタック・MVP定義\n\nマーケティング系（5個）:\n• MarketResearch: 市場トレンド分析と競合調査（20社以上）\n• Marketing: 広告・SEO・SNS等を駆使した集客施策実行計画\n• ContentCreation: 動画・記事・教材等の実コンテンツ制作計画\n\n営業・顧客管理系（3個）:\n• Sales: リード→顧客の転換率最大化\n• CRM: 顧客満足度向上とLTV最大化\n• Analytics: 全データ分析・PDCAサイクル実行',
      speakerNotes: '14個のBusiness Agentsがビジネス戦略を自動化します。AIEntrepreneurAgentは8フェーズでビジネスプラン全体を生成し、MarketResearchAgentは20社以上の競合調査を実行します。YouTubeAgentは13ワークフローでチャンネル運営を最適化します。'
    },
    {
      type: 'normal',
      title: 'ビジネス自動化のユースケース',
      content: 'ユースケース1: スタートアップ起業支援\n  Self Analysis → Market Research → Product Concept → Business Plan → Marketing Strategy\n\nユースケース2: 既存事業の成長加速\n  Funnel Design → SNS Strategy → Content Creation → CRM → Analytics\n\nユースケース3: 新規事業立ち上げ\n  Persona → Product Design → Sales Strategy → Deployment',
      speakerNotes: 'ビジネスエージェントは3つのユースケースで活用できます。スタートアップ起業支援、既存事業の成長加速、新規事業立ち上げです。各ユースケースで最適なエージェントが連携して動作します。'
    },

    // セクション6: まとめとQ&A（2分） - スライド 39-40
    {
      type: 'normal',
      title: 'まとめ',
      content: '今日のポイント:\n1. AI駆動開発の新しいパラダイム: Level 3 = プロセス完全自律化\n2. 21個のエージェント: Coding 7 + Business 14\n3. 実装技術: Rust + Worktree + Error Recovery\n4. ライブデモ: Issue → コード → PR → デプロイ（7分で完結）\n5. ビジネス自動化: 14個のBusiness Agentsで戦略・マーケ・営業を自動化\n\nMiyabiの独自性:\n• GitHub as OS アーキテクチャ\n• 完全自律型オペレーションプラットフォーム\n• オープンソース（MIT License）',
      speakerNotes: 'まとめです。Miyabiは Level 3 のAI駆動開発を実現する初のプラットフォームです。21個のエージェントが開発からビジネスまで完全自律化し、Rust実装で高速・安全に動作します。'
    },
    {
      type: 'normal',
      title: 'Q&A + コンタクト情報',
      content: 'ご質問をどうぞ\n\nリンク:\n• GitHub: https://github.com/ShunsukeHayashi/Miyabi\n• Documentation: https://shunsukehayashi.github.io/Miyabi/\n• NPM: https://www.npmjs.com/package/miyabi\n\nコンタクト:\n• Email: your-email@example.com\n• Twitter/X: @YourHandle\n• GitHub: @ShunsukeHayashi',
      speakerNotes: 'ご清聴ありがとうございました。ご質問があればどうぞ。GitHubリポジトリはオープンソースで公開しています。ぜひご覧ください。'
    }
  ];
}

/**
 * テスト実行: 最初の3スライドのみ作成してテスト
 */
function testCreatePresentation() {
  const presentation = SlidesApp.create('【テスト】Miyabi Presentation');
  const presentationId = presentation.getId();

  Logger.log('テストプレゼンテーション作成開始: ' + presentationId);

  // 最初のスライドを削除
  const slides = presentation.getSlides();
  if (slides.length > 0) {
    slides[0].remove();
  }

  // 最初の3スライドのみ作成
  const slidesData = getSlidesData();
  const testSlides = slidesData.slice(0, 3);

  testSlides.forEach((slideData, index) => {
    Logger.log(`テストスライド ${index + 1}/3 を作成中`);
    createSlide(presentation, slideData, index + 1);
  });

  Logger.log('テストプレゼンテーション作成完了');
  Logger.log('URL: https://docs.google.com/presentation/d/' + presentationId);

  return presentationId;
}

/**
 * 特定のスライドのみ作成（デバッグ用）
 * @param {number} startIndex - 開始スライド番号（0-indexed）
 * @param {number} endIndex - 終了スライド番号（0-indexed）
 */
function createSlidesRange(startIndex, endIndex) {
  const presentation = SlidesApp.create(`Miyabi Presentation (Slides ${startIndex + 1}-${endIndex + 1})`);
  const presentationId = presentation.getId();

  Logger.log(`プレゼンテーション作成開始 (Slides ${startIndex + 1}-${endIndex + 1}): ` + presentationId);

  // 最初のスライドを削除
  const slides = presentation.getSlides();
  if (slides.length > 0) {
    slides[0].remove();
  }

  // 指定範囲のスライドを作成
  const slidesData = getSlidesData();
  const rangeSlides = slidesData.slice(startIndex, endIndex + 1);

  rangeSlides.forEach((slideData, index) => {
    Logger.log(`スライド ${startIndex + index + 1}/40 を作成中`);
    createSlide(presentation, slideData, startIndex + index + 1);
  });

  Logger.log('プレゼンテーション作成完了');
  Logger.log('URL: https://docs.google.com/presentation/d/' + presentationId);

  return presentationId;
}
