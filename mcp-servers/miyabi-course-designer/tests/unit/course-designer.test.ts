/**
 * Unit tests for CourseDesignerAgent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock GeminiClient with all required methods
vi.mock('../../src/lib/gemini-client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    generateContent: vi.fn().mockResolvedValue('mock content'),
    generateStructuredContent: vi.fn(),
    validateConnection: vi.fn().mockResolvedValue(true),
    getModelInfo: vi.fn().mockReturnValue({
      model: 'gemini-2.0-flash-exp',
      config: { temperature: 0.7 }
    }),
    estimateTokens: vi.fn().mockResolvedValue(100),
    generateBatchContent: vi.fn().mockResolvedValue({}),
    updateConfig: vi.fn()
  }))
}));

import { CourseDesignerAgent } from '../../src/agents/course-designer.js';
import { CourseInput } from '../../src/types/index.js';

describe('CourseDesignerAgent', () => {
  let agent: CourseDesignerAgent;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new CourseDesignerAgent(mockApiKey);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize successfully', () => {
      expect(agent).toBeInstanceOf(CourseDesignerAgent);
    });
  });

  describe('generateCourse', () => {
    const mockInput: CourseInput = {
      topic: 'Introduction to JavaScript',
      targetAudience: 'Complete beginners to programming',
      difficulty: 'beginner',
      duration: { weeks: 8, hoursPerWeek: 3 },
      learningObjectives: [
        'Understand JavaScript fundamentals',
        'Build interactive web applications'
      ],
      format: {
        includeVideos: true,
        includeAssessments: true,
        includeProjects: true,
        includeDiscussions: false
      },
      preferences: {
        language: 'en',
        tone: 'conversational',
        interactivity: 'medium'
      }
    };

    const mockCourseStructure = {
      title: 'Introduction to JavaScript',
      description: 'A comprehensive course for beginners',
      duration: { weeks: 8, totalHours: 24 },
      modules: [
        {
          id: 'module-1',
          title: 'JavaScript Basics',
          description: 'Learn the fundamentals',
          learningObjectives: ['Understand variables and data types'],
          estimatedHours: 6,
          lessons: [
            {
              id: 'module-1-lesson-1',
              title: 'Variables and Data Types',
              type: 'video' as const,
              content: 'Introduction to JavaScript variables',
              duration: 30,
              resources: []
            }
          ]
        }
      ]
    };

    const mockContent = {
      videoScripts: [{
        lessonId: 'module-1-lesson-1',
        title: 'Variables and Data Types',
        script: 'Welcome to JavaScript programming...',
        visualCues: ['Show code editor'],
        duration: 30
      }],
      textContent: [],
      exercises: [{
        lessonId: 'module-1-lesson-1',
        type: 'practice' as const,
        title: 'Practice Variables',
        instructions: 'Create variables of different types',
        expectedOutput: 'Working variable declarations',
        rubric: 'Check syntax and proper naming'
      }]
    };

    const mockAssessments = [{
      moduleId: 'module-1',
      type: 'quiz' as const,
      title: 'JavaScript Basics Quiz',
      description: 'Test your understanding',
      questions: [{
        id: 'q1',
        type: 'multiple_choice' as const,
        question: 'What is a variable?',
        options: ['A container for data', 'A function', 'A loop', 'An object'],
        correctAnswer: 'A container for data',
        explanation: 'Variables store data values',
        difficulty: 'easy' as const
      }],
      passingScore: 80
    }];

    const mockAnalysis = {
      contentQualityScore: 85,
      estimatedCompletionRate: 75,
      recommendations: {
        contentImprovements: ['Add more examples'],
        engagementOptimizations: ['Include interactive demos'],
        learningPathSuggestions: ['Consider prerequisite course'],
        nextSteps: ['Create follow-up course']
      }
    };

    beforeEach(() => {
      // Mock the generateStructuredContent calls
      const mockClient = (agent as any).geminiClient;

      // Reset mocks and set up new expectations
      vi.clearAllMocks();

      mockClient.generateStructuredContent = vi.fn()
        .mockResolvedValueOnce(mockCourseStructure) // Course structure
        .mockResolvedValueOnce({ lessonId: 'module-1-lesson-1', title: 'Variables and Data Types', script: 'Welcome...', duration: 30 }) // Video script
        .mockResolvedValueOnce({ exercises: [mockContent.exercises[0]] }) // Exercises
        .mockResolvedValueOnce(mockAssessments[0]) // Assessment
        .mockResolvedValueOnce(mockAnalysis); // Analysis

      mockClient.generateContent = vi.fn()
        .mockResolvedValue('Generated lesson content about JavaScript variables and data types...');
    });

    it('should generate a complete course successfully', async () => {
      const result = await agent.generateCourse(mockInput);

      expect(result).toMatchObject({
        courseStructure: mockCourseStructure,
        content: expect.objectContaining({
          videoScripts: expect.arrayContaining([
            expect.objectContaining({
              lessonId: 'module-1-lesson-1'
            })
          ]),
          exercises: expect.arrayContaining([
            expect.objectContaining({
              lessonId: 'module-1-lesson-1'
            })
          ])
        }),
        metadata: expect.objectContaining({
          contentQualityScore: 85,
          estimatedCompletionRate: 75,
          scormCompatible: true,
          accessibilityCompliant: true
        }),
        recommendations: mockAnalysis.recommendations
      });
    });

    it('should handle input without optional fields', async () => {
      const minimalInput: CourseInput = {
        topic: 'Basic Math',
        targetAudience: 'Elementary students'
      };

      const result = await agent.generateCourse(minimalInput);

      expect(result).toBeDefined();
      expect(result.courseStructure.title).toBeDefined();
    });

    it('should throw error for invalid input', async () => {
      const invalidInput = {
        // Missing required fields
        topic: '',
        targetAudience: ''
      } as CourseInput;

      await expect(agent.generateCourse(invalidInput))
        .rejects.toThrow();
    });

    it('should handle generation errors gracefully', async () => {
      const mockClient = (agent as any).geminiClient;

      // Reset all mocks first and setup the failing mock
      mockClient.generateStructuredContent = vi.fn()
        .mockRejectedValue(new Error('API Error'));

      await expect(agent.generateCourse(mockInput))
        .rejects.toThrow('Course generation failed: API Error');
    });

    it('should track generation progress', async () => {
      // Start generation in background
      const generationPromise = agent.generateCourse(mockInput);

      // Check initial progress
      let progress = agent.getGenerationProgress();
      expect(progress).toBeDefined();
      expect(progress?.steps).toHaveLength(4);

      // Wait for completion
      await generationPromise;

      // Check final progress
      progress = agent.getGenerationProgress();
      expect(progress?.overallProgress).toBe(100);
    });
  });

  describe('validateConnection', () => {
    it('should validate API connection', async () => {
      const result = await agent.validateConnection();
      expect(result).toBe(true);
    });

    it('should handle connection failures', async () => {
      const mockClient = (agent as any).geminiClient;
      mockClient.validateConnection = vi.fn().mockResolvedValue(false);

      const result = await agent.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('getAgentInfo', () => {
    it('should return agent information', () => {
      const info = agent.getAgentInfo();

      expect(info).toMatchObject({
        name: 'CourseDesignerAgent',
        version: '1.0.0',
        description: expect.stringContaining('AI-powered'),
        capabilities: expect.arrayContaining([
          'Intelligent course structure generation',
          'Multi-modal content creation (text, video scripts, exercises)',
          'Assessment and quiz generation'
        ]),
        supportedLanguages: expect.arrayContaining(['en', 'ja', 'es'])
      });
    });
  });

  describe('getGenerationProgress', () => {
    it('should return null when no generation is running', () => {
      const progress = agent.getGenerationProgress();
      expect(progress).toBeNull();
    });
  });

  describe('buildGenerationContext', () => {
    it('should build context from input correctly', () => {
      const input: CourseInput = {
        topic: 'React Development',
        targetAudience: 'Frontend developers',
        difficulty: 'intermediate',
        preferences: {
          language: 'en',
          tone: 'casual'
        },
        format: {
          includeVideos: true,
          includeAssessments: false,
          includeProjects: true,
          includeDiscussions: true
        }
      };

      const context = (agent as any).buildGenerationContext(input);

      expect(context).toEqual({
        topic: 'React Development',
        targetAudience: 'Frontend developers',
        difficulty: 'intermediate',
        language: 'en',
        tone: 'casual',
        includeVideos: true,
        includeAssessments: false,
        includeProjects: true,
        includeDiscussions: true
      });
    });

    it('should use default values for missing preferences', () => {
      const input: CourseInput = {
        topic: 'Python Basics',
        targetAudience: 'Beginners'
      };

      const context = (agent as any).buildGenerationContext(input);

      expect(context).toEqual({
        topic: 'Python Basics',
        targetAudience: 'Beginners',
        difficulty: 'beginner',
        language: 'en',
        tone: 'conversational',
        includeVideos: true,
        includeAssessments: true,
        includeProjects: true,
        includeDiscussions: true
      });
    });
  });

  describe('generateTags', () => {
    it('should generate appropriate tags', () => {
      const input: CourseInput = {
        topic: 'Advanced JavaScript Programming',
        targetAudience: 'Experienced Developers',
        difficulty: 'advanced',
        preferences: {
          language: 'ja'
        }
      };

      const tags = (agent as any).generateTags(input);

      expect(tags).toContain('advanced-javascript-programming');
      expect(tags).toContain('advanced');
      expect(tags).toContain('experienced-developers');
      expect(tags).toContain('lang-ja');
      expect(tags).toContain('ai-generated');
      expect(tags).toContain('miyabi-course-designer');
    });

    it('should not include language tag for English', () => {
      const input: CourseInput = {
        topic: 'Web Development',
        targetAudience: 'Beginners',
        preferences: {
          language: 'en'
        }
      };

      const tags = (agent as any).generateTags(input);

      expect(tags).not.toContain('lang-en');
    });
  });
});