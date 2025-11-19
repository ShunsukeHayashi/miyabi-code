# CourseGeneratorAgent (Codex)

**Agent ID**: 201
**Type**: Business Agent
**Priority**: P0
**Status**: 📋 Planning

---

## 🎯 Purpose

Generate AI-powered course content using LLM, transforming user requirements into structured educational materials.

## 📋 Specification

| Property | Value |
|----------|-------|
| Agent Type | `CourseGeneratorAgent` |
| Input | Course topic, audience, difficulty, duration |
| Output | Structured course (outline + content + quizzes) |
| Duration | 5-15 minutes |
| Dependencies | miyabi-llm, PostgreSQL |

## 🔄 Workflow

```
1. Validate Input
   ↓
2. Generate Outline (LLM)
   ↓
3. Generate Content per Lesson (LLM)
   ↓
4. Generate Quizzes per Module (LLM)
   ↓
5. Store in PostgreSQL
   ↓
6. Update BusinessState
```

## 💻 Implementation

```rust
// crates/miyabi-agent-business/src/course_generator.rs

pub struct CourseGeneratorAgent {
    llm_provider: Arc<dyn LlmProvider>,
    state_manager: Arc<StateManager>,
    db_pool: PgPool,
}

impl Agent for CourseGeneratorAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CourseGeneratorAgent
    }

    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        let request: CourseGenerationRequest =
            serde_json::from_value(task.metadata.unwrap())?;

        // 1. Validate
        self.validate_request(&request)?;

        // 2. Generate outline
        let outline = self.generate_outline(&request).await?;

        // 3. Generate content
        let mut course = GeneratedCourse::from_outline(outline);
        for module in &mut course.modules {
            for lesson in &mut module.lessons {
                lesson.content = self.generate_lesson_content(
                    &course.title,
                    &module.title,
                    &lesson.title,
                    lesson.duration_minutes,
                ).await?;
            }
            module.quiz = self.generate_quiz(&module.title).await?;
        }

        // 4. Store
        self.store_course(&course).await?;

        // 5. Update state
        self.state_manager.update_business_state(|state| {
            state.ai_jobs.push(AiJob {
                id: task.id.clone(),
                job_type: AiJobType::CourseGeneration,
                status: AiJobStatus::Completed,
                output_data: Some(serde_json::to_value(&course)?),
                completed_at: Some(Utc::now()),
                ..Default::default()
            });
        }).await?;

        Ok(AgentResult::success())
    }
}

impl CourseGeneratorAgent {
    async fn generate_outline(
        &self,
        request: &CourseGenerationRequest,
    ) -> Result<CourseOutline, AgentError> {
        let prompt = format!(
            r#"Create a course outline for:
Topic: {}
Audience: {}
Difficulty: {:?}
Duration: {} hours

Generate JSON with modules, lessons, and time estimates."#,
            request.topic,
            request.target_audience,
            request.difficulty_level,
            request.estimated_hours
        );

        let response = self.llm_provider
            .chat(&prompt, &ChatOptions::default())
            .await?;

        let outline: CourseOutline = serde_json::from_str(&response.content)?;
        Ok(outline)
    }

    async fn generate_lesson_content(
        &self,
        course_title: &str,
        module_title: &str,
        lesson_title: &str,
        duration_minutes: u32,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            r#"Generate lesson content for:
Course: {}
Module: {}
Lesson: {}
Duration: {} minutes

Include: introduction, explanations, examples, exercises, summary.
Format: Markdown"#,
            course_title, module_title, lesson_title, duration_minutes
        );

        let response = self.llm_provider
            .chat(&prompt, &ChatOptions::default())
            .await?;

        Ok(response.content)
    }

    async fn store_course(&self, course: &GeneratedCourse) -> Result<(), AgentError> {
        let mut tx = self.db_pool.begin().await?;

        let course_id = sqlx::query!(
            "INSERT INTO courses (title, description, difficulty) VALUES ($1, $2, $3) RETURNING id",
            course.title, course.description, course.difficulty as _
        )
        .fetch_one(&mut *tx)
        .await?
        .id;

        for module in &course.modules {
            let module_id = sqlx::query!(
                "INSERT INTO course_modules (course_id, title) VALUES ($1, $2) RETURNING id",
                course_id, module.title
            )
            .fetch_one(&mut *tx)
            .await?
            .id;

            for lesson in &module.lessons {
                sqlx::query!(
                    "INSERT INTO course_lessons (module_id, title, content) VALUES ($1, $2, $3)",
                    module_id, lesson.title, lesson.content
                )
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(())
    }
}
```

## 🧪 Testing

```rust
#[tokio::test]
async fn test_course_generation() {
    let agent = setup_agent().await;
    let task = create_test_task();

    let result = agent.execute(task).await.unwrap();

    assert!(result.success);

    let course = sqlx::query!("SELECT * FROM courses LIMIT 1")
        .fetch_one(&agent.db_pool)
        .await
        .unwrap();

    assert!(!course.title.is_empty());
}
```

## 📊 Metrics

- Generation Time: <10 min
- Content Quality: >85/100
- Success Rate: >95%
- User Satisfaction: >4.5/5

## 🔗 Related

- `.codex/context/aifactory-integration.md`
- `.codex/agents/specs/business/document-generator-agent.md`
- `crates/miyabi-agent-business/src/course_generator.rs`

---

**Phase**: 4 (Week 5)
**Effort**: 2-3 days
**Last Updated**: 2025-11-12
