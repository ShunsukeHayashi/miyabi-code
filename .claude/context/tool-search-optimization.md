# Tool Search コンテキスト最適化ガイド

**Version**: 1.0
**Last Updated**: 2025-11-29
**Status**: 実装完了・defer_loading待ち

---

## 概要

miyabi-tool-searchは、Anthropic Tool Search API仕様に準拠したコンテキスト最適化MCPサーバーです。105ツールのカタログ化とオンデマンド検索により、**理論上95%のトークン削減**が可能です。

---

## 現状

### 問題点

Claude Codeは起動時に全MCPツール定義をシステムプロンプトに含めます：

```
146ツール × 300 tokens/tool = 43,800 tokens
```

これは初期コンテキストの約82%を占め、以下の問題を引き起こします：
- 高コスト（Opus 4.5: $0.795/セッション）
- 遅いレスポンス
- 有効コンテキスト枠の圧迫

### 解決策

miyabi-tool-searchによる遅延ロード：
- 常時ロード: 7ツール（高頻度使用）
- 遅延ロード: 98ツール（オンデマンド検索）

---

## 使用方法

### 1. ツール検索

```typescript
// 自然言語検索
mcp__miyabi-tool-search__search_tools({
  query: "create github issue",
  type: "bm25",
  limit: 5
})

// パターン検索
mcp__miyabi-tool-search__search_tools({
  query: "github_.*",
  type: "regex"
})

// カテゴリ指定
mcp__miyabi-tool-search__search_tools({
  query: "code review",
  category: "development"
})
```

### 2. 統計確認

```typescript
mcp__miyabi-tool-search__get_catalog_stats()
// → totalTools, bySource, byPriority, byCategory
```

### 3. 常時ロードツール確認

```typescript
mcp__miyabi-tool-search__get_always_loaded_tools()
// → 7ツールの一覧
```

---

## 常時ロードツール（7個）

| ツール | サーバー | 理由 |
|--------|----------|------|
| `obsidian_read_document` | miyabi-obsidian | ナレッジアクセス必須 |
| `obsidian_search` | miyabi-obsidian | 検索必須 |
| `tmux_list_sessions` | miyabi-tmux | Agent管理必須 |
| `tmux_send_message` | miyabi-tmux | Agent通信必須 |
| `github_list_issues` | miyabi-github | Issue管理必須 |
| `github_get_issue` | miyabi-github | Issue詳細必須 |
| `github_create_issue` | miyabi-github | Issue作成必須 |

---

## カテゴリ別ツール数

| カテゴリ | 数 | 主なツール |
|----------|-----|------------|
| development | 45 | GitHub, Gemini3, A2A, Sub-agents |
| ai_design | 16 | tmux, deep_reasoning, wireframe |
| monitoring | 15 | logs, resources, process |
| knowledge | 12 | Obsidian, search |
| file_operations | 4 | read, write, list, search |
| business | 3 | CRM, Sales, Marketing |
| rust_agents | 3 | Coordinator, Deployment |
| other | 7 | misc |

---

## Before / After

| 指標 | Before | After | 削減 |
|------|--------|-------|------|
| ロードツール | 146 | 7 | 95% |
| トークン | 43,800 | 2,100 | 95% |
| コスト/session | $0.795 | $0.167 | 79% |
| 初回レスポンス | ~3.5s | ~1.5s | 57% |

---

## ブロッカー

### Claude Code側のdefer_loading対応

現在、Claude Codeは`defer_loading`フラグを認識しません。MCPサーバーのtool定義に以下を追加済みですが、効果は発揮されていません：

```json
{
  "name": "some_tool",
  "description": "...",
  "defer_loading": true  // 現在無視される
}
```

**対応待ち**: Anthropicがdefer_loading機能をClaude Codeに実装次第、即座に効果を発揮します。

---

## セッション起動時の最適化

### 推奨設定（.claude/settings.json）

```json
{
  "contextOptimization": {
    "enableToolSearch": true,
    "alwaysLoadedTools": [
      "obsidian_read_document",
      "obsidian_search",
      "tmux_list_sessions",
      "tmux_send_message",
      "github_list_issues",
      "github_get_issue",
      "github_create_issue"
    ],
    "deferOtherTools": true
  }
}
```

### フック設定（将来対応）

セッション開始時に自動でコンテキスト最適化レポートを表示：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/context-optimization-check.sh"
      }
    ]
  }
}
```

---

## 関連コマンド

- `/context-stats` - コンテキスト統計表示
- `/verify` - システム動作確認（Tool Search含む）

---

## 参照

- `mcp-servers/miyabi-tool-search/` - 実装
- `mcp-servers/MIYABI_TOOL_SEARCH_DESIGN.md` - 設計ドキュメント
- Obsidian: `reports/2025-11-29-tool-search-context-optimization-report.md`
