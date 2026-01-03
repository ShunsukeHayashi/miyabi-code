// Re-export Prisma generated types for easier imports
export * from '@prisma/client';

// Additional custom types for the application
export interface CourseWithDetails {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  status: CourseStatus;
  level: CourseLevel;
  language: string;
  estimatedTime: number | null;
  price: number | null;
  featured: boolean;
  slug: string;
  creator: {
    id: string;
    displayName: string | null;
    avatar: string | null;
  };
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      icon: string | null;
    };
  }>;
  lessons: Array<{
    id: string;
    title: string;
    duration: number | null;
    order: number;
    type: LessonType;
    isPreview: boolean;
  }>;
  _count: {
    enrollments: number;
    reviews: number;
  };
  avgRating?: number;
}

export interface UserProgressSummary {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  timeSpent: number; // in seconds
  lastAccessedAt: Date;
  isCompleted: boolean;
  enrolledAt: Date;
}

export interface AssessmentQuestion {
  id: number;
  type: 'multiple_choice' | 'essay' | 'code_submission' | 'true_false';
  question: string;
  options?: string[]; // For multiple choice
  correct_answer?: number | string;
  points: number;
  requirements?: string; // For assignments/projects
}

export interface UserAssessmentAnswer {
  questionId: number;
  answer: number | string | string[]; // Depends on question type
}

export interface LearningPathWithCourses {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: CourseLevel;
  estimatedTime: number | null;
  featured: boolean;
  courses: Array<{
    order: number;
    required: boolean;
    course: CourseWithDetails;
  }>;
}

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

export interface StudentDashboard {
  activeEnrollments: number;
  completedCourses: number;
  totalCertificates: number;
  totalStudyTime: number;
  recentProgress: UserProgressSummary[];
  upcomingDeadlines: Array<{
    courseTitle: string;
    assessmentTitle: string;
    dueDate: Date;
  }>;
}

export interface CourseCategoryTree {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  courseCount: number;
  children: CourseCategoryTree[];
}

// Import Prisma enums for re-export
import {
  UserRole,
  CourseStatus,
  CourseLevel,
  LessonType,
  AssessmentType,
  EnrollmentStatus,
  PaymentStatus,
  InstructorRole,
  InstructorPermission,
  SettingType
} from '@prisma/client';

export {
  UserRole,
  CourseStatus,
  CourseLevel,
  LessonType,
  AssessmentType,
  EnrollmentStatus,
  PaymentStatus,
  InstructorRole,
  InstructorPermission,
  SettingType
};