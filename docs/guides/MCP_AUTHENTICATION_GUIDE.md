# MCP (Model Context Protocol) を使ったGitHub認証ガイド

## 概要

Miyabiプロジェクトには、`github-enhanced` MCPサーバーが既に設定されています。
これを使うことで、`gh` CLIや直接的なトークン管理なしでGitHub APIを利用できます。

## MCPサーバーの構成

プロジェクトには以下のMCPサーバーが設定されています：

### 1. github-enhanced
- **ファイル**: `.claude/mcp-servers/github-enhanced.cjs`
- **機能**: GitHub Issue/PR管理の拡張操作
- **必要な環境変数**:
  - `GITHUB_TOKEN` - GitHubパーソナルアクセストークン
  - `REPOSITORY` - リポジトリ名（`owner/repo`形式）

### 2. miyabi-integration  
- **ファイル**: `.claude/mcp-servers/miyabi-integration.js`
- **機能**: Miyabi CLI統合
- **自動でGITHUB_TOKENを使用**

## 方法1: 環境変数を使う（推奨）

### ステップ1: トークンを環境変数に設定

```bash
# 一時的に設定（現在のセッションのみ）
export GITHUB_TOKEN=ghp_your_token_here
export REPOSITORY=ShunsukeHayashi/miyabi-private

# 永続的に設定（.zshrcに追加）
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
echo 'export REPOSITORY=ShunsukeHayashi/miyabi-private' >> ~/.zshrc
source ~/.zshrc
```

### ステップ2: MCPサーバーを起動

Claude Codeが起動すると、自動的にMCPサーバーが起動します。
`.claude/mcp-servers/`内のスクリプトが環境変数`GITHUB_TOKEN`を参照します。

## 方法2: .env.localファイルを使う（セキュア）

### ステップ1: .env.localファイルを作成

```bash
cat > .env.local << 'ENVEOF'
export GITHUB_TOKEN=ghp_your_token_here
export REPOSITORY=ShunsukeHayashi/miyabi-private
ENVEOF

# 権限を制限（重要）
chmod 600 .env.local
```

### ステップ2: シェル起動時に読み込む

```bash
# .zshrcに追加
echo 'source /Users/a003/dev/miyabi-private/.env.local' >> ~/.zshrc
source ~/.zshrc
```

## 方法3: mcp.jsonで直接指定（非推奨）

**⚠️ セキュリティ注意**: この方法はトークンがファイルに平文で保存されます。

```json
{
  "mcpServers": {
    "github-enhanced": {
      "command": "node",
      "args": [".claude/mcp-servers/github-enhanced.cjs"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "REPOSITORY": "ShunsukeHayashi/miyabi-private"
      }
    }
  }
}
```

## MCP Tools の使用例

MCPサーバーが起動すると、以下のツールが利用可能になります：

### 1. create_issue_with_labels
ラベルを自動付与してIssueを作成

```javascript
{
  "title": "新機能: ダークモード対応",
  "body": "ダークモードの実装を行います",
  "autoLabel": true
}
```

### 2. get_agent_tasks
Agent実行可能なIssue一覧を取得

```javascript
{
  "state": "open"
}
```

### 3. update_issue_progress
Issue進捗を更新

```javascript
{
  "issueNumber": 123,
  "progress": {
    "completed": 5,
    "total": 10,
    "currentTask": "コンポーネント実装中",
    "status": "in_progress"
  }
}
```

### 4. create_pr_from_agent
Agent生成のPRを作成

```javascript
{
  "issueNumber": 123,
  "branch": "feature/dark-mode",
  "title": "feat: ダークモード実装",
  "body": "## 概要\nダークモードを実装しました",
  "draft": true
}
```

### 5. get_pr_review_status
PRレビュー状態を取得

```javascript
{
  "prNumber": 45
}
```

## Miyabi CLIとMCPの統合

### miyabi.shスクリプト（方法1）

`gh` CLIからトークンを取得して実行：

```bash
./miyabi.sh status
./miyabi.sh agent run coordinator --issue 123
```

### miyabi-direct.shスクリプト（方法2）

環境変数から直接トークンを使用：

```bash
export GITHUB_TOKEN=ghp_your_token_here
./miyabi-direct.sh status
./miyabi-direct.sh agent run coordinator --issue 123
```

### MCPツール経由（方法3・最も柔軟）

Claude Codeのセッション内でMCPツールを直接呼び出し：

```
create_issue_with_labels({
  title: "テストIssue",
  body: "MCPツールのテストです",
  autoLabel: true
})
```

## トラブルシューティング

### MCPサーバーが起動しない

1. 環境変数が設定されているか確認
   ```bash
   echo $GITHUB_TOKEN
   echo $REPOSITORY
   ```

2. Node.jsがインストールされているか確認
   ```bash
   node --version
   ```

3. MCPサーバーのログを確認
   ```bash
   node .claude/mcp-servers/github-enhanced.cjs
   ```

### 「GITHUB_TOKEN environment variable is required」エラー

環境変数が設定されていません。方法1または方法2で設定してください。

### 「REPOSITORY environment variable must be in format "owner/repo"」エラー

REPOSITORYの形式が正しくありません：

```bash
# 正しい形式
export REPOSITORY=ShunsukeHayashi/miyabi-private

# 間違った形式
export REPOSITORY=miyabi-private  # ❌
export REPOSITORY=https://github.com/ShunsukeHayashi/miyabi-private  # ❌
```

## セキュリティベストプラクティス

1. ✅ トークンは`.env.local`に保存（権限600）
2. ✅ `.gitignore`に`.env.local`を追加済み
3. ✅ 定期的にトークンを更新（90日推奨）
4. ✅ 最小限のスコープのみ付与
5. ❌ トークンをGitにコミットしない
6. ❌ トークンを平文でmcp.jsonに書かない

## 推奨される運用方法

**開発環境**:
- `.env.local`ファイルを使用
- 各開発者が独自のトークンを管理

**CI/CD環境**:
- GitHubリポジトリのSecretsに保存
- Actions内で`${{ secrets.GITHUB_TOKEN }}`を使用

**ローカルテスト**:
- `gh` CLIで認証
- `./miyabi.sh`スクリプトを使用

## 次のステップ

1. トークンを設定
2. Claude Codeを起動
3. MCPツールが利用可能か確認
4. `create_issue_with_labels`で テストIssueを作成

詳細は[QUICKSTART-JA.md](QUICKSTART-JA.md)を参照してください。
