# 🖥️ Agentic MCP Server - 環境識別子システム

**実装完了日時**: 2025-10-03

---

## 概要

Agentic MCP Serverにローカル環境識別子システムを実装しました。  
ローカル環境（Termux/Mac/Linux）とGitHub Actions環境を自動的に識別し、ログ・Issue コメント・実行結果に環境情報を付与します。

---

## 環境変数

### 必須環境変数

```bash
# 環境識別子
ENVIRONMENT=local                       # local/staging/production
LOCAL_ENV_NAME=termux-android          # 環境名（任意）
LOCAL_MACHINE_ID=localhost             # マシンID

# GitHub設定
GITHUB_REPOSITORY=owner/repo
GITHUB_REPOSITORY_PATH=/path/to/repo

# API Keys
GITHUB_TOKEN=ghp_...
ANTHROPIC_API_KEY=sk-ant-...
```

### 設定方法

1. `.env.example` をコピー
   ```bash
   cd tools/agentic-mcp
   cp .env.example .env
   ```

2. `.env` を編集
   ```bash
   # Termux環境の例
   ENVIRONMENT=local
   LOCAL_ENV_NAME=termux-android-$(hostname)
   LOCAL_MACHINE_ID=$(uname -n)
   ```

---

## MCP Tool: `agentic_env_info`

### 説明
ローカル環境の詳細情報を表示するMCPツール（9番目）。

### 使用方法

```typescript
// Claude Code MCP経由
agentic_env_info()
```

### 出力例

```markdown
## 🖥️ Agentic MCP Server - 環境情報

### 環境識別子
- **Environment**: local
- **Local Env Name**: termux-android-localhost
- **Machine ID**: localhost
- **Hostname**: localhost

### システム情報
- **Platform**: android
- **Node.js**: v22.19.0
- **Working Directory**: /data/data/com.termux/files/home/ai-course-content-generator-v.0.0.1/tools/agentic-mcp
- **Uname**: Linux localhost 6.1.134-android14-11-g66e758f7d0c0-ab13748739 #1 SMP PREEMPT Tue Jul  8 09:17:32 UTC 2025 aarch64 Android

### GitHub設定
- **Repository**: ShunsukeHayashi/ai-course-content-generator-v.0.0.1
- **Repository Path**: /data/data/com.termux/files/home/ai-course-content-generator-v.0.0.1
- **GitHub Token**: ✅ 設定済み
- **Anthropic API Key**: ❌ 未設定

### MCP Tools
- **Available Tools**: 9個
```

---

## 環境別の識別子

| 環境 | ENVIRONMENT | LOCAL_ENV_NAME | 自動判定 |
|------|-------------|----------------|---------|
| **Termux** | local | termux-android-$(hostname) | Platform: android |
| **Mac** | local | macos-$(hostname) | Platform: darwin |
| **Linux** | local | linux-$(hostname) | Platform: linux |
| **GitHub Actions** | github-actions | runner-$(runner.name) | CI環境変数検出 |

---

## GitHub Actions統合

### 実行ログ例

```yaml
# GitHub Actionsワークフロー
- name: Post Result Comment
  run: |
    ENVIRONMENT="github-actions"
    RUNNER_ID="${{ runner.name }}"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    gh issue comment ${{ inputs.issue_number }} --body "
    ✅ CodeGenAgent実行完了

    **Priority**: P1-高
    **Environment**: ${ENVIRONMENT}
    **Runner**: ${RUNNER_ID}
    **Timestamp**: ${TIMESTAMP}
    "
```

### Issue コメント出力例

```markdown
✅ CodeGenAgent実行完了

**Priority**: P1-高
**Environment**: github-actions
**Runner**: GitHub Actions 12
**Timestamp**: 2025-10-03 19:00:00

🤖 Executed by Agentic Orchestration System
```

---

## 並列実行ログ

### ローカル実行

```markdown
✅ #168 Task Title - CodeGenAgent [local:termux-android]
✅ #169 Task Title - ReviewAgent [local:termux-android]
```

### GitHub Actions実行

```markdown
✅ #168 Task Title - CodeGenAgent [github-actions:runner-12]
```

---

## MCP Server起動ログ

### Before（環境識別子なし）
```
🤖 Agentic Orchestration MCP Server started
Available tools: 8
```

### After（環境識別子付き）
```
🤖 Agentic Orchestration MCP Server started
🖥️  Environment: local (termux-android-localhost)
Available tools: 9
```

---

## トラブルシューティング

### 環境変数が読み込まれない

```bash
# .env ファイル確認
cat tools/agentic-mcp/.env

# dotenvインストール確認
cd tools/agentic-mcp
npm list dotenv

# MCP Server再起動
npm run build
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"agentic_env_info","arguments":{}},"id":1}' | node mcp-wrapper.cjs
```

### GitHub Token未設定エラー

```bash
# GitHub Token確認
echo $GITHUB_TOKEN

# .env に設定
echo "GITHUB_TOKEN=ghp_your_token" >> tools/agentic-mcp/.env
```

---

## 関連ファイル

- `tools/agentic-mcp/.env.example` - 環境変数テンプレート
- `tools/agentic-mcp/server.ts` - MCP Server実装（handleEnvInfo）
- `.github/workflows/agentic-parallel.yml` - GitHub Actionsワークフロー
- `tools/agentic-mcp/.ai/ENVIRONMENT_SETUP.md` - このファイル

---

**🖥️ Environment Identifier System - Ready!**
