/**
 * Test Setup for AI Course Platform
 * Comprehensive testing environment setup
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/course_platform_test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Global test database instance
let prismaClient: PrismaClient;
let testDbProcess: any;

// Mock implementations for external services
export const mockGeminiService = {
  generateCourseSuggestions: vi.fn(),
  generateLessonContent: vi.fn(),
  analyzeContent: vi.fn(),
  generateAssessment: vi.fn(),
  chatAssistant: vi.fn()
};

export const mockVideoService = {
  uploadVideo: vi.fn(),
  getVideoContent: vi.fn(),
  generateTranscription: vi.fn(),
  generateChapters: vi.fn(),
  trackInteraction: vi.fn(),
  getVideoAnalytics: vi.fn()
};

export const mockCollaborationProvider = {
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  getRoomStatus: vi.fn(),
  createSharedText: vi.fn(),
  createSharedMap: vi.fn(),
  createSharedArray: vi.fn()
};

export const mockAnalyticsEngine = {
  getCourseAnalytics: vi.fn(),
  getUserEngagement: vi.fn(),
  getPlatformAnalytics: vi.fn(),
  generateLearningInsights: vi.fn()
};

export const mockAdaptiveLearningEngine = {
  getLearnerProfile: vi.fn(),
  updateLearnerProfile: vi.fn(),
  generateRecommendations: vi.fn(),
  adaptContent: vi.fn(),
  identifyKnowledgeGaps: vi.fn(),
  predictOptimalDifficulty: vi.fn()
};

// Test data factories
export const createTestUser = (overrides: any = {}) => ({
  id: `user_${Math.random().toString(36).substr(2, 9)}`,
  email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
  name: 'Test User',
  role: 'student',
  password: 'hashed_password',
  isActive: true,
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestCourse = (overrides: any = {}) => ({
  id: `course_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Course',
  description: 'A test course for automated testing',
  difficulty: 'intermediate',
  estimatedDuration: 120,
  category: 'programming',
  tags: ['javascript', 'testing'],
  price: 99.99,
  currency: 'USD',
  isPublished: true,
  instructorId: createTestUser({ role: 'instructor' }).id,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestLesson = (courseId: string, overrides: any = {}) => ({
  id: `lesson_${Math.random().toString(36).substr(2, 9)}`,
  courseId,
  title: 'Test Lesson',
  content: 'This is test lesson content',
  videoUrl: 'https://example.com/video.mp4',
  estimatedDuration: 30,
  orderIndex: 1,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestEnrollment = (userId: string, courseId: string, overrides: any = {}) => ({
  id: `enrollment_${Math.random().toString(36).substr(2, 9)}`,
  userId,
  courseId,
  status: 'active',
  enrolledAt: new Date(),
  completedAt: null,
  progress: 0,
  ...overrides
});

export const createTestAssessment = (lessonId: string, overrides: any = {}) => ({
  id: `assessment_${Math.random().toString(36).substr(2, 9)}`,
  lessonId,
  title: 'Test Assessment',
  description: 'A test assessment',
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      points: 1
    }
  ],
  timeLimit: 600, // 10 minutes
  passingScore: 70,
  maxAttempts: 3,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Database utilities
export const cleanDatabase = async () => {
  if (!prismaClient) return;

  // Clean up in reverse dependency order
  await prismaClient.assessmentResult.deleteMany();
  await prismaClient.assessment.deleteMany();
  await prismaClient.progress.deleteMany();
  await prismaClient.enrollment.deleteMany();
  await prismaClient.lesson.deleteMany();
  await prismaClient.course.deleteMany();
  await prismaClient.user.deleteMany();
};

export const seedTestData = async () => {
  if (!prismaClient) return;

  // Create test users
  const instructor = await prismaClient.user.create({
    data: createTestUser({ role: 'instructor' })
  });

  const student = await prismaClient.user.create({
    data: createTestUser({ role: 'student' })
  });

  // Create test course
  const course = await prismaClient.course.create({
    data: createTestCourse({ instructorId: instructor.id })
  });

  // Create test lessons
  const lesson1 = await prismaClient.lesson.create({
    data: createTestLesson(course.id, { orderIndex: 1 })
  });

  const lesson2 = await prismaClient.lesson.create({
    data: createTestLesson(course.id, { orderIndex: 2 })
  });

  // Create test assessment
  const assessment = await prismaClient.assessment.create({
    data: createTestAssessment(lesson1.id)
  });

  // Create test enrollment
  await prismaClient.enrollment.create({
    data: createTestEnrollment(student.id, course.id)
  });

  return {
    instructor,
    student,
    course,
    lessons: [lesson1, lesson2],
    assessment
  };
};

// HTTP utilities for API testing
export const createAuthHeaders = (token?: string) => {
  const authToken = token || 'test-jwt-token';
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
};

export const makeApiRequest = async (
  url: string,
  options: RequestInit & { token?: string } = {}
) => {
  const { token, ...fetchOptions } = options;

  const response = await fetch(`http://localhost:3000${url}`, {
    ...fetchOptions,
    headers: {
      ...createAuthHeaders(token),
      ...fetchOptions.headers
    }
  });

  const data = await response.json();
  return { response, data };
};

// Mock external services
export const setupMocks = () => {
  // Mock Gemini AI Service
  vi.mock('@/lib/ai/gemini-service', () => ({
    geminiService: mockGeminiService,
    default: mockGeminiService
  }));

  // Mock Video Service
  vi.mock('@/lib/video/video-service', () => ({
    videoService: mockVideoService,
    default: mockVideoService
  }));

  // Mock Collaboration Provider
  vi.mock('@/lib/collaboration/yjs-provider', () => ({
    collaborationProvider: mockCollaborationProvider,
    default: mockCollaborationProvider
  }));

  // Mock Analytics Engine
  vi.mock('@/lib/analytics/analytics-engine', () => ({
    analyticsEngine: mockAnalyticsEngine,
    default: mockAnalyticsEngine
  }));

  // Mock Adaptive Learning Engine
  vi.mock('@/lib/learning/adaptive-engine', () => ({
    adaptiveLearningEngine: mockAdaptiveLearningEngine,
    default: mockAdaptiveLearningEngine
  }));

  // Mock Next.js router
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn()
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => new URLSearchParams())
  }));

  // Mock local storage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Set up default mock implementations
  mockGeminiService.generateCourseSuggestions.mockResolvedValue([
    {
      title: 'Test Course',
      description: 'A test course',
      outline: ['Topic 1', 'Topic 2'],
      estimatedDuration: 120,
      difficulty: 'intermediate',
      prerequisites: []
    }
  ]);

  mockVideoService.getVideoContent.mockResolvedValue({
    id: 'test-video',
    lessonId: 'test-lesson',
    title: 'Test Video',
    description: 'A test video',
    url: 'https://example.com/video.mp4',
    duration: 1800,
    status: 'ready'
  });

  mockAnalyticsEngine.getCourseAnalytics.mockResolvedValue({
    courseId: 'test-course',
    title: 'Test Course',
    totalEnrollments: 100,
    completionRate: 0.8,
    averageScore: 0.85
  });
};

// Global test hooks
beforeAll(async () => {
  // Set up mocks
  setupMocks();

  // Initialize test database
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Start test database (if using Docker)
  if (process.env.USE_TEST_DB_CONTAINER === 'true') {
    testDbProcess = spawn('docker-compose', [
      '-f', 'docker-compose.test.yml',
      'up', '-d', 'test-db'
    ]);

    // Wait for database to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Run database migrations
  // This would typically be done via Prisma migrate
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Clean up database
  if (prismaClient) {
    await cleanDatabase();
    await prismaClient.$disconnect();
  }

  // Stop test database
  if (testDbProcess) {
    spawn('docker-compose', [
      '-f', 'docker-compose.test.yml',
      'down'
    ]);
  }

  // Clean up mocks
  vi.clearAllMocks();
  vi.resetAllMocks();
});

beforeEach(async () => {
  // Reset mocks before each test
  vi.clearAllMocks();

  // Clean and seed test data
  await cleanDatabase();
  await seedTestData();
});

afterEach(async () => {
  // Clean up after each test
  vi.clearAllMocks();
});

// Export utilities
export {
  prismaClient,
  vi
};