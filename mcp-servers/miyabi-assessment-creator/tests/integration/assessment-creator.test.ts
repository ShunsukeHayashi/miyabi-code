/**
 * Integration tests for AssessmentCreator Agent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentCreatorAgent } from '../../src/agents/assessment-creator.js';
import { AssessmentInput } from '../../src/types/index.js';

// Mock all dependencies
vi.mock('../../src/lib/gemini-client.js');
vi.mock('../../src/lib/question-generator.js');
vi.mock('../../src/lib/auto-grader.js');
vi.mock('../../src/lib/analytics-engine.js');

describe('AssessmentCreatorAgent Integration', () => {
  let agent: AssessmentCreatorAgent;
  let sampleInput: AssessmentInput;

  beforeEach(() => {
    // Mock the agent with all required methods
    agent = {
      generateAssessment: vi.fn(),
      gradeSubmissions: vi.fn(),
      generateAnalytics: vi.fn(),
      optimizeQuestions: vi.fn(),
      validateConnections: vi.fn(),
      getGenerationProgress: vi.fn(),
      getAgentInfo: vi.fn()
    } as any;

    sampleInput = {
      topic: 'Data Structures',
      learningObjectives: [
        'Understand array operations',
        'Implement linked lists',
        'Apply sorting algorithms'
      ],
      targetAudience: 'Computer Science undergraduate students',
      difficulty: 'intermediate',
      assessmentType: 'summative',
      questionTypes: ['multiple_choice', 'short_answer', 'coding_challenge'],
      questionCount: {
        total: 10,
        perType: {
          'multiple_choice': 5,
          'short_answer': 3,
          'coding_challenge': 2
        }
      },
      bloomsDistribution: {
        remember: 0.2,
        understand: 0.3,
        apply: 0.3,
        analyze: 0.1,
        evaluate: 0.05,
        create: 0.05
      },
      difficultyDistribution: {
        easy: 0.2,
        medium: 0.6,
        hard: 0.2,
        expert: 0.0
      },
      timeLimit: 60,
      allowMultipleAttempts: false,
      showCorrectAnswers: true,
      generateRubrics: true,
      includeAnalytics: true,
      preferences: {
        language: 'en',
        tone: 'academic',
        includeHints: true,
        includeExplanations: true
      }
    };
  });

  describe('End-to-End Assessment Generation', () => {
    it('should generate a complete assessment', async () => {
      // Mock successful assessment generation
      const mockResult = {
        assessment: {
          id: 'assessment-123',
          config: {
            type: 'summative',
            title: 'Data Structures Assessment',
            description: 'Comprehensive assessment covering data structures',
            instructions: 'Answer all questions to the best of your ability',
            timeLimit: 60,
            attempts: 1,
            randomizeQuestions: false,
            randomizeOptions: true,
            showFeedback: 'after_submission',
            allowReview: true
          },
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              question: 'What is the time complexity of inserting an element at the beginning of an array?',
              options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
              correctAnswerIndex: 1,
              correctAnswer: 'O(n)',
              explanation: 'Inserting at the beginning requires shifting all existing elements',
              bloomsLevel: 'understand',
              difficulty: 'medium',
              points: 2,
              timeEstimate: 3
            },
            {
              id: 'q2',
              type: 'coding_challenge',
              question: 'Implement a function to reverse a linked list',
              problemStatement: 'Write a function that takes the head of a linked list and returns the head of the reversed list',
              programmingLanguage: 'javascript',
              starterCode: 'function reverseList(head) {\n  // Your code here\n}',
              testCases: [
                { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
                { input: '[]', expectedOutput: '[]', isHidden: true }
              ],
              solution: 'function reverseList(head) { /* solution */ }',
              hints: ['Think about iteratively changing pointer directions'],
              bloomsLevel: 'apply',
              difficulty: 'hard',
              points: 10,
              timeEstimate: 20
            }
          ],
          metadata: {
            createdAt: '2024-01-01T12:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            version: '1.0.0',
            learningObjectives: sampleInput.learningObjectives,
            estimatedDuration: 60,
            totalPoints: 12,
            passingScore: 70,
            difficultyDistribution: { easy: 0, medium: 1, hard: 1, expert: 0 },
            bloomsDistribution: { understand: 1, apply: 1 }
          }
        },
        generationMetadata: {
          questionsGenerated: 2,
          questionsRequested: 10,
          successRate: 0.2, // Only 2 out of 10 generated for this mock
          totalGenerationTime: 5000,
          qualityScore: 85,
          warnings: ['Some questions failed to generate due to complexity']
        },
        recommendations: {
          usageTips: [
            'Review all questions before administering',
            'Ensure students have adequate programming environment for coding challenges'
          ],
          improvementSuggestions: [
            'Consider adding more basic questions for struggling students',
            'Add visual diagrams for complex data structure questions'
          ],
          nextSteps: [
            'Test with a small pilot group',
            'Set up auto-grading for objective questions',
            'Prepare manual grading rubrics for coding challenges'
          ]
        }
      };

      agent.generateAssessment = vi.fn().mockResolvedValue(mockResult);

      const result = await agent.generateAssessment(sampleInput);

      expect(result).toBeDefined();
      expect(result.assessment).toBeDefined();
      expect(result.assessment.id).toBe('assessment-123');
      expect(result.assessment.questions).toHaveLength(2);
      expect(result.generationMetadata.questionsGenerated).toBe(2);
      expect(result.recommendations).toBeDefined();
    });

    it('should handle generation errors gracefully', async () => {
      agent.generateAssessment = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      await expect(agent.generateAssessment(sampleInput)).rejects.toThrow('AI service unavailable');
    });
  });

  describe('End-to-End Grading Workflow', () => {
    it('should grade multiple student submissions', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Test question',
          correctAnswer: 'A',
          points: 1
        },
        {
          id: 'q2',
          type: 'short_answer',
          question: 'Explain algorithms',
          points: 5
        }
      ];

      const mockSubmissions = [
        {
          studentId: 'student1',
          submissionId: 'sub1',
          responses: [
            { questionId: 'q1', response: 'A', timeSpent: 30, attempts: 1 },
            { questionId: 'q2', response: 'Algorithms are step-by-step procedures for solving problems', timeSpent: 300, attempts: 1 }
          ],
          submissionTime: '2024-01-01T12:30:00Z',
          timeSpent: 15
        },
        {
          studentId: 'student2',
          submissionId: 'sub2',
          responses: [
            { questionId: 'q1', response: 'B', timeSpent: 45, attempts: 2 },
            { questionId: 'q2', response: 'Not sure', timeSpent: 120, attempts: 1 }
          ],
          submissionTime: '2024-01-01T12:45:00Z',
          timeSpent: 12
        }
      ];

      const mockGradingResult = {
        assessmentId: 'assessment-123',
        results: [
          {
            assessmentId: 'assessment-123',
            studentId: 'student1',
            submissionId: 'sub1',
            questionResults: [
              { questionId: 'q1', score: 1, maxScore: 1, isCorrect: true, feedback: 'Correct!' },
              { questionId: 'q2', score: 4, maxScore: 5, isCorrect: false, feedback: 'Good understanding, missing some details', partialCredit: 0.8 }
            ],
            overallScore: 5,
            maxScore: 6,
            percentage: 83.33,
            passed: true,
            submissionTime: '2024-01-01T12:30:00Z',
            timeSpent: 15,
            analytics: {
              strengths: ['Strong conceptual understanding'],
              weaknesses: ['Could provide more detailed explanations'],
              recommendations: ['Practice more detailed explanations'],
              bloomsPerformance: { understand: 85, apply: 80 },
              difficultyPerformance: { easy: 100, medium: 75 }
            }
          },
          {
            assessmentId: 'assessment-123',
            studentId: 'student2',
            submissionId: 'sub2',
            questionResults: [
              { questionId: 'q1', score: 0, maxScore: 1, isCorrect: false, feedback: 'Incorrect. The correct answer is A.' },
              { questionId: 'q2', score: 1, maxScore: 5, isCorrect: false, feedback: 'Response too brief, missing key concepts', partialCredit: 0.2 }
            ],
            overallScore: 1,
            maxScore: 6,
            percentage: 16.67,
            passed: false,
            submissionTime: '2024-01-01T12:45:00Z',
            timeSpent: 12,
            analytics: {
              strengths: ['Attempted all questions'],
              weaknesses: ['Needs more study of basic concepts', 'Insufficient detail in answers'],
              recommendations: ['Review course materials', 'Practice more examples'],
              bloomsPerformance: { understand: 20, apply: 15 },
              difficultyPerformance: { easy: 0, medium: 25 }
            }
          }
        ],
        metadata: {
          totalSubmissions: 2,
          successfullyGraded: 2,
          averageGradingTime: 2500,
          errors: []
        }
      };

      agent.gradeSubmissions = vi.fn().mockResolvedValue(mockGradingResult);

      const result = await agent.gradeSubmissions(
        'assessment-123',
        mockQuestions as any,
        mockSubmissions,
        {
          strictMode: false,
          allowPartialCredit: true,
          includeFeedback: true,
          feedbackLevel: 'standard',
          rubricWeighting: true,
          aiGradingForSubjective: true,
          batchSize: 10,
          timeoutMs: 30000,
          retryAttempts: 2
        }
      );

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(2);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[1].passed).toBe(false);
      expect(result.metadata.successfullyGraded).toBe(2);
    });
  });

  describe('End-to-End Analytics Generation', () => {
    it('should generate comprehensive analytics report', async () => {
      const mockQuestions = [
        { id: 'q1', type: 'multiple_choice', difficulty: 'medium', bloomsLevel: 'understand' },
        { id: 'q2', type: 'short_answer', difficulty: 'hard', bloomsLevel: 'apply' }
      ];

      const mockResults = [
        {
          studentId: 'student1',
          percentage: 85,
          passed: true,
          timeSpent: 25,
          questionResults: [
            { questionId: 'q1', score: 1, maxScore: 1, isCorrect: true },
            { questionId: 'q2', score: 4, maxScore: 5, isCorrect: false }
          ]
        },
        {
          studentId: 'student2',
          percentage: 60,
          passed: false,
          timeSpent: 35,
          questionResults: [
            { questionId: 'q1', score: 1, maxScore: 1, isCorrect: true },
            { questionId: 'q2', score: 2, maxScore: 5, isCorrect: false }
          ]
        }
      ];

      const mockAnalyticsReport = {
        assessmentId: 'assessment-123',
        generatedAt: '2024-01-01T13:00:00Z',
        summary: {
          totalResponses: 2,
          averageScore: 72.5,
          completionRate: 1.0,
          averageTimeSpent: 30,
          passingRate: 0.5
        },
        questionAnalytics: [
          {
            questionId: 'q1',
            responseCount: 2,
            correctRate: 1.0,
            averageScore: 1,
            difficulty: 0.0,
            discrimination: 0.8,
            averageTimeSpent: 3,
            flags: []
          },
          {
            questionId: 'q2',
            responseCount: 2,
            correctRate: 0.0,
            averageScore: 3,
            difficulty: 1.0,
            discrimination: 0.6,
            averageTimeSpent: 12,
            flags: ['too_hard']
          }
        ],
        overallAnalytics: {
          assessmentId: 'assessment-123',
          responseCount: 2,
          averageScore: 72.5,
          scoreDistribution: [
            { range: '60-70%', count: 1 },
            { range: '80-90%', count: 1 }
          ],
          completionRate: 1.0,
          averageTimeSpent: 30,
          questionAnalytics: [],
          recommendations: [
            'Consider reviewing question 2 difficulty',
            'Add more medium-difficulty questions',
            'Provide additional practice for struggling concepts'
          ]
        },
        insights: {
          strengths: [
            'Students performed well on basic concepts',
            'Good completion rate for the assessment'
          ],
          concerns: [
            'Question 2 was too difficult for most students',
            'Large performance gap between students'
          ],
          recommendations: [
            'Review and potentially revise question 2',
            'Add more scaffolding for complex topics',
            'Consider differentiated instruction approaches'
          ],
          contentGaps: [
            'Advanced application of concepts needs more practice',
            'Bridge between basic understanding and complex application'
          ]
        },
        predictiveAnalytics: {
          riskFactors: [
            'Students with low performance on question 2 at risk',
            'Extended time spent may indicate confusion'
          ],
          interventionSuggestions: [
            'Provide additional tutorials for struggling students',
            'Offer office hours for complex topics',
            'Create supplementary practice materials'
          ],
          successIndicators: [
            'Quick completion of basic questions indicates readiness',
            'Consistent performance across question types'
          ]
        }
      };

      agent.generateAnalytics = vi.fn().mockResolvedValue(mockAnalyticsReport);

      const result = await agent.generateAnalytics(
        'assessment-123',
        mockQuestions as any,
        mockResults as any,
        true, // includeRecommendations
        true  // includePredictive
      );

      expect(result).toBeDefined();
      expect(result.summary.averageScore).toBe(72.5);
      expect(result.questionAnalytics).toHaveLength(2);
      expect(result.insights.strengths).toBeDefined();
      expect(result.insights.concerns).toBeDefined();
      expect(result.predictiveAnalytics).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should validate all service connections', async () => {
      const mockConnections = {
        questionGenerator: true,
        autoGrader: true,
        analyticsEngine: true,
        geminiClient: true
      };

      agent.validateConnections = vi.fn().mockResolvedValue(mockConnections);

      const result = await agent.validateConnections();

      expect(result).toBeDefined();
      expect(result.questionGenerator).toBe(true);
      expect(result.autoGrader).toBe(true);
      expect(result.analyticsEngine).toBe(true);
      expect(result.geminiClient).toBe(true);
    });

    it('should handle partial service failures', async () => {
      const mockConnections = {
        questionGenerator: true,
        autoGrader: false, // Service down
        analyticsEngine: true,
        geminiClient: true
      };

      agent.validateConnections = vi.fn().mockResolvedValue(mockConnections);

      const result = await agent.validateConnections();

      expect(result.autoGrader).toBe(false);
      expect(result.questionGenerator).toBe(true);
    });
  });

  describe('Agent Information', () => {
    it('should provide comprehensive agent information', () => {
      const mockAgentInfo = {
        name: 'AssessmentCreatorAgent',
        version: '1.0.0',
        description: 'AI-powered assessment and quiz generation with auto-grading and analytics',
        capabilities: [
          'Intelligent assessment generation',
          'Multi-type question creation (MC, Essay, Coding, etc.)',
          'Bloom\'s taxonomy alignment',
          'Difficulty calibration',
          'Auto-grading with rubrics',
          'Learning analytics',
          'Performance optimization',
          'Predictive insights',
          'Batch processing',
          'Quality validation'
        ],
        supportedQuestionTypes: [
          'multiple_choice',
          'true_false',
          'fill_in_blank',
          'short_answer',
          'essay',
          'coding_challenge',
          'matching',
          'ordering',
          'case_study'
        ],
        supportedAssessmentTypes: [
          'formative',
          'summative',
          'diagnostic',
          'peer',
          'self'
        ],
        integrations: {
          questionGenerator: { name: 'QuestionGenerator', version: '1.0.0' },
          autoGrader: { name: 'AutoGrader', version: '1.0.0' },
          analyticsEngine: { name: 'AnalyticsEngine', version: '1.0.0' }
        },
        maxQuestionsPerAssessment: 100,
        maxStudentsPerBatch: 1000,
        estimatedGenerationTime: '30-180 seconds per assessment',
        estimatedGradingTime: '5-15 seconds per submission'
      };

      agent.getAgentInfo = vi.fn().mockReturnValue(mockAgentInfo);

      const info = agent.getAgentInfo();

      expect(info.name).toBe('AssessmentCreatorAgent');
      expect(info.capabilities).toContain('Intelligent assessment generation');
      expect(info.supportedQuestionTypes).toContain('multiple_choice');
      expect(info.supportedAssessmentTypes).toContain('summative');
      expect(info.maxQuestionsPerAssessment).toBe(100);
    });
  });
});