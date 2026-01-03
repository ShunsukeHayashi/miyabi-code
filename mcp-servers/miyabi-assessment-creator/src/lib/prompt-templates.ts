/**
 * Prompt Templates for AssessmentCreator Agent
 * @module lib/prompt-templates
 */

import { PromptTemplate } from './gemini-client.js';

// ============================================================================
// Question Generation Templates
// ============================================================================

export const MULTIPLE_CHOICE_TEMPLATE: PromptTemplate = {
  name: 'multiple_choice_question',
  template: `You are an expert educational assessment designer. Create a high-quality multiple choice question.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Question should be clear, unambiguous, and directly assess the learning objective
2. Provide 4 plausible answer options
3. Create effective distractors based on common misconceptions
4. Include a clear explanation of why the correct answer is right
5. Align with the specified Bloom's taxonomy level
6. Use appropriate language for the target audience

Generate the question as JSON:
{
  "id": "unique-id",
  "type": "multiple_choice",
  "question": "Clear, well-constructed question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "correctAnswer": "Option A",
  "explanation": "Detailed explanation of why this answer is correct",
  "distractors": [
    {"text": "Option B", "reasoning": "Why this is an effective distractor"},
    {"text": "Option C", "reasoning": "Why this is an effective distractor"},
    {"text": "Option D", "reasoning": "Why this is an effective distractor"}
  ],
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 1,
  "timeEstimate": 2,
  "tags": ["{{topic}}", "multiple-choice"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

export const TRUE_FALSE_TEMPLATE: PromptTemplate = {
  name: 'true_false_question',
  template: `Create a well-crafted true/false question that tests conceptual understanding.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Statement should be clearly true or false, avoiding ambiguity
2. Test important concepts, not trivial details
3. Avoid absolute terms unless they are accurate (always, never, all, none)
4. Include comprehensive explanation
5. Consider requiring justification from students

Generate as JSON:
{
  "id": "unique-id",
  "type": "true_false",
  "question": "Clear statement to evaluate",
  "correctAnswer": true,
  "explanation": "Detailed explanation of why the statement is true/false",
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 1,
  "timeEstimate": 1,
  "requireJustification": false,
  "tags": ["{{topic}}", "true-false"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

export const FILL_IN_BLANK_TEMPLATE: PromptTemplate = {
  name: 'fill_in_blank_question',
  template: `Create a fill-in-the-blank question that tests specific knowledge and vocabulary.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Use blanks for key terms or concepts
2. Provide context that makes the answer determinable
3. Accept reasonable alternative answers
4. Ensure blanks are significant, not trivial words
5. Consider case sensitivity and partial credit

Generate as JSON:
{
  "id": "unique-id",
  "type": "fill_in_blank",
  "question": "Complete the following statement:",
  "questionWithBlanks": "Statement with _____ representing missing terms",
  "correctAnswers": ["primary answer", "acceptable alternative"],
  "caseSensitive": false,
  "allowPartialCredit": true,
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 1,
  "timeEstimate": 2,
  "tags": ["{{topic}}", "fill-in-blank"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

export const SHORT_ANSWER_TEMPLATE: PromptTemplate = {
  name: 'short_answer_question',
  template: `Create a short answer question that requires explanation or application.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Ask for explanation, analysis, or application
2. Provide clear scoring criteria
3. Include sample answers for reference
4. Define expected length and key points
5. Create rubric for consistent grading

Generate as JSON:
{
  "id": "unique-id",
  "type": "short_answer",
  "question": "Clear, focused question requiring explanation",
  "sampleAnswers": [
    "Example of a complete correct answer",
    "Alternative acceptable answer"
  ],
  "keyPoints": [
    "Essential point that should be included",
    "Another key concept to address"
  ],
  "maxWords": 150,
  "rubric": "Grading criteria: Full credit for mentioning key points with clear explanation...",
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 3,
  "timeEstimate": 5,
  "tags": ["{{topic}}", "short-answer"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

export const ESSAY_TEMPLATE: PromptTemplate = {
  name: 'essay_question',
  template: `Create a comprehensive essay question with detailed rubric.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Prompt should encourage critical thinking and analysis
2. Provide clear expectations and structure
3. Create detailed analytical rubric
4. Include multiple assessment criteria
5. Allow for creative and diverse approaches

Generate as JSON:
{
  "id": "unique-id",
  "type": "essay",
  "question": "Essay prompt",
  "prompt": "Detailed essay prompt with clear expectations and structure",
  "rubric": {
    "criteria": [
      {
        "name": "Content Knowledge",
        "description": "Demonstrates understanding of key concepts",
        "points": 20,
        "levels": [
          {"score": 20, "description": "Exceptional understanding with sophisticated analysis"},
          {"score": 15, "description": "Good understanding with clear analysis"},
          {"score": 10, "description": "Basic understanding with minimal analysis"},
          {"score": 5, "description": "Limited understanding with unclear analysis"},
          {"score": 0, "description": "No evidence of understanding"}
        ]
      },
      {
        "name": "Critical Thinking",
        "description": "Analyzes, evaluates, and synthesizes information",
        "points": 15,
        "levels": [
          {"score": 15, "description": "Exceptional critical analysis and synthesis"},
          {"score": 12, "description": "Good analysis with some synthesis"},
          {"score": 8, "description": "Basic analysis with limited depth"},
          {"score": 4, "description": "Minimal analysis, mostly description"},
          {"score": 0, "description": "No evidence of critical thinking"}
        ]
      },
      {
        "name": "Organization & Communication",
        "description": "Clear structure, coherent arguments, proper writing",
        "points": 10,
        "levels": [
          {"score": 10, "description": "Excellent organization and clear communication"},
          {"score": 8, "description": "Good organization with minor communication issues"},
          {"score": 6, "description": "Adequate organization, some unclear communication"},
          {"score": 4, "description": "Poor organization, difficult to follow"},
          {"score": 0, "description": "No clear organization or communication"}
        ]
      }
    ],
    "totalPoints": 45
  },
  "minWords": 300,
  "maxWords": 800,
  "timeLimit": 45,
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 45,
  "timeEstimate": 45,
  "tags": ["{{topic}}", "essay"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

export const CODING_CHALLENGE_TEMPLATE: PromptTemplate = {
  name: 'coding_challenge_question',
  template: `Create a programming challenge that tests coding skills and problem-solving.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Programming Language: {{programmingLanguage}}
Content Context: {{contentContext}}

Requirements:
1. Clear problem statement with examples
2. Provide comprehensive test cases
3. Include both visible and hidden test cases
4. Offer helpful hints without giving away solution
5. Ensure problem is achievable within time limit

Generate as JSON:
{
  "id": "unique-id",
  "type": "coding_challenge",
  "question": "Brief problem title",
  "problemStatement": "Detailed problem description with examples and constraints",
  "programmingLanguage": "{{programmingLanguage}}",
  "starterCode": "// Optional starter code template",
  "testCases": [
    {
      "input": "sample input",
      "expectedOutput": "expected output",
      "isHidden": false
    },
    {
      "input": "test input",
      "expectedOutput": "expected result",
      "isHidden": true
    }
  ],
  "solution": "Reference solution with comments",
  "hints": [
    "Helpful hint 1",
    "Helpful hint 2"
  ],
  "bloomsLevel": "apply",
  "difficulty": "{{difficulty}}",
  "points": 10,
  "timeEstimate": 20,
  "tags": ["{{topic}}", "coding", "{{programmingLanguage}}"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'programmingLanguage', 'contentContext']
};

export const CASE_STUDY_TEMPLATE: PromptTemplate = {
  name: 'case_study_question',
  template: `Create a realistic case study question that applies knowledge to practical scenarios.

Topic: {{topic}}
Learning Objective: {{learningObjective}}
Target Audience: {{targetAudience}}
Difficulty Level: {{difficulty}}
Bloom's Taxonomy Level: {{bloomsLevel}}
Content Context: {{contentContext}}

Requirements:
1. Present a realistic, complex scenario
2. Include multiple sub-questions of varying difficulty
3. Test application and analysis skills
4. Provide clear rubrics for each component
5. Encourage evidence-based reasoning

Generate as JSON:
{
  "id": "unique-id",
  "type": "case_study",
  "question": "Case Study: [Title]",
  "scenario": "Detailed, realistic scenario that students must analyze",
  "subQuestions": [
    {
      "question": "What factors led to this situation?",
      "type": "short_answer",
      "rubric": "Awards full points for identifying 3+ key factors with explanations",
      "points": 10
    },
    {
      "question": "What would you recommend and why?",
      "type": "essay",
      "rubric": "Evaluates quality of recommendation, supporting evidence, consideration of alternatives",
      "points": 15
    }
  ],
  "bloomsLevel": "{{bloomsLevel}}",
  "difficulty": "{{difficulty}}",
  "points": 25,
  "timeEstimate": 30,
  "tags": ["{{topic}}", "case-study", "application"]
}`,
  variables: ['topic', 'learningObjective', 'targetAudience', 'difficulty', 'bloomsLevel', 'contentContext']
};

// ============================================================================
// Assessment-Level Templates
// ============================================================================

export const ASSESSMENT_STRUCTURE_TEMPLATE: PromptTemplate = {
  name: 'assessment_structure',
  template: `Create a balanced assessment structure that effectively measures learning objectives.

Topic: {{topic}}
Learning Objectives: {{learningObjectives}}
Target Audience: {{targetAudience}}
Assessment Type: {{assessmentType}}
Total Questions: {{questionCount}}
Time Limit: {{timeLimit}} minutes
Difficulty Distribution: {{difficultyDistribution}}
Bloom's Distribution: {{bloomsDistribution}}

Requirements:
1. Balance question types appropriately
2. Ensure progressive difficulty
3. Cover all learning objectives
4. Provide clear instructions
5. Include appropriate time allocations

Generate as JSON:
{
  "title": "Assessment Title",
  "description": "Clear description of what this assessment measures",
  "instructions": "Detailed instructions for students",
  "config": {
    "type": "{{assessmentType}}",
    "timeLimit": {{timeLimit}},
    "attempts": 1,
    "randomizeQuestions": false,
    "randomizeOptions": true,
    "showFeedback": "after_submission",
    "allowReview": true
  },
  "structure": {
    "questionDistribution": {
      "multiple_choice": 8,
      "true_false": 4,
      "short_answer": 3,
      "essay": 1
    },
    "difficultyProgression": [
      {"difficulty": "easy", "questionCount": 5, "pointValue": 1},
      {"description": "medium", "questionCount": 8, "pointValue": 2},
      {"difficulty": "hard", "questionCount": 3, "pointValue": 3}
    ],
    "bloomsAlignment": {
      "remember": 3,
      "understand": 5,
      "apply": 6,
      "analyze": 2
    }
  },
  "estimatedDuration": {{timeLimit}},
  "totalPoints": 32,
  "passingScore": 70,
  "learningObjectivesCovered": {{learningObjectives}}
}`,
  variables: ['topic', 'learningObjectives', 'targetAudience', 'assessmentType', 'questionCount', 'timeLimit', 'difficultyDistribution', 'bloomsDistribution']
};

export const RUBRIC_TEMPLATE: PromptTemplate = {
  name: 'assessment_rubric',
  template: `Create a comprehensive rubric for evaluating student performance.

Assessment Topic: {{topic}}
Assessment Type: {{assessmentType}}
Learning Objectives: {{learningObjectives}}
Target Audience: {{targetAudience}}
Total Points: {{totalPoints}}

Requirements:
1. Define clear performance levels
2. Include specific criteria for each level
3. Provide observable indicators
4. Ensure alignment with learning objectives
5. Make grading objective and fair

Generate as JSON:
{
  "id": "rubric-id",
  "title": "Assessment Rubric",
  "description": "Comprehensive rubric for evaluating student performance",
  "criteria": [
    {
      "name": "Content Mastery",
      "description": "Demonstrates understanding of key concepts and principles",
      "weight": 0.4,
      "levels": [
        {
          "score": 4,
          "label": "Exemplary",
          "description": "Demonstrates exceptional understanding with sophisticated application",
          "indicators": ["Uses terminology correctly", "Makes complex connections", "Shows deep insight"]
        },
        {
          "score": 3,
          "label": "Proficient",
          "description": "Shows solid understanding with good application",
          "indicators": ["Uses terminology mostly correctly", "Makes appropriate connections", "Shows good understanding"]
        },
        {
          "score": 2,
          "label": "Developing",
          "description": "Shows basic understanding with limited application",
          "indicators": ["Uses some terminology correctly", "Makes simple connections", "Shows partial understanding"]
        },
        {
          "score": 1,
          "label": "Beginning",
          "description": "Shows minimal understanding with little application",
          "indicators": ["Limited use of terminology", "Few connections made", "Shows surface understanding"]
        }
      ]
    }
  ],
  "totalPoints": {{totalPoints}},
  "type": "analytic"
}`,
  variables: ['topic', 'assessmentType', 'learningObjectives', 'targetAudience', 'totalPoints']
};

// ============================================================================
// Analytics Templates
// ============================================================================

export const QUESTION_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: 'question_analysis',
  template: `Analyze this question's performance data and provide educational insights.

Question Data:
Type: {{questionType}}
Correct Answer Rate: {{correctRate}}%
Average Response Time: {{avgTime}} seconds
Difficulty Level: {{difficulty}}
Response Distribution: {{responseDistribution}}

Student Responses Sample:
{{studentResponses}}

Provide analysis as JSON:
{
  "performanceAnalysis": "Overall assessment of how students performed",
  "difficultyAssessment": "Whether actual difficulty matches intended difficulty",
  "discriminationAnalysis": "How well this question differentiates between high and low performers",
  "commonErrors": ["Most frequent wrong answers or misconceptions"],
  "recommendations": ["Specific suggestions for improvement"],
  "flags": ["too_easy", "too_hard", "poor_discrimination", "confusing"],
  "suggestedRevisions": "Specific recommendations for improving the question"
}`,
  variables: ['questionType', 'correctRate', 'avgTime', 'difficulty', 'responseDistribution', 'studentResponses']
};

// ============================================================================
// Template Management
// ============================================================================

export const QUESTION_TEMPLATES = new Map<string, PromptTemplate>([
  ['multiple_choice', MULTIPLE_CHOICE_TEMPLATE],
  ['true_false', TRUE_FALSE_TEMPLATE],
  ['fill_in_blank', FILL_IN_BLANK_TEMPLATE],
  ['short_answer', SHORT_ANSWER_TEMPLATE],
  ['essay', ESSAY_TEMPLATE],
  ['coding_challenge', CODING_CHALLENGE_TEMPLATE],
  ['case_study', CASE_STUDY_TEMPLATE],
]);

export const ASSESSMENT_TEMPLATES = new Map<string, PromptTemplate>([
  ['structure', ASSESSMENT_STRUCTURE_TEMPLATE],
  ['rubric', RUBRIC_TEMPLATE],
]);

export const ANALYSIS_TEMPLATES = new Map<string, PromptTemplate>([
  ['question_analysis', QUESTION_ANALYSIS_TEMPLATE],
]);

/**
 * Get a question generation template by type
 */
export function getQuestionTemplate(type: string): PromptTemplate | undefined {
  return QUESTION_TEMPLATES.get(type);
}

/**
 * Get an assessment template by name
 */
export function getAssessmentTemplate(name: string): PromptTemplate | undefined {
  return ASSESSMENT_TEMPLATES.get(name);
}

/**
 * Get an analysis template by name
 */
export function getAnalysisTemplate(name: string): PromptTemplate | undefined {
  return ANALYSIS_TEMPLATES.get(name);
}

/**
 * Validate that all required variables are provided for a template
 */
export function validateTemplateVariables(
  template: PromptTemplate,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing = template.variables.filter(variable => !(variable in variables));
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get all available question types
 */
export function getAvailableQuestionTypes(): string[] {
  return Array.from(QUESTION_TEMPLATES.keys());
}

/**
 * Get template requirements for a specific question type
 */
export function getTemplateRequirements(type: string): string[] {
  const template = QUESTION_TEMPLATES.get(type);
  return template ? template.variables : [];
}