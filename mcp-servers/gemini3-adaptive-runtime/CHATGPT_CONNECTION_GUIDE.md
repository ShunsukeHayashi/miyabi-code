# 🚀 ChatGPT × ローカルMCP接続手順書

## ✅ 現在の状況
- HTTPサーバー: **正常起動中** (`localhost:3000`)
- 利用可能ツール: **9つ** (Deep Reasoning, Dynamic UI, Code Analysis等)
- ngrok: **認証待ち** (次のステップで設定)

---

## 🎯 完了手順 (あと3ステップ)

### 1️⃣ ngrok認証設定 ⚡

**a) ngrokアカウント作成**
1. https://dashboard.ngrok.com/signup にアクセス
2. アカウントを作成 (無料)

**b) 認証トークン設定**
1. https://dashboard.ngrok.com/get-started/your-authtoken にアクセス
2. 認証トークンをコピー
3. ターミナルで以下実行:
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

**c) HTTPSトンネル作成**
```bash
ngrok http 3000
```
**結果例:**
```
Forwarding    https://abc123.ngrok.app -> http://localhost:3000
```
この **`https://abc123.ngrok.app`** をメモ！

---

### 2️⃣ ChatGPT接続設定 🤖

#### A. ChatGPT Plus ユーザー
1. ChatGPTで新しいチャット開始
2. 以下のメッセージを送信:
```
https://abc123.ngrok.app のMCPサーバーに接続して、利用可能なツールを表示してください
```

#### B. ChatGPT Team/Enterprise ユーザー
1. **GPTs** → **Create a GPT**
2. **Actions** セクションで以下を設定:

**Schema例:**
```yaml
openapi: 3.0.0
info:
  title: Gemini 3 Adaptive Runtime
  version: 1.0.0
servers:
  - url: https://abc123.ngrok.app
paths:
  /tools:
    get:
      summary: Get available tools
      responses:
        200:
          description: List of available tools
  /execute/{toolName}:
    post:
      summary: Execute specific tool
      parameters:
        - name: toolName
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
      responses:
        200:
          description: Tool execution result
```

---

### 3️⃣ 動作テスト ✅

**基本接続テスト:**
```bash
curl https://YOUR_NGROK_URL/tools
```

**ChatGPTでのテスト例:**
```
ローカルMCPサーバーの deep_reasoning ツールを使って、
「AIの未来について」深く考察してください。
```

---

## 🛠️ 利用可能ツール一覧

| ツール名 | 機能 | 使用例 |
|---------|------|--------|
| **generate_dynamic_ui** | React UI自動生成 | "ダッシュボードUIを作成" |
| **iterate_ui** | UI改善・修正 | "ボタンを大きくして" |
| **deep_reasoning** | 深い推論・分析 | "この戦略の課題は？" |
| **compare_options** | 選択肢比較 | "AとB、どちらが良い？" |
| **analyze_decision** | 意思決定分析 | "この判断のリスクは？" |
| **execute_code** | コード実行 | "Pythonでグラフ作成" |
| **analyze_code** | コード分析 | "バグを見つけて" |
| **generate_tests** | テスト自動生成 | "この関数のテスト作成" |
| **solve_algorithm** | アルゴリズム問題解決 | "最短経路を求めて" |

---

## 🚨 現在の課題

### Gemini APIモデル設定
現在 `gemini-3-pro-preview` モデルを使用していますが、利用できません。
以下のいずれかに修正が必要:

**推奨修正:**
1. `src/http-server.ts` 41行目を修正:
```typescript
// 変更前
this.client = new Gemini3Client({
  apiKey,
  model: 'gemini-3-pro-preview',  // ← これを変更
  thinkingLevel: 'high',
});

// 変更後 (推奨)
this.client = new Gemini3Client({
  apiKey,
  model: 'gemini-1.5-pro',  // または 'gemini-pro'
  thinkingLevel: 'high',
});
```

2. 再ビルド:
```bash
npm run build
```

3. サーバー再起動:
```bash
GEMINI_API_KEY=AIzaSyCl5GNYg_VVb0UaKVsk6yjqaX_aDaSLkX4 npm run start:http
```

---

## 🎯 最終確認チェックリスト

- [ ] ngrok認証設定完了
- [ ] HTTPSトンネル作成完了 (`https://xxx.ngrok.app`)
- [ ] Geminiモデル設定修正完了
- [ ] ChatGPTでツール一覧表示成功
- [ ] 実際のツール実行テスト成功

---

## 🚀 成功時の体験

**完成すると、ChatGPTで以下が可能になります:**

1. **"React でダッシュボードUIを作成して"**
   → `generate_dynamic_ui` が実行され、完全なReactコンポーネント生成

2. **"この意思決定の長期的な影響を分析して"**
   → `deep_reasoning` が実行され、構造化された分析レポート生成

3. **"Pythonで機械学習モデルを実装して"**
   → `execute_code` が実行され、動作するコード生成・実行

**これらがすべてローカルMCPサーバー経由で実行されます！**

---

## 📞 トラブルシューティング

### エラー: "authentication failed"
→ ngrok認証トークンを正しく設定してください

### エラー: "connection refused"
→ HTTPサーバー(`localhost:3000`)が起動しているか確認

### エラー: "gemini-3-pro-preview not found"
→ 上記の Gemini APIモデル設定を修正してください

### ChatGPTで応答がない
→ ngrok URLが正しく設定されているか確認
→ CORS設定により、ChatGPTからのアクセスが許可されています

---

**🎉 これで ChatGPT から ローカルのGemini 3 MCPツールが使えるようになります！**