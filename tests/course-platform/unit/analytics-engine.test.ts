/**
 * Unit Tests for Analytics Engine
 * Tests course analytics, user engagement, and learning insights
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsEngine } from '@/lib/analytics/analytics-engine';
import type {
  CourseAnalytics,
  UserEngagement,
  PlatformAnalytics,
  LearningInsights,
  AnalyticsFilters,
  EngagementMetric
} from '@/lib/analytics/analytics-engine';

// Mock Prisma client
const mockPrisma = {
  course: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  enrollment: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  progress: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  assessmentResult: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  user: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  lesson: {
    findMany: vi.fn()
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

describe('AnalyticsEngine', () => {
  let engine: AnalyticsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AnalyticsEngine();

    // Setup default mock data
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course123',
      title: 'JavaScript Fundamentals',
      description: 'Learn JavaScript basics',
      difficulty: 'beginner',
      estimatedDuration: 120,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    });
  });

  describe('Course Analytics', () => {
    it('should generate comprehensive course analytics', async () => {
      const mockEnrollments = [
        { userId: 'user1', enrolledAt: new Date('2024-01-02'), completedAt: new Date('2024-01-20') },
        { userId: 'user2', enrolledAt: new Date('2024-01-03'), completedAt: null },
        { userId: 'user3', enrolledAt: new Date('2024-01-04'), completedAt: new Date('2024-01-25') }
      ];

      const mockAssessmentResults = [
        { userId: 'user1', score: 0.85, completedAt: new Date('2024-01-18') },
        { userId: 'user2', score: 0.72, completedAt: new Date('2024-01-10') },
        { userId: 'user3', score: 0.91, completedAt: new Date('2024-01-22') }
      ];

      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);
      mockPrisma.assessmentResult.findMany.mockResolvedValue(mockAssessmentResults);
      mockPrisma.enrollment.count.mockResolvedValue(3);

      const analytics = await engine.getCourseAnalytics('course123');

      expect(analytics).toMatchObject({
        courseId: 'course123',
        title: 'JavaScript Fundamentals',
        totalEnrollments: 3,
        completionRate: expect.closeTo(0.67, 2), // 2 out of 3 completed
        averageScore: expect.closeTo(0.83, 2),   // Average of scores
        averageCompletionTime: expect.any(Number),
        dropoffPoints: expect.any(Array),
        engagementMetrics: expect.objectContaining({
          averageTimeSpent: expect.any(Number),
          lessonCompletionRates: expect.any(Array),
          mostReviewedLessons: expect.any(Array)
        }),
        learningOutcomes: expect.objectContaining({
          skillsAcquired: expect.any(Array),
          knowledgeRetention: expect.any(Number),
          practicalApplication: expect.any(Number)
        })
      });
    });

    it('should calculate time-based analytics correctly', async () => {
      const mockProgress = [
        { userId: 'user1', lessonId: 'lesson1', startedAt: new Date('2024-01-01T10:00:00'), completedAt: new Date('2024-01-01T11:00:00') },
        { userId: 'user1', lessonId: 'lesson2', startedAt: new Date('2024-01-02T10:00:00'), completedAt: new Date('2024-01-02T11:30:00') },
        { userId: 'user2', lessonId: 'lesson1', startedAt: new Date('2024-01-01T14:00:00'), completedAt: new Date('2024-01-01T15:30:00') }
      ];

      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);
      mockPrisma.enrollment.findMany.mockResolvedValue([
        { userId: 'user1', enrolledAt: new Date('2024-01-01'), completedAt: new Date('2024-01-02') },
        { userId: 'user2', enrolledAt: new Date('2024-01-01'), completedAt: null }
      ]);

      const analytics = await engine.getCourseAnalytics('course123');

      expect(analytics.averageCompletionTime).toBeGreaterThan(0);
      expect(analytics.engagementMetrics.averageTimeSpent).toBeGreaterThan(0);
    });

    it('should identify lesson dropoff points', async () => {
      const mockLessons = [
        { id: 'lesson1', orderIndex: 1, title: 'Introduction' },
        { id: 'lesson2', orderIndex: 2, title: 'Basics' },
        { id: 'lesson3', orderIndex: 3, title: 'Advanced' }
      ];

      const mockProgress = [
        { lessonId: 'lesson1', userId: 'user1', completedAt: new Date() },
        { lessonId: 'lesson1', userId: 'user2', completedAt: new Date() },
        { lessonId: 'lesson1', userId: 'user3', completedAt: new Date() },
        { lessonId: 'lesson2', userId: 'user1', completedAt: new Date() },
        { lessonId: 'lesson2', userId: 'user2', completedAt: new Date() },
        { lessonId: 'lesson3', userId: 'user1', completedAt: new Date() }
      ];

      mockPrisma.lesson.findMany.mockResolvedValue(mockLessons);
      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);

      const analytics = await engine.getCourseAnalytics('course123');

      expect(analytics.dropoffPoints).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lessonId: 'lesson3',
            dropoffRate: expect.closeTo(0.67, 2) // 2 out of 3 didn't complete lesson 3
          })
        ])
      );
    });

    it('should handle courses with no enrollments', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValue([]);
      mockPrisma.enrollment.count.mockResolvedValue(0);
      mockPrisma.assessmentResult.findMany.mockResolvedValue([]);

      const analytics = await engine.getCourseAnalytics('course123');

      expect(analytics.totalEnrollments).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageScore).toBe(0);
    });
  });

  describe('User Engagement Analytics', () => {
    it('should calculate comprehensive user engagement metrics', async () => {
      const mockEnrollments = [
        { courseId: 'course1', enrolledAt: new Date('2024-01-01'), status: 'completed' },
        { courseId: 'course2', enrolledAt: new Date('2024-01-15'), status: 'active' }
      ];

      const mockProgress = [
        { lessonId: 'lesson1', startedAt: new Date('2024-01-01T10:00:00'), completedAt: new Date('2024-01-01T11:00:00') },
        { lessonId: 'lesson2', startedAt: new Date('2024-01-02T10:00:00'), completedAt: new Date('2024-01-02T11:30:00') }
      ];

      const mockAssessmentResults = [
        { score: 0.85, completedAt: new Date('2024-01-05') },
        { score: 0.78, completedAt: new Date('2024-01-12') }
      ];

      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);
      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);
      mockPrisma.assessmentResult.findMany.mockResolvedValue(mockAssessmentResults);

      const engagement = await engine.getUserEngagement('user123');

      expect(engagement).toMatchObject({
        userId: 'user123',
        totalCourses: 2,
        completedCourses: 1,
        averageScore: expect.closeTo(0.815, 3),
        studyStreak: expect.any(Number),
        totalStudyTime: expect.any(Number),
        engagementScore: expect.any(Number),
        learningVelocity: expect.any(Number),
        activityPattern: expect.objectContaining({
          mostActiveDay: expect.any(String),
          mostActiveHour: expect.any(Number),
          averageSessionDuration: expect.any(Number)
        }),
        achievements: expect.any(Array)
      });
    });

    it('should track study streaks correctly', async () => {
      const mockProgress = [
        { completedAt: new Date('2024-01-01') },
        { completedAt: new Date('2024-01-02') },
        { completedAt: new Date('2024-01-03') },
        // Gap here
        { completedAt: new Date('2024-01-05') },
        { completedAt: new Date('2024-01-06') }
      ];

      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);

      const engagement = await engine.getUserEngagement('user123');

      expect(engagement.studyStreak).toBeGreaterThanOrEqual(2); // Current streak
    });

    it('should calculate learning velocity', async () => {
      const mockProgress = [
        { completedAt: new Date('2024-01-01') },
        { completedAt: new Date('2024-01-01') }, // Same day
        { completedAt: new Date('2024-01-02') },
        { completedAt: new Date('2024-01-03') }
      ];

      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);

      const engagement = await engine.getUserEngagement('user123');

      expect(engagement.learningVelocity).toBeGreaterThan(0);
    });

    it('should identify user achievements', async () => {
      const mockEnrollments = Array(10).fill(null).map((_, i) => ({
        courseId: `course${i}`,
        status: 'completed',
        completedAt: new Date(`2024-01-${i + 1}`)
      }));

      const mockAssessmentResults = [
        { score: 1.0 }, // Perfect score
        { score: 0.95 },
        { score: 0.98 }
      ];

      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);
      mockPrisma.assessmentResult.findMany.mockResolvedValue(mockAssessmentResults);

      const engagement = await engine.getUserEngagement('user123');

      expect(engagement.achievements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'course_completion_milestone',
            title: expect.stringContaining('10')
          }),
          expect.objectContaining({
            type: 'perfect_score',
            title: expect.stringContaining('Perfect')
          })
        ])
      );
    });
  });

  describe('Platform Analytics', () => {
    it('should generate comprehensive platform analytics', async () => {
      mockPrisma.user.count.mockResolvedValue(1500);
      mockPrisma.course.findMany.mockResolvedValue([
        { id: 'course1', category: 'programming' },
        { id: 'course2', category: 'design' },
        { id: 'course3', category: 'programming' }
      ]);
      mockPrisma.enrollment.count.mockResolvedValue(5000);

      const mockEnrollments = [
        { enrolledAt: new Date('2024-01-01'), completedAt: new Date('2024-01-10') },
        { enrolledAt: new Date('2024-01-02'), completedAt: null },
        { enrolledAt: new Date('2024-01-03'), completedAt: new Date('2024-01-15') }
      ];
      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const analytics = await engine.getPlatformAnalytics();

      expect(analytics).toMatchObject({
        totalUsers: 1500,
        totalCourses: 3,
        totalEnrollments: 5000,
        overallCompletionRate: expect.any(Number),
        userGrowth: expect.objectContaining({
          daily: expect.any(Array),
          weekly: expect.any(Array),
          monthly: expect.any(Array)
        }),
        popularCategories: expect.arrayContaining([
          expect.objectContaining({
            category: 'programming',
            courseCount: 2,
            enrollmentCount: expect.any(Number)
          })
        ]),
        revenueMetrics: expect.objectContaining({
          totalRevenue: expect.any(Number),
          averageRevenuePerUser: expect.any(Number),
          monthlyRecurringRevenue: expect.any(Number)
        })
      });
    });

    it('should calculate user growth trends', async () => {
      const mockUsers = [
        { createdAt: new Date('2024-01-01') },
        { createdAt: new Date('2024-01-01') },
        { createdAt: new Date('2024-01-02') },
        { createdAt: new Date('2024-01-03') },
        { createdAt: new Date('2024-01-03') },
        { createdAt: new Date('2024-01-03') }
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const analytics = await engine.getPlatformAnalytics();

      expect(analytics.userGrowth.daily).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(Date),
            newUsers: expect.any(Number),
            totalUsers: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('Learning Insights', () => {
    it('should generate actionable learning insights', async () => {
      const mockData = {
        enrollments: [
          { courseId: 'course1', userId: 'user1', completedAt: new Date() },
          { courseId: 'course1', userId: 'user2', completedAt: null }
        ],
        assessments: [
          { courseId: 'course1', averageScore: 0.75, topic: 'javascript' },
          { courseId: 'course2', averageScore: 0.85, topic: 'react' }
        ],
        progress: [
          { lessonId: 'lesson1', userId: 'user1', timeSpent: 3600 },
          { lessonId: 'lesson1', userId: 'user2', timeSpent: 5400 }
        ]
      };

      mockPrisma.enrollment.findMany.mockResolvedValue(mockData.enrollments);
      mockPrisma.assessmentResult.findMany.mockResolvedValue(mockData.assessments);
      mockPrisma.progress.findMany.mockResolvedValue(mockData.progress);

      const insights = await engine.generateLearningInsights();

      expect(insights).toMatchObject({
        completionTrends: expect.objectContaining({
          trend: expect.any(String),
          percentage: expect.any(Number),
          factors: expect.any(Array)
        }),
        difficultyCurve: expect.objectContaining({
          peakDifficulty: expect.any(String),
          dropoffPoints: expect.any(Array),
          recommendations: expect.any(Array)
        }),
        engagementPatterns: expect.objectContaining({
          optimalSessionLength: expect.any(Number),
          bestStudyTimes: expect.any(Array),
          contentPreferences: expect.any(Array)
        }),
        learningEffectiveness: expect.objectContaining({
          mostEffectiveFormats: expect.any(Array),
          skillTransferRates: expect.any(Array),
          retentionMetrics: expect.any(Object)
        }),
        recommendations: expect.any(Array)
      });
    });

    it('should identify optimal learning patterns', async () => {
      const mockProgress = [
        {
          completedAt: new Date('2024-01-01T09:00:00'),
          timeSpent: 3600,
          score: 0.9
        },
        {
          completedAt: new Date('2024-01-01T14:00:00'),
          timeSpent: 1800,
          score: 0.7
        },
        {
          completedAt: new Date('2024-01-02T09:00:00'),
          timeSpent: 3600,
          score: 0.85
        }
      ];

      mockPrisma.progress.findMany.mockResolvedValue(mockProgress);

      const insights = await engine.generateLearningInsights();

      expect(insights.engagementPatterns.optimalSessionLength).toBeCloseTo(3600, -2);
      expect(insights.engagementPatterns.bestStudyTimes).toContain(9); // 9 AM
    });
  });

  describe('Filtered Analytics', () => {
    it('should apply date range filters correctly', async () => {
      const filters: AnalyticsFilters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        courseCategory: 'programming'
      };

      const analytics = await engine.getCourseAnalytics('course123', filters);

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enrolledAt: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          })
        })
      );
    });

    it('should filter by user demographics', async () => {
      const filters: AnalyticsFilters = {
        userRole: 'student',
        experienceLevel: 'beginner'
      };

      await engine.getUserEngagement('user123', filters);

      // Should apply appropriate filters to database queries
      expect(mockPrisma.enrollment.findMany).toHaveBeenCalled();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache analytics results for performance', async () => {
      // First call
      await engine.getCourseAnalytics('course123');

      // Second call (should use cache)
      await engine.getCourseAnalytics('course123');

      // Database should only be called once per unique query
      expect(mockPrisma.course.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets efficiently', async () => {
      const largeEnrollmentSet = Array(10000).fill(null).map((_, i) => ({
        userId: `user${i}`,
        enrolledAt: new Date('2024-01-01'),
        completedAt: i % 2 === 0 ? new Date('2024-01-15') : null
      }));

      mockPrisma.enrollment.findMany.mockResolvedValue(largeEnrollmentSet);

      const startTime = Date.now();
      const analytics = await engine.getCourseAnalytics('course123');
      const endTime = Date.now();

      expect(analytics).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should invalidate cache when data changes', async () => {
      await engine.getCourseAnalytics('course123');

      // Simulate data change
      await engine.invalidateCache('course123');

      await engine.getCourseAnalytics('course123');

      // Should query database again after cache invalidation
      expect(mockPrisma.course.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.enrollment.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        engine.getCourseAnalytics('course123')
      ).rejects.toThrow('Failed to fetch course analytics');
    });

    it('should handle invalid course IDs', async () => {
      mockPrisma.course.findFirst.mockResolvedValue(null);

      await expect(
        engine.getCourseAnalytics('invalid-course')
      ).rejects.toThrow('Course not found');
    });

    it('should validate date range filters', async () => {
      const invalidFilters: AnalyticsFilters = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01') // End before start
      };

      await expect(
        engine.getCourseAnalytics('course123', invalidFilters)
      ).rejects.toThrow('Invalid date range');
    });

    it('should handle missing data gracefully', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValue([]);
      mockPrisma.progress.findMany.mockResolvedValue([]);
      mockPrisma.assessmentResult.findMany.mockResolvedValue([]);

      const analytics = await engine.getCourseAnalytics('course123');

      expect(analytics.totalEnrollments).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageScore).toBe(0);
    });
  });
});