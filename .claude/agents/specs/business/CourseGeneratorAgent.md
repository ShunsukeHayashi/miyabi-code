# CourseGeneratorAgent

**Agent ID**: 201
**Category**: Business Agent
**Priority**: P0 (Critical)
**Status**: 📋 Planning Phase

---

## 🎯 Mission

Generate comprehensive AI-powered course content using LLM technology, transforming user requirements into structured educational materials.

## 📋 Agent Profile

| Property | Value |
|----------|-------|
| **Agent Type** | `CourseGeneratorAgent` |
| **Input** | Course topic, target audience, difficulty level, duration |
| **Output** | Structured course with outline, sections, lessons, quizzes |
| **Duration** | 5-15 minutes (varies by course complexity) |
| **Dependencies** | `miyabi-llm`, `miyabi-business-api`, PostgreSQL |

## 🔄 Execution Flow

### 1. Input Validation

```rust
pub struct CourseGenerationRequest {
    pub topic: String,              // e.g., "Python for Beginners"
    pub target_audience: String,    // e.g., "Complete beginners"
    pub difficulty_level: DifficultyLevel, // Beginner | Intermediate | Advanced
    pub estimated_hours: u32,       // e.g., 10 hours
    pub learning_objectives: Vec<String>,
    pub preferred_format: CourseFormat, // Video | Text | Interactive
}

pub enum DifficultyLevel {
    Beginner,
    Intermediate,
    Advanced,
}

pub enum CourseFormat {
    Video,      // Script for video content
    Text,       // Written lessons
    Interactive, // Code exercises + explanations
}
```

**Validation Rules**:
- Topic: 5-200 characters
- Target audience: Must be specified
- Estimated hours: 1-100 hours
- Learning objectives: 3-10 items

### 2. Course Outline Generation

**LLM Prompt Template**:
```
You are an expert course designer. Create a comprehensive course outline for:

Topic: {topic}
Target Audience: {target_audience}
Difficulty Level: {difficulty_level}
Duration: {estimated_hours} hours
Learning Objectives:
{learning_objectives}

Generate a course outline with:
1. Course Title
2. Course Description (2-3 paragraphs)
3. Prerequisites
4. Course Structure:
   - Module titles (4-8 modules)
   - Lessons per module (3-6 lessons)
   - Estimated time per lesson
5. Assessment Strategy

Format: JSON
```

**Expected Output**:
```json
{
  "title": "Python for Complete Beginners",
  "description": "...",
  "prerequisites": ["Basic computer skills"],
  "modules": [
    {
      "module_number": 1,
      "title": "Introduction to Python",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "What is Python?",
          "duration_minutes": 15,
          "topics": ["Python history", "Use cases"]
        }
      ]
    }
  ]
}
```

### 3. Content Generation (Per Lesson)

**LLM Prompt Template**:
```
Generate detailed lesson content for:

Course: {course_title}
Module: {module_title}
Lesson: {lesson_title}
Duration: {duration_minutes} minutes
Format: {format}

Content should include:
1. Introduction (hook + learning objectives)
2. Main Content (explanations + examples)
3. Code Examples (if applicable)
4. Practice Exercises (2-3 exercises)
5. Summary (key takeaways)

Format: Markdown
```

### 4. Quiz Generation (Per Module)

**LLM Prompt Template**:
```
Generate a quiz for module: {module_title}

Quiz should have:
- 5-10 multiple choice questions
- 2-3 coding challenges (if applicable)
- 1 essay question

Format: JSON with answers and explanations
```

### 5. Database Storage

```rust
pub async fn store_course(&self, course: &GeneratedCourse) -> Result<(), AgentError> {
    // 1. Insert course metadata
    let course_id = sqlx::query!(
        r#"
        INSERT INTO courses (title, description, difficulty, duration_hours)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
        course.title,
        course.description,
        course.difficulty as _,
        course.duration_hours
    )
    .fetch_one(&self.db_pool)
    .await?
    .id;

    // 2. Insert modules
    for module in &course.modules {
        let module_id = sqlx::query!(
            r#"
            INSERT INTO course_modules (course_id, module_number, title)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
            course_id,
            module.module_number,
            module.title
        )
        .fetch_one(&self.db_pool)
        .await?
        .id;

        // 3. Insert lessons
        for lesson in &module.lessons {
            sqlx::query!(
                r#"
                INSERT INTO course_lessons (module_id, lesson_number, title, content, duration_minutes)
                VALUES ($1, $2, $3, $4, $5)
                "#,
                module_id,
                lesson.lesson_number,
                lesson.title,
                lesson.content,
                lesson.duration_minutes
            )
            .execute(&self.db_pool)
            .await?;
        }
    }

    Ok(())
}
```

## 📊 State Management

### Update Business State

```rust
self.state_manager.update_business_state(|state| {
    state.ai_jobs.push(AiJob {
        id: task.id.clone(),
        job_type: AiJobType::CourseGeneration,
        user_id: request.user_id.clone(),
        status: AiJobStatus::Completed,
        input_params: serde_json::to_value(&request)?,
        output_data: Some(serde_json::to_value(&course)?),
        created_at: Utc::now(),
        completed_at: Some(Utc::now()),
    });
}).await?;
```

## 🧪 Testing Strategy

### Unit Tests

```rust
#[tokio::test]
async fn test_course_outline_generation() {
    let agent = setup_test_agent().await;

    let request = CourseGenerationRequest {
        topic: "Python Basics".to_string(),
        target_audience: "Beginners".to_string(),
        difficulty_level: DifficultyLevel::Beginner,
        estimated_hours: 10,
        learning_objectives: vec![
            "Understand Python syntax".to_string(),
            "Write basic programs".to_string(),
        ],
        preferred_format: CourseFormat::Interactive,
    };

    let outline = agent.generate_outline(&request).await.unwrap();

    assert!(outline.modules.len() >= 4);
    assert!(outline.modules.len() <= 8);
    assert!(outline.modules[0].lessons.len() >= 3);
}
```

### Integration Tests

```rust
#[tokio::test]
async fn test_full_course_generation_workflow() {
    let state = setup_test_state().await;
    let agent = CourseGeneratorAgent::new(state.clone());

    let task = Task::new(
        "course-gen-1".to_string(),
        "Generate Python course".to_string(),
        "Create beginner Python course".to_string(),
        TaskType::Feature,
        0, // P0
    ).unwrap();

    let result = agent.execute(task).await.unwrap();
    assert!(result.success);

    // Verify course in database
    let course = sqlx::query!("SELECT * FROM courses WHERE title LIKE '%Python%'")
        .fetch_one(&state.db_pool)
        .await
        .unwrap();

    assert_eq!(course.difficulty, "beginner");
}
```

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation Time | <10 minutes | Task completion time |
| Content Quality | >85/100 | LLM quality assessment |
| User Satisfaction | >4.5/5 | Post-generation survey |
| Completion Rate | >95% | Successful generations / total |

## 🚨 Error Handling

### Common Errors

1. **LLM API Failure**
   - Retry up to 3 times with exponential backoff
   - Fall back to template-based generation if persistent

2. **Database Storage Failure**
   - Transaction rollback
   - Cache generated content for retry
   - Alert operator

3. **Invalid Input**
   - Return clear validation error to user
   - Suggest corrections

4. **Timeout**
   - Cancel generation after 15 minutes
   - Save partial progress
   - Offer resume option

## 🔗 Dependencies

- **miyabi-llm**: LLM provider abstraction
- **miyabi-business-api**: Business logic layer
- **SQLx**: PostgreSQL database access
- **serde/serde_json**: JSON serialization
- **chrono**: Timestamp handling

## 📝 Implementation Location

**Files**:
- `crates/miyabi-agent-business/src/course_generator.rs`
- `crates/miyabi-business-api/src/courses.rs`
- `crates/miyabi-types/src/composite_state.rs` (AiJob types)

**Database**:
- `migrations/001_courses.sql`

---

**Status**: 📋 Specification Complete - Ready for Implementation
**Phase**: Phase 4 (Week 5)
**Estimated Effort**: 2-3 days
**Last Updated**: 2025-11-12
