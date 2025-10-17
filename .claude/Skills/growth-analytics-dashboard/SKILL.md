---
name: Growth Analytics and Dashboard Management
description: Comprehensive data analysis including KPI tracking, PDCA cycle implementation, growth metrics (CAC, LTV, NRR, churn), cohort analysis, A/B testing, and business intelligence dashboards. Use when analyzing performance, optimizing growth, or making data-driven decisions.
allowed-tools: Read, Write, WebFetch, Bash
---

# Growth Analytics and Dashboard Management

Complete analytics toolkit powered by AnalyticsAgent (すうじるん) - データ分析・KPI追跡・PDCA実行による継続的成長最適化。

## When to Use

- User requests "analyze our growth metrics"
- User asks "what's our customer acquisition cost?"
- User wants to "build a KPI dashboard"
- Tracking business performance
- Optimizing conversion funnels
- Making data-driven decisions
- Running A/B tests

## Analytics Workflow

### Step 1: KPI Definition & Dashboard Setup

**Agent**: AnalyticsAgent (すうじるん)

**Core KPI Framework**:

```markdown
## KPI体系（5カテゴリ）

### 1. Acquisition Metrics (獲得)
- **Traffic**: ウェブサイト訪問者数
  - Target: 10,000/month (Month 1)
  - Growth: +20% MoM

- **CAC (Customer Acquisition Cost)**: 顧客獲得コスト
  - Formula: Marketing spend / New customers
  - Target: ¥10,000/customer
  - Benchmark: < ¥15,000

- **Lead Conversion Rate**: リード転換率
  - Formula: Paid customers / Total leads
  - Target: 10%
  - Benchmark: 8-12%

### 2. Activation Metrics (活性化)
- **Onboarding Completion**: オンボーディング完了率
  - Formula: Users completing setup / New signups
  - Target: 80%
  - Benchmark: 70-85%

- **Time to Value (TTV)**: 価値実現までの時間
  - Target: < 3 days
  - Measure: Time to first successful action

- **Feature Adoption**: 機能採用率
  - Formula: Users using feature / Total active users
  - Target: 60%
  - Key features: Core vs Optional

### 3. Engagement Metrics (エンゲージメント)
- **DAU/MAU Ratio**: デイリー/マンスリー比率
  - Formula: Daily Active Users / Monthly Active Users
  - Target: 30%+
  - Benchmark: 20-40% (SaaS average)

- **Session Duration**: セッション時間
  - Target: 15 minutes/session
  - Benchmark: 10-20 minutes

- **Feature Usage Frequency**: 機能使用頻度
  - Target: 3x/week (power users)
  - Measure: Per feature, per user

### 4. Retention Metrics (継続)
- **Churn Rate**: 解約率
  - Formula: Lost customers / Total customers (monthly)
  - Target: < 5% monthly
  - Benchmark: 5-7% (B2B SaaS)

- **Retention Cohorts**: コホート継続率
  - Month 1: 100% (baseline)
  - Month 3: 70%+
  - Month 6: 50%+
  - Month 12: 40%+

- **NRR (Net Revenue Retention)**: 純売上維持率
  - Formula: (Starting MRR + Expansion - Churn) / Starting MRR
  - Target: 110%+
  - Benchmark: 100-120%

### 5. Revenue Metrics (収益)
- **MRR (Monthly Recurring Revenue)**: 月次経常収益
  - Target: ¥2M (Year 1, Month 12)
  - Growth: +10% MoM

- **ARR (Annual Recurring Revenue)**: 年間経常収益
  - Target: ¥24M (Year 1)
  - Formula: MRR × 12

- **LTV (Lifetime Value)**: 顧客生涯価値
  - Formula: ARPU × Average lifetime (months)
  - Target: ¥1,440,000 (60 months)
  - Benchmark: LTV/CAC ratio > 3:1

- **ARPU (Average Revenue Per User)**: ユーザー平均収益
  - Formula: Total MRR / Total customers
  - Target: ¥24,000/month
  - Growth: +5% MoM (via upsells)
```

---

### Step 2: Data Collection & Integration

**Data Sources**:

```markdown
## データソース統合

### 1. Product Analytics (プロダクト分析)
**Tools**: Mixpanel, Amplitude, PostHog

**Events to Track**:
- User signup (with source attribution)
- Onboarding completion
- Feature usage (per feature)
- Session start/end
- Error occurrences
- Payment events

**Implementation**:
```typescript
// Event tracking example
analytics.track('Feature Used', {
  userId: user.id,
  feature: 'code_review',
  timestamp: Date.now(),
  properties: {
    reviewDuration: 120, // seconds
    linesOfCode: 250,
    issuesFound: 5
  }
});
```

### 2. CRM & Sales Data (営業データ)
**Tools**: HubSpot, Salesforce, Pipedrive

**Data to Sync**:
- Lead source
- Deal stages
- Win/loss reasons
- Sales cycle duration
- Customer segment

### 3. Payment & Billing (決済データ)
**Tools**: Stripe, PayPal

**Metrics to Extract**:
- MRR/ARR
- Churn events
- Upgrade/downgrade events
- Payment failures
- Refunds

### 4. Customer Support (サポートデータ)
**Tools**: Intercom, Zendesk, Freshdesk

**Metrics to Track**:
- Ticket volume
- Resolution time
- Customer satisfaction (CSAT)
- NPS (Net Promoter Score)

### 5. Marketing Data (マーケティングデータ)
**Tools**: Google Analytics, Facebook Ads, LinkedIn Ads

**Metrics to Sync**:
- Traffic sources
- Campaign performance
- Ad spend
- Conversion rates
```

---

### Step 3: Dashboard Design

**Dashboard Architecture**:

```markdown
## ダッシュボード設計

### Executive Dashboard (経営ダッシュボード)
**Audience**: CEO, Founders, Investors
**Update Frequency**: Weekly

**Key Metrics**:
1. **ARR Growth** (line chart)
   - Current ARR: ¥24M
   - MoM growth: +10%
   - Target: ¥50M (Year 2)

2. **Customer Count** (number + trend)
   - Total customers: 100
   - New customers (this month): 15
   - Churned customers: 5

3. **Unit Economics** (table)
   | Metric | Value | Target | Status |
   |--------|-------|--------|--------|
   | CAC | ¥10,000 | < ¥15,000 | 🟢 |
   | LTV | ¥1,440,000 | > ¥500,000 | 🟢 |
   | LTV/CAC | 144:1 | > 3:1 | 🟢 |
   | Payback | 4 months | < 12 months | 🟢 |

4. **Churn Rate** (gauge)
   - Current: 4.5% monthly
   - Target: < 5%
   - Status: 🟢 On track

5. **NRR** (gauge)
   - Current: 115%
   - Target: > 110%
   - Status: 🟢 Excellent

### Product Dashboard (プロダクトダッシュボード)
**Audience**: Product Managers, Developers
**Update Frequency**: Daily

**Key Metrics**:
1. **DAU/MAU** (line chart)
   - DAU: 3,000
   - MAU: 10,000
   - Ratio: 30%

2. **Feature Adoption** (bar chart)
   - Code Review: 95%
   - Security Scan: 80%
   - Custom Rules: 60%
   - API Integration: 45%

3. **Onboarding Funnel** (funnel chart)
   - Signup: 100%
   - Email verification: 90%
   - Setup completed: 80%
   - First review: 70%
   - Integration done: 60%

4. **Session Metrics** (table)
   | Metric | Value |
   |--------|-------|
   | Avg. session duration | 15 min |
   | Sessions per user | 3.5/week |
   | Bounce rate | 25% |

5. **Error Rate** (time series)
   - API errors: 0.5%
   - Client errors: 1.2%
   - Target: < 2%

### Marketing Dashboard (マーケティングダッシュボード)
**Audience**: Marketing Team
**Update Frequency**: Daily

**Key Metrics**:
1. **Traffic Sources** (pie chart)
   - Organic: 40%
   - Direct: 25%
   - Paid: 20%
   - Referral: 10%
   - Social: 5%

2. **Conversion Funnel** (funnel chart)
   - Visitors: 10,000
   - Signups: 500 (5%)
   - Free trial: 400 (4%)
   - Paid: 50 (0.5%)

3. **Campaign Performance** (table)
   | Campaign | Spend | Leads | CAC | ROI |
   |----------|-------|-------|-----|-----|
   | Google Ads | ¥200K | 30 | ¥6,667 | 3.5x |
   | LinkedIn | ¥150K | 15 | ¥10,000 | 2.8x |
   | Content | ¥50K | 25 | ¥2,000 | 12x |

4. **SEO Performance** (line chart)
   - Organic traffic: 4,000/month
   - Keyword rankings (top 10): 15 keywords
   - Backlinks: 250

5. **Email Metrics** (table)
   | Metric | Value |
   |--------|-------|
   | Open rate | 25% |
   | Click rate | 5% |
   | Unsubscribe | 0.5% |

### Sales Dashboard (セールスダッシュボード)
**Audience**: Sales Team
**Update Frequency**: Daily

**Key Metrics**:
1. **Pipeline** (bar chart by stage)
   - Lead: ¥5M
   - Qualified: ¥3M
   - Demo: ¥2M
   - Proposal: ¥1M
   - Negotiation: ¥500K

2. **Win Rate** (gauge)
   - Current: 25%
   - Target: 20%
   - Status: 🟢

3. **Sales Cycle** (histogram)
   - Avg: 21 days
   - Target: < 30 days
   - Distribution: 7-45 days

4. **Rep Performance** (table)
   | Rep | Deals | Revenue | Quota |
   |-----|-------|---------|-------|
   | Rep A | 15 | ¥3.6M | 120% |
   | Rep B | 10 | ¥2.4M | 80% |

5. **Lead Sources** (pie chart)
   - Inbound: 60%
   - Outbound: 30%
   - Referral: 10%
```

---

### Step 4: Cohort Analysis

**Retention Cohort Analysis**:

```markdown
## コホート分析

### Monthly Retention Cohorts

| Cohort | M0 | M1 | M2 | M3 | M6 | M12 |
|--------|----|----|----|----|----|----|
| Jan 2024 | 100% | 85% | 75% | 70% | 55% | 45% |
| Feb 2024 | 100% | 88% | 78% | 72% | 58% | - |
| Mar 2024 | 100% | 90% | 80% | 75% | 60% | - |
| Apr 2024 | 100% | 92% | 82% | 77% | - | - |
| May 2024 | 100% | 93% | 85% | - | - | - |
| Jun 2024 | 100% | 95% | - | - | - | - |

### Insights:
- ✅ **Improving retention**: Newer cohorts have better retention
- 🎯 **Critical period**: M1-M3 (steepest drop)
- 📈 **Action**: Enhanced onboarding in March 2024 improved M1 retention by 5%

### Revenue Cohort Analysis

| Cohort | M0 ARPU | M1 ARPU | M3 ARPU | M6 ARPU | M12 ARPU |
|--------|---------|---------|---------|---------|----------|
| Jan 2024 | ¥20K | ¥22K | ¥25K | ¥28K | ¥32K |
| Feb 2024 | ¥20K | ¥23K | ¥26K | ¥30K | - |
| Mar 2024 | ¥20K | ¥24K | ¥28K | - | - |

### Insights:
- ✅ **Expansion revenue**: +60% ARPU growth over 12 months
- 🎯 **Upsell timing**: M3-M6 is optimal for plan upgrades
- 📈 **Action**: Automated upsell campaigns at M3 milestone
```

---

### Step 5: A/B Testing Framework

**Experimentation Workflow**:

```markdown
## A/Bテスト実施フロー

### Experiment Template

**Experiment Name**: Onboarding Flow Simplification
**Hypothesis**: Reducing onboarding steps from 5 to 3 will increase completion rate from 80% to 90%
**Metric**: Onboarding completion rate
**Duration**: 2 weeks
**Sample Size**: 1,000 users (500 per variant)
**Statistical Significance**: 95% confidence

### Variant Design

**Control (A)**: Current 5-step onboarding
1. Email verification
2. Profile setup
3. GitHub integration
4. Team invitation
5. First review

**Treatment (B)**: Simplified 3-step onboarding
1. Email verification + Profile setup (combined)
2. GitHub integration (required)
3. First review (team invitation moved to post-onboarding)

### Metrics to Track

**Primary Metric**:
- Onboarding completion rate (%)

**Secondary Metrics**:
- Time to complete onboarding (minutes)
- First review completion rate (%)
- Day 7 retention rate (%)

### Results Analysis

| Metric | Control (A) | Treatment (B) | Lift | Significance |
|--------|-------------|---------------|------|--------------|
| Completion rate | 80% | 92% | +15% | ✅ p < 0.01 |
| Time to complete | 15 min | 8 min | -47% | ✅ p < 0.01 |
| First review | 70% | 85% | +21% | ✅ p < 0.01 |
| Day 7 retention | 65% | 70% | +8% | ✅ p = 0.03 |

### Decision: ✅ Ship Treatment (B)
- All metrics improved significantly
- Risk: Low (secondary metrics also improved)
- Rollout: 100% in 1 week

### Experiment Log

| Date | Experiment | Winner | Lift | Status |
|------|------------|--------|------|--------|
| 2024-01 | Pricing page redesign | B | +12% conversion | ✅ Shipped |
| 2024-02 | Email subject lines | A | - | ❌ No difference |
| 2024-03 | Onboarding flow | B | +15% completion | ✅ Shipped |
| 2024-04 | Landing page CTA | B | +8% signups | 🔄 Rolling out |
```

---

### Step 6: PDCA Cycle Implementation

**Plan-Do-Check-Act Framework**:

```markdown
## PDCAサイクル（4週間スプリント）

### Week 1: Plan (計画)
**Goal Setting**:
- Objective: Reduce churn rate from 5% to 3% monthly
- Key Results:
  - KR1: Improve onboarding completion from 80% to 90%
  - KR2: Increase Day 30 retention from 70% to 80%
  - KR3: Reduce support tickets by 20%

**Data Analysis**:
- Current churn reasons (exit survey):
  1. Too complex (35%)
  2. Lack of integrations (25%)
  3. Better competitor (20%)
  4. Price (15%)
  5. Other (5%)

**Action Plan**:
1. Simplify onboarding (addresses 35% of churn)
2. Launch Slack integration (addresses 25% of churn)
3. Competitive feature parity analysis (addresses 20% of churn)

### Week 2-3: Do (実行)
**Execution**:
- Launch simplified onboarding (Week 2)
- Ship Slack integration beta (Week 3)
- Conduct competitive analysis (ongoing)

**Tracking**:
- Daily metrics review
- Weekly team sync
- Real-time dashboard monitoring

### Week 4: Check (評価)
**Results**:
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Onboarding completion | 90% | 92% | 🟢 Exceeded |
| Day 30 retention | 80% | 78% | 🟡 Near target |
| Support tickets | -20% | -18% | 🟡 Near target |
| Churn rate | 3% | 3.5% | 🟡 Improved but not target |

**Insights**:
- ✅ Onboarding improvement worked
- ⚠️ Retention still needs work (78% vs 80%)
- ⚠️ Churn improved but didn't hit target

**Root Cause Analysis**:
- Onboarding completion improved, but users still churning in weeks 2-4
- Slack integration adoption: only 40% (expected 60%)

### Week 4: Act (改善)
**Adjustments for Next Sprint**:
1. **Continue**: Simplified onboarding (proven winner)
2. **Improve**: Slack integration promotion (increase adoption)
3. **Add**: In-app usage tips for weeks 2-4 (reduce early churn)
4. **Stop**: Competitive analysis (low ROI, focus on product)

**Next Sprint Goals**:
- Objective: Hit 3% churn rate target
- Key Results:
  - KR1: Increase Slack integration adoption to 60%
  - KR2: Reduce week 2-4 churn by 50%
  - KR3: Implement in-app guidance system

### PDCA Sprint History

| Sprint | Objective | Result | Status | Learning |
|--------|-----------|--------|--------|----------|
| 2024-Q1-S1 | Reduce CAC by 20% | ¥12K → ¥10K | ✅ Hit | Content marketing > Paid ads |
| 2024-Q1-S2 | Increase trial conversion to 12% | 10% → 11% | 🟡 Partial | Need more proof points |
| 2024-Q1-S3 | Reduce churn to 3% | 5% → 3.5% | 🟡 Partial | Onboarding alone not enough |
| 2024-Q1-S4 | Hit 3% churn target | TBD | 🔄 In progress | - |
```

---

### Step 7: Predictive Analytics

**Forecasting & Predictions**:

```markdown
## 予測分析

### Churn Prediction Model
**Algorithm**: Logistic Regression + Random Forest
**Features** (20 total):
- User engagement (DAU/MAU ratio)
- Feature adoption (# features used)
- Support tickets (count, sentiment)
- Payment failures (count)
- Session duration (avg)
- Last activity (days ago)
- Onboarding completion (boolean)
- Team size (number)
- Plan tier (categorical)
- Contract length (months)

**Model Performance**:
- Accuracy: 87%
- Precision: 82% (of predicted churns, 82% actually churn)
- Recall: 78% (of actual churns, 78% predicted)
- F1 Score: 80%

**Output**: Churn risk score (0-100)
- 0-30: Low risk (🟢)
- 31-60: Medium risk (🟡)
- 61-100: High risk (🔴)

**Actions by Risk Tier**:
- 🟢 Low risk (0-30): Automated check-ins, upsell opportunities
- 🟡 Medium risk (31-60): CSM outreach, usage tips, feature demos
- 🔴 High risk (61-100): Executive escalation, retention offer, urgent call

**Deployment**:
- Model runs daily
- Top 20 high-risk accounts reviewed by CSM team
- Automated email campaigns triggered for medium risk

### Revenue Forecasting
**Time Series Model**: ARIMA + Prophet

**Input Data**:
- Historical MRR (24 months)
- Seasonality patterns
- Marketing spend
- New customer signups
- Churn rate
- Expansion revenue

**Forecast (Next 12 Months)**:
| Month | MRR Forecast | Confidence Interval (95%) |
|-------|--------------|---------------------------|
| M1 | ¥2.1M | ¥2.0M - ¥2.2M |
| M3 | ¥2.5M | ¥2.3M - ¥2.7M |
| M6 | ¥3.2M | ¥2.9M - ¥3.5M |
| M12 | ¥4.8M | ¥4.2M - ¥5.4M |

**Scenario Analysis**:
- **Best case** (90th percentile): ¥5.4M MRR by M12
- **Base case** (50th percentile): ¥4.8M MRR by M12
- **Worst case** (10th percentile): ¥4.2M MRR by M12

**Assumptions**:
- Churn stays at 3.5% monthly
- New customer acquisition: 15/month
- Expansion revenue: +5% ARPU MoM
- No major competitors or market disruptions
```

---

## Dashboard Technology Stack

```markdown
## 推奨ツールスタック

### Business Intelligence (BI)
**Option 1: Metabase** (Open-source, self-hosted)
- Pros: Free, customizable, SQL-based
- Cons: Requires setup, limited ML features

**Option 2: Tableau / Power BI** (Enterprise)
- Pros: Advanced visualizations, ML integration
- Cons: Expensive, licensing costs

**Option 3: Looker (Google)** (Cloud-native)
- Pros: LookML modeling, BigQuery integration
- Cons: Expensive, steep learning curve

**Recommendation**: Start with Metabase (free), upgrade to Looker at scale

### Data Warehouse
**Option 1: PostgreSQL** (Traditional)
- Pros: Familiar, mature ecosystem
- Cons: Limited scalability

**Option 2: BigQuery (Google)** (Cloud-native)
- Pros: Serverless, scales infinitely, SQL-based
- Cons: Cost at high volume

**Option 3: Snowflake** (Modern cloud)
- Pros: Best-in-class performance, data sharing
- Cons: Most expensive

**Recommendation**: BigQuery for cost-effectiveness + scalability

### Product Analytics
**Option 1: Mixpanel**
- Pros: User-centric, funnel analysis, retention tools
- Cons: Pricing scales with users

**Option 2: Amplitude**
- Pros: Behavioral cohorts, predictive analytics
- Cons: Expensive for small teams

**Option 3: PostHog** (Open-source)
- Pros: Self-hosted, privacy-focused, feature flags
- Cons: Requires DevOps setup

**Recommendation**: PostHog (self-hosted) or Mixpanel (cloud)

### ETL / Data Pipeline
**Option 1: Airbyte** (Open-source)
- Pros: 300+ connectors, free
- Cons: Self-hosted maintenance

**Option 2: Fivetran** (Managed)
- Pros: Reliable, no maintenance
- Cons: Expensive ($100-500/connector/month)

**Recommendation**: Airbyte for cost-conscious teams

### Visualization Libraries (Custom dashboards)
- **React**: Recharts, Victory, Nivo
- **Python**: Plotly, Altair, Matplotlib
- **JavaScript**: D3.js, Chart.js, ECharts

### Example Architecture
```
┌─────────────────────────────────────────────────┐
│ Data Sources                                     │
│ - Product DB (PostgreSQL)                        │
│ - Stripe API                                     │
│ - HubSpot CRM                                    │
│ - Google Analytics                               │
│ - Mixpanel Events                                │
└─────────────────────────────────────────────────┘
              │
              │ (Airbyte ETL)
              ▼
┌─────────────────────────────────────────────────┐
│ Data Warehouse (BigQuery)                        │
│ - Raw data tables                                │
│ - Transformed data (dbt)                         │
│ - Aggregated metrics                             │
└─────────────────────────────────────────────────┘
              │
              │ (SQL queries)
              ▼
┌─────────────────────────────────────────────────┐
│ BI Layer (Metabase / Looker)                    │
│ - Executive dashboard                            │
│ - Product dashboard                              │
│ - Marketing dashboard                            │
│ - Sales dashboard                                │
└─────────────────────────────────────────────────┘
```
```

---

## Automation & Alerts

```markdown
## 自動化とアラート

### Automated Reporting
**Daily Reports** (8:00 AM):
- Yesterday's signups
- Active users (DAU)
- Revenue (MRR change)
- Top issues (errors, support tickets)

**Weekly Reports** (Monday 9:00 AM):
- Weekly growth summary
- Cohort performance
- A/B test results
- PDCA sprint progress

**Monthly Reports** (1st of month):
- Monthly business review (MBR)
- Executive summary for investors
- Department KPIs (Product, Marketing, Sales)
- Forecasts vs Actuals

### Alerting System
**Critical Alerts** (Slack + Email + SMS):
- Churn rate > 7% (threshold breach)
- Payment failures > 10% (revenue risk)
- API error rate > 5% (system health)
- Security incident detected

**Warning Alerts** (Slack + Email):
- CAC increasing 20% MoM (cost concern)
- Trial conversion rate < 8% (acquisition issue)
- Onboarding completion < 75% (activation issue)
- NRR < 100% (expansion issue)

**Info Alerts** (Slack only):
- New high-value customer (> ¥100K ARR)
- Milestone reached (100th customer, ¥10M ARR)
- A/B test reached significance
- Forecast deviation > 15%

### Slack Integration Example
```javascript
// Post alert to Slack
const postAlert = async (metric, value, threshold, severity) => {
  const emoji = severity === 'critical' ? '🚨' : '⚠️';
  const color = severity === 'critical' ? 'danger' : 'warning';

  await slack.chat.postMessage({
    channel: '#alerts',
    text: `${emoji} ${metric} Alert`,
    attachments: [{
      color: color,
      fields: [
        { title: 'Metric', value: metric, short: true },
        { title: 'Current Value', value: value, short: true },
        { title: 'Threshold', value: threshold, short: true },
        { title: 'Action', value: 'Review dashboard immediately', short: false }
      ]
    }]
  });
};

// Example usage
if (churnRate > 0.07) {
  await postAlert('Churn Rate', '7.2%', '< 7%', 'critical');
}
```
```

---

## Success Criteria

### Dashboard Setup
- ✅ 4 core dashboards created (Executive, Product, Marketing, Sales)
- ✅ All 20+ KPIs defined with targets
- ✅ Data pipeline established (ETL → Warehouse → BI)
- ✅ Real-time refresh (< 1 hour latency)

### Analytics Capabilities
- ✅ Cohort analysis implemented (retention + revenue)
- ✅ A/B testing framework operational
- ✅ Churn prediction model deployed (> 80% accuracy)
- ✅ Revenue forecasting model (12-month horizon)

### PDCA Execution
- ✅ 4-week sprint cycle established
- ✅ Weekly metrics review meetings
- ✅ Data-driven decision making culture
- ✅ 3+ PDCA cycles completed with documented learnings

### Automation
- ✅ Daily/Weekly/Monthly automated reports
- ✅ Critical alerting system (Slack + Email)
- ✅ Self-service dashboard access for all teams
- ✅ Documentation for all metrics and dashboards

## Execution Time

- **Initial Setup**: 2-3 weeks (data pipeline + dashboards)
- **Ongoing Maintenance**: 5-10 hours/week (monitoring, reporting, optimization)
- **PDCA Sprint**: 4 weeks per cycle
- **A/B Test**: 2-4 weeks per experiment

## Related Skills

- **Business Strategy**: Uses data to validate strategy
- **Market Research**: Provides market benchmarks
- **Sales & CRM**: Tracks sales metrics and customer health
- **Content Marketing**: Measures content performance

## Related Files

- **Agent Spec**: `.claude/agents/specs/business/analytics-agent.md`
- **Output**: `docs/analytics/`
- **Dashboards**: `analytics-dashboards/` (Metabase configs)

---

## Example: Complete Analytics Implementation

**Scenario**: SaaS company with 100 customers, ¥2M MRR

### Step 1: Define KPIs (Week 1)
- Set targets for 20 core metrics
- Create tracking spreadsheet
- Align with business goals

### Step 2: Data Pipeline Setup (Week 2)
```bash
# Install Airbyte for ETL
docker run -d --name airbyte airbyte/airbyte

# Configure connectors
- PostgreSQL (product DB)
- Stripe (payment data)
- HubSpot (CRM data)
- Mixpanel (product analytics)

# Set up BigQuery warehouse
bq mk --dataset miyabi_analytics
```

### Step 3: Build Dashboards (Week 3)
- Install Metabase
- Connect to BigQuery
- Create 4 dashboards (Executive, Product, Marketing, Sales)
- Configure auto-refresh (hourly)

### Step 4: Launch PDCA Sprint 1 (Week 4+)
- **Plan**: Reduce churn from 5% to 3%
- **Do**: Implement onboarding improvements
- **Check**: Measure results after 4 weeks
- **Act**: Iterate based on data

### Step 5: Continuous Optimization (Ongoing)
- Weekly metrics review
- Monthly A/B tests
- Quarterly forecast updates
- Annual model retraining

---

**Analytics is the foundation of data-driven growth. Measure everything, optimize relentlessly, grow sustainably.** 📊📈
