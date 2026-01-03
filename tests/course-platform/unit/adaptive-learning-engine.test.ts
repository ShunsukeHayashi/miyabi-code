/**
 * Unit Tests for Adaptive Learning Engine
 * Tests personalized learning algorithms and recommendation system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveLearningEngine } from '@/lib/learning/adaptive-engine';
import type {
  LearnerProfile,
  LearningRecommendations,
  ContentDifficulty,
  KnowledgeGap,
  LearningPath,
  StudyPattern
} from '@/lib/learning/adaptive-engine';

// Mock Prisma client
const mockPrisma = {
  learnerProfile: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  progress: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  assessment: {
    findMany: vi.fn()
  },
  assessmentResult: {
    findMany: vi.fn()
  },
  lesson: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  course: {
    findMany: vi.fn()
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

describe('AdaptiveLearningEngine', () => {
  let engine: AdaptiveLearningEngine;

  const mockLearnerProfile: LearnerProfile = {
    userId: 'user123',
    learningStyle: 'visual',
    preferredDifficulty: 'intermediate',
    studyPatterns: {
      preferredTimeOfDay: 'morning',
      averageSessionDuration: 45,
      weeklyStudyHours: 10,
      consistencyScore: 0.8
    },
    knowledgeMap: {
      'javascript-basics': 0.9,
      'react-fundamentals': 0.7,
      'node-js': 0.3,
      'databases': 0.1
    },
    performanceMetrics: {
      averageScore: 0.82,
      completionRate: 0.85,
      retentionRate: 0.78,
      engagementLevel: 0.9
    },
    goals: [
      { topic: 'Full-stack development', targetScore: 0.8, deadline: new Date('2024-06-01') },
      { topic: 'API development', targetScore: 0.9, deadline: new Date('2024-05-15') }
    ],
    lastUpdated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AdaptiveLearningEngine();

    // Setup default mock returns
    mockPrisma.learnerProfile.findFirst.mockResolvedValue(mockLearnerProfile);
    mockPrisma.progress.findMany.mockResolvedValue([]);
    mockPrisma.assessmentResult.findMany.mockResolvedValue([]);
  });

  describe('Learner Profile Management', () => {
    it('should get learner profile for existing user', async () => {
      const profile = await engine.getLearnerProfile('user123');

      expect(profile).toEqual(mockLearnerProfile);
      expect(mockPrisma.learnerProfile.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });

    it('should create new learner profile for new user', async () => {
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(null);

      const newProfile = { ...mockLearnerProfile };
      mockPrisma.learnerProfile.create.mockResolvedValue(newProfile);

      const profile = await engine.getLearnerProfile('newUser');

      expect(profile).toEqual(newProfile);
      expect(mockPrisma.learnerProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'newUser',
          learningStyle: 'balanced',
          preferredDifficulty: 'beginner'
        })
      });
    });

    it('should update learner profile with new data', async () => {
      const updates = {
        learningStyle: 'kinesthetic' as const,
        preferredDifficulty: 'advanced' as const,
        studyPatterns: {
          preferredTimeOfDay: 'evening',
          averageSessionDuration: 60,
          weeklyStudyHours: 15,
          consistencyScore: 0.9
        }
      };

      const updatedProfile = { ...mockLearnerProfile, ...updates };
      mockPrisma.learnerProfile.update.mockResolvedValue(updatedProfile);

      const result = await engine.updateLearnerProfile('user123', updates);

      expect(result).toEqual(updatedProfile);
      expect(mockPrisma.learnerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        data: expect.objectContaining(updates)
      });
    });
  });

  describe('Learning Recommendations', () => {
    it('should generate personalized course recommendations', async () => {
      const availableCourses = [
        { id: 'course1', title: 'Advanced React', difficulty: 'advanced', topics: ['react', 'hooks'] },
        { id: 'course2', title: 'Node.js Fundamentals', difficulty: 'intermediate', topics: ['nodejs', 'backend'] },
        { id: 'course3', title: 'Database Design', difficulty: 'beginner', topics: ['sql', 'database'] }
      ];

      mockPrisma.course.findMany.mockResolvedValue(availableCourses);

      const recommendations = await engine.generateRecommendations('user123');

      expect(recommendations).toMatchObject({
        courses: expect.arrayContaining([
          expect.objectContaining({
            courseId: expect.any(String),
            title: expect.any(String),
            relevanceScore: expect.any(Number),
            difficulty: expect.any(String)
          })
        ]),
        nextLessons: expect.any(Array),
        reviewTopics: expect.any(Array),
        studyPath: expect.objectContaining({
          estimatedCompletion: expect.any(Date),
          milestones: expect.any(Array)
        })
      });

      // Should prioritize courses based on knowledge gaps
      const nodeJSCourse = recommendations.courses.find(c => c.title.includes('Node.js'));
      expect(nodeJSCourse?.relevanceScore).toBeGreaterThan(0.7);
    });

    it('should consider learning style in recommendations', async () => {
      const visualProfile = {
        ...mockLearnerProfile,
        learningStyle: 'visual' as const
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(visualProfile);

      const recommendations = await engine.generateRecommendations('user123');

      // Visual learners should get content with more visual elements
      expect(recommendations.studyTips).toContain('visual');
    });

    it('should adapt to performance metrics', async () => {
      const strugglingProfile = {
        ...mockLearnerProfile,
        performanceMetrics: {
          averageScore: 0.45,
          completionRate: 0.60,
          retentionRate: 0.50,
          engagementLevel: 0.40
        }
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(strugglingProfile);

      const recommendations = await engine.generateRecommendations('user123');

      // Should recommend review and easier content
      expect(recommendations.reviewTopics.length).toBeGreaterThan(0);
      expect(recommendations.studyTips).toContain('review');
    });
  });

  describe('Content Adaptation', () => {
    it('should adapt content difficulty based on performance', async () => {
      const courseContent = {
        courseId: 'course123',
        currentDifficulty: 'intermediate' as ContentDifficulty,
        topics: ['functions', 'objects', 'async-programming']
      };

      const adaptedContent = await engine.adaptContent('user123', courseContent);

      expect(adaptedContent).toMatchObject({
        adjustedDifficulty: expect.any(String),
        recommendedPace: expect.any(String),
        additionalResources: expect.any(Array),
        prerequisites: expect.any(Array),
        estimatedTime: expect.any(Number)
      });

      // Should maintain or adjust difficulty based on profile
      expect(['beginner', 'intermediate', 'advanced']).toContain(
        adaptedContent.adjustedDifficulty
      );
    });

    it('should suggest prerequisites for knowledge gaps', async () => {
      const weakProfile = {
        ...mockLearnerProfile,
        knowledgeMap: {
          'javascript-basics': 0.4, // Low score
          'react-fundamentals': 0.2  // Very low score
        }
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(weakProfile);

      const courseContent = {
        courseId: 'advanced-react',
        currentDifficulty: 'advanced' as ContentDifficulty,
        topics: ['hooks', 'context', 'performance']
      };

      const adaptedContent = await engine.adaptContent('user123', courseContent);

      expect(adaptedContent.prerequisites).toContain('javascript-basics');
      expect(adaptedContent.adjustedDifficulty).toBe('beginner');
    });

    it('should recommend accelerated pace for strong performers', async () => {
      const strongProfile = {
        ...mockLearnerProfile,
        performanceMetrics: {
          averageScore: 0.95,
          completionRate: 0.98,
          retentionRate: 0.92,
          engagementLevel: 0.95
        }
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(strongProfile);

      const courseContent = {
        courseId: 'course123',
        currentDifficulty: 'intermediate' as ContentDifficulty,
        topics: ['react-basics']
      };

      const adaptedContent = await engine.adaptContent('user123', courseContent);

      expect(adaptedContent.recommendedPace).toBe('accelerated');
      expect(adaptedContent.adjustedDifficulty).toBe('advanced');
    });
  });

  describe('Knowledge Gap Analysis', () => {
    it('should identify knowledge gaps from assessment results', async () => {
      const assessmentResults = [
        {
          assessmentId: 'assessment1',
          score: 0.4,
          topics: ['javascript-basics', 'functions'],
          completedAt: new Date()
        },
        {
          assessmentId: 'assessment2',
          score: 0.8,
          topics: ['react-components'],
          completedAt: new Date()
        }
      ];

      mockPrisma.assessmentResult.findMany.mockResolvedValue(assessmentResults);

      const gaps = await engine.identifyKnowledgeGaps('user123');

      expect(gaps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            topic: 'javascript-basics',
            severity: expect.any(String),
            recommendedActions: expect.any(Array),
            estimatedStudyTime: expect.any(Number)
          })
        ])
      );

      // Should identify JavaScript basics as a gap due to low score
      const jsGap = gaps.find(gap => gap.topic === 'javascript-basics');
      expect(jsGap?.severity).toBe('high');
    });

    it('should prioritize gaps by impact and severity', async () => {
      const assessmentResults = [
        { topics: ['html'], score: 0.3 },
        { topics: ['javascript-basics'], score: 0.2 },
        { topics: ['advanced-css'], score: 0.4 }
      ];

      mockPrisma.assessmentResult.findMany.mockResolvedValue(assessmentResults);

      const gaps = await engine.identifyKnowledgeGaps('user123');

      // JavaScript basics should be prioritized due to foundational importance
      expect(gaps[0].topic).toBe('javascript-basics');
      expect(gaps[0].priority).toBe('high');
    });
  });

  describe('Optimal Difficulty Prediction', () => {
    it('should predict optimal difficulty for new content', async () => {
      const contentInfo = {
        topics: ['react-hooks', 'useEffect', 'useState'],
        estimatedComplexity: 0.7
      };

      const predictedDifficulty = await engine.predictOptimalDifficulty(
        'user123',
        contentInfo
      );

      expect(predictedDifficulty).toMatchObject({
        recommendedLevel: expect.any(String),
        confidence: expect.any(Number),
        reasoning: expect.any(Array),
        alternativeOptions: expect.any(Array)
      });

      expect(predictedDifficulty.confidence).toBeGreaterThan(0);
      expect(predictedDifficulty.confidence).toBeLessThanOrEqual(1);
    });

    it('should consider recent performance trends', async () => {
      const recentProgress = [
        { score: 0.9, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) }, // 1 day ago
        { score: 0.8, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 48) }, // 2 days ago
        { score: 0.7, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 72) }  // 3 days ago
      ];

      mockPrisma.progress.findMany.mockResolvedValue(recentProgress);

      const contentInfo = {
        topics: ['advanced-concepts'],
        estimatedComplexity: 0.8
      };

      const prediction = await engine.predictOptimalDifficulty('user123', contentInfo);

      // Improving performance should suggest higher difficulty
      expect(prediction.recommendedLevel).toBe('advanced');
      expect(prediction.reasoning).toContain('improving performance trend');
    });

    it('should account for knowledge prerequisites', async () => {
      const weakProfile = {
        ...mockLearnerProfile,
        knowledgeMap: {
          'javascript-basics': 0.3, // Weak foundation
          'react-basics': 0.5
        }
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(weakProfile);

      const contentInfo = {
        topics: ['advanced-react-patterns'],
        estimatedComplexity: 0.9,
        prerequisites: ['javascript-basics', 'react-basics']
      };

      const prediction = await engine.predictOptimalDifficulty('user123', contentInfo);

      // Should recommend lower difficulty due to weak prerequisites
      expect(prediction.recommendedLevel).toBe('beginner');
      expect(prediction.reasoning).toContain('prerequisite knowledge gaps');
    });
  });

  describe('Learning Path Generation', () => {
    it('should generate personalized learning path', async () => {
      const goal = {
        topic: 'Full-stack web development',
        targetLevel: 'advanced',
        timeframe: 90 // days
      };

      const learningPath = await engine.generateLearningPath('user123', goal);

      expect(learningPath).toMatchObject({
        pathId: expect.any(String),
        goal: expect.objectContaining(goal),
        phases: expect.any(Array),
        estimatedDuration: expect.any(Number),
        milestones: expect.any(Array),
        adaptationTriggers: expect.any(Array)
      });

      // Should have logical phase progression
      expect(learningPath.phases.length).toBeGreaterThan(0);
      expect(learningPath.phases[0].difficulty).toBe('beginner');
    });

    it('should adapt path based on existing knowledge', async () => {
      const strongJSProfile = {
        ...mockLearnerProfile,
        knowledgeMap: {
          'javascript-basics': 0.95,
          'javascript-advanced': 0.85,
          'react-basics': 0.30
        }
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(strongJSProfile);

      const goal = {
        topic: 'React development',
        targetLevel: 'advanced',
        timeframe: 60
      };

      const learningPath = await engine.generateLearningPath('user123', goal);

      // Should skip JavaScript basics and start with React
      expect(learningPath.phases[0].topics).not.toContain('javascript-basics');
      expect(learningPath.phases[0].topics).toContain('react-basics');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.learnerProfile.findFirst.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        engine.getLearnerProfile('user123')
      ).rejects.toThrow('Failed to get learner profile');
    });

    it('should handle invalid user IDs', async () => {
      await expect(
        engine.getLearnerProfile('')
      ).rejects.toThrow('User ID is required');

      await expect(
        engine.getLearnerProfile(null as any)
      ).rejects.toThrow('User ID is required');
    });

    it('should validate content adaptation parameters', async () => {
      const invalidContent = {
        courseId: '',
        currentDifficulty: 'invalid' as ContentDifficulty,
        topics: []
      };

      await expect(
        engine.adaptContent('user123', invalidContent)
      ).rejects.toThrow('Invalid content parameters');
    });

    it('should handle missing assessment data', async () => {
      mockPrisma.assessmentResult.findMany.mockResolvedValue([]);

      const gaps = await engine.identifyKnowledgeGaps('user123');

      // Should return empty array or general recommendations
      expect(gaps).toEqual([]);
    });
  });

  describe('Performance Optimization', () => {
    it('should cache learner profiles for repeated access', async () => {
      await engine.getLearnerProfile('user123');
      await engine.getLearnerProfile('user123');

      // Should only call database once due to caching
      expect(mockPrisma.learnerProfile.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should batch process multiple recommendations', async () => {
      const userIds = ['user1', 'user2', 'user3'];

      const recommendations = await engine.batchGenerateRecommendations(userIds);

      expect(recommendations).toHaveLength(3);
      expect(Object.keys(recommendations[0])).toContain('courses');
    });

    it('should handle large knowledge maps efficiently', async () => {
      const largeKnowledgeMap: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeKnowledgeMap[`topic_${i}`] = Math.random();
      }

      const largeProfile = {
        ...mockLearnerProfile,
        knowledgeMap: largeKnowledgeMap
      };
      mockPrisma.learnerProfile.findFirst.mockResolvedValue(largeProfile);

      const recommendations = await engine.generateRecommendations('user123');

      expect(recommendations.courses).toBeDefined();
      expect(recommendations.nextLessons).toBeDefined();
    });
  });
});