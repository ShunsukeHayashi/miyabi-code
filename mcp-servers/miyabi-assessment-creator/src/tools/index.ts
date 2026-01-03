/**
 * MCP Tools for AssessmentCreator Agent
 * @module tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// ============================================================================
// Tool Schemas
// ============================================================================

// Generate Assessment Tool
export const GenerateAssessmentSchema = z.object({
  topic: z.string().describe('The subject or topic for the assessment'),
  learningObjectives: z.array(z.string()).describe('Specific learning goals to assess'),
  targetAudience: z.string().describe('Target student demographic and skill level'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Overall difficulty level'),
  assessmentType: z.enum(['formative', 'summative', 'diagnostic', 'peer', 'self']).describe('Type of assessment'),
  questionTypes: z.array(z.enum([
    'multiple_choice',
    'true_false',
    'fill_in_blank',
    'short_answer',
    'essay',
    'coding_challenge',
    'matching',
    'ordering',
    'case_study'
  ])).describe('Types of questions to generate'),
  questionCount: z.object({
    total: z.number().min(1).max(100).describe('Total number of questions'),
    perType: z.record(z.number()).optional().describe('Specific count per question type')
  }).describe('Question count configuration'),
  bloomsDistribution: z.object({
    remember: z.number().min(0).max(1).default(0.2),
    understand: z.number().min(0).max(1).default(0.3),
    apply: z.number().min(0).max(1).default(0.3),
    analyze: z.number().min(0).max(1).default(0.1),
    evaluate: z.number().min(0).max(1).default(0.05),
    create: z.number().min(0).max(1).default(0.05)
  }).optional().describe('Distribution of Bloom\'s taxonomy levels'),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(1).default(0.3),
    medium: z.number().min(0).max(1).default(0.5),
    hard: z.number().min(0).max(1).default(0.2),
    expert: z.number().min(0).max(1).default(0.0)
  }).optional().describe('Distribution of difficulty levels'),
  timeLimit: z.number().optional().describe('Time limit in minutes'),
  allowMultipleAttempts: z.boolean().default(false).describe('Allow multiple attempts'),
  showCorrectAnswers: z.boolean().default(true).describe('Show correct answers after submission'),
  generateRubrics: z.boolean().default(true).describe('Generate rubrics for subjective questions'),
  includeAnalytics: z.boolean().default(true).describe('Include quality analytics'),
  preferences: z.object({
    language: z.string().default('en').describe('Content language'),
    tone: z.enum(['formal', 'casual', 'academic', 'conversational']).default('academic').describe('Content tone'),
    includeHints: z.boolean().default(true).describe('Include hints for complex questions'),
    includeExplanations: z.boolean().default(true).describe('Include explanations for answers')
  }).optional().describe('Content generation preferences'),
  contentSource: z.object({
    courseId: z.string().optional().describe('Related course ID'),
    moduleId: z.string().optional().describe('Related module ID'),
    lessonIds: z.array(z.string()).optional().describe('Related lesson IDs'),
    externalContent: z.string().optional().describe('External content to base questions on')
  }).optional().describe('Source content for question generation')
});

// Grade Submissions Tool
export const GradeSubmissionsSchema = z.object({
  assessmentId: z.string().describe('Assessment ID'),
  questions: z.array(z.any()).describe('Assessment questions'),
  submissions: z.array(z.object({
    studentId: z.string().describe('Student identifier'),
    submissionId: z.string().describe('Submission identifier'),
    responses: z.array(z.object({
      questionId: z.string().describe('Question ID'),
      response: z.union([
        z.string(),
        z.array(z.string()),
        z.boolean(),
        z.number(),
        z.record(z.any())
      ]).describe('Student response'),
      timeSpent: z.number().optional().describe('Time spent on question in seconds'),
      attempts: z.number().default(1).describe('Number of attempts')
    })).describe('Student responses'),
    submissionTime: z.string().describe('Submission timestamp'),
    timeSpent: z.number().describe('Total time spent in minutes')
  })).describe('Student submissions to grade'),
  gradingConfig: z.object({
    strictMode: z.boolean().default(false).describe('Use strict grading mode'),
    allowPartialCredit: z.boolean().default(true).describe('Allow partial credit'),
    includeFeedback: z.boolean().default(true).describe('Include detailed feedback'),
    feedbackLevel: z.enum(['minimal', 'standard', 'detailed']).default('standard').describe('Level of feedback detail'),
    rubricWeighting: z.boolean().default(true).describe('Use rubric-based weighting'),
    aiGradingForSubjective: z.boolean().default(true).describe('Use AI grading for subjective questions'),
    batchSize: z.number().default(10).describe('Batch processing size'),
    timeoutMs: z.number().default(30000).describe('Timeout in milliseconds'),
    retryAttempts: z.number().default(2).describe('Number of retry attempts')
  }).optional().describe('Grading configuration options')
});

// Generate Analytics Tool
export const GenerateAnalyticsSchema = z.object({
  assessmentId: z.string().describe('Assessment ID'),
  questions: z.array(z.any()).describe('Assessment questions'),
  results: z.array(z.any()).describe('Assessment results/submissions'),
  includeRecommendations: z.boolean().default(true).describe('Include improvement recommendations'),
  includePredictive: z.boolean().default(false).describe('Include predictive analytics'),
  analysisType: z.enum(['basic', 'comprehensive', 'predictive']).default('comprehensive').describe('Type of analysis to perform'),
  focusAreas: z.array(z.enum([
    'question_performance',
    'student_performance',
    'content_gaps',
    'difficulty_calibration',
    'engagement_patterns',
    'learning_outcomes'
  ])).optional().describe('Specific areas to focus analysis on')
});

// Optimize Questions Tool
export const OptimizeQuestionsSchema = z.object({
  questions: z.array(z.any()).describe('Questions to optimize'),
  performanceData: z.array(z.any()).describe('Performance data for optimization'),
  optimizationGoals: z.array(z.enum([
    'improve_clarity',
    'adjust_difficulty',
    'enhance_discrimination',
    'reduce_bias',
    'increase_engagement',
    'align_objectives'
  ])).default(['improve_clarity', 'adjust_difficulty']).describe('Optimization objectives'),
  priorityLevel: z.enum(['high', 'medium', 'low']).default('medium').describe('Priority level for optimizations to apply'),
  preserveOriginal: z.boolean().default(true).describe('Preserve original questions alongside optimized versions')
});

// Validate Assessment Tool
export const ValidateAssessmentSchema = z.object({
  assessment: z.any().describe('Assessment to validate'),
  validationCriteria: z.object({
    checkAlignment: z.boolean().default(true).describe('Check learning objective alignment'),
    checkDifficulty: z.boolean().default(true).describe('Validate difficulty distribution'),
    checkBias: z.boolean().default(true).describe('Check for potential bias'),
    checkAccessibility: z.boolean().default(true).describe('Check accessibility compliance'),
    checkTechnical: z.boolean().default(true).describe('Check technical correctness')
  }).optional().describe('Validation criteria'),
  standards: z.array(z.enum([
    'bloom_taxonomy',
    'wcag_accessibility',
    'fair_testing',
    'academic_integrity',
    'data_privacy'
  ])).optional().describe('Standards to validate against')
});

// Get Question Bank Tool
export const GetQuestionBankSchema = z.object({
  topic: z.string().optional().describe('Filter by topic'),
  questionType: z.enum([
    'multiple_choice',
    'true_false',
    'fill_in_blank',
    'short_answer',
    'essay',
    'coding_challenge',
    'matching',
    'ordering',
    'case_study'
  ]).optional().describe('Filter by question type'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().describe('Filter by difficulty'),
  bloomsLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional().describe('Filter by Bloom\'s level'),
  limit: z.number().default(50).describe('Maximum number of questions to return'),
  includeMetadata: z.boolean().default(true).describe('Include question metadata'),
  sortBy: z.enum(['created', 'performance', 'difficulty', 'usage']).default('created').describe('Sort criteria'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order')
});

// Export all schemas
export const ToolSchemas = {
  GenerateAssessmentSchema,
  GradeSubmissionsSchema,
  GenerateAnalyticsSchema,
  OptimizeQuestionsSchema,
  ValidateAssessmentSchema,
  GetQuestionBankSchema
};

// ============================================================================
// MCP Tool Definitions
// ============================================================================

export const ASSESSMENT_CREATOR_TOOLS: Tool[] = [
  {
    name: 'generate_assessment',
    description: 'Generate a comprehensive AI-powered assessment with intelligent question creation, Bloom\'s taxonomy alignment, and difficulty calibration. Creates assessments for various educational contexts with multiple question types and automatic rubric generation.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The subject or topic for the assessment (e.g., "Machine Learning Fundamentals", "European History")'
        },
        learningObjectives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific learning goals to assess (e.g., ["Understand supervised learning concepts", "Apply classification algorithms"])'
        },
        targetAudience: {
          type: 'string',
          description: 'Target student demographic and skill level (e.g., "Undergraduate computer science students", "High school biology students")'
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Overall difficulty level of the assessment'
        },
        assessmentType: {
          type: 'string',
          enum: ['formative', 'summative', 'diagnostic', 'peer', 'self'],
          description: 'Type of assessment to generate'
        },
        questionTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['multiple_choice', 'true_false', 'fill_in_blank', 'short_answer', 'essay', 'coding_challenge', 'matching', 'ordering', 'case_study']
          },
          description: 'Types of questions to generate in the assessment'
        },
        questionCount: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Total number of questions to generate'
            },
            perType: {
              type: 'object',
              additionalProperties: { type: 'number' },
              description: 'Specific count per question type (optional)'
            }
          },
          required: ['total']
        },
        bloomsDistribution: {
          type: 'object',
          properties: {
            remember: { type: 'number', minimum: 0, maximum: 1, default: 0.2 },
            understand: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
            apply: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
            analyze: { type: 'number', minimum: 0, maximum: 1, default: 0.1 },
            evaluate: { type: 'number', minimum: 0, maximum: 1, default: 0.05 },
            create: { type: 'number', minimum: 0, maximum: 1, default: 0.05 }
          },
          description: 'Distribution of Bloom\'s taxonomy levels (values should sum to 1.0)'
        },
        timeLimit: {
          type: 'number',
          description: 'Time limit for the assessment in minutes'
        },
        generateRubrics: {
          type: 'boolean',
          default: true,
          description: 'Generate detailed rubrics for subjective questions'
        },
        preferences: {
          type: 'object',
          properties: {
            language: { type: 'string', default: 'en', description: 'Content language' },
            tone: {
              type: 'string',
              enum: ['formal', 'casual', 'academic', 'conversational'],
              default: 'academic',
              description: 'Content tone and style'
            },
            includeHints: { type: 'boolean', default: true },
            includeExplanations: { type: 'boolean', default: true }
          }
        }
      },
      required: ['topic', 'learningObjectives', 'targetAudience', 'difficulty', 'assessmentType', 'questionTypes', 'questionCount']
    }
  },

  {
    name: 'grade_submissions',
    description: 'Automatically grade student assessment submissions using AI-powered evaluation with rubric-based scoring, partial credit calculation, and detailed feedback generation. Supports both objective and subjective question types.',
    inputSchema: {
      type: 'object',
      properties: {
        assessmentId: {
          type: 'string',
          description: 'Unique identifier for the assessment'
        },
        questions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Assessment questions with answer keys and rubrics'
        },
        submissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'string', description: 'Student identifier' },
              submissionId: { type: 'string', description: 'Submission identifier' },
              responses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    questionId: { type: 'string' },
                    response: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'array', items: { type: 'string' } },
                        { type: 'boolean' },
                        { type: 'number' },
                        { type: 'object' }
                      ]
                    },
                    timeSpent: { type: 'number', description: 'Time in seconds' },
                    attempts: { type: 'number', default: 1 }
                  },
                  required: ['questionId', 'response']
                }
              },
              submissionTime: { type: 'string', description: 'ISO timestamp' },
              timeSpent: { type: 'number', description: 'Total time in minutes' }
            },
            required: ['studentId', 'submissionId', 'responses', 'submissionTime', 'timeSpent']
          },
          description: 'Array of student submissions to grade'
        },
        gradingConfig: {
          type: 'object',
          properties: {
            strictMode: { type: 'boolean', default: false },
            allowPartialCredit: { type: 'boolean', default: true },
            includeFeedback: { type: 'boolean', default: true },
            feedbackLevel: {
              type: 'string',
              enum: ['minimal', 'standard', 'detailed'],
              default: 'standard'
            },
            aiGradingForSubjective: { type: 'boolean', default: true }
          }
        }
      },
      required: ['assessmentId', 'questions', 'submissions']
    }
  },

  {
    name: 'generate_analytics',
    description: 'Generate comprehensive learning analytics and performance insights from assessment data. Provides question performance analysis, student learning patterns, content gap identification, and actionable recommendations for improvement.',
    inputSchema: {
      type: 'object',
      properties: {
        assessmentId: {
          type: 'string',
          description: 'Assessment identifier'
        },
        questions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Assessment questions'
        },
        results: {
          type: 'array',
          items: { type: 'object' },
          description: 'Student assessment results and submissions'
        },
        includeRecommendations: {
          type: 'boolean',
          default: true,
          description: 'Include improvement recommendations'
        },
        includePredictive: {
          type: 'boolean',
          default: false,
          description: 'Include predictive analytics and risk assessment'
        },
        analysisType: {
          type: 'string',
          enum: ['basic', 'comprehensive', 'predictive'],
          default: 'comprehensive',
          description: 'Depth of analysis to perform'
        },
        focusAreas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['question_performance', 'student_performance', 'content_gaps', 'difficulty_calibration', 'engagement_patterns', 'learning_outcomes']
          },
          description: 'Specific areas to focus the analysis on'
        }
      },
      required: ['assessmentId', 'questions', 'results']
    }
  },

  {
    name: 'optimize_questions',
    description: 'Optimize existing assessment questions based on performance data and educational best practices. Uses AI analysis to improve question clarity, adjust difficulty, enhance discrimination, and reduce bias.',
    inputSchema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Questions to optimize'
        },
        performanceData: {
          type: 'array',
          items: { type: 'object' },
          description: 'Historical performance data for the questions'
        },
        optimizationGoals: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['improve_clarity', 'adjust_difficulty', 'enhance_discrimination', 'reduce_bias', 'increase_engagement', 'align_objectives']
          },
          default: ['improve_clarity', 'adjust_difficulty'],
          description: 'Specific optimization objectives'
        },
        priorityLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          default: 'medium',
          description: 'Priority level for optimizations to apply'
        },
        preserveOriginal: {
          type: 'boolean',
          default: true,
          description: 'Keep original questions alongside optimized versions'
        }
      },
      required: ['questions', 'performanceData']
    }
  },

  {
    name: 'validate_assessment',
    description: 'Validate assessment quality, alignment, accessibility, and compliance with educational standards. Provides comprehensive quality assurance for assessments before deployment.',
    inputSchema: {
      type: 'object',
      properties: {
        assessment: {
          type: 'object',
          description: 'Assessment to validate'
        },
        validationCriteria: {
          type: 'object',
          properties: {
            checkAlignment: { type: 'boolean', default: true, description: 'Check learning objective alignment' },
            checkDifficulty: { type: 'boolean', default: true, description: 'Validate difficulty distribution' },
            checkBias: { type: 'boolean', default: true, description: 'Check for potential bias' },
            checkAccessibility: { type: 'boolean', default: true, description: 'Check accessibility compliance' },
            checkTechnical: { type: 'boolean', default: true, description: 'Check technical correctness' }
          }
        },
        standards: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['bloom_taxonomy', 'wcag_accessibility', 'fair_testing', 'academic_integrity', 'data_privacy']
          },
          description: 'Educational and technical standards to validate against'
        }
      },
      required: ['assessment']
    }
  },

  {
    name: 'get_question_bank',
    description: 'Retrieve questions from the question bank with filtering, sorting, and metadata options. Useful for building custom assessments or analyzing question performance across multiple assessments.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Filter questions by topic or subject area'
        },
        questionType: {
          type: 'string',
          enum: ['multiple_choice', 'true_false', 'fill_in_blank', 'short_answer', 'essay', 'coding_challenge', 'matching', 'ordering', 'case_study'],
          description: 'Filter by question type'
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard', 'expert'],
          description: 'Filter by difficulty level'
        },
        bloomsLevel: {
          type: 'string',
          enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
          description: 'Filter by Bloom\'s taxonomy level'
        },
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum number of questions to return'
        },
        includeMetadata: {
          type: 'boolean',
          default: true,
          description: 'Include question performance metadata'
        },
        sortBy: {
          type: 'string',
          enum: ['created', 'performance', 'difficulty', 'usage'],
          default: 'created',
          description: 'Sort criteria'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
          description: 'Sort order'
        }
      }
    }
  }
];

// Export individual tools
export {
  ASSESSMENT_CREATOR_TOOLS as default,
  ASSESSMENT_CREATOR_TOOLS
};