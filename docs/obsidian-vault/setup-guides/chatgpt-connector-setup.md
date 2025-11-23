---
title: "ChatGPT - Miyabi Society Connector セットアップガイド"
created: 2025-11-18
updated: 2025-11-18
language: "ja"
category: "setup-guide"
tags: ["chatgpt", "mcp", "connector", "setup"]
status: "ready"
---

# ChatGPT - Miyabi Society Connector セットアップガイド

## ✅ ステータス

**ngrok URL**: `https://1a153282e7e4.ngrok-free.app`
**エンドポイント**: `https://1a153282e7e4.ngrok-free.app/mcp`
**認証**: Bearer Token
**ステータス**: ✅ 稼働中

---

## 📋 セットアップ手順

### Step 1: ChatGPT Connectorページにアクセス

1. ChatGPTにログイン: https://chatgpt.com
2. 左下のプロフィールアイコンをクリック
3. **「Settings」** → **「Connectors」** を選択
4. **「+ Create new connector」** をクリック

### Step 2: Connector設定を入力

以下の情報を入力してください：

#### 基本情報
- **Name**: `Miyabi Society`
- **Description**: `Miyabiエージェント管理・tmux制御・レポート生成システム（日本語対応）`

#### MCP Configuration

**MCP Server URL**:
```
https://1a153282e7e4.ngrok-free.app/mcp
```

**Authentication Type**: `Bearer Token`

**Bearer Token**:
```
c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

### Step 3: 保存とテスト

1. **「Save」** をクリック
2. Connector一覧に **「Miyabi Society」** が表示されることを確認
3. ステータスが **「Connected」** になっていることを確認

---

## 🔧 利用可能なツール (7個)

ChatGPTから以下のツールが利用できます：

### 1. **list_miyabi_agents** - エージェント一覧表示
```
フィルター: "all", "active", "inactive", "business", "technical"
```

**例**:
- 「全てのMiyabiエージェントを一覧表示して」
- 「アクティブなビジネスエージェントを見せて」

**出力**: 14個のエージェントの詳細な日本語テーブル表示

---

### 2. **get_agent_details** - エージェント詳細取得
```
agent_name: "Strategy Planner" など
```

**例**:
- 「Strategy Plannerの詳細情報を教えて」
- 「Marketing Managerのcapabilitiesを見せて」

**出力**: 指定エージェントの完全な仕様と実行状態

---

### 3. **list_tmux_sessions** - tmuxセッション一覧
```
パラメータなし
```

**例**:
- 「現在のtmuxセッションを全部見せて」
- 「tmuxの状況を確認して」

**出力**: セッション名、ウィンドウ数、作成時刻

---

### 4. **create_tmux_session** - セッション作成
```
name: セッション名（必須）
windows: ウィンドウ数（デフォルト: 1）
```

**例**:
- 「miyabi-devという名前でtmuxセッションを3ウィンドウで作って」
- 「testセッションを作成して」

**出力**: 作成成功メッセージとセッション情報

---

### 5. **kill_tmux_session** - セッション終了 (破壊的操作)
```
name: 終了するセッション名（必須）
```

⚠️ **警告**: この操作は取り消しできません

**例**:
- 「test-sessionを終了して」
- 「miyabi-devセッションをkillして」

**出力**: 削除確認メッセージ

---

### 6. **generate_daily_report** - デイリーレポート生成
```
date: YYYY-MM-DD形式（省略時は今日）
include_metrics: true/false（デフォルト: true）
```

**例**:
- 「今日のデイリーレポートを作成して」
- 「2025-11-17のレポートをメトリクス付きで生成して」

**出力**: Obsidian形式のMarkdownレポート

---

### 7. **get_system_status** - システムステータス取得
```
パラメータなし
```

**例**:
- 「システムの状態を教えて」
- 「Miyabiの全体ステータスを確認して」

**出力**: エージェント稼働率、tmuxセッション数、システムメトリクス

---

## 💡 使用例

### 例1: エージェント管理
```
User: 「全てのビジネスエージェントのステータスを確認して」
ChatGPT: [list_miyabi_agents with filter="business" を実行]
→ 日本語でフォーマットされた14個のエージェント情報を表示
```

### 例2: 開発環境セットアップ
```
User: 「miyabi-devという名前で4ウィンドウのtmuxセッションを作って、現在のセッション一覧も見せて」
ChatGPT:
1. [create_tmux_session] → セッション作成
2. [list_tmux_sessions] → 一覧表示
→ 作成されたセッションを含む全セッション情報を返す
```

### 例3: レポート生成
```
User: 「今日のデイリーレポートを生成して、その後システム全体のステータスも確認して」
ChatGPT:
1. [generate_daily_report] → 今日のレポート作成
2. [get_system_status] → システム状態確認
→ レポート内容とシステムヘルス情報を日本語で返す
```

---

## 🔐 セキュリティ機能

### 有効化されているセキュリティ機能

✅ **Bearer Token認証**: 全てのリクエストで必須
✅ **Rate Limiting**: 30リクエスト/分
✅ **Prompt Injection Guard**: 25種類の攻撃パターンを検出
✅ **Tool Approval System**: 破壊的操作には確認が必要
✅ **Audit Logging**: 全リクエストをログ記録
✅ **CORS制限**: 許可されたオリジンのみアクセス可能

### 破壊的操作の確認フロー

**kill_tmux_session** などの破壊的操作は、自動的に確認が求められます：

1. ChatGPTがツールを呼び出し
2. サーバーが `X-Confirmation-Token` を要求
3. ユーザーに確認を求める
4. 確認後、再度リクエストが実行される

---

## 🔍 トラブルシューティング

### Q1: Connectorが「Disconnected」になる
**原因**: ngrokトンネルが停止している
**解決**: MacBookでngrokを再起動
```bash
ssh macbook "pkill -f ngrok && /usr/local/bin/ngrok http 3003"
```

### Q2: 認証エラーが出る
**原因**: Bearer Tokenが間違っている
**解決**: 上記のトークンを正確にコピペ

### Q3: ツールが表示されない
**原因**: MCP Server URLが間違っている
**解決**: 正確なURL `https://1a153282e7e4.ngrok-free.app/mcp` を使用

### Q4: 日本語が文字化けする
**原因**: Content-Typeヘッダーの問題
**解決**: 自動的にUTF-8でエンコードされるため、問題ない

---

## 📊 動作確認

### コマンドラインからテスト

#### Tools Listの取得
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}' \
  https://1a153282e7e4.ngrok-free.app/mcp | jq '.'
```

#### エージェント一覧の取得
```bash
curl -X POST \
  -H "Authorization: Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"list_miyabi_agents","arguments":{"filter":"all"}}}' \
  https://1a153282e7e4.ngrok-free.app/mcp | jq -r '.content[0].text'
```

---

## 🚀 次のステップ

1. ✅ Connectorをセットアップ
2. ✅ テストクエリを実行
3. 📝 実際のタスクに使ってみる:
   - エージェントの稼働状況を定期的に確認
   - tmux環境を自動セットアップ
   - デイリーレポートの自動生成

---

## 📝 更新履歴

- **2025-11-18**: 初回作成
  - ngrok URL: `https://1a153282e7e4.ngrok-free.app`
  - 7ツール完全対応
  - 日本語完全サポート

---

**構築者**: Claude Code (Sonnet 4.5)
**ドキュメント種別**: セットアップガイド
**対象**: ChatGPT Connectors
