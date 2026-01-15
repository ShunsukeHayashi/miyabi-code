/**
 * Course API Integration Utilities
 * Issue #1299: Comprehensive course management UI components
 */

import type {
  CourseWithRelations,
  CourseQuery,
  CourseFormData,
  LessonFormData,
  AssessmentSubmission,
  EnrollmentData,
  ReviewFormData,
  ProgressData,
  CourseAnalytics,
  StudentDashboard,
  ApiResponse,
  SearchSuggestion,
} from './types';

// Base API configuration
const API_BASE = '/api';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {return null;}
  return localStorage.getItem('miyabi-auth-token');
}

// Create authorized headers
function createAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Generic API request wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: createAuthHeaders(),
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Course API functions
export const courseApi = {
  // Get courses with filters and pagination
  async getCourses(query: CourseQuery = {}): Promise<ApiResponse<CourseWithRelations[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<CourseWithRelations[]>(`/courses?${searchParams.toString()}`);
  },

  // Get single course by ID
  async getCourse(courseId: string): Promise<ApiResponse<CourseWithRelations>> {
    return apiRequest<CourseWithRelations>(`/courses/${courseId}`);
  },

  // Get course by slug
  async getCourseBySlug(slug: string): Promise<ApiResponse<CourseWithRelations>> {
    return apiRequest<CourseWithRelations>(`/courses/slug/${slug}`);
  },

  // Create new course (instructor only)
  async createCourse(data: CourseFormData): Promise<ApiResponse<CourseWithRelations>> {
    return apiRequest<CourseWithRelations>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update course
  async updateCourse(
    courseId: string,
    data: Partial<CourseFormData>,
  ): Promise<ApiResponse<CourseWithRelations>> {
    return apiRequest<CourseWithRelations>(`/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete course
  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  // Get course analytics (instructor only)
  async getCourseAnalytics(courseId: string): Promise<ApiResponse<CourseAnalytics>> {
    return apiRequest<CourseAnalytics>(`/courses/${courseId}/analytics`);
  },
};

// Lesson API functions
export const lessonApi = {
  // Get lessons for a course
  async getLessons(courseId: string): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>(`/courses/${courseId}/lessons`);
  },

  // Get single lesson
  async getLesson(courseId: string, lessonId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/lessons/${lessonId}`);
  },

  // Create lesson (instructor only)
  async createLesson(courseId: string, data: LessonFormData): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update lesson
  async updateLesson(
    courseId: string,
    lessonId: string,
    data: Partial<LessonFormData>,
  ): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete lesson
  async deleteLesson(courseId: string, lessonId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  },
};

// Enrollment API functions
export const enrollmentApi = {
  // Enroll in course
  async enrollInCourse(data: EnrollmentData): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${data.courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get enrollment status
  async getEnrollmentStatus(courseId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/enrollment-status`);
  },

  // Update enrollment progress
  async updateProgress(
    enrollmentId: string,
    progressData: Partial<ProgressData>,
  ): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/enrollments/${enrollmentId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(progressData),
    });
  },

  // Get user's enrollments
  async getUserEnrollments(): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>('/enrollments/my-courses');
  },
};

// Assessment API functions
export const assessmentApi = {
  // Get assessment by ID
  async getAssessment(assessmentId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/assessments/${assessmentId}`);
  },

  // Submit assessment answers
  async submitAssessment(
    assessmentId: string,
    submission: AssessmentSubmission,
  ): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },

  // Get assessment results
  async getAssessmentResults(assessmentId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/assessments/${assessmentId}/results`);
  },
};

// Review API functions
export const reviewApi = {
  // Get course reviews
  async getCourseReviews(courseId: string): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>(`/courses/${courseId}/reviews`);
  },

  // Submit course review
  async submitReview(courseId: string, data: ReviewFormData): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update review
  async updateReview(
    courseId: string,
    reviewId: string,
    data: Partial<ReviewFormData>,
  ): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/courses/${courseId}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete review
  async deleteReview(courseId: string, reviewId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/courses/${courseId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

// Student dashboard API functions
export const studentApi = {
  // Get student dashboard data
  async getDashboardData(): Promise<ApiResponse<StudentDashboard>> {
    return apiRequest<StudentDashboard>('/student/dashboard');
  },

  // Get certificates
  async getCertificates(): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>('/student/certificates');
  },

  // Get recent activity
  async getRecentActivity(): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>('/student/activity');
  },
};

// Search API functions
export const searchApi = {
  // Search courses
  async searchCourses(query: string): Promise<ApiResponse<CourseWithRelations[]>> {
    return apiRequest<CourseWithRelations[]>(`/search/courses?q=${encodeURIComponent(query)}`);
  },

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>> {
    return apiRequest<SearchSuggestion[]>(`/search/suggestions?q=${encodeURIComponent(query)}`);
  },

  // Get popular searches
  async getPopularSearches(): Promise<ApiResponse<string[]>> {
    return apiRequest<string[]>('/search/popular');
  },
};

// Category API functions
export const categoryApi = {
  // Get all categories
  async getCategories(): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>('/categories');
  },

  // Get category with courses
  async getCategoryWithCourses(categorySlug: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/categories/${categorySlug}/courses`);
  },
};

// Instructor API functions
export const instructorApi = {
  // Get instructor dashboard
  async getDashboardData(): Promise<ApiResponse<any>> {
    return apiRequest<any>('/instructor/dashboard');
  },

  // Get instructor's courses
  async getMyCourses(): Promise<ApiResponse<CourseWithRelations[]>> {
    return apiRequest<CourseWithRelations[]>('/instructor/courses');
  },

  // Get students for a course
  async getCourseStudents(courseId: string): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>(`/instructor/courses/${courseId}/students`);
  },

  // Get course performance metrics
  async getCourseMetrics(courseId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/instructor/courses/${courseId}/metrics`);
  },
};

// File upload API functions
export const uploadApi = {
  // Upload course thumbnail
  async uploadThumbnail(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    return fetch(`${API_BASE}/upload/thumbnail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  // Upload lesson video
  async uploadVideo(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('video', file);

    return fetch(`${API_BASE}/upload/video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  // Upload lesson attachment
  async uploadAttachment(file: File): Promise<ApiResponse<{ url: string; name: string; size: number }>> {
    const formData = new FormData();
    formData.append('attachment', file);

    return fetch(`${API_BASE}/upload/attachment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },
};

// React Query keys for caching
export const queryKeys = {
  courses: ['courses'] as const,
  course: (id: string) => ['course', id] as const,
  courseBySlug: (slug: string) => ['course', 'slug', slug] as const,
  courseAnalytics: (id: string) => ['course', 'analytics', id] as const,
  lessons: (courseId: string) => ['lessons', courseId] as const,
  lesson: (courseId: string, lessonId: string) => ['lesson', courseId, lessonId] as const,
  enrollments: ['enrollments'] as const,
  enrollment: (courseId: string) => ['enrollment', courseId] as const,
  reviews: (courseId: string) => ['reviews', courseId] as const,
  studentDashboard: ['student', 'dashboard'] as const,
  instructorDashboard: ['instructor', 'dashboard'] as const,
  categories: ['categories'] as const,
  searchSuggestions: (query: string) => ['search', 'suggestions', query] as const,
};
