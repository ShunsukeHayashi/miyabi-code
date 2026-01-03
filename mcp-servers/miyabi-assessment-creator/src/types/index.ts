/**
 * AssessmentCreator Agent Types
 * @module types
 */

import { z } from 'zod';

// ============================================================================
// Bloom's Taxonomy & Difficulty Types
// ============================================================================

export const BloomsTaxonomyLevel = z.enum([
  'remember',    // Recall facts and basic concepts
  'understand',  // Explain ideas or concepts
  'apply',       // Use information in new situations
  'analyze',     // Draw connections among ideas
  'evaluate',    // Justify a stand or decision
  'create'       // Produce new or original work
]);

export const DifficultyLevel = z.enum(['beginner', 'intermediate', 'advanced']);

export const CognitiveDifficulty = z.enum(['easy', 'medium', 'hard', 'expert']);

// ============================================================================
// Question Types & Schemas
// ============================================================================

export const BaseQuestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'multiple_choice',
    'true_false',
    'fill_in_blank',
    'short_answer',
    'essay',
    'coding_challenge',
    'matching',
    'ordering',
    'case_study'
  ]),
  question: z.string().describe('The question text/prompt'),
  bloomsLevel: BloomsTaxonomyLevel,
  difficulty: CognitiveDifficulty,
  points: z.number().min(1).default(1),
  timeEstimate: z.number().describe('Estimated time in minutes'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string()).min(2).max(10),
  correctAnswerIndex: z.number(),
  correctAnswer: z.string(),
  distractors: z.array(z.object({
    text: z.string(),
    reasoning: z.string().describe('Why this is a good distractor')
  })).optional(),
  explanation: z.string(),
  allowMultiple: z.boolean().default(false)
});

export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('true_false'),
  correctAnswer: z.boolean(),
  explanation: z.string(),
  requireJustification: z.boolean().default(false)
});

export const FillInBlankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('fill_in_blank'),
  questionWithBlanks: z.string().describe('Question with _____ placeholders'),
  correctAnswers: z.array(z.string()).describe('Acceptable answers for each blank'),
  caseSensitive: z.boolean().default(false),
  allowPartialCredit: z.boolean().default(true)
});

export const ShortAnswerQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('short_answer'),
  sampleAnswers: z.array(z.string()).describe('Example correct answers'),
  keyPoints: z.array(z.string()).describe('Key points that should be included'),
  maxWords: z.number().optional(),
  rubric: z.string().describe('Grading criteria')
});

export const EssayQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('essay'),
  prompt: z.string(),
  rubric: z.object({
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      points: z.number(),
      levels: z.array(z.object({
        score: z.number(),
        description: z.string()
      }))
    })),
    totalPoints: z.number()
  }),
  minWords: z.number().optional(),
  maxWords: z.number().optional(),
  timeLimit: z.number().optional()
});

export const CodingChallengeQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('coding_challenge'),
  problemStatement: z.string(),
  programmingLanguage: z.string(),
  starterCode: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false)
  })),
  solution: z.string(),
  hints: z.array(z.string()).optional()
});

export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('matching'),
  leftColumn: z.array(z.string()),
  rightColumn: z.array(z.string()),
  correctMatches: z.array(z.object({
    leftIndex: z.number(),
    rightIndex: z.number()
  }))
});

export const OrderingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('ordering'),
  items: z.array(z.string()),
  correctOrder: z.array(z.number()).describe('Indices in correct order')
});

export const CaseStudyQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('case_study'),
  scenario: z.string(),
  subQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['short_answer', 'essay', 'multiple_choice']),
    rubric: z.string(),
    points: z.number()
  }))
});

export const QuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  FillInBlankQuestionSchema,
  ShortAnswerQuestionSchema,
  EssayQuestionSchema,
  CodingChallengeQuestionSchema,
  MatchingQuestionSchema,
  OrderingQuestionSchema,
  CaseStudyQuestionSchema
]);

export type Question = z.infer<typeof QuestionSchema>;
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type FillInBlankQuestion = z.infer<typeof FillInBlankQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof ShortAnswerQuestionSchema>;
export type EssayQuestion = z.infer<typeof EssayQuestionSchema>;
export type CodingChallengeQuestion = z.infer<typeof CodingChallengeQuestionSchema>;

// ============================================================================
// Assessment Types
// ============================================================================

export const AssessmentConfigSchema = z.object({
  type: z.enum(['formative', 'summative', 'diagnostic', 'peer', 'self']),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  timeLimit: z.number().optional().describe('Time limit in minutes'),
  attempts: z.number().min(1).default(1),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showFeedback: z.enum(['immediate', 'after_submission', 'after_due_date']).default('after_submission'),
  allowReview: z.boolean().default(true),
  proctoring: z.object({
    required: z.boolean().default(false),
    lockdownBrowser: z.boolean().default(false),
    webcamMonitoring: z.boolean().default(false),
    screenRecording: z.boolean().default(false)
  }).optional()
});

export const AssessmentSchema = z.object({
  id: z.string(),
  config: AssessmentConfigSchema,
  questions: z.array(QuestionSchema),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.string(),
    courseId: z.string().optional(),
    moduleId: z.string().optional(),
    learningObjectives: z.array(z.string()),
    estimatedDuration: z.number(),
    totalPoints: z.number(),
    passingScore: z.number().min(0).max(100),
    difficultyDistribution: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number(),
      expert: z.number()
    }),
    bloomsDistribution: z.record(z.number())
  })
});

export type Assessment = z.infer<typeof AssessmentSchema>;
export type AssessmentConfig = z.infer<typeof AssessmentConfigSchema>;

// ============================================================================
// Auto-Grading Types
// ============================================================================

export const StudentResponseSchema = z.object({
  questionId: z.string(),
  response: z.union([
    z.string(),           // Text responses
    z.array(z.string()),  // Multiple selections
    z.boolean(),          // True/false
    z.number(),           // Numeric
    z.record(z.any())     // Complex responses
  ]),
  timeSpent: z.number().optional(),
  attempts: z.number().default(1)
});

export const GradingResultSchema = z.object({
  questionId: z.string(),
  score: z.number().min(0),
  maxScore: z.number(),
  isCorrect: z.boolean(),
  partialCredit: z.number().min(0).max(1).optional(),
  feedback: z.string(),
  detailedFeedback: z.object({
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
    improvement: z.string().optional(),
    resources: z.array(z.string()).optional()
  }).optional(),
  rubricScores: z.array(z.object({
    criterion: z.string(),
    score: z.number(),
    maxScore: z.number(),
    feedback: z.string()
  })).optional()
});

export const AssessmentResultSchema = z.object({
  assessmentId: z.string(),
  studentId: z.string(),
  submissionId: z.string(),
  questionResults: z.array(GradingResultSchema),
  overallScore: z.number(),
  maxScore: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  submissionTime: z.string(),
  timeSpent: z.number(),
  analytics: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.string()),
    bloomsPerformance: z.record(z.number()),
    difficultyPerformance: z.record(z.number())
  })
});

export type StudentResponse = z.infer<typeof StudentResponseSchema>;
export type GradingResult = z.infer<typeof GradingResultSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// ============================================================================
// Analytics Types
// ============================================================================

export const QuestionAnalyticsSchema = z.object({
  questionId: z.string(),
  responseCount: z.number(),
  correctRate: z.number().min(0).max(1),
  averageScore: z.number(),
  difficulty: z.number().min(0).max(1).describe('Actual difficulty based on responses'),
  discrimination: z.number().min(-1).max(1).describe('How well question discriminates'),
  distractorAnalysis: z.array(z.object({
    option: z.string(),
    selectionRate: z.number(),
    reasoning: z.string()
  })).optional(),
  commonWrongAnswers: z.array(z.string()).optional(),
  averageTimeSpent: z.number(),
  flags: z.array(z.enum(['too_easy', 'too_hard', 'poor_discrimination', 'confusing'])).optional()
});

export const AssessmentAnalyticsSchema = z.object({
  assessmentId: z.string(),
  responseCount: z.number(),
  averageScore: z.number(),
  scoreDistribution: z.array(z.object({
    range: z.string(),
    count: z.number()
  })),
  completionRate: z.number(),
  averageTimeSpent: z.number(),
  questionAnalytics: z.array(QuestionAnalyticsSchema),
  reliability: z.object({
    cronbachAlpha: z.number(),
    itemTotalCorrelations: z.array(z.number())
  }).optional(),
  validity: z.object({
    contentValidity: z.number(),
    constructValidity: z.number()
  }).optional(),
  recommendations: z.array(z.string())
});

export type QuestionAnalytics = z.infer<typeof QuestionAnalyticsSchema>;
export type AssessmentAnalytics = z.infer<typeof AssessmentAnalyticsSchema>;

// ============================================================================
// Input Types
// ============================================================================

export const AssessmentInputSchema = z.object({
  topic: z.string(),
  learningObjectives: z.array(z.string()),
  targetAudience: z.string(),
  difficulty: DifficultyLevel,
  assessmentType: z.enum(['formative', 'summative', 'diagnostic', 'peer', 'self']),
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
  ])),
  questionCount: z.object({
    total: z.number().min(1).max(100),
    perType: z.record(z.number()).optional()
  }),
  bloomsDistribution: z.object({
    remember: z.number().min(0).max(1).default(0.2),
    understand: z.number().min(0).max(1).default(0.3),
    apply: z.number().min(0).max(1).default(0.3),
    analyze: z.number().min(0).max(1).default(0.1),
    evaluate: z.number().min(0).max(1).default(0.05),
    create: z.number().min(0).max(1).default(0.05)
  }).optional(),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(1).default(0.3),
    medium: z.number().min(0).max(1).default(0.5),
    hard: z.number().min(0).max(1).default(0.2),
    expert: z.number().min(0).max(1).default(0.0)
  }).optional(),
  timeLimit: z.number().optional(),
  allowMultipleAttempts: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
  generateRubrics: z.boolean().default(true),
  includeAnalytics: z.boolean().default(true),
  contentSource: z.object({
    courseId: z.string().optional(),
    moduleId: z.string().optional(),
    lessonIds: z.array(z.string()).optional(),
    externalContent: z.string().optional()
  }).optional(),
  preferences: z.object({
    language: z.string().default('en'),
    tone: z.enum(['formal', 'casual', 'academic', 'conversational']).default('academic'),
    includeHints: z.boolean().default(true),
    includeExplanations: z.boolean().default(true)
  }).optional()
});

export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

// ============================================================================
// Generation Context Types
// ============================================================================

export interface GenerationContext {
  topic: string;
  learningObjectives: string[];
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tone: 'formal' | 'casual' | 'academic' | 'conversational';
  assessmentType: 'formative' | 'summative' | 'diagnostic' | 'peer' | 'self';
}

export interface GenerationStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

export interface GenerationProgress {
  steps: GenerationStep[];
  currentStep: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
}

// ============================================================================
// Rubric Types
// ============================================================================

export const RubricCriterionSchema = z.object({
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1).default(1),
  levels: z.array(z.object({
    score: z.number(),
    label: z.string(),
    description: z.string(),
    indicators: z.array(z.string())
  }))
});

export const RubricSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  criteria: z.array(RubricCriterionSchema),
  totalPoints: z.number(),
  type: z.enum(['holistic', 'analytic']).default('analytic')
});

export type Rubric = z.infer<typeof RubricSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

// ============================================================================
// Adaptive Assessment Types
// ============================================================================

export const AdaptiveConfigSchema = z.object({
  enabled: z.boolean().default(false),
  algorithm: z.enum(['irt', 'cat', 'simple']).default('simple'),
  targetAccuracy: z.number().min(0.5).max(0.95).default(0.8),
  minQuestions: z.number().min(5).default(10),
  maxQuestions: z.number().max(100).default(30),
  terminationCriteria: z.enum(['accuracy', 'confidence', 'questions']).default('accuracy')
});

export type AdaptiveConfig = z.infer<typeof AdaptiveConfigSchema>;

// ============================================================================
// Export All Types
// ============================================================================

export * from './index.js';