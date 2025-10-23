# Water Spider Orchestrator - 完全非同期並列実行システム設計書

**作成日**: 2025-10-23
**バージョン**: v1.0.0
**対象**: Miyabi Framework - 完全自律型開発オペレーションプラットフォーム

---

## 📋 目次

1. [概要](#概要)
2. [設計目標](#設計目標)
3. [アーキテクチャ](#アーキテクチャ)
4. [GitHub OS統合](#github-os統合)
5. [Self-hosted Runner設定](#self-hosted-runner設定)
6. [ヘッドレスClaude Code実行](#ヘッドレスclaude-code実行)
7. [実装Phase](#実装phase)
8. [技術スタック](#技術スタック)

---

## 概要

**Water Spider Orchestrator**は、Claude Codeセッション時間を最小化し、完全非同期並列実行を実現するための統合システムです。

### 核となる原則

1. **セッション時間最小化**: セッション起動 → タスク投入 → 即終了（数秒）
2. **完全非同期実行**: メインラインという概念なし、全タスクが非同期完了
3. **GitHub OS中心**: 全てのトリガーはGitHub Actions
4. **Self-hosted Runner**: ローカルマシンでヘッドレスClaude Code実行
5. **依存関係自動解決**: DAGベースのスケジューリング

---

## 設計目標

### 🎯 定量的目標

| 指標 | 現状 | 目標 |
|------|------|------|
| **セッション時間** | 15-30分/Issue | **可能な限り短縮** |
| **並列実行数** | 3タスク（手動） | **無制限（自動）** |
| **依存関係解決** | 手動 | **完全自動** |
| **完了検知** | 手動確認 | **自動通知** |
| **統合時間** | 手動PR作成 | **自動Milestone統合** |

### 🚀 定性的目標

- ✅ **ゼロタッチ運用**: ユーザー介入不要
- ✅ **完全可観測性**: 全プロセスの可視化
- ✅ **耐障害性**: エラー時の自動リトライ
- ✅ **スケーラビリティ**: 100+ Issue同時処理可能

---

## アーキテクチャ

### 全体像

```
┌──────────────────────────────────────────────────────────────┐
│ GitHub (Issue Storage - GitHub OS)                            │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Issues as Tasks                                           │ │
│ │  - Priority labels (P0-Critical, P1-High, ...)           │ │
│ │  - State labels (pending, analyzing, ...)                │ │
│ │  - Agent labels (agent:coordinator, ...)                 │ │
│ │  - Dependencies (blocked-by, depends-on)                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ GitHub Webhooks                                           │ │
│ │  - Issue created                                          │ │
│ │  - Issue labeled                                          │ │
│ │  - Issue commented                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ Task Scheduler Service (独立サービス - 常駐プロセス)             │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Issue Collector                                           │ │
│ │  - GitHub API polling (10秒ごと)                          │ │
│ │  - Webhook受信                                            │ │
│ │  - Issue Parse & Validation                              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Priority Calculator                                       │ │
│ │  - Label-based priority (P0 > P1 > P2 > P3)             │ │
│ │  - Dependency resolution (blocked-by解決)                 │ │
│ │  - Estimated time consideration                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Task Queue (優先順位付きキュー)                              │ │
│ │  Priority Queue: [Issue #443, Issue #448, Issue #449]   │ │
│ │  Blocked Queue:  [Issue #471 (depends on #448)]         │ │
│ │  Running Queue:  [Issue #490 (in progress)]             │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Task Dispatcher                                           │ │
│ │  - Task assignment to Self-hosted Runners                │ │
│ │  - Load balancing (max 5 parallel tasks)                │ │
│ │  - GitHub Actions workflow_dispatch trigger              │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           ↓ dispatch
┌──────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflows                                      │
│  - .github/workflows/task-execute.yml                         │
│  - .github/workflows/task-monitor.yml                         │
└──────────────────────────────────────────────────────────────┘
                           ↓ dispatch
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ Self-hosted Runner (Mac mini / Local Machine)                │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ GitHub Actions Runner Process                             │ │
│ │  - Task受信（workflow_dispatch）                          │ │
│ │  - 環境セットアップ                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Headless Claude Code Sessions                             │ │
│ │ **原則: 1 Session = 1 Issue（厳密な対応）**                 │ │
│ │                                                           │ │
│ │  ┌────────────────────────────────────────────────────┐  │ │
│ │  │ Session #1: Issue #443                              │  │ │
│ │  │ Worktree: .worktrees/issue-443/                     │  │ │
│ │  │ Branch: feature/issue-443                           │  │ │
│ │  │                                                     │  │ │
│ │  │ claude code --headless \                            │  │ │
│ │  │   --execute-command "/agent-run --issue 443" \      │  │ │
│ │  │   --cwd .worktrees/issue-443 \                      │  │ │
│ │  │   --no-human-in-loop                                │  │ │
│ │  │                                                     │  │ │
│ │  │ 🚫 Human-in-the-loop: 禁止                          │  │ │
│ │  │ 📝 ログ記録: Issue #443コメント                       │  │ │
│ │  │ 🔔 エスカレーション: @mention                        │  │ │
│ │  └────────────────────────────────────────────────────┘  │ │
│ │                                                           │ │
│ │  ┌────────────────────────────────────────────────────┐  │ │
│ │  │ Session #2: Issue #448                              │  │ │
│ │  │ Worktree: .worktrees/issue-448/                     │  │ │
│ │  │ Branch: feature/issue-448                           │  │ │
│ │  │                                                     │  │ │
│ │  │ claude code --headless \                            │  │ │
│ │  │   --execute-command "/agent-run --issue 448" \      │  │ │
│ │  │   --cwd .worktrees/issue-448 \                      │  │ │
│ │  │   --no-human-in-loop                                │  │ │
│ │  │                                                     │  │ │
│ │  │ 🚫 Human-in-the-loop: 禁止                          │  │ │
│ │  │ 📝 ログ記録: Issue #448コメント                       │  │ │
│ │  │ 🔔 エスカレーション: @mention                        │  │ │
│ │  └────────────────────────────────────────────────────┘  │ │
│ │                                                           │ │
│ │  ┌────────────────────────────────────────────────────┐  │ │
│ │  │ Session #3: Issue #449                              │  │ │
│ │  │ (以下同様...)                                        │  │ │
│ │  └────────────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Session Log Manager                                       │ │
│ │  - git commit監視                                         │ │
│ │  - Issue commentとして記録                                │ │
│ │  - @mentionによるエスカレーション                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ GitHub (Results)                                              │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Issue Comments (ログ記録)                                  │ │
│ │  - "✅ Phase 1/4完了: Issue分析・DAG構築"                  │ │
│ │  - "🚧 Phase 2/4実行中: コード生成..."                     │ │
│ │  - "⚠️ @username 依存関係エラー検出: Issue #471"          │ │
│ │  - "✅ 完了: PR #123作成、4ファイル変更（+293/-1）"         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ PR Creation                                               │ │
│ │  - 自動PR作成                                             │ │
│ │  - Worktreeマージ                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Issue Close                                               │ │
│ │  - 完了時に自動クローズ                                    │ │
│ │  - Milestoneへの自動統合                                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Task Scheduler Service - 独立サービスアーキテクチャ

### 概要

**Task Scheduler Service**は、GitHub上のIssueを常時監視し、優先順位付きTask Queueを構築・管理する独立サービスです。

### 特徴

- 🔄 **常駐プロセス**: 24/7稼働、GitHub API polling（10秒ごと）
- 📊 **優先順位計算**: Label + Dependencies + Estimated Time
- 🎯 **Task Queue管理**: Priority Queue + Blocked Queue + Running Queue
- 🚀 **自動ディスパッチ**: Self-hosted RunnerへのTask割り当て

### アーキテクチャ

#### 1. Issue Collector

**役割**: GitHub Issueの収集・パース

```rust
// crates/miyabi-scheduler/src/collector.rs
pub struct IssueCollector {
    github_client: Octocrab,
    repo: Repository,
    poll_interval: Duration,  // デフォルト: 10秒
}

impl IssueCollector {
    pub async fn collect_open_issues(&self) -> Result<Vec<Issue>>;
    pub async fn listen_webhooks(&self) -> Result<()>;
    pub fn parse_issue(&self, issue: &Issue) -> Result<Task>;
}
```

**収集条件**:
- State: `open`
- Labels: `state:pending` または `trigger:agent-execute`
- 除外: `state:done`, `blocked`

#### 2. Priority Calculator

**役割**: Issue優先度の計算

```rust
// crates/miyabi-scheduler/src/priority.rs
pub struct PriorityCalculator {
    weights: PriorityWeights,
}

#[derive(Debug)]
pub struct PriorityWeights {
    pub label_priority: f32,      // 50%
    pub estimated_time: f32,       // 20%
    pub dependencies: f32,         // 20%
    pub age: f32,                  // 10%
}

impl PriorityCalculator {
    pub fn calculate(&self, issue: &Issue) -> f32;
}
```

**計算式**:
```
Priority Score =
    Label Weight (P0=1.0, P1=0.7, P2=0.4, P3=0.1) × 0.5 +
    Time Factor (短い方が優先) × 0.2 +
    Dependency Factor (依存が少ない方が優先) × 0.2 +
    Age Factor (古い方が優先) × 0.1
```

#### 3. Task Queue

**役割**: 優先順位付きタスク管理

```rust
// crates/miyabi-scheduler/src/queue.rs
pub struct TaskQueue {
    priority_queue: BinaryHeap<Task>,
    blocked_queue: Vec<Task>,
    running_queue: HashMap<IssueId, Task>,
}

impl TaskQueue {
    pub fn enqueue(&mut self, task: Task);
    pub fn dequeue(&mut self) -> Option<Task>;
    pub fn update_blocked(&mut self);
    pub fn get_ready_tasks(&self, max: usize) -> Vec<Task>;
}
```

**Queue種別**:

| Queue | 説明 | 例 |
|-------|------|-----|
| **Priority Queue** | 実行可能タスク（依存なし） | [#443, #448, #449] |
| **Blocked Queue** | 依存待ちタスク | [#471 (depends on #448)] |
| **Running Queue** | 実行中タスク | [#490 (in progress)] |

#### 4. Task Dispatcher

**役割**: Self-hosted Runnerへのタスク割り当て

```rust
// crates/miyabi-scheduler/src/dispatcher.rs
pub struct TaskDispatcher {
    github_client: Octocrab,
    max_parallel: usize,  // デフォルト: 5
}

impl TaskDispatcher {
    pub async fn dispatch(&self, task: &Task) -> Result<DispatchId>;
    pub async fn trigger_workflow(&self, issue_id: u64) -> Result<WorkflowRun>;
}
```

**ディスパッチフロー**:
1. Priority Queueから次のタスク取得
2. Running Queue容量確認（max 5並列）
3. GitHub Actions `workflow_dispatch` トリガー
4. Running Queueへ追加

---

## ログベースコミュニケーションプロトコル

### 原則

**🚫 Human-in-the-loop禁止**: ヘッドレスセッションは質問・確認を一切行わない

**📝 ログ記録必須**: 全ての進捗・判断理由をIssueコメントに記録

**🔔 エスカレーション**: `@mention`でのみ人間に通知

### コミュニケーション手段

| ケース | 対応方法 |
|--------|---------|
| **進捗報告** | Issue comment（自動） |
| **完了報告** | Issue comment + close（自動） |
| **エラー発生** | Issue comment + `@mention`（自動） |
| **質問・確認** | ❌ **禁止** - 自律判断のみ |

### Issue Commentフォーマット

#### 1. 進捗報告

```markdown
## 🚧 Agent実行中: Issue #443

**Agent**: CoordinatorAgent
**Session ID**: session-443-20251023-142530
**Worktree**: .worktrees/issue-443/

### Phase 1/4: Issue分析・DAG構築 ✅

- ✅ Issue本文パース
- ✅ 依存関係解析
- ✅ DAG構築（4タスク）

### Phase 2/4: タスク実行 🚧

- ✅ Task 1: tonic依存追加
- 🚧 Task 2: コンパイル確認中...

**経過時間**: 2分30秒 / 推定120分

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### 2. 完了報告

```markdown
## ✅ Agent実行完了: Issue #443

**Agent**: CoordinatorAgent
**Session ID**: session-443-20251023-142530
**所要時間**: 8分15秒

### 成果物

- ✅ PR #500作成: `fix(a2a): add tonic dependency`
- ✅ 変更ファイル: 1ファイル（Cargo.toml）
- ✅ テスト: cargo test 成功（9箇所エラー解消）

### コミット

- `abc1234` - fix(a2a): add tonic dependency to Cargo.toml

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### 3. エラーエスカレーション

```markdown
## ⚠️ エラー発生 - 人間介入必要: Issue #471

**Agent**: CodeGenAgent
**Session ID**: session-471-20251023-150000
**エラー種別**: Dependency Resolution Error

### 問題

Issue #471の実装中に、Issue #448の完了が前提条件であることが判明しました。

### 依存関係

- **Blocked by**: Issue #448（CI/CD基本パイプライン構築）
- **理由**: Rustdoc生成にCI環境が必要

### 推奨アクション

@username Issue #448の完了後に再実行してください。

**一時措置**: Issue #471をBlocked Queueに移動しました。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Session Log Manager実装

```rust
// crates/miyabi-scheduler/src/log_manager.rs
pub struct SessionLogManager {
    github_client: Octocrab,
}

impl SessionLogManager {
    pub async fn post_progress(
        &self,
        issue_id: u64,
        phase: u8,
        total_phases: u8,
        message: &str,
    ) -> Result<()>;

    pub async fn post_completion(
        &self,
        issue_id: u64,
        result: &AgentResult,
    ) -> Result<()>;

    pub async fn post_error_escalation(
        &self,
        issue_id: u64,
        error: &MiyabiError,
        mention_user: &str,
    ) -> Result<()>;
}
```

---

## 1 Session = 1 Issue原則

### 厳格な対応

**絶対ルール**: 各Claude Codeヘッドレスセッションは、単一のIssueのみを処理する

### 実装方法

```yaml
# .github/workflows/task-execute.yml
jobs:
  execute-single-issue:
    name: Execute Issue #${{ github.event.inputs.issue_number }}
    runs-on: [self-hosted, miyabi, macos, arm64, headless-claude]

    steps:
      - name: Create Dedicated Worktree
        run: |
          ISSUE_NUM="${{ github.event.inputs.issue_number }}"
          WORKTREE_PATH=".worktrees/issue-${ISSUE_NUM}"
          BRANCH_NAME="feature/issue-${ISSUE_NUM}"

          git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

      - name: Execute Headless Session
        run: |
          ISSUE_NUM="${{ github.event.inputs.issue_number }}"

          claude code --headless \
            --execute-command "/agent-run --issue ${ISSUE_NUM}" \
            --cwd ".worktrees/issue-${ISSUE_NUM}" \
            --no-human-in-loop \
            --session-id "session-${ISSUE_NUM}-$(date +%Y%m%d-%H%M%S)"
```

### メリット

| メリット | 説明 |
|---------|------|
| **責任の明確化** | 1セッション = 1 Issue = 1 PR = 1 完了条件 |
| **ログの整合性** | Issueコメントがセッションログと完全一致 |
| **並列実行の安全性** | セッション間の干渉ゼロ |
| **デバッグの容易さ** | Issue単位でログ・Worktree追跡可能 |

---

## GitHub OS統合

### GitHub as Operating System

**全ての開発フローはGitHub Actionsでトリガーされる**

#### トリガーイベント

1. **Issue Events**
   ```yaml
   on:
     issues:
       types: [opened, labeled]
     # 条件: label "trigger:agent-execute" が付与されたら起動
   ```

2. **PR Events**
   ```yaml
   on:
     pull_request:
       types: [opened, ready_for_review]
     # 条件: PRが作成されたらReviewAgent起動
   ```

3. **Milestone Events**
   ```yaml
   on:
     milestone:
       types: [created, updated]
     # 条件: Milestoneが更新されたら統合処理実行
   ```

4. **Scheduled Events**
   ```yaml
   on:
     schedule:
       - cron: '0 9 * * *'  # 毎朝9時に定期実行
   ```

5. **Manual Dispatch**
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         issue_numbers:
           description: 'Issue numbers (comma-separated)'
           required: true
         concurrency:
           description: 'Max parallel sessions'
           default: '5'
   ```

---

## Self-hosted Runner設定

### 概要

**ローカルマシン（Mac mini等）でGitHub Actions Runnerを起動し、ヘッドレスClaude Codeを実行する**

### セットアップ手順

#### 1. GitHub Actions Runnerインストール

```bash
# ディレクトリ作成
mkdir ~/actions-runner && cd ~/actions-runner

# Runner最新版ダウンロード（macOS ARM64）
curl -o actions-runner-osx-arm64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz

# 展開
tar xzf ./actions-runner-osx-arm64-2.311.0.tar.gz
```

#### 2. Runner設定

```bash
# リポジトリに登録
./config.sh \
  --url https://github.com/customer-cloud/miyabi-private \
  --token <REGISTRATION_TOKEN> \
  --name miyabi-mac-mini-runner \
  --labels miyabi,macos,arm64,headless-claude \
  --work _work

# サービスとしてインストール
./svc.sh install

# 起動
./svc.sh start
```

#### 3. 環境変数設定

```bash
# ~/.zshrc または ~/.bashrc に追加
export GITHUB_TOKEN="ghp_xxx..."
export ANTHROPIC_API_KEY="sk-ant-xxx..."
export CLAUDE_CODE_HEADLESS=1
export MIYABI_RUNNER_MODE="self-hosted"
```

#### 4. Claude Code CLIインストール

```bash
# Claude Code CLIをグローバルインストール
npm install -g @anthropic/claude-code-cli

# または
brew install claude-code

# バージョン確認
claude --version
```

### Self-hosted Runnerラベル

**ワークフローでRunnerを指定**:

```yaml
jobs:
  agent-execution:
    runs-on: [self-hosted, miyabi, macos, arm64, headless-claude]
    steps:
      - name: Execute Agent
        run: |
          claude code --headless --execute-command /agent-run --issue ${{ github.event.issue.number }}
```

---

## ヘッドレスClaude Code実行

### ヘッドレスモードとは

**UIなしでClaude Codeを実行し、コマンドを自動実行するモード**

### 実行方法

#### 基本構文

```bash
claude code --headless \
  --execute-command <command> \
  --cwd /path/to/project \
  --output-json result.json
```

#### 具体例

```bash
# Agent実行
claude code --headless \
  --execute-command "/agent-run Issue #443" \
  --cwd /Users/a003/dev/miyabi-private \
  --output-json /tmp/result-443.json

# 複数コマンド実行
claude code --headless \
  --execute-command "/agent-run Issue #443" \
  --execute-command "/agent-run Issue #448" \
  --cwd /Users/a003/dev/miyabi-private \
  --parallel
```

### GitHub Actions統合

#### ワークフロー例: `.github/workflows/agent-run.yml`

```yaml
name: Agent Execution (Headless)

on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to process'
        required: true
      agent_type:
        description: 'Agent type'
        required: false
        default: 'coordinator'

jobs:
  execute-agent:
    name: Execute Agent on Issue #${{ github.event.issue.number || github.event.inputs.issue_number }}
    runs-on: [self-hosted, miyabi, macos, arm64, headless-claude]

    # 条件: "trigger:agent-execute" ラベルが付与された時のみ実行
    if: contains(github.event.issue.labels.*.name, 'trigger:agent-execute')

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 全履歴取得（Worktreeベースブランチ作成用）

      - name: Setup environment
        run: |
          echo "ISSUE_NUMBER=${{ github.event.issue.number || github.event.inputs.issue_number }}" >> $GITHUB_ENV
          echo "AGENT_TYPE=${{ github.event.inputs.agent_type || 'coordinator' }}" >> $GITHUB_ENV

      - name: Create Worktree
        id: worktree
        run: |
          WORKTREE_PATH=".worktrees/issue-${ISSUE_NUMBER}"
          BRANCH_NAME="feature/issue-${ISSUE_NUMBER}"

          # Worktree作成
          git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

          echo "WORKTREE_PATH=$WORKTREE_PATH" >> $GITHUB_ENV
          echo "BRANCH_NAME=$BRANCH_NAME" >> $GITHUB_ENV
          echo "worktree_path=$WORKTREE_PATH" >> $GITHUB_OUTPUT

      - name: Execute Agent (Headless)
        id: agent
        run: |
          # ヘッドレスClaude Code実行
          claude code --headless \
            --execute-command "/agent-run --issue ${ISSUE_NUMBER} --agent ${AGENT_TYPE}" \
            --cwd "${WORKTREE_PATH}" \
            --output-json "/tmp/agent-result-${ISSUE_NUMBER}.json" \
            --timeout 3600

        timeout-minutes: 60
        continue-on-error: false

      - name: Parse Result
        id: result
        run: |
          RESULT_FILE="/tmp/agent-result-${ISSUE_NUMBER}.json"

          # 結果パース
          if [ -f "$RESULT_FILE" ]; then
            STATUS=$(jq -r '.status' "$RESULT_FILE")
            PR_NUMBER=$(jq -r '.pr_number // empty' "$RESULT_FILE")

            echo "STATUS=$STATUS" >> $GITHUB_ENV
            echo "PR_NUMBER=$PR_NUMBER" >> $GITHUB_ENV
            echo "status=$STATUS" >> $GITHUB_OUTPUT
            echo "pr_number=$PR_NUMBER" >> $GITHUB_OUTPUT
          else
            echo "::error::Result file not found"
            exit 1
          fi

      - name: Create PR (if applicable)
        if: env.PR_NUMBER == ''
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ env.BRANCH_NAME }}
          title: "fix: resolve Issue #${{ env.ISSUE_NUMBER }}"
          body: |
            Closes #${{ env.ISSUE_NUMBER }}

            ## Agent Execution Result
            - **Agent**: ${{ env.AGENT_TYPE }}
            - **Status**: ${{ env.STATUS }}
            - **Worktree**: ${{ env.WORKTREE_PATH }}

            🤖 Generated with [Claude Code](https://claude.com/claude-code)

            Co-Authored-By: Claude <noreply@anthropic.com>

      - name: Cleanup Worktree
        if: always()
        run: |
          # Worktree削除
          git worktree remove "$WORKTREE_PATH" --force || true

      - name: Notify Result
        if: always()
        run: |
          # Discord/Slack通知
          curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"content\": \"Agent execution completed\",
              \"embeds\": [{
                \"title\": \"Issue #${{ env.ISSUE_NUMBER }}\",
                \"description\": \"Status: ${{ env.STATUS }}\",
                \"color\": 65280
              }]
            }"
```

#### ワークフロー例: `.github/workflows/parallel-execution.yml`

```yaml
name: Parallel Agent Execution

on:
  workflow_dispatch:
    inputs:
      issue_numbers:
        description: 'Issue numbers (comma-separated, e.g., "443,448,449")'
        required: true
      concurrency:
        description: 'Max parallel sessions'
        default: '5'
        required: false

jobs:
  prepare:
    name: Prepare Execution Matrix
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.matrix.outputs.matrix }}

    steps:
      - name: Parse Issue Numbers
        id: matrix
        run: |
          ISSUES="${{ github.event.inputs.issue_numbers }}"
          MATRIX=$(echo "$ISSUES" | jq -R -s -c 'split(",") | map({issue: .})')
          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT

  execute:
    name: Execute Issue #${{ matrix.issue }}
    needs: prepare
    runs-on: [self-hosted, miyabi, macos, arm64, headless-claude]
    strategy:
      max-parallel: ${{ fromJSON(github.event.inputs.concurrency) }}
      fail-fast: false
      matrix:
        include: ${{ fromJSON(needs.prepare.outputs.matrix) }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Execute Agent
        run: |
          claude code --headless \
            --execute-command "/agent-run --issue ${{ matrix.issue }}" \
            --cwd . \
            --output-json "/tmp/result-${{ matrix.issue }}.json"

      - name: Upload Result
        uses: actions/upload-artifact@v4
        with:
          name: result-${{ matrix.issue }}
          path: /tmp/result-${{ matrix.issue }}.json

  aggregate:
    name: Aggregate Results
    needs: execute
    runs-on: ubuntu-latest

    steps:
      - name: Download All Results
        uses: actions/download-artifact@v4
        with:
          path: results

      - name: Generate Summary
        run: |
          echo "## Execution Summary" >> $GITHUB_STEP_SUMMARY
          for file in results/*/result-*.json; do
            ISSUE=$(jq -r '.issue_number' "$file")
            STATUS=$(jq -r '.status' "$file")
            echo "- Issue #$ISSUE: **$STATUS**" >> $GITHUB_STEP_SUMMARY
          done
```

---

## 実装Phase

### Phase 0: 設計完了 ✅

**期間**: 2025-10-23（本日）
**成果物**: 本設計書

- [x] アーキテクチャ設計
- [x] GitHub OS統合方針決定
- [x] Self-hosted Runner要件定義
- [x] ヘッドレスモード実行方式決定

---

### Phase 1: 基盤構築（CI/CD基盤）

**期間**: 1日（2025-10-24）
**前提条件**: Issue #443, #448, #449, #450完了

**成果物**:

1. **GitHub Actions基本パイプライン**
   - `.github/workflows/ci.yml` - 基本CI/CD
   - `.github/workflows/clippy.yml` - Clippy強制
   - `.github/workflows/security.yml` - cargo audit自動化

2. **Self-hosted Runner設定**
   - Mac miniへのRunner設定
   - 環境変数設定
   - Claude Code CLI設定

**完了条件**:

- [ ] CI/CD基本パイプライン動作確認
- [ ] Self-hosted Runnerが正常動作
- [ ] ヘッドレスモード手動実行成功

---

### Phase 2: ヘッドレスモード実装

**期間**: 2日（2025-10-25 - 2025-10-26）
**Rust Crate**: `miyabi-scheduler`

**成果物**:

1. **Session Manager** (`src/session.rs`)
   ```rust
   pub struct SessionManager {
       sessions: HashMap<SessionId, Session>,
       config: SessionConfig,
   }

   impl SessionManager {
       pub async fn spawn_headless(
           &mut self,
           command: &str,
           worktree_path: PathBuf,
       ) -> Result<SessionId>;

       pub async fn monitor_session(
           &self,
           session_id: SessionId,
       ) -> Result<SessionStatus>;

       pub async fn collect_result(
           &self,
           session_id: SessionId,
       ) -> Result<AgentResult>;
   }
   ```

2. **Headless Launcher** (`src/launcher.rs`)
   ```rust
   pub async fn launch_claude_headless(
       command: String,
       cwd: PathBuf,
       output_file: PathBuf,
   ) -> Result<Child>;
   ```

3. **Result Parser** (`src/parser.rs`)
   ```rust
   pub fn parse_agent_result(json_path: PathBuf) -> Result<AgentResult>;
   ```

**完了条件**:

- [ ] ヘッドレスセッション起動成功
- [ ] セッション監視機能動作
- [ ] 結果パース成功
- [ ] エラーハンドリング完備

---

### Phase 3: DAGスケジューラ実装

**期間**: 3日（2025-10-27 - 2025-10-29）
**Rust Crate**: `miyabi-scheduler`

**成果物**:

1. **DAG Builder** (`src/dag.rs`)
   ```rust
   pub struct TaskDAG {
       nodes: HashMap<TaskId, TaskNode>,
       edges: Vec<(TaskId, TaskId)>,  // (from, to)
   }

   impl TaskDAG {
       pub fn from_issue(issue: &Issue) -> Result<Self>;
       pub fn topological_sort(&self) -> Result<Vec<TaskId>>;
       pub fn get_ready_tasks(&self) -> Vec<TaskId>;
   }
   ```

2. **Dependency Resolver** (`src/resolver.rs`)
   ```rust
   pub struct DependencyResolver {
       dag: TaskDAG,
       completed: HashSet<TaskId>,
   }

   impl DependencyResolver {
       pub fn resolve(&self) -> Vec<Vec<TaskId>>;  // 並列実行可能な層
   }
   ```

3. **Scheduler** (`src/scheduler.rs`)
   ```rust
   pub struct Scheduler {
       max_parallel: usize,
       session_manager: SessionManager,
       resolver: DependencyResolver,
   }

   impl Scheduler {
       pub async fn schedule_issue(&mut self, issue_id: u64) -> Result<()>;
       pub async fn schedule_milestone(&mut self, milestone_id: u64) -> Result<()>;
   }
   ```

**完了条件**:

- [ ] DAG構築成功
- [ ] 依存関係自動解決
- [ ] 並列実行層の特定成功
- [ ] スケジューリング動作確認

---

### Phase 4: リモート実行基盤

**期間**: 2日（2025-10-30 - 2025-10-31）
**Rust Crate**: `miyabi-scheduler`

**成果物**:

1. **Remote Executor** (`src/remote.rs`)
   ```rust
   pub struct RemoteExecutor {
       ssh_config: SshConfig,
       machines: Vec<Machine>,
   }

   impl RemoteExecutor {
       pub async fn execute_on_machine(
           &self,
           machine: &Machine,
           command: String,
       ) -> Result<Output>;
   }
   ```

2. **Load Balancer** (`src/load_balancer.rs`)
   ```rust
   pub struct LoadBalancer {
       machines: Vec<Machine>,
       current_load: HashMap<MachineId, usize>,
   }

   impl LoadBalancer {
       pub fn select_machine(&self) -> Option<&Machine>;
   }
   ```

3. **SSH統合**
   - Mac mini LAN接続活用
   - SSH経由でのWorktree作成
   - ヘッドレスセッション起動

**完了条件**:

- [ ] SSH経由実行成功
- [ ] 複数マシン並列実行
- [ ] ロードバランシング動作
- [ ] 耐障害性確認

---

### Phase 5: Milestone統合

**期間**: 2日（2025-11-01 - 2025-11-02）
**Rust Crate**: `miyabi-scheduler`

**成果物**:

1. **Result Aggregator** (`src/aggregator.rs`)
   ```rust
   pub struct ResultAggregator {
       results: HashMap<IssueId, AgentResult>,
   }

   impl ResultAggregator {
       pub async fn collect_results(&mut self) -> Result<Vec<AgentResult>>;
       pub async fn merge_to_milestone(&self, milestone_id: u64) -> Result<()>;
   }
   ```

2. **Milestone Integrator** (`src/milestone.rs`)
   ```rust
   pub async fn integrate_issue_to_milestone(
       issue_id: u64,
       milestone_id: u64,
   ) -> Result<()>;
   ```

3. **Notification System** (`src/notification.rs`)
   ```rust
   pub async fn notify_completion(
       issue_id: u64,
       result: &AgentResult,
   ) -> Result<()>;
   ```

**完了条件**:

- [ ] 結果自動集約
- [ ] Milestone自動更新
- [ ] 通知システム動作（Discord/Slack）
- [ ] 統計情報可視化

---

### Phase 6: 本番運用開始

**期間**: 2025-11-03 -
**目標**: 100+ Issue同時処理

**運用体制**:

1. **監視ダッシュボード**
   - 実行中セッション数
   - 完了率
   - エラー率
   - 平均実行時間

2. **エラーハンドリング**
   - 自動リトライ（3回まで）
   - エスカレーション（人間介入）
   - ログ集約

3. **パフォーマンスチューニング**
   - 並列実行数最適化
   - キャッシュ活用
   - リソース監視

---

## 技術スタック

### Rust Crates

| Crate | 用途 |
|-------|------|
| `tokio` | 非同期ランタイム |
| `async-trait` | Trait非同期メソッド |
| `petgraph` | DAG構築・解析 |
| `serde` + `serde_json` | JSON処理 |
| `octocrab` | GitHub API |
| `ssh2` | SSH接続 |
| `notify` | ファイルシステム監視 |
| `tracing` | ログ・メトリクス |

### GitHub Actions

| ワークフロー | 用途 |
|-------------|------|
| `agent-run.yml` | 単一Agent実行 |
| `parallel-execution.yml` | 並列実行 |
| `issue-process.yml` | Issue自動処理 |
| `milestone-integration.yml` | Milestone統合 |

### 外部サービス

| サービス | 用途 |
|---------|------|
| Claude Code CLI | ヘッドレスAgent実行 |
| GitHub API | Issue/PR/Milestone操作 |
| Discord/Slack Webhook | 通知 |
| Mac mini (Self-hosted) | 並列実行基盤 |

---

## セキュリティ考慮事項

### トークン管理

- GitHub Token: GitHub Secretsで管理
- Anthropic API Key: GitHub Secretsで管理
- SSH秘密鍵: Self-hosted Runnerにのみ配置

### アクセス制御

- Self-hosted Runnerは組織メンバーのみアクセス可能
- GitHub Actions workflowは保護ブランチのみ実行可能

### 監査ログ

- 全てのAgent実行はログ保存
- GitHub Actions実行履歴で追跡可能

---

## FAQ

### Q1: Self-hosted Runnerが停止したら？

**A**: GitHub Actionsは自動的にリトライします。Mac miniの自動起動設定で復旧します。

### Q2: 100+ Issueを同時処理できますか？

**A**: Phase 4でリモート実行基盤を構築し、複数マシンで分散実行可能です。

### Q3: セッション時間はどのくらい短縮できますか？

**A**: タスク投入のみを行い、実行は非同期バックグラウンドで行われるため、大幅に短縮できます。具体的な時間は実装後に計測します。

### Q4: エラー時の対応は？

**A**: 自動リトライ（3回）→ エスカレーション（人間介入）→ Issue自動作成の流れです。

---

## 参考資料

- [GitHub Actions Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Claude Code CLI Documentation](https://docs.anthropic.com/claude-code)
- [Miyabi CLAUDE.md](../CLAUDE.md)
- [Worktree Protocol](./WORKTREE_PROTOCOL.md)

---

**作成者**: Claude Code
**レビュー**: 未実施（Phase 1後にレビュー予定）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
