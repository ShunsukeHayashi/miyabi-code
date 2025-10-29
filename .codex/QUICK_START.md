# 🚀 1分で始めるMiyabi - Quick Start Guide (Rust Edition)

**Miyabi** は一つのコマンドで全てが完結する自律型開発フレームワークです。
Rust実装により、**50%以上高速**、**30%以上メモリ効率向上**を実現しました。

## 📋 前提条件

- Rust 1.75以上（推奨: 1.90）
- GitHub CLI（`gh`）
- GitHub アカウント

## ⏱️ 1分目: 超簡単セットアップ（60秒）

### Step 1: Rustのインストール（初回のみ）

```bash
# Termux (Android)
pkg install rust

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Step 2: GitHub認証（初回のみ）

```bash
# GitHub CLIのインストール
pkg install gh  # Termux
brew install gh # macOS

# GitHub認証
gh auth login
```

### Step 3: プロジェクトセットアップ（**1コマンド**）

```bash
# プロジェクトディレクトリで実行
cd your-project

# ビルド（初回のみ、8-10分）
cargo build --release

# セットアップ（1コマンドで完了！）
./target/release/miyabi setup

# または、インタラクティブをスキップ
./target/release/miyabi setup --yes
```

**`miyabi setup`が自動的に実行すること**:
1. ✅ GitHub認証の確認
2. ✅ Git remoteから`owner/repo`を自動検出
3. ✅ `.env`ファイルの生成
4. ✅ `.miyabi.yml`の生成
5. ✅ 必要なディレクトリ作成（`.ai/logs`, `.worktrees`等）

**従来**: 手動で5-6ステップ必要
**現在**: **1コマンドで完了** 🎉

✅ **確認**: `./target/release/miyabi status` を実行してセットアップを確認

---

## ⏱️ 2分目: 最初のAgent実行（60秒）

Miyabiには21個のAgentがいて、それぞれに親しみやすい名前がついています。

### しきるん（CoordinatorAgent）でIssue分析

```bash
# 環境変数を設定（初回のみ）
export GITHUB_TOKEN=$(gh auth token)

# Issueを分析してDAGに分解
./target/release/miyabi agent coordinator --issue 139
```

**出力例**（2.8秒で完了）:
```
🤖 Running coordinator agent...
  Issue: #139
  Type: CoordinatorAgent (Task decomposition & DAG)

  Executing...
  ✅ Agent completed successfully!

  Results:
    Status: Success
    Duration: 2793ms
    Tasks: 4個（分析 → 実装 → テスト → レビュー）
    Estimated Total Duration: 60分
```

**しきるん** がIssueを分析して、DAG（有向非巡回グラフ）に分解します。

### つくるん（CodeGenAgent）でコード生成

```bash
# Issueのコードを生成
./target/release/miyabi agent codegen --issue 138
```

**つくるん** が高品質なRustコードを自動生成します（型安全・テスト付き）。

### めだまん（ReviewAgent）で品質チェック

```bash
# コード品質をチェック
./target/release/miyabi agent review --issue 137
```

**めだまん** がコード品質を100点満点で評価します（Clippy + テストカバレッジ）。

---

## ⏱️ 3分目: よく使うコマンド（60秒）

### テスト実行

```bash
/test
```

プロジェクト全体のテストを実行します。

### デプロイ

```bash
# Staging環境
/deploy --staging

# Production環境（本番デプロイはCTOエスカレーション必要）
/deploy --production
```

### システム動作確認

```bash
/verify
```

Rust型チェック、テスト、Agent実行可能性をすべて確認します。

---

## 🎮 キャラクター図鑑 - 21人の仲間たち

Miyabiには21個のAgentがいて、4つの役割に分かれています。

### 🔴 リーダー（2キャラ）- 指示を出す

| キャラ | 技術名 | 役割 |
|--------|--------|------|
| **しきるん** | CoordinatorAgent | タスクを分解して指示を出す統括マネージャー |
| **あきんどさん** | AIEntrepreneurAgent | ビジネス戦略を立てる起業家 |

### 🟢 実行役（12キャラ）- 実際に作業する

| キャラ | 技術名 | 役割 |
|--------|--------|------|
| **つくるん** | CodeGenAgent | コードを書く開発者 |
| **かくちゃん** | ContentCreationAgent | コンテンツを作るクリエイター |
| **しらべるん** | MarketResearchAgent | 市場調査をするリサーチャー |
| **せっけいくん** | ProductConceptAgent | 商品企画をするプランナー |
| **くわしくん** | ProductDesignAgent | 詳細設計をするデザイナー |
| **じぶんちゃん** | SelfAnalysisAgent | 自己分析をするアナリスト |
| **つなぐん** | FunnelDesignAgent | 導線設計をする設計者 |
| **ぺるそなちゃん** | PersonaAgent | ペルソナ設計をするマーケター |
| **ひろめるん** | MarketingAgent | マーケティング施策を実行する広報 |
| **SNSくん** | SNSStrategyAgent | SNS戦略を立てるSNS担当 |
| **どうがちゃん** | YouTubeAgent | YouTube運用をする動画クリエイター |
| **うるん** | SalesAgent | 営業活動をするセールス |

### 🔵 分析役（5キャラ）- 調べる、考える

| キャラ | 技術名 | 役割 |
|--------|--------|------|
| **みつけるん** | IssueAgent | Issueを分析してラベルを付ける探偵 |
| **めだまん** | ReviewAgent | コード品質をチェックする品質管理 |
| **かぞえるん** | AnalyticsAgent | データ分析をするアナリスト |
| **おきゃくちゃん** | CRMAgent | 顧客管理をするCRM担当 |

### 🟡 サポート役（3キャラ）- 手伝う、つなぐ

| キャラ | 技術名 | 役割 |
|--------|--------|------|
| **まとめるん** | PRAgent | Pull Requestを作るアシスタント |
| **はこぶん** | DeploymentAgent | デプロイを実行する配達員 |

**詳細**: [AGENT_CHARACTERS.md](agents/AGENT_CHARACTERS.md) を参照

---

## 📚 チュートリアル

### Tutorial 1: しきるん でタスク分解

**目的**: 複雑なIssueを小さなタスクに分解する

```bash
# Codex内で実行
/agent-run --issues=270
```

**しきるん** が以下を実行します：
1. Issue #270の内容を読み取り
2. タスクに分解（例: Task A, B, C）
3. 依存関係を分析（DAG作成）
4. 並列実行可能なタスクを特定
5. 各タスクに適切なAgentを割り当て

**出力例**:
```
📋 Task Decomposition Complete
├── Task A: 型定義作成 → つくるん（CodeGenAgent）
├── Task B: テスト作成 → つくるん（CodeGenAgent）
└── Task C: ドキュメント作成 → かくちゃん（ContentCreationAgent）

⚡ Parallel Execution Plan:
- Group 1: Task A, B (並列実行可能)
- Group 2: Task C (A, B完了後)

⏱️ Estimated Time: 2.5 hours
```

---

### Tutorial 2: つくるん でコード生成

**目的**: AIを使って高品質なコードを自動生成する

```bash
# Codex内で
"Issue #270のTask Aを実装して。Rust 2021 Editionでお願い。"
```

**つくるん** が以下を実行します：
1. Task Aの要件を理解
2. Rust 2021 Edition準拠のコード生成
3. ユニットテストの自動生成（#[cfg(test)] mod tests）
4. Rustdocコメントの追加（///）
5. コミット（Conventional Commits準拠、日本語）

**生成されるファイル例**:
```
crates/miyabi-foo/
├── src/
│   ├── lib.rs           # ライブラリエントリポイント
│   ├── types.rs         # 型定義
│   └── service.rs       # 実装（tests含む）
├── Cargo.toml           # クレート定義
└── README.md            # ドキュメント
```

---

### Tutorial 3: めだまん で品質チェック

**目的**: コード品質を客観的に評価する

```bash
# Codex内で
/review
```

**めだまん** が以下をチェックします：
1. Clippy - Rustコーディング規約違反
2. cargo check - コンパイル・型エラー
3. cargo audit - 脆弱性検出
4. 品質スコアリング（100点満点）

**評価基準**:
```
基準点: 100点
- Clippyエラー: -20点/件
- コンパイルエラー: -30点/件
- Critical脆弱性: -40点/件
- High脆弱性: -20点/件

✅ 80点以上: 合格
⚠️ 60-79点: 要改善
❌ 60点未満: 不合格（エスカレーション）
```

**出力例**:
```
🎯 Quality Score: 85/100 ✅

📊 Issues Found:
- Clippy: 1 warning (unused variable)
- Cargo check: 0 errors
- Security: 0 vulnerabilities

✅ Review PASSED - Ready for merge
```

---

### Tutorial 4: はこぶん でデプロイ

**目的**: Staging/Production環境に自動デプロイ

```bash
# Staging環境へデプロイ
/deploy --staging
```

**はこぶん** が以下を実行します：
1. ビルド（`cargo build --release`）
2. テスト実行（`cargo test --all`）
3. Firebase/Vercelへデプロイ
4. ヘルスチェック
5. デプロイ成功/失敗の通知
6. 失敗時は自動ロールバック

**Production環境へのデプロイ**:
```bash
# Production環境（CTOエスカレーション必要）
/deploy --production
```

Production環境へのデプロイは**CTO承認が必要**です（Sev.1-Criticalエスカレーション）。

---

## 🔄 並列実行のルール

Agentを複数同時に実行する際のルールです。

### ✅ 同時実行OK

- 🟢 実行役 + 🟢 実行役: `つくるん` + `かくちゃん`
- 🟢 実行役 + 🔵 分析役: `つくるん` + `みつけるん`
- 🔵 分析役 + 🔵 分析役: `めだまん` + `かぞえるん`

**例**:
```bash
# つくるん と かくちゃん を並列実行（Worktreeベース）
miyabi agent run coordinator --issues=270,271 --concurrency=2
```

### ❌ 同時実行NG

- 🔴 リーダー + 🔴 リーダー: `しきるん` + `あきんどさん`

**理由**: 両方とも全体を統括するため、競合が発生します。

### ⚠️ 条件付き実行

- 🟡 サポート役: 他のAgentの完了後に実行

**例**: `つくるん`（コード生成）→ `めだまん`（品質チェック）→ `まとめるん`（PR作成）

---

## 💡 Tips & Tricks

### 1. Dry Runで事前確認

```bash
miyabi agent run coordinator --issues=270 --dry-run
```

実際には実行せず、実行プランだけを確認できます。

### 2. Watch Modeでリアルタイム監視

```bash
miyabi status --watch
# または
./target/release/miyabi status --watch
```

5秒ごとにIssueの状態を自動更新して表示します。

### 3. JSON出力でスクリプト化

```bash
miyabi status --json > status.json
cat status.json | jq '.data.issues.byState'
```

JSON形式で出力できるため、シェルスクリプトやCIと統合しやすいです。

### 4. キャラクター名で呼び出す

```bash
# 技術名で呼び出す（従来）
"CoordinatorAgentでIssue #270を処理"

# キャラクター名で呼び出す（推奨）
"しきるん で Issue #270 を処理して"
```

キャラクター名の方が親しみやすく、覚えやすいです。

---

## 🔗 次のステップ

### 📖 詳細ドキュメント

- [AGENT_OPERATIONS_MANUAL.md](../docs/AGENT_OPERATIONS_MANUAL.md) - Agent完全運用マニュアル
- [LABEL_SYSTEM_GUIDE.md](../docs/LABEL_SYSTEM_GUIDE.md) - 53ラベル体系ガイド
- [ENTITY_RELATION_MODEL.md](../docs/ENTITY_RELATION_MODEL.md) - システム全体のEntity-Relationモデル

### 🛠️ トラブルシューティング

何か問題が発生したら、[TROUBLESHOOTING.md](TROUBLESHOOTING.md) を参照してください。

### 🎯 高度な使い方

- [Worktree並列実行](../CLAUDE.md#git-worktree並列実行アーキテクチャ)
- [MCP Server統合](README.md#-mcp-servers)
- [Hooks設定](README.md#-hooks設定)

---

## 📞 サポート

質問や問題がある場合：
- **GitHub Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **Email**: supernovasyun@gmail.com

---

🌸 **Miyabi** - Beauty in Autonomous Development

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
