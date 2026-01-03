/**
 * Zod validation schemas for AI Course API
 * Issue #1298: API Input Validation
 */

import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
});

// Course schemas
export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  thumbnail: z.string().url().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  language: z.string().default('en'),
  estimatedTime: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  featured: z.boolean().default(false),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string().uuid()).optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().omit({ slug: true });

export const CourseQuerySchema = PaginationSchema.merge(SearchSchema).extend({
  featured: z.coerce.boolean().optional(),
  creatorId: z.string().uuid().optional(),
});

// Lesson schemas
export const CreateLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.string().min(1),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(1),
  type: z.enum(['TEXT', 'VIDEO', 'AUDIO', 'INTERACTIVE', 'QUIZ', 'ASSIGNMENT']).default('TEXT'),
  isPreview: z.boolean().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().optional(),
  })).optional(),
  notes: z.string().optional(),
});

export const UpdateLessonSchema = CreateLessonSchema.partial().omit({ order: true });

// Enrollment schemas
export const EnrollCourseSchema = z.object({
  paymentId: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  amount: z.number().min(0).optional(),
});

export const UpdateProgressSchema = z.object({
  lessonId: z.string().uuid().optional(),
  completedAt: z.string().datetime().optional(),
  timeSpent: z.number().int().min(0).optional(),
  bookmarked: z.boolean().optional(),
  notes: z.string().optional(),
});

export const EnrollmentQuerySchema = PaginationSchema.extend({
  status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED']).optional(),
  courseId: z.string().uuid().optional(),
});

// Assessment schemas
export const CreateAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number(), z.boolean()]).optional(),
    points: z.number().min(0).default(1),
    explanation: z.string().optional(),
  })),
  maxScore: z.number().int().min(0),
  passingScore: z.number().int().min(0).optional(),
  timeLimit: z.number().int().min(1).optional(),
  attempts: z.number().int().min(1).default(3),
  type: z.enum(['QUIZ', 'ASSIGNMENT', 'PROJECT', 'FINAL_EXAM']).default('QUIZ'),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial();

export const SubmitAssessmentSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  timeSpent: z.number().int().min(0).optional(),
});

// User schemas
export const UserProgressQuerySchema = PaginationSchema.extend({
  courseId: z.string().uuid().optional(),
  completed: z.coerce.boolean().optional(),
});

// Analytics schemas
export const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Export types
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CourseQuery = z.infer<typeof CourseQuerySchema>;
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;
export type EnrollCourseInput = z.infer<typeof EnrollCourseSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
export type EnrollmentQuery = z.infer<typeof EnrollmentQuerySchema>;
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;
export type SubmitAssessmentInput = z.infer<typeof SubmitAssessmentSchema>;
export type UserProgressQuery = z.infer<typeof UserProgressQuerySchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;