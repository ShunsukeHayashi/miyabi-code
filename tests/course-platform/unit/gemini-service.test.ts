/**
 * Unit Tests for Gemini AI Service
 * Tests AI-powered content generation and analysis features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from '@/lib/ai/gemini-service';
import type { CourseContentSuggestion, LessonContent, ContentAnalysis } from '@/lib/ai/gemini-service';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
      startChat: vi.fn()
    })
  }))
}));

describe('Gemini AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('generateCourseSuggestions', () => {
    it('should generate course suggestions for a topic', async () => {
      // Mock Gemini response
      const mockResponse = {
        response: {
          text: () => JSON.stringify([
            {
              title: 'Introduction to JavaScript',
              description: 'Learn the fundamentals of JavaScript programming',
              outline: ['Variables and Data Types', 'Functions', 'Objects and Arrays'],
              estimatedDuration: 40,
              difficulty: 'beginner',
              prerequisites: ['Basic HTML knowledge']
            },
            {
              title: 'Advanced JavaScript Concepts',
              description: 'Master advanced JavaScript concepts and patterns',
              outline: ['Closures', 'Promises', 'Async/Await', 'Modules'],
              estimatedDuration: 60,
              difficulty: 'advanced',
              prerequisites: ['JavaScript Basics', 'DOM Manipulation']
            }
          ])
        }
      };

      // Mock the model's generateContent method
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const suggestions = await geminiService.generateCourseSuggestions('JavaScript', 'Beginners');

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toMatchObject({
        title: 'Introduction to JavaScript',
        difficulty: 'beginner',
        estimatedDuration: 40
      });
      expect(suggestions[1]).toMatchObject({
        title: 'Advanced JavaScript Concepts',
        difficulty: 'advanced',
        estimatedDuration: 60
      });

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('JavaScript')
      );
    });

    it('should handle invalid JSON response gracefully', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON response'
        }
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await expect(
        geminiService.generateCourseSuggestions('JavaScript')
      ).rejects.toThrow('Failed to generate course suggestions');
    });

    it('should handle API errors gracefully', async () => {
      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await expect(
        geminiService.generateCourseSuggestions('JavaScript')
      ).rejects.toThrow('Failed to generate course suggestions');
    });
  });

  describe('generateLessonContent', () => {
    it('should generate detailed lesson content', async () => {
      const mockLessonContent: LessonContent = {
        title: 'Variables and Data Types in JavaScript',
        content: 'In this lesson, we will explore JavaScript variables...',
        objectives: [
          'Understand variable declaration',
          'Learn about data types',
          'Practice variable assignment'
        ],
        activities: [
          'Create variables of different types',
          'Complete coding exercises'
        ],
        assessmentQuestions: [
          'What is the difference between let and var?',
          'How do you declare a constant in JavaScript?'
        ]
      };

      const mockResponse = {
        response: {
          text: () => JSON.stringify(mockLessonContent)
        }
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const lessonContent = await geminiService.generateLessonContent(
        'JavaScript Fundamentals',
        'Variables and Data Types',
        'beginner',
        30
      );

      expect(lessonContent).toMatchObject({
        title: 'Variables and Data Types in JavaScript',
        content: expect.stringContaining('variables')
      });
      expect(lessonContent.objectives).toHaveLength(3);
      expect(lessonContent.activities).toHaveLength(2);
      expect(lessonContent.assessmentQuestions).toHaveLength(2);
    });

    it('should include course context in the generated content', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              title: 'Test Lesson',
              content: 'Content',
              objectives: [],
              activities: [],
              assessmentQuestions: []
            })
          }
        })
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await geminiService.generateLessonContent(
        'Advanced React Course',
        'React Hooks',
        'intermediate',
        45
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Advanced React Course')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('React Hooks')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('intermediate')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('45')
      );
    });
  });

  describe('analyzeContent', () => {
    it('should analyze content quality and provide suggestions', async () => {
      const mockAnalysis: ContentAnalysis = {
        readabilityScore: 78,
        difficulty: 'intermediate',
        suggestedImprovements: [
          'Add more examples',
          'Simplify complex sentences'
        ],
        missingTopics: [
          'Error handling',
          'Best practices'
        ],
        engagementTips: [
          'Add interactive exercises',
          'Include visual diagrams'
        ]
      };

      const mockResponse = {
        response: {
          text: () => JSON.stringify(mockAnalysis)
        }
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const analysis = await geminiService.analyzeContent(
        'This is sample course content about JavaScript functions.',
        'beginner'
      );

      expect(analysis.readabilityScore).toBe(78);
      expect(analysis.difficulty).toBe('intermediate');
      expect(analysis.suggestedImprovements).toHaveLength(2);
      expect(analysis.missingTopics).toHaveLength(2);
      expect(analysis.engagementTips).toHaveLength(2);
    });

    it('should handle different target levels', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              readabilityScore: 85,
              difficulty: 'beginner',
              suggestedImprovements: [],
              missingTopics: [],
              engagementTips: []
            })
          }
        })
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await geminiService.analyzeContent('Simple content', 'advanced');

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('advanced')
      );
    });
  });

  describe('generateAssessment', () => {
    it('should generate assessment questions from content', async () => {
      const mockAssessment = {
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is a JavaScript function?',
            options: ['A variable', 'A block of code', 'A data type', 'An operator'],
            correctAnswer: 1,
            explanation: 'A function is a reusable block of code',
            difficulty: 'easy'
          },
          {
            type: 'short_answer',
            question: 'How do you declare a function in JavaScript?',
            correctAnswer: 'function functionName() {}',
            explanation: 'Functions are declared using the function keyword',
            difficulty: 'medium'
          }
        ]
      };

      const mockResponse = {
        response: {
          text: () => JSON.stringify(mockAssessment)
        }
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const assessment = await geminiService.generateAssessment(
        'JavaScript functions are reusable blocks of code...',
        3,
        ['multiple_choice', 'short_answer']
      );

      expect(assessment.questions).toHaveLength(2);
      expect(assessment.questions[0].type).toBe('multiple_choice');
      expect(assessment.questions[0].options).toHaveLength(4);
      expect(assessment.questions[1].type).toBe('short_answer');
    });

    it('should respect question count parameter', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ questions: [] })
          }
        })
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await geminiService.generateAssessment('Content', 5, ['multiple_choice']);

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('5')
      );
    });

    it('should respect question types parameter', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ questions: [] })
          }
        })
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await geminiService.generateAssessment(
        'Content',
        3,
        ['true_false', 'essay']
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('true_false, essay')
      );
    });
  });

  describe('chatAssistant', () => {
    it('should handle chat conversations', async () => {
      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'This is a helpful response about course creation.'
          }
        })
      };

      const mockModel = {
        startChat: vi.fn().mockReturnValue(mockChat)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const messages = [
        {
          role: 'user' as const,
          parts: [{ text: 'How do I create an effective course?' }]
        },
        {
          role: 'model' as const,
          parts: [{ text: 'To create an effective course...' }]
        },
        {
          role: 'user' as const,
          parts: [{ text: 'What about assessments?' }]
        }
      ];

      const response = await geminiService.chatAssistant(messages);

      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: messages.slice(0, -1)
      });
      expect(mockChat.sendMessage).toHaveBeenCalledWith('What about assessments?');
      expect(response).toBe('This is a helpful response about course creation.');
    });

    it('should handle empty message history', async () => {
      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Hello! How can I help you with course creation?'
          }
        })
      };

      const mockModel = {
        startChat: vi.fn().mockReturnValue(mockChat)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      const messages = [
        {
          role: 'user' as const,
          parts: [{ text: 'Hello!' }]
        }
      ];

      await geminiService.chatAssistant(messages);

      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: []
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when GEMINI_API_KEY is missing', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => {
        new (geminiService.constructor as any)();
      }).toThrow('GEMINI_API_KEY environment variable is required');
    });

    it('should handle network errors gracefully', async () => {
      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(new Error('Network error'))
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await expect(
        geminiService.generateCourseSuggestions('JavaScript')
      ).rejects.toThrow('Failed to generate course suggestions');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        response: {
          text: () => '{ invalid json'
        }
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse)
      };

      vi.mocked(geminiService['model'] as any) = mockModel;

      await expect(
        geminiService.generateLessonContent('Course', 'Lesson', 'beginner', 30)
      ).rejects.toThrow('Failed to generate lesson content');
    });
  });
});