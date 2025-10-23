# Tutorial 01: Getting Started with Miyabi

**Estimated Time**: 15 minutes
**Difficulty**: Beginner
**Prerequisites**: Basic command line knowledge

---

## 📚 はじめに

Miyabiは、完全自律型AI開発オペレーションプラットフォームです。GitHub as OSアーキテクチャに基づき、Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

### 主な特徴

- 🦀 **Rust 2021 Edition** - 高速・安全・並列実行
- 🤖 **21個のAgent** - Coding Agent（7個）+ Business Agent（14個）
- 🕷️ **Water Spider Orchestrator** - DAGベースの並列タスク実行
- 🔗 **GitHub OS統合** - Issue、PR、Label、Projectsの完全統合
- 📊 **53ラベル体系** - 構造化されたワークフロー管理

---

## 🔧 前提条件

Miyabiを使用するには、以下の環境が必要です：

### 必須

- **Rust**: 1.82以上
  ```bash
  rustc --version
  # rustc 1.82.0 (f6e511eec 2024-10-15)
  ```

- **Git**: 2.x以上
  ```bash
  git --version
  # git version 2.39.3
  ```

- **GitHub CLI**: 最新版
  ```bash
  gh --version
  # gh version 2.40.1 (2024-01-15)
  ```

### オプション（推奨）

- **Claude Code CLI** - Agent実行に必要
- **Node.js** - TypeScript版（レガシー）を使用する場合
- **Docker** - コンテナ環境でのテスト用

---

## 📦 インストール

### 方法1: Cargo経由でインストール（推奨）

```bash
# リリース版をインストール
cargo install miyabi

# バージョン確認
miyabi --version
# miyabi 0.1.1
```

### 方法2: ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi

# リリースビルド
cargo build --release

# バイナリを確認
./target/release/miyabi --version
```

### 方法3: プレビルドバイナリ

```bash
# GitHubリリースページからダウンロード
# https://github.com/ShunsukeHayashi/Miyabi/releases

# macOS (Apple Silicon)
wget https://github.com/ShunsukeHayashi/Miyabi/releases/download/v0.1.1/miyabi-aarch64-apple-darwin.tar.gz
tar -xzf miyabi-aarch64-apple-darwin.tar.gz
sudo mv miyabi /usr/local/bin/

# Linux (x86_64)
wget https://github.com/ShunsukeHayashi/Miyabi/releases/download/v0.1.1/miyabi-x86_64-unknown-linux-gnu.tar.gz
tar -xzf miyabi-x86_64-unknown-linux-gnu.tar.gz
sudo mv miyabi /usr/local/bin/

# Windows (x86_64)
# Download miyabi-x86_64-pc-windows-msvc.zip and extract miyabi.exe
```

---

## ⚙️ 初期設定

### 1. 新規プロジェクトを作成

```bash
# 新しいプロジェクトを作成
miyabi init my-project

# プロジェクトディレクトリに移動
cd my-project
```

**作成されるファイル**:
```
my-project/
├── .miyabi.yml          # プロジェクト設定
├── .github/
│   ├── workflows/       # CI/CD設定
│   └── labels.yml       # 53ラベル定義
├── .claude/
│   ├── commands/        # Claudeコマンド
│   └── agents/          # Agent仕様
├── crates/
│   └── my-project/      # Rustクレート
├── Cargo.toml           # Workspace設定
└── README.md
```

### 2. 既存プロジェクトに追加

```bash
# 既存のプロジェクトに移動
cd existing-project

# Miyabiをインストール
miyabi install

# .miyabi.ymlと.github/ディレクトリが追加される
```

### 3. GitHub連携を設定

```bash
# GitHubトークンを環境変数に設定（推奨）
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# または .miyabi.yml に直接記載（非推奨）
# github:
#   token: ghp_xxxxxxxxxxxxxxxxxxxxx
```

**トークンのスコープ**:
- `repo` - リポジトリアクセス
- `workflow` - GitHub Actions
- `project` - Projects V2

### 4. 設定ファイルを編集

`.miyabi.yml`:
```yaml
project:
  name: my-project
  owner: your-username
  repo: my-project

github:
  # トークンは環境変数を使用（推奨）
  # token: $GITHUB_TOKEN

agents:
  coordinator:
    enabled: true
    max_parallel: 5

  codegen:
    enabled: true
    model: claude-sonnet-4

worktrees:
  base_path: .worktrees
  cleanup_on_success: false

labels:
  auto_apply: true
  system: miyabi-57-labels
```

---

## ✅ 動作確認

### 1. ステータス確認

```bash
# プロジェクトステータスを表示
miyabi status

# 出力例:
# ✅ Miyabi Project: my-project
# 📂 Repository: your-username/my-project
# 🏷️  Labels: 53/53 synced
# 🤖 Agents: 7 enabled
# 📊 Open Issues: 0
# 🔄 Active Worktrees: 0
```

### 2. リアルタイム監視

```bash
# ステータスを自動更新（1秒ごと）
miyabi status --watch

# Ctrl+Cで終了
```

### 3. 利用可能なAgentを確認

```bash
# Agent一覧を表示
miyabi agent list

# 出力例:
# 🤖 Available Agents (7):
#   ├─ CoordinatorAgent - タスク統括・DAG分解
#   ├─ CodeGenAgent     - AI駆動コード生成
#   ├─ ReviewAgent      - コード品質レビュー
#   ├─ IssueAgent       - Issue分析・ラベリング
#   ├─ PRAgent          - Pull Request自動作成
#   ├─ DeploymentAgent  - CI/CDデプロイ自動化
#   └─ RefresherAgent   - Issue状態監視・自動更新
```

### 4. テストIssueを作成

```bash
# GitHub CLIでテストIssueを作成
gh issue create \
  --title "Test Issue for Miyabi" \
  --body "This is a test issue to verify Miyabi setup." \
  --label "📥 state:pending" \
  --label "🤖 agent:coordinator"

# IssueAgentが自動的にラベルを追加
miyabi agent run issue --issue <issue-number>
```

---

## 🚀 次のステップ

おめでとうございます！Miyabiのセットアップが完了しました。

次のチュートリアルに進んでください：

1. **[Tutorial 02: Creating Your First Agent](02-creating-your-first-agent.md)**
   BaseAgent traitを使った初めてのAgent作成

2. **[Tutorial 03: Worktree Parallel Execution](03-worktree-parallel-execution.md)**
   Git Worktreeを使った並列実行の実践

3. **[Tutorial 04: Integration with GitHub](04-integration-with-github.md)**
   GitHub API統合（Issue、PR、Label操作）

---

## 🆘 トラブルシューティング

### Q1: `miyabi: command not found`

**原因**: `~/.cargo/bin`がPATHに含まれていない

**解決**:
```bash
# ~/.zshrc または ~/.bashrc に追加
export PATH="$HOME/.cargo/bin:$PATH"

# 再読み込み
source ~/.zshrc  # または source ~/.bashrc
```

### Q2: `GitHub token not found`

**原因**: GitHubトークンが設定されていない

**解決**:
```bash
# 環境変数に設定
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# 永続化するには ~/.zshrc に追記
echo 'export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx' >> ~/.zshrc
```

### Q3: `Labels not synced`

**原因**: GitHubリポジトリにラベルが存在しない

**解決**:
```bash
# ラベルを自動作成
miyabi labels sync

# または手動で作成
gh label create "📥 state:pending" --description "Issue created, awaiting triage" --color E4E4E4
```

### Q4: Permission denied エラー

**原因**: GitHubトークンのスコープが不足

**解決**:
- GitHub Settings → Developer settings → Personal access tokens
- `repo`, `workflow`, `project` スコープを有効化
- 新しいトークンを生成して再設定

---

## 📚 関連ドキュメント

- **[CLAUDE.md](../../CLAUDE.md)** - プロジェクト全体のコンテキスト
- **[QUICK_START.md](../../.claude/QUICK_START.md)** - 3分で始めるMiyabi
- **[ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)** - Entity-Relationモデル定義
- **[LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md)** - 53ラベル体系完全ガイド

---

**このチュートリアルは完了しました。次のチュートリアルに進んでください！** 🎉

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
📅 Last Updated: 2025-10-24
