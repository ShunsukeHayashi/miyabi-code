# Miyabi Priority Execution Plan

**Date**: 2025-11-29
**Total Open Issues**: 32
**Planning Session**: Issue Refresh & Prioritization

---

## Executive Summary

| Metric | Value |
|--------|-------|
| P0 Critical | 4 issues |
| P1 High | 3 issues |
| Revenue Target | ¥500M/year |
| Key Blocker | Claude API Provisioned Throughput |

---

## Week 1: Foundation & Blockers

### Day 1-2: Critical Blockers

| # | Issue | Action | Owner | ETA |
|---|-------|--------|-------|-----|
| 1 | #840 | Claude 4.5 Provisioned Throughput申請 | - | 2h |
| 2 | #841 | 200 Agents API Keys展開 | - | 4h |
| 3 | #832 | Lambda Binary Fix (x86_64-musl) | - | 3h |

**#840 Details - Claude Provisioned Throughput**
```
1. AWS Console → Bedrock → Model access
2. Request Provisioned Throughput for claude-3-5-sonnet
3. Expected ARN: arn:aws:bedrock:us-west-2:xxx:provisioned-model-throughput/xxx
4. Update .codex/settings.toml with ARN
5. Test with 50 concurrent requests
```

**#841 Details - API Keys展開**
```bash
# MUGEN (100 agents)
ssh mugen
cd /home/ec2-user/agents
./deploy-keys.sh 001-100

# MAJIN (100 agents)
ssh majin
cd /home/ec2-user/agents
./deploy-keys.sh 101-200
```

**#832 Details - Lambda Binary**
```bash
# Build for Lambda
cargo build --release --target x86_64-unknown-linux-musl -p pantheon-api

# Deploy
aws lambda update-function-code \
  --function-name pantheon-api \
  --zip-file fileb://target/lambda.zip
```

### Day 3-4: AWS Foundation

| # | Issue | Action | ETA |
|---|-------|--------|-----|
| 4 | #842 | Phase 0 Assessment | 4h |
| 5 | #843 | Phase 1 Build | 8h |

**#842 Phase 0 Checklist**
- [ ] ベースラインパフォーマンス測定
- [ ] 現在のコスト分析
- [ ] Terraform/CDK設計書作成
- [ ] マルチアカウント戦略決定

**#843 Phase 1 Checklist**
- [ ] VPC作成 (10.0.0.0/16)
- [ ] Subnet設計 (Public x3, Private x3)
- [ ] IAM Roles/Policies
- [ ] Secrets Manager設定
- [ ] ECS Cluster作成
- [ ] DynamoDB Tables
- [ ] S3 Buckets

---

## Week 2: Enterprise Readiness

### Day 5-7: Enterprise Customer Prep (#837)

**Priority Tasks**
```
1. Demo Environment
   - Pantheon WebApp稼働確認
   - 50-Agent Orchestra デモ
   - Real-time Dashboard

2. Sales Materials
   - Executive Summary (1-pager)
   - Pitch Deck (15 slides)
   - ROI Calculator

3. Pricing Finalization
   - Starter: ¥100M/year
   - Professional: ¥300M/year
   - Enterprise: ¥500M/year

4. Legal Documents
   - MSA template
   - SLA (99.9% uptime)
   - NDA
```

---

## Week 3-4: Core Platform (#970)

### Miyabi Society Rebuild

**Scope**: 160-200時間 / 4-6週間

**Phase 1: Database**
- PostgreSQL スキーマ再設計
- Migration scripts作成
- Seed data準備

**Phase 2: Backend API**
- Axum endpoints実装
- Authentication/Authorization
- WebSocket real-time

**Phase 3: Frontend**
- React/Next.js UI
- Dashboard components
- Agent management UI

---

## Dependency Graph

```
#840 (Claude API) ──┐
                    ├──→ #841 (200 Agents) ──→ #883 (Phase 3: 200-Agent)
#832 (Lambda Fix) ──┘
        │
        v
#842 (AWS Phase 0) → #843 (AWS Phase 1) → #844 → #845 → #846
        │
        v
#837 (Enterprise) ←── #970 (Miyabi Society)
```

---

## Success Criteria

### Week 1 End
- [ ] Claude Provisioned Throughput active
- [ ] 200 agents with API keys
- [ ] Lambda binary working
- [ ] AWS Phase 0 complete

### Week 2 End
- [ ] AWS Phase 1 complete
- [ ] Demo environment ready
- [ ] Sales deck v1 complete
- [ ] Pricing approved

### Week 4 End
- [ ] Enterprise customer meeting scheduled
- [ ] Miyabi Society MVP deployed
- [ ] 200-agent parallel execution tested

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude API quota rejection | Prepare fallback to OpenAI/Gemini |
| Lambda architecture issues | Keep Vercel as backup |
| Enterprise deal delay | Focus on smaller customers first |

---

## Next Action

**Start with #840** - Claude 4.5 Provisioned Throughput申請

```bash
# Step 1: Check current AWS Bedrock status
aws bedrock list-foundation-models --region us-west-2

# Step 2: Request provisioned throughput via AWS Console
# or create support ticket
```
