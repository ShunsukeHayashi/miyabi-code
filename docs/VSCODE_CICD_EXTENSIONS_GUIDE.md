# VS Code 拡張機能ガイド - CI/CD & GitHub Actions 管理

**最終更新**: 2025-10-22
**バージョン**: 1.0.0

このガイドでは、CI/CDワークフロー管理とGitHub Actions管理のための最適なVS Code拡張機能を紹介します。

---

## 📦 必須拡張機能（6個）

### 1. **GitHub Actions** (公式) ⭐⭐⭐⭐⭐

**ID**: `github.vscode-github-actions`
**提供元**: GitHub
**評価**: 4.5/5 (900+ レビュー)

#### 機能
- ✅ YAML構文ハイライト・補完
- ✅ ワークフロー実行状況のリアルタイム表示
- ✅ ログの直接閲覧（VS Code内）
- ✅ ワークフロー手動実行
- ✅ シークレット変数の管理
- ✅ Self-hosted runnerステータス確認

#### インストール
```bash
code --install-extension github.vscode-github-actions
```

#### 使用方法

**1. サイドバーで確認**
```
Activity Bar → GitHub Actions アイコン
└── Workflows
    ├── rust.yml ✅ (最新: 成功)
    ├── security-audit.yml ⏳ (実行中)
    └── integrated-system-ci.yml ❌ (失敗)
```

**2. ワークフロー手動実行**
```
右クリック → "Run Workflow"
→ ブランチ選択 → 実行
```

**3. ログ閲覧**
```
ワークフロー実行をクリック
→ ジョブ選択
→ ステップごとのログ表示
```

**4. Self-hosted Runnerステータス**
```
Settings → Runners
→ miyabi-runner-macmini1: Idle ✅
→ miyabi-runner-macmini2: Busy 🔄
```

#### キーボードショートカット
- `Cmd+Shift+P` → "GitHub Actions: Open Workflow File"
- `Cmd+Shift+P` → "GitHub Actions: Run Workflow"

---

### 2. **GitHub Pull Requests and Issues** ⭐⭐⭐⭐⭐

**ID**: `github.vscode-pull-request-github`
**提供元**: GitHub

#### 機能
- ✅ PR作成・レビュー（VS Code内完結）
- ✅ Issue管理（ラベル、マイルストーン）
- ✅ CI/CDステータスの統合表示
- ✅ コメント機能
- ✅ マージ操作

#### インストール
```bash
code --install-extension github.vscode-pull-request-github
```

#### CI/CD統合機能

**PR画面でのCI確認**
```
Pull Request タブ
└── PR #123: feat(ci): enable self-hosted runners
    ├── Checks ✅
    │   ├── rust.yml: check ✅ (1m 23s)
    │   ├── rust.yml: test ✅ (5m 47s)
    │   └── security-audit.yml ✅ (3m 12s)
    ├── Files Changed (5 files)
    └── Comments (3)
```

**失敗時のアクション**
```
❌ rust.yml: test failed
→ クリック → ログ表示
→ "Re-run Jobs" ボタンでリトライ
```

---

### 3. **YAML** (Red Hat) ⭐⭐⭐⭐⭐

**ID**: `redhat.vscode-yaml`
**提供元**: Red Hat

#### 機能
- ✅ YAML構文チェック（リアルタイム）
- ✅ GitHub Actions schemaサポート
- ✅ 自動補完（runs-on, steps, uses等）
- ✅ 検証エラー表示
- ✅ ドキュメントリンク

#### インストール
```bash
code --install-extension redhat.vscode-yaml
```

#### 設定 (settings.json)

```json
{
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  },
  "yaml.format.enable": true,
  "yaml.validate": true,
  "yaml.hover": true,
  "yaml.completion": true
}
```

#### 自動補完例

```yaml
jobs:
  build:
    runs-on: |  # ← ここで自動補完
    # 提案:
    # - ubuntu-latest
    # - macos-latest
    # - windows-latest
    # - [self-hosted, macOS, arm64, miyabi-light]
    # - [self-hosted, macOS, arm64, miyabi-heavy]
```

#### エラー検出

```yaml
❌ jobs:
  build:
    run-on: ubuntu-latest  # ← "run-on" is not a valid property
    # 修正: runs-on
```

---

### 4. **GitLens** ⭐⭐⭐⭐⭐

**ID**: `eamodio.gitlens`
**提供元**: GitKraken

#### CI/CD関連機能
- ✅ ワークフロー変更履歴の可視化
- ✅ CI/CD設定の変更者追跡
- ✅ ブレームビュー（誰がいつ変更したか）
- ✅ コミットグラフでのCI実行状況

#### インストール
```bash
code --install-extension eamodio.gitlens
```

#### 使用例

**1. ワークフロー変更履歴**
```
.github/workflows/rust.yml を開く
→ GitLens: File History タブ
→ dd815ed: feat(ci): enable self-hosted runners
   by Claude <noreply@anthropic.com>
   2025-10-22 16:30
```

**2. インラインブレーム**
```yaml
# feat(ci): enable self-hosted runners | Claude | 2 hours ago
runs-on: [self-hosted, macOS, arm64, miyabi-light]
```

**3. コミットグラフ**
```
GitLens: Commits タブ
└── dd815ed ✅ (CI passed)
    ├── rust.yml: check ✅
    ├── rust.yml: test ✅
    └── security-audit.yml ✅
```

---

### 5. **Remote - SSH** ⭐⭐⭐⭐⭐

**ID**: `ms-vscode-remote.remote-ssh`
**提供元**: Microsoft

#### Self-hosted Runner管理での用途
- ✅ Mac mini 2への直接接続
- ✅ リモートファイル編集
- ✅ リモートターミナル
- ✅ Runnerログのリアルタイム確認

#### インストール
```bash
code --install-extension ms-vscode-remote.remote-ssh
```

#### 使用方法

**1. Mac mini 2に接続**
```
Cmd+Shift+P → "Remote-SSH: Connect to Host"
→ macmini2 (192.168.3.26) または mini2@100.88.201.67
```

**2. Runnerログ確認**
```
VS Code (Mac mini 2) で開く:
/Users/mini2/actions-runner/_diag/Runner_*.log
```

**3. Runner管理**
```bash
# VS Code内ターミナルで実行
cd ~/actions-runner
./svc.sh status
tail -f _diag/Runner_*.log
```

---

### 6. **REST Client** ⭐⭐⭐⭐

**ID**: `humao.rest-client`
**提供元**: Huachao Mao

#### GitHub API統合での用途
- ✅ Runner API呼び出し
- ✅ ワークフロー実行API
- ✅ シークレット管理API
- ✅ アーティファクトダウンロード

#### インストール
```bash
code --install-extension humao.rest-client
```

#### 使用例

`.http` ファイルを作成：

```http
### GitHub API: Runner一覧取得
GET https://api.github.com/orgs/customer-cloud/actions/runners
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}

### Runner詳細取得
GET https://api.github.com/orgs/customer-cloud/actions/runners/{{runner_id}}
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}

### ワークフロー手動実行
POST https://api.github.com/repos/customer-cloud/miyabi-private/actions/workflows/rust.yml/dispatches
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}
Content-Type: application/json

{
  "ref": "main",
  "inputs": {}
}

### Runnerを削除（注意）
DELETE https://api.github.com/orgs/customer-cloud/actions/runners/{{runner_id}}
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}

### ワークフロー実行一覧
GET https://api.github.com/repos/customer-cloud/miyabi-private/actions/runs?per_page=10
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}

### 特定のワークフロー実行詳細
GET https://api.github.com/repos/customer-cloud/miyabi-private/actions/runs/{{run_id}}
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}

### ワークフロー実行を再実行
POST https://api.github.com/repos/customer-cloud/miyabi-private/actions/runs/{{run_id}}/rerun
Authorization: Bearer {{$dotenv GITHUB_TOKEN}}
```

**`.env` ファイルで環境変数設定**:
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

---

## 🔧 便利な拡張機能（5個）

### 7. **Error Lens** ⭐⭐⭐⭐

**ID**: `usernamehw.errorlens`

#### 機能
- ✅ YAML構文エラーをインライン表示
- ✅ リアルタイムエラー検出
- ✅ 警告の可視化

#### 使用例
```yaml
jobs:
  build:
    runs-on: ubuntu-latest  # ← Error Lens: "Consider using self-hosted runner"
```

---

### 8. **Todo Tree** ⭐⭐⭐⭐

**ID**: `gruntfuggly.todo-tree`

#### CI/CD関連での用途
```yaml
# TODO: Migrate to self-hosted runner
# FIXME: Cache configuration needs optimization
# NOTE: This workflow runs on miyabi-light
```

---

### 9. **Project Manager** ⭐⭐⭐⭐

**ID**: `alefragnani.project-manager`

#### 機能
- ✅ 複数プロジェクト管理
- ✅ ワンクリックでプロジェクト切り替え
- ✅ SSH接続先もプロジェクトとして登録可能

---

### 10. **Better Comments** ⭐⭐⭐⭐

**ID**: `aaron-bond.better-comments`

#### YAML内コメント強調
```yaml
# ! 重要: このジョブは miyabi-heavy で実行
# ? 疑問: ubuntu-latest と比較してパフォーマンス向上？
# TODO: キャッシュ戦略を最適化
# * 注意: API rate limitに注意
```

---

### 11. **GitHub Copilot** ⭐⭐⭐⭐⭐

**ID**: `github.copilot`

#### ワークフロー作成での活用
```yaml
# Copilotにコメントで指示
# Create a job that runs on self-hosted macOS runner with sccache

jobs:
  # Copilotが自動生成:
  build:
    runs-on: [self-hosted, macOS, arm64, miyabi-light]
    steps:
      - uses: actions/checkout@v4
      - name: Setup sccache
        uses: ./.github/actions/setup-sccache
```

---

## ⚙️ VS Code設定ファイル (settings.json)

```json
{
  // GitHub Actions拡張機能
  "github-actions.workflows.pinned.workflows": [
    ".github/workflows/rust.yml",
    ".github/workflows/security-audit.yml",
    ".github/workflows/integrated-system-ci.yml"
  ],
  "github-actions.workflows.pinned.refresh.enabled": true,
  "github-actions.workflows.pinned.refresh.interval": 60,

  // YAML設定
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  },
  "yaml.format.enable": true,
  "yaml.validate": true,
  "yaml.hover": true,
  "yaml.completion": true,

  // ファイル関連付け
  "files.associations": {
    "*.yml": "yaml",
    "*.yaml": "yaml"
  },

  // GitLens設定
  "gitlens.codeLens.enabled": true,
  "gitlens.currentLine.enabled": true,
  "gitlens.hovers.currentLine.over": "line",

  // Error Lens設定
  "errorLens.enabled": true,
  "errorLens.enabledDiagnosticLevels": [
    "error",
    "warning"
  ],

  // Remote SSH設定
  "remote.SSH.remotePlatform": {
    "macmini2": "macos",
    "100.88.201.67": "macos"
  },

  // 自動保存
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

## 🎯 ワークフロー別の推奨設定

### Rust CI/CD開発
```json
{
  "rust-analyzer.checkOnSave.command": "clippy",
  "rust-analyzer.cargo.allFeatures": true,
  "github-actions.workflows.pinned.workflows": [
    ".github/workflows/rust.yml"
  ]
}
```

### Self-hosted Runner管理
```json
{
  "remote.SSH.configFile": "~/.ssh/config",
  "remote.SSH.showLoginTerminal": true,
  "github-actions.workflows.pinned.refresh.interval": 30
}
```

---

## 🚀 実践ワークフロー

### 1. 新しいワークフローを作成

```bash
# 1. GitHub Actions拡張機能を開く
Cmd+Shift+P → "GitHub Actions: Create Workflow"

# 2. テンプレート選択
→ "Rust CI/CD" または "Blank Workflow"

# 3. YAML編集（自動補完が効く）
runs-on: [self-hosted, macOS, arm64, miyabi-light]
```

### 2. ワークフロー実行確認

```bash
# 1. Push後、GitHub Actionsタブを開く
# 2. 実行中のワークフローをクリック
# 3. リアルタイムでログ閲覧
# 4. 失敗時は "Re-run Jobs" でリトライ
```

### 3. Self-hosted Runnerステータス確認

```bash
# 1. REST Clientで確認
# .http ファイルを開く
# 2. "GET runners" を実行
# 3. miyabi-runner-macmini1, miyabi-runner-macmini2 の状態確認
```

### 4. Mac mini 2でRunner管理

```bash
# 1. Remote SSH接続
Cmd+Shift+P → "Remote-SSH: Connect to Host" → macmini2

# 2. ターミナルを開く
Cmd+J

# 3. Runner管理
cd ~/actions-runner
./svc.sh status
tail -f _diag/Runner_*.log
```

---

## 📊 拡張機能の優先度

| 優先度 | 拡張機能 | 用途 | 必須度 |
|--------|---------|------|--------|
| **⭐⭐⭐⭐⭐** | GitHub Actions | ワークフロー管理 | 必須 |
| **⭐⭐⭐⭐⭐** | YAML | 構文チェック | 必須 |
| **⭐⭐⭐⭐⭐** | GitHub PR/Issues | CI統合 | 必須 |
| **⭐⭐⭐⭐** | GitLens | 履歴管理 | 推奨 |
| **⭐⭐⭐⭐** | Remote SSH | Runner管理 | 推奨 |
| **⭐⭐⭐** | REST Client | API操作 | オプション |
| **⭐⭐⭐** | Error Lens | エラー可視化 | オプション |

---

## 🔗 関連リソース

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [Self-hosted Runners ガイド](./SELF_HOSTED_RUNNER_SETUP.md)
- [VS Code公式ドキュメント](https://code.visualstudio.com/docs)
- [GitHub API リファレンス](https://docs.github.com/en/rest)

---

## 🆘 トラブルシューティング

### GitHub Actions拡張機能が動作しない

**解決策**:
```bash
# 1. GitHub CLIでログイン確認
gh auth status

# 2. 再ログイン
gh auth login

# 3. VS Codeリロード
Cmd+Shift+P → "Developer: Reload Window"
```

### YAML補完が効かない

**解決策**:
```json
// settings.jsonに追加
{
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  }
}
```

### Remote SSH接続失敗

**解決策**:
```bash
# 1. SSH設定確認
cat ~/.ssh/config

# 2. 手動接続テスト
ssh macmini2

# 3. VS Codeの設定
Cmd+, → "Remote SSH" → "Show Login Terminal" を有効化
```

---

**作成日**: 2025-10-22
**作成者**: Claude Code (AI Assistant)
