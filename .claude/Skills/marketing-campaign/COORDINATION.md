# Marketing Campaign - Coordination Integration

**Skill**: marketing-campaign
**Category**: Business
**Dependencies**: gemini-slide-generator
**Dependents**: sns-content-creation, youtube-optimization

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| gemini-slide-generator | Deck ready | Integrate into campaign |
| sns-content-creation | Content calendar needed | Create content plan |
| youtube-optimization | Video strategy needed | Plan video content |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| gemini-slide-generator | Visuals needed | `MARKETING_VISUAL_REQ: {brief}` |
| sns-content-creation | Content brief ready | `MARKETING_CONTENT: {plan}` |
| youtube-optimization | Video brief ready | `MARKETING_VIDEO: {brief}` |

---

## Resource Sharing

### Produces
```yaml
- type: campaign_plan
  data:
    objectives: ["brand_awareness", "lead_generation"]
    budget: 1000000
    duration_months: 3
    funnel_stages: ["TOFU", "MOFU", "BOFU"]
- type: content_brief
  data:
    topic: "Product Launch"
    target_audience: "Developers"
    key_messages: [...]
```

### Consumes
```yaml
- type: slide_deck
  from: gemini-slide-generator
- type: engagement_data
  from: sns-content-creation
```

---

## Communication Protocol

### Status Report Format
```
[MARKETING] {STATUS}: {campaign_name} - {details}
```

### Examples
```bash
# Report to coordination layer
tmux send-keys -t %1 '[MARKETING] LAUNCHED: Q1 Product Campaign - Active' && sleep 0.5 && tmux send-keys -t %1 Enter

# Request visuals
tmux send-keys -t %1 '[MARKETING->GEMINI] VISUAL_REQ: pitch deck for investors' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Full Campaign Launch
```
marketing-campaign [START: Campaign planning]
    |
    +---> Define objectives (SMART)
    +---> Create target personas
    +---> Design funnel
    |
    v
gemini-slide-generator [REQUEST: pitch deck]
    |
    v
[SIGNAL: GEMINI_DECK]
    |
    v
marketing-campaign [Integrate deck]
    |
    +---> sns-content-creation [SIGNAL: MARKETING_CONTENT]
    +---> youtube-optimization [SIGNAL: MARKETING_VIDEO]
    |
    v
[Campaign active across all channels]
```

### Sequence: Content Calendar
```
marketing-campaign [CREATE: monthly calendar]
    |
    +---> Week 1: Pillar content
    +---> Week 2: Distribution
    +---> Week 3: Case studies
    +---> Week 4: Recap
    |
    v
sns-content-creation [Execute calendar]
    |
    v
[SIGNAL: MARKETING_METRICS]
    |
    v
marketing-campaign [Optimize next month]
```

---

## Momentum Multiplier

### Optimization 1: Multi-Channel Cascade
```
1 campaign brief
    -> 1 pitch deck (gemini)
    -> 10 social posts (sns)
    -> 3 video scripts (youtube)
    -> 5 email sequences
    -> 20+ content pieces total
```

### Optimization 2: AIDA Flow Automation
```
Awareness (TOFU):
    gemini-slide-generator -> Educational infographics
    sns-content-creation -> Social awareness posts

Interest (MOFU):
    gemini-slide-generator -> Case study visuals
    youtube-optimization -> Tutorial videos

Decision (BOFU):
    gemini-slide-generator -> Product comparison
    sns-content-creation -> Testimonials
```

### Optimization 3: A/B Content Generation
```typescript
// Generate multiple versions
const variations = await Promise.all([
    generateVariation("professional"),
    generateVariation("casual"),
    generateVariation("technical")
]);
// Test all, keep winner
```

---

## KPI Integration

### Metrics to Track
```yaml
acquisition:
  - CAC: Cost Per Acquisition
  - CPC: Cost Per Click
  - CPL: Cost Per Lead

engagement:
  - CTR: Click-Through Rate
  - Bounce Rate
  - Time on Site

conversion:
  - Conversion Rate
  - MQL to SQL Rate
  - Trial to Paid Rate
```

### Feedback to Skills
```
[Analytics data]
    |
    v
marketing-campaign [Analyze]
    |
    +---> gemini-slide-generator [Adjust style]
    +---> sns-content-creation [Adjust timing]
    +---> youtube-optimization [Adjust thumbnails]
```

---

## Health Check Integration

```bash
# Monitor campaign health
check_marketing_health() {
    # Check UTM tracking
    # Check ad spend vs budget
    # Check conversion rates
    echo "[MARKETING] STATUS: Campaign metrics nominal"
}
```

---

## Perpetual Activation

### Auto-triggers
- Monthly: Generate next month content calendar
- Weekly: Review performance metrics
- Daily: Optimize ad spend
- On milestone: Generate progress report

### Feedback Loop
```
marketing-campaign --> sns-content-creation (engagement data)
                          |
                          v
                      [Analyze what works]
                          |
                          v
                      marketing-campaign (refine strategy)
```
