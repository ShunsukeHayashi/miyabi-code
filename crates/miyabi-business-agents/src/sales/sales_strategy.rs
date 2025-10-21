//! SalesAgent - Sales Strategy & Process Optimization
//!
//! Develops comprehensive sales strategies and process optimization:
//! - Sales funnel design and optimization
//! - Sales process automation and workflows
//! - Sales team structure and hiring
//! - Sales enablement and training
//! - Sales forecasting and pipeline management

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, SalesAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// SalesStrategyAgent develops sales strategies and process optimization plans
pub struct SalesStrategyAgent {
    client: ClaudeClient,
}

impl SalesStrategyAgent {
    /// Create a new SalesStrategyAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the sales strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Sales Strategy Agent specializing in B2B SaaS sales and process optimization.

Your role is to develop comprehensive sales strategies:

**Sales Funnel Design & Optimization**
- Top of Funnel (TOFU): Lead generation, inbound/outbound prospecting
- Middle of Funnel (MOFU): Qualification, discovery calls, product demos
- Bottom of Funnel (BOFU): Proposals, negotiations, closing, contracts
- Conversion rates: MQL→SQL (30%), SQL→Opportunity (50%), Opportunity→Customer (25%)
- Sales cycle length: 30 days (SMB), 90 days (mid-market), 180+ days (enterprise)
- Funnel analytics: Pipeline value, win rate, deal velocity, forecast accuracy

**Sales Process Automation & Workflows**
- CRM setup: Salesforce, HubSpot, Pipedrive (deal stages, custom fields, workflows)
- Lead routing: Round-robin, territory-based, account-based assignment
- Email automation: Sequences, cadences, follow-ups (5-7 touchpoints)
- Meeting scheduling: Calendly, Chili Piper integration
- Proposal automation: PandaDoc, DocuSign e-signatures
- Sales analytics dashboard: Real-time metrics, leaderboards, forecasting

**Sales Team Structure & Hiring**
- SDR (Sales Development Rep): Lead qualification, discovery calls ($60K-$80K base + $20K-$30K variable)
- AE (Account Executive): Full-cycle closing, quota $500K-$1M ARR ($80K-$120K base + $40K-$80K variable)
- CSM (Customer Success Manager): Onboarding, retention, expansion ($70K-$100K base + $20K-$40K variable)
- Sales Manager: Team leadership, coaching, forecasting ($120K-$150K base + $30K-$50K variable)
- Hiring plan: Month 1-3: 1 AE, Month 4-6: +1 SDR, Month 7-12: +1 AE + 1 CSM

**Sales Enablement & Training**
- Product training: Features, use cases, competitive positioning, demo environments
- Sales playbooks: Objection handling, discovery questions, closing techniques
- Battle cards: Competitive comparison (Miyabi vs GitHub Copilot, Cursor, Replit)
- Sales scripts: Cold outreach (email, LinkedIn, phone), demo scripts, closing scripts
- Content library: Case studies, whitepapers, ROI calculators, one-pagers
- Onboarding program: 30-60-90 day ramp plan for new AEs

**Sales Forecasting & Pipeline Management**
- Weekly pipeline review: Deal progression, stalled deals, at-risk opportunities
- Quarterly business review (QBR): Win/loss analysis, quota attainment, trends
- Sales metrics: Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Average Contract Value (ACV), Customer Acquisition Cost (CAC), Sales Accepted Leads (SAL)
- Forecasting methodology: Committed, Best Case, Pipeline (3-category forecast)
- Quota management: Rep quotas, team quotas, ramp quotas for new hires
- Comp plans: Base salary, variable comp (commission %), accelerators, SPIFFs

**Sales Channels & Strategies**
- Inbound sales: Website leads, product-led growth (PLG), free trial conversions
- Outbound sales: Cold email, LinkedIn outreach, phone prospecting (SDR-led)
- Partner sales: Referral programs, resellers, SI partnerships, co-selling
- Channel mix: 40% inbound, 40% outbound, 20% partners (Year 1 target)

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Sales Strategy & Process Optimization Plan",
  "summary": "2-3 paragraph sales overview",
  "recommendations": [
    {
      "title": "Sales initiative (e.g., 'Outbound SDR Program Launch')",
      "description": "Sales process strategy with funnel design, team structure, automation",
      "priority": 1,
      "estimated_cost": 120000,
      "expected_roi": 5.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Monthly Recurring Revenue (MRR)",
      "baseline": 0,
      "target": 50000,
      "unit": "USD",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Sales milestone (e.g., 'First AE Hired & Ramped')",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["1 AE hired", "CRM setup", "Sales playbook"],
        "success_criteria": ["$25K MRR", "10 customers"]
      }
    ]
  },
  "risks": [
    {
      "description": "Sales cycle longer than expected (90→180 days)",
      "severity": 4,
      "probability": 0.5,
      "mitigation": ["Add SDR for top-of-funnel", "PLG freemium tier"]
    }
  ],
  "next_steps": ["Hire first AE", "Set up CRM"]
}

Be strategic, metrics-driven, and process-oriented. Focus on scalable sales systems, not hero selling."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive sales strategy and process optimization plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Sales Funnel Design: TOFU/MOFU/BOFU stages, conversion rates, cycle length
2. Process Automation: CRM setup, lead routing, email sequences, proposal automation
3. Team Structure: SDR/AE/CSM hiring plan, comp plans, quotas
4. Sales Enablement: Product training, playbooks, battle cards, content library
5. Forecasting: Pipeline management, metrics (MRR/ARR/ACV/CAC), quota plans
6. Sales Channels: Inbound, outbound, partner strategies with mix targets

Focus on building a repeatable, scalable sales engine with clear metrics and accountability."#,
            input.industry,
            input.target_market,
            input.budget,
            input.geography.as_deref().unwrap_or("Global"),
            input.timeframe_months.unwrap_or(6),
            input.context.as_deref().unwrap_or("None")
        )
    }

    /// Parse Claude's JSON response into BusinessPlan
    fn parse_response(&self, response: &str) -> Result<BusinessPlan, MiyabiError> {
        let json_str = if response.contains("```json") {
            response
                .split("```json")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else {
            response.trim()
        };

        debug!("Parsing JSON response: {} chars", json_str.len());

        let parsed: serde_json::Value = serde_json::from_str(json_str)?;

        let title = parsed["title"]
            .as_str()
            .unwrap_or("Sales Strategy & Process Optimization Plan")
            .to_string();
        let summary = parsed["summary"].as_str().unwrap_or("").to_string();

        let recommendations = parsed["recommendations"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let kpis = parsed["kpis"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|k| serde_json::from_value(k.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let timeline = if let Some(timeline_obj) = parsed["timeline"].as_object() {
            let milestones = timeline_obj["milestones"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| serde_json::from_value(m.clone()).ok())
                        .collect()
                })
                .unwrap_or_default();

            Timeline {
                start_date: chrono::Utc::now(),
                end_date: chrono::Utc::now() + chrono::Duration::days(365),
                milestones,
            }
        } else {
            Timeline::default()
        };

        let risks = parsed["risks"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let next_steps = parsed["next_steps"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|s| s.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        Ok(BusinessPlan {
            title,
            summary,
            recommendations,
            kpis,
            timeline,
            risks,
            next_steps,
            generated_at: chrono::Utc::now(),
        })
    }
}

#[async_trait]
impl BusinessAgent for SalesStrategyAgent {
    fn agent_type(&self) -> &str {
        "sales-strategy"
    }

    fn description(&self) -> &str {
        "Develops sales strategies and process optimization plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "SalesStrategyAgent: Developing sales strategy for {} in {}",
            input.target_market, input.industry
        );

        let system_prompt = self.create_system_prompt();
        let user_prompt = self.create_user_prompt(input);

        let response = self
            .client
            .generate(&system_prompt, &user_prompt)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claude API failed: {}", e)))?;

        debug!("Received response from Claude: {} chars", response.len());

        let plan = self.parse_response(&response)?;

        info!(
            "Generated sales strategy with {} initiatives, {} KPIs, {} risks",
            plan.recommendations.len(),
            plan.kpis.len(),
            plan.risks.len()
        );

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate sales initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No sales initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 3 {
            warnings.push(
                "Few sales initiatives (expected 4-6 covering funnel, team, automation)"
                    .to_string(),
            );
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add initiatives for inbound, outbound, partner channels".to_string());
        }

        // Validate sales KPIs
        if plan.kpis.is_empty() {
            errors.push("No sales metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 4 {
            warnings.push(
                "Few sales KPIs (expected 6-10 covering MRR, ARR, pipeline, CAC, LTV)".to_string(),
            );
            quality_score = quality_score.saturating_sub(10);
            suggestions.push(
                "Add metrics for MRR, ARR, pipeline value, win rate, sales cycle".to_string(),
            );
        }

        // Validate sales timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No sales milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add hiring, quota attainment, and revenue milestones".to_string());
        }

        // Validate sales risks
        if plan.risks.is_empty() {
            warnings.push("No sales risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No sales action steps provided".to_string());
            quality_score = quality_score.saturating_sub(15);
        }

        let is_valid = errors.is_empty();

        Ok(ValidationResult {
            is_valid,
            quality_score,
            warnings,
            errors,
            suggestions,
            validated_at: chrono::Utc::now(),
        })
    }

    fn estimated_duration(&self) -> u64 {
        40 // 40 seconds for comprehensive sales strategy
    }
}

impl SalesAgent for SalesStrategyAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sales_strategy_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SalesStrategyAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "sales-strategy");
        assert_eq!(agent.estimated_duration(), 40);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SalesStrategyAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Sales"));
        assert!(prompt.contains("Funnel"));
        assert!(prompt.contains("Automation"));
        assert!(prompt.contains("Team Structure"));
        assert!(prompt.contains("Forecasting"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = SalesStrategyAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Outbound SDR Program Launch".to_string(),
                description: "Hire 1 SDR, setup cold email sequences, 100 outbound touches/week"
                    .to_string(),
                priority: 1,
                estimated_cost: Some(80000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Inbound Lead Conversion Optimization".to_string(),
                description: "Optimize website CTAs, demo booking flow, email nurture sequences"
                    .to_string(),
                priority: 1,
                estimated_cost: Some(15000),
                expected_roi: Some(8.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Partner Channel Program".to_string(),
                description: "Recruit 5 SI partners, 20% referral commission, co-selling playbook"
                    .to_string(),
                priority: 2,
                estimated_cost: Some(25000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Monthly Recurring Revenue (MRR)".to_string(),
                baseline: 0.0,
                target: 50000.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Sales Pipeline Value".to_string(),
                baseline: 0.0,
                target: 200000.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Win Rate".to_string(),
                baseline: 0.0,
                target: 25.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Average Sales Cycle".to_string(),
                baseline: 0.0,
                target: 45.0,
                unit: "days".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        plan.next_steps = vec![
            "Hire first AE by Month 2".to_string(),
            "Set up HubSpot CRM by Week 2".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
