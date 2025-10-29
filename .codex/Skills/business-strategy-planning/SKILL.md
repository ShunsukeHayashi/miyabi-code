---
name: Business Strategy and Planning
description: Comprehensive business strategy formulation including business plan creation, persona development, product concept design, and go-to-market strategy. Use when starting a business, launching products, or defining business strategy.
allowed-tools: Read, Write, WebFetch, Bash
---

# Business Strategy and Planning

Complete business strategy toolkit powered by Miyabi's 4 Strategy-focused Business Agents: AIEntrepreneur, ProductConcept, Persona, and SelfAnalysis.

## When to Use

- User requests "create a business plan"
- User asks "define our product strategy"
- User wants to "identify target customers"
- Starting a new business or product
- Pivoting business model
- Preparing for fundraising
- Strategic planning sessions

## Business Strategy Workflow

### Step 1: Self-Analysis (Foundation)

**Agent**: SelfAnalysisAgent (じぶんるん)

**Purpose**: Analyze your skills, experience, and assets to identify business opportunities.

**Process**:
```markdown
## キャリア・スキル分析

### 過去の経験
- 職歴: 10年分
- プロジェクト: 成功事例
- スキル: 技術・ビジネス

### 強みと弱み
- 強み: コアコンピタンス
- 弱み: 改善領域
- 機会: 市場チャンス
- 脅威: リスク要因

### ビジネスフィット
- 適合度: High/Medium/Low
- 理由: 根拠
- アクション: 次のステップ
```

**Output**:
- `self-analysis-report.md` - キャリア棚卸し、SWOT分析
- `business-fit-assessment.md` - ビジネス適合度評価
- `skill-matrix.md` - スキルマトリクス

**Example**:
```
User: "自分に合ったビジネスを見つけたい"

→ SelfAnalysisAgent analyzes:
- Career: 10 years in software development
- Skills: Rust, TypeScript, AI/ML
- Strengths: Technical architecture, automation
- Weaknesses: Sales, marketing
- Opportunities: AI developer tools market
- Recommendation: B2B SaaS for developers
```

---

### Step 2: Product Concept Design

**Agent**: ProductConceptAgent (つくるそん)

**Purpose**: Define clear product concept with USP, revenue model, and business model canvas.

**Process**:
```markdown
## プロダクトコンセプト

### USP (Unique Selling Proposition)
- コアバリュー: 顧客に提供する価値
- 差別化ポイント: 競合との違い
- ターゲット顧客: 誰のための製品か

### 収益モデル
- プライシング: ¥10,000/月
- 収益源: サブスクリプション、アドオン
- コスト構造: 固定費、変動費
- 損益分岐点: 100ユーザー

### ビジネスモデルキャンバス
1. Customer Segments
2. Value Propositions
3. Channels
4. Customer Relationships
5. Revenue Streams
6. Key Resources
7. Key Activities
8. Key Partnerships
9. Cost Structure
```

**Output**:
- `product-concept.md` - プロダクトコンセプト定義
- `usp-statement.md` - USP声明
- `revenue-model.md` - 収益モデル詳細
- `business-model-canvas.md` - BMC完全版

**Example**:
```
Product: "AI-powered code review tool"

USP: "Catch bugs before they reach production - 10x faster than manual review"

Revenue Model:
- Starter: ¥5,000/month (5 developers)
- Pro: ¥20,000/month (20 developers)
- Enterprise: Custom pricing

BMC:
- Customer Segments: Startups, mid-size tech companies
- Value Prop: Automated code review, security scanning
- Channels: Product Hunt, GitHub Marketplace, Dev communities
- Revenue: Recurring subscription (MRR)
```

---

### Step 3: Persona Development

**Agent**: PersonaAgent (ぺるそん)

**Purpose**: Create detailed customer personas (3-5) with demographics, psychographics, and customer journey.

**Process**:
```markdown
## ペルソナ作成 (3-5人)

### ペルソナ1: "Tech Lead Tom"
**Demographics**:
- 年齢: 35-45歳
- 職業: Engineering Manager
- 年収: ¥10M-15M
- 地域: 東京、大阪、福岡

**Psychographics**:
- 価値観: Code quality, team productivity
- 関心: DevOps, automation, efficiency
- 課題: Manual code reviews take too long
- 目標: Ship features faster without bugs

**Customer Journey**:
1. Awareness: Googles "automated code review"
2. Consideration: Reads reviews, tries free trial
3. Decision: Evaluates ROI, gets approval
4. Purchase: Signs up for Pro plan
5. Retention: Integrates with CI/CD, trains team

**購買行動**:
- 意思決定者: Engineering Manager + CTO
- 予算: ¥20,000-50,000/month
- 購入サイクル: 1-3 months
- 重視する点: Accuracy, ease of integration, support
```

**Output**:
- `persona-001-tech-lead-tom.md`
- `persona-002-startup-founder-sara.md`
- `persona-003-enterprise-architect-alex.md`
- `customer-journey-map.md`

**Metrics**:
- TAM (Total Addressable Market): ¥100B
- SAM (Serviceable Addressable Market): ¥10B
- SOM (Serviceable Obtainable Market): ¥1B

---

### Step 4: Comprehensive Business Plan

**Agent**: AIEntrepreneurAgent (あきんどさん)

**Purpose**: Generate complete 8-phase business plan from market analysis to funding strategy.

**8-Phase Process**:

#### Phase 1: Market Trend Analysis
```markdown
## 市場トレンド分析

対象市場: AI開発ツール市場

### 市場概要
- 市場規模: $5B (2024) → $15B (2028)
- 成長率: CAGR 30%
- 主要プレイヤー: GitHub Copilot, Tabnine, CodeWhisperer

### 主要トレンド
1. AI-assisted coding の普及
2. DevSecOps への関心増加
3. リモート開発チームの拡大

### ビジネスチャンス
- Code review自動化ニーズ増加
- セキュリティへの投資拡大
- 開発者生産性向上への需要
```

#### Phase 2: Competitor Analysis
```markdown
## 競合分析

### 主要競合
1. **GitHub Copilot**
   - 強み: GitHub統合、AI品質
   - 弱み: Code reviewに特化していない
   - 価格: $10/user/month

2. **SonarQube**
   - 強み: 静的解析、実績
   - 弱み: AI活用不十分
   - 価格: Enterprise only

3. **CodeClimate**
   - 強み: 品質メトリクス
   - 弱み: レビューコメント生成なし
   - 価格: $599/month

### 差別化ポイント
- AI-powered contextual code review
- Security vulnerability detection
- Team collaboration features
```

#### Phase 3: Customer Analysis
```markdown
## ターゲット顧客分析

### セグメント
1. スタートアップ (10-50人)
2. 中規模企業 (50-200人)
3. エンタープライズ (200+人)

### ニーズ
- 高速なコードレビュー
- セキュリティ脆弱性検出
- チーム生産性向上
```

#### Phase 4: Value Proposition
```markdown
## 価値提案

### 顧客課題
- Manual code review takes 2-4 hours/day
- Security issues reach production
- Junior developers need guidance

### ソリューション
- AI reviews code in < 1 minute
- 95% vulnerability detection rate
- Educational feedback for all levels

### ベネフィット
- 10x faster code review
- 50% fewer bugs in production
- 30% improvement in code quality
```

#### Phase 5: Revenue Model
```markdown
## 収益モデル

### プライシング
- Starter: ¥5,000/month (5 devs)
- Pro: ¥20,000/month (20 devs)
- Enterprise: ¥100,000/month (unlimited)

### 収益予測 (Year 1)
- Month 1-3: 10 customers → ¥100,000 MRR
- Month 4-6: 50 customers → ¥500,000 MRR
- Month 7-9: 100 customers → ¥1,000,000 MRR
- Month 10-12: 200 customers → ¥2,000,000 MRR

### ARR Target: ¥24,000,000 (Year 1)
```

#### Phase 6: Marketing Strategy
```markdown
## マーケティング戦略

### チャネル
1. **Product Hunt Launch** (Week 1)
2. **GitHub Marketplace** (Week 2)
3. **Dev Community** (Ongoing)
   - DEV.to, Hacker News, Reddit
4. **Content Marketing** (Ongoing)
   - Tech blog, tutorials, case studies

### KPI
- Website visitors: 10,000/month
- Free trial signups: 500/month
- Conversion rate: 10% (50 paid customers)
- CAC (Customer Acquisition Cost): ¥10,000
- LTV (Lifetime Value): ¥120,000 (12 months retention)
```

#### Phase 7: Team Structure
```markdown
## チーム編成

### Phase 1 (Month 1-6): MVP
- CEO/Founder (1)
- CTO/Tech Lead (1)
- Full-stack Engineer (2)
- Designer (0.5 FTE)

### Phase 2 (Month 7-12): Growth
- Sales/Marketing Lead (1)
- Customer Success (1)
- Engineers (2 more)

### Total: 7.5 FTE by Year 1
```

#### Phase 8: Funding Plan
```markdown
## 資金調達計画

### 必要資金: ¥50,000,000

### 使途
- 人件費: ¥30,000,000 (60%)
- 開発費: ¥10,000,000 (20%)
- マーケティング: ¥8,000,000 (16%)
- 運営費: ¥2,000,000 (4%)

### 調達方法
1. **Seed Round**: ¥30,000,000
   - Angel investors
   - Accelerator program

2. **Series A** (Year 2): ¥100,000,000
   - VC funding
   - Valuation: ¥500,000,000

### タイムライン
- Month 1-3: Pitch deck, network with investors
- Month 4-6: Due diligence, term sheets
- Month 7: Close seed round
```

---

## Integration Workflow

### Complete Strategy Development

```bash
# Step 1: Self-Analysis
User: "自分のキャリアを分析して、ビジネスチャンスを見つけたい"
→ SelfAnalysisAgent generates SWOT, skill matrix

# Step 2: Product Concept
User: "AI code review toolのビジネスコンセプトを作成"
→ ProductConceptAgent creates USP, revenue model, BMC

# Step 3: Personas
User: "ターゲット顧客のペルソナを3つ作成"
→ PersonaAgent creates 3 detailed personas

# Step 4: Full Business Plan
User: "完全なビジネスプランを作成"
→ AIEntrepreneurAgent executes 8-phase workflow
→ Output: comprehensive business plan (20,000-40,000 chars)
```

### Output Structure

```
docs/business-strategy/
├── self-analysis/
│   ├── swot-analysis.md
│   ├── skill-matrix.md
│   └── business-fit.md
├── product-concept/
│   ├── usp-statement.md
│   ├── revenue-model.md
│   └── business-model-canvas.md
├── personas/
│   ├── persona-001-tech-lead-tom.md
│   ├── persona-002-startup-founder-sara.md
│   ├── persona-003-enterprise-architect-alex.md
│   └── customer-journey-map.md
└── business-plan/
    ├── 001-market-trend-report.md
    ├── 002-competitor-analysis.md
    ├── 003-customer-analysis.md
    ├── 004-value-proposition.md
    ├── 005-revenue-model.md
    ├── 006-marketing-strategy.md
    ├── 007-team-structure.md
    ├── 008-funding-plan.md
    └── FINAL-BUSINESS-PLAN.md
```

## Success Criteria

### Self-Analysis
- ✅ Comprehensive career review (10+ years)
- ✅ Clear SWOT analysis
- ✅ Business fit assessment with scores
- ✅ Actionable next steps

### Product Concept
- ✅ Clear USP statement
- ✅ Viable revenue model with projections
- ✅ Complete Business Model Canvas (all 9 components)
- ✅ Differentiation from competitors

### Personas
- ✅ 3-5 detailed personas
- ✅ Complete demographics + psychographics
- ✅ Customer journey maps for each
- ✅ TAM/SAM/SOM calculations

### Business Plan
- ✅ All 8 phases completed
- ✅ Data-driven insights (not assumptions)
- ✅ Realistic financial projections
- ✅ Executable action plan

## Agent Character Names

- **じぶんるん** (SelfAnalysisAgent) - 自己分析の専門家
- **つくるそん** (ProductConceptAgent) - プロダクト企画の専門家
- **ぺるそん** (PersonaAgent) - 顧客理解の専門家
- **あきんどさん** (AIEntrepreneurAgent) - ビジネス戦略の統括者

## Execution Time

| Agent | Time | Output Size |
|-------|------|-------------|
| SelfAnalysis | 5-10 min | 3,000-5,000 chars |
| ProductConcept | 5-10 min | 4,000-6,000 chars |
| Persona | 10-15 min | 5,000-8,000 chars |
| AIEntrepreneur | 15-25 min | 20,000-40,000 chars |

**Total**: 35-60 minutes for complete strategy

## Related Skills

- **Market Research**: For competitive analysis
- **Content Marketing**: For go-to-market execution
- **Sales & CRM**: For customer acquisition
- **Growth Analytics**: For KPI tracking

## Related Files

- **Agent Specs**: `.codex/agents/specs/business/ai-entrepreneur-agent.md`
- **Agent Prompts**: `.codex/agents/prompts/business/ai-entrepreneur-agent-prompt.md`
- **Output**: `docs/business-strategy/`
