# Vercel MCP Server Setup for Miyabi Desktop

## 概要

Vercel公式のModel Context Protocol (MCP) サーバーをセットアップしました。これにより、Claude CodeからVercelプロジェクトの管理、デプロイ、ドキュメント検索などが可能になります。

---

## セットアップ完了内容

### 1. Vercel MCP Server追加

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

**ステータス**: ✅ 追加完了 (認証待ち)

**設定ファイル**: `/Users/shunsuke/.claude.json`

---

## 利用可能なツール

Vercel MCPサーバーは以下のツールを提供します：

### 📚 Documentation Tools
- **search_documentation** - Vercelドキュメント検索

### 📦 Project Management
- **list_teams** - チーム一覧表示
- **list_projects** - プロジェクト一覧表示
- **get_project** - プロジェクト詳細取得

### 🚀 Deployment Operations
- **list_deployments** - デプロイ履歴表示
- **get_deployment** - デプロイ詳細取得
- **get_deployment_build_logs** - ビルドログ取得
- **deploy_to_vercel** - プロジェクトデプロイ

### 🌐 Domain Management
- **check_domain_availability_and_price** - ドメイン可用性確認
- **buy_domain** - ドメイン購入

### 🔧 Access & Utility Tools
- **get_access_to_vercel_url** - 保護されたデプロイの共有リンク作成
- **web_fetch_vercel_url** - Vercel URLからコンテンツ取得
- **use_vercel_cli** - Vercel CLIコマンド実行

---

## 認証手順

### Claude Codeで認証

1. Claude Codeセッション内でMCPコマンドを実行:
   ```
   /mcp
   ```

2. ブラウザでVercel OAuth認証フローが開く

3. Vercelアカウントでログイン

4. アクセス許可を承認

5. Claude Codeに戻り、認証完了を確認

### 認証確認

```bash
claude mcp list
```

**期待される出力**:
```
vercel: https://mcp.vercel.com (HTTP) - ✅ Connected
```

---

## Miyabi Desktopでの活用例

### 1. プロジェクトデプロイ

Miyabi DesktopをVercelにデプロイ:

```
Could you deploy the Miyabi Desktop project to Vercel?
```

**使用されるツール**:
- `list_teams` - チーム確認
- `list_projects` - 既存プロジェクト確認
- `deploy_to_vercel` - デプロイ実行

### 2. デプロイログ確認

最新デプロイのビルドログを確認:

```
Show me the build logs for the latest deployment
```

**使用されるツール**:
- `list_deployments` - デプロイ履歴取得
- `get_deployment_build_logs` - ビルドログ取得

### 3. Vercelドキュメント検索

Tauri + Vercelのベストプラクティスを検索:

```
Search Vercel docs for Tauri deployment best practices
```

**使用されるツール**:
- `search_documentation` - ドキュメント検索

### 4. プロジェクト詳細確認

Miyabi Desktopプロジェクトの設定確認:

```
Get the configuration details for miyabi-desktop project
```

**使用されるツール**:
- `list_projects` - プロジェクト一覧
- `get_project` - プロジェクト詳細

---

## プロジェクト固有アクセス

より詳細な制御のために、プロジェクト固有のMCPエンドポイントを使用可能:

```bash
claude mcp add --transport http vercel-miyabi https://mcp.vercel.com/<teamSlug>/miyabi-desktop
```

**Slug確認方法**:

### Vercel Dashboard
1. プロジェクトを開く
2. Settings → General
3. "Team Slug" と "Project Slug" を確認

### Vercel CLI
```bash
vercel projects ls
```

---

## セキュリティベストプラクティス

### 1. 人間による確認を有効化

自動化ワークフローでは、ツール実行前に確認を求める:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "requireConfirmation": true
    }
  }
}
```

### 2. 公式エンドポイントのみ使用

- ✅ `https://mcp.vercel.com`
- ❌ 他のサードパーティMCPサーバー

### 3. 権限レビュー

OAuth認証時に要求される権限を確認:
- プロジェクトアクセス
- デプロイ権限
- ドメイン管理

### 4. Prompt Injection対策

外部入力を使用する際は、プロンプトインジェクションに注意:
- ユーザー入力のサニタイズ
- 信頼できるソースのみ使用

---

## トラブルシューティング

### 問題 1: 認証が失敗する

**症状**:
```
vercel: https://mcp.vercel.com (HTTP) - ⚠ Needs authentication
```

**解決方法**:
1. `/mcp` コマンドで認証フローを開始
2. ブラウザでVercelにログイン
3. アクセス許可を承認

### 問題 2: ツールが利用できない

**症状**:
```
Tool 'deploy_to_vercel' not found
```

**解決方法**:
1. MCPサーバーの接続を確認: `claude mcp list`
2. 認証が完了しているか確認
3. Claude Codeを再起動

### 問題 3: デプロイが失敗する

**症状**:
```
Deployment failed with exit code 1
```

**解決方法**:
1. ビルドログを確認: `get_deployment_build_logs`
2. `vercel.json` の設定を確認
3. 環境変数が正しく設定されているか確認

---

## 次のステップ

### 1. 認証完了

```
/mcp
```

### 2. プロジェクト一覧確認

```
List all my Vercel projects
```

### 3. Miyabi Desktop デプロイ

```
Deploy the Miyabi Desktop project to Vercel
```

### 4. デプロイ確認

```
Show me the deployment URL and status
```

---

## 関連リンク

- **Vercel MCP Documentation**: https://vercel.com/docs/mcp
- **Vercel MCP Tools**: https://vercel.com/docs/mcp/vercel-mcp/tools
- **MCP Handler (GitHub)**: https://github.com/vercel/mcp-handler
- **MCP Specification**: https://modelcontextprotocol.io/

---

## 統合ワークフロー例

### ワークフロー: CI/CD自動化

1. **コード変更をコミット**
   ```bash
   git add .
   git commit -m "feat: add real-time log streaming"
   git push origin main
   ```

2. **Claude CodeでVercel MCP経由でデプロイ**
   ```
   Deploy the latest commit to Vercel production
   ```

3. **デプロイ確認とログチェック**
   ```
   Check the deployment status and show build logs
   ```

4. **エラーがあれば自動修正**
   ```
   If there are any build errors, suggest fixes based on the logs
   ```

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
**Status**: ✅ Setup Complete (Pending Authentication)
