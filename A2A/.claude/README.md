# A2A Claude Code Configuration

A2A (Agent-to-Agent) プロジェクト用のClaude Code設定です。

## Directory Structure

```
.claude/
├── README.md              # このファイル
├── settings.json          # プロジェクト設定
├── mcp.json              # MCPサーバー設定
├── commands/             # スラッシュコマンド
│   ├── a2a-health.md     # ヘルスチェック
│   ├── a2a-broadcast.md  # ブロードキャスト
│   ├── a2a-status.md     # ステータス表示
│   └── agent-send.md     # エージェント送信
├── agents/               # エージェント定義
│   ├── shikiroon.md      # 指揮郎 (%18)
│   ├── kaede.md          # 楓 (%19)
│   ├── sakura.md         # 桜 (%20)
│   ├── tsubaki.md        # 椿 (%21)
│   ├── botan.md          # 牡丹 (%22)
│   └── mitsukeroon.md    # 見付郎 (%23)
├── context/              # コンテキストモジュール
│   ├── p0-protocol.md    # P0.2通信プロトコル
│   ├── pane-mapping.md   # ペインIDマッピング
│   └── message-format.md # メッセージフォーマット
├── Skills/               # スキル定義
│   ├── a2a-orchestration/    # オーケストレーション
│   ├── agent-communication/  # エージェント通信
│   └── issue-workflow/       # Issueワークフロー
└── hooks/                # フック設定
```

## Quick Start

### Slash Commands

```bash
/a2a-health      # 全エージェントのヘルスチェック
/a2a-status      # システム状態表示
/a2a-broadcast   # 全エージェントにブロードキャスト
/agent-send      # 特定エージェントに送信
```

### Skills

```bash
/skill a2a-orchestration     # タスクオーケストレーション
/skill agent-communication   # エージェント間通信
/skill issue-workflow        # Issueワークフロー自動化
```

## Agent Pane Mapping

| Pane | Agent | Role |
|------|-------|------|
| %18 | 指揮郎 (Shikiroon) | Conductor |
| %19 | 楓 (Kaede) | CodeGen |
| %20 | 桜 (Sakura) | Review |
| %21 | 椿 (Tsubaki) | PR |
| %22 | 牡丹 (Botan) | Deploy |
| %23 | 見付郎 (Mitsukeroon) | Issue |

## P0.2 Protocol

必須通信フォーマット:

```bash
tmux send-keys -t %PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t %PANE_ID Enter
```

**重要ルール:**
- 永続ペインID (`%18`, `%19`, etc.) を使用
- `sleep 0.5` は必須
- ワーカーはコンダクターにPUSH報告

## MCP Servers

主要なMCPサーバー:
- `miyabi-tmux` - tmuxセッション管理（CRITICAL）
- `miyabi-github` - GitHub操作
- `miyabi-log-aggregator` - ログ集約

## Related Files

- `../a2a.sh` - コア通信ライブラリ
- `../miyabi_cc_agents.sh` - Claude Codeラッパー
- `../miyabi_agents.json` - エージェント定義JSON
- `../CLAUDE.md` - プロジェクト指示書
