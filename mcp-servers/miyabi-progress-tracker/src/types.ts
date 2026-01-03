import { z } from 'zod';

// Base schemas
export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  enrollmentDate: z.date(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
  goals: z.array(z.string()).optional(),
  timezone: z.string().optional(),
});

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
});

export const LessonSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  contentType: z.enum(['video', 'text', 'interactive', 'quiz', 'assignment']),
  estimatedDuration: z.number(),
  order: z.number(),
  requirements: z.array(z.string()).optional(),
});

export const ProgressEntrySchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  lessonId: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  progress: z.number().min(0).max(100),
  timeSpent: z.number(),
  timestamp: z.date(),
  engagementScore: z.number().min(0).max(100).optional(),
  difficultyRating: z.number().min(1).max(5).optional(),
});

export const AssessmentResultSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  assessmentId: z.string(),
  score: z.number().min(0).max(100),
  timeSpent: z.number(),
  attempts: z.number(),
  timestamp: z.date(),
  answers: z.record(z.unknown()),
  feedback: z.string().optional(),
});

// Analytics schemas
export const LearningAnalyticsSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  totalTimeSpent: z.number(),
  averageEngagement: z.number(),
  completionRate: z.number(),
  learningVelocity: z.number(),
  knowledgeRetention: z.number(),
  skillMastery: z.record(z.number()),
  lastActive: z.date(),
  benchmark: z.any().optional(),
});

export const PredictionModelSchema = z.object({
  modelType: z.enum(['completion', 'success', 'risk', 'time_to_complete']),
  confidence: z.number().min(0).max(100),
  prediction: z.unknown(),
  factors: z.record(z.number()),
  timestamp: z.date(),
});

export const RecommendationSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  type: z.enum(['next_lesson', 'review_content', 'study_schedule', 'course_suggestion']),
  content: z.unknown(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
  expiresAt: z.date().optional(),
});

export const LearningPatternSchema = z.object({
  studentId: z.string(),
  patternType: z.enum(['study_time', 'engagement', 'performance', 'learning_path']),
  pattern: z.record(z.unknown()),
  strength: z.number().min(0).max(100),
  frequency: z.number(),
  lastOccurrence: z.date(),
});

export const InsightSchema = z.object({
  id: z.string(),
  type: z.enum(['performance', 'engagement', 'prediction', 'recommendation', 'alert']),
  title: z.string(),
  description: z.string(),
  data: z.record(z.unknown()),
  actionable: z.boolean(),
  priority: z.enum(['info', 'warning', 'critical']),
  timestamp: z.date(),
  affectedEntities: z.array(z.string()),
});

// Configuration schemas
export const AnalyticsConfigSchema = z.object({
  updateInterval: z.number().default(300), // 5 minutes
  batchSize: z.number().default(100),
  retentionPeriod: z.number().default(365), // days
  privacyMode: z.boolean().default(true),
  enablePredictions: z.boolean().default(true),
  enableRecommendations: z.boolean().default(true),
  alertThresholds: z.object({
    lowEngagement: z.number().default(30),
    riskOfDropout: z.number().default(20),
    performanceDecline: z.number().default(15),
  }).default({
    lowEngagement: 30,
    riskOfDropout: 20,
    performanceDecline: 15,
  }),
});

export const ModelConfigSchema = z.object({
  completionModel: z.object({
    algorithm: z.enum(['regression', 'neural_network', 'ensemble']).default('ensemble'),
    features: z.array(z.string()),
    trainingInterval: z.number().default(7), // days
  }).default({
    algorithm: 'ensemble',
    features: ['timeSpent', 'engagement', 'progress'],
    trainingInterval: 7,
  }),
  riskModel: z.object({
    algorithm: z.enum(['classification', 'clustering', 'ensemble']).default('ensemble'),
    riskThreshold: z.number().default(0.3),
    features: z.array(z.string()),
  }).default({
    algorithm: 'ensemble',
    riskThreshold: 0.3,
    features: ['daysSinceActive', 'engagement', 'completion'],
  }),
  recommendationModel: z.object({
    algorithm: z.enum(['collaborative', 'content_based', 'hybrid']).default('hybrid'),
    maxRecommendations: z.number().default(5),
    diversityWeight: z.number().default(0.3),
  }).default({
    algorithm: 'hybrid',
    maxRecommendations: 5,
    diversityWeight: 0.3,
  }),
});

// Type exports
export type Student = z.infer<typeof StudentSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
export type LearningAnalytics = z.infer<typeof LearningAnalyticsSchema>;
export type PredictionModel = z.infer<typeof PredictionModelSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type LearningPattern = z.infer<typeof LearningPatternSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// Dashboard and visualization types
export interface DashboardMetrics {
  totalStudents: number;
  totalCourses: number;
  totalProgress: number;
  averageCompletion: number;
  averageEngagement: number;
  atRiskStudents: number;
  topPerformers: number;
  recentActivity: number;
}

export interface PerformanceTrend {
  date: string;
  completion: number;
  engagement: number;
  performance: number;
  risk: number;
}

export interface StudentProfile {
  student: Student;
  analytics: LearningAnalytics;
  predictions: PredictionModel[];
  recommendations: Recommendation[];
  patterns: LearningPattern[];
  currentCourses: Course[];
  recentProgress: ProgressEntry[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CourseAnalytics {
  course: Course;
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  dropoffPoints: Array<{ lessonId: string; dropoffRate: number }>;
  engagementTrends: PerformanceTrend[];
  topChallenges: Array<{ area: string; difficulty: number }>;
}

// MCP Tool input/output types
export interface TrackProgressInput {
  studentId: string;
  courseId: string;
  lessonId?: string;
  status: ProgressEntry['status'];
  progress: number;
  timeSpent: number;
  engagementData?: Record<string, unknown>;
}

export interface AnalyzePerformanceInput {
  studentIds?: string[];
  courseIds?: string[];
  timeRange?: { start: Date; end: Date };
  metrics?: string[];
  includeComparisons?: boolean;
}

export interface GenerateRecommendationsInput {
  studentId: string;
  maxRecommendations?: number;
  types?: Recommendation['type'][];
  forceRefresh?: boolean;
}

export interface PredictOutcomesInput {
  studentIds?: string[];
  courseIds?: string[];
  predictionTypes: PredictionModel['modelType'][];
  confidence?: number;
}

export interface GetInsightsInput {
  scope: 'student' | 'course' | 'system';
  entityId?: string;
  insightTypes?: Insight['type'][];
  timeRange?: { start: Date; end: Date };
  priority?: Insight['priority'][];
}