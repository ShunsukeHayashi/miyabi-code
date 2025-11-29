# Miyabi Tool Search システム設計書

## 概要

Miyabiエコシステムは15以上のMCPサーバーを持ち、100以上のツールを提供しています。
Anthropic APIの新機能「Tool Search Tool」を活用し、コンテキスト効率とツール選択精度を最適化します。

## 現状分析

### 稼働中のMCPサーバー（15サーバー）

| サーバー名 | ツール数 | カテゴリ | 使用頻度 |
|-----------|---------|---------|---------|
| miyabi-git-inspector | 11 | 開発 | 高 |
| miyabi-tmux | 10 | セッション管理 | 高 |
| miyabi-log-aggregator | 6 | 監視 | 中 |
| miyabi-resource-monitor | 8 | システム | 中 |
| miyabi-network-inspector | 8 | ネットワーク | 低 |
| miyabi-process-inspector | 8 | プロセス | 低 |
| miyabi-file-watcher | 6 | ファイル | 中 |
| miyabi-claude-code | 8 | Claude | 高 |
| miyabi-github | 12 | GitHub | 高 |
| miyabi-rules | 5 | ルール | 中 |
| miyabi-obsidian | 9 | ナレッジ | 中 |
| gemini3-adaptive-runtime | 5+ | AI | 低 |
| gemini3-uiux-designer | 9 | デザイン | 低 |
| lark-wiki-agents | 10+ | Lark | 中 |
| miyabi-commercial-agents | 8 | マーケティング | 低 |

**推定総ツール数: 110-130ツール**

### 現在の課題

1. **コンテキスト消費**: 全ツール定義で約20-30Kトークン消費
2. **ツール選択精度**: 100+ツールでは選択精度が低下
3. **起動時間**: 全MCPサーバー接続に時間がかかる

## Tool Search Tool 導入設計

### 1. ツールの優先度分類

#### 🟢 Always Loaded（常時読み込み・非deferred）
最も頻繁に使用されるコアツール（5-10個）

```typescript
const ALWAYS_LOADED_TOOLS = [
  // 基本操作
  "miyabi:git_status",
  "miyabi:git_log",
  "miyabi:execute_agent",
  
  // ファイル操作
  "Filesystem:read_file",
  "Filesystem:write_file",
  "Filesystem:list_directory",
  
  // セッション管理
  "miyabi-tmux:tmux_list_sessions",
  "miyabi-tmux:tmux_send_message",
  
  // GitHub基本
  "miyabi-github:github_list_issues",
  "miyabi-github:github_create_issue",
];
```

#### 🟡 Deferred by Category（カテゴリ別遅延読み込み）
使用時のみ読み込み

```typescript
const DEFERRED_CATEGORIES = {
  // 開発ツール
  development: [
    "miyabi-git-inspector:*",
    "miyabi-github:github_*_pr",
    "miyabi-github:github_merge_*",
  ],
  
  // 監視・診断
  monitoring: [
    "miyabi-log-aggregator:*",
    "miyabi-resource-monitor:*",
    "miyabi-network-inspector:*",
    "miyabi-process-inspector:*",
  ],
  
  // ナレッジ管理
  knowledge: [
    "miyabi-obsidian:*",
    "miyabi-rules:*",
  ],
  
  // AI/デザイン
  ai_design: [
    "gemini3-*:*",
  ],
  
  // マーケティング
  marketing: [
    "miyabi-commercial-agents:*",
  ],
  
  // Lark統合
  lark: [
    "lark-wiki-agents:*",
  ],
};
```

### 2. Tool Search MCPサーバー実装

新しいMCPサーバー `miyabi-tool-search` を作成：

```
mcp-servers/
└── miyabi-tool-search/
    ├── src/
    │   ├── index.ts           # サーバーエントリ
    │   ├── tool-catalog.ts    # ツールカタログ管理
    │   ├── search-engine.ts   # BM25/Regex検索実装
    │   └── embeddings.ts      # (将来) セマンティック検索
    ├── data/
    │   └── tool-definitions.json  # 全ツール定義キャッシュ
    └── package.json
```

### 3. ツールカタログ構造

```typescript
interface ToolCatalog {
  tools: ToolDefinition[];
  categories: CategoryMapping;
  searchIndex: SearchIndex;
  metadata: {
    lastUpdated: string;
    totalTools: number;
    version: string;
  };
}

interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  server: string;
  inputSchema: object;
  defer_loading: boolean;
  keywords: string[];  // 検索用キーワード
  usage_frequency: "high" | "medium" | "low";
}
```

### 4. 検索戦略

#### Regex検索パターン例
```python
# カテゴリベース
"git_.*|github_.*"           # Git関連全て
"(?i)issue|pr|pull"          # Issue/PR関連
"resource_.*|process_.*"     # システム監視
"obsidian_.*|search"         # ナレッジ検索
```

#### BM25自然言語クエリ例
```
"GitHubでPRを作成したい"
"システムリソースを確認"
"Larkドキュメントを検索"
```

### 5. 実装フェーズ

#### Phase 1: ツールカタログ作成（1日）
- [ ] 全MCPサーバーからツール定義を収集
- [ ] カテゴリ分類とキーワード付与
- [ ] JSON形式でエクスポート

#### Phase 2: Tool Search Server実装（2日）
- [ ] MCPサーバー基盤構築
- [ ] Regex検索実装
- [ ] BM25検索実装
- [ ] tool_referenceブロック生成

#### Phase 3: 統合テスト（1日）
- [ ] Claude APIとの連携テスト
- [ ] defer_loading動作確認
- [ ] パフォーマンス測定

#### Phase 4: 最適化（継続的）
- [ ] 使用頻度に基づく分類調整
- [ ] セマンティック検索追加（埋め込みベース）
- [ ] キャッシュ戦略最適化

## API使用例

### リクエスト例
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 2048,
  "tools": [
    {
      "type": "tool_search_tool_bm25_20251119",
      "name": "tool_search"
    },
    {
      "type": "mcp_toolset",
      "mcp_server_name": "miyabi-github",
      "default_config": { "defer_loading": true },
      "configs": {
        "github_list_issues": { "defer_loading": false },
        "github_create_issue": { "defer_loading": false }
      }
    },
    {
      "type": "mcp_toolset",
      "mcp_server_name": "miyabi-git-inspector",
      "default_config": { "defer_loading": true },
      "configs": {
        "git_status": { "defer_loading": false }
      }
    }
    // ... 他のMCPサーバー
  ],
  "messages": [...]
}
```

### レスポンス例
```json
{
  "content": [
    {
      "type": "server_tool_use",
      "id": "srvtoolu_01ABC",
      "name": "tool_search",
      "input": { "query": "create pull request github" }
    },
    {
      "type": "tool_result",
      "tool_use_id": "srvtoolu_01ABC",
      "content": [
        { "type": "tool_reference", "tool_name": "github_create_pr" },
        { "type": "tool_reference", "tool_name": "github_list_prs" }
      ]
    },
    {
      "type": "tool_use",
      "id": "toolu_01XYZ",
      "name": "github_create_pr",
      "input": { "title": "New feature", "head": "feature-branch" }
    }
  ]
}
```

## 期待される効果

| 指標 | 現状 | 目標 |
|-----|------|------|
| コンテキスト消費 | 20-30K tokens | 5-10K tokens |
| ツール選択精度 | ~70% | 90%+ |
| 初回応答時間 | 遅い | 改善 |
| スケーラビリティ | 100ツール限界 | 1000+ツール対応可能 |

## 次のステップ

1. **今すぐ**: ツールカタログJSONを生成
2. **今週中**: miyabi-tool-search MCPサーバー実装
3. **来週**: Claude Desktop設定の更新とテスト

## 参考リンク

- [Anthropic Tool Search Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/tool-search)
- [MCP Server SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---
作成日: 2025-11-29
バージョン: 1.0.0
