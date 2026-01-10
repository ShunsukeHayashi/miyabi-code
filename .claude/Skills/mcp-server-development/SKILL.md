---
name: MCP Server Development Workflow
description: Comprehensive Model Context Protocol server development, testing, and deployment. Use when building custom MCP servers, debugging MCP integration, or extending the Miyabi MCP ecosystem.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🔌 MCP Server Development Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: MCP Server開発とエコシステム統合

---

## 📋 概要

Miyabi MCPエコシステムの開発・テスト・デプロイワークフロー。
カスタムMCPサーバー構築、172+ツール統合、Progressive Disclosure実装を管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| MCPサーバー作成 | "create mcp server", "new mcp tools" |
| MCP統合 | "integrate mcp", "mcp connection" |
| ツール追加 | "add mcp tool", "extend mcp functionality" |
| MCPデバッグ | "mcp error", "mcp not working", "tool not found" |
| MCP最適化 | "optimize mcp", "improve mcp performance" |
| MCP配布 | "deploy mcp", "publish mcp server" |

---

## 🔧 P1: MCP アーキテクチャ構成

### Miyabi MCP Ecosystem

```
Miyabi MCP Ecosystem (28 servers, 172+ tools)
├── miyabi-mcp-bundle/           # Main Bundle (Core 172 tools)
│   ├── git (19 tools)
│   ├── github (21 tools)
│   ├── docker (10 tools)
│   ├── network (15 tools)
│   ├── process (14 tools)
│   ├── tmux (10 tools)
│   └── [other categories]
├── miyabi-github/               # GitHub Integration
├── miyabi-tmux/                 # tmux Operations
├── miyabi-obsidian/             # Knowledge Management
├── gemini3-uiux-designer/       # AI Design
└── [24 other specialized servers]
```

### Progressive Disclosure Pattern

```typescript
// 推奨：段階的ツール発見
1. mcp_list_categories()                    // ~200 tokens
2. mcp_search_tools({ category: "docker" }) // Category内検索
3. mcp_get_tool_info({ tool: "docker_logs" }) // 具体的ツール詳細

// 禁止：全ツール一括取得
❌ mcp_list_all_tools()  // 172 tools = 大量のtoken消費
```

### 基本コマンド

```bash
# MCP開発
npm run mcp:dev          # 開発サーバー起動
npm run mcp:build        # MCPサーバービルド
npm run mcp:test         # MCPツールテスト
npm run mcp:docs         # ドキュメント生成

# 統合テスト
npm run mcp:integration  # Claude統合テスト
npm run mcp:validate     # スキーマ検証
```

---

## 🚀 P2: 開発フロー別パターン

### Pattern 1: 新規MCPサーバー作成

```bash
# 新しいMCPサーバー作成（5-10分）
mkdir mcp-servers/miyabi-custom-server
cd mcp-servers/miyabi-custom-server

# 基本構造セットアップ
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node tsx

# テンプレート生成
cat > src/index.ts << 'EOF'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Server initialization
const server = new Server(
  {
    name: 'miyabi-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Tool definitions
const tools = [
  {
    name: 'custom_tool',
    description: 'Custom tool description',
    inputSchema: {
      type: 'object',
      properties: {
        param: { type: 'string' }
      }
    }
  }
]

// Tool handlers
server.setRequestHandler('tools/list', async () => ({ tools }))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'custom_tool') {
    // Tool implementation
    return {
      content: [
        {
          type: 'text',
          text: `Tool executed with: ${args.param}`
        }
      ]
    }
  }

  throw new Error(`Unknown tool: ${name}`)
})

// Start server
const transport = new StdioServerTransport()
server.connect(transport)
EOF
```

### Pattern 2: Miyabi MCP Bundle拡張

```typescript
// src/index.ts - Tool追加パターン
import { MCPServer } from './types'
import { GitTools } from './categories/git'
import { CustomTools } from './categories/custom'  // 新カテゴリ

export class MiyabiMCPBundle {
  private tools: Map<string, Function>

  constructor() {
    this.tools = new Map()
    this.initializeTools()
  }

  private initializeTools() {
    // 既存カテゴリ
    const gitTools = new GitTools()
    const customTools = new CustomTools()  // 新規追加

    // ツール登録
    gitTools.getTools().forEach(tool => {
      this.tools.set(tool.name, tool.handler)
    })

    customTools.getTools().forEach(tool => {
      this.tools.set(tool.name, tool.handler)
    })
  }

  async handleTool(name: string, args: any) {
    const handler = this.tools.get(name)
    if (!handler) {
      throw new Error(`Tool not found: ${name}`)
    }

    return await handler(args)
  }
}
```

### Pattern 3: MCP統合テスト

```bash
# MCP統合テストフロー（2-5分）
# 1. サーバー起動
npm run mcp:dev &
MCP_PID=$!

# 2. 統合テスト実行
npm run test:integration

# 3. Claude Code接続テスト
echo '{"method": "tools/list"}' | node dist/index.js

# 4. クリーンアップ
kill $MCP_PID
```

### Pattern 4: MCPツールカテゴリ作成

```typescript
// src/categories/database.ts - 新カテゴリ例
export class DatabaseTools {
  getTools() {
    return [
      {
        name: 'db_query',
        description: 'Execute database query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            database: { type: 'string' }
          },
          required: ['query']
        },
        handler: this.executeQuery.bind(this)
      },
      {
        name: 'db_migrate',
        description: 'Run database migration',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['up', 'down']
            }
          }
        },
        handler: this.runMigration.bind(this)
      }
    ]
  }

  private async executeQuery(args: { query: string, database?: string }) {
    // Implementation
    const result = await this.queryDatabase(args.query, args.database)

    return {
      content: [
        {
          type: 'text',
          text: `Query executed: ${result.rows.length} rows returned`
        }
      ]
    }
  }

  private async runMigration(args: { direction: 'up' | 'down' }) {
    // Migration implementation
    const result = await this.executeMigration(args.direction)

    return {
      content: [
        {
          type: 'text',
          text: `Migration ${args.direction}: ${result.status}`
        }
      ]
    }
  }
}
```

### Pattern 5: MCP配布とデプロイ

```bash
# MCPサーバー配布準備（10-20分）
# 1. パッケージ設定
cat > package.json << 'EOF'
{
  "name": "miyabi-custom-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "miyabi-custom-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "files": ["dist/", "package.json", "README.md"],
  "keywords": ["mcp", "miyabi", "claude-code"]
}
EOF

# 2. ビルドとテスト
npm run build
npm pack

# 3. ローカルテスト
npm install -g ./miyabi-custom-mcp-server-1.0.0.tgz

# 4. Claude Code設定追加
cat >> ~/.claude/mcp.json << 'EOF'
{
  "servers": {
    "miyabi-custom": {
      "command": "miyabi-custom-mcp",
      "env": {}
    }
  }
}
EOF
```

---

## ⚡ P3: 最適化とベストプラクティス

### エラーハンドリング

```typescript
// 堅牢なエラーハンドリング
server.setRequestHandler('tools/call', async (request) => {
  try {
    const { name, arguments: args } = request.params

    // 入力バリデーション
    if (!name) {
      throw new Error('Tool name is required')
    }

    // レート制限
    await this.checkRateLimit(name)

    // ツール実行
    const result = await this.executeToolSafely(name, args)

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    }
  } catch (error) {
    // 構造化エラーレスポンス
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    }
  }
})
```

### パフォーマンス最適化

```typescript
// キャッシング戦略
class MCPCache {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private readonly TTL = 300000  // 5分

  async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.TTL) {
      return cached.data
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: now })
    return data
  }
}

// 非同期処理最適化
async executeToolsBatch(requests: ToolRequest[]) {
  const results = await Promise.allSettled(
    requests.map(req => this.executeTool(req.name, req.args))
  )

  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : result.reason
  }))
}
```

### セキュリティ

```typescript
// セキュリティバリデーション
class MCPSecurityValidator {
  validateToolAccess(toolName: string, context: any): boolean {
    // ツールアクセス制御
    const allowedTools = this.getAllowedTools(context.user)
    return allowedTools.includes(toolName)
  }

  sanitizeInput(input: any): any {
    // 入力サニタイゼーション
    if (typeof input === 'string') {
      return input.replace(/[<>\"'&]/g, '')
    }
    return input
  }

  validateSchema(data: any, schema: any): boolean {
    // スキーマバリデーション
    return this.ajv.validate(schema, data)
  }
}
```

---

## 📊 MCP統合パフォーマンス

### メトリクス目標

| 指標 | 目標値 | 必須値 |
|------|--------|--------|
| **ツール応答時間** | < 200ms | < 500ms |
| **起動時間** | < 2s | < 5s |
| **メモリ使用量** | < 100MB | < 200MB |
| **同期ツール数** | 172+ | 100+ |
| **エラー率** | < 1% | < 5% |

### 監視とログ

```typescript
// MCPメトリクス収集
class MCPMetrics {
  private metrics = {
    toolCalls: new Map<string, number>(),
    latencies: new Map<string, number[]>(),
    errors: new Map<string, number>()
  }

  recordToolCall(toolName: string, latency: number, success: boolean) {
    // 呼び出し回数
    this.metrics.toolCalls.set(
      toolName,
      (this.metrics.toolCalls.get(toolName) || 0) + 1
    )

    // レイテンシ
    if (!this.metrics.latencies.has(toolName)) {
      this.metrics.latencies.set(toolName, [])
    }
    this.metrics.latencies.get(toolName)!.push(latency)

    // エラー
    if (!success) {
      this.metrics.errors.set(
        toolName,
        (this.metrics.errors.get(toolName) || 0) + 1
      )
    }
  }

  generateReport() {
    return {
      totalCalls: Array.from(this.metrics.toolCalls.values()).reduce((a, b) => a + b, 0),
      averageLatency: this.calculateAverageLatency(),
      errorRate: this.calculateErrorRate(),
      topTools: this.getTopTools()
    }
  }
}
```

---

## 🛡️ トラブルシューティング

### 共通問題パターン

| 問題 | 症状 | 原因 | 対処 |
|------|------|------|------|
| Tool Not Found | MCPエラー | ツール未登録 | tools配列確認 |
| Schema Validation | 引数エラー | inputSchema不正 | スキーマ修正 |
| Connection Timeout | MCP接続失敗 | サーバー応答遅延 | タイムアウト調整 |
| Memory Leak | メモリ増加 | リソース未解放 | リソース管理見直し |
| Permission Denied | 実行エラー | 権限不足 | 実行権限確認 |

### デバッグワークフロー

```bash
# MCPデバッグ手順
function debug_mcp_server() {
    local server_name=$1

    echo "🔍 Debugging MCP Server: $server_name"

    # 1. サーバー起動ログ
    DEBUG=mcp:* npm run mcp:dev 2>&1 | tee debug.log

    # 2. ツール一覧確認
    echo '{"method": "tools/list"}' | node dist/index.js | jq .

    # 3. 特定ツールテスト
    echo '{"method": "tools/call", "params": {"name": "test_tool", "arguments": {}}}' | \
        node dist/index.js | jq .

    # 4. メモリ・CPU監視
    ps aux | grep "node.*$server_name"
    lsof -p $(pgrep -f "$server_name")

    echo "✅ Debug complete. Check debug.log for details."
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **ツール実行** | 全ツール正常動作 |
| **スキーマ検証** | 100% valid schema |
| **統合テスト** | Claude Code接続成功 |
| **パフォーマンス** | 目標値内応答 |
| **エラーハンドリング** | 適切なエラーメッセージ |

### 出力フォーマット

```
🔌 MCP Server Development Results

✅ Server: miyabi-custom-server v1.0.0
✅ Tools: XX tools registered successfully
✅ Schema: All schemas valid
✅ Integration: Claude Code connection ✓
✅ Performance: Avg response XXXms (target: <200ms)
✅ Quality: XX% test coverage

MCP Server ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `mcp-servers/README.md` | MCP開発ガイド |
| `.claude/mcp.json` | MCP設定ファイル |
| `docs/mcp-api-reference.md` | API仕様 |

---

## 📝 関連Skills

- **Multi-Project Workspace**: MCP横断管理
- **Testing Framework**: MCPテスト統合
- **CI/CD Pipeline**: MCP自動デプロイ
- **Environment Management**: MCP環境設定
- **Database Management**: DB-MCP統合