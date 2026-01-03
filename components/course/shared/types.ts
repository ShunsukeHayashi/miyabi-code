/**
 * Course UI Component Types
 * Issue #1299: Comprehensive course management UI components
 */

import {
  Course,
  CourseStatus,
  CourseLevel,
  User,
  Category,
  Lesson,
  LessonType,
  Assessment,
  AssessmentType,
  Enrollment,
  EnrollmentStatus,
  UserProgress,
  Certificate,
  CourseReview,
  UserRole
} from '@prisma/client';

// Extended course type with relations
export interface CourseWithRelations extends Course {
  creator: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  categories: Category[];
  stats: {
    lessonsCount: number;
    enrollmentsCount: number;
    reviewsCount: number;
    averageRating?: number;
  };
  userProgress?: UserProgress;
  userEnrollment?: Enrollment;
}

// Lesson with relations
export interface LessonWithRelations extends Lesson {
  course: Pick<Course, 'id' | 'title' | 'slug'>;
  assessments?: Assessment[];
  userProgress?: UserProgress;
}

// Assessment with relations
export interface AssessmentWithRelations extends Assessment {
  lesson?: Pick<Lesson, 'id' | 'title'>;
  userAnswer?: {
    score: number | null;
    passed: boolean | null;
    completedAt: Date | null;
    attemptNumber: number;
  };
}

// Course query parameters
export interface CourseQuery {
  q?: string;
  category?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  featured?: boolean;
  creatorId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  language?: string;
}

// Course filters
export interface CourseFilters {
  categories: Category[];
  levels: CourseLevel[];
  priceRange: [number, number];
  languages: string[];
  ratings: number[];
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

// Course creation/update
export interface CourseFormData {
  title: string;
  description: string;
  thumbnail?: string;
  level: CourseLevel;
  language: string;
  estimatedTime?: number;
  price?: number;
  featured: boolean;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  categories: string[];
}

// Lesson creation/update
export interface LessonFormData {
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  type: LessonType;
  isPreview: boolean;
  attachments?: FileAttachment[];
  notes?: string;
}

// File attachment
export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// Progress tracking
export interface ProgressData {
  overall: number; // 0-100 percentage
  lessonsCompleted: number;
  totalLessons: number;
  timeSpent: number; // in seconds
  lastAccessedAt: Date;
  certificates: Certificate[];
}

// Assessment question types
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay' | 'code';

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
}

export interface AssessmentData {
  questions: AssessmentQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number;
  maxAttempts: number;
}

// User answer submission
export interface UserAnswerData {
  questionId: string;
  answer: string | string[];
}

export interface AssessmentSubmission {
  answers: UserAnswerData[];
  timeSpent: number; // in seconds
}

// Course analytics (for instructors)
export interface CourseAnalytics {
  enrollments: {
    total: number;
    thisMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  completions: {
    total: number;
    rate: number; // completion rate percentage
    averageTime: number; // in hours
  };
  revenue: {
    total: number;
    thisMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  ratings: {
    average: number;
    total: number;
    distribution: Record<number, number>; // rating -> count
  };
  engagement: {
    averageTimePerLesson: number;
    dropoffPoints: string[]; // lesson IDs where students commonly drop off
  };
}

// Student dashboard data
export interface StudentDashboard {
  enrolledCourses: CourseWithRelations[];
  recentActivity: {
    type: 'lesson' | 'assessment' | 'certificate';
    courseId: string;
    courseTitle: string;
    itemId: string;
    itemTitle: string;
    timestamp: Date;
  }[];
  achievements: {
    totalCertificates: number;
    totalCoursesCompleted: number;
    totalHoursLearned: number;
    streak: number; // consecutive days of activity
  };
}

// Video player state
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  quality: string;
  captions: boolean;
}

// Course review data
export interface ReviewFormData {
  rating: number; // 1-5 stars
  title?: string;
  comment?: string;
}

// Enrollment data
export interface EnrollmentData {
  courseId: string;
  paymentMethod?: 'free' | 'stripe' | 'paypal';
  couponCode?: string;
}

// Search suggestions
export interface SearchSuggestion {
  type: 'course' | 'category' | 'instructor';
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
}

// UI component props base
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Course card display modes
export type CourseCardMode = 'grid' | 'list' | 'compact';

// Course status colors
export const COURSE_STATUS_COLORS: Record<CourseStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

// Course level colors
export const COURSE_LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER: 'bg-blue-100 text-blue-800',
  INTERMEDIATE: 'bg-orange-100 text-orange-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  EXPERT: 'bg-red-100 text-red-800',
};

// Role permissions for UI
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  STUDENT: ['view-course', 'enroll', 'submit-assessment', 'view-progress'],
  INSTRUCTOR: ['create-course', 'edit-course', 'view-analytics', 'manage-students'],
  ADMIN: ['manage-all-courses', 'manage-users', 'view-system-analytics'],
  SUPER_ADMIN: ['full-access'],
};