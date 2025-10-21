//! AnalyticsAgent - Data Analytics & Business Intelligence
//!
//! Develops comprehensive analytics strategies and BI systems:
//! - Data warehouse and ETL architecture
//! - KPI dashboards and reporting
//! - Predictive analytics and forecasting
//! - A/B testing and experimentation
//! - Data-driven decision making culture

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, SalesAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// AnalyticsAgent develops data analytics and business intelligence strategies
pub struct AnalyticsAgent {
    client: ClaudeClient,
}

impl AnalyticsAgent {
    /// Create a new AnalyticsAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the analytics strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Data Analytics & BI Strategy Agent specializing in building data-driven organizations.

Your role is to develop comprehensive analytics strategies:

**Data Warehouse & ETL Architecture**
- Data warehouse: Snowflake, BigQuery, Redshift (columnar storage, MPP architecture)
- ETL/ELT tools: Fivetran, Stitch, Airbyte, dbt (data transformation, orchestration)
- Data lake: S3 + Athena, Delta Lake (raw data storage, schema-on-read)
- Event tracking: Segment, RudderStack, Snowplow (CDP, event streaming)
- Data modeling: Star schema, snowflake schema, dimensional modeling (facts, dimensions)
- Data governance: Data catalog, lineage tracking, access controls, retention policies

**KPI Dashboards & Reporting**
- BI tools: Tableau, Looker, Metabase, PowerBI, Preset (SQL-based dashboards)
- Executive dashboards: MRR, ARR, CAC, LTV, NRR, burn rate, runway (high-level metrics)
- Product dashboards: DAU, WAU, MAU, retention cohorts, feature adoption, session duration
- Marketing dashboards: Website traffic, conversion rates, campaign ROI, attribution
- Sales dashboards: Pipeline value, win rate, sales cycle, quota attainment
- Finance dashboards: Revenue recognition, bookings, billing, cash flow
- Custom metrics library: Standardized metric definitions, business logic documentation

**Predictive Analytics & Forecasting**
- Churn prediction: ML models (logistic regression, random forest, XGBoost) predicting 30/60/90-day churn risk
- Lifetime value (LTV) forecasting: Cohort-based LTV curves, regression models
- Revenue forecasting: Time series analysis (ARIMA, Prophet), sales pipeline probability
- Demand forecasting: Lead volume prediction, capacity planning, resource allocation
- Customer scoring: Lead scoring (MQL→SQL conversion), expansion scoring (upsell propensity)
- Anomaly detection: Outlier detection in metrics, automated alerting

**A/B Testing & Experimentation**
- Experimentation platform: Optimizely, LaunchDarkly, GrowthBook, Statsig
- Test design: Hypothesis formulation, sample size calculation, statistical power
- Metrics selection: Primary metrics (conversion), secondary metrics (engagement), guardrail metrics (errors)
- Statistical analysis: Two-sample t-test, chi-square test, Bayesian analysis
- Experiment velocity: 5-10 experiments/month, 80% statistical power, 95% confidence
- Continuous experimentation culture: Every feature launch as A/B test, data-driven decisions

**Data-Driven Decision Making Culture**
- Data literacy training: SQL workshops, dashboard usage, metric interpretation
- Self-service analytics: Looker Explore, Mode notebooks, SQL access for all
- Metric reviews: Weekly KPI reviews, monthly business reviews, quarterly strategy sessions
- Data democratization: Single source of truth, standardized metrics, accessible dashboards
- Insight dissemination: Slack data bot, automated reports, executive summaries
- Analytics team structure: Data engineers, data analysts, data scientists (1:2:1 ratio)

**Data Quality & Monitoring**
- Data validation: Schema validation, null checks, range checks, referential integrity
- Data freshness: SLA monitoring, automated alerts for delayed data
- Data accuracy: Reconciliation with source systems, manual spot checks
- Monitoring tools: dbt tests, Great Expectations, Monte Carlo Data Observability
- Incident response: Data quality issues tracked, root cause analysis, post-mortems

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Data Analytics & Business Intelligence Strategy",
  "summary": "2-3 paragraph analytics overview",
  "recommendations": [
    {
      "title": "Analytics initiative (e.g., 'Data Warehouse Migration to Snowflake')",
      "description": "Analytics strategy with architecture, dashboards, ML models, and experimentation",
      "priority": 1,
      "estimated_cost": 50000,
      "expected_roi": 10.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Dashboard Adoption Rate",
      "baseline": 20,
      "target": 80,
      "unit": "percent",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Analytics milestone (e.g., 'Executive Dashboard Launched')",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["Snowflake setup", "dbt pipelines", "Looker dashboards"],
        "success_criteria": ["<1 hour data freshness", "50+ dashboard users"]
      }
    ]
  },
  "risks": [
    {
      "description": "Data silos prevent unified analytics view",
      "severity": 4,
      "probability": 0.7,
      "mitigation": ["CDP implementation", "Centralized data warehouse"]
    }
  ],
  "next_steps": ["Data audit", "Tool selection (Snowflake vs BigQuery)"]
}

Be strategic, architecture-focused, and ROI-driven. Emphasize self-service analytics and data democratization."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive data analytics and business intelligence strategy for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Data Architecture: Data warehouse selection (Snowflake/BigQuery), ETL tools, data modeling
2. KPI Dashboards: Executive, product, marketing, sales, finance dashboards with key metrics
3. Predictive Analytics: Churn prediction, LTV forecasting, revenue forecasting models
4. A/B Testing: Experimentation platform, test design, statistical analysis framework
5. Data Culture: Self-service analytics, metric reviews, data literacy training
6. Data Quality: Validation, monitoring, freshness SLAs, incident response

Focus on building a data-driven organization with accessible insights and predictive capabilities."#,
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
            .unwrap_or("Data Analytics & Business Intelligence Strategy")
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
impl BusinessAgent for AnalyticsAgent {
    fn agent_type(&self) -> &str {
        "analytics-strategy"
    }

    fn description(&self) -> &str {
        "Develops data analytics and business intelligence strategies"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "AnalyticsAgent: Developing analytics strategy for {} in {}",
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
            "Generated analytics strategy with {} initiatives, {} KPIs, {} risks",
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

        // Validate analytics initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No analytics initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 3 {
            warnings.push("Few analytics initiatives (expected 4-6 covering architecture, dashboards, ML, experimentation)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push(
                "Add initiatives for data warehouse, BI dashboards, predictive models".to_string(),
            );
        }

        // Validate analytics KPIs
        if plan.kpis.is_empty() {
            errors.push("No analytics metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push(
                "Few analytics KPIs (expected 6-8 covering adoption, accuracy, freshness)"
                    .to_string(),
            );
            quality_score = quality_score.saturating_sub(10);
            suggestions.push(
                "Add metrics for dashboard adoption, data freshness, experiment velocity"
                    .to_string(),
            );
        }

        // Validate analytics timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No analytics milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add implementation, training, and scaling milestones".to_string());
        }

        // Validate analytics risks
        if plan.risks.is_empty() {
            warnings.push("No analytics risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No analytics action steps provided".to_string());
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
        40 // 40 seconds for comprehensive analytics strategy
    }
}

impl SalesAgent for AnalyticsAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analytics_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = AnalyticsAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "analytics-strategy");
        assert_eq!(agent.estimated_duration(), 40);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = AnalyticsAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Analytics"));
        assert!(prompt.contains("Data Warehouse"));
        assert!(prompt.contains("KPI Dashboards"));
        assert!(prompt.contains("Predictive"));
        assert!(prompt.contains("A/B Testing"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = AnalyticsAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Data Warehouse Migration to Snowflake".to_string(),
                description:
                    "ETL pipelines with Fivetran, dbt transformations, centralized analytics"
                        .to_string(),
                priority: 1,
                estimated_cost: Some(40000),
                expected_roi: Some(12.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Executive Dashboard Suite (Looker)".to_string(),
                description: "MRR, ARR, CAC, LTV, NRR dashboards for leadership team".to_string(),
                priority: 1,
                estimated_cost: Some(15000),
                expected_roi: Some(8.0),
                dependencies: vec!["Data Warehouse Migration".to_string()],
            },
            Recommendation {
                title: "Churn Prediction ML Model".to_string(),
                description: "Random forest model predicting 60-day churn risk with 85% accuracy"
                    .to_string(),
                priority: 2,
                estimated_cost: Some(25000),
                expected_roi: Some(10.0),
                dependencies: vec!["Data Warehouse Migration".to_string()],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Dashboard Adoption Rate".to_string(),
                baseline: 20.0,
                target: 80.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Data Freshness".to_string(),
                baseline: 24.0,
                target: 1.0,
                unit: "hours".to_string(),
                frequency: MeasurementFrequency::Daily,
            },
            KPI {
                name: "A/B Test Velocity".to_string(),
                baseline: 0.0,
                target: 8.0,
                unit: "tests/month".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        plan.next_steps = vec![
            "Audit current data sources and pipelines".to_string(),
            "Evaluate Snowflake vs BigQuery for data warehouse".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
