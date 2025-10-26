# Miyabi v1.2.0+ Future Roadmap - 他ツール統合戦略

**Date**: 2025-10-16
**Status**: Strategic Planning
**Version**: Draft v1.0

---

## 📋 Executive Summary

Miyabi v1.1.0完了後の長期戦略として、以下の5つの先進的フレームワークからアイデアを借用し、企業級AIエージェントプラットフォームへ進化させる。

**統合ソース**:
1. **Agentic Workflows** - 自然言語コンパイル + Safe Outputs
2. **Shannon** - Temporal + WASI Sandbox + OPA Policy + Budget Control
3. **Klavis AI** - MCP統合 + 600+ツール + Strataバンドル
4. **Prompt-To-Agent/Potpie** - コードベース特化 + サブエージェント生成
5. **n8n + Shinkai** - ノーコード統合 + A2A通信

**戦略目標**:
- 🔒 **Security First**: WASIサンドボックス、OPAポリシー、Safe Outputs
- 💰 **Economic Governance**: バジェットコントロール、Learning Router、マイクロペイメント
- 🚀 **Scalability**: MCP統合、Temporal耐久性、並列スケール
- 🧩 **Composability**: サブエージェント、A2A通信、モジュラーバンドル
- 🎯 **User Experience**: 自然言語コンパイル、ノーコードUI、動的ツール発見

---

## 🎯 1. Agentic Workflowsからの借用: 自然言語コンパイル + Safe Outputs

### 1.1 現状のMiyabiとのギャップ

**Miyabi v1.0.0**:
- ✅ DAGベースタスク分解（Coordinator Agent）
- ✅ 並列実行効率72%（Phase A → B/E並列化で36h → 26h）
- ❌ **自然言語からDAG生成は未サポート**（JSON/YAML手書き）
- ❌ **Safe Outputs未実装**（全エージェントがwrite権限持つ）

**Agentic Workflows**:
- ✅ Markdown → GitHub Actions YAMLコンパイル
- ✅ Safe Outputs（制限付き出力、例: PRのみ作成許可）
- ✅ Modular Workflows（@include syntaxで再利用）

### 1.2 統合提案

#### Feature 1: Natural Language to DAG Compiler

**コマンド**:
```bash
miyabi compile workflow.md --output dag.json

# workflow.md の例:
# 1. Analyze issue #270 with IssueAgent
# 2. In parallel:
#    - Generate code with CodeGenAgent
#    - Run tests with TestAgent
# 3. Review quality with ReviewAgent (requires 80+ score)
# 4. Create PR with PRAgent
```

**内部処理**:
```rust
// crates/miyabi-compiler/src/lib.rs
pub struct WorkflowCompiler {
    llm_client: ClaudeClient,
}

impl WorkflowCompiler {
    pub async fn compile(&self, markdown: &str) -> Result<DAG, CompileError> {
        let prompt = format!(
            "Convert this workflow to DAG JSON:\n\n{}\n\nOutput format: {{nodes: [...], edges: [...]}}",
            markdown
        );
        let response = self.llm_client.complete(&prompt).await?;
        let dag: DAG = serde_json::from_str(&response)?;
        self.validate_dag(&dag)?;
        Ok(dag)
    }
}
```

**実装優先度**: ⭐⭐⭐⭐ (High) - v1.2.0 候補
**理由**: Miyabiの初心者体験を劇的に改善、セットアップ時間50%削減

#### Feature 2: Safe Outputs（制限付き権限）

**YAML拡張**:
```yaml
# .miyabi.yml
agents:
  codegen:
    permissions:
      contents: read
    safe_outputs:
      - create-pull-request
      - add-comment
    tools:
      - edit
      - read
      - grep

  deployment:
    permissions:
      contents: write
      deployments: write
    safe_outputs:
      - deploy-staging
    tools:
      - bash
      - web-fetch
```

**Rust実装**:
```rust
// crates/miyabi-types/src/permissions.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPermissions {
    pub contents: PermissionLevel,
    pub safe_outputs: Vec<SafeOutput>,
    pub tools: Vec<Tool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SafeOutput {
    CreatePullRequest,
    AddComment,
    DeployStaging,
    UpdateLabel,
}

impl AgentPermissions {
    pub fn validate_action(&self, action: &AgentAction) -> Result<(), PermissionError> {
        match action {
            AgentAction::CreatePR => {
                if self.safe_outputs.contains(&SafeOutput::CreatePullRequest) {
                    Ok(())
                } else {
                    Err(PermissionError::SafeOutputNotAllowed)
                }
            }
            // ...
        }
    }
}
```

**実装優先度**: ⭐⭐⭐⭐⭐ (Critical) - v1.2.0 必須
**理由**: 企業級セキュリティに必須、PRAgent/DeploymentAgentの制御に重要

### 1.3 期待効果

- ✅ **初心者体験50%向上**: 自然言語でDAG作成
- ✅ **セキュリティ強化**: 最小権限原則、効果的なアクションを人間レビュー必須に
- ✅ **モジュラー化**: @include syntaxでエージェント再利用
- ✅ **GitHub統合深化**: GitHub ActionsとDAGを完全統合

---

## 🔒 2. Shannonからの借用: Temporal + WASI Sandbox + OPA + Budget Control

### 2.1 現状のMiyabiとのギャップ

**Miyabi v1.0.0**:
- ✅ Git Worktree並列実行
- ✅ 基本的なリトライ機能（Exponential Backoff）
- ❌ **ワークフロー耐久性なし**（プロセス死亡で状態消失）
- ❌ **サンドボックス未実装**（CodeGenAgentが任意コード実行可能）
- ❌ **ポリシー管理なし**（全チーム同一ルール）
- ❌ **バジェットコントロールなし**（トークン無制限消費リスク）

**Shannon**:
- ✅ Temporal Workflows（耐久性、タイムトラベルデバッグ）
- ✅ WASIサンドボックス（ネットワーク隔離、読取専用FS）
- ✅ OPA Policy Engine（チーム別ルール）
- ✅ Budget Control + Learning Router（トークン85-95%節約）

### 2.2 統合提案

#### Feature 1: Temporal Workflows統合

**アーキテクチャ変更**:
```
┌─────────────────────────────────────────────────────────┐
│ Miyabi CLI (Client)                                      │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Temporal Server (GitHub Actions or Self-Hosted)         │
│ - Workflow State Persistence                             │
│ - Time-Travel Debugging (Replay)                         │
│ - Automatic Retry on Failure                             │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Worker #1   │ │ Worker #2   │ │ Worker #3   │
│ CodeGenAgent│ │ ReviewAgent │ │ DeployAgent │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Rust Temporal SDK統合**:
```rust
// crates/miyabi-temporal/src/lib.rs
use temporal_sdk::{Worker, WorkflowClient, ActivityContext};

#[workflow]
async fn coordinate_issue_workflow(issue_id: u64) -> Result<WorkflowResult> {
    // Step 1: Analyze issue (deterministic, replayable)
    let analysis = IssueAgentActivity::analyze(issue_id).await?;

    // Step 2: Parallel execution (Temporal handles concurrency)
    let (code_result, test_result) = join!(
        CodeGenAgentActivity::generate(analysis.clone()),
        TestAgentActivity::run(analysis.clone())
    );

    // Step 3: Review (automatic retry on failure)
    let review = ReviewAgentActivity::review(code_result?).await?;

    // Step 4: Conditional PR (if quality >= 80)
    if review.quality_score >= 80 {
        PRAgentActivity::create_pr(review).await?;
    }

    Ok(WorkflowResult::success())
}

#[activity]
async fn analyze_issue(ctx: ActivityContext, issue_id: u64) -> Result<AnalysisResult> {
    // Activity can be retried automatically by Temporal
    let issue = fetch_issue(issue_id).await?;
    let labels = classify_issue(&issue).await?;
    Ok(AnalysisResult { issue, labels })
}
```

**GitHub Actions統合**:
```yaml
# .github/workflows/temporal-server.yml
name: Temporal Server

on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *' # Run every 6 hours

jobs:
  temporal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start Temporal Server
        run: |
          docker run -d -p 7233:7233 -p 8088:8088 temporalio/auto-setup:latest
          echo "Temporal UI: http://localhost:8088"

      - name: Run Miyabi Workers
        run: |
          cargo build --release --bin miyabi-worker
          ./target/release/miyabi-worker --temporal-server localhost:7233
```

**実装優先度**: ⭐⭐⭐⭐ (High) - v1.3.0 候補
**理由**: エンタープライズ必須、ワークフロー信頼性10倍向上

#### Feature 2: WASIサンドボックス（コード実行隔離）

**Wasmtime統合**:
```rust
// crates/miyabi-sandbox/src/lib.rs
use wasmtime::{Engine, Module, Store, Linker};
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder};

pub struct CodeSandbox {
    engine: Engine,
}

impl CodeSandbox {
    pub fn new() -> Self {
        let mut config = wasmtime::Config::new();
        config.wasm_multi_memory(true);
        config.async_support(true);
        Self {
            engine: Engine::new(&config).unwrap(),
        }
    }

    pub async fn execute_code(&self, code: &str) -> Result<String, SandboxError> {
        // Compile code to WASM
        let wasm_module = self.compile_to_wasm(code)?;

        // Create WASI context with restricted permissions
        let wasi = WasiCtxBuilder::new()
            .inherit_stdio()
            .preopened_dir(Dir::open_ambient_dir("/tmp/sandbox", ambient_authority())?, "/")
            .build();

        let mut store = Store::new(&self.engine, wasi);
        let module = Module::new(&self.engine, &wasm_module)?;

        // Execute with timeout (30s)
        let result = tokio::time::timeout(
            Duration::from_secs(30),
            self.run_module(&mut store, &module)
        ).await??;

        Ok(result)
    }
}
```

**CodeGenAgent統合**:
```rust
// crates/miyabi-agents/src/codegen.rs
impl CodeGenAgent {
    async fn execute_generated_code(&self, code: &str) -> Result<ExecutionResult> {
        let sandbox = CodeSandbox::new();

        // Execute in isolated WASI sandbox
        let output = sandbox.execute_code(code).await?;

        // Validate output (no network access, no file writes outside /tmp)
        self.validate_sandbox_output(&output)?;

        Ok(ExecutionResult { output, safe: true })
    }
}
```

**実装優先度**: ⭐⭐⭐⭐⭐ (Critical) - v1.2.0 必須
**理由**: コード実行の安全性、企業導入の必須要件

#### Feature 3: OPA Policy Engine（チーム別ルール）

**OPA Rego Policy**:
```rego
# policies/agent_permissions.rego
package miyabi.agents

default allow_agent = false

# DataScienceチームはClaude Sonnet 4のみ許可
allow_agent {
    input.team == "datascience"
    input.agent == "CodeGenAgent"
    input.llm_model == "claude-sonnet-4"
}

# DevOpsチームはDeploymentAgent許可
allow_agent {
    input.team == "devops"
    input.agent == "DeploymentAgent"
}

# 全チームがIssueAgentを使用可能
allow_agent {
    input.agent == "IssueAgent"
}
```

**Rust OPA統合**:
```rust
// crates/miyabi-policy/src/lib.rs
use opa_wasm::{Runtime, Policy};

pub struct PolicyEngine {
    runtime: Runtime,
}

impl PolicyEngine {
    pub fn new(policy_path: &str) -> Result<Self> {
        let policy_wasm = std::fs::read(policy_path)?;
        let runtime = Runtime::new(&policy_wasm)?;
        Ok(Self { runtime })
    }

    pub fn evaluate(&self, input: &PolicyInput) -> Result<bool> {
        let input_json = serde_json::to_string(input)?;
        let result = self.runtime.evaluate(&input_json)?;

        let decision: PolicyDecision = serde_json::from_str(&result)?;
        Ok(decision.allow_agent)
    }
}

#[derive(Serialize)]
struct PolicyInput {
    team: String,
    agent: String,
    llm_model: String,
}

#[derive(Deserialize)]
struct PolicyDecision {
    allow_agent: bool,
}
```

**Label統合**:
```yaml
# .miyabi.yml
policies:
  enabled: true
  engine: opa
  policy_file: policies/agent_permissions.rego

labels:
  - name: "policy:team-datascience"
    description: "Data Science team policy"
    color: "0366d6"
  - name: "policy:team-devops"
    description: "DevOps team policy"
    color: "0e8a16"
```

**実装優先度**: ⭐⭐⭐ (Medium) - v1.3.0 候補
**理由**: 大規模組織向け、初期はシンプルなRBACで十分

#### Feature 4: Budget Control + Learning Router

**トークンバジェット設定**:
```yaml
# .miyabi.yml
budget:
  enabled: true
  max_tokens_per_day: 100000
  max_tokens_per_issue: 5000
  learning_router:
    enabled: true
    algorithm: ucb # Upper Confidence Bound
    models:
      - name: claude-sonnet-4
        cost_per_token: 0.000015
      - name: claude-sonnet-3.5
        cost_per_token: 0.000003
      - name: gpt-4o-mini
        cost_per_token: 0.000001
```

**Learning Router実装**:
```rust
// crates/miyabi-budget/src/router.rs
use std::collections::HashMap;

pub struct LearningRouter {
    models: Vec<ModelConfig>,
    stats: HashMap<String, ModelStats>,
    algorithm: RoutingAlgorithm,
}

#[derive(Debug, Clone)]
struct ModelStats {
    total_calls: u64,
    total_tokens: u64,
    total_cost: f64,
    success_rate: f64,
}

impl LearningRouter {
    pub fn select_model(&mut self, task_type: TaskType) -> ModelConfig {
        match self.algorithm {
            RoutingAlgorithm::UCB => self.ucb_select(task_type),
            RoutingAlgorithm::EpsilonGreedy => self.epsilon_greedy_select(task_type),
        }
    }

    fn ucb_select(&self, task_type: TaskType) -> ModelConfig {
        // Upper Confidence Bound: balance exploration/exploitation
        let mut best_model = &self.models[0];
        let mut best_score = f64::MIN;

        let total_calls: u64 = self.stats.values().map(|s| s.total_calls).sum();

        for model in &self.models {
            let stats = self.stats.get(&model.name).unwrap();

            // UCB formula: success_rate + sqrt(2 * ln(total) / calls)
            let exploration_bonus = (2.0 * (total_calls as f64).ln() / stats.total_calls as f64).sqrt();
            let score = stats.success_rate + exploration_bonus;

            if score > best_score {
                best_score = score;
                best_model = model;
            }
        }

        best_model.clone()
    }

    pub fn record_result(&mut self, model: &str, tokens: u64, success: bool) {
        let stats = self.stats.get_mut(model).unwrap();
        stats.total_calls += 1;
        stats.total_tokens += tokens;
        stats.total_cost += tokens as f64 * self.get_model_cost(model);

        // Update success rate (exponential moving average)
        let alpha = 0.1;
        stats.success_rate = alpha * (if success { 1.0 } else { 0.0 }) + (1.0 - alpha) * stats.success_rate;
    }
}
```

**CoordinatorAgent統合**:
```rust
// crates/miyabi-agents/src/coordinator.rs
impl CoordinatorAgent {
    async fn execute_with_budget(&self, task: Task) -> Result<AgentResult> {
        let budget = self.config.budget_controller.get_remaining_budget()?;

        if budget.tokens < 1000 {
            return Err(MiyabiError::BudgetExceeded {
                current: budget.tokens,
                limit: self.config.budget.max_tokens_per_day,
            });
        }

        // Select model based on budget and task complexity
        let model = self.budget_controller.router.select_model(task.task_type);

        // Execute with selected model
        let result = self.execute_task_with_model(&task, &model).await?;

        // Record result for learning
        self.budget_controller.router.record_result(
            &model.name,
            result.tokens_used,
            result.success,
        );

        Ok(result)
    }
}
```

**実装優先度**: ⭐⭐⭐⭐ (High) - v1.2.0 候補
**理由**: コスト削減85-95%、企業導入の重要要件

### 2.3 期待効果

- ✅ **耐久性10倍向上**: Temporal Workflowsでプロセス死亡から復旧
- ✅ **セキュリティ強化**: WASIサンドボックスで任意コード実行を隔離
- ✅ **コスト削減85-95%**: Learning Routerで最適モデル自動選択
- ✅ **エンタープライズ対応**: OPAポリシーでチーム別ルール管理

---

## 🚀 3. Klavis AIからの借用: MCP統合 + 600+ツール + Strataバンドル

### 3.1 現状のMiyabiとのギャップ

**Miyabi v1.0.0**:
- ✅ 7つのCoding Agents（固定ツールセット）
- ❌ **動的ツール発見なし**（事前定義ツールのみ）
- ❌ **外部サービス統合限定**（GitHub, Firebase, Anthropicのみ）
- ❌ **MCPサーバー未対応**

**Klavis AI**:
- ✅ MCP（Model Context Protocol）で600+ツール
- ✅ Strataバンドル（Gmail/Slack/GitHub）で信頼性確保
- ✅ プログレッシブツール発見（必要時のみロード）
- ✅ ハイブリッドバンドル（クラウド + セルフホスト）

### 3.2 統合提案

#### Feature 1: MCPサーバー統合

**アーキテクチャ**:
```
┌─────────────────────────────────────────────────────────┐
│ Miyabi CLI                                               │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ MCP Gateway (Rust)                                       │
│ - Tool Discovery (dynamic)                               │
│ - Authentication (OAuth2/API Keys)                       │
│ - Rate Limiting (per-service)                            │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────────┐
        │           │           │               │
        ▼           ▼           ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ GitHub MCP  │ │ Gmail MCP   │ │ Slack MCP   │ │ Custom MCP  │
│ (Issues/PRs)│ │ (Email Send)│ │ (Notify)    │ │ (User Tool) │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**Rust MCP Client**:
```rust
// crates/miyabi-mcp/src/lib.rs
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct MCPClient {
    http_client: Client,
    servers: Vec<MCPServerConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MCPServerConfig {
    pub name: String,
    pub url: String,
    pub auth: AuthConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MCPTool {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

impl MCPClient {
    pub async fn discover_tools(&self, server: &str) -> Result<Vec<MCPTool>> {
        let config = self.servers.iter().find(|s| s.name == server).ok_or(MCPError::ServerNotFound)?;

        let response = self.http_client
            .get(format!("{}/tools", config.url))
            .header("Authorization", format!("Bearer {}", config.auth.token))
            .send()
            .await?;

        let tools: Vec<MCPTool> = response.json().await?;
        Ok(tools)
    }

    pub async fn call_tool(&self, server: &str, tool: &str, params: serde_json::Value) -> Result<serde_json::Value> {
        let config = self.servers.iter().find(|s| s.name == server).ok_or(MCPError::ServerNotFound)?;

        let response = self.http_client
            .post(format!("{}/tools/{}/execute", config.url, tool))
            .header("Authorization", format!("Bearer {}", config.auth.token))
            .json(&params)
            .send()
            .await?;

        let result: serde_json::Value = response.json().await?;
        Ok(result)
    }
}
```

**CLI統合**:
```bash
# MCPサーバー追加
miyabi mcp add --server Gmail --url https://mcp.klavis.ai/gmail --auth-token xxx

# Strataバンドル作成
miyabi mcp create-strata --name "CustomerSupport" --servers Gmail,Slack,GitHub

# Agent実行時に自動発見
miyabi agent run issue --issue 270 --mcp-servers CustomerSupport
```

**Agent統合**:
```rust
// crates/miyabi-agents/src/issue.rs
impl IssueAgent {
    async fn execute_with_mcp(&self, issue: &Issue) -> Result<AgentResult> {
        // Discover tools from MCP servers
        let gmail_tools = self.mcp_client.discover_tools("Gmail").await?;
        let slack_tools = self.mcp_client.discover_tools("Slack").await?;

        // Analyze issue
        let analysis = self.analyze_issue(issue).await?;

        // Send notification via Slack MCP
        if analysis.severity == Severity::Critical {
            self.mcp_client.call_tool("Slack", "send_message", json!({
                "channel": "#incidents",
                "text": format!("Critical issue: {}", issue.title)
            })).await?;
        }

        // Send email via Gmail MCP
        if analysis.requires_stakeholder_approval {
            self.mcp_client.call_tool("Gmail", "send_email", json!({
                "to": "stakeholder@example.com",
                "subject": format!("Approval needed: {}", issue.title),
                "body": analysis.summary
            })).await?;
        }

        Ok(AgentResult::success(analysis))
    }
}
```

**実装優先度**: ⭐⭐⭐⭐ (High) - v1.2.0 候補
**理由**: ツールスケーラビリティ、汎用性10倍向上

#### Feature 2: Strataバンドル（信頼性確保）

**バンドル定義**:
```yaml
# .miyabi.yml
mcp:
  strata_bundles:
    - name: "CustomerSupport"
      servers:
        - Gmail
        - Slack
        - GitHub
      reliability:
        health_check_interval: 60s
        retry_policy:
          max_attempts: 3
          backoff: exponential

    - name: "DevOps"
      servers:
        - GitHub
        - Firebase
        - Vercel
      reliability:
        health_check_interval: 30s
```

**Health Check実装**:
```rust
// crates/miyabi-mcp/src/strata.rs
pub struct StrataBundle {
    pub name: String,
    pub servers: Vec<MCPServerConfig>,
    pub health_checker: HealthChecker,
}

impl StrataBundle {
    pub async fn check_health(&self) -> Vec<ServerHealth> {
        let mut results = Vec::new();

        for server in &self.servers {
            let health = self.health_checker.check(server).await;
            results.push(health);
        }

        results
    }

    pub async fn execute_with_fallback(&self, tool: &str, params: serde_json::Value) -> Result<serde_json::Value> {
        // Try each server in bundle until success
        for server in &self.servers {
            match self.mcp_client.call_tool(&server.name, tool, params.clone()).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    tracing::warn!("Failed to call {} on {}: {}", tool, server.name, e);
                    continue;
                }
            }
        }

        Err(MCPError::AllServersFailed)
    }
}
```

**実装優先度**: ⭐⭐⭐ (Medium) - v1.3.0 候補
**理由**: 信頼性向上、初期はシンプルなリトライで十分

### 3.3 期待効果

- ✅ **ツール600+に拡張**: MCP統合で外部サービス無制限
- ✅ **汎用性10倍向上**: Gmail/Slack/Airbnb/GoogleMaps等を動的統合
- ✅ **信頼性向上**: Strataバンドルで自動フェイルオーバー
- ✅ **ノーコード統合**: n8nライクなビジュアルワークフローエディタ

---

## 🧩 4. Prompt-To-Agent/Potpieからの借用: サブエージェント生成 + 知識グラフ

### 4.1 現状のMiyabiとのギャップ

**Miyabi v1.0.0**:
- ✅ 7つの固定Coding Agents
- ❌ **動的サブエージェント生成なし**（全タスクを7エージェントで処理）
- ❌ **コードベース知識グラフなし**（静的解析のみ）
- ❌ **Context混乱リスク**（複雑タスクでエージェントが混乱）

**Prompt-To-Agent/Potpie**:
- ✅ プロンプトから専門サブエージェント生成（例: バグ修正専用）
- ✅ コードベース知識グラフ（関数/クラス関係を理解）
- ✅ Contextモジュール化（サブエージェントで混乱防止）

### 4.2 統合提案

#### Feature 1: 動的サブエージェント生成

**CLI**:
```bash
# プロンプトからサブエージェント生成
miyabi create-subagent --prompt "Fix all clippy warnings in miyabi-cli" --parent CodeGenAgent

# 生成されたサブエージェント実行
miyabi agent run subagent-clippy-fix --issue 270
```

**Rust実装**:
```rust
// crates/miyabi-agents/src/subagent_factory.rs
pub struct SubAgentFactory {
    llm_client: ClaudeClient,
}

impl SubAgentFactory {
    pub async fn create_from_prompt(&self, prompt: &str, parent: AgentType) -> Result<SubAgent> {
        let system_prompt = format!(
            "You are a SubAgent Factory. Generate a specialized agent spec from this prompt:\n\n{}\n\nOutput JSON: {{name, description, tools, constraints}}",
            prompt
        );

        let response = self.llm_client.complete(&system_prompt).await?;
        let spec: SubAgentSpec = serde_json::from_str(&response)?;

        // Validate spec against parent agent
        self.validate_spec(&spec, parent)?;

        // Create SubAgent instance
        let subagent = SubAgent {
            id: uuid::Uuid::new_v4(),
            name: spec.name,
            description: spec.description,
            parent,
            tools: spec.tools,
            constraints: spec.constraints,
        };

        Ok(subagent)
    }
}

#[derive(Debug, Clone)]
pub struct SubAgent {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub parent: AgentType,
    pub tools: Vec<Tool>,
    pub constraints: Vec<Constraint>,
}

#[async_trait]
impl BaseAgent for SubAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult> {
        // Execute with parent agent's capabilities
        // but constrained to subagent's specific purpose

        let context = self.build_context(&task).await?;
        let result = self.execute_with_constraints(&context).await?;

        Ok(result)
    }
}
```

**Git Worktree統合**（Context混乱防止）:
```rust
// crates/miyabi-worktree/src/manager.rs
impl WorktreeManager {
    pub async fn create_subagent_worktree(&self, subagent: &SubAgent, issue_id: u64) -> Result<Worktree> {
        // Each subagent gets isolated worktree
        let branch_name = format!("subagent-{}-issue-{}", subagent.name, issue_id);
        let worktree_path = self.base_path.join(&branch_name);

        // Create worktree (no stomp conflicts)
        self.git_repo.worktree(&branch_name, &worktree_path, None)?;

        // Write subagent context
        let context_path = worktree_path.join(".subagent-context.json");
        std::fs::write(&context_path, serde_json::to_string_pretty(&subagent)?)?;

        Ok(Worktree {
            path: worktree_path,
            branch: branch_name,
            agent: AgentType::SubAgent(subagent.clone()),
        })
    }
}
```

**実装優先度**: ⭐⭐⭐⭐ (High) - v1.2.0 候補
**理由**: タスク特化エージェント、デバッグ容易性10倍向上

#### Feature 2: コードベース知識グラフ

**AST解析 + グラフ構築**:
```rust
// crates/miyabi-knowledge-graph/src/lib.rs
use tree_sitter::{Parser, Language};
use petgraph::Graph;

pub struct CodebaseGraph {
    graph: Graph<CodeEntity, Relation>,
}

#[derive(Debug, Clone)]
pub enum CodeEntity {
    Function { name: String, file: PathBuf, line: u32 },
    Struct { name: String, file: PathBuf, line: u32 },
    Module { name: String, path: PathBuf },
}

#[derive(Debug, Clone)]
pub enum Relation {
    Calls,
    Imports,
    Implements,
    Uses,
}

impl CodebaseGraph {
    pub fn build_from_repo(repo_path: &Path) -> Result<Self> {
        let mut graph = Graph::new();
        let mut parser = Parser::new();
        parser.set_language(tree_sitter_rust::language())?;

        // Parse all Rust files
        for entry in walkdir::WalkDir::new(repo_path).into_iter().filter_map(|e| e.ok()) {
            if entry.path().extension() == Some(OsStr::new("rs")) {
                let source = std::fs::read_to_string(entry.path())?;
                let tree = parser.parse(&source, None).unwrap();

                // Extract entities and relations
                self.extract_entities(&tree, entry.path(), &mut graph)?;
            }
        }

        Ok(Self { graph })
    }

    pub fn find_related_functions(&self, function_name: &str) -> Vec<CodeEntity> {
        // Find all functions called by or calling the target function
        let mut related = Vec::new();

        for node_index in self.graph.node_indices() {
            let entity = &self.graph[node_index];
            if let CodeEntity::Function { name, .. } = entity {
                if name == function_name {
                    // Find neighbors (called functions)
                    for neighbor in self.graph.neighbors(node_index) {
                        related.push(self.graph[neighbor].clone());
                    }
                }
            }
        }

        related
    }
}
```

**TestAgent統合**:
```rust
// crates/miyabi-agents/src/test.rs
impl TestAgent {
    async fn suggest_coverage_improvements(&self) -> Result<Vec<Suggestion>> {
        // Build knowledge graph
        let graph = CodebaseGraph::build_from_repo(&self.repo_path).await?;

        // Analyze test coverage
        let coverage = self.get_coverage_report().await?;

        let mut suggestions = Vec::new();

        for entity in graph.all_entities() {
            if let CodeEntity::Function { name, file, line } = entity {
                if !coverage.is_covered(&name) {
                    // Find related functions for context
                    let related = graph.find_related_functions(&name);

                    suggestions.push(Suggestion {
                        function: name.clone(),
                        file: file.clone(),
                        line: *line,
                        reason: format!("Uncovered function, called by: {:?}", related),
                        priority: self.calculate_priority(&related),
                    });
                }
            }
        }

        Ok(suggestions)
    }
}
```

**実装優先度**: ⭐⭐⭐ (Medium) - v1.3.0 候補
**理由**: テストカバレッジ向上、初期は静的解析で十分

### 4.3 期待効果

- ✅ **タスク特化エージェント**: プロンプトから専門エージェント生成
- ✅ **Context混乱解消**: Git Worktreeでサブエージェント隔離
- ✅ **テストカバレッジ向上**: 知識グラフで未テスト関数発見
- ✅ **デバッグ容易性10倍**: サブエージェントでエラー追跡容易

---

## 🌐 5. n8n + Shinkaiからの借用: ノーコード統合 + A2A通信

### 5.1 現状のMiyabiとのギャップ

**Miyabi v1.0.0**:
- ✅ CLI駆動（技術者向け）
- ❌ **ノーコードUI なし**（非技術者はCLI必須）
- ❌ **A2A通信なし**（エージェント間通信は内部のみ）
- ❌ **経済ガバナンスなし**（マイクロペイメント未対応）

**n8n + Shinkai**:
- ✅ ノーコードワークフローエディタ
- ✅ A2A（Agent-to-Agent）通信プロトコル
- ✅ コンポーザブルエージェント（エージェントをAPIとして公開）
- ✅ マイクロペイメント（Crypto統合で経済ガバナンス）

### 5.2 統合提案

#### Feature 1: n8nワークフローエディタ統合

**アーキテクチャ**:
```
┌─────────────────────────────────────────────────────────┐
│ Miyabi Web UI (React + n8n Canvas)                      │
│ - Drag & Drop Agent Nodes                               │
│ - Visual DAG Editor                                      │
│ - Real-time Execution Monitor                            │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Miyabi API Server (Rust + Axum)                         │
│ - Workflow CRUD (Create/Read/Update/Delete)             │
│ - Execution Engine (DAG → Agents)                       │
│ - WebSocket (Live Updates)                               │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ IssueAgent  │ │ CodeGenAgent│ │ ReviewAgent │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Axum API Server**:
```rust
// crates/miyabi-api-server/src/main.rs
use axum::{Router, routing::{get, post}, Json};
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/workflows", post(create_workflow))
        .route("/api/workflows/:id", get(get_workflow))
        .route("/api/workflows/:id/execute", post(execute_workflow))
        .route("/ws/execution/:id", get(ws_execution_monitor))
        .layer(CorsLayer::permissive());

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn create_workflow(Json(workflow): Json<WorkflowDefinition>) -> Json<Workflow> {
    // Save workflow to DB (SQLite)
    let id = uuid::Uuid::new_v4();
    let saved_workflow = save_workflow(id, workflow).await.unwrap();
    Json(saved_workflow)
}

async fn execute_workflow(Path(id): Path<Uuid>) -> Json<ExecutionResult> {
    // Load workflow from DB
    let workflow = load_workflow(id).await.unwrap();

    // Convert to DAG
    let dag = workflow_to_dag(&workflow).unwrap();

    // Execute with CoordinatorAgent
    let coordinator = CoordinatorAgent::new(Config::default());
    let result = coordinator.execute_dag(dag).await.unwrap();

    Json(result)
}
```

**React + n8n Canvas UI**:
```typescript
// packages/miyabi-web-ui/src/WorkflowEditor.tsx
import React, { useState } from 'react';
import { WorkflowCanvas } from 'n8n-workflow';
import { useWorkflowAPI } from './hooks/useWorkflowAPI';

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'IssueAgent', position: { x: 100, y: 100 } },
    { id: '2', type: 'CodeGenAgent', position: { x: 300, y: 100 } },
    { id: '3', type: 'ReviewAgent', position: { x: 500, y: 100 } },
  ]);

  const { createWorkflow, executeWorkflow } = useWorkflowAPI();

  const handleSave = async () => {
    const workflow = {
      name: 'Auto Code Review',
      nodes,
      edges: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
      ],
    };

    const saved = await createWorkflow(workflow);
    console.log('Saved workflow:', saved.id);
  };

  const handleExecute = async () => {
    const result = await executeWorkflow(workflowId);
    console.log('Execution result:', result);
  };

  return (
    <div>
      <WorkflowCanvas nodes={nodes} onNodesChange={setNodes} />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleExecute}>Execute</button>
    </div>
  );
};
```

**実装優先度**: ⭐⭐⭐ (Medium) - v1.4.0 候補
**理由**: ユーザー体験向上、初期はCLIで十分

#### Feature 2: A2A通信プロトコル

**エージェント間通信API**:
```rust
// crates/miyabi-a2a/src/protocol.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2AMessage {
    pub from: AgentId,
    pub to: AgentId,
    pub message_type: MessageType,
    pub payload: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    TaskRequest,
    TaskResult,
    Query,
    Response,
}

pub struct A2AProtocol {
    message_queue: Arc<RwLock<Vec<A2AMessage>>>,
}

impl A2AProtocol {
    pub async fn send_message(&self, message: A2AMessage) -> Result<()> {
        // Send message to target agent (via message queue)
        let mut queue = self.message_queue.write().await;
        queue.push(message);
        Ok(())
    }

    pub async fn receive_messages(&self, agent_id: AgentId) -> Vec<A2AMessage> {
        // Get all messages for this agent
        let mut queue = self.message_queue.write().await;
        queue.drain_filter(|msg| msg.to == agent_id).collect()
    }
}
```

**CoordinatorAgent統合**:
```rust
// crates/miyabi-agents/src/coordinator.rs
impl CoordinatorAgent {
    async fn delegate_to_specialist(&self, task: Task) -> Result<AgentResult> {
        // Send task request to specialist agent
        let message = A2AMessage {
            from: self.agent_id,
            to: self.select_specialist(&task).agent_id,
            message_type: MessageType::TaskRequest,
            payload: serde_json::to_value(&task)?,
            timestamp: chrono::Utc::now(),
        };

        self.a2a_protocol.send_message(message).await?;

        // Wait for response
        loop {
            let messages = self.a2a_protocol.receive_messages(self.agent_id).await;

            for msg in messages {
                if msg.message_type == MessageType::TaskResult {
                    let result: AgentResult = serde_json::from_value(msg.payload)?;
                    return Ok(result);
                }
            }

            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }
}
```

**実装優先度**: ⭐⭐ (Low) - v1.5.0 候補
**理由**: 初期は内部通信で十分、分散エージェントは将来課題

#### Feature 3: マイクロペイメント（Crypto統合）

**Wallet統合**:
```rust
// crates/miyabi-crypto/src/wallet.rs
use ethers::prelude::*;

pub struct CryptoWallet {
    provider: Provider<Http>,
    wallet: LocalWallet,
}

impl CryptoWallet {
    pub async fn pay_for_execution(&self, agent_id: AgentId, amount: U256) -> Result<TxHash> {
        // Send ETH to agent's wallet
        let tx = TransactionRequest::new()
            .to(agent_id.wallet_address)
            .value(amount);

        let tx_hash = self.wallet.send_transaction(tx, None).await?;
        Ok(tx_hash)
    }

    pub async fn get_balance(&self) -> Result<U256> {
        let balance = self.provider.get_balance(self.wallet.address(), None).await?;
        Ok(balance)
    }
}
```

**経済ガバナンス**:
```yaml
# .miyabi.yml
crypto:
  enabled: true
  network: polygon # Low gas fees
  payment_model: pay-per-execution
  rates:
    IssueAgent: 0.001 MATIC
    CodeGenAgent: 0.01 MATIC
    DeploymentAgent: 0.05 MATIC
```

**実装優先度**: ⭐ (Very Low) - v2.0.0+ 候補
**理由**: 実験的機能、初期は不要

### 5.3 期待効果

- ✅ **非技術者対応**: ノーコードUIで初心者体験10倍向上
- ✅ **分散エージェント**: A2A通信でグローバルスケール
- ✅ **経済ガバナンス**: マイクロペイメントでリソース最適化
- ✅ **AIインターネット化**: Miyabiを「AIのためのOS」に進化

---

## 📅 実装ロードマップ（優先度順）

### v1.2.0 (2026-03-31) - セキュリティ & 基盤強化

**Critical (必須)**:
- ✅ **WASIサンドボックス** (Shannon) - コード実行安全性
- ✅ **Safe Outputs** (Agentic Workflows) - 権限制御
- ✅ **Budget Control + Learning Router** (Shannon) - コスト削減85-95%

**High (推奨)**:
- ✅ **自然言語コンパイル** (Agentic Workflows) - 初心者体験50%向上
- ✅ **MCPサーバー統合** (Klavis AI) - ツール600+に拡張
- ✅ **動的サブエージェント生成** (Potpie) - タスク特化エージェント

**推定工数**: ~12週間（3ヶ月）

### v1.3.0 (2026-07-31) - エンタープライズ対応

**High (推奨)**:
- ✅ **Temporal Workflows** (Shannon) - 耐久性10倍向上
- ✅ **OPA Policy Engine** (Shannon) - チーム別ルール管理

**Medium (オプション)**:
- ✅ **Strataバンドル** (Klavis AI) - 信頼性向上
- ✅ **コードベース知識グラフ** (Potpie) - テストカバレッジ向上

**推定工数**: ~8週間（2ヶ月）

### v1.4.0 (2026-11-30) - UX強化

**Medium (オプション)**:
- ✅ **n8nワークフローエディタ** (n8n) - ノーコードUI

**推定工数**: ~6週間（1.5ヶ月）

### v1.5.0 (2027-03-31) - 分散エージェント

**Low (実験的)**:
- ✅ **A2A通信プロトコル** (Shinkai) - エージェント間通信

**推定工数**: ~4週間（1ヶ月）

### v2.0.0 (2027-07-31) - AIインターネット化

**Very Low (研究的)**:
- ✅ **マイクロペイメント** (Shinkai) - 経済ガバナンス

**推定工数**: ~8週間（2ヶ月）

---

## 🎯 戦略的優先順位（Top 3）

### 1位: WASIサンドボックス + Safe Outputs（v1.2.0必須）

**理由**:
- 企業導入の必須要件（セキュリティ）
- CodeGenAgentの任意コード実行を隔離
- DeploymentAgentの破壊的操作を防止

**ROI**: ⭐⭐⭐⭐⭐ (Very High)

### 2位: Budget Control + Learning Router（v1.2.0必須）

**理由**:
- コスト削減85-95%（Shannon実績）
- 企業導入の経済的メリット明確
- トークン無制限消費リスク解消

**ROI**: ⭐⭐⭐⭐⭐ (Very High)

### 3位: 自然言語コンパイル + MCPサーバー統合（v1.2.0推奨）

**理由**:
- 初心者体験50%向上（自然言語でDAG生成）
- ツール600+に拡張（汎用性10倍）
- Miyabiの競争優位性確立

**ROI**: ⭐⭐⭐⭐ (High)

---

## 📊 総合評価マトリックス

| Feature | 優先度 | ROI | 工数 | リスク | Version |
|---------|--------|-----|------|--------|---------|
| **WASIサンドボックス** | ⭐⭐⭐⭐⭐ | Very High | 3週 | Medium | v1.2.0 |
| **Safe Outputs** | ⭐⭐⭐⭐⭐ | Very High | 2週 | Low | v1.2.0 |
| **Budget Control** | ⭐⭐⭐⭐⭐ | Very High | 3週 | Medium | v1.2.0 |
| **自然言語コンパイル** | ⭐⭐⭐⭐ | High | 2週 | Low | v1.2.0 |
| **MCPサーバー統合** | ⭐⭐⭐⭐ | High | 4週 | Medium | v1.2.0 |
| **サブエージェント生成** | ⭐⭐⭐⭐ | High | 2週 | Low | v1.2.0 |
| **Temporal Workflows** | ⭐⭐⭐⭐ | High | 4週 | High | v1.3.0 |
| **OPA Policy Engine** | ⭐⭐⭐ | Medium | 3週 | Medium | v1.3.0 |
| **Strataバンドル** | ⭐⭐⭐ | Medium | 2週 | Low | v1.3.0 |
| **知識グラフ** | ⭐⭐⭐ | Medium | 4週 | High | v1.3.0 |
| **n8nエディタ** | ⭐⭐⭐ | Medium | 6週 | Medium | v1.4.0 |
| **A2A通信** | ⭐⭐ | Low | 4週 | High | v1.5.0 |
| **Crypto統合** | ⭐ | Very Low | 8週 | Very High | v2.0.0 |

---

## 🚀 Next Steps

1. **v1.1.0完了** (2025-11-30) - Business Agents + Enhanced Errors
2. **v1.2.0計画** (2026-01-01 開始) - セキュリティ & 基盤強化
3. **アーキテクチャ設計** - WASI/Safe Outputs/Budget統合設計書作成
4. **プロトタイプ** - WASIサンドボックスのPoC実装（2週間）
5. **コミュニティフィードバック** - GitHub Discussionsで優先度調整

---

**Document Version**: Draft v1.0
**Last Updated**: 2025-10-16
**Status**: Strategic Planning ✅
**Owner**: Shunsuke Hayashi
