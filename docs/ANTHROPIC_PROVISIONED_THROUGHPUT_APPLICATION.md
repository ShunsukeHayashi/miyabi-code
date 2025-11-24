# Anthropic Provisioned Throughput Application Guide

**Issue**: #840
**Date**: 2025-11-23
**Purpose**: Migrate from AWS Bedrock to Anthropic Direct API with Provisioned Throughput

---

## 📋 Application Information

### Business Use Case

**Project**: Miyabi Orchestra - Autonomous Development Operations Platform
**Description**: 200-agent parallel orchestration system for fully automated software development lifecycle (Issue processing, code generation, review, PR creation, deployment)

### Technical Requirements

```yaml
System Architecture:
  Total Agents: 200
  Distribution:
    - MUGEN (MacBook M1 Max): 100 agents (Agent-001 to Agent-100)
    - MAJIN (AWS EC2 128GB): 100 agents (Agent-101 to Agent-200)

  Concurrent Execution:
    - Peak: 50 agents
    - Average: 30 agents
    - Minimum: 10 agents

Usage Projections:
  Daily Requests: 200,000 requests/day
    - Per Agent: 1,000 requests/day
    - Distribution: 24-hour operation with peak hours (JST 9:00-18:00)

  Token Usage (per request):
    - Input Tokens: 2,000 tokens (avg)
    - Output Tokens: 1,000 tokens (avg)
    - Total per request: 3,000 tokens

  Daily Token Volume:
    - Input: 400M tokens/day
    - Output: 200M tokens/day
    - Total: 600M tokens/day

  Monthly Token Volume:
    - Input: 12B tokens/month
    - Output: 6B tokens/month
    - Total: 18B tokens/month
```

### Desired Configuration

```yaml
Model:
  Name: Claude Sonnet 4.5
  Model ID: claude-sonnet-4-5-20250929
  Fallback: Claude Sonnet 4 (claude-sonnet-4-20250514)

Provisioned Throughput:
  Minimum Concurrent Requests: 50
  Desired Concurrent Requests: 100
  Peak Burst: 150

Contract Terms:
  Initial Period: 3 months
  Auto-renewal: Optional (preferred: Yes)
  Commitment: Monthly or Annual (request quote for both)

Budget:
  Target: Under $10,000/month
  Maximum: $15,000/month
  Preferred Payment: Credit Card (Auto-pay)
```

---

## 📝 Application Steps

### Step 1: Access Anthropic Console

1. Navigate to: https://console.anthropic.com/
2. Sign in with account: `shunsuke.hayashi@customer-cloud.com` (or create new account)
3. Navigate to: **Settings** → **Provisioned Throughput**

### Step 2: Complete Application Form

**Section 1: Company Information**
```
Company Name: Customer Cloud K.K.
Industry: Software Development / AI Services
Location: Tokyo, Japan
Website: https://customer-cloud.com
```

**Section 2: Use Case Description**
```
Use Case: Miyabi Orchestra - 200-Agent Parallel Development System

Description:
We are building an autonomous software development operations platform
that orchestrates 200 AI agents in parallel for end-to-end development
automation. The system handles:
- GitHub Issue analysis and classification
- Code generation and implementation
- Automated code review
- Pull Request creation
- CI/CD deployment

The agents operate 24/7 across two infrastructure layers:
- MUGEN: MacBook M1 Max (100 agents)
- MAJIN: AWS EC2 128GB RAM (100 agents)

Provisioned Throughput is required to ensure consistent, low-latency
responses for real-time agent orchestration and parallel task execution.
```

**Section 3: Usage Projections**
```
Expected Daily Requests: 200,000
Expected Monthly Requests: 6,000,000

Token Usage:
- Input: 12B tokens/month
- Output: 6B tokens/month

Concurrent Requests:
- Minimum: 50
- Average: 75
- Peak: 100-150
```

**Section 4: Timeline**
```
Desired Start Date: 2025-11-27 (4 days from application)
Initial Contract Length: 3 months
Auto-renewal Preference: Yes

Urgency: High
Reason: System is currently operational on AWS Bedrock with limited
        throughput. Migration to Provisioned Throughput required
        to support 200-agent scale.
```

**Section 5: Budget & Payment**
```
Estimated Budget: $10,000 - $15,000/month
Payment Method: Credit Card (preferred) or Invoice
Billing Contact: shunsuke.hayashi@customer-cloud.com
```

### Step 3: Submit Application

1. Review all information for accuracy
2. Attach supporting documents (if available):
   - Architecture diagram (optional)
   - Traffic projections spreadsheet (optional)
3. Submit application
4. Note Application ID / Ticket Number

### Step 4: Follow-up

**Expected Timeline**:
- Application review: 1-3 business days
- Approval notification: Email to billing contact
- Provisioned Throughput activation: 1-2 business days after approval

**Follow-up Actions**:
- Day 1: Confirm application receipt (check email)
- Day 2: If no response, email support@anthropic.com with Application ID
- Day 3: If still no response, escalate via Anthropic dashboard chat
- Day 4: Request expedited review (mention urgent production requirement)

---

## 🔧 Post-Approval Configuration

### Step 1: Obtain API Keys

Once approved:
1. Navigate to: **Settings** → **API Keys**
2. Create new API key: `miyabi-orchestra-production`
3. Set permissions: Full access
4. Copy API key: `sk-ant-api03-...`
5. Store securely in AWS Secrets Manager

```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name miyabi/anthropic-api-key \
  --description "Anthropic API Key for Miyabi Orchestra (Provisioned Throughput)" \
  --secret-string "sk-ant-api03-..." \
  --region us-east-1
```

### Step 2: Update .codex/settings.toml

```toml
[api.anthropic]
enabled = true
provider = "direct"  # Changed from "aws-bedrock"

[api.anthropic.direct]
# Provisioned Throughput Configuration
model_id = "claude-sonnet-4-5-20250929"
model_name = "Claude Sonnet 4.5"
provisioned_throughput = true
throughput_id = "pt-xxxxxxxxxxxxx"  # Provided by Anthropic after approval

# API Key (stored in AWS Secrets Manager)
secret_manager = "aws-secrets"
secret_id = "miyabi/anthropic-api-key"
region = "us-east-1"

# Rate Limits (Provisioned Throughput)
[api.anthropic.rate_limits]
concurrent_requests = 50  # Or value provided by Anthropic
requests_per_minute = 10000  # Provisioned Throughput has no RPM limit
```

### Step 3: Update Agent Configuration

**File**: `scripts/orchestra-quick-start.sh`

```bash
# Replace AWS Bedrock configuration with Anthropic Direct API

# OLD (AWS Bedrock)
export AWS_REGION="us-east-1"
export BEDROCK_MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"

# NEW (Anthropic Direct API)
export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id miyabi/anthropic-api-key \
  --region us-east-1 \
  --query SecretString \
  --output text)
export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"
export ANTHROPIC_PROVISIONED_THROUGHPUT_ID="pt-xxxxxxxxxxxxx"
```

### Step 4: Test Configuration

```bash
# Test Anthropic API connection
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello, Claude!"}]
  }'

# Expected: JSON response with Claude's reply
```

---

## 💰 Cost Estimation

### Provisioned Throughput Pricing (Estimated)

**Note**: Actual pricing will be provided by Anthropic during application review.

**Estimated Monthly Cost**:
```
Base Cost (50 concurrent requests): $8,000 - $12,000/month
Additional Throughput (per 10 requests): $1,500 - $2,000/month

Total for 50 concurrent: ~$10,000/month
Total for 100 concurrent: ~$20,000/month

Token Overage (if exceeds allocation): $0.015/1K input, $0.075/1K output
```

**Comparison with On-Demand**:
```
On-Demand Cost (18B tokens/month):
  Input (12B): 12B × $0.003/1K = $36,000
  Output (6B): 6B × $0.015/1K = $90,000
  Total: $126,000/month

Provisioned Throughput Savings: ~$110,000/month (87% reduction)
```

---

## 📊 Monitoring & Optimization

### Key Metrics to Track

1. **Throughput Utilization**
   - Current concurrent requests
   - Peak concurrent requests
   - Average response time

2. **Token Usage**
   - Daily token consumption
   - Token usage by agent type
   - Overage risk alerts

3. **Cost Tracking**
   - Monthly spend vs. budget
   - Cost per agent
   - ROI vs. on-demand pricing

### Dashboards

**Anthropic Console**:
- Navigate to: **Usage** → **Analytics**
- Monitor: Requests, Tokens, Latency

**Miyabi Orchestra Dashboard**:
- File: `miyabi-console/src/pages/Analytics.tsx`
- Custom metrics integration via Anthropic API

---

## 🚨 Troubleshooting

### Issue 1: Application Delayed

**Symptom**: No response after 3 business days

**Actions**:
1. Email: support@anthropic.com
   - Subject: "Provisioned Throughput Application Follow-up - Application ID: [ID]"
   - Include: Application ID, Use case summary, Urgency justification
2. Anthropic Console Chat: Request status update
3. Escalation: Request call with sales team

### Issue 2: Throughput Insufficient

**Symptom**: High latency or rate limiting even with Provisioned Throughput

**Actions**:
1. Check current utilization in Anthropic Console
2. Request throughput increase via support ticket
3. Temporary fallback: Use On-Demand API with rate limiting

### Issue 3: Migration Issues

**Symptom**: Agents fail after migration from AWS Bedrock

**Actions**:
1. Verify API key configuration
2. Check model ID compatibility
3. Review error logs: `logs/agents/agent-*.log`
4. Gradual migration: Migrate 10 agents at a time

---

## ✅ Success Criteria

- [ ] Application submitted with complete information
- [ ] Application ID received
- [ ] Approval email received (within 3 business days)
- [ ] API keys generated and stored in AWS Secrets Manager
- [ ] `.codex/settings.toml` updated with new configuration
- [ ] Test request successful (200 OK, valid response)
- [ ] 10 agents migrated and operational
- [ ] 100 agents migrated (MUGEN)
- [ ] 200 agents migrated (MUGEN + MAJIN)
- [ ] Monitoring dashboard showing healthy metrics
- [ ] Cost tracking aligned with budget

---

## 📚 References

- Anthropic Provisioned Throughput: https://docs.anthropic.com/provisioned-throughput
- Anthropic API Documentation: https://docs.anthropic.com/claude/reference
- Miyabi Architecture: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/context/architecture.md`
- Issue #840: https://github.com/customer-cloud/miyabi-private/issues/840
- Issue #841: https://github.com/customer-cloud/miyabi-private/issues/841

---

**Last Updated**: 2025-11-23
**Author**: Claude Code (Guardian)
**Status**: 🚀 Ready for Application Submission
