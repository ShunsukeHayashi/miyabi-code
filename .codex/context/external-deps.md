# External Dependencies - Context7 & MCP

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐

## 📚 Context7

**Model Context Protocol (MCP) サーバー** - 20,000以上のライブラリの最新ドキュメントを動的に取得

**開発元**: Upstash（オープンソース・無料）
**公式サイト**: https://context7.com/
**GitHub**: https://github.com/upstash/context7

### セットアップ

```bash
# Context7 MCPサーバー追加（初回のみ）
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY

# 設定確認
claude mcp list
```

**API Key取得**: [context7.com](https://context7.com/) でアカウント作成（無料）

### 使用方法

**Codexでの指示例**:
```
"Use context7 to get the latest Tokio async runtime documentation"
"Use context7 to get the latest SWE-bench Pro evaluation harness code"
"Use context7 to get the latest Rust serde_json API examples"
```

### 使用が必須のケース

✅ **必ず使用**:
- 公式ベンチマークハーネスのコード参照
- 外部ライブラリの実装パターン確認（Tokio, serde, octocrab等）
- フレームワーク固有の型定義参照
- 最新APIの仕様確認
- Docker設定ファイルの標準パターン取得

❌ **禁止事項**:
- コードの直接コピー&ペースト（ライセンス違反リスク）
- Context7なしでの外部コード再実装（古いAPI使用リスク）
- 公式ドキュメント無視の独自実装（再現性欠如リスク）

**詳細**: [core-rules.md](./core-rules.md) - Rule 3

---

## 🔌 利用可能なMCPサーバー

### 1. @modelcontextprotocol/server-github
**用途**: GitHub操作全般
- Issue/PR作成・更新
- リポジトリ情報取得
- Webhook管理

**設定例**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

### 2. @modelcontextprotocol/server-filesystem
**用途**: ファイルシステム操作
- ファイル読み書き
- ディレクトリ操作
- パス解決

### 3. context7
**用途**: 外部ライブラリドキュメント取得
- 20,000以上のライブラリ対応
- 最新APIドキュメント取得

### 4. miyabi-mcp-server（カスタム）
**用途**: Miyabi Agent実行
- Agent実行エンドポイント
- JSON-RPC 2.0プロトコル
- 6つのAgent実行メソッド

**詳細**: `crates/miyabi-mcp-server/src/lib.rs`

---

## 🔄 MCP First Approach

**Phase 0: MCP確認フロー（全タスク実行前に必須）**

```
タスク開始
    ↓
【Q1】既存MCPで実現可能か？
    ├─ Yes → 既存MCP活用 → 実装へ
    └─ No → Q2へ
    ↓
【Q2】新規MCP作成が有効か？
    ├─ Yes → 新規MCP作成 → 実装へ
    └─ No → 通常実装へ
```

### 確認コマンド

```bash
# インストール済みMCP確認
claude mcp list

# MCP設定ファイル確認
cat ~/.config/claude/claude_desktop_config.json
```

### MCP適合性判定

**MCPが適合するケース** (✅ MCP活用推奨):
- 外部APIへのアクセスが必要（GitHub, Slack, Notion等）
- データベース操作が必要（PostgreSQL, MongoDB等）
- ファイルシステム操作が複雑
- 既存のWebサービスとの連携
- 標準化されたプロトコルでの通信が必要

**MCPが不適合なケース** (❌ 通常実装):
- プロジェクト固有のビジネスロジック
- Rustクレート内部の実装
- パフォーマンスクリティカルな処理
- オフライン動作が必須

### ROI判定

```
MCP作成のROI = (再利用回数 × 節約時間) / MCP作成時間
ROI > 2.0 の場合は作成推奨
```

**詳細**: [core-rules.md](./core-rules.md) - Rule 1

---

## 🔗 Related Modules

- **Core Rules**: [core-rules.md](./core-rules.md) - MCP First & Context7ルール

## 📖 Detailed Documentation

- **MCP Integration Protocol**: `.codex/MCP_INTEGRATION_PROTOCOL.md` (完全仕様)
- **Benchmark Checklist**: `.codex/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`
- **MCP Server Implementation**: `crates/miyabi-mcp-server/src/lib.rs`
