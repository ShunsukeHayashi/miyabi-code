# Lark Agent トラブルシューティングガイド

**Version**: 1.0.0
**Last Updated**: 2025-10-28

## 📑 目次

- [環境設定エラー](#環境設定エラー)
- [MCP統合エラー](#mcp統合エラー)
- [コマンド実行エラー](#コマンド実行エラー)
- [REPL関連エラー](#repl関連エラー)
- [デバッグ方法](#デバッグ方法)
- [FAQ](#faq)

---

## 環境設定エラー

### エラー: LARK_APP_ID not set

**症状**:
```
Error: Invalid input: LARK_APP_ID environment variable not set
Set it with: export LARK_APP_ID=cli_xxx
```

**原因**: Lark App認証情報が環境変数に設定されていない

**解決方法**:
```bash
# Lark App認証情報を設定
export LARK_APP_ID="cli_xxxxxxxxx"
export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"

# 永続化する場合 (~/.bashrc または ~/.zshrc)
echo 'export LARK_APP_ID="cli_xxxxxxxxx"' >> ~/.bashrc
echo 'export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"' >> ~/.bashrc
source ~/.bashrc
```

**確認**:
```bash
echo $LARK_APP_ID
echo $LARK_APP_SECRET
```

---

### エラー: LARK_APP_SECRET not set

**症状**:
```
Error: Invalid input: LARK_APP_SECRET environment variable not set
Set it with: export LARK_APP_SECRET=xxx
```

**原因**: App Secretが設定されていない

**解決方法**:
```bash
export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"
```

---

## MCP統合エラー

### エラー: MCP server timed out after 30s

**症状**:
```
Error: MCP timeout: MCP server timed out after 30s
Tool: wiki_v2_spaceNode_create
This may indicate a network issue or the MCP server is stuck.
```

**原因**:
1. ネットワーク接続の問題
2. MCPサーバーの応答遅延
3. Lark APIの応答遅延

**解決方法**:

1. **ネットワーク確認**:
```bash
# インターネット接続確認
ping -c 3 open.larksuite.com
```

2. **MCPサーバーパス確認**:
```bash
# デフォルトパス確認
ls -la mcp-servers/lark-openapi-mcp-enhanced/dist/cli.js

# カスタムパス設定
export MCP_SERVER_PATH="/path/to/lark-openapi-mcp-enhanced/dist/cli.js"
```

3. **再試行**:
```bash
# タイムアウト後に再実行
miyabi lark wiki-create \
  --space-id <ID> \
  --parent-node-token <TOKEN> \
  "Test Document"
```

---

### エラー: MCP server exited with error

**症状**:
```
Error: MCP server error: MCP server exited with error (code: 1)
Tool: wiki_v2_spaceNode_create
stderr: Error: Cannot find module 'xxx'
```

**原因**: MCPサーバーの依存関係が不足

**解決方法**:
```bash
cd mcp-servers/lark-openapi-mcp-enhanced
npm install
npm run build

# ビルド確認
ls dist/cli.js
```

---

### エラー: Failed to spawn MCP server

**症状**:
```
Error: MCP server error: Failed to spawn MCP server
Path: ".../dist/cli.js"
Error: No such file or directory
```

**原因**: MCPサーバーのビルド未完了

**解決方法**:
```bash
# MCPサーバーのビルド
cd mcp-servers/lark-openapi-mcp-enhanced
npm install
npm run build

# 確認
node dist/cli.js --version
```

---

### エラー: MCP tool returned error

**症状**:
```
Error: MCP tool error: MCP tool 'wiki_v2_spaceNode_create' returned error
Code: -32603
Message: Invalid space_id
Data: {...}
```

**原因**: APIパラメータの誤り

**解決方法**:

1. **Space ID確認**:
```bash
# 環境変数確認
echo $WIKI_SPACE_ID

# 正しいSpace IDを設定
export WIKI_SPACE_ID="7324483648537755682"
```

2. **Parent Node Token確認**:
```bash
# Root Node Tokenを設定
export ROOT_NODE_TOKEN="K7xUwSKH0i3fPekyD9ojSsCLpna"
```

3. **再実行**:
```bash
miyabi lark wiki-create \
  --space-id $WIKI_SPACE_ID \
  --parent-node-token $ROOT_NODE_TOKEN \
  "Test Document"
```

---

## コマンド実行エラー

### エラー: Invalid command

**症状**:
```
Error: Invalid input: Invalid command: C99. Valid commands: C1-C10, ALL
```

**原因**: 存在しないコマンドを指定

**解決方法**:
```bash
# 正しいコマンド
miyabi lark base C1
miyabi lark base C7
miyabi lark base ALL

# ヘルプ確認
miyabi lark base --help
```

---

### エラー: Not in a git repository

**症状**:
```
Error: Not in a git repository
```

**原因**: Gitリポジトリ外で実行

**解決方法**:
```bash
# プロジェクトルートに移動
cd /path/to/miyabi-private

# または Gitリポジトリ初期化
git init
```

---

## REPL関連エラー

### エラー: Failed to initialize REPL editor

**症状**:
```
Error: Execution error: Failed to initialize REPL editor: ...
```

**原因**: rustylineの初期化失敗

**解決方法**:
```bash
# ターミナル環境変数確認
echo $TERM

# 標準的な値に設定
export TERM=xterm-256color
```

---

### エラー: Context files not found

**症状**:
```
📚 Loading Lark Agent context...
Error: Execution error: Failed to read spec file: No such file or directory
```

**原因**: `.claude/agents/`ディレクトリ構造が不完全

**解決方法**:
```bash
# プロジェクトルートから実行
cd /path/to/miyabi-private
miyabi lark agent

# ファイル存在確認
ls -la .claude/agents/specs/lark/lark-agent.md
ls -la .claude/agents/prompts/lark/lark-agent-prompt.md
ls -la .claude/agents/lark/base-construction-framework.md
```

---

### エラー: Failed to get home directory

**症状**:
```
Error: Execution error: Failed to get home directory
```

**原因**: HOME環境変数が未設定

**解決方法**:
```bash
# HOME確認
echo $HOME

# 設定
export HOME="/Users/your-username"
```

---

## デバッグ方法

### Verbose Mode

```bash
# 詳細ログ出力
miyabi --verbose lark base C1

# 全ての実行内容を確認
miyabi --verbose --json lark wiki-create \
  --space-id <ID> \
  --parent-node-token <TOKEN> \
  "Test"
```

### JSON Output

```bash
# JSON形式で出力（スクリプト処理に便利）
miyabi --json lark base C1

# jqでフィルタリング
miyabi --json lark base C1 | jq '.status'
```

### ログファイル確認

```bash
# CLIログ
tail -f ~/.miyabi/logs/cli.log

# MCPサーバーログ
tail -f mcp-servers/lark-openapi-mcp-enhanced/logs/server.log
```

### ネットワークデバッグ

```bash
# Lark API疎通確認
curl -X GET "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_id\": \"$LARK_APP_ID\",
    \"app_secret\": \"$LARK_APP_SECRET\"
  }"
```

---

## FAQ

### Q1: REPL履歴はどこに保存される?

**A**: `~/.miyabi_lark_history`に保存されます。

```bash
# 履歴確認
cat ~/.miyabi_lark_history

# 履歴削除
rm ~/.miyabi_lark_history
```

---

### Q2: C1-C10を途中からやり直せる?

**A**: 可能です。任意のコマンドから再実行できます。

```bash
# C5から再開
miyabi lark base C5
miyabi lark base C6
...
```

---

### Q3: MCPサーバーの動作確認方法は?

**A**: 直接MCPサーバーを起動してテスト可能です。

```bash
cd mcp-servers/lark-openapi-mcp-enhanced

# MCPサーバー起動
node dist/cli.js mcp \
  --mode stdio \
  --app-id $LARK_APP_ID \
  --app-secret $LARK_APP_SECRET

# JSONRPC request送信 (別ターミナル)
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  node dist/cli.js mcp --mode stdio \
    --app-id $LARK_APP_ID \
    --app-secret $LARK_APP_SECRET
```

---

### Q4: タイムアウトを変更できる?

**A**: 現在30秒固定ですが、将来的にオプションで変更可能にする予定です。

```bash
# 将来的な実装予定
miyabi lark wiki-create \
  --timeout 60 \
  --space-id <ID> \
  --parent-node-token <TOKEN> \
  "Test"
```

---

### Q5: 複数のLark Appを使い分けたい

**A**: 環境変数を動的に切り替えてください。

```bash
# App 1
export LARK_APP_ID="cli_app1_xxx"
export LARK_APP_SECRET="secret1_xxx"
miyabi lark wiki-create ...

# App 2
export LARK_APP_ID="cli_app2_xxx"
export LARK_APP_SECRET="secret2_xxx"
miyabi lark wiki-create ...

# または.envファイルで管理
source .env.app1
miyabi lark wiki-create ...

source .env.app2
miyabi lark wiki-create ...
```

---

### Q6: REPLで日本語入力できない

**A**: ターミナルの文字コード設定を確認してください。

```bash
# 文字コード確認
locale

# UTF-8に設定
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
```

---

### Q7: エラーメッセージが英語で表示される

**A**: エラーメッセージは英語で統一されています。日本語コンテキストは出力に含まれます。

---

### Q8: MCPサーバーのレート制限に引っかかる

**A**: `--disable-rate-limit`オプションが自動で付与されますが、Lark API側の制限があります。

```bash
# 実行間隔を空ける
miyabi lark wiki-create ... && sleep 2 && miyabi lark wiki-create ...

# または一括実行を避ける
```

---

## サポート

### Issue報告

問題が解決しない場合は、GitHubでIssueを作成してください:

```bash
gh issue create \
  --title "Lark Agent: <問題の概要>" \
  --body "
## 症状
<エラーメッセージや症状>

## 環境
- OS: macOS / Linux / Windows
- Rust version: $(rustc --version)
- miyabi version: $(miyabi --version)

## 再現手順
1. ...
2. ...

## 期待する動作
...

## 実際の動作
...
"
```

---

## 参考リンク

- [Lark Agent CLI Guide](./LARK_AGENT_CLI_GUIDE.md)
- [Lark Agent README](.claude/agents/lark/README.md)
- [Lark Open Platform Documentation](https://open.larksuite.com/)
- [Issue #606](https://github.com/customer-cloud/miyabi-private/issues/606)

---

**🤖 Generated with Claude Code**
**Version**: 1.0.0
