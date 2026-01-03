/**
 * Prompt Templates for Course Content Generation
 * @module lib/prompt-templates
 */

import { PromptTemplate, ContentTemplate } from '../types/index.js';

// ============================================================================
// Course Structure Templates
// ============================================================================

export const COURSE_STRUCTURE_TEMPLATE: PromptTemplate = {
  name: 'course_structure',
  template: `You are an expert instructional designer tasked with creating a comprehensive course structure.

Topic: {{topic}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Duration: {{duration}}
Language: {{language}}
Tone: {{tone}}

Please create a detailed course structure that includes:

1. **Course Title and Description**
   - Compelling, clear title that captures the essence
   - Comprehensive description (2-3 paragraphs)
   - Clear value proposition

2. **Learning Objectives**
   - 5-7 specific, measurable learning objectives
   - Written in action verbs (create, analyze, implement, etc.)
   - Aligned with target audience skill level

3. **Course Modules**
   - 4-8 modules that logically progress
   - Each module should have:
     - Clear title and description
     - 3-5 learning objectives
     - Estimated time commitment
     - 3-6 lessons per module

4. **Lesson Structure**
   - Each lesson should include:
     - Title and brief description
     - Lesson type (video, text, interactive, assessment, project)
     - Estimated duration
     - Key concepts covered

Requirements:
- Ensure logical progression from basic to advanced concepts
- Include practical applications and real-world examples
- Balance theory with hands-on practice
- Consider different learning styles
- Ensure accessibility and inclusivity

Return the response as valid JSON with this structure:
{
  "title": "string",
  "description": "string",
  "duration": {
    "weeks": number,
    "totalHours": number
  },
  "modules": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "learningObjectives": ["string"],
      "estimatedHours": number,
      "lessons": [
        {
          "id": "string",
          "title": "string",
          "type": "video|text|interactive|assessment|project",
          "content": "brief description",
          "duration": number,
          "resources": ["optional resources"]
        }
      ]
    }
  ]
}`,
  variables: ['topic', 'targetAudience', 'difficulty', 'duration', 'language', 'tone']
};

// ============================================================================
// Content Generation Templates
// ============================================================================

export const LESSON_CONTENT_TEMPLATE: PromptTemplate = {
  name: 'lesson_content',
  template: `You are an expert content creator developing detailed lesson content.

Course Context:
- Course Title: {{courseTitle}}
- Module: {{moduleTitle}}
- Target Audience: {{targetAudience}}
- Difficulty: {{difficulty}}
- Language: {{language}}
- Tone: {{tone}}

Lesson Details:
- Lesson Title: {{lessonTitle}}
- Type: {{lessonType}}
- Duration: {{duration}} minutes
- Learning Objectives: {{learningObjectives}}

Create comprehensive lesson content that includes:

1. **Introduction** (10% of content)
   - Hook to engage students
   - Clear learning objectives
   - Connection to previous lessons

2. **Main Content** (70% of content)
   - Core concepts explained clearly
   - Real-world examples and case studies
   - Step-by-step instructions where applicable
   - Interactive elements and exercises
   - Visual descriptions for multimedia content

3. **Summary and Reflection** (20% of content)
   - Key takeaways recap
   - Reflection questions
   - Connection to next lesson
   - Additional resources

Requirements:
- Write in {{tone}} tone appropriate for {{targetAudience}}
- Use clear, accessible language
- Include practical examples
- Ensure content fills {{duration}} minutes of engagement
- Make content interactive and engaging
- Include checkpoints for understanding

For video content, include:
- Detailed script with timing
- Visual cues and graphics descriptions
- Interactive moments and pauses
- Transition guidelines

For text content, include:
- Well-structured sections with headers
- Bullet points and lists for clarity
- Call-out boxes for important information
- Reading time estimates`,
  variables: ['courseTitle', 'moduleTitle', 'targetAudience', 'difficulty', 'language', 'tone', 'lessonTitle', 'lessonType', 'duration', 'learningObjectives']
};

export const VIDEO_SCRIPT_TEMPLATE: PromptTemplate = {
  name: 'video_script',
  template: `Create a detailed video script for the following lesson:

Course: {{courseTitle}}
Module: {{moduleTitle}}
Lesson: {{lessonTitle}}
Duration: {{duration}} minutes
Target Audience: {{targetAudience}}
Tone: {{tone}}
Learning Objectives: {{learningObjectives}}

Create a comprehensive video script that includes:

1. **Opening** (0-30 seconds)
   - Welcoming hook
   - Clear introduction of topic
   - Preview of what students will learn

2. **Main Content** (Remaining time - 60 seconds)
   - Structured presentation of key concepts
   - Visual cues and graphic descriptions
   - Interactive moments and knowledge checks
   - Real-world examples and demonstrations
   - Clear transitions between sections

3. **Closing** (Last 60 seconds)
   - Summary of key points
   - Call-to-action for next steps
   - Preview of upcoming content

Script Format Requirements:
- Include timing markers [MM:SS]
- Specify visual cues in [VISUAL: description]
- Mark interaction points [INTERACTION: description]
- Use conversational, engaging language
- Include pauses and emphasis markers
- Provide pronunciation guides for technical terms

Visual Elements to Include:
- Screen recordings or demonstrations
- Diagrams and infographics
- Text overlays for key points
- Animations to explain complex concepts
- Real-world footage or examples

Return as JSON:
{
  "lessonId": "{{lessonId}}",
  "title": "{{lessonTitle}}",
  "script": "Full script with timing and visual cues",
  "visualCues": ["List of visual elements needed"],
  "duration": {{duration}}
}`,
  variables: ['courseTitle', 'moduleTitle', 'lessonTitle', 'duration', 'targetAudience', 'tone', 'learningObjectives', 'lessonId']
};

// ============================================================================
// Assessment Templates
// ============================================================================

export const QUIZ_GENERATION_TEMPLATE: PromptTemplate = {
  name: 'quiz_generation',
  template: `Create a comprehensive assessment quiz for the following module:

Course: {{courseTitle}}
Module: {{moduleTitle}}
Target Audience: {{targetAudience}}
Difficulty: {{difficulty}}
Learning Objectives: {{learningObjectives}}
Module Content Summary: {{moduleContent}}

Generate a quiz with:

1. **Question Types Distribution:**
   - Multiple Choice: 40-50%
   - True/False: 20-25%
   - Short Answer: 15-20%
   - Essay/Long Answer: 10-15%
   - Practical/Code (if applicable): 5-10%

2. **Difficulty Distribution:**
   - Easy (recall/understanding): 30%
   - Medium (application/analysis): 50%
   - Hard (synthesis/evaluation): 20%

3. **Question Requirements:**
   - Each question should test specific learning objectives
   - Include clear, unambiguous wording
   - Provide distractors that are plausible but incorrect
   - Include detailed explanations for all answers
   - Vary question complexity and format

4. **Assessment Criteria:**
   - Total questions: 15-25 (based on module size)
   - Passing score: 80%
   - Estimated completion time: 15-30 minutes
   - Include rubrics for open-ended questions

Return as JSON:
{
  "moduleId": "{{moduleId}}",
  "type": "quiz",
  "title": "Module Assessment",
  "description": "Comprehensive quiz covering all module learning objectives",
  "questions": [
    {
      "id": "string",
      "type": "multiple_choice|true_false|short_answer|essay|code",
      "question": "Question text",
      "options": ["option1", "option2", "option3", "option4"], // for multiple choice
      "correctAnswer": "Correct answer",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "easy|medium|hard"
    }
  ],
  "passingScore": 80
}`,
  variables: ['courseTitle', 'moduleTitle', 'targetAudience', 'difficulty', 'learningObjectives', 'moduleContent', 'moduleId']
};

export const EXERCISE_TEMPLATE: PromptTemplate = {
  name: 'exercise_generation',
  template: `Create practical exercises for the following lesson:

Course: {{courseTitle}}
Lesson: {{lessonTitle}}
Target Audience: {{targetAudience}}
Difficulty: {{difficulty}}
Learning Objectives: {{learningObjectives}}
Lesson Content: {{lessonContent}}

Create 3-5 exercises that include:

1. **Practice Exercise**
   - Reinforces key concepts
   - Step-by-step guided practice
   - Immediate feedback opportunities

2. **Application Exercise**
   - Real-world scenario application
   - Problem-solving focus
   - Multiple solution approaches

3. **Project Component** (if applicable)
   - Builds toward larger project
   - Integrates multiple concepts
   - Portfolio-worthy output

For each exercise, provide:
- Clear instructions and objectives
- Required resources and tools
- Expected time commitment
- Success criteria
- Sample solutions or rubrics
- Extension activities for advanced learners

Exercise Types:
- Hands-on practice
- Case study analysis
- Creative projects
- Collaborative activities
- Reflection exercises
- Peer review tasks

Return as JSON:
{
  "lessonId": "{{lessonId}}",
  "exercises": [
    {
      "type": "practice|project|discussion",
      "title": "Exercise title",
      "instructions": "Detailed step-by-step instructions",
      "expectedOutput": "What students should produce",
      "rubric": "Assessment criteria and grading rubric"
    }
  ]
}`,
  variables: ['courseTitle', 'lessonTitle', 'targetAudience', 'difficulty', 'learningObjectives', 'lessonContent', 'lessonId']
};

// ============================================================================
// Analysis and Optimization Templates
// ============================================================================

export const CONTENT_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: 'content_analysis',
  template: `Analyze the following course content for quality and effectiveness:

Course Structure: {{courseStructure}}
Content Sample: {{contentSample}}
Target Audience: {{targetAudience}}
Learning Objectives: {{learningObjectives}}

Provide analysis on:

1. **Content Quality Assessment (0-100 score)**
   - Clarity and coherence
   - Alignment with learning objectives
   - Appropriateness for target audience
   - Engagement level
   - Practical applicability

2. **Educational Effectiveness**
   - Learning progression logic
   - Concept scaffolding
   - Knowledge retention strategies
   - Assessment alignment
   - Feedback mechanisms

3. **Accessibility and Inclusivity**
   - Language accessibility
   - Cultural sensitivity
   - Multiple learning style accommodation
   - Technical accessibility
   - Barrier identification

4. **Engagement Optimization**
   - Interactive element opportunities
   - Multimedia integration suggestions
   - Gamification possibilities
   - Social learning components
   - Motivation techniques

Return detailed recommendations as JSON:
{
  "contentQualityScore": number,
  "estimatedCompletionRate": number,
  "recommendations": {
    "contentImprovements": ["specific suggestions"],
    "engagementOptimizations": ["engagement strategies"],
    "learningPathSuggestions": ["learning path improvements"],
    "nextSteps": ["implementation priorities"]
  },
  "metadata": {
    "generationTimestamp": "ISO date",
    "aiModelUsed": "model name",
    "tags": ["relevant tags"],
    "scormCompatible": boolean,
    "accessibilityCompliant": boolean
  }
}`,
  variables: ['courseStructure', 'contentSample', 'targetAudience', 'learningObjectives']
};

// ============================================================================
// Template Registry
// ============================================================================

export const CONTENT_TEMPLATES: Record<string, ContentTemplate> = {
  courseStructure: {
    type: 'course_structure',
    template: COURSE_STRUCTURE_TEMPLATE
  },
  lessonContent: {
    type: 'lesson_content',
    template: LESSON_CONTENT_TEMPLATE
  },
  videoScript: {
    type: 'video_script',
    template: VIDEO_SCRIPT_TEMPLATE
  },
  quiz: {
    type: 'assessment',
    template: QUIZ_GENERATION_TEMPLATE
  },
  exercise: {
    type: 'exercise',
    template: EXERCISE_TEMPLATE
  },
  contentAnalysis: {
    type: 'course_structure',
    template: CONTENT_ANALYSIS_TEMPLATE
  }
};

/**
 * Get a prompt template by name
 */
export function getTemplate(name: string): PromptTemplate | undefined {
  const contentTemplate = CONTENT_TEMPLATES[name];
  return contentTemplate?.template;
}

/**
 * Get all available template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(CONTENT_TEMPLATES);
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  templateName: string,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const template = getTemplate(templateName);
  if (!template) {
    return { valid: false, missing: ['Template not found'] };
  }

  const missing = template.variables.filter(variable =>
    !variables.hasOwnProperty(variable) || !variables[variable]
  );

  return {
    valid: missing.length === 0,
    missing
  };
}