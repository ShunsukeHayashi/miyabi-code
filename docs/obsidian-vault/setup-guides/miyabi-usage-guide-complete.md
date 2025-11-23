---
title: "Miyabi Society - 完全使用ガイド"
created: 2025-11-18
updated: 2025-11-18
author: "Claude Code"
category: "setup-guides"
tags: ["miyabi", "usage", "guide", "japanese", "tutorial"]
status: "published"
language: "ja"
---

# Miyabi Society - 完全使用ガイド

## 📋 概要

このガイドでは、Miyabi自律型開発プラットフォームの全機能の使い方を日本語で詳しく説明します。

**最終更新**: 2025-11-18
**バージョン**: 1.0.0
**対象ユーザー**: 開発者、プロジェクトマネージャー、AIエンジニア

---

## 🎯 Miyabi Societyとは

Miyabi Societyは、AI駆動の自律型開発プラットフォームです。以下の機能を提供します：

1. **tmuxセッション管理** - リモート開発環境の制御
2. **Miyabiルールエンジン** - エージェント検証・ワークフロー実行
3. **Claude Desktop連携** - MCPプロトコル経由のシームレスな統合
4. **ChatGPT連携** - Custom GPT経由のAPI操作
5. **Obsidian統合** - ナレッジベース自動生成

---

## 🌐 公開URL一覧

### フロントエンド - Miyabi Console

**AWS S3デプロイ版（公開）**
```
http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com
```

- **アクセス**: 誰でもアクセス可能（認証不要）
- **用途**: プロジェクト状況の確認、ダッシュボード表示
- **技術**: React + Vite + TailwindCSS

### バックエンド - Miyabi SSE Gateway

**Tailscale経由（プライベート）**
```
http://100.112.127.63:3003
```

- **アクセス**: Tailscale VPN接続が必要
- **認証**: API Key（SSE） / Bearer Token（POST API）
- **用途**: Claude Desktop、ChatGPT Custom GPTとの連携

**ローカルネットワーク（プライベート）**
```
http://192.168.3.30:3003
```

- **アクセス**: 同一ローカルネットワーク内のみ
- **用途**: 開発・テスト環境

---

## 🔑 認証情報

### API Key（Claude Desktop用）
```
87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059
```

**使用場所**:
- SSE tmuxエンドポイント（`/sse/tmux`）
- SSE rulesエンドポイント（`/sse/rules`）

**使用方法**:
```bash
curl -H "x-api-key: 87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059" \
  http://100.112.127.63:3003/sse/tmux
```

### Bearer Token（ChatGPT Custom GPT用）
```
c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

**使用場所**:
- POST tmuxエンドポイント（`/mcp/tmux`）
- POST rulesエンドポイント（`/mcp/rules`）

**使用方法**:
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{"command":"tmux list-sessions"}' \
  http://100.112.127.63:3003/mcp/tmux
```

---

## 📱 使い方1: Claude Desktopから使う

### ステップ1: 設定ファイルの編集

**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### ステップ2: 設定内容

以下を`claude_desktop_config.json`に追記：

```json
{
  "mcpServers": {
    "miyabi-society-remote": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-everything"
      ],
      "env": {
        "MCP_TRANSPORT": "sse",
        "SSE_ENDPOINT": "http://100.112.127.63:3003/sse/tmux",
        "MIYABI_API_KEY": "87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059"
      }
    }
  }
}
```

### ステップ3: Claude Desktopの再起動

1. Claude Desktopを完全に終了
2. 再度起動
3. 新しい会話を開始
4. 🔌アイコンでMCPサーバーの接続を確認

### ステップ4: 使用例

**tmuxセッション一覧を取得**
```
Claudeに質問: "現在のtmuxセッションを教えてください"
```

**新しいセッションを作成**
```
Claudeに質問: "miyabi-devという名前で新しいtmuxセッションを作成してください"
```

**ウィンドウを分割**
```
Claudeに質問: "現在のウィンドウを水平に分割してください"
```

---

## 🤖 使い方2: ChatGPT Custom GPTから使う

### ステップ1: Custom GPTの作成

1. https://chat.openai.com にアクセス
2. 左サイドバー「Explore GPTs」をクリック
3. 右上「Create」ボタンをクリック

### ステップ2: 基本情報の入力

**Name（名前）**:
```
Miyabi Society AI
```

**Description（説明）**:
```
Miyabi自律型開発プラットフォーム - tmux操作・ルール管理・Obsidian連携対応AI
```

### ステップ3: Instructionsの設定

詳細は別ドキュメント参照：
→ [[chatgpt-miyabi-setup-guide]]

### ステップ4: Actionsの追加

1. 「Configure」タブをクリック
2. 「Add actions」をクリック
3. 「Create new action」を選択
4. Authentication Typeで「Bearer」を選択
5. Bearer Tokenに以下を入力：
```
c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

6. OpenAPIスキーマを入力（[[chatgpt-miyabi-setup-guide]]参照）

### ステップ5: 使用例

**システム状態確認**
```
プロンプト: システムの状態を確認して
```

**tmuxセッション操作**
```
プロンプト: 現在のtmuxセッションを全部教えて
```

**Obsidianノート作成**
```
プロンプト: 今日の開発ログをObsidian形式で作成して。
以下を含めて：
- 実装した機能
- 遭遇した問題
- 次のステップ
```

---

## 🔧 使い方3: APIを直接使う

### エンドポイント一覧

#### 1. ヘルスチェック（認証不要）

**リクエスト**:
```bash
GET http://100.112.127.63:3003/health
```

**レスポンス例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:26:53.736Z",
  "uptime": 31.07555225,
  "memory": {
    "rss": 88260608,
    "heapTotal": 13189120,
    "heapUsed": 11383096,
    "external": 2735144,
    "arrayBuffers": 33283
  }
}
```

#### 2. OpenAPIスペック取得（認証不要、Rate Limit適用）

**リクエスト**:
```bash
GET http://100.112.127.63:3003/openapi.yaml
```

**用途**: API仕様の確認、Swaggerエディタでの可視化

#### 3. SSE tmux接続（API Key必須）

**リクエスト**:
```bash
curl -H "x-api-key: 87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059" \
  http://100.112.127.63:3003/sse/tmux
```

**レスポンス形式**:
```
data: {"jsonrpc":"2.0","method":"notification","params":{...}}

event: log
data: MCP server started

event: error
data: Error message here
```

**Keep-Alive**: 30秒ごとに`: keep-alive`が送信されます

#### 4. SSE rules接続（API Key必須）

**リクエスト**:
```bash
curl -H "x-api-key: 87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059" \
  http://100.112.127.63:3003/sse/rules
```

**用途**: Miyabiルールエンジンとのリアルタイム通信

#### 5. POST tmuxコマンド実行（Bearer Token必須）

**リクエスト**:
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "tmux list-sessions",
    "session": "miyabi"
  }' \
  http://100.112.127.63:3003/mcp/tmux
```

**レスポンス例**（現在は実装待ち）:
```json
{
  "message": "Not implemented yet",
  "note": "This endpoint will forward JSON-RPC requests to the tmux MCP server"
}
```

#### 6. POST rulesアクション実行（Bearer Token必須）

**リクエスト**:
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate_agent",
    "parameters": {
      "agent_name": "strategy-planner",
      "validation_level": "strict"
    }
  }' \
  http://100.112.127.63:3003/mcp/rules
```

**アクション種類**:
- `validate_agent` - エージェント検証
- `execute_workflow` - ワークフロー実行
- `check_rules` - ルール適合性チェック
- `list_agents` - エージェント一覧取得

---

## 🛡️ セキュリティ機能

### 1. Rate Limiting（レート制限）

**一般リクエスト**:
- 制限: 100リクエスト / 15分
- 対象: 全エンドポイント（health, openapi.yaml除く）

**SSE接続**:
- 制限: 10接続 / 1分
- 対象: `/sse/tmux`, `/sse/rules`

**API呼び出し**:
- 制限: 30リクエスト / 1分
- 対象: `/mcp/tmux`, `/mcp/rules`

**制限超過時のレスポンス**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "15 minutes"
}
```

### 2. 認証

**API Key認証（SSEエンドポイント）**:
```bash
# ヘッダーに追加
x-api-key: 87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059
```

**Bearer Token認証（POSTエンドポイント）**:
```bash
# ヘッダーに追加
Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

**認証失敗時のレスポンス**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### 3. CORS（オリジン制限）

**許可されているオリジン**:
- `https://chat.openai.com` - ChatGPT
- `https://claude.ai` - Claude
- `http://localhost:5173` - ローカル開発
- `http://100.112.127.63:5173` - Tailscale経由
- `http://192.168.3.30:5173` - ローカルネットワーク

**CORS拒否時のレスポンス**:
```
Error: Not allowed by CORS
```

### 4. 監査ログ

**ログファイルの場所**（MacBook上）:
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-sse-gateway/logs/
├── audit.log     # 全イベント
├── combined.log  # 全ログ
└── error.log     # エラーのみ
```

**ログ形式**:
```json
{
  "level": "info",
  "message": "Request received",
  "timestamp": "2025-11-18T10:26:53.731Z",
  "service": "miyabi-sse-gateway",
  "method": "GET",
  "path": "/health",
  "ip": "::ffff:100.120.173.54",
  "userAgent": "curl/8.17.0",
  "hasAuth": false,
  "query": {}
}
```

---

## 💡 実践例

### 例1: tmuxでリモート開発環境をセットアップ

**目的**: 新しいプロジェクト用のtmux環境を構築

**Claudeへのプロンプト**:
```
以下の構成でtmuxセッションを作成してください：

1. セッション名: "miyabi-dev"
2. ウィンドウ1: "editor" - Neovim起動
3. ウィンドウ2: "server" - 水平2分割
   - 上: npm run dev
   - 下: ログ監視
4. ウィンドウ3: "git" - Git操作用
```

**Claudeの操作**:
1. `tmux new-session -d -s miyabi-dev` でセッション作成
2. `tmux rename-window -t miyabi-dev:0 editor` でウィンドウ名変更
3. `tmux new-window -t miyabi-dev:1 -n server` で新規ウィンドウ
4. `tmux split-window -h -t miyabi-dev:1` でペイン分割
5. 各ペインにコマンド送信

### 例2: ChatGPTでプロジェクトレポート生成

**目的**: 1週間の開発進捗をObsidian形式でまとめる

**ChatGPTへのプロンプト**:
```
今週（11/11-11/18）のMiyabi開発レポートをObsidian形式で作成してください。

以下を含めて：
1. 完了した機能（AWS S3デプロイ、認証実装、セキュリティ強化）
2. 技術的な改善（Rate limiting、Audit logging、CORS）
3. 次週の計画（POST API実装、IP whitelisting、OAuth2）
4. メトリクス（デプロイ時間、テスト成功率など）

カテゴリ: reports
タグ: weekly-report, miyabi, 2025-11
```

**ChatGPTの出力**:
```markdown
---
title: "Miyabi開発週次レポート 2025-11-18"
created: 2025-11-18
category: "reports"
tags: ["weekly-report", "miyabi", "2025-11"]
status: "published"
---

# Miyabi開発週次レポート

## ✅ 完了した機能
...（詳細なレポート）
```

### 例3: エージェント検証ワークフロー

**目的**: Strategy Plannerエージェントの動作確認

**API経由での実行**:
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate_agent",
    "parameters": {
      "agent_name": "strategy-planner",
      "validation_level": "strict",
      "checks": [
        "dependency_check",
        "config_validation",
        "integration_test"
      ]
    }
  }' \
  http://100.112.127.63:3003/mcp/rules
```

---

## 📊 監視とメトリクス

### ヘルスチェックの定期実行

**cron設定例**（5分ごとにチェック）:
```bash
*/5 * * * * curl -s http://100.112.127.63:3003/health | jq '.status' >> /var/log/miyabi-health.log
```

### ログの確認

**リアルタイム監視**:
```bash
# MacBook上で実行
ssh macbook "tail -f /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-sse-gateway/logs/audit.log | jq ."
```

**エラーログの検索**:
```bash
ssh macbook "grep 'level.*error' /Users/shunsuke/Dev/.../logs/combined.log | jq ."
```

**統計情報の取得**:
```bash
# 過去1時間のリクエスト数
ssh macbook "grep 'Request received' /Users/shunsuke/Dev/.../logs/audit.log | tail -1000 | wc -l"
```

---

## 🐛 トラブルシューティング

### Q1: API接続エラー

**エラーメッセージ**:
```
Error: Unable to connect to Miyabi Gateway
```

**解決策**:
1. **Tailscale接続確認**:
   ```bash
   ping 100.112.127.63
   ```

2. **Gateway稼働確認**:
   ```bash
   curl http://100.112.127.63:3003/health
   ```

3. **認証情報確認**:
   - API Keyが正しいか確認
   - Bearer Tokenの有効期限確認

4. **ファイアウォール確認**:
   ```bash
   # MacBook上で実行
   sudo lsof -i :3003
   ```

### Q2: Rate Limitエラー

**エラーメッセージ**:
```json
{
  "error": "Too Many Requests",
  "retryAfter": "15 minutes"
}
```

**解決策**:
1. **制限を確認**:
   - 一般: 100 req/15min
   - SSE: 10 conn/min
   - API: 30 req/min

2. **待機時間を確保**:
   - `retryAfter`フィールドの時間待つ

3. **リクエストを最適化**:
   - バッチ処理を検討
   - キャッシュを活用

### Q3: 認証エラー

**エラーメッセージ**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**解決策**:
1. **ヘッダー確認**:
   ```bash
   # API Keyの場合
   -H "x-api-key: YOUR_KEY"

   # Bearer Tokenの場合
   -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **認証情報の再確認**:
   - API Key: `87743ea710b6dafadac9b90767b63c42295bd05272f2bf9a13fe7c2b6d080059`
   - Bearer Token: `c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d`

3. **.envファイル確認**（MacBook上）:
   ```bash
   ssh macbook "cat /Users/shunsuke/Dev/.../miyabi-sse-gateway/.env"
   ```

### Q4: CORS エラー

**エラーメッセージ**:
```
Access to fetch at 'http://100.112.127.63:3003/...' from origin 'http://example.com'
has been blocked by CORS policy
```

**解決策**:
1. **許可されたオリジンを確認**:
   - chat.openai.com
   - claude.ai
   - localhost:5173
   - 100.112.127.63:5173
   - 192.168.3.30:5173

2. **オリジンの追加が必要な場合**:
   - `index.ts`の`allowedOrigins`配列に追加
   - SSE Gatewayの再起動

### Q5: SSE接続が途切れる

**症状**: SSE接続が数分で切断される

**解決策**:
1. **Keep-Alive確認**:
   - 30秒ごとに`: keep-alive`が送信されているか確認

2. **ネットワーク設定**:
   - プロキシのタイムアウト設定を延長
   - ファイアウォールのアイドルタイムアウトを延長

3. **再接続ロジック実装**:
   ```javascript
   function connectSSE() {
     const eventSource = new EventSource(url);
     eventSource.onerror = () => {
       eventSource.close();
       setTimeout(connectSSE, 5000); // 5秒後に再接続
     };
   }
   ```

---

## 📚 関連ドキュメント

- [[chatgpt-miyabi-setup-guide]] - ChatGPT Custom GPT完全セットアップガイド
- [[Miyabi Architecture Overview]] - アーキテクチャ概要
- [[SSE Gateway Security Guide]] - セキュリティガイド
- [[MCP Protocol Specification]] - MCPプロトコル仕様

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-18 | 1.0.0 | 初版作成 - 完全使用ガイド |

---

## 📞 サポート

**GitHub Issues**:
```
https://github.com/customer-cloud/miyabi-private/issues
```

**ドキュメント**:
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/
```

**Obsidian Vault（Mobile）**:
```
/storage/emulated/0/Obsidian/MiyabiVault/
```

---

**作成者**: Claude Code
**プロジェクト**: Miyabi Society
**ライセンス**: MIT
