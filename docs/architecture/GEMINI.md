# Miyabi Project - Gemini CLI Context

**このファイルはGemini CLI専用のクイックリファレンスです。**

---

## 🚀 Quick Info

- **Project**: Miyabi - 自律型AI開発フレームワーク
- **Language**: Rust 2021 Edition
- **Repository**: ShunsukeHayashi/miyabi-private
- **Status**: Active development

---

## 📦 Quick Commands

### Build & Test

```bash
# ビルド（リリース）
cargo build --release

# ビルド（開発）
cargo build

# テスト実行
cargo test --all

# 特定クレートのテスト
cargo test -p miyabi-cli
```

### Miyabi CLI

```bash
# ステータス確認
./target/release/miyabi status

# Agent実行
./target/release/miyabi agent run coordinator --issue 270

# ヘルプ
./target/release/miyabi --help
```

### Git Operations

```bash
# ステータス
git status

# コミット
git add <files>
git commit -m "feat: description"

# プッシュ
git push origin main
```

---

## 📁 File Structure

```
crates/
├── miyabi-cli/         # CLI binary
├── miyabi-agents/      # Agent implementations
├── miyabi-types/       # Core types
├── miyabi-core/        # Common utilities
├── miyabi-github/      # GitHub API
├── miyabi-worktree/    # Git Worktree management
├── miyabi-llm/         # LLM integration
└── miyabi-potpie/      # Potpie integration

.claude/
├── agents/             # Agent specs & prompts
│   ├── specs/          # Agent specifications
│   └── prompts/        # Execution prompts
├── commands/           # Slash commands
├── docs/               # AI CLI documentation
├── scripts/            # Utility scripts
└── templates/          # Report templates

docs/                   # Project documentation
```

---

## 🤖 Agent System

### Overview
- **Total**: 21 Agents
- **Coding**: 7 Agents
- **Business**: 14 Agents

### Coding Agents
1. **CoordinatorAgent** - タスク統括・DAG分解
2. **CodeGenAgent** - コード生成（Claude Sonnet 4）
3. **ReviewAgent** - 品質レビュー（100点満点）
4. **IssueAgent** - Issue分析・ラベル付与
5. **PRAgent** - Pull Request作成
6. **DeploymentAgent** - CI/CDデプロイ
7. **TestAgent** - テスト自動実行

### Business Agents
- AIEntrepreneur, ProductConcept, ProductDesign
- MarketResearch, Marketing, ContentCreation
- Sales, CRM, Analytics
- その他8個

**詳細**: `.claude/agents/README.md`

---

## 🔧 Common Issues

### Issue 1: GITHUB_TOKEN not set

**症状**: `Error: GITHUB_TOKEN not set`

**解決策**:
```bash
export GITHUB_TOKEN=ghp_xxx
```

または `.env`ファイルに記載:
```bash
echo "GITHUB_TOKEN=ghp_xxx" >> .env
source .env
```

---

### Issue 2: cargo build fails

**症状**: コンパイルエラー

**解決策**:
```bash
# キャッシュクリア
cargo clean

# 再ビルド
cargo build --release
```

---

### Issue 3: Test failures

**症状**: テストが失敗する

**確認事項**:
1. `.env`ファイルが存在するか
2. `GITHUB_TOKEN`が設定されているか
3. ネットワーク接続が正常か

**デバッグ**:
```bash
# 詳細出力付きテスト
cargo test --all -- --nocapture

# 特定のテストのみ
cargo test test_name
```

---

### Issue 4: Permission denied

**症状**: スクリプト実行時にpermission denied

**解決策**:
```bash
# 実行権限付与
chmod +x miyabi.sh
chmod +x .claude/hooks/*.sh
chmod +x .claude/scripts/*.sh
```

---

## 📚 Key Documents

### 初心者向け
- `QUICKSTART-JA.md` - 5分で始めるガイド
- `.claude/QUICK_START.md` - 3分クイックスタート
- `MCP_AUTHENTICATION_GUIDE.md` - 認証ガイド

### 開発者向け
- `CLAUDE.md` - 完全なプロジェクトコンテキスト
- `AGENTS.md` - Agent仕様・ドキュメント体系
- `.claude/docs/AI_CLI_COMPLETE_GUIDE.md` - AI CLI完全ガイド

### リファレンス
- `docs/ENTITY_RELATION_MODEL.md` - Entity-Relationモデル
- `docs/LABEL_SYSTEM_GUIDE.md` - 53ラベル体系
- `.claude/templates/reporting-protocol.md` - 報告プロトコル

---

## 🎯 Current Status

### Branch & Commits
- **Branch**: main
- **Ahead of origin**: 10 commits
- **Last commit**: `fd25220` - AI CLI integration

### Untracked Files
```
.claude/Skills/content-marketing-strategy/
.claude/Skills/growth-analytics-dashboard/
.claude/Skills/market-research-analysis/
.claude/Skills/sales-crm-management/
ai-partner-app/
docs/DEBUG_SESSION_REPORT.md
docs/PERFORMANCE_REPORT.md
docs/SKILLS_TEST_COMPLETE_REPORT.md
```

**Note**: すべてコミット対象として保持推奨（Codex確認済み）

---

## 💡 Gemini CLI Tips

### ファイル参照（@記法）

```bash
# 単一ファイル
gemini "@CLAUDE.md このファイルを要約して"

# 複数ファイル
gemini "@CLAUDE.md と @AGENTS.md を比較して"

# ディレクトリ
gemini "@crates/ ディレクトリ構造を説明して"

# 特定行範囲
gemini "@src/main.rs:1-50 main関数を説明して"
```

### インタラクティブモード

```bash
cd /Users/a003/dev/miyabi-private
gemini

# Gemini CLI内で
> @CLAUDE.md プロジェクト概要を教えて
> /copy  # 出力をコピー
> /help  # ヘルプ表示
> /exit  # 終了
```

### VS Code統合

VS Code統合ターミナルで実行すると、開いているファイルのコンテキストを自動認識します。

```bash
# VS Code統合ターミナルで
gemini
> 現在開いているファイルを説明して
```

---

## 🔄 Update Information

### AI CLI Versions
- **Claude Code**: claude-sonnet-4-5-20250929
- **Gemini CLI**: v0.9.0
- **OpenAI Codex CLI**: v0.46.0

### Check Updates
```bash
./.claude/scripts/check-ai-cli-versions.sh
```

### Update Gemini CLI
```bash
npm update -g @google/gemini-cli
```

---

## 🚨 Emergency Commands

### プロジェクトが壊れたら

```bash
# Gitを最新コミットに戻す
git reset --hard HEAD

# 未追跡ファイルを削除
git clean -fd
```

### ビルドが完全に壊れたら

```bash
# 完全クリーン
cargo clean
rm -rf target/
cargo build --release
```

### 環境変数がおかしくなったら

```bash
# .envを再読み込み
source .env

# または手動設定
export GITHUB_TOKEN=ghp_xxx
export GITHUB_REPOSITORY=ShunsukeHayashi/miyabi-private
```

---

## 📞 Contact & Support

- **GitHub Issues**: https://github.com/ShunsukeHayashi/miyabi-private/issues
- **Documentation**: `.claude/docs/`
- **Quick Help**: `./target/release/miyabi --help`

---

UI UX test

{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}


**このファイルはGemini CLI専用です。詳細なドキュメントはCLAUDE.mdまたはAGENTS.mdを参照してください。**
