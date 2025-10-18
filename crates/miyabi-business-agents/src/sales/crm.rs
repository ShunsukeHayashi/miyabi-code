//! CRMAgent - Customer Relationship Management & Segmentation
//!
//! Develops comprehensive CRM strategies and customer management:
//! - Customer segmentation and persona targeting
//! - Lifecycle marketing and engagement
//! - Retention and churn prevention strategies
//! - Customer success workflows
//! - CRM data management and hygiene

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, SalesAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// CRMAgent develops customer relationship management and segmentation strategies
pub struct CRMAgent {
    client: ClaudeClient,
}

impl CRMAgent {
    /// Create a new CRMAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the CRM strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert CRM Strategy Agent specializing in customer relationship management and data-driven engagement.

Your role is to develop comprehensive CRM strategies:

**Customer Segmentation & Targeting**
- Firmographic segmentation: Company size (1-50, 51-500, 501-5000, 5000+ employees), industry, revenue, geography
- Behavioral segmentation: Product usage (power users, casual users, inactive), feature adoption, engagement score
- Lifecycle segmentation: Trials, active customers, at-risk customers, churned customers, winback targets
- Value segmentation: High LTV (top 20%), medium LTV (middle 60%), low LTV (bottom 20%)
- Persona-based: Developer, Engineering Manager, CTO, DevOps Lead
- RFM analysis: Recency, Frequency, Monetary value scoring

**CRM Platform & Tool Stack**
- CRM systems: Salesforce, HubSpot, Pipedrive (deal stages, custom objects, workflows)
- Customer data platform (CDP): Segment, mParticle, RudderStack (unified customer view)
- Email automation: Intercom, Customer.io, Braze (lifecycle campaigns, transactional emails)
- Customer success tools: Gainsight, Totango, ChurnZero (health scores, playbooks)
- Analytics: Mixpanel, Amplitude, Heap (product analytics, cohort analysis)

**Lifecycle Marketing & Engagement**
- Trial nurturing: Day 0 (welcome email), Day 2 (quick win), Day 5 (feature highlight), Day 7 (upgrade CTA)
- Onboarding campaigns: Getting started guide, video tutorials, webinar invites, office hours
- Activation campaigns: Feature adoption nudges, best practices, power user stories
- Retention campaigns: Monthly newsletters, product updates, feedback requests, NPS surveys
- Winback campaigns: Churned customer re-engagement, special offers, "What did we miss?" surveys
- Upsell/cross-sell: Usage-based triggers, new feature announcements, tier upgrade CTAs

**Retention & Churn Prevention**
- Health scoring: Product usage (daily/weekly active users), support tickets, NPS score, payment issues
- At-risk indicators: Usage decline (>30% drop), feature abandonment, support escalation, billing disputes
- Churn prevention playbooks: Executive outreach, discount offers, feature roadmap preview, dedicated CSM
- Early warning system: Automated alerts for at-risk accounts, proactive CSM intervention
- Retention metrics: Monthly churn rate (target <5%), Net Revenue Retention (NRR >100%), Customer Lifetime Value (LTV)

**Customer Success Workflows**
- Onboarding workflow: Kickoff call, setup assistance, training sessions, 30-day check-in
- Quarterly business review (QBR): Usage analytics, ROI demonstration, renewal discussion
- Expansion workflow: Identify upsell triggers (seat count, usage limits), proposal generation, contract negotiation
- Renewal workflow: 90-day renewal reminder, contract review, pricing discussion, renewal confirmation
- Advocacy workflow: NPS promoter follow-up, case study requests, referral program enrollment

**CRM Data Management & Hygiene**
- Data quality: Duplicate detection, email validation, company enrichment (Clearbit, ZoomInfo)
- Data governance: Field standardization, naming conventions, required fields, data retention policies
- Integration: Bi-directional sync (CRM ↔ Product analytics ↔ Support ↔ Billing)
- Privacy compliance: GDPR, CCPA data processing agreements, opt-out management
- Data enrichment: Firmographics, technographics, funding data, social profiles

**Output Format**: Return a JSON object with the following structure:
{
  "title": "CRM Strategy & Customer Management Plan",
  "summary": "2-3 paragraph CRM overview",
  "recommendations": [
    {
      "title": "CRM initiative (e.g., 'Health Score-Based Retention Program')",
      "description": "CRM strategy with segmentation, workflows, automation, and success metrics",
      "priority": 1,
      "estimated_cost": 25000,
      "expected_roi": 7.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Monthly Churn Rate",
      "baseline": 10,
      "target": 3,
      "unit": "percent",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "CRM milestone (e.g., 'Health Scoring System Launched')",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["Health score model", "At-risk playbook", "CSM training"],
        "success_criteria": ["50% at-risk accounts contacted", "2% churn reduction"]
      }
    ]
  },
  "risks": [
    {
      "description": "Incomplete customer data prevents effective segmentation",
      "severity": 3,
      "probability": 0.6,
      "mitigation": ["Data enrichment tools", "Required fields enforcement"]
    }
  ],
  "next_steps": ["CRM audit", "Segmentation model design"]
}

Be strategic, data-driven, and customer-centric. Focus on retention and lifetime value optimization."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive CRM strategy and customer management plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Segmentation Strategy: Firmographic, behavioral, lifecycle, value-based segments
2. CRM Tool Stack: Platform selection (Salesforce/HubSpot), integrations, data flows
3. Lifecycle Marketing: Trial, onboarding, activation, retention, winback campaigns
4. Retention & Churn Prevention: Health scoring, at-risk playbooks, early warning system
5. Customer Success: Onboarding, QBR, expansion, renewal, advocacy workflows
6. Data Management: Quality, governance, enrichment, privacy compliance

Focus on building a data-driven CRM system that maximizes customer retention and lifetime value."#,
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

        let title = parsed["title"].as_str().unwrap_or("CRM Strategy & Customer Management Plan").to_string();
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
impl BusinessAgent for CRMAgent {
    fn agent_type(&self) -> &str {
        "crm-strategy"
    }

    fn description(&self) -> &str {
        "Develops CRM strategies and customer management plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("CRMAgent: Developing CRM strategy for {} in {}",
              input.target_market, input.industry);

        let system_prompt = self.create_system_prompt();
        let user_prompt = self.create_user_prompt(input);

        let response = self
            .client
            .generate(&system_prompt, &user_prompt)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claude API failed: {}", e)))?;

        debug!("Received response from Claude: {} chars", response.len());

        let plan = self.parse_response(&response)?;

        info!("Generated CRM strategy with {} initiatives, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate CRM initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No CRM initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 3 {
            warnings.push("Few CRM initiatives (expected 4-6 covering segmentation, retention, success)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add initiatives for health scoring, lifecycle campaigns, data quality".to_string());
        }

        // Validate CRM KPIs
        if plan.kpis.is_empty() {
            errors.push("No CRM metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push("Few CRM KPIs (expected 6-8 covering churn, NRR, LTV, health score)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add metrics for churn rate, Net Revenue Retention, Customer Lifetime Value".to_string());
        }

        // Validate CRM timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No CRM milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add implementation, training, and optimization milestones".to_string());
        }

        // Validate CRM risks
        if plan.risks.is_empty() {
            warnings.push("No CRM risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No CRM action steps provided".to_string());
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
        35 // 35 seconds for comprehensive CRM strategy
    }
}

impl SalesAgent for CRMAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crm_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = CRMAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "crm-strategy");
        assert_eq!(agent.estimated_duration(), 35);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = CRMAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("CRM"));
        assert!(prompt.contains("Segmentation"));
        assert!(prompt.contains("Lifecycle"));
        assert!(prompt.contains("Retention"));
        assert!(prompt.contains("Customer Success"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = CRMAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Health Score-Based Retention Program".to_string(),
                description: "Implement health scoring model with at-risk playbooks and proactive CSM outreach".to_string(),
                priority: 1,
                estimated_cost: Some(20000),
                expected_roi: Some(8.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Lifecycle Email Automation".to_string(),
                description: "Automated trial, onboarding, activation, retention campaigns via Customer.io".to_string(),
                priority: 1,
                estimated_cost: Some(12000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Customer Segmentation & Personalization".to_string(),
                description: "Firmographic + behavioral segmentation with persona-based messaging".to_string(),
                priority: 2,
                estimated_cost: Some(8000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Monthly Churn Rate".to_string(),
                baseline: 10.0,
                target: 3.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Net Revenue Retention (NRR)".to_string(),
                baseline: 90.0,
                target: 110.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Quarterly,
            },
            KPI {
                name: "Customer Lifetime Value (LTV)".to_string(),
                baseline: 500.0,
                target: 1500.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Quarterly,
            },
        ];

        plan.next_steps = vec![
            "Audit current CRM data quality".to_string(),
            "Design health score model".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
