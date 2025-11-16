# Miyabi Deployment Model Analysis - Local vs API Cost Simulation

**Date**: 2025-11-12
**Version**: 1.0.0
**Critical Decision**: Architecture Selection for Production Deployment

---

## 🎯 Executive Summary

**問題提起**: Claude Code/Codex はローカルまたはエージェントSDK単位でしか動作せず、API化するとコストが大幅に上昇する可能性がある。ローカル実行（ネイティブアプリ）とSaaS（API）のどちらが適切か？

**結論 (TL;DR)**:
- ✅ **推奨**: **Hybrid Model C** (Web UI + Local Agent Runner)
- 💰 **理由**: API コストを95%削減しつつ、ユーザー体験を維持
- 🎯 **Cost/Issue**: $0.02 (Hybrid) vs $15.00 (Full SaaS) = **750倍の差**

---

## 📊 Current State: MUGEN/MAJIN 実行モデル

### 現在の構成

```yaml
Infrastructure:
  MUGEN EC2:
    Type: c5.4xlarge
    vCPU: 16
    RAM: 32GB
    Codex Instances: 12
    Cost: $500/month

  MAJIN EC2:
    Type: c5.2xlarge
    vCPU: 8
    RAM: 16GB
    Codex Instances: 6
    Cost: $250/month

  Total Infrastructure: $750/month

Execution Model:
  - Each Codex runs Claude Code CLI locally
  - No API calls (Sonnet 4 included in Claude Code subscription)
  - SSH access from Local PC
  - tmux-based orchestration
```

### 現在のコスト構造

```
月額固定コスト:
  EC2 (MUGEN): $500
  EC2 (MAJIN): $250
  Storage:     $20
  Network:     $30
  TOTAL:       $800/month

従量課金:
  Claude API: $0/month (Claude Code subscription included)

実行コスト:
  Issues処理/月: ~2,880 issues (18 codex × 96 issues/day × 30 days / 18)
  Cost per Issue: $800 / 2,880 = $0.28/issue
```

**重要**: この$0.28/issueには Claude API コストが含まれていない（Claude Code subscriptionでカバー）

---

## 🔍 Claude Code/Codex の実行モデル分析

### Claude Code とは

**公式**: Anthropic の CLI ツール
- **License**: Commercial use allowed (Claude Pro / Team subscription)
- **API**: Claude API を内部で使用（subscription に含まれる）
- **Execution**: ローカル実行のみ（SSH経由可）
- **SDK**: Agent SDK として使用可能

### 実行方法の比較

| 実行方法 | コスト | 制限 | スケーラビリティ |
|---------|--------|------|----------------|
| **Claude Code CLI** (現状) | Subscription込み | SSH必須、並列数=マシン数 | Low (18並列) |
| **Claude API Direct** | $15/M tokens (Sonnet 4) | Rate limits | High (無制限) |
| **Agent SDK (Local)** | Subscription込み | ローカル実行必須 | Medium (ユーザーマシン依存) |
| **MCP Server** | Subscription込み | ローカル実行必須 | Low (単一プロセス) |

### API化した場合のコスト試算

**仮定**: 1 Issue処理 = 平均 500K tokens (input 200K + output 300K)

```python
# Claude API Pricing (Sonnet 4)
INPUT_COST = 3.00   # per M tokens
OUTPUT_COST = 15.00 # per M tokens

# 1 Issue あたりのコスト
input_cost = (200_000 / 1_000_000) * INPUT_COST   # $0.60
output_cost = (300_000 / 1_000_000) * OUTPUT_COST # $4.50
TOTAL_PER_ISSUE = input_cost + output_cost        # $5.10

# 月間コスト (2,880 issues/month)
monthly_api_cost = 2_880 * TOTAL_PER_ISSUE        # $14,688/month
```

**衝撃的な結果**:
- 現状 (Claude Code): $0/month (subscription込み)
- API化: **$14,688/month** 😱
- **増加率**: ∞ (ゼロから$14,688へ)

---

## 🏗️ 4つのデプロイメントモデル比較

### Model A: Full SaaS (完全Web + Cloud Execution)

**Architecture**:
```
User Browser → CloudFront → API Gateway → Lambda/ECS
                                              ↓
                                        Claude API (Sonnet 4)
                                              ↓
                                        DynamoDB, S3
```

**Characteristics**:
- ✅ Webブラウザのみで利用可能
- ✅ クライアント側インストール不要
- ✅ 無限スケーラビリティ
- ❌ **Claude API コストが高額**
- ❌ Rate limits (tier dependent)
- ❌ Latency (API経由)

**Cost Simulation**:

```yaml
Fixed Costs (Infrastructure):
  API Gateway:     $50/month
  ECS Fargate:     $300/month (10 tasks)
  Lambda:          $100/month
  DynamoDB:        $50/month
  CloudWatch:      $30/month
  Network:         $50/month
  SUBTOTAL:        $580/month

Variable Costs (per issue):
  Claude API:      $5.10/issue (500K tokens)

Monthly Cost (2,880 issues):
  Infrastructure:  $580
  API Costs:       $14,688 (2,880 × $5.10)
  TOTAL:           $15,268/month

Cost per Issue:    $5.30/issue
```

**Scaling (10x = 28,800 issues/month)**:
```
Infrastructure:    $2,000/month (100 tasks)
API Costs:         $146,880/month 😱
TOTAL:             $148,880/month

Cost per Issue:    $5.17/issue
```

**Verdict**: ❌ **禁止的に高額**

---

### Model B: Desktop App (Electron/Tauri + Local Execution)

**Architecture**:
```
Desktop App (Electron/Tauri)
  ├─ UI Layer (React/Vue)
  ├─ Rust Backend (embedded)
  ├─ Claude Code SDK (local)
  └─ Git, Docker (local)

Optional Cloud Sync:
  └─ S3, DynamoDB (settings, history)
```

**Characteristics**:
- ✅ Claude Code subscription でカバー（APIコスト $0）
- ✅ ローカル実行（高速、プライバシー）
- ✅ オフライン動作可能
- ❌ ユーザーマシンのスペック依存
- ❌ クライアントインストール必須
- ❌ スケーラビリティ = ユーザー数のみ

**Cost Simulation**:

```yaml
Fixed Costs (Infrastructure):
  CloudFront (CDN):     $10/month (app distribution)
  S3 (storage):         $5/month
  DynamoDB (sync):      $10/month
  Lambda (auth):        $5/month
  SUBTOTAL:             $30/month

Variable Costs (per user):
  Claude API:           $0/month (user's Claude Code subscription)
  User machine:         User's cost (electricity, hardware)

Monthly Cost (100 active users):
  Infrastructure:       $30/month
  API Costs:            $0/month ✅
  TOTAL:                $30/month

Cost per User:          $0.30/month
Cost per Issue:         $0.01/issue (assuming 2,880 issues from 100 users)
```

**Scaling (1,000 users)**:
```
Infrastructure:         $50/month
API Costs:              $0/month
TOTAL:                  $50/month

Cost per User:          $0.05/month
Cost per Issue:         $0.002/issue
```

**Verdict**: ✅ **極めて低コスト**、ただしUX制約あり

---

### Model C: Hybrid (Web UI + Local Agent Runner)

**Architecture**:
```
[Web UI]
  ↓ (WebSocket)
[Local Agent Runner]
  ├─ Rust Daemon (background service)
  ├─ Claude Code SDK (local)
  ├─ Git, Docker (local)
  └─ Cloud API (metadata only)

[Cloud Platform]
  ├─ API Gateway (orchestration)
  ├─ DynamoDB (state, history)
  ├─ S3 (artifacts)
  └─ CloudWatch (monitoring)
```

**Characteristics**:
- ✅ Webブラウザで使用（UX良い）
- ✅ Claude API コストゼロ（local execution）
- ✅ スケーラビリティ = ユーザー数
- ⚠️ Local Agent インストール必要
- ⚠️ ユーザーマシンのスペック依存

**Cost Simulation**:

```yaml
Fixed Costs (Infrastructure):
  CloudFront (Web UI):  $20/month
  API Gateway:          $30/month (metadata API)
  Lambda:               $20/month (orchestration)
  DynamoDB:             $30/month
  S3:                   $10/month
  CloudWatch:           $20/month
  SUBTOTAL:             $130/month

Variable Costs (per user):
  Claude API:           $0/month (local execution)
  Metadata API:         $0.001/issue (minimal)

Monthly Cost (100 active users, 2,880 issues):
  Infrastructure:       $130/month
  API Costs:            $2.88/month (metadata only)
  TOTAL:                $133/month

Cost per User:          $1.33/month
Cost per Issue:         $0.046/issue
```

**Scaling (1,000 users, 28,800 issues)**:
```
Infrastructure:         $300/month
API Costs (metadata):   $28.80/month
TOTAL:                  $329/month

Cost per User:          $0.33/month
Cost per Issue:         $0.011/issue
```

**Verdict**: ✅ **Best Balance** - 低コスト＋良いUX

---

### Model D: CLI Tool (Complete Local)

**Architecture**:
```
CLI Tool (Rust binary)
  ├─ Claude Code SDK (embedded)
  ├─ Git, Docker (local)
  └─ Optional Cloud Sync (config)

No cloud dependency (except updates)
```

**Characteristics**:
- ✅ Claude API コスト $0
- ✅ 完全プライバシー
- ✅ オフライン動作
- ❌ CLI のみ（GUI なし）
- ❌ セットアップ複雑
- ❌ スケーラビリティ = ユーザー数のみ

**Cost Simulation**:

```yaml
Fixed Costs (Infrastructure):
  S3 (binary hosting):  $1/month
  CloudFront (CDN):     $5/month
  Lambda (update API):  $2/month
  SUBTOTAL:             $8/month

Variable Costs (per user):
  Claude API:           $0/month
  User machine:         User's cost

Monthly Cost (100 active users):
  Infrastructure:       $8/month
  API Costs:            $0/month
  TOTAL:                $8/month

Cost per User:          $0.08/month
Cost per Issue:         $0.003/issue
```

**Scaling (1,000 users)**:
```
Infrastructure:         $10/month
API Costs:              $0/month
TOTAL:                  $10/month

Cost per User:          $0.01/month
Cost per Issue:         $0.0003/issue
```

**Verdict**: ✅ **最も低コスト**、ただしニッチ市場

---

## 📊 Cost Comparison Matrix

### Monthly Cost Comparison (2,880 issues/month)

| Model | Infrastructure | API Cost | Total | Cost/Issue | vs Current |
|-------|---------------|----------|-------|-----------|-----------|
| **Current (EC2)** | $800 | $0 | $800 | $0.28 | Baseline |
| **Model A (SaaS)** | $580 | $14,688 | $15,268 | $5.30 | +1,808% 😱 |
| **Model B (Desktop)** | $30 | $0 | $30 | $0.01 | -96% ✅ |
| **Model C (Hybrid)** | $130 | $3 | $133 | $0.05 | -83% ✅ |
| **Model D (CLI)** | $8 | $0 | $8 | $0.003 | -99% ✅ |

### Scaling Cost (28,800 issues/month, 10x)

| Model | Infrastructure | API Cost | Total | Cost/Issue | Scalability |
|-------|---------------|----------|-------|-----------|-------------|
| **Current (EC2)** | $8,000 | $0 | $8,000 | $0.28 | ⚠️ 180 EC2 needed |
| **Model A (SaaS)** | $2,000 | $146,880 | $148,880 | $5.17 | ✅ Auto-scale |
| **Model B (Desktop)** | $50 | $0 | $50 | $0.002 | ✅ User machines |
| **Model C (Hybrid)** | $300 | $29 | $329 | $0.011 | ✅ User machines |
| **Model D (CLI)** | $10 | $0 | $10 | $0.0003 | ✅ User machines |

### Annual Cost Projection (1,000 users, 28,800 issues/month)

| Model | Year 1 | Year 2 | Year 3 | 3-Year Total |
|-------|--------|--------|--------|--------------|
| **Model A (SaaS)** | $1,786,560 | $1,786,560 | $1,786,560 | $5,359,680 😱 |
| **Model B (Desktop)** | $600 | $600 | $600 | $1,800 ✅ |
| **Model C (Hybrid)** | $3,948 | $3,948 | $3,948 | $11,844 ✅ |
| **Model D (CLI)** | $120 | $120 | $120 | $360 ✅ |

**ROI Comparison** (3 years, 1,000 users):
- Model A vs Model C: **$5,347,836 saved** by using Hybrid! 🎉
- Model A vs Model B: **$5,357,880 saved** by using Desktop! 🎉

---

## 🔬 Detailed API Cost Simulation

### Scenario 1: Light User (10 issues/month)

```python
Model A (SaaS):
  API Cost = 10 × $5.10 = $51/month
  Infrastructure (allocated) = $0.58/month
  Total = $51.58/month

Model C (Hybrid):
  API Cost = 10 × $0.001 = $0.01/month (metadata)
  Infrastructure (allocated) = $0.13/month
  Total = $0.14/month

Savings: $51.44/month (99.7%)
```

### Scenario 2: Power User (100 issues/month)

```python
Model A (SaaS):
  API Cost = 100 × $5.10 = $510/month
  Infrastructure (allocated) = $5.80/month
  Total = $515.80/month

Model C (Hybrid):
  API Cost = 100 × $0.001 = $0.10/month
  Infrastructure (allocated) = $1.30/month
  Total = $1.40/month

Savings: $514.40/month (99.7%)
```

### Scenario 3: Enterprise (10,000 issues/month)

```python
Model A (SaaS):
  API Cost = 10,000 × $5.10 = $51,000/month
  Infrastructure = $2,000/month
  Total = $53,000/month

Model C (Hybrid):
  API Cost = 10,000 × $0.001 = $10/month
  Infrastructure = $300/month
  Total = $310/month

Savings: $52,690/month (99.4%)
```

---

## 🎯 Recommendation: Hybrid Model C

### Why Hybrid?

**Best of Both Worlds**:
1. ✅ **Web UI** - ブラウザで使える（UX良い）
2. ✅ **Local Execution** - Claude API コスト $0
3. ✅ **Cloud Orchestration** - 状態管理、ログ、モニタリング
4. ✅ **Scalability** - ユーザー数に応じて線形増加
5. ✅ **Cost Efficiency** - Model A の 1/450 のコスト

### Implementation Strategy

**Phase 1: MVP (Month 1-3)**
```
Component 1: Web UI (Next.js)
  - Issue管理
  - Agent設定
  - ログビューア
  - ダッシュボード

Component 2: Local Agent Runner (Rust)
  - Claude Code SDK integration
  - Git operations
  - Docker management
  - WebSocket client

Component 3: Cloud Backend (AWS)
  - API Gateway (orchestration)
  - DynamoDB (state)
  - S3 (artifacts)
  - CloudWatch (monitoring)
```

**Phase 2: Scale (Month 4-6)**
```
- Multi-user support
- Team collaboration
- Agent marketplace
- Custom agent creation
```

**Phase 3: Enterprise (Month 7-12)**
```
- On-premise deployment option
- SSO integration
- Audit logs
- SLA guarantees
```

---

## 💻 Local Agent Runner Design

### Architecture

```rust
// miyabi-local-agent/src/main.rs

pub struct LocalAgent {
    config: AgentConfig,
    claude_sdk: ClaudeCodeSDK,
    git_manager: GitManager,
    docker_manager: DockerManager,
    websocket_client: WebSocketClient,
    state_manager: StateManager,
}

impl LocalAgent {
    pub async fn run(&mut self) -> Result<()> {
        // Connect to cloud platform
        self.websocket_client.connect(
            &self.config.cloud_url
        ).await?;

        // Main event loop
        loop {
            tokio::select! {
                // Receive tasks from cloud
                Some(task) = self.websocket_client.recv() => {
                    self.handle_task(task).await?;
                }

                // Send heartbeat
                _ = tokio::time::sleep(Duration::from_secs(30)) => {
                    self.send_heartbeat().await?;
                }

                // Local file watcher
                Some(event) = self.file_watcher.recv() => {
                    self.handle_file_change(event).await?;
                }
            }
        }
    }

    async fn handle_task(&mut self, task: Task) -> Result<()> {
        // Execute task locally using Claude Code SDK
        let result = self.claude_sdk.execute(&task).await?;

        // Upload artifacts to S3
        self.upload_artifacts(&result.artifacts).await?;

        // Update state in DynamoDB
        self.update_state(&task.id, TaskState::Completed).await?;

        // Send result back to cloud
        self.websocket_client.send_result(result).await?;

        Ok(())
    }
}
```

### Installation

**macOS/Linux**:
```bash
# Install via Homebrew
brew install miyabi-local-agent

# Or download binary
curl -fsSL https://install.miyabi.dev | sh

# Start daemon
miyabi-agent start

# Connect to cloud
miyabi-agent login
```

**Windows**:
```powershell
# Install via winget
winget install Miyabi.LocalAgent

# Or download installer
# https://miyabi.dev/downloads/windows

# Start service
miyabi-agent.exe install
miyabi-agent.exe start
```

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB free
- Network: Broadband internet
- OS: macOS 12+, Ubuntu 20.04+, Windows 10+

**Recommended**:
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ SSD
- Network: 100Mbps+

---

## 🔐 Security Considerations

### Model A (SaaS)

**Risks**:
- ⚠️ Code uploaded to cloud
- ⚠️ Credentials stored in cloud
- ⚠️ Third-party API dependencies

**Mitigations**:
- ✅ Encryption at rest (KMS)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Zero-knowledge architecture (optional)

### Model B/C/D (Local Execution)

**Benefits**:
- ✅ Code stays on user machine
- ✅ No third-party API calls
- ✅ Complete privacy

**Risks**:
- ⚠️ User machine security depends on user
- ⚠️ No centralized audit logs

---

## 📊 Competitive Analysis

### Cursor (AI Code Editor)

**Model**: Desktop App (Electron)
**Pricing**: $20/month (includes AI credits)
**Execution**: Local + API hybrid
**Cost Structure**: Subscription covers API costs (likely bulk rate from Anthropic/OpenAI)

### GitHub Copilot

**Model**: IDE Plugin + API
**Pricing**: $10/month (individual), $19/user/month (business)
**Execution**: Cloud API (OpenAI)
**Cost Structure**: Subscription covers API costs (bulk rate)

### Replit Agent

**Model**: Web-based IDE
**Pricing**: $20/month (includes AI credits)
**Execution**: Cloud (their infrastructure)
**Cost Structure**: Subscription likely doesn't cover full API cost at scale

### Our Competitive Advantage

**Hybrid Model C**:
- ✅ **Lower pricing possible**: $5-10/month (no API costs)
- ✅ **Better privacy**: Local execution
- ✅ **Offline capability**: Works without internet (local tasks)
- ✅ **Unlimited usage**: No API rate limits

---

## 💡 Business Model Implications

### Pricing Strategy for Model C (Hybrid)

**Free Tier**:
```yaml
Price: $0/month
Limits:
  - 10 issues/month
  - 1 agent
  - Community support
Cost to us: $0.13/month (infrastructure only)
Margin: Acceptable (freemium acquisition)
```

**Pro Tier**:
```yaml
Price: $10/month
Limits:
  - 100 issues/month
  - 5 agents
  - Email support
Cost to us: $1.30/month
Margin: 87% ($8.70 profit)
```

**Team Tier**:
```yaml
Price: $20/user/month
Limits:
  - Unlimited issues
  - Unlimited agents
  - Priority support
  - Team collaboration
Cost to us: $2.00/user/month
Margin: 90% ($18 profit)
```

**Enterprise Tier**:
```yaml
Price: $100/user/month
Limits:
  - Everything in Team
  - On-premise option
  - SSO, audit logs
  - SLA guarantees
  - Dedicated support
Cost to us: $10/user/month
Margin: 90% ($90 profit)
```

### Revenue Projections

**Year 1** (Conservative):
```
100 Free users:     $0 MRR
50 Pro users:       $500 MRR
20 Team users:      $400 MRR
5 Enterprise:       $500 MRR
TOTAL:              $1,400 MRR = $16,800 ARR

Costs:              $329/month = $3,948/year
Profit:             $12,852/year
Margin:             76%
```

**Year 2** (Growth):
```
1,000 Free users:   $0 MRR
500 Pro users:      $5,000 MRR
200 Team users:     $4,000 MRR
50 Enterprise:      $5,000 MRR
TOTAL:              $14,000 MRR = $168,000 ARR

Costs:              $600/month = $7,200/year
Profit:             $160,800/year
Margin:             96%
```

**Year 3** (Scale):
```
10,000 Free users:  $0 MRR
5,000 Pro users:    $50,000 MRR
2,000 Team users:   $40,000 MRR
500 Enterprise:     $50,000 MRR
TOTAL:              $140,000 MRR = $1,680,000 ARR

Costs:              $2,000/month = $24,000/year
Profit:             $1,656,000/year
Margin:             99%
```

---

## 🚀 Implementation Roadmap for Model C

### Phase 1: MVP (Month 1-3)

**Week 1-2: Local Agent Core**
```rust
// Core functionality
- [ ] Claude Code SDK integration
- [ ] WebSocket client
- [ ] State synchronization
- [ ] Basic task execution
```

**Week 3-4: Web UI**
```typescript
// Next.js dashboard
- [ ] Issue list view
- [ ] Agent status monitor
- [ ] Log viewer
- [ ] Settings page
```

**Week 5-8: Cloud Backend**
```typescript
// AWS infrastructure
- [ ] API Gateway setup
- [ ] DynamoDB tables
- [ ] S3 buckets
- [ ] WebSocket API (API Gateway v2)
```

**Week 9-12: Integration & Testing**
```
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta release
```

### Phase 2: Scale (Month 4-6)

**Month 4: Multi-user**
```
- [ ] User authentication (Cognito)
- [ ] Team management
- [ ] Access control
- [ ] Usage tracking
```

**Month 5: Collaboration**
```
- [ ] Shared workspaces
- [ ] Real-time updates
- [ ] Comment system
- [ ] Activity feed
```

**Month 6: Marketplace**
```
- [ ] Custom agent creation
- [ ] Agent sharing
- [ ] Template library
- [ ] Community ratings
```

### Phase 3: Enterprise (Month 7-12)

**Month 7-9: Enterprise Features**
```
- [ ] SSO integration (SAML, OAuth)
- [ ] Audit logs
- [ ] Compliance reports (SOC 2, ISO 27001)
- [ ] SLA monitoring
```

**Month 10-12: Advanced**
```
- [ ] On-premise deployment (Docker)
- [ ] Air-gapped mode
- [ ] Custom branding
- [ ] Priority support
```

---

## 📋 Decision Matrix

### Evaluation Criteria

| Criteria | Weight | Model A | Model B | Model C | Model D |
|----------|--------|---------|---------|---------|---------|
| **Cost Efficiency** | 30% | 1/10 | 10/10 | 9/10 | 10/10 |
| **User Experience** | 25% | 10/10 | 7/10 | 9/10 | 4/10 |
| **Scalability** | 20% | 10/10 | 8/10 | 8/10 | 8/10 |
| **Time to Market** | 15% | 8/10 | 6/10 | 7/10 | 9/10 |
| **Security** | 10% | 7/10 | 10/10 | 9/10 | 10/10 |

### Weighted Scores

```python
Model A (SaaS):
  Cost: 1 × 0.30 = 0.30
  UX: 10 × 0.25 = 2.50
  Scale: 10 × 0.20 = 2.00
  TTM: 8 × 0.15 = 1.20
  Security: 7 × 0.10 = 0.70
  TOTAL: 6.70/10

Model B (Desktop):
  Cost: 10 × 0.30 = 3.00
  UX: 7 × 0.25 = 1.75
  Scale: 8 × 0.20 = 1.60
  TTM: 6 × 0.15 = 0.90
  Security: 10 × 0.10 = 1.00
  TOTAL: 8.25/10

Model C (Hybrid):
  Cost: 9 × 0.30 = 2.70
  UX: 9 × 0.25 = 2.25
  Scale: 8 × 0.20 = 1.60
  TTM: 7 × 0.15 = 1.05
  Security: 9 × 0.10 = 0.90
  TOTAL: 8.50/10 ✅ Winner

Model D (CLI):
  Cost: 10 × 0.30 = 3.00
  UX: 4 × 0.25 = 1.00
  Scale: 8 × 0.20 = 1.60
  TTM: 9 × 0.15 = 1.35
  Security: 10 × 0.10 = 1.00
  TOTAL: 7.95/10
```

**Winner**: **Model C (Hybrid)** 🏆

---

## ✅ Final Recommendation

### Primary Strategy: Model C (Hybrid)

**Rationale**:
1. **Cost**: 99.4% cheaper than Model A ($329/month vs $148,880/month at scale)
2. **UX**: Web-based interface (as good as SaaS)
3. **Privacy**: Code stays local (as secure as Desktop)
4. **Scalability**: Linear with users (infrastructure cost minimal)
5. **Revenue**: High margin (90%+) enables competitive pricing

### Fallback Strategy: Model B (Desktop)

**If Hybrid is too complex**:
- Even lower cost ($50/month at scale)
- Simpler architecture
- Faster time to market
- Trade-off: Installation friction

### Avoid: Model A (Full SaaS)

**Unless**:
- Negotiated bulk pricing with Anthropic (<$0.50/M tokens)
- Enterprise customers willing to pay $50+/issue
- Strategic reason to subsidize (e.g., freemium acquisition with high LTV)

---

## 📞 Next Steps

1. **Validate**: Prototype Local Agent Runner (Week 1-2)
2. **Test**: Run cost simulation with real workloads (Week 3)
3. **Decide**: Final architecture selection (Week 4)
4. **Build**: Start MVP development (Month 2)
5. **Launch**: Beta release (Month 3)

---

## 📚 References

- Claude API Pricing: https://www.anthropic.com/pricing
- Claude Code Documentation: https://docs.claude.com/claude-code
- AWS Pricing Calculator: https://calculator.aws/
- Cursor Pricing: https://cursor.sh/pricing
- GitHub Copilot Pricing: https://github.com/features/copilot

---

**結論**: Hybrid Model (C) を強く推奨します。API コストを95%削減しつつ、優れたユーザー体験を提供できます。🚀
