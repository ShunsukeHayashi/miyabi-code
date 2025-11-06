# Codex Tools

**Version**: 1.0.0
**Last Updated**: 2025-11-06

---

## 📋 Overview

Codex Tools管理システム - Built-in / MCP / Custom tools統合管理

### Tool Categories

1. **Built-in Tools** - Claude Code標準ツール (Read, Write, Edit, Bash, Grep, Glob)
2. **MCP Tools** - MCP Server提供ツール
3. **Custom Tools** - プロジェクト固有ツール (.codex/tools/custom/)

---

## 🔧 Configuration

設定ファイル: `tools-config.yaml`

YAMLスキーマ: `.codex/schemas/tools-config.schema.yaml`

### サンプル設定

```yaml
version: "1.0.0"

builtin_tools:
  Read:
    enabled: true
    restrictions:
      allowed_paths:
        - "/Users/shunsuke/Dev/miyabi-private/**"
      max_file_size_mb: 10

mcp_tools:
  - server_name: "miyabi"
    tool_name: "github_issue_list"
    enabled: true
    aliases: ["list-issues"]

custom_tools:
  - name: "miyabi_analyzer"
    script_path: ".codex/tools/custom/miyabi_analyzer.sh"
    enabled: true
    timeout_ms: 30000
```

---

## 📁 Directory Structure

```
.codex/tools/
├── README.md                  # このファイル
├── tools-config.yaml          # ツール設定
└── custom/                    # カスタムツール実装
    ├── miyabi_analyzer.sh
    └── example_tool.sh
```

---

## 🚀 Custom Tools Development

### Template

```bash
#!/bin/bash
# Custom tool template

set -e

INPUT="$1"

# Your tool logic here
echo "Processing: $INPUT"
```

### Requirements

- 実行権限 (`chmod +x`)
- エラーハンドリング (`set -e`)
- タイムアウト対応
- JSON出力サポート (optional)

---

## 📖 Documentation

詳細: `.codex/guides/MCP_INTEGRATION_PROTOCOL.md`
