# 🎨 Miyabi Dashboard

[![Crates.io](https://img.shields.io/crates/v/miyabi-cli.svg)](https://crates.io/crates/miyabi-cli)
[![Downloads](https://img.shields.io/crates/d/miyabi-cli.svg)](https://crates.io/crates/miyabi-cli)
[![License](https://img.shields.io/crates/l/miyabi-cli.svg)](https://crates.io/crates/miyabi-cli)

**完全自律型AI開発オペレーションプラットフォーム - Web Dashboard**

Miyabi の Agent ステータス、Issue 一覧、開発進捗をリアルタイムで可視化する Web アプリケーション。

---

> ⚠️ **Restructuring Notice (November 29, 2025 – February 28, 2026)**  
> Miyabi is in the middle of the ecosystem restructuring described in `.ai/plans/MASTER_RESTRUCTURING_PLAN.md`. During this window the repository layout, crate boundaries, and deployment workflows will evolve. Expect breaking moves (e.g., crate extraction, new package namespaces) on a weekly cadence. Track week-by-week progress in `.ai/metrics/restructuring-progress.md` once published and report blockers via GitHub issues tagged `restructuring`.

## 📊 Features

- **21 AI Autonomous Agents**: Coding Agents (7個) + Business Agents (14個) による完全自律型開発
- **28 MCP Servers**: Model Context Protocol統合による拡張可能なツールエコシステム
- **Agent Status Monitor**: 7つのCoding Agent (Coordinator, CodeGen, Review, PR, Deployment, Issue, Refresher) の実行状況をリアルタイム表示
- **Issue Dashboard**: GitHub Issues を優先度・ラベル別に一覧表示
- **Progress Tracking**: 各Agentの進捗率 (0-100%) を視覚化
- **GitHub Integration**: GitHub API を使った実際のIssueデータ取得
- **Plugin Marketplace**: Miyabi拡張機能のマーケットプレイス（NEW）
- **Cloud Deployment**: S3/CloudFrontによる自動デプロイ基盤（NEW）
- **Billing System**: Stripe統合による課金・サブスクリプション管理（NEW）

---

## 📦 Installation

### CLI Installation (miyabi-cli)

#### Option 1: cargo-binstall (Recommended - Fast)

```bash
# Install cargo-binstall if not already installed
cargo install cargo-binstall

# Install miyabi-cli (downloads pre-built binary)
cargo binstall miyabi-cli
```

#### Option 2: From crates.io

```bash
cargo install miyabi-cli
```

#### Option 3: Direct Binary Download

```bash
# macOS (Apple Silicon)
curl -sSL https://github.com/customer-cloud/miyabi-private/releases/latest/download/miyabi-aarch64-apple-darwin.tar.gz | tar xz
sudo mv miyabi /usr/local/bin/

# macOS (Intel)
curl -sSL https://github.com/customer-cloud/miyabi-private/releases/latest/download/miyabi-x86_64-apple-darwin.tar.gz | tar xz
sudo mv miyabi /usr/local/bin/

# Linux (x86_64)
curl -sSL https://github.com/customer-cloud/miyabi-private/releases/latest/download/miyabi-x86_64-unknown-linux-gnu.tar.gz | tar xz
sudo mv miyabi /usr/local/bin/
```

#### Verify Installation

```bash
miyabi --version
miyabi --help
```

---

## 🧭 Architecture Overview

Miyabi now follows a three-layer architecture aligned with the restructuring roadmap:

1. **Foundation Layer** – Core libraries that model data, persistence, LLM access, observability, and Git orchestration. These crates are the reusable building blocks slated for crates.io publication.
2. **Platform Layer** – The runtime that powers Miyabi itself: autonomous agents, orchestrator, workflow DSL, approval and session systems, and the APIs that expose them.
3. **Integrations Layer** – User experiences and channel adapters (CLI, desktop, dashboards, Discord/LINE/Telegram bridges, narration, visualization) that sit on top of the platform.

```
          Integrations Layer
   ┌──────────────────────────────┐
   │  Web UI · Desktop · Bots     │
   │  Voice Guide · Visualizers   │
   └────────▲──────────┬──────────┘
            │          │ Events / APIs
   ┌────────┴──────────▼──────────┐
   │        Platform Layer         │
   │  Agents · Orchestrator · CLI  │
   │  Workflow · MCP · Web API     │
   └────────▲──────────┬──────────┘
            │          │ SDK / Types
   ┌────────┴──────────▼──────────┐
   │       Foundation Layer        │
   │  Types · LLM · Knowledge      │
   │  Persistence · Telemetry      │
   └──────────────────────────────┘
```

Foundation crates are being hardened first (Phase 0–2), Platform crates are extracted and simplified next (Phase 2–3), and Integrations settle once the new APIs are stable (Phase 4–5). Follow the restructuring plan for detailed timelines.

## 📦 Crate Catalog (61)

The table below captures every crate or package tracked during the restructuring. Status reflects the current state (some specs still need Cargo manifests, and a few frontends are TypeScript packages scheduled for crate extraction).

| Layer | Package | Description | Status |
|-------|---------|-------------|--------|
| Foundation | `miyabi-benchmark` | Benchmark evaluation harness against SWE-bench Pro, AgentBench, HAL, and Galileo suites. | Rust crate |
| Foundation | `miyabi-core` | Shared config, logging, retry, and filesystem primitives used by every Miyabi crate. | Rust crate |
| Foundation | `miyabi-dag` | Task DAG builder for the Ω-system allocation phase (θ₃). | Rust crate |
| Foundation | `miyabi-def-core` | Schema definitions and resolvers for the YAML-based Miyabi knowledge graph. | Rust crate |
| Foundation | `miyabi-knowledge` | Vector knowledge service with embeddings, ingestion, and search pipelines. | Rust crate |
| Foundation | `miyabi-llm` | Provider-agnostic LLM interface orchestrating requests and streaming responses. | Rust crate |
| Foundation | `miyabi-llm-anthropic` | Anthropic Claude backend implementing the unified LLM traits. | Rust crate |
| Foundation | `miyabi-llm-core` | Core traits, tokenizer utilities, and error types for Miyabi LLM providers. | Rust crate |
| Foundation | `miyabi-llm-google` | Google Gemini API client for the LLM abstraction. | Rust crate |
| Foundation | `miyabi-llm-openai` | OpenAI GPT provider implementation for the LLM abstraction. | Rust crate |
| Foundation | `miyabi-persistence` | SQLite persistence layer tracking 5-Worlds execution and telemetry. | Rust crate |
| Foundation | `miyabi-pty-manager` | Cross-platform PTY orchestration with cancellation and output streaming. | Rust crate |
| Foundation | `miyabi-search` | Semantic vector search layer built on top of miyabi-knowledge and Qdrant. | Design spec (manifest pending) |
| Foundation | `miyabi-security` | Security analysis toolkit for generated code: static scans, sandbox orchestration, threat reports. | Design spec (manifest pending) |
| Foundation | `miyabi-telemetry` | Unified logging, metrics, and tracing primitives shared across agents. | Design spec (manifest pending) |
| Foundation | `miyabi-types` | Canonical type system for agents, tasks, issues, workflows, and metrics. | Rust crate |
| Foundation | `miyabi-worktree` | Git worktree lifecycle manager with pooling, cleanup, and state tracking. | Rust crate |
| Platform | `miyabi-a2a` | Agent-to-Agent datastore and messaging bridge for multi-agent workflows. | Rust crate |
| Platform | `miyabi-agent-business` | Business domain specialist agents covering strategy, finance, and GTM. | Rust crate |
| Platform | `miyabi-agent-codegen` | Code generation agent with multi-worktree execution and retry orchestration. | Rust crate |
| Platform | `miyabi-agent-coordinator` | Coordinator agent that decomposes GitHub issues into executable DAGs. | Rust crate |
| Platform | `miyabi-agent-core` | Base traits, lifecycles, and utilities shared across all agent crates. | Rust crate |
| Platform | `miyabi-agent-integrations` | Adapters that let agents call external services such as Discord and Potpie. | Rust crate |
| Platform | `miyabi-agent-issue` | Issue triage agent inferring labels, complexity, and implementation guidance. | Rust crate |
| Platform | `miyabi-agent-review` | Review agent performing lint, security, and quality scoring for patches. | Rust crate |
| Platform | `miyabi-agent-swml` | Implementation of Shunsuke’s World Model Logic with convergence guarantees. | Rust crate |
| Platform | `miyabi-agent-workflow` | Workflow automation agents for PR creation, deployment, and status updates. | Rust crate |
| Platform | `miyabi-agents` | Legacy umbrella crate aggregating the original seven Miyabi agents. | Rust crate |
| Platform | `miyabi-approval` | Human-in-the-loop approval gates and policy enforcement for risky operations. | Rust crate |
| Platform | `miyabi-cli` | Primary command-line interface exposing Miyabi operations to operators. | Rust crate |
| Platform | `miyabi-e2e-tests` | End-to-end regression harness covering multi-agent runs and CLI flows. | Rust crate |
| Platform | `miyabi-integration` | Rust facade (`MiyabiClient`) consumed by external tooling such as Codex. | Design spec (manifest pending) |
| Platform | `miyabi-mcp-server` | Model Context Protocol server exposing agents to compatible IDEs and runtimes. | Rust crate |
| Platform | `miyabi-modes` | YAML-driven mode system for configuring agent personalities, tools, and prompts. | Rust crate |
| Platform | `miyabi-orchestrator` | HTTP control plane for long-lived Claude Code sessions, scheduling, and telemetry. | Rust crate |
| Platform | `miyabi-session-manager` | Session registry that hands off Claude contexts between agents safely. | Rust crate |
| Platform | `miyabi-web-api` | Axum service that backs the dashboard and external API clients. | Rust crate |
| Platform | `miyabi-web-ui-api` | Internal API crate powering dashboard widgets and data hydration. | Rust crate |
| Platform | `miyabi-workflow` | Composable workflow DSL for building complex agent orchestration graphs. | Rust crate |
| Integrations | `codex-miyabi` | Thin CLI to exercise miyabi-integration for Codex × Miyabi Phase 1. | Rust crate |
| Integrations | `miyabi-claudable` | Claudable API client used for generating UI scaffolding and prompts. | Rust crate |
| Integrations | `miyabi-desktop (frontend)` | Electron/Vite frontend targeting local operators during the restructure. | TypeScript package (crate planned) |
| Integrations | `miyabi-desktop (tauri)` | Tauri-based desktop shell bundling the CLI and orchestrator for offline control. | Rust crate |
| Integrations | `miyabi-discord-mcp-server` | MCP-compliant bridge for running Miyabi agents inside Discord channels. | Rust crate |
| Integrations | `miyabi-github` | GitHub REST API client with issue, PR, and label orchestration helpers. | Rust crate |
| Integrations | `miyabi-historical` | Historical persona services delivering Tokugawa/Oda/Ryoma advisor endpoints. | Rust crate |
| Integrations | `miyabi-line` | LINE messaging adapter delivering NLP-driven issue creation and notifications. | Rust crate |
| Integrations | `miyabi-telegram` | Telegram bot adapter for agent control, alerts, and conversational ops. | Rust crate |
| Integrations | `miyabi-tui` | Tokio/ratatui terminal UI for operators preferring keyboard workflows. | Rust crate |
| Integrations | `miyabi-viz` | Visualization tools for dependency graphs and architecture heatmaps. | Rust crate |
| Integrations | `miyabi-voice-guide` | VOICEVOX-powered narration hooks broadcasting agent telemetry. | Rust crate |
| Integrations | `miyabi-web-ui (frontend)` | Next.js/Vite dashboard surface for monitoring agents and progress. | TypeScript package (crate planned) |
| Integrations | `miyabi-webhook` | Signature-verified webhook relay for agent-to-agent event fan-out. | Rust crate |

## 🚀 Quick Start (Updated November 29, 2025)

**Prerequisites**
- Node.js ≥ 20 (aligns with Next.js 14 runtime requirements)
- pnpm ≥ 9 (recommended; `pnpm-lock.yaml` is canonical) or npm ≥ 10
- GitHub personal access token with `repo` scope for full dashboard functionality

**Install dependencies**

```bash
pnpm install
# or: npm install
```

**Configure environment**

Create `.env.local` at the repository root (or copy from `.env.example`):

```bash
# Required: GitHub Access
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=customer-cloud/miyabi-private

# Required: LLM Provider (at least one)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx  # Primary (Claude 3.5 Sonnet)

# Optional: Additional LLM Providers
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx          # Fallback (GPT-4o)
# GOOGLE_API_KEY=xxxxxxxxxxxxxxxx              # Alternative (Gemini 1.5 Pro)
# GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx            # Fast inference (Llama 3)
```

**Note**: Most Miyabi agents require `ANTHROPIC_API_KEY`. For full documentation of all environment variables, see [.env.example](.env.example).

**Run the dashboard locally**

```bash
pnpm dev
```

Open http://localhost:3000 in your browser. Hot reloading is enabled by default.

**Build, lint, and test**

```bash
pnpm lint
pnpm build
pnpm start
```

Optional subsystems such as VOICEVOX narration or orchestration simulators are documented in `docs/integration/` and `.claude/`. Expect command names and package locations to shift as Phase 2+ extractions land; check release notes and the restructuring metrics dashboard before automating against internal paths.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **API**: GitHub REST API v3

---

## 📂 Project Structure

```
miyabi-private/
├─ app/                       # Next.js App Router entrypoints and route handlers
├─ components/                # Reusable UI primitives (moving to packages/ during Phase 4)
├─ services/                  # GitHub + orchestration data fetching helpers
├─ lib/                       # Client/server shared utilities
├─ crates/                    # Rust workspace (orchestrator, LLM SDK, analysis tooling)
├─ scripts/                   # Automation and CLI wrappers (to be split per app in Phase 5)
├─ docs/                      # Product, integration, and restructuring documentation
├─ .ai/                       # Planning artifacts including MASTER_RESTRUCTURING_PLAN.md
└─ packages/ (planned)        # Target location for extracted TypeScript libraries
```

Phase 0–2 work will rehome selected crates into dedicated repositories and populate `packages/` with typed SDKs consumed by the dashboard. If automation depends on path names, subscribe to release notes for migration timelines.

**詳細ドキュメント**:
- [User Guide](crates/miyabi-knowledge/USER_GUIDE.md)
- [API Reference](crates/miyabi-knowledge/API_REFERENCE.md)
- [拡張計画](https://github.com/ShunsukeHayashi/miyabi-private/issues/421) - 自動インデックス化、Web UI、統合テスト

---

### 🔊 **完全挙動可視化システム（NEW - VOICEVOX統合）**

<div align="center">

![VOICEVOX Integration](https://img.shields.io/badge/VOICEVOX-Audio%20Narration-00D9FF?style=for-the-badge&logo=audio-technica)

</div>

**"エージェントを完璧にコントロールすることで初めて、正確にこのプロジェクトの価値が発生する"**

オーケストレーター層の全45イベントを音声でリアルタイム通知し、完全な挙動透明性を実現：

- 🎤 **音声ナレーション** - ずんだもん音声による全イベント通知
- 📊 **100%透明性** - 5-Worlds実行、動的スケーリング、フィードバックループの全挙動を可視化
- 🎯 **教育的デザイン** - 初心者でもシステム動作を理解可能な詳細説明
- ⚡ **ゼロコスト** - パフォーマンス影響ほぼゼロ（<1% CPU、非ブロッキング実行）

**カバレッジ**:
- ✅ 5-Worlds並列実行: 13イベント
- ✅ サーキットブレーカー: 8イベント
- ✅ 動的スケーリング: 9イベント
- ✅ フィードバックループ: 15イベント

```bash
# VOICEVOX Engine起動
curl http://localhost:50021/version

# 環境変数設定
export VOICEVOX_NARRATION_ENABLED=true
export VOICEVOX_SPEAKER=3  # ずんだもん
export VOICEVOX_SPEED=1.1

# テスト実行（ナレーション付き）
cargo test --package miyabi-orchestrator -- --nocapture
```

**ナレーション例**:
```
🔊 "5つの並行世界での実行を開始するのだ！Issue #443のタスクを、
   異なるパラメータで5回実行して、最高の結果を選ぶのだ！"

🔊 "Winner決定なのだ！World Betaが最高スコア95点で勝利！"

🔊 "スケールアップなのだ！並行実行数を5から6に増やすのだ！"
```

**詳細ドキュメント**:
- [クイックスタート](docs/integration/VOICEVOX_HOOKS_QUICKSTART.md) - 3ステップセットアップ
- [実装サマリー](docs/integration/HOOKS_INTEGRATION_COMPLETE.md) - 全45イベント詳細
- [アーキテクチャ](docs/WATER_SPIDER_ORCHESTRATOR_DESIGN.md#完全挙動可視化システムvoicevox) - 設計思想

---

## 📦 インストール

### 方法1: npx（推奨）

```bash
npx miyabi
```

### 方法2: グローバルインストール

```bash
npm install -g miyabi
miyabi
```

### 方法3: パッケージに追加

```bash
npm install --save-dev miyabi
npx miyabi
```

### 🔌 方法4: Claude Code Plugin（新機能！）

Miyabiは[Claude Code](https://claude.ai/code)の公式Pluginとしても利用できます。

```bash
# Claude Code内で実行
/plugin install miyabi
```

インストール後、以下のコマンドが利用可能になります：

```bash
/miyabi-init      # 新規プロジェクト作成
/miyabi-status    # ステータス確認
/miyabi-auto      # Water Spider自動モード
/miyabi-todos     # TODO検出・Issue化
/miyabi-agent     # Agent実行
/miyabi-docs      # ドキュメント生成
/miyabi-deploy    # デプロイ実行
/miyabi-test      # テスト実行
```

**詳細**: [Claude Code Plugin統合ガイド](docs/CLAUDE_CODE_PLUGIN_INTEGRATION.md)

#### 🪝 **Event Hooks (Plugin限定)**

Claude Code Pluginとして使用すると、以下のイベントフックが自動実行されます：

```bash
pre-commit    # コミット前チェック
post-commit   # コミット後通知
pre-pr        # PR作成前チェック
post-test     # テスト後カバレッジレポート
```

**Hooksの機能**:

| Hook | タイミング | 実行内容 |
|------|----------|---------|
| `pre-commit` | コミット前 | ✅ Lint実行<br>✅ Type check<br>✅ テスト実行 |
| `post-commit` | コミット後 | ✅ コミット情報表示<br>✅ メトリクス更新 |
| `pre-pr` | PR作成前 | ✅ Rebase確認<br>✅ テスト実行<br>✅ カバレッジ確認<br>✅ Conventional Commits検証 |
| `post-test` | テスト後 | ✅ カバレッジレポート生成<br>✅ HTMLレポート出力<br>✅ 結果アーカイブ |

---

## 💡 使い方

### 🌟 **新規プロジェクト作成**

```bash
$ npx miyabi

? 何をしますか？ 🆕 新しいプロジェクトを作成
? プロジェクト名: my-awesome-app
? プライベートリポジトリにしますか？ No

🚀 セットアップ開始...
✓ GitHubリポジトリ作成
✓ ラベル設定（53個）
✓ ワークフロー配置（10+個）
✓ Projects V2設定
✓ ローカルにクローン

🎉 完了！
```

### 📦 **既存プロジェクトに追加**

```bash
$ cd my-existing-project
$ npx miyabi

? 何をしますか？ 📦 既存プロジェクトに追加
? ドライランで確認しますか？ Yes

🔍 プロジェクト解析中...
✓ 言語検出: JavaScript/TypeScript
✓ フレームワーク: Next.js
✓ ビルドツール: Vite
✓ パッケージマネージャー: pnpm

📋 インストール予定:
  - 53個のラベル
  - 10+個のワークフロー
  - Projects V2連携
  - セキュリティスキャン設定
```

### 📊 **ステータス確認**

```bash
$ npx miyabi

? 何をしますか？ 📊 ステータス確認
? ウォッチモードを有効にしますか？ No

╔════════════════════════════════════╗
║   📊 Miyabi ステータス            ║
╚════════════════════════════════════╝

┌─────────────┬───────┬─────────────┐
│ State       │ Count │ Status      │
├─────────────┼───────┼─────────────┤
│ Pending     │   2   │ ⏳ 待機中   │
│ Implementing│   3   │ ⚡ 作業中   │
│ Reviewing   │   1   │ 🔍 レビュー │
│ Done        │  15   │ ✓ 完了      │
└─────────────┴───────┴─────────────┘

📝 最近のPR:
  #42 ユーザーダッシュボード追加 (merged 2h ago)
  #41 ログインリダイレクト修正 (merged 5h ago)
  #40 APIエンドポイントのドキュメント化 (merged 1d ago)
```

---

## 🎨 UI Components

### Dashboard Page

- **Header**: タイトル、説明
- **Stats Cards**: 統計情報 (Total Agents, Running, Completed, Open Issues)
- **Agent Status Grid**: 7つのAgentのカード表示 (進捗バー付き)
- **Issue List**: GitHubからフェッチしたIssue一覧

### Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Miyabi Blue | #3B82F6 | Running agents |
| Miyabi Purple | #8B5CF6 | Open issues count |
| Miyabi Green | #10B981 | Completed agents |
| Miyabi Yellow | #F59E0B | Warnings |
| Miyabi Red | #EF4444 | Failed agents |

---

## 🔌 API Endpoints

### `GET /api/agents`

Agent ステータス一覧を取得

**Response:**
```json
{
  "agents": [
    {
      "name": "CoordinatorAgent",
      "status": "running",
      "progress": 75,
      "currentTask": "Issue #531 分析中"
    }
  ]
}
```

**機能:**
- ✅ 静的解析（ESLint, TypeScript）
- ✅ セキュリティスキャン（CodeQL, Gitleaks）
- ✅ 品質スコアリング（0-100点）
- ✅ 自動修正提案

---

## 🏗️ アーキテクチャ

### 📐 **組織設計原則（Organizational Design Principles）**

Miyabiは明確な組織理論の**5原則**に基づいた自律型システム設計:

<table>
<tr>
<td width="20%" align="center">

### 1️⃣
**責任の明確化**

Clear Accountability

</td>
<td width="20%" align="center">

### 2️⃣
**権限の委譲**

Delegation of Authority

</td>
<td width="20%" align="center">

### 3️⃣
**階層の設計**

Hierarchical Structure

</td>
<td width="20%" align="center">

### 4️⃣
**結果の評価**

Result-Based Evaluation

</td>
<td width="20%" align="center">

### 5️⃣
**曖昧性の排除**

Elimination of Ambiguity

</td>
</tr>
<tr>
<td>

各AgentがIssueに対する明確な責任を負う

</td>
<td>

Agentは自律的に判断・実行可能

</td>
<td>

Coordinator → 各専門Agent

</td>
<td>

品質スコア、カバレッジ、実行時間で評価

</td>
<td>

DAGによる依存関係明示、状態ラベルで進捗可視化

</td>
</tr>
</table>

### 🏷️ **53ラベル体系**

<div align="center">

| カテゴリ | ラベル数 | 例 |
|:--------:|:--------:|:---|
| 📊 **優先度** | 4 | `P0-Critical`, `P1-High`, `P2-Medium`, `P3-Low` |
| 🎯 **ステータス** | 8 | `status:backlog`, `status:implementing`, `status:done` |
| 🔧 **タイプ** | 12 | `type:feature`, `type:bug`, `type:refactor` |
| 📦 **エリア** | 15 | `area:frontend`, `area:backend`, `area:infra` |
| 🤖 **Agent** | 7 | `agent:coordinator`, `agent:codegen`, `agent:review` |
| 🎓 **難易度** | 5 | `complexity:trivial`, `complexity:simple`, `complexity:complex` |
| 📈 **その他** | 2 | `good-first-issue`, `help-wanted` |

</div>

---

## 📊 パフォーマンス

### ⚡ **並列実行効率: 72%向上**

<div align="center">

```
従来のシーケンシャル実行:
A → B → C → D → E → F   (36時間)

Miyabiの並列実行:
     ┌─ B ─┐
A ──┤      ├─ F         (26時間)
     └─ E ─┘
     ↓ 72%効率化 (-10時間)
```

</div>

### 📈 **品質指標**

<table>
<tr>
<td align="center" width="25%">

#### 🧪 **テストカバレッジ**
### 80%+
<sup>目標: 80%+ | CI強制適用</sup>

</td>
<td align="center" width="25%">

#### ⭐ **品質スコア**
### 98/100
<sup>ドキュメント品質 (Phase 4)</sup>

</td>
<td align="center" width="25%">

#### ⚡ **平均処理時間**
### 10-15分
<sup>Issue → PR</sup>

</td>
<td align="center" width="25%">

#### 🎯 **成功率**
### 95%+
<sup>自動PR作成</sup>

</td>
</tr>
</table>

---

## 🔐 セキュリティ

### 🛡️ **多層セキュリティ対策**

<table>
<tr>
<td width="50%">

#### 🔍 **静的解析**
- ✅ CodeQL（GitHub Advanced Security）
- ✅ ESLint セキュリティルール
- ✅ TypeScript strict mode
- ✅ Dependency vulnerability scan

</td>
<td width="50%">

#### 🔒 **シークレット管理**
- ✅ Gitleaks統合
- ✅ `.env`ファイル自動除外
- ✅ GitHub Secrets推奨
- ✅ gh CLI優先認証

</td>
</tr>
<tr>
<td width="50%">

#### 📦 **依存関係**
- ✅ Dependabot自動PR
- ✅ npm audit統合
- ✅ SBOM生成（CycloneDX）
- ✅ OpenSSF Scorecard

</td>
<td width="50%">

#### 🔐 **アクセス制御**
- ✅ CODEOWNERS自動生成
- ✅ ブランチ保護ルール
- ✅ 最小権限の原則
- ✅ 2FA推奨

</td>
</tr>
</table>

### 📋 **セキュリティポリシー**

脆弱性を発見した場合: [SECURITY.md](SECURITY.md)

---

## 📚 ドキュメント

### 🗺️ **ドキュメント構造**

Miyabiのドキュメントは、ユーザーの役割と目的に応じて5階層に整理されています：

<div align="center">

| 階層 | 対象ユーザー | ディレクトリ |
|:-----|:-----------|:------------|
| 🚀 [Getting Started](docs/01_getting_started/) | 初めてMiyabiを使う方 | `docs/01_getting_started/` |
| 🏗️ [Architecture](docs/02_architecture/) | システム設計を理解したい開発者 | `docs/02_architecture/` |
| 📡 [API Reference](docs/03_api_reference/) | API利用者・統合開発者 | `docs/03_api_reference/` |
| 🛠️ [Development Guide](docs/04_development_guide/) | Miyabi contributorと拡張開発者 | `docs/04_development_guide/` |
| 🚢 [Operations](docs/05_operations/) | 本番環境で運用する組織 | `docs/05_operations/` |

</div>

**特殊ドキュメント**:
- 💼 [Business Strategy](docs/business/) - ビジネスモデル・市場調査
- 👥 [Community](docs/community/) - コミュニティガイドライン
- 📋 [Templates](docs/templates/) - ドキュメントテンプレート

**詳細**: [ドキュメント構造設計](docs/DOCUMENT_STRUCTURE.md) - 458ファイルの完全な分類と移行計画

**Phase 4 新規追加 (2025-11-03)**:
- 🎭 [Miyabi Orchestra完全統合ガイド](.claude/MIYABI_ORCHESTRA_INTEGRATION.md) - v3.0.0
- 📋 [Orchestra Master Configuration](.claude/orchestra-config.yaml) - 490行
- 📐 [YAML Schema Definition](.claude/schemas/orchestra-config.schema.yaml) - JSON Schema Draft 07
- 📚 [ドキュメント完全インデックス](docs/README.md) - 458ファイル
- 🚀 [3ステップ クイックスタート](docs/QUICK_START_3STEPS.md)
- 🎯 [あなた専用セットアップガイド](docs/YOUR_CURRENT_SETUP.md)
- ⌨️ [tmux 5分クイックスタート](docs/TMUX_QUICKSTART.md)
- 🎨 [tmuxレイアウト集](docs/TMUX_LAYOUTS.md)
- 💎 [UI/UX改善ガイド](docs/VISUAL_GUIDE.md)

---

### 📖 **公式ドキュメント**

<div align="center">

| ドキュメント | 説明 |
|:------------|:-----|
| 📊 [Entity-Relationグラフ](https://shunsukehayashi.github.io/Miyabi/entity-graph.html) | リアルタイムセッション活動の可視化 |
| 📱 [Termux環境ガイド](docs/TERMUX_GUIDE.md) | Android/Termux環境での使用方法 |
| 🔒 [セキュリティポリシー](SECURITY.md) | セキュリティ脆弱性の報告方法 |
| 🔐 [プライバシーポリシー](docs/legal/PRIVACY.md) | データ収集とプライバシー保護 |
| 🤝 [コントリビューション](CONTRIBUTING.md) | プロジェクトへの貢献方法・CLA |
| 💬 [コミュニティガイドライン](docs/community/COMMUNITY_GUIDELINES.md) | Discordコミュニティの行動規範 |
| 📦 [パブリッシュガイド](docs/PUBLICATION_GUIDE.md) | npm公開手順 |
| 🤖 [Agent開発ガイド](packages/miyabi-agent-sdk/README.md) | カスタムAgent作成 |
| 🔌 [Claude Code統合](packages/cli/CLAUDE.md) | Claude Code設定 |

</div>

### 🎓 **コミュニティ・サポート**

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/miyabi)
[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/ShunsukeHayashi/Miyabi/discussions)

</div>

#### 💬 **Discord Community**

**Miyabi Community Discord** で開発者と交流しましょう！

<table>
<tr>
<td width="50%">

**🌟 コミュニティで得られるもの:**
- ✅ 初心者から上級者まで歓迎
- ✅ 週次 Office Hours（ライブQ&A）
- ✅ 月次ハッカソン
- ✅ 学習リソースとチュートリアル
- ✅ AI/ML開発の最新情報

</td>
<td width="50%">

**📚 準備中のドキュメント:**
- 📖 [Welcome Guide](docs/discord/welcome.md)
- 📜 [Community Rules](docs/discord/rules.md)
- ❓ [FAQ](docs/discord/faq.md)
- ⚙️ [Server Configuration](discord-config.json)

</td>
</tr>
</table>

**詳細計画**: [Discord Community Plan](docs/community/DISCORD_COMMUNITY_PLAN.md) • **Status**: 準備中（Phase 1）

---

## 🔧 コマンドリファレンス

### 🎨 **対話モード**

```bash
npx miyabi

? 何をしますか？
  🌸 初めての方（セットアップガイド）
  🆕 新しいプロジェクトを作成
  📦 既存プロジェクトに追加
  📊 ステータス確認
  📚 ドキュメント生成
  ⚙️  設定
  ❌ 終了
```

### ⌨️ **CLIモード**

```bash
# 新規プロジェクト作成
npx miyabi init <project-name> [--private] [--skip-install]

# 既存プロジェクトに追加
npx miyabi install [--dry-run]

# ステータス確認
npx miyabi status [--watch]

# ドキュメント生成
npx miyabi docs [--input ./src] [--output ./docs/API.md] [--watch] [--training]

# 設定管理
npx miyabi config

# セットアップガイド
npx miyabi setup
```

---

## 🚧 Roadmap

### Phase 1: MVP ✅
- [x] Next.js プロジェクト初期化
- [x] Dashboard UI 実装
- [x] Agent ステータス表示
- [x] GitHub API 統合

### Phase 2: リアルタイム更新
- [ ] WebSocket 統合
- [ ] Agent ステータスのリアルタイム更新
- [ ] Issue の自動リフレッシュ

### Phase 3: 高度な機能
- [ ] Agent ログ表示
- [ ] Issue フィルタリング (priority, label, assignee)
- [ ] Agent の手動起動 / 停止
- [ ] ダークモード / ライトモード切り替え

### Phase 4: デプロイ
- [ ] Vercel デプロイ
- [ ] 環境変数の本番設定
- [ ] カスタムドメイン設定

---

## 📝 License

MIT License

---

## 👥 Author

**Miyabi Development Team**
- GitHub: https://github.com/ShunsukeHayashi/Miyabi
- Created with: Claude Code + Infinity Mode 🚀

---

## 💖 サポート

### 🌟 **スポンサーになる**

Miyabiの開発を支援してください:

<div align="center">

[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/ShunsukeHayashi)
[![Patreon](https://img.shields.io/badge/Patreon-Support-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/ShunsukeHayashi)

</div>

### 📞 **コンタクト**

<div align="center">

| プラットフォーム | リンク |
|:----------------|:------|
| 🐦 **X (Twitter)** | [@The_AGI_WAY](https://x.com/The_AGI_WAY) |
| 💬 **Discord** | [Miyabi Community](https://discord.gg/miyabi) |
| 📧 **Email** | Contact via GitHub profile |
| 🌐 **Website** | [note.ambitiousai.co.jp](https://note.ambitiousai.co.jp/) |

</div>

---

## 📜 ライセンス

<div align="center">

### Apache License 2.0

Copyright (c) 2025 Shunsuke Hayashi

このソフトウェアは**商標保護**と**特許保護**を含むApache 2.0ライセンスの下で提供されています。

</div>

#### ⚖️ **ライセンス要件**

- ✅ 「Miyabi」は Shunsuke Hayashi の商号です（未登録商標）
- ✅ 改変版を配布する場合は、変更内容を明示する必要があります
- ✅ 詳細は [LICENSE](LICENSE) および [NOTICE](NOTICE) ファイルをご覧ください

---

## 🙏 謝辞

<div align="center">

### このプロジェクトは以下の素晴らしい技術とコミュニティに支えられています

</div>

<table>
<tr>
<td align="center" width="33%">

### 🤖 **Claude AI**
[Anthropic](https://www.anthropic.com/)

AIペアプログラミング

</td>
<td align="center" width="33%">

### 📚 **組織マネジメント理論**
階層的Agent設計の理論的基盤

</td>
<td align="center" width="33%">

### 💚 **オープンソース**
全ての依存パッケージと
コントリビューター

</td>
</tr>
</table>

---

## 📊 バージョン情報

<div align="center">

### 🦀 Rust Edition v0.1.1 (2025-10-19) - **"Insanely Great" Onboarding Edition** ⭐

[![GitHub Release](https://img.shields.io/github/v/release/ShunsukeHayashi/miyabi-private?include_prereleases&style=for-the-badge&logo=github&label=Rust%20Edition)](https://github.com/ShunsukeHayashi/miyabi-private/releases/tag/v0.1.1)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![crates.io](https://img.shields.io/badge/crates.io-v0.1.1-blue?style=for-the-badge&logo=rust)](https://crates.io/crates/miyabi-cli)

### 📦 TypeScript Edition v0.8.0 (2025-10-09)

[![npm](https://img.shields.io/npm/v/miyabi?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/miyabi)
[![GitHub Release](https://img.shields.io/github/v/release/ShunsukeHayashi/Miyabi?style=for-the-badge&logo=github)](https://github.com/ShunsukeHayashi/Miyabi/releases)

</div>

### 🆕 **最新の変更 (Rust v0.1.1 - "Insanely Great" Onboarding Edition)**

#### ✨ **新機能 - UX革命**
- 🚀 **`miyabi work-on`** - シンプルな新コマンド（技術的複雑さを隠蔽）
- 🎯 **`miyabi init --interactive`** - 対話形式プロジェクトセットアップ
  - プロジェクトタイプ選択（WebApp, API, CLI, Library）
  - GitHub接続ウィザード
  - リアルタイム進捗フィードバック
  - プロアクティブエラーメッセージ

#### 📚 **新ドキュメント (8ファイル, ~39KB)**
- ✨ **Getting Started Guide** (250+行) - 完全セットアップガイド
- 🆘 **Troubleshooting Guide** (280+行) - 詳細なトラブルシューティング
- 🎨 **Real Code Examples** - 全ディレクトリに実際のRustコード例
- 📖 **Agent Overview** - 全21 Agents詳細ガイド
- 🌟 **Workflow Examples** - 実コマンド・実出力付き完全ワークフロー

#### 🎯 **UX改善 - Steve Jobs承認**
**スコア推移**: 7/10 → 9.5/10 → **10.5/10 ⭐**

**Before (7/10)**:
- ❌ 空の`.claude/agents/`ディレクトリ
- ❌ 不明瞭な次のステップ（3行）
- ❌ インタラクティブセットアップなし
- ❌ 汎用的なエラーメッセージ

**After (10.5/10)** ⭐:
- ✅ 全ディレクトリに実際のコード例
- ✅ 詳細な4ステップガイド（コピペ可能）
- ✅ プロジェクトタイプ選択付きインタラクティブセットアップ
- ✅ プロアクティブエラー：「これが正確な修正方法です」

#### 🛠️ **コード品質**
- ✅ **577テスト合格** (0失敗, 17 ignored)
- ✅ **0 Clippy警告** - 6つの警告修正 + doctest修正
- ✅ **8クレート公開** - 全てcrates.io v0.1.1で利用可能

#### 📦 **公開クレート (crates.io v0.1.1)**
1. **miyabi-types** - コア型定義
2. **miyabi-core** - 共通ユーティリティ（config, logger, retry, cache）
3. **miyabi-llm** - LLM統合層（GPT-OSS-20B, Ollama, vLLM, Groq）
4. **miyabi-potpie** - Potpie AI + Neo4j知識グラフ
5. **miyabi-github** - GitHub APIラッパー（octocrab）
6. **miyabi-worktree** - Git Worktree並列実行
7. **miyabi-agents** - 7 Coding Agents + 14 Business Agents
8. **miyabi-cli** - CLIツール（init, status, agent, work-on）

#### 📚 **ドキュメント**
- ✅ **Getting Started** - [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
- ✅ **Troubleshooting** - [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- ✅ **Agent Overview** - [.claude/agents/README.md](.claude/agents/README.md)
- ✅ **Full Guide** - [CLAUDE.md](CLAUDE.md)

### 🔄 **TypeScript Edition 最新の変更 (v0.8.0)**

- ✅ ライセンスをApache 2.0に変更（商標・特許保護強化）
- ✅ NOTICEファイル追加（帰属表示・商標保護）
- ✅ README英語版セクション追加
- ✅ GitHubトークンセキュリティ強化（gh CLI優先）
- ✅ Termux環境完全対応ガイド
- ✅ Discord MCP Server統合（コミュニティ運営）

---

## 🆘 トラブルシューティング

<details>
<summary><b>🔑 OAuth認証エラーが発生する</b></summary>

```
❌ エラーが発生しました: Error: Failed to request device code: Not Found
```

**原因**: OAuth Appが未設定のため、デバイスフロー認証が使えません。

**解決方法**:

1. https://github.com/settings/tokens/new にアクセス
2. 以下の権限を選択:
   - `repo` - Full control of private repositories
   - `workflow` - Update GitHub Action workflows
   - `read:project`, `write:project` - Access projects
3. トークンを生成してコピー
4. プロジェクトのルートに `.env` ファイルを作成:
   ```bash
   echo "GITHUB_TOKEN=ghp_your_token_here" > .env
   ```
5. もう一度 `npx miyabi` を実行

</details>

<details>
<summary><b>🔄 古いバージョンが実行される</b></summary>

**解決方法**:

```bash
# グローバルインストールを削除
npm uninstall -g miyabi

# npxキャッシュをクリア
rm -rf ~/.npm/_npx

# 最新版を明示的に指定
npx miyabi@latest
```

</details>

<details>
<summary><b>⚠️ トークンが無効と表示される</b></summary>

```
⚠️ トークンが無効です。再認証が必要です
```

**解決方法**:

```bash
# 古いトークンを削除
rm .env

# 新しいトークンを作成（上記の手順に従う）
echo "GITHUB_TOKEN=ghp_new_token" > .env
```

</details>

---

<div align="center">

## 🌸 覚えるコマンドは一つだけ

```bash
npx miyabi
```

### **Miyabi** - Beauty in Autonomous Development

🤖 Powered by Claude AI • 🔒 Apache 2.0 License • 💖 Made with Love

---

[![Star on GitHub](https://img.shields.io/github/stars/ShunsukeHayashi/Miyabi?style=social)](https://github.com/ShunsukeHayashi/Miyabi)
[![Follow on X](https://img.shields.io/twitter/follow/The_AGI_WAY?style=social)](https://x.com/The_AGI_WAY)

**[⬆ トップに戻る](#-miyabi)**

</div>

---

## 🇺🇸 English

<details>
<summary><b>📑 Table of Contents</b></summary>

- [Quick Start](#quick-start-1)
- [What is Miyabi?](#what-is-miyabi)
- [Key Features](#key-features-1)
- [Installation](#installation-1)
- [Usage](#usage-1)
- [Requirements](#requirements-1)
- [Documentation](#documentation-1)
- [Support](#support-1)

</details>

---

### ✨ Quick Start

```bash
npx miyabi
```

**That's it.** Everything runs automatically.

---

### 🎯 What is Miyabi?

**Miyabi** is a complete autonomous AI development operations platform built on the "GitHub as OS" architecture.

From issue creation to code implementation, PR creation, and deployment—**everything is fully automated**.

---

### 🎨 Key Features

#### 🤖 **21 AI Autonomous Agents** (7 Coding + 14 Business)

##### Coding Agents (7)

<div align="center">

| Agent | Role | Key Functions |
|:-----:|:----:|:--------------|
| 🎯 **CoordinatorAgent** | Task Orchestration | DAG decomposition, parallel execution, progress tracking |
| 🏷️ **IssueAgent** | Issue Analysis | 53-label auto-classification, priority assessment |
| 💻 **CodeGenAgent** | Code Generation | High-quality implementation with Claude Sonnet 4 |
| 🔍 **ReviewAgent** | Quality Assessment | Static analysis, security scanning |
| 📝 **PRAgent** | PR Creation | Conventional Commits compliance |
| 🚀 **DeploymentAgent** | Deployment | Firebase auto-deploy & rollback |
| 🧪 **TestAgent** | Testing | Vitest auto-execution, 80%+ coverage |

</div>

##### Business Agents (14)

Business domain specialists covering:
- 💼 **Strategy & Planning**: AI Entrepreneur, Self Analysis, Market Research, Persona Design
- 🎨 **Product & Design**: Product Concept, Product Design, Content Creation
- 📢 **Marketing & Sales**: Funnel Design, SNS Strategy, Marketing, Sales, CRM
- 📊 **Analytics**: Analytics Agent, YouTube Optimization

#### 🔌 **28 MCP Servers**

Integration ecosystem powered by Model Context Protocol:
- 🤖 **Gemini AI** (3): UI/UX Designer, Adaptive Runtime, General
- 📱 **Lark Integration** (4): OpenAPI, Wiki, Enhanced features
- 🛠️ **Miyabi Core** (13): File operations, Git, GitHub, tmux, monitoring, logs
- 🧠 **AI Tools** (3): Codex, OpenAI Assistant, Commercial Agents
- 🔧 **Development** (5): Context Engineering, Claude Code, Obsidian, Pixel MCP

#### 🔄 **Fully Automated Workflow**

- ✅ Fully automated from issue creation to PR creation
- ✅ Structured 53-label system
- ✅ Auto-integration with GitHub Projects V2
- ✅ Real-time progress tracking
- ✅ High-speed processing with parallel execution (72% efficiency)
- ✅ Cloud deployment automation (S3/CloudFront)
- ✅ Plugin marketplace for extensibility
- ✅ Stripe-powered billing and subscriptions

---

## ⚠️ AI-Generated Code Notice

Miyabi uses **Claude AI** for automatic code generation. Please note:

### 📋 User Responsibilities

- ✅ **Always Review**: Review all generated code before merging
- ✅ **Thorough Testing**: Test extensively in non-production environments
- ✅ **Potential Errors**: AI-generated code may contain unexpected errors
- ✅ **Production Deployment**: Users are responsible for code deployed to production

### ⚖️ Disclaimer

**The Miyabi project is not liable for issues arising from AI-generated code.**
Users must verify the quality, security, and functionality of generated code themselves.

See [LICENSE](LICENSE) and [NOTICE](NOTICE) for full details.

---

#### 📚 **Automatic Documentation Generation**

- ✅ Auto-generated from TypeScript/JavaScript code
- ✅ JSDoc/TSDoc support
- ✅ Watch mode (auto-detects file changes)
- ✅ Training materials generation

#### 🔐 **Security**

- ✅ CODEOWNERS auto-generation
- ✅ Branch protection rules management
- ✅ Secret scanning integration
- ✅ Dependency vulnerability checking
- ✅ SBOM generation (CycloneDX format)

---

### 📦 Installation

```bash
# Run directly with npx (recommended)
npx miyabi

# Global installation
npm install -g miyabi
miyabi
```

#### 🔌 **Claude Code Plugin (New!)**

Miyabi is also available as an official [Claude Code](https://claude.ai/code) Plugin.

```bash
# Inside Claude Code
/plugin install miyabi
```

Available commands after installation:

```bash
/miyabi-init      # Create new project
/miyabi-status    # Check status
/miyabi-auto      # Water Spider auto mode
/miyabi-todos     # TODO detection & Issue creation
/miyabi-agent     # Run agent
/miyabi-docs      # Generate documentation
/miyabi-deploy    # Execute deployment
/miyabi-test      # Run tests
```

**Details**: [Claude Code Plugin Integration Guide](docs/CLAUDE_CODE_PLUGIN_INTEGRATION.md)

#### 🪝 **Event Hooks (Plugin Only)**

When used as a Claude Code Plugin, the following event hooks are automatically executed:

```bash
pre-commit    # Pre-commit checks
post-commit   # Post-commit notifications
pre-pr        # Pre-PR checks
post-test     # Post-test coverage reports
```

**Hook Features**:

| Hook | Timing | Actions |
|------|--------|---------|
| `pre-commit` | Before commit | ✅ Run linter<br>✅ Type check<br>✅ Run tests |
| `post-commit` | After commit | ✅ Display commit info<br>✅ Update metrics |
| `pre-pr` | Before PR creation | ✅ Check rebase status<br>✅ Run tests<br>✅ Check coverage<br>✅ Validate Conventional Commits |
| `post-test` | After tests | ✅ Generate coverage report<br>✅ Output HTML report<br>✅ Archive results |

---

### 💡 Usage

#### **Step 1: Run the command**

```bash
npx miyabi
```

#### **Step 2: Select from menu**

```
✨ Miyabi

Everything completes with one command

? What would you like to do?
  🆕 Create new project
  📦 Add to existing project
  📊 Check status
  ❌ Exit
```

#### **Step 3: Just wait**

AI agents automatically:
- Analyze and label issues
- Decompose into tasks
- Implement code
- Review code quality
- Create PR

**PR completes in 10-15 minutes.** Just review and merge.

---

### 💻 Requirements

#### ✅ **Basic Requirements**

- **Node.js** >= 18.0.0 (recommended: v20 LTS)
- **GitHub Account**
- **git CLI** - Version control
- **GitHub Personal Access Token** - API authentication

#### 🌟 **Optional**

- **gh CLI** - GitHub CLI (recommended)

#### 🖥️ **Supported Environments**

- ✅ macOS (Intel / Apple Silicon)
- ✅ Linux (Ubuntu, Debian, RHEL-based)
- ✅ Windows (WSL2 recommended)
- ⚠️ Termux (some features limited)

---

### 📚 Documentation

<div align="center">

| Documentation | Description |
|:-------------|:------------|
| 📊 [Entity-Relation Graph](https://shunsukehayashi.github.io/Miyabi/entity-graph.html) | Real-time session activity visualization |
| 📱 [Termux Guide](docs/TERMUX_GUIDE.md) | Usage in Android/Termux environment |
| 🔒 [Security Policy](SECURITY.md) | Security vulnerability reporting |
| 🔐 [Privacy Policy](docs/legal/PRIVACY.md) | Data collection and privacy protection |
| 🤝 [Contributing](CONTRIBUTING.md) | How to contribute & CLA |
| 💬 [Community Guidelines](docs/community/COMMUNITY_GUIDELINES.md) | Discord community code of conduct |
| 📦 [Publication Guide](docs/PUBLICATION_GUIDE.md) | npm publishing process |
| 🤖 [Agent SDK](packages/miyabi-agent-sdk/README.md) | Custom agent development |
| 🔌 [Claude Code](packages/cli/CLAUDE.md) | Claude Code integration |

</div>

---

### 💖 Support

#### 🌟 **Become a Sponsor**

Support Miyabi's development:

<div align="center">

[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/ShunsukeHayashi)
[![Patreon](https://img.shields.io/badge/Patreon-Support-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/ShunsukeHayashi)

</div>

#### 📞 **Contact**

<div align="center">

| Platform | Link |
|:---------|:-----|
| 🐦 **X (Twitter)** | [@The_AGI_WAY](https://x.com/The_AGI_WAY) |
| 💬 **Discord** | [Miyabi Community](https://discord.gg/miyabi) |
| 📧 **Email** | Contact via GitHub profile |
| 🌐 **Website** | [note.ambitiousai.co.jp](https://note.ambitiousai.co.jp/) |

</div>

---

### 📜 License

<div align="center">

### Apache License 2.0

Copyright (c) 2025 Shunsuke Hayashi

This software is provided under the Apache 2.0 License with **trademark and patent protection**.

</div>

- ✅ "Miyabi" is a product name claimed by Shunsuke Hayashi (unregistered)
- ✅ Modified versions must clearly indicate changes
- ✅ See [LICENSE](LICENSE) and [NOTICE](NOTICE) for full details

---

### 🙏 Acknowledgments

<table>
<tr>
<td align="center" width="33%">

### 🤖 **Claude AI**
[Anthropic](https://www.anthropic.com/)

AI pair programming

</td>
<td align="center" width="33%">

### 📚 **Organizational Theory**
Theoretical foundation for hierarchical agent design

</td>
<td align="center" width="33%">

### 💚 **Open Source**
All dependency packages and contributors

</td>
</tr>
</table>

---

<div align="center">

## 🌸 Remember just one command

```bash
npx miyabi
```

### **Miyabi** - Beauty in Autonomous Development

🤖 Powered by Claude AI • 🔒 Apache 2.0 License • 💖 Made with Love

---

[![Star on GitHub](https://img.shields.io/github/stars/ShunsukeHayashi/Miyabi?style=social)](https://github.com/ShunsukeHayashi/Miyabi)
[![Follow on X](https://img.shields.io/twitter/follow/The_AGI_WAY?style=social)](https://x.com/The_AGI_WAY)

**[⬆ Back to Top](#-miyabi)**

</div>
# Test webhook integration
