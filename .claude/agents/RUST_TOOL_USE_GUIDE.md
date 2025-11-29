---
name: doc_RUST_TOOL_USE_GUIDE
description: Documentation file: RUST_TOOL_USE_GUIDE.md
---

# Rust Tool Use Guide - A2A Bridge

**Version**: 1.0.0
**Last Updated**: 2025-11-22

このガイドでは、MiyabiのA2A Bridgeを使用してRustツールからAgentを呼び出す方法を説明します。

---

## 概要

A2A (Agent-to-Agent) Bridgeは、MCP（Model Context Protocol）とRust Agentを接続するレイヤーです。これにより、外部クライアントはJSON-RPC経由でRust実装のAgentを呼び出すことができます。

### アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MCP Client     │────▶│   A2A Bridge    │────▶│   Rust Agent    │
│  (Claude Code)  │◀────│   (Gateway)     │◀────│   (A2AEnabled)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 初期化

### Agent登録

全てのAgentをA2A Gatewayに登録します：

```rust
use miyabi_mcp_server::{A2ABridge, initialize_all_agents};

// Bridge初期化
let bridge = A2ABridge::new().await?;

// 全Agent登録（21 Agents）
initialize_all_agents(&bridge).await?;

// または個別に登録
bridge.register_agent(
    "coordinator",
    CoordinatorAgent::new(config).await?
).await?;
```

### 登録されるAgent一覧

**Coding Agents (7個)**:
- CoordinatorAgent
- CodeGenAgent
- ReviewAgent
- IssueAgent
- PRAgent
- DeploymentAgent
- RefresherAgent

**Business Agents (14個)**:
- AIEntrepreneurAgent
- SelfAnalysisAgent
- MarketResearchAgent
- PersonaAgent
- ProductConceptAgent
- ProductDesignAgent
- ContentCreationAgent
- FunnelDesignAgent
- SNSStrategyAgent
- MarketingAgent
- SalesAgent
- CRMAgent
- AnalyticsAgent
- YouTubeAgent

---

## 呼び出し方法

### 1. MCP JSON-RPC経由

MCPクライアントからJSON-RPC 2.0プロトコルで呼び出します：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "a2a.execute",
  "params": {
    "tool_name": "a2a.code_generation_agent.generate_code",
    "input": {
      "issue_number": 123,
      "context": "Fix authentication bug"
    }
  }
}
```

**レスポンス例**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "output": "Generated code for issue #123...",
    "metadata": {
      "execution_time_ms": 1234,
      "tokens_used": 5678
    }
  }
}
```

### 2. Rust直接呼び出し

Rustコードから直接A2ABridgeを使用：

```rust
use miyabi_mcp_server::{A2ABridge, initialize_all_agents};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Bridge初期化
    let bridge = A2ABridge::new().await?;
    initialize_all_agents(&bridge).await?;

    // ツール実行
    let result = bridge.execute_tool(
        "a2a.code_generation_agent.generate_code",
        json!({
            "issue_number": 123,
            "language": "rust",
            "context": "Implement new feature"
        })
    ).await?;

    if result.success {
        println!("Generated code: {}", result.output);
    } else {
        eprintln!("Error: {}", result.error.unwrap_or_default());
    }

    Ok(())
}
```

### 3. Claude Code Sub-agent経由

Claude CodeのTask toolを使用してSub-agentとして呼び出し：

```markdown
Task tool呼び出し例:
- description: "コード生成"
- prompt: "Issue #123のバグを修正するコードを生成してください"
- subagent_type: "CodeGenAgent"
```

---

## ツール一覧

### Coding Agents

#### CoordinatorAgent
```
a2a.task_coordination_and_parallel_execution_agent.decompose_issue
a2a.task_coordination_and_parallel_execution_agent.generate_execution_plan
a2a.task_coordination_and_parallel_execution_agent.orchestrate_agents
```

#### CodeGenAgent
```
a2a.code_generation_agent.generate_code
a2a.code_generation_agent.generate_documentation
```

#### ReviewAgent
```
a2a.code_quality_review_agent.review_code
a2a.code_quality_review_agent.security_audit
a2a.code_quality_review_agent.calculate_score
```

#### IssueAgent
```
a2a.issue_analysis_and_task_metadata_creation_agent.analyze_issue
a2a.issue_analysis_and_task_metadata_creation_agent.infer_labels
a2a.issue_analysis_and_task_metadata_creation_agent.create_sub_issue
```

#### PRAgent
```
a2a.pull_request_creation_and_management_agent.create_pr
a2a.pull_request_creation_and_management_agent.update_pr
a2a.pull_request_creation_and_management_agent.assign_reviewers
```

#### DeploymentAgent
```
a2a.ci/cd_deployment_automation_agent.deploy
a2a.ci/cd_deployment_automation_agent.health_check
a2a.ci/cd_deployment_automation_agent.rollback
```

#### RefresherAgent
```
a2a.issue_status_monitoring_and_auto-update_agent.refresh_issues
a2a.issue_status_monitoring_and_auto-update_agent.check_implementation_status
a2a.issue_status_monitoring_and_auto-update_agent.generate_summary
```

### Business Agents

#### AIEntrepreneurAgent
```
a2a.ai_entrepreneur_support_and_business_planning_agent.create_business_plan
a2a.ai_entrepreneur_support_and_business_planning_agent.execute_phase
a2a.ai_entrepreneur_support_and_business_planning_agent.generate_report
```

#### SelfAnalysisAgent
```
a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self
a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.generate_swot
a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.extract_skills
```

#### MarketResearchAgent
```
a2a.market_research_and_competitive_analysis_agent.research_market
a2a.market_research_and_competitive_analysis_agent.analyze_competitors
a2a.market_research_and_competitive_analysis_agent.identify_opportunities
```

#### PersonaAgent
```
a2a.persona_and_customer_segment_analysis_agent.analyze_personas
a2a.persona_and_customer_segment_analysis_agent.create_journey_map
a2a.persona_and_customer_segment_analysis_agent.identify_pain_points
```

#### ProductConceptAgent
```
a2a.product_concept_and_business_model_design_agent.design_concept
a2a.product_concept_and_business_model_design_agent.design_business_model
a2a.product_concept_and_business_model_design_agent.define_mvp
```

#### ProductDesignAgent
```
a2a.product_design_and_service_specification_agent.design_service
a2a.product_design_and_service_specification_agent.create_content_plan
a2a.product_design_and_service_specification_agent.define_tech_stack
```

#### ContentCreationAgent
```
a2a.content_creation_and_production_agent.create_content
a2a.content_creation_and_production_agent.plan_production
a2a.content_creation_and_production_agent.optimize_distribution
```

#### FunnelDesignAgent
```
a2a.customer_funnel_design_agent.design_funnel
a2a.customer_funnel_design_agent.optimize_touchpoints
a2a.customer_funnel_design_agent.calculate_conversion
```

#### SNSStrategyAgent
```
a2a.sns_strategy_and_content_planning_agent.plan_strategy
a2a.sns_strategy_and_content_planning_agent.create_calendar
a2a.sns_strategy_and_content_planning_agent.analyze_engagement
```

#### MarketingAgent
```
a2a.marketing_strategy_and_execution_agent.execute_marketing
a2a.marketing_strategy_and_execution_agent.plan_ads
a2a.marketing_strategy_and_execution_agent.optimize_seo
```

#### SalesAgent
```
a2a.sales_process_optimization_agent.optimize_sales
a2a.sales_process_optimization_agent.manage_leads
a2a.sales_process_optimization_agent.create_pipeline
```

#### CRMAgent
```
a2a.customer_relationship_management_agent.manage_customers
a2a.customer_relationship_management_agent.maximize_ltv
a2a.customer_relationship_management_agent.reduce_churn
```

#### AnalyticsAgent
```
a2a.data_analytics_and_business_intelligence_agent.analyze_data
a2a.data_analytics_and_business_intelligence_agent.generate_report
a2a.data_analytics_and_business_intelligence_agent.track_kpi
```

#### YouTubeAgent
```
a2a.youtube_channel_optimization_agent.optimize_channel
a2a.youtube_channel_optimization_agent.plan_content
a2a.youtube_channel_optimization_agent.write_script
```

---

## エラーハンドリング

### 一般的なエラー

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `AGENT_NOT_FOUND` | 指定されたAgentが登録されていない | `initialize_all_agents()`を実行 |
| `TOOL_NOT_FOUND` | 指定されたツールが存在しない | ツール名を確認 |
| `INVALID_INPUT` | 入力パラメータが不正 | 必須パラメータを確認 |
| `EXECUTION_TIMEOUT` | 実行がタイムアウト | タイムアウト値を増やす |
| `RATE_LIMITED` | APIレート制限 | 待機後に再試行 |

### エラーレスポンス例

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "issue_number",
      "reason": "must be a positive integer"
    }
  }
}
```

---

## ベストプラクティス

### 1. Agent選択

- **単一タスク**: 該当するAgentを直接呼び出し
- **複合タスク**: CoordinatorAgentで分解・調整
- **並列実行**: 独立したタスクは同時に実行

### 2. パフォーマンス

```rust
// 並列実行例
let (code_result, review_result) = tokio::join!(
    bridge.execute_tool("a2a.code_generation_agent.generate_code", input1),
    bridge.execute_tool("a2a.code_quality_review_agent.review_code", input2)
);
```

### 3. リトライ戦略

```rust
use backoff::ExponentialBackoff;

let result = backoff::future::retry(
    ExponentialBackoff::default(),
    || async {
        bridge.execute_tool(tool_name, input.clone())
            .await
            .map_err(backoff::Error::transient)
    }
).await?;
```

---

## 関連ドキュメント

- [Agent仕様書](./specs/) - 各Agentの詳細仕様
- [Agent名マッピング](./agent-name-mapping.json) - キャラクター名とツール名の対応
- [プロトコル定義](../context/protocols.md) - MCP/A2Aプロトコル詳細
- [アーキテクチャ](../context/architecture.md) - システムアーキテクチャ概要

---

**メンテナー**: Claude Code
**最終更新**: 2025-11-22
