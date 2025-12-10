---
name: marketing-campaign
description: Create comprehensive marketing campaigns using Miyabi agents (ひろめるん, かぞえるん) and Gemini AI for presentations and visual assets. Use when planning marketing strategies, funnels, ad campaigns, pitch decks, or growth initiatives. Triggers include "marketing plan", "campaign strategy", "funnel design", "growth marketing", "pitch deck", "ad optimization", or when creating comprehensive marketing plans with visual materials.
---

# Marketing Campaign

Design and execute data-driven marketing campaigns with AI optimization and Gemini-powered presentations.

## Campaign Framework

### AIDA Model
```
Attention → Interest → Desire → Action
   ↓          ↓          ↓         ↓
  Ads     Content    Social    Landing
         Marketing   Proof      Page
```

### Funnel Stages
```
TOFU (Top)    - Awareness    → Blog, Social, Ads
MOFU (Middle) - Consideration → Webinars, Case Studies
BOFU (Bottom) - Decision      → Demos, Free Trials, Pricing
```

## Campaign Planning Template

### 1. Objectives (SMART)
```yaml
objective:
  specific: "Increase product signups"
  measurable: "500 new signups"
  achievable: "Based on current traffic"
  relevant: "Supports Q1 revenue goal"
  time_bound: "Within 30 days"
```

### 2. Target Audience
```yaml
persona:
  name: "Tech Taro"
  demographics:
    age: 25-35
    role: "Software Engineer"
    company_size: "10-100"
  pain_points:
    - "Manual deployment takes too long"
    - "Lack of automation tools"
  goals:
    - "Ship faster"
    - "Reduce errors"
  channels:
    - Twitter/X
    - Tech blogs
    - Developer communities
```

### 3. Budget Allocation
```
Total Budget: ¥1,000,000

Distribution:
- Paid Ads (40%): ¥400,000
- Content (30%): ¥300,000
- Tools/Software (15%): ¥150,000
- Testing/Contingency (15%): ¥150,000
```

## Gemini Visual Integration

### Generate Pitch Deck
```typescript
// Create complete presentation
const deck = await generateDeckStructure(
  "Miyabi DevOps Platform - Investor Pitch for Series A"
);

// Generate visuals for each slide
for (const slide of deck.slides) {
  slide.generatedImage = await generateSlideImage(
    slide.title,
    slide.narrative,
    slide.annotation
  );
}

// Output: Complete pitch deck with hand-drawn infographics
```

### Campaign Visual Assets
| Asset Type | Use Case | Gemini Config |
|------------|----------|---------------|
| Pitch Deck | Investor meetings | BLUEPRINT theme |
| Ad Creatives | Paid campaigns | SKETCH theme |
| Infographics | Content marketing | Hand-drawn style |
| Funnel Diagram | Internal strategy | BLUEPRINT theme |

### Visual Campaign Timeline
```typescript
// Generate visual campaign timeline
const timelineSlide = await generateSlideImage(
  "Q1 2025 Campaign Timeline",
  "Phase 1: Awareness (Jan), Phase 2: Engagement (Feb), Phase 3: Conversion (Mar)",
  "3ヶ月のキャンペーン戦略"
);
```

## Ad Campaign Setup

### Google Ads Structure
```
Campaign: [Product] - [Goal]
├── Ad Group 1: [Keyword Theme]
│   ├── Keywords: [exact], [phrase], +broad+modifier
│   ├── Ad 1: [Headline variations]
│   └── Ad 2: [Different angle]
├── Ad Group 2: [Keyword Theme]
└── ...
```

### Copy Framework
```
Headline 1: [Keyword] + [Benefit]
Headline 2: [Social Proof] or [Urgency]
Headline 3: [CTA]
Description: [Problem] → [Solution] → [CTA]
```

## Content Calendar with Visuals

### Monthly Plan
```
Week 1: Pillar content + Gemini infographic
Week 2: Distribution + visual snippets
Week 3: User-generated / Case study + diagram
Week 4: Recap + performance visual
```

### Content Mix
```
Educational (with visuals): 40%
Promotional: 20%
Engagement: 20%
Curated: 10%
Behind-scenes: 10%
```

## MCP Tool Integration

### Create Marketing Plan with Deck
```javascript
// Step 1: Create marketing plan
const plan = await hiromeru_create_marketing_plan({
    product: "Miyabi DevOps Platform",
    target_market: "日本のスタートアップ企業",
    budget: 1000000,
    duration_months: 3,
    objectives: ["brand_awareness", "lead_generation", "conversions"]
});

// Step 2: Generate pitch deck
const deck = await gemini_generate_deck({
    topic: `${plan.product} Marketing Strategy Presentation`,
    theme: "BLUEPRINT"
});

// Step 3: Generate slide images
for (const slide of deck.slides) {
    const image = await gemini_generate_slide_image({
        title: slide.title,
        narrative: slide.narrative,
        annotation: slide.annotation
    });
    slide.image = image;
}
```

### Analyze with Visual Report
```javascript
// Get analytics data
const data = await kazoeru_analyze_data({
    data_source: "google_analytics",
    metrics: ["sessions", "conversions", "revenue"],
    time_period: "last_30_days"
});

// Generate visual report
const reportVisual = await gemini_generate_slide_image({
    title: "Performance Dashboard",
    narrative: `Sessions: ${data.sessions}, Conversions: ${data.conversions}`,
    annotation: "月次パフォーマンスレポート"
});
```

## Presentation Themes

### BLUEPRINT (Technical/Business)
- Clean, structured layouts
- Blue/gray color palette
- Architecture diagrams
- Data visualizations

### SKETCH (Creative/Pitch)
- Hand-drawn feel
- Warm, approachable colors
- Storytelling flow
- Emotional connection

## Analytics & Tracking

### UTM Parameters
```
?utm_source=twitter
&utm_medium=social
&utm_campaign=spring_launch
&utm_content=video_ad_1
```

### Key Metrics
```yaml
acquisition:
  - CAC (Customer Acquisition Cost)
  - CPC (Cost Per Click)
  - CPL (Cost Per Lead)
  
engagement:
  - CTR (Click-Through Rate)
  - Bounce Rate
  - Time on Site
  
conversion:
  - Conversion Rate
  - MQL to SQL Rate
  - Trial to Paid Rate
```

## Optimization Checklist

### Weekly
- [ ] Review ad performance
- [ ] Update visual creatives
- [ ] Pause underperforming ads
- [ ] Scale winning ads

### Monthly
- [ ] Regenerate pitch deck with new data
- [ ] Create fresh infographics
- [ ] Analyze funnel conversion rates
- [ ] Review content performance

### Quarterly
- [ ] Full funnel audit with visual report
- [ ] Update campaign deck
- [ ] Competitor analysis
- [ ] Strategy adjustment

## Best Practices

1. Use Gemini BLUEPRINT for investor/board presentations
2. Use Gemini SKETCH for customer-facing content
3. Start with clear, measurable objectives
4. Test small, scale winners
5. Track everything with proper attribution
6. Regenerate visuals monthly for freshness
