---
name: Multi-Project Workspace Management
description: Manage multiple projects in the Miyabi workspace including project switching, environment management, and cross-project operations. Use when working with multiple tech stacks simultaneously.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🏢 Multi-Project Workspace Management

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: 複数プロジェクト横断的な開発環境管理

---

## 📋 概要

Miyabi開発ワークスペースの複数プロジェクト統合管理。
効率的なプロジェクト切り替え、環境管理、横断的操作を提供します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| プロジェクト切り替え | "switch to project", "work on miyabi" |
| ワークスペース状態 | "workspace status", "check all projects" |
| 横断的操作 | "update all projects", "build all" |
| 環境管理 | "setup workspace", "clean workspace" |
| 依存関係管理 | "update dependencies", "check versions" |

---

## 🔧 P1: プロジェクト構造

### Miyabi Workspace Layout

```
~/dev/
├── 01-miyabi/              # Miyabi Ecosystem
│   ├── _core/miyabi-private/    # Main Platform (Next.js + Prisma)
│   ├── _mcp/miyabi-mcp-bundle/  # MCP Server (172+ tools)
│   ├── _workflows/              # Workflow Automation
│   └── _legacy/                 # Legacy Systems
├── 02-ai-course/           # AI Course Products
│   ├── content-generator/       # CCG v2 (Vite + Electron + Capacitor)
│   ├── saas-platform/           # SaaS Platform (Next.js + Prisma)
│   └── wordpress/               # WordPress Multisite
├── 03-products/            # Active Products
│   ├── Gen-Studio/              # MUSE Desktop (Tauri + React)
│   ├── PPAL/                    # CLI + Chrome Extension
│   └── KOTOWARI_CONTEXT/        # Screenshot Tools
├── 04-operations/          # Operations
│   └── daily_ops/               # Daily Automation
└── _reference/             # External References
    ├── inspector/               # MCP Inspector
    └── agentskills/             # Agent Skills Reference
```

### プロジェクト別技術スタック

| Project | Tech Stack | Dev Command | Port |
|---------|-----------|-------------|------|
| **Miyabi Private** | Next.js 14, Prisma, React 18 | `npm run dev` | 3000 |
| **MCP Bundle** | TypeScript, MCP SDK | `npm run dev` | - |
| **Gen-Studio** | React 19, Tauri 2, Gemini | `npm run tauri:dev` | 5173 |
| **AI Course Generator** | Vite, React, Electron | `npm run dev` | 5174 |
| **AI Course SaaS** | Next.js 14, Prisma | `npm run dev` | 3001 |
| **Daily Ops** | TypeScript, Node.js | `npm run dev` | 3002 |

---

## 🚀 P2: ワークフロー別パターン

### Pattern 1: プロジェクト切り替え

```bash
# スムーズなプロジェクト切り替え
function switch_project() {
    local project=$1

    case $project in
        "miyabi"|"private")
            cd ~/dev/01-miyabi/_core/miyabi-private
            ;;
        "mcp"|"bundle")
            cd ~/dev/01-miyabi/_mcp/miyabi-mcp-bundle
            ;;
        "gen-studio"|"muse")
            cd ~/dev/03-products/Gen-Studio
            ;;
        "ccg"|"course")
            cd ~/dev/02-ai-course/content-generator
            ;;
        "saas")
            cd ~/dev/02-ai-course/saas-platform
            ;;
        "ops")
            cd ~/dev/04-operations/daily_ops
            ;;
    esac

    echo "Switched to: $(basename $(pwd))"
    ls -la
}
```

### Pattern 2: ワークスペース全体状態確認

```bash
# 全プロジェクトの状態確認（3-5分）
for project in miyabi-private miyabi-mcp-bundle Gen-Studio content-generator saas-platform daily_ops; do
    echo "=== $project ==="
    cd ~/dev/*/$project 2>/dev/null || cd ~/dev/*/*/$project 2>/dev/null
    git status --short
    npm list --depth=0 2>/dev/null | head -5
    echo
done
```

### Pattern 3: 横断的依存関係更新

```bash
# 全プロジェクトの依存関係更新（10-20分）
find ~/dev -name "package.json" -path "*/node_modules" -prune -o -type f -print | \
while read package; do
    dir=$(dirname "$package")
    echo "Updating: $dir"
    cd "$dir"
    npm update
    npm audit fix --force
done
```

### Pattern 4: クロスプロジェクトビルド

```bash
# 主要プロジェクトの順次ビルド（15-30分）
projects=(
    "01-miyabi/_core/miyabi-private"
    "01-miyabi/_mcp/miyabi-mcp-bundle"
    "03-products/Gen-Studio"
    "02-ai-course/content-generator"
    "02-ai-course/saas-platform"
)

for project in "${projects[@]}"; do
    echo "Building: $project"
    cd ~/dev/$project
    npm run build || echo "Build failed for $project"
done
```

### Pattern 5: 開発サーバー一括起動

```bash
# tmux使用で複数サーバー同時起動
tmux new-session -d -s dev-servers

# Miyabi Private (port 3000)
tmux new-window -t dev-servers:1 -n miyabi-private
tmux send-keys -t dev-servers:1 'cd ~/dev/01-miyabi/_core/miyabi-private && npm run dev' Enter

# Gen-Studio (port 5173)
tmux new-window -t dev-servers:2 -n gen-studio
tmux send-keys -t dev-servers:2 'cd ~/dev/03-products/Gen-Studio && npm run tauri:dev' Enter

# AI Course SaaS (port 3001)
tmux new-window -t dev-servers:3 -n course-saas
tmux send-keys -t dev-servers:3 'cd ~/dev/02-ai-course/saas-platform && npm run dev' Enter

echo "Dev servers started in tmux session 'dev-servers'"
```

---

## ⚡ P3: 環境最適化

### 環境変数管理

```bash
# プロジェクト別環境変数テンプレート
miyabi-private/.env.local:
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="..."
GITHUB_TOKEN="..."

Gen-Studio/.env.local:
GEMINI_API_KEY="..."
TAURI_PRIVATE_KEY="..."

course-generator/.env.local:
GEMINI_API_KEY="..."
ELECTRON_APP_ID="..."
```

### ポート管理

| Project | Dev Port | Production | Status |
|---------|----------|------------|---------|
| Miyabi Private | 3000 | Vercel | Active |
| AI Course SaaS | 3001 | Railway | Active |
| Daily Ops | 3002 | Local | Development |
| Gen-Studio | 5173 | Desktop App | Active |
| CCG Web | 5174 | Local | Development |
| MCP Inspector | 3003 | Local | Reference |

### リソース監視

```bash
# 開発サーバーのリソース使用量監視
function monitor_workspace() {
    echo "=== Port Usage ==="
    lsof -i :3000,:3001,:3002,:5173,:5174

    echo "=== Memory Usage ==="
    ps aux | grep -E "(npm|node|tauri)" | grep -v grep

    echo "=== Disk Usage ==="
    du -h ~/dev/*/node_modules 2>/dev/null | sort -hr | head -10
}
```

---

## 📊 統合管理ツール

### ワークスペース設定ファイル

```json
// ~/dev/.workspace-config.json
{
  "version": "1.0.0",
  "projects": {
    "miyabi-private": {
      "path": "01-miyabi/_core/miyabi-private",
      "stack": "Next.js + Prisma",
      "commands": {
        "dev": "npm run dev",
        "build": "npm run build",
        "test": "npm test"
      },
      "ports": [3000],
      "dependencies": ["postgresql"]
    },
    "gen-studio": {
      "path": "03-products/Gen-Studio",
      "stack": "Tauri + React",
      "commands": {
        "dev": "npm run tauri:dev",
        "build": "npm run tauri:build"
      },
      "ports": [5173],
      "dependencies": ["rust", "tauri"]
    }
  }
}
```

### 自動化スクリプト

```bash
# ~/dev/workspace-manager.sh
#!/bin/bash

function ws_status() {
    echo "🏢 Miyabi Workspace Status"
    for project in $(jq -r '.projects | keys[]' .workspace-config.json); do
        path=$(jq -r ".projects.$project.path" .workspace-config.json)
        stack=$(jq -r ".projects.$project.stack" .workspace-config.json)

        cd ~/dev/$path
        echo "📁 $project ($stack)"
        echo "   Git: $(git branch --show-current) ($(git status --porcelain | wc -l) changes)"
        echo "   NPM: $(npm list 2>/dev/null | grep -c dependencies) packages"
        echo
    done
}

function ws_update() {
    echo "📦 Updating All Projects..."
    for project in $(jq -r '.projects | keys[]' .workspace-config.json); do
        path=$(jq -r ".projects.$project.path" .workspace-config.json)
        cd ~/dev/$path
        echo "Updating: $project"
        npm update && npm audit fix
    done
}
```

---

## 🛡️ トラブルシューティング

### 共通問題と対策

| 問題 | 症状 | 対処 |
|------|------|------|
| Port競合 | EADDRINUSE | `lsof -ti:port \| xargs kill -9` |
| Node Version不整合 | Build失敗 | `nvm use` 各プロジェクト |
| 依存関係競合 | Install失敗 | `rm -rf node_modules && npm install` |
| 環境変数不整合 | 接続エラー | `.env.example` から `.env.local` 再作成 |
| Git状態混乱 | Merge競合 | `git stash && git pull && git stash pop` |

### 緊急復旧手順

```bash
# ワークスペース全体リセット
function emergency_reset() {
    echo "🚨 Emergency Workspace Reset"

    # 全開発サーバー停止
    pkill -f "npm.*dev"
    pkill -f "tauri.*dev"

    # 主要プロジェクトの依存関係再構築
    for project in miyabi-private Gen-Studio content-generator saas-platform; do
        find ~/dev -name "$project" -type d | while read dir; do
            echo "Resetting: $dir"
            cd "$dir"
            rm -rf node_modules package-lock.json
            npm install
        done
    done

    echo "✅ Workspace reset complete"
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| プロジェクト切り替え | < 3秒で完了 |
| 全体状態確認 | 5分以内で完了 |
| 開発サーバー起動 | 全プロジェクト30秒以内 |
| 依存関係更新 | エラー0件で完了 |
| リソース使用量 | CPU < 80%, メモリ < 8GB |

### 出力フォーマット

```
🏢 Multi-Project Workspace Status

✅ Active Projects: 6/6 healthy
✅ Dependencies: All up to date
✅ Ports: No conflicts detected
✅ Git Status: All branches clean
✅ Resources: CPU 45%, Memory 6.2GB

Workspace ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `CLAUDE.md` | プロジェクト概要 |
| `.workspace-config.json` | 設定管理 |
| `docs/development/` | 開発ガイドライン |

---

## 📝 関連Skills

- **Environment Management**: 環境変数統合管理
- **Git Workflow**: 横断的Git操作
- **Database Management**: 複数DB管理
- **Testing Framework**: 横断的テスト実行
- **CI/CD Pipeline**: 統合デプロイメント