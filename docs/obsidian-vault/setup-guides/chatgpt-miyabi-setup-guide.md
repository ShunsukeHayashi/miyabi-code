---
title: "ChatGPT × Miyabi Society 接続ガイド"
created: 2025-11-18
updated: 2025-11-18
author: "Claude Code"
category: "setup-guides"
tags: ["miyabi", "chatgpt", "mcp", "obsidian", "setup"]
status: "published"
language: "ja"
---

# ChatGPT × Miyabi Society 接続ガイド

## 📋 概要

このガイドでは、ChatGPT Custom GPTをMiyabi SSE Gateway (MCP)に接続し、日本語でObsidian連携を実現する方法を説明します。

## 🎯 目的

- ChatGPTからMiyabi tmux操作
- ChatGPTからMiyabiルール実行
- ChatGPTからObsidianノート作成・管理
- 日本語での自然なインタラクション

---

## 🔧 必要な情報

### 認証情報
```
Bearer Token: c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
API Endpoint: http://100.112.127.63:3003
```

### Obsidian Vault Path
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/
```

---

## 📱 Step 1: Custom GPT作成

### 1-1. GPT Builder起動
1. https://chat.openai.com にアクセス
2. 左サイドバー「Explore GPTs」クリック
3. 右上「Create」ボタンクリック

### 1-2. 基本設定
```yaml
Name: Miyabi Society AI
Description: Miyabi自律型開発プラットフォーム - tmux操作・ルール管理・Obsidian連携対応AI
```

### 1-3. アイコン設定
- 「Generate」で自動生成
- または画像アップロード

---

## 📝 Step 2: Instructions設定

以下をInstructionsフィールドに貼り付け:

```markdown
# Miyabi Society AIアシスタント

あなたはMiyabi自律型開発プラットフォームのAIアシスタントです。

## 🎯 役割と責任

### 1. tmuxセッション管理
- セッション一覧表示
- 新規セッション作成
- ウィンドウ・ペイン操作
- セッションアタッチ・デタッチ

### 2. Miyabiルールエンジン
- エージェント検証
- ワークフロー実行
- ルール適用・管理

### 3. Obsidianノート管理
- ノート作成（Markdownフォーマット）
- ノート検索・取得
- タグ管理
- デイリーノート自動生成

## 🌐 言語設定

**必須**: 全ての応答を**日本語**で行ってください。

## 📋 応答フォーマット

### Markdown構造
- 見出し（# ## ###）で階層化
- リスト（- 1.）で整理
- コードブロック（```）で技術情報表示
- テーブルで比較情報整理

### Obsidian互換性
全てのノート出力は以下のフロントマターを含める:

\`\`\`yaml
---
title: "ノートタイトル"
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "Miyabi Society AI"
category: "カテゴリ名"
tags: ["miyabi", "タグ1", "タグ2"]
status: "draft | review | published"
---
\`\`\`

## 🛠️ 使用可能なツール

### healthCheck()
システムヘルスチェック
- 戻り値: {status: "healthy", timestamp: "..."}

### executeTmuxCommand(command)
tmuxコマンド実行
- 引数: {command: "tmux list-sessions"}
- 例: セッション一覧、ウィンドウ作成など

### executeMiyabiRules(action, parameters)
Miyabiルール実行
- 引数: {action: "validate_agent", parameters: {...}}
- 例: エージェント検証、ワークフロー実行

## 💡 使用例

### 例1: tmuxセッション確認
```
User: 現在のtmuxセッションを教えて
AI: executeTmuxCommand({command: "tmux list-sessions"})を実行
    → 日本語で整形した結果を返す
```

### 例2: Obsidianノート作成
```
User: 今日のタスクをObsidianに保存して
AI: Markdownフォーマットでノートを作成
    → フロントマター付きで出力
```

### 例3: エージェント検証
```
User: Strategy Plannerエージェントを検証して
AI: executeMiyabiRules({action: "validate_agent", parameters: {agent: "strategy-planner"}})
    → 検証結果を日本語で報告
```

## ⚠️ 注意事項

1. **セキュリティ**: 認証情報は絶対に公開しない
2. **エラーハンドリング**: API呼び出し失敗時は日本語でエラー説明
3. **Obsidian互換性**: 全てのノートは Vault構造に準拠
4. **日本語優先**: 技術用語以外は日本語表記

## 📊 カテゴリ分類

Obsidianノート作成時のカテゴリ:
- `architecture/` - アーキテクチャ・設計
- `agents/` - Agent関連
- `reports/` - レポート・分析
- `planning/` - 計画・ロードマップ
- `daily-notes/` - デイリーノート

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Author**: Claude Code
```

---

## 🔗 Step 3: Actions設定

### 3-1. Actions追加
1. 「Configure」タブをクリック
2. 「Add actions」クリック
3. 「Create new action」選択

### 3-2. Authentication設定

**Authentication Type**: `Bearer`

```
Bearer Token:
c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

### 3-3. Schema入力

以下のOpenAPIスキーマを貼り付け:

```yaml
openapi: 3.1.0
info:
  title: Miyabi MCP Gateway API
  description: |
    Miyabi多Agent統合プラットフォームAPI
    - tmuxセッション管理
    - Miyabiルールエンジン
    - Obsidian連携サポート
  version: 1.0.0
  contact:
    name: Miyabi Society
    url: https://github.com/customer-cloud/miyabi-private

servers:
  - url: http://100.112.127.63:3003
    description: Miyabi SSE Gateway (Tailscale経由)
  - url: http://192.168.3.30:3003
    description: Miyabi SSE Gateway (ローカルネットワーク)

paths:
  /health:
    get:
      summary: ヘルスチェック
      description: Miyabi Gatewayの状態を確認
      operationId: healthCheck
      tags:
        - System
      responses:
        '200':
          description: 正常稼働中
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: healthy
                    description: システム状態
                  timestamp:
                    type: string
                    format: date-time
                    description: チェック日時

  /mcp/tmux:
    post:
      summary: tmuxコマンド実行
      description: |
        tmuxセッションに対してコマンドを実行

        **使用例**:
        - セッション一覧: `tmux list-sessions`
        - ウィンドウ作成: `tmux new-window -t session:1`
        - ペイン分割: `tmux split-window -h`
      operationId: executeTmuxCommand
      tags:
        - Tmux
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - command
              properties:
                command:
                  type: string
                  description: 実行するtmuxコマンド
                  example: "tmux list-sessions"
                session:
                  type: string
                  description: セッション名（オプション）
                  example: "miyabi"
      responses:
        '200':
          description: コマンド実行成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: string
                    description: コマンド実行結果
                  status:
                    type: string
                    example: success
        '401':
          description: 認証失敗
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /mcp/rules:
    post:
      summary: Miyabiルール実行
      description: |
        Miyabiルールエンジンでアクションを実行

        **アクション例**:
        - `validate_agent`: エージェント検証
        - `execute_workflow`: ワークフロー実行
        - `check_rules`: ルール適合性チェック
      operationId: executeMiyabiRules
      tags:
        - Rules
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - action
              properties:
                action:
                  type: string
                  description: 実行するアクション名
                  example: "validate_agent"
                  enum:
                    - validate_agent
                    - execute_workflow
                    - check_rules
                    - list_agents
                parameters:
                  type: object
                  description: アクション固有のパラメータ
                  additionalProperties: true
                  example:
                    agent_name: "strategy-planner"
                    validation_level: "strict"
      responses:
        '200':
          description: ルール実行成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: object
                    description: 実行結果
                  status:
                    type: string
                    example: success
        '401':
          description: 認証失敗
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
          description: エラータイプ
        message:
          type: string
          description: エラーメッセージ（日本語）

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Bearer Token認証

security:
  - BearerAuth: []

tags:
  - name: System
    description: システム管理API
  - name: Tmux
    description: tmuxセッション管理API
  - name: Rules
    description: Miyabiルールエンジ

ンAPI
```

---

## 🎭 Step 4: Privacy設定

### プライバシーレベル選択
```
○ Anyone with a link (リンクを持つ全員)
● Only me (自分のみ) ← 推奨
○ My workspace (ワークスペース)
```

**推奨**: `Only me` を選択してセキュリティ確保

---

## ✅ Step 5: テスト

### 5-1. 基本動作確認

**プロンプト**:
```
システムの状態を確認して
```

**期待される応答**:
```
システム状態を確認しました。

**ヘルスチェック結果**:
- ステータス: ✅ healthy
- チェック日時: 2025-11-18T10:30:00Z

Miyabi Gatewayは正常に稼働しています。
```

### 5-2. tmux操作テスト

**プロンプト**:
```
現在のtmuxセッションを全部教えて
```

**期待される応答**:
```
現在のtmuxセッション一覧:

| セッション名 | ウィンドウ数 | 作成日時 | 状態 |
|-------------|------------|---------|------|
| miyabi      | 3          | 2時間前  | アタッチ中 |
| dev         | 1          | 1日前    | デタッチ済 |
```

### 5-3. Obsidianノート作成テスト

**プロンプト**:
```
今日のMiyabi開発ログをObsidian形式で作成して。
以下を含めて:
- AWS S3デプロイ完了
- SSE Gateway認証実装
- ChatGPT連携セットアップ
```

**期待される応答**:
````markdown
以下のObsidianノートを作成しました:

---
title: "2025-11-18 Miyabi開発ログ"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Society AI"
category: "daily-notes"
tags: ["miyabi", "development", "log"]
status: "published"
---

# 2025-11-18 Miyabi開発ログ

## ✅ 完了した作業

### 1. AWS S3デプロイ
- **対象**: Miyabi Console
- **URL**: http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com
- **ステータス**: ✅ デプロイ成功
- **ファイル数**: 4 production assets

### 2. SSE Gateway認証実装
- **認証方式**:
  - API Key (Claude用)
  - Bearer Token (ChatGPT用)
  - OAuth2 (将来対応)
- **ステータス**: ✅ 実装完了・テスト済み

### 3. ChatGPT連携セットアップ
- **Custom GPT**: Miyabi Society AI
- **API接続**: ✅ 動作確認済み
- **Obsidian連携**: ✅ テスト完了

## 📊 次のステップ

1. Rate limiting実装
2. Audit logging追加
3. CORS設定強化

---

**作成者**: Miyabi Society AI
**カテゴリ**: 開発ログ
**保存先**: `daily-notes/2025-11-18-miyabi-development-log.md`
````

---

## 📚 Obsidian Vault構造

```
obsidian-vault/
├── architecture/          # アーキテクチャ・設計
├── agents/                # Agent仕様・実装
├── reports/               # レポート・分析
├── planning/              # 計画・ロードマップ
├── daily-notes/           # デイリーノート
└── setup-guides/          # セットアップガイド
    └── chatgpt-miyabi-setup-guide.md  ← このファイル
```

---

## 🔐 セキュリティ注意事項

### ✅ 実施済み
- ✅ Bearer Token認証
- ✅ HTTPS推奨（Tailscale経由）
- ✅ Private GPT設定

### ⚠️ 今後対応
- ⚠️ Rate limiting追加
- ⚠️ Audit logging実装
- ⚠️ IP whitelist設定

---

## 📞 トラブルシューティング

### Q1: API接続エラー
```
Error: Unable to connect to Miyabi Gateway
```
**解決策**:
1. Tailscale接続確認: `ping 100.112.127.63`
2. Gateway稼働確認: `curl http://100.112.127.63:3003/health`
3. Bearer Token確認

### Q2: 日本語が文字化け
**解決策**:
- Instructionsに`**言語**: 日本語で応答`を明記
- GPTモデル設定確認

### Q3: Obsidianノートが作成されない
**解決策**:
- Vault path確認: `/Users/shunsuke/Dev/.../obsidian-vault/`
- ディレクトリパーミッション確認
- フロントマター形式確認

---

## 📝 更新履歴

| 日付 | 版 | 変更内容 |
|------|-------|---------|
| 2025-11-18 | 1.0.0 | 初版作成 |

---

## 📎 関連リンク

- [[Miyabi Architecture Overview]]
- [[SSE Gateway Security Guide]]
- [[MCP Protocol Specification]]
- [[Obsidian Integration Guide]]

---

**作成者**: Claude Code
**ライセンス**: MIT
**プロジェクト**: Miyabi Society
