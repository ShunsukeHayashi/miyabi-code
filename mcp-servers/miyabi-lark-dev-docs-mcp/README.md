# Miyabi Lark Developer Docs Scraper MCP

ログイン済みChromeセッションを使用してLark公式Developer Documentationをスクレイピングし、Claude Codeから自由にアクセスできるMCPサーバー。

## 🎯 目的

- Lark公式Developer Docsに**ログイン状態でアクセス**
- ログインしないと見れない情報も取得可能
- API仕様、サンプルコード、ガイドをClaude Codeで直接参照

---

## 🚀 セットアップ手順

### Step 1: 依存関係インストール

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-lark-dev-docs-mcp
npm install
```

### Step 2: Chromeをデバッグモードで起動

```bash
npm run chrome
```

または手動で：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-miyabi &
```

### Step 3: Larkにログイン

1. 起動したChromeで `https://open.larksuite.com` にアクセス
2. Larkアカウントでログイン
3. ログイン状態を維持したまま、ブラウザを開いたまま

### Step 4: MCPサーバー起動

```bash
npm start
```

---

## 📖 使い方

### Claude Code設定

`~/.config/claude-code/mcp_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "lark-dev-docs": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-lark-dev-docs-mcp/src/index.js"
      ]
    }
  }
}
```

---

## 🔧 提供されるMCPツール

### 1. `lark_dev_docs_read`
指定したLark Developer DocsのURLからコンテンツを読み取る

```javascript
{
  "url": "https://open.larksuite.com/document/server-docs/im-v1/message/create"
}
```

### 2. `lark_api_search`
Lark APIドキュメントを検索

```javascript
{
  "query": "send message"
}
```

### 3. `lark_dev_docs_navigate`
特定のセクションに移動して内容を取得

```javascript
{
  "section": "im"  // im, docs, bot, event, auth
}
```

---

## 💡 使用例

Claude Codeで以下のように使用：

```
User: "Lark APIでメッセージを送信する方法を教えて"

Claude: lark_api_search("send message") を実行
        → 検索結果から適切なドキュメントURLを取得
        → lark_dev_docs_read(url) で詳細を読み取り
        → サンプルコードと説明を提供
```

---

## 🏗️ アーキテクチャ

```
Claude Code
    ↓
MCP Server (Node.js)
    ↓
Puppeteer (Chrome DevTools Protocol)
    ↓
Chrome (ログイン済みセッション)
    ↓
Lark Developer Docs
```

---

## ⚠️ 注意事項

1. **Chrome必須**
   - デバッグモードで起動したChromeが必要
   - MCPサーバー実行中はChromeを閉じないでください

2. **ログイン状態維持**
   - Larkからログアウトすると、ログインが必要なページにアクセスできません
   - 定期的にログイン状態を確認してください

3. **ネットワーク**
   - インターネット接続が必要
   - Larkサーバーへのアクセスが可能である必要があります

---

## 🎉 完成

これで、Claude CodeからLark公式Developer Docsに**ログイン状態でアクセス**できるようになりました！
