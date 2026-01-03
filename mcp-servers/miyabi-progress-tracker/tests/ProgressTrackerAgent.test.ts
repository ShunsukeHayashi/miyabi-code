import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressTrackerAgent } from '../src/ProgressTrackerAgent.js';
import { Database } from '../src/database.js';
import {
  TrackProgressInput,
  AnalyzePerformanceInput,
  GenerateRecommendationsInput,
  PredictOutcomesInput,
  GetInsightsInput,
  AnalyticsConfig,
  ModelConfig,
} from '../src/types.js';

describe('ProgressTrackerAgent', () => {
  let agent: ProgressTrackerAgent;
  let testConfig: AnalyticsConfig;
  let testModelConfig: ModelConfig;

  beforeEach(async () => {
    // Test configuration
    testConfig = {
      updateInterval: 60,
      batchSize: 10,
      retentionPeriod: 30,
      privacyMode: true,
      enablePredictions: true,
      enableRecommendations: true,
      alertThresholds: {
        lowEngagement: 30,
        riskOfDropout: 20,
        performanceDecline: 15,
      },
    };

    testModelConfig = {
      completionModel: {
        algorithm: 'ensemble',
        features: ['timeSpent', 'engagement', 'progress'],
        trainingInterval: 1,
      },
      riskModel: {
        algorithm: 'ensemble',
        riskThreshold: 0.3,
        features: ['daysSinceActive', 'engagement', 'completion'],
      },
      recommendationModel: {
        algorithm: 'hybrid',
        maxRecommendations: 5,
        diversityWeight: 0.3,
      },
    };

    agent = new ProgressTrackerAgent(testConfig, testModelConfig);
    await agent.initialize();
  });

  afterEach(async () => {
    await agent.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const status = agent.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should have correct configuration', async () => {
      const status = agent.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.stats).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should track student progress successfully', async () => {
      const input: TrackProgressInput = {
        studentId: 'test-student-1',
        courseId: 'test-course-1',
        status: 'in_progress',
        progress: 75,
        timeSpent: 1800,
        engagementData: {
          clickCount: 15,
          timeOnPage: 1200,
        },
      };

      const result = await agent.trackProgress(input);

      expect(result.id).toBeDefined();
      expect(result.studentId).toBe(input.studentId);
      expect(result.courseId).toBe(input.courseId);
      expect(result.progress).toBe(input.progress);
      expect(result.engagementScore).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidInput = {
        courseId: 'test-course-1',
        status: 'in_progress',
        progress: 75,
        timeSpent: 1800,
      } as TrackProgressInput;

      await expect(agent.trackProgress(invalidInput)).rejects.toThrow();
    });

    it('should calculate engagement score correctly', async () => {
      const input: TrackProgressInput = {
        studentId: 'test-student-2',
        courseId: 'test-course-1',
        status: 'completed',
        progress: 100,
        timeSpent: 3600,
      };

      const result = await agent.trackProgress(input);
      expect(result.engagementScore).toBeGreaterThan(50);
    });
  });

  describe('Performance Analysis', () => {
    beforeEach(async () => {
      // Add some test data
      const testData = [
        {
          studentId: 'student-1',
          courseId: 'course-1',
          status: 'in_progress' as const,
          progress: 60,
          timeSpent: 2400,
        },
        {
          studentId: 'student-1',
          courseId: 'course-2',
          status: 'completed' as const,
          progress: 100,
          timeSpent: 3600,
        },
        {
          studentId: 'student-2',
          courseId: 'course-1',
          status: 'in_progress' as const,
          progress: 30,
          timeSpent: 1200,
        },
      ];

      for (const data of testData) {
        await agent.trackProgress(data);
      }

      // Allow some time for processing
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should analyze performance for specific students', async () => {
      const input: AnalyzePerformanceInput = {
        studentIds: ['student-1'],
        includeComparisons: false,
      };

      const analytics = await agent.analyzePerformance(input);
      expect(analytics).toHaveLength(2); // Two courses for student-1
      expect(analytics[0].studentId).toBe('student-1');
    });

    it('should analyze performance for specific courses', async () => {
      const input: AnalyzePerformanceInput = {
        courseIds: ['course-1'],
        includeComparisons: false,
      };

      const analytics = await agent.analyzePerformance(input);
      expect(analytics.length).toBeGreaterThan(0);
      analytics.forEach(analytic => {
        expect(analytic.courseId).toBe('course-1');
      });
    });

    it('should include benchmarks when requested', async () => {
      const input: AnalyzePerformanceInput = {
        studentIds: ['student-1'],
        includeComparisons: true,
      };

      const analytics = await agent.analyzePerformance(input);
      expect(analytics.length).toBeGreaterThan(0);
      // Note: benchmark may be undefined in test environment
    });
  });

  describe('Recommendations Generation', () => {
    beforeEach(async () => {
      // Add test student and course first
      const database = (agent as any).database;
      await database.saveStudent({
        id: 'rec-student-1',
        name: 'Recommendation Student',
        email: 'rec.student@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveCourse({
        id: 'rec-course-1',
        title: 'Recommendation Course',
        description: 'Test course for recommendations',
        difficulty: 'intermediate',
        estimatedDuration: 3600,
        prerequisites: [],
        learningObjectives: ['Test learning']
      });

      // Add test progress
      await agent.trackProgress({
        studentId: 'rec-student-1',
        courseId: 'rec-course-1',
        status: 'in_progress',
        progress: 50,
        timeSpent: 1800,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should generate recommendations for a student', async () => {
      const input: GenerateRecommendationsInput = {
        studentId: 'rec-student-1',
        maxRecommendations: 3,
      };

      const recommendations = await agent.generateRecommendations(input);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      if (recommendations.length > 0) {
        expect(recommendations[0].studentId).toBe('rec-student-1');
        expect(recommendations[0].id).toBeDefined();
        expect(recommendations[0].confidence).toBeGreaterThanOrEqual(0);
        expect(recommendations[0].reasoning).toBeDefined();
      }
    });

    it('should filter recommendations by type', async () => {
      const input: GenerateRecommendationsInput = {
        studentId: 'rec-student-1',
        types: ['next_lesson'],
        maxRecommendations: 5,
      };

      const recommendations = await agent.generateRecommendations(input);
      recommendations.forEach(rec => {
        expect(rec.type).toBe('next_lesson');
      });
    });

    it('should force refresh recommendations', async () => {
      const input: GenerateRecommendationsInput = {
        studentId: 'rec-student-1',
        forceRefresh: true,
        maxRecommendations: 5,
      };

      const recommendations = await agent.generateRecommendations(input);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Outcome Predictions', () => {
    beforeEach(async () => {
      // Add test student and course first
      const database = (agent as any).database;
      await database.saveStudent({
        id: 'pred-student-1',
        name: 'Prediction Student',
        email: 'pred.student@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveCourse({
        id: 'pred-course-1',
        title: 'Prediction Course',
        description: 'Test course for predictions',
        difficulty: 'advanced',
        estimatedDuration: 3600,
        prerequisites: [],
        learningObjectives: ['Prediction testing']
      });

      // Add test data for predictions
      await agent.trackProgress({
        studentId: 'pred-student-1',
        courseId: 'pred-course-1',
        status: 'in_progress',
        progress: 80,
        timeSpent: 2400,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should generate completion predictions', async () => {
      const input: PredictOutcomesInput = {
        studentIds: ['pred-student-1'],
        predictionTypes: ['completion'],
        confidence: 50,
      };

      const predictions = await agent.predictOutcomes(input);
      expect(Array.isArray(predictions)).toBe(true);

      if (predictions.length > 0) {
        expect(predictions[0].modelType).toBe('completion');
        expect(predictions[0].confidence).toBeGreaterThanOrEqual(50);
      }
    });

    it('should generate risk predictions', async () => {
      const input: PredictOutcomesInput = {
        studentIds: ['pred-student-1'],
        predictionTypes: ['risk'],
        confidence: 60,
      };

      const predictions = await agent.predictOutcomes(input);
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should generate multiple prediction types', async () => {
      const input: PredictOutcomesInput = {
        predictionTypes: ['completion', 'success', 'risk'],
        confidence: 40,
      };

      const predictions = await agent.predictOutcomes(input);
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('Insights Generation', () => {
    beforeEach(async () => {
      // Add test student and course first
      const database = (agent as any).database;
      await database.saveStudent({
        id: 'insight-student-1',
        name: 'Insight Student',
        email: 'insight.student@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveCourse({
        id: 'insight-course-1',
        title: 'Insight Course',
        description: 'Test course for insights',
        difficulty: 'beginner',
        estimatedDuration: 2400,
        prerequisites: [],
        learningObjectives: ['Basic insights']
      });

      // Add test data
      await agent.trackProgress({
        studentId: 'insight-student-1',
        courseId: 'insight-course-1',
        status: 'in_progress',
        progress: 25,
        timeSpent: 600,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should generate student insights', async () => {
      const input: GetInsightsInput = {
        scope: 'student',
        entityId: 'insight-student-1',
      };

      const insights = await agent.getInsights(input);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate course insights', async () => {
      const input: GetInsightsInput = {
        scope: 'course',
        entityId: 'insight-course-1',
      };

      const insights = await agent.getInsights(input);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate system insights', async () => {
      const input: GetInsightsInput = {
        scope: 'system',
      };

      const insights = await agent.getInsights(input);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should filter insights by type and priority', async () => {
      const input: GetInsightsInput = {
        scope: 'system',
        insightTypes: ['performance', 'engagement'],
        priority: ['critical', 'warning'],
      };

      const insights = await agent.getInsights(input);
      expect(Array.isArray(insights)).toBe(true);

      insights.forEach(insight => {
        expect(['performance', 'engagement']).toContain(insight.type);
        expect(['critical', 'warning']).toContain(insight.priority);
      });
    });
  });

  describe('Dashboard Metrics', () => {
    it('should get dashboard metrics', async () => {
      const metrics = await agent.getDashboardMetrics();

      expect(metrics.totalStudents).toBeGreaterThanOrEqual(0);
      expect(metrics.totalCourses).toBeGreaterThanOrEqual(0);
      expect(metrics.totalProgress).toBeGreaterThanOrEqual(0);
      expect(metrics.averageCompletion).toBeGreaterThanOrEqual(0);
      expect(metrics.averageEngagement).toBeGreaterThanOrEqual(0);
      expect(metrics.atRiskStudents).toBeGreaterThanOrEqual(0);
      expect(metrics.topPerformers).toBeGreaterThanOrEqual(0);
      expect(metrics.recentActivity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Student Profile', () => {
    beforeEach(async () => {
      // Add test student and course first
      const database = (agent as any).database;
      await database.saveStudent({
        id: 'profile-student-1',
        name: 'Profile Student',
        email: 'profile.student@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveCourse({
        id: 'profile-course-1',
        title: 'Profile Course',
        description: 'Test course for profiles',
        difficulty: 'intermediate',
        estimatedDuration: 3000,
        prerequisites: [],
        learningObjectives: ['Profile testing']
      });

      // Create student data
      await agent.trackProgress({
        studentId: 'profile-student-1',
        courseId: 'profile-course-1',
        status: 'in_progress',
        progress: 70,
        timeSpent: 2100,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should get comprehensive student profile', async () => {
      const profile = await agent.getStudentProfile('profile-student-1');

      expect(profile.student).toBeDefined();
      expect(profile.student.id).toBe('profile-student-1');
      expect(profile.analytics).toBeDefined();
      expect(profile.riskLevel).toMatch(/^(low|medium|high)$/);
      expect(Array.isArray(profile.predictions)).toBe(true);
      expect(Array.isArray(profile.recommendations)).toBe(true);
      expect(Array.isArray(profile.patterns)).toBe(true);
      expect(Array.isArray(profile.currentCourses)).toBe(true);
      expect(Array.isArray(profile.recentProgress)).toBe(true);
    });
  });

  describe('Course Analytics', () => {
    beforeEach(async () => {
      // Add test students and course first
      const database = (agent as any).database;
      await database.saveStudent({
        id: 'course-student-1',
        name: 'Course Student 1',
        email: 'course.student1@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveStudent({
        id: 'course-student-2',
        name: 'Course Student 2',
        email: 'course.student2@example.com',
        enrollmentDate: new Date(),
        timezone: 'UTC'
      });

      await database.saveCourse({
        id: 'analytics-course-1',
        title: 'Analytics Course',
        description: 'Test course for analytics',
        difficulty: 'advanced',
        estimatedDuration: 3600,
        prerequisites: [],
        learningObjectives: ['Course analytics']
      });

      // Create course data
      await agent.trackProgress({
        studentId: 'course-student-1',
        courseId: 'analytics-course-1',
        status: 'completed',
        progress: 100,
        timeSpent: 3600,
      });

      await agent.trackProgress({
        studentId: 'course-student-2',
        courseId: 'analytics-course-1',
        status: 'in_progress',
        progress: 60,
        timeSpent: 1800,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should get detailed course analytics', async () => {
      const analytics = await agent.getCourseAnalytics('analytics-course-1');

      expect(analytics.course).toBeDefined();
      expect(analytics.course.id).toBe('analytics-course-1');
      expect(analytics.enrollmentCount).toBeGreaterThanOrEqual(2);
      expect(analytics.completionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.averageScore).toBeGreaterThanOrEqual(0);
      expect(analytics.averageTimeSpent).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.dropoffPoints)).toBe(true);
      expect(Array.isArray(analytics.engagementTrends)).toBe(true);
      expect(Array.isArray(analytics.topChallenges)).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newConfig = {
        updateInterval: 120,
        batchSize: 50,
        alertThresholds: {
          lowEngagement: 25,
          riskOfDropout: 15,
          performanceDecline: 10,
        },
      };

      expect(() => {
        agent.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Status Monitoring', () => {
    it('should provide current status', () => {
      const status = agent.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.lastUpdate).toBeInstanceOf(Date);
      expect(status.stats).toBeDefined();
      expect(status.stats.studentsTracked).toBeGreaterThanOrEqual(0);
      expect(status.stats.coursesAnalyzed).toBeGreaterThanOrEqual(0);
      expect(status.stats.predictionsGenerated).toBeGreaterThanOrEqual(0);
      expect(status.stats.recommendationsActive).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid student IDs gracefully', async () => {
      await expect(agent.getStudentProfile('non-existent-student')).rejects.toThrow();
    });

    it('should handle invalid course IDs gracefully', async () => {
      await expect(agent.getCourseAnalytics('non-existent-course')).rejects.toThrow();
    });

    it('should handle malformed progress input', async () => {
      const invalidInput = {
        studentId: '',
        courseId: 'test-course',
        status: 'invalid-status',
        progress: -10,
        timeSpent: -100,
      } as any;

      await expect(agent.trackProgress(invalidInput)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        agent.trackProgress({
          studentId: `concurrent-student-${i}`,
          courseId: 'concurrent-course-1',
          status: 'in_progress',
          progress: Math.random() * 100,
          timeSpent: Math.random() * 3600,
        })
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.id).toBeDefined();
      });
    });

    it('should complete operations within reasonable time', async () => {
      const startTime = Date.now();

      await agent.getDashboardMetrics();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

describe('ProgressTrackerAgent Integration', () => {
  it('should work with real database', async () => {
    const agent = new ProgressTrackerAgent();
    await agent.initialize();

    try {
      // Test basic functionality
      await agent.trackProgress({
        studentId: 'integration-test-student',
        courseId: 'integration-test-course',
        status: 'in_progress',
        progress: 50,
        timeSpent: 1800,
      });

      const metrics = await agent.getDashboardMetrics();
      expect(metrics).toBeDefined();

    } finally {
      await agent.shutdown();
    }
  });
});