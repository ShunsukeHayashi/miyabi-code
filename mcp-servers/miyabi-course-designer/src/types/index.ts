/**
 * CourseDesigner Agent Types
 * @module types
 */

import { z } from 'zod';

// ============================================================================
// Course Input Types
// ============================================================================

export const CourseInputSchema = z.object({
  topic: z.string().describe('Main course topic'),
  targetAudience: z.string().describe('Target student demographic and skill level'),
  duration: z.object({
    weeks: z.number().min(1).max(52).default(8),
    hoursPerWeek: z.number().min(1).max(40).default(3),
  }).optional().describe('Course duration and time commitment'),
  learningObjectives: z.array(z.string()).optional().describe('Specific learning goals'),
  prerequisites: z.array(z.string()).optional().describe('Required knowledge or skills'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  format: z.object({
    includeVideos: z.boolean().default(true),
    includeAssessments: z.boolean().default(true),
    includeProjects: z.boolean().default(true),
    includeDiscussions: z.boolean().default(true),
  }).optional().describe('Content formats to include'),
  preferences: z.object({
    language: z.string().default('en'),
    tone: z.enum(['formal', 'casual', 'academic', 'conversational']).default('conversational'),
    interactivity: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional().describe('Content generation preferences'),
});

export type CourseInput = z.infer<typeof CourseInputSchema>;

// ============================================================================
// Course Structure Types
// ============================================================================

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['video', 'text', 'interactive', 'assessment', 'project']),
  content: z.string(),
  duration: z.number(),
  resources: z.array(z.string()).optional(),
});

export const ModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  estimatedHours: z.number(),
  lessons: z.array(LessonSchema),
});

export const CourseStructureSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.object({
    weeks: z.number(),
    totalHours: z.number(),
  }),
  modules: z.array(ModuleSchema),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type CourseStructure = z.infer<typeof CourseStructureSchema>;

// ============================================================================
// Content Types
// ============================================================================

export const VideoScriptSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  script: z.string(),
  visualCues: z.array(z.string()).optional(),
  duration: z.number(),
});

export const TextContentSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  content: z.string(),
  readingTime: z.number(),
});

export const ExerciseSchema = z.object({
  lessonId: z.string(),
  type: z.enum(['practice', 'project', 'discussion']),
  title: z.string(),
  instructions: z.string(),
  expectedOutput: z.string(),
  rubric: z.string().optional(),
});

export const ContentSchema = z.object({
  videoScripts: z.array(VideoScriptSchema).optional(),
  textContent: z.array(TextContentSchema).optional(),
  exercises: z.array(ExerciseSchema).optional(),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;
export type TextContent = z.infer<typeof TextContentSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Content = z.infer<typeof ContentSchema>;

// ============================================================================
// Assessment Types
// ============================================================================

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay', 'code']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const AssessmentSchema = z.object({
  moduleId: z.string(),
  type: z.enum(['quiz', 'assignment', 'project', 'peer_review']),
  title: z.string(),
  description: z.string(),
  questions: z.array(QuestionSchema),
  passingScore: z.number().min(0).max(100),
});

export type Question = z.infer<typeof QuestionSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;

// ============================================================================
// Output Types
// ============================================================================

export const MetadataSchema = z.object({
  generationTimestamp: z.string(),
  aiModelUsed: z.string(),
  contentQualityScore: z.number().min(0).max(100),
  estimatedCompletionRate: z.number().min(0).max(100),
  tags: z.array(z.string()),
  scormCompatible: z.boolean(),
  accessibilityCompliant: z.boolean(),
});

export const RecommendationsSchema = z.object({
  contentImprovements: z.array(z.string()),
  engagementOptimizations: z.array(z.string()),
  learningPathSuggestions: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const CourseOutputSchema = z.object({
  courseStructure: CourseStructureSchema,
  content: ContentSchema,
  assessments: z.array(AssessmentSchema).optional(),
  metadata: MetadataSchema,
  recommendations: RecommendationsSchema,
});

export type Metadata = z.infer<typeof MetadataSchema>;
export type Recommendations = z.infer<typeof RecommendationsSchema>;
export type CourseOutput = z.infer<typeof CourseOutputSchema>;

// ============================================================================
// Generation Context Types
// ============================================================================

export interface GenerationContext {
  topic: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tone: 'formal' | 'casual' | 'academic' | 'conversational';
  includeVideos: boolean;
  includeAssessments: boolean;
  includeProjects: boolean;
  includeDiscussions: boolean;
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
// AI Model Types
// ============================================================================

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
}

export interface ContentTemplate {
  type: 'course_structure' | 'lesson_content' | 'video_script' | 'assessment' | 'exercise';
  template: PromptTemplate;
  postProcessing?: (content: string) => string;
}