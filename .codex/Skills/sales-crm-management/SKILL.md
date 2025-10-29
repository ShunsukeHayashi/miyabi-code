---
name: Sales and CRM Management
description: Comprehensive sales process and customer relationship management including lead generation, sales funnel optimization, customer success, LTV maximization, and churn reduction. Use when building sales processes, managing customers, or optimizing revenue.
allowed-tools: Read, Write, WebFetch, Bash
---

# Sales and CRM Management

Complete sales and customer management toolkit powered by 3 Customer-focused Business Agents: Sales (うるくん), CRM (かんりるん), and FunnelDesign (じょうごるん).

## When to Use

- User requests "build our sales process"
- User asks "how to reduce churn?"
- User wants to "increase customer LTV"
- Setting up sales operations
- Optimizing conversion funnel
- Improving customer success
- Managing customer relationships

## Sales & CRM Workflow

### Step 1: Sales Funnel Design (じょうごるん)

**Agent**: FunnelDesignAgent

**Complete Funnel**: Awareness → Purchase → LTV

#### Awareness Stage (Top of Funnel)
```markdown
## 認知獲得

### Channels
1. **Organic Search**
   - SEO-optimized content
   - Target: "code review tools"
   - Traffic goal: 5,000/month

2. **Social Media**
   - Twitter, LinkedIn presence
   - Target: Engineering managers
   - Follower goal: 5,000

3. **Content Marketing**
   - Blog posts, tutorials
   - Guest posts on DEV.to
   - Traffic goal: 3,000/month

4. **Paid Ads** (optional)
   - Google Ads
   - LinkedIn Sponsored Content
   - Budget: $3,000/month

### Metrics
- Impressions: 100,000/month
- Website visitors: 10,000/month
- Cost per visit: $0.30
```

#### Consideration Stage (Middle of Funnel)
```markdown
## 検討・評価

### Lead Magnets
1. **Free Trial** (14 days)
   - No credit card required
   - Full features access
   - Onboarding emails (5 emails)

2. **Content Offers**
   - "Code Review Best Practices Guide" (PDF)
   - "ROI Calculator" (interactive tool)
   - "Security Checklist" (PDF)

3. **Webinars**
   - "How to Build Better Code Review Process"
   - Monthly live demos
   - Q&A sessions

### Lead Capture Forms
- Email (required)
- Company name (required)
- Team size (required)
- Current process (optional)

### Nurture Sequence (14 days)
**Email 1** (Day 0): Welcome + Quick start guide
**Email 2** (Day 1): Feature highlight - Security scanning
**Email 3** (Day 3): Customer success story
**Email 4** (Day 5): Best practices tips
**Email 5** (Day 7): Mid-trial check-in + offer help
**Email 6** (Day 10): Advanced features tutorial
**Email 7** (Day 12): Last chance to convert + discount

### Metrics
- Free trial signups: 500/month
- Signup rate: 5%
- Lead quality score: 7/10
```

#### Decision Stage (Bottom of Funnel)
```markdown
## 購入決定

### Sales Process
1. **Self-Service** (Starter plan)
   - Online signup
   - Instant activation
   - No human touch

2. **Sales-Assisted** (Pro/Enterprise)
   - Demo call (30 min)
   - Technical Q&A
   - Custom pricing
   - Contract negotiation

### Conversion Tactics
**Urgency**:
- Limited-time discount: 20% off first 3 months
- Seasonal promotions: Black Friday, New Year

**Social Proof**:
- "Trusted by 1,000+ teams"
- Customer logos
- Testimonials with photos
- G2/Capterra reviews (4.5+ stars)

**Guarantee**:
- 30-day money-back guarantee
- Cancel anytime
- No questions asked refund

### Pricing Psychology
- **Starter**: ¥5,000/month (anchor low)
- **Pro**: ¥20,000/month (most popular 🌟)
- **Enterprise**: ¥100,000/month (anchor high)

### Metrics
- Conversion rate (trial → paid): 10%
- Average deal size: ¥240,000/year
- Sales cycle: 14-30 days
```

#### Retention & LTV Stage (Post-Purchase)
```markdown
## 継続・アップセル

### Onboarding (First 30 days)
- Day 1: Welcome call + setup support
- Day 7: Check-in + quick wins
- Day 14: Advanced features training
- Day 30: Success review

### Customer Success
- Dedicated CSM (Enterprise)
- In-app messaging (all plans)
- Help center + documentation
- Community forum

### Upsell Opportunities
1. **Plan Upgrade**
   - Starter → Pro (2x price, 4x value)
   - Pro → Enterprise (5x price, unlimited value)

2. **Add-ons**
   - Advanced security scanning: +¥5,000/month
   - Custom rules engine: +¥10,000/month
   - Priority support: +¥3,000/month

3. **Professional Services**
   - Custom integration: ¥500,000 one-time
   - Training workshops: ¥200,000/session
   - Consulting: ¥100,000/day

### Retention Tactics
- **Engagement triggers**: Usage alerts, feature tips
- **Win-back campaigns**: Re-engage inactive users
- **Loyalty program**: Refer-a-friend (1 month free)
- **Community events**: User meetups, webinars

### Metrics
- Churn rate: < 5% monthly
- Net Revenue Retention: 110%+
- Customer LTV: ¥1,440,000 (5 years)
- CAC payback period: 6 months
```

---

### Step 2: Sales Process (うるくん)

**Agent**: SalesAgent

**B2B Sales Playbook**:

#### Lead Qualification (BANT)
```markdown
## リード評価

### BANT Framework
**Budget**: ¥20,000-100,000/month budget confirmed
**Authority**: Decision maker (Engineering Manager, CTO)
**Need**: Code review pain points identified
**Timeline**: Looking to implement within 3 months

### Lead Scoring (0-100 points)
**Company Fit** (40 points):
- Team size 10-200: 20 pts
- Tech company: 10 pts
- Using GitHub/GitLab: 10 pts

**Engagement** (30 points):
- Attended webinar: 15 pts
- Downloaded resource: 10 pts
- Multiple site visits: 5 pts

**Behavior** (30 points):
- Pricing page visit: 15 pts
- Demo request: 15 pts

**Qualification**:
- 80-100 pts: Hot lead (immediate follow-up)
- 60-79 pts: Warm lead (nurture + follow-up)
- 40-59 pts: Cold lead (automated nurture)
- < 40 pts: Unqualified (disqualify)
```

#### Sales Call Structure (45 min)
```markdown
## デモ・商談プロセス

### Discovery Call (15 min)
**Questions to ask**:
1. "What's your current code review process?"
2. "What challenges are you facing?"
3. "How many developers on your team?"
4. "What tools are you currently using?"
5. "What would success look like for you?"

**Goal**: Understand pain points, budget, timeline

### Demo (20 min)
**Structure**:
1. Quick overview (2 min)
2. Live demo - their codebase (10 min)
   - Show AI review in action
   - Highlight security scanning
   - Demonstrate integrations
3. Q&A (8 min)

**Techniques**:
- Use their company name
- Show relevant features only
- Focus on ROI (time saved, bugs prevented)

### Close (10 min)
**Next steps**:
1. Send proposal + pricing
2. Schedule technical Q&A (if needed)
3. Provide free trial extension (if requested)
4. Set follow-up call (1 week)

**Objections handling**:
- "Too expensive" → Show ROI calculator
- "Need to think about it" → Uncover real concern
- "Using competitor" → Highlight differentiation
- "Not the right time" → Ask when would be
```

#### Sales Metrics & KPIs
```markdown
## セールスKPI

### Activity Metrics
- Outbound emails: 50/day
- Outbound calls: 20/day
- Demos scheduled: 10/week
- Demos completed: 8/week

### Conversion Metrics
- Lead → Demo: 20%
- Demo → Trial: 80%
- Trial → Paid: 10%
- Overall conversion: 1.6%

### Revenue Metrics
- Average deal size: ¥240,000/year
- Quota: ¥12M ARR/year per rep
- Close rate: 25%
- Sales cycle: 21 days (average)

### Target: ¥24M ARR (Year 1)
- Customers: 100 paying customers
- Average ACV: ¥240,000
- Team: 2 sales reps
```

---

### Step 3: CRM Management (かんりるん)

**Agent**: CRMAgent

**Customer Lifecycle Management**:

#### CRM Setup
```markdown
## CRM構築

### Platform: HubSpot / Salesforce / Pipedrive

### Data Structure
**Company Object**:
- Company name
- Industry
- Company size
- Annual revenue
- Tech stack
- Website

**Contact Object**:
- Name, email, phone
- Job title, role
- LinkedIn profile
- Last contacted
- Engagement score

**Deal Object**:
- Deal name
- Amount (ARR)
- Stage
- Close date (expected)
- Probability
- Products

**Activity Object**:
- Emails sent/opened
- Calls made
- Meetings scheduled
- Demo completed
- Proposal sent
```

#### Pipeline Stages
```markdown
## セールスパイプライン

### Stage 1: Lead (100%)
- MQL (Marketing Qualified Lead)
- SQLready to talk
- Action: Assign to rep

### Stage 2: Contact Made (80%)
- First call/email
- Discovery scheduled
- Action: Send meeting invite

### Stage 3: Qualification (60%)
- BANT completed
- Budget confirmed
- Action: Schedule demo

### Stage 4: Demo (40%)
- Demo completed
- Technical fit confirmed
- Action: Send proposal

### Stage 5: Proposal (25%)
- Pricing sent
- Terms discussed
- Action: Handle objections

### Stage 6: Negotiation (15%)
- Contract review
- Legal/procurement involved
- Action: Address concerns

### Stage 7: Closed Won (100%) ✅
- Contract signed
- Payment received
- Action: Customer onboarding

### Stage 8: Closed Lost (0%) ❌
- Lost to competitor
- No budget
- Not a fit
- Action: Log reason, nurture
```

#### Customer Health Score
```markdown
## 顧客健全性スコア (0-100)

### Usage Metrics (40 pts)
- Daily active users: 20 pts
- Features used: 10 pts
- API calls volume: 10 pts

### Engagement Metrics (30 pts)
- Support tickets (low): 10 pts
- Product feedback: 10 pts
- NPS score: 10 pts

### Business Metrics (30 pts)
- On-time payments: 15 pts
- Contract renewal: 15 pts

### Health Status:
- 80-100: 🟢 Healthy (upsell opportunity)
- 60-79: 🟡 At risk (check-in needed)
- 40-59: 🟠 Unhealthy (intervention required)
- 0-39: 🔴 Critical (churn imminent)
```

#### Churn Prevention
```markdown
## チャーン防止戦略

### Early Warning Signals
1. **Usage drop**: 50% decrease in 30 days
2. **Support escalation**: Multiple unresolved tickets
3. **Executive change**: New CTO/Engineering Manager
4. **Payment issues**: Late payments, declined cards
5. **Competitor interest**: Researching alternatives

### Intervention Playbook
**🟡 At Risk**:
- Action: CSM check-in call
- Offer: Free training session
- Timeline: Within 7 days

**🟠 Unhealthy**:
- Action: Executive escalation call
- Offer: Custom solutions, discount
- Timeline: Within 3 days

**🔴 Critical**:
- Action: CEO/Founder involvement
- Offer: Full audit, extended trial
- Timeline: Immediate (24 hours)

### Win-back Campaign (Churned customers)
- Email sequence (3 emails, 30 days)
- "What did we miss?" survey
- Special comeback offer: 3 months free
```

---

## Customer Success Framework

### Onboarding (First 90 Days)
```markdown
## オンボーディング

### Week 1: Setup & Activation
- Day 1: Welcome email + credentials
- Day 2: Installation guide
- Day 3: First review completed
- Day 7: Check-in call (15 min)

**Success Metric**: First successful review within 3 days

### Week 2-4: Adoption
- Week 2: Team training (30 min)
- Week 3: Advanced features demo
- Week 4: Integration setup (CI/CD)

**Success Metric**: 80% team adoption

### Month 2-3: Expansion
- Month 2: Quarterly business review
- Month 3: Upsell discussion

**Success Metric**: 1 expansion opportunity identified
```

### Customer LTV Optimization
```markdown
## LTV最大化戦略

### LTV Calculation
```
LTV = (Average Revenue per Customer × Customer Lifetime) - CAC

Example:
- ARPU: ¥240,000/year
- Average lifetime: 5 years
- Gross margin: 80%
- CAC: ¥100,000

LTV = (¥240,000 × 5 × 0.8) - ¥100,000 = ¥860,000
```

### Increase LTV Tactics
1. **Reduce Churn**:
   - Target: 5% → 3% monthly
   - Impact: +40% LTV

2. **Increase ARPU**:
   - Upsell rate: 20%/year
   - Add-ons: +¥5,000/month
   - Impact: +25% LTV

3. **Expand Accounts**:
   - Multi-team deployment
   - Enterprise upgrade
   - Impact: +50% LTV

### Net Revenue Retention
```
NRR = (Starting MRR + Expansion - Churn) / Starting MRR

Target NRR: 110%+
- Starting MRR: ¥10M
- Expansion: +¥2M (upsells)
- Churn: -¥1M (5%)
- NRR = (¥10M + ¥2M - ¥1M) / ¥10M = 110%
```
```

---

## Output Deliverables

```
docs/sales-crm/
├── funnel-design/
│   ├── funnel-stages.md
│   ├── conversion-tactics.md
│   └── metrics-dashboard.md
├── sales-process/
│   ├── lead-qualification.md
│   ├── demo-script.md
│   ├── objection-handling.md
│   └── sales-playbook.md
├── crm-setup/
│   ├── data-model.md
│   ├── pipeline-stages.md
│   ├── health-score.md
│   └── automation-rules.md
└── customer-success/
    ├── onboarding-plan.md
    ├── churn-prevention.md
    └── ltv-optimization.md
```

## Success Criteria

### Funnel Design
- ✅ Complete funnel mapped (5 stages)
- ✅ Conversion rates defined for each stage
- ✅ Tactics documented for optimization
- ✅ Metrics dashboard created

### Sales Process
- ✅ Lead scoring model implemented
- ✅ Sales playbook documented
- ✅ Demo script refined
- ✅ KPIs tracked

### CRM Management
- ✅ CRM platform configured
- ✅ Customer health scoring active
- ✅ Churn prevention playbook ready
- ✅ Automation rules set up

## Key Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Trial → Paid conversion | 10% | - | Track |
| Churn rate (monthly) | < 5% | - | Track |
| Customer LTV | ¥1.4M | - | Calculate |
| CAC payback | 6 months | - | Optimize |
| NRR | 110%+ | - | Grow |

## Related Skills

- **Business Strategy**: Aligns sales with business goals
- **Content Marketing**: Generates leads
- **Growth Analytics**: Tracks sales metrics

## Related Files

- **Agent Specs**: `.codex/agents/specs/business/{sales,crm,funnel-design}-agent.md`
- **Output**: `docs/sales-crm/`
