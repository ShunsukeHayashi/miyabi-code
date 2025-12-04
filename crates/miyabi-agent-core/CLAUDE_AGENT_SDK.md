# Claude Agent SDK for Miyabi

Miyabi の Claude Agent SDK は、Claude Code スタイルのエージェント機能を Rust で実装したものです。サンドボックス実行、チェックポイント/リワインド、サブエージェント並列実行、tmux 統合、MCP サーバー連携をサポートします。

## 📦 モジュール構成

```
miyabi-agent-core/
├── sandbox.rs           # サンドボックス実行環境
├── checkpoint.rs        # チェックポイント/リワインド機能
├── checkpoint_storage.rs # ストレージバックエンド
├── subagent.rs          # サブエージェントランタイム
├── tmux_integration.rs  # tmux連携
└── mcp_server.rs        # MCPサーバー定義
```

## 🔒 Sandbox モジュール

エージェントを分離された環境で実行するためのサンドボックス機能。

### 使用例

```rust
use miyabi_agent_core::sandbox::{
    SandboxConfig, SandboxManager, PermissionLevel, NetworkPolicy, FilesystemPolicy
};
use std::path::PathBuf;

// 標準設定でサンドボックス作成
let config = SandboxConfig::standard("my-agent", PathBuf::from("/tmp/sandbox"));

// カスタム設定
let custom = SandboxConfig {
    id: uuid::Uuid::new_v4().to_string(),
    agent_name: "custom-agent".to_string(),
    permission_level: PermissionLevel::Strict,
    network_policy: NetworkPolicy::AllowList(vec!["api.anthropic.com".to_string()]),
    filesystem_policy: FilesystemPolicy::default(),
    resource_limits: ResourceLimits::default(),
    working_dir: PathBuf::from("/tmp/work"),
    env_allowlist: vec!["RUST_LOG".to_string()],
    env_vars: HashMap::new(),
    audit_enabled: true,
};

let manager = SandboxManager::new(config);
```

### パーミッションレベル

| レベル | 説明 |
|--------|------|
| `Unrestricted` | 制限なし（危険モード） |
| `Standard` | 標準的な制限、プロンプト確認あり |
| `Strict` | 最小限のパーミッション |
| `Custom` | カスタム設定 |

### ネットワークポリシー

- `AllowAll` - すべてのネットワークアクセスを許可
- `DenyAll` - すべてのネットワークアクセスを拒否
- `AllowList(Vec<String>)` - 指定ドメインのみ許可
- `DenyList(Vec<String>)` - 指定ドメインを拒否

## 💾 Checkpoint モジュール

エージェントの状態を保存・復元するためのチェックポイント機能。

### 使用例

```rust
use miyabi_agent_core::checkpoint::{
    CheckpointManager, CheckpointConfig, AutoSaveConfig
};
use miyabi_agent_core::checkpoint_storage::StorageFactory;

// ローカルストレージでチェックポイントマネージャー作成
let storage = StorageFactory::local("/tmp/checkpoints").await?;

// オートセーブ設定
let auto_save = AutoSaveConfig {
    enabled: true,
    interval_seconds: 300,  // 5分ごと
    max_auto_saves: 10,
    on_file_change: true,
    before_risky_ops: true,
};
```

### ストレージバックエンド

```rust
// ローカルファイルシステム
let local = StorageFactory::local("/path/to/checkpoints").await?;

// S3互換ストレージ
let s3 = StorageFactory::s3(
    S3Config {
        region: "us-east-1".to_string(),
        endpoint: Some("https://s3.amazonaws.com".to_string()),
        ..Default::default()
    },
    "my-bucket",
    "miyabi/checkpoints"
);

// インメモリ（テスト用）
let memory = StorageFactory::memory();
```

## 🤖 Subagent モジュール

複数エージェントの並列実行を管理するランタイム。

### 使用例

```rust
use miyabi_agent_core::subagent::{
    SubagentConfig, AgentType, SubagentRuntime, ResourceAllocation
};

// エージェント設定
let config = SubagentConfig {
    name: "codegen-agent".to_string(),
    agent_type: AgentType::CodeGen,
    timeout_seconds: 120,
    max_retries: 3,
    resources: ResourceAllocation {
        cpu_cores: 2.0,
        memory_mb: 1024,
        disk_mb: 2048,
        network_access: true,
    },
    environment: HashMap::new(),
    working_directory: Some("/tmp/agent".to_string()),
    depends_on: vec![],
};
```

### エージェントタイプ

| タイプ | 説明 |
|--------|------|
| `CodeGen` | コード生成 |
| `Reviewer` | コードレビュー |
| `Tester` | テスト実行 |
| `Deployer` | デプロイメント |
| `Coordinator` | 調整・オーケストレーション |
| `Researcher` | 調査・リサーチ |
| `Documenter` | ドキュメント作成 |
| `Custom(String)` | カスタムタイプ |

## 🖥️ Tmux Integration

tmux セッション内でエージェントを管理する機能。

### 使用例

```rust
use miyabi_agent_core::tmux_integration::{
    TmuxOrchestrator, TmuxOrchestratorBuilder, TmuxSessionConfig
};

// ビルダーパターンで作成
let orchestrator = TmuxOrchestratorBuilder::new()
    .session_name("miyabi-agents")
    .window_count(2)
    .panes_per_window(4)
    .working_dir("/home/user/project")
    .env_var("RUST_LOG", "debug")
    .build();

// 初期化
orchestrator.initialize().await?;

// エージェントをスポーン
let agent_id = orchestrator.spawn_agent(config).await?;

// コマンド送信
orchestrator.send_command(agent_id, "cargo test").await?;

// 出力キャプチャ
let output = orchestrator.capture_output(agent_id, 50).await?;

// ブロードキャスト
orchestrator.broadcast(agent_id, "Task completed!").await?;
```

## 🔌 MCP Server

Model Context Protocol サーバーの定義。Claude Code などの外部ツールとの連携に使用。

### 利用可能なツール

```rust
use miyabi_agent_core::mcp_server::AgentSdkMcpTools;

let tools = AgentSdkMcpTools::list_tools();
// 15+ ツール:
// - sandbox_create, sandbox_destroy
// - checkpoint_create, checkpoint_restore, checkpoint_list
// - subagent_spawn, subagent_status, subagent_stop, subagent_list
// - workflow_create, workflow_execute
// - tmux_spawn_agent, tmux_send_command, tmux_capture_output, tmux_broadcast
```

### MCP リソース

```rust
let resources = AgentSdkMcpTools::list_resources();
// - agent://sandbox/list
// - agent://checkpoint/history
// - agent://subagent/status
// - agent://workflow/list
// - agent://tmux/sessions
// - agent://metrics
```

### MCP プロンプト

```rust
let prompts = AgentSdkMcpTools::list_prompts();
// - create_coding_workflow
// - parallel_research
// - safe_refactor
// - deploy_pipeline
```

### サーバー設定

```rust
use miyabi_agent_core::mcp_server::{McpServerConfig, McpTransport};

let config = McpServerConfig {
    name: "miyabi-agent-sdk".to_string(),
    version: "0.1.0".to_string(),
    transport: McpTransport::Stdio,  // または Http/WebSocket
    capabilities: McpCapabilities::default(),
};
```

## 📊 アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Claude Code                       │
│                        ↓                             │
│                   MCP Protocol                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                 MCP Server                           │
│  (mcp_server.rs)                                    │
│  - Tools: sandbox, checkpoint, subagent, workflow   │
│  - Resources: status, metrics                       │
│  - Prompts: workflows                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Tmux Orchestrator                       │
│  (tmux_integration.rs)                              │
│  - Session/Window/Pane management                   │
│  - Agent-to-pane mapping                            │
│  - Inter-agent messaging                            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│               Subagent Runtime                       │
│  (subagent.rs)                                      │
│  - Parallel execution                               │
│  - Task distribution                                │
│  - Resource allocation                              │
└─────────────────────────────────────────────────────┘
          ↓                       ↓
┌─────────────────┐    ┌─────────────────────────────┐
│    Sandbox      │    │       Checkpoint            │
│  (sandbox.rs)   │    │  (checkpoint.rs)            │
│  - Isolation    │    │  - State snapshot           │
│  - Permissions  │    │  - Rewind/Restore           │
│  - Resources    │    │  - Auto-save                │
└─────────────────┘    └─────────────────────────────┘
                                  ↓
                       ┌─────────────────────────────┐
                       │   Checkpoint Storage        │
                       │  (checkpoint_storage.rs)    │
                       │  - Local filesystem         │
                       │  - S3 compatible            │
                       │  - In-memory (test)         │
                       └─────────────────────────────┘
```

## 🧪 テスト

```bash
# 統合テスト実行
cargo test -p miyabi-agent-core integration_test

# 全テスト実行
cargo test -p miyabi-agent-core
```

## 📝 ライセンス

Miyabi プロジェクトのライセンスに準拠します。

## 🔗 関連リンク

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Miyabi Project](https://github.com/customer-cloud/miyabi-private)
