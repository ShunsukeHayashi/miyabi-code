# Miyabi Agent Test Specification

**Version**: 1.0.0
**Last Updated**: 2025-10-25
**Status**: Complete Test Plan

## 📋 Table of Contents

- [Overview](#overview)
- [Test Categories](#test-categories)
- [LLM Provider Matrix](#llm-provider-matrix)
- [Coding Agents Tests (7)](#coding-agents-tests-7)
- [Business Agents Tests (14)](#business-agents-tests-14)
- [Integration Tests](#integration-tests)
- [Performance Tests](#performance-tests)
- [Edge Case Tests](#edge-case-tests)

---

## Overview

### Testing Philosophy

**全てのAgentは以下4つの観点でテストされる必要がある：**

1. **Functional Testing** - 基本機能が正しく動作するか
2. **LLM Provider Compatibility** - Anthropic/OpenAI両方で動作するか
3. **Error Handling** - エラー時に適切にリカバリーするか
4. **Performance** - 並列実行時に期待通りのパフォーマンスが出るか

### Success Criteria

- ✅ All unit tests pass
- ✅ Integration workflows complete end-to-end
- ✅ Both Anthropic Claude & OpenAI GPT-4o support
- ✅ Parallel execution handles concurrency correctly
- ✅ Error recovery mechanisms work as expected

---

## Test Categories

| Category | Description | Tool |
|----------|-------------|------|
| **Unit Tests** | Individual agent capability testing | `cargo test` |
| **Integration Tests** | Multi-agent workflow testing | `miyabi agent run` |
| **Edge Case Tests** | Boundary conditions & error scenarios | `miyabi chat --full-access` |
| **Performance Tests** | Parallel execution & resource usage | `miyabi agent run --concurrency N` |
| **LLM Provider Tests** | Anthropic & OpenAI compatibility | `LLM_PROVIDER=openai/anthropic` |

---

## LLM Provider Matrix

### Test Configuration

```bash
# Anthropic Claude 3.5 Sonnet
export LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-xxx

# OpenAI GPT-4o
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-proj-xxx
```

### Compatibility Matrix

| Agent | Anthropic | OpenAI | Notes |
|-------|-----------|--------|-------|
| CoordinatorAgent | ✅ | ✅ | DAG分解・タスク統括 |
| CodeGenAgent | ✅ | ✅ | コード生成 |
| ReviewAgent | ✅ | ✅ | コード品質レビュー |
| IssueAgent | ✅ | ✅ | Issue分析・ラベリング |
| PRAgent | ✅ | ✅ | PR自動作成 |
| DeploymentAgent | ✅ | ✅ | CI/CDデプロイ |
| RefresherAgent | ✅ | ✅ | Issue状態監視 |
| AIEntrepreneurAgent | ✅ | ✅ | ビジネスプラン作成 |
| ProductConceptAgent | ✅ | ✅ | USP・収益モデル |
| ProductDesignAgent | ✅ | ✅ | サービス詳細設計 |
| FunnelDesignAgent | ✅ | ✅ | 顧客導線最適化 |
| PersonaAgent | ✅ | ✅ | ペルソナ設計 |
| SelfAnalysisAgent | ✅ | ✅ | キャリア分析 |
| MarketResearchAgent | ✅ | ✅ | 市場調査 |
| MarketingAgent | ✅ | ✅ | マーケティング戦略 |
| ContentCreationAgent | ✅ | ✅ | コンテンツ制作 |
| SNSStrategyAgent | ✅ | ✅ | SNS戦略 |
| YouTubeAgent | ✅ | ✅ | YouTube運用 |
| SalesAgent | ✅ | ✅ | セールス最適化 |
| CRMAgent | ✅ | ✅ | 顧客管理 |
| AnalyticsAgent | ✅ | ✅ | データ分析 |

---

## Coding Agents Tests (7)

### 1. CoordinatorAgent (しきるん)

**Role**: タスク統括・DAG分解

#### Unit Tests

```rust
#[tokio::test]
async fn test_coordinator_dag_decomposition() {
    let agent = CoordinatorAgent::new(config);
    let task = Task::new(
        "Implement user authentication feature",
        TaskType::Feature,
    );

    let result = agent.execute(&task).await.unwrap();

    assert!(result.subtasks.len() > 0);
    assert!(result.dag.is_valid());
}

#[tokio::test]
async fn test_coordinator_issue_analysis() {
    let agent = CoordinatorAgent::new(config);
    let issue = github_client.get_issue(270).await.unwrap();

    let result = agent.analyze_issue(&issue).await.unwrap();

    assert!(result.labels.contains("agent:coordinator"));
    assert!(result.execution_plan.is_some());
}
```

#### Integration Tests

```bash
# Test 1: Single issue processing
miyabi agent run coordinator --issue 270

# Expected Output:
# ✅ Issue #270 analyzed
# ✅ DAG created with 5 subtasks
# ✅ Labels applied: agent:coordinator, type:feature
# ✅ Execution plan generated

# Test 2: Parallel issue processing
miyabi agent run coordinator --issues 270,271,272 --concurrency 3

# Expected Output:
# ✅ 3 worktrees created
# ✅ All 3 issues processed in parallel
# ✅ Results merged successfully
```

#### Edge Cases

```bash
# Edge 1: Invalid issue number
miyabi agent run coordinator --issue 999999
# Expected: Graceful error handling

# Edge 2: Already processed issue
miyabi agent run coordinator --issue 270
# Expected: Detect duplicate and skip

# Edge 3: Issue with circular dependencies
# Expected: DAG validation fails with clear error
```

---

### 2. CodeGenAgent (つくるん)

**Role**: AI駆動コード生成

#### Unit Tests

```rust
#[tokio::test]
async fn test_codegen_file_creation() {
    let agent = CodeGenAgent::new(config);
    let spec = CodeSpec {
        file_path: "src/auth.rs",
        description: "User authentication module",
        language: Language::Rust,
    };

    let result = agent.generate_code(&spec).await.unwrap();

    assert!(result.files.len() == 1);
    assert!(result.files[0].path == "src/auth.rs");
    assert!(result.files[0].content.contains("pub mod auth"));
}

#[tokio::test]
async fn test_codegen_with_tests() {
    let agent = CodeGenAgent::new(config);
    let spec = CodeSpec {
        include_tests: true,
        test_coverage: 80.0,
    };

    let result = agent.generate_code(&spec).await.unwrap();

    assert!(result.test_files.len() > 0);
    assert!(result.test_coverage >= 80.0);
}
```

#### Integration Tests

```bash
# Test 1: Generate new Rust module
miyabi chat --full-auto
> "Generate a new Rust module 'crates/miyabi-test/src/sample.rs' with basic struct and tests"

# Expected Output:
# ✅ File created: crates/miyabi-test/src/sample.rs
# ✅ Tests included
# ✅ Compiles successfully

# Test 2: Generate with dependencies
miyabi chat --full-auto
> "Create a web API endpoint using axum in crates/miyabi-web-api/src/endpoints/health.rs"

# Expected Output:
# ✅ Endpoint created
# ✅ Dependencies added to Cargo.toml
# ✅ Integration test created
```

#### LLM Provider Tests

```bash
# Anthropic
export LLM_PROVIDER=anthropic
miyabi chat --full-auto
> "Generate Fibonacci function in Rust"
# Expected: ✅ Valid Rust code generated

# OpenAI
export LLM_PROVIDER=openai
miyabi chat --full-auto
> "Generate Fibonacci function in Rust"
# Expected: ✅ Valid Rust code generated
# Expected: ✅ Same quality as Anthropic
```

---

### 3. ReviewAgent (めだまん)

**Role**: コード品質レビュー (100点満点スコアリング)

#### Unit Tests

```rust
#[tokio::test]
async fn test_review_scoring() {
    let agent = ReviewAgent::new(config);
    let code = r#"
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }
    "#;

    let result = agent.review_code(code).await.unwrap();

    assert!(result.score >= 0.0 && result.score <= 100.0);
    assert!(result.issues.len() >= 0);
}

#[tokio::test]
async fn test_review_security_scan() {
    let agent = ReviewAgent::new(config);
    let code = r#"
        use std::process::Command;

        pub fn exec_user_input(input: &str) {
            Command::new("sh").arg("-c").arg(input).spawn();
        }
    "#;

    let result = agent.review_code(code).await.unwrap();

    assert!(result.security_issues.len() > 0);
    assert!(result.score < 50.0); // Low score for security issues
}
```

#### Integration Tests

```bash
# Test 1: Review existing crate
miyabi agent run review --crate miyabi-core

# Expected Output:
# 📊 Code Quality Score: 85/100
# ✅ 45 files reviewed
# ⚠️  3 issues found
# 🔒 0 security vulnerabilities

# Test 2: Review specific PR
miyabi agent run review --pr 123

# Expected Output:
# 📊 PR Quality Score: 92/100
# ✅ 5 changed files reviewed
# ✅ All tests pass
# ✅ No security issues
```

---

### 4. IssueAgent (みつけるん)

**Role**: Issue分析・ラベリング (AI推論)

#### Unit Tests

```rust
#[tokio::test]
async fn test_issue_label_inference() {
    let agent = IssueAgent::new(config);
    let issue_body = "Add user authentication using JWT tokens";

    let result = agent.infer_labels(issue_body).await.unwrap();

    assert!(result.labels.contains("type:feature"));
    assert!(result.labels.contains("area:auth"));
    assert!(result.confidence > 0.8);
}

#[tokio::test]
async fn test_issue_priority_detection() {
    let agent = IssueAgent::new(config);
    let issue_body = "CRITICAL: Production database connection failing";

    let result = agent.analyze_issue(issue_body).await.unwrap();

    assert!(result.priority == Priority::Critical);
    assert!(result.labels.contains("priority:critical"));
}
```

#### Integration Tests

```bash
# Test 1: Analyze and label new issue
miyabi agent run issue --issue 280

# Expected Output:
# 🔍 Issue #280 analyzed
# 🏷️  Labels inferred: type:bug, area:api, priority:high
# ✅ Labels applied to GitHub
# 📝 Analysis comment added

# Test 2: Batch label existing issues
miyabi agent run issue --batch --issues 280-290

# Expected Output:
# 🔍 Analyzed 11 issues
# ✅ 11/11 successfully labeled
# 📊 Label distribution report generated
```

---

### 5. PRAgent (まとめるん)

**Role**: Pull Request自動作成 (Conventional Commits)

#### Unit Tests

```rust
#[tokio::test]
async fn test_pr_creation() {
    let agent = PRAgent::new(config);
    let branch = "feat/issue-270";

    let result = agent.create_pr(branch).await.unwrap();

    assert!(result.pr_number > 0);
    assert!(result.title.starts_with("feat:"));
    assert!(result.body.contains("## Summary"));
}

#[tokio::test]
async fn test_conventional_commit_format() {
    let agent = PRAgent::new(config);
    let commits = vec![
        "feat: add user auth",
        "fix: resolve login bug",
        "docs: update README",
    ];

    let result = agent.generate_pr_title(commits).await.unwrap();

    assert!(result.starts_with("feat:") || result.starts_with("fix:"));
}
```

#### Integration Tests

```bash
# Test 1: Create PR from current branch
git checkout -b feat/test-pr
echo "test" > test.txt
git add test.txt
git commit -m "feat: add test file"
git push -u origin feat/test-pr

miyabi agent run pr --create

# Expected Output:
# ✅ PR #281 created
# 📝 Title: feat: add test file
# 🏷️  Labels: type:feature
# 🔗 URL: https://github.com/...

# Test 2: Draft PR creation
miyabi agent run pr --create --draft

# Expected Output:
# ✅ Draft PR #282 created
# 🚧 Status: Draft (ready for review)
```

---

### 6. DeploymentAgent (はこぶん)

**Role**: CI/CDデプロイ自動化

#### Unit Tests

```rust
#[tokio::test]
async fn test_deployment_validation() {
    let agent = DeploymentAgent::new(config);
    let env = Environment::Production;

    let result = agent.validate_deployment(&env).await.unwrap();

    assert!(result.health_check_passed);
    assert!(result.all_tests_passed);
}

#[tokio::test]
async fn test_rollback_on_failure() {
    let agent = DeploymentAgent::new(config);
    let env = Environment::Production;

    // Simulate failed deployment
    let result = agent.deploy(&env).await;

    assert!(result.is_err());
    assert!(agent.rollback_completed().await.unwrap());
}
```

#### Integration Tests

```bash
# Test 1: Deploy to staging
miyabi agent run deployment --env staging

# Expected Output:
# 🚀 Deploying to staging...
# ✅ Build successful
# ✅ Tests passed (45/45)
# ✅ Health check passed
# ✅ Deployment complete

# Test 2: Deploy with health check failure
# (Simulated failure)
# Expected Output:
# 🚀 Deploying to production...
# ✅ Build successful
# ❌ Health check failed
# 🔄 Rolling back to previous version...
# ✅ Rollback successful
```

---

### 7. RefresherAgent (つなぐん)

**Role**: Issue状態監視・更新

#### Unit Tests

```rust
#[tokio::test]
async fn test_issue_state_refresh() {
    let agent = RefresherAgent::new(config);
    let issue_number = 270;

    let result = agent.refresh_issue(issue_number).await.unwrap();

    assert!(result.state_updated);
    assert!(result.labels_synced);
}

#[tokio::test]
async fn test_stale_issue_detection() {
    let agent = RefresherAgent::new(config);

    let stale_issues = agent.find_stale_issues(30).await.unwrap();

    assert!(stale_issues.len() >= 0);
    for issue in stale_issues {
        assert!(issue.days_since_update >= 30);
    }
}
```

#### Integration Tests

```bash
# Test 1: Refresh single issue
miyabi agent run refresher --issue 270

# Expected Output:
# 🔄 Refreshing Issue #270...
# ✅ State updated: open → in_progress
# ✅ Labels synced
# ✅ Last update timestamp updated

# Test 2: Refresh all open issues
miyabi agent run refresher --all

# Expected Output:
# 🔄 Refreshing 15 open issues...
# ✅ 15/15 issues refreshed
# 📊 5 issues marked as stale
# 📊 3 issues auto-closed
```

---

## Business Agents Tests (14)

### 8. AIEntrepreneurAgent (あきんどさん)

**Role**: 包括的ビジネスプラン作成

#### Integration Tests

```bash
# Test: Complete business plan generation
miyabi agent run ai-entrepreneur --idea "AI-powered code review service"

# Expected Output:
# ✅ Business plan generated
# 📊 Market analysis: $500M TAM
# 💡 USP: Real-time AI code review
# 💰 Revenue model: SaaS subscription
# 🎯 Target: 1000 customers in Year 1
# 📄 Output: business_plan.md (15 pages)
```

---

### 9. ProductConceptAgent (けいかくん)

**Role**: USP・収益モデル設計

#### Integration Tests

```bash
# Test: Product concept design
miyabi agent run product-concept --domain "developer tools"

# Expected Output:
# ✅ USP defined: "10x faster code review"
# 💰 Revenue model: Freemium + Enterprise
# 🎨 Business Model Canvas created
# 📊 Pricing tiers: Free, Pro ($49/mo), Enterprise (custom)
# 📄 Output: product_concept.md
```

---

### 10. ProductDesignAgent (つくるん2号)

**Role**: サービス詳細設計

#### Integration Tests

```bash
# Test: 6-month service roadmap
miyabi agent run product-design --timeline 6

# Expected Output:
# ✅ Month 1-2: MVP features defined
# ✅ Month 3-4: Beta testing plan
# ✅ Month 5-6: Full launch strategy
# 🛠️  Tech stack: Rust + React + PostgreSQL
# 📄 Output: service_design.md (25 pages)
```

---

### 11. FunnelDesignAgent (みちしるべん)

**Role**: 顧客導線最適化

#### Integration Tests

```bash
# Test: Customer journey funnel
miyabi agent run funnel-design --stage "認知→購入→LTV"

# Expected Output:
# ✅ Awareness stage: SEO + SNS
# ✅ Consideration: Free trial
# ✅ Purchase: Frictionless checkout
# ✅ Retention: Email nurturing
# 📊 Conversion rates defined
# 📄 Output: funnel_strategy.md
```

---

### 12. PersonaAgent (よみとるん)

**Role**: ターゲット顧客ペルソナ設計

#### Integration Tests

```bash
# Test: 3 detailed personas
miyabi agent run persona --count 3

# Expected Output:
# ✅ Persona 1: Senior SWE (35-45, FAANG, $200K+)
# ✅ Persona 2: Startup CTO (30-40, Series A, $150K+)
# ✅ Persona 3: Indie Developer (25-35, side project, $80K+)
# 🎯 Pain points identified
# 📄 Output: personas.md (10 pages)
```

---

### 13. SelfAnalysisAgent (しらべるん)

**Role**: キャリア・スキル分析

#### Integration Tests

```bash
# Test: Personal career analysis
miyabi agent run self-analysis --resume resume.md

# Expected Output:
# ✅ Skills analyzed: Rust (expert), TypeScript (advanced)
# ✅ Achievements: 10 OSS projects, 5K+ GitHub stars
# 📊 Strengths: Systems programming, async runtime
# 📊 Gaps: Marketing, sales
# 📄 Output: self_analysis.md
```

---

### 14. MarketResearchAgent (しらべるん2号)

**Role**: 市場調査・競合分析

#### Integration Tests

```bash
# Test: Market research report
miyabi agent run market-research --industry "developer tools"

# Expected Output:
# ✅ Market size: $50B (2025)
# ✅ 20+ competitors analyzed
# 📊 Top 3: GitHub Copilot, Tabnine, Codeium
# 📊 Market gap: Real-time code review
# 📄 Output: market_research.md (30 pages)
```

---

### 15. MarketingAgent (ひろめるん)

**Role**: マーケティング戦略

#### Integration Tests

```bash
# Test: Marketing campaign plan
miyabi agent run marketing --budget "$10,000/mo"

# Expected Output:
# ✅ SEO strategy: Target 50 keywords
# ✅ Paid ads: Google Ads $5K, Twitter $3K
# ✅ Content: 4 blog posts/month
# 📊 Expected reach: 100K impressions/mo
# 📄 Output: marketing_plan.md
```

---

### 16. ContentCreationAgent (かくちゃん)

**Role**: コンテンツ制作計画

#### Integration Tests

```bash
# Test: 6-month content calendar
miyabi agent run content-creation --duration 6

# Expected Output:
# ✅ 24 blog posts planned
# ✅ 12 YouTube videos scripted
# ✅ 50 social media posts
# 📝 Topics: Rust, async, performance
# 📄 Output: content_calendar.md
```

---

### 17. SNSStrategyAgent (つぶやくん)

**Role**: SNS戦略立案

#### Integration Tests

```bash
# Test: Multi-platform SNS strategy
miyabi agent run sns-strategy --platforms "Twitter,LinkedIn,Instagram"

# Expected Output:
# ✅ Twitter: Daily tech tips
# ✅ LinkedIn: Weekly thought leadership
# ✅ Instagram: Code snippets + design
# 📊 Posting schedule: 3-5 posts/day
# 📄 Output: sns_strategy.md
```

---

### 18. YouTubeAgent (どうがくん)

**Role**: YouTube運用最適化

#### Integration Tests

```bash
# Test: YouTube channel strategy
miyabi agent run youtube --niche "Rust programming"

# Expected Output:
# ✅ Channel concept: "Async Rust Mastery"
# ✅ 13 video series planned
# 📊 Target: 10K subscribers in 6 months
# 🎬 Upload schedule: 2 videos/week
# 📄 Output: youtube_strategy.md
```

---

### 19. SalesAgent (うるん)

**Role**: セールスプロセス最適化

#### Integration Tests

```bash
# Test: Sales funnel optimization
miyabi agent run sales --goal "100 customers/month"

# Expected Output:
# ✅ Lead gen: 500 leads/month
# ✅ Qualification: 200 qualified leads
# ✅ Demo: 100 demos scheduled
# 📊 Conversion: 20% demo → customer
# 📄 Output: sales_process.md
```

---

### 20. CRMAgent (ささえるん)

**Role**: 顧客満足度向上・LTV最大化

#### Integration Tests

```bash
# Test: Customer success program
miyabi agent run crm --segment "Enterprise"

# Expected Output:
# ✅ Onboarding: 30-day success plan
# ✅ Check-ins: Weekly for first month
# ✅ Upsell triggers: 80% feature usage
# 📊 Target NPS: 60+
# 📄 Output: crm_strategy.md
```

---

### 21. AnalyticsAgent (かぞえるん)

**Role**: データ分析・PDCA実行

#### Integration Tests

```bash
# Test: Business metrics dashboard
miyabi agent run analytics --period "last 3 months"

# Expected Output:
# 📊 MRR: $50K (+20% MoM)
# 📊 CAC: $150 (-10% MoM)
# 📊 LTV: $1,200 (+5%)
# 📊 Churn: 2.5% (-0.5%)
# 🎯 Recommendations: 5 optimization actions
# 📄 Output: analytics_report.md
```

---

## Integration Tests

### Workflow 1: Feature Development (Coding Agents)

```bash
# Complete feature development workflow
# Issue #300: "Add user authentication"

# Step 1: CoordinatorAgent analyzes issue
miyabi agent run coordinator --issue 300
# Expected: DAG with 5 subtasks created

# Step 2: CodeGenAgent implements auth module
miyabi agent run codegen --subtask auth-module
# Expected: src/auth.rs created

# Step 3: ReviewAgent reviews code
miyabi agent run review --files src/auth.rs
# Expected: Quality score 90/100

# Step 4: PRAgent creates PR
miyabi agent run pr --create
# Expected: PR #301 created

# Step 5: DeploymentAgent deploys
miyabi agent run deployment --env staging
# Expected: Deployed successfully

# Success Criteria:
# ✅ All 5 steps complete
# ✅ No manual intervention required
# ✅ Total time < 10 minutes
```

---

### Workflow 2: Product Launch (Business Agents)

```bash
# Complete product launch workflow
# Goal: Launch "AI Code Review SaaS"

# Step 1: Market research
miyabi agent run market-research --industry "developer tools"

# Step 2: Define product concept
miyabi agent run product-concept --domain "code review"

# Step 3: Create personas
miyabi agent run persona --count 3

# Step 4: Design service
miyabi agent run product-design --timeline 6

# Step 5: Marketing strategy
miyabi agent run marketing --budget "$10K/mo"

# Step 6: Content plan
miyabi agent run content-creation --duration 6

# Step 7: SNS strategy
miyabi agent run sns-strategy --platforms "Twitter,LinkedIn"

# Success Criteria:
# ✅ Complete go-to-market plan
# ✅ 6-month roadmap defined
# ✅ All deliverables generated (100+ pages)
```

---

## Performance Tests

### Parallel Execution Tests

```bash
# Test 1: 3 parallel issues
time miyabi agent run coordinator --issues 270,271,272 --concurrency 3

# Expected:
# ⏱️  Total time: ~5 minutes
# ✅ 3 worktrees created
# ✅ All issues processed successfully
# 📊 Speedup: 3x vs sequential

# Test 2: 10 parallel issues
time miyabi agent run coordinator --issues 270-279 --concurrency 10

# Expected:
# ⏱️  Total time: ~8 minutes
# ✅ 10 worktrees created
# ✅ All issues processed
# 📊 Speedup: 8x vs sequential

# Test 3: Resource limits
miyabi agent run coordinator --issues 270-299 --concurrency 20

# Expected:
# ⚠️  Limited to max 10 concurrent worktrees
# ✅ Queue management working
# ✅ All 30 issues complete (15 min)
```

---

## Edge Case Tests

### Edge Case 1: Network Failures

```bash
# Simulate network failure during LLM API call
# (Disable network after agent starts)

miyabi agent run coordinator --issue 270

# Expected:
# ⚠️  API request failed (timeout)
# 🔄 Retrying (1/3)...
# ⚠️  API request failed (timeout)
# 🔄 Retrying (2/3)...
# ✅ Request successful
```

### Edge Case 2: Invalid LLM Responses

```bash
# Test with malformed tool calls
miyabi chat --full-access
> "Execute invalid JSON in tool arguments"

# Expected:
# ⚠️  Tool parsing failed
# 🔄 Requesting retry from LLM
# ✅ Valid tool call received
```

### Edge Case 3: Git Conflicts

```bash
# Parallel agents modifying same file
miyabi agent run codegen --issues 270,271 --concurrency 2
# (Both modify src/main.rs)

# Expected:
# ⚠️  Merge conflict detected in worktree-270
# 🔄 Applying conflict resolution strategy
# ✅ Conflicts resolved automatically
# ✅ Both PRs created successfully
```

### Edge Case 4: Insufficient API Credits

```bash
# Run with insufficient Anthropic credits
export LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-xxx  # Insufficient balance

miyabi agent run coordinator --issue 270

# Expected:
# ❌ API error: Insufficient credits
# 💡 Suggestion: Use OpenAI as fallback
# 🔄 Switching to LLM_PROVIDER=openai...
# ✅ Execution successful with OpenAI
```

### Edge Case 5: Large File Operations

```bash
# Test with 10MB+ files
miyabi chat --full-access
> "Read and analyze this 15MB log file: /var/log/large.log"

# Expected:
# ⚠️  File size exceeds 10MB limit
# 💡 Streaming first 1000 lines...
# ✅ Analysis complete (partial)
```

---

## Test Execution Guide

### Running All Tests

```bash
# 1. Unit tests
cargo test --all

# 2. Integration tests (sequential)
./scripts/run_integration_tests.sh

# 3. LLM provider tests
./scripts/test_llm_providers.sh

# 4. Performance tests
./scripts/run_performance_tests.sh

# 5. Edge case tests
./scripts/run_edge_case_tests.sh
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All 21 agents tested
- **LLM Provider Tests**: Both Anthropic & OpenAI passing
- **Performance Tests**: Linear scalability up to 10 concurrent agents
- **Edge Case Tests**: 100% error scenarios handled

---

## Test Results Template

```markdown
# Test Execution Report

**Date**: 2025-10-25
**Environment**: macOS Darwin 25.0.0
**Rust Version**: 1.75.0

## Summary

- ✅ Unit Tests: 145/145 passed (100%)
- ✅ Integration Tests: 21/21 agents passed (100%)
- ✅ LLM Provider Tests: 42/42 passed (100%)
- ✅ Performance Tests: 5/5 passed (100%)
- ✅ Edge Case Tests: 8/8 passed (100%)

## Detailed Results

### Coding Agents (7)
- ✅ CoordinatorAgent: All tests passed
- ✅ CodeGenAgent: All tests passed
- ✅ ReviewAgent: All tests passed
- ✅ IssueAgent: All tests passed
- ✅ PRAgent: All tests passed
- ✅ DeploymentAgent: All tests passed
- ✅ RefresherAgent: All tests passed

### Business Agents (14)
- ✅ AIEntrepreneurAgent: All tests passed
- ✅ ProductConceptAgent: All tests passed
- ✅ ProductDesignAgent: All tests passed
- ✅ FunnelDesignAgent: All tests passed
- ✅ PersonaAgent: All tests passed
- ✅ SelfAnalysisAgent: All tests passed
- ✅ MarketResearchAgent: All tests passed
- ✅ MarketingAgent: All tests passed
- ✅ ContentCreationAgent: All tests passed
- ✅ SNSStrategyAgent: All tests passed
- ✅ YouTubeAgent: All tests passed
- ✅ SalesAgent: All tests passed
- ✅ CRMAgent: All tests passed
- ✅ AnalyticsAgent: All tests passed

## Performance Metrics

- Parallel execution (3 agents): 3.2x speedup
- Parallel execution (10 agents): 8.5x speedup
- Average LLM response time: 2.5s (OpenAI), 3.2s (Anthropic)
- Memory usage: 150MB per agent

## Issues Found

None

## Recommendations

1. Add automated regression testing in CI/CD
2. Expand edge case coverage for file operations
3. Implement LLM response caching for common queries
```

---

## Appendix

### Test Data Setup

```bash
# Create test repository
git clone https://github.com/ShunsukeHayashi/miyabi-test.git
cd miyabi-test

# Create test issues
gh issue create --title "Test Issue 1" --body "Feature request"
gh issue create --title "Test Issue 2" --body "Bug report"
gh issue create --title "Test Issue 3" --body "Documentation"

# Set up test environment
export GITHUB_TOKEN=ghp_xxx
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-proj-xxx
export LLM_PROVIDER=openai
```

### Continuous Testing Strategy

```yaml
# .github/workflows/agent-tests.yml
name: Agent Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cargo test --all

  integration-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [coordinator, codegen, review, issue, pr, deployment, refresher]
    steps:
      - uses: actions/checkout@v3
      - run: ./scripts/test_agent.sh ${{ matrix.agent }}

  llm-provider-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        provider: [anthropic, openai]
    env:
      LLM_PROVIDER: ${{ matrix.provider }}
    steps:
      - uses: actions/checkout@v3
      - run: ./scripts/test_llm_compatibility.sh
```

---

**Document Status**: ✅ Complete
**Next Review**: 2025-11-01
**Maintainer**: Miyabi Development Team
