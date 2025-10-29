# 次期開発フェーズ - プランニング

**作成日**: 2025-10-17
**作成者**: Codex (メインセッション)
**現在のステータス**: AI CLI統合テスト完了、26コミット先行

---

## 📊 現状分析

### 完了したマイルストーン
✅ **AI CLI統合テスト完全成功** (Phase 1-7)
- Codex, Gemini CLI, Codexの相互運用性確認
- 全12テストシナリオPASS
- コンテキストファイル最適化完了

✅ **ai-partner-app サブプロジェクト追加**
- Frontend: Next.js 15
- Backend: Node.js/Express
- AI統合: BytePlus, Gemini TTS, Claude Vision
- 7つの新規API（画像生成、動画生成、カスタマイズ）

✅ **ドキュメント整備**
- AI CLI完全ガイド（600+行）
- 統合テスト報告書（348行）
- LDD作業ログ（437行）

### 現在のプロジェクト構成

```
miyabi-private/
├── crates/                    # Rust版Miyabi CLI (86 .rs files)
│   ├── miyabi-cli/           # CLIツール（進行中）
│   ├── miyabi-agents/        # Agent実装（進行中）
│   ├── miyabi-types/         # コア型定義（完成）
│   ├── miyabi-core/          # 共通ユーティリティ（完成）
│   ├── miyabi-github/        # GitHub API統合（完成）
│   ├── miyabi-worktree/      # Git Worktree管理（完成）
│   ├── miyabi-llm/           # LLM統合（進行中）
│   └── miyabi-potpie/        # Potpie統合（進行中）
│
├── ai-partner-app/           # AIパートナーアプリ（完成度80%）
│   ├── frontend/             # Next.js 15
│   ├── backend/              # Node.js/Express + Prisma
│   └── shared/               # 共通型定義
│
├── .codex/                  # AI CLI統合（完成）
│   ├── docs/                 # ドキュメント（4ファイル）
│   ├── test-results/         # テスト結果（4ファイル）
│   ├── Skills/               # Business Agent Skills（4個）
│   └── agents/               # Agent仕様・プロンプト
│
└── docs/                     # プロジェクトドキュメント
```

---

## 🎯 次期開発フェーズの候補タスク

### Phase A: Rust版Miyabi CLIの完成（優先度: 高）
**目的**: TypeScript版からの完全移行完了

#### タスク詳細
1. **CoordinatorAgent完全実装** (推定時間: 3-4時間)
   - Issue分析・Task分解
   - DAG構築・依存関係解決
   - Worktree作成・管理
   - 並列実行制御

2. **LLM統合の改善** (推定時間: 2-3時間)
   - Claude API統合（Anthropic SDK）
   - Ollama統合（ローカルLLM）
   - プロンプト管理システム

3. **Potpie統合の完成** (推定時間: 2-3時間)
   - コードベース検索
   - コンテキスト抽出
   - Agent実行時の参照

4. **Worktreeベース並列実行のテスト** (推定時間: 2時間)
   - 複数Issueの同時処理
   - コンフリクト解決
   - 統合テスト

**成果物**:
- 完全機能するRust版Miyabi CLI
- TypeScript版からの移行完了
- 性能ベンチマーク（50%以上の高速化目標）

**依存関係**:
- なし（即座に開始可能）

---

### Phase B: ai-partner-app本番環境デプロイ（優先度: 中）
**目的**: ai-partner-appを実際に利用可能な状態にする

#### タスク詳細
1. **認証機能の有効化** (推定時間: 1-2時間)
   - 開発モードの無効化
   - requireAuth復元
   - JWT認証テスト

2. **フロントエンドの完成** (推定時間: 4-5時間)
   - 画像アップロードUI
   - キャラクター一覧表示
   - カスタマイズUI（髪型、背景等）
   - 動画生成UI

3. **Firebase/Vercelデプロイ** (推定時間: 2-3時間)
   - 環境変数設定
   - データベース移行
   - CI/CD設定

4. **エンドツーエンドテスト** (推定時間: 2時間)
   - ユーザー登録・ログイン
   - キャラクター作成フロー
   - 画像生成・カスタマイズ

**成果物**:
- デプロイ済みai-partner-app
- 実際に使用可能なデモ
- ドキュメント（ユーザーガイド）

**依存関係**:
- なし（即座に開始可能）

---

### Phase C: Business Agentsの実装とテスト（優先度: 中）
**目的**: 4つのBusiness Agent Skillsを実際に動作させる

#### タスク詳細
1. **Skills実行環境の構築** (推定時間: 2時間)
   - Skill実行フレームワーク
   - 入力/出力フォーマット標準化
   - ログ記録システム

2. **4つのSkillsのテスト実行** (推定時間: 3-4時間)
   - content-marketing-strategy
   - growth-analytics-dashboard
   - market-research-analysis
   - sales-crm-management

3. **結果の分析と改善** (推定時間: 2時間)
   - 実行結果の評価
   - プロンプトの最適化
   - ドキュメント更新

**成果物**:
- 実行可能なBusiness Agents
- 実行結果レポート
- 改善提案

**依存関係**:
- Phase A（Rust版Miyabi CLI）の完成が望ましい

---

### Phase D: ドキュメント整備と公開準備（優先度: 低）
**目的**: プロジェクトの公開準備

#### タスク詳細
1. **READMEの更新** (推定時間: 1時間)
   - プロジェクト概要
   - インストール手順
   - クイックスタートガイド

2. **QUICKSTART-JA.mdの最新化** (推定時間: 1時間)
   - Rust版CLIの手順追加
   - ai-partner-appの紹介
   - AI CLI統合の説明

3. **AGENTS.mdの更新** (推定時間: 1時間)
   - ai-partner-app情報追加
   - Business Agents実行例追加
   - Entity-Relationモデル更新

4. **ランディングページの更新** (推定時間: 2時間)
   - 最新情報反映
   - スクリーンショット追加
   - デモ動画作成

**成果物**:
- 最新のドキュメント
- 公開準備完了
- ランディングページ

**依存関係**:
- Phase A, B, Cの完成が望ましい

---

## 📈 推奨される実施順序

### オプション1: 段階的アプローチ（推奨）
```
Week 1: Phase A (Rust CLI完成)
Week 2: Phase B (ai-partner-appデプロイ)
Week 3: Phase C (Business Agentsテスト)
Week 4: Phase D (ドキュメント整備)
```

**メリット**:
- リスク分散
- 各フェーズで成果物を確認
- フィードバックを次フェーズに反映

### オプション2: 並列アプローチ
```
Week 1-2: Phase A + Phase B (並行実行)
Week 3: Phase C
Week 4: Phase D
```

**メリット**:
- 開発速度向上
- 早期完成

**デメリット**:
- リソース集中が必要
- コンフリクトの可能性

### オプション3: 集中アプローチ
```
Week 1-2: Phase A (Rust CLI完成に集中)
Week 3-4: Phase B, C, D (順次実施)
```

**メリット**:
- コアシステムの安定化
- 他のフェーズの基盤確立

---

## 🔍 各フェーズの詳細計画

### Phase A: Rust版Miyabi CLI完成 - 詳細タスク

#### A-1: CoordinatorAgent完全実装
```rust
// crates/miyabi-agents/src/coordinator.rs

pub struct CoordinatorAgent {
    github_client: Arc<GitHubClient>,
    worktree_manager: Arc<WorktreeManager>,
    config: CoordinatorConfig,
}

impl CoordinatorAgent {
    // Issue分析
    async fn analyze_issue(&self, issue_number: u32) -> Result<IssueAnalysis>;

    // Task分解
    async fn decompose_tasks(&self, issue: &Issue) -> Result<Vec<Task>>;

    // DAG構築
    fn build_dag(&self, tasks: Vec<Task>) -> Result<TaskDAG>;

    // 並列実行
    async fn execute_parallel(&self, dag: TaskDAG) -> Result<ExecutionReport>;
}
```

**実装手順**:
1. Issue分析ロジック実装（LLM統合）
2. Task分解アルゴリズム実装（DAG構築）
3. Worktree作成・管理ロジック実装
4. 並列実行制御実装（Tokio非同期）
5. 統合テスト

**テストケース**:
- 単一Issueの処理
- 複数Issueの並列処理
- 依存関係のあるTaskの処理
- エラーハンドリング

#### A-2: LLM統合の改善
```rust
// crates/miyabi-llm/src/lib.rs

pub trait LLMProvider {
    async fn generate(&self, prompt: &Prompt) -> Result<String>;
    async fn stream(&self, prompt: &Prompt) -> impl Stream<Item = String>;
}

// Claude API実装
pub struct ClaudeProvider { /* ... */ }

// Ollama実装（ローカルLLM）
pub struct OllamaProvider { /* ... */ }
```

**実装手順**:
1. LLMProviderトレイト定義
2. ClaudeProvider実装（Anthropic SDK）
3. OllamaProvider実装（ローカルLLM）
4. プロンプトテンプレート管理
5. ストリーミング対応

#### A-3: Potpie統合の完成
```rust
// crates/miyabi-potpie/src/client.rs

pub struct PotpieClient {
    base_url: String,
    api_key: String,
}

impl PotpieClient {
    // コードベース検索
    async fn search_codebase(&self, query: &str) -> Result<Vec<CodeFragment>>;

    // コンテキスト抽出
    async fn extract_context(&self, file_path: &str) -> Result<CodeContext>;

    // Agent実行時の参照
    async fn get_relevant_code(&self, task: &Task) -> Result<Vec<CodeFragment>>;
}
```

**実装手順**:
1. PotpieClientの完成
2. コードベース検索機能
3. コンテキスト抽出機能
4. Agent統合
5. テスト

#### A-4: Worktreeベース並列実行のテスト

**テストシナリオ**:
1. 3つのIssueを並列処理
2. 依存関係のあるTaskの処理
3. コンフリクト発生時の処理
4. ロールバック機能のテスト

**成功基準**:
- 並列実行効率70%以上
- コンフリクト自動解決率80%以上
- 実行時間50%削減

---

### Phase B: ai-partner-app本番環境デプロイ - 詳細タスク

#### B-1: 認証機能の有効化

**変更箇所**:
```typescript
// backend/src/routes/character.ts

// 開発モードコメントアウトを削除
router.post(
  '/generate-from-image',
  requireAuth, // ✅ 有効化
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.userId; // ✅ 固定ユーザーID削除
    // ...
  }
);
```

**チェックリスト**:
- [ ] すべてのエンドポイントでrequireAuth有効化
- [ ] 固定ユーザーID（'dev-user-001'）削除
- [ ] JWT認証テスト実施
- [ ] エラーハンドリング確認

#### B-2: フロントエンドの完成

**実装する画面**:
1. ログイン・登録画面
2. ダッシュボード（キャラクター一覧）
3. キャラクター作成画面（画像アップロード）
4. キャラクター詳細画面（カスタマイズUI）
5. 動画生成画面

**UIコンポーネント**:
- ImageUploader (ドラッグ&ドロップ対応)
- CharacterCard (プレビュー表示)
- HairstyleSelector (10種類のプリセット)
- BackgroundSelector (12種類の場所)
- VideoGenerator (I2V統合)

#### B-3: Firebase/Vercelデプロイ

**デプロイ先**:
- Frontend: Vercel
- Backend: Firebase Functions or Railway
- Database: Supabase or PlanetScale

**環境変数**:
```
ANTHROPIC_API_KEY=sk-xxx
BYTEPLUS_ACCESS_KEY=xxx
BYTEPLUS_SECRET_KEY=xxx
GEMINI_TTS_API_KEY=xxx
DATABASE_URL=postgresql://xxx
JWT_SECRET=xxx
```

#### B-4: エンドツーエンドテスト

**テストフロー**:
1. ユーザー登録 → ログイン
2. 画像アップロード → キャラクター生成
3. 髪型変更 → 背景変更
4. 動画生成 → ステータス確認
5. キャラクター削除

---

### Phase C: Business Agentsの実装とテスト - 詳細タスク

#### C-1: Skills実行環境の構築

**Skill実行フレームワーク**:
```rust
// crates/miyabi-agents/src/skills/mod.rs

pub struct SkillExecutor {
    skill_path: PathBuf,
    llm_provider: Arc<dyn LLMProvider>,
}

impl SkillExecutor {
    // Skillファイル読み込み
    async fn load_skill(&self) -> Result<Skill>;

    // Skill実行
    async fn execute(&self, input: SkillInput) -> Result<SkillOutput>;

    // 結果保存
    async fn save_result(&self, output: SkillOutput) -> Result<PathBuf>;
}
```

#### C-2: 4つのSkillsのテスト実行

**実行手順**:
1. content-marketing-strategy
   - 入力: プロダクト概要、ターゲット顧客
   - 出力: コンテンツマーケティング戦略書

2. growth-analytics-dashboard
   - 入力: KPI目標、データソース
   - 出力: 成長分析ダッシュボード設計書

3. market-research-analysis
   - 入力: 市場セグメント、競合情報
   - 出力: 市場調査分析レポート

4. sales-crm-management
   - 入力: セールスプロセス、顧客データ
   - 出力: CRM管理戦略書

#### C-3: 結果の分析と改善

**評価基準**:
- 実行時間（目標: 各Skill 5分以内）
- 出力品質（専門家レビュー）
- 実用性（実際のプロジェクトで使用可能か）

---

### Phase D: ドキュメント整備と公開準備 - 詳細タスク

#### D-1: READMEの更新

**構成**:
```markdown
# Miyabi - 自律型AI開発フレームワーク

## 🚀 Quick Start
```bash
cargo install miyabi
miyabi init my-project
```

## 📦 Features
- 21個の自律Agent（Coding 7 + Business 14）
- Git Worktreeベース並列実行
- AI CLI統合（Codex, Codex, Gemini CLI）
- ai-partner-app サブプロジェクト

## 📚 Documentation
- [QUICKSTART-JA.md](QUICKSTART-JA.md) - 5分で始める
- [AGENTS.md](AGENTS.md) - Agent完全ガイド
- [CLAUDE.md](CLAUDE.md) - プロジェクトコンテキスト
```

#### D-2: QUICKSTART-JA.mdの最新化

**追加セクション**:
- Rust版CLIのインストール
- ai-partner-appのセットアップ
- AI CLI統合の使い方

#### D-3: AGENTS.mdの更新

**追加内容**:
- ai-partner-app情報
- Business Agents実行例
- Entity-Relationモデル図

#### D-4: ランディングページの更新

**コンテンツ**:
- プロジェクト概要動画（3分）
- スクリーンショット（10枚）
- デモ動画（ai-partner-app）
- GitHubスター数、コントリビューター

---

## 💡 推奨される次のアクション

### 即座に実行すべきタスク（今日中）
1. ✅ **git push origin main** - 26コミットをバックアップ
2. **Phase Aの開始準備** - Rust開発環境確認
3. **Phase Bの優先度確認** - ai-partner-appのデプロイ必要性

### 今週中に実行すべきタスク
- **Phase A-1: CoordinatorAgent実装開始**
- **Phase B-1: 認証機能有効化**
- **LDD作業ログの更新**

### 今月中に完了すべきマイルストーン
- **Rust版Miyabi CLI完成**（Phase A完了）
- **ai-partner-appデプロイ**（Phase B完了）
- **Business Agents動作確認**（Phase C完了）

---

## 📊 リソース見積もり

### 開発時間（概算）
- **Phase A**: 10-12時間（1-2週間）
- **Phase B**: 9-12時間（1-2週間）
- **Phase C**: 7-9時間（1週間）
- **Phase D**: 5-6時間（3-4日）

**合計**: 31-39時間（1ヶ月）

### 必要なリソース
- **開発環境**: Rust 1.70+, Node.js 18+, Docker
- **APIキー**: Anthropic, BytePlus, Gemini TTS
- **インフラ**: Vercel, Firebase/Railway, Supabase/PlanetScale
- **テスト環境**: GitHub Actions, ローカルテスト環境

---

## 🎯 成功基準

### Phase A（Rust CLI）
- ✅ CoordinatorAgent完全実装
- ✅ 並列実行効率70%以上
- ✅ 実行時間50%削減達成

### Phase B（ai-partner-app）
- ✅ 本番環境デプロイ完了
- ✅ エンドツーエンドテスト成功
- ✅ ユーザーガイド完備

### Phase C（Business Agents）
- ✅ 4つのSkills実行成功
- ✅ 実行時間5分以内/Skill
- ✅ 実用レベルの出力品質

### Phase D（ドキュメント）
- ✅ README/QUICKSTART最新化
- ✅ ランディングページ更新
- ✅ 公開準備完了

---

## 📝 次のステップ

### ユーザーへの質問
1. どのPhaseを最優先で実行すべきか？
   - Phase A（Rust CLI）
   - Phase B（ai-partner-app）
   - Phase C（Business Agents）
   - Phase D（ドキュメント）

2. 実施順序の希望は？
   - オプション1: 段階的アプローチ（推奨）
   - オプション2: 並列アプローチ
   - オプション3: 集中アプローチ

3. 具体的な開始タスクは？
   - 例: Phase A-1（CoordinatorAgent実装開始）
   - 例: Phase B-1（認証機能有効化）

---

**作成完了**
Codex (メインセッション)

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
