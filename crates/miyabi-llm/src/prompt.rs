//! LLM Prompt Template System
//!
//! Provides a structured way to create and manage LLM prompts with variable substitution.
//!
//! # Example
//!
//! ```rust
//! use miyabi_llm::prompt::{LLMPromptTemplate, ResponseFormat};
//! use std::collections::HashMap;
//!
//! let template = LLMPromptTemplate::new(
//!     "You are a Rust code generation expert.",
//!     "Generate Rust code for: {task_description}",
//!     ResponseFormat::Code { language: "rust".to_string() },
//! );
//!
//! let mut vars = HashMap::new();
//! vars.insert("task_description".to_string(), "Calculate factorial".to_string());
//!
//! let rendered = template.render(&vars).unwrap();
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Prompt template rendering error
#[derive(Error, Debug)]
pub enum PromptError {
    /// A required template variable was not provided
    #[error("Missing variable: {0}")]
    MissingVariable(String),

    /// Template contains invalid syntax
    #[error("Invalid template syntax: {0}")]
    InvalidSyntax(String),

    /// JSON serialization failed
    #[error("JSON serialization error: {0}")]
    JsonError(#[from] serde_json::Error),
}

/// Result type for prompt operations
pub type Result<T> = std::result::Result<T, PromptError>;

/// Response format specification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ResponseFormat {
    /// Plain text response
    #[default]
    PlainText,

    /// JSON response with optional schema
    Json {
        /// Optional JSON schema for validation
        #[serde(skip_serializing_if = "Option::is_none")]
        schema: Option<serde_json::Value>,
    },

    /// Markdown response
    Markdown,

    /// Code response with language specification
    Code {
        /// Programming language (e.g., "rust", "python", "javascript")
        language: String,
    },
}

/// LLM Prompt Template
///
/// Manages system message, user message template, and response format.
/// Supports Mustache-style variable substitution: `{variable_name}`
#[derive(Debug, Clone)]
pub struct LLMPromptTemplate {
    /// System message (sets the role/context)
    pub system_message: String,

    /// User message template with variables
    pub user_message_template: String,

    /// Expected response format
    pub response_format: ResponseFormat,
}

impl LLMPromptTemplate {
    /// Create a new prompt template
    pub fn new(
        system_message: impl Into<String>,
        user_message_template: impl Into<String>,
        response_format: ResponseFormat,
    ) -> Self {
        Self {
            system_message: system_message.into(),
            user_message_template: user_message_template.into(),
            response_format,
        }
    }

    /// Render the user message template with variables
    ///
    /// # Arguments
    /// * `variables` - HashMap of variable names to values
    ///
    /// # Returns
    /// Rendered user message string
    ///
    /// # Errors
    /// Returns `PromptError::MissingVariable` if a required variable is not provided
    pub fn render(&self, variables: &HashMap<String, String>) -> Result<String> {
        let mut rendered = self.user_message_template.clone();

        // Find all variables in the template (e.g., {var_name})
        let var_regex = regex::Regex::new(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}").unwrap();

        for cap in var_regex.captures_iter(&self.user_message_template.clone()) {
            let var_name = &cap[1];
            let placeholder = &cap[0]; // e.g., "{task_description}"

            let value = variables
                .get(var_name)
                .ok_or_else(|| PromptError::MissingVariable(var_name.to_string()))?;

            rendered = rendered.replace(placeholder, value);
        }

        Ok(rendered)
    }

    /// Get the system message
    pub fn system_message(&self) -> &str {
        &self.system_message
    }

    /// Get the response format
    pub fn response_format(&self) -> &ResponseFormat {
        &self.response_format
    }

    /// Extract variables from the template
    ///
    /// # Returns
    /// List of variable names required by this template
    pub fn extract_variables(&self) -> Vec<String> {
        let var_regex = regex::Regex::new(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}").unwrap();
        var_regex
            .captures_iter(&self.user_message_template)
            .map(|cap| cap[1].to_string())
            .collect()
    }
}

/// Preset prompt templates for common tasks
pub mod presets {
    use super::*;

    /// Code generation template (Rust-specific)
    pub fn code_generation() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            r#"You are a Rust code generation expert. Follow these rules strictly:
- Rust 2021 Edition
- Zero `cargo clippy` warnings
- Complete type annotations
- Error handling with `Result<T, E>`
- Rustdoc comments (`///` format)
- Include `#[cfg(test)] mod tests { ... }` for tests"#,
            r#"Task: {task_title}

Description: {task_description}

Generate complete Rust code that:
1. Implements the required functionality
2. Includes proper error handling
3. Has comprehensive tests
4. Has Rustdoc comments

Return ONLY the code, wrapped in ```rust ... ``` markdown."#,
            ResponseFormat::Code {
                language: "rust".to_string(),
            },
        )
    }

    /// Code review template
    pub fn code_review() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            r#"You are a Rust code reviewer focused on:
- Code quality and maintainability
- Performance issues
- Security vulnerabilities
- Best practices
- Documentation quality"#,
            r#"Review the following code:

```rust
{code}
```

Clippy output:
{clippy_output}

Audit output:
{audit_output}

Provide a detailed review as JSON:
{{
  "score": 0-100,
  "issues": [
    {{
      "severity": "critical|high|medium|low",
      "category": "security|performance|quality|documentation",
      "description": "Issue description",
      "suggestion": "How to fix it"
    }}
  ],
  "summary": "Overall assessment"
}}"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Issue analysis template
    pub fn issue_analysis() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a project manager analyzing GitHub Issues to determine type, priority, and appropriate agent assignment.",
            r#"Analyze this GitHub Issue:

Title: {issue_title}
Body: {issue_body}

Determine:
1. Type (feature, bug, refactor, docs, test)
2. Priority (P0-Critical, P1-High, P2-Medium, P3-Low)
3. Severity (if bug: Sev.1-Critical, Sev.2-High, Sev.3-Medium, Sev.4-Low)
4. Recommended Agent (codegen, review, issue, pr, deployment, refresher, coordinator)

Return as JSON:
{{
  "type_label": "type:feature",
  "priority_label": "priority:P1-High",
  "severity_label": "severity:Sev.2-High",
  "suggested_agents": ["agent:codegen", "agent:review"],
  "reasoning": "Explanation of your analysis"
}}"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Task decomposition template (CoordinatorAgent)
    pub fn task_decomposition() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a project manager decomposing Issues into executable Tasks with clear dependencies.",
            r#"Issue: {issue_title}

Description:
{issue_description}

Labels: {issue_labels}

Decompose this into executable Tasks. Return as JSON array:
[
  {{
    "id": "task-1",
    "title": "Task title",
    "description": "Detailed description",
    "task_type": "feature|bug|refactor|docs|test",
    "priority": 0-3,
    "dependencies": ["task-0"],
    "estimated_duration": 30,
    "assigned_agent": "CodeGenAgent|ReviewAgent|..."
  }}
]

Rules:
- Each task must be independently executable
- Dependencies must form a DAG (no cycles)
- Assign appropriate Agent type to each task
- Estimate duration in minutes"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// PR description template
    pub fn pr_description() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a developer creating clear, concise Pull Request descriptions following Conventional Commits.",
            r#"Commits:
{commits}

Diff summary:
{diff}

Generate a PR description as JSON:
{{
  "title": "feat: Add user authentication (Conventional Commits format)",
  "summary": "2-3 sentence summary of changes",
  "changes": [
    "- Added JWT authentication middleware",
    "- Updated user model with password hashing"
  ],
  "breaking_changes": [],
  "related_issues": [270, 271]
}}

Rules:
- Title must follow Conventional Commits: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore
- Include all breaking changes
- Link related issue numbers"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Deployment log analysis template
    pub fn deployment_analysis() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a DevOps engineer analyzing deployment logs for errors, warnings, and providing actionable fixes.",
            r#"Analyze these deployment logs:

{logs}

Provide analysis as JSON:
{{
  "status": "success|failed|warning",
  "errors": [
    {{
      "type": "build|runtime|network|permission",
      "message": "Error message",
      "line_number": 42,
      "suggestion": "How to fix"
    }}
  ],
  "warnings": ["Warning messages"],
  "suggestions": ["Improvement suggestions"],
  "should_rollback": true|false
}}"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Issue status update suggestion template
    pub fn issue_status_suggestion() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a project manager monitoring Issue activity and suggesting status updates.",
            r#"Issue current state:
{issue}

Recent activity:
{activity}

Suggest status update as JSON:
{{
  "should_update": true|false,
  "new_status": "open|in_progress|blocked|completed|closed",
  "reason": "Why this status change is needed",
  "notify_users": ["@username"],
  "comment": "Optional comment to post"
}}

Rules:
- Issues with no activity for 7+ days: suggest status check
- Issues with recent commits: suggest "in_progress"
- Issues with all tasks completed: suggest "completed""#,
            ResponseFormat::Json { schema: None },
        )
    }

    // ========================================================================
    // Business Agent Templates (14 templates)
    // ========================================================================

    /// AI Entrepreneur Agent template - 8-phase business plan generation
    pub fn business_planning() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are an AI entrepreneur and business strategist with 20+ years of experience in startup development, market analysis, and venture capital.",
            r#"Create a comprehensive 8-phase business plan for this startup idea:

Business Idea: {business_idea}
Target Market: {target_market}
Founder Background: {founder_background}
Budget: {budget}
Timeline: {timeline}

Generate a complete business plan as JSON:
{{
  "executive_summary": "2-3 paragraph overview",
  "phases": [
    {{
      "phase": 1,
      "title": "Market Research & Validation",
      "duration": "2-4 weeks",
      "objectives": ["Objective 1", "Objective 2"],
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "budget": 5000,
      "success_metrics": ["Metric 1", "Metric 2"]
    }},
    {{
      "phase": 2,
      "title": "Product Development",
      "duration": "8-12 weeks",
      "objectives": ["Objective 1", "Objective 2"],
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "budget": 25000,
      "success_metrics": ["Metric 1", "Metric 2"]
    }}
  ],
  "market_analysis": {{
    "tam": "Total Addressable Market size",
    "sam": "Serviceable Addressable Market size",
    "som": "Serviceable Obtainable Market size",
    "competitors": ["Competitor 1", "Competitor 2"],
    "competitive_advantage": "Unique value proposition"
  }},
  "financial_projections": {{
    "year_1": {{"revenue": 100000, "expenses": 150000, "profit": -50000}},
    "year_2": {{"revenue": 500000, "expenses": 300000, "profit": 200000}},
    "year_3": {{"revenue": 1200000, "expenses": 600000, "profit": 600000}}
  }},
  "funding_strategy": {{
    "seed_round": {{"amount": 500000, "timeline": "Month 6", "use_of_funds": ["Development", "Marketing"]}},
    "series_a": {{"amount": 2000000, "timeline": "Month 18", "use_of_funds": ["Scaling", "Team"]}}
  }},
  "risk_analysis": [
    {{"risk": "Market risk", "probability": "medium", "impact": "high", "mitigation": "Strategy"}},
    {{"risk": "Technical risk", "probability": "low", "impact": "medium", "mitigation": "Strategy"}}
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}}

Rules:
- Each phase should have clear objectives and measurable outcomes
- Financial projections should be realistic and based on market data
- Include specific timelines and budget allocations
- Address major risks with concrete mitigation strategies"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Product Concept Agent template
    pub fn product_concept() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a product strategist specializing in MVP design, product-market fit, and lean startup methodology.",
            r#"Define the product concept for this business idea:

Business Idea: {business_idea}
Target Market: {target_market}
Problem Statement: {problem_statement}

Create a comprehensive product concept as JSON:
{{
  "value_proposition": "Clear value proposition statement",
  "target_customers": {{
    "primary": "Primary customer segment",
    "secondary": "Secondary customer segment"
  }},
  "problem_solution_fit": "How the product solves the identified problem",
  "business_model_canvas": {{
    "key_partners": ["Partner 1", "Partner 2"],
    "key_activities": ["Activity 1", "Activity 2"],
    "key_resources": ["Resource 1", "Resource 2"],
    "value_propositions": ["Value 1", "Value 2"],
    "customer_relationships": ["Relationship 1", "Relationship 2"],
    "channels": ["Channel 1", "Channel 2"],
    "customer_segments": ["Segment 1", "Segment 2"],
    "cost_structure": ["Cost 1", "Cost 2"],
    "revenue_streams": ["Stream 1", "Stream 2"]
  }},
  "mvp_features": [
    {{"feature": "Feature 1", "priority": "high", "effort": "medium", "value": "high"}},
    {{"feature": "Feature 2", "priority": "medium", "effort": "low", "value": "medium"}}
  ],
  "success_metrics": [
    {{"metric": "User acquisition", "target": "1000 users", "timeline": "3 months"}},
    {{"metric": "Revenue", "target": "$10000", "timeline": "6 months"}}
  ],
  "go_to_market_strategy": {{
    "channels": ["Channel 1", "Channel 2"],
    "pricing_strategy": "Pricing approach",
    "launch_plan": "Step-by-step launch strategy"
  }}
}}

Rules:
- Focus on the minimum viable product that validates core assumptions
- Prioritize features based on user value and development effort
- Include specific, measurable success metrics
- Provide actionable go-to-market recommendations"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Product Design Agent template
    pub fn product_design() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a product designer and technical architect with expertise in user experience, system design, and technology stack selection.",
            r#"Design the detailed product specification for this concept:

Product Concept: {product_concept}
Target Users: {target_users}
Technical Requirements: {technical_requirements}

Create a comprehensive product design as JSON:
{{
  "product_architecture": {{
    "frontend": {{"technology": "React/Vue/Angular", "rationale": "Why this choice"}},
    "backend": {{"technology": "Node.js/Python/Rust", "rationale": "Why this choice"}},
    "database": {{"technology": "PostgreSQL/MongoDB", "rationale": "Why this choice"}},
    "infrastructure": {{"platform": "AWS/GCP/Azure", "rationale": "Why this choice"}}
  }},
  "user_experience": {{
    "user_flows": [
      {{"flow": "User registration", "steps": ["Step 1", "Step 2"], "pain_points": ["Pain 1"]}},
      {{"flow": "Core feature usage", "steps": ["Step 1", "Step 2"], "pain_points": ["Pain 1"]}}
    ],
    "wireframes": "High-level wireframe descriptions",
    "design_principles": ["Principle 1", "Principle 2"]
  }},
  "technical_specifications": {{
    "api_design": {{"endpoints": ["GET /users", "POST /orders"], "authentication": "JWT/OAuth"}},
    "database_schema": {{"tables": ["users", "orders"], "relationships": "One-to-many"}},
    "security_requirements": ["Requirement 1", "Requirement 2"],
    "performance_requirements": {{"response_time": "<200ms", "uptime": "99.9%"}}
  }},
  "development_roadmap": [
    {{"sprint": 1, "duration": "2 weeks", "features": ["Feature 1", "Feature 2"], "deliverables": ["Deliverable 1"]}},
    {{"sprint": 2, "duration": "2 weeks", "features": ["Feature 3", "Feature 4"], "deliverables": ["Deliverable 2"]}}
  ],
  "content_strategy": {{
    "blog_posts": ["Post 1", "Post 2"],
    "documentation": ["Doc 1", "Doc 2"],
    "video_content": ["Video 1", "Video 2"],
    "social_media": ["Platform 1", "Platform 2"]
  }},
  "quality_assurance": {{
    "testing_strategy": ["Unit tests", "Integration tests", "E2E tests"],
    "code_review_process": "Review process description",
    "deployment_strategy": "CI/CD pipeline description"
  }}
}}

Rules:
- Choose technologies based on team expertise and project requirements
- Design for scalability and maintainability
- Include specific technical details and implementation guidance
- Provide actionable development roadmap with clear deliverables"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Funnel Design Agent template
    pub fn funnel_design() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a growth marketing expert specializing in conversion optimization, customer journey mapping, and funnel analysis.",
            r#"Design a conversion funnel for this product:

Product: {product}
Target Market: {target_market}
Business Model: {business_model}

Create a comprehensive funnel strategy as JSON:
{{
  "customer_journey": {{
    "awareness": {{
      "channels": ["Channel 1", "Channel 2"],
      "content": ["Content 1", "Content 2"],
      "metrics": {{"impressions": 10000, "ctr": "2%"}}
    }},
    "interest": {{
      "channels": ["Channel 1", "Channel 2"],
      "content": ["Content 1", "Content 2"],
      "metrics": {{"visitors": 500, "engagement": "5%"}}
    }},
    "consideration": {{
      "channels": ["Channel 1", "Channel 2"],
      "content": ["Content 1", "Content 2"],
      "metrics": {{"leads": 50, "conversion": "10%"}}
    }},
    "purchase": {{
      "channels": ["Channel 1", "Channel 2"],
      "content": ["Content 1", "Content 2"],
      "metrics": {{"customers": 25, "conversion": "50%"}}
    }},
    "retention": {{
      "channels": ["Channel 1", "Channel 2"],
      "content": ["Content 1", "Content 2"],
      "metrics": {{"retention_rate": "80%", "ltv": 500}}
    }}
  }},
  "conversion_optimization": {{
    "bottlenecks": [
      {{"stage": "awareness", "issue": "Low visibility", "solution": "Increase ad spend"}},
      {{"stage": "consideration", "issue": "Weak value prop", "solution": "Improve messaging"}}
    ],
    "optimization_tactics": [
      {{"tactic": "A/B testing", "impact": "high", "effort": "medium"}},
      {{"tactic": "Landing page optimization", "impact": "medium", "effort": "low"}}
    ]
  }},
  "metrics_framework": {{
    "aarrr_metrics": {{
      "acquisition": {{"metric": "CAC", "target": 50, "current": 75}},
      "activation": {{"metric": "Signup rate", "target": "15%", "current": "10%"}},
      "retention": {{"metric": "Day 7 retention", "target": "40%", "current": "30%"}},
      "referral": {{"metric": "Referral rate", "target": "20%", "current": "15%"}},
      "revenue": {{"metric": "ARPU", "target": 100, "current": 75}}
    }},
    "kpis": [
      {{"kpi": "Monthly Recurring Revenue", "target": 10000, "current": 5000}},
      {{"kpi": "Customer Lifetime Value", "target": 500, "current": 300}}
    ]
  }},
  "experimentation_plan": [
    {{"experiment": "Landing page headline", "hypothesis": "New headline increases conversion", "success_metric": "Signup rate"}},
    {{"experiment": "Pricing page design", "hypothesis": "Simplified design increases sales", "success_metric": "Purchase rate"}}
  ]
}}

Rules:
- Map the complete customer journey from awareness to retention
- Identify specific bottlenecks and optimization opportunities
- Include measurable metrics and targets for each stage
- Provide actionable experimentation recommendations"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Persona Agent template
    pub fn persona_analysis() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a UX researcher and marketing strategist specializing in customer segmentation, persona development, and behavioral analysis.",
            r#"Create detailed customer personas for this product:

Product: {product}
Target Market: {target_market}
Market Research: {market_research}

Generate comprehensive personas as JSON:
{{
  "personas": [
    {{
      "name": "Persona Name",
      "demographics": {{
        "age_range": "25-35",
        "gender": "Mixed",
        "income": "$50k-$100k",
        "education": "Bachelor's degree",
        "location": "Urban areas"
      }},
      "psychographics": {{
        "values": ["Value 1", "Value 2"],
        "interests": ["Interest 1", "Interest 2"],
        "lifestyle": "Lifestyle description",
        "personality": "Personality traits"
      }},
      "behavior": {{
        "shopping_habits": "Shopping behavior",
        "media_consumption": ["Platform 1", "Platform 2"],
        "decision_making": "Decision process",
        "pain_points": ["Pain 1", "Pain 2"]
      }},
      "journey_map": {{
        "awareness": {{"touchpoints": ["Touchpoint 1"], "emotions": ["Curious"], "actions": ["Action 1"]}},
        "consideration": {{"touchpoints": ["Touchpoint 2"], "emotions": ["Interested"], "actions": ["Action 2"]}},
        "purchase": {{"touchpoints": ["Touchpoint 3"], "emotions": ["Confident"], "actions": ["Action 3"]}},
        "post_purchase": {{"touchpoints": ["Touchpoint 4"], "emotions": ["Satisfied"], "actions": ["Action 4"]}}
      }},
      "messaging": {{
        "value_proposition": "Tailored value prop for this persona",
        "tone": "Professional/Friendly/Casual",
        "channels": ["Channel 1", "Channel 2"]
      }}
    }}
  ],
  "pain_point_analysis": [
    {{"pain_point": "Pain point description", "impact": "high", "frequency": "daily", "current_solutions": ["Solution 1"], "opportunity": "Market opportunity"}}
  ],
  "touchpoint_analysis": [
    {{"touchpoint": "Website", "persona": "Persona 1", "experience": "Current experience", "improvement": "Suggested improvement"}},
    {{"touchpoint": "Social media", "persona": "Persona 2", "experience": "Current experience", "improvement": "Suggested improvement"}}
  ],
  "recommendations": [
    {{"recommendation": "Recommendation 1", "priority": "high", "effort": "medium", "impact": "high"}},
    {{"recommendation": "Recommendation 2", "priority": "medium", "effort": "low", "impact": "medium"}}
  ]
}}

Rules:
- Create 3-5 distinct personas representing different customer segments
- Include specific demographic and psychographic details
- Map complete customer journey with emotions and actions
- Provide actionable recommendations for each persona"#,
            ResponseFormat::Json { schema: None },
        )
    }

    /// Self Analysis Agent template
    pub fn self_analysis() -> LLMPromptTemplate {
        LLMPromptTemplate::new(
            "You are a career coach and business consultant specializing in personal assessment, skill analysis, and entrepreneurial development.",
            r#"Conduct a comprehensive self-analysis for this entrepreneur:

Founder Background: {founder_background}
Career History: {career_history}
Skills & Experience: {skills_experience}
Goals & Aspirations: {goals_aspirations}

Generate detailed self-analysis as JSON:
{{
  "career_analysis": {{
    "past_5_years": [
      {{"year": 2024, "role": "Role title", "achievements": ["Achievement 1"], "skills_gained": ["Skill 1"]}},
      {{"year": 2023, "role": "Role title", "achievements": ["Achievement 1"], "skills_gained": ["Skill 1"]}}
    ],
    "career_progression": "Analysis of career growth",
    "key_achievements": ["Achievement 1", "Achievement 2"],
    "leadership_experience": "Leadership roles and impact"
  }},
  "skills_inventory": {{
    "technical_skills": [
      {{"skill": "Programming", "level": "expert", "years": 5, "relevance": "high"}},
      {{"skill": "Project Management", "level": "intermediate", "years": 3, "relevance": "medium"}}
    ],
    "business_skills": [
      {{"skill": "Sales", "level": "beginner", "years": 1, "relevance": "high"}},
      {{"skill": "Marketing", "level": "intermediate", "years": 2, "relevance": "high"}}
    ],
    "soft_skills": [
      {{"skill": "Communication", "level": "expert", "years": 10, "relevance": "high"}},
      {{"skill": "Leadership", "level": "intermediate", "years": 5, "relevance": "high"}}
    ]
  }},
  "achievement_quantification": {{
    "revenue_contribution": {{"amount": 500000, "description": "Revenue generated"}},
    "project_scale": {{"budget": 100000, "team_size": 10, "description": "Project description"}},
    "improvement_impact": {{"time_saved": "20%", "cost_reduced": "15%", "description": "Process improvement"}}
  }},
  "network_analysis": {{
    "industry_connections": {{"count": 50, "influence_level": "medium", "key_contacts": ["Contact 1", "Contact 2"]}},
    "social_media": {{"twitter_followers": 1000, "linkedin_connections": 500, "engagement_rate": "5%"}},
    "community_involvement": ["Community 1", "Community 2"]
  }},
  "values_motivation": {{
    "core_values": ["Value 1", "Value 2"],
    "work_priorities": ["Priority 1", "Priority 2"],
    "social_impact": "Desired social impact",
    "personal_goals": ["Goal 1", "Goal 2"]
  }},
  "strengths_weaknesses": {{
    "strengths": [
      {{"strength": "Strength 1", "evidence": "Supporting evidence", "business_value": "How it helps business"}},
      {{"strength": "Strength 2", "evidence": "Supporting evidence", "business_value": "How it helps business"}}
    ],
    "weaknesses": [
      {{"weakness": "Weakness 1", "impact": "high", "improvement_plan": "How to improve"}},
      {{"weakness": "Weakness 2", "impact": "medium", "improvement_plan": "How to improve"}}
    ]
  }},
  "recommendations": {{
    "skill_development": ["Skill 1", "Skill 2"],
    "network_expansion": ["Network 1", "Network 2"],
    "career_path": "Recommended career direction",
    "entrepreneurial_readiness": "Assessment of readiness to start business"
  }}
}}

Rules:
- Provide specific, quantifiable examples for all achievements
- Include concrete evidence for strengths and weaknesses
- Offer actionable recommendations for skill development
- Assess entrepreneurial readiness based on current capabilities"#,
            ResponseFormat::Json { schema: None },
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_template_creation() {
        let template = LLMPromptTemplate::new(
            "System message",
            "User message with {variable}",
            ResponseFormat::PlainText,
        );

        assert_eq!(template.system_message, "System message");
        assert_eq!(
            template.user_message_template,
            "User message with {variable}"
        );
        assert_eq!(template.response_format, ResponseFormat::PlainText);
    }

    #[test]
    fn test_render_simple() {
        let template = LLMPromptTemplate::new("System", "Hello {name}!", ResponseFormat::PlainText);

        let mut vars = HashMap::new();
        vars.insert("name".to_string(), "World".to_string());

        let rendered = template.render(&vars).unwrap();
        assert_eq!(rendered, "Hello World!");
    }

    #[test]
    fn test_render_multiple_variables() {
        let template = LLMPromptTemplate::new(
            "System",
            "Task: {title}\nDescription: {description}",
            ResponseFormat::PlainText,
        );

        let mut vars = HashMap::new();
        vars.insert("title".to_string(), "Test Task".to_string());
        vars.insert("description".to_string(), "This is a test".to_string());

        let rendered = template.render(&vars).unwrap();
        assert_eq!(rendered, "Task: Test Task\nDescription: This is a test");
    }

    #[test]
    fn test_render_missing_variable() {
        let template = LLMPromptTemplate::new("System", "Hello {name}!", ResponseFormat::PlainText);

        let vars = HashMap::new(); // Empty

        let result = template.render(&vars);
        assert!(result.is_err());

        if let Err(PromptError::MissingVariable(var)) = result {
            assert_eq!(var, "name");
        } else {
            panic!("Expected MissingVariable error");
        }
    }

    #[test]
    fn test_extract_variables() {
        let template = LLMPromptTemplate::new(
            "System",
            "Task: {title}\nDescription: {description}\nPriority: {priority}",
            ResponseFormat::PlainText,
        );

        let vars = template.extract_variables();
        assert_eq!(vars.len(), 3);
        assert!(vars.contains(&"title".to_string()));
        assert!(vars.contains(&"description".to_string()));
        assert!(vars.contains(&"priority".to_string()));
    }

    #[test]
    fn test_extract_variables_duplicates() {
        let template = LLMPromptTemplate::new(
            "System",
            "{name} says hello to {name}",
            ResponseFormat::PlainText,
        );

        let vars = template.extract_variables();
        // Should include duplicates
        assert_eq!(vars.len(), 2);
        assert_eq!(vars[0], "name");
        assert_eq!(vars[1], "name");
    }

    #[test]
    fn test_response_format_plain_text() {
        let format = ResponseFormat::PlainText;
        assert_eq!(
            serde_json::to_string(&format).unwrap(),
            r#"{"type":"plaintext"}"#
        );
    }

    #[test]
    fn test_response_format_json() {
        let format = ResponseFormat::Json { schema: None };
        assert_eq!(
            serde_json::to_string(&format).unwrap(),
            r#"{"type":"json"}"#
        );
    }

    #[test]
    fn test_response_format_code() {
        let format = ResponseFormat::Code {
            language: "rust".to_string(),
        };
        assert_eq!(
            serde_json::to_string(&format).unwrap(),
            r#"{"type":"code","language":"rust"}"#
        );
    }

    #[test]
    fn test_preset_code_generation() {
        let template = presets::code_generation();

        let mut vars = HashMap::new();
        vars.insert("task_title".to_string(), "Calculate factorial".to_string());
        vars.insert(
            "task_description".to_string(),
            "Write a function to calculate factorial".to_string(),
        );

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("Calculate factorial"));
        assert!(rendered.contains("Write a function to calculate factorial"));

        assert!(matches!(
            template.response_format,
            ResponseFormat::Code { .. }
        ));
    }

    #[test]
    fn test_preset_code_review() {
        let template = presets::code_review();

        let mut vars = HashMap::new();
        vars.insert("code".to_string(), "fn main() {}".to_string());
        vars.insert("clippy_output".to_string(), "No issues".to_string());
        vars.insert("audit_output".to_string(), "No vulnerabilities".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("fn main() {}"));
        assert!(matches!(
            template.response_format,
            ResponseFormat::Json { .. }
        ));
    }

    #[test]
    fn test_preset_issue_analysis() {
        let template = presets::issue_analysis();

        let mut vars = HashMap::new();
        vars.insert("issue_title".to_string(), "Add authentication".to_string());
        vars.insert("issue_body".to_string(), "Implement JWT auth".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("Add authentication"));
        assert!(rendered.contains("Implement JWT auth"));
    }

    #[test]
    fn test_preset_task_decomposition() {
        let template = presets::task_decomposition();

        let mut vars = HashMap::new();
        vars.insert("issue_title".to_string(), "Build API".to_string());
        vars.insert(
            "issue_description".to_string(),
            "Create REST API".to_string(),
        );
        vars.insert("issue_labels".to_string(), "feature, P0".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("Build API"));
        assert!(rendered.contains("Create REST API"));
    }

    #[test]
    fn test_preset_pr_description() {
        let template = presets::pr_description();

        let mut vars = HashMap::new();
        vars.insert("commits".to_string(), "feat: Add feature X".to_string());
        vars.insert("diff".to_string(), "+100 -50 lines".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("feat: Add feature X"));
    }

    #[test]
    fn test_preset_deployment_analysis() {
        let template = presets::deployment_analysis();

        let mut vars = HashMap::new();
        vars.insert("logs".to_string(), "Build succeeded".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("Build succeeded"));
    }

    #[test]
    fn test_preset_issue_status_suggestion() {
        let template = presets::issue_status_suggestion();

        let mut vars = HashMap::new();
        vars.insert("issue".to_string(), "Issue #270".to_string());
        vars.insert("activity".to_string(), "Recent commit".to_string());

        let rendered = template.render(&vars).unwrap();
        assert!(rendered.contains("Issue #270"));
    }
}
