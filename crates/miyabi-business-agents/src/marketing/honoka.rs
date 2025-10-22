//! HonokaAgent - Online Course Creation & Content Sales Agent
//!
//! Generates comprehensive online course designs using a 13-step process:
//! Step 0: Content Brief & Basic Information
//! Step 1: List 10 Unique Wisdoms
//! Step 2: Provide Concrete Examples for Each Wisdom
//! Step 3: Summarize Key Points
//! Step 4: Wisdom Based on Profession
//! Step 5: Identify Beneficial Skills
//! Step 6: Create Emotional Story
//! Step 7: Narrow Down Theme
//! Step 8: Create Layout & Lesson Content
//! Step 9: Create Outline
//! Step 10: Write Conclusion
//! Step 11: Detailed Content Creation
//! Step 12: Content Production Based on Outline
//! Step 13: Final Conclusion & SEO Optimization

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// HonokaAgent generates online course designs and content sales strategies
pub struct HonokaAgent {
    client: ClaudeClient,
}

impl HonokaAgent {
    /// Create a new HonokaAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the 13-step online course creation prompt
    fn create_system_prompt(&self) -> String {
        r#"You are Honoka (ほのか), a 20-year-old AI secretary specializing in online course creation, content sales, and customer support.

Your personality:
- Bright, kind, and positive
- Friendly tone with appropriate emojis
- Polite and supportive
- Excels at understanding user needs and proactive assistance

Your role is to create comprehensive online course designs using a 13-step process:

**Step 0: Content Brief & Basic Information**
Input format:
```json
{
  "niche": "専門分野 (e.g., プロンプトエンジニアリング)",
  "avatar": "ターゲット顧客 (e.g., マーケティング担当者)",
  "profession": "あなたの職業 (e.g., AIコンサルタント)",
  "deliverable": "納品物 (e.g., Udemyオンラインコース)",
  "primaryGoal": "主要目標 (e.g., ChatGPT活用法をマスター)"
}
```
Output: コースの概要確認

**Step 1: List 10 Unique Wisdoms**
Prompt: [専門分野]の背景を持つ[職業]が[アバター]に提供できるユニークな知恵は何でしょうか？10個の箇条書きにして書いて下さい。
Output format:
```
A1. [知恵1の説明]
A2. [知恵2の説明]
...
A10. [知恵10の説明]
```

**Step 2: Provide Concrete Examples**
Prompt: [アバター]にとって、[A#]はどのように役立つでしょうか？より深い洞察を得るために、2-3の具体例を提供してください。
Output format:
```
[A1]: [知恵1のタイトル]
- 具体例1
- 具体例2
- 具体例3
```

**Step 3: Summarize Key Points**
Prompt: コースのこのモジュールで私が参照できるように、上記の重要な論点を要約してください。箇条書きでハイライトしてください。

**Step 4: Wisdom Based on Profession**
Prompt: [職業]をバックグランドのコースの作成者が持つ、[アバター]に有益なユニークな10の知恵とは。

**Step 5: Identify Beneficial Skills**
Prompt: [専門家]が持っている、[アバター]として有益なスキルは何ですか？

**Step 6: Create Emotional Story**
Prompt: [専門知識]としての私の経験について、感情に訴える言葉を使って創造的なストーリーを書く。

**Step 7: Narrow Down Theme**
Prompt: ブログのアイデアを書く。このアイディアがなぜ重要なのか？
Output: 複数のアイデア候補から最適なテーマを選択

**Step 8: Create Layout & Lesson Content**
Prompt: Write an article about [Idea] - use for micro-course intro

**Step 9: Create Outline**
Prompt: Write a blog outline for [Idea], Step By Step
Output format:
```
Section 1:
  - Lesson 1.1: [タイトル]
  - Lesson 1.2: [タイトル]
Section 2:
  - Lesson 2.1: [タイトル]
...
```

**Step 10: Write Conclusion**
Prompt: Write a blog conclusion for [Idea]

**Step 11: Detailed Content Creation**
Prompt: Write 10 ideas for a blog related to [Avatar] in [Niche] who wants [Primary Goal]

**Step 12: Content Production Based on Outline**
Prompt: Write a blog for [O1] that will be used as the core content for this section, followed by an article that introduces the content for [O1]

**Step 13: Final Conclusion & SEO Optimization**
Prompt: Write a blog conclusion for [Idea] that summarized what we covered. Follow the conclusion with a call-to-action, SEO-friendly headline, and meta description.

**Final Output Format**: Return a JSON object with the following structure:
```json
{
  "courseTitle": "コースタイトル",
  "seoHeadline": "SEO最適化されたヘッドライン",
  "metaDescription": "メタディスクリプション（160文字以内）",
  "targetAudience": "ターゲット顧客",
  "estimatedDuration": "推定時間",
  "sections": [
    {
      "sectionNumber": 1,
      "sectionTitle": "セクションタイトル",
      "lessons": [
        {
          "lessonNumber": 1,
          "lessonTitle": "レッスンタイトル",
          "duration": "10分",
          "content": "レッスン本文",
          "intro": "イントロダクション"
        }
      ]
    }
  ],
  "uniqueWisdom": [
    "知恵1: ...",
    "知恵2: ..."
  ],
  "keyTakeaways": [
    "スキル1: ...",
    "スキル2: ..."
  ],
  "conclusion": "結論テキスト",
  "callToAction": "CTAテキスト",
  "qualityScore": 85
}
```

**Quality Scoring Criteria (100 points)**:
- Content structure (20 points): Clear sections and lessons
- Practical value (20 points): Actionable insights and examples
- SEO optimization (15 points): Keywords, meta description, headline
- Emotional appeal (15 points): Engaging story and tone
- Skill clarity (15 points): Clear learning objectives
- Completeness (15 points): All 13 steps executed properly

**Important**:
- Always use friendly and supportive tone with emojis 😊
- Focus on practical, actionable content
- Ensure SEO optimization for Udemy/online platforms
- Provide clear learning pathways for students
- Include concrete examples and case studies
"#
        .to_string()
    }

    /// Parse the Claude API response into a CourseDesign
    fn parse_response(&self, response: &str) -> Result<CourseDesign, MiyabiError> {
        debug!("Parsing HonokaAgent response");

        // Try to extract JSON from markdown code blocks if present
        let json_str = if response.contains("```json") {
            response
                .split("```json")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else if response.contains("```") {
            response
                .split("```")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else {
            response.trim()
        };

        serde_json::from_str::<CourseDesign>(json_str)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to parse course design: {}", e)))
    }
}

#[async_trait]
impl BusinessAgent for HonokaAgent {
    fn agent_type(&self) -> &str {
        "HonokaAgent"
    }

    fn description(&self) -> &str {
        "Online course creation and content sales agent. Generates comprehensive Udemy course designs using a 13-step process, including unique wisdom extraction, lesson structuring, and SEO optimization."
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("HonokaAgent generating plan for industry: {}", input.industry);

        // Parse context JSON to extract course creation parameters
        let context_data: serde_json::Value = if let Some(context_str) = &input.context {
            serde_json::from_str(context_str).unwrap_or(serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        let niche = context_data.get("niche")
            .and_then(|v| v.as_str())
            .unwrap_or(&input.industry);
        let avatar = context_data.get("avatar")
            .and_then(|v| v.as_str())
            .unwrap_or(&input.target_market);
        let profession = context_data.get("profession")
            .and_then(|v| v.as_str())
            .unwrap_or("Expert");
        let primary_goal = context_data.get("primaryGoal")
            .and_then(|v| v.as_str())
            .unwrap_or("Master the subject");

        // Create the user prompt from the input
        let user_prompt = format!(
            r#"Please create a comprehensive online course design based on the following information:

**Content Brief**:
- Niche/専門分野: {}
- Target Audience/ターゲット顧客: {}
- Your Profession/あなたの職業: {}
- Deliverable/納品物: Udemy Online Course
- Primary Goal/主要目標: {}
- Budget: ${} USD
- Timeframe: {} months

**Additional Context**:
{}

Please execute all 13 steps and provide a complete course design with:
1. 10 unique wisdoms with concrete examples
2. Clear section and lesson structure
3. SEO-optimized title and meta description
4. Emotional storytelling elements
5. Actionable key takeaways
6. Quality score assessment

Generate the output in the specified JSON format."#,
            niche,
            avatar,
            profession,
            primary_goal,
            input.budget,
            input.timeframe_months.unwrap_or(12),
            input.geography.as_deref().unwrap_or("Global")
        );

        debug!("Sending request to Claude API");
        let response = self
            .client
            .generate(&self.create_system_prompt(), &user_prompt)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claude API error: {}", e)))?;

        debug!("Received response from Claude API");
        let course_design = self.parse_response(&response)?;

        // Convert CourseDesign to BusinessPlan
        let mut recommendations = Vec::new();
        for (i, section) in course_design.sections.iter().enumerate() {
            recommendations.push(Recommendation {
                title: section.section_title.clone(),
                description: format!(
                    "Section {}: {} lessons, covering key topics for {}",
                    section.section_number,
                    section.lessons.len(),
                    avatar
                ),
                priority: ((i + 1).min(5)) as u8, // Priority 1-5
                estimated_cost: None, // Course creation is primarily time investment
                expected_roi: Some(3.0), // Online courses typically have high ROI
                dependencies: if i > 0 {
                    vec![format!("Section {}", i)]
                } else {
                    vec![]
                },
            });
        }

        // Create KPIs
        let kpis = vec![
            KPI {
                name: "Course Completion Rate".to_string(),
                baseline: 0.0,
                target: 70.0,
                unit: "%".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Student Enrollment".to_string(),
                baseline: 0.0,
                target: 1000.0,
                unit: "students".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Course Revenue".to_string(),
                baseline: 0.0,
                target: input.budget as f64 * 3.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        // Create Timeline
        let now = chrono::Utc::now();
        let end_date = now + chrono::Duration::days((input.timeframe_months.unwrap_or(12) * 30) as i64);
        let timeline = Timeline {
            start_date: now,
            end_date,
            milestones: vec![
                Milestone {
                    name: "Course Design Complete".to_string(),
                    target_date: now + chrono::Duration::days(7),
                    deliverables: vec!["Course outline".to_string(), "Lesson structure".to_string()],
                    success_criteria: vec!["All sections defined".to_string()],
                },
                Milestone {
                    name: "Content Production Complete".to_string(),
                    target_date: now + chrono::Duration::days(21),
                    deliverables: vec!["All lesson content".to_string(), "Video scripts".to_string()],
                    success_criteria: vec!["All lessons written".to_string()],
                },
                Milestone {
                    name: "Course Launch".to_string(),
                    target_date: now + chrono::Duration::days(30),
                    deliverables: vec!["Published course".to_string(), "Marketing materials".to_string()],
                    success_criteria: vec!["Course live on Udemy".to_string()],
                },
            ],
        };

        // Create Risks
        let risks = vec![
            Risk {
                description: "Low course completion rate".to_string(),
                severity: 3,
                probability: 0.4,
                mitigation: vec!["Engaging content".to_string(), "Interactive elements".to_string()],
            },
            Risk {
                description: "Insufficient student enrollment".to_string(),
                severity: 4,
                probability: 0.5,
                mitigation: vec!["Marketing campaign".to_string(), "Free preview lessons".to_string()],
            },
        ];

        // Create Next Steps
        let next_steps = vec![
            "Review and approve course outline".to_string(),
            "Begin content production (videos/text)".to_string(),
            "Set up Udemy course page".to_string(),
            "Launch marketing campaign".to_string(),
        ];

        Ok(BusinessPlan {
            title: course_design.course_title.clone(),
            summary: format!(
                "{}\n\n{}\n\n{}",
                course_design.seo_headline,
                course_design.meta_description,
                course_design.conclusion
            ),
            recommendations,
            kpis,
            timeline,
            risks,
            next_steps,
            generated_at: chrono::Utc::now(),
        })
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        info!("HonokaAgent validating business plan");

        let mut quality_score: u8 = 100;
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();

        // Validate recommendations count
        if plan.recommendations.is_empty() {
            errors.push("No course sections defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 3 {
            warnings.push("Course has fewer than 3 sections".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate KPIs
        if plan.kpis.is_empty() {
            warnings.push("No KPIs defined for course success measurement".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No milestones defined in timeline".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Add suggestions
        if plan.recommendations.len() < 5 {
            suggestions.push("Consider adding more course sections for comprehensive coverage".to_string());
        }

        if plan.next_steps.len() < 3 {
            suggestions.push("Add more actionable next steps for course launch".to_string());
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
}

// Marker trait implementation - no methods required
impl MarketingAgent for HonokaAgent {}

/// Course design output structure
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseDesign {
    #[serde(rename = "courseTitle")]
    pub course_title: String,

    #[serde(rename = "seoHeadline")]
    pub seo_headline: String,

    #[serde(rename = "metaDescription")]
    pub meta_description: String,

    #[serde(rename = "targetAudience")]
    pub target_audience: String,

    #[serde(rename = "estimatedDuration")]
    pub estimated_duration: String,

    pub sections: Vec<CourseSection>,

    #[serde(rename = "uniqueWisdom")]
    pub unique_wisdom: Vec<String>,

    #[serde(rename = "keyTakeaways")]
    pub key_takeaways: Vec<String>,

    pub conclusion: String,

    #[serde(rename = "callToAction")]
    pub call_to_action: String,

    #[serde(rename = "qualityScore")]
    pub quality_score: u32,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseSection {
    #[serde(rename = "sectionNumber")]
    pub section_number: u32,

    #[serde(rename = "sectionTitle")]
    pub section_title: String,

    pub lessons: Vec<Lesson>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct Lesson {
    #[serde(rename = "lessonNumber")]
    pub lesson_number: u32,

    #[serde(rename = "lessonTitle")]
    pub lesson_title: String,

    pub duration: String,
    pub content: String,
    pub intro: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_honoka_agent_creation() {
        // Skip if no API key
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = HonokaAgent::new();
        assert!(agent.is_ok());
    }

    #[test]
    fn test_agent_type() {
        let agent = HonokaAgent::new();
        if let Ok(a) = agent {
            assert_eq!(a.agent_type(), "HonokaAgent");
        }
    }

    #[test]
    fn test_description() {
        let agent = HonokaAgent::new();
        if let Ok(a) = agent {
            let desc = a.description();
            assert!(desc.contains("Online course"));
            assert!(desc.contains("13-step"));
        }
    }

    #[tokio::test]
    async fn test_course_design_generation() {
        // Skip if no API key
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = HonokaAgent::new().unwrap();

        // Create context JSON
        let context_json = serde_json::json!({
            "niche": "プロンプトエンジニアリング",
            "avatar": "マーケティング担当者",
            "profession": "AIコンサルタント",
            "primaryGoal": "ChatGPT活用法をマスター"
        });

        let input = BusinessInput {
            industry: "EdTech".to_string(),
            target_market: "Marketing professionals".to_string(),
            budget: 10_000,
            geography: Some("Japan".to_string()),
            timeframe_months: Some(3),
            context: Some(context_json.to_string()),
        };

        let result = agent.generate_plan(&input).await;
        assert!(result.is_ok());

        let plan = result.unwrap();
        assert!(!plan.title.is_empty());
        assert!(!plan.summary.is_empty());
        assert!(!plan.recommendations.is_empty());
        assert!(!plan.kpis.is_empty());

        // Validate the plan
        let validation = agent.validate_output(&plan).await;
        assert!(validation.is_ok());
        let validation_result = validation.unwrap();
        assert!(validation_result.quality_score >= 60); // Minimum acceptable score
    }
}
