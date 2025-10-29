---
name: Market Research and Competitive Analysis
description: Comprehensive market research including competitor analysis (20+ companies), market trend identification, TAM/SAM/SOM calculation, and customer needs assessment. Use when entering new markets, analyzing competition, or validating business ideas.
allowed-tools: WebFetch, Read, Write, Bash
---

# Market Research and Competitive Analysis

Complete market research toolkit powered by MarketResearchAgent (しらべるん) - analyzing 20+ competitors, market trends, and customer needs.

## When to Use

- User requests "analyze the market"
- User asks "who are our competitors?"
- User wants to "validate this business idea"
- Entering a new market
- Launching new products
- Preparing pitch decks
- Strategic planning and pivots

## Market Research Workflow

### Step 1: Market Definition

**Define Scope**:
```markdown
## 市場定義

### 対象市場
- 業界: AI開発ツール市場
- セグメント: Code review automation
- 地域: グローバル (優先: 北米、日本)
- タイムフレーム: 2024-2028

### 調査目的
1. 市場規模の把握 (TAM/SAM/SOM)
2. 主要競合の特定 (20社以上)
3. 市場トレンドの分析
4. 顧客ニーズの理解
5. 参入障壁の評価
```

---

### Step 2: Market Sizing (TAM/SAM/SOM)

**Calculation Method**:

#### TAM (Total Addressable Market) - 総市場規模
```
TAM = 全世界のソフトウェア開発者数 × 平均単価

計算例:
- 全世界開発者: 27,000,000人
- Code reviewツール需要: 50% = 13,500,000人
- 平均単価: $120/year
- TAM = 13,500,000 × $120 = $1.62B (約¥240B)
```

#### SAM (Serviceable Addressable Market) - 獲得可能市場
```
SAM = TAMのうち、実際にアプローチ可能な市場

計算例:
- ターゲット地域 (北米+日本): 30%
- 企業規模 (10人以上): 40%
- SAM = $1.62B × 30% × 40% = $194M (約¥29B)
```

#### SOM (Serviceable Obtainable Market) - 獲得目標市場
```
SOM = SAMのうち、現実的に獲得できる市場シェア

計算例:
- 市場シェア目標: 5% (Year 3)
- SOM = $194M × 5% = $9.7M (約¥1.5B)

Year 1 Target: 0.5% = $970K (¥145M)
```

**Output**:
```markdown
## 市場規模

| Metric | Value (USD) | Value (JPY) | Notes |
|--------|-------------|-------------|-------|
| TAM | $1.62B | ¥240B | Global market |
| SAM | $194M | ¥29B | Addressable with current resources |
| SOM (Y3) | $9.7M | ¥1.5B | 5% market share |
| SOM (Y1) | $970K | ¥145M | 0.5% market share |
```

---

### Step 3: Competitor Analysis (20+ Companies)

**Research Framework**:

#### Tier 1: Direct Competitors (5-7 companies)
```markdown
### 1. GitHub Copilot
**企業概要**:
- 親会社: Microsoft/GitHub
- 設立: 2021
- 従業員: 部門非公開
- 資金調達: N/A (Microsoft傘下)

**製品・サービス**:
- AI code completion
- Multi-language support
- IDE integration

**価格**:
- Individual: $10/month
- Business: $19/user/month
- Enterprise: Custom

**強み**:
- GitHub統合
- 高品質AI (OpenAI Codex)
- 巨大なユーザーベース

**弱み**:
- Code reviewに特化していない
- セキュリティスキャン限定的
- カスタマイズ性低い

**市場シェア**: 推定35%

**トラフィック**:
- MAU: 1M+
- GitHub stars: N/A (proprietary)
```

#### Tier 2: Indirect Competitors (8-10 companies)
```markdown
### 2. SonarQube (Static Analysis)
### 3. CodeClimate (Code Quality)
### 4. Snyk (Security Scanning)
### 5. DeepSource (Code Review)
### 6. Codacy (Automated Reviews)
### 7. Reviewable (PR Reviews)
### 8. PullRequest (Human Reviews)
### 9. CodeFactor (Quality Analysis)
### 10. Embold (Code Analysis)
```

#### Tier 3: Adjacent Players (5-8 companies)
```markdown
### 11. Tabnine (AI Completion)
### 12. Kite (AI Autocomplete)
### 13. AWS CodeGuru (Amazon)
### 14. JetBrains Qodana (IDE Vendor)
### 15. GitLab Code Quality (CI/CD Platform)
```

**Competitive Matrix**:
```markdown
| Company | Product | Price | AI | Security | Integration | Share |
|---------|---------|-------|-----|----------|-------------|-------|
| GitHub Copilot | Completion | $10-19 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 35% |
| SonarQube | Analysis | Enterprise | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 25% |
| CodeClimate | Quality | $599+ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 15% |
| Snyk | Security | $98+ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 10% |
| **Our Product** | AI Review | $20-100 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Target 5% |
```

---

### Step 4: Market Trend Analysis

**5 Major Trends**:

#### Trend 1: AI-Powered Development Tools
```markdown
**概要**: AI活用が開発ツールの標準機能に

**データ**:
- GitHub Copilot: 1M+ active users (2023)
- AI code completion market: CAGR 42% (2023-2028)
- 開発者の78%がAIツール使用経験あり

**影響**:
- ✅ Opportunity: AI期待値が高い
- ⚠️ Threat: 競争激化

**アクション**:
- 最新AIモデル (GPT-4, Claude) の活用
- AI品質での差別化
```

#### Trend 2: Shift-Left Security
```markdown
**概要**: セキュリティを開発初期段階に組み込み

**データ**:
- DevSecOps市場: $7.5B (2024) → $23.5B (2029)
- 74%の企業がshift-left採用
- セキュリティ脆弱性コスト: 本番で発見は開発時の30倍

**影響**:
- ✅ Opportunity: セキュリティ機能への需要増
- ✅ Opportunity: エンタープライズ市場拡大

**アクション**:
- セキュリティスキャン機能強化
- コンプライアンスレポート提供
```

#### Trend 3: Remote Development Teams
```markdown
**概要**: リモートワーク常態化で非同期レビュー需要増

**データ**:
- リモート開発者: 53% (2024) ← 19% (2019)
- 非同期コミュニケーション重視: 67%
- Code review待ち時間: 平均24時間

**影響**:
- ✅ Opportunity: 自動化ニーズ増
- ✅ Opportunity: グローバル市場拡大

**アクション**:
- 非同期レビューフロー最適化
- タイムゾーン対応
```

#### Trend 4: Platform Consolidation
```markdown
**概要**: 複数ツールを統合プラットフォームに集約

**データ**:
- 開発者使用ツール数: 平均15個
- ツール統合への関心: 82%
- All-in-one platform preference: 71%

**影響**:
- ⚠️ Threat: 大手プラットフォームの優位性
- ✅ Opportunity: API連携での差別化

**アクション**:
- 主要プラットフォーム (GitHub, GitLab, Bitbucket) 統合
- Slack, Teams連携
```

#### Trend 5: Developer Experience (DX) Focus
```markdown
**概要**: 開発者体験が採用の最重要要素に

**データ**:
- DX重視: 89%
- ツール導入理由トップ: "使いやすさ" (74%)
- 複雑なツールの放棄率: 61%

**影響**:
- ✅ Opportunity: UX差別化
- ⚠️ Threat: 学習コスト高いと不採用

**アクション**:
- ワンクリックセットアップ
- インタラクティブチュートリアル
- 優れたドキュメント
```

---

### Step 5: Customer Needs Assessment

**Primary Research Methods**:

#### User Interviews (20-30 people)
```markdown
## インタビュー結果

### 回答者プロフィール
- Total: 25人
- Engineering Managers: 10人
- Senior Developers: 10人
- CTOs: 5人

### トップ5ペインポイント
1. **Manual review takes too long** (92%)
   - 平均2-4時間/日
   - 生産的コーディング時間を圧迫

2. **Inconsistent review quality** (84%)
   - レビュアーによって基準が異なる
   - Junior開発者へのフィードバック不足

3. **Security issues slip through** (76%)
   - レビュー時に脆弱性見逃し
   - 本番環境で発見されるケース多発

4. **Context switching overhead** (68%)
   - PRレビューで作業中断
   - フロー状態の喪失

5. **Knowledge silos** (64%)
   - ベストプラクティス共有不足
   - 属人化

### 理想のソリューション
- 自動化率: 80%以上
- レビュー時間: < 5分
- 精度: 95%以上
- 学習機能: チーム固有のルール学習
```

#### Surveys (100-200 responses)
```markdown
## サーベイ結果 (n=150)

### 現在のCode Reviewプロセス
- Manual only: 42%
- Manual + Linters: 48%
- Automated tools: 10%

### 満足度
- Very satisfied: 8%
- Satisfied: 34%
- Neutral: 28%
- Dissatisfied: 22%
- Very dissatisfied: 8%

### 支払い意思
- $0: 15%
- $1-10/user/month: 35%
- $11-25/user/month: 32%
- $26-50/user/month: 13%
- $50+/user/month: 5%

### 最重要機能
1. Security scanning (87%)
2. Code quality checks (82%)
3. Best practice suggestions (79%)
4. Performance analysis (71%)
5. Custom rules (68%)
```

---

### Step 6: Competitive Positioning

**Positioning Statement**:
```markdown
## ポジショニング

For: [Engineering teams at tech companies (10-200 developers)]
Who: [Struggle with slow, inconsistent code reviews]
Our product: [AI-powered code review platform]
Is a: [Development tool]
That: [Provides instant, comprehensive, and consistent code reviews with security scanning]
Unlike: [GitHub Copilot (completion-focused) or SonarQube (static analysis only)]
We: [Combine AI-powered contextual review with security scanning and team learning]
```

**Differentiation Matrix**:
```markdown
| Feature | Us | GitHub Copilot | SonarQube | CodeClimate |
|---------|-----|----------------|-----------|-------------|
| AI-Powered Review | ✅ | ❌ | ❌ | ❌ |
| Security Scanning | ✅ | ⚠️ | ✅ | ⚠️ |
| Contextual Feedback | ✅ | ❌ | ❌ | ❌ |
| Team Learning | ✅ | ❌ | ❌ | ❌ |
| Real-time | ✅ | ✅ | ❌ | ❌ |
| Price | $$ | $ | $$$ | $$ |
```

---

## Output Deliverables

```
docs/market-research/
├── 001-market-sizing.md          # TAM/SAM/SOM calculations
├── 002-competitor-analysis.md     # 20+ competitor profiles
├── 003-competitive-matrix.xlsx    # Comparison spreadsheet
├── 004-market-trends.md          # 5 major trends
├── 005-customer-needs.md         # Interview/survey insights
├── 006-positioning-statement.md  # Competitive positioning
└── FINAL-MARKET-RESEARCH-REPORT.md  # Executive summary
```

## Success Criteria

- ✅ TAM/SAM/SOM calculated with data sources
- ✅ 20+ competitors analyzed (Tier 1, 2, 3)
- ✅ 5+ market trends identified with impact assessment
- ✅ Primary research completed (20+ interviews or 100+ surveys)
- ✅ Clear competitive positioning defined
- ✅ Actionable insights for product/marketing strategy

## Execution Time

- **Market Sizing**: 1-2 hours
- **Competitor Analysis (20+)**: 3-4 hours
- **Trend Analysis**: 1-2 hours
- **Customer Research**: 2-3 weeks (ongoing)
- **Report Generation**: 1-2 hours

**Total Research Time**: 4-5 weeks (including primary research)
**Report Generation**: 2-3 hours (with data ready)

## Related Skills

- **Business Strategy**: Uses market research for business plan
- **Content Marketing**: Uses insights for content strategy
- **Sales & CRM**: Uses positioning for sales messaging

## Related Files

- **Agent Spec**: `.codex/agents/specs/business/market-research-agent.md`
- **Agent Prompt**: `.codex/agents/prompts/business/market-research-agent-prompt.md`
- **Output**: `docs/market-research/`
