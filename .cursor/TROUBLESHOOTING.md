# 🔧 Troubleshooting Guide - Miyabi

Miyabiの使用中に発生する可能性のある問題と解決策をまとめたガイドです。

## 📋 目次

1. [環境設定の問題](#環境設定の問題)
2. [Agentの問題](#agentの問題)
3. [Gitの問題](#gitの問題)
4. [Webhookの問題](#webhookの問題)
5. [MCPサーバーの問題](#mcpサーバーの問題)
6. [ビルドの問題](#ビルドの問題)
7. [デプロイの問題](#デプロイの問題)

---

## 環境設定の問題

### ❌ `GITHUB_TOKEN is required`

**症状**:
```
Error: GITHUB_TOKEN is required for IssueAgent
```

**原因**: GitHub Personal Access Tokenが設定されていない

**解決策**:

1. `.env` ファイルを作成:
```bash
echo "GITHUB_TOKEN=ghp_your_token_here" > .env
```

2. または環境変数を直接設定:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

3. トークンの作成方法:
   - GitHub Settings → Developer settings → Personal access tokens
   - 必要な権限: `repo`, `workflow`, `admin:org`, `project`

---

### ❌ `ANTHROPIC_API_KEY is required`

**症状**:
```
Error: ANTHROPIC_API_KEY is required for AI-driven code generation
```

**原因**: Anthropic API Keyが設定されていない（Claude AI使用時に必要）

**解決策**:

1. `.env` ファイルに追加:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your_key_here" >> .env
```

2. APIキーの取得:
   - Anthropic Console (https://console.anthropic.com/)
   - API Keys → Create Key

---

### ❌ Node.js version mismatch

**症状**:
```
Error: This project requires Node.js 18 or higher
```

**原因**: Node.jsのバージョンが古い

**解決策**:

1. Node.jsのバージョン確認:
```bash
node --version
```

2. Node.js 18以上をインストール:
```bash
# nvm使用の場合
nvm install 18
nvm use 18

# または公式サイトからダウンロード
# https://nodejs.org/
```

---

## Agentの問題

### ❌ Agent not found

**症状**:
```
Error: AgentType 'FooAgent' not found
```

**原因**: 存在しないAgent名を指定している

**解決策**:

1. 利用可能なAgent一覧を確認:
```bash
cat .claude/agents/agent-name-mapping.json | jq
```

2. キャラクター名を使う（推奨）:
```
❌ "FooAgentでIssue処理"
✅ "しきるん で Issue #270 を処理"
```

3. 利用可能なAgent一覧:
   - 🔴 リーダー: しきるん, あきんどさん
   - 🟢 実行役: つくるん, かくちゃん, しらべるん, etc.
   - 🔵 分析役: みつけるん, めだまん, かぞえるん, etc.
   - 🟡 サポート役: まとめるん, はこぶん

**参照**: [AGENT_CHARACTERS.md](agents/AGENT_CHARACTERS.md)

---

### ❌ Agent execution timeout

**症状**:
```
Error: Agent execution timed out after 3600000ms
```

**原因**: Agentの処理が1時間（デフォルトタイムアウト）を超えた

**解決策**:

1. タイムアウト時間を延長:
```bash
npm run agents:parallel:exec -- --issues=270 --timeout=7200000  # 2時間
```

2. タスクを分割:
```bash
# 大きなIssueを複数の小さなIssueに分割
# Issue #270 → Issue #270-1, #270-2, #270-3
```

3. Dry runで事前確認:
```bash
npm run agents:parallel:exec -- --issues=270 --dry-run
```

---

### ❌ Agent escalation required

**症状**:
```
⚠️ Escalation Required: Critical security vulnerability detected
Escalation to: CISO
Severity: Sev.1-Critical
```

**原因**: Agentが自力で解決できない問題を検出（正常な動作）

**対応**:

1. エスカレーション内容を確認:
   - Critical脆弱性 → CISO
   - アーキテクチャ問題 → TechLead
   - ビジネス優先度 → PO
   - 本番デプロイ → CTO

2. 該当する人間の承認を得る

3. 承認後、Agentに指示:
```
"CISOの承認を得ました。Issue #270のCritical脆弱性を修正してください。"
```

---

## Gitの問題

### ❌ Git merge conflict

**症状**:
```
error: Your local changes to the following files would be overwritten by merge:
  src/foo.ts
Please commit your changes or stash them before you merge.
```

**原因**: ローカルの変更とリモートの変更が競合

**解決策**:

1. 変更をコミット:
```bash
git add .
git commit -m "feat: implement feature X"
```

2. または変更を一時退避:
```bash
git stash
git pull --rebase
git stash pop
```

3. コンフリクトを手動解決:
```bash
# コンフリクトマーカーを編集
vim src/foo.ts

# 解決後
git add src/foo.ts
git rebase --continue
```

---

### ❌ Worktree already exists

**症状**:
```
Error: Worktree '.worktrees/issue-270' already exists
```

**原因**: 前回のWorktreeが残っている

**解決策**:

1. Worktree一覧を確認:
```bash
git worktree list
```

2. 不要なWorktreeを削除:
```bash
git worktree remove .worktrees/issue-270
```

3. すべてのstaleなWorktreeをクリーンアップ:
```bash
git worktree prune
```

4. 強制削除（最終手段）:
```bash
rm -rf .worktrees/issue-270
git worktree prune
```

---

### ❌ Interactive rebase が中断されてセッションが不安定

**症状**:
```
- Claude Codeセッションが数秒〜数分で頻繁に切断される
- git status で "UU" (unmerged) ファイルが表示される
- "interactive rebase in progress" メッセージが表示される
- Git操作がブロックされる
- 古いWorktreeが複数残存している
```

**根本原因**:

**Interactive rebase が中途半端な状態で停止**している：
- Rebase中にマージコンフリクトが発生
- コンフリクトが未解決のまま放置
- Git状態が不安定（detached HEAD等）
- これにより**すべてのGit操作がブロック**され、Claude Codeセッションが正常に動作できない

**診断手順**:

1. Git状態を確認:
```bash
git status
```

以下が表示される場合、この問題に該当：
```
interactive rebase in progress; onto a63c99e
You are currently rebasing branch 'feature/xxx' on 'a63c99e'.
  (fix conflicts and then run "git rebase --continue")
```

2. Unmergedファイルを確認:
```bash
git diff --name-status --diff-filter=U
```

3. Worktree残存を確認:
```bash
git worktree list
```

4. ログで頻繁なセッション再起動を確認:
```bash
tail -100 .ai/logs/$(date +%Y-%m-%d).md | grep "Session:"
```

**解決策**:

**Step 1: Interactive rebaseを中断**

最も安全な方法は、rebaseを完全に中断してクリーンな状態に戻すこと：

```bash
# Rebaseを中断
git rebase --abort

# 状態確認
git status
```

成功すると：
```
On branch feature/xxx
Your branch is up to date with 'origin/feature/xxx'.

nothing to commit, working tree clean
```

**Step 2: mainブランチに切り替え**

```bash
# mainブランチに戻る
git checkout main

# 最新状態を取得
git pull origin main

# 状態確認
git status
```

**Step 3: 古いWorktreeをクリーンアップ**

```bash
# Worktree一覧を確認
git worktree list

# すべての古いWorktreeを強制削除
git worktree remove .worktrees/test/issue-1-38fa0e26 --force
git worktree remove .worktrees/test/issue-1-80cea6d1 --force
git worktree remove .worktrees/test/issue-1-ea45dd53 --force

# Worktree参照をクリーンアップ
git worktree prune

# 確認（mainブランチのみ表示されるべき）
git worktree list
```

**Step 4: 動作確認**

```bash
# Git状態が完全にクリーンであることを確認
git status

# ビルドが正常に動作することを確認
cargo build --bin miyabi

# バイナリが正常に動作することを確認
./target/debug/miyabi --version
```

**検証**:

修正後の状態：
- ✅ `git status` → "nothing to commit, working tree clean"
- ✅ `git worktree list` → mainブランチのみ
- ✅ `cargo build` → エラーなし
- ✅ Claude Codeセッション → 30分以上安定継続

**予防策**:

1. **Rebaseは慎重に実行**:
   - Interactive rebaseは複雑な操作なので、必要な時のみ実行
   - コンフリクトが発生したら、すぐに解決するか中断する
   - 長時間放置しない

2. **定期的なWorktreeクリーンアップ**（週1回）:
```bash
#!/bin/bash
# .claude/scripts/cleanup-worktrees.sh

echo "=== Worktree Cleanup ==="
git worktree list

echo -e "\n=== Pruning stale worktrees ==="
git worktree prune

echo -e "\n=== Current worktrees ==="
git worktree list
```

3. **Git状態の定期確認**:
```bash
# Rebase中でないことを確認
git status | grep -q "rebase in progress" && echo "⚠️ Rebase in progress!" || echo "✅ Clean"

# Unmergedファイルがないことを確認
git ls-files -u | wc -l
```

4. **Claude Codeセッションの適切な終了**:
   - 長時間使わないセッションは手動で終了
   - Git操作中にセッションを切断しない
   - `Ctrl+C` で正常終了

**参考**:
- Git公式ドキュメント: https://git-scm.com/docs/git-rebase
- Git Worktree: https://git-scm.com/docs/git-worktree

---

## Webhookの問題

### ❌ Webhook connection failed

**症状**:
```
Error: Failed to connect to webhook server at http://localhost:3000
```

**原因**: Webhook serverが起動していない

**解決策**:

1. Webhook serverを起動:
```bash
npm run webhook:server
```

2. または一時的にスキップ:
```bash
git commit --no-verify
```

3. **Fallback機構を有効化**（Issue #137で実装予定）:
```yaml
# .miyabi.yml
webhook:
  enabled: true
  fallback: true  # Webhook失敗時にGitHub Actionsで実行
```

---

### ❌ Webhook signature verification failed

**症状**:
```
Error: Invalid webhook signature
```

**原因**: Webhook秘密鍵が一致していない

**解決策**:

1. `.env` のWebhook秘密鍵を確認:
```bash
WEBHOOK_SECRET=your_secret_here
```

2. GitHub Settingsで秘密鍵を更新:
   - Settings → Webhooks → Edit → Secret

3. 秘密鍵を再生成:
```bash
openssl rand -base64 32
```

---

## MCPサーバーの問題

### ❌ MCP server timeout

**症状**:
```
Error: MCP server 'context-engineering' timed out after 30000ms
```

**原因**: MCPサーバーが起動していないか、応答が遅い

**解決策**:

1. MCPサーバーのヘルスチェック:
```bash
.claude/mcp-servers/health-check.sh
```

2. Context Engineering APIサーバーを起動:
```bash
cd external/context-engineering-mcp
uvicorn main:app --port 8888
```

3. MCPサーバーを無効化（一時的）:
```json
// .claude/mcp.json
{
  "mcpServers": {
    "context-engineering": {
      "disabled": true  // 無効化
    }
  }
}
```

---

### ❌ MCP server not found

**症状**:
```
Error: MCP server 'foo-mcp' not found in .claude/mcp.json
```

**原因**: 存在しないMCPサーバー名を指定

**解決策**:

1. 利用可能なMCPサーバーを確認:
```bash
cat .claude/mcp.json | jq '.mcpServers | keys'
```

2. 利用可能なMCPサーバー一覧:
   - `ide-integration` - VS Code/Jupyter統合
   - `github-enhanced` - GitHub Issue/PR管理
   - `project-context` - プロジェクトコンテキスト
   - `miyabi-integration` - Miyabi CLI統合
   - `context-engineering` - AIコンテキスト分析

---

### ❌ Claude Code セッションが頻繁に切断される

**症状**:
```
- セッションが数分で切断される
- 短時間のセッションが大量にログに記録される
- システムリソース（CPU/メモリ）が高い状態が続く
```

**根本原因**:

1. **Codexプロセスの暴走** - 最も深刻
   - `/opt/homebrew/lib/node_modules/@openai/codex/vendor/aarch64-apple-darwin/codex/codex`
   - CPU 100%使用、数十日間連続実行

2. **MCP設定の過負荷**
   - 複数のMCPサーバーが同時起動
   - `github-enhanced`, `project-context`, `ide-integration` が不必要に有効

3. **複数Claudeセッションの競合**
   - 4つ以上のClaudeプロセスが同時実行

**診断手順**:

1. プロセス確認:
```bash
# Codex暴走チェック
ps aux | grep codex | grep -v grep

# Claudeセッション数確認
ps aux | grep claude | grep -v grep | wc -l
```

2. システムリソース確認:
```bash
top -l 1 | grep -E "CPU usage|PhysMem"
```

3. MCP設定確認:
```bash
cat .claude/mcp.json | jq '.mcpServers[] | select(.disabled == false) | keys'
```

**解決策**:

**Step 1: Codex暴走プロセスを停止**
```bash
# プロセスIDを特定
ps aux | grep codex

# 強制終了
kill -9 <PID>

# 停止確認
ps aux | grep codex | grep -v grep
```

**Step 2: MCP設定を最適化**

`.claude/mcp.json` を編集:
```json
{
  "mcpServers": {
    "github-enhanced": {
      "disabled": true  // 無効化
    },
    "project-context": {
      "disabled": true  // 無効化
    },
    "ide-integration": {
      "disabled": true  // 無効化
    }
  }
}
```

必要最小限のMCPサーバーのみ有効化：
- ✅ `filesystem` - ファイルシステムアクセス
- ✅ `miyabi` - Miyabi CLI統合
- ❌ `github-enhanced` - 無効化推奨
- ❌ `project-context` - 無効化推奨
- ❌ `ide-integration` - 無効化推奨

**Step 3: 重複Claudeセッションをクリーンアップ**
```bash
# 不要なClaudeセッションを終了（現在のセッション以外）
ps aux | grep claude | grep -v grep
kill <PID1> <PID2> <PID3>
```

**検証**:

修正後のシステムリソース目標値：
- ✅ CPU使用率: 50%以下（目標: 15%以下）
- ✅ メモリ空き: 500MB以上
- ✅ セッション継続時間: 30分以上

**結果例**:
```
修正前:
  CPU: 23.14% (user+sys)
  メモリ空き: 791MB

修正後:
  CPU: 13.31% (user+sys) ✅ -42%改善
  メモリ空き: 912MB ✅ +15%改善
```

**予防策**:

1. **定期的なプロセスチェック**（週1回）:
```bash
#!/bin/bash
# .claude/scripts/health-check.sh

echo "=== Codex Process Check ==="
ps aux | grep codex | grep -v grep || echo "No codex process"

echo -e "\n=== Claude Session Count ==="
ps aux | grep claude | grep -v grep | wc -l

echo -e "\n=== System Resources ==="
top -l 1 | grep -E "CPU usage|PhysMem"
```

2. **MCPサーバーは必要な時のみ有効化**
   - 開発中: `filesystem`, `miyabi` のみ
   - デバッグ時: `ide-integration` を一時的に有効化
   - GitHub操作時: `github-enhanced` を一時的に有効化

3. **Claude Codeセッションの適切な終了**
   - 長時間使わないセッションは手動で終了
   - `Ctrl+C` で正常終了

**参考Issue**:
- #187: Claude Code セッション切断問題の調査と修正

---

## ビルドの問題

### ❌ TypeScript compilation errors

**症状**:
```
Error: TS2307: Cannot find module '@miyabi/coding-agents'
```

**原因**: TypeScript path aliasが解決できない

**解決策**:

1. `tsconfig.json` のpaths設定を確認:
```json
{
  "compilerOptions": {
    "paths": {
      "@miyabi/coding-agents/*": ["packages/coding-agents/src/*"]
    }
  }
}
```

2. node_modulesを再インストール:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

3. TypeScriptコンパイラキャッシュをクリア:
```bash
rm -rf tsconfig.tsbuildinfo
npx tsc --build --clean
npx tsc --build
```

---

### ❌ ESLint errors

**症状**:
```
Error: 'foo' is assigned a value but never used (no-unused-vars)
```

**原因**: ESLintルール違反

**解決策**:

1. 自動修正:
```bash
npm run lint:fix
```

2. または手動修正:
```bash
# 該当ファイルを編集
vim src/foo.ts
```

3. ルールを一時的に無効化（推奨しない）:
```typescript
// eslint-disable-next-line no-unused-vars
const foo = 123;
```

---

## デプロイの問題

### ❌ Firebase deploy failed

**症状**:
```
Error: HTTP Error: 403, The caller does not have permission
```

**原因**: Firebase認証情報が不足または無効

**解決策**:

1. Firebaseにログイン:
```bash
firebase login
```

2. プロジェクトを選択:
```bash
firebase use your-project-id
```

3. 権限を確認:
   - Firebase Console → Project Settings → Users and permissions
   - 必要な権限: Editor以上

---

### ❌ Health check failed after deployment

**症状**:
```
⚠️ Health check failed: HTTP 500
Rolling back deployment...
```

**原因**: デプロイ後のアプリケーションが正常に起動していない

**対応**:

1. **自動ロールバック**（DeploymentAgentが自動実行）
2. ログを確認:
```bash
firebase functions:log
```

3. ローカルで再現:
```bash
npm run build
npm start
curl http://localhost:5000/health
```

---

## 🆘 それでも解決しない場合

### サポートへの連絡

1. **GitHub Issue作成**:
   - https://github.com/ShunsukeHayashi/Miyabi/issues/new
   - テンプレート: Bug Report

2. **必要な情報**:
   - Miyabiバージョン: `npx miyabi --version`
   - Node.jsバージョン: `node --version`
   - OS: `uname -a` (Mac/Linux) または `systeminfo` (Windows)
   - エラーメッセージ全文
   - 再現手順

3. **Email**:
   - supernovasyun@gmail.com
   - 件名: [Miyabi Support] Your Issue

---

## 📚 関連ドキュメント

- [QUICK_START.md](QUICK_START.md) - クイックスタートガイド
- [README.md](README.md) - Claude Code統合ガイド
- [AGENT_OPERATIONS_MANUAL.md](../docs/AGENT_OPERATIONS_MANUAL.md) - Agent運用マニュアル
- [DEPLOYMENT.md](../DEPLOYMENT.md) - デプロイガイド

---

## 📞 コミュニティ

- **Discord**: https://discord.gg/miyabi (準備中)
- **GitHub Discussions**: https://github.com/ShunsukeHayashi/Miyabi/discussions

---

🌸 **Miyabi** - Beauty in Autonomous Development

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
