# Miyabi Agent SDK for Claude Code

Claude Agent SDK の Miyabi 実装。Claude Code から Miyabi の 21 エージェントをオーケストレーションできます。

## 🚀 クイックスタート

### 1. ビルド

```bash
cd miyabi-private
cargo build --release -p miyabi-agent-core --bin mcp-server
```

### 2. Claude Code 設定

`~/.config/claude-code/mcp.json` に追加:

```json
{
  "mcpServers": {
    "miyabi-agent-sdk": {
      "command": "/path/to/miyabi-private/target/release/mcp-server",
      "args": []
    }
  }
}
```

### 3. 使用開始

Claude Code で以下のツールが利用可能になります:

## 🛠️ 利用可能なMCPツール

| ツール | 説明 |
|--------|------|
| `miyabi_agent_spawn` | 新しいエージェントを起動 |
| `miyabi_agent_list` | 実行中のエージェント一覧 |
| `miyabi_agent_execute` | エージェントにコマンド送信 |
| `miyabi_workflow_dev` | 開発ワークフロー起動 (7エージェント) |
| `miyabi_workflow_business` | ビジネスワークフロー起動 (14エージェント) |
| `miyabi_checkpoint_save` | チェックポイント保存 |
| `miyabi_checkpoint_restore` | チェックポイント復元 |
| `miyabi_broadcast` | 全エージェントにメッセージ送信 |
| `miyabi_system_status` | システム状態確認 |

## 🤖 21 Miyabi エージェント

### 開発エージェント (7種)

| エージェント | 日本語名 | 役割 |
|-------------|---------|------|
| coordinator | 指揮官 (しきろーん) | ワークフロー管理 |
| codegen | 作ろーん (つくろーん) | コード生成 |
| review | 目玉マン (めだまん) | コードレビュー |
| issue | 見つけろーん | Issue管理 |
| pr | まとめろーん | PR管理 |
| deploy | 運ぼーん (はこぼーん) | デプロイ |
| refresher | 繋軍 (つなぐん) | 状態同期 |

### ビジネスエージェント (14種)

| エージェント | 役割 |
|-------------|------|
| ai_entrepreneur | AI起業家 |
| self_analysis | 自己分析 |
| market_research | 市場調査 |
| persona | ペルソナ設計 |
| product_concept | 商品コンセプト |
| product_design | 商品設計 |
| content_creation | コンテンツ制作 |
| funnel_design | ファネル設計 |
| sns_strategy | SNS戦略 |
| marketing | マーケティング |
| sales | セールス |
| crm | CRM |
| analytics | アナリティクス |
| youtube | YouTube |

## 📁 モジュール構成

```
crates/miyabi-agent-core/
├── src/
│   ├── sandbox.rs          # 分離実行環境
│   ├── checkpoint.rs       # 状態スナップショット
│   ├── checkpoint_storage.rs # ストレージバックエンド
│   ├── subagent.rs         # 並列エージェントランタイム
│   ├── tmux_integration.rs # tmuxオーケストレーション
│   ├── miyabi_adapter.rs   # 21エージェントアダプター
│   ├── mcp_server.rs       # MCPサーバー基盤
│   ├── mcp_claude_code.rs  # Claude Code連携
│   ├── benchmark.rs        # ベンチマークツール
│   └── bin/
│       ├── mcp-server.rs   # MCPサーバー実行ファイル
│       └── benchmark.rs    # ベンチマークCLI
├── tests/
│   └── integration_test.rs
├── claude-code-mcp.json    # MCP設定ファイル
└── CLAUDE_AGENT_SDK.md     # 詳細ドキュメント
```

## 📊 ベンチマーク

```bash
# クイックベンチマーク
cargo run --release -p miyabi-agent-core --bin benchmark -- --mode quick

# フルベンチマーク
cargo run --release -p miyabi-agent-core --bin benchmark -- --mode full

# ヘルスチェック
cargo run --release -p miyabi-agent-core --bin benchmark -- --mode health
```

### 結果例

```
📊 Quick Benchmark
✓ Agent enumeration (10k): ~253µs
✓ Config creation (1k): ~93µs
✓ JSON serialization (1k): ~240µs

📊 Full Benchmark
✓ Dev workflow (7 agents): ~70ms
✓ Business workflow (14 agents): ~141ms
```

## 🔧 開発

### テスト実行

```bash
cargo test -p miyabi-agent-core
```

### MCPサーバーテスト

```bash
# initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | ./target/release/mcp-server

# tools/list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | ./target/release/mcp-server

# tools/call
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"miyabi_workflow_dev","arguments":{"project_name":"test"}}}' | ./target/release/mcp-server
```

## 📜 ライセンス

Proprietary - Miyabi Private
