# Lark Wiki MCP Agents - Miyabi Integration Guide

**Version**: 1.0.0
**Date**: 2025-10-28
**Status**: Partial Integration Complete

---

## 📋 概要

Lark Wiki MCP Agentsを Miyabi プロジェクトに統合し、Lark/Feishu Wiki空間を完全制御可能にするMCPベースのAgent Systemです。

---

## 🎯 主要機能

### 5つのコアコマンドシステム

1. **C1 - Wiki Space Controller**
   - Wiki空間の初期化・作成・管理
   - セキュリティ制御（公開/非公開設定）

2. **C2 - Node Operations Manager**
   - Wikiノードの作成・移動・コピー・削除
   - ノード構造の階層管理

3. **C3 - Permission Orchestrator**
   - メンバー管理
   - 権限・アクセス制御
   - 階層的権限継承と「止めページ」

4. **C4 - Content Synchronizer**
   - ドキュメント検索・作成・更新
   - **Wiki-Bitable統合** （重要）

5. **C5 - Automation Engine**
   - タスク自動化
   - バッチ操作
   - Genesis AI統合

---

## 🚀 セットアップ状況

### ✅ 完了した作業

1. **リポジトリクローン**
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private/mcp-servers
   git clone https://github.com/ShunsukeHayashi/lark-wiki-mcp-agents.git
   ```

2. **依存関係インストール**
   ```bash
   cd lark-wiki-mcp-agents
   npm install  # 459 packages installed
   ```

3. **プロジェクトビルド**
   ```bash
   npm run build  # TypeScript → JavaScript (dist/)
   ```

4. **環境変数設定**
   ```bash
   # .env file created
   LARK_APP_ID=cli_a8d2fdb1f1f8d02d
   LARK_APP_SECRET=V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ
   WIKI_SPACE_ID=7324483648537755682
   ROOT_NODE_TOKEN=K7xUwSKH0i3fPekyD9ojSsCLpna
   ENABLE_GENESIS=true
   MCP_SERVER_PATH=/Users/shunsuke/Dev/miyabi-private/mcp-servers/lark-mcp-enhanced
   ```

5. **MCP設定更新**
   ```json
   // ~/.config/claude/mcp_settings.json
   {
     "mcpServers": {
       "lark-wiki-agent": {
         "command": "node",
         "args": [
           "/Users/shunsuke/Dev/miyabi-private/mcp-servers/lark-wiki-mcp-agents/dist/cli.js",
           "mcp"
         ],
         "env": {
           "LARK_APP_ID": "cli_a8d2fdb1f1f8d02d",
           "LARK_APP_SECRET": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
           "WIKI_SPACE_ID": "7324483648537755682",
           "ROOT_NODE_TOKEN": "K7xUwSKH0i3fPekyD9ojSsCLpna",
           "ENABLE_GENESIS": "true"
         }
       }
     }
   }
   ```

6. **ソースコード修正**
   - ハードコードされたパスを環境変数対応に修正
   - `src/agents/lark-wiki-mcp-agent.ts:140` を修正

---

## ⚠️ 既知の問題と制限

### 問題1: MCPサーバー依存関係

**現象**:
```
Error: Cannot find module '/path/to/lark-openapi-mcp-enhanced/dist/cli.js'
```

**原因**:
lark-wiki-mcp-agentsは、別のMCPサーバー `lark-openapi-mcp-enhanced` に依存していますが、このリポジトリは現在利用できません。

**回避策**:
既存の `lark-mcp-enhanced` サーバーを使用します（機能は限定的ですが、Base/Wiki/Genesis操作は可能）。

### 問題2: Claude CLI MCP認識

**現象**:
```bash
claude mcp list
# No MCP servers configured
```

**原因**:
Claude CLIがmcp_settings.jsonを正しく認識していない可能性があります。

**回避策**:
直接Node.jsでMCPサーバーを起動：
```bash
node /Users/shunsuke/Dev/miyabi-private/mcp-servers/lark-mcp-enhanced/dist/cli.js mcp --mode stdio
```

---

## 📖 使用方法

### 1. インタラクティブモード（推奨）

```bash
cd /Users/shunsuke/Dev/miyabi-private/mcp-servers/lark-wiki-mcp-agents
node dist/cli.js interactive --type mcp
```

**利用可能なコマンド**:
- `C1.INITIALIZE` - Wiki空間初期化
- `C2.CREATE_NODE {"title": "New Page"}` - ノード作成
- `C3.LIST_MEMBERS` - メンバー一覧
- `C4.SEARCH_WIKI {"query": "project"}` - Wiki検索
- `C5.BATCH_OPERATIONS` - バッチ操作
- `RUN ALL` - 全コマンド実行
- `Run C1 C2 C3` - 特定コマンドチェーン実行

### 2. 単一コマンド実行

```bash
node dist/cli.js execute "C1.INITIALIZE" --type mcp
node dist/cli.js execute "C2.CREATE_NODE" --params '{"title": "新規ドキュメント", "obj_type": "docx"}'
```

### 3. プログラム使用

```typescript
import { createAgent } from '/Users/shunsuke/Dev/miyabi-private/mcp-servers/lark-wiki-mcp-agents';

const agent = createAgent({
  type: 'mcp',
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  spaceId: '7324483648537755682',
  rootNodeToken: 'K7xUwSKH0i3fPekyD9ojSsCLpna',
  enableGenesis: true
});

await agent.initialize();
const result = await agent.execute('C1.INITIALIZE');
await agent.close();
```

---

## 🔑 重要実装パターン

### Wiki-Bitable統合の核心

```typescript
// 1. Wikiノード情報を取得
const nodeInfo = await agent.execute('C2.GET_NODE_INFO', {
  node_token: 'wiki_node_token'
});

// 2. obj_tokenを抽出（これがBitableのapp_token）
const app_token = nodeInfo.obj_token;

// 3. Bitable操作にapp_tokenを使用
const tables = await callMCPTool('bitable.v1.appTable.list', {
  app_token: app_token  // obj_tokenをapp_tokenとして使用
});
```

---

## 🛡️ セキュリティプロトコル

### 必ず守るべき5つの原則

1. **機密データを承認なしに公開しない**
2. **外部ユーザーに構造修正権限を付与しない**
3. **バックアップなしで削除しない**
4. **操作前に権限を検証する**
5. **公開前にインパクト分析を実行する**

### 階層的権限管理

```typescript
// 「止めページ」で権限継承を遮断
await agent.execute('C2.CREATE_NODE', {
  title: '[Internal Only] Permission Boundary',
  parent_token: 'parent_node',
  permissions: 'SPACE_MEMBERS_ONLY'
});
```

---

## 📊 プロジェクト構成

```
miyabi-private/
└── mcp-servers/
    ├── lark-mcp-enhanced/           # 既存MCPサーバー（動作中）
    ├── lark-wiki-mcp-agents/        # 新規Wiki Agentシステム
    │   ├── dist/                    # ビルド成果物
    │   ├── src/
    │   │   ├── agents/
    │   │   │   ├── lark-wiki-agent.ts
    │   │   │   └── lark-wiki-mcp-agent.ts
    │   │   ├── cli.ts
    │   │   └── index.ts
    │   ├── .env                     # 環境変数設定
    │   ├── package.json
    │   └── README.md
    └── context-engineering/         # その他MCPサーバー
```

---

## 📝 次のステップ

### 短期的な改善

1. **MCP依存関係の解決**
   - lark-openapi-mcp-enhancedの代替実装
   - または既存lark-mcp-enhancedへの統合

2. **Claude CLI統合の修正**
   - MCP設定の正しい認識
   - `claude mcp list` での表示

3. **統合テストの実施**
   - C1-C5コマンドの動作確認
   - Wiki-Bitable連携テスト

### 長期的な拡張

1. **Miyabi CLIへの統合**
   ```bash
   miyabi wiki init
   miyabi wiki create-node "New Document"
   miyabi wiki search "project"
   ```

2. **Agent自動化の実装**
   - Issue管理とWiki連携
   - 自動ドキュメント生成

3. **Genesis AI統合**
   - 自然言語からLark Base作成
   - AI駆動のWiki構造最適化

---

## 🔗 関連リンク

- **GitHub**: https://github.com/ShunsukeHayashi/lark-wiki-mcp-agents
- **Lark Open Platform**: https://open.feishu.cn
- **MCP Protocol**: https://modelcontextprotocol.io

---

**作成者**: Claude Code (Miyabi Integration Team)
**最終更新**: 2025-10-28
