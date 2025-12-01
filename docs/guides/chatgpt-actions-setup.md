# ChatGPT Actions + Miyabi 連携ガイド

## 概要

ChatGPT Custom GPTからMiyabi Task APIを呼び出し、コード生成・テスト・PR作成を自動化する方法を説明します。

## 前提条件

- Miyabi API サーバーが起動している
- 外部からアクセス可能なURL（ngrok、Cloudflare Tunnel等）
- ChatGPT Plus または Enterprise アカウント

## セットアップ手順

### Step 1: Miyabi APIを起動

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
npm run dev
```

### Step 2: 外部公開（開発環境の場合）

```bash
# ngrokを使用する場合
ngrok http 3000

# Cloudflare Tunnelを使用する場合
cloudflared tunnel run miyabi
```

公開URLを控えておく（例: `https://abc123.ngrok-free.app`）

### Step 3: ChatGPT Custom GPTを作成

1. [ChatGPT](https://chat.openai.com) にアクセス
2. 「GPTを作成」をクリック
3. 以下の情報を入力:

**名前**: Miyabi Task Automation

**説明**: 
```
Miyabiに自然言語でタスクを指示し、コード生成・テスト・PR作成まで自動実行します。
```

**指示**:
```
あなたはMiyabiタスク自動化アシスタントです。

ユーザーからの開発タスク依頼を受け取り、Miyabi Task APIを使用して自動実行します。

タスクの例:
- 「ユーザー認証機能を実装して」→ createTask APIを呼び出し
- 「Issue #123を修正して」→ createTask APIを呼び出し
- 「前のタスクの進捗を確認して」→ getTask APIを呼び出し

タスク作成後は、タスクIDを伝え、進捗確認方法を説明してください。
```

### Step 4: Actionsを設定

1. 「Actions」セクションを開く
2. 「新しいアクションを追加」をクリック
3. 以下を設定:

**認証**: 
- タイプ: `API Key`
- Auth Type: `Bearer`
- API Key: `miyabi-demo-key-12345` （または実際のAPI Key）

**スキーマ**: 
OpenAPI仕様をインポート:
```
https://YOUR-DOMAIN/openapi.yaml
```

または以下のスキーマを直接貼り付け:

```yaml
openapi: 3.1.0
info:
  title: Miyabi Task API
  version: 1.0.0
servers:
  - url: https://YOUR-DOMAIN/api/v1
paths:
  /tasks:
    post:
      operationId: createTask
      summary: Create a new automation task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - instruction
                - repository
              properties:
                instruction:
                  type: string
                  description: Natural language task instruction
                repository:
                  type: string
                  description: Target repository (owner/repo)
                  default: customer-cloud/miyabi-private
                options:
                  type: object
                  properties:
                    priority:
                      type: string
                      enum: [low, normal, high, critical]
                      default: normal
                    auto_merge:
                      type: boolean
                      default: false
      responses:
        '201':
          description: Task created
    get:
      operationId: listTasks
      summary: List tasks
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Task list
  /tasks/{taskId}:
    get:
      operationId: getTask
      summary: Get task status
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Task details
    delete:
      operationId: cancelTask
      summary: Cancel a task
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Task cancelled
  /health:
    get:
      operationId: getHealth
      summary: Health check
      responses:
        '200':
          description: System health
```

### Step 5: テスト

Custom GPTで以下のように話しかけてテスト:

```
「ユーザープロフィール機能を実装してください。名前、メール、プロフィール画像を編集できるようにしてください。」
```

## トラブルシューティング

### 401 Not Authorized

**原因**: API Keyが正しく設定されていない

**解決策**:
1. ChatGPT Actions の認証設定を確認
2. Auth Type が `Bearer` になっていることを確認
3. API Key が正しいことを確認（デフォルト: `miyabi-demo-key-12345`）

### 405 Method Not Allowed

**原因**: OPTIONSプリフライトリクエストが失敗している

**解決策**:
1. Miyabi APIサーバーを再起動
2. CORSヘッダーが設定されていることを確認:
   ```bash
   curl -X OPTIONS https://YOUR-DOMAIN/api/v1/tasks \
     -H "Origin: https://chat.openai.com" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

### CORS Error

**原因**: CORSヘッダーが不足している

**解決策**:
1. `middleware.ts` が存在することを確認
2. `next.config.js` の `headers()` 設定を確認
3. サーバーを再起動

### Connection Refused

**原因**: APIサーバーに到達できない

**解決策**:
1. ngrok/Cloudflare Tunnel が動作しているか確認
2. URLが正しいか確認
3. ファイアウォール設定を確認

## API Key 一覧

| API Key | 用途 | Rate Limit |
|---------|------|------------|
| `miyabi-demo-key-12345` | デモ・テスト用 | 100 req/hour |
| `miyabi-admin-key-secret` | 管理者用 | 1000 req/hour |

## 確認用 curl コマンド

```bash
# ヘルスチェック（認証不要）
curl https://YOUR-DOMAIN/api/v1/health

# タスク作成
curl -X POST https://YOUR-DOMAIN/api/v1/tasks \
  -H "Authorization: Bearer miyabi-demo-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"instruction": "テスト機能を実装", "repository": "customer-cloud/miyabi-private"}'

# タスク一覧
curl https://YOUR-DOMAIN/api/v1/tasks \
  -H "Authorization: Bearer miyabi-demo-key-12345"
```

## 環境変数

本番環境では以下の環境変数を設定:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
OPENAI_VERIFICATION_TOKEN=your-verification-token
```
