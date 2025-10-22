# AI駆動開発カンファレンス 2025秋 - 登壇プロポーザル

**提案日**: 2025-10-22
**イベント**: AI駆動開発カンファレンス 2025秋
**日程**: 2025年10月30日(木)-31日(金)

---

## 📋 登壇情報

### セッションタイトル

**日本語（メイン）**:
> **「Issue作成からデプロイまで完全自律化 - 21個のAIエージェントが創る次世代開発体験」**

**英語（サブ）**:
> **"From Issue to Deployment: Full Autonomy with 21 AI Agents"**

**キャッチコピー**:
> "一つのIssueから、全てが動き出す。"

---

## 🎯 セッション概要（200字）

GitHub Issueを起点に、コード生成からテスト、レビュー、デプロイまでを21個のAIエージェントが自律実行。Rust実装により50%の実行時間削減を実現した完全自動化開発基盤「Miyabi」の実装事例と、ビジネス戦略から技術実装まで一気通貫で支援する14個のビジネスエージェントの可能性を紹介します。

---

## 📝 詳細説明（500字）

### 背景
GitHub CopilotやCursorの登場により、"コーディング支援"は当たり前になりました。しかし、要件定義、タスク分解、レビュー、デプロイといった開発プロセス全体の自動化はまだ実現されていません。

### Miyabiとは
Miyabiは「Issue作成からデプロイまで完全自律化」を実現するAI駆動開発基盤です。GitHub as OSアーキテクチャをベースに、21個の専門特化AIエージェントがそれぞれの役割を担います。

**7個のCoding Agents**:
- CoordinatorAgent: タスク統括・DAG分解
- CodeGenAgent: Claude Sonnet 4によるコード生成
- ReviewAgent: 品質スコアリング（100点満点）
- IssueAgent: 57ラベル体系による自動分類
- PRAgent: Conventional Commits準拠のPR作成
- DeploymentAgent: CI/CDデプロイ自動化
- RefresherAgent: Issue状態監視

**14個のBusiness Agents**（設計済）:
市場調査、ペルソナ設定、ビジネスプラン作成、マーケティング戦略、営業プロセス最適化まで、ビジネス全体をAIで支援。

### 技術的特徴
- **Rust Edition**: TypeScript版から移植、50%実行時間削減
- **Git Worktree並列実行**: 複数Issueの同時処理
- **57ラベル体系**: 状態管理をLabelで完全制御
- **Production-Ready Error Recovery**: 最大3回リトライ、指数バックオフ

### 本セッションで得られること
1. AI駆動開発の「次のステップ」- プロセス全体の自律化
2. 21個のエージェント設計思想と実装パターン
3. Rust + Axum + tokioによる高速化実例
4. GitHub as OSアーキテクチャの実践

---

## 🎤 登壇形式

### 希望時間枠
- **30分セッション** または **45分セッション**

### 構成案（30分の場合）
1. **イントロ**（3分）: AI駆動開発の現在地と課題
2. **Miyabi概要**（5分）: アーキテクチャと21個のAgent体系
3. **実装詳細**（10分）: Rust実装、Worktree並列実行、Error Recovery
4. **ライブデモ**（7分）: Issue作成→自動コード生成→PR作成→デプロイ
5. **ビジネスエージェントの可能性**（3分）: 14個のBusiness Agents
6. **Q&A**（2分）

### 構成案（45分の場合）
1. **イントロ**（5分）: AI駆動開発の現在地と課題
2. **Part 1: Coding Agents**（15分）: 7個のAgent詳細 + 実装パターン
3. **ライブデモ**（10分）: 実際のワークフロー実演
4. **Part 2: Business Agents**（10分）: 14個のAgent設計思想
5. **技術Deep Dive**（3分）: Rust実装の技術的工夫
6. **Q&A**（2分）

---

## 🎯 ターゲットオーディエンス

### 主な対象者
1. **AI駆動開発に取り組むエンジニア**
   - GitHub Copilot/Cursorの次を探している
   - 開発プロセス全体の自動化に興味がある
   - Agent設計のベストプラクティスを知りたい

2. **開発リーダー・アーキテクト**
   - チームの生産性向上を目指している
   - AI活用の実践事例を知りたい
   - 自動化基盤の導入を検討している

3. **スタートアップ・個人開発者**
   - リソースが限られる中で効率化したい
   - ビジネス戦略から実装まで一人で担当
   - AI支援の可能性を最大化したい

### 得られる知見
- ✅ AI駆動開発の「プロセス全体最適化」の実例
- ✅ 21個のAgent設計パターンと役割分担
- ✅ Rust + Axumによる高速化実装
- ✅ GitHub as OSアーキテクチャの実践
- ✅ Production-Ready Error Recoveryの実装
- ✅ ビジネスとテックの一気通貫AI支援

---

## 💡 差別化ポイント

### 既存ツールとの比較

| 項目 | GitHub Copilot/Cursor | Miyabi |
|------|---------------------|--------|
| **スコープ** | コーディング支援 | Issue→デプロイまで全自動 |
| **Agent数** | 1（コード補完） | 21（専門特化） |
| **タスク分解** | ❌ 手動 | ✅ 自動（CoordinatorAgent） |
| **品質管理** | ❌ 手動 | ✅ 自動（ReviewAgent、100点スコア） |
| **デプロイ** | ❌ 手動 | ✅ 自動（DeploymentAgent） |
| **ビジネス支援** | ❌ なし | ✅ 14個のBusiness Agents |
| **実装言語** | - | Rust（高速化） |
| **並列実行** | ❌ なし | ✅ Git Worktree並列 |

### 技術的ハイライト

1. **Rust Edition**
   - TypeScript版から完全移植
   - 50%の実行時間削減
   - 30%のメモリ削減
   - ゼロコスト抽象化

2. **Git Worktree並列実行**
   - 複数Issueを独立したWorktreeで同時処理
   - コンフリクト最小化
   - 簡単なロールバック

3. **57ラベル体系**
   - STATE（8個）: ライフサイクル管理
   - AGENT（6個）: Agent割り当て
   - PRIORITY（4個）: 優先度管理
   - TYPE（7個）: Issue分類
   - その他（32個）: 品質、フェーズ、トリガー等

4. **Production-Ready Error Recovery**
   - 最大3回リトライ
   - 指数バックオフ（10s → 20s → 40s）
   - WebSocket real-time notification
   - 構造化エラーレスポンス

---

## 🚀 デモ内容

### ライブデモシナリオ（7-10分）

**シナリオ**: ユーザー認証機能の実装

1. **Issue作成**（30秒）
   ```
   タイトル: 「JWT認証の実装」
   内容: 「ユーザー登録・ログイン・トークン検証機能を実装」
   ```

2. **IssueAgent自動分析**（30秒）
   - 自動ラベル付与: `type:feature`, `priority:P1`, `agent:codegen`
   - 推定工数: 4時間

3. **CoordinatorAgent タスク分解**（1分）
   - Task 1: ユーザーモデル定義
   - Task 2: JWT生成・検証ロジック
   - Task 3: 認証ミドルウェア
   - Task 4: API エンドポイント
   - Task 5: テストコード
   - DAG構築: 依存関係可視化

4. **CodeGenAgent コード生成**（2分）
   - Rust コード自動生成
   - Worktree分離（独立した作業ディレクトリ）
   - 自動コミット

5. **ReviewAgent 品質チェック**（1分）
   - cargo clippy実行
   - テストカバレッジ測定
   - 品質スコア: 95/100

6. **PRAgent 自動PR作成**（1分）
   - Conventional Commits準拠
   - PR説明自動生成
   - レビューアサイン

7. **DeploymentAgent 自動デプロイ**（1分）
   - cargo build --release
   - テスト実行
   - Staging環境デプロイ
   - ヘルスチェック

8. **リアルタイムダッシュボード**（1分）
   - WebSocketでリアルタイム更新
   - Agent稼働状況
   - タスク進捗
   - エラーリカバリー（リトライボタン）

### デモ環境
- **Backend**: 事前にローカル起動済み
- **Frontend**: ブラウザで表示
- **GitHub**: 実際のリポジトリ使用
- **所要時間**: 7-10分

---

## 👤 登壇者情報

### 名前
**林 俊輔（はやし しゅんすけ）** / Shunsuke Hayashi

### 肩書き
- Miyabi Project Creator & Lead Developer
- AI駆動開発基盤アーキテクト

### 略歴（100字）
AI駆動開発基盤「Miyabi」の開発者。GitHub as OSアーキテクチャをベースに、Issue作成からデプロイまでを完全自動化する21個のAIエージェント体系を設計・実装。TypeScript版からRust版への移植により50%の高速化を実現。

### 略歴（詳細・300字）
AI駆動開発基盤「Miyabi」の開発者。GitHub Copilot/Cursorの登場を受け、「コーディング支援」の先にある「開発プロセス全体の自動化」を目指し、2024年からMiyabiプロジェクトを開始。

7個のCoding Agentsと14個のBusiness Agentsからなる21個の専門特化AIエージェント体系を設計し、GitHub as OSアーキテクチャで実装。当初TypeScript/Node.jsで開発したものの、パフォーマンス要件からRust 2021 Editionへ完全移植し、50%の実行時間削減と30%のメモリ削減を実現。

現在はProduction-Ready Error Recovery、Git Worktree並列実行、57ラベル体系による状態管理など、実運用に耐える機能を実装中。

### SNS・連絡先
- GitHub: https://github.com/ShunsukeHayashi
- Project Repository: https://github.com/ShunsukeHayashi/Miyabi
- Email: （ご記入ください）
- Twitter/X: （あれば記入）

### 登壇実績
- （あれば記入）
- （初登壇の場合は「今回が初登壇」と記載）

---

## 📊 セッションの技術レベル

### 対象レベル
**中級〜上級**

### 前提知識
- ✅ Git/GitHubの基本操作
- ✅ CI/CD概念の理解
- ✅ REST API/WebSocketの基礎
- ⚠️ Rustの知識は不要（コード例は平易に解説）
- ⚠️ AIの専門知識は不要（実装パターンを重視）

### 技術キーワード
- AI駆動開発
- マルチエージェントシステム
- Rust/Axum/tokio
- GitHub API
- WebSocket
- Git Worktree
- Exponential Backoff
- State Management
- Label-based Architecture

---

## 📚 参考資料・事前公開資料

### プロジェクトドキュメント
1. **README.md**: プロジェクト概要
2. **ENTITY_RELATION_MODEL.md**: 12種類のEntity、27の関係性
3. **LABEL_SYSTEM_GUIDE.md**: 57ラベル体系完全ガイド
4. **RUST_MIGRATION_REQUIREMENTS.md**: TypeScript→Rust移行記録
5. **DEPLOYMENT_GUIDE.md**: 本番環境デプロイガイド
6. **ERROR_RECOVERY_GUIDE.md**: Error Recovery実装詳細
7. **API_REFERENCE.md**: API仕様書

### 実装済み機能（2025年10月時点）
- ✅ 7個のCoding Agents基盤
- ✅ Production-Ready Error Recovery（リトライ・キャンセル）
- ✅ WebSocket real-time updates
- ✅ 57ラベル体系
- ✅ Git Worktree並列実行
- ✅ Dashboard UI（React + TypeScript）
- ✅ 9個の統合テスト（全通過）
- ✅ Rust Edition（50%高速化）

### デモ動画（事前準備）
- Issue作成からデプロイまでの全自動フロー（5分版）
- Dashboard UIの操作デモ（3分版）
- Error Recovery実演（2分版）

---

## 🎁 参加者への提供物

### セッション後に提供
1. **スライド資料（PDF）**
   - 全スライド公開
   - Speaker Notesも公開

2. **サンプルコード**
   - 簡易版Agentの実装例（Rust）
   - GitHub API統合サンプル
   - WebSocket統合サンプル

3. **ドキュメント**
   - Agent設計パターン集
   - 実装チェックリスト
   - トラブルシューティングガイド

4. **オープンソース化**
   - Miyabiプロジェクトは既にGitHubで公開中
   - MIT Licenseで提供
   - コントリビューション歓迎

---

## 💬 Q&A想定質問

### 技術的質問

**Q1: なぜRustを選んだのか？**
A: TypeScript版で実装後、パフォーマンスがボトルネックに。特にGit操作、ファイルI/O、並列実行でRustの優位性が顕著。結果、50%高速化、30%メモリ削減を実現。

**Q2: Claude APIの利用コストは？**
A: 1 Issueあたり約$0.10-0.50（規模による）。コード生成のみならタスク分解、レビュー、PR作成も含むため、人件費換算では大幅削減。

**Q3: GitHub API rate limitは大丈夫？**
A: 認証済みAPIで5000 req/hour。Labelキャッシュ、バッチ処理で最適化。実運用では問題なし。

**Q4: 他のLLM（GPT-4、Gemini等）は使える？**
A: LLM抽象化層（miyabi-llm）で複数Provider対応。Claude、GPT、Groq、vLLM、Ollama等をサポート予定。

**Q5: Worktree並列実行の上限は？**
A: 理論上制限なし。実際はCPUコア数、メモリに依存。推奨は3-5並列（コンシューマーPC）。

### ビジネス的質問

**Q6: 個人開発者でも使える？**
A: はい。MITライセンスで公開中。GitHub APIとClaudeのAPIキーがあれば利用可能。

**Q7: エンタープライズ導入は？**
A: 現在は個人・小規模チーム向け。エンタープライズ機能（RBAC、監査ログ、SLA保証）は今後検討。

**Q8: 他のCI/CDツールと併用できる？**
A: はい。GitHub Actions、Jenkins、CircleCI等と併用可能。DeploymentAgentは既存パイプラインをトリガーするだけでも可。

### コンセプト的質問

**Q9: AIエージェントと人間の役割分担は？**
A: Agentは「作業の自動化」、人間は「判断と承認」。重要な判断（本番デプロイ、リファクタリング等）は人間が最終承認。

**Q10: 失敗したらどうなる？**
A: Error Recovery機能で最大3回リトライ（指数バックオフ）。それでも失敗なら人間にエスカレーション。全てログ保存。

---

## 🎯 カンファレンステーマとの関連性

### カンファレンスの問い
> 「ソフトウェア開発のあり方が大きく変わろうとしている」

### Miyabiの答え
「**Issue作成からデプロイまで、人間は判断だけに集中できる**」

### カンファレンスキーワード × Miyabi

| カンファレンスキーワード | Miyabiの実装 |
|---------------------|------------|
| **AI駆動要件定義** | IssueAgent（自動ラベリング、工数推定） |
| **AI駆動コード生成** | CodeGenAgent（Claude Sonnet 4統合） |
| **AI駆動テスト** | ReviewAgent（品質スコアリング、100点満点） |
| **AI駆動デプロイ** | DeploymentAgent（CI/CD自動化、ロールバック） |
| **プロセス最適化** | CoordinatorAgent（DAG構築、並列実行） |
| **GitHub Copilot/Cursor** | **その先** - プロセス全体の自律化 |

---

## 📝 登壇申請に必要な情報まとめ

### 基本情報
- **セッションタイトル**: 「Issue作成からデプロイまで完全自律化 - 21個のAIエージェントが創る次世代開発体験」
- **登壇者名**: 林 俊輔（はやし しゅんすけ）
- **所属**: Miyabi Project
- **希望時間**: 30分 or 45分
- **形式**: プレゼン + ライブデモ

### 概要（簡潔版・200字）
GitHub Issueを起点に、コード生成からデプロイまでを21個のAIエージェントが自律実行。Rust実装により50%高速化を実現した開発基盤「Miyabi」の実装事例を、ライブデモを交えて紹介。AI駆動開発の「次のステップ」を提示します。

### アピールポイント（3つ）
1. **21個の専門特化Agentによるプロセス全体自動化** - コーディング支援の先へ
2. **Rust実装による50%高速化** - 実運用可能なパフォーマンス
3. **Production-Ready機能群** - Error Recovery、並列実行、リアルタイム監視

### 対象者
AI駆動開発に取り組むエンジニア、開発リーダー、スタートアップ開発者

### 技術レベル
中級〜上級

### 提供物
スライド資料、サンプルコード、実装ドキュメント、オープンソースプロジェクト（MIT License）

---

## ✅ 登壇準備チェックリスト

### 申請前
- [x] プロポーザル作成
- [ ] スライド資料作成（構成案完成）
- [ ] デモシナリオ確定
- [ ] デモ環境準備（Backend + Frontend）
- [ ] 登壇者プロフィール整備

### 申請時
- [ ] 申請フォーム記入
- [ ] プロポーザル提出
- [ ] 登壇者情報提出
- [ ] 連絡先確認

### 採択後
- [ ] スライド資料完成（PDF化）
- [ ] デモ動画作成（バックアッププラン）
- [ ] 配布資料準備
- [ ] リハーサル実施（2回以上）
- [ ] ネットワーク・機材確認

### 当日
- [ ] PCセットアップ
- [ ] デモ環境起動確認
- [ ] スライド表示確認
- [ ] マイク・音量チェック
- [ ] 時間配分確認

---

**プロポーザル作成日**: 2025-10-22
**最終更新**: 2025-10-22
**ステータス**: 準備完了 ✅

---

**次のステップ**:
1. イベント主催者（クラスメソッド）への登壇申請
2. プレゼンテーション資料作成
3. デモ環境整備
