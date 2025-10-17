# Codex Session README - Miyabi Project

**このファイルはCodexセッション（別スレッドのClaude Code）専用です。**

---

## 🚀 クイックスタート

### プロジェクト情報
- **名前**: Miyabi
- **言語**: Rust 2021 Edition
- **目的**: 自律型AI開発フレームワーク
- **リポジトリ**: ShunsukeHayashi/miyabi-private

### 基本コマンド

```bash
# ビルド
cargo build --release

# テスト
cargo test --all

# CLI実行
./target/release/miyabi status

# Agent実行
./target/release/miyabi agent run coordinator --issue 270
```

---

## 📁 ファイル構造（簡易版）

```
crates/
├── miyabi-cli/         # CLIツール (bin)
├── miyabi-agents/      # Agent実装
├── miyabi-types/       # コア型定義
├── miyabi-core/        # 共通ユーティリティ
├── miyabi-github/      # GitHub API統合
├── miyabi-worktree/    # Git Worktree管理
├── miyabi-llm/         # LLM統合
└── miyabi-potpie/      # Potpie統合

.claude/
├── settings.json       # Claude Code hooks設定
├── agents/             # Agent仕様・プロンプト
├── commands/           # カスタムコマンド
├── docs/               # ドキュメント
├── scripts/            # ユーティリティスクリプト
└── templates/          # テンプレート

docs/                   # プロジェクトドキュメント
```

---

## 🤖 Agent System

### Coding Agents（7個）
1. **CoordinatorAgent** - タスク統括・DAG分解
2. **CodeGenAgent** - AI駆動コード生成
3. **ReviewAgent** - コード品質レビュー
4. **IssueAgent** - Issue分析・ラベリング
5. **PRAgent** - Pull Request作成
6. **DeploymentAgent** - CI/CDデプロイ
7. **TestAgent** - テスト実行

### Business Agents（14個）
- 戦略・企画系（6個）
- マーケティング系（5個）
- 営業・顧客管理系（3個）

**詳細**: `.claude/agents/README.md`

---

## 🔧 よく使う操作

### Git操作

```bash
# ステータス確認
git status

# 未追跡ファイル確認
git status --short | grep "^??"

# コミット
git add <files>
git commit -m "feat: description"
```

### 環境変数

```bash
# .envから読み込み
source .env

# または直接設定
export GITHUB_TOKEN=ghp_xxx
export GITHUB_REPOSITORY=ShunsukeHayashi/miyabi-private
```

### トラブルシューティング

```bash
# ビルドエラー時
cargo clean
cargo build --release

# テストエラー時
cargo test --all -- --nocapture

# 環境変数確認
echo $GITHUB_TOKEN
```

---

## 📋 報告プロトコル

**Codexセッションからの報告は以下の形式を使用してください**:

```markdown
## 📋 Claude Code (Codex Session) からの作業報告

**報告者**: Claude Code (AI Assistant) - Session: Codex
**報告日時**: YYYY-MM-DD
**セッション**: [タスク名]

---

### ✅ 完了した作業
[作業内容]

---

**報告終了**
Claude Code (Codex Session)
```

**テンプレート**: `.claude/templates/reporting-protocol.md`

---

## ⚠️ Codexセッション特有の注意事項

### 1. メインセッションとの区別

このセッションは「Codex」として識別されます:
- 報告書に「Codex Session」と明記
- AGENTS.md/CLAUDE.mdの両方を参照可能
- メインセッション（Claude Code）との並列実行が可能

### 2. 制限事項

- ネットワーク制限により`gh auth login`は実行不可
- 環境変数`GITHUB_TOKEN`は`.env`から読み込み
- 大規模なファイル編集は避ける（メインセッションに任せる）

### 3. 推奨される使用方法

✅ **推奨**:
- 小規模なファイル編集
- Git操作（status, add, commit）
- cargo コマンド実行
- ドキュメント追加・更新

❌ **非推奨**:
- 複数ファイルの大規模リファクタリング
- GitHub API直接呼び出し
- 長時間実行されるAgent処理

---

## 🔗 参考ドキュメント

### 必読
- **CLAUDE.md** - プロジェクト全体のコンテキスト（詳細版）
- **AGENTS.md** - Agent仕様・ドキュメント体系
- **QUICKSTART-JA.md** - クイックスタートガイド

### AI CLI関連
- `.claude/docs/AI_CLI_COMPLETE_GUIDE.md` - AI CLI完全ガイド
- `.claude/docs/AI_CLI_COMPARISON.md` - 使い分けガイド
- `.claude/docs/CODEX_CLARIFICATION.md` - Codex定義明確化

### テンプレート
- `.claude/templates/reporting-protocol.md` - 報告プロトコル

---

## 🎯 現在の状態

**最新コミット**: `fd25220` - AI CLI統合ドキュメント
**ブランチ**: main
**リモート**: origin/mainより10コミット先行

**未追跡ファイル**:
- `.claude/Skills/*` (4ディレクトリ)
- `ai-partner-app/`
- `docs/*_REPORT.md` (3ファイル)

**推奨アクション**: 未追跡ファイルをコミット

---

## 💡 便利なスクリプト

### バージョンチェッカー
```bash
./.claude/scripts/check-ai-cli-versions.sh
```

### Miyabi実行ヘルパー
```bash
# .env自動読み込み
./miyabi.sh status

# 環境変数直接指定
./miyabi-direct.sh status
```

---

**このREADMEはCodexセッション専用です。メインセッションはCLAUDE.mdを参照してください。**
