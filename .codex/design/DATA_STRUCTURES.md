# Codex改装プロジェクト - データ構造設計書

**Version**: 1.0.0
**Date**: 2025-11-06
**Status**: Phase 1 - 設計整理
**Author**: カエデ (CodeGenAgent)

---

## 🎯 概要

Codex改装プロジェクトで必要となるデータ構造の詳細設計を定義します。

---

## 1. agents_store.json - Agent実行履歴・ステータス管理

### 目的

- Agent実行の永続化
- 実行履歴の追跡
- ステータス管理
- メタデータの保存

### JSONスキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agents Store",
  "description": "Miyabi Agent実行履歴とステータス管理",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "スキーマバージョン"
    },
    "last_updated": {
      "type": "string",
      "format": "date-time",
      "description": "最終更新日時 (ISO 8601)"
    },
    "agents": {
      "type": "object",
      "patternProperties": {
        "^[A-Za-z]+Agent$": {
          "$ref": "#/definitions/AgentData"
        }
      },
      "description": "Agent名をキーとしたAgent data"
    }
  },
  "required": ["version", "last_updated", "agents"],
  "definitions": {
    "AgentData": {
      "type": "object",
      "properties": {
        "agent_id": {
          "type": "string",
          "description": "Agent ID (例: CoordinatorAgent)"
        },
        "character_name": {
          "type": "string",
          "description": "キャラクター名 (例: カンナ)"
        },
        "status": {
          "type": "string",
          "enum": ["idle", "running", "success", "failed", "error"],
          "description": "現在のステータス"
        },
        "last_execution": {
          "$ref": "#/definitions/ExecutionRecord"
        },
        "execution_history": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionRecord"
          },
          "maxItems": 100,
          "description": "過去100件の実行履歴"
        },
        "statistics": {
          "$ref": "#/definitions/Statistics"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true,
          "description": "追加メタデータ"
        }
      },
      "required": ["agent_id", "character_name", "status"]
    },
    "ExecutionRecord": {
      "type": "object",
      "properties": {
        "execution_id": {
          "type": "string",
          "format": "uuid",
          "description": "実行ID (UUID)"
        },
        "issue_number": {
          "type": "integer",
          "minimum": 1,
          "description": "対象Issue番号"
        },
        "start_time": {
          "type": "string",
          "format": "date-time",
          "description": "開始日時"
        },
        "end_time": {
          "type": "string",
          "format": "date-time",
          "description": "終了日時"
        },
        "duration_ms": {
          "type": "integer",
          "minimum": 0,
          "description": "実行時間 (ミリ秒)"
        },
        "status": {
          "type": "string",
          "enum": ["success", "failed", "error", "timeout"],
          "description": "実行ステータス"
        },
        "exit_code": {
          "type": "integer",
          "description": "終了コード"
        },
        "error_message": {
          "type": "string",
          "description": "エラーメッセージ (失敗時)"
        },
        "worktree_path": {
          "type": "string",
          "description": "Worktreeパス"
        },
        "artifacts": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "生成された成果物のパス"
        },
        "logs": {
          "type": "object",
          "properties": {
            "stdout": {
              "type": "string",
              "description": "標準出力ログファイルパス"
            },
            "stderr": {
              "type": "string",
              "description": "標準エラーログファイルパス"
            }
          }
        }
      },
      "required": ["execution_id", "start_time", "status"]
    },
    "Statistics": {
      "type": "object",
      "properties": {
        "total_executions": {
          "type": "integer",
          "minimum": 0,
          "description": "総実行回数"
        },
        "success_count": {
          "type": "integer",
          "minimum": 0,
          "description": "成功回数"
        },
        "failed_count": {
          "type": "integer",
          "minimum": 0,
          "description": "失敗回数"
        },
        "error_count": {
          "type": "integer",
          "minimum": 0,
          "description": "エラー回数"
        },
        "average_duration_ms": {
          "type": "number",
          "minimum": 0,
          "description": "平均実行時間 (ミリ秒)"
        },
        "success_rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "成功率 (0.0 - 1.0)"
        }
      },
      "required": ["total_executions", "success_count", "failed_count", "error_count"]
    }
  }
}
```

### サンプルデータ

```json
{
  "version": "1.0.0",
  "last_updated": "2025-11-06T12:00:00Z",
  "agents": {
    "CoordinatorAgent": {
      "agent_id": "CoordinatorAgent",
      "character_name": "カンナ",
      "status": "idle",
      "last_execution": {
        "execution_id": "550e8400-e29b-41d4-a716-446655440000",
        "issue_number": 749,
        "start_time": "2025-11-06T11:00:00Z",
        "end_time": "2025-11-06T11:05:00Z",
        "duration_ms": 300000,
        "status": "success",
        "exit_code": 0,
        "worktree_path": ".worktrees/issue-749",
        "artifacts": [
          ".ai/reports/issue-749-orchestration-sync-report.md"
        ],
        "logs": {
          "stdout": ".ai/logs/coordinator-749-stdout.log",
          "stderr": ".ai/logs/coordinator-749-stderr.log"
        }
      },
      "execution_history": [],
      "statistics": {
        "total_executions": 1,
        "success_count": 1,
        "failed_count": 0,
        "error_count": 0,
        "average_duration_ms": 300000,
        "success_rate": 1.0
      },
      "metadata": {
        "tmux_pane": "%1",
        "last_issue": 749
      }
    },
    "CodeGenAgent": {
      "agent_id": "CodeGenAgent",
      "character_name": "カエデ",
      "status": "running",
      "last_execution": {
        "execution_id": "660e8400-e29b-41d4-a716-446655440001",
        "issue_number": 750,
        "start_time": "2025-11-06T12:00:00Z",
        "status": "success"
      },
      "execution_history": [],
      "statistics": {
        "total_executions": 0,
        "success_count": 0,
        "failed_count": 0,
        "error_count": 0
      },
      "metadata": {
        "tmux_pane": "%2"
      }
    }
  }
}
```

---

## 2. hooks-config.json - フック設定管理

### 目的

- イベント駆動型フックの設定
- コマンド実行定義
- タイムアウト管理

### JSONスキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Hooks Configuration",
  "description": "Claude Code フック設定",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "スキーマバージョン"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "フックシステムの有効/無効"
    },
    "hooks": {
      "type": "object",
      "patternProperties": {
        "^[a-z_]+$": {
          "$ref": "#/definitions/HookDefinition"
        }
      },
      "description": "イベント名をキーとしたフック定義"
    }
  },
  "required": ["version", "hooks"],
  "definitions": {
    "HookDefinition": {
      "type": "object",
      "properties": {
        "event": {
          "type": "string",
          "enum": [
            "session_start",
            "session_end",
            "tool_before",
            "tool_after",
            "agent_start",
            "agent_complete",
            "agent_error",
            "user_prompt_submit"
          ],
          "description": "フックイベント種別"
        },
        "enabled": {
          "type": "boolean",
          "default": true,
          "description": "このフックの有効/無効"
        },
        "command": {
          "type": "string",
          "description": "実行するコマンド (絶対パスまたは相対パス)"
        },
        "args": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "コマンド引数 (テンプレート変数使用可能)"
        },
        "env": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
          "description": "環境変数"
        },
        "timeout_ms": {
          "type": "integer",
          "minimum": 0,
          "maximum": 300000,
          "default": 30000,
          "description": "タイムアウト時間 (ミリ秒、最大5分)"
        },
        "async": {
          "type": "boolean",
          "default": false,
          "description": "非同期実行（trueの場合、完了を待たない）"
        },
        "on_error": {
          "type": "string",
          "enum": ["ignore", "warn", "fail"],
          "default": "warn",
          "description": "エラー時の動作"
        },
        "conditions": {
          "type": "object",
          "properties": {
            "tool_names": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "対象ツール名リスト (tool_before/tool_after用)"
            },
            "agent_types": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "対象Agent種別リスト (agent_*用)"
            }
          },
          "description": "フック実行条件"
        }
      },
      "required": ["event", "command"]
    }
  }
}
```

### サンプルデータ

```json
{
  "version": "1.0.0",
  "enabled": true,
  "hooks": {
    "auto_format": {
      "event": "tool_after",
      "enabled": true,
      "command": ".codex/hooks/auto-format.sh",
      "args": ["${file_path}"],
      "env": {
        "NODE_ENV": "development"
      },
      "timeout_ms": 10000,
      "async": false,
      "on_error": "warn",
      "conditions": {
        "tool_names": ["Write", "Edit"]
      }
    },
    "log_commands": {
      "event": "tool_after",
      "enabled": true,
      "command": ".codex/hooks/log-commands.sh",
      "args": ["${tool_name}", "${timestamp}"],
      "timeout_ms": 5000,
      "async": true,
      "on_error": "ignore"
    },
    "agent_notify": {
      "event": "agent_complete",
      "enabled": true,
      "command": ".codex/hooks/agent-event.sh",
      "args": ["complete", "${agent_type}", "${issue_number}"],
      "timeout_ms": 15000,
      "async": true,
      "on_error": "warn",
      "conditions": {
        "agent_types": ["CoordinatorAgent", "CodeGenAgent", "ReviewAgent"]
      }
    },
    "session_init": {
      "event": "session_start",
      "enabled": true,
      "command": "echo",
      "args": ["[Codex] Session started at ${timestamp}"],
      "timeout_ms": 1000,
      "async": false,
      "on_error": "ignore"
    }
  }
}
```

### テンプレート変数

フック設定の `args` および `env` で使用可能な変数:

| 変数 | 説明 | 例 |
|------|------|-----|
| `${tool_name}` | 実行されたツール名 | `Write`, `Edit`, `Bash` |
| `${file_path}` | 操作対象ファイルパス | `/path/to/file.rs` |
| `${timestamp}` | ISO 8601形式のタイムスタンプ | `2025-11-06T12:00:00Z` |
| `${agent_type}` | Agent種別 | `CoordinatorAgent` |
| `${issue_number}` | Issue番号 | `749` |
| `${execution_id}` | 実行ID (UUID) | `550e8400-e29b-...` |
| `${session_id}` | セッションID | `session-20251106-120000` |

---

## 3. tools-config.yaml - ツール定義管理

### 目的

- カスタムツールの定義
- MCPツールの統合
- ツールメタデータ管理

### YAMLスキーマ

```yaml
$schema: http://json-schema.org/draft-07/schema#
title: Tools Configuration
description: Claude Code カスタムツール定義
type: object
properties:
  version:
    type: string
    pattern: ^[0-9]+\.[0-9]+\.[0-9]+$
    description: スキーマバージョン
  tools:
    type: object
    patternProperties:
      ^[a-z_]+$:
        $ref: '#/definitions/ToolDefinition'
    description: ツール名をキーとしたツール定義
required:
  - version
  - tools
definitions:
  ToolDefinition:
    type: object
    properties:
      name:
        type: string
        description: ツール名
      type:
        type: string
        enum:
          - builtin
          - mcp
          - custom
        description: ツール種別
      description:
        type: string
        description: ツールの説明
      parameters:
        type: object
        description: ツールパラメータ (JSON Schema)
      implementation:
        type: object
        properties:
          command:
            type: string
            description: 実行コマンド (custom用)
          mcp_server:
            type: string
            description: MCPサーバー名 (mcp用)
          mcp_tool:
            type: string
            description: MCPツール名 (mcp用)
        description: ツール実装
      metadata:
        type: object
        properties:
          author:
            type: string
          version:
            type: string
          tags:
            type: array
            items:
              type: string
        description: メタデータ
    required:
      - name
      - type
      - description
```

### サンプルデータ

```yaml
version: "1.0.0"
tools:
  miyabi_agent_run:
    name: "miyabi_agent_run"
    type: custom
    description: "Miyabi Agent を実行する"
    parameters:
      type: object
      properties:
        agent_type:
          type: string
          enum:
            - CoordinatorAgent
            - CodeGenAgent
            - ReviewAgent
            - PRAgent
            - DeploymentAgent
          description: "実行するAgent種別"
        issue_number:
          type: integer
          minimum: 1
          description: "対象Issue番号"
        worktree_path:
          type: string
          description: "Worktreeパス (省略時は自動生成)"
      required:
        - agent_type
        - issue_number
    implementation:
      command: "./scripts/run-agent.sh"
    metadata:
      author: "Miyabi Team"
      version: "1.0.0"
      tags:
        - agent
        - automation

  github_issue_get:
    name: "github_issue_get"
    type: mcp
    description: "GitHub Issue を取得する"
    parameters:
      type: object
      properties:
        issue_number:
          type: integer
          minimum: 1
          description: "取得するIssue番号"
      required:
        - issue_number
    implementation:
      mcp_server: "github-enhanced"
      mcp_tool: "get_issue"
    metadata:
      author: "Miyabi Team"
      version: "1.0.0"
      tags:
        - github
        - mcp

  file_tree:
    name: "file_tree"
    type: custom
    description: "ディレクトリツリーを表示する"
    parameters:
      type: object
      properties:
        path:
          type: string
          description: "ルートパス"
        depth:
          type: integer
          minimum: 1
          maximum: 10
          default: 3
          description: "表示階層数"
      required:
        - path
    implementation:
      command: "tree"
    metadata:
      author: "Miyabi Team"
      version: "1.0.0"
      tags:
        - filesystem
        - utility
```

---

## 4. context_index.yaml - コンテキストモジュール管理

### 目的

- コンテキストモジュールのインデックス
- 優先度管理
- Just-In-Time ロード設定

### YAMLスキーマ

```yaml
$schema: http://json-schema.org/draft-07/schema#
title: Context Index
description: コンテキストモジュール管理
type: object
properties:
  version:
    type: string
    pattern: ^[0-9]+\.[0-9]+\.[0-9]+$
    description: スキーマバージョン
  modules:
    type: array
    items:
      $ref: '#/definitions/ContextModule'
    description: コンテキストモジュールリスト
required:
  - version
  - modules
definitions:
  ContextModule:
    type: object
    properties:
      id:
        type: string
        description: モジュールID
      name:
        type: string
        description: モジュール名
      file:
        type: string
        description: ファイルパス (.codex/context/ からの相対パス)
      priority:
        type: integer
        minimum: 1
        maximum: 5
        description: 優先度 (5=最高, 1=最低)
      auto_load:
        type: boolean
        default: false
        description: 自動ロード有効/無効
      conditions:
        type: object
        properties:
          keywords:
            type: array
            items:
              type: string
            description: キーワードリスト (いずれかにマッチで自動ロード)
          file_patterns:
            type: array
            items:
              type: string
            description: ファイルパターン (globパターン)
        description: 自動ロード条件
      dependencies:
        type: array
        items:
          type: string
        description: 依存モジュールID
      metadata:
        type: object
        properties:
          category:
            type: string
          tags:
            type: array
            items:
              type: string
          last_updated:
            type: string
            format: date
        description: メタデータ
    required:
      - id
      - name
      - file
      - priority
```

### サンプルデータ

```yaml
version: "1.0.0"
modules:
  - id: core-rules
    name: "Core Rules"
    file: core-rules.md
    priority: 5
    auto_load: true
    conditions:
      keywords:
        - MCP
        - benchmark
        - Context7
    metadata:
      category: core
      tags:
        - rules
        - protocols
      last_updated: "2025-11-06"

  - id: agents
    name: "Agent System"
    file: agents.md
    priority: 4
    auto_load: false
    conditions:
      keywords:
        - agent
        - CoordinatorAgent
        - CodeGenAgent
      file_patterns:
        - "crates/miyabi-agents/**/*.rs"
    dependencies:
      - core-rules
    metadata:
      category: system
      tags:
        - agents
        - architecture
      last_updated: "2025-11-06"

  - id: worktree
    name: "Git Worktree"
    file: worktree.md
    priority: 3
    auto_load: false
    conditions:
      keywords:
        - worktree
        - git worktree
      file_patterns:
        - ".worktrees/**/*"
    dependencies:
      - core-rules
    metadata:
      category: development
      tags:
        - git
        - worktree
      last_updated: "2025-11-06"

  - id: rust
    name: "Rust Development"
    file: rust.md
    priority: 3
    auto_load: false
    conditions:
      keywords:
        - rust
        - cargo
      file_patterns:
        - "**/*.rs"
        - "**/Cargo.toml"
    metadata:
      category: development
      tags:
        - rust
        - cargo
      last_updated: "2025-11-06"
```

---

## 📊 拡張フィールド設計

### agents_store.json 拡張フィールド

将来的な拡張を見越した追加フィールド:

```json
{
  "metadata": {
    "custom_fields": {
      "skill_used": "rust-development",
      "quality_score": 95,
      "review_status": "approved",
      "deployment_target": "production"
    }
  }
}
```

### hooks-config.json 拡張フィールド

```json
{
  "metadata": {
    "description": "このフックの詳細説明",
    "author": "Miyabi Team",
    "version": "1.0.0"
  },
  "retry": {
    "enabled": true,
    "max_attempts": 3,
    "backoff_ms": 1000
  }
}
```

---

## 🔄 データ永続化戦略

### 保存タイミング

| データ | 保存タイミング | 場所 |
|--------|--------------|------|
| agents_store.json | Agent実行完了時 | `.codex/agents/agents_store.json` |
| hooks-config.json | 設定変更時 (手動編集) | `.codex/hooks/hooks-config.json` |
| tools-config.yaml | 設定変更時 (手動編集) | `.codex/tools/tools-config.yaml` |
| context_index.yaml | 設定変更時 (手動編集) | `.codex/context/context_index.yaml` |

### バックアップ戦略

- `agents_store.json` は毎日 `.codex/agents/backups/agents_store-YYYYMMDD.json` にバックアップ
- 過去7日分のバックアップを保持
- バックアップは `.gitignore` で除外

---

## 📝 実装ガイドライン

### JSON/YAML検証

- 全JSONファイルは対応するJSONスキーマで検証
- YAMLファイルはYAMLlintで検証
- CI/CDパイプラインに検証ステップを追加

### エラーハンドリング

- JSONパースエラー時は適切なエラーメッセージを表示
- スキーマ検証失敗時はどのフィールドが問題かを明示
- デフォルト値を適切に設定

### パフォーマンス

- `agents_store.json` はファイルサイズ肥大化を防ぐため、実行履歴は最大100件
- JSONファイルは変更があった場合のみ書き込み
- コンテキストモジュールはLazy Load（必要時のみ読み込み）

---

## ✅ 検証項目

### agents_store.json

- [ ] スキーマに準拠したJSONが生成できる
- [ ] 複数Agent同時実行時のデータ競合がない
- [ ] 実行履歴が100件を超えると古いものから削除される
- [ ] 統計情報が正しく計算される

### hooks-config.json

- [ ] 全フックイベントが正しく定義されている
- [ ] テンプレート変数が正しく展開される
- [ ] タイムアウトが正しく機能する
- [ ] 非同期実行が正しく動作する

### tools-config.yaml

- [ ] カスタムツールが正しく実行される
- [ ] MCPツールが正しく呼び出される
- [ ] パラメータ検証が機能する

### context_index.yaml

- [ ] 優先度順にモジュールがロードされる
- [ ] 条件に基づく自動ロードが機能する
- [ ] 依存関係が正しく解決される

---

## 🔗 関連ドキュメント

- [CODEX_OVERHAUL_REQUIREMENTS.md](./CODEX_OVERHAUL_REQUIREMENTS.md) - 要件定義書
- [DIFF_ANALYSIS_REPORT.md](./DIFF_ANALYSIS_REPORT.md) - 差分洗い出しレポート (次作成)

---

**Status**: ✅ データ構造設計完了
**Next**: DIFF_ANALYSIS_REPORT.md 作成
**Agent**: カエデ (CodeGenAgent)
**Date**: 2025-11-06
