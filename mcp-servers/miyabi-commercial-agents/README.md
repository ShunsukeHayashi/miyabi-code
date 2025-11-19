# Miyabi Commercial Business Agents

**Enterprise-Grade AI Business Automation**
**Version**: 1.0.0
**License**: Proprietary

---

## 🎯 Overview

Miyabi Commercial Agents is an all-in-one MCP (Model Context Protocol) package that provides **6 specialized AI business agents** for comprehensive business automation, from social media strategy to customer relationship management.

### Key Benefits

- ✅ **Complete Business Coverage**: 6 agents covering all aspects of digital business
- ✅ **Proprietary Algorithms**: Industry-leading optimization techniques (protected by binary compilation)
- ✅ **Tier-Based Licensing**: Flexible pricing from STARTER to ENTERPRISE
- ✅ **One-Click Installation**: Simple `.mcpb` extension file
- ✅ **Production-Ready**: Built with security, performance, and reliability in mind

---

## 📦 The 6 Commercial Agents

### 1. つぶやくん (Tsubuyakun) - SNS Strategy Agent 📱

**All Tiers**

Generate platform-specific social media strategies with:
- Content pillars and posting schedules
- Growth projections (1-month, 3-month, 6-month)
- Engagement tactics and recommended tools
- Platform optimization (Twitter, Instagram, YouTube, TikTok, LinkedIn)

**Tool**: `tsubuyakun_generate_sns_strategy`

---

### 2. 書くちゃん (Kakuchan) - Content Creation Agent ✍️

**All Tiers**

Create high-quality content across multiple formats:
- Blog posts, emails, social media, video scripts, whitepapers
- SEO optimization and keyword targeting
- Readability scoring and improvement suggestions
- Tone adaptation (professional, casual, technical, friendly)

**Tool**: `kakuchan_generate_content`

---

### 3. 動画くん (Dougakun) - YouTube Optimization Agent 🎥

**PRO+ Tiers**

Optimize your YouTube channel for growth:
- 12-week content calendar
- Channel SEO and thumbnail guidelines
- Monetization roadmap (AdSense, sponsorships, memberships)
- Growth tactics based on subscriber count
- Analytics KPIs tracking

**Tool**: `dougakun_optimize_youtube`

---

### 4. 広める (Hiromeru) - Marketing Automation Agent 📢

**PRO+ Tiers**

Create comprehensive marketing campaigns:
- Campaign strategy and positioning
- Multi-channel budget allocation
- Timeline with phased approach
- ROI projections and payback period
- Tactical execution plans

**Tool**: `hiromeru_create_marketing_plan`

---

### 5. 数える (Kazoeru) - Analytics & Data Intelligence Agent 📊

**PRO+ Tiers**

Advanced data analysis and insights:
- Key metrics analysis with trend detection
- Actionable insights by impact and confidence
- Prioritized recommendations (effort vs. impact)
- Predictive analytics with confidence intervals
- PDCA cycle analysis

**Tool**: `kazoeru_analyze_data`

---

### 6. 支える (Sasaeru) - CRM & Customer Success Agent 🤝

**ENTERPRISE Tier**

Customer relationship management and optimization:
- Customer segmentation with LTV analysis
- Engagement plans tailored by customer stage
- Retention tactics with expected impact
- Upsell opportunity identification
- Health scoring and churn prediction

**Tool**: `sasaeru_optimize_crm`

---

## 💰 Pricing & Tiers

### STARTER Tier - $49/month ($490/year)

**Included Agents**:
- つぶやくん (SNS Strategy)
- 書くちゃん (Content Creation)

**Best for**: Small businesses, freelancers, content creators

---

### PRO Tier - $149/month ($1,490/year)

**Included Agents**:
- All STARTER agents
- 動画くん (YouTube Optimization)
- 広める (Marketing Automation)
- 数える (Analytics)

**Best for**: Growing businesses, marketing teams, agencies

---

### ENTERPRISE Tier - $499/month ($4,990/year)

**Included Agents**:
- All PRO agents
- 支える (CRM)

**Additional Benefits**:
- Custom algorithm tuning
- API access for integration
- Dedicated support team
- SLA guarantee (99.9% uptime)

**Best for**: Large enterprises, B2B companies, SaaS platforms

---

## 🚀 Installation

### Option 1: Claude Desktop Extension (.mcpb)

**Recommended** - One-click installation

1. Download `miyabi-commercial-agents-1.0.0.mcpb`
2. Drag and drop into Claude Desktop Settings
3. Enter your license key
4. Done! ✅

### Option 2: Manual Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Add to Claude Desktop config**:

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "miyabi-commercial": {
         "command": "node",
         "args": [
           "/path/to/miyabi-commercial-agents/dist/index.js"
         ],
         "env": {
           "MIYABI_LICENSE_KEY": "MIYABI-COMMERCIAL-PRO-XXXXXXXXXXXXXXXXXXXX",
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

---

## 🔑 License Key Format

```
MIYABI-COMMERCIAL-{TIER}-{HASH}
```

**Examples**:
- `MIYABI-COMMERCIAL-STARTER-A1B2C3D4E5F6G7H8I9J0`
- `MIYABI-COMMERCIAL-PRO-X1Y2Z3A4B5C6D7E8F9G0`
- `MIYABI-COMMERCIAL-ENTERPRISE-K1L2M3N4O5P6Q7R8S9T0`

**To obtain a license**:
- Website: https://miyabi.tech/commercial-agents
- Email: sales@miyabi.tech
- Phone: +81-3-XXXX-XXXX

---

## 📖 Usage Examples

### Example 1: Generate SNS Strategy

```typescript
// Call tsubuyakun_generate_sns_strategy tool
{
  "platform": "instagram",
  "audience": "Young professionals interested in productivity and self-improvement",
  "goals": ["increase engagement", "grow followers", "drive website traffic"],
  "current_followers": 5000,
  "budget": 500
}

// Returns:
{
  "platform": "instagram",
  "content_pillars": ["Educational Content", "Interactive Content", "Community Building"],
  "posting_schedule": [/* 7-day schedule */],
  "engagement_tactics": [/* 5 tactics */],
  "growth_projections": {
    "month_1": 6500,
    "month_3": 8500,
    "month_6": 12000,
    "engagement_rate": "18.5%"
  },
  "recommended_tools": ["Planoly", "Linktree", "Unfold"]
}
```

### Example 2: Create Marketing Campaign

```typescript
// Call hiromeru_create_marketing_plan tool (PRO+)
{
  "product": "SaaS Productivity Tool",
  "target_market": "B2B SMEs in tech industry",
  "budget": 50000,
  "duration_months": 6,
  "objectives": ["brand awareness", "lead generation", "product trials"]
}

// Returns comprehensive marketing plan with:
// - Campaign strategy
// - Channel mix ($15k Google Ads, $12.5k LinkedIn, etc.)
// - 3-phase timeline
// - ROI projection (187% ROI expected)
// - 8 tactical recommendations
```

### Example 3: Customer Health Scoring

```typescript
// Call sasaeru_optimize_crm tool (ENTERPRISE)
{
  "company_name": "Acme Corp",
  "industry": "Software",
  "size": "enterprise",
  "stage": "customer"
}

// Returns:
{
  "customer_segmentation": [/* 4 segments */],
  "engagement_plan": [/* Monthly activities */],
  "retention_tactics": [/* 4 tactics with impact */],
  "upsell_opportunities": [/* 3 opportunities */],
  "health_score": {
    "overall_score": 80,
    "churn_risk": "low"
  }
}
```

---

## 🔒 Security & Privacy

### Data Protection

- ✅ **No data storage**: All processing happens locally
- ✅ **License validation**: Secure machine-bound licensing
- ✅ **Binary compilation**: Source code fully protected
- ✅ **Anti-debugging**: Production builds include tamper detection

### License Enforcement

- Online validation via secure API
- Offline fallback validation
- Machine ID binding (prevents unauthorized sharing)
- Tier-based feature restrictions

### Compliance

- GDPR compliant (no PII collection)
- SOC 2 Type II certified infrastructure
- Enterprise data residency options available

---

## 📊 Technical Specifications

### System Requirements

- **Node.js**: 18.0.0 or higher
- **Claude Desktop**: 1.0.0 or higher
- **RAM**: 512MB minimum
- **Disk**: 200MB installation size

### Performance

- **Tool execution time**: <100ms (most tools)
- **Concurrent requests**: Up to 10 per second
- **Uptime SLA**: 99.9% (Enterprise tier)

### Supported Platforms

- macOS (x64, ARM64)
- Windows (x64)
- Linux (x64)

---

## 🆘 Support

### Documentation

- **Full Documentation**: https://docs.miyabi.tech/commercial-agents
- **API Reference**: https://docs.miyabi.tech/api
- **Video Tutorials**: https://miyabi.tech/tutorials

### Support Channels

**STARTER Tier**:
- Email support (24-48h response)
- Community forum access

**PRO Tier**:
- Priority email support (12h response)
- Live chat support (business hours)

**ENTERPRISE Tier**:
- Dedicated support team
- Phone support (24/7)
- Slack Connect channel
- Quarterly business reviews

---

## 🔄 Updates & Changelog

### v1.0.0 (2025-11-19)

**Initial Release**:
- 6 commercial agents implemented
- Tier-based licensing system
- .mcpb extension support
- Production-ready security features

---

## 📜 Legal

### Terms of Service

By using Miyabi Commercial Agents, you agree to our [Terms of Service](https://miyabi.tech/terms).

### Privacy Policy

Read our [Privacy Policy](https://miyabi.tech/privacy) for details on data handling.

### Copyright

© 2025 Miyabi Technologies. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or reverse engineering is strictly prohibited and may result in legal action.

---

## 📞 Contact

**Sales Inquiries**: sales@miyabi.tech
**Technical Support**: support@miyabi.tech
**General Inquiries**: info@miyabi.tech

**Website**: https://miyabi.tech
**GitHub** (Public): https://github.com/miyabi-tech

---

**Built with ❤️ by Miyabi Technologies**
